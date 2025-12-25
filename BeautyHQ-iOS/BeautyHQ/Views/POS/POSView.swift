import SwiftUI

struct POSView: View {
    @StateObject private var viewModel = POSViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Summary Cards
                summarySection

                // Quick Actions
                quickActionsSection

                // Transactions
                transactionsSection
            }
            .navigationTitle("POS")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        // New sale
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .task {
            await viewModel.loadData()
        }
    }

    private var summarySection: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                SummaryCard(
                    title: "Today's Sales",
                    value: formatCurrency(viewModel.summary?.totalSales ?? 0),
                    color: .green
                )
                SummaryCard(
                    title: "Refunds",
                    value: formatCurrency(viewModel.summary?.totalRefunds ?? 0),
                    color: .red
                )
            }

            // Net Revenue Card
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Net Revenue")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(formatCurrency(viewModel.summary?.netRevenue ?? 0))
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(viewModel.summary?.transactionCount ?? 0)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.purple)
                    Text("Transactions")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
        }
        .padding()
    }

    private var quickActionsSection: some View {
        HStack(spacing: 12) {
            Button {
                // New sale
            } label: {
                HStack {
                    Image(systemName: "cart.fill")
                    Text("New Sale")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 48)
                .background(Color.purple)
                .foregroundColor(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }

            Button {
                // Refresh
            } label: {
                Image(systemName: "arrow.clockwise")
                    .frame(width: 48, height: 48)
                    .background(Color.purple.opacity(0.1))
                    .foregroundColor(.purple)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }

            Button {
                // Receipt
            } label: {
                Image(systemName: "doc.text")
                    .frame(width: 48, height: 48)
                    .background(Color.purple.opacity(0.1))
                    .foregroundColor(.purple)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(.horizontal)
        .padding(.bottom)
    }

    private var transactionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Today's Transactions")
                .font(.headline)
                .padding(.horizontal)

            if viewModel.transactions.isEmpty {
                EmptyStateView(
                    icon: "doc.text",
                    title: "No Transactions",
                    message: "Start ringing up sales to see them here."
                )
            } else {
                List {
                    ForEach(viewModel.transactions) { transaction in
                        TransactionRow(transaction: transaction)
                    }
                }
                .listStyle(.plain)
                .refreshable {
                    await viewModel.loadData()
                }
            }
        }
    }

    private func formatCurrency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: value)) ?? "$\(value)"
    }
}

// MARK: - Summary Card
struct SummaryCard: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.05), radius: 8, y: 2)
    }
}

// MARK: - Transaction Row
struct TransactionRow: View {
    let transaction: Transaction

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: transaction.type.icon)
                .font(.title3)
                .foregroundColor(transaction.type.color)
                .frame(width: 40, height: 40)
                .background(transaction.type.color.opacity(0.15))
                .clipShape(RoundedRectangle(cornerRadius: 10))

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(transaction.type.displayName)
                        .font(.subheadline)
                        .fontWeight(.medium)
                    Spacer()
                    Text(transaction.formattedTotal)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(transaction.type == .refund ? .red : .primary)
                }

                HStack {
                    Text(transaction.createdAt, style: .time)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("•")
                        .foregroundColor(.secondary)
                    Text(transaction.paymentMethod.displayName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("\(transaction.items.count) item\(transaction.items.count != 1 ? "s" : "")")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color(.systemGray6))
                        .clipShape(Capsule())
                }
            }

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    POSView()
}
