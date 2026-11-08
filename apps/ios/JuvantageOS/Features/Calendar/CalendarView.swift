import SwiftUI

struct CalendarView: View {
    @State private var data: CalendarResponseDTO?
    @State private var selectedDay = Date()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text(selectedDay.formatted(.dateTime.weekday(.wide).month().day()))
                        .font(JVTheme.title)
                        .foregroundStyle(JVTheme.ink)

                    if let data {
                        HStack {
                            Image(systemName: "arrow.triangle.2.circlepath")
                            Text("\(data.source) • synced \(data.syncedAt.map(relativeTime) ?? "just now")")
                        }
                        .font(.caption)
                        .foregroundStyle(JVTheme.muted)

                        ForEach(data.events) { event in
                            HStack(alignment: .top, spacing: 12) {
                                Text(timeLabel(event.startsAt))
                                    .font(.caption)
                                    .foregroundStyle(JVTheme.muted)
                                    .frame(width: 52, alignment: .leading)
                                HStack(spacing: 10) {
                                    RoundedRectangle(cornerRadius: 2)
                                        .fill(JVTheme.teal)
                                        .frame(width: 4)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(event.title).font(.headline)
                                        Text(timeRange(event))
                                            .font(.caption)
                                            .foregroundStyle(JVTheme.muted)
                                    }
                                    Spacer()
                                    Image(systemName: icon(event.icon))
                                        .foregroundStyle(JVTheme.teal)
                                }
                                .padding(12)
                                .background(Color.white)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                        }
                    } else {
                        ProgressView().padding(.top, 40)
                    }
                }
                .padding(20)
            }
            .jvScreen()
            .navigationTitle("Calendar")
            .task { data = try? await APIClient.shared.calendar() }
            .refreshable { data = try? await APIClient.shared.calendar() }
        }
    }

    private func timeLabel(_ iso: String) -> String {
        guard let d = parse(iso) else { return "" }
        return d.formatted(.dateTime.hour().minute())
    }

    private func timeRange(_ e: CalendarEventDTO) -> String {
        "\(timeLabel(e.startsAt)) – \(timeLabel(e.endsAt))"
    }

    private func parse(_ iso: String) -> Date? {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: iso) { return d }
        f.formatOptions = [.withInternetDateTime]
        return f.date(from: iso)
    }

    private func icon(_ name: String) -> String {
        switch name {
        case "people": return "person.2"
        case "chat": return "bubble.left"
        case "camera": return "camera"
        case "doc": return "doc.text"
        default: return "calendar"
        }
    }
}
