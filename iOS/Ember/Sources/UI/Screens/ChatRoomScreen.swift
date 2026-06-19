import SwiftUI

struct ChatRoomScreen: View {
    @StateObject private var viewModel: ChatViewModel
    @Environment(\.dismiss) private var dismiss

    init(character: Character) {
        _viewModel = StateObject(wrappedValue: ChatViewModel(character: character))
    }

    var body: some View {
        VStack(spacing: 0) {
            ChatHeader(character: viewModel.character) { dismiss() }

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 10) {
                        ForEach(viewModel.messages) { message in
                            ChatBubble(message: message)
                                .id(message.id)
                        }
                        if viewModel.isLoading {
                            HStack {
                                ProgressView()
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 10)
                                    .background(Color(.systemGray6))
                                    .clipShape(RoundedRectangle(cornerRadius: 18))
                                Spacer(minLength: 60)
                            }
                        }
                    }
                    .padding(16)
                }
                .onChange(of: viewModel.messages.count) { _ in
                    if let last = viewModel.messages.last {
                        withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                    }
                }
            }

            if let error = viewModel.errorMessage {
                Text(error).font(.caption).foregroundColor(.red).padding(.horizontal)
            }

            inputBar
        }
        .ignoresSafeArea(edges: .bottom)
        .navigationBarHidden(true)
    }

    private var inputBar: some View {
        HStack(spacing: 10) {
            TextField("硫붿떆吏 ?낅젰...", text: $viewModel.inputText, axis: .vertical)
                .lineLimit(1...4)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 20))

            Button(action: { Task { await viewModel.sendMessage() } }) {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 32))
                    .foregroundColor(viewModel.inputText.isEmpty ? .gray : .purple)
            }
            .disabled(viewModel.inputText.isEmpty || viewModel.isLoading)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color(.systemBackground))
        .shadow(color: .black.opacity(0.05), radius: 4, y: -2)
    }
}