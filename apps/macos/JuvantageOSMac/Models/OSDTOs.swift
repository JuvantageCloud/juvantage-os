import Foundation

struct HealthDTO: Decodable {
    let ok: Bool
    let service: String
    let llmConfigured: Bool?
}

struct AuthResponseDTO: Decodable {
    let token: String
    let user: UserDTO
}

struct UserDTO: Decodable {
    let id: String
    let email: String
    let name: String
}

struct LoopsResponseDTO: Decodable {
    let loops: [LoopDTO]
}

struct LoopDTO: Decodable, Identifiable {
    let id: String
    let title: String
    let band: String
    let kind: String
    let status: String
}

struct GoogleOAuthStartDTO: Decodable {
    let mode: String
    let authUrl: String?
    let message: String?
}
