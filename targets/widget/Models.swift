import Foundation

let appGroupName: String = "group.com.revcel.mobile"
let instancesKey: String = "revcel::connections"

struct Connection: Decodable, Encodable {
  let id: String
  let apiToken: String
}

