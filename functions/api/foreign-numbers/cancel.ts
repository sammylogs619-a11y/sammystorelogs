import { Env, buildProviders } from '../../lib/providers/registry';
import { jsonResponse, errorResponse, getSupabaseAdmin, verifyAuth } from '../../lib/supabase';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const userId = await verifyAuth(request, env);
  if (!userId) return errorResponse('Unauthorized', 401);

  const { order_id } = await request.json() as { order_id?: string };
  if (!order_id) return errorResponse('Missing order_id');

  const supabase = getSupabaseAdmin(env);
  const { data: order } = await supabase
    .from('fn_orders')
    .select('*, fn_providers(slug)')
    .eq('id', order_id)
    .eq('user_id', userId)
    .single();

  if (!order) return errorResponse('Order not found', 404);
  if (!['pending', 'active'].includes(order.status)) return errorResponse(`Cannot cancel order in status: ${order.status}`);

  if (order.provider_order_id) {
    const providers = buildProviders(env);
    const providerSlug = (order.fn_providers as { slug: string } | null)?.slug;
    const provider = providers.find(p => p.slug === providerSlug);
    if (provider) {
      try { await provider.cancelOrder(order.provider_order_id); } catch { }
    }
  }

  await supabase.rpc('fn_refund_order', { p_order_id: order_id, p_reason: 'User cancelled order' });
  await supabase.from('fn_orders').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', order_id);

  return jsonResponse({ success: true, refunded: true });
};

export const onRequestOptions: PagesFunction = async () => new Response(null, {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  },
});
