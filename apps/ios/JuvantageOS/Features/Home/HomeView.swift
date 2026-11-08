import SwiftUI

struct HomeView: View {
    @State private var overview: CommandOverviewDTO?
    @State private var error: String?
    @State private var loading = true

    var body: some View {
        NavigationStack {
            ScrollView {
                if loading && overview == nil {
                    ProgressView().padding(.top, 80)
                } else if let overview {
                    VStack(alignment: .leading, spacing: 20) {
                        HStack(alignment: .top) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(overview.greeting)
                                    .font(.subheadline)
                                    .foregroundStyle(JVTheme.muted)
                                Text("Command.")
                                    .font(JVTheme.display)
                                    .foregroundStyle(JVTheme.ink)
                            }
                            Spacer()
                            if overview.systemsLive {
                                StatusPill(text: "All systems live", tone: .live)
                            }
                        }

                        HStack(spacing: 10) {
                            summaryCard("Revenue today", formatMoney(overview.revenueToday), "↑ \(Int(overview.revenueDeltaPct))% vs yesterday")
                            summaryCard("Open tasks", "\(overview.openTasks)", "Needs attention")
                            summaryCard("Mentions", "\(overview.mentions)", "Across all businesses")
                        }

                        Text("Your businesses")
                            .font(.headline)
                            .foregroundStyle(JVTheme.ink)

                        ForEach(overview.businesses) { biz in
                            NavigationLink(value: biz) {
                                businessCard(biz)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(20)
                } else if let error {
                    Text(error).foregroundStyle(.red).padding()
                }
            }
            .jvScreen()
            .navigationDestination(for: BusinessDTO.self) { biz in
                BusinessDetailView(businessId: biz.id, title: biz.name)
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    NavigationLink {
                        BusinessesListView()
                    } label: {
                        Image(systemName: "briefcase")
                    }
                }
            }
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        do {
            overview = try await APIClient.shared.command()
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func summaryCard(_ title: String, _ value: String, _ subtitle: String) -> some View {
        JVCard {
            VStack(alignment: .leading, spacing: 6) {
                Text(title).font(.caption2).foregroundStyle(JVTheme.muted)
                Text(value).font(.headline).foregroundStyle(JVTheme.ink)
                Text(subtitle).font(.caption2).foregroundStyle(JVTheme.teal)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func businessCard(_ biz: BusinessDTO) -> some View {
        JVCard {
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    Text(biz.name).font(.headline).foregroundStyle(JVTheme.ink)
                    Text(biz.category).font(.caption).foregroundStyle(JVTheme.muted)
                    Text("\(biz.metricLabel): \(biz.metricValue)")
                        .font(.subheadline)
                        .foregroundStyle(JVTheme.ink)
                }
                Spacer()
                StatusPill(
                    text: biz.status == "attention" ? "Attention" : "Healthy",
                    tone: biz.status == "attention" ? .warn : .ok
                )
                Image(systemName: "chevron.right")
                    .foregroundStyle(JVTheme.muted)
            }
        }
    }
}
