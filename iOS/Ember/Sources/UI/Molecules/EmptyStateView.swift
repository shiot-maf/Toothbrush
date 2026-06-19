import SwiftUI

struct EmptyStateView: View {
    let title: String
    let subtitle: String
    var actionTitle: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "heart.circle")
                .font(.system(size: 60))
                .foregroundColor(.purple.opacity(0.5))

            CTText(text: title, style: .headline)
            CTText(text: subtitle, style: .body, color: .secondary)

            if let actionTitle, let action {
                CTButton(title: actionTitle, action: action)
                    .frame(maxWidth: 200)
            }
        }
        .padding(32)
    }
}