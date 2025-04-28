import Foundation

struct NoBody: Encodable {}

enum HTTPMethod: String {
  case GET = "GET"
  case POST = "POST"
  case PUT = "PUT"
  case PATCH = "PATCH"
  case DELETE = "DELETE"
}

struct FetchParams<T: Encodable> {
  let method: HTTPMethod
  let url: String
  let baseUrl: String?
  let connection: Connection
  let body: T?
  
  init(method: HTTPMethod, url: String, connection: Connection, body: T, baseUrl: String? = nil) {
    self.method = method
    self.url = url
    self.connection = connection
    self.body = body
    self.baseUrl = baseUrl
  }
  
  init(method: HTTPMethod, url: String, connection: Connection, baseUrl: String? = nil) {
    self.method = method
    self.url = url
    self.connection = connection
    self.body = nil
    self.baseUrl = baseUrl
  }
}

private func fetch<T: Encodable>(params: FetchParams<T>, completion: @escaping (Result<Data, Error>) -> Void) {
  if (!params.url.starts(with: "/")) {
    return completion(.failure(NSError(domain: "InvalidUrl", code: 0, userInfo: [NSLocalizedDescriptionKey: "URL should start with /"])))
  }
  
  let fullUrlString = params.baseUrl != nil ? "\(params.baseUrl ?? "")\(params.url)" : "https://api.vercel.com\(params.url)"
  
  guard let fullUrl = URL(string: fullUrlString) else {
    return completion(.failure(NSError(domain: "InvalidURL", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
  }
  
  var request = URLRequest(url: fullUrl)
  
  request.httpMethod = params.method.rawValue
  request.addValue("application/json", forHTTPHeaderField: "Accept")
  request.addValue("Bearer \(params.connection.apiToken)", forHTTPHeaderField: "Authorization")
  
  if let data = params.body {
    let jsondata = try? JSONEncoder().encode(data)
    request.httpBody = jsondata
  }
  
  let session = URLSession(configuration: .default)
  
  let task = session.dataTask(with: request) { data, response, error in
    if let error = error {
      completion(.failure(error))
      return
    }
    
    guard let httpResponse = response as? HTTPURLResponse else {
      return completion(.failure(NSError(domain: "InvalidResponse", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])))
    }
    
    if !(200...299).contains(httpResponse.statusCode) {
      let error = NSError(domain: "HTTPError", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "HTTP Error: \(httpResponse.statusCode)"])
      
      if let data = data, let errorString = String(data: data, encoding: .utf8) {
        print("Error Response Body: \(errorString)")
      }
      
      return completion(.failure(error))
    }
    
    guard let data = data else {
      return completion(.failure(NSError(domain: "NoData", code: 0, userInfo: [NSLocalizedDescriptionKey: "No data received"])))
    }
    
    completion(.success(data))
  }
  
  task.resume()
}

func httpRequest<T: Decodable, K: Encodable>(params: FetchParams<K>) async throws -> T {
  try await withCheckedThrowingContinuation { continuation in
    fetch(params: params) { result in
      switch result {
      case .success(let data):
        do {
          let decoder = JSONDecoder()
          let decodedResult = try decoder.decode(T.self, from: data)
          
          continuation.resume(returning: decodedResult)
        } catch {
          continuation.resume(throwing: error)
        }
      case .failure(let error):
        continuation.resume(throwing: error)
      }
    }
  }
}

func downloadAndSaveImage(from url: URL, name: String) async throws -> String? {
  try await withCheckedThrowingContinuation { continuation in
    let session = URLSession(configuration: .default)
    let task = session.dataTask(with: url) { data, response, error in
      guard let data = data, error == nil else {
        return continuation.resume(returning: nil)
      }
      
      guard let httpResponse = response as? HTTPURLResponse else {
        return continuation.resume(returning: nil)
      }
      
      if !(200...299).contains(httpResponse.statusCode) {
        return continuation.resume(returning: nil)
      }
      
      if let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupName) {
        let imageURL = containerURL.appendingPathComponent(name)
        do {
          try data.write(to: imageURL)
          continuation.resume(returning: imageURL.path)
        } catch {
          continuation.resume(returning: nil)
        }
      } else {
        continuation.resume(returning: nil)
      }
    }
    task.resume()
  }
}
