import nodemailer from "nodemailer";
import { logger } from "./logger";

type SendOfficeOtpInput = {
  to: string;
  name: string;
  otp: string;
};

type SendOfficePasswordResetInput = {
  to: string;
  name: string;
  resetUrl: string;
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

/** Shared card shell so every Finde email looks the same. */
function shell(bodyHtml: string): string {
  return `
    <div dir="rtl" style="margin:0;padding:0;background:#F6F8FC;font-family:Arial,Tahoma,sans-serif;color:#111827">
      <div style="width:100%;max-width:520px;margin:0 auto;padding:22px 14px;box-sizing:border-box">
        <div style="background:#FFFFFF;border:1px solid #E6EAF1;border-radius:16px;padding:22px 18px;text-align:right;box-shadow:0 10px 28px rgba(15,23,42,0.08)">
          ${bodyHtml}
          <div style="font-size:12px;line-height:1.8;color:#94A3B8;margin-top:8px;border-top:1px solid #EEF2F7;padding-top:10px">هذه رسالة آلية من نظام Finde، وهذا البريد لا يستقبل الردود — من فضلك لا ترد عليها.</div>
        </div>
      </div>
    </div>
  `;
}

async function send(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  label: string;
}): Promise<boolean> {
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

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || user,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      // Automated, unmonitored mailbox — signal to mail clients / auto-responders.
      headers: {
        "Auto-Submitted": "auto-generated",
        "X-Auto-Response-Suppress": "All",
      },
    });
    return true;
  } catch (err) {
    logger.error({ err, to: input.to }, `Failed to send ${input.label}`);
    return false;
  }
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

  const safeName = escapeHtml(input.name);
  return send({
    to: input.to,
    label: "office verification OTP",
    subject: "رمز تفعيل حسابك في Finde",
    text: `مرحباً ${input.name}\n\nرمز تفعيل حسابك هو: ${input.otp}\n\nالرمز صالح لمدة 10 دقائق.\n\nهذه رسالة آلية من نظام Finde، وهذا البريد لا يستقبل الردود — من فضلك لا ترد عليها.`,
    html: shell(`
      <div style="font-size:20px;font-weight:800;margin:0 0 10px;color:#111827">تفعيل حسابك في Finde</div>
      <div style="font-size:15px;line-height:1.8;margin:0 0 14px;color:#334155">مرحباً ${safeName}</div>
      <div style="font-size:15px;line-height:1.8;margin:0 0 14px;color:#334155">استخدم الرمز التالي لتفعيل بريدك الإلكتروني:</div>
      <div dir="ltr" style="display:block;width:100%;box-sizing:border-box;background:#EEF2FF;border:1px solid #C7D2FE;border-radius:14px;padding:16px 8px;text-align:center;font-size:30px;font-weight:800;letter-spacing:7px;color:#4B66E0;margin:16px 0">${input.otp}</div>
      <div style="font-size:13px;line-height:1.8;color:#64748B">الرمز صالح لمدة 10 دقائق. إذا لم تطلب إنشاء حساب، يمكنك تجاهل هذه الرسالة.</div>
    `),
  });
}

export async function sendOfficePasswordReset(input: SendOfficePasswordResetInput): Promise<boolean> {
  if (!smtpConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      logger.warn({ to: input.to, resetUrl: input.resetUrl }, "SMTP not configured; password reset link logged for development");
      return true;
    }
    logger.error("SMTP is not configured; cannot send password reset link");
    return false;
  }

  const safeName = escapeHtml(input.name);
  const safeUrl = escapeHtml(input.resetUrl);
  return send({
    to: input.to,
    label: "office password reset",
    subject: "إعادة تعيين كلمة المرور في Finde",
    text: `مرحباً ${input.name}\n\nلإعادة تعيين كلمة المرور الخاصة بحسابك في Finde، افتح الرابط التالي:\n${input.resetUrl}\n\nالرابط صالح لمدة 60 دقيقة ويُستخدم مرة واحدة.\nإذا لم تطلب إعادة التعيين، تجاهل هذه الرسالة وكلمة مرورك ستبقى كما هي.\n\nهذه رسالة آلية من نظام Finde، وهذا البريد لا يستقبل الردود — من فضلك لا ترد عليها.`,
    html: shell(`
      <div style="font-size:20px;font-weight:800;margin:0 0 10px;color:#111827">إعادة تعيين كلمة المرور</div>
      <div style="font-size:15px;line-height:1.8;margin:0 0 14px;color:#334155">مرحباً ${safeName}</div>
      <div style="font-size:15px;line-height:1.8;margin:0 0 18px;color:#334155">وصلنا طلب لإعادة تعيين كلمة المرور الخاصة بحسابك في Finde. اضغط الزر التالي لاختيار كلمة مرور جديدة:</div>
      <div style="text-align:center;margin:0 0 18px">
        <a href="${safeUrl}" style="display:inline-block;background:#667EEA;color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:800;padding:14px 34px;border-radius:12px">تعيين كلمة مرور جديدة</a>
      </div>
      <div dir="ltr" style="font-size:12px;line-height:1.7;color:#94A3B8;word-break:break-all;background:#F8FAFC;border:1px solid #EEF2F7;border-radius:10px;padding:10px;margin:0 0 14px">${safeUrl}</div>
      <div style="font-size:13px;line-height:1.8;color:#64748B">الرابط صالح لمدة 60 دقيقة ويُستخدم مرة واحدة. إذا لم تطلب إعادة التعيين، تجاهل هذه الرسالة وكلمة مرورك ستبقى كما هي.</div>
    `),
  });
}
