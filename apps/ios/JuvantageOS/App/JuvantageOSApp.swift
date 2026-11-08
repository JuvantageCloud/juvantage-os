import SwiftUI

@main
struct JuvantageOSApp: App {
    @StateObject private var appModel = AppModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appModel)
        }
    }
}

struct RootView: View {
    @EnvironmentObject var appModel: AppModel

    var body: some View {
        Group {
            if appModel.isBootstrapping {
                SplashView()
            } else if !appModel.isAuthenticated {
                AuthView()
            } else if appModel.showOnboarding {
                OnboardingView()
            } else {
                MainTabView()
            }
        }
        .animation(.easeInOut(duration: 0.25), value: appModel.isAuthenticated)
    }
}
