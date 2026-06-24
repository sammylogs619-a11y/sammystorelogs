import { IProvider, NumberOrder, ProviderPrice, SmsMessage, extractOtp } from './base';

const COUNTRY_MAP: Record<string, string> = {
  us: '12', gb: '16', ca: '1', au: '9', de: '2', fr: '78', it: '5', es: '4',
  nl: '10', se: '26', no: '30', ch: '73', be: '11', pl: '15', cz: '86',
  tr: '52', in: '22', pk: '44', bd: '36', id: '6', my: '7', sg: '14',
  jp: '13', kr: '51', th: '52', vn: '99', br: '73', mx: '41', za: '84',
  ua: '1', ru: '0', ph: '73', ng: '95',
};

const SERVICE_MAP: Record<string, string> = {
  whatsapp: 'wa', telegram: 'tg', instagram: 'ig', facebook: 'fb', tiktok: 'tk',
  google: 'go', gmail: 'gm', discord: 'ds', amazon: 'am', netflix: 'nf',
  paypal: 'pp', binance: 'bn', twitter: 'tw', linkedin: 'li', snapchat: 'sc',
  steam: 'st', uber: 'ub', microsoft: 'ms', apple: 'ap', yahoo: 'ya',
  line: 'ln', wechat: 'wc', coinbase: 'cb', spotify: 'sp',
};

export class SmsActivateProvider implements IProvider {
  slug = 'sms_activate';
  name = 'SMS-Activate';
  private apiKey: string;
  private baseUrl = 'https://api.sms-activate.org/stubs/handler_api.php';

  constructor(apiKey: string) { this.apiKey = apiKey; }

  private async call(params: Record<string, string>) {
    const url = new URL(this.baseUrl);
    url.searchParams.set('api_key', this.apiKey);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString());
    return res.text();
  }

  async getPrices(countryCode: string, serviceSlug: string): Promise<ProviderPrice[]> {
    const country = COUNTRY_MAP[countryCode];
    const service = SERVICE_MAP[serviceSlug];
    if (!country || !service) return [];
    try {
      const res = await fetch(`${this.baseUrl}?api_key=${this.apiKey}&action=getPrices&service=${service}&country=${country}`);
      const data = await res.json() as Record<string, Record<string, { cost: number; count: number }>>;
      const results: ProviderPrice[] = [];
      for (const [, services] of Object.entries(data)) {
        for (const [svc, info] of Object.entries(services)) {
          if (svc === service) results.push({ countryCode, serviceSlug, priceUsd: info.cost, stock: info.count });
        }
      }
      return results;
    } catch { return []; }
  }

  async buyNumber(countryCode: string, serviceSlug: string): Promise<NumberOrder> {
    const country = COUNTRY_MAP[countryCode];
    const service = SERVICE_MAP[serviceSlug];
    if (!country || !service) throw new Error('Unsupported country or service');
    const res = await this.call({ action: 'getNumber', service, country });
    const parts = res.split(':');
    if (parts[0] !== 'ACCESS_NUMBER') throw new Error(`SMS-Activate error: ${res}`);
    return { providerOrderId: parts[1], phoneNumber: parts[2] };
  }

  async checkSms(providerOrderId: string): Promise<SmsMessage | null> {
    const res = await this.call({ action: 'getStatus', id: providerOrderId });
    if (res.startsWith('STATUS_OK')) {
      const text = res.replace('STATUS_OK:', '');
      return { text, otpCode: extractOtp(text), receivedAt: new Date().toISOString() };
    }
    if (res === 'STATUS_CANCEL') throw new Error('Number cancelled by provider');
    return null;
  }

  async cancelOrder(providerOrderId: string): Promise<void> {
    await this.call({ action: 'setStatus', id: providerOrderId, status: '8' });
  }

  async getBalance(): Promise<number> {
    const res = await this.call({ action: 'getBalance' });
    return parseFloat(res.split(':')[1] ?? '0');
  }
}
