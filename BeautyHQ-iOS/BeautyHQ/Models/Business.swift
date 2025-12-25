import Foundation

struct Business: Codable, Identifiable {
    let id: String
    let name: String
    let type: BusinessType
    let email: String?
    let phone: String?
    let website: String?
    let logo: String?
    let address: String?
    let city: String?
    let state: String?
    let zipCode: String?
    let country: String
    let timezone: String
    let currency: String
    let createdAt: Date
    let updatedAt: Date
}

enum BusinessType: String, Codable, CaseIterable {
    case hairSalon = "HAIR_SALON"
    case barbershop = "BARBERSHOP"
    case nailSalon = "NAIL_SALON"
    case spa = "SPA"
    case massage = "MASSAGE"
    case lashBrow = "LASH_BROW"
    case waxing = "WAXING"
    case makeup = "MAKEUP"
    case wellness = "WELLNESS"
    case multiService = "MULTI_SERVICE"

    var displayName: String {
        switch self {
        case .hairSalon: return "Hair Salon"
        case .barbershop: return "Barbershop"
        case .nailSalon: return "Nail Salon"
        case .spa: return "Spa"
        case .massage: return "Massage"
        case .lashBrow: return "Lash & Brow"
        case .waxing: return "Waxing"
        case .makeup: return "Makeup"
        case .wellness: return "Wellness"
        case .multiService: return "Multi-Service"
        }
    }

    var icon: String {
        switch self {
        case .hairSalon: return "scissors"
        case .barbershop: return "mustache.fill"
        case .nailSalon: return "hand.raised.fill"
        case .spa: return "leaf.fill"
        case .massage: return "figure.mind.and.body"
        case .lashBrow: return "eye.fill"
        case .waxing: return "sparkles"
        case .makeup: return "paintbrush.fill"
        case .wellness: return "heart.fill"
        case .multiService: return "square.grid.2x2.fill"
        }
    }
}
