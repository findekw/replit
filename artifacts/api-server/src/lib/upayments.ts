import { logger } from "./logger";

// ── UPayments payment-gateway client ─────────────────────────────────────────
// Secrets come ONLY from the environment — never hard-code the API token.
//   UPAYMENTS_API_TOKEN  – Bearer token (merchant API key)
//   UPAYMENTS_BASE_URL   – API base (prod: https://apiv2api.upayments.com/api/v1,
//                                    sandbox: https://sandboxapi.upayments.com/api/v1)
const BASE_URL = (process.env["UPAYMENTS_BASE_URL"] ?? "https://apiv2api.upayments.com/api/v1").replace(/\/+$/, "");
const API_TOKEN = process.env["UPAYMENTS_API_TOKEN"] ?? "";

export function upaymentsConfigured(): boolean {
  return API_TOKEN.length > 0;
}

// Format an amount held in fils (KWD * 1000) as a UPayments KWD string, e.g. 14500 -> "14.500".
export function filsToKwdString(fils: number): string {
  return (fils / 1000).toFixed(3);
}

export interface CreateChargeInput {
  orderRef: string;
  amountFils: number;
  productName: string;
  officeId: number;
  customerName: string;
  customerEmail?: string;
  customerMobile?: string;
  returnUrl: string;
  cancelUrl: string;
  notificationUrl: string;
}

export interface CreateChargeResult {
  ok: boolean;
  link?: string;
  sessionId?: string;
  error?: string;
}

// POST /charge — returns a hosted payment link. The link carries a session_id we
// later use to verify the real payment status server-side.
export async function createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
  if (!upaymentsConfigured()) return { ok: false, error: "بوابة الدفع غير مهيأة" };

  const amount = filsToKwdString(input.amountFils);
  const body = {
    products: [{ name: input.productName, description: input.productName, price: Number(amount), quantity: 1 }],
    order: { id: input.orderRef, reference: input.orderRef, description: input.productName, currency: "KWD", amount: Number(amount) },
    language: "ar",
    reference: { id: input.orderRef },
    customer: {
      uniqueId: String(input.officeId),
      name: input.customerName,
      email: input.customerEmail || "office@finde.co",
      mobile: input.customerMobile || "",
    },
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
    notificationUrl: input.notificationUrl,
  };

  try {
    const r = await fetch(`${BASE_URL}/charge`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    const data: any = await r.json().catch(() => ({}));
    if (!r.ok || data?.status !== true || !data?.data?.link) {
      logger.error({ status: r.status, resp: data }, "UPayments createCharge failed");
      return { ok: false, error: data?.message || "تعذّر إنشاء عملية الدفع" };
    }
    const link: string = data.data.link;
    const sessionId = extractSessionId(link);
    return { ok: true, link, sessionId };
  } catch (err) {
    logger.error({ err }, "UPayments createCharge threw");
    return { ok: false, error: "تعذّر الاتصال ببوابة الدفع" };
  }
}

export interface PaymentStatus {
  ok: boolean;
  captured: boolean;
  orderRef?: string | null;
  totalPrice?: string | null;
  currency?: string | null;
  result?: string | null;
  raw?: any;
}

// GET /get-payment-status?session_id=… — the authoritative check. NEVER trust the
// webhook body for success; always re-verify here with our secret token.
export async function getPaymentStatusBySession(sessionId: string): Promise<PaymentStatus> {
  if (!upaymentsConfigured()) return { ok: false, captured: false };
  try {
    const r = await fetch(`${BASE_URL}/get-payment-status?session_id=${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}`, Accept: "application/json" },
    });
    const data: any = await r.json().catch(() => ({}));
    const tx = data?.data?.transaction;
    if (!r.ok || data?.status !== true || !tx) {
      return { ok: false, captured: false, raw: data };
    }
    const result = String(tx.result ?? "").toUpperCase();
    return {
      ok: true,
      captured: result === "CAPTURED",
      orderRef: tx.merchant_requested_order_id ?? tx.reference ?? tx.order_id ?? null,
      totalPrice: tx.total_price ?? null,
      currency: tx.currency_type ?? null,
      result: tx.result ?? null,
      raw: tx,
    };
  } catch (err) {
    logger.error({ err }, "UPayments getPaymentStatus threw");
    return { ok: false, captured: false };
  }
}

function extractSessionId(link: string): string | undefined {
  const m = /[?&]session_id=([^&]+)/.exec(link);
  return m ? decodeURIComponent(m[1]) : undefined;
}
