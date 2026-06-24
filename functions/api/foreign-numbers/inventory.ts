import { Env, buildProviders, findBestProvider } from '../../lib/providers/registry';
import { jsonResponse, errorResponse, getSupabaseAdmin } from '../../lib/supabase';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const country = url.searchParams.get('country');
  const service = url.searchParams.get('service');
  if (!country || !service) return errorResponse('Missing country or service parameter');

  const exchangeRate = parseFloat(env.EXCHANGE_RATE_USD_NGN ?? '1650');
  const providers = buildProviders(env);
  const best = await findBestProvider(providers, country, service, exchangeRate);
  if (!best) return jsonResponse({ available: false, message: 'No stock available' });

  const supabase = getSupabaseAdmin(env);
  const { data: pricingConfig } = await supabase
    .from('fn_pricing_config')
    .select('margin_percent, fixed_markup_ngn, override_price_ngn')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  let finalPriceNgn = best.priceNgn;
  if (pricingConfig?.override_price_ngn) {
    finalPriceNgn = pricingConfig.override_price_ngn;
  } else {
    const margin = pricingConfig?.margin_percent ?? 25;
    const markup = pricingConfig?.fixed_markup_ngn ?? 0;
    finalPriceNgn = Math.ceil(best.priceNgn * (1 + margin / 100) + markup);
  }

  return jsonResponse({
    available: true,
    price_ngn: finalPriceNgn,
    price_usd: best.priceUsd,
    stock: best.stock,
    provider_slug: best.provider.slug,
    estimated_wait_seconds: 60,
  });
};

export const onRequestOptions: PagesFunction = async () => new Response(null, {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  },
});
