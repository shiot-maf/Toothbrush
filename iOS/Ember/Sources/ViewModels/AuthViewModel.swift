import SwiftUI
import GoogleSignIn

@MainActor
class AuthViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var errorMessage: String? = nil

    func signInWithGoogle(presenting: UIViewController) async {
        isLoading = true
        errorMessage = nil
        do {
            let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: presenting)
            guard let idToken = result.user.idToken?.tokenString else {
                throw AppError.invalidData
            }
            let body = GoogleLoginBody(idToken: idToken)
            let response: AuthResponse = try await APIClient.shared.post(.googleLogin, body: body)
            KeychainManager.shared.save(token: response.accessToken, for: "accessToken")
            KeychainManager.shared.save(token: response.refreshToken, for: "refreshToken")
            AuthManager.shared.markAuthenticated()
        } catch {
            errorMessage = (error as? AppError)?.localizedDescription ?? error.localizedDescription
        }
        isLoading = false
    }
}

struct GoogleLoginBody: Encodable { let idToken: String }
struct AuthResponse: Decodable {
    let accessToken: String
    let refreshToken: String
    let user: AuthUser
}
struct AuthUser: Decodable { let id: UUID; let email: String; let name: String? }