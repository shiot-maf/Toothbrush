import Foundation

enum Endpoint {
    case googleLogin
    case refreshToken
    case characters
    case character(UUID)
    case messages(UUID)
    case phase(UUID)

    var path: String {
        switch self {
        case .googleLogin: return "/auth/google"
        case .refreshToken: return "/auth/refresh-token"
        case .characters: return "/characters"
        case .character(let id): return "/characters/\(id)"
        case .messages(let id): return "/characters/\(id)/messages"
        case .phase(let id): return "/characters/\(id)/phase"
        }
    }
}