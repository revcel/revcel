import AppIntents

struct ProjectListItem: AppEntity, Codable {
  static var defaultQuery = ProjectQuery()
  static var typeDisplayRepresentation: TypeDisplayRepresentation = "Select Project"
  
  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(projectName)")
  }
  
  let id: String
  let projectName: String
  let connection: Connection
  let connectionTeam: ConnectionTeam
}

private let projectEntitiesCacheKey = "revcel::projectEntities"

struct ProjectQuery: EntityQuery {
  /// WidgetKit persists only entity identifiers and re-resolves them through this method before
  /// every timeline reload, so it must not crawl the API: it answers from the cache written by the
  /// last successful load and only hits the network for identifiers it does not know.
  func entities(for identifiers: [ProjectListItem.ID]) async throws -> [ProjectListItem] {
    var byId = Dictionary(loadCachedProjects().map { ($0.id, $0) }, uniquingKeysWith: { first, _ in first })
    
    if identifiers.contains(where: { byId[$0] == nil }) {
      for project in await loadProjects() where byId[project.id] == nil {
        byId[project.id] = project
      }
    }
    
    return identifiers.compactMap { byId[$0] }
  }
  
  func suggestedEntities() async throws -> [ProjectListItem] {
    let projects = await loadProjects()
    
    // offline picker still shows what was seen last time
    return projects.isEmpty ? loadCachedProjects() : projects
  }
  
  func defaultResult() async -> ProjectListItem? {
    return try? await suggestedEntities().first
  }
  
  // MARK: - Loading
  
  private func currentConnections() -> [Connection] {
    guard let sharedDefaults = UserDefaults(suiteName: appGroupName),
          let rawConnections = sharedDefaults.data(forKey: connectionsKey) else {
      return []
    }
    
    return (try? JSONDecoder().decode([Connection].self, from: rawConnections)) ?? []
  }
  
  /// All projects of all connections. Connections and their teams are fetched in parallel, and one
  /// failing connection does not hide the projects of the others.
  private func loadProjects() async -> [ProjectListItem] {
    setWidgetState(state: .loading)
    
    let connections = currentConnections()
    
    guard !connections.isEmpty else {
      setWidgetState(state: .apiFailed)
      return []
    }
    
    var options: [ProjectListItem] = []
    var failedConnections = 0
    
    await withTaskGroup(of: [ProjectListItem]?.self) { group in
      for connection in connections {
        group.addTask { await loadProjects(for: connection) }
      }
      
      for await result in group {
        if let result {
          options += result
        } else {
          failedConnections += 1
        }
      }
    }
    
    // stable order for the picker; a team reachable through two connections shows up once
    var seen = Set<String>()
    options = options
      .filter { seen.insert($0.id).inserted }
      .sorted { $0.projectName.localizedCaseInsensitiveCompare($1.projectName) == .orderedAscending }
    
    if options.isEmpty {
      setWidgetState(state: failedConnections == connections.count ? .apiFailed : .noContainers)
    } else {
      setWidgetState(state: .hasContainers)
      saveCachedProjects(options)
    }
    
    return options
  }
  
  private func loadProjects(for connection: Connection) async -> [ProjectListItem]? {
    guard let teams = try? await fetchConnectionTeams(connection: connection).teams else {
      return nil
    }
    
    return await withTaskGroup(of: [ProjectListItem].self) { group in
      for team in teams {
        group.addTask {
          let projects = (try? await fetchTeamProjects(connection: connection, connectionTeam: team)) ?? []
          
          return projects.map { project in
            ProjectListItem(id: project.id, projectName: project.name, connection: connection, connectionTeam: team)
          }
        }
      }
      
      var all: [ProjectListItem] = []
      for await projects in group {
        all += projects
      }
      return all
    }
  }
  
  // MARK: - Cache
  
  /// Entities from the last successful load, minus those of connections removed in the app since.
  private func loadCachedProjects() -> [ProjectListItem] {
    guard let sharedDefaults = UserDefaults(suiteName: appGroupName),
          let data = sharedDefaults.data(forKey: projectEntitiesCacheKey),
          let cached = try? JSONDecoder().decode([ProjectListItem].self, from: data) else {
      return []
    }
    
    let connectionIds = Set(currentConnections().map { $0.id })
    
    return cached.filter { connectionIds.contains($0.connection.id) }
  }
  
  private func saveCachedProjects(_ projects: [ProjectListItem]) {
    guard let sharedDefaults = UserDefaults(suiteName: appGroupName),
          let data = try? JSONEncoder().encode(projects) else {
      return
    }
    
    sharedDefaults.set(data, forKey: projectEntitiesCacheKey)
  }
  
  private func setWidgetState(state: WidgetIntentState) {
    guard let sharedDefaults = UserDefaults(suiteName: appGroupName) else {
      return
    }
    
    sharedDefaults.set(state.rawValue, forKey: widgetStateKey)
  }
}
