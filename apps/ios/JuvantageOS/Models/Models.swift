import Foundation

struct UserDTO: Codable, Identifiable {
    let id: String
    let name: String
    let email: String
    let businessCount: Int
}

struct AuthResponseDTO: Codable {
    let token: String
    let user: UserDTO
}

struct BusinessDTO: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let category: String
    let status: String
    let metricLabel: String
    let metricValue: String
    let metricDelta: Double?
    let timezone: String
    let currency: String
    let revenueToday: Double
    let openTasks: Int
}

struct CommandOverviewDTO: Codable {
    let greeting: String
    let systemsLive: Bool
    let revenueToday: Double
    let revenueDeltaPct: Double
    let openTasks: Int
    let mentions: Int
    let businesses: [BusinessDTO]
}

struct ConnectionDTO: Codable, Identifiable {
    let id: String
    let businessId: String?
    let provider: String
    let status: String
    let label: String
    let detail: String?
    let enabled: Bool
    let comingSoon: Bool
    let lastSyncAt: String?
}

struct ConnectionsResponseDTO: Codable {
    let connections: [ConnectionDTO]
    struct OAuth: Codable {
        let googleConfigured: Bool
        let instagramConfigured: Bool
    }
    let oauth: OAuth
}

struct AlertDTO: Codable, Identifiable {
    let id: String
    let businessId: String?
    let businessName: String?
    let severity: String
    let title: String
    let body: String?
    let labels: [String]
    let read: Bool?
    let createdAt: String
    let impactOrders: Int?
    let impactRevenue: Double?
}

struct AlertDetailDTO: Codable, Identifiable {
    let id: String
    let businessId: String?
    let businessName: String?
    let severity: String
    let title: String
    let body: String?
    let labels: [String]
    let read: Bool
    let createdAt: String
    let impactOrders: Int?
    let impactRevenue: Double?
    let recommendedActions: [RecommendedActionDTO]
}

struct RecommendedActionDTO: Codable, Identifiable {
    var id: String
    let label: String
    let detail: String
    let deeplink: String?
}

struct AgentDTO: Codable, Identifiable {
    let id: String
    let kind: String
    let name: String
    let statusLabel: String
    let activity: String
    let connected: Bool
    let updatedAt: String
}

struct AgentMetricDTO: Codable {
    let label: String
    let value: String
    let tone: String
    let hint: String?
}

struct AgentActionDTO: Codable, Identifiable {
    var id: String
    let label: String
    let style: String
    let deeplink: String?
}

struct AgentChatResponseDTO: Codable {
    let conversationId: String
    let messageId: String
    let role: String
    let content: String
    let title: String?
    let metrics: [AgentMetricDTO]
    let actions: [AgentActionDTO]
    let footer: String
}

struct SocialPostDTO: Codable, Identifiable {
    let id: String
    let businessId: String
    let businessName: String
    let platform: String
    let title: String
    let caption: String
    let views: Int
    let engagementDelta: Double
    let durationSec: Int?
    let likes: Int?
    let comments: Int?
    let shares: Int?
    let engagementRate: Double?
    let insight: String?
}

struct CalendarEventDTO: Codable, Identifiable {
    let id: String
    let businessId: String?
    let title: String
    let startsAt: String
    let endsAt: String
    let icon: String
}

struct CalendarResponseDTO: Codable {
    let syncedAt: String?
    let source: String
    let events: [CalendarEventDTO]
}

struct LiveActivityDTO: Codable, Identifiable {
    let id: String
    let kind: String
    let title: String
    let detail: String?
    let createdAt: String
}

struct BusinessDetailDTO: Codable, Identifiable {
    let id: String
    let name: String
    let category: String
    let status: String
    let metricLabel: String
    let metricValue: String
    let metricDelta: Double?
    let timezone: String
    let currency: String
    let revenueToday: Double
    let openTasks: Int
    let liveActivity: [LiveActivityDTO]
    let performance: [PerfPointDTO]
}

struct PerfPointDTO: Codable {
    let t: String
    let v: Double
}

struct CursorBridgeDTO: Codable {
    let connected: Bool
    let agentsAvailable: Int
    let statusText: String
    let detail: String
    let permissions: [CursorPermissionDTO]
    let allowProposeActions: Bool
    let securityNote: String
    let stub: Bool
    let v2Note: String
}

struct CursorPermissionDTO: Codable, Identifiable {
    var id: String { agent }
    let agent: String
    let access: String
}

struct ChatMessage: Identifiable {
    let id: String
    let role: String
    let content: String
    let title: String?
    let metrics: [AgentMetricDTO]
    let actions: [AgentActionDTO]
    let footer: String?
}
