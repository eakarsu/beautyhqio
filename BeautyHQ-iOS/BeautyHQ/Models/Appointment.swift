import Foundation
import SwiftUI

struct Appointment: Codable, Identifiable {
    let id: String
    let businessId: String
    let clientId: String
    let staffId: String
    let serviceId: String
    let startTime: Date
    let endTime: Date
    let status: AppointmentStatus
    let source: BookingSource
    let notes: String?
    let internalNotes: String?
    let depositPaid: Double
    let totalPrice: Double
    let client: Client?
    let staff: Staff?
    let service: Service?
    let createdAt: Date
    let updatedAt: Date

    var duration: Int {
        Calendar.current.dateComponents([.minute], from: startTime, to: endTime).minute ?? 0
    }

    var durationFormatted: String {
        let minutes = duration
        if minutes < 60 {
            return "\(minutes) min"
        }
        let hours = minutes / 60
        let remainingMinutes = minutes % 60
        if remainingMinutes == 0 {
            return "\(hours) hr"
        }
        return "\(hours) hr \(remainingMinutes) min"
    }

    var balanceDue: Double {
        totalPrice - depositPaid
    }
}

enum AppointmentStatus: String, Codable, CaseIterable {
    case booked = "BOOKED"
    case confirmed = "CONFIRMED"
    case checkedIn = "CHECKED_IN"
    case inService = "IN_SERVICE"
    case completed = "COMPLETED"
    case cancelled = "CANCELLED"
    case noShow = "NO_SHOW"
    case rescheduled = "RESCHEDULED"

    var displayName: String {
        switch self {
        case .booked: return "Booked"
        case .confirmed: return "Confirmed"
        case .checkedIn: return "Checked In"
        case .inService: return "In Service"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        case .noShow: return "No Show"
        case .rescheduled: return "Rescheduled"
        }
    }

    var color: Color {
        switch self {
        case .booked: return .blue
        case .confirmed: return .green
        case .checkedIn: return .purple
        case .inService: return .orange
        case .completed: return Color(red: 0.02, green: 0.59, blue: 0.41)
        case .cancelled: return .red
        case .noShow: return Color(red: 0.86, green: 0.15, blue: 0.15)
        case .rescheduled: return .indigo
        }
    }

    var icon: String {
        switch self {
        case .booked: return "calendar.badge.clock"
        case .confirmed: return "checkmark.circle.fill"
        case .checkedIn: return "person.badge.clock.fill"
        case .inService: return "scissors"
        case .completed: return "checkmark.seal.fill"
        case .cancelled: return "xmark.circle.fill"
        case .noShow: return "person.fill.xmark"
        case .rescheduled: return "arrow.triangle.2.circlepath"
        }
    }
}

enum BookingSource: String, Codable, CaseIterable {
    case phone = "PHONE"
    case walkIn = "WALK_IN"
    case online = "ONLINE"
    case app = "APP"
    case instagram = "INSTAGRAM"
    case facebook = "FACEBOOK"
    case referral = "REFERRAL"
    case kiosk = "KIOSK"
    case aiVoice = "AI_VOICE"
    case marketplace = "MARKETPLACE"

    var displayName: String {
        switch self {
        case .phone: return "Phone"
        case .walkIn: return "Walk-in"
        case .online: return "Online"
        case .app: return "App"
        case .instagram: return "Instagram"
        case .facebook: return "Facebook"
        case .referral: return "Referral"
        case .kiosk: return "Kiosk"
        case .aiVoice: return "AI Voice"
        case .marketplace: return "Marketplace"
        }
    }
}

// MARK: - Appointment Requests
struct CreateAppointmentRequest: Codable {
    let clientId: String
    let staffId: String
    let serviceId: String
    let startTime: Date
    let notes: String?
}

struct UpdateAppointmentRequest: Codable {
    let staffId: String?
    let serviceId: String?
    let startTime: Date?
    let status: AppointmentStatus?
    let notes: String?
    let internalNotes: String?
}
