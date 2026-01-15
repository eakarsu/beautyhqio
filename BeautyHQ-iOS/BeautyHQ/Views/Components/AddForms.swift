import SwiftUI

// MARK: - Add Client View
struct AddClientView: View {
    var onSave: (() -> Void)? = nil
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = AddClientViewModel()

    var body: some View {
        NavigationStack {
            Form {
                Section("Basic Information") {
                    TextField("First Name *", text: $viewModel.firstName)
                    TextField("Last Name *", text: $viewModel.lastName)
                    TextField("Phone *", text: $viewModel.phone)
                        .keyboardType(.phonePad)
                    TextField("Email", text: $viewModel.email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                }

                Section("Preferences") {
                    Picker("Preferred Language", selection: $viewModel.preferredLanguage) {
                        Text("English").tag("en")
                        Text("Spanish").tag("es")
                        Text("Vietnamese").tag("vi")
                        Text("Korean").tag("ko")
                        Text("Chinese").tag("zh")
                    }

                    Picker("Contact Method", selection: $viewModel.preferredContactMethod) {
                        Text("SMS").tag("sms")
                        Text("Email").tag("email")
                        Text("Phone").tag("phone")
                    }

                    Toggle("Allow SMS", isOn: $viewModel.allowSms)
                    Toggle("Allow Email", isOn: $viewModel.allowEmail)
                }

                Section("Additional Info") {
                    DatePicker("Birthday", selection: $viewModel.birthday, displayedComponents: .date)

                    Picker("Referral Source", selection: $viewModel.referralSource) {
                        Text("Select...").tag("")
                        Text("Walk-in").tag("walk_in")
                        Text("Google").tag("google")
                        Text("Instagram").tag("instagram")
                        Text("Facebook").tag("facebook")
                        Text("Yelp").tag("yelp")
                        Text("Friend/Family").tag("referral")
                        Text("Other").tag("other")
                    }

                    TextField("Notes", text: $viewModel.notes, axis: .vertical)
                        .lineLimit(3...6)
                }

                if let error = viewModel.error {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("New Client")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            if await viewModel.save() {
                                onSave?()
                                dismiss()
                            }
                        }
                    }
                    .disabled(!viewModel.isValid || viewModel.isSaving)
                }
            }
        }
    }
}

@MainActor
class AddClientViewModel: ObservableObject {
    @Published var firstName = ""
    @Published var lastName = ""
    @Published var phone = ""
    @Published var email = ""
    @Published var preferredLanguage = "en"
    @Published var preferredContactMethod = "sms"
    @Published var allowSms = true
    @Published var allowEmail = true
    @Published var birthday = Date()
    @Published var referralSource = ""
    @Published var notes = ""
    @Published var isSaving = false
    @Published var error: String?

    var isValid: Bool {
        !firstName.isEmpty && !lastName.isEmpty && !phone.isEmpty
    }

    func save() async -> Bool {
        isSaving = true
        error = nil

        do {
            struct CreateClientRequest: Encodable {
                let firstName: String
                let lastName: String
                let phone: String
                let email: String?
                let preferredLanguage: String
                let preferredContactMethod: String
                let allowSms: Bool
                let allowEmail: Bool
                let referralSource: String?
                let notes: String?
            }

            let request = CreateClientRequest(
                firstName: firstName,
                lastName: lastName,
                phone: phone,
                email: email.isEmpty ? nil : email,
                preferredLanguage: preferredLanguage,
                preferredContactMethod: preferredContactMethod,
                allowSms: allowSms,
                allowEmail: allowEmail,
                referralSource: referralSource.isEmpty ? nil : referralSource,
                notes: notes.isEmpty ? nil : notes
            )

            let _: Client = try await APIClient.shared.post("/clients", body: request)
            isSaving = false
            return true
        } catch {
            self.error = error.localizedDescription
            isSaving = false
            return false
        }
    }
}

