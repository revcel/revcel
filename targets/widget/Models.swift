import Foundation

let appGroupName: String = "group.com.revcel.mobile"
let connectionsKey: String = "revcel::connections"
let widgetStateKey: String = "revcel::widgetState"

struct Connection: Decodable, Encodable {
  let id: String
  let apiToken: String
}

enum WidgetIntentState: Int {
  case loading = 0
  case apiFailed = 1
  case hasContainers = 2
  case noContainers = 3
}

struct ConnectionTeamsResponse: Decodable {
  let teams: [ConnectionTeam]
}

struct ConnectionTeam: Decodable {
  let id: String
  let name: String
}

struct ConnectionProject: Decodable {
  let id: String
  let name: String
}

struct DeploymentResponse: Decodable {
  let deployments: [Deployment]
}

struct Deployment: Decodable {
  let uid: String
}

struct FirewallMetricsResponse: Decodable {
  let summary: [FirewallMetricsSummary]
}

struct FirewallMetricsSummary: Decodable {  
  let wafRuleId: String
  let wafAction: String
  let value: Int
}

struct FirewallWidgetData {
  let allowed: Int?
  let denied: Int?
  let chalanged: Int?
}

struct FirewallMetricsGranularity: Encodable {
  let minutes: Int
}

struct FirewallMetricsScope: Encodable {
  let type: String
  let ownerId: String
  let projectIds: [String]
}

struct FirewallMetricsRollups: Encodable {
  let value: FirewallMetricsValue
}

struct FirewallMetricsValue: Encodable {
  let measure: String
  let aggregation: String
}

struct FirewallMetricsRequest: Encodable {
  let event: String
  let reason: String
  let rollups: FirewallMetricsRollups
  let granularity: FirewallMetricsGranularity
  let groupBy: [String]
  let limit: Int
  let tailRollup: String
  let summaryOnly: Bool
  let startTime: String
  let endTime: String
  let scope: FirewallMetricsScope
}

struct AnalyticsEnabledResponse: Decodable {
  let isEnabled: Bool
  let hasData: Bool
}

struct AnalyticsQuickStatsResponse: Decodable {
  let total: Int
  let devices: Int
  let bounceRate: Int
}

struct AnalyticsTimeseries: Decodable {
  let key: String
  let total: Int
  let devices: Int
  let bounceRate: Int
}

struct AnalyticsTimeseriesResponse: Decodable {
  let data: [AnalyticsTimeseries]
}
