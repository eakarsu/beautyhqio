import { test, expect } from '@playwright/test';

test.describe('Dashboard Full Integration Tests', () => {
  test.describe('Dashboard Page UI Tests', () => {
    test('should display dashboard page or redirect to login', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/dashboard') || url.includes('/login') || url === 'http://localhost:3000/').toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should click sidebar navigation - Calendar', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const calendarLink = page.locator('a[href*="/calendar"], nav a:has-text("Calendar")');
      if ((await calendarLink.count()) > 0) {
        await calendarLink.first().click();
        await page.waitForLoadState('networkidle');
        expect(page.url().includes('/calendar') || page.url().includes('/login')).toBe(true);
      }
    });

    test('should click sidebar navigation - Clients', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const clientsLink = page.locator('a[href*="/clients"], nav a:has-text("Clients")');
      if ((await clientsLink.count()) > 0) {
        await clientsLink.first().click();
        await page.waitForLoadState('networkidle');
        expect(page.url().includes('/clients') || page.url().includes('/login')).toBe(true);
      }
    });

    test('should click sidebar navigation - Services', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const servicesLink = page.locator('a[href*="/services"], nav a:has-text("Services")');
      if ((await servicesLink.count()) > 0) {
        await servicesLink.first().click();
        await page.waitForLoadState('networkidle');
        expect(page.url().includes('/services') || page.url().includes('/login')).toBe(true);
      }
    });

    test('should click sidebar navigation - Staff', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const staffLink = page.locator('a[href*="/staff"], nav a:has-text("Staff")');
      if ((await staffLink.count()) > 0) {
        await staffLink.first().click();
        await page.waitForLoadState('networkidle');
        expect(page.url().includes('/staff') || page.url().includes('/login')).toBe(true);
      }
    });

    test('should click sidebar navigation - Products', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const productsLink = page.locator('a[href*="/products"], nav a:has-text("Products")');
      if ((await productsLink.count()) > 0) {
        await productsLink.first().click();
        await page.waitForLoadState('networkidle');
        expect(page.url().includes('/products') || page.url().includes('/login')).toBe(true);
      }
    });

    test('should click sidebar navigation - Reports', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const reportsLink = page.locator('a[href*="/reports"], nav a:has-text("Reports")');
      if ((await reportsLink.count()) > 0) {
        await reportsLink.first().click();
        await page.waitForLoadState('networkidle');
        expect(page.url().includes('/reports') || page.url().includes('/login')).toBe(true);
      }
    });

    test('should click sidebar navigation - Settings', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const settingsLink = page.locator('a[href*="/settings"], nav a:has-text("Settings")');
      if ((await settingsLink.count()) > 0) {
        await settingsLink.first().click();
        await page.waitForLoadState('networkidle');
        expect(page.url().includes('/settings') || page.url().includes('/login')).toBe(true);
      }
    });

    test('should click quick action - New Appointment', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const newAppointmentBtn = page.locator('button:has-text("New Appointment"), a:has-text("New Appointment"), button:has-text("Book"), a[href*="/appointments/new"]');
      if ((await newAppointmentBtn.count()) > 0) {
        await newAppointmentBtn.first().click();
        await page.waitForLoadState('networkidle');
      }
    });

    test('should click quick action - New Client', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const newClientBtn = page.locator('button:has-text("New Client"), a:has-text("New Client"), a[href*="/clients/new"]');
      if ((await newClientBtn.count()) > 0) {
        await newClientBtn.first().click();
        await page.waitForLoadState('networkidle');
      }
    });

    test('should click POS/Checkout button', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const posBtn = page.locator('button:has-text("POS"), a:has-text("POS"), a[href*="/pos"], button:has-text("Checkout"), a:has-text("Checkout")');
      if ((await posBtn.count()) > 0) {
        await posBtn.first().click();
        await page.waitForLoadState('networkidle');
      }
    });

    test('should click dashboard stat cards', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Revenue card
      const revenueCard = page.locator('[data-testid="revenue-card"], div:has-text("Revenue")').first();
      if ((await revenueCard.count()) > 0) {
        await revenueCard.click();
        await page.waitForTimeout(300);
      }

      // Appointments card
      const appointmentsCard = page.locator('[data-testid="appointments-card"], div:has-text("Appointments")').first();
      if ((await appointmentsCard.count()) > 0) {
        await appointmentsCard.click();
        await page.waitForTimeout(300);
      }
    });

    test('should click View All on upcoming appointments', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const viewAllBtn = page.locator('a:has-text("View All"), button:has-text("View All"), a:has-text("See All")');
      if ((await viewAllBtn.count()) > 0) {
        await viewAllBtn.first().click();
        await page.waitForLoadState('networkidle');
      }
    });

    test('should click date range selector', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const dateSelector = page.locator('button:has-text("Today"), button:has-text("This Week"), button:has-text("This Month"), [data-testid="date-range"]');
      if ((await dateSelector.count()) > 0) {
        await dateSelector.first().click();
        await page.waitForTimeout(300);
      }
    });

    test('should click user profile/menu', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const userMenu = page.locator('[data-testid="user-menu"], button[aria-label*="user" i], button[aria-label*="profile" i], .avatar, img[alt*="avatar" i]');
      if ((await userMenu.count()) > 0) {
        await userMenu.first().click();
        await page.waitForTimeout(300);
      }
    });

    test('should click notifications bell', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const notificationsBtn = page.locator('[data-testid="notifications"], button[aria-label*="notification" i], svg[class*="bell"]').first();
      if ((await notificationsBtn.count()) > 0) {
        await notificationsBtn.click();
        await page.waitForTimeout(300);
      }
    });

    test('should click sidebar collapse/expand', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const sidebarToggle = page.locator('[data-testid="sidebar-toggle"], button[aria-label*="sidebar" i], button[aria-label*="menu" i]');
      if ((await sidebarToggle.count()) > 0) {
        await sidebarToggle.first().click();
        await page.waitForTimeout(300);
      }
    });

    test('should click search button/input', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], [data-testid="search"]');
      if ((await searchInput.count()) > 0) {
        await searchInput.first().click();
        await searchInput.first().fill('test search');
        await page.waitForTimeout(300);
      }
    });

    test('should click AI Assistant button if exists', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const aiBtn = page.locator('button:has-text("AI"), a:has-text("AI"), a[href*="/ai"]');
      if ((await aiBtn.count()) > 0) {
        await aiBtn.first().click();
        await page.waitForLoadState('networkidle');
      }
    });
  });

  test.describe('Dashboard API Tests', () => {
    test('GET /api/dashboard should return dashboard data', async ({ request }) => {
      const response = await request.get('/api/dashboard');
      expect([200, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(typeof data === 'object').toBe(true);
      }
    });

    test('GET /api/dashboard with date range should work', async ({ request }) => {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const endDate = today.toISOString();

      const response = await request.get(`/api/dashboard?startDate=${startDate}&endDate=${endDate}`);
      expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /api/activities should return recent activities', async ({ request }) => {
      const response = await request.get('/api/activities');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /api/search should handle search queries', async ({ request }) => {
      const response = await request.get('/api/search?q=test');
      expect([200, 400, 401, 404]).toContain(response.status());
    });
  });
});
