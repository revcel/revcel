import WidgetKit
import SwiftUI
import AppIntents

struct MediumTeamProjectsAppIntentConfiguration: WidgetConfigurationIntent {
  static var title: LocalizedStringResource { "Projects" }
  static var description: IntentDescription { "Select up to 3 projects." }
  
  @Parameter(title: "Project 1")
  var project1: ProjectListItem?
  
  @Parameter(title: "Project 2")
  var project2: ProjectListItem?
  
  @Parameter(title: "Project 3")
  var project3: ProjectListItem?
}

struct MediumTeamProjectsProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> MediumTeamProjectsEntry {
    MediumTeamProjectsEntry(
      date: Date(),
      configuration: MediumTeamProjectsAppIntentConfiguration(),
      isSubscribed: true,
      items: []
    )
  }
  
  func snapshot(for configuration: MediumTeamProjectsAppIntentConfiguration, in context: Context) async -> MediumTeamProjectsEntry {
    MediumTeamProjectsEntry(
      date: Date(),
      configuration: configuration,
      isSubscribed: true,
      items: []
    )
  }
  
  func timeline(for configuration: MediumTeamProjectsAppIntentConfiguration, in context: Context) async -> Timeline<MediumTeamProjectsEntry> {
    var entries: [MediumTeamProjectsEntry] = []
    var isSubscribed: Bool = false
    
    if let sharedDefaults = UserDefaults(suiteName: appGroupName) {
      let isSubscribedValue = sharedDefaults.bool(forKey: isSubscribedKey)
      isSubscribed = isSubscribedValue
    }
    
    let selectedProjects = [configuration.project1, configuration.project2, configuration.project3].compactMap { $0 }
    let enumeratedProjects = Array(selectedProjects.enumerated())
    
    let items: [MediumTeamProjectsItem] = await withTaskGroup(of: MediumTeamProjectsItem?.self) { group in
      var results: [MediumTeamProjectsItem] = []
      
      for (index, project) in enumeratedProjects {
        group.addTask {
          let fallbackItem = MediumTeamProjectsItem(
            id: "\(project.id)-\(index)",
            name: project.projectName,
            commitMessage: nil,
            createdAt: nil,
            status: nil,
            project: project
          )
          
          do {
            let response = try await fetchProductionDeployment(connection: project.connection, connectionTeam: project.connectionTeam, projectId: project.id)
            let deployment = response.deployment
            return MediumTeamProjectsItem(
              id: "\(project.id)-\(index)",
              name: project.projectName,
              commitMessage: deployment.meta?.githubCommitMessage,
              createdAt: deployment.createdAt,
              status: deployment.readyState,
              project: project
            )
          } catch {
            return fallbackItem
          }
        }
      }
      
      for await item in group {
        if let item = item { results.append(item) }
      }
      
      return results
    }
    
    let currentDate = Date()
    for hourOffset in 0 ..< 5 {
      let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
      let entry = MediumTeamProjectsEntry(date: entryDate, configuration: configuration, isSubscribed: isSubscribed, items: items)
      entries.append(entry)
    }
    
    return Timeline(entries: entries, policy: .atEnd)
  }
}

struct MediumTeamProjectsItem: Identifiable {
  let id: String
  let name: String
  let commitMessage: String?
  let createdAt: Int?
  let status: String?
  let project: ProjectListItem
}

struct MediumTeamProjectsEntry: TimelineEntry {
  let date: Date
  let configuration: MediumTeamProjectsAppIntentConfiguration
  let isSubscribed: Bool
  let items: [MediumTeamProjectsItem]
}

struct MediumTeamProjectsRow: View {
  var item: MediumTeamProjectsItem
  
  var formattedDate: String {
    guard let createdAt = item.createdAt else { return "No deployment" }
    let date = Date(timeIntervalSince1970: TimeInterval(createdAt) / 1000.0)
    let formatter = DateFormatter()
    formatter.dateFormat = "dd/MM/yyyy"
    return formatter.string(from: date)
  }
  
  private func statusColorName(for status: String) -> String {
    switch status.uppercased() {
    case "READY": return "success"
    case "ERROR", "CANCELED": return "error"
    case "BUILDING": return "warning"
    case "QUEUED", "INITIALIZING": return "gray1000"
    default: return "gray1000"
    }
  }
  
  var body: some View {
    HStack(alignment: .center) {
      VStack(alignment: .leading, spacing: 4.0) {
        Text(item.name)
          .font(.system(size: 16, weight: .bold))
          .foregroundStyle(Color("gray1000"))
          .lineLimit(1)
        HStack(alignment: .center, spacing: 6.0) {
          Text(formattedDate)
            .font(.system(size: 12, weight: .regular))
            .foregroundStyle(Color("gray900"))
            .lineLimit(1)
          Text("•")
            .font(.system(size: 12, weight: .regular))
            .foregroundStyle(Color("gray900"))
          Text(item.commitMessage ?? "Manual deploy")
            .font(.system(size: 12, weight: .regular))
            .foregroundStyle(Color("gray900"))
            .lineLimit(1)
            .truncationMode(.tail)
            .layoutPriority(1)
        }
      }
      Spacer()
      if let status = item.status, !status.isEmpty {
        Text(status)
          .font(.system(size: 12, weight: .bold))
          .foregroundStyle(Color(statusColorName(for: status)))
          .padding(.horizontal, 8.0)
          .padding(.vertical, 4.0)
          .background(Color("backgroundSecondary"))
          .clipShape(RoundedRectangle(cornerRadius: 6.0))
      } else {
        Text("-")
          .font(.system(size: 12, weight: .bold))
          .foregroundStyle(Color("gray1000"))
          .padding(.horizontal, 8.0)
          .padding(.vertical, 4.0)
          .background(Color("backgroundSecondary"))
          .clipShape(RoundedRectangle(cornerRadius: 6.0))
      }
    }
  }
}

