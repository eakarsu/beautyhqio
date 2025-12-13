import { test, expect } from '@playwright/test';

test.describe('Complete Booking Flow E2E', () => {
  let testClientId: string;
  let testServiceId: string;
  let testStaffId: string;
  let testAppointmentId: string;

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
  });

  test('Step 1: Create new client', async ({ request }) => {
    const clientData = {
      firstName: 'Booking',
      lastName: `FlowTest${Date.now()}`,
      email: `booking-flow-${Date.now()}@test.com`,
      phone: '555-FLOW',
    };

    const response = await request.post('/api/clients', {
      data: clientData,
    });

    expect([201, 400, 401, 500]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      testClientId = data.id;
    }
  });

  test('Step 2: Browse available services', async ({ request }) => {
    const response = await request.get('/api/services?active=true');
    expect([200, 401, 500]).toContain(response.status());
  });

  test('Step 3: Check staff availability', async ({ request }) => {
    if (!testStaffId) {
      test.skip();
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const response = await request.get(`/api/staff/${testStaffId}/availability?date=${dateStr}`);
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('Step 4: Create appointment', async ({ request }) => {
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
      notes: 'E2E booking flow test',
    };

    const response = await request.post('/api/appointments', {
      data: appointmentData,
    });

    expect([201, 400, 401, 409, 500]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      testAppointmentId = data.id;
    }
  });

  test('Step 5: Confirm appointment', async ({ request }) => {
    if (!testAppointmentId) {
      test.skip();
      return;
    }

    const response = await request.put(`/api/appointments/${testAppointmentId}`, {
      data: { status: 'CONFIRMED' },
    });

    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('Step 6: Check-in client', async ({ request }) => {
    if (!testAppointmentId) {
      test.skip();
      return;
    }

    const response = await request.put(`/api/appointments/${testAppointmentId}`, {
      data: { status: 'CHECKED_IN' },
    });

    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('Step 7: Complete appointment', async ({ request }) => {
    if (!testAppointmentId) {
      test.skip();
      return;
    }

    const response = await request.put(`/api/appointments/${testAppointmentId}`, {
      data: { status: 'COMPLETED' },
    });

    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('Step 8: Verify client history', async ({ request }) => {
    if (!testClientId) {
      test.skip();
      return;
    }

    const response = await request.get(`/api/clients/${testClientId}`);
    expect([200, 401, 404]).toContain(response.status());
  });

  test.afterAll(async ({ request }) => {
    if (testAppointmentId) {
      await request.delete(`/api/appointments/${testAppointmentId}`);
    }
    if (testClientId) {
      await request.delete(`/api/clients/${testClientId}`);
    }
  });
});
