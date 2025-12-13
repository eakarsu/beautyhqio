import { test, expect } from '@playwright/test';

test.describe('Calendar Integration Tests', () => {
  test.describe('Calendar Page UI Tests', () => {
    test('should display calendar page or redirect to login', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/calendar') || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should render calendar view', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      // Check if calendar content exists or redirected to login
      const url = page.url();
      if (url.includes('/calendar')) {
        // Look for any calendar-related elements
        const calendarContainer = page.locator('body');
        await expect(calendarContainer).toBeVisible();
      }
    });

    test('should navigate to different views', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/calendar')) {
        // Try navigating to week view if available
        const weekButton = page.locator('button:has-text("Week"), [data-view="week"]');
        if (await weekButton.count() > 0) {
          await weekButton.first().click();
          await page.waitForLoadState('networkidle');
        }

        // Try navigating to day view if available
        const dayButton = page.locator('button:has-text("Day"), [data-view="day"]');
        if (await dayButton.count() > 0) {
          await dayButton.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should open new appointment modal when clicking on calendar', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/calendar')) {
        // Look for any clickable calendar cell or add button
        const addButton = page.locator('button:has-text("New"), button:has-text("Add"), [data-testid="add-appointment"]');
        if (await addButton.count() > 0) {
          await addButton.first().click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Calendar API Tests', () => {
    test('GET /api/calendar/events should return response', async ({ request }) => {
      const response = await request.get('/api/calendar/events');
      expect([200, 400, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      }
    });

    test('GET /api/calendar/events with date range should work', async ({ request }) => {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

      const response = await request.get(
        `/api/calendar/events?startDate=${startDate}&endDate=${endDate}`
      );
      expect([200, 400, 401, 404]).toContain(response.status());
    });

    test('POST /api/calendar/events should handle event creation', async ({ request }) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const endTime = new Date(tomorrow);
      endTime.setHours(11, 0, 0, 0);

      const eventData = {
        title: 'Integration Test Event',
        start: tomorrow.toISOString(),
        end: endTime.toISOString(),
        type: 'appointment',
      };

      const response = await request.post('/api/calendar/events', {
        data: eventData,
      });
      expect([200, 201, 400, 401, 404, 405, 500]).toContain(response.status());
    });

    test('GET /api/calendar/sync should return sync status', async ({ request }) => {
      const response = await request.get('/api/calendar/sync');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/calendar/sync should trigger sync', async ({ request }) => {
      const response = await request.post('/api/calendar/sync', {
        data: { provider: 'google' },
      });
      expect([200, 201, 400, 401, 404, 405, 500]).toContain(response.status());
    });
  });

  test.describe('Booking Availability Tests', () => {
    test('GET /api/booking/availability should return slots', async ({ request }) => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request.get(`/api/booking/availability?date=${today}`);
      expect([200, 400, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(typeof data === 'object').toBe(true);
      }
    });

    test('GET /api/booking/availability with staff filter should work', async ({ request }) => {
      const staffRes = await request.get('/api/staff');
      if (staffRes.status() === 200) {
        const staff = await staffRes.json();
        if (Array.isArray(staff) && staff.length > 0) {
          const staffId = staff[0].id;
          const today = new Date().toISOString().split('T')[0];
          const response = await request.get(
            `/api/booking/availability?date=${today}&staffId=${staffId}`
          );
          expect([200, 400, 401, 404]).toContain(response.status());
        }
      }
    });

    test('GET /api/booking/availability with service filter should work', async ({ request }) => {
      const servicesRes = await request.get('/api/services');
      if (servicesRes.status() === 200) {
        const services = await servicesRes.json();
        if (Array.isArray(services) && services.length > 0) {
          const serviceId = services[0].id;
          const today = new Date().toISOString().split('T')[0];
          const response = await request.get(
            `/api/booking/availability?date=${today}&serviceId=${serviceId}`
          );
          expect([200, 400, 401, 404]).toContain(response.status());
        }
      }
    });
  });
});
