import Foundation

let appGroupName: String = "group.com.revcel.mobile"
let connectionsKey: String = "revcel::connections"
let widgetStateKey: String = "pourtainer::widgetState"

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

struct ConnectionTeamsResonse: Decodable {
  let teams: [ConnectionTeam]
}

struct ConnectionTeam: Decodable {
  let id: String
  let name: String
}
