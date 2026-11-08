import SwiftUI

struct SocialHubView: View {
    @State private var posts: [SocialPostDTO] = []
    @State private var filter = "all"

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        filterChip("All", "all")
                        filterChip("Instagram", "instagram")
                        filterChip("TikTok", "tiktok")
                    }

                    ForEach(posts) { post in
                        NavigationLink {
                            SocialDetailView(postId: post.id)
                        } label: {
                            JVCard {
                                VStack(alignment: .leading, spacing: 10) {
                                    HStack {
                                        Text(post.platform.capitalized).font(.headline)
                                        Text(post.title).foregroundStyle(JVTheme.muted)
                                        Spacer()
                                        Image(systemName: "chevron.right").foregroundStyle(JVTheme.muted)
                                    }
                                    RoundedRectangle(cornerRadius: 10)
                                        .fill(Color.gray.opacity(0.15))
                                        .frame(height: 120)
                                        .overlay(Image(systemName: "play.circle.fill").font(.largeTitle).foregroundStyle(JVTheme.teal))
                                    Text(post.caption)
                                        .font(.subheadline)
                                        .foregroundStyle(JVTheme.ink)
                                        .lineLimit(3)
                                    HStack {
                                        Text(formatViews(post.views))
                                        Spacer()
                                        Text("↑ +\(Int(post.engagementDelta))% engagement")
                                            .foregroundStyle(JVTheme.teal)
                                    }
                                    .font(.caption)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                    }

                    if let top = posts.first {
                        HStack(spacing: 10) {
                            Image(systemName: "chart.bar.fill").foregroundStyle(JVTheme.teal)
                            Text("\(top.businessName) Reel outperforming average by 2.1x.")
                                .font(.subheadline)
                            Spacer()
                        }
                        .padding()
                        .background(JVTheme.teal.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
                .padding(20)
            }
            .jvScreen()
            .navigationTitle("Social")
            .task(id: filter) {
                posts = (try? await APIClient.shared.social(platform: filter)) ?? []
            }
        }
    }

    private func filterChip(_ title: String, _ value: String) -> some View {
        Button(title) { filter = value }
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(filter == value ? JVTheme.tealDeep : Color.white)
            .foregroundStyle(filter == value ? .white : JVTheme.ink)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(JVTheme.hairline))
    }

    private func formatViews(_ n: Int) -> String {
        if n >= 1000 { return String(format: "%.1fk views", Double(n) / 1000) }
        return "\(n) views"
    }
}

struct SocialDetailView: View {
    let postId: String
    @State private var post: SocialPostDTO?

    var body: some View {
        ScrollView {
            if let post {
                VStack(alignment: .leading, spacing: 18) {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 200)
                        .overlay {
                            VStack {
                                Image(systemName: "play.circle.fill").font(.largeTitle).foregroundStyle(.white)
                                Text(post.platform == "instagram" ? "Instagram Reel" : "TikTok Video")
                                    .foregroundStyle(.white)
                            }
                        }
                        .overlay(alignment: .bottomLeading) {
                            if let d = post.durationSec {
                                Text("0:\(String(format: "%02d", d))")
                                    .font(.caption)
                                    .padding(8)
                                    .background(.ultraThinMaterial)
                                    .clipShape(Capsule())
                                    .padding(12)
                            }
                        }

                    HStack {
                        metric("Views", format(post.views))
                        metric("Likes", format(post.likes ?? 0))
                        metric("Comments", format(post.comments ?? 0))
                        metric("Shares", format(post.shares ?? 0))
                    }

                    JVCard {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("Engagement Rate")
                                Spacer()
                                Text(String(format: "%.1f%%", post.engagementRate ?? 0))
                                    .foregroundStyle(JVTheme.teal)
                                    .font(.title3.weight(.bold))
                            }
                            Text("↑ 1.3%  ·  Audience peak mid-roll")
                                .font(.caption)
                                .foregroundStyle(JVTheme.muted)
                        }
                    }

                    NavigationLink {
                        AgentChatView(agentName: "Growth Agent")
                    } label: {
                        Label("Ask Growth Agent for next hooks.", systemImage: "sparkles")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(JVTheme.teal.opacity(0.12))
                            .foregroundStyle(JVTheme.tealDeep)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    HStack {
                        Text(post.businessName).font(.headline)
                        Text("Business account").font(.caption).foregroundStyle(JVTheme.muted)
                    }
                }
                .padding(20)
            } else {
                ProgressView().padding(.top, 60)
            }
        }
        .jvScreen()
        .navigationTitle("Reel insights")
        .navigationBarTitleDisplayMode(.inline)
        .task { post = try? await APIClient.shared.socialPost(id: postId) }
    }

    private func metric(_ label: String, _ value: String) -> some View {
        VStack {
            Text(value).font(.headline)
            Text(label).font(.caption2).foregroundStyle(JVTheme.muted)
        }
        .frame(maxWidth: .infinity)
    }

    private func format(_ n: Int) -> String {
        if n >= 1000 { return String(format: "%.1fk", Double(n) / 1000) }
        return "\(n)"
    }
}
