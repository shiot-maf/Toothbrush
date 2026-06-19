import Foundation

struct ChatMessage: Identifiable, Codable {
    let id: UUID
    let characterId: UUID
    let role: MessageRole
    let content: String
    let createdAt: Date
    let intimacyUpdate: IntimacyUpdate?

    enum MessageRole: String, Codable {
        case user
        case character
    }
}

struct IntimacyUpdate: Codable {
    let intimacyScore: Int
    let currentStage: Int
    let stageName: String
    let intimacyIncrement: Int
    let sentimentSignal: SentimentSignal
    let currentPhase: RelationshipPhase
    let phaseIntimacyScore: Int
    let phaseTransition: PhaseTransition?
}

struct PhaseTransition: Codable {
    let from: RelationshipPhase
    let to: RelationshipPhase
}

enum SentimentSignal: String, Codable {
    case positive
    case neutral
    case negative
}