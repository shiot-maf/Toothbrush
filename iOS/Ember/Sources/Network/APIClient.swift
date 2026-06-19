import Foundation

class APIClient {
    static let shared = APIClient()
    private let baseURL = "https://api.ember-app.com"
    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        d.dateDecodingStrategy = .iso8601
        return d
    }()
    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.keyEncodingStrategy = .convertToSnakeCase
        return e
    }()

    private init() {}

    func get<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
        try await request(endpoint: endpoint, method: "GET")
    }

    func post<B: Encodable, T: Decodable>(_ endpoint: Endpoint, body: B) async throws -> T {
        let data = try encoder.encode(body)
        return try await request(endpoint: endpoint, method: "POST", body: data)
    }

    func put<B: Encodable, T: Decodable>(_ endpoint: Endpoint, body: B) async throws -> T {
        let data = try encoder.encode(body)
        return try await request(endpoint: endpoint, method: "PUT", body: data)
    }

    func delete(_ endpoint: Endpoint) async throws {
        let _: EmptyResponse = try await request(endpoint: endpoint, method: "DELETE")
    }

    private func request<T: Decodable>(
        endpoint: Endpoint,
        method: String,
        body: Data? = nil,
        retries: Int = 3,
        isRefreshAttempt: Bool = false
    ) async throws -> T {
        guard let url = URL(string: baseURL + endpoint.path) else {
            throw AppError.networkError("?섎せ??URL")
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = KeychainManager.shared.retrieve(for: "accessToken") {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw AppError.networkError("?묐떟???놁뒿?덈떎")
        }

        switch http.statusCode {
        case 200...299:
            return try decoder.decode(T.self, from: data)
        case 401:
            if !isRefreshAttempt, let newToken = try? await refreshAccessToken() {
                KeychainManager.shared.save(token: newToken, for: "accessToken")
                return try await request(endpoint: endpoint, method: method, body: body,
                                         retries: 1, isRefreshAttempt: true)
            }
            await MainActor.run { AuthManager.shared.signOut() }
            throw AppError.unauthorized
        default:
            throw AppError.serverError(http.statusCode)
        }
    }

    private func refreshAccessToken() async throws -> String {
        guard let refreshToken = KeychainManager.shared.retrieve(for: "refreshToken") else {
            throw AppError.unauthorized
        }
        let body = RefreshTokenBody(refreshToken: refreshToken)
        let data = try encoder.encode(body)
        let response: RefreshResponse = try await request(
            endpoint: .refreshToken, method: "POST", body: data,
            retries: 1, isRefreshAttempt: true
        )
        if let newRefresh = response.refreshToken {
            KeychainManager.shared.save(token: newRefresh, for: "refreshToken")
        }
        return response.accessToken
    }

    private struct RefreshTokenBody: Encodable { let refreshToken: String }
    private struct RefreshResponse: Decodable { let accessToken: String; let refreshToken: String? }
    private struct EmptyResponse: Decodable {}
}