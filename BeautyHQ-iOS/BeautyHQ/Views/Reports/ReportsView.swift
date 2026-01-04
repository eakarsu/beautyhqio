import SwiftUI

struct ReportsView: View {
    @StateObject private var viewModel = ReportsViewModel()
    @State private var selectedPeriod = "This Month"
    @State private var showingExportSheet = false
    @State private var exportFormat: ExportFormat = .pdf

    let periods = ["Today", "This Week", "This Month", "This Year"]

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: value)) ?? "$\(value)"
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.lg) {
                    // Period Selector
                    ReportsPeriodSelector(periods: periods, selectedPeriod: $selectedPeriod)
                        .padding(.horizontal, Spacing.lg)

                    if viewModel.isLoading {
                        AppLoadingView()
                            .frame(height: 300)
                    } else {
                        // Revenue Card
                        RevenueReportCard(
                            revenue: viewModel.report?.revenue ?? "$0",
                            change: viewModel.report?.revenueChange ?? "+0%",
                            trend: viewModel.revenueTrend,
                            maxRevenue: viewModel.maxRevenue
                        )
                        .padding(.horizontal, Spacing.lg)

                        // Appointments Card
                        AppointmentsReportCard(
                            total: viewModel.report?.totalAppointments ?? 0,
                            completed: viewModel.report?.completedAppointments ?? 0,
                            cancelled: viewModel.report?.cancelledAppointments ?? 0
                        )
                        .padding(.horizontal, Spacing.lg)

                        // Top Services Card
                        TopServicesCard(services: viewModel.report?.topServices ?? [])
                            .padding(.horizontal, Spacing.lg)

                        // Top Staff Card
                        TopStaffCard(staff: viewModel.report?.topStaff ?? [])
                            .padding(.horizontal, Spacing.lg)

                        // Staff Performance Details
                        if !viewModel.staffPerformance.isEmpty {
                            StaffPerformanceCard(performance: Array(viewModel.staffPerformance.prefix(5)))
                                .padding(.horizontal, Spacing.lg)
                        }
                    }
                }
                .padding(.vertical, Spacing.lg)
            }
            .background(Color.screenBackground)
            .navigationTitle("Reports")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingExportSheet = true
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                            .foregroundStyle(LinearGradient.roseGoldGradient)
                    }
                }
            }
            .refreshable {
                await viewModel.loadReport(period: selectedPeriod)
            }
        }
        .task {
            await viewModel.loadReport(period: selectedPeriod)
        }
        .onChange(of: selectedPeriod) { _, newPeriod in
            Task {
                await viewModel.loadReport(period: newPeriod)
            }
        }
        .sheet(isPresented: $showingExportSheet) {
            ExportReportSheet(
                period: selectedPeriod,
                report: viewModel.report,
                staffPerformance: viewModel.staffPerformance,
                onExport: { format in
                    exportFormat = format
                    viewModel.exportReport(format: format, period: selectedPeriod)
                }
            )
            .presentationDetents([.medium])
        }
    }
}

// MARK: - Period Selector
struct ReportsPeriodSelector: View {
    let periods: [String]
    @Binding var selectedPeriod: String

    var body: some View {
        HStack(spacing: Spacing.sm) {
            ForEach(periods, id: \.self) { period in
                Button {
                    selectedPeriod = period
                } label: {
                    Text(period)
                        .font(.appCaption)
                        .foregroundColor(selectedPeriod == period ? .white : .charcoal)
                        .padding(.horizontal, Spacing.md)
                        .padding(.vertical, Spacing.sm)
                        .background(
                            Group {
                                if selectedPeriod == period {
                                    LinearGradient.roseGoldGradient
                                } else {
                                    Color.cardBackground
                                }
                            }
                        )
                        .clipShape(Capsule())
                        .shadow(color: selectedPeriod == period ? .roseGold.opacity(0.3) : .clear, radius: 4, x: 0, y: 2)
                }
            }
        }
    }
}

// MARK: - Revenue Report Card
struct RevenueReportCard: View {
    let revenue: String
    let change: String
    let trend: [TimeSeriesData]
    let maxRevenue: Double

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            HStack {
                Text("Revenue")
                    .font(.appTitle3)
                    .foregroundColor(.charcoal)
                Spacer()
            }

            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    Text(revenue)
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundStyle(LinearGradient.roseGoldGradient)

