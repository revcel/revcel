import Foundation

func fetchConnectionTeams(connection: Connection) async throws -> ConnectionTeamsResponse {
  let params = FetchParams<NoBody>(
    method: HTTPMethod.GET,
    url: "/teams",
    connection: connection
  )
  
  return try await httpRequest(params: params)
}

func fetchTeamProjects(connection: Connection, connectionTeam: ConnectionTeam) async throws -> [ConnectionProject] {
  let params = FetchParams<NoBody>(
    method: HTTPMethod.GET,
    url: "/projects?teamId=\(connectionTeam.id)&latestDeployments=5",
    connection: connection
  )
  
  return try await httpRequest(params: params)
}

func fetchLatestDeplyment(connection: Connection, projectId: String) async throws -> DeploymentResponse {
  let params = FetchParams<NoBody>(
    method: HTTPMethod.GET,
    url: "/v6/deployments?projectId=\(projectId)&state=READY&limit=1",
    connection: connection
  )
  
  return try await httpRequest(params: params)
}

func fetchProjectFirewallMetrics(connection: Connection, connectionTeam: ConnectionTeam, firewallMetricsRequestData: FirewallMetricsRequest) async throws -> FirewallMetricsResponse {
  let params = FetchParams(
    method: HTTPMethod.POST,
    url: "/observability/metrics?ownerId=\(connectionTeam.id)",
    connection: connection,
    body: firewallMetricsRequestData
  )
  
  return try await httpRequest(params: params)
}

func fetchProjectAnalyticsAvailability(connection: Connection, connectionTeam: ConnectionTeam, projectId: String) async throws -> AnalyticsEnabledResponse {
  let params = FetchParams<NoBody>(
    method: HTTPMethod.GET,
    url: "/v1/web/insights/enabled?projectId=\(projectId)&teamId=\(connectionTeam.id)",
    connection: connection,
    baseUrl: "https://vercel.com/api"
  )
  
  return try await httpRequest(params: params)
}

func fetchProjectTotalVisitors(connection: Connection, connectionTeam: ConnectionTeam, projectId: String, from: String, to: String) async throws -> AnalyticsQuickStatsResponse {
  let params = FetchParams<NoBody>(
    method: HTTPMethod.GET,
    url: "/web-analytics/overview?environment=production&filter%7B%7D&from=\(from)&projectId=\(projectId)&teamId=\(connectionTeam.id)&to=\(to)",
    connection: connection,
    baseUrl: "https://vercel.com/api"
  )
  
  return try await httpRequest(params: params)
}

func fetchProjectAnalyticsTimeseries(connection: Connection, connectionTeam: ConnectionTeam, projectId: String, from: String, to: String) async throws -> AnalyticsTimeseriesResponse {
  let params = FetchParams<NoBody>(
    method: HTTPMethod.GET,
    url: "/web-analytics/timeseries?environment=production&filter=%7B%7D&from=\(from)&projectId=\(projectId)&teamId=\(connectionTeam.id)&to=\(to)",
    connection: connection,
    baseUrl: "https://vercel.com/api"
  )
  
  return try await httpRequest(params: params)
}

func fetchProductionDeployment(connection: Connection, connectionTeam: ConnectionTeam, projectId: String) async throws -> ProductionDeploymentResponse {
  let params = FetchParams<NoBody>(
    method: HTTPMethod.GET,
    url: "/projects/\(projectId)/production-deployment?teamId=\(connectionTeam.id)",
    connection: connection
  )
  
  return try await httpRequest(params: params)
}