// MARK: - Add Appointment View
struct AddAppointmentView: View {
    var onSave: (() -> Void)? = nil
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = AddAppointmentViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    VStack {
                        ProgressView()
                        Text("Loading...")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    Form {
                        Section("Client") {
                            Picker("Select Client", selection: $viewModel.selectedClientId) {
                                Text("Walk-in").tag("")
                                ForEach(viewModel.clients) { client in
                                    Text(client.fullName).tag(client.id)
                                }
                            }
                            if viewModel.clients.isEmpty {
                                Text("No clients found")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }

                        Section("Service") {
                            Picker("Select Service *", selection: $viewModel.selectedServiceId) {
                                Text("Select...").tag("")
                                ForEach(viewModel.services) { service in
                                    Text("\(service.name) - \(service.formattedPrice)").tag(service.id)
                                }
                            }
                            if viewModel.services.isEmpty {
                                Text("No services found")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }

                        Section("Staff") {
                            Picker("Select Staff *", selection: $viewModel.selectedStaffId) {
                                Text("Select...").tag("")
                                ForEach(viewModel.staff) { staff in
                                    Text(staff.fullName).tag(staff.id)
                                }
                            }
                            if viewModel.staff.isEmpty {
                                Text("No staff found")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }

                        Section("Date & Time") {
                            DatePicker("Date", selection: $viewModel.date, displayedComponents: .date)
                            DatePicker("Time", selection: $viewModel.time, displayedComponents: .hourAndMinute)
                        }

                        Section("Notes") {
                            TextField("Notes (optional)", text: $viewModel.notes, axis: .vertical)
                                .lineLimit(3...6)
                        }

                        if let error = viewModel.error {
                            Section {
                                Text(error)
                                    .foregroundColor(.red)
                            }
                        }
                    }
                }
            }
            .navigationTitle("New Appointment")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Book") {
                        Task {
                            if await viewModel.save() {
                                onSave?()
                                dismiss()
                            }
                        }
                    }
                    .disabled(!viewModel.isValid || viewModel.isSaving)
                }
            }
        }
        .task {
            await viewModel.loadData()
        }
    }
}

// Response wrapper for paginated clients
private struct ClientsListResponse: Decodable {
    let clients: [Client]
}

@MainActor
class AddAppointmentViewModel: ObservableObject {
    @Published var clients: [Client] = []
    @Published var services: [Service] = []
    @Published var staff: [Staff] = []
    @Published var selectedClientId = ""
    @Published var selectedServiceId = ""
    @Published var selectedStaffId = ""
    @Published var date = Date()
    @Published var time = Date()
    @Published var notes = ""
    @Published var isLoading = false
    @Published var isSaving = false
    @Published var error: String?

    var isValid: Bool {
        !selectedServiceId.isEmpty && !selectedStaffId.isEmpty
    }

    func loadData() async {
        isLoading = true
        error = nil

        do {
            // Clients API returns paginated response { clients: [...], pagination: {...} }
            async let clientsTask: ClientsListResponse = APIClient.shared.get("/clients?limit=100")
            // Services and Staff return direct arrays
            async let servicesTask: [Service] = APIClient.shared.get("/services")
            async let staffTask: [Staff] = APIClient.shared.get("/staff")

            let clientsResponse = try await clientsTask
            clients = clientsResponse.clients
            services = try await servicesTask
            staff = try await staffTask
        } catch {
            self.error = "Failed to load data: \(error.localizedDescription)"
            print("Failed to load data: \(error)")
        }

        isLoading = false
    }