                    Text(change)
                        .font(.appSubheadline)
                        .foregroundColor(.success)
                }

                Spacer()

                ZStack {
                    Circle()
                        .fill(LinearGradient.successGradient.opacity(0.2))
                        .frame(width: 50, height: 50)

                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .font(.system(size: 22, weight: .medium))
                        .foregroundColor(.success)
                }
            }

            // Revenue Trend Bars
            if !trend.isEmpty {
                HStack(alignment: .bottom, spacing: 4) {
                    ForEach(trend.suffix(7), id: \.date) { data in
                        VStack(spacing: 2) {
                            RoundedRectangle(cornerRadius: 4)
                                .fill(LinearGradient.roseGoldGradient)
                                .frame(height: max(10, CGFloat(data.revenue / maxRevenue) * 80))

                            Text(data.shortDate)
                                .font(.system(size: 8))
                                .foregroundColor(.softGray)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
                .frame(height: 100)
            } else {
                HStack {
                    Spacer()
                    Text("No trend data")
                        .font(.appCaption)
                        .foregroundColor(.softGray)
                    Spacer()
                }
                .frame(height: 100)
            }
        }
        .padding(Spacing.lg)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg, style: .continuous))
        .appShadow(.soft)
    }
}

// MARK: - Appointments Report Card
struct AppointmentsReportCard: View {
    let total: Int
    let completed: Int
    let cancelled: Int

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text("Appointments")
                .font(.appTitle3)
                .foregroundColor(.charcoal)

            HStack(spacing: Spacing.xl) {
                ReportMetricItem(value: "\(total)", label: "Total", gradient: .roseGoldGradient)
                ReportMetricItem(value: "\(completed)", label: "Completed", gradient: .successGradient)
                ReportMetricItem(value: "\(cancelled)", label: "Cancelled", gradient: .deepRoseGradient)
            }
        }
        .padding(Spacing.lg)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg, style: .continuous))
        .appShadow(.soft)
    }
}

struct ReportMetricItem: View {
    let value: String
    let label: String
    let gradient: LinearGradient

    var body: some View {
        VStack(spacing: Spacing.xs) {
            Text(value)
                .font(.appTitle)
                .foregroundStyle(gradient)

            Text(label)
                .font(.appCaption)
                .foregroundColor(.softGray)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Top Services Card
struct TopServicesCard: View {
    let services: [TopItem]

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text("Top Services")
                .font(.appTitle3)
                .foregroundColor(.charcoal)

            if services.isEmpty {
                Text("No data available")
                    .font(.appCaption)
                    .foregroundColor(.softGray)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, Spacing.md)
            } else {
                ForEach(Array(services.enumerated()), id: \.offset) { index, service in
                    HStack(spacing: Spacing.md) {
                        ZStack {
                            Circle()
                                .fill(LinearGradient.roseGoldGradient.opacity(0.2))
                                .frame(width: 32, height: 32)

                            Text("\(index + 1)")
                                .font(.appHeadline)
                                .foregroundColor(.roseGold)
                        }

                        Text(service.name)
                            .font(.appBody)
                            .foregroundColor(.charcoal)

                        Spacer()

                        Text(service.revenue)
                            .font(.appHeadline)
                            .foregroundStyle(LinearGradient.roseGoldGradient)
                    }
                    .padding(.vertical, Spacing.xs)

                    if index < services.count - 1 {
                        AppDivider()
                    }
                }
            }
        }
        .padding(Spacing.lg)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg, style: .continuous))
        .appShadow(.soft)
    }
}

// MARK: - Top Staff Card
struct TopStaffCard: View {
    let staff: [TopItem]

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text("Top Staff")
                .font(.appTitle3)
                .foregroundColor(.charcoal)

            if staff.isEmpty {
                Text("No data available")
                    .font(.appCaption)
                    .foregroundColor(.softGray)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, Spacing.md)
            } else {
                ForEach(Array(staff.enumerated()), id: \.offset) { index, member in
                    HStack(spacing: Spacing.md) {
                        ZStack {
                            Circle()
                                .fill(LinearGradient.goldGradient.opacity(0.2))
                                .frame(width: 32, height: 32)

                            Text("\(index + 1)")
                                .font(.appHeadline)
                                .foregroundColor(.champagneGold)
                        }

                        Text(member.name)
                            .font(.appBody)
                            .foregroundColor(.charcoal)

                        Spacer()

                        Text(member.revenue)
                            .font(.appHeadline)
                            .foregroundStyle(LinearGradient.goldGradient)
                    }
                    .padding(.vertical, Spacing.xs)

                    if index < staff.count - 1 {
                        AppDivider()
                    }
                }
            }
        }
        .padding(Spacing.lg)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg, style: .continuous))
        .appShadow(.soft)
    }
}

