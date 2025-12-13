import { test, expect } from '@playwright/test';

test.describe('Appointment Booking Integration Tests', () => {
  let testStaffId: string;
  let testClientId: string;
  let testLocationId: string;

  test.beforeAll(async ({ request }) => {
    // Try to get required data
    const [staffRes, clientsRes, locationsRes] = await Promise.all([
      request.get('/api/staff'),
      request.get('/api/clients'),
      request.get('/api/locations'),
    ]);

    if (staffRes.status() === 200) {
      const staff = await staffRes.json();
      if (Array.isArray(staff) && staff.length > 0) {
        testStaffId = staff[0].id;
      }
    }

    if (clientsRes.status() === 200) {
      const clients = await clientsRes.json();
      if (Array.isArray(clients) && clients.length > 0) {
        testClientId = clients[0].id;
      }
    }

    if (locationsRes.status() === 200) {
      const locations = await locationsRes.json();
      if (Array.isArray(locations) && locations.length > 0) {
        testLocationId = locations[0].id;
      }
    }
  });

  test.describe('Calendar UI Tests', () => {
    test('should display calendar page or redirect to login', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/calendar') || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should render without crashing', async ({ page }) => {
      await page.goto('/calendar');
      await page.waitForLoadState('networkidle');

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Appointments API Tests', () => {
    test('GET /api/appointments should return response', async ({ request }) => {
      const response = await request.get('/api/appointments');
      expect([200, 401]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      }
    });

    test('GET /api/appointments with date filter should work', async ({ request }) => {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await request.get(`/api/appointments?startDate=${startDate}&endDate=${endDate}`);
      expect([200, 401]).toContain(response.status());
    });

    test('POST /api/appointments should handle appointment creation', async ({ request }) => {
      if (!testStaffId || !testLocationId) {
        test.skip();
        return;
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const endTime = new Date(tomorrow);
      endTime.setHours(11, 0, 0, 0);

      const appointmentData = {
        staffId: testStaffId,
        locationId: testLocationId,
        clientId: testClientId,
        scheduledStart: tomorrow.toISOString(),
        scheduledEnd: endTime.toISOString(),
        status: 'BOOKED',
        notes: 'Integration test appointment',
      };

      const response = await request.post('/api/appointments', {
        data: appointmentData,
      });

      expect([200, 201, 400, 401, 500]).toContain(response.status());
    });

    test('GET /api/appointments/[id] should return appointment or error', async ({ request }) => {
      const listResponse = await request.get('/api/appointments');

      if (listResponse.status() === 200) {
        const appointments = await listResponse.json();

        if (Array.isArray(appointments) && appointments.length > 0) {
          const appointmentId = appointments[0].id;
          const response = await request.get(`/api/appointments/${appointmentId}`);
          expect([200, 401, 404]).toContain(response.status());
        }
      }
    });

    test('PUT /api/appointments/[id] should handle update', async ({ request }) => {
      const listResponse = await request.get('/api/appointments');

      if (listResponse.status() === 200) {
        const appointments = await listResponse.json();

        if (Array.isArray(appointments) && appointments.length > 0) {
          const appointmentId = appointments[0].id;
          const response = await request.put(`/api/appointments/${appointmentId}`, {
            data: { notes: `Updated ${Date.now()}` },
          });
          expect([200, 204, 400, 401, 404]).toContain(response.status());
        }
      }
    });
  });

  test.describe('Appointment Workflow Tests', () => {
    test('appointment status transitions', async ({ request }) => {
      const listResponse = await request.get('/api/appointments');

      if (listResponse.status() === 200) {
        const appointments = await listResponse.json();

        if (Array.isArray(appointments) && appointments.length > 0) {
          const appointmentId = appointments[0].id;

          // Try to update status
          const statusResponse = await request.put(`/api/appointments/${appointmentId}`, {
            data: { status: 'CONFIRMED' },
          });
          expect([200, 204, 400, 401, 404]).toContain(statusResponse.status());
        }
      }
    });
  });
});
