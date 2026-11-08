import SwiftUI

struct AuthView: View {
    @EnvironmentObject var appModel: AppModel
    @State private var email = "john@juvantage.com"
    @State private var password = "demo1234"
    @State private var error: String?
    @State private var loading = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Juvantage")
                        .font(JVTheme.display)
                        .foregroundStyle(JVTheme.ink)
                    Text("Sign in to your Business OS")
                        .foregroundStyle(JVTheme.muted)
                }
                .padding(.top, 48)

                VStack(spacing: 14) {
                    TextField("Email", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .padding()
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    SecureField("Password", text: $password)
                        .padding()
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                if let error {
                    Text(error).foregroundStyle(.red).font(.footnote)
                }

                Button {
                    Task {
                        loading = true
                        error = nil
                        defer { loading = false }
                        do {
                            try await appModel.login(email: email, password: password)
                        } catch {
                            if let urlErr = error as? URLError, urlErr.code == .timedOut {
                                self.error =
                                    "Brain timed out at \(AppConfig.apiBaseURL.absoluteString). Start `npm run dev:api` in JuvantageOs."
                            } else {
                                self.error = error.localizedDescription
                            }
                        }
                    }
                } label: {
                    Text(loading ? "Signing in…" : "Continue")
                }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(loading)

                Text("Demo: john@juvantage.com / demo1234")
                    .font(.caption)
                    .foregroundStyle(JVTheme.muted)

                Text("Brain: \(AppConfig.apiBaseURL.host ?? "?") — run `npm run dev:api` on your Mac.")
                    .font(.caption2)
                    .foregroundStyle(JVTheme.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(24)
        }
        .jvScreen()
    }
}
