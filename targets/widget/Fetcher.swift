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
  
  let task = widgetSession.dataTask(with: request) { data, response, error in
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

/// One session for the whole extension. The default 60 s request timeout can eat the entire
/// WidgetKit reload budget, and a `URLSession` created per request is never invalidated.
let widgetSession: URLSession = {
  let configuration = URLSessionConfiguration.default
  configuration.timeoutIntervalForRequest = 15
  return URLSession(configuration: configuration)
}()

// MARK: - Favicons
//
// Vercel removed `vercel.com/api/v0/deployments/<id>/favicon`, and raw deployment URLs sit behind
// Deployment Protection (every path answers with a 200 HTML login page). The icon is therefore
// resolved from the production domain: the page's declared icon first, then the conventional
// paths, accepting only image responses. Mirrors `lib/favicon.ts` in the app.

private let faviconCacheMaxAge: TimeInterval = 24 * 60 * 60
private let faviconFallbackPaths = ["/favicon.ico", "/favicon.png", "/apple-touch-icon.png"]
// Deployment Protection redirects to vercel.com/sso-api and then to vercel.com/login
private let protectionHost = "vercel.com"
private let protectionMarkers = ["/sso-api", "_vercel_sso"]

private func faviconFileURL(projectId: String) -> URL? {
  FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupName)?
    .appendingPathComponent("favicon-\(projectId)")
}

/// Path of the cached icon when it is younger than a day.
private func cachedFaviconPath(projectId: String) -> String? {
  guard let url = faviconFileURL(projectId: projectId),
        let attributes = try? FileManager.default.attributesOfItem(atPath: url.path),
        let modified = attributes[.modificationDate] as? Date,
        Date().timeIntervalSince(modified) < faviconCacheMaxAge else {
    return nil
  }
  
  return url.path
}

// `UIImage` cannot render SVG, and a protection page is text/html
private func isRenderableImage(_ response: URLResponse) -> Bool {
  guard let http = response as? HTTPURLResponse,
        (200...299).contains(http.statusCode),
        let type = http.value(forHTTPHeaderField: "Content-Type")?.lowercased() else {
    return false
  }
  
  return type.hasPrefix("image/") && !type.contains("svg")
}

private func isProtectionPage(response: HTTPURLResponse, html: String) -> Bool {
  let finalHost = response.url?.host?.lowercased() ?? ""
  
  return finalHost == protectionHost
    || finalHost.hasSuffix(".\(protectionHost)")
    || protectionMarkers.contains(where: { html.contains($0) })
}

private func attribute(_ name: String, in tag: String) -> String? {
  guard let regex = try? NSRegularExpression(pattern: "\\b\(name)=[\"']([^\"']+)[\"']", options: .caseInsensitive),
        let match = regex.firstMatch(in: tag, range: NSRange(tag.startIndex..., in: tag)),
        let range = Range(match.range(at: 1), in: tag) else {
    return nil
  }
  
  return String(tag[range])
}

/// Icon hrefs declared in the page head, SVGs skipped. Touch icons last: they are often 1 MB PNGs.
func extractIconHrefs(from html: String) -> [String] {
  guard let tagRegex = try? NSRegularExpression(pattern: "<link\\b[^>]*>", options: .caseInsensitive) else {
    return []
  }
  
  var touchIcons: [String] = []
  var icons: [String] = []
  
  for match in tagRegex.matches(in: html, range: NSRange(html.startIndex..., in: html)) {
    guard let tagRange = Range(match.range, in: html) else { continue }
    let tag = String(html[tagRange])
    
    guard let rel = attribute("rel", in: tag)?.lowercased(),
          rel.contains("icon"), !rel.contains("mask-icon"),
          let href = attribute("href", in: tag) else {
      continue
    }
    
    if href.lowercased().split(separator: "?").first?.hasSuffix(".svg") == true { continue }
    
    if rel.contains("apple-touch-icon") {
      touchIcons.append(href)
    } else {
      icons.append(href)
    }
  }
  
  return icons + touchIcons
}

private func resolveHref(_ href: String, base: String) -> URL? {
  if href.hasPrefix("http://") || href.hasPrefix("https://") { return URL(string: href) }
  if href.hasPrefix("//") { return URL(string: "https:\(href)") }
  return URL(string: href.hasPrefix("/") ? "\(base)\(href)" : "\(base)/\(href)")
}

/// Downloads the favicon of `host` into the app group container and returns its path.
private func downloadWebsiteFavicon(host: String, projectId: String) async -> String? {
  let base = "https://\(host)"
  var candidates: [URL] = []
  
  if let homepage = URL(string: base),
     let (data, response) = try? await widgetSession.data(from: homepage),
     let http = response as? HTTPURLResponse,
     (200...299).contains(http.statusCode),
     http.value(forHTTPHeaderField: "Content-Type")?.lowercased().contains("text/html") == true,
     let html = String(data: data, encoding: .utf8) {
    if isProtectionPage(response: http, html: html) { return nil }
    
    candidates = extractIconHrefs(from: html).prefix(3).compactMap { resolveHref($0, base: base) }
  }
  
  candidates += faviconFallbackPaths.compactMap { URL(string: "\(base)\($0)") }
  
  guard let fileURL = faviconFileURL(projectId: projectId) else { return nil }
  
  for candidate in candidates {
    guard let (data, response) = try? await widgetSession.data(from: candidate),
          isRenderableImage(response), !data.isEmpty else {
      continue
    }
    
    // atomic: several widgets may refresh the same project at once
    if (try? data.write(to: fileURL, options: .atomic)) != nil {
      return fileURL.path
    }
  }
  
  return nil
}

/// Favicon path for a project, cached for a day. Pass the production domain when the caller
/// already has it (from `production-deployment`), otherwise it is fetched.
func fetchProjectFavicon(project: ProjectListItem, productionDomain: String? = nil) async -> String? {
  if let cached = cachedFaviconPath(projectId: project.id) { return cached }
  
  var host = productionDomain
  if host == nil {
    host = try? await fetchProductionDeployment(
      connection: project.connection,
      connectionTeam: project.connectionTeam,
      projectId: project.id
    ).domain?.name
  }
  
  guard let host, !host.isEmpty else { return nil }
  
  return await downloadWebsiteFavicon(host: host, projectId: project.id)
}
