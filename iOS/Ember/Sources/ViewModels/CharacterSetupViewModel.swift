import SwiftUI
import PhotosUI

enum APIProvider: String, CaseIterable {
    case novelai = "novelai"
    case mistral = "mistral"

    var displayName: String {
        switch self {
        case .novelai: return "NovelAI"
        case .mistral: return "Mistral"
        }
    }
}

@MainActor
class CharacterSetupViewModel: ObservableObject {
    @Published var name = ""
    @Published var relationship = ""
    @Published var personality = ""
    @Published var speechStyle = ""
    @Published var background = ""
    @Published var likes = ""
    @Published var dislikes = ""
    @Published var apiProvider: APIProvider = .novelai
    @Published var avatarImage: UIImage? = nil
    @Published var isLoading = false
    @Published var errorMessage: String? = nil

    var onSaved: (() -> Void)?

    var canSave: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty &&
        personality.count >= 10 &&
        speechStyle.count >= 10
    }

    func save() async {
        guard canSave else { return }
        isLoading = true
        errorMessage = nil
        do {
            let body = CreateCharacterBody(
                name: name.trimmingCharacters(in: .whitespaces),
                relationship: relationship.isEmpty ? nil : relationship,
                personality: personality,
                speechStyle: speechStyle,
                background: background.isEmpty ? nil : background,
                likes: likes.isEmpty ? nil : likes,
                dislikes: dislikes.isEmpty ? nil : dislikes,
                apiProvider: apiProvider.rawValue
            )
            let _: Character = try await APIClient.shared.post(.characters, body: body)
            onSaved?()
        } catch {
            errorMessage = (error as? AppError)?.localizedDescription ?? error.localizedDescription
        }
        isLoading = false
    }
}

struct CreateCharacterBody: Encodable {
    let name: String
    let relationship: String?
    let personality: String
    let speechStyle: String
    let background: String?
    let likes: String?
    let dislikes: String?
    let apiProvider: String
}