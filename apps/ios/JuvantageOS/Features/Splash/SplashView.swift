import SwiftUI

struct SplashView: View {
    @State private var pulse = false

    var body: some View {
        VStack(spacing: 20) {
            Spacer()
            ZStack {
                ForEach(0..<3, id: \.self) { i in
                    Diamond()
                        .fill(JVTheme.teal.opacity(1 - Double(i) * 0.25))
                        .frame(width: 44, height: 44)
                        .offset(y: CGFloat(i) * -10)
                }
            }
            .scaleEffect(pulse ? 1.05 : 0.95)
            Text("Juvantage")
                .font(JVTheme.display)
                .foregroundStyle(JVTheme.ink)
            Text("Business OS")
                .font(.subheadline.weight(.medium))
                .foregroundStyle(JVTheme.teal)
            Spacer()
            Text("Your businesses. Live.")
                .font(.footnote)
                .foregroundStyle(JVTheme.muted)
                .padding(.bottom, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .jvScreen()
        .onAppear {
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                pulse = true
            }
        }
    }
}

struct Diamond: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: rect.midX, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.midY))
        p.addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
        p.addLine(to: CGPoint(x: rect.minX, y: rect.midY))
        p.closeSubpath()
        return p
    }
}
