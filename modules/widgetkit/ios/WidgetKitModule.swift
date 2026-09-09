import ExpoModulesCore
import WidgetKit

public class WidgetKitModule: Module {
    let _groupName: String = "group.com.revcel.mobile"
    let _connectionsKey: String = "revcel::connections"
    let _isSubscribedKey: String = "revcel::subscribed"
    let _projectEntitiesKey: String = "revcel::projectEntities"
    
    private func getConnections() -> [Connection] {
        guard let sharedDefaults = UserDefaults(suiteName: _groupName),
              let rawExistingConnections = sharedDefaults.data(forKey: _connectionsKey) else { return [] }
        
        return (try? JSONDecoder().decode([Connection].self, from: rawExistingConnections)) ?? []
    }
    
    private func reloadWidgets() {
        if #available(iOS 16.0, *) {
            WidgetCenter.shared.invalidateConfigurationRecommendations()
        }
        
        WidgetCenter.shared.reloadAllTimelines()
    }

    /// Writes the list and reloads the widgets only when the payload changed.
    private func saveConnections(_ connections: [Connection]) throws {
        guard let sharedDefaults = UserDefaults(suiteName: _groupName) else { return }

        let encodedConnections = try JSONEncoder().encode(connections)

        if sharedDefaults.data(forKey: _connectionsKey) == encodedConnections {
            return
        }

        sharedDefaults.set(encodedConnections, forKey: _connectionsKey)
        self.reloadWidgets()
    }
    
    public func definition() -> ModuleDefinition {
        Name("RevcelWidgetKit")
        
        Function("setIsSubscribed") { (isSubscribed: Bool) -> Void in
            guard let sharedDefaults = UserDefaults(suiteName: _groupName) else { return }

            if sharedDefaults.object(forKey: _isSubscribedKey) != nil,
               sharedDefaults.bool(forKey: _isSubscribedKey) == isSubscribed {
                return
            }
            
            sharedDefaults.set(isSubscribed, forKey: _isSubscribedKey)
            
            self.reloadWidgets()
        }
        
        Function("addConnection") { (connection: Connection) -> Void in
            var connections = self.getConnections()

            if let index = connections.firstIndex(where: { $0.id == connection.id }) {
                connections[index] = connection
            } else {
                connections.append(connection)
            }

            try? self.saveConnections(connections)
        }
        
        Function("removeConnection") { (id: String) in
            try? self.saveConnections(self.getConnections().filter { $0.id != id })
        }
        
        Function("clearAllConnections") {
            guard let sharedDefaults = UserDefaults(suiteName: _groupName) else {
                return
            }
            
            // only the connections: wiping the whole suite also dropped the subscription flag
            sharedDefaults.removeObject(forKey: _connectionsKey)
            sharedDefaults.removeObject(forKey: _projectEntitiesKey)
            
            self.reloadWidgets()
        }
    }
}
