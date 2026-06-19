import SwiftUI
import GoogleSignIn

@MainActor
class AuthManager: ObservableObject {
    static let shared = AuthManager()
    @Published var isAuthenticated: Bool

    private init() {
        isAuthenticated = KeychainManager.shared.retrieve(for: "accessToken") != nil
    }

    func markAuthenticated() { isAuthenticated = true }

    func signOut() {
        KeychainManager.shared.delete(for: "accessToken")
        KeychainManager.shared.delete(for: "refreshToken")
        GIDSignIn.sharedInstance.signOut()
        isAuthenticated = false
    }
}