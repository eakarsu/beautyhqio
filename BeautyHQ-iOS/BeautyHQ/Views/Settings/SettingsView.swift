import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var showingLogoutAlert = false

    var body: some View {
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
                    NavigationLink {
                        EditProfileView()
                    } label: {
                        SettingsRowLabel(icon: "person", iconColor: .purple, title: "Edit Profile", subtitle: "Update your personal information")
                    }
                    NavigationLink {
                        ChangePasswordView()
                    } label: {
                        SettingsRowLabel(icon: "lock", iconColor: .purple, title: "Change Password", subtitle: "Update your security credentials")
                    }
                    NavigationLink {
                        NotificationsSettingsView()
                    } label: {
                        SettingsRowLabel(icon: "bell", iconColor: .purple, title: "Notifications", subtitle: "Manage push and email notifications")
                    }
                }

                // Business Section
                Section("Business") {
                    NavigationLink {
                        MarketplaceView()
                    } label: {
                        SettingsRowLabel(icon: "building.2", iconColor: .pink, title: "Salon Profile", subtitle: "Edit business information")
                    }
                    NavigationLink {
                        StaffView()
                    } label: {
                        SettingsRowLabel(icon: "person.2", iconColor: .pink, title: "Staff", subtitle: "Manage team members")
                    }
                    NavigationLink {
                        ServicesView()
                    } label: {
                        SettingsRowLabel(icon: "scissors", iconColor: .pink, title: "Services", subtitle: "Edit service menu and pricing")
                    }
                    NavigationLink {
                        CalendarView()
                    } label: {
                        SettingsRowLabel(icon: "clock", iconColor: .pink, title: "Business Hours", subtitle: "Set operating hours")
                    }
                    // Show different calendar settings based on user role
                    if authManager.currentUser?.role == .client {
                        NavigationLink {
                            ClientCalendarSettingsView()
                        } label: {
                            SettingsRowLabel(icon: "calendar.badge.clock", iconColor: .purple, title: "Calendar Sync", subtitle: "Sync appointments to your calendar")
                        }
                    } else {
                        NavigationLink {
                            CalendarSettingsView()
                        } label: {
                            SettingsRowLabel(icon: "calendar.badge.clock", iconColor: .purple, title: "Calendar Sync", subtitle: "Google & Outlook integration")
                        }
                    }
                }

                // Preferences Section
                Section("Preferences") {
                    NavigationLink {
                        AppearanceSettingsView()
                    } label: {
                        SettingsRowLabel(icon: "paintpalette", iconColor: .blue, title: "Appearance", subtitle: "Dark mode, colors")
                    }
                    NavigationLink {
                        LanguageSettingsView()
                    } label: {
                        SettingsRowLabel(icon: "globe", iconColor: .blue, title: "Language", subtitle: "English (US)")
                    }
                    NavigationLink {
                        TimezoneSettingsView()
                    } label: {
                        SettingsRowLabel(icon: "clock.arrow.circlepath", iconColor: .blue, title: "Timezone", subtitle: "America/New_York")
                    }
                }

                // Support Section
                Section("Support") {
                    NavigationLink {
                        HelpCenterView()
                    } label: {
                        SettingsRowLabel(icon: "questionmark.circle", iconColor: .orange, title: "Help Center", subtitle: nil)
                    }
                    NavigationLink {
                        ContactSupportView()
                    } label: {
                        SettingsRowLabel(icon: "bubble.left", iconColor: .orange, title: "Contact Support", subtitle: nil)
                    }
                    Link(destination: URL(string: "\(Config.webBaseURL)/terms")!) {
                        SettingsRowLabel(icon: "doc.text", iconColor: .orange, title: "Terms of Service", subtitle: nil)
                    }
                    Link(destination: URL(string: "\(Config.webBaseURL)/privacy")!) {
                        SettingsRowLabel(icon: "shield.checkered", iconColor: .orange, title: "Privacy Policy", subtitle: nil)
                    }
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

// MARK: - Settings Row Label (for NavigationLink)
struct SettingsRowLabel: View {
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
                    .foregroundColor(.primary)

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
    }
}

// MARK: - Settings Detail Views
struct EditProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""

    var body: some View {
        Form {
            Section("Personal Information") {
                TextField("Name", text: $name)
                TextField("Email", text: $email)
                    .keyboardType(.emailAddress)
                TextField("Phone", text: $phone)
                    .keyboardType(.phonePad)
            }

            Section {
                Button("Save Changes") {
                    // TODO: Save profile changes
                }
                .frame(maxWidth: .infinity)
            }
        }
        .navigationTitle("Edit Profile")
        .onAppear {
            name = authManager.currentUser?.name ?? ""
            email = authManager.currentUser?.email ?? ""
            phone = authManager.currentUser?.phone ?? ""
        }
    }
}

struct ChangePasswordView: View {
    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var confirmPassword = ""

    var body: some View {
        Form {
            Section("Current Password") {
                SecureField("Enter current password", text: $currentPassword)
            }
            Section("New Password") {
                SecureField("Enter new password", text: $newPassword)
                SecureField("Confirm new password", text: $confirmPassword)
            }
            Section {
                Button("Update Password") {
                    // TODO: Update password
                }
                .frame(maxWidth: .infinity)
                .disabled(newPassword.isEmpty || newPassword != confirmPassword)
            }
        }
        .navigationTitle("Change Password")
    }
}

struct NotificationsSettingsView: View {
    @State private var pushEnabled = true
    @State private var emailEnabled = true
    @State private var smsEnabled = false

