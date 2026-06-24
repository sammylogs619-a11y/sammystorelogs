import { Env, buildProviders } from '../../lib/providers/registry';
import { jsonResponse, errorResponse, getSupabaseAdmin, verifyAuth } from '../../lib/supabase';
import { extractOtp } from '../../lib/providers/base';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await verifyAuth(request, env);
  if (!userId) return errorResponse('Unauthorized', 401);

  const url = new URL(request.url);
  const orderId = url.searchParams.get('order_id');
  if (!orderId) return errorResponse('Missing order_id');

  const supabase = getSupabaseAdmin(env);
  const { data: order } = await supabase
    .from('fn_orders')
    .select('*, fn_providers(slug)')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (!order) return errorResponse('Order not found', 404);
  if (order.otp_code) return jsonResponse({ status: 'otp_received', otp_code: order.otp_code, phone_number: order.phone_number });
  if (order.expires_at && new Date(order.expires_at) < new Date()) {
    await supabase.from('fn_orders').update({ status: 'expired' }).eq('id', orderId);
    return jsonResponse({ status: 'expired' });
  }
  if (order.status !== 'active' || !order.provider_order_id) return jsonResponse({ status: order.status });

  const providers = buildProviders(env);
  const providerSlug = (order.fn_providers as { slug: string } | null)?.slug;
  const provider = providers.find(p => p.slug === providerSlug);
  if (!provider) return errorResponse('Provider not found', 500);

  try {
    const sms = await provider.checkSms(order.provider_order_id);
    if (sms) {
      const otpCode = sms.otpCode ?? extractOtp(sms.text);
      await supabase.from('fn_orders').update({ otp_code: otpCode, status: 'otp_received', otp_received_at: sms.receivedAt }).eq('id', orderId);
      await supabase.from('fn_otp_messages').insert({ order_id: orderId, raw_text: sms.text, otp_code: otpCode, received_at: sms.receivedAt });
      return jsonResponse({ status: 'otp_received', otp_code: otpCode, phone_number: order.phone_number });
    }
  } catch (err) {
    await supabase.from('fn_api_logs').insert({ order_id: orderId, action: 'check_sms', error: err instanceof Error ? err.message : 'Unknown' });
  }

  return jsonResponse({ status: 'waiting', phone_number: order.phone_number });
};

export const onRequestOptions: PagesFunction = async () => new Response(null, {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  },
});
