import Foundation

@MainActor
class POSViewModel: ObservableObject {
    @Published var transactions: [Transaction] = []
    @Published var summary: DailySummary?
    @Published var isLoading = false
    @Published var error: String?

    func loadData() async {
        isLoading = true
        error = nil

        do {
            async let transactionsTask = TransactionService.shared.getTodayTransactions()
            async let summaryTask = TransactionService.shared.getDailySummary()

            let (fetchedTransactions, fetchedSummary) = try await (transactionsTask, summaryTask)

            transactions = fetchedTransactions
            summary = fetchedSummary
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }
}
