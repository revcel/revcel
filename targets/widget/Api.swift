import Foundation

func fetchConnectionTeams(connection: Connection) async throws -> ConnectionTeamsResonse {
  let params = FetchParams(
    method: HTTPMethod.GET,
    url: "/teams",
    connection: connection
  )
  
  return try await httpRequest(params: params)
}
