import nodemailer from "nodemailer";
import { logger } from "./logger";

type SendOfficeOtpInput = {
  to: string;
  name: string;
  otp: string;
};

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && (process.env.SMTP_FROM || process.env.SMTP_USER));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendOfficeVerificationOtp(input: SendOfficeOtpInput): Promise<boolean> {
  if (!smtpConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      logger.warn({ to: input.to, otp: input.otp }, "SMTP not configured; office verification OTP logged for development");
      return true;
    }
    logger.error("SMTP is not configured; cannot send office verification OTP");
    return false;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: user || pass ? { user, pass } : undefined,
  });

  const from = process.env.SMTP_FROM || user;
  const subject = "رمز تفعيل حسابك في Finde";
  const safeName = escapeHtml(input.name);
  const text = `مرحباً ${input.name}\n\nرمز تفعيل حسابك هو: ${input.otp}\n\nالرمز صالح لمدة 10 دقائق.`;
  const html = `
    <div dir="rtl" style="margin:0;padding:0;background:#F6F8FC;font-family:Arial,Tahoma,sans-serif;color:#111827">
      <div style="width:100%;max-width:520px;margin:0 auto;padding:22px 14px;box-sizing:border-box">
        <div style="background:#FFFFFF;border:1px solid #E6EAF1;border-radius:16px;padding:22px 18px;text-align:right;box-shadow:0 10px 28px rgba(15,23,42,0.08)">
          <div style="font-size:20px;font-weight:800;margin:0 0 10px;color:#111827">تفعيل حسابك في Finde</div>
          <div style="font-size:15px;line-height:1.8;margin:0 0 14px;color:#334155">مرحباً ${safeName}</div>
          <div style="font-size:15px;line-height:1.8;margin:0 0 14px;color:#334155">استخدم الرمز التالي لتفعيل بريدك الإلكتروني:</div>
          <div dir="ltr" style="display:block;width:100%;box-sizing:border-box;background:#EEF2FF;border:1px solid #C7D2FE;border-radius:14px;padding:16px 8px;text-align:center;font-size:30px;font-weight:800;letter-spacing:7px;color:#4B66E0;margin:16px 0">${input.otp}</div>
          <div style="font-size:13px;line-height:1.8;color:#64748B">الرمز صالح لمدة 10 دقائق. إذا لم تطلب إنشاء حساب، يمكنك تجاهل هذه الرسالة.</div>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({ from, to: input.to, subject, text, html });
    return true;
  } catch (err) {
    logger.error({ err, to: input.to }, "Failed to send office verification OTP");
    return false;
  }
}
