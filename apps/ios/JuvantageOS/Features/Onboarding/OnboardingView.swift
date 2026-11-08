import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var appModel: AppModel
    @State private var connecting: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Spacer()
                Button("Skip") { appModel.completeOnboarding() }
                    .foregroundStyle(JVTheme.teal)
            }
            .padding()

            Text("Connect what runs your business")
                .font(JVTheme.title)
                .foregroundStyle(JVTheme.ink)
                .padding(.horizontal, 24)
            Text("Instagram, TikTok, Calendar, and your agents — in one live view.")
                .foregroundStyle(JVTheme.muted)
                .padding(.horizontal, 24)
                .padding(.top, 8)

            VStack(spacing: 0) {
                connectRow("Instagram", provider: "instagram")
                Divider()
                connectRow("TikTok", provider: "tiktok")
                Divider()
                connectRow("Google Calendar", provider: "google_calendar")
            }
            .padding(.top, 28)
            .padding(.horizontal, 24)

            Spacer()

            HStack {
                ForEach(0..<3, id: \.self) { i in
                    Circle()
                        .fill(i == 0 ? JVTheme.teal : JVTheme.muted.opacity(0.3))
                        .frame(width: 8, height: 8)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.bottom, 16)

            Button("Continue") { appModel.completeOnboarding() }
                .buttonStyle(PrimaryButtonStyle())
                .padding(.horizontal, 24)
                .padding(.bottom, 28)
        }
        .jvScreen()
    }

    private func connectRow(_ title: String, provider: String) -> some View {
        HStack {
            Circle()
                .stroke(JVTheme.hairline, lineWidth: 1)
                .frame(width: 40, height: 40)
                .overlay(Image(systemName: icon(for: provider)).foregroundStyle(JVTheme.teal))
            Text(title).font(.headline)
            Spacer()
            Button(connecting == provider ? "…" : "Connect >") {
                Task {
                    connecting = provider
                    defer { connecting = nil }
                    if let first = try? await APIClient.shared.businesses().first {
                        _ = try? await APIClient.shared.connectDemo(businessId: first.id, provider: provider)
                    }
                }
            }
            .foregroundStyle(JVTheme.teal)
        }
        .padding(.vertical, 16)
    }

    private func icon(for provider: String) -> String {
        switch provider {
        case "instagram": return "camera"
        case "tiktok": return "music.note"
        default: return "calendar"
        }
    }
}
