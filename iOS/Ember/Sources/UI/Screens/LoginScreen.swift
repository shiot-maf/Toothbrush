import SwiftUI

struct LoginScreen: View {
    @StateObject private var viewModel = AuthViewModel()

    var body: some View {
        ZStack {
            LinearGradient(colors: [Color.purple.opacity(0.15), Color.pink.opacity(0.1)],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()

            VStack(spacing: 40) {
                Spacer()

                VStack(spacing: 16) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 70))
                        .foregroundStyle(LinearGradient(colors: [.orange, .red],
                                                        startPoint: .top, endPoint: .bottom))

                    Text("Ember")
                        .font(.largeTitle.bold())

                    Text("?섎쭔??AI ?뚰듃?덉?\n?밸퀎???댁빞湲곕? ?쒖옉?섏꽭??)
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }

                Spacer()

                VStack(spacing: 12) {
                    Button(action: { Task { await signIn() } }) {
                        HStack(spacing: 10) {
                            Image(systemName: "g.circle.fill")
                                .font(.title3)
                            Text("Google濡?怨꾩냽?섍린")
                                .font(.headline)
                        }
                        .foregroundColor(.black)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .shadow(color: .black.opacity(0.1), radius: 6)
                    }
                    .disabled(viewModel.isLoading)

                    if let error = viewModel.errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 50)
            }

            if viewModel.isLoading {
                Color.black.opacity(0.2).ignoresSafeArea()
                ProgressView()
                    .scaleEffect(1.5)
                    .tint(.white)
            }
        }
    }

    private func signIn() async {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let root = scene.windows.first?.rootViewController else { return }
        await viewModel.signInWithGoogle(presenting: root)
    }
}