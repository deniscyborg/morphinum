import type { Kopecks } from "./money";
import { rub } from "./money";

export const deliveryMethods = ["pickup", "courier"] as const;
export type DeliveryMethod = (typeof deliveryMethods)[number];

export const deliveryLabels: Record<DeliveryMethod, string> = {
  pickup: "Самовывоз",
  courier: "Курьер по городу",
};

export function isDeliveryMethod(value: unknown): value is DeliveryMethod {
  return typeof value === "string" && (deliveryMethods as readonly string[]).includes(value);
}

type DeliveryConfig = { courierPriceRub: number; freeCourierFromRub: number };

export function deliveryCost(method: DeliveryMethod, subtotal: Kopecks, config: DeliveryConfig): Kopecks {
  if (method === "pickup") return 0;
  return subtotal >= rub(config.freeCourierFromRub) ? 0 : rub(config.courierPriceRub);
}
