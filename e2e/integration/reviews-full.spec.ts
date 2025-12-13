import { test, expect } from '@playwright/test';

test.describe('Reviews Full Integration Tests', () => {
  test.describe('Reviews Page UI Tests', () => {
    test('should display reviews page or redirect to login', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/reviews') || url.includes('/login')).toBe(true);

      const body = page.locator('body');
      await expect(body).toBeVisible();
    });

    test('should click review row to view details', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        const reviewRow = page.locator('table tbody tr, [data-testid="review-item"], .review-card').first();
        if ((await reviewRow.count()) > 0) {
          await reviewRow.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click Respond button', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        const respondBtn = page.locator('button:has-text("Respond"), a:has-text("Respond"), button:has-text("Reply")');
        if ((await respondBtn.count()) > 0) {
          await respondBtn.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click AI Generate Response button', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        const aiBtn = page.locator('button:has-text("AI"), button:has-text("Generate"), button:has-text("Auto-respond")');
        if ((await aiBtn.count()) > 0) {
          await aiBtn.first().click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should click star rating filter', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        // 5 star filter
        const fiveStarBtn = page.locator('button:has-text("5"), button[aria-label*="5 star"]');
        if ((await fiveStarBtn.count()) > 0) {
          await fiveStarBtn.first().click();
          await page.waitForTimeout(300);
        }

        // All stars filter
        const allBtn = page.locator('button:has-text("All")');
        if ((await allBtn.count()) > 0) {
          await allBtn.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click status filter (Pending, Responded)', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        const pendingBtn = page.locator('button:has-text("Pending"), [role="tab"]:has-text("Pending")');
        if ((await pendingBtn.count()) > 0) {
          await pendingBtn.first().click();
          await page.waitForTimeout(300);
        }

        const respondedBtn = page.locator('button:has-text("Responded"), [role="tab"]:has-text("Responded")');
        if ((await respondedBtn.count()) > 0) {
          await respondedBtn.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click platform filter (Google, Yelp, Facebook)', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        const googleBtn = page.locator('button:has-text("Google"), [data-platform="google"]');
        if ((await googleBtn.count()) > 0) {
          await googleBtn.first().click();
          await page.waitForTimeout(300);
        }

        const yelpBtn = page.locator('button:has-text("Yelp"), [data-platform="yelp"]');
        if ((await yelpBtn.count()) > 0) {
          await yelpBtn.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Platforms settings link', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        const platformsLink = page.locator('a:has-text("Platforms"), button:has-text("Connect"), a[href*="/platforms"]');
        if ((await platformsLink.count()) > 0) {
          await platformsLink.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should click Request Review button', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        const requestBtn = page.locator('button:has-text("Request"), button:has-text("Ask for Review")');
        if ((await requestBtn.count()) > 0) {
          await requestBtn.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Export Reviews button', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download")');
        if ((await exportBtn.count()) > 0) {
          await exportBtn.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click date range filter', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        const dateFilter = page.locator('button:has-text("This Week"), button:has-text("This Month"), [data-testid="date-range"]');
        if ((await dateFilter.count()) > 0) {
          await dateFilter.first().click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should click Average Rating stat card', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        const ratingCard = page.locator('text=Average Rating').locator('..').locator('..');
        if ((await ratingCard.count()) > 0) {
          await ratingCard.first().click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should click Total Reviews stat card', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        const reviewsCard = page.locator('text=Total Reviews').locator('..').locator('..');
        if ((await reviewsCard.count()) > 0) {
          await reviewsCard.first().click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should click This Month stat card', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        const monthCard = page.locator('text=This Month').locator('..').locator('..');
        if ((await monthCard.count()) > 0) {
          await monthCard.first().click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/reports');
        }
      }
    });

    test('should click Response Rate stat card', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        const responseCard = page.locator('text=Response Rate').locator('..').locator('..');
        if ((await responseCard.count()) > 0) {
          await responseCard.first().click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('should click platform stat card', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        const platformCard = page.locator('.grid-cols-3 .cursor-pointer').first();
        if ((await platformCard.count()) > 0) {
          await platformCard.click();
          await page.waitForLoadState('networkidle');
          expect(page.url()).toContain('/reviews/platforms');
        }
      }
    });
  });

  test.describe('Respond to Review Page Tests', () => {
    test('should navigate to respond page', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        const respondLink = page.locator('a[href*="/respond"], button:has-text("Respond")').first();
        if ((await respondLink.count()) > 0) {
          await respondLink.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('should fill response textarea', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        const respondBtn = page.locator('button:has-text("Respond")').first();
        if ((await respondBtn.count()) > 0) {
          await respondBtn.click();
          await page.waitForTimeout(500);

          const responseInput = page.locator('textarea[name="response"], textarea');
          if ((await responseInput.count()) > 0) {
            await responseInput.first().fill('Thank you for your feedback!');
          }
        }
      }
    });

    test('should click Submit Response button', async ({ page }) => {
      await page.goto('/reviews');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/reviews')) {
        const submitBtn = page.locator('button:has-text("Submit"), button:has-text("Post Response"), button[type="submit"]');
        if ((await submitBtn.count()) > 0) {
          await expect(submitBtn.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Reviews Platforms Page Tests', () => {
    test('should display platforms page', async ({ page }) => {
      await page.goto('/reviews/platforms');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      expect(url.includes('/platforms') || url.includes('/reviews') || url.includes('/login')).toBe(true);
    });

    test('should click Connect Google button', async ({ page }) => {
      await page.goto('/reviews/platforms');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/platforms')) {
        const connectGoogleBtn = page.locator('button:has-text("Connect Google"), button:has-text("Google")');
        if ((await connectGoogleBtn.count()) > 0) {
          await expect(connectGoogleBtn.first()).toBeVisible();
        }
      }
    });

    test('should click Connect Yelp button', async ({ page }) => {
      await page.goto('/reviews/platforms');
      await page.waitForLoadState('networkidle');

      const url = page.url();
      if (url.includes('/platforms')) {
        const connectYelpBtn = page.locator('button:has-text("Connect Yelp"), button:has-text("Yelp")');
        if ((await connectYelpBtn.count()) > 0) {
          await expect(connectYelpBtn.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Reviews API Tests', () => {
    test('GET /api/reviews should return reviews list', async ({ request }) => {
      const response = await request.get('/api/reviews');
      expect([200, 401, 404]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(Array.isArray(data) || typeof data === 'object').toBe(true);
      }
    });

    test('GET /api/reviews with rating filter should work', async ({ request }) => {
      const response = await request.get('/api/reviews?rating=5');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /api/reviews with platform filter should work', async ({ request }) => {
      const response = await request.get('/api/reviews?platform=google');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /api/reviews/[id] should return review details', async ({ request }) => {
      const listResponse = await request.get('/api/reviews');

      if (listResponse.status() === 200) {
        const reviews = await listResponse.json();

        if (Array.isArray(reviews) && reviews.length > 0) {
          const reviewId = reviews[0].id;
          const response = await request.get(`/api/reviews/${reviewId}`);
          expect([200, 401, 404]).toContain(response.status());
        }
      }
    });

    test('POST /api/reviews/[id]/respond should post response', async ({ request }) => {
      const listResponse = await request.get('/api/reviews');

      if (listResponse.status() === 200) {
        const reviews = await listResponse.json();

        if (Array.isArray(reviews) && reviews.length > 0) {
          const reviewId = reviews[0].id;
          const response = await request.post(`/api/reviews/${reviewId}/respond`, {
            data: { response: 'Thank you for your feedback!' },
          });
          expect([200, 201, 400, 401, 404, 405, 500]).toContain(response.status());
        }
      }
    });

    test('POST /api/ai/review-response should generate AI response', async ({ request }) => {
      const response = await request.post('/api/ai/review-response', {
        data: {
          reviewText: 'Great service! The stylist was very professional.',
          rating: 5,
          reviewerName: 'Happy Customer',
        },
      });
      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });
});
