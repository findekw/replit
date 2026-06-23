import { getApiBase } from "./apiBase";
const BASE = getApiBase();

export function trackInteraction(
  officeId: number,
  propertyId: number | null | undefined,
  interactionType: "whatsapp" | "call",
  source: "property_page" | "office_page"
): void {
  fetch(`${BASE}/api/leads/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ officeId, propertyId: propertyId ?? null, interactionType, source }),
  }).catch(() => {});
}
