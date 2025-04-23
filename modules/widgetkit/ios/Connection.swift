import ExpoModulesCore

struct Connection: Record, Encodable, Decodable {
    init() {}
    
    @Field
    var id: String?
    
    @Field
    var apiToken: String?
    
    enum CodingKeys: String, CodingKey {
        case id, apiToken
    }
    
    init(from decoder: Decoder) throws {
        let client = try decoder.container(keyedBy: CodingKeys.self)
        
        id = try client.decodeIfPresent(String.self, forKey: .id)
        apiToken = try client.decodeIfPresent(String.self, forKey: .apiToken)
    }

    func encode(to encoder: Encoder) throws {
        var client = encoder.container(keyedBy: CodingKeys.self)
        
        try client.encodeIfPresent(id, forKey: .id)
        try client.encodeIfPresent(apiToken, forKey: .apiToken)
    }
}
