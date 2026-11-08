import SwiftUI

struct AgentsListView: View {
    @State private var agents: [AgentDTO] = []

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Agents")
                        .font(JVTheme.display)
                    Text("Talk to the systems that run your ops")
                        .foregroundStyle(JVTheme.muted)

                    ForEach(agents) { agent in
                        NavigationLink {
                            if agent.kind == "cursor_bridge" {
                                CursorBridgeView()
                            } else {
                                AgentChatView(agentName: agent.name)
                            }
                        } label: {
                            JVCard {
                                HStack(spacing: 12) {
                                    Image(systemName: icon(agent.kind))
                                        .foregroundStyle(JVTheme.teal)
                                        .frame(width: 36, height: 36)
                                        .background(JVTheme.teal.opacity(0.12))
                                        .clipShape(RoundedRectangle(cornerRadius: 10))
                                    VStack(alignment: .leading, spacing: 4) {
                                        HStack {
                                            Text(agent.name).font(.headline).foregroundStyle(JVTheme.ink)
                                            if agent.kind == "cursor_bridge" {
                                                Text(agent.statusLabel)
                                                    .font(.caption2.weight(.semibold))
                                                    .padding(.horizontal, 8)
                                                    .padding(.vertical, 4)
                                                    .background(JVTheme.teal.opacity(0.15))
                                                    .foregroundStyle(JVTheme.teal)
                                                    .clipShape(Capsule())
                                            } else {
                                                Circle().fill(JVTheme.teal).frame(width: 7, height: 7)
                                            }
                                        }
                                        Text(agent.activity)
                                            .font(.subheadline)
                                            .foregroundStyle(JVTheme.muted)
                                            .lineLimit(2)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right").foregroundStyle(JVTheme.muted)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                    }

                    NavigationLink {
                        AgentChatView(agentName: "Ops Agent")
                    } label: {
                        Label("New chat", systemImage: "plus")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .padding(.top, 8)
                }
                .padding(20)
            }
            .jvScreen()
            .task { agents = (try? await APIClient.shared.agents()) ?? [] }
        }
    }

    private func icon(_ kind: String) -> String {
        switch kind {
        case "ops": return "cube.fill"
        case "growth": return "chart.line.uptrend.xyaxis"
        case "finance": return "creditcard.fill"
        case "cursor_bridge": return "point.3.connected.trianglepath.dotted"
        default: return "sparkles"
        }
    }
}

struct AgentChatView: View {
    let agentName: String
    @State private var messages: [ChatMessage] = []
    @State private var input = ""
    @State private var conversationId: String?
    @State private var sending = false
    @FocusState private var focused: Bool

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 14) {
                        ForEach(messages) { msg in
                            messageBubble(msg).id(msg.id)
                        }
                    }
                    .padding(16)
                }
                .onChange(of: messages.count) { _, _ in
                    if let last = messages.last {
                        withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                    }
                }
            }

            if messages.isEmpty {
                VStack(spacing: 12) {
                    Text("Ask your business")
                        .font(.headline)
                    suggested("Tell me how my business is doing today.")
                    suggested("Why did Harbor Retail flag attention?")
                    suggested("What’s performing on social?")
                }
                .padding()
            }

            HStack(spacing: 10) {
                TextField("Message \(agentName)...", text: $input, axis: .vertical)
                    .lineLimit(1...4)
                    .padding(12)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .focused($focused)
                Button {
                    Task { await send() }
                } label: {
                    Image(systemName: "arrow.up")
                        .foregroundStyle(.white)
                        .padding(12)
                        .background(JVTheme.tealDeep)
                        .clipShape(Circle())
                }
                .disabled(input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || sending)
            }
            .padding(12)
            .background(JVTheme.cream)
        }
        .jvScreen()
        .navigationTitle(agentName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                VStack(spacing: 2) {
                    Text(agentName).font(.headline)
                    Text("Online").font(.caption2).foregroundStyle(JVTheme.teal)
                }
            }
        }
    }

    private func suggested(_ text: String) -> some View {
        Button(text) {
            input = text
            Task { await send() }
        }
        .font(.subheadline)
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.white)
        .clipShape(Capsule())
        .overlay(Capsule().stroke(JVTheme.hairline))
    }

    private func messageBubble(_ msg: ChatMessage) -> some View {
        HStack {
            if msg.role == "user" { Spacer(minLength: 40) }
            VStack(alignment: .leading, spacing: 10) {
                if let title = msg.title {
                    Text(title).font(.headline)
                }
                Text(LocalizedStringKey(msg.content.replacingOccurrences(of: "**", with: "")))
                    .font(.body)
                if !msg.metrics.isEmpty {
                    HStack(alignment: .top) {
                        ForEach(Array(msg.metrics.enumerated()), id: \.offset) { _, m in
                            MetricChip(label: m.label, value: m.value, tone: m.tone, hint: m.hint)
                        }
                    }
                }
                if !msg.actions.isEmpty {
                    HStack {
                        ForEach(msg.actions) { action in
                            Text(action.label)
                                .font(.caption.weight(.semibold))
                                .padding(.horizontal, 10)
                                .padding(.vertical, 8)
                                .background(JVTheme.teal.opacity(0.12))
                                .foregroundStyle(JVTheme.tealDeep)
                                .clipShape(Capsule())
                        }
                    }
                }
                if let footer = msg.footer {
                    Text(footer).font(.caption2).foregroundStyle(JVTheme.muted)
                }
            }
            .padding(14)
            .background(msg.role == "user" ? JVTheme.tealDeep : Color.white)
            .foregroundStyle(msg.role == "user" ? .white : JVTheme.ink)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            if msg.role != "user" { Spacer(minLength: 20) }
        }
    }

    private func send() async {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        input = ""
        messages.append(ChatMessage(
            id: UUID().uuidString,
            role: "user",
            content: text,
            title: nil,
            metrics: [],
            actions: [],
            footer: nil
        ))
        sending = true
        defer { sending = false }
        do {
            let res = try await APIClient.shared.chat(
                message: text,
                conversationId: conversationId
            )
            conversationId = res.conversationId
            messages.append(ChatMessage(
                id: res.messageId,
                role: "assistant",
                content: res.content,
                title: res.title,
                metrics: res.metrics,
                actions: res.actions,
                footer: res.footer
            ))
        } catch {
            messages.append(ChatMessage(
                id: UUID().uuidString,
                role: "assistant",
                content: error.localizedDescription,
                title: "Error",
                metrics: [],
                actions: [],
                footer: nil
            ))
        }
    }
}
