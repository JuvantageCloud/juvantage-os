import AppKit
import Foundation

/// Calm launch: one hub window first; float + sheet only after the user finishes setup.
enum LaunchPolicy {
    private static let onboardKey = "juv_os_onboarding_v1"

    static var hasCompletedOnboarding: Bool {
        get { UserDefaults.standard.bool(forKey: onboardKey) }
        set { UserDefaults.standard.set(newValue, forKey: onboardKey) }
    }

    @MainActor
    static func finishOnboarding() {
        hasCompletedOnboarding = true
        AppRuntime.shared.installGlobalShortcuts()
        ShellController.shared.setupAgentPanel()
        hideHubWindows()
    }

    @MainActor
    static func hideHubWindows() {
        for window in NSApp.windows {
            let title = window.title.lowercased()
            if title.isEmpty || title.contains("juvantage") {
                if window.frame.width < 520, window.frame.height < 320 {
                    window.orderOut(nil)
                }
            }
        }
    }
}