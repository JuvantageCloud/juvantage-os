import Foundation

enum BrainError: LocalizedError {
    case badURL
    case badResponse
    case http(Int, String)
    case unauthorized

    var errorDescription: String? {
        switch self {
        case .badURL: return "Invalid Brain URL"
        case .badResponse: return "Invalid response from Brain"
        case .http(let code, let body): return "Brain HTTP \(code): \(body.prefix(200))"
        case .unauthorized: return "Sign in required"
        }
    }
}

@MainActor
final class BrainClient: ObservableObject {
    static let shared = BrainClient()

    @Published private(set) var healthOK = false
    @Published private(set) var healthDetail = "Checking Brain…"
    @Published private(set) var userEmail: String?

    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    private let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 15
        config.timeoutIntervalForResource = 30
        config.waitsForConnectivity = false
        return URLSession(configuration: config)
    }()

    func refreshHealth() async {
        do {
            let h: HealthDTO = try await request(path: "/health", authed: false)
            healthOK = h.ok
            healthDetail = h.llmConfigured == true ? "\(h.service) · LLM ready" : "\(h.service) · demo LLM"
        } catch {
            healthOK = false
            healthDetail = error.localizedDescription
        }
    }

    func login(email: String, password: String) async throws {
        let body = try encoder.encode(["email": email, "password": password])
        let res: AuthResponseDTO = try await request(path: "/auth/login", method: "POST", body: body, authed: false)
        TokenStore.token = res.token
        userEmail = res.user.email
    }

    func logout() {
        TokenStore.token = nil
        userEmail = nil
    }

    func fetchLoops(limit: Int = 5) async throws -> [LoopDTO] {
        let res: LoopsResponseDTO = try await request(path: "/os/loops?limit=\(limit)")
        return res.loops
    }

    func googleOAuthStart() async throws -> GoogleOAuthStartDTO {
        try await request(path: "/os/oauth/google/start")
    }

    private func request<T: Decodable>(
        path: String,
        method: String = "GET",
        body: Data? = nil,
        authed: Bool = true
    ) async throws -> T {
        let data = try await rawRequest(path: path, method: method, body: body, authed: authed)
        return try decoder.decode(T.self, from: data)
    }

    private func rawRequest(
        path: String,
        method: String,
        body: Data?,
        authed: Bool
    ) async throws -> Data {
        let base = AppConfig.brainBaseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let url = URL(string: base + (path.hasPrefix("/") ? path : "/\(path)")) else {
            throw BrainError.badURL
        }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if authed, let token = TokenStore.token {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        req.httpBody = body

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else { throw BrainError.badResponse }
        if http.statusCode == 401 { throw BrainError.unauthorized }
        guard (200..<300).contains(http.statusCode) else {
            let text = String(data: data, encoding: .utf8) ?? ""
            throw BrainError.http(http.statusCode, text)
        }
        return data
    }
}
