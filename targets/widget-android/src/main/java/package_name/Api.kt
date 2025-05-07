package com.revcel.mobile

import AnalyticsEnabledResponse
import AnalyticsQuickStatsResponse
import AnalyticsTimeseriesResponse
import ConnectionTeam
import ConnectionTeamsResponse
import ConnectionProject
import DeploymentResponse
import FirewallMetricsRequest
import FirewallMetricsResponse
import com.google.gson.Gson
import expo.modules.widgetkit.Connection

suspend fun fetchConnectionTeams(connection: Connection): ConnectionTeamsResponse {
    val params = FetchParams(
        method = HTTPMethod.GET,
        url =  "/teams",
        connection = connection
    )

    return httpRequest(params)
}

suspend fun fetchTeamProjects(connection: Connection, connectionTeam: ConnectionTeam): Array<ConnectionProject> {
    val params = FetchParams(
        method = HTTPMethod.GET,
        url =  "/projects?teamId=${connectionTeam.id}&latestDeployments=5",
        connection = connection
    )

    return httpRequest(params)
}

suspend fun fetchLatestDeployment(connection: Connection, projectId: String): DeploymentResponse {
    val params = FetchParams(
        method = HTTPMethod.GET,
        url = "/v6/deployments?projectId=${projectId}&state=READY&limit=1",
        connection = connection
    )

    return httpRequest(params)
}

suspend fun fetchProjectFirewallMetrics(connection: Connection, connectionTeam: ConnectionTeam, firewallMetricsRequestData: FirewallMetricsRequest): FirewallMetricsResponse {
    val params = FetchParams(
        method = HTTPMethod.POST,
        url = "/observability/metrics?ownerId=${connectionTeam.id}",
        connection = connection,
        body = Gson().toJson(firewallMetricsRequestData)
    )

    return httpRequest(params)
}

suspend fun fetchProjectAnalyticsAvailability(connection: Connection, connectionTeam: ConnectionTeam, projectId: String): AnalyticsEnabledResponse {
    val params = FetchParams(
        method = HTTPMethod.GET,
        url = "/v1/web/insights/enabled?projectId=${projectId}&teamId=${connectionTeam.id}",
        connection = connection,
        baseUrl = "https://vercel.com/api"
    )

    return httpRequest(params)
}

suspend fun fetchProjectTotalVisitors(connection: Connection, connectionTeam: ConnectionTeam, projectId: String, from: String, to: String): AnalyticsQuickStatsResponse {
    val params = FetchParams(
        method = HTTPMethod.GET,
        url = "/web-analytics/overview?environment=production&filter%7B%7D&from=${from}&projectId=${projectId}&teamId=${connectionTeam.id}&to=${to}",
        connection = connection,
        baseUrl = "https://vercel.com/api"
    )

    return httpRequest(params)
}

suspend fun fetchProjectAnalyticsTimeseries(connection: Connection, connectionTeam: ConnectionTeam, projectId: String, from: String, to: String): AnalyticsTimeseriesResponse {
    val params = FetchParams(
        method = HTTPMethod.GET,
        url = "/web-analytics/timeseries?environment=production&filter=%7B%7D&from=${from}&projectId=${projectId}&teamId=${connectionTeam.id}&to=${to}",
        connection = connection,
        baseUrl = "https://vercel.com/api"
    )

    return httpRequest(params)
}
