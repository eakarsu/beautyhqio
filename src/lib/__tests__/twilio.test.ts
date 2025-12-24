import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock twilio before importing the module
const mockMessagesCreate = jest.fn();
const mockCallsCreate = jest.fn();

jest.mock('twilio', () => {
  return jest.fn(() => ({
    messages: {
      create: mockMessagesCreate,
    },
    calls: {
      create: mockCallsCreate,
    },
  }));
});

// Set environment variables before importing
process.env.TWILIO_ACCOUNT_SID = 'ACtest123456789';
process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';
process.env.TWILIO_PHONE_NUMBER = '+15551234567';

// Import after mocking
import {
  sendSMS,
  sendBulkSMS,
  makeCall,
  sendAppointmentReminder,
  sendAppointmentConfirmationSMS,
  sendAppointmentReminderCall,
  generateTwiML,
  reminderTemplates,
  confirmationTemplates,
  voiceGreetings,
  voiceReminderTemplates,
} from '../twilio';

describe('Twilio SMS Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendSMS', () => {
    it('should send SMS successfully', async () => {
      mockMessagesCreate.mockResolvedValueOnce({
        sid: 'SM123456',
        status: 'sent',
      });

      const result = await sendSMS({
        to: '5551234567',
        message: 'Test message',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('SM123456');
      expect(result.status).toBe('sent');
      expect(mockMessagesCreate).toHaveBeenCalledWith({
        body: 'Test message',
        to: '+15551234567',
        from: '+15551234567',
      });
    });

    it('should format 10-digit US phone numbers correctly', async () => {
      mockMessagesCreate.mockResolvedValueOnce({
        sid: 'SM123456',
        status: 'sent',
      });

      await sendSMS({
        to: '8045551234',
        message: 'Test',
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+18045551234',
        })
      );
    });

    it('should format 11-digit US phone numbers correctly', async () => {
      mockMessagesCreate.mockResolvedValueOnce({
        sid: 'SM123456',
        status: 'sent',
      });

      await sendSMS({
        to: '18045551234',
        message: 'Test',
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+18045551234',
        })
      );
    });

    it('should handle phone numbers with special characters', async () => {
      mockMessagesCreate.mockResolvedValueOnce({
        sid: 'SM123456',
        status: 'sent',
      });

      await sendSMS({
        to: '(804) 555-1234',
        message: 'Test',
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+18045551234',
        })
      );
    });

    it('should include mediaUrl when provided', async () => {
      mockMessagesCreate.mockResolvedValueOnce({
        sid: 'SM123456',
        status: 'sent',
      });

      await sendSMS({
        to: '5551234567',
        message: 'Check this image',
        mediaUrl: 'https://example.com/image.jpg',
      });

      expect(mockMessagesCreate).toHaveBeenCalledWith({
        body: 'Check this image',
        to: '+15551234567',
        from: '+15551234567',
        mediaUrl: ['https://example.com/image.jpg'],
      });
    });

    it('should handle errors gracefully', async () => {
      mockMessagesCreate.mockRejectedValueOnce(new Error('Network error'));

      const result = await sendSMS({
        to: '5551234567',
        message: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('sendBulkSMS', () => {
    it('should send multiple SMS messages', async () => {
      mockMessagesCreate
        .mockResolvedValueOnce({ sid: 'SM1', status: 'sent' })
        .mockResolvedValueOnce({ sid: 'SM2', status: 'sent' })
        .mockResolvedValueOnce({ sid: 'SM3', status: 'sent' });

      const result = await sendBulkSMS([
        { phone: '5551111111', message: 'Message 1' },
        { phone: '5552222222', message: 'Message 2' },
        { phone: '5553333333', message: 'Message 3' },
      ]);

      expect(result.total).toBe(3);
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
    });

    it('should handle partial failures', async () => {
      mockMessagesCreate
        .mockResolvedValueOnce({ sid: 'SM1', status: 'sent' })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ sid: 'SM3', status: 'sent' });

      const result = await sendBulkSMS([
        { phone: '5551111111', message: 'Message 1' },
        { phone: '5552222222', message: 'Message 2' },
        { phone: '5553333333', message: 'Message 3' },
      ]);

      expect(result.total).toBe(3);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
    });
  });

  describe('sendAppointmentReminder', () => {
    it('should send reminder in English by default', async () => {
      mockMessagesCreate.mockResolvedValueOnce({
        sid: 'SM123',
        status: 'sent',
      });

      await sendAppointmentReminder(
        '5551234567',
        'John',
        'Dec 25',
        '2:00 PM',
        'Haircut'
      );

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('Hi John'),
          body: expect.stringContaining('Haircut'),
          body: expect.stringContaining('Dec 25'),
          body: expect.stringContaining('2:00 PM'),
        })
      );
    });

    it('should send reminder in Spanish', async () => {
      mockMessagesCreate.mockResolvedValueOnce({
        sid: 'SM123',
        status: 'sent',
      });

      await sendAppointmentReminder(
        '5551234567',
        'Maria',
        'Dec 25',
        '2:00 PM',
        'Corte de pelo',
        'es'
      );

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('Hola Maria'),
        })
      );
    });
  });

  describe('sendAppointmentConfirmationSMS', () => {
    it('should send confirmation with business name', async () => {
      mockMessagesCreate.mockResolvedValueOnce({
        sid: 'SM123',
        status: 'sent',
      });

      await sendAppointmentConfirmationSMS(
        '5551234567',
        'Jane',
        'Dec 26',
        '10:00 AM',
        'Manicure',
        'BeautyHQ Salon'
      );

      expect(mockMessagesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('Jane'),
          body: expect.stringContaining('BeautyHQ Salon'),
        })
      );
    });
  });
});

