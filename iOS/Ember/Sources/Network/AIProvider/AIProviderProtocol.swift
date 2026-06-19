import Foundation

protocol AIProviderProtocol {
    func sendMessage(prompt: SystemPrompt) async throws -> String
}

struct SystemPrompt {
    let character: Character
    let recentMessages: [ChatMessage]
    let userMessage: String
}