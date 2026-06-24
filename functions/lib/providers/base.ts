export interface NumberOrder {
  providerOrderId: string;
  phoneNumber: string;
}

export interface SmsMessage {
  text: string;
  otpCode: string | null;
  receivedAt: string;
}

export interface ProviderPrice {
  countryCode: string;
  serviceSlug: string;
  priceUsd: number;
  stock: number;
}

export interface IProvider {
  slug: string;
  name: string;
  getPrices(countryCode: string, serviceSlug: string): Promise<ProviderPrice[]>;
  buyNumber(countryCode: string, serviceSlug: string): Promise<NumberOrder>;
  checkSms(providerOrderId: string): Promise<SmsMessage | null>;
  cancelOrder(providerOrderId: string): Promise<void>;
  getBalance(): Promise<number>;
}

export function extractOtp(text: string): string | null {
  const patterns = [
    /\b(\d{6})\b/,
    /(?:code|otp|pin|verification)[:\s]+(\d{4,8})/i,
    /(\d{4,8})\s+is your/i,
    /your.*?(\d{4,8})/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return m[1];
  }
  return null;
}
