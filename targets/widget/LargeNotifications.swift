//import AppIntents
//import SwiftUI
//import WidgetKit
//
//private let SUITE_NAME: String = "group.com.revcel.mobile"
//
//struct Notification {
//	let id: String
//	let title: String
//	let message: String
//	let date: Date
//}
//
//struct Connection {
//	let id: String
//	let apiToken: String
//}
//
//struct LargeNotificationsConfigurationIntent: WidgetConfigurationIntent {
//    static var title: LocalizedStringResource { "Configuration" }
//    static var description: IntentDescription { "This is an example widget." }
//
//    // An example configurable parameter.
//    @Parameter(title: "User")
//    var connectionId: String
//}
//
//struct LargeNotificationsFetcher {
//  static func getNotifications(connectionId: String) -> [Notification] {
//      guard let sharedDefaults = UserDefaults(suiteName: SUITE_NAME) else {
//          return nil
//      }
//
//      guard let rawExistingConnections = sharedDefaults.string(forKey: "connections")?.data(using: .utf8) else {
//		   print("No data")
//          return nil
//      }
//
//		let connections = (try? JSONDecoder().decode([Connection].self, from: rawExistingConnections)) ?? nil
//
//		let connection = connections?.first(where: { $0.id == connectionId })
//
//		return connection?.notifications ?? []
//  }
//}
//
//struct LargeNotificationsProvider: AppIntentTimelineProvider {
//    func placeholder(in context: Context) -> LargeNotificationsEntry {
//        placeholderWidget
//    }
//
//    func snapshot(for configuration: LargeNotificationsConfigurationIntent, in context: Context) async
//        -> LargeNotificationsEntry
//    {
//        placeholderWidget
//    }
//
//    func timeline(for configuration: LargeNotificationsConfigurationIntent, in context: Context) async -> Timeline<
//        LargeNotificationsEntry
//    > {
//        var entries: [LargeNotificationsEntry] = []
//
//        let data = LargeNotificationsFetcher.getActivityData(name: configuration.activityName)
//
//        // Generate a timeline consisting of five entries an hour apart, starting from the current date.
//        let currentDate = Date()
//        for hourOffset in 0..<5 {
//            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
//            let entry = LargeNotificationsEntry(date: entryDate, activityName: data, activityData: [1, 0, 1])
//            entries.append(entry)
//        }
//
//        return Timeline(entries: entries, policy: .atEnd)
//    }
//
//}
//
//struct LargeNotificationsEntry: TimelineEntry {
//    var date: Date
//
//    // other params, do not pass base config (deconstruct before)
//    //    let date: Date
//    //    let configuration: LargeNotificationsConfigurationIntent
//
//	let notifications: [Notification]
//}
//
//struct LargeNotificationsView: View {
//    var entry: LargeNotificationsProvider.Entry
//
//    var notifications: [Notification] { entry.notifications }
//
//    var body: some View {
//        VStack {
//            Text(notifications.count)
//
//            Text("Notifications:")
//            //            Text(entry.configuration.favoriteEmoji)
//        }
//    }
//}
//
//struct LargeNotificationsWidget: Widget {
//    let kind: String = "LargeNotificationsWidget"
//
//    var body: some WidgetConfiguration {
//        AppIntentConfiguration(
//            kind: kind, intent: LargeNotificationsConfigurationIntent.self, provider: LargeNotificationsProvider()
//        ) { entry in LargeNotificationsView(entry: entry).containerBackground(Color("Red"), for: .widget) }
//        .configurationDisplayName("Widgets").description("Displays widgets.").supportedFamilies([.systemSmall])
//    }
//}
//
//// MARK: - Preview
//
//let placeholderWidget: LargeNotificationsEntry = LargeNotificationsEntry(
// notifications: [
//	Notification(id: "1", title: "Notification 1", message: "Message 1", date: Date()),
//	Notification(id: "2", title: "Notification 2", message: "Message 2", date: Date()),
//	Notification(id: "3", title: "Notification 3", message: "Message 3", date: Date()),
// ],
//)
//
//#Preview(as: .systemSmall) { LargeNotificationsWidget() } timeline: {
//    placeholderWidget
//}
