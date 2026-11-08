import Foundation

enum APIError: LocalizedError {
    case invalidResponse
    case server(String)
    case unauthorized

    var errorDescription: String? {
        switch self {
        case .invalidResponse: return "Invalid server response"
        case .server(let m): return m
        case .unauthorized: return "Please sign in again"
        }
    }
}

final class APIClient {
    static let shared = APIClient()

    private let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 15
        config.timeoutIntervalForResource = 30
        config.waitsForConnectivity = false
        return URLSession(configuration: config)
    }()

    var token: String? {
        get { UserDefaults.standard.string(forKey: "jv.token") }
        set { UserDefaults.standard.set(newValue, forKey: "jv.token") }
    }

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        return d
    }()

    private let encoder = JSONEncoder()

    func login(email: String, password: String) async throws -> AuthResponseDTO {
        let body = try encoder.encode(["email": email, "password": password])
        let res: AuthResponseDTO = try await request(
            path: "/auth/login",
            method: "POST",
            body: body,
            authed: false
        )
        token = res.token
        return res
    }

    func me() async throws -> UserDTO {
        try await request(path: "/auth/me")
    }

    func command() async throws -> CommandOverviewDTO {
        try await request(path: "/businesses/command")
    }

    func businesses() async throws -> [BusinessDTO] {
        try await request(path: "/businesses")
    }

    func business(id: String) async throws -> BusinessDetailDTO {
        try await request(path: "/businesses/\(id)")
    }

    func createBusiness(name: String, category: String, timezone: String, currency: String,
                        connectInstagram: Bool, connectTiktok: Bool, connectCalendar: Bool) async throws -> BusinessDTO {
        struct Body: Encodable {
            let name: String
            let category: String
            let timezone: String
            let currency: String
            let connectInstagram: Bool
            let connectTiktok: Bool
            let connectCalendar: Bool
        }
        let data = try encoder.encode(Body(
            name: name, category: category, timezone: timezone, currency: currency,
            connectInstagram: connectInstagram, connectTiktok: connectTiktok, connectCalendar: connectCalendar
        ))
        return try await request(path: "/businesses", method: "POST", body: data)
    }

    func connections(businessId: String? = nil) async throws -> ConnectionsResponseDTO {
        var path = "/connections"
        if let businessId { path += "?businessId=\(businessId)" }
        return try await request(path: path)
    }

    func toggleConnection(id: String, enabled: Bool) async throws {
        let data = try encoder.encode(["enabled": enabled])
        try await requestVoid(path: "/connections/\(id)", method: "PATCH", body: data)
    }

    func connectDemo(businessId: String, provider: String) async throws {
        struct Body: Encodable { let businessId: String; let provider: String }
        let data = try encoder.encode(Body(businessId: businessId, provider: provider))
        try await requestVoid(path: "/connections/demo", method: "POST", body: data)
    }

    func alerts(severity: String = "all") async throws -> [AlertDTO] {
        try await request(path: "/alerts?severity=\(severity)")
    }

    func alert(id: String) async throws -> AlertDetailDTO {
        try await request(path: "/alerts/\(id)")
    }

    func markAlertsRead() async throws {
        struct Ok: Codable { let ok: Bool }
        let _: Ok = try await request(path: "/alerts/mark-all-read", method: "POST", body: Data("{}".utf8))
    }

    func agents() async throws -> [AgentDTO] {
        try await request(path: "/agents")
    }

    func cursorBridge() async throws -> CursorBridgeDTO {
        try await request(path: "/agents/cursor-bridge")
    }

    func chat(message: String, businessId: String? = nil, conversationId: String? = nil) async throws -> AgentChatResponseDTO {
        struct Body: Encodable {
            let message: String
            let businessId: String?
            let conversationId: String?
        }
        let data = try encoder.encode(Body(message: message, businessId: businessId, conversationId: conversationId))
        return try await request(path: "/agents/chat", method: "POST", body: data)
    }

    func social(platform: String = "all") async throws -> [SocialPostDTO] {
        try await request(path: "/social?platform=\(platform)")
    }

    func socialPost(id: String) async throws -> SocialPostDTO {
        try await request(path: "/social/\(id)")
    }

    func calendar() async throws -> CalendarResponseDTO {
        try await request(path: "/calendar")
    }

    private func requestVoid(
        path: String,
        method: String = "GET",
        body: Data? = nil,
        authed: Bool = true
    ) async throws {
        _ = try await rawRequest(path: path, method: method, body: body, authed: authed)
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
        let urlString = AppConfig.apiBaseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
            + (path.hasPrefix("/") ? path : "/" + path)
        guard let url = URL(string: urlString) else { throw APIError.invalidResponse }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if authed, let token {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        req.httpBody = body

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }
        if http.statusCode == 401 { throw APIError.unauthorized }
        guard (200..<300).contains(http.statusCode) else {
            if let err = try? JSONDecoder().decode([String: String].self, from: data),
               let message = err["error"] {
                throw APIError.server(message)
            }
            throw APIError.server("HTTP \(http.statusCode)")
        }
        return data
    }
}
