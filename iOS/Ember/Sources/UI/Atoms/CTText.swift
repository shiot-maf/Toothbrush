import SwiftUI

struct CTText: View {
    enum Style { case title, headline, body, caption }
    let text: String
    let style: Style
    var color: Color = .primary

    var body: some View {
        Text(text)
            .font(font)
            .foregroundColor(color)
    }

    private var font: Font {
        switch style {
        case .title: return .title2.bold()
        case .headline: return .headline
        case .body: return .body
        case .caption: return .caption
        }
    }
}