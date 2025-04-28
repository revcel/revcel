package expo.modules.widgetkit

import expo.modules.kotlin.records.Record

// todo: add config
class Config: Record {
    val baseUrl: String = "bar"
    val accessToken: String = "foo"
}