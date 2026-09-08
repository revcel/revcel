import Foundation
import SwiftUI

enum Granularity {
  case fiveMinutes
  case oneHour
}

enum RoundMode {
  case up
  case down
}

func roundToGranularity(date: Date, granularity: Granularity, mode: RoundMode = .up) -> Date {
  let granularityMs: Int
  
  switch granularity {
  case .fiveMinutes:
    granularityMs = 5 * 60 * 1000
  case .oneHour:
    granularityMs = 60 * 60 * 1000
  }
  
  let timeMs = Int(date.timeIntervalSince1970 * 1000)
  let rounded = (timeMs / granularityMs) * granularityMs
  
  let resultMs = (mode == .up) ? rounded : (rounded - granularityMs)
  let resultTime = TimeInterval(resultMs) / 1000.0
  
  return Date(timeIntervalSince1970: resultTime)
}

func readIsSubscribed() -> Bool {
  UserDefaults(suiteName: appGroupName)?.bool(forKey: isSubscribedKey) ?? false
}

private let isoFormatter = ISO8601DateFormatter()
private let isoFractionalFormatter: ISO8601DateFormatter = {
  let formatter = ISO8601DateFormatter()
  formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
  return formatter
}()

func parseISODate(_ value: String) -> Date? {
  isoFormatter.date(from: value) ?? isoFractionalFormatter.date(from: value)
}

func getAppUrl(project: ProjectListItem?) -> String {
  guard let project = project else {
    return "revcel://"
  }
  
  if let sharedDefaults = UserDefaults(suiteName: appGroupName) {
    let isSubscribed = sharedDefaults.bool(forKey: isSubscribedKey)
    
    if isSubscribed {
      // Pass connectionId + teamId so the app re-syncs the active connection/team to THIS project's
      // owner before the tabs load. A widget can point at a project in a team that isn't currently
      // selected; without these params the app stays on the wrong team and the project's API calls
      // 403 (e.g. logs -> "Failed to fetch logs", home -> "Missing project"). The home tab consumes
      // these in its switchConnection effect. Mirrors the push-notification deep link (lib/hooks.ts).
      // connection.id == the persisted connection id (the user uid) that switchConnection expects.
      return "revcel://projects/\(project.id)/(tabs)/home?connectionId=\(project.connection.id)&teamId=\(project.connectionTeam.id)"
    }
  }

  return "revcel://?showPaywall=1"
}

func formatNumber(_ number: Int) -> String {
  if number < 1000 {
    return String(number)
  }
  if number < 1_000_000 {
    let value = Double(number) / 1000.0
    return String(format: "%.1fK", value)
  }
  let value = Double(number) / 1_000_000.0
  return String(format: "%.1fM", value)
}

struct ProjectFavicon: View {
  let faviconPath: String?
  let imageSize: CGFloat
  
  init(faviconPath: String?, imageSize: CGFloat = 42.0) {
    self.faviconPath = faviconPath
    self.imageSize = imageSize
  }
  
  var body: some View {
    if let path = faviconPath, let uiImage = UIImage(contentsOfFile: path) {
      Image(uiImage: uiImage)
        .resizable()
        .aspectRatio(contentMode: .fit)
        .frame(width: imageSize, height: imageSize)
        .clipShape(Circle())
    } else {
      Image("AppIconImage")
        .resizable()
        .aspectRatio(contentMode: .fit)
        .frame(width: imageSize, height: imageSize)
        .clipShape(Circle())
    }
  }
}

// MARK: - Team projects (shared by the medium and large team widgets)

struct TeamProjectItem: Identifiable, Codable {
  let id: String
  let name: String
  let commitMessage: String?
  let createdAt: Int?
  let status: String?
  let project: ProjectListItem
  let faviconPath: String?
}

private let teamProjectCacheKey = "revcel::teamProjectItems"

/// Last good item per project id, so a transient failure does not turn a live project into
/// "No deployment" until the next reload.
private func loadTeamProjectCache() -> [String: TeamProjectItem] {
  guard let defaults = UserDefaults(suiteName: appGroupName),
        let data = defaults.data(forKey: teamProjectCacheKey),
        let cache = try? JSONDecoder().decode([String: TeamProjectItem].self, from: data) else {
    return [:]
  }
  
  return cache
}

private func saveTeamProjectCache(_ items: [TeamProjectItem]) {
  guard let defaults = UserDefaults(suiteName: appGroupName) else { return }
  
  var cache = loadTeamProjectCache()
  for item in items {
    cache[item.project.id] = item
  }
  
  if let data = try? JSONEncoder().encode(cache) {
    defaults.set(data, forKey: teamProjectCacheKey)
  }
}

private func fetchTeamProjectItem(_ project: ProjectListItem, index: Int) async -> TeamProjectItem? {
  guard let response = try? await fetchProductionDeployment(
    connection: project.connection,
    connectionTeam: project.connectionTeam,
    projectId: project.id
  ) else {
    return nil
  }
  
  let deployment = response.deployment
  let faviconPath = await fetchProjectFavicon(project: project, productionDomain: response.domain?.name)
  
  return TeamProjectItem(
    id: "\(project.id)-\(index)",
    name: project.projectName,
    commitMessage: deployment.meta?.githubCommitMessage,
    createdAt: deployment.createdAt,
    status: deployment.readyState,
    project: project,
    faviconPath: faviconPath
  )
}

/// Production deployment (and favicon) of every project, fetched in parallel, returned in the
/// configured order. Projects that fail keep their last good data.
func fetchTeamProjectItems(_ projects: [ProjectListItem]) async -> [TeamProjectItem] {
  let cache = loadTeamProjectCache()
  
  let fetched: [TeamProjectItem?] = await withTaskGroup(of: (Int, TeamProjectItem?).self) { group in
    for (index, project) in projects.enumerated() {
      group.addTask { (index, await fetchTeamProjectItem(project, index: index)) }
    }
    
    // task groups complete in network order, write by index to keep the configured order
    var ordered = [TeamProjectItem?](repeating: nil, count: projects.count)
    for await (index, item) in group {
      ordered[index] = item
    }
    return ordered
  }
  
  var items: [TeamProjectItem] = []
  var fresh: [TeamProjectItem] = []
  
  for (index, project) in projects.enumerated() {
    if let item = fetched[index] {
      items.append(item)
      fresh.append(item)
    } else if let cached = cache[project.id] {
      items.append(TeamProjectItem(
        id: "\(project.id)-\(index)",
        name: project.projectName,
        commitMessage: cached.commitMessage,
        createdAt: cached.createdAt,
        status: cached.status,
        project: project,
        faviconPath: cached.faviconPath
      ))
    } else {
      items.append(TeamProjectItem(
        id: "\(project.id)-\(index)",
        name: project.projectName,
        commitMessage: nil,
        createdAt: nil,
        status: nil,
        project: project,
        faviconPath: nil
      ))
    }
  }
  
  if !fresh.isEmpty {
    saveTeamProjectCache(fresh)
  }
  
  return items
}
