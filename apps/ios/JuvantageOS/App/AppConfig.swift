import Foundation

enum AppConfig {
    /// Simulator / Mac → localhost. Physical iPhone → set `API_BASE_URL` in scheme or update LAN IP below.
    static var apiBaseURL: URL {
        if let override = ProcessInfo.processInfo.environment["API_BASE_URL"],
           let url = URL(string: override) {
            return url
        }
        #if targetEnvironment(simulator)
        return URL(string: "http://127.0.0.1:3001")!
        #else
        if ProcessInfo.processInfo.isiOSAppOnMac {
            return URL(string: "http://127.0.0.1:3001")!
        }
        // Real iPhone: Xcode scheme → Environment → API_BASE_URL = http://YOUR_MAC_LAN_IP:3001
        return URL(string: "http://127.0.0.1:3001")!
        #endif
    }
}
