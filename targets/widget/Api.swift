import Foundation

func fetchConnectionTeams(connection: Connection) async throws -> ConnectionTeamsResponse {
  let params = FetchParams(
    method: HTTPMethod.GET,
    url: "/teams",
    connection: connection
  )
  
  return try await httpRequest(params: params)
}

func fetchTeamProjects(connection: Connection, connectionTeam: ConnectionTeam) async throws -> [ConnectionProject] {
  let params = FetchParams(
    method: HTTPMethod.GET,
    url: "/projects?teamId=\(connectionTeam.id)&latestDeployments=5",
    connection: connection
  )
  
  return try await httpRequest(params: params)
}

func fetchLatestDeplyment(connection: Connection, projectId: String) async throws -> DeploymentResponse {
  let params = FetchParams(
    method: HTTPMethod.GET,
    url: "/v6/deployments?projectId=\(projectId)&state=READY&limit=1",
    connection: connection
  )
  
  return try await httpRequest(params: params)
}