    func save() async -> Bool {
        isSaving = true
        error = nil

        do {
            let calendar = Calendar.current
            let dateComponents = calendar.dateComponents([.year, .month, .day], from: date)
            let timeComponents = calendar.dateComponents([.hour, .minute], from: time)

            var combined = DateComponents()
            combined.year = dateComponents.year
            combined.month = dateComponents.month
            combined.day = dateComponents.day
            combined.hour = timeComponents.hour
            combined.minute = timeComponents.minute

            guard let scheduledStart = calendar.date(from: combined) else {
                error = "Invalid date/time"
                isSaving = false
                return false
            }

            let service = services.first { $0.id == selectedServiceId }
            let duration = service?.duration ?? 60
            let scheduledEnd = calendar.date(byAdding: .minute, value: duration, to: scheduledStart)!

            struct CreateAppointmentRequest: Encodable {
                let clientId: String?
                let staffId: String
                let scheduledStart: String
                let scheduledEnd: String
                let notes: String?
                let services: [ServiceItem]

                struct ServiceItem: Encodable {
                    let serviceId: String
                    let price: Double
                    let duration: Int
                }
            }

            let formatter = ISO8601DateFormatter()
            let request = CreateAppointmentRequest(
                clientId: selectedClientId.isEmpty ? nil : selectedClientId,
                staffId: selectedStaffId,
                scheduledStart: formatter.string(from: scheduledStart),
                scheduledEnd: formatter.string(from: scheduledEnd),
                notes: notes.isEmpty ? nil : notes,
                services: [
                    CreateAppointmentRequest.ServiceItem(
                        serviceId: selectedServiceId,
                        price: service?.price ?? 0,
                        duration: duration
                    )
                ]
            )

            let _: Appointment = try await APIClient.shared.post("/appointments", body: request)
            isSaving = false
            return true
        } catch {
            self.error = error.localizedDescription
            isSaving = false
            return false
        }
    }
}

// MARK: - Add Staff View
struct AddStaffView: View {
    var onSave: (() -> Void)? = nil
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = AddStaffViewModel()

    let colors = ["#F43F5E", "#EC4899", "#A855F7", "#6366F1", "#3B82F6", "#14B8A6", "#22C55E", "#F59E0B"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Basic Information") {
                    TextField("First Name *", text: $viewModel.firstName)
                    TextField("Last Name *", text: $viewModel.lastName)
                    TextField("Email *", text: $viewModel.email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    TextField("Phone", text: $viewModel.phone)
                        .keyboardType(.phonePad)
                }

                Section("Profile") {
                    TextField("Display Name", text: $viewModel.displayName)
                    TextField("Title", text: $viewModel.title)
                    TextField("Bio", text: $viewModel.bio, axis: .vertical)
                        .lineLimit(3...6)
                }

                Section("Employment") {
                    Picker("Type", selection: $viewModel.employmentType) {
                        Text("Employee").tag("EMPLOYEE")
                        Text("Booth Renter").tag("BOOTH_RENTER")
                        Text("Contractor").tag("CONTRACTOR")
                    }

                    Toggle("Active", isOn: $viewModel.isActive)
                }

                Section("Color") {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 8), spacing: 8) {
                        ForEach(colors, id: \.self) { color in
                            Circle()
                                .fill(Color(hex: color))
                                .frame(width: 32, height: 32)
                                .overlay(
                                    Circle()
                                        .stroke(viewModel.color == color ? Color.primary : Color.clear, lineWidth: 2)
                                )
                                .onTapGesture {
                                    viewModel.color = color
                                }
                        }
                    }
                }

                if let error = viewModel.error {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("New Staff")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            if await viewModel.save() {
                                onSave?()
                                dismiss()
                            }
                        }
                    }
                    .disabled(!viewModel.isValid || viewModel.isSaving)
                }
            }
        }
    }
}

@MainActor
class AddStaffViewModel: ObservableObject {
    @Published var firstName = ""
    @Published var lastName = ""
    @Published var email = ""
    @Published var phone = ""
    @Published var displayName = ""
    @Published var title = ""
    @Published var bio = ""
    @Published var employmentType = "EMPLOYEE"
    @Published var isActive = true
    @Published var color = "#F43F5E"
    @Published var isSaving = false
    @Published var error: String?

