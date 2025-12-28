import SwiftUI

struct ProductsView: View {
    @StateObject private var viewModel = ProductsViewModel()
    @State private var searchText = ""
    @State private var showingAddProduct = false

    var filteredProducts: [Product] {
        if searchText.isEmpty {
            return viewModel.products
        }
        return viewModel.products.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading {
                    ProgressView()
                } else if viewModel.products.isEmpty {
                    EmptyProductsView()
                } else {
                    List(filteredProducts) { product in
                        ProductRow(product: product)
                    }
                    .listStyle(.plain)
                    .searchable(text: $searchText, prompt: "Search products")
                }
            }
            .navigationTitle("Products")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAddProduct = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddProduct) {
                AddProductView()
            }
            .refreshable {
                await viewModel.loadProducts()
            }
        }
        .task {
            await viewModel.loadProducts()
        }
    }
}

struct ProductRow: View {
    let product: Product

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.gray.opacity(0.2))
                .frame(width: 60, height: 60)
                .overlay(
                    Image(systemName: "cube.box")
                        .foregroundColor(.gray)
                )

            VStack(alignment: .leading, spacing: 4) {
                Text(product.name)
                    .font(.headline)
                Text(product.brand ?? "")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                HStack {
                    Text(product.formattedPrice)
                        .fontWeight(.semibold)
                    Text("•")
                    Text("Stock: \(product.stockQuantity)")
                        .foregroundColor(product.stockQuantity < 10 ? .orange : .secondary)
                }
                .font(.caption)
            }

            Spacer()
        }
        .padding(.vertical, 4)
    }
}

struct EmptyProductsView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "cube.box")
                .font(.system(size: 50))
                .foregroundColor(.gray)
            Text("No Products")
                .font(.title2)
                .fontWeight(.semibold)
            Text("Add products to sell in your salon")
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Product Model
struct Product: Identifiable, Codable {
    let id: String
    let name: String
    let description: String?
    let brand: String?
    let sku: String?
    let barcode: String?
    let size: String?
    let price: Double
    let cost: Double?
    let quantityOnHand: Int?
    let reorderLevel: Int?
    let trackInventory: Bool?
    let isActive: Bool?

    // Custom decoder to handle Prisma Decimal (returns string)
    enum CodingKeys: String, CodingKey {
        case id, name, description, brand, sku, barcode, size
        case price, cost, quantityOnHand, reorderLevel, trackInventory, isActive
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        description = try container.decodeIfPresent(String.self, forKey: .description)
        brand = try container.decodeIfPresent(String.self, forKey: .brand)
        sku = try container.decodeIfPresent(String.self, forKey: .sku)
        barcode = try container.decodeIfPresent(String.self, forKey: .barcode)
        size = try container.decodeIfPresent(String.self, forKey: .size)
        price = try container.decodeFlexibleDouble(forKey: .price)
        cost = try container.decodeFlexibleDoubleIfPresent(forKey: .cost)
        quantityOnHand = try container.decodeIfPresent(Int.self, forKey: .quantityOnHand)
        reorderLevel = try container.decodeIfPresent(Int.self, forKey: .reorderLevel)
        trackInventory = try container.decodeIfPresent(Bool.self, forKey: .trackInventory)
        isActive = try container.decodeIfPresent(Bool.self, forKey: .isActive)
    }

    // Convenience for views
    var stockQuantity: Int { quantityOnHand ?? 0 }

    var formattedPrice: String {
        "$\(String(format: "%.2f", price))"
    }
}

@MainActor
class ProductsViewModel: ObservableObject {
    @Published var products: [Product] = []
    @Published var isLoading = false

    func loadProducts() async {
        isLoading = true
        do {
            products = try await APIClient.shared.get("/products")
        } catch {
            print("Failed to load products: \(error)")
        }
        isLoading = false
    }
}

#Preview {
    ProductsView()
}
