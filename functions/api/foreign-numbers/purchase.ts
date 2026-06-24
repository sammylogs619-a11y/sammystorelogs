import { Env, buildProviders, findBestProvider } from '../../lib/providers/registry';
import { jsonResponse, errorResponse, getSupabaseAdmin, verifyAuth } from '../../lib/supabase';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await verifyAuth(request, env);
  if (!userId) return errorResponse('Unauthorized', 401);

  const body = await request.json() as { country_code?: string; service_slug?: string };
  const { country_code, service_slug } = body;
  if (!country_code || !service_slug) return errorResponse('Missing country_code or service_slug');

  const supabase = getSupabaseAdmin(env);
  const exchangeRate = parseFloat(env.EXCHANGE_RATE_USD_NGN ?? '1650');
  const providers = buildProviders(env);

  const best = await findBestProvider(providers, country_code, service_slug, exchangeRate);
  if (!best) return errorResponse('No numbers available for this service right now', 503);

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

  const { data: providerRecord } = await supabase
    .from('fn_providers').select('id').eq('slug', best.provider.slug).single();
  if (!providerRecord) return errorResponse('Provider not found', 500);

  const { data: orderId, error: rpcError } = await supabase.rpc('fn_purchase_number', {
    p_user_id: userId,
    p_country_code: country_code,
    p_service_slug: service_slug,
    p_amount_ngn: finalPriceNgn,
    p_provider_id: providerRecord.id,
  });

  if (rpcError) {
    const msg = rpcError.message.includes('Insufficient') ? 'Insufficient wallet balance' : 'Purchase failed. Please try again.';
    return errorResponse(msg, 400);
  }

  let providerOrderId: string;
  let phoneNumber: string;

  try {
    const result = await best.provider.buyNumber(country_code, service_slug);
    providerOrderId = result.providerOrderId;
    phoneNumber = result.phoneNumber;
  } catch (err) {
    await supabase.rpc('fn_refund_order', { p_order_id: orderId, p_reason: 'Auto-refund: Provider failed' });
    return errorResponse('Provider error. Your wallet has been refunded.', 502);
  }

  const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();
  await supabase.from('fn_orders').update({
    phone_number: phoneNumber,
    provider_order_id: providerOrderId,
    status: 'active',
    expires_at: expiresAt,
  }).eq('id', orderId);

  return jsonResponse({ order_id: orderId, phone_number: phoneNumber, expires_at: expiresAt, amount_ngn: finalPriceNgn });
};

export const onRequestOptions: PagesFunction = async () => new Response(null, {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  },
});
