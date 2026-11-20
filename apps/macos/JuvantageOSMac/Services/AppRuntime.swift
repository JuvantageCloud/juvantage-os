import AppKit

/// Global shortcuts and monitors — installed only after onboarding (they trigger Accessibility prompts).
@MainActor
final class AppRuntime {
    static let shared = AppRuntime()

    private var clipMonitors: [Any] = []
    private var installed = false

    func installGlobalShortcuts() {
        guard !installed else { return }
        installed = true
        registerClipHotkey()
        VoiceController.shared.startMonitors()
    }

    private func registerClipHotkey() {
        let handler: (NSEvent) -> Void = { event in
            guard event.modifierFlags.contains([.command, .shift]),
                  event.charactersIgnoringModifiers?.lowercased() == "l"
            else { return }
            OsWebViewRegistry.broadcastClipHotkey()
            Task { @MainActor in
                ShellController.shared.toggleQuickSheet()
            }
        }
        if let global = NSEvent.addGlobalMonitorForEvents(matching: .keyDown, handler: handler) {
            clipMonitors.append(global)
        }
        let local = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { event in
            handler(event)
            return event
        }
        clipMonitors.append(local)
    }
}