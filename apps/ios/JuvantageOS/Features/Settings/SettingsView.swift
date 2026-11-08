import SwiftUI

struct MoreView: View {
    var body: some View {
        NavigationStack {
            List {
                NavigationLink { AlertsView() } label: {
                    Label("Alerts", systemImage: "bell")
                }
                NavigationLink { BusinessesListView() } label: {
                    Label("Businesses", systemImage: "briefcase")
                }
                NavigationLink { ConnectionsView() } label: {
                    Label("Connections", systemImage: "link")
                }
                NavigationLink { SettingsView() } label: {
                    Label("Settings", systemImage: "gearshape")
                }
            }
            .scrollContentBackground(.hidden)
            .background(JVTheme.cream)
            .navigationTitle("More")
        }
    }
}

struct SettingsView: View {
    @EnvironmentObject var appModel: AppModel
    @State private var liveRefresh = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack {
                    Text("Settings")
                        .font(JVTheme.display)
                    Spacer()
                    Image(systemName: "gearshape")
                        .foregroundStyle(JVTheme.muted)
                }
                Text("Personalize your workspace.")
                    .foregroundStyle(JVTheme.muted)

                JVCard {
                    HStack(spacing: 14) {
                        Circle()
                            .fill(JVTheme.teal.opacity(0.2))
                            .frame(width: 48, height: 48)
                            .overlay(Text(initials).font(.headline).foregroundStyle(JVTheme.teal))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(appModel.user?.name ?? "Owner").font(.headline)
                            Text("Owner • \(appModel.user?.businessCount ?? 0) businesses")
                                .font(.caption)
                                .foregroundStyle(JVTheme.muted)
                        }
                        Spacer()
                        Image(systemName: "chevron.right").foregroundStyle(JVTheme.muted)
                    }
                }

                section("WORKSPACE", [
                    ("Businesses", "Manage your businesses", "building.2", AnyView(BusinessesListView())),
                    ("Connections", "Linked accounts & integrations", "link", AnyView(ConnectionsView())),
                    ("Team", "Manage your team", "person.2", AnyView(Text("Coming soon").padding())),
                ])

                VStack(alignment: .leading, spacing: 8) {
                    Text("PREFERENCES")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(JVTheme.muted)
                    JVCard {
                        VStack(spacing: 14) {
                            navRow("Appearance", "Theme, colors & layout", "sun.max")
                            Divider()
                            navRow("Notifications", "Alert preferences", "bell")
                            Divider()
                            Toggle(isOn: $liveRefresh) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Live refresh")
                                    Text("Auto update data").font(.caption).foregroundStyle(JVTheme.muted)
                                }
                            }
                            .tint(JVTheme.teal)
                        }
                    }
                }

                section("AGENTS", [
                    ("Cursor Bridge", "Configure Cursor Bridge", "cube", AnyView(CursorBridgeView())),
                    ("Permissions", "Agent access & scopes", "checkmark.shield", AnyView(CursorBridgeView())),
                    ("AI provider", "Coming soon — platform-managed in V1", "key", AnyView(Text("LLM keys stay on the server. BYOK arrives in V2.").padding())),
                ])

                section("SUPPORT", [
                    ("Help", "Get help & documentation", "questionmark.circle", AnyView(Text("Docs coming soon").padding())),
                    ("Privacy", "Privacy & data controls", "lock", AnyView(Text("Privacy controls coming soon").padding())),
                ])

                Button(role: .destructive) {
                    appModel.signOut()
                } label: {
                    Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                        .frame(maxWidth: .infinity)
                        .padding()
                }
            }
            .padding(20)
        }
        .jvScreen()
        .navigationBarTitleDisplayMode(.inline)
    }

    private var initials: String {
        let parts = (appModel.user?.name ?? "JU").split(separator: " ")
        return parts.prefix(2).map { String($0.prefix(1)) }.joined().uppercased()
    }

    private func section(_ title: String, _ rows: [(String, String, String, AnyView)]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.caption.weight(.bold))
                .foregroundStyle(JVTheme.muted)
            JVCard {
                VStack(spacing: 0) {
                    ForEach(Array(rows.enumerated()), id: \.offset) { idx, row in
                        NavigationLink {
                            row.3
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: row.2).foregroundStyle(JVTheme.teal).frame(width: 24)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(row.0).foregroundStyle(JVTheme.ink)
                                    Text(row.1).font(.caption).foregroundStyle(JVTheme.muted)
                                }
                                Spacer()
                                Image(systemName: "chevron.right").foregroundStyle(JVTheme.muted)
                            }
                            .padding(.vertical, 10)
                        }
                        if idx < rows.count - 1 { Divider() }
                    }
                }
            }
        }
    }

    private func navRow(_ title: String, _ subtitle: String, _ icon: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).foregroundStyle(JVTheme.teal).frame(width: 24)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                Text(subtitle).font(.caption).foregroundStyle(JVTheme.muted)
            }
            Spacer()
        }
    }
}
