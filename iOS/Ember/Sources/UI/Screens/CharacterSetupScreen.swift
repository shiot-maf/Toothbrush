import SwiftUI

struct CharacterSetupScreen: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = CharacterSetupViewModel()

    var body: some View {
        NavigationView {
            CharacterSetupForm(viewModel: viewModel)
                .navigationTitle("罹먮┃??異붽?")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("痍⑥냼") { dismiss() }
                    }
                    ToolbarItem(placement: .navigationBarTrailing) {
                        if viewModel.isLoading { ProgressView() }
                    }
                }
                .alert("?ㅻ쪟", isPresented: Binding(
                    get: { viewModel.errorMessage != nil },
                    set: { if !$0 { viewModel.errorMessage = nil } }
                )) {
                    Button("?뺤씤", role: .cancel) {}
                } message: {
                    Text(viewModel.errorMessage ?? "")
                }
        }
        .onAppear {
            viewModel.onSaved = { dismiss() }
        }
    }
}