import SwiftUI
import WebKit

struct QuickSheetWebView: NSViewRepresentable {
    let url: URL
    var onOpenDesktop: () -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(onOpenDesktop: onOpenDesktop)
    }

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        let bridge = OsWebBridgeHandler.attach(to: config)
        context.coordinator.bridge = bridge
        let web = WKWebView(frame: .zero, configuration: config)
        bridge.webView = web
        web.navigationDelegate = context.coordinator
        web.uiDelegate = context.coordinator
        OsWebViewRegistry.register(web, isSheet: true)
        web.load(URLRequest(url: url))
        return web
    }

    func updateNSView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        // NSObject required for NotificationCenter selectors
        let onOpenDesktop: () -> Void
        var bridge: OsWebBridgeHandler?

        init(onOpenDesktop: @escaping () -> Void) {
            self.onOpenDesktop = onOpenDesktop
            super.init()
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(handleOpenDesktop),
                name: .juvOsOpenDesktop,
                object: nil
            )
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(handleCloseSheet),
                name: .juvOsCloseSheet,
                object: nil
            )
        }

        deinit {
            NotificationCenter.default.removeObserver(self)
        }

        @objc private func handleOpenDesktop() {
            Task { @MainActor in onOpenDesktop() }
        }

        @objc private func handleCloseSheet() {
            Task { @MainActor in
                ShellController.shared.toggleQuickSheet()
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            bridge?.webView = webView
            guard let token = TokenStore.token else { return }
            let escaped = token.replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "'", with: "\\'")
            let js = "try { localStorage.setItem('juvantage_os_token', '\(escaped)'); } catch (e) {}"
            webView.evaluateJavaScript(js, completionHandler: nil)
        }

        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            if navigationAction.request.url?.absoluteString.contains("route=desktop") == true {
                onOpenDesktop()
            }
            return nil
        }
    }
}

struct QuickSheetPanelView: View {
    var onOpenDesktop: () -> Void

    var body: some View {
        QuickSheetWebView(url: AppConfig.quickSheetWebURL, onOpenDesktop: onOpenDesktop)
            .frame(minWidth: 360, minHeight: 480)
    }
}
