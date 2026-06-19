import Foundation

@MainActor
class HomeViewModel: ObservableObject {
    @Published var characters: [Character] = []
    @Published var state: ViewState<[Character]> = .idle

    func fetchCharacters() async {
        state = .loading
        do {
            let fetched: [Character] = try await APIClient.shared.get(.characters)
            characters = fetched
            state = .success(fetched)
        } catch {
            state = .failure(error as? AppError ?? .unknown(error))
        }
    }

    func deleteCharacter(_ character: Character) async {
        do {
            try await APIClient.shared.delete(.character(character.id))
            characters.removeAll { $0.id == character.id }
        } catch {
            state = .failure(error as? AppError ?? .unknown(error))
        }
    }
}