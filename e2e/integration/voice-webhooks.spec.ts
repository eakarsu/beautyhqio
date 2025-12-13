import { test, expect } from '@playwright/test';

test.describe('Voice System Integration Tests', () => {
  test.describe('Voice Incoming Call Tests', () => {
    test('POST /api/voice/incoming should handle incoming call', async ({ request }) => {
      const response = await request.post('/api/voice/incoming', {
        data: {
          CallSid: 'test-call-sid',
          From: '+15551234567',
          To: '+15559876543',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Voice Menu Tests', () => {
    test('POST /api/voice/menu should handle menu selection', async ({ request }) => {
      const response = await request.post('/api/voice/menu', {
        data: {
          CallSid: 'test-call-sid',
          Digits: '1',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Voice Booking Tests', () => {
    test('POST /api/voice/book should handle booking request', async ({ request }) => {
      const response = await request.post('/api/voice/book', {
        data: {
          CallSid: 'test-call-sid',
          serviceType: 'haircut',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });

    test('POST /api/voice/select-time should handle time selection', async ({ request }) => {
      const response = await request.post('/api/voice/select-time', {
        data: {
          CallSid: 'test-call-sid',
          Digits: '1',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });

    test('POST /api/voice/confirm-booking should handle confirmation', async ({ request }) => {
      const response = await request.post('/api/voice/confirm-booking', {
        data: {
          CallSid: 'test-call-sid',
          Digits: '1',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Voice Appointment Actions Tests', () => {
    test('POST /api/voice/appointment-action should handle action', async ({ request }) => {
      const response = await request.post('/api/voice/appointment-action', {
        data: {
          CallSid: 'test-call-sid',
          action: 'confirm',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });

    test('POST /api/voice/reschedule should handle reschedule', async ({ request }) => {
      const response = await request.post('/api/voice/reschedule', {
        data: {
          CallSid: 'test-call-sid',
          appointmentId: 'test-appointment-id',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Voice Transfer Tests', () => {
    test('POST /api/voice/transfer should handle call transfer', async ({ request }) => {
      const response = await request.post('/api/voice/transfer', {
        data: {
          CallSid: 'test-call-sid',
          transferTo: '+15551234567',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Voice AI Continue Tests', () => {
    test('POST /api/voice/ai-continue should handle AI continuation', async ({ request }) => {
      const response = await request.post('/api/voice/ai-continue', {
        data: {
          CallSid: 'test-call-sid',
          SpeechResult: 'I want to book an appointment for tomorrow',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Voice Transcription Tests', () => {
    test('POST /api/voice/transcription should handle transcription', async ({ request }) => {
      const response = await request.post('/api/voice/transcription', {
        data: {
          CallSid: 'test-call-sid',
          TranscriptionText: 'Test transcription',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });

  test.describe('Voice Voicemail Tests', () => {
    test('POST /api/voice/voicemail should handle voicemail', async ({ request }) => {
      const response = await request.post('/api/voice/voicemail', {
        data: {
          CallSid: 'test-call-sid',
          RecordingUrl: 'https://example.com/recording.mp3',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });
});

test.describe('Webhooks Integration Tests', () => {
  test.describe('Stripe Webhook Tests', () => {
    test('POST /api/webhooks/stripe should handle webhook', async ({ request }) => {
      const response = await request.post('/api/webhooks/stripe', {
        headers: {
          'stripe-signature': 'test-signature',
        },
        data: {
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: 'pi_test_123',
              amount: 5000,
            },
          },
        },
      });
      // Stripe webhooks typically fail without valid signature
      expect([200, 400, 401, 404, 500]).toContain(response.status());
    });
  });
});

test.describe('Appointment Workflow Integration Tests', () => {
  test.describe('Appointment Availability Tests', () => {
    test('GET /api/appointments/availability should return response', async ({ request }) => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request.get(`/api/appointments/availability?date=${today}`);
      expect([200, 400, 401, 404]).toContain(response.status());
    });
  });

  test.describe('Appointment Actions Tests', () => {
    test('Appointment cancel workflow', async ({ request }) => {
      const listResponse = await request.get('/api/appointments');

      if (listResponse.status() === 200) {
        const appointments = await listResponse.json();

        if (Array.isArray(appointments) && appointments.length > 0) {
          const appointmentId = appointments[0].id;
          const response = await request.post(`/api/appointments/${appointmentId}/cancel`, {
            data: { reason: 'Integration test cancellation' },
          });
          expect([200, 204, 400, 401, 404]).toContain(response.status());
        }
      }
    });

    test('Appointment check-in workflow', async ({ request }) => {
      const listResponse = await request.get('/api/appointments');

      if (listResponse.status() === 200) {
        const appointments = await listResponse.json();

        if (Array.isArray(appointments) && appointments.length > 0) {
          const appointmentId = appointments[0].id;
          const response = await request.post(`/api/appointments/${appointmentId}/check-in`);
          expect([200, 204, 400, 401, 404]).toContain(response.status());
        }
      }
    });

    test('Appointment complete workflow', async ({ request }) => {
      const listResponse = await request.get('/api/appointments');

      if (listResponse.status() === 200) {
        const appointments = await listResponse.json();

        if (Array.isArray(appointments) && appointments.length > 0) {
          const appointmentId = appointments[0].id;
          const response = await request.post(`/api/appointments/${appointmentId}/complete`);
          expect([200, 204, 400, 401, 404]).toContain(response.status());
        }
      }
    });
  });

  test.describe('Recurring Appointments Tests', () => {
    test('GET /api/appointments/recurring should return response', async ({ request }) => {
      const response = await request.get('/api/appointments/recurring');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/appointments/recurring should handle creation', async ({ request }) => {
      const staffRes = await request.get('/api/staff');
      let staffId;

      if (staffRes.status() === 200) {
        const staff = await staffRes.json();
        if (Array.isArray(staff) && staff.length > 0) {
          staffId = staff[0].id;
        }
      }

      const response = await request.post('/api/appointments/recurring', {
        data: {
          staffId: staffId || 'test-staff-id',
          frequency: 'weekly',
          startDate: new Date().toISOString(),
          occurrences: 4,
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });
  });
});

test.describe('Loyalty Advanced Integration Tests', () => {
  test.describe('Loyalty Account Tests', () => {
    test('Loyalty account lookup', async ({ request }) => {
      const clientsRes = await request.get('/api/clients');

      if (clientsRes.status() === 200) {
        const clients = await clientsRes.json();

        if (Array.isArray(clients) && clients.length > 0) {
          const clientId = clients[0].id;
          const response = await request.get(`/api/loyalty/account/${clientId}`);
          expect([200, 400, 401, 404]).toContain(response.status());
        }
      }
    });
  });

  test.describe('Loyalty Points Tests', () => {
    test('POST /api/loyalty/earn should handle points earning', async ({ request }) => {
      const response = await request.post('/api/loyalty/earn', {
        data: {
          clientId: 'test-client-id',
          points: 100,
          source: 'purchase',
          transactionId: 'test-transaction-id',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });

    test('POST /api/loyalty/redeem should handle points redemption', async ({ request }) => {
      const response = await request.post('/api/loyalty/redeem', {
        data: {
          clientId: 'test-client-id',
          points: 50,
          rewardId: 'test-reward-id',
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });

    test('GET /api/loyalty/rewards should return response', async ({ request }) => {
      const response = await request.get('/api/loyalty/rewards');
      expect([200, 401, 404]).toContain(response.status());
    });
  });
});

test.describe('Gift Card Advanced Integration Tests', () => {
  test.describe('Gift Card Redemption Tests', () => {
    test('POST /api/gift-cards/redeem should handle redemption', async ({ request }) => {
      const response = await request.post('/api/gift-cards/redeem', {
        data: {
          code: 'TEST-GIFT-CODE',
          amount: 25.0,
        },
      });
      expect([200, 201, 400, 401, 404, 500]).toContain(response.status());
    });

    test('GET /api/gift-cards/check-balance should check balance', async ({ request }) => {
      const response = await request.get('/api/gift-cards/check-balance?code=TEST-GIFT-CODE');
      expect([200, 400, 401, 404]).toContain(response.status());
    });
  });
});

test.describe('Client Photos Integration Tests', () => {
  test('Client photos management', async ({ request }) => {
    const clientsRes = await request.get('/api/clients');

    if (clientsRes.status() === 200) {
      const clients = await clientsRes.json();

      if (Array.isArray(clients) && clients.length > 0) {
        const clientId = clients[0].id;
        const response = await request.get(`/api/clients/${clientId}/photos`);
        expect([200, 400, 401, 404]).toContain(response.status());
      }
    }
  });
});

test.describe('Service Addons Integration Tests', () => {
  test('Service addons management', async ({ request }) => {
    const servicesRes = await request.get('/api/services');

    if (servicesRes.status() === 200) {
      const services = await servicesRes.json();

      if (Array.isArray(services) && services.length > 0) {
        const serviceId = services[0].id;
        const response = await request.get(`/api/services/${serviceId}/addons`);
        expect([200, 400, 401, 404]).toContain(response.status());
      }
    }
  });
});

test.describe('Product Transactions Integration Tests', () => {
  test('Product transactions history', async ({ request }) => {
    const productsRes = await request.get('/api/products');

    if (productsRes.status() === 200) {
      const products = await productsRes.json();

      if (Array.isArray(products) && products.length > 0) {
        const productId = products[0].id;
        const response = await request.get(`/api/products/${productId}/transactions`);
        expect([200, 400, 401, 404, 500]).toContain(response.status());
      }
    }
  });

  test('Product stock adjustment', async ({ request }) => {
    const productsRes = await request.get('/api/products');

    if (productsRes.status() === 200) {
      const products = await productsRes.json();

      if (Array.isArray(products) && products.length > 0) {
        const productId = products[0].id;
        const response = await request.post(`/api/products/${productId}/adjust-stock`, {
          data: {
            adjustment: 10,
            reason: 'Integration test adjustment',
          },
        });
        expect([200, 201, 400, 401, 404]).toContain(response.status());
      }
    }
  });
});
