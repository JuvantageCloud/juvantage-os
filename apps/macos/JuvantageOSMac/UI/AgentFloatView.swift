import SwiftUI

/// Corner agent presence. Desktop uses Lottie (`mascot-idle-loop.json`); Mac float uses
/// the same teal language + idle bob until `lottie-ios` is wired into this target.
struct AgentFloatView: View {
    var onTap: () -> Void

    @State private var bob = false

    var body: some View {
        Button(action: onTap) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(red: 0.12, green: 0.48, blue: 0.44),
                                Color(red: 0.08, green: 0.35, blue: 0.32),
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .shadow(color: .black.opacity(0.25), radius: 8, y: 4)
                Circle()
                    .strokeBorder(Color.white.opacity(0.35), lineWidth: 1)
                Image(systemName: "sparkles")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.95))
                    .symbolEffect(.pulse, options: .repeating, value: bob)
            }
            .frame(width: 56, height: 56)
            .offset(y: bob ? -3 : 3)
            .animation(
                .easeInOut(duration: 1.6).repeatForever(autoreverses: true),
                value: bob
            )
        }
        .buttonStyle(.plain)
        .help("Juvantage OS — click for Quick sheet · hold fn to talk")
        .onAppear { bob = true }
        .accessibilityLabel("Juvantage agent")
    }
}
