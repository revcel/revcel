package expo.modules.widgetkit

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class Connection : Record {
    @Field
    var id: String? = null
    
    @Field
    var apiToken: String? = null
}
