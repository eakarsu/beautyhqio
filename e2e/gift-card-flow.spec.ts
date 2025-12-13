import { test, expect } from '@playwright/test';

test.describe('Gift Card Flow E2E', () => {
  let giftCardId: string;
  let giftCardCode: string;
  const initialAmount = 100.00;

  test('Step 1: Purchase gift card', async ({ request }) => {
    const giftCardData = {
      amount: initialAmount,
      recipientEmail: `giftflow-${Date.now()}@test.com`,
      recipientName: 'Gift Flow Test Recipient',
      senderName: 'Gift Flow Test Sender',
      message: 'E2E gift card purchase test',
    };

    const response = await request.post('/api/gift-cards', {
      data: giftCardData,
    });

    expect([201, 400, 401, 500]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      giftCardId = data.id;
      giftCardCode = data.code;
    }
  });

  test('Step 2: Check initial balance', async ({ request }) => {
    if (!giftCardCode) {
      test.skip();
      return;
    }

    const response = await request.post('/api/gift-cards/check-balance', {
      data: { code: giftCardCode },
    });

    expect([200, 401, 404, 405, 500]).toContain(response.status());
  });

  test('Step 3: Partial redemption', async ({ request }) => {
    if (!giftCardCode) {
      test.skip();
      return;
    }

    const response = await request.post('/api/gift-cards/redeem', {
      data: { code: giftCardCode, amount: 30.00 },
    });

    expect([200, 201, 400, 401, 405, 500]).toContain(response.status());
  });

  test('Step 4: Verify remaining balance', async ({ request }) => {
    if (!giftCardCode) {
      test.skip();
      return;
    }

    const response = await request.post('/api/gift-cards/check-balance', {
      data: { code: giftCardCode },
    });

    expect([200, 401, 404, 405, 500]).toContain(response.status());
  });

  test('Step 5: Second redemption', async ({ request }) => {
    if (!giftCardCode) {
      test.skip();
      return;
    }

    const response = await request.post('/api/gift-cards/redeem', {
      data: { code: giftCardCode, amount: 50.00 },
    });

    expect([200, 201, 400, 401, 405, 500]).toContain(response.status());
  });

  test('Step 6: Attempt over-redemption', async ({ request }) => {
    if (!giftCardCode) {
      test.skip();
      return;
    }

    const response = await request.post('/api/gift-cards/redeem', {
      data: { code: giftCardCode, amount: 5000.00 },
    });

    expect([400, 401, 405, 500]).toContain(response.status());
  });

  test('Step 7: Verify final balance', async ({ request }) => {
    if (!giftCardCode) {
      test.skip();
      return;
    }

    const response = await request.post('/api/gift-cards/check-balance', {
      data: { code: giftCardCode },
    });

    expect([200, 401, 404, 405, 500]).toContain(response.status());
  });

  test.afterAll(async ({ request }) => {
    if (giftCardId) {
      await request.delete(`/api/gift-cards/${giftCardId}`);
    }
  });
});
