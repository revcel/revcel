import Foundation

enum HTTPMethod: String {
  case GET = "GET"
  case POST = "POST"
  case PUT = "PUT"
  case PATCH = "PATCH"
  case DELETE = "DELETE"
}

struct FetchParams {
  let method: HTTPMethod
  let url: String
  let connection: Connection
}

private func fetch(params: FetchParams, completion: @escaping (Result<Data, Error>) -> Void) {
  if (!params.url.starts(with: "/")) {
    return completion(.failure(NSError(domain: "InvalidUrl", code: 0, userInfo: [NSLocalizedDescriptionKey: "URL should start with /"])))
  }
  
  let fullUrlString = "\(params.url)"
  
  guard let fullUrl = URL(string: fullUrlString) else {
    return completion(.failure(NSError(domain: "InvalidURL", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])))
  }
  
  var request = URLRequest(url: fullUrl)
  
  request.httpMethod = params.method.rawValue
  request.addValue("application/json", forHTTPHeaderField: "Accept")
  request.addValue("Bearer \(params.connection.apiToken)", forHTTPHeaderField: "Authorization")
  
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

func httpRequest<T: Decodable>(params: FetchParams) async throws -> T {
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
