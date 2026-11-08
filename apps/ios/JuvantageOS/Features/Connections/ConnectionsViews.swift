import SwiftUI

struct ConnectionsView: View {
    @State private var response: ConnectionsResponseDTO?
    @State private var businesses: [BusinessDTO] = []
    @State private var busyId: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Connections")
                    .font(JVTheme.display)
                Text("Sources that power live monitoring.")
                    .foregroundStyle(JVTheme.muted)
                Rectangle()
                    .fill(JVTheme.teal)
                    .frame(width: 40, height: 3)
                    .clipShape(Capsule())

                VStack(spacing: 0) {
                    ForEach(response?.connections ?? []) { conn in
                        connectionRow(conn)
                        if conn.id != response?.connections.last?.id {
                            Divider().padding(.leading, 56)
                        }
                    }
                }
                .padding(.vertical, 4)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 16))

                Button {
                    // Add connection — connect demo for first business Instagram if needed
                    Task { await addConnection() }
                } label: {
                    HStack {
                        Text("Add connection")
                        Spacer()
                        Image(systemName: "plus")
                    }
                    .foregroundStyle(JVTheme.teal)
                    .padding()
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(JVTheme.teal, lineWidth: 1.5)
                    )
                }
            }
            .padding(20)
        }
        .jvScreen()
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private func load() async {
        response = try? await APIClient.shared.connections()
        businesses = (try? await APIClient.shared.businesses()) ?? []
    }

    private func connectionRow(_ conn: ConnectionDTO) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon(conn.provider))
                .foregroundStyle(JVTheme.teal)
                .frame(width: 36, height: 36)
                .background(JVTheme.teal.opacity(0.1))
                .clipShape(Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(conn.label).font(.headline)
                HStack(spacing: 6) {
                    Circle()
                        .fill(conn.status == "connected" ? JVTheme.teal : JVTheme.muted)
                        .frame(width: 6, height: 6)
                    Text(conn.status.capitalized)
                        .font(.caption)
                        .foregroundStyle(JVTheme.muted)
                    if let detail = conn.detail {
                        Text("· \(detail)").font(.caption).foregroundStyle(JVTheme.muted)
                    }
                }
            }
            Spacer()
            Toggle("", isOn: Binding(
                get: { conn.enabled },
                set: { newValue in
                    Task { await toggle(conn, enabled: newValue) }
                }
            ))
            .labelsHidden()
            .tint(JVTheme.teal)
            .disabled(conn.comingSoon || busyId == conn.id)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }

    private func toggle(_ conn: ConnectionDTO, enabled: Bool) async {
        busyId = conn.id
        defer { busyId = nil }
        if enabled, !conn.enabled, let biz = businesses.first,
           ["instagram", "google_calendar", "tiktok", "cursor_agents"].contains(conn.provider) {
            // Prefer demo connect so lastSyncAt updates when OAuth isn't configured
            try? await APIClient.shared.connectDemo(businessId: biz.id, provider: conn.provider)
        } else {
            try? await APIClient.shared.toggleConnection(id: conn.id, enabled: enabled)
        }
        await load()
    }

    private func addConnection() async {
        guard let biz = businesses.first else { return }
        try? await APIClient.shared.connectDemo(businessId: biz.id, provider: "instagram")
        await load()
    }

    private func icon(_ provider: String) -> String {
        switch provider {
        case "instagram": return "camera"
        case "tiktok": return "music.note"
        case "google_calendar": return "calendar"
        case "cursor_agents": return "cpu"
        case "stripe": return "creditcard"
        case "quickbooks": return "books.vertical"
        default: return "link"
        }
    }
}

struct CursorBridgeView: View {
    @State private var bridge: CursorBridgeDTO?
    @State private var allowPropose = true

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Cursor Bridge")
                    .font(JVTheme.display)
                Text("Securely route chat boxes to your Cursor agents.")
                    .foregroundStyle(JVTheme.muted)

                if let bridge {
                    JVCard {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(JVTheme.teal)
                                .font(.title)
                            VStack(alignment: .leading, spacing: 4) {
                                Text(bridge.statusText).font(.headline)
                                Text(bridge.detail).font(.caption).foregroundStyle(JVTheme.muted)
                            }
                            Spacer()
                        }
                    }

                    Text("AGENT PERMISSIONS")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(JVTheme.teal)

                    VStack(spacing: 0) {
                        ForEach(bridge.permissions) { perm in
                            HStack {
                                Text(perm.agent).font(.headline)
                                Spacer()
                                Text(perm.access).foregroundStyle(JVTheme.muted)
                                Image(systemName: "chevron.right").foregroundStyle(JVTheme.muted)
                            }
                            .padding()
                            if perm.id != bridge.permissions.last?.id { Divider() }
                        }
                    }
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                    JVCard {
                        Toggle(isOn: $allowPropose) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Allow agents to propose actions")
                                Text("Agents can suggest edits, commands, and fixes.")
                                    .font(.caption)
                                    .foregroundStyle(JVTheme.muted)
                            }
                        }
                        .tint(JVTheme.teal)
                    }

                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "lock.fill").foregroundStyle(JVTheme.muted)
                        Text("**Security note**: \(bridge.securityNote)")
                            .font(.caption)
                            .foregroundStyle(JVTheme.muted)
                    }

                    Text(bridge.v2Note)
                        .font(.caption)
                        .foregroundStyle(JVTheme.muted)
                        .padding(.top, 4)

                    Button {} label: {
                        Label("Manage API keys", systemImage: "key")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(JVTheme.hairline, lineWidth: 1)
                            )
                    }
                    .foregroundStyle(JVTheme.ink)
                    .disabled(true)
                    .opacity(0.5)
                } else {
                    ProgressView()
                }
            }
            .padding(20)
        }
        .jvScreen()
        .task {
            bridge = try? await APIClient.shared.cursorBridge()
            allowPropose = bridge?.allowProposeActions ?? true
        }
    }
}
