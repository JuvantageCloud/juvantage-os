import Foundation
import SwiftUI

@MainActor
final class AppModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var user: UserDTO?
    @Published var isBootstrapping = true
    @Published var showOnboarding = false

    private let defaults = UserDefaults.standard

    init() {
        Task { await bootstrap() }
    }

    func bootstrap() async {
        defer { isBootstrapping = false }
        showOnboarding = !defaults.bool(forKey: "jv.onboardingDone")
        guard APIClient.shared.token != nil else {
            isAuthenticated = false
            return
        }
        do {
            user = try await APIClient.shared.me()
            isAuthenticated = true
        } catch {
            APIClient.shared.token = nil
            isAuthenticated = false
        }
    }

    func login(email: String, password: String) async throws {
        let res = try await APIClient.shared.login(email: email, password: password)
        user = res.user
        isAuthenticated = true
    }

    func completeOnboarding() {
        defaults.set(true, forKey: "jv.onboardingDone")
        showOnboarding = false
    }

    func signOut() {
        APIClient.shared.token = nil
        user = nil
        isAuthenticated = false
    }
}
