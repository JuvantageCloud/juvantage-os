import SwiftUI
import WebKit

struct DesktopWebView: NSViewRepresentable {
    let url: URL
    @Binding var state: LoadState

    enum LoadState {
        case loading
        case ready
        case failed(String)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(state: $state)
    }

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        let bridge = OsWebBridgeHandler.attach(to: config)
        context.coordinator.bridge = bridge
        let web = WKWebView(frame: .zero, configuration: config)
        bridge.webView = web
        web.navigationDelegate = context.coordinator
        OsWebViewRegistry.register(web)
        web.load(URLRequest(url: url))
        return web
    }

    func updateNSView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate {
        @Binding var state: LoadState
        var bridge: OsWebBridgeHandler?

        init(state: Binding<LoadState>) {
            _state = state
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            state = .ready
            bridge?.webView = webView
            guard let token = TokenStore.token else { return }
            let escaped = token.replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "'", with: "\\'")
            let js = "try { localStorage.setItem('juvantage_os_token', '\(escaped)'); } catch (e) {}"
            webView.evaluateJavaScript(js, completionHandler: nil)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            state = .failed(error.localizedDescription)
        }

        func webView(
            _ webView: WKWebView,
            didFailProvisionalNavigation navigation: WKNavigation!,
            withError error: Error
        ) {
            state = .failed(error.localizedDescription)
        }
    }
}

struct DesktopWindowView: View {
    @State private var loadState = DesktopWebView.LoadState.loading

    var body: some View {
        ZStack {
            DesktopWebView(url: AppConfig.desktopWebURL, state: $loadState)
                .ignoresSafeArea()
            if case .loading = loadState {
                VStack(spacing: 8) {
                    ProgressView()
                    Text("Loading Desktop UI…")
                    Text("Run npm run dev:os in Terminal")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(red: 0.96, green: 0.95, blue: 0.91))
            }
            if case .failed(let msg) = loadState {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Couldn’t load UI").font(.headline)
                    Text(msg).font(.caption)
                    Text("Start: npm run dev:os")
                    Text(AppConfig.desktopWebURL.absoluteString)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                .padding(24)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(red: 0.96, green: 0.95, blue: 0.91))
            }
        }
    }
}
