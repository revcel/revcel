import expo.modules.widgetkit.Connection

val appGroupName: String = "group.com.revcel.mobile"
val connectionsKey: String = "revcel::connections"
val savedWidgetStateKey: String = "pourtainer::widgetState"

data class ConnectionTeamsResponse(
    val teams: Array<ConnectionTeam>
)

data class ConnectionTeam(
    val id: String,
    val name: String
)

data class ConnectionProject(
    val id: String,
    val name: String
)

data class ProjectListItem(
    val id: String,
    val projectName: String,
    val connection: Connection,
    val connectionTeam: ConnectionTeam
)

data class DeploymentResponse(
    val deployments: Array<Deployment>
)

data class Deployment(
    val uid: String
)

enum class WidgetIntentState(val value: Int) {
    LOADING(0),
    API_FAILED(1),
    HAS_PROJECTS(2),
    NO_PROJECTS(3)
}