// MARK: - Staff Performance Card
struct StaffPerformanceCard: View {
    let performance: [StaffPerformanceData]

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: value)) ?? "$\(value)"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            Text("Staff Performance")
                .font(.appTitle3)
                .foregroundColor(.charcoal)

            ForEach(performance, id: \.staff.id) { staffData in
                VStack(alignment: .leading, spacing: Spacing.sm) {
                    HStack {
                        // Avatar
                        ZStack {
                            Circle()
                                .fill(LinearGradient.roseGoldGradient.opacity(0.2))
                                .frame(width: 44, height: 44)

                            Text(String(staffData.name.prefix(2)).uppercased())
                                .font(.appHeadline)
                                .foregroundColor(.roseGold)
                        }

                        VStack(alignment: .leading, spacing: 2) {
                            Text(staffData.name)
                                .font(.appHeadline)
                                .foregroundColor(.charcoal)

                            if let title = staffData.staff.title {
                                Text(title)
                                    .font(.appCaption)
                                    .foregroundColor(.softGray)
                            }
                        }

                        Spacer()

                        // Rating
                        if let rating = staffData.reviews?.averageRating {
                            HStack(spacing: 2) {
                                Image(systemName: "star.fill")
                                    .font(.caption)
                                    .foregroundColor(.champagneGold)
                                Text(String(format: "%.1f", rating))
                                    .font(.appCaption)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.charcoal)
                            }
                        }
                    }

                    // Stats row
                    HStack(spacing: Spacing.lg) {
                        StaffStatItem(value: "\(staffData.appointments.total)", label: "Appts")
                        StaffStatItem(value: String(format: "%.1fh", staffData.hoursWorked), label: "Hours")
                        StaffStatItem(
                            value: String(format: "%.0f%%", staffData.appointments.completionRate),
                            label: "Rate",
                            valueColor: .success
                        )

                        Spacer()

                        VStack(alignment: .trailing, spacing: 2) {
                            Text(formatCurrency(staffData.revenue.total))
                                .font(.appHeadline)
                                .foregroundStyle(LinearGradient.roseGoldGradient)
                            Text("Revenue")
                                .font(.appCaption2)
                                .foregroundColor(.softGray)
                        }
                    }
                }
                .padding(.vertical, Spacing.sm)

                if staffData.staff.id != performance.last?.staff.id {
                    AppDivider()
                }
            }
        }
        .padding(Spacing.lg)
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: CornerRadius.lg, style: .continuous))
        .appShadow(.soft)
    }
}

struct StaffStatItem: View {
    let value: String
    let label: String
    var valueColor: Color = .charcoal

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.appSubheadline)
                .fontWeight(.bold)
                .foregroundColor(valueColor)
            Text(label)
                .font(.appCaption2)
                .foregroundColor(.softGray)
        }
    }
}

// MARK: - Export Report Sheet
enum ExportFormat: String, CaseIterable {
    case pdf = "PDF"
    case csv = "CSV"
    case excel = "Excel"

    var icon: String {
        switch self {
        case .pdf: return "doc.fill"
        case .csv: return "tablecells"
        case .excel: return "tablecells.fill"
        }
    }
}

