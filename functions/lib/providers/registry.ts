import { IProvider, ProviderPrice } from './base';
import { SmsActivateProvider } from './smsActivate';
import { FiveSimProvider } from './fiveSim';

export interface Env {
  SMS_ACTIVATE_API_KEY?: string;
  FIVE_SIM_API_KEY?: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  EXCHANGE_RATE_USD_NGN?: string;
}

export function buildProviders(env: Env): IProvider[] {
  const providers: IProvider[] = [];
  if (env.SMS_ACTIVATE_API_KEY) providers.push(new SmsActivateProvider(env.SMS_ACTIVATE_API_KEY));
  if (env.FIVE_SIM_API_KEY) providers.push(new FiveSimProvider(env.FIVE_SIM_API_KEY));
  return providers;
}

export interface BestProvider {
  provider: IProvider;
  priceUsd: number;
  priceNgn: number;
  stock: number;
}

export async function findBestProvider(
  providers: IProvider[],
  countryCode: string,
  serviceSlug: string,
  exchangeRate: number
): Promise<BestProvider | null> {
  const results: Array<{ provider: IProvider; price: ProviderPrice }> = [];

  await Promise.allSettled(
    providers.map(async (p) => {
      const prices = await p.getPrices(countryCode, serviceSlug);
      for (const price of prices) {
        if (price.stock > 0) results.push({ provider: p, price });
      }
    })
  );

  if (results.length === 0) return null;
  results.sort((a, b) => a.price.priceUsd - b.price.priceUsd);
  const best = results[0];
  return {
    provider: best.provider,
    priceUsd: best.price.priceUsd,
    priceNgn: Math.ceil(best.price.priceUsd * exchangeRate),
    stock: best.price.stock,
  };
}
