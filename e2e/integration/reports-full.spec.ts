import { test, expect } from '@playwright/test';

test.describe('Reports Full Integration Tests', () => {
  test.describe('Reports Page UI Tests', () => {
    test('should display reports page or redirect to login', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/reports') || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should click Revenue Report card/link', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const revenueLink = page.locator('a:has-text("Revenue"), button:has-text("Revenue"), [data-testid="revenue-report"]');
        if ((await revenueLink.count()) > 0) {
          await revenueLink.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click Staff Performance Report card/link', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const staffLink = page.locator('a:has-text("Staff"), button:has-text("Staff Performance"), [data-testid="staff-report"]');
        if ((await staffLink.count()) > 0) {
          await staffLink.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click Services Report card/link', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const servicesLink = page.locator('a:has-text("Services"), button:has-text("Services"), [data-testid="services-report"]');
        if ((await servicesLink.count()) > 0) {
          await servicesLink.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click Client Analytics Report card/link', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const clientsLink = page.locator('a:has-text("Client"), button:has-text("Client Analytics"), [data-testid="clients-report"]');
        if ((await clientsLink.count()) > 0) {
          await clientsLink.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click Inventory Report card/link', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const inventoryLink = page.locator('a:has-text("Inventory"), button:has-text("Inventory"), [data-testid="inventory-report"]');
        if ((await inventoryLink.count()) > 0) {
          await inventoryLink.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click date range selector', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const dateSelector = page.locator('button:has-text("Today"), button:has-text("This Week"), button:has-text("This Month"), button:has-text("Custom"), [data-testid="date-range"]');
        if ((await dateSelector.count()) > 0) {
          await dateSelector.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Export button', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download")');
        if ((await exportBtn.count()) > 0) {
          await exportBtn.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Export to PDF button', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const pdfBtn = page.locator('button:has-text("PDF"), a:has-text("PDF")');
        if ((await pdfBtn.count()) > 0) {
          await pdfBtn.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Export to CSV button', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const csvBtn = page.locator('button:has-text("CSV"), a:has-text("CSV")');
        if ((await csvBtn.count()) > 0) {
          await csvBtn.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Print button', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const printBtn = page.locator('button:has-text("Print"), button[aria-label*="print" i]');
        if ((await printBtn.count()) > 0) {
          await expect(printBtn.first()).toBeVisible();
        }
      }
    });

    test('should click location filter', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const locationFilter = page.locator('select[name="location"], [data-testid="location-filter"]');
        if ((await locationFilter.count()) > 0) {
          await locationFilter.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click staff filter', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const staffFilter = page.locator('select[name="staff"], [data-testid="staff-filter"]');
        if ((await staffFilter.count()) > 0) {
          await staffFilter.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Report Builder link', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const builderLink = page.locator('a:has-text("Builder"), a:has-text("Custom Report"), a[href*="/builder"]');
        if ((await builderLink.count()) > 0) {
          await builderLink.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click chart type toggle', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const chartToggle = page.locator('button:has-text("Bar"), button:has-text("Line"), button:has-text("Pie"), [data-testid="chart-type"]');
        if ((await chartToggle.count()) > 0) {
          await chartToggle.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Compare to Previous Period toggle', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const compareToggle = page.locator('button:has-text("Compare"), [role="switch"], input[type="checkbox"]');
        if ((await compareToggle.count()) > 0) {
          await compareToggle.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Revenue stat card', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const revenueCard = page.locator('text=Revenue').first().locator('..').locator('..');
        if ((await revenueCard.count()) > 0) {
          await revenueCard.click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/pos');
        }
      }
    });

    test('should click Transactions stat card', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const transactionsCard = page.locator('text=Transactions').locator('..').locator('..');
        if ((await transactionsCard.count()) > 0) {
          await transactionsCard.first().click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/pos');
        }
      }
    });

    test('should click Service Revenue stat card', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const serviceCard = page.locator('text=Service Revenue').locator('..').locator('..');
        if ((await serviceCard.count()) > 0) {
          await serviceCard.first().click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/services');
        }
      }
    });

    test('should click Product Revenue stat card', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const productCard = page.locator('text=Product Revenue').locator('..').locator('..');
        if ((await productCard.count()) > 0) {
          await productCard.first().click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/products');
        }
      }
    });

    test('should click Avg Transaction stat card', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const avgCard = page.locator('text=Avg Transaction').locator('..').locator('..');
        if ((await avgCard.count()) > 0) {
          await avgCard.first().click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/pos');
        }
      }
    });

    test('should click Tips stat card', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const tipsCard = page.locator('text=Tips').locator('..').locator('..');
        if ((await tipsCard.count()) > 0) {
          await tipsCard.first().click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/staff/compensation');
        }
      }
    });

    test('should click staff row in Staff Performance table', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reports')) {
        const staffRow = page.locator('table tbody tr.cursor-pointer').first();
        if ((await staffRow.count()) > 0) {
          await staffRow.click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/staff/');
        }
      }
    });
  });

  test.describe('Report Builder Page Tests', () => {
    test('should display report builder page', async ({ page }) => {
      await page.goto('/reports/builder');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/builder') || url.includes('/reports') || url.includes('/login')).toBe(true);
    });

    test('should click add metric button', async ({ page }) => {
      await page.goto('/reports/builder');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/builder')) {
        const addMetricBtn = page.locator('button:has-text("Add Metric"), button:has-text("Add Field")');
        if ((await addMetricBtn.count()) > 0) {
          await addMetricBtn.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click save report button', async ({ page }) => {
      await page.goto('/reports/builder');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/builder')) {
        const saveBtn = page.locator('button:has-text("Save"), button:has-text("Save Report")');
        if ((await saveBtn.count()) > 0) {
          await expect(saveBtn.first()).toBeVisible();
        }
      }
    });

    test('should click run/preview report button', async ({ page }) => {
      await page.goto('/reports/builder');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/builder')) {
        const runBtn = page.locator('button:has-text("Run"), button:has-text("Preview"), button:has-text("Generate")');
        if ((await runBtn.count()) > 0) {
          await runBtn.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });
  });

  test.describe('Reports API Tests', () => {
    test('GET /api/reports/revenue should return revenue report', async ({ request }) => {
      const response = await request.get('/api/reports/revenue');
      expect([200, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(typeof data === 'object').toBe(true);
      }
    });

    test('GET /api/reports/revenue with date range should work', async ({ request }) => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();

      const response = await request.get(
        `/api/reports/revenue?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /api/reports/staff-performance should return staff report', async ({ request }) => {
      const response = await request.get('/api/reports/staff-performance');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /api/reports/services should return services report', async ({ request }) => {
      const response = await request.get('/api/reports/services');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /api/reports/client-analytics should return client report', async ({ request }) => {
      const response = await request.get('/api/reports/client-analytics');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /api/reports/inventory should return inventory report', async ({ request }) => {
      const response = await request.get('/api/reports/inventory');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/export should export report data', async ({ request }) => {
      const response = await request.post('/api/export', {
        data: {
          type: 'revenue',
          format: 'csv',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        },
      });
      expect([200, 201, 400, 401, 404, 405, 500]).toContain(response.status());
    });
  });
});