    var isValid: Bool {
        !firstName.isEmpty && !lastName.isEmpty && !email.isEmpty
    }

    func save() async -> Bool {
        isSaving = true
        error = nil

        do {
            struct CreateStaffRequest: Encodable {
                let firstName: String
                let lastName: String
                let email: String
                let phone: String?
                let displayName: String?
                let title: String?
                let bio: String?
                let employmentType: String
                let isActive: Bool
                let color: String
            }

            let request = CreateStaffRequest(
                firstName: firstName,
                lastName: lastName,
                email: email,
                phone: phone.isEmpty ? nil : phone,
                displayName: displayName.isEmpty ? nil : displayName,
                title: title.isEmpty ? nil : title,
                bio: bio.isEmpty ? nil : bio,
                employmentType: employmentType,
                isActive: isActive,
                color: color
            )

            let _: Staff = try await APIClient.shared.post("/staff", body: request)
            isSaving = false
            return true
        } catch {
            self.error = error.localizedDescription
            isSaving = false
            return false
        }
    }
}

// MARK: - Add Service View
struct AddServiceView: View {
    var onSave: (() -> Void)? = nil
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = AddServiceViewModel()

    let colors = ["#F43F5E", "#EC4899", "#A855F7", "#6366F1", "#3B82F6", "#14B8A6", "#22C55E", "#F59E0B"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Basic Information") {
                    TextField("Name *", text: $viewModel.name)
                    TextField("Description", text: $viewModel.description, axis: .vertical)
                        .lineLimit(3...6)
                }

                Section("Pricing") {
                    Picker("Price Type", selection: $viewModel.priceType) {
                        Text("Fixed Price").tag("FIXED")
                        Text("Starting At").tag("STARTING_AT")
                        Text("Variable").tag("VARIABLE")
                    }

                    HStack {
                        Text("$")
                        TextField("Price *", value: $viewModel.price, format: .number)
                            .keyboardType(.decimalPad)
                    }
                }

                Section("Duration") {
                    Picker("Duration (minutes) *", selection: $viewModel.duration) {
                        ForEach([15, 30, 45, 60, 75, 90, 120, 150, 180], id: \.self) { mins in
                            Text("\(mins) min").tag(mins)
                        }
                    }
                }

                Section("Settings") {
                    Toggle("Active", isOn: $viewModel.isActive)
                    Toggle("Allow Online Booking", isOn: $viewModel.allowOnline)
                }

                Section("Color") {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 8), spacing: 8) {
                        ForEach(colors, id: \.self) { color in
                            Circle()
                                .fill(Color(hex: color))
                                .frame(width: 32, height: 32)
                                .overlay(
                                    Circle()
                                        .stroke(viewModel.color == color ? Color.primary : Color.clear, lineWidth: 2)
                                )
                                .onTapGesture {
                                    viewModel.color = color
                                }
                        }
                    }
                }

                if let error = viewModel.error {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("New Service")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            if await viewModel.save() {
                                onSave?()
                                dismiss()
                            }
                        }
                    }
                    .disabled(!viewModel.isValid || viewModel.isSaving)
                }
            }
        }
    }
}

@MainActor
class AddServiceViewModel: ObservableObject {
    @Published var name = ""
    @Published var description = ""
    @Published var price: Double = 0
    @Published var duration = 60
    @Published var priceType = "FIXED"
    @Published var isActive = true
    @Published var allowOnline = true
    @Published var color = "#F43F5E"
    @Published var isSaving = false
    @Published var error: String?

    var isValid: Bool {
        !name.isEmpty && price > 0
    }

