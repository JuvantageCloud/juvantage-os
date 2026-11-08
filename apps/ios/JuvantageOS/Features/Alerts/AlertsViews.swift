import SwiftUI

struct AlertsView: View {
    @State private var alerts: [AlertDTO] = []
    @State private var filter = "all"

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        chip("All", "all")
                        chip("Critical", "critical")
                        chip("Social", "social")
                        chip("Agents", "agent")
                    }
                }

                ForEach(alerts) { alert in
                    NavigationLink {
                        AttentionDetailView(alertId: alert.id)
                    } label: {
                        JVCard {
                            HStack(alignment: .top, spacing: 12) {
                                Circle()
                                    .fill(dotColor(alert.severity))
                                    .frame(width: 8, height: 8)
                                    .padding(.top, 6)
                                VStack(alignment: .leading, spacing: 6) {
                                    Text(alert.title)
                                        .font(.headline)
                                        .foregroundStyle(JVTheme.ink)
                                        .multilineTextAlignment(.leading)
                                    Text(alert.labels.joined(separator: " • "))
                                        .font(.caption)
                                        .foregroundStyle(JVTheme.muted)
                                    Text(relativeTime(alert.createdAt))
                                        .font(.caption2)
                                        .foregroundStyle(JVTheme.muted)
                                }
                                Spacer()
                                Image(systemName: "chevron.right").foregroundStyle(JVTheme.muted)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(20)
        }
        .jvScreen()
        .navigationTitle("Alerts")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Mark all read") {
                    Task {
                        try? await APIClient.shared.markAlertsRead()
                        await load()
                    }
                }
                .foregroundStyle(JVTheme.teal)
            }
        }
        .task(id: filter) { await load() }
    }

    private func load() async {
        alerts = (try? await APIClient.shared.alerts(severity: filter)) ?? []
    }

    private func chip(_ title: String, _ value: String) -> some View {
        Button(title) { filter = value }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(filter == value ? JVTheme.teal : Color.white)
            .foregroundStyle(filter == value ? .white : JVTheme.ink)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(JVTheme.hairline))
    }

    private func dotColor(_ severity: String) -> Color {
        switch severity {
        case "critical": return JVTheme.attention
        case "social", "agent": return JVTheme.teal
        default: return JVTheme.muted
        }
    }
}

struct AttentionDetailView: View {
    let alertId: String
    @State private var alert: AlertDetailDTO?

    var body: some View {
        ScrollView {
            if let alert {
                VStack(alignment: .leading, spacing: 20) {
                    HStack {
                        Image(systemName: "exclamationmark.circle.fill")
                            .foregroundStyle(JVTheme.attention)
                            .font(.title)
                        Text(alert.title.replacingOccurrences(of: "Harbor Retail needs attention — ", with: "").replacingOccurrences(of: ".", with: ""))
                            .font(JVTheme.title)
                    }

                    Text(alert.body ?? "")
                        .foregroundStyle(JVTheme.ink)

                    Text("IMPACT")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(JVTheme.attention)

                    HStack {
                        impactCard("\(alert.impactOrders ?? 0) orders", "TikTok Shop orders delayed")
                        impactCard(formatMoney(alert.impactRevenue ?? 0), "Revenue at risk")
                    }

                    Text("RECOMMENDED ACTIONS")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(JVTheme.muted)

                    ForEach(alert.recommendedActions) { action in
                        NavigationLink {
                            if action.id == "ask_ops" {
                                AgentChatView(agentName: "Ops Agent")
                            } else if action.id == "open_tiktok" {
                                ConnectionsView()
                            } else {
                                EmptyView()
                            }
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(action.label).font(.headline).foregroundStyle(JVTheme.ink)
                                    Text(action.detail).font(.caption).foregroundStyle(JVTheme.muted)
                                }
                                Spacer()
                                Image(systemName: "chevron.right").foregroundStyle(JVTheme.muted)
                            }
                            .padding()
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }

                    NavigationLink {
                        AgentChatView(agentName: "Ops Agent")
                    } label: {
                        Label("Resolve with Agent", systemImage: "person.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(PrimaryButtonStyle())

                    Text("We're monitoring this closely and will notify you of any changes.")
                        .font(.caption)
                        .foregroundStyle(JVTheme.muted)
                        .frame(maxWidth: .infinity)
                }
                .padding(20)
            } else {
                ProgressView().padding(.top, 60)
            }
        }
        .jvScreen()
        .navigationTitle("Attention")
        .navigationBarTitleDisplayMode(.inline)
        .task { alert = try? await APIClient.shared.alert(id: alertId) }
    }

    private func impactCard(_ value: String, _ label: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(value).font(.title3.weight(.bold)).foregroundStyle(JVTheme.attention)
            Text(label).font(.caption).foregroundStyle(JVTheme.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
