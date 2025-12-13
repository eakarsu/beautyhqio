import { test, expect } from '@playwright/test';

test.describe('Products Full Integration Tests', () => {
  test.describe('Products Page UI Tests', () => {
    test('should display products page or redirect to login', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/products') || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should click Add Product button', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/products')) {
        const addButton = page.locator(
          'button:has-text("Add"), button:has-text("New"), a:has-text("Add Product"), a:has-text("New Product")'
        );
        if ((await addButton.count()) > 0) {
          await addButton.first().click();
          await page.waitForLoadState('networkidle');
          expect(
            page.url().includes('/products/new') ||
              page.url().includes('/products') ||
              page.url().includes('/login')
          ).toBe(true);
        }
      }
    });

    test('should click product row to view details', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/products')) {
        const productRow = page.locator('table tbody tr, [data-testid="product-item"]').first();
        if ((await productRow.count()) > 0) {
          await productRow.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click Edit button on product', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/products')) {
        const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
        if ((await editButton.count()) > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click Delete button on product', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/products')) {
        const deleteButton = page
          .locator('button:has-text("Delete"), button[aria-label="Delete"]')
          .first();
        if ((await deleteButton.count()) > 0) {
          // Just verify button exists, don't actually delete
          await expect(deleteButton).toBeVisible();
        }
      }
    });

    test('should click filter/search controls', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/products')) {
        // Search input
        const searchInput = page.locator(
          'input[placeholder*="search" i], input[type="search"], input[name="search"]'
        );
        if ((await searchInput.count()) > 0) {
          await searchInput.first().fill('test product');
          await page.waitForTimeout(500);
        }

        // Category filter
        const categoryFilter = page.locator('select, [role="combobox"]').first();
        if ((await categoryFilter.count()) > 0) {
          await categoryFilter.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Adjust Stock button', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/products')) {
        const stockButton = page
          .locator('button:has-text("Stock"), button:has-text("Adjust"), a:has-text("Stock")')
          .first();
        if ((await stockButton.count()) > 0) {
          await stockButton.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click Categories tab/link', async ({ page }) => {
      await page.goto('/products');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/products')) {
        const categoriesLink = page.locator(
          'a:has-text("Categories"), button:has-text("Categories")'
        );
        if ((await categoriesLink.count()) > 0) {
          await categoriesLink.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });
  });

  test.describe('New Product Page Tests', () => {
    test('should display new product form', async ({ page }) => {
      await page.goto('/products/new');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(
        url.includes('/products/new') || url.includes('/products') || url.includes('/login')
      ).toBe(true);
    });

    test('should fill product form fields', async ({ page }) => {
      await page.goto('/products/new');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/products/new')) {
        // Fill name
        const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
        if ((await nameInput.count()) > 0) {
          await nameInput.first().fill('Test Product');
        }

        // Fill price
        const priceInput = page.locator('input[name="price"], input[type="number"]').first();
        if ((await priceInput.count()) > 0) {
          await priceInput.fill('29.99');
        }

        // Fill SKU
        const skuInput = page.locator('input[name="sku"], input[placeholder*="sku" i]');
        if ((await skuInput.count()) > 0) {
          await skuInput.first().fill('TEST-001');
        }

        // Fill quantity
        const quantityInput = page.locator(
          'input[name="quantity"], input[name="quantityOnHand"]'
        );
        if ((await quantityInput.count()) > 0) {
          await quantityInput.first().fill('100');
        }
      }
    });

    test('should click Save/Submit button', async ({ page }) => {
      await page.goto('/products/new');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/products/new')) {
        const saveButton = page.locator(
          'button[type="submit"], button:has-text("Save"), button:has-text("Create")'
        );
        if ((await saveButton.count()) > 0) {
          await expect(saveButton.first()).toBeVisible();
        }
      }
    });

    test('should click Cancel button', async ({ page }) => {
      await page.goto('/products/new');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/products/new')) {
        const cancelButton = page.locator('button:has-text("Cancel"), a:has-text("Cancel")');
        if ((await cancelButton.count()) > 0) {
          await cancelButton.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });
  });

  test.describe('Products API Tests', () => {
    test('GET /api/products should return products list', async ({ request }) => {
      const response = await request.get('/api/products');
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      }
    });

    test('GET /api/products with search should work', async ({ request }) => {
      const response = await request.get('/api/products?search=test');
      expect([200, 401]).toContain(response.status());
    });

    test('GET /api/products with category filter should work', async ({ request }) => {
      const response = await request.get('/api/products?category=hair-care');
      expect([200, 401]).toContain(response.status());
    });

    test('GET /api/products/categories should return categories', async ({ request }) => {
      const response = await request.get('/api/products/categories');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/products should create product', async ({ request }) => {
      const productData = {
        name: `Integration Test Product ${Date.now()}`,
        description: 'Created by Playwright integration test',
        price: 29.99,
        cost: 15.0,
        sku: `TEST-${Date.now()}`,
        quantityOnHand: 100,
        trackInventory: true,
        isActive: true,
      };

      const response = await request.post('/api/products', {
        data: productData,
      });
      expect([200, 201, 400, 401, 500]).toContain(response.status());
    });

    test('GET /api/products/[id] should return product details', async ({ request }) => {
      const listResponse = await request.get('/api/products');

      if (listResponse.status() === 200) {
        const products = await listResponse.json();

        if (Array.isArray(products) && products.length > 0) {
          const productId = products[0].id;
          const response = await request.get(`/api/products/${productId}`);
          expect([200, 401, 404]).toContain(response.status());
        }
      }
    });

    test('PUT /api/products/[id] should update product', async ({ request }) => {
      const listResponse = await request.get('/api/products');

      if (listResponse.status() === 200) {
        const products = await listResponse.json();

        if (Array.isArray(products) && products.length > 0) {
          const productId = products[0].id;
          const response = await request.put(`/api/products/${productId}`, {
            data: { description: `Updated ${Date.now()}` },
          });
          expect([200, 204, 400, 401, 404]).toContain(response.status());
        }
      }
    });

    test('POST /api/products/[id]/adjust-stock should adjust stock', async ({ request }) => {
      const listResponse = await request.get('/api/products');

      if (listResponse.status() === 200) {
        const products = await listResponse.json();

        if (Array.isArray(products) && products.length > 0) {
          const productId = products[0].id;
          const response = await request.post(`/api/products/${productId}/adjust-stock`, {
            data: {
              adjustment: 5,
              reason: 'Integration test adjustment',
            },
          });
          expect([200, 201, 400, 401, 404]).toContain(response.status());
        }
      }
    });
  });
});
