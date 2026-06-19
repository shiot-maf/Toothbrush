import Foundation

enum AppError: LocalizedError {
    case networkError(String)
    case serverError(Int)
    case unauthorized
    case invalidData
    case unknown(Error)

    var errorDescription: String? {
        switch self {
        case .networkError(let msg): return "?ㅽ듃?뚰겕 ?ㅻ쪟: \(msg)"
        case .serverError(let code): return "?쒕쾭 ?ㅻ쪟 (\(code))"
        case .unauthorized: return "?몄쬆???꾩슂?⑸땲??
        case .invalidData: return "?곗씠?곕? 泥섎━?????놁뒿?덈떎"
        case .unknown(let err): return err.localizedDescription
        }
    }
}