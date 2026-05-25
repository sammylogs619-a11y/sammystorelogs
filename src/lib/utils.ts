import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const nairaFmt = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Format a number as Nigerian Naira, e.g. ₦12,500 */
export function formatNaira(value: number | string | null | undefined): string {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  if (!isFinite(n)) return "₦0";
  return nairaFmt.format(n);
}
