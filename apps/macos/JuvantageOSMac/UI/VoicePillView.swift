import AppKit
import SwiftUI

private let pillTeal = Color(red: 0.36, green: 0.86, blue: 0.84)

/// Glass push-to-talk pill under the menu bar.
@MainActor
final class VoicePillWindow {
    static let shared = VoicePillWindow()

    private var panel: NSPanel?
    private let size = NSSize(width: 460, height: 120)

    func show() {
        let panel = self.panel ?? makePanel()
        self.panel = panel
        position(panel)
        if !panel.isVisible {
            panel.alphaValue = 0
            panel.orderFrontRegardless()
            NSAnimationContext.runAnimationGroup { ctx in
                ctx.duration = 0.16
                panel.animator().alphaValue = 1
            }
        }
    }

    func hide() {
        guard let panel, panel.isVisible else { return }
        NSAnimationContext.runAnimationGroup({ ctx in
            ctx.duration = 0.2
            panel.animator().alphaValue = 0
        }, completionHandler: {
            panel.orderOut(nil)
        })
    }

    private func makePanel() -> NSPanel {
        let panel = NSPanel(
            contentRect: NSRect(origin: .zero, size: size),
            styleMask: [.nonactivatingPanel, .borderless],
            backing: .buffered,
            defer: false
        )
        panel.level = .statusBar
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        let host = NSHostingView(rootView: VoicePillView())
        host.frame = NSRect(origin: .zero, size: size)
        panel.contentView = host
        return panel
    }

    private func position(_ panel: NSPanel) {
        guard let screen = NSScreen.main?.visibleFrame else { return }
        let x = screen.midX - size.width / 2
        let y = screen.maxY - size.height - 10
        panel.setFrameOrigin(NSPoint(x: x, y: y))
    }
}

struct VoicePillView: View {
    @ObservedObject private var voice = VoiceController.shared

    private var headline: String {
        switch voice.phase {
        case .idle, .listening: return "Hold fn to talk"
        case .thinking: return "Got it"
        case .done(let ok): return ok ? "Juvantage" : "Hmm"
        }
    }

    private var detail: String {
        switch voice.phase {
        case .idle: return ""
        case .listening: return voice.transcript.isEmpty ? "Listening…" : voice.transcript
        case .thinking: return voice.transcript
        case .done: return voice.reply
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 14) {
                Text(headline)
                    .font(.system(size: 17, weight: .medium, design: .rounded))
                    .foregroundStyle(pillTeal)
                Spacer(minLength: 8)
                DotMeter(level: voice.level, active: voice.phase == .listening || voice.phase == .thinking)
                Button {
                    voice.cancel()
                } label: {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(pillTeal)
                        .frame(width: 13, height: 13)
                }
                .buttonStyle(.plain)
                .help("Stop")
            }
            if !detail.isEmpty {
                Text(detail)
                    .font(.system(size: 15, weight: .regular, design: .rounded))
                    .foregroundStyle(.white.opacity(0.88))
                    .lineLimit(2)
                    .truncationMode(.head)
            }
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 16)
        .frame(width: 440, alignment: .leading)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 34, style: .continuous))
        .background(
            RoundedRectangle(cornerRadius: 34, style: .continuous)
                .fill(Color(red: 0.06, green: 0.22, blue: 0.22).opacity(0.55))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 34, style: .continuous)
                .strokeBorder(pillTeal.opacity(0.4), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.35), radius: 14, y: 6)
        .environment(\.colorScheme, .dark)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .animation(.easeOut(duration: 0.15), value: detail)
    }
}

/// 8×3 dot-matrix level meter.
private struct DotMeter: View {
    var level: Float
    var active: Bool

    var body: some View {
        TimelineView(.animation(minimumInterval: 1 / 24, paused: !active)) { ctx in
            let t = ctx.date.timeIntervalSinceReferenceDate
            HStack(spacing: 4) {
                ForEach(0..<8, id: \.self) { col in
                    let wave = (sin(t * 7 + Double(col) * 0.9) + 1) / 2
                    let amp = active ? min(1, 0.25 + Double(level) * 9) : 0.1
                    let lit = Int((wave * amp * 3).rounded())
                    VStack(spacing: 4) {
                        ForEach(0..<3, id: \.self) { row in
                            Circle()
                                .fill(pillTeal.opacity(3 - row <= lit ? 1 : 0.22))
                                .frame(width: 5, height: 5)
                        }
                    }
                }
            }
        }
        .frame(width: 92, height: 23)
    }
}
