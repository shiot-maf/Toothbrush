import Foundation

@MainActor
class ChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var inputText = ""
    @Published var isLoading = false
    @Published var character: Character
    @Published var errorMessage: String? = nil

    init(character: Character) {
        self.character = character
    }

    func sendMessage() async {
        let text = inputText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty, !isLoading else { return }
        inputText = ""
        isLoading = true

        let userMessage = ChatMessage(
            id: UUID(), characterId: character.id,
            role: .user, content: text,
            createdAt: Date(), intimacyUpdate: nil
        )
        messages.append(userMessage)

        do {
            let body = SendMessageBody(content: text)
            let response: MessageResponse = try await APIClient.shared.post(.messages(character.id), body: body)
            messages.append(response.characterMessage)
            if let update = response.character {
                updateCharacterFromResponse(update)
            }
        } catch {
            errorMessage = (error as? AppError)?.localizedDescription ?? error.localizedDescription
            messages.removeLast()
            inputText = text
        }
        isLoading = false
    }

    private func updateCharacterFromResponse(_ update: IntimacyUpdate) {
        character = Character(
            id: character.id, name: character.name,
            relationship: character.relationship, personality: character.personality,
            speechStyle: character.speechStyle, background: character.background,
            likes: character.likes, dislikes: character.dislikes,
            intimacyScore: update.intimacyScore, currentStage: update.currentStage,
            stageName: update.stageName, currentPhase: update.currentPhase,
            phaseIntimacyScore: update.phaseIntimacyScore,
            currentMood: character.currentMood, recentStoryEvent: character.recentStoryEvent,
            lastMessageDate: Date(), totalMessages: character.totalMessages + 1,
            createdDate: character.createdDate
        )
        if let transition = update.phaseTransition {
            NotificationManager.shared.schedulePhaseTransitionNotification(
                characterName: character.name, phase: transition.to
            )
        }
    }
}

struct SendMessageBody: Encodable { let content: String }
struct MessageResponse: Decodable {
    let characterMessage: ChatMessage
    let character: IntimacyUpdate?
}