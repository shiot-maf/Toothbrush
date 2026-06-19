import SwiftUI

struct CTStageBadge: View {
    let stage: Int
    let stageName: String

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(stageColor)
                .frame(width: 8, height: 8)
            Text("Stage \(stage)")
                .font(.caption2.bold())
                .foregroundColor(stageColor)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .background(stageColor.opacity(0.1))
        .clipShape(Capsule())
    }

    private var stageColor: Color {
        switch stage {
        case 0: return .gray
        case 1: return .blue
        case 2: return .green
        case 3: return .orange
        case 4: return .pink
        case 5: return .red
        default: return .gray
        }
    }
}