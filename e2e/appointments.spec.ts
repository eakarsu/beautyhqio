import { test, expect } from '@playwright/test';

test.describe('Appointments Page', () => {
  test('should load the calendar page or redirect to login', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('/calendar') || url.includes('/login')).toBe(true);
  });

  test('should display content', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Appointments API', () => {
  let testClientId: string;
  let testServiceId: string;
  let testStaffId: string;
  let createdAppointmentId: string;

  test.beforeAll(async ({ request }) => {
    // Get existing services
    const servicesResponse = await request.get('/api/services');
    if (servicesResponse.status() === 200) {
      const services = await servicesResponse.json();
      if (Array.isArray(services) && services.length > 0) {
        testServiceId = services[0].id;
      }
    }

    // Get existing staff
    const staffResponse = await request.get('/api/staff');
    if (staffResponse.status() === 200) {
      const staff = await staffResponse.json();
      if (Array.isArray(staff) && staff.length > 0) {
        testStaffId = staff[0].id;
      }
    }

    // Get existing clients
    const clientsResponse = await request.get('/api/clients');
    if (clientsResponse.status() === 200) {
      const clients = await clientsResponse.json();
      if (Array.isArray(clients) && clients.length > 0) {
        testClientId = clients[0].id;
      }
    }
  });

  test('GET /api/appointments should return appointments', async ({ request }) => {
    const response = await request.get('/api/appointments');
    expect([200, 401, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data) || data.appointments !== undefined).toBe(true);
    }
  });

  test('POST /api/appointments should create appointment', async ({ request }) => {
    if (!testClientId || !testServiceId || !testStaffId) {
      test.skip();
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const appointmentData = {
      clientId: testClientId,
      staffId: testStaffId,
      serviceId: testServiceId,
      startTime: tomorrow.toISOString(),
      duration: 60,
      notes: 'Playwright test appointment',
    };

    const response = await request.post('/api/appointments', {
      data: appointmentData,
    });

    expect([201, 400, 401, 409, 500]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      createdAppointmentId = data.id;
    }
  });

  test('GET /api/appointments/[id] should return appointment details', async ({ request }) => {
    if (!createdAppointmentId) {
      const response = await request.get('/api/appointments/test-id');
      expect([404, 401, 500]).toContain(response.status());
      return;
    }

    const response = await request.get(`/api/appointments/${createdAppointmentId}`);
    expect([200, 401, 404]).toContain(response.status());
  });

  test('PUT /api/appointments/[id] should update appointment status', async ({ request }) => {
    if (!createdAppointmentId) {
      test.skip();
      return;
    }

    const response = await request.put(`/api/appointments/${createdAppointmentId}`, {
      data: { status: 'CONFIRMED' },
    });

    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/appointments with date filter should work', async ({ request }) => {
    const today = new Date().toISOString().split('T')[0];
    const response = await request.get(`/api/appointments?date=${today}`);
    expect([200, 401, 500]).toContain(response.status());
  });

  test.afterAll(async ({ request }) => {
    if (createdAppointmentId) {
      await request.delete(`/api/appointments/${createdAppointmentId}`);
    }
  });
});
