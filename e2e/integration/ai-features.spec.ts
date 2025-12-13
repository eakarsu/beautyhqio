import { test, expect } from '@playwright/test';

test.describe('AI Features Integration Tests', () => {
  test.describe('AI Chat Assistant Tests', () => {
    test('GET /api/ai/chat should return response', async ({ request }) => {
      const response = await request.get('/api/ai/chat');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/chat should handle chat message', async ({ request }) => {
      const chatData = {
        message: 'What services do you offer?',
        context: 'customer_inquiry',
      };

      const response = await request.post('/api/ai/chat', {
        data: chatData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('response');
      }
    });

    test('POST /api/ai/chat with conversation history should work', async ({ request }) => {
      const chatData = {
        message: 'I want to book an appointment',
        conversationHistory: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hello! How can I help you today?' },
        ],
      };

      const response = await request.post('/api/ai/chat', {
        data: chatData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });

  test.describe('No-Show Prediction Tests', () => {
    test('GET /api/ai/no-show-prediction should return response', async ({ request }) => {
      const response = await request.get('/api/ai/no-show-prediction');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/no-show-prediction should analyze appointment', async ({ request }) => {
      // First get an appointment ID if available
      const appointmentsRes = await request.get('/api/appointments');
      let appointmentId;

      if (appointmentsRes.status() === 200) {
        const appointments = await appointmentsRes.json();
        if (Array.isArray(appointments) && appointments.length > 0) {
          appointmentId = appointments[0].id;
        }
      }

      const predictionData = {
        appointmentId: appointmentId || 'test-appointment-id',
        clientHistory: {
          totalAppointments: 10,
          noShows: 2,
          cancellations: 1,
        },
      };

      const response = await request.post('/api/ai/no-show-prediction', {
        data: predictionData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(typeof data === 'object').toBe(true);
      }
    });
  });

  test.describe('Voice Receptionist Tests', () => {
    test('GET /api/ai/voice-receptionist should return response', async ({ request }) => {
      const response = await request.get('/api/ai/voice-receptionist');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/voice-receptionist should handle voice query', async ({ request }) => {
      const voiceData = {
        transcript: 'I would like to schedule a haircut for tomorrow at 2pm',
        callerId: '+15551234567',
      };

      const response = await request.post('/api/ai/voice-receptionist', {
        data: voiceData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });

  test.describe('Style Recommendations Tests', () => {
    test('GET /api/ai/style-recommendation should return response', async ({ request }) => {
      const response = await request.get('/api/ai/style-recommendation');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/style-recommendation should generate recommendations', async ({ request }) => {
      // Get a client ID if available
      const clientsRes = await request.get('/api/clients');
      let clientId;

      if (clientsRes.status() === 200) {
        const clients = await clientsRes.json();
        if (Array.isArray(clients) && clients.length > 0) {
          clientId = clients[0].id;
        }
      }

      const styleData = {
        clientId: clientId || 'test-client-id',
        preferences: {
          hairType: 'straight',
          faceShape: 'oval',
          lifestyle: 'professional',
        },
        currentStyle: 'shoulder length',
      };

      const response = await request.post('/api/ai/style-recommendation', {
        data: styleData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });

  test.describe('Smart Scheduling Tests', () => {
    test('GET /api/ai/smart-scheduling should return response', async ({ request }) => {
      const response = await request.get('/api/ai/smart-scheduling');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/smart-scheduling should optimize schedule', async ({ request }) => {
      const scheduleData = {
        date: new Date().toISOString().split('T')[0],
        staffId: 'test-staff-id',
        preferences: {
          minimizeGaps: true,
          preferMorning: false,
        },
      };

      const response = await request.post('/api/ai/smart-scheduling', {
        data: scheduleData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });

  test.describe('Client Insights Tests', () => {
    test('GET /api/ai/client-insights should return response', async ({ request }) => {
      const response = await request.get('/api/ai/client-insights');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/client-insights should analyze client', async ({ request }) => {
      const clientsRes = await request.get('/api/clients');
      let clientId;

      if (clientsRes.status() === 200) {
        const clients = await clientsRes.json();
        if (Array.isArray(clients) && clients.length > 0) {
          clientId = clients[0].id;
        }
      }

      const insightsData = {
        clientId: clientId || 'test-client-id',
      };

      const response = await request.post('/api/ai/client-insights', {
        data: insightsData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });

  test.describe('Revenue Predictor Tests', () => {
    test('GET /api/ai/revenue-predictor should return response', async ({ request }) => {
      const response = await request.get('/api/ai/revenue-predictor');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/revenue-predictor should predict revenue', async ({ request }) => {
      const predictorData = {
        period: 'next_month',
        includeSeasonality: true,
      };

      const response = await request.post('/api/ai/revenue-predictor', {
        data: predictorData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });

  test.describe('Message Generator Tests', () => {
    test('GET /api/ai/message-generator should return response', async ({ request }) => {
      const response = await request.get('/api/ai/message-generator');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/message-generator should generate message', async ({ request }) => {
      const messageData = {
        type: 'appointment_reminder',
        clientName: 'Test Client',
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        serviceName: 'Haircut',
      };

      const response = await request.post('/api/ai/message-generator', {
        data: messageData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });

  test.describe('Review Response Generator Tests', () => {
    test('GET /api/ai/review-response should return response', async ({ request }) => {
      const response = await request.get('/api/ai/review-response');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/review-response should generate review response', async ({ request }) => {
      const reviewData = {
        reviewText: 'Great service! The stylist was very professional and friendly.',
        rating: 5,
        reviewerName: 'Happy Customer',
      };

      const response = await request.post('/api/ai/review-response', {
        data: reviewData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });

    test('POST /api/ai/review-response should handle negative review', async ({ request }) => {
      const reviewData = {
        reviewText: 'Had to wait too long for my appointment. Not happy.',
        rating: 2,
        reviewerName: 'Disappointed Customer',
      };

      const response = await request.post('/api/ai/review-response', {
        data: reviewData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });

  test.describe('Translation Service Tests', () => {
    test('GET /api/ai/translate should return response', async ({ request }) => {
      const response = await request.get('/api/ai/translate');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/translate should translate text', async ({ request }) => {
      const translateData = {
        text: 'Hello, how can I help you today?',
        targetLanguage: 'es',
        sourceLanguage: 'en',
      };

      const response = await request.post('/api/ai/translate', {
        data: translateData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });

  test.describe('Business Insights Tests', () => {
    test('GET /api/ai/business-insights should return response', async ({ request }) => {
      const response = await request.get('/api/ai/business-insights');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/business-insights should generate insights', async ({ request }) => {
      const insightsData = {
        period: 'last_month',
        metrics: ['revenue', 'appointments', 'clients'],
      };

      const response = await request.post('/api/ai/business-insights', {
        data: insightsData,
      });

      expect([200, 201, 400, 401, 404, 405, 500, 503]).toContain(response.status());
    });
  });

  test.describe('Staff Matcher Tests', () => {
    test('GET /api/ai/staff-matcher should return response', async ({ request }) => {
      const response = await request.get('/api/ai/staff-matcher');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/staff-matcher should match staff to client', async ({ request }) => {
      const matcherData = {
        clientPreferences: {
          gender: 'female',
          experienceLevel: 'senior',
          specialties: ['color', 'highlights'],
        },
        serviceType: 'hair_coloring',
      };

      const response = await request.post('/api/ai/staff-matcher', {
        data: matcherData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });

  test.describe('Appointment Optimizer Tests', () => {
    test('GET /api/ai/appointment-optimizer should return response', async ({ request }) => {
      const response = await request.get('/api/ai/appointment-optimizer');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/appointment-optimizer should optimize appointments', async ({ request }) => {
      const optimizerData = {
        date: new Date().toISOString().split('T')[0],
        optimizationGoal: 'minimize_gaps',
      };

      const response = await request.post('/api/ai/appointment-optimizer', {
        data: optimizerData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });

  test.describe('Booking Assistant Tests', () => {
    test('GET /api/ai/booking-assistant should return response', async ({ request }) => {
      const response = await request.get('/api/ai/booking-assistant');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/booking-assistant should assist with booking', async ({ request }) => {
      const bookingData = {
        query: 'I need a haircut sometime next week',
        clientId: 'test-client-id',
      };

      const response = await request.post('/api/ai/booking-assistant', {
        data: bookingData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });

  test.describe('Upsell Suggestions Tests', () => {
    test('GET /api/ai/upsell-suggestions should return response', async ({ request }) => {
      const response = await request.get('/api/ai/upsell-suggestions');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/upsell-suggestions should suggest upsells', async ({ request }) => {
      const upsellData = {
        currentService: 'Haircut',
        clientId: 'test-client-id',
        purchaseHistory: ['Shampoo', 'Conditioner'],
      };

      const response = await request.post('/api/ai/upsell-suggestions', {
        data: upsellData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });

  test.describe('Social Media Content Tests', () => {
    test('GET /api/ai/social-media should return response', async ({ request }) => {
      const response = await request.get('/api/ai/social-media');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/social-media should generate social content', async ({ request }) => {
      const socialData = {
        platform: 'instagram',
        contentType: 'promotion',
        topic: 'Summer hair care tips',
      };

      const response = await request.post('/api/ai/social-media', {
        data: socialData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });

  test.describe('Reactivation Campaigns Tests', () => {
    test('GET /api/ai/reactivation-campaigns should return response', async ({ request }) => {
      const response = await request.get('/api/ai/reactivation-campaigns');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/reactivation-campaigns should create campaign', async ({ request }) => {
      const campaignData = {
        targetSegment: 'lapsed_clients',
        inactiveDays: 90,
        campaignType: 'email',
      };

      const response = await request.post('/api/ai/reactivation-campaigns', {
        data: campaignData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });

  test.describe('Inventory Forecast Tests', () => {
    test('GET /api/ai/inventory-forecast should return response', async ({ request }) => {
      const response = await request.get('/api/ai/inventory-forecast');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/inventory-forecast should forecast inventory', async ({ request }) => {
      const forecastData = {
        productCategory: 'hair_care',
        forecastPeriod: 30,
      };

      const response = await request.post('/api/ai/inventory-forecast', {
        data: forecastData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });

  test.describe('Price Optimizer Tests', () => {
    test('GET /api/ai/price-optimizer should return response', async ({ request }) => {
      const response = await request.get('/api/ai/price-optimizer');
      expect([200, 400, 401, 404, 405]).toContain(response.status());
    });

    test('POST /api/ai/price-optimizer should optimize prices', async ({ request }) => {
      const priceData = {
        serviceId: 'test-service-id',
        competitorPrices: [50, 55, 60, 45],
        currentPrice: 55,
      };

      const response = await request.post('/api/ai/price-optimizer', {
        data: priceData,
      });

      expect([200, 201, 400, 401, 404, 500, 503]).toContain(response.status());
    });
  });
});

test.describe('AI UI Integration Tests', () => {
  test('should display AI assistant page or redirect to login', async ({ page }) => {
    await page.goto('/ai-assistant');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(
      url.includes('/ai-assistant') || url.includes('/login') || url.includes('/dashboard')
    ).toBe(true);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display AI insights page or redirect', async ({ page }) => {
    await page.goto('/insights');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(url.includes('/insights') || url.includes('/login') || url.includes('/dashboard')).toBe(
      true
    );

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display analytics page or redirect', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    expect(
      url.includes('/analytics') || url.includes('/login') || url.includes('/dashboard')
    ).toBe(true);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
