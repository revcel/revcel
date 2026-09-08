import WidgetKit
import SwiftUI
import AppIntents
import Charts

struct MediumAnalyticsAppIntentConfiguration: WidgetConfigurationIntent {
  static var title: LocalizedStringResource { "Project" }
  static var description: IntentDescription { "Select your project." }
  
  @Parameter(title: "Project")
  var project: ProjectListItem?
}

/// What the widget knows after a reload. Failure is kept apart from "not enabled", so a revoked
/// token or an offline reload no longer renders a made-up chart.
enum AnalyticsState {
  case placeholder
  case unavailable
  case failed
  case ready(visitors: Int?, points: [LineChartData])
}

struct MediumAnalyticsProvider: AppIntentTimelineProvider {
  func placeholder(in context: Context) -> MediumAnalyticsEntry {
    MediumAnalyticsEntry(date: Date(), configuration: MediumAnalyticsAppIntentConfiguration(), isSubscribed: true, faviconPath: nil, analytics: .placeholder)
  }
  
  func snapshot(for configuration: MediumAnalyticsAppIntentConfiguration, in context: Context) async -> MediumAnalyticsEntry {
    MediumAnalyticsEntry(date: Date(), configuration: configuration, isSubscribed: true, faviconPath: nil, analytics: .placeholder)
  }
  
  func timeline(for configuration: MediumAnalyticsAppIntentConfiguration, in context: Context) async -> Timeline<MediumAnalyticsEntry> {
    let isSubscribed = readIsSubscribed()
    var faviconPath: String? = nil
    var analytics: AnalyticsState = .placeholder
    
    if let project = configuration.project {
      // independent requests, run together
      async let favicon = fetchProjectFavicon(project: project)
      async let state = loadAnalytics(project: project)
      
      faviconPath = await favicon
      analytics = await state
    }
    
    let entry = MediumAnalyticsEntry(date: Date(), configuration: configuration, isSubscribed: isSubscribed, faviconPath: faviconPath, analytics: analytics)
    
    return Timeline(entries: [entry], policy: refreshPolicy(minutes: 30))
  }
  
  private func loadAnalytics(project: ProjectListItem) async -> AnalyticsState {
    guard let availability = try? await fetchProjectAnalyticsAvailability(connection: project.connection, connectionTeam: project.connectionTeam, projectId: project.id) else {
      return .failed
    }
    
    guard availability.isEnabled && availability.hasData else {
      return .unavailable
    }
    
    let quickStatsEnd = roundToGranularity(date: .now, granularity: .fiveMinutes, mode: .down)
    let quickStatsStart = roundToGranularity(date: .now.addingTimeInterval(-24 * 60 * 60), granularity: .fiveMinutes, mode: .up)
    let seriesEnd = roundToGranularity(date: .now, granularity: .oneHour, mode: .up)
    let seriesStart = roundToGranularity(date: .now.addingTimeInterval(-7 * 24 * 60 * 60), granularity: .oneHour, mode: .down)
    
    async let overview = try? fetchProjectTotalVisitors(
      connection: project.connection,
      connectionTeam: project.connectionTeam,
      projectId: project.id,
      from: quickStatsStart.ISO8601Format(),
      to: quickStatsEnd.ISO8601Format()
    )
    async let series = try? fetchProjectAnalyticsTimeseries(
      connection: project.connection,
      connectionTeam: project.connectionTeam,
      projectId: project.id,
      from: seriesStart.ISO8601Format(),
      to: seriesEnd.ISO8601Format()
    )
    
    let visitors = (await overview)?.devices
    
    guard let timeseries = await series else {
      return .failed
    }
    
    // unparseable keys are dropped instead of collapsing onto "now" as a vertical line
    let points = (timeseries.data?.groups?.all ?? []).compactMap { point -> LineChartData? in
      guard let date = parseISODate(point.key) else { return nil }
      return LineChartData(date: date, value: point.devices)
    }
    
    return .ready(visitors: visitors, points: points)
  }
}

struct MediumAnalyticsEntry: TimelineEntry {
  let date: Date
  let configuration: MediumAnalyticsAppIntentConfiguration
  let isSubscribed: Bool
  let faviconPath: String?
  let analytics: AnalyticsState
}

/// Fixed shape for the redacted placeholder; random values re-rolled on every render.
struct ChartsPlaceHolder: View {
  private let values = [30, 55, 40, 70, 60, 85, 65, 90]
  
