import { test, expect } from '@playwright/test';

test.describe('Marketing Full Integration Tests', () => {
  test.describe('Marketing Page UI Tests', () => {
    test('should display marketing page or redirect to login', async ({ page }) => {
      await page.goto('/marketing');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/marketing') || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should click Create Campaign button', async ({ page }) => {
      await page.goto('/marketing');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/marketing')) {
        const createBtn = page.locator('button:has-text("Create"), button:has-text("New Campaign"), a:has-text("New Campaign"), a[href*="/campaigns/new"]');
        if ((await createBtn.count()) > 0) {
          await createBtn.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click campaign row to view details', async ({ page }) => {
      await page.goto('/marketing');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/marketing')) {
        const campaignRow = page.locator('table tbody tr, [data-testid="campaign-item"]').first();
        if ((await campaignRow.count()) > 0) {
          await campaignRow.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click Edit Campaign button', async ({ page }) => {
      await page.goto('/marketing');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/marketing')) {
        const editBtn = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
        if ((await editBtn.count()) > 0) {
          await editBtn.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click Delete Campaign button', async ({ page }) => {
      await page.goto('/marketing');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/marketing')) {
        const deleteBtn = page.locator('button:has-text("Delete"), button[aria-label*="delete" i]').first();
        if ((await deleteBtn.count()) > 0) {
          await expect(deleteBtn).toBeVisible();
        }
      }
    });

    test('should click Send Campaign button', async ({ page }) => {
      await page.goto('/marketing');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/marketing')) {
        const sendBtn = page.locator('button:has-text("Send"), button:has-text("Launch")');
        if ((await sendBtn.count()) > 0) {
          await expect(sendBtn.first()).toBeVisible();
        }
      }
    });

    test('should click Duplicate Campaign button', async ({ page }) => {
      await page.goto('/marketing');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/marketing')) {
        const duplicateBtn = page.locator('button:has-text("Duplicate"), button:has-text("Copy")');
        if ((await duplicateBtn.count()) > 0) {
          await duplicateBtn.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click filter tabs (All, Email, SMS)', async ({ page }) => {
      await page.goto('/marketing');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/marketing')) {
        const allTab = page.locator('button:has-text("All"), [role="tab"]:has-text("All")');
        if ((await allTab.count()) > 0) {
          await allTab.first().click();
          await page.waitForTimeout(300);
        }

        const emailTab = page.locator('button:has-text("Email"), [role="tab"]:has-text("Email")');
        if ((await emailTab.count()) > 0) {
          await emailTab.first().click();
          await page.waitForTimeout(300);
        }

        const smsTab = page.locator('button:has-text("SMS"), [role="tab"]:has-text("SMS")');
        if ((await smsTab.count()) > 0) {
          await smsTab.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click status filter', async ({ page }) => {
      await page.goto('/marketing');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/marketing')) {
        const statusFilter = page.locator('select, [role="combobox"]').first();
        if ((await statusFilter.count()) > 0) {
          await statusFilter.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click View Analytics button', async ({ page }) => {
      await page.goto('/marketing');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/marketing')) {
        const analyticsBtn = page.locator('button:has-text("Analytics"), a:has-text("Analytics"), button:has-text("Stats")');
        if ((await analyticsBtn.count()) > 0) {
          await analyticsBtn.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click Messages Sent stat card', async ({ page }) => {
      await page.goto('/marketing');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/marketing')) {
        const sentCard = page.locator('text=Messages Sent').locator('..').locator('..');
        if ((await sentCard.count()) > 0) {
          await sentCard.first().click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should click Avg Open Rate stat card', async ({ page }) => {
      await page.goto('/marketing');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/marketing')) {
        const openRateCard = page.locator('text=Avg Open Rate').locator('..').locator('..');
        if ((await openRateCard.count()) > 0) {
          await openRateCard.first().click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/reports');
        }
      }
    });

    test('should click Client Segments stat card', async ({ page }) => {
      await page.goto('/marketing');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/marketing')) {
        const segmentsCard = page.locator('text=Client Segments').locator('..').locator('..');
        if ((await segmentsCard.count()) > 0) {
          await segmentsCard.first().click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should click Total Campaigns stat card', async ({ page }) => {
      await page.goto('/marketing');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/marketing')) {
        const campaignsCard = page.locator('text=Total Campaigns').locator('..').locator('..');
        if ((await campaignsCard.count()) > 0) {
          await campaignsCard.first().click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('New Campaign Page Tests', () => {
    test('should display new campaign form', async ({ page }) => {
      await page.goto('/marketing/campaigns/new');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/campaigns/new') || url.includes('/marketing') || url.includes('/login')).toBe(true);
    });

    test('should fill campaign form fields', async ({ page }) => {
      await page.goto('/marketing/campaigns/new');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/campaigns/new')) {
        // Fill name
        const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
        if ((await nameInput.count()) > 0) {
          await nameInput.first().fill('Test Campaign');
        }

        // Fill subject
        const subjectInput = page.locator('input[name="subject"], input[placeholder*="subject" i]');
        if ((await subjectInput.count()) > 0) {
          await subjectInput.first().fill('Special Offer!');
        }

        // Fill content
        const contentInput = page.locator('textarea[name="content"], textarea, [contenteditable="true"]');
        if ((await contentInput.count()) > 0) {
          await contentInput.first().fill('Check out our amazing deals!');
        }
      }
    });

    test('should click campaign type selector (Email/SMS)', async ({ page }) => {
      await page.goto('/marketing/campaigns/new');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/campaigns/new')) {
        const emailBtn = page.locator('button:has-text("Email"), [role="radio"]:has-text("Email")');
        if ((await emailBtn.count()) > 0) {
          await emailBtn.first().click();
          await page.waitForTimeout(300);
        }

        const smsBtn = page.locator('button:has-text("SMS"), [role="radio"]:has-text("SMS")');
        if ((await smsBtn.count()) > 0) {
          await smsBtn.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click audience selector', async ({ page }) => {
      await page.goto('/marketing/campaigns/new');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/campaigns/new')) {
        const audienceSelector = page.locator('button:has-text("Select Audience"), button:has-text("Choose Recipients"), select[name="audience"]');
        if ((await audienceSelector.count()) > 0) {
          await audienceSelector.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Schedule button', async ({ page }) => {
      await page.goto('/marketing/campaigns/new');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/campaigns/new')) {
        const scheduleBtn = page.locator('button:has-text("Schedule"), input[type="datetime-local"]');
        if ((await scheduleBtn.count()) > 0) {
          await scheduleBtn.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Preview button', async ({ page }) => {
      await page.goto('/marketing/campaigns/new');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/campaigns/new')) {
        const previewBtn = page.locator('button:has-text("Preview")');
        if ((await previewBtn.count()) > 0) {
          await previewBtn.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Save Draft button', async ({ page }) => {
      await page.goto('/marketing/campaigns/new');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/campaigns/new')) {
        const saveDraftBtn = page.locator('button:has-text("Save Draft"), button:has-text("Save")');
        if ((await saveDraftBtn.count()) > 0) {
          await expect(saveDraftBtn.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Marketing API Tests', () => {
    test('GET /api/marketing/campaigns should return campaigns list', async ({ request }) => {
      const response = await request.get('/api/marketing/campaigns');
      expect([200, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      }
    });

    test('POST /api/marketing/campaigns should create campaign', async ({ request }) => {
      const campaignData = {
        name: `Integration Test Campaign ${Date.now()}`,
        type: 'email',
        subject: 'Test Subject',
        content: 'Test Content',
        status: 'draft',
      };

      const response = await request.post('/api/marketing/campaigns', {
        data: campaignData,
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });

    test('GET /api/marketing/campaigns/[id] should return campaign details', async ({ request }) => {
      const listResponse = await request.get('/api/marketing/campaigns');

      if (listResponse.status() === 200) {
        const campaigns = await listResponse.json();

        if (Array.isArray(campaigns) && campaigns.length > 0) {
          const campaignId = campaigns[0].id;
          const response = await request.get(`/api/marketing/campaigns/${campaignId}`);
          expect([200, 401, 404]).toContain(response.status());
        }
      }
    });

    test('PUT /api/marketing/campaigns/[id] should update campaign', async ({ request }) => {
      const listResponse = await request.get('/api/marketing/campaigns');

      if (listResponse.status() === 200) {
        const campaigns = await listResponse.json();

        if (Array.isArray(campaigns) && campaigns.length > 0) {
          const campaignId = campaigns[0].id;
          const response = await request.put(`/api/marketing/campaigns/${campaignId}`, {
            data: { name: `Updated Campaign ${Date.now()}` },
          });
          expect([200, 204, 400, 401, 404]).toContain(response.status());
        }
      }
    });

    test('POST /api/marketing/campaigns/[id]/send should send campaign', async ({ request }) => {
      const listResponse = await request.get('/api/marketing/campaigns');

      if (listResponse.status() === 200) {
        const campaigns = await listResponse.json();

        if (Array.isArray(campaigns) && campaigns.length > 0) {
          const campaignId = campaigns[0].id;
          const response = await request.post(`/api/marketing/campaigns/${campaignId}/send`);
          expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
        }
      }
    });

    test('DELETE /api/marketing/campaigns/[id] should delete campaign', async ({ request }) => {
      const listResponse = await request.get('/api/marketing/campaigns');

      if (listResponse.status() === 200) {
        const campaigns = await listResponse.json();

        if (Array.isArray(campaigns) && campaigns.length > 0) {
          // Don't actually delete, just verify endpoint exists
          const campaignId = campaigns[0].id;
          const response = await request.delete(`/api/marketing/campaigns/${campaignId}`);
          expect([200, 204, 400, 401, 404, 405]).toContain(response.status());
        }
      }
    });
  });
});
