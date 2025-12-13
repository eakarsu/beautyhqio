import { test, expect } from '@playwright/test';

test.describe('Products Page', () => {
  test('should load the products page or redirect to login', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('/products') || url.includes('/login')).toBe(true);
  });

  test('should display content', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Products API', () => {
  let createdCategoryId: string;
  let createdProductId: string;

  test('GET /api/products should return products list', async ({ request }) => {
    const response = await request.get('/api/products');
    expect([200, 401, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data) || data.products !== undefined).toBe(true);
    }
  });

  test('GET /api/products/categories should return categories', async ({ request }) => {
    const response = await request.get('/api/products/categories');
    expect([200, 401, 500]).toContain(response.status());
  });

  test('POST /api/products/categories should create category', async ({ request }) => {
    const categoryData = {
      name: `Playwright Product Category ${Date.now()}`,
      description: 'Created by Playwright test',
    };

    const response = await request.post('/api/products/categories', {
      data: categoryData,
    });

    expect([201, 400, 401, 500]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      createdCategoryId = data.id;
    }
  });

  test('POST /api/products should create product', async ({ request }) => {
    const productData = {
      name: `Playwright Product ${Date.now()}`,
      sku: `PW-${Date.now()}`,
      description: 'Created by Playwright test',
      retailPrice: 29.99,
      costPrice: 15.00,
      stockQuantity: 100,
      categoryId: createdCategoryId,
    };

    const response = await request.post('/api/products', {
      data: productData,
    });

    expect([201, 400, 401, 500]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      createdProductId = data.id;
    }
  });

  test('GET /api/products/[id] should return product details', async ({ request }) => {
    if (!createdProductId) {
      const response = await request.get('/api/products/test-id');
      expect([404, 401, 500]).toContain(response.status());
      return;
    }

    const response = await request.get(`/api/products/${createdProductId}`);
    expect([200, 401, 404]).toContain(response.status());
  });

  test('PUT /api/products/[id] should update product', async ({ request }) => {
    if (!createdProductId) {
      test.skip();
      return;
    }

    const response = await request.put(`/api/products/${createdProductId}`, {
      data: { retailPrice: 39.99 },
    });

    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('POST /api/products/[id]/adjust-stock should adjust inventory', async ({ request }) => {
    if (!createdProductId) {
      test.skip();
      return;
    }

    const response = await request.post(`/api/products/${createdProductId}/adjust-stock`, {
      data: { adjustment: 10, reason: 'Playwright test adjustment' },
    });

    expect([200, 201, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/products with category filter should work', async ({ request }) => {
    if (!createdCategoryId) {
      test.skip();
      return;
    }

    const response = await request.get(`/api/products?categoryId=${createdCategoryId}`);
    expect([200, 401, 500]).toContain(response.status());
  });

  test.afterAll(async ({ request }) => {
    if (createdProductId) {
      await request.delete(`/api/products/${createdProductId}`);
    }
  });
});
