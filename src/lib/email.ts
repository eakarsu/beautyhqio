// Email Service using Nodemailer (SMTP)
import nodemailer from "nodemailer";

// Create transporter using SMTP settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const emailFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@beautywellness.com";

// Multi-language email templates for appointment reminders
export const emailReminderTemplates = {
  en: {
    subject: (serviceName: string) => `Reminder: Your ${serviceName} Appointment Tomorrow`,
    body: (clientName: string, date: string, time: string, serviceName: string, businessName: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Appointment Reminder</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <p style="font-size: 16px; color: #333;">Hi ${clientName},</p>
          <p style="font-size: 16px; color: #333;">This is a friendly reminder about your upcoming appointment:</p>
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Service:</strong> ${serviceName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
          </div>
          <p style="font-size: 14px; color: #666;">If you need to reschedule or cancel, please contact us as soon as possible.</p>
          <p style="font-size: 14px; color: #666;">We look forward to seeing you!</p>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center;">
          <p style="font-size: 12px; color: #666; margin: 0;">${businessName}</p>
        </div>
      </div>
    `,
  },
  es: {
    subject: (serviceName: string) => `Recordatorio: Su cita de ${serviceName} mañana`,
    body: (clientName: string, date: string, time: string, serviceName: string, businessName: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Recordatorio de Cita</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <p style="font-size: 16px; color: #333;">Hola ${clientName},</p>
          <p style="font-size: 16px; color: #333;">Este es un recordatorio amable sobre su próxima cita:</p>
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Servicio:</strong> ${serviceName}</p>
            <p style="margin: 5px 0;"><strong>Fecha:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>Hora:</strong> ${time}</p>
          </div>
          <p style="font-size: 14px; color: #666;">Si necesita reprogramar o cancelar, contáctenos lo antes posible.</p>
          <p style="font-size: 14px; color: #666;">¡Esperamos verle pronto!</p>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center;">
          <p style="font-size: 12px; color: #666; margin: 0;">${businessName}</p>
        </div>
      </div>
    `,
  },
  vi: {
    subject: (serviceName: string) => `Nhắc nhở: Lịch hẹn ${serviceName} của bạn vào ngày mai`,
    body: (clientName: string, date: string, time: string, serviceName: string, businessName: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nhắc Nhở Lịch Hẹn</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <p style="font-size: 16px; color: #333;">Xin chào ${clientName},</p>
          <p style="font-size: 16px; color: #333;">Đây là lời nhắc về lịch hẹn sắp tới của bạn:</p>
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Dịch vụ:</strong> ${serviceName}</p>
            <p style="margin: 5px 0;"><strong>Ngày:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>Giờ:</strong> ${time}</p>
          </div>
          <p style="font-size: 14px; color: #666;">Nếu bạn cần đổi lịch hoặc hủy, vui lòng liên hệ với chúng tôi sớm nhất có thể.</p>
          <p style="font-size: 14px; color: #666;">Chúng tôi mong được gặp bạn!</p>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center;">
          <p style="font-size: 12px; color: #666; margin: 0;">${businessName}</p>
        </div>
      </div>
    `,
  },
  ko: {
    subject: (serviceName: string) => `알림: 내일 ${serviceName} 예약이 있습니다`,
    body: (clientName: string, date: string, time: string, serviceName: string, businessName: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">예약 알림</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <p style="font-size: 16px; color: #333;">${clientName}님 안녕하세요,</p>
          <p style="font-size: 16px; color: #333;">다가오는 예약에 대한 알림입니다:</p>
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>서비스:</strong> ${serviceName}</p>
            <p style="margin: 5px 0;"><strong>날짜:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>시간:</strong> ${time}</p>
          </div>
          <p style="font-size: 14px; color: #666;">일정 변경이나 취소가 필요하시면 가능한 빨리 연락해 주세요.</p>
          <p style="font-size: 14px; color: #666;">뵙기를 기대합니다!</p>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center;">
          <p style="font-size: 12px; color: #666; margin: 0;">${businessName}</p>
        </div>
      </div>
    `,
  },
  zh: {
    subject: (serviceName: string) => `提醒：您明天有${serviceName}预约`,
    body: (clientName: string, date: string, time: string, serviceName: string, businessName: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">预约提醒</h1>
        </div>
        <div style="padding: 30px; background: #fff;">
          <p style="font-size: 16px; color: #333;">${clientName}您好，</p>
          <p style="font-size: 16px; color: #333;">这是关于您即将到来的预约的提醒：</p>
          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>服务：</strong> ${serviceName}</p>
            <p style="margin: 5px 0;"><strong>日期：</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>时间：</strong> ${time}</p>
          </div>
          <p style="font-size: 14px; color: #666;">如需改期或取消，请尽快与我们联系。</p>
          <p style="font-size: 14px; color: #666;">期待您的光临！</p>
        </div>
        <div style="background: #f3f4f6; padding: 20px; text-align: center;">
          <p style="font-size: 12px; color: #666; margin: 0;">${businessName}</p>
        </div>
      </div>
    `,
  },
};

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Send generic email
export async function sendEmail(params: SendEmailParams) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn("SMTP not configured, skipping email");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const result = await transporter.sendMail({
      from: emailFrom,
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.text && { text: params.text }),
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

// Send appointment reminder email
export async function sendAppointmentReminderEmail(
  email: string,
  clientName: string,
  date: string,
  time: string,
  serviceName: string,
  businessName: string = "Beauty & Wellness",
  language: string = "en"
) {
  const template =
    emailReminderTemplates[language as keyof typeof emailReminderTemplates] ||
    emailReminderTemplates.en;

  const subject = template.subject(serviceName);
  const html = template.body(clientName, date, time, serviceName, businessName);

  return sendEmail({
    to: email,
    subject,
    html,
  });
}

// Check if email service is configured
export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}
