import AppIntents

struct ProjectListItem: AppEntity, Decodable {
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

struct ProjectQuery: EntityQuery {
  func getSharedOptions() async throws -> [ProjectListItem] {
    var options: [ProjectListItem] = []
    
    setWidgetState(state: .loading)
    
    guard let sharedDefaults = UserDefaults(suiteName: appGroupName),
          let rawConnections = sharedDefaults.data(forKey: connectionsKey) else {
      setWidgetState(state: .apiFailed)
      
      return options
    }
    
    let connections = (try? JSONDecoder().decode([Connection].self, from: rawConnections)) ?? []
    
    for connection in connections {
      do {
        let connectionTeams = try await fetchConnectionTeams(connection: connection)
        
        for connectionTeam in connectionTeams.teams {
          let teamProjects = try await fetchTeamProjects(connection: connection, connectionTeam: connectionTeam)
          
          options.append(contentsOf: teamProjects.map { project in
            ProjectListItem(
              id: project.id,
              projectName: project.name,
              connection: connection,
              connectionTeam: connectionTeam
            )
          })
        }
      } catch {
        setWidgetState(state: .apiFailed)
        
        return options
      }
    }
    setWidgetState(state: options.isEmpty ? .noContainers : .hasContainers)
    
    return options
  }
  
  func entities(for identifiers: [ProjectListItem.ID]) async throws -> [ProjectListItem] {
    return try await getSharedOptions().filter { identifiers.contains($0.id) }
  }
  
  func suggestedEntities() async throws -> [ProjectListItem] {
    return try await getSharedOptions()
  }
  
  func defaultResult() async -> ProjectListItem? {
    return try? await suggestedEntities().first
  }
  
  private func setWidgetState(state: WidgetIntentState) {
    guard let sharedDefaults = UserDefaults(suiteName: appGroupName) else {
      return
    }
    
    sharedDefaults.set(state.rawValue, forKey: widgetStateKey)
  }
}
