/**
 * Integration test - sends REAL SMS
 * Run with: npx jest src/lib/__tests__/twilio-integration.test.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

import twilio from 'twilio';

describe('Twilio Integration Test (REAL SMS)', () => {
  it('should send a real SMS to 8043601129', async () => {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const message = await client.messages.create({
      body: 'Test message from Twilio integration test - ' + new Date().toISOString(),
      to: '+18043601129',
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    
    expect(message.sid).toBeDefined();
    expect(message.status).toBeDefined();
  });
});
