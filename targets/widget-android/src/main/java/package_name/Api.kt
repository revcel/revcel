package com.revcel.mobile

import ConnectionTeam
import ConnectionTeamsResponse
import ConnectionProject
import DeploymentResponse
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
