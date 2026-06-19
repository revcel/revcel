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
