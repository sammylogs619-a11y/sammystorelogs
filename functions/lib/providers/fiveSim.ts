import { IProvider, NumberOrder, ProviderPrice, SmsMessage, extractOtp } from './base';

const COUNTRY_MAP: Record<string, string> = {
  us: 'usa', gb: 'england', ca: 'canada', au: 'australia', de: 'germany',
  fr: 'france', it: 'italy', es: 'spain', nl: 'netherlands', se: 'sweden',
  no: 'norway', ch: 'switzerland', be: 'belgium', pl: 'poland', cz: 'czech',
  tr: 'turkey', in: 'india', pk: 'pakistan', bd: 'bangladesh', id: 'indonesia',
  my: 'malaysia', sg: 'singapore', jp: 'japan', kr: 'southkorea', th: 'thailand',
  vn: 'vietnam', br: 'brazil', mx: 'mexico', za: 'southafrica', ua: 'ukraine',
  ru: 'russia', ph: 'philippines',
};

const SERVICE_MAP: Record<string, string> = {
  whatsapp: 'whatsapp', telegram: 'telegram', instagram: 'instagram',
  facebook: 'facebook', tiktok: 'tiktok', google: 'google', gmail: 'google',
  discord: 'discord', amazon: 'amazon', netflix: 'netflix', paypal: 'paypal',
  binance: 'binance', twitter: 'twitter', linkedin: 'linkedin',
  snapchat: 'snapchat', steam: 'steam', uber: 'uber', microsoft: 'microsoft',
  apple: 'apple', coinbase: 'coinbase', spotify: 'spotify',
};

export class FiveSimProvider implements IProvider {
  slug = 'five_sim';
  name = '5SIM';
  private apiKey: string;
  private baseUrl = 'https://5sim.net/v1';

  constructor(apiKey: string) { this.apiKey = apiKey; }

  private async fetch<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`5SIM API error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async getPrices(countryCode: string, serviceSlug: string): Promise<ProviderPrice[]> {
    const country = COUNTRY_MAP[countryCode];
    const service = SERVICE_MAP[serviceSlug];
    if (!country || !service) return [];
    try {
      const data = await this.fetch<Record<string, { Qty: number; Price: number }>>(`/guest/products/${country}/${service}`);
      return Object.values(data).map(item => ({ countryCode, serviceSlug, priceUsd: item.Price, stock: item.Qty }));
    } catch { return []; }
  }

  async buyNumber(countryCode: string, serviceSlug: string): Promise<NumberOrder> {
    const country = COUNTRY_MAP[countryCode];
    const service = SERVICE_MAP[serviceSlug];
    if (!country || !service) throw new Error('Unsupported country or service');
    const data = await this.fetch<{ id: number; phone: string }>(`/user/buy/activation/${country}/any/${service}`);
    return { providerOrderId: String(data.id), phoneNumber: data.phone };
  }

  async checkSms(providerOrderId: string): Promise<SmsMessage | null> {
    const data = await this.fetch<{ sms: Array<{ text: string; date: string }> | null }>(`/user/check/${providerOrderId}`);
    if (data.sms && data.sms.length > 0) {
      const sms = data.sms[data.sms.length - 1];
      return { text: sms.text, otpCode: extractOtp(sms.text), receivedAt: sms.date };
    }
    return null;
  }

  async cancelOrder(providerOrderId: string): Promise<void> {
    await this.fetch(`/user/cancel/${providerOrderId}`);
  }

  async getBalance(): Promise<number> {
    const data = await this.fetch<{ balance: number }>('/user/profile');
    return data.balance;
  }
}
