import AppKit
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