    var body: some View {
        Form {
            Section("Push Notifications") {
                Toggle("Enable Push Notifications", isOn: $pushEnabled)
            }
            Section("Email Notifications") {
                Toggle("Appointment Reminders", isOn: $emailEnabled)
            }
            Section("SMS Notifications") {
                Toggle("Enable SMS", isOn: $smsEnabled)
            }
        }
        .navigationTitle("Notifications")
    }
}

struct AppearanceSettingsView: View {
    @State private var darkMode = false

    var body: some View {
        Form {
            Section {
                Toggle("Dark Mode", isOn: $darkMode)
            }
        }
        .navigationTitle("Appearance")
    }
}

struct LanguageSettingsView: View {
    @State private var selectedLanguage = "English (US)"
    let languages = ["English (US)", "Spanish", "French", "German"]

    var body: some View {
        Form {
            Section {
                Picker("Language", selection: $selectedLanguage) {
                    ForEach(languages, id: \.self) { lang in
                        Text(lang).tag(lang)
                    }
                }
            }
        }
        .navigationTitle("Language")
    }
}

struct TimezoneSettingsView: View {
    @State private var selectedTimezone = "America/New_York"
    let timezones = ["America/New_York", "America/Los_Angeles", "America/Chicago", "Europe/London"]

    var body: some View {
        Form {
            Section {
                Picker("Timezone", selection: $selectedTimezone) {
                    ForEach(timezones, id: \.self) { tz in
                        Text(tz).tag(tz)
                    }
                }
            }
        }
        .navigationTitle("Timezone")
    }
}

struct HelpCenterView: View {
    var body: some View {
        List {
            Section("Getting Started") {
                Text("How to book appointments")
                Text("Managing your calendar")
                Text("Adding clients")
            }
            Section("Account") {
                Text("Updating your profile")
                Text("Billing questions")
            }
        }
        .navigationTitle("Help Center")
    }
}

struct ContactSupportView: View {
    var body: some View {
        Form {
            Section {
                Link("Email Support", destination: URL(string: "mailto:support@beautyhq.com")!)
                Link("Call Support", destination: URL(string: "tel:+1234567890")!)
            }
        }
        .navigationTitle("Contact Support")
    }
}

struct TermsOfServiceView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Terms of Service")
                    .font(.title)
                    .fontWeight(.bold)

                Text("Last Updated: January 2025")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Group {
                    Text("1. Acceptance of Terms")
                        .font(.headline)
                    Text("By accessing and using BeautyHQ, you accept and agree to be bound by the terms and provisions of this agreement.")

                    Text("2. Use License")
                        .font(.headline)
                    Text("Permission is granted to temporarily use BeautyHQ for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.")

                    Text("3. User Account")
                        .font(.headline)
                    Text("You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.")

                    Text("4. Service Description")
                        .font(.headline)
                    Text("BeautyHQ provides salon and spa management tools including appointment scheduling, client management, point of sale, and business analytics.")

                    Text("5. Payment Terms")
                        .font(.headline)
                    Text("Subscription fees are billed in advance on a monthly or annual basis. All fees are non-refundable except as expressly set forth herein.")

                    Text("6. Cancellation")
                        .font(.headline)
                    Text("You may cancel your subscription at any time. Upon cancellation, you will have access to the service until the end of your current billing period.")

                    Text("7. Limitation of Liability")
                        .font(.headline)
                    Text("BeautyHQ shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of or inability to use the service.")

                    Text("8. Contact")
                        .font(.headline)
                    Text("For questions about these Terms, please contact us at support@beautyhq.com")
                }
            }
            .padding()
        }
        .navigationTitle("Terms of Service")
    }
}

struct PrivacyPolicyView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Privacy Policy")
                    .font(.title)
                    .fontWeight(.bold)

                Text("Last Updated: January 2025")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Group {
                    Text("1. Information We Collect")
                        .font(.headline)
                    Text("We collect information you provide directly to us, such as when you create an account, make a booking, or contact us for support. This includes name, email address, phone number, and payment information.")

                    Text("2. How We Use Your Information")
                        .font(.headline)
                    Text("We use the information we collect to provide, maintain, and improve our services, process transactions, send notifications, and respond to your requests.")

                    Text("3. Information Sharing")
                        .font(.headline)
                    Text("We do not sell, trade, or rent your personal information to third parties. We may share information with service providers who assist us in operating our platform.")

                    Text("4. Data Security")
                        .font(.headline)
                    Text("We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.")

                    Text("5. Data Retention")
                        .font(.headline)
                    Text("We retain your information for as long as your account is active or as needed to provide you services. You may request deletion of your data at any time.")

                    Text("6. Your Rights")
                        .font(.headline)
                    Text("You have the right to access, correct, or delete your personal information. You may also opt out of marketing communications at any time.")

                    Text("7. Cookies")
                        .font(.headline)
                    Text("We use cookies and similar technologies to enhance your experience, analyze usage, and assist in our marketing efforts.")

                    Text("8. Children's Privacy")
                        .font(.headline)
                    Text("Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.")

                    Text("9. Changes to This Policy")
                        .font(.headline)
                    Text("We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.")

                    Text("10. Contact Us")
                        .font(.headline)
                    Text("If you have questions about this Privacy Policy, please contact us at privacy@beautyhq.com")
                }
            }
            .padding()
        }
        .navigationTitle("Privacy Policy")
    }
}

#Preview {
    SettingsView()
        .environmentObject(AuthManager.shared)
}
