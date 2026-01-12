//
//  CalendarSettingsView.swift
//  BeautyHQ
//
//  Settings view for managing Google and Outlook calendar integrations
//

import SwiftUI

struct CalendarSettingsView: View {
    @StateObject private var viewModel = CalendarSettingsViewModel()
    @EnvironmentObject var authManager: AuthManager

    var body: some View {
        List {
            // Google Calendar Section
            Section {
                CalendarConnectionRow(
                    provider: .google,
                    isConnected: viewModel.calendarStatus?.google.connected ?? false,
                    isLoading: viewModel.isLoadingGoogle,
                    onConnect: {
                        Task {
                            await viewModel.connectGoogle()
                        }
                    },
                    onDisconnect: {
                        Task {
                            await viewModel.disconnectGoogle()
                        }
                    }
                )
            } header: {
                Label("Google Calendar", systemImage: "calendar")
            } footer: {
                Text("Sync appointments to your Google Calendar automatically when they are created, updated, or cancelled.")
            }

            // Outlook Calendar Section
            Section {
                CalendarConnectionRow(
                    provider: .outlook,
                    isConnected: viewModel.calendarStatus?.outlook.connected ?? false,
                    isLoading: viewModel.isLoadingOutlook,
                    onConnect: {
                        Task {
                            await viewModel.connectOutlook()
                        }
                    },
                    onDisconnect: {
                        Task {
                            await viewModel.disconnectOutlook()
                        }
                    }
                )
            } header: {
                Label("Outlook Calendar", systemImage: "calendar.badge.clock")
            } footer: {
                Text("Sync appointments to your Outlook/Microsoft 365 Calendar automatically.")
            }

            // Sync Info Section
            if viewModel.calendarStatus?.google.connected == true ||
               viewModel.calendarStatus?.outlook.connected == true {
                Section("Auto-Sync Features") {
                    HStack(spacing: 12) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text("New appointments sync automatically")
                            .font(.subheadline)
                    }
                    HStack(spacing: 12) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text("Updates sync automatically")
                            .font(.subheadline)
                    }
                    HStack(spacing: 12) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text("Cancellations remove events")
                            .font(.subheadline)
                    }
                }
            }
        }
        .navigationTitle("Calendar Sync")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Error", isPresented: .init(
            get: { viewModel.error != nil },
            set: { if !$0 { viewModel.error = nil } }
        )) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(viewModel.error ?? "An error occurred")
        }
        .task {
            await viewModel.loadStatus()
        }
    }
}

// MARK: - Calendar Provider

enum CalendarProvider {
    case google
    case outlook

    var name: String {
        switch self {
        case .google: return "Google Calendar"
        case .outlook: return "Outlook Calendar"
        }
    }

    var icon: String {
        switch self {
        case .google: return "g.circle.fill"
        case .outlook: return "envelope.fill"
        }
    }

    var color: Color {
        switch self {
        case .google: return .red
        case .outlook: return .blue
        }
    }
}

// MARK: - Calendar Connection Row

struct CalendarConnectionRow: View {
    let provider: CalendarProvider
    let isConnected: Bool
    let isLoading: Bool
    let onConnect: () -> Void
    let onDisconnect: () -> Void

    var body: some View {
        HStack(spacing: 16) {
            // Provider Icon
            ZStack {
                Circle()
                    .fill(provider.color.opacity(0.15))
                    .frame(width: 44, height: 44)

                Image(systemName: provider.icon)
                    .foregroundColor(provider.color)
                    .font(.title2)
            }

            // Provider Info
            VStack(alignment: .leading, spacing: 4) {
                Text(provider.name)
                    .font(.headline)

                HStack(spacing: 4) {
                    Circle()
                        .fill(isConnected ? Color.green : Color.gray)
                        .frame(width: 8, height: 8)
                    Text(isConnected ? "Connected" : "Not connected")
                        .font(.caption)
                        .foregroundColor(isConnected ? .green : .secondary)
                }
            }

            Spacer()

            // Action Button
            if isLoading {
                ProgressView()
                    .frame(width: 90)
            } else {
                Button(isConnected ? "Disconnect" : "Connect") {
                    if isConnected {
                        onDisconnect()
                    } else {
                        onConnect()
                    }
                }
                .buttonStyle(.bordered)
                .tint(isConnected ? .red : .purple)
                .frame(width: 90)
            }
        }
        .padding(.vertical, 8)
    }
}

// MARK: - View Model

@MainActor
class CalendarSettingsViewModel: ObservableObject {
    @Published var calendarStatus: CalendarStatus?
    @Published var isLoadingGoogle = false
    @Published var isLoadingOutlook = false
    @Published var error: String?

    private var staffId: String? {
        AuthManager.shared.currentUser?.staffId
    }

    func loadStatus() async {
        guard let staffId = staffId else {
            error = "No staff ID available"
            return
        }

        do {
            calendarStatus = try await CalendarService.shared.getCalendarStatus(staffId: staffId)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func connectGoogle() async {
        guard let staffId = staffId else {
            error = "No staff ID available"
            return
        }

        isLoadingGoogle = true
        let success = await CalendarAuthManager.shared.connectGoogleCalendar(staffId: staffId)
        isLoadingGoogle = false

        if success {
            await loadStatus()
        } else if let authError = CalendarAuthManager.shared.error {
            error = authError
        }
    }

    func disconnectGoogle() async {
        guard let staffId = staffId else {
            error = "No staff ID available"
            return
        }

        isLoadingGoogle = true
        let success = await CalendarAuthManager.shared.disconnectGoogleCalendar(staffId: staffId)
        isLoadingGoogle = false

        if success {
            await loadStatus()
        } else if let authError = CalendarAuthManager.shared.error {
            error = authError
        }
    }

    func connectOutlook() async {
        guard let staffId = staffId else {
            error = "No staff ID available"
            return
        }

        isLoadingOutlook = true
        let success = await CalendarAuthManager.shared.connectOutlookCalendar(staffId: staffId)
        isLoadingOutlook = false

        if success {
            await loadStatus()
        } else if let authError = CalendarAuthManager.shared.error {
            error = authError
        }
    }

    func disconnectOutlook() async {
        guard let staffId = staffId else {
            error = "No staff ID available"
            return
        }

        isLoadingOutlook = true
        let success = await CalendarAuthManager.shared.disconnectOutlookCalendar(staffId: staffId)
        isLoadingOutlook = false

        if success {
            await loadStatus()
        } else if let authError = CalendarAuthManager.shared.error {
            error = authError
        }
    }
}

#Preview {
    NavigationStack {
        CalendarSettingsView()
            .environmentObject(AuthManager.shared)
    }
}
