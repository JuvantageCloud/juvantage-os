import ApplicationServices
import AVFoundation
import AppKit
import Speech
import SwiftUI

/// Single window on first launch: explain permissions, then start agent (no quick sheet pile-up).
struct LaunchHubView: View {
    @ObservedObject private var brain = BrainClient.shared
  @State private var axDone = AXIsProcessTrusted()
    @State private var voiceDone = false

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Juvantage OS")
                .font(.title2.weight(.semibold))
            Text("One setup screen, then the teal agent in the corner. We do not open the quick sheet or Desktop until you ask.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)

            Text(brain.healthDetail)
                .font(.caption)
                .foregroundStyle(.secondary)

            GroupBox("Permissions (macOS shows one dialog at a time)") {
                VStack(alignment: .leading, spacing: 10) {
                    permissionRow(
                        title: "Screen context",
                        detail: "Reads front window title and selection for open loops — not full screen recording.",
                        done: axDone,
                        actionTitle: axDone ? "Allowed" : "Allow in System Settings"
                    ) {
                        AmbientSampler.requestAccessibility()
                        axDone = AXIsProcessTrusted()
                    }
                    permissionRow(
                        title: "Voice (hold fn)",
                        detail: "Microphone and speech while fn is held; drafts only until you approve.",
                        done: voiceDone,
                        actionTitle: voiceReady ? "Allowed" : "Allow microphone & speech"
                    ) {
                        VoiceController.shared.requestPermissions()
                        refreshVoice()
                    }
                }
                .padding(.vertical, 4)
            }

            HStack(spacing: 10) {
                Button("Start Juvantage") {
                    LaunchPolicy.finishOnboarding()
                }
                .buttonStyle(.borderedProminent)
                .keyboardShortcut(.defaultAction)

                Button("Open Desktop") {
                    LaunchPolicy.finishOnboarding()
                    ShellController.shared.openDesktop()
                }

                Button("Quick sheet") {
                    LaunchPolicy.finishOnboarding()
                    ShellController.shared.showQuickSheet()
                }
            }

            Text("Later: ✨ menu bar · teal agent · ⌘⇧L clip")
                .font(.caption)
                .foregroundStyle(.tertiary)

            #if DEBUG
            Button("Reset onboarding (dev)") {
                LaunchPolicy.hasCompletedOnboarding = false
                axDone = false
                voiceDone = false
            }
            .font(.caption)
            #endif
        }
        .padding(24)
        .frame(minWidth: 460, minHeight: 340)
        .background(Color(red: 0.96, green: 0.95, blue: 0.91))
        .task {
            await brain.refreshHealth()
            refreshVoice()
            if LaunchPolicy.hasCompletedOnboarding {
                ShellController.shared.setupAgentPanel()
                LaunchPolicy.hideHubWindows()
            }
        }
        .onAppear {
            refreshVoice()
        }
    }

    private var voiceReady: Bool {
        voiceDone
    }

    private func refreshVoice() {
        let speech = SFSpeechRecognizer.authorizationStatus() == .authorized
        let mic = AVCaptureDevice.authorizationStatus(for: .audio) == .authorized
        voiceDone = speech && mic
    }

    @ViewBuilder
    private func permissionRow(
        title: String,
        detail: String,
        done: Bool,
        actionTitle: String,
        action: @escaping () -> Void
    ) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                Spacer()
                if done {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                }
            }
            Text(detail)
                .font(.caption)
                .foregroundStyle(.secondary)
            Button(actionTitle, action: action)
                .disabled(done)
                .font(.caption)
        }
    }
}