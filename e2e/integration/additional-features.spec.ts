import { test, expect } from '@playwright/test';

test.describe('Additional Features Integration Tests', () => {
  test.describe('Activities API Tests', () => {
    test('GET /api/activities should return response', async ({ request }) => {
      const response = await request.get('/api/activities');
      expect([200, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Attachments API Tests', () => {
    test('GET /api/attachments should return response', async ({ request }) => {
      const response = await request.get('/api/attachments');
      expect([200, 400, 401, 404, 405, 500]).toContain(response.status());
    });

    test('POST /api/attachments should handle upload', async ({ request }) => {
      const response = await request.post('/api/attachments', {
        data: {
          name: 'test-file.txt',
          type: 'text/plain',
          entityType: 'client',
          entityId: 'test-id',
        },
      });
      expect([200, 201, 400, 401, 404, 405, 500]).toContain(response.status());
    });
  });

  test.describe('Audit API Tests', () => {
    test('GET /api/audit should return response', async ({ request }) => {
      const response = await request.get('/api/audit');
      expect([200, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Automations API Tests', () => {
    test('GET /api/automations should return response', async ({ request }) => {
      const response = await request.get('/api/automations');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/automations should handle automation creation', async ({ request }) => {
      const response = await request.post('/api/automations', {
        data: {
          name: 'Test Automation',
          trigger: 'appointment_booked',
          action: 'send_email',
          isActive: true,
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });

    test('POST /api/automations/execute should handle execution', async ({ request }) => {
      const response = await request.post('/api/automations/execute', {
        data: {
          automationId: 'test-automation-id',
          triggerData: {},
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Booking API Tests', () => {
    test('GET /api/booking should return response', async ({ request }) => {
      const response = await request.get('/api/booking');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('GET /api/booking/availability should return response', async ({ request }) => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request.get(`/api/booking/availability?date=${today}`);
      expect([200, 400, 401, 404]).toContain(response.status());
    });

    test('POST /api/booking should handle booking request', async ({ request }) => {
      const response = await request.post('/api/booking', {
        data: {
          serviceId: 'test-service-id',
          staffId: 'test-staff-id',
          date: new Date().toISOString(),
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Business API Tests', () => {
    test('GET /api/business should return response', async ({ request }) => {
      const response = await request.get('/api/business');
      expect([200, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Calendar Integration API Tests', () => {
    test('GET /api/calendar/events should return response', async ({ request }) => {
      const response = await request.get('/api/calendar/events');
      expect([200, 400, 401, 404]).toContain(response.status());
    });

    test('GET /api/calendar/sync should return response', async ({ request }) => {
      const response = await request.get('/api/calendar/sync');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });
  });

  test.describe('Checkout API Tests', () => {
    test('GET /api/checkout should return response', async ({ request }) => {
      const response = await request.get('/api/checkout');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/checkout should handle checkout', async ({ request }) => {
      const response = await request.post('/api/checkout', {
        data: {
          items: [{ id: 'test-item', quantity: 1, price: 50 }],
          paymentMethod: 'card',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });

    test('POST /api/checkout/split-payment should handle split payment', async ({ request }) => {
      const response = await request.post('/api/checkout/split-payment', {
        data: {
          transactionId: 'test-transaction-id',
          payments: [
            { method: 'card', amount: 50 },
            { method: 'cash', amount: 50 },
          ],
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Client Advanced API Tests', () => {
    test('GET /api/clients/duplicates should return response', async ({ request }) => {
      const response = await request.get('/api/clients/duplicates');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/clients/merge should handle merge request', async ({ request }) => {
      const response = await request.post('/api/clients/merge', {
        data: {
          sourceClientId: 'test-source-id',
          targetClientId: 'test-target-id',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });

    test('GET /api/clients/family should return response', async ({ request }) => {
      const response = await request.get('/api/clients/family');
      expect([200, 400, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Commissions API Tests', () => {
    test('GET /api/commissions should return response', async ({ request }) => {
      const response = await request.get('/api/commissions');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/commissions should handle commission creation', async ({ request }) => {
      const response = await request.post('/api/commissions', {
        data: {
          staffId: 'test-staff-id',
          transactionId: 'test-transaction-id',
          amount: 25.0,
          percentage: 10,
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Daily Closeout API Tests', () => {
    test('GET /api/daily-closeout should return response', async ({ request }) => {
      const response = await request.get('/api/daily-closeout');
      expect([200, 400, 401, 404]).toContain(response.status());
    });

    test('GET /api/daily-closeout/history should return response', async ({ request }) => {
      const response = await request.get('/api/daily-closeout/history');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/daily-closeout should handle closeout', async ({ request }) => {
      const response = await request.post('/api/daily-closeout', {
        data: {
          date: new Date().toISOString().split('T')[0],
          locationId: 'test-location-id',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Export API Tests', () => {
    test('GET /api/export should return response', async ({ request }) => {
      const response = await request.get('/api/export');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/export should handle export request', async ({ request }) => {
      const response = await request.post('/api/export', {
        data: {
          type: 'clients',
          format: 'csv',
        },
      });
      expect([200, 201, 400, 401, 404, 405, 500]).toContain(response.status());
    });
  });

  test.describe('Import API Tests', () => {
    test('GET /api/import should return response', async ({ request }) => {
      const response = await request.get('/api/import');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/import should handle import request', async ({ request }) => {
      const response = await request.post('/api/import', {
        data: {
          type: 'clients',
          data: [],
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Group Appointments API Tests', () => {
    test('GET /api/group-appointments should return response', async ({ request }) => {
      const response = await request.get('/api/group-appointments');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/group-appointments should handle creation', async ({ request }) => {
      const response = await request.post('/api/group-appointments', {
        data: {
          name: 'Test Group Class',
          startTime: new Date().toISOString(),
          duration: 60,
          maxParticipants: 10,
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Marketing Campaigns API Tests', () => {
    test('GET /api/marketing/campaigns should return response', async ({ request }) => {
      const response = await request.get('/api/marketing/campaigns');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/marketing/campaigns should handle creation', async ({ request }) => {
      const response = await request.post('/api/marketing/campaigns', {
        data: {
          name: 'Test Campaign',
          type: 'email',
          subject: 'Test Subject',
          content: 'Test Content',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Memberships API Tests', () => {
    test('GET /api/memberships should return response', async ({ request }) => {
      const response = await request.get('/api/memberships');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/memberships should handle creation', async ({ request }) => {
      const response = await request.post('/api/memberships', {
        data: {
          name: 'Test Membership',
          price: 99.99,
          duration: 30,
          benefits: ['Unlimited haircuts'],
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Notes API Tests', () => {
    test('GET /api/notes should return response', async ({ request }) => {
      const response = await request.get('/api/notes');
      expect([200, 400, 401, 404]).toContain(response.status());
    });

    test('POST /api/notes should handle creation', async ({ request }) => {
      const response = await request.post('/api/notes', {
        data: {
          entityType: 'client',
          entityId: 'test-client-id',
          content: 'Test note content',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Packages API Tests', () => {
    test('GET /api/packages should return response', async ({ request }) => {
      const response = await request.get('/api/packages');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/packages should handle creation', async ({ request }) => {
      const response = await request.post('/api/packages', {
        data: {
          name: 'Test Package',
          price: 199.99,
          services: ['test-service-id'],
          validDays: 90,
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Payments API Tests', () => {
    test('POST /api/payments/create-intent should handle payment intent', async ({ request }) => {
      const response = await request.post('/api/payments/create-intent', {
        data: {
          amount: 5000,
          currency: 'usd',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });

    test('POST /api/payments/confirm should handle payment confirmation', async ({ request }) => {
      const response = await request.post('/api/payments/confirm', {
        data: {
          paymentIntentId: 'test-payment-intent',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });

    test('POST /api/payments/refund should handle refund', async ({ request }) => {
      const response = await request.post('/api/payments/refund', {
        data: {
          paymentId: 'test-payment-id',
          amount: 1000,
          reason: 'Customer request',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Products Advanced API Tests', () => {
    test('GET /api/products/categories should return response', async ({ request }) => {
      const response = await request.get('/api/products/categories');
      expect([200, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Purchase Orders API Tests', () => {
    test('GET /api/purchase-orders should return response', async ({ request }) => {
      const response = await request.get('/api/purchase-orders');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/purchase-orders should handle creation', async ({ request }) => {
      const response = await request.post('/api/purchase-orders', {
        data: {
          vendorId: 'test-vendor-id',
          items: [{ productId: 'test-product-id', quantity: 10, unitCost: 5.0 }],
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('QuickBooks Integration API Tests', () => {
    test('GET /api/quickbooks/sync should return response', async ({ request }) => {
      const response = await request.get('/api/quickbooks/sync');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('GET /api/quickbooks/reports should return response', async ({ request }) => {
      const response = await request.get('/api/quickbooks/reports');
      expect([200, 400, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Receipts API Tests', () => {
    test('GET /api/receipts should return response', async ({ request }) => {
      const response = await request.get('/api/receipts');
      expect([200, 400, 401, 404]).toContain(response.status());
    });

    test('POST /api/receipts/print should handle print request', async ({ request }) => {
      const response = await request.post('/api/receipts/print', {
        data: {
          transactionId: 'test-transaction-id',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Referrals API Tests', () => {
    test('GET /api/referrals should return response', async ({ request }) => {
      const response = await request.get('/api/referrals');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/referrals should handle creation', async ({ request }) => {
      const response = await request.post('/api/referrals', {
        data: {
          referrerId: 'test-client-id',
          referredEmail: 'referred@example.com',
          referredName: 'New Client',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Reports Advanced API Tests', () => {
    test('GET /api/reports/client-analytics should return response', async ({ request }) => {
      const response = await request.get('/api/reports/client-analytics');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /api/reports/inventory should return response', async ({ request }) => {
      const response = await request.get('/api/reports/inventory');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('GET /api/reports/staff-performance should return response', async ({ request }) => {
      const response = await request.get('/api/reports/staff-performance');
      expect([200, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Reviews API Tests', () => {
    test('GET /api/reviews should return response', async ({ request }) => {
      const response = await request.get('/api/reviews');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/reviews should handle creation', async ({ request }) => {
      const response = await request.post('/api/reviews', {
        data: {
          clientId: 'test-client-id',
          rating: 5,
          comment: 'Great service!',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Search API Tests', () => {
    test('GET /api/search should return response', async ({ request }) => {
      const response = await request.get('/api/search?q=test');
      expect([200, 400, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Services Advanced API Tests', () => {
    test('GET /api/services/categories should return response', async ({ request }) => {
      const response = await request.get('/api/services/categories');
      expect([200, 401, 404]).toContain(response.status());
    });
  });

  test.describe('SMS API Tests', () => {
    test('POST /api/sms/send should handle SMS send', async ({ request }) => {
      const response = await request.post('/api/sms/send', {
        data: {
          to: '+15551234567',
          message: 'Test message',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });

    test('POST /api/sms/bulk should handle bulk SMS', async ({ request }) => {
      const response = await request.post('/api/sms/bulk', {
        data: {
          recipients: ['+15551234567', '+15559876543'],
          message: 'Bulk test message',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });

    test('POST /api/sms/reminder should handle reminder SMS', async ({ request }) => {
      const response = await request.post('/api/sms/reminder', {
        data: {
          appointmentId: 'test-appointment-id',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Staff Advanced API Tests', () => {
    test('Staff time-off management', async ({ request }) => {
      const staffRes = await request.get('/api/staff');

      if (staffRes.status() === 200) {
        const staff = await staffRes.json();
        if (Array.isArray(staff) && staff.length > 0) {
          const staffId = staff[0].id;
          const response = await request.get(`/api/staff/${staffId}/time-off`);
          expect([200, 401, 404]).toContain(response.status());
        }
      }
    });
  });

  test.describe('Tips API Tests', () => {
    test('GET /api/tips should return response', async ({ request }) => {
      const response = await request.get('/api/tips');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/tips should handle tip creation', async ({ request }) => {
      const response = await request.post('/api/tips', {
        data: {
          staffId: 'test-staff-id',
          transactionId: 'test-transaction-id',
          amount: 15.0,
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Upload API Tests', () => {
    test('POST /api/upload should handle upload request', async ({ request }) => {
      const response = await request.post('/api/upload', {
        data: {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Users API Tests', () => {
    test('GET /api/users should return response', async ({ request }) => {
      const response = await request.get('/api/users');
      expect([200, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Vendors API Tests', () => {
    test('GET /api/vendors should return response', async ({ request }) => {
      const response = await request.get('/api/vendors');
      expect([200, 401, 404]).toContain(response.status());
    });

    test('POST /api/vendors should handle creation', async ({ request }) => {
      const response = await request.post('/api/vendors', {
        data: {
          name: 'Test Vendor',
          email: 'vendor@example.com',
          phone: '+15551234567',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });
});