struct MediumTeamProjectsPlaceholderRow: View {
  var body: some View {
    HStack(alignment: .center) {
      VStack(alignment: .leading, spacing: 4.0) {
        RoundedRectangle(cornerRadius: 4.0)
          .fill(Color("backgroundSecondary"))
          .frame(height: 16.0)
        HStack(alignment: .center, spacing: 6.0) {
          RoundedRectangle(cornerRadius: 3.0)
            .fill(Color("backgroundSecondary"))
            .frame(width: 70.0, height: 12.0)
          Circle()
            .fill(Color("backgroundSecondary"))
            .frame(width: 4.0, height: 4.0)
          RoundedRectangle(cornerRadius: 3.0)
            .fill(Color("backgroundSecondary"))
            .frame(maxWidth: .infinity)
            .frame(height: 12.0)
        }
      }
      Spacer()
      RoundedRectangle(cornerRadius: 6.0)
        .fill(Color("backgroundSecondary"))
        .frame(width: 48.0, height: 20.0)
    }
  }
}

struct MediumTeamProjectsEntryView: View {
  var entry: MediumTeamProjectsProvider.Entry
  
  var firstProject: ProjectListItem? {
    return entry.configuration.project1 ?? entry.configuration.project2 ?? entry.configuration.project3
  }
  
  var body: some View {
    if (!entry.isSubscribed) {
      SubscriptionRequiredView()
        .widgetURL(URL(string: getAppUrl(project: firstProject)))
    } else {
      Group {
        if #available(iOS 17.0, *) {
          VStack(alignment: .leading, spacing: 8.0) {
            if entry.items.isEmpty {
              ForEach(0..<3, id: \.self) { idx in
                MediumTeamProjectsPlaceholderRow()
                if idx != 2 {
                  Divider().background(Color("backgroundSecondary"))
                }
              }
            } else {
              ForEach(entry.items.prefix(3)) { item in
                if let url = URL(string: getAppUrl(project: item.project)) {
                  Link(destination: url) {
                    MediumTeamProjectsRow(item: item)
                  }
                } else {
                  MediumTeamProjectsRow(item: item)
                }
                if item.id != entry.items.prefix(3).last?.id {
                  Divider().background(Color("backgroundSecondary"))
                }
              }
            }
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        } else {
          VStack(alignment: .leading, spacing: 12.0) {
            if entry.items.isEmpty {
              ForEach(0..<3, id: \.self) { idx in
                MediumTeamProjectsPlaceholderRow()
                if idx != 2 {
                  Divider().background(Color("backgroundSecondary"))
                }
              }
            } else {
              ForEach(entry.items.prefix(3)) { item in
                MediumTeamProjectsRow(item: item)
                if item.id != entry.items.prefix(3).last?.id {
                  Divider().background(Color("backgroundSecondary"))
                }
              }
            }
          }
          .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
          .widgetURL(URL(string: getAppUrl(project: firstProject)))
        }
      }
    }
  }
}

struct MediumTeamProjectsWidget: Widget {
  let kind: String = "MediumTeamProjectsWidget"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: MediumTeamProjectsAppIntentConfiguration.self, provider: MediumTeamProjectsProvider()) { entry in
      MediumTeamProjectsEntryView(entry: entry)
        .containerBackground(for: .widget) {
          Color("background")
        }
    }
    .configurationDisplayName("Team Projects")
    .description("See latest for up to 3 projects.")
    .supportedFamilies([.systemMedium])
  }
}

extension MediumTeamProjectsAppIntentConfiguration {
  fileprivate static var sample: MediumTeamProjectsAppIntentConfiguration {
    let intent = MediumTeamProjectsAppIntentConfiguration()
    intent.project1 = .init(id: "1", projectName: "Revcel", connection: .init(id: "1", apiToken: "2"), connectionTeam: .init(id: "1", name: "Team"))
    intent.project2 = .init(id: "2", projectName: "Docs", connection: .init(id: "1", apiToken: "2"), connectionTeam: .init(id: "1", name: "Team"))
    intent.project3 = .init(id: "3", projectName: "API", connection: .init(id: "1", apiToken: "2"), connectionTeam: .init(id: "1", name: "Team"))
    return intent
  }
}

#Preview(as: .systemMedium) {
  MediumTeamProjectsWidget()
} timeline: {
  MediumTeamProjectsEntry(date: .now, configuration: .sample, isSubscribed: true, items: [
    .init(id: "1-0", name: "Revcel", commitMessage: "Initial release", createdAt: Int(Date().timeIntervalSince1970 * 1000), status: "READY", project: .init(id: "1", projectName: "Revcel", connection: .init(id: "1", apiToken: "2"), connectionTeam: .init(id: "1", name: "Team"))),
    .init(id: "2-1", name: "Docs", commitMessage: "Update readme", createdAt: Int(Date().addingTimeInterval(-86400).timeIntervalSince1970 * 1000), status: "BUILDING", project: .init(id: "2", projectName: "Docs", connection: .init(id: "1", apiToken: "2"), connectionTeam: .init(id: "1", name: "Team"))),
    .init(id: "3-2", name: "API", commitMessage: "Improve endpoints", createdAt: Int(Date().addingTimeInterval(-172800).timeIntervalSince1970 * 1000), status: "QUEUED", project: .init(id: "3", projectName: "API", connection: .init(id: "1", apiToken: "2"), connectionTeam: .init(id: "1", name: "Team")))
  ])
}


