import Foundation
import SwiftUI

struct SubscriptionRequiredView: View {
  var body: some View {
    HStack {
      Text("Subscription missing, tap here to enable")
        .font(.system(size: 18.0, weight: .bold))
        .foregroundStyle(Color("gray1000"))
        .multilineTextAlignment(.center)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
  }
}
