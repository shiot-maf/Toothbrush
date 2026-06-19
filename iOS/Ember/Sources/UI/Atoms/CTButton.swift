import SwiftUI

struct CTButton: View {
    let title: String
    var style: Style = .primary
    let action: () -> Void

    enum Style { case primary, secondary, destructive }

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.headline)
                .foregroundColor(foregroundColor)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(backgroundColor)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private var backgroundColor: Color {
        switch style {
        case .primary: return .purple
        case .secondary: return .gray.opacity(0.15)
        case .destructive: return .red
        }
    }

    private var foregroundColor: Color {
        switch style {
        case .primary: return .white
        case .secondary: return .primary
        case .destructive: return .white
        }
    }
}