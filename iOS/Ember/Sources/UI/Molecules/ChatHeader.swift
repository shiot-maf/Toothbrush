import SwiftUI

struct ChatHeader: View {
    let character: Character
    var onBack: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button(action: onBack) {
                Image(systemName: "chevron.left")
                    .font(.headline)
                    .foregroundColor(.primary)
            }

            CTAvatar(name: character.name, size: 38)

            VStack(alignment: .leading, spacing: 2) {
                CTText(text: character.name, style: .headline)
                CTText(text: character.stageName, style: .caption, color: .secondary)
            }

            Spacer()

            CTProgressBar(value: character.intimacyProgress, color: character.stageColor)
                .frame(width: 80, height: 4)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color(.systemBackground))
        .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
    }
}