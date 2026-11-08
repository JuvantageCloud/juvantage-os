import SwiftUI

enum JVTheme {
    static let cream = Color(red: 0.988, green: 0.984, blue: 0.969) // #FCFBF7
    static let ink = Color(red: 0.043, green: 0.071, blue: 0.125) // #0B1220
    static let muted = Color(red: 0.42, green: 0.45, blue: 0.48)
    static let teal = Color(red: 0.051, green: 0.478, blue: 0.435) // #0D7A6F
    static let tealDeep = Color(red: 0.176, green: 0.353, blue: 0.337) // #2D5A56
    static let attention = Color(red: 0.85, green: 0.45, blue: 0.22)
    static let card = Color.white
    static let hairline = Color.black.opacity(0.08)

    static let display = Font.system(.largeTitle, design: .serif).weight(.semibold)
    static let title = Font.system(.title2, design: .serif).weight(.semibold)
    static let body = Font.system(.body, design: .default)
    static let caption = Font.system(.caption, design: .default)
}

struct JVScreen: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(JVTheme.cream.ignoresSafeArea())
    }
}

extension View {
    func jvScreen() -> some View {
        modifier(JVScreen())
    }
}
