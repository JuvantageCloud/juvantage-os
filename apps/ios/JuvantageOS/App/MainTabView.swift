import SwiftUI

struct MainTabView: View {
    @State private var tab = 0

    var body: some View {
        TabView(selection: $tab) {
            HomeView()
                .tabItem { Label("Home", systemImage: "house.fill") }
                .tag(0)
            SocialHubView()
                .tabItem { Label("Social", systemImage: "person.2.fill") }
                .tag(1)
            CalendarView()
                .tabItem { Label("Calendar", systemImage: "calendar") }
                .tag(2)
            AgentsListView()
                .tabItem { Label("Agents", systemImage: "bubble.left.and.bubble.right.fill") }
                .tag(3)
            MoreView()
                .tabItem { Label("More", systemImage: "ellipsis") }
                .tag(4)
        }
        .tint(JVTheme.teal)
    }
}
