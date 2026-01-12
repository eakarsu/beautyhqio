//
//  ClientCalendarSettingsView.swift
//  BeautyHQ
//
//  Settings view for clients to manage Google and Outlook calendar integrations
//

import SwiftUI

struct ClientCalendarSettingsView: View {
    @StateObject private var viewModel = ClientCalendarSettingsViewModel()
    @EnvironmentObject var authManager: AuthManager

    var body: some View {
        List {
            // Info Section
            Section {
                HStack(spacing: 12) {
                    Image(systemName: "info.circle.fill")
                        .foregroundColor(.blue)
                        .font(.title2)
                    Text("Connect your calendar to automatically sync your appointments.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.vertical, 4)
            }

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
                Text("Your appointments will appear in your Google Calendar with reminders.")
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
                Text("Your appointments will sync to your Outlook/Microsoft 365 Calendar.")
            }

            // Benefits Section
            if viewModel.calendarStatus?.google.connected == true ||
               viewModel.calendarStatus?.outlook.connected == true {
                Section("What You Get") {
                    HStack(spacing: 12) {
                        Image(systemName: "bell.fill")
                            .foregroundColor(.orange)
                        Text("Automatic reminders before appointments")
                            .font(.subheadline)
                    }
                    HStack(spacing: 12) {
                        Image(systemName: "arrow.triangle.2.circlepath")
                            .foregroundColor(.green)
                        Text("Real-time sync when appointments change")
                            .font(.subheadline)
                    }
                    HStack(spacing: 12) {
                        Image(systemName: "calendar.badge.checkmark")
                            .foregroundColor(.blue)
                        Text("See all appointments in one place")
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

// MARK: - View Model

@MainActor
class ClientCalendarSettingsViewModel: ObservableObject {
    @Published var calendarStatus: CalendarStatus?
    @Published var isLoadingGoogle = false
    @Published var isLoadingOutlook = false
    @Published var error: String?

    private var clientId: String? {
        AuthManager.shared.currentUser?.clientId
    }

    func loadStatus() async {
        guard let clientId = clientId else {
            error = "No client ID available"
            return
        }

        do {
            calendarStatus = try await CalendarService.shared.getClientCalendarStatus(clientId: clientId)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func connectGoogle() async {
        guard let clientId = clientId else {
            error = "No client ID available"
            return
        }

        isLoadingGoogle = true
        let success = await CalendarAuthManager.shared.connectClientGoogleCalendar(clientId: clientId)
        isLoadingGoogle = false

        if success {
            await loadStatus()
        } else if let authError = CalendarAuthManager.shared.error {
            error = authError
        }
    }

    func disconnectGoogle() async {
        guard let clientId = clientId else {
            error = "No client ID available"
            return
        }

        isLoadingGoogle = true
        let success = await CalendarAuthManager.shared.disconnectClientGoogleCalendar(clientId: clientId)
        isLoadingGoogle = false

        if success {
            await loadStatus()
        } else if let authError = CalendarAuthManager.shared.error {
            error = authError
        }
    }

    func connectOutlook() async {
        guard let clientId = clientId else {
            error = "No client ID available"
            return
        }

        isLoadingOutlook = true
        let success = await CalendarAuthManager.shared.connectClientOutlookCalendar(clientId: clientId)
        isLoadingOutlook = false

        if success {
            await loadStatus()
        } else if let authError = CalendarAuthManager.shared.error {
            error = authError
        }
    }

    func disconnectOutlook() async {
        guard let clientId = clientId else {
            error = "No client ID available"
            return
        }

        isLoadingOutlook = true
        let success = await CalendarAuthManager.shared.disconnectClientOutlookCalendar(clientId: clientId)
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
        ClientCalendarSettingsView()
            .environmentObject(AuthManager.shared)
    }
}
