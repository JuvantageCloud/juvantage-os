import AppKit
import Foundation
import WebKit

extension Notification.Name {
    static let juvOsOpenDesktop = Notification.Name("juvOsOpenDesktop")
    static let juvOsCloseSheet = Notification.Name("juvOsCloseSheet")
    static let juvOsContextClosed = Notification.Name("juvOsContextClosed")
}

/// Registers WKWebViews and broadcasts clip hotkey to injected `window.juvantageOs`.
enum OsWebViewRegistry {
    private struct WeakBox {
        weak var webView: WKWebView?
    }

    private static var views: [WeakBox] = []

    private static var sheetViews: [WeakBox] = []

    static func register(_ webView: WKWebView, isSheet: Bool = false) {
        views.append(WeakBox(webView: webView))
        views.removeAll { $0.webView == nil }
        if isSheet {
            sheetViews.append(WeakBox(webView: webView))
            sheetViews.removeAll { $0.webView == nil }
        }
    }

    /// Voice goes to the quick sheet only (it owns the draft); the page-side bridge
    /// queues it until React subscribes.
    static func sendVoiceTranscript(_ text: String) {
        sheetViews.removeAll { $0.webView == nil }
        guard let data = try? JSONSerialization.data(withJSONObject: [text]),
              let json = String(data: data, encoding: .utf8)
        else { return }
        let js = "window.__juvOsVoice && window.__juvOsVoice(\(json)[0]);"
        for box in sheetViews {
            box.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    /// Clip hotkey → quick sheet only (one owner). Desktop must not also create loops.
    static func broadcastClipHotkey() {
        sheetViews.removeAll { $0.webView == nil }
        views.removeAll { $0.webView == nil }
        let targets = sheetViews.isEmpty ? views : sheetViews
        for box in targets {
            box.webView?.evaluateJavaScript(
                "window.dispatchEvent(new Event('juv-os-clip-hotkey'));",
                completionHandler: nil
            )
        }
    }

    /// After native dev login, push the same token the React sheet expects.
    static var pendingDesktopLoopId: String?

    /// After sheet → desktop, focus the same loop in React (`#desktop?loopId=`).
    static func focusPendingDesktopLoopIfLoaded() {
        views.removeAll { $0.webView == nil }
        sheetViews.removeAll { $0.webView == nil }
        let sheets = Set(sheetViews.compactMap { $0.webView })
        guard let desktop = views.compactMap({ $0.webView }).first(where: { !sheets.contains($0) }) else { return }
        focusPendingDesktopLoop(on: desktop)
    }

    static func focusPendingDesktopLoop(on webView: WKWebView) {
        guard let loopId = pendingDesktopLoopId, !loopId.isEmpty else { return }
        pendingDesktopLoopId = nil
        let escaped = loopId
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
        let js =
            "try { window.location.hash = 'desktop?loopId=\(escaped)'; window.dispatchEvent(new Event('hashchange')); } catch (e) {}"
        webView.evaluateJavaScript(js, completionHandler: nil)
    }

    static func injectAuthTokenIntoWebViews() {
        views.removeAll { $0.webView == nil }
        sheetViews.removeAll { $0.webView == nil }
        guard let token = TokenStore.token else { return }
        let escaped = token
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
        let js =
            "try { localStorage.setItem('juvantage_os_token', '\(escaped)'); window.dispatchEvent(new Event('juv-os-token')); } catch (e) {}"
        for box in views + sheetViews {
            box.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }
}

enum OsWebBridgeScript {
    static let userScript: WKUserScript = {
        let source = """
        (function () {
          if (window.juvantageOs) return;
          const pending = {};
          window.__juvOsResolve = function (id, ok, payload) {
            const p = pending[id];
            delete pending[id];
            if (!p) return;
            if (ok) p.resolve(payload);
            else p.reject(new Error((payload && payload.error) || "failed"));
          };
          function call(action, extra) {
            return new Promise((resolve, reject) => {
              const callbackId = Math.random().toString(36).slice(2);
              pending[callbackId] = { resolve, reject };
              const msg = Object.assign({ action: action, callbackId: callbackId }, extra || {});
              window.webkit.messageHandlers.juvantageOsBridge.postMessage(msg);
            });
          }
          const voiceListeners = new Set();
          const voiceQueue = [];
          window.__juvOsVoice = function (text) {
            if (voiceListeners.size === 0) { voiceQueue.push(text); return; }
            voiceListeners.forEach(function (cb) { cb(text); });
          };
          window.juvantageOs = {
            ambientSample: function () { return call("ambientSample"); },
            clipContext: function () { return call("clipContext"); },
            episodicContext: function () { return call("episodicContext"); },
            openExternal: function (url) { return call("openExternal", { url: url }); },
            platform: "darwin",
            hostShell: true,
            onClipHotkey: function (cb) {
              const fn = function () { cb(); };
              window.addEventListener("juv-os-clip-hotkey", fn);
              return function () { window.removeEventListener("juv-os-clip-hotkey", fn); };
            },
            onVoiceTranscript: function (cb) {
              voiceListeners.add(cb);
              while (voiceQueue.length) cb(voiceQueue.shift());
              return function () { voiceListeners.delete(cb); };
            },
            voiceResult: function (r) { return call("voiceResult", r || {}); },
            toggleSheet: async function () { return { ok: true }; },
            openDesktop: function (loopId) {
              var extra = {};
              if (loopId) extra.loopId = loopId;
              return call("openDesktop", extra);
            },
            undock: async function () { return { ok: true }; },
            closeSheet: function () { return call("closeSheet"); },
            contextClosed: function () { return call("contextClosed"); },
            stubAction: async function (action) { return { ok: true, action: action, stub: true }; },
          };
        })();
        """
        return WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: true)
    }()
}

/// `WKUserContentController` delegate — resolves promises for Desktop `OsSensors`.
final class OsWebBridgeHandler: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == "juvantageOsBridge",
              let body = message.body as? [String: Any],
              let action = body["action"] as? String,
              let callbackId = body["callbackId"] as? String
        else { return }

        Task { @MainActor in
            let payload: [String: Any]
            let ok: Bool
            switch action {
            case "ambientSample":
                let s = AmbientSampler.sample()
                ok = true
                payload = [
                    "ok": s.ok,
                    "idleSeconds": s.idleSeconds,
                    "app": s.app,
                    "title": s.title as Any,
                    "url": s.url as Any,
                ]
            case "episodicContext":
                let eye = AmbientSampler.episodicContext()
                ok = true
                payload = [
                    "ok": eye.ok,
                    "app": eye.app,
                    "title": eye.title as Any,
                    "text": eye.text as Any,
                    "axTrusted": eye.axTrusted,
                ]
            case "clipContext":
                let c = AmbientSampler.clipContext()
                ok = true
                payload = [
                    "ok": c.ok,
                    "idleSeconds": c.idleSeconds,
                    "app": c.app,
                    "title": c.title,
                    "summary": c.summary,
                ]
            case "openExternal":
                ok = await Self.openExternal(urlString: body["url"] as? String)
                payload = ok ? ["ok": true] : ["ok": false, "error": "invalid url"]
            case "openDesktop":
                var info: [String: Any]?
                if let loopId = body["loopId"] as? String, !loopId.isEmpty {
                    info = ["loopId": loopId]
                }
                NotificationCenter.default.post(name: .juvOsOpenDesktop, object: nil, userInfo: info)
                ok = true
                payload = ["ok": true]
            case "voiceResult":
                VoiceController.shared.show(
                    ok: body["ok"] as? Bool ?? false,
                    body["message"] as? String ?? "Done"
                )
                ok = true
                payload = ["ok": true]
            case "closeSheet":
                NotificationCenter.default.post(name: .juvOsCloseSheet, object: nil)
                ok = true
                payload = ["ok": true]
            case "contextClosed":
                NotificationCenter.default.post(name: .juvOsContextClosed, object: nil)
                ok = true
                payload = ["ok": true]
            default:
                ok = false
                payload = ["error": "unknown action"]
            }
            self.resolve(callbackId: callbackId, ok: ok, payload: payload)
        }
    }

    private func resolve(callbackId: String, ok: Bool, payload: [String: Any]) {
        guard let webView,
              let data = try? JSONSerialization.data(withJSONObject: payload),
              let json = String(data: data, encoding: .utf8)
        else { return }
        let escapedId = callbackId.replacingOccurrences(of: "'", with: "\\'")
        let js = "window.__juvOsResolve('\(escapedId)', \(ok ? "true" : "false"), \(json));"
        webView.evaluateJavaScript(js, completionHandler: nil)
    }

    private static func openExternal(urlString: String?) async -> Bool {
        guard let urlString,
              let url = URL(string: urlString),
              url.scheme == "http" || url.scheme == "https"
        else { return false }
        return NSWorkspace.shared.open(url)
    }

    static func attach(to configuration: WKWebViewConfiguration) -> OsWebBridgeHandler {
        let handler = OsWebBridgeHandler()
        configuration.userContentController.add(handler, name: "juvantageOsBridge")
        configuration.userContentController.addUserScript(OsWebBridgeScript.userScript)
        return handler
    }
}