describe('Twilio Voice Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('makeCall', () => {
    it('should make a call with TwiML URL', async () => {
      mockCallsCreate.mockResolvedValueOnce({
        sid: 'CA123456',
        status: 'queued',
      });

      const result = await makeCall({
        to: '5551234567',
        twimlUrl: 'https://example.com/twiml',
      });

      expect(result.success).toBe(true);
      expect(result.callId).toBe('CA123456');
      expect(mockCallsCreate).toHaveBeenCalledWith({
        to: '+15551234567',
        from: '+15551234567',
        url: 'https://example.com/twiml',
      });
    });

    it('should make a call with inline TwiML', async () => {
      mockCallsCreate.mockResolvedValueOnce({
        sid: 'CA123456',
        status: 'queued',
      });

      const twiml = '<Response><Say>Hello</Say></Response>';
      const result = await makeCall({
        to: '5551234567',
        twiml,
      });

      expect(result.success).toBe(true);
      expect(mockCallsCreate).toHaveBeenCalledWith({
        to: '+15551234567',
        from: '+15551234567',
        twiml,
      });
    });

    it('should handle call errors', async () => {
      mockCallsCreate.mockRejectedValueOnce(new Error('Call failed'));

      const result = await makeCall({
        to: '5551234567',
        twimlUrl: 'https://example.com/twiml',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Call failed');
    });
  });

  describe('sendAppointmentReminderCall', () => {
    it('should make reminder call in English', async () => {
      mockCallsCreate.mockResolvedValueOnce({
        sid: 'CA123',
        status: 'queued',
      });

      await sendAppointmentReminderCall(
        '5551234567',
        'John',
        'Dec 25',
        '2:00 PM',
        'Haircut'
      );

      expect(mockCallsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+15551234567',
          twiml: expect.stringContaining('John'),
        })
      );
    });
  });
});

describe('TwiML Generation', () => {
  describe('generateTwiML', () => {
    it('should generate TwiML with say element', () => {
      const twiml = generateTwiML({
        say: { text: 'Hello, welcome!' },
      });

      expect(twiml).toContain('<Say');
      expect(twiml).toContain('Hello, welcome!');
    });

    it('should generate TwiML with hangup', () => {
      const twiml = generateTwiML({
        say: { text: 'Goodbye' },
        hangup: true,
      });

      expect(twiml).toContain('<Hangup/>');
    });

    it('should generate TwiML with custom voice', () => {
      const twiml = generateTwiML({
        say: {
          text: 'Test',
          voice: 'Polly.Matthew',
          language: 'en-US',
        },
      });

      expect(twiml).toContain('Polly.Matthew');
    });
  });
});

describe('Message Templates', () => {
  describe('reminderTemplates', () => {
    it('should have all supported languages', () => {
      expect(reminderTemplates).toHaveProperty('en');
      expect(reminderTemplates).toHaveProperty('es');
      expect(reminderTemplates).toHaveProperty('vi');
      expect(reminderTemplates).toHaveProperty('ko');
      expect(reminderTemplates).toHaveProperty('zh');
    });

    it('should generate correct English reminder', () => {
      const message = reminderTemplates.en('John', 'Dec 25', '2:00 PM', 'Haircut');
      expect(message).toContain('John');
      expect(message).toContain('Dec 25');
      expect(message).toContain('2:00 PM');
      expect(message).toContain('Haircut');
      expect(message).toContain('reminder');
    });

    it('should generate correct Spanish reminder', () => {
      const message = reminderTemplates.es('Maria', 'Dec 25', '2:00 PM', 'Corte');
      expect(message).toContain('Hola Maria');
      expect(message).toContain('Recordatorio');
    });
  });

  describe('confirmationTemplates', () => {
    it('should have all supported languages', () => {
      expect(confirmationTemplates).toHaveProperty('en');
      expect(confirmationTemplates).toHaveProperty('es');
      expect(confirmationTemplates).toHaveProperty('vi');
      expect(confirmationTemplates).toHaveProperty('ko');
      expect(confirmationTemplates).toHaveProperty('zh');
    });

    it('should include business name in confirmation', () => {
      const message = confirmationTemplates.en(
        'Jane',
        'Dec 26',
        '10:00 AM',
        'Manicure',
        'BeautyHQ'
      );
      expect(message).toContain('BeautyHQ');
      expect(message).toContain('confirmed');
    });
  });

  describe('voiceGreetings', () => {
    it('should have greetings in all languages', () => {
      expect(voiceGreetings).toHaveProperty('en');
      expect(voiceGreetings).toHaveProperty('es');
      expect(voiceGreetings).toHaveProperty('vi');
      expect(voiceGreetings).toHaveProperty('ko');
      expect(voiceGreetings).toHaveProperty('zh');
    });

    it('should have menu options in English greeting', () => {
      expect(voiceGreetings.en).toContain('Press 1');
      expect(voiceGreetings.en).toContain('press 2');
      expect(voiceGreetings.en).toContain('press 3');
    });
  });

  describe('voiceReminderTemplates', () => {
    it('should generate voice reminder with all details', () => {
      const message = voiceReminderTemplates.en(
        'John',
        'December 25th',
        '2:00 PM',
        'Haircut'
      );
      expect(message).toContain('John');
      expect(message).toContain('December 25th');
      expect(message).toContain('2:00 PM');
      expect(message).toContain('Haircut');
      expect(message).toContain('Press 1');
    });
  });
});
