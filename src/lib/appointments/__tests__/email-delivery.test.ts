import { credentials } from '@/lib/operations/connections';
import { AppointmentEmailError, resendAppointmentProvider, type AppointmentEmailMessage } from '../email-delivery';

jest.mock('@/lib/operations/connections', () => ({ credentials: jest.fn() }));

const credentialMock = credentials as jest.Mock;
const originalFetch = global.fetch;
const prior = {
  enabled: process.env.APPOINTMENT_EMAIL_DELIVERY_ENABLED,
  mode: process.env.APPOINTMENT_EMAIL_MODE,
  recipient: process.env.APPOINTMENT_EMAIL_TEST_RECIPIENT,
};

describe('appointment Resend sandbox adapter', () => {
  let message: AppointmentEmailMessage;
  beforeEach(async () => {
    process.env.APPOINTMENT_EMAIL_DELIVERY_ENABLED = 'true';
    process.env.APPOINTMENT_EMAIL_MODE = 'sandbox';
    process.env.APPOINTMENT_EMAIL_TEST_RECIPIENT = 'sandbox@example.test';
    credentialMock.mockReset().mockResolvedValue({ apiKey: 're_test_fixture_123456', from: 'Salon <mail@example.test>' });
    const config = await resendAppointmentProvider.configuration('salon-1');
    message = {
      id: 'outbox-1', businessId: 'salon-1', from: config.from, to: 'sandbox@example.test',
      subject: 'Your appointment', text: 'Appointment details', mode: 'sandbox',
      accountFingerprint: config.accountFingerprint,
    };
  });
  afterEach(() => { global.fetch = originalFetch; });
  afterAll(() => {
    for (const [key, value] of Object.entries({
      APPOINTMENT_EMAIL_DELIVERY_ENABLED: prior.enabled,
      APPOINTMENT_EMAIL_MODE: prior.mode,
      APPOINTMENT_EMAIL_TEST_RECIPIENT: prior.recipient,
    })) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  });

  test('sends the frozen sandbox payload with the outbox idempotency key', async () => {
    const fetchMock = jest.fn().mockResolvedValue(Response.json({ id: 'provider-123' }));
    global.fetch = fetchMock;
    await expect(resendAppointmentProvider.send(message)).resolves.toBe('provider-123');
    expect(credentialMock).toHaveBeenLastCalledWith('salon-1', 'resend');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(request.headers).toMatchObject({ Authorization: 'Bearer re_test_fixture_123456', 'Idempotency-Key': 'outbox-1' });
    expect(JSON.parse(request.body)).toEqual({ from: message.from, to: ['sandbox@example.test'], subject: message.subject, text: message.text });
  });

  test('refuses disabled delivery, changed test recipient, and rotated business credentials', async () => {
    const fetchMock = jest.fn(); global.fetch = fetchMock;
    process.env.APPOINTMENT_EMAIL_DELIVERY_ENABLED = 'false';
    await expect(resendAppointmentProvider.send(message)).rejects.toMatchObject({ code: 'EMAIL_DELIVERY_DISABLED' });
    process.env.APPOINTMENT_EMAIL_DELIVERY_ENABLED = 'true';
    process.env.APPOINTMENT_EMAIL_TEST_RECIPIENT = 'other@example.test';
    await expect(resendAppointmentProvider.send(message)).rejects.toMatchObject({ code: 'EMAIL_MODE_CHANGED' });
    process.env.APPOINTMENT_EMAIL_TEST_RECIPIENT = 'sandbox@example.test';
    credentialMock.mockResolvedValue({ apiKey: 're_test_rotated_123456', from: message.from });
    await expect(resendAppointmentProvider.send(message)).rejects.toMatchObject({ code: 'EMAIL_CONNECTION_CHANGED' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('classifies throttling, permanent rejection, and uncertain network outcomes', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(new Response('', { status: 400 }))
      .mockRejectedValueOnce(new Error('network closed'));
    await expect(resendAppointmentProvider.send(message)).rejects.toMatchObject({ code: 'EMAIL_PROVIDER_HTTP_429', retryable: true });
    await expect(resendAppointmentProvider.send(message)).rejects.toMatchObject({ code: 'EMAIL_PROVIDER_HTTP_400', retryable: false });
    await expect(resendAppointmentProvider.send(message)).rejects.toMatchObject({ code: 'EMAIL_PROVIDER_OUTCOME_UNKNOWN', retryable: true, ambiguous: true } satisfies Partial<AppointmentEmailError>);
  });
});
