import SwiftUI

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(JVTheme.teal.opacity(configuration.isPressed ? 0.85 : 1))
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

struct JVCard<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View {
        content
            .padding(16)
            .background(JVTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(JVTheme.hairline, lineWidth: 1)
            )
    }
}

struct StatusPill: View {
    let text: String
    let tone: Tone
    enum Tone { case ok, warn, live }

    var color: Color {
        switch tone {
        case .ok, .live: return JVTheme.teal
        case .warn: return JVTheme.attention
        }
    }

    var body: some View {
        HStack(spacing: 6) {
            Circle().fill(color).frame(width: 7, height: 7)
            Text(text)
                .font(.caption.weight(.semibold))
                .foregroundStyle(color)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(color.opacity(0.12))
        .clipShape(Capsule())
    }
}

struct MetricChip: View {
    let label: String
    let value: String
    let tone: String
    let hint: String?

    var color: Color {
        switch tone {
        case "ok": return JVTheme.teal
        case "warn": return JVTheme.attention
        case "bad": return .red.opacity(0.8)
        default: return JVTheme.muted
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Circle().fill(color).frame(width: 6, height: 6)
                Text(label).font(.caption).foregroundStyle(JVTheme.muted)
            }
            Text(value).font(.headline).foregroundStyle(JVTheme.ink)
            if let hint {
                Text(hint).font(.caption2).foregroundStyle(JVTheme.muted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

func formatMoney(_ value: Double) -> String {
    if value >= 1000 {
        return String(format: "$%.1fk", value / 1000)
    }
    return String(format: "$%.0f", value)
}

func relativeTime(_ iso: String) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    var date = formatter.date(from: iso)
    if date == nil {
        formatter.formatOptions = [.withInternetDateTime]
        date = formatter.date(from: iso)
    }
    guard let date else { return "" }
    let seconds = Int(Date().timeIntervalSince(date))
    if seconds < 60 { return "\(max(seconds, 1))s ago" }
    if seconds < 3600 { return "\(seconds / 60)m ago" }
    if seconds < 86400 { return "\(seconds / 3600)h ago" }
    return "\(seconds / 86400)d ago"
}
