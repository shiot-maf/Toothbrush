import SwiftUI

struct Character: Identifiable, Codable, Equatable {
    let id: UUID
    let name: String
    let relationship: String
    let personality: String
    let speechStyle: String
    let background: String?
    let likes: String?
    let dislikes: String?

    let intimacyScore: Int
    let currentStage: Int
    let stageName: String

    let currentPhase: RelationshipPhase?
    let phaseIntimacyScore: Int

    let currentMood: String?
    let recentStoryEvent: String?
    let lastMessageDate: Date
    let totalMessages: Int
    let createdDate: Date

    var intimacyProgress: Double { Double(intimacyScore) / 100.0 }
    var phaseProgress: Double { Double(phaseIntimacyScore) / 100.0 }

    var stageColor: Color {
        switch currentStage {
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