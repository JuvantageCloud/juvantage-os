import Foundation

enum AppConfig {
    /// Brain (`apps/api`). Override via scheme env `BRAIN_BASE_URL`.
    static var brainBaseURL: URL {
        if let raw = ProcessInfo.processInfo.environment["BRAIN_BASE_URL"],
           let url = URL(string: raw) {
            return url
        }
        return URL(string: "http://127.0.0.1:3001")!
    }

    /// Wide Desktop UI (`apps/desktop` Vite). Override via `DESKTOP_WEB_URL`.
    static var desktopWebURL: URL {
        if let raw = ProcessInfo.processInfo.environment["DESKTOP_WEB_URL"],
           let url = URL(string: raw) {
            return url
        }
        return URL(string: "http://127.0.0.1:5173/?route=desktop")!
    }

    /// Quick sheet React UI — same ModalityHost as Electron. Override via `QUICK_SHEET_WEB_URL`.
    static var quickSheetWebURL: URL {
        if let raw = ProcessInfo.processInfo.environment["QUICK_SHEET_WEB_URL"],
           let url = URL(string: raw) {
            return url
        }
        return URL(string: "http://127.0.0.1:5173/?route=sheet")!
    }
}
