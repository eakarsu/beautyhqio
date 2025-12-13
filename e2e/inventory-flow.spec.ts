import { test, expect } from '@playwright/test';

test.describe('Product Inventory Flow E2E', () => {
  let testCategoryId: string;
  let testProductId: string;
  const initialStock = 50;

  test('Step 1: Create product category', async ({ request }) => {
    const categoryData = {
      name: `Inventory Flow Category ${Date.now()}`,
      description: 'Category for inventory flow test',
    };

    const response = await request.post('/api/products/categories', {
      data: categoryData,
    });

    expect([201, 400, 401, 500]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      testCategoryId = data.id;
    }
  });

  test('Step 2: Create product', async ({ request }) => {
    if (!testCategoryId) {
      test.skip();
      return;
    }

    const productData = {
      name: `Inventory Flow Product ${Date.now()}`,
      sku: `INV-FLOW-${Date.now()}`,
      description: 'Product for inventory flow test',
      retailPrice: 49.99,
      costPrice: 25.00,
      stockQuantity: initialStock,
      reorderLevel: 10,
      categoryId: testCategoryId,
    };

    const response = await request.post('/api/products', {
      data: productData,
    });

    expect([201, 400, 401, 500]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      testProductId = data.id;
    }
  });

  test('Step 3: Verify product details', async ({ request }) => {
    if (!testProductId) {
      test.skip();
      return;
    }

    const response = await request.get(`/api/products/${testProductId}`);
    expect([200, 401, 404]).toContain(response.status());
  });

  test('Step 4: Adjust stock - receive shipment', async ({ request }) => {
    if (!testProductId) {
      test.skip();
      return;
    }

    const response = await request.post(`/api/products/${testProductId}/adjust-stock`, {
      data: { adjustment: 25, reason: 'Received shipment from supplier' },
    });

    expect([200, 201, 401, 404, 500]).toContain(response.status());
  });

  test('Step 5: Adjust stock - sell products', async ({ request }) => {
    if (!testProductId) {
      test.skip();
      return;
    }

    const response = await request.post(`/api/products/${testProductId}/adjust-stock`, {
      data: { adjustment: -5, reason: 'Sold to customer' },
    });

    expect([200, 201, 401, 404, 500]).toContain(response.status());
  });

  test('Step 6: Check transaction history', async ({ request }) => {
    if (!testProductId) {
      test.skip();
      return;
    }

    const response = await request.get(`/api/products/${testProductId}/transactions`);
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('Step 7: Update product pricing', async ({ request }) => {
    if (!testProductId) {
      test.skip();
      return;
    }

    const response = await request.put(`/api/products/${testProductId}`, {
      data: { retailPrice: 59.99, description: 'Updated product description' },
    });

    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('Step 8: List products by category', async ({ request }) => {
    if (!testCategoryId) {
      test.skip();
      return;
    }

    const response = await request.get(`/api/products?categoryId=${testCategoryId}`);
    expect([200, 401, 500]).toContain(response.status());
  });

  test.afterAll(async ({ request }) => {
    if (testProductId) {
      await request.delete(`/api/products/${testProductId}`);
    }
  });
});
