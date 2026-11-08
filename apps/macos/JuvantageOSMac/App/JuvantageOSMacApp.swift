import SwiftUI

@main
struct JuvantageOSMacApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var brain = BrainClient.shared

    var body: some Scene {
        WindowGroup {
            LaunchHubView()
        }
        .defaultSize(width: 440, height: 220)

        MenuBarExtra("Juvantage OS", systemImage: "sparkle") {
            VStack(alignment: .leading, spacing: 8) {
                Text(brain.healthDetail)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Button("Show agent") {
                    Task { @MainActor in ShellController.shared.setupAgentPanel() }
                }
                Button("Quick sheet") {
                    Task { @MainActor in ShellController.shared.toggleQuickSheet() }
                }
                Button("Open Desktop") {
                    Task { @MainActor in ShellController.shared.openDesktop() }
                }
                Divider()
                Button("Quit") { NSApplication.shared.terminate(nil) }
            }
            .padding(8)
        }

        Settings {
            Form {
                Text("Brain: \(AppConfig.brainBaseURL.absoluteString)")
                Text("Desktop UI: \(AppConfig.desktopWebURL.absoluteString)")
                Text("Native Swift shell · React wide UI in WebKit · logic in Brain")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .formStyle(.grouped)
            .frame(width: 420)
        }
    }
}