    func save() async -> Bool {
        isSaving = true
        error = nil

        do {
            struct CreateServiceRequest: Encodable {
                let name: String
                let description: String?
                let price: Double
                let duration: Int
                let priceType: String
                let isActive: Bool
                let allowOnline: Bool
                let color: String
            }

            let request = CreateServiceRequest(
                name: name,
                description: description.isEmpty ? nil : description,
                price: price,
                duration: duration,
                priceType: priceType,
                isActive: isActive,
                allowOnline: allowOnline,
                color: color
            )

            let _: Service = try await APIClient.shared.post("/services", body: request)
            isSaving = false
            return true
        } catch {
            self.error = error.localizedDescription
            isSaving = false
            return false
        }
    }
}

// MARK: - Add Product View
struct AddProductView: View {
    var onSave: (() -> Void)? = nil
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = AddProductViewModel()

    var body: some View {
        NavigationStack {
            Form {
                Section("Basic Information") {
                    TextField("Name *", text: $viewModel.name)
                    TextField("Description", text: $viewModel.description, axis: .vertical)
                        .lineLimit(3...6)
                    TextField("Brand", text: $viewModel.brand)
                }

                Section("Identifiers") {
                    TextField("SKU", text: $viewModel.sku)
                    TextField("Barcode", text: $viewModel.barcode)
                }

                Section("Pricing") {
                    HStack {
                        Text("Price *")
                        Spacer()
                        Text("$")
                        TextField("0.00", value: $viewModel.price, format: .number)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 100)
                    }

                    HStack {
                        Text("Cost")
                        Spacer()
                        Text("$")
                        TextField("0.00", value: $viewModel.cost, format: .number)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 100)
                    }
                }

                Section("Inventory") {
                    Stepper("Quantity: \(viewModel.quantityOnHand)", value: $viewModel.quantityOnHand, in: 0...9999)
                    Stepper("Reorder Level: \(viewModel.reorderLevel)", value: $viewModel.reorderLevel, in: 0...999)
                    Stepper("Reorder Qty: \(viewModel.reorderQuantity)", value: $viewModel.reorderQuantity, in: 0...999)
                }

                Section("Settings") {
                    Toggle("Active", isOn: $viewModel.isActive)
                }

                if let error = viewModel.error {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("New Product")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            if await viewModel.save() {
                                onSave?()
                                dismiss()
                            }
                        }
                    }
                    .disabled(!viewModel.isValid || viewModel.isSaving)
                }
            }
        }
    }
}

@MainActor
class AddProductViewModel: ObservableObject {
    @Published var name = ""
    @Published var description = ""
    @Published var brand = ""
    @Published var sku = ""
    @Published var barcode = ""
    @Published var price: Double = 0
    @Published var cost: Double = 0
    @Published var quantityOnHand = 0
    @Published var reorderLevel = 10
    @Published var reorderQuantity = 10
    @Published var isActive = true
    @Published var isSaving = false
    @Published var error: String?

    var isValid: Bool {
        !name.isEmpty && price > 0
    }

    func save() async -> Bool {
        isSaving = true
        error = nil

        do {
            struct CreateProductRequest: Encodable {
                let name: String
                let description: String?
                let brand: String?
                let sku: String?
                let barcode: String?
                let price: Double
                let cost: Double?
                let quantityOnHand: Int
                let reorderLevel: Int
                let reorderQuantity: Int
                let isActive: Bool
            }

            let request = CreateProductRequest(
                name: name,
                description: description.isEmpty ? nil : description,
                brand: brand.isEmpty ? nil : brand,
                sku: sku.isEmpty ? nil : sku,
                barcode: barcode.isEmpty ? nil : barcode,
                price: price,
                cost: cost > 0 ? cost : nil,
                quantityOnHand: quantityOnHand,
                reorderLevel: reorderLevel,
                reorderQuantity: reorderQuantity,
                isActive: isActive
            )

            let _: Product = try await APIClient.shared.post("/products", body: request)
            isSaving = false
            return true
        } catch {
            self.error = error.localizedDescription
            isSaving = false
            return false
        }
    }
}

