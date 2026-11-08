import SwiftUI

/// Visible on launch so “Build Succeeded” isn’t invisible (agent is menu-bar + corner float).
struct LaunchHubView: View {
    @ObservedObject private var brain = BrainClient.shared

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Juvantage OS")
                .font(.title2.weight(.semibold))
            Text(brain.healthDetail)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("Look for the teal circle bottom-right of your screen, or use the ✨ icon in the menu bar.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 10) {
                Button("Open Desktop") {
                    ShellController.shared.openDesktop()
                }
                .keyboardShortcut(.defaultAction)
                Button("Quick sheet") {
                    ShellController.shared.toggleQuickSheet()
                }
                Button("Show agent") {
                    ShellController.shared.setupAgentPanel()
                }
            }
            .buttonStyle(.borderedProminent)
        }
        .padding(24)
        .frame(minWidth: 420, minHeight: 200)
        .background(Color(red: 0.96, green: 0.95, blue: 0.91))
        .task { await brain.refreshHealth() }
    }
}
