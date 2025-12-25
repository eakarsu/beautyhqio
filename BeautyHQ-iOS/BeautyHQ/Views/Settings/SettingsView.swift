import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var showingLogoutAlert = false

    var body: some View {
        NavigationStack {
            List {
                // Profile Section
                Section {
                    HStack(spacing: 16) {
                        Circle()
                            .fill(Color.purple.opacity(0.15))
                            .frame(width: 80, height: 80)
                            .overlay(
                                Text(authManager.currentUser?.initials ?? "?")
                                    .font(.title)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.purple)
                            )

                        VStack(alignment: .leading, spacing: 4) {
                            Text(authManager.currentUser?.name ?? "User")
                                .font(.title2)
                                .fontWeight(.bold)

                            Text(authManager.currentUser?.email ?? "")
                                .font(.subheadline)
                                .foregroundColor(.secondary)

                            Text(authManager.currentUser?.role.displayName ?? "")
                                .font(.caption)
                                .fontWeight(.medium)
                                .foregroundColor(.purple)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 4)
                                .background(Color.purple.opacity(0.1))
                                .clipShape(Capsule())
                        }

                        Spacer()
                    }
                    .padding(.vertical, 8)
                }

                // Account Section
                Section("Account") {
                    SettingsRow(icon: "person", iconColor: .purple, title: "Edit Profile", subtitle: "Update your personal information")
                    SettingsRow(icon: "lock", iconColor: .purple, title: "Change Password", subtitle: "Update your security credentials")
                    SettingsRow(icon: "bell", iconColor: .purple, title: "Notifications", subtitle: "Manage push and email notifications")
                }

                // Business Section
                Section("Business") {
                    SettingsRow(icon: "building.2", iconColor: .pink, title: "Salon Profile", subtitle: "Edit business information")
                    SettingsRow(icon: "person.2", iconColor: .pink, title: "Staff", subtitle: "Manage team members")
                    SettingsRow(icon: "scissors", iconColor: .pink, title: "Services", subtitle: "Edit service menu and pricing")
                    SettingsRow(icon: "clock", iconColor: .pink, title: "Business Hours", subtitle: "Set operating hours")
                }

                // Preferences Section
                Section("Preferences") {
                    SettingsRow(icon: "paintpalette", iconColor: .blue, title: "Appearance", subtitle: "Dark mode, colors")
                    SettingsRow(icon: "globe", iconColor: .blue, title: "Language", subtitle: "English (US)")
                    SettingsRow(icon: "clock.arrow.circlepath", iconColor: .blue, title: "Timezone", subtitle: "America/New_York")
                }

                // Support Section
                Section("Support") {
                    SettingsRow(icon: "questionmark.circle", iconColor: .orange, title: "Help Center")
                    SettingsRow(icon: "bubble.left", iconColor: .orange, title: "Contact Support")
                    SettingsRow(icon: "doc.text", iconColor: .orange, title: "Terms of Service")
                    SettingsRow(icon: "shield.checkered", iconColor: .orange, title: "Privacy Policy")
                }

                // Sign Out
                Section {
                    Button {
                        showingLogoutAlert = true
                    } label: {
                        HStack {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                                .foregroundColor(.red)
                            Text("Sign Out")
                                .foregroundColor(.red)
                        }
                    }
                }

                // Version
                Section {
                    HStack {
                        Spacer()
                        Text("BeautyHQ v\(Config.appVersion) (\(Config.buildNumber))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Spacer()
                    }
                }
                .listRowBackground(Color.clear)
            }
            .navigationTitle("Settings")
            .alert("Sign Out", isPresented: $showingLogoutAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Sign Out", role: .destructive) {
                    Task {
                        await authManager.logout()
                    }
                }
            } message: {
                Text("Are you sure you want to sign out?")
            }
        }
    }
}

// MARK: - Settings Row
struct SettingsRow: View {
    let icon: String
    var iconColor: Color = .gray
    let title: String
    var subtitle: String? = nil

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.body)
                .foregroundColor(iconColor)
                .frame(width: 32, height: 32)
                .background(iconColor.opacity(0.15))
                .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.body)

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .contentShape(Rectangle())
    }
}

#Preview {
    SettingsView()
        .environmentObject(AuthManager.shared)
}
