import AppKit
import AVFoundation
import Speech

/// Push-to-talk: hold fn → on-device speech → transcript handed to the React quick sheet,
/// which drafts a proposal. Nothing executes until Approve.
@MainActor
final class VoiceController: ObservableObject {
    static let shared = VoiceController()

    enum Phase: Equatable {
        case idle
        case listening
        case thinking
        case done(ok: Bool)
    }

    @Published private(set) var phase: Phase = .idle
    @Published private(set) var transcript = ""
    @Published private(set) var reply = ""
    @Published private(set) var level: Float = 0

    /// Hold threshold so fn taps (emoji / input switch) and fn+key combos don't start listening.
    private let holdDelay: TimeInterval = 0.22

    private var monitors: [Any] = []
    private var fnDown = false
    private var holdWork: DispatchWorkItem?
    private var finishWork: DispatchWorkItem?
    private var resultTimeout: DispatchWorkItem?
    private var hideWork: DispatchWorkItem?

    private let engine = AVAudioEngine()
    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?

    func start() {
        guard monitors.isEmpty else { return }
        if let global = NSEvent.addGlobalMonitorForEvents(matching: [.flagsChanged, .keyDown], handler: { event in
            let type = event.type
            let flags = event.modifierFlags
            MainActor.assumeIsolated { VoiceController.shared.handle(type: type, flags: flags) }
        }) {
            monitors.append(global)
        }
        if let local = NSEvent.addLocalMonitorForEvents(matching: [.flagsChanged, .keyDown], handler: { event in
            let type = event.type
            let flags = event.modifierFlags
            MainActor.assumeIsolated { VoiceController.shared.handle(type: type, flags: flags) }
            return event
        }) {
            monitors.append(local)
        }
        SFSpeechRecognizer.requestAuthorization { _ in }
        AVCaptureDevice.requestAccess(for: .audio) { _ in }
    }

    // MARK: fn tracking

    private func handle(type: NSEvent.EventType, flags: NSEvent.ModifierFlags) {
        if type == .keyDown {
            if fnDown { cancelHold() }
            return
        }
        let mods = flags.intersection(.deviceIndependentFlagsMask).subtracting(.capsLock)
        if mods == .function, !fnDown {
            fnDown = true
            let work = DispatchWorkItem { MainActor.assumeIsolated { VoiceController.shared.beginListening() } }
            holdWork = work
            DispatchQueue.main.asyncAfter(deadline: .now() + holdDelay, execute: work)
        } else if fnDown, !mods.contains(.function) {
            fnDown = false
            holdWork?.cancel()
            if phase == .listening { endListening() }
        } else if fnDown, mods != .function {
            cancelHold()
        }
    }

    private func cancelHold() {
        fnDown = false
        holdWork?.cancel()
        if phase == .listening { cancel() }
    }

    // MARK: speech

    private func beginListening() {
        guard fnDown, phase != .listening, phase != .thinking else { return }
        hideWork?.cancel()
        transcript = ""
        reply = ""
        level = 0

        guard SFSpeechRecognizer.authorizationStatus() == .authorized,
              AVCaptureDevice.authorizationStatus(for: .audio) == .authorized
        else {
            show(ok: false, "Allow Microphone + Speech Recognition for Juvantage OS in System Settings → Privacy")
            return
        }
        guard let recognizer, recognizer.isAvailable else {
            show(ok: false, "Speech recognition unavailable right now")
            return
        }

        let req = SFSpeechAudioBufferRecognitionRequest()
        req.shouldReportPartialResults = true
        req.addsPunctuation = true
        if recognizer.supportsOnDeviceRecognition {
            req.requiresOnDeviceRecognition = true
        }

        let input = engine.inputNode
        input.removeTap(onBus: 0)
        input.installTap(
            onBus: 0,
            bufferSize: 1024,
            format: input.outputFormat(forBus: 0),
            block: Self.tapBlock(request: req)
        )
        engine.prepare()
        do {
            try engine.start()
        } catch {
            input.removeTap(onBus: 0)
            show(ok: false, "Microphone unavailable")
            return
        }

        request = req
        task = recognizer.recognitionTask(with: req) { result, error in
            let text = result?.bestTranscription.formattedString
            let isFinal = result?.isFinal ?? false
            let failed = error != nil
            Task { @MainActor in
                VoiceController.shared.onRecognition(text: text, isFinal: isFinal, failed: failed)
            }
        }
        phase = .listening
        VoicePillWindow.shared.show()
    }

    private nonisolated static func tapBlock(
        request: SFSpeechAudioBufferRecognitionRequest
    ) -> AVAudioNodeTapBlock {
        { buffer, _ in
            request.append(buffer)
            let rms = Self.rms(buffer)
            Task { @MainActor in VoiceController.shared.level = rms }
        }
    }

    private nonisolated static func rms(_ buffer: AVAudioPCMBuffer) -> Float {
        guard let samples = buffer.floatChannelData?[0] else { return 0 }
        let n = Int(buffer.frameLength)
        guard n > 0 else { return 0 }
        var sum: Float = 0
        for i in 0..<n { sum += samples[i] * samples[i] }
        return (sum / Float(n)).squareRoot()
    }

    private func stopAudio() {
        if engine.isRunning { engine.stop() }
        engine.inputNode.removeTap(onBus: 0)
        request?.endAudio()
        level = 0
    }

    private func endListening() {
        stopAudio()
        phase = .thinking
        let work = DispatchWorkItem { MainActor.assumeIsolated { VoiceController.shared.deliver() } }
        finishWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5, execute: work)
    }

    func cancel() {
        stopAudio()
        task?.cancel()
        task = nil
        request = nil
        finishWork?.cancel()
        resultTimeout?.cancel()
        phase = .idle
        VoicePillWindow.shared.hide()
    }

    private func onRecognition(text: String?, isFinal: Bool, failed: Bool) {
        if let text, !text.isEmpty { transcript = text }
        if phase == .thinking, isFinal || failed { deliver() }
    }

    private func deliver() {
        guard phase == .thinking else { return }
        finishWork?.cancel()
        task?.finish()
        task = nil
        request = nil

        let text = transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        guard text.count >= 3 else {
            show(ok: false, "Didn't catch that — hold fn and speak")
            return
        }
        reply = "Drafting…"
        ShellController.shared.showQuickSheet()
        OsWebViewRegistry.sendVoiceTranscript(text)

        let timeout = DispatchWorkItem {
            MainActor.assumeIsolated {
                let voice = VoiceController.shared
                guard voice.phase == .thinking else { return }
                voice.show(ok: false, "Quick sheet didn't answer — is `npm run dev:os` running?")
            }
        }
        resultTimeout = timeout
        DispatchQueue.main.asyncAfter(deadline: .now() + 10, execute: timeout)
    }

    /// Called by the web bridge once the sheet drafted (or failed).
    func show(ok: Bool, _ message: String) {
        resultTimeout?.cancel()
        reply = message
        phase = .done(ok: ok)
        VoicePillWindow.shared.show()
        hideWork?.cancel()
        let work = DispatchWorkItem {
            MainActor.assumeIsolated {
                let voice = VoiceController.shared
                guard case .done = voice.phase else { return }
                voice.phase = .idle
                VoicePillWindow.shared.hide()
            }
        }
        hideWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + (ok ? 3.5 : 5), execute: work)
    }
}
