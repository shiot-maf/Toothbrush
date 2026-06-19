import SwiftUI

struct CharacterCard: View {
    let character: Character

    var body: some View {
        HStack(spacing: 14) {
            CTAvatar(name: character.name, size: 56)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    CTText(text: character.name, style: .headline)
                    Spacer()
                    CTStageBadge(stage: character.currentStage, stageName: character.stageName)
                }

                CTText(text: character.relationship, style: .caption, color: .secondary)

                CTProgressBar(value: character.intimacyProgress, color: character.stageColor)
                    .frame(height: 4)

                HStack {
                    CTText(text: "移쒕???\(character.intimacyScore)", style: .caption, color: .secondary)
                    Spacer()
                    if let phase = character.currentPhase, phase != .normal {
                        CTBadge(text: phase.displayName, color: .orange)
                    }
                }
            }
        }
        .padding(14)
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 2)
    }
}