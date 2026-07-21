/**
 * Explicit provider certification test. It is skipped unless the operator
 * supplies a dedicated sandbox account and recipient and opts in.
 */
import twilio from "twilio";

const enabled = process.env.RUN_TWILIO_INTEGRATION === "true";
const describeProvider = enabled ? describe : describe.skip;

describeProvider("Twilio sandbox certification", () => {
  it("sends to the operator-designated sandbox recipient", async () => {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_TEST_RECIPIENT } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER || !TWILIO_TEST_RECIPIENT) {
      throw new Error("Twilio sandbox credentials and TWILIO_TEST_RECIPIENT are required");
    }
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const message = await client.messages.create({
      body: `BeautyHQ provider certification ${new Date().toISOString()}`,
      to: TWILIO_TEST_RECIPIENT,
      from: TWILIO_PHONE_NUMBER,
    });
    expect(message.sid).toMatch(/^SM/);
    expect(message.status).toBeDefined();
  });
});