struct ExportReportSheet: View {
    let period: String
    let report: Report?
    let staffPerformance: [StaffPerformanceData]
    let onExport: (ExportFormat) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var selectedFormat: ExportFormat = .pdf
    @State private var isExporting = false
    @State private var showingShareSheet = false
    @State private var exportContent = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: Spacing.xl) {
                // Header
                VStack(spacing: Spacing.sm) {
                    ZStack {
                        Circle()
                            .fill(LinearGradient.roseGoldGradient.opacity(0.2))
                            .frame(width: 70, height: 70)

                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 28, weight: .medium))
                            .foregroundColor(.roseGold)
                    }

                    Text("Export Report")
                        .font(.appTitle2)
                        .foregroundColor(.charcoal)

                    Text("Export \(period.lowercased()) report")
                        .font(.appSubheadline)
                        .foregroundColor(.softGray)
                }
                .padding(.top, Spacing.lg)

                // Format Selection
                VStack(alignment: .leading, spacing: Spacing.md) {
                    Text("Choose format")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)
                        .padding(.horizontal, Spacing.lg)

                    HStack(spacing: Spacing.md) {
                        ForEach(ExportFormat.allCases, id: \.self) { format in
                            ExportFormatButton(
                                format: format,
                                isSelected: selectedFormat == format
                            ) {
                                selectedFormat = format
                            }
                        }
                    }
                    .padding(.horizontal, Spacing.lg)
                }

                // Quick Actions
                VStack(alignment: .leading, spacing: Spacing.md) {
                    Text("Quick Actions")
                        .font(.appHeadline)
                        .foregroundColor(.charcoal)
                        .padding(.horizontal, Spacing.lg)

                    VStack(spacing: Spacing.sm) {
                        ExportActionButton(icon: "printer", label: "Print Report") {
                            // Print functionality
                            exportContent = generateExportContent()
                            UIPasteboard.general.string = exportContent
                        }

                        ExportActionButton(icon: "envelope", label: "Email Report") {
                            exportContent = generateExportContent()
                            showingShareSheet = true
                        }
                    }
                    .padding(.horizontal, Spacing.lg)
                }

                Spacer()

                // Export Button
                Button {
                    isExporting = true
                    exportContent = generateExportContent()
                    onExport(selectedFormat)
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        isExporting = false
                        showingShareSheet = true
                    }
                } label: {
                    HStack(spacing: Spacing.sm) {
                        if isExporting {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Image(systemName: "arrow.down.doc")
                            Text("Export as \(selectedFormat.rawValue)")
                        }
                    }
                    .font(.appHeadline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .background(LinearGradient.roseGoldGradient)
                    .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
                    .shadow(color: .roseGold.opacity(0.4), radius: 10, x: 0, y: 5)
                }
                .disabled(isExporting)
                .padding(.horizontal, Spacing.lg)
                .padding(.bottom, Spacing.xl)
            }
            .background(Color.screenBackground)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(.roseGold)
                }
            }
            .sheet(isPresented: $showingShareSheet) {
                ShareSheet(items: [exportContent])
            }
        }
    }

    private func generateExportContent() -> String {
        guard let report = report else { return "No data" }

        switch selectedFormat {
        case .csv:
            var csv = "Metric,Value\n"
            csv += "Revenue,\"\(report.revenue)\"\n"
            csv += "Total Appointments,\(report.totalAppointments)\n"
            csv += "Completed Appointments,\(report.completedAppointments)\n"
            csv += "Cancelled Appointments,\(report.cancelledAppointments)\n"
            csv += "\nTop Services,Revenue\n"
            for service in report.topServices {
                csv += "\"\(service.name)\",\"\(service.revenue)\"\n"
            }
            csv += "\nTop Staff,Revenue\n"
            for staff in report.topStaff {
                csv += "\"\(staff.name)\",\"\(staff.revenue)\"\n"
            }
            return csv
        case .pdf, .excel:
            var text = "=== BeautyHQ Report ===\n"
            text += "Period: \(period)\n\n"
            text += "SUMMARY\n"
            text += "-------\n"
            text += "Revenue: \(report.revenue)\n"
            text += "Total Appointments: \(report.totalAppointments)\n"
            text += "Completed: \(report.completedAppointments)\n"
            text += "Cancelled: \(report.cancelledAppointments)\n\n"
            text += "TOP SERVICES\n"
            text += "------------\n"
            for (i, service) in report.topServices.enumerated() {
                text += "\(i + 1). \(service.name) - \(service.revenue)\n"
            }
            text += "\nTOP STAFF\n"
            text += "---------\n"
            for (i, staff) in report.topStaff.enumerated() {
                text += "\(i + 1). \(staff.name) - \(staff.revenue)\n"
            }
            return text
        }
    }
}

struct ExportActionButton: View {
    let icon: String
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.md) {
                Image(systemName: icon)
                    .font(.system(size: 18, weight: .medium))
                    .foregroundColor(.roseGold)
                    .frame(width: 40, height: 40)
                    .background(Color.roseGold.opacity(0.15))
                    .clipShape(Circle())

                Text(label)
                    .font(.appBody)
                    .foregroundColor(.charcoal)

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.softGray)
            }
            .padding(Spacing.md)
            .background(Color.cardBackground)
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
        }
    }
}

