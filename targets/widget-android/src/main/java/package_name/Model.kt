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

data class FirewallMetricsResponse(
    val summary: Array<FirewallMetricsSummary>
)

data class FirewallMetricsSummary(
    val wafRuleId: String,
    val wafAction: String,
    val value: Int
)

data class FirewallMetricsGranularity(
    val minutes: Int
)

data class FirewallMetricsScope(
    val type: String,
    val ownerId: String,
    val projectIds: Array<String>
)

data class FirewallMetricsRollups(
    val value: FirewallMetricsValue
)

data class FirewallMetricsValue(
    val measure: String,
    val aggregation: String
)

data class FirewallMetricsRequest(
    val event: String,
    val reason: String,
    val rollups: FirewallMetricsRollups,
    val granularity: FirewallMetricsGranularity,
    val groupBy: Array<String>,
    val limit: Int,
    val tailRollup: String,
    val summaryOnly: Boolean,
    val startTime: String,
    val endTime: String,
    val scope: FirewallMetricsScope
)

data class FirewallWidgetData(
    val allowed: Int? = null,
    val denied: Int? = null,
    val challenged: Int? = null
)

enum class WidgetIntentState(val value: Int) {
    LOADING(0),
    API_FAILED(1),
    HAS_PROJECTS(2),
    NO_PROJECTS(3)
}
