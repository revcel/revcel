import Foundation
import SwiftUI

struct SubscriptionRequiredView: View {
   var body: some View {
        VStack(spacing: 12) {
            Image("AppIconImage")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 50.0, height: 50.0)
                .clipShape(Circle())
            
          	Text("Subscription missing, tap here to enable")
                .font(.system(size: 18.0, weight: .bold))
                .foregroundStyle(Color("gray1000"))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
    }
}
