import Foundation
import UserNotifications
import UIKit

@MainActor
class NotificationManager: ObservableObject {
    static let shared = NotificationManager()

    @Published var isAuthorized = false
    @Published var deviceToken: String?

    private init() {
        Task {
            await checkAuthorization()
        }
    }

    // MARK: - Authorization

    func requestAuthorization() async -> Bool {
        do {
            let options: UNAuthorizationOptions = [.alert, .sound, .badge]
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(options: options)
            isAuthorized = granted

            if granted {
                await registerForRemoteNotifications()
            }

            return granted
        } catch {
            print("Notification authorization error: \(error)")
            return false
        }
    }

    func checkAuthorization() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        isAuthorized = settings.authorizationStatus == .authorized
    }

    // MARK: - Remote Notifications

    private func registerForRemoteNotifications() async {
        await MainActor.run {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }

    func setDeviceToken(_ token: Data) {
        let tokenString = token.map { String(format: "%02.2hhx", $0) }.joined()
        deviceToken = tokenString
        print("Device Token: \(tokenString)")

        // Register with backend
        Task {
            await registerTokenWithBackend(tokenString)
        }
    }

    private func registerTokenWithBackend(_ token: String) async {
        do {
            struct TokenRequest: Codable {
                let token: String
                let platform: String
            }

            let request = TokenRequest(token: token, platform: "ios")
            let _: EmptyResponse = try await APIClient.shared.post("/notifications/register", body: request)
            print("Push token registered with backend")
        } catch {
            print("Failed to register push token: \(error)")
        }
    }

    // MARK: - Local Notifications

    func scheduleAppointmentReminder(
        appointmentId: String,
        title: String,
        body: String,
        date: Date
    ) async {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.userInfo = [
            "type": "appointment_reminder",
            "appointmentId": appointmentId
        ]

        let triggerDate = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: date)
        let trigger = UNCalendarNotificationTrigger(dateMatching: triggerDate, repeats: false)

        let request = UNNotificationRequest(
            identifier: "appointment-\(appointmentId)",
            content: content,
            trigger: trigger
        )

        do {
            try await UNUserNotificationCenter.current().add(request)
            print("Scheduled reminder for appointment \(appointmentId)")
        } catch {
            print("Failed to schedule notification: \(error)")
        }
    }

    func cancelAppointmentReminder(appointmentId: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(
            withIdentifiers: ["appointment-\(appointmentId)"]
        )
    }

    func cancelAllReminders() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }

    // MARK: - Badge Management

    func setBadgeCount(_ count: Int) async {
        do {
            try await UNUserNotificationCenter.current().setBadgeCount(count)
        } catch {
            print("Failed to set badge count: \(error)")
        }
    }

    func clearBadge() async {
        await setBadgeCount(0)
    }
}

// MARK: - Notification Handler
class NotificationHandler: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationHandler()

    override private init() {
        super.init()
    }

    func configure() {
        UNUserNotificationCenter.current().delegate = self
    }

    // Handle notification when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .badge])
    }

    // Handle notification tap
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo

        if let type = userInfo["type"] as? String {
            switch type {
            case "appointment_reminder":
                if let appointmentId = userInfo["appointmentId"] as? String {
                    // Navigate to appointment
                    print("Navigate to appointment: \(appointmentId)")
                }
            case "new_booking":
                // Navigate to appointments
                print("Navigate to appointments")
            default:
                break
            }
        }

        completionHandler()
    }
}
