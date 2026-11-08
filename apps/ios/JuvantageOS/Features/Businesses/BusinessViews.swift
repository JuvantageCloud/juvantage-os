import SwiftUI

struct BusinessesListView: View {
    @State private var businesses: [BusinessDTO] = []
    @State private var query = ""

    var filtered: [BusinessDTO] {
        guard !query.isEmpty else { return businesses }
        return businesses.filter { $0.name.localizedCaseInsensitiveContains(query) }
    }

    var body: some View {
        List {
            Section {
                TextField("Search businesses...", text: $query)
            }
            ForEach(filtered) { biz in
                NavigationLink {
                    BusinessDetailView(businessId: biz.id, title: biz.name)
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(biz.name).font(.headline)
                            Text("\(biz.metricLabel): \(biz.metricValue)")
                                .font(.caption)
                                .foregroundStyle(JVTheme.muted)
                        }
                        Spacer()
                        StatusPill(
                            text: biz.status == "attention" ? "Attention" : "Live",
                            tone: biz.status == "attention" ? .warn : .ok
                        )
                    }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(JVTheme.cream)
        .navigationTitle("Businesses")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink {
                    AddBusinessView()
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            Text("Live data refreshes every 60s")
                .font(.caption)
                .foregroundStyle(JVTheme.muted)
                .frame(maxWidth: .infinity)
                .padding(.bottom, 8)
        }
        .task {
            businesses = (try? await APIClient.shared.businesses()) ?? []
        }
    }
}

struct AddBusinessView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var category = "Hospitality"
    @State private var timezone = "America/Los_Angeles"
    @State private var currency = "USD"
    @State private var ig = false
    @State private var tt = false
    @State private var cal = false
    @State private var error: String?
    @State private var saving = false

    var body: some View {
        Form {
            Section("Business") {
                TextField("Business name", text: $name)
                TextField("Category", text: $category)
                TextField("Timezone", text: $timezone)
                TextField("Currency", text: $currency)
            }
            Section("Start with connections") {
                Toggle("Instagram", isOn: $ig)
                Toggle("TikTok", isOn: $tt)
                Toggle("Calendar", isOn: $cal)
                Text("You can connect sources later — live monitoring starts once linked.")
                    .font(.caption)
                    .foregroundStyle(JVTheme.muted)
            }
            if let error {
                Text(error).foregroundStyle(.red)
            }
            Button(saving ? "Creating…" : "Create business") {
                Task {
                    saving = true
                    defer { saving = false }
                    do {
                        _ = try await APIClient.shared.createBusiness(
                            name: name,
                            category: category,
                            timezone: timezone,
                            currency: currency,
                            connectInstagram: ig,
                            connectTiktok: tt,
                            connectCalendar: cal
                        )
                        dismiss()
                    } catch {
                        self.error = error.localizedDescription
                    }
                }
            }
            .disabled(name.isEmpty || saving)
        }
        .navigationTitle("New business")
    }
}

struct BusinessDetailView: View {
    let businessId: String
    let title: String
    @State private var detail: BusinessDetailDTO?
    @State private var tab = 0

    var body: some View {
        ScrollView {
            if let detail {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("TODAY'S REVENUE")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(JVTheme.muted)
                        Text(formatMoney(detail.revenueToday))
                            .font(JVTheme.display)
                        if let delta = detail.metricDelta {
                            Text("↑ \(String(format: "%.1f", abs(delta)))% vs yesterday")
                                .foregroundStyle(JVTheme.teal)
                                .font(.subheadline)
                        }
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white.opacity(0.7))
                    .clipShape(RoundedRectangle(cornerRadius: 14))

                    Picker("", selection: $tab) {
                        Text("Overview").tag(0)
                        Text("Channels").tag(1)
                        Text("Ops").tag(2)
                    }
                    .pickerStyle(.segmented)

                    if tab == 0 {
                        Text("LIVE ACTIVITY")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(JVTheme.muted)
                        ForEach(detail.liveActivity) { event in
                            HStack {
                                Image(systemName: "circle.fill")
                                    .font(.system(size: 6))
                                    .foregroundStyle(JVTheme.teal)
                                Text(event.title).font(.subheadline)
                                Spacer()
                                Text(event.detail ?? "")
                                    .font(.caption)
                                    .foregroundStyle(JVTheme.muted)
                            }
                            .padding(.vertical, 8)
                        }

                        Text("PERFORMANCE OVERVIEW")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(JVTheme.muted)
                            .padding(.top, 8)
                        PerformanceChart(points: detail.performance)
                            .frame(height: 140)
                    } else if tab == 1 {
                        NavigationLink("Social hub") { SocialHubView() }
                        NavigationLink("Connections") { ConnectionsView() }
                    } else {
                        NavigationLink("Alerts") { AlertsView() }
                        NavigationLink("Ask Ops Agent") { AgentChatView(agentName: "Ops Agent") }
                    }
                }
                .padding(20)
            } else {
                ProgressView().padding(.top, 60)
            }
        }
        .jvScreen()
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            detail = try? await APIClient.shared.business(id: businessId)
        }
    }
}

struct PerformanceChart: View {
    let points: [PerfPointDTO]

    var body: some View {
        GeometryReader { geo in
            let values = points.map(\.v)
            let maxV = max(values.max() ?? 1, 1)
            let minV = values.min() ?? 0
            let range = max(maxV - minV, 1)
            Path { path in
                for (i, p) in points.enumerated() {
                    let x = geo.size.width * CGFloat(i) / CGFloat(max(points.count - 1, 1))
                    let y = geo.size.height * (1 - CGFloat((p.v - minV) / range))
                    if i == 0 { path.move(to: CGPoint(x: x, y: y)) }
                    else { path.addLine(to: CGPoint(x: x, y: y)) }
                }
            }
            .stroke(JVTheme.teal, style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round))
        }
        .padding()
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
