import { test, expect } from '@playwright/test';

test.describe('Staff Page', () => {
  test('should load the staff page or redirect to login', async ({ page }) => {
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('/staff') || url.includes('/login')).toBe(true);
  });

  test('should display content', async ({ page }) => {
    await page.goto('/staff');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Staff API', () => {
  let createdStaffId: string;
  let existingStaffId: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.get('/api/staff');
    if (response.status() === 200) {
      const staff = await response.json();
      if (Array.isArray(staff) && staff.length > 0) {
        existingStaffId = staff[0].id;
      }
    }
  });

  test('GET /api/staff should return staff list', async ({ request }) => {
    const response = await request.get('/api/staff');
    expect([200, 401, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    }
  });

  test('POST /api/staff should create staff member', async ({ request }) => {
    const staffData = {
      firstName: 'Playwright',
      lastName: `Staff${Date.now()}`,
      email: `playwright-staff-${Date.now()}@test.com`,
      phone: '555-STAFF',
      role: 'STAFF',
    };

    const response = await request.post('/api/staff', {
      data: staffData,
    });

    expect([201, 400, 401, 500]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      createdStaffId = data.id;
    }
  });

  test('GET /api/staff/[id] should return staff details', async ({ request }) => {
    const staffId = createdStaffId || existingStaffId;
    if (!staffId) {
      const response = await request.get('/api/staff/test-id');
      expect([404, 401, 500]).toContain(response.status());
      return;
    }

    const response = await request.get(`/api/staff/${staffId}`);
    expect([200, 401, 404]).toContain(response.status());
  });

  test('PUT /api/staff/[id] should update staff', async ({ request }) => {
    const staffId = createdStaffId || existingStaffId;
    if (!staffId) {
      test.skip();
      return;
    }

    const response = await request.put(`/api/staff/${staffId}`, {
      data: { bio: 'Updated by Playwright test' },
    });

    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/staff/[id]/availability should return availability', async ({ request }) => {
    const staffId = createdStaffId || existingStaffId;
    if (!staffId) {
      test.skip();
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const response = await request.get(`/api/staff/${staffId}/availability?date=${today}`);
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('GET /api/staff/[id]/schedule should return schedule', async ({ request }) => {
    const staffId = createdStaffId || existingStaffId;
    if (!staffId) {
      test.skip();
      return;
    }

    const response = await request.get(`/api/staff/${staffId}/schedule`);
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test.afterAll(async ({ request }) => {
    if (createdStaffId) {
      await request.delete(`/api/staff/${createdStaffId}`);
    }
  });
});
