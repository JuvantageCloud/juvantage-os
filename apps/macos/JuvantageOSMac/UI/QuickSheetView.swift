import SwiftUI

struct QuickSheetView: View {
    @ObservedObject var brain: BrainClient
    @State private var loops: [LoopDTO] = []
    @State private var error: String?
    @State private var email = "john@juvantage.com"
    @State private var password = "demo1234"
    @State private var busy = false

    var onOpenDesktop: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Juvantage OS")
                    .font(.headline)
                Spacer()
                Circle()
                    .fill(brain.healthOK ? Color.green : Color.orange)
                    .frame(width: 8, height: 8)
            }
            Text(brain.healthDetail)
                .font(.caption)
                .foregroundStyle(.secondary)

            if TokenStore.token == nil {
                signInBlock
            } else {
                loopsBlock
            }

            HStack {
                Button("Open Desktop") { onOpenDesktop() }
                    .keyboardShortcut("d", modifiers: [.command])
                Spacer()
                if TokenStore.token != nil {
                    Button("Sign out") { brain.logout() }
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(14)
        .frame(width: 320)
        .task { await brain.refreshHealth() }
        .task(id: TokenStore.token) { await reloadLoops() }
    }

    private var signInBlock: some View {
        VStack(alignment: .leading, spacing: 8) {
            TextField("Email", text: $email)
                .textFieldStyle(.roundedBorder)
            SecureField("Password", text: $password)
                .textFieldStyle(.roundedBorder)
            Button(busy ? "Signing in…" : "Sign in to Brain") {
                Task {
                    busy = true
                    defer { busy = false }
                    do {
                        try await brain.login(email: email, password: password)
                        error = nil
                    } catch {
                        self.error = error.localizedDescription
                    }
                }
            }
            .disabled(busy)
            if let error {
                Text(error).font(.caption).foregroundStyle(.red)
            }
        }
    }

    private var loopsBlock: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Open loops")
                .font(.subheadline.weight(.semibold))
            if loops.isEmpty {
                Text("No loops — sync + extract in Desktop.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(loops.prefix(3)) { loop in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(loop.title)
                            .font(.caption.weight(.medium))
                            .lineLimit(2)
                        Text("\(loop.band.uppercased()) · \(loop.kind)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(nsColor: .controlBackgroundColor))
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                }
            }
        }
    }

    private func reloadLoops() async {
        guard TokenStore.token != nil else {
            loops = []
            return
        }
        do {
            loops = try await brain.fetchLoops(limit: 5)
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
    }
}