// MARK: - Add Gift Card View
struct AddGiftCardView: View {
    var onSave: (() -> Void)? = nil
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = AddGiftCardViewModel()

    let presetAmounts = [25.0, 50.0, 75.0, 100.0, 150.0, 200.0]
    let templates = ["default", "birthday", "holiday", "thank_you", "wedding"]

    var body: some View {
        NavigationStack {
            Form {
                Section("Amount") {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 8) {
                        ForEach(presetAmounts, id: \.self) { amount in
                            Button {
                                viewModel.amount = amount
                            } label: {
                                Text("$\(Int(amount))")
                                    .font(.headline)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(viewModel.amount == amount ? Color.accentColor : Color(.systemGray5))
                                    .foregroundColor(viewModel.amount == amount ? .white : .primary)
                                    .cornerRadius(8)
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    HStack {
                        Text("Custom: $")
                        TextField("Amount", value: $viewModel.amount, format: .number)
                            .keyboardType(.decimalPad)
                    }
                }

                Section("Recipient") {
                    TextField("Recipient Name *", text: $viewModel.recipientName)
                    TextField("Recipient Email *", text: $viewModel.recipientEmail)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                }

                Section("Purchaser") {
                    TextField("Your Name *", text: $viewModel.purchaserName)
                    TextField("Your Email", text: $viewModel.purchaserEmail)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                }

                Section("Message") {
                    TextField("Personal message (optional)", text: $viewModel.message, axis: .vertical)
                        .lineLimit(3...6)
                }

                Section("Template") {
                    Picker("Design", selection: $viewModel.template) {
                        Text("Default").tag("default")
                        Text("Birthday").tag("birthday")
                        Text("Holiday").tag("holiday")
                        Text("Thank You").tag("thank_you")
                        Text("Wedding").tag("wedding")
                    }
                }

                if let error = viewModel.error {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("New Gift Card")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        Task {
                            if await viewModel.save() {
                                onSave?()
                                dismiss()
                            }
                        }
                    }
                    .disabled(!viewModel.isValid || viewModel.isSaving)
                }
            }
        }
    }
}

@MainActor
class AddGiftCardViewModel: ObservableObject {
    @Published var amount: Double = 50
    @Published var recipientName = ""
    @Published var recipientEmail = ""
    @Published var purchaserName = ""
    @Published var purchaserEmail = ""
    @Published var message = ""
    @Published var template = "default"
    @Published var isSaving = false
    @Published var error: String?

    var isValid: Bool {
        amount > 0 && !recipientName.isEmpty && !recipientEmail.isEmpty && !purchaserName.isEmpty
    }

    func save() async -> Bool {
        isSaving = true
        error = nil

        do {
            struct CreateGiftCardRequest: Encodable {
                let amount: Double
                let recipientName: String
                let recipientEmail: String
                let purchaserName: String
                let purchaserEmail: String?
                let message: String?
                let template: String
            }

            let request = CreateGiftCardRequest(
                amount: amount,
                recipientName: recipientName,
                recipientEmail: recipientEmail,
                purchaserName: purchaserName,
                purchaserEmail: purchaserEmail.isEmpty ? nil : purchaserEmail,
                message: message.isEmpty ? nil : message,
                template: template
            )

            struct GiftCardResponse: Decodable {
                let id: String
            }

            let _: GiftCardResponse = try await APIClient.shared.post("/gift-cards", body: request)
            isSaving = false
            return true
        } catch {
            self.error = error.localizedDescription
            isSaving = false
            return false
        }
    }
}

#Preview("Add Client") {
    AddClientView()
}

#Preview("Add Appointment") {
    AddAppointmentView()
}

#Preview("Add Staff") {
    AddStaffView()
}

#Preview("Add Service") {
    AddServiceView()
}

#Preview("Add Product") {
    AddProductView()
}

#Preview("Add Gift Card") {
    AddGiftCardView()
}
