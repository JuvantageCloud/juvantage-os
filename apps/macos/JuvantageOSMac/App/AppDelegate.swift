import AppKit
import SwiftUI

@MainActor
final class ShellController: ObservableObject {
    static let shared = ShellController()

    private var agentPanel: NSPanel?
    private var quickSheetPanel: NSPanel?
    private var desktopWindow: NSWindow?

    func setupAgentPanel() {
        guard agentPanel == nil else { return }

        let panel = NSPanel(
            contentRect: NSRect(x: 0, y: 0, width: 72, height: 72),
            styleMask: [.nonactivatingPanel, .borderless],
            backing: .buffered,
            defer: false
        )
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        panel.ignoresMouseEvents = false
        panel.isMovableByWindowBackground = true

        let host = NSHostingView(
            rootView: AgentFloatView { [weak self] in
                self?.toggleQuickSheet()
            }
        )
        host.autoresizingMask = [.width, .height]
        host.frame = panel.contentView!.bounds
        panel.contentView = host
        panel.contentMinSize = NSSize(width: 72, height: 72)
        positionAgent(panel)
        panel.orderFrontRegardless()
        agentPanel = panel
    }

    func toggleQuickSheet() {
        if let quickSheetPanel, quickSheetPanel.isVisible {
            quickSheetPanel.orderOut(nil)
            return
        }
        showQuickSheet()
    }

    func showQuickSheet() {
        AmbientSampler.rememberFrontWindow()
        Task { @MainActor in
            await BrainClient.shared.ensureDevLoginIfNeeded()
            await BrainClient.shared.pushEpisodicFromFrontWindow()
            OsWebViewRegistry.injectAuthTokenIntoWebViews()
        }
        if quickSheetPanel == nil {
            let panel = NSPanel(
                contentRect: NSRect(x: 0, y: 0, width: 380, height: 520),
                styleMask: [.titled, .closable, .fullSizeContentView, .nonactivatingPanel],
                backing: .buffered,
                defer: false
            )
            panel.title = "Quick sheet"
            panel.titlebarAppearsTransparent = true
            panel.isFloatingPanel = true
            panel.level = .floating
            panel.collectionBehavior = [.moveToActiveSpace, .fullScreenAuxiliary]
            let host = NSHostingView(
                rootView: QuickSheetPanelView { [weak self] in
                    self?.openDesktop()
                }
            )
            panel.contentView = host
            positionQuickSheet(relativeTo: agentPanel, panel: panel)
            quickSheetPanel = panel
        }
        quickSheetPanel?.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func openDesktop() {
        if desktopWindow == nil {
            let window = NSWindow(
                contentRect: NSRect(x: 0, y: 0, width: 980, height: 680),
                styleMask: [.titled, .closable, .miniaturizable, .resizable],
                backing: .buffered,
                defer: false
            )
            window.title = "Juvantage OS"
            window.center()
            window.contentView = NSHostingView(rootView: DesktopWindowView())
            window.isReleasedWhenClosed = false
            desktopWindow = window
        }
        desktopWindow?.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        quickSheetPanel?.orderOut(nil)
    }

    private func positionAgent(_ panel: NSPanel) {
        guard let screen = NSScreen.main?.visibleFrame else { return }
        let x = screen.maxX - panel.frame.width - 28
        let y = screen.minY + 36
        panel.setFrameOrigin(NSPoint(x: x, y: y))
    }

    private func positionQuickSheet(relativeTo agent: NSPanel?, panel: NSPanel) {
        guard let agent else {
            panel.center()
            return
        }
        let ax = agent.frame.origin.x
        let ay = agent.frame.origin.y
        let x = ax + agent.frame.width - panel.frame.width
        let y = ay + agent.frame.height + 12
        panel.setFrameOrigin(NSPoint(x: x, y: y))
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    private var clipMonitors: [Any] = []

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        registerClipHotkey()
        Task { @MainActor in
            ShellController.shared.setupAgentPanel()
            VoiceController.shared.start()
            await BrainClient.shared.refreshHealth()
            await BrainClient.shared.ensureDevLoginIfNeeded()
            OsWebViewRegistry.injectAuthTokenIntoWebViews()
            ShellController.shared.toggleQuickSheet()
            NSApp.activate(ignoringOtherApps: true)
        }
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

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        false
    }
}