  var body: some View {
    let calendar = Calendar.current
    let today = Date()
    
    VStack(alignment: .leading) {
      Chart {
        ForEach(Array(values.enumerated()), id: \.offset) { offset, value in
          AreaMark(
            x: .value("Weekday", calendar.date(byAdding: .day, value: offset - values.count, to: today) ?? today),
            y: .value("Value", value)
          )
          .foregroundStyle(Color("backgroundSecondary"))
        }
      }
      .chartYAxis(.hidden)
      .chartXAxis(.hidden)
    }
    .padding(.top, 50.0)
  }
}

struct AnalyticsChart: View {
  let points: [LineChartData]
  
  var body: some View {
    VStack(alignment: .leading) {
      Chart {
        ForEach(points, id: \.id) { item in
          AreaMark(
            x: .value("Weekday", item.date),
            y: .value("Value", item.value)
          )
          .foregroundStyle(Color("blue100"))
          LineMark(
            x: .value("Weekday", item.date),
            y: .value("Value", item.value)
          )
          .foregroundStyle(Color("blue700"))
        }
      }
      .chartYAxis(.hidden)
      .chartXAxis(.hidden)
    }
    .padding(.top, 35.0)
  }
}

struct MediumAnalyticsEntryView: View {
  @Environment(\.widgetContentMargins) var widgetMargins
  
  var entry: MediumAnalyticsProvider.Entry
  
  var body: some View {
    if (!entry.isSubscribed) {
      SubscriptionRequiredView()
        .widgetURL(URL(string: getAppUrl(project: entry.configuration.project)))
    } else {
      VStack {
        switch entry.analytics {
        case .unavailable:
          message("No analytics data available")
        case .failed:
          message("Couldn't load analytics")
        case .placeholder:
          header(visitors: nil)
        case .ready(let visitors, _):
          header(visitors: visitors)
        }
      }
      .padding(widgetMargins)
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      .background(
        VStack {
          switch entry.analytics {
          case .ready(_, let points) where !points.isEmpty:
            AnalyticsChart(points: points)
          case .placeholder:
            ChartsPlaceHolder()
          default:
            EmptyView()
          }
        }
      )
      .widgetURL(URL(string: getAppUrl(project: entry.configuration.project)))
    }
  }
  
  @ViewBuilder
  private func header(visitors: Int?) -> some View {
    HStack(alignment: .center, spacing: 10.0) {
      ProjectFavicon(faviconPath: entry.faviconPath, imageSize: 30.0)
      if let project = entry.configuration.project {
        Text("\(project.projectName)")
          .font(.system(size: 16, weight: .bold))
          .foregroundStyle(Color("gray1000"))
          .multilineTextAlignment(.center)
          .lineLimit(1)
          .truncationMode(.tail)
      } else {
        VStack {
          RoundedRectangle(cornerRadius: 8.0)
            .fill(Color("backgroundSecondary"))
            .frame(height: 10.0)
        }
      }
      if let visitors {
        Text("\(visitors) Visitors")
          .padding(.leading, 15.0)
          .font(.system(size: 16, weight: .bold))
          .foregroundStyle(Color("gray1000"))
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
  
  @ViewBuilder
  private func message(_ text: String) -> some View {
    HStack {
      Text(text)
        .font(.system(size: 18.0, weight: .bold))
        .foregroundStyle(Color("gray1000"))
        .multilineTextAlignment(.center)
        .lineLimit(1)
        .truncationMode(.tail)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
  }
}

struct MediumAnalyticsWidget: Widget {
  // typo kept on purpose: changing `kind` orphans every installed instance of the widget
  let kind: String = "MeediumAnalyticsWidget"
  
  var body: some WidgetConfiguration {
    AppIntentConfiguration(kind: kind, intent: MediumAnalyticsAppIntentConfiguration.self, provider: MediumAnalyticsProvider()) { entry in
      MediumAnalyticsEntryView(entry: entry)
        .containerBackground(for: .widget) {
          Color("background")
        }
    }
    .contentMarginsDisabled()
    .configurationDisplayName("Analytics").description("See the analytics for your project.")
    .supportedFamilies([.systemMedium])
  }
}

extension MediumAnalyticsAppIntentConfiguration {
  fileprivate static var project: MediumAnalyticsAppIntentConfiguration {
    let intent = MediumAnalyticsAppIntentConfiguration()
    intent.project = .init(id: "1", projectName: "Revcel", connection: .init(id: "1", apiToken: "2"), connectionTeam: .init(id: "1", name: "2"))
    return intent
  }
}

#Preview(as: .systemSmall) {
  MediumAnalyticsWidget()
} timeline: {
  MediumAnalyticsEntry(date: .now, configuration: .project, isSubscribed: true, faviconPath: nil, analytics: .placeholder)
}
