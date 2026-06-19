import SwiftUI

struct HomeScreen: View {
    @StateObject private var viewModel = HomeViewModel()
    @State private var showSetup = false
    @State private var selectedCharacter: Character? = nil

    var body: some View {
        NavigationView {
            Group {
                switch viewModel.state {
                case .idle, .loading:
                    ProgressView()
                case .success where viewModel.characters.isEmpty:
                    EmptyStateView(
                        title: "?꾩쭅 罹먮┃?곌? ?놁뼱??,
                        subtitle: "泥?踰덉㎏ AI ?뚰듃?덈? 留뚮뱾?대낫?몄슂",
                        actionTitle: "罹먮┃??留뚮뱾湲?
                    ) { showSetup = true }
                case .success:
                    characterList
                case .failure(let error):
                    EmptyStateView(title: "?ㅻ쪟", subtitle: error.localizedDescription)
                }
            }
            .navigationTitle("Ember")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showSetup = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .task { await viewModel.fetchCharacters() }
        .sheet(isPresented: $showSetup, onDismiss: { Task { await viewModel.fetchCharacters() } }) {
            CharacterSetupScreen()
        }
        .fullScreenCover(item: $selectedCharacter) { character in
            ChatRoomScreen(character: character)
        }
    }

    private var characterList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.characters) { character in
                    CharacterCard(character: character)
                        .onTapGesture { selectedCharacter = character }
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                Task { await viewModel.deleteCharacter(character) }
                            } label: {
                                Label("??젣", systemImage: "trash")
                            }
                        }
                }
            }
            .padding(16)
        }
    }
}