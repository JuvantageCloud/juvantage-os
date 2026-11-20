import AppKit
import ApplicationServices
import CoreGraphics
import Foundation

/// On-device ambient + clip sampling (parity with Electron `os:ambient-sample` / `os:clip-context`).
enum AmbientSampler {
    struct AmbientPayload {
        let ok: Bool
        let idleSeconds: Int
        let app: String
        let title: String?
        let url: String?
    }

    struct EpisodicPayload {
        let ok: Bool
        let app: String
        let title: String?
        let text: String?
        /// False when macOS is blocking the highlighted-line read.
        let axTrusted: Bool
    }

    struct ClipPayload {
        let ok: Bool
        let idleSeconds: Int
        let app: String
        let title: String
        let summary: String
    }

    static func sample() -> AmbientPayload {
        let idle = Int(CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: .null))
        let app = frontAppName()
        let title = windowTitle(for: app)
        return AmbientPayload(ok: true, idleSeconds: idle, app: app, title: title, url: nil)
    }

    /// The other app, remembered by process id so we can still read its blue line
    /// after the suggestion card comes to the front.
    private static var otherPid: pid_t = 0
    private static var otherName = ""
    private static var didPromptAccess = false

    /// Call this before the sheet becomes the front app.
    static func rememberFrontWindow() {
        captureOtherApp()
    }

    /// One read of the other app's highlighted line. No screenshot is stored.
    static func episodicContext() -> EpisodicPayload {
        promptForAccessIfNeeded()
        captureOtherApp()
        let trusted = AXIsProcessTrusted()
        guard otherPid > 0 else {
            return EpisodicPayload(ok: false, app: "", title: nil, text: nil, axTrusted: trusted)
        }
        let read = readApp(pid: otherPid)
        let title = read.title ?? windowTitle(for: otherName)
        return EpisodicPayload(ok: true, app: otherName, title: title, text: read.text, axTrusted: trusted)
    }

    private static func captureOtherApp() {
        guard let front = NSWorkspace.shared.frontmostApplication else { return }
        if isHost(front) { return }
        let name = front.localizedName ?? "Front window"
        if isEphemeralContextApp(name) { return }
        otherPid = front.processIdentifier
        otherName = name
    }

    /// Settings and our own UI are not work context — keep the prior app (e.g. Xcode).
    private static func isEphemeralContextApp(_ name: String) -> Bool {
        let n = name.lowercased()
        if n.contains("system settings") || n == "settings" { return true }
        return false
    }

    private static func isHost(_ app: NSRunningApplication) -> Bool {
        if app.bundleIdentifier == Bundle.main.bundleIdentifier { return true }
        return (app.localizedName ?? "").lowercased().contains("juvantage")
    }

    private static func promptForAccessIfNeeded() {
        if AXIsProcessTrusted() || didPromptAccess { return }
        didPromptAccess = true
        let key = kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String
        let options = [key: true] as CFDictionary
        _ = AXIsProcessTrustedWithOptions(options)
    }

    /// Highlighted text and window name for one app, even if it is not frontmost anymore.
    private static func readApp(pid: pid_t) -> (title: String?, text: String?) {
        let app = AXUIElementCreateApplication(pid)
        var title: String?
        if let window = copyElement(app, kAXFocusedWindowAttribute) {
            title = trimmed(copyString(window, kAXTitleAttribute), min: 1, max: 200)
        }
        var text: String?
        if let focused = copyElement(app, kAXFocusedUIElementAttribute) {
            text = selectedText(in: focused, depth: 3)
        }
        if text == nil, let window = copyElement(app, kAXFocusedWindowAttribute) {
            text = selectedText(in: window, depth: 6)
        }
        // Pasteboard does not require Accessibility — ⌘C after highlight works even when AX is finicky.
        if text == nil {
            text = freshClipboardSnippet()
        }
        return (title, text)
    }

    /// When Xcode hides AX selection, ⌘C right before opening the sheet still works in dev.
    private static func freshClipboardSnippet() -> String? {
        let clip = (NSPasteboard.general.string(forType: .string) ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed(clip, min: 8, max: 600)
    }

    private static func selectedText(in element: AXUIElement, depth: Int) -> String? {
        if let hit = trimmed(copyString(element, kAXSelectedTextAttribute), min: 8, max: 600) {
            return hit
        }
        if let hit = textFromSelectedRange(in: element) {
            return hit
        }
        if depth <= 0 { return nil }
        var rawKids: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element, kAXChildrenAttribute as CFString, &rawKids) == .success,
              let kids = rawKids as? [AXUIElement]
        else { return nil }
        for kid in kids.prefix(24) {
            if let found = selectedText(in: kid, depth: depth - 1) { return found }
        }
        return nil
    }

    private static func textFromSelectedRange(in element: AXUIElement) -> String? {
        guard let full = copyString(element, kAXValueAttribute), full.count >= 8 else { return nil }
        var rawRange: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element, kAXSelectedTextRangeAttribute as CFString, &rawRange) == .success,
              let axValue = rawRange
        else { return nil }
        var range = CFRange()
        guard AXValueGetValue(axValue as! AXValue, .cfRange, &range), range.length >= 8 else { return nil }
        let ns = full as NSString
        guard range.location >= 0, range.location + range.length <= ns.length else { return nil }
        let slice = ns.substring(with: NSRange(location: range.location, length: min(range.length, 600)))
        return trimmed(slice, min: 8, max: 600)
    }

    private static func copyElement(_ element: AXUIElement, _ attribute: String) -> AXUIElement? {
        var raw: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element, attribute as CFString, &raw) == .success,
              let raw
        else { return nil }
        return (raw as! AXUIElement)
    }

    private static func copyString(_ element: AXUIElement, _ attribute: String) -> String? {
        var raw: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element, attribute as CFString, &raw) == .success else { return nil }
        return raw as? String
    }

    private static func trimmed(_ raw: String?, min: Int, max: Int) -> String? {
        guard let raw else { return nil }
        let text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard text.count >= min else { return nil }
        return String(text.prefix(max))
    }

    static func clipContext() -> ClipPayload {
        let idle = Int(CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: .null))
        let app = frontAppName()
        let clip = (NSPasteboard.general.string(forType: .string) ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmed = String(clip.prefix(240))
        let title = trimmed.isEmpty ? "Clipped while in \(app)" : trimmed
        let summary = trimmed.isEmpty
            ? "Clip hotkey — mark current context as a loop"
            : "Clipboard: \(trimmed)"
        return ClipPayload(ok: true, idleSeconds: idle, app: app, title: title, summary: summary)
    }

    private static func frontAppName() -> String {
        NSWorkspace.shared.frontmostApplication?.localizedName ?? "Unknown"
    }

    private static func windowTitle(for appName: String) -> String? {
        guard !appName.isEmpty, appName != "Unknown" else { return nil }
        let script = """
        tell application "System Events"
          tell process "\(appName.replacingOccurrences(of: "\"", with: "\\\""))"
            try
              return name of front window
            on error
              return ""
            end try
          end tell
        end tell
        """
        guard let out = runOsascript(script)?.trimmingCharacters(in: .whitespacesAndNewlines), !out.isEmpty else {
            return nil
        }
        return String(out.prefix(200))
    }

    private static func runOsascript(_ source: String) -> String? {
        let task = Process()
        let pipe = Pipe()
        task.standardOutput = pipe
        task.standardError = Pipe()
        task.executableURL = URL(fileURLWithPath: "/usr/bin/osascript")
        task.arguments = ["-e", source]
        do {
            try task.run()
            task.waitUntilExit()
            guard task.terminationStatus == 0 else { return nil }
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            return String(data: data, encoding: .utf8)
        } catch {
            return nil
        }
    }
}