// MARK: - Share Sheet
struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

struct ExportFormatButton: View {
    let format: ExportFormat
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: Spacing.sm) {
                Image(systemName: format.icon)
                    .font(.system(size: 24, weight: .medium))
                    .foregroundColor(isSelected ? .white : .roseGold)

                Text(format.rawValue)
                    .font(.appCaption)
                    .foregroundColor(isSelected ? .white : .charcoal)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Spacing.lg)
            .background(
                Group {
                    if isSelected {
                        LinearGradient.roseGoldGradient
                    } else {
                        Color.cardBackground
                    }
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: CornerRadius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: CornerRadius.md)
                    .stroke(isSelected ? Color.clear : Color.blushPink, lineWidth: 1)
            )
            .shadow(color: isSelected ? .roseGold.opacity(0.3) : .clear, radius: 6, x: 0, y: 3)
        }
    }
}

// MARK: - Models
struct RevenueReportResponse: Codable {
    let summary: RevenueSummary
    let paymentMethods: [PaymentMethodBreakdown]?
    let timeSeries: [TimeSeriesData]?
}

struct RevenueSummary: Codable {
    let totalRevenue: Double
    let totalTax: Double
    let totalTips: Double
    let totalDiscounts: Double
    let serviceRevenue: Double
    let productRevenue: Double
    let transactionCount: Int
    let averageTransaction: Double
}

struct PaymentMethodBreakdown: Codable {
    let method: String
    let amount: Double
    let percentage: Double
}

struct TimeSeriesData: Codable {
    let date: String
    let revenue: Double
    let count: Int

    var shortDate: String {
        let parts = date.split(separator: "-")
        if parts.count == 3 {
            let months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            if let month = Int(parts[1]), month > 0 && month <= 12 {
                return "\(months[month]) \(parts[2])"
            }
        }
        return date
    }
}

struct ServicesReportResponse: Codable {
    let services: [ServicePerformance]
}

struct ServicePerformance: Codable {
    let service: ServiceInfo
    let revenue: Double
    let bookings: BookingStats?

    struct ServiceInfo: Codable {
        let id: String
        let name: String
        let category: String?
    }

    struct BookingStats: Codable {
        let total: Int
        let completed: Int
    }

    enum CodingKeys: String, CodingKey {
        case service, revenue, bookings
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        service = try container.decode(ServiceInfo.self, forKey: .service)
        revenue = try container.decodeFlexibleDouble(forKey: .revenue)
        bookings = try container.decodeIfPresent(BookingStats.self, forKey: .bookings)
    }
}

struct Report: Codable {
    let revenue: String
    let revenueChange: String
    let totalAppointments: Int
    let completedAppointments: Int
    let cancelledAppointments: Int
    let topServices: [TopItem]
    let topStaff: [TopItem]
}

struct TopItem: Codable {
    let name: String
    let revenue: String
}

struct StaffPerformanceResponse: Codable {
    let staff: [StaffPerformanceData]
    let totals: StaffTotals?
}

struct StaffTotals: Codable {
    let appointments: Int
    let revenue: Double
    let hoursWorked: Double
}

struct StaffPerformanceData: Codable {
    let staff: StaffInfo
    let appointments: AppointmentStats
    let hoursWorked: Double
    let revenue: RevenueStats
    let reviews: ReviewStats?

    struct StaffInfo: Codable {
        let id: String
        let displayName: String?
        let title: String?
        let user: StaffUser?
    }

    struct StaffUser: Codable {
        let firstName: String?
        let lastName: String?
    }

    struct AppointmentStats: Codable {
        let total: Int
        let completed: Int
        let cancelled: Int
        let completionRate: Double
    }

    struct RevenueStats: Codable {
        let total: Double
        let services: Double
        let products: Double
    }

    struct ReviewStats: Codable {
        let count: Int
        let averageRating: Double?
    }

    var name: String {
        if let displayName = staff.displayName, !displayName.isEmpty {
            return displayName
        }
        if let user = staff.user {
            return "\(user.firstName ?? "") \(user.lastName ?? "")".trimmingCharacters(in: .whitespaces)
        }
        return "Staff"
    }
}

// MARK: - ViewModel
@MainActor
class ReportsViewModel: ObservableObject {
    @Published var report: Report?
    @Published var revenueTrend: [TimeSeriesData] = []
    @Published var maxRevenue: Double = 1
    @Published var staffPerformance: [StaffPerformanceData] = []
    @Published var isLoading = false

