// Twilio SMS and Voice Integration
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SendSMSParams {
  to: string;
  message: string;
  mediaUrl?: string;
}

export interface MakeCallParams {
  to: string;
  twimlUrl?: string;
  twiml?: string;
}

// Format phone number to E.164 format
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");

  // If already has country code
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`;
  }

  // Assume US number
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  return `+${cleaned}`;
}

// Send SMS
export async function sendSMS(params: SendSMSParams) {
  if (!client) {
    console.warn("Twilio not configured, skipping SMS");
    return { success: false, error: "Twilio not configured" };
  }

  try {
    const message = await client.messages.create({
      body: params.message,
      to: formatPhoneNumber(params.to),
      from: twilioPhoneNumber,
      ...(params.mediaUrl && { mediaUrl: [params.mediaUrl] }),
    });

    return {
      success: true,
      messageId: message.sid,
      status: message.status,
    };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    };
  }
}

// Send bulk SMS
export async function sendBulkSMS(
  recipients: { phone: string; message: string }[]
) {
  const results = await Promise.all(
    recipients.map((r) => sendSMS({ to: r.phone, message: r.message }))
  );

  return {
    total: recipients.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

// Make outbound call
export async function makeCall(params: MakeCallParams) {
  if (!client) {
    console.warn("Twilio not configured, skipping call");
    return { success: false, error: "Twilio not configured" };
  }

  try {
    const callOptions: {
      to: string;
      from: string;
      url?: string;
      twiml?: string;
    } = {
      to: formatPhoneNumber(params.to),
      from: twilioPhoneNumber!,
    };

    if (params.twimlUrl) {
      callOptions.url = params.twimlUrl;
    } else if (params.twiml) {
      callOptions.twiml = params.twiml;
    }

    const call = await client.calls.create(callOptions);

    return {
      success: true,
      callId: call.sid,
      status: call.status,
    };
  } catch (error) {
    console.error("Error making call:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to make call",
    };
  }
}

// Generate TwiML for voice responses
export function generateTwiML(options: {
  say?: { text: string; voice?: string; language?: string };
  gather?: {
    action: string;
    method?: string;
    numDigits?: number;
    timeout?: number;
    speechTimeout?: string;
    input?: string[];
  };
  play?: string;
  redirect?: string;
  hangup?: boolean;
}): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  if (options.say) {
    response.say(
      {
        voice: (options.say.voice || "Polly.Joanna") as "Polly.Joanna",
        language: (options.say.language || "en-US") as "en-US",
      },
      options.say.text
    );
  }

  if (options.gather) {
    const gather = response.gather({
      action: options.gather.action,
      method: options.gather.method || "POST",
      numDigits: options.gather.numDigits,
      timeout: options.gather.timeout || 5,
      speechTimeout: options.gather.speechTimeout || "auto",
      input: (options.gather.input || ["dtmf", "speech"]) as ("dtmf" | "speech")[],
    });

    if (options.say) {
      gather.say(
        {
          voice: (options.say.voice || "Polly.Joanna") as "Polly.Joanna",
          language: (options.say.language || "en-US") as "en-US",
        },
        options.say.text
      );
    }
  }

  if (options.play) {
    response.play(options.play);
  }

  if (options.redirect) {
    response.redirect(options.redirect);
  }

  if (options.hangup) {
    response.hangup();
  }

  return response.toString();
}

// Appointment reminder templates
export const reminderTemplates = {
  en: (clientName: string, date: string, time: string, serviceName: string) =>
    `Hi ${clientName}! This is a reminder for your ${serviceName} appointment on ${date} at ${time}. Reply YES to confirm or call us to reschedule.`,

  es: (clientName: string, date: string, time: string, serviceName: string) =>
    `Hola ${clientName}! Recordatorio de su cita de ${serviceName} el ${date} a las ${time}. Responda SI para confirmar o llámenos para reprogramar.`,

  vi: (clientName: string, date: string, time: string, serviceName: string) =>
    `Xin chào ${clientName}! Nhắc nhở lịch hẹn ${serviceName} của bạn vào ${date} lúc ${time}. Trả lời CÓ để xác nhận hoặc gọi để đổi lịch.`,

  ko: (clientName: string, date: string, time: string, serviceName: string) =>
    `안녕하세요 ${clientName}님! ${date} ${time}에 예약된 ${serviceName} 예약 알림입니다. 확인하려면 예라고 답장하시거나 전화로 일정을 변경하세요.`,

  zh: (clientName: string, date: string, time: string, serviceName: string) =>
    `您好 ${clientName}！这是您${date} ${time} ${serviceName}预约的提醒。回复"是"确认或致电改期。`,
};

// Send appointment reminder
export async function sendAppointmentReminder(
  phone: string,
  clientName: string,
  date: string,
  time: string,
  serviceName: string,
  language: string = "en"
) {
  const template =
    reminderTemplates[language as keyof typeof reminderTemplates] ||
    reminderTemplates.en;
  const message = template(clientName, date, time, serviceName);

  return sendSMS({ to: phone, message });
}

// Voice greeting in different languages
export const voiceGreetings = {
  en: "Thank you for calling. How can I help you today? Press 1 to book an appointment, press 2 to check your appointment, or press 3 to speak with someone.",
  es: "Gracias por llamar. ¿Cómo puedo ayudarle hoy? Presione 1 para reservar una cita, presione 2 para verificar su cita, o presione 3 para hablar con alguien.",
  vi: "Cảm ơn bạn đã gọi. Tôi có thể giúp gì cho bạn hôm nay? Nhấn 1 để đặt lịch hẹn, nhấn 2 để kiểm tra lịch hẹn, hoặc nhấn 3 để nói chuyện với ai đó.",
  ko: "전화해 주셔서 감사합니다. 오늘 무엇을 도와드릴까요? 예약하려면 1번, 예약 확인은 2번, 상담원 연결은 3번을 누르세요.",
  zh: "感谢您的来电。今天我能为您做什么？预约请按1，查询预约请按2，人工服务请按3。",
};

// Voice reminder templates for appointment reminder calls
export const voiceReminderTemplates = {
  en: (clientName: string, date: string, time: string, serviceName: string) =>
    `Hello ${clientName}. This is an automated reminder for your ${serviceName} appointment on ${date} at ${time}. Press 1 to confirm your appointment, or press 2 if you need to reschedule. Thank you.`,
  es: (clientName: string, date: string, time: string, serviceName: string) =>
    `Hola ${clientName}. Este es un recordatorio automático para su cita de ${serviceName} el ${date} a las ${time}. Presione 1 para confirmar su cita, o presione 2 si necesita reprogramar. Gracias.`,
  vi: (clientName: string, date: string, time: string, serviceName: string) =>
    `Xin chào ${clientName}. Đây là lời nhắc tự động cho lịch hẹn ${serviceName} của bạn vào ${date} lúc ${time}. Nhấn 1 để xác nhận, hoặc nhấn 2 nếu bạn cần đổi lịch. Cảm ơn bạn.`,
  ko: (clientName: string, date: string, time: string, serviceName: string) =>
    `안녕하세요 ${clientName}님. ${date} ${time}에 예약된 ${serviceName} 예약 알림입니다. 예약 확인은 1번, 일정 변경은 2번을 눌러주세요. 감사합니다.`,
  zh: (clientName: string, date: string, time: string, serviceName: string) =>
    `您好${clientName}。这是您${date} ${time} ${serviceName}预约的自动提醒。按1确认预约，按2改期。谢谢。`,
};

// Language to voice mapping for Twilio Polly voices
const languageVoices: Record<string, { voice: string; language: string }> = {
  en: { voice: "Polly.Joanna", language: "en-US" },
  es: { voice: "Polly.Lupe", language: "es-US" },
  vi: { voice: "Polly.Joanna", language: "en-US" }, // Vietnamese not supported, fallback to English voice
  ko: { voice: "Polly.Seoyeon", language: "ko-KR" },
  zh: { voice: "Polly.Zhiyu", language: "cmn-CN" },
};

// Send appointment reminder via voice call
export async function sendAppointmentReminderCall(
  phone: string,
  clientName: string,
  date: string,
  time: string,
  serviceName: string,
  language: string = "en"
) {
  const template =
    voiceReminderTemplates[language as keyof typeof voiceReminderTemplates] ||
    voiceReminderTemplates.en;
  const message = template(clientName, date, time, serviceName);

  const voiceConfig = languageVoices[language] || languageVoices.en;

  // Generate TwiML for the reminder call
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  response.say(
    {
      voice: voiceConfig.voice as "Polly.Joanna",
      language: voiceConfig.language as "en-US",
    },
    message
  );

  // Add pause and repeat
  response.pause({ length: 1 });
  response.say(
    {
      voice: voiceConfig.voice as "Polly.Joanna",
      language: voiceConfig.language as "en-US",
    },
    message
  );

  response.hangup();

  const twiml = response.toString();

  return makeCall({ to: phone, twiml });
}

export { client as twilioClient };