    func loadReport(period: String) async {
        isLoading = true
        do {
            let currencyFormatter = NumberFormatter()
            currencyFormatter.numberStyle = .currency
            currencyFormatter.currencyCode = "USD"

            let revenueResponse: RevenueReportResponse = try await APIClient.shared.get("/reports/revenue")
            revenueTrend = revenueResponse.timeSeries ?? []
            maxRevenue = revenueTrend.map { $0.revenue }.max() ?? 1

            let servicesResponse: ServicesReportResponse = try await APIClient.shared.get("/reports/services")

            let staffResponse: StaffPerformanceResponse = try await APIClient.shared.get("/reports/staff-performance")
            staffPerformance = staffResponse.staff

            let revenueStr = currencyFormatter.string(from: NSNumber(value: revenueResponse.summary.totalRevenue)) ?? "$0"

            let topServices = servicesResponse.services
                .sorted { $0.revenue > $1.revenue }
                .prefix(5)
                .map { svc in
                    TopItem(name: svc.service.name, revenue: currencyFormatter.string(from: NSNumber(value: svc.revenue)) ?? "$0")
                }

            let topStaff = staffResponse.staff
                .sorted { $0.revenue.total > $1.revenue.total }
                .prefix(5)
                .map { staff in
                    TopItem(name: staff.name, revenue: currencyFormatter.string(from: NSNumber(value: staff.revenue.total)) ?? "$0")
                }

            let totalAppts = staffResponse.totals?.appointments ?? staffResponse.staff.reduce(0) { $0 + $1.appointments.total }
            let completedAppts = staffResponse.staff.reduce(0) { $0 + $1.appointments.completed }
            let cancelledAppts = staffResponse.staff.reduce(0) { $0 + $1.appointments.cancelled }

            report = Report(
                revenue: revenueStr,
                revenueChange: "\(revenueResponse.summary.transactionCount) transactions",
                totalAppointments: totalAppts,
                completedAppointments: completedAppts,
                cancelledAppointments: cancelledAppts,
                topServices: Array(topServices),
                topStaff: Array(topStaff)
            )
        } catch {
            print("Failed to load report: \(error)")
        }
        isLoading = false
    }

    func exportReport(format: ExportFormat, period: String) {
        // Generate export content based on format
        guard let report = report else { return }

        var content = ""

        switch format {
        case .csv:
            content = generateCSV(report: report)
        case .pdf, .excel:
            content = generateTextReport(report: report)
        }

        // For now, copy to clipboard and show share sheet
        UIPasteboard.general.string = content

        // In a real implementation, this would generate actual PDF/Excel files
        // and present a share sheet
        print("Export content:\n\(content)")
    }

    private func generateCSV(report: Report) -> String {
        var csv = "Metric,Value\n"
        csv += "Revenue,\"\(report.revenue)\"\n"
        csv += "Total Appointments,\(report.totalAppointments)\n"
        csv += "Completed Appointments,\(report.completedAppointments)\n"
        csv += "Cancelled Appointments,\(report.cancelledAppointments)\n"
        csv += "\nTop Services,Revenue\n"
        for service in report.topServices {
            csv += "\"\(service.name)\",\"\(service.revenue)\"\n"
        }
        csv += "\nTop Staff,Revenue\n"
        for staff in report.topStaff {
            csv += "\"\(staff.name)\",\"\(staff.revenue)\"\n"
        }
        return csv
    }

    private func generateTextReport(report: Report) -> String {
        var text = "=== BeautyHQ Report ===\n\n"
        text += "SUMMARY\n"
        text += "-------\n"
        text += "Revenue: \(report.revenue)\n"
        text += "Total Appointments: \(report.totalAppointments)\n"
        text += "Completed: \(report.completedAppointments)\n"
        text += "Cancelled: \(report.cancelledAppointments)\n\n"
        text += "TOP SERVICES\n"
        text += "------------\n"
        for (i, service) in report.topServices.enumerated() {
            text += "\(i + 1). \(service.name) - \(service.revenue)\n"
        }
        text += "\nTOP STAFF\n"
        text += "---------\n"
        for (i, staff) in report.topStaff.enumerated() {
            text += "\(i + 1). \(staff.name) - \(staff.revenue)\n"
        }
        return text
    }
}

#Preview {
    ReportsView()
}
