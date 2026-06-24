import { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Settings, RefreshCw, DollarSign, Package, AlertCircle, CheckCircle, XCircle, BarChart3, ToggleLeft, ToggleRight } from 'lucide-react';
import type { FnProvider, FnOrder } from '../../types/foreignNumbers';

type AdminTab = 'overview' | 'providers' | 'orders' | 'settings';

export function AdminForeignNumbers() {
  const [tab, setTab] = useState<AdminTab>('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🌍</span>
        <h2 className="text-xl font-bold">Foreign Numbers</h2>
      </div>
      <div className="flex gap-2 border-b border-border">
        {(['overview', 'providers', 'orders', 'settings'] as AdminTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'overview' && <AdminOverview />}
      {tab === 'providers' && <AdminProviders />}
      {tab === 'orders' && <AdminOrders />}
      {tab === 'settings' && <AdminSettings />}
    </div>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState({ totalOrders: 0, activeOrders: 0, totalRevenue: 0, successRate: 0 });

  useEffect(() => {
    supabase.from('fn_orders').select('status, amount_ngn').then(({ data }) => {
      if (!data) return;
      const total = data.length;
      const active = data.filter(o => o.status === 'active').length;
      const revenue = data.filter(o => !['refunded', 'failed', 'cancelled'].includes(o.status)).reduce((s, o) => s + o.amount_ngn, 0);
      const success = data.filter(o => ['otp_received', 'completed'].includes(o.status)).length;
      setStats({ totalOrders: total, activeOrders: active, totalRevenue: revenue, successRate: total ? Math.round((success / total) * 100) : 0 });
    });
  }, []);

  const cards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'text-blue-600' },
    { label: 'Active Now', value: stats.activeOrders, icon: RefreshCw, color: 'text-yellow-600' },
    { label: 'Revenue', value: `₦${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600' },
    { label: 'Success Rate', value: `${stats.successRate}%`, icon: BarChart3, color: 'text-purple-600' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label} className="rounded-xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{card.label}</span>
            <card.icon className={`w-4 h-4 ${card.color}`} />
          </div>
          <p className="text-2xl font-bold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

function AdminProviders() {
  const [providers, setProviders] = useState<FnProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('fn_providers').select('*').order('priority').then(({ data }) => {
      setProviders(data ?? []);
      setLoading(false);
    });
  }, []);

  const toggleProvider = async (id: string, current: boolean) => {
    await supabase.from('fn_providers').update({ is_active: !current }).eq('id', id);
    setProviders(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
  };

  if (loading) return <div className="h-32 bg-muted animate-pulse rounded-xl" />;

  return (
    <div className="space-y-3">
      {providers.map(provider => (
        <div key={provider.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">{provider.name}</p>
              <span className="text-xs text-muted-foreground">Priority: {provider.priority}</span>
            </div>
            {provider.balance_usd !== null && (
              <p className="text-xs text-muted-foreground">Balance: ${provider.balance_usd?.toFixed(2)}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {provider.is_active ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
            <button onClick={() => toggleProvider(provider.id, provider.is_active)} className="text-muted-foreground hover:text-foreground transition-colors">
              {provider.is_active ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7" />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminOrders() {
  const [orders, setOrders] = useState<FnOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('fn_orders').select('*').order('created_at', { ascending: false }).limit(100).then(({ data }) => {
      setOrders(data ?? []);
      setLoading(false);
    });
  }, []);

  const refundOrder = async (orderId: string) => {
    setRefunding(orderId);
    await supabase.rpc('fn_refund_order', { p_order_id: orderId, p_reason: 'Admin manual refund' });
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'refunded' as const } : o));
    setRefunding(null);
  };

  if (loading) return <div className="h-48 bg-muted animate-pulse rounded-xl" />;

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">{orders.length} orders shown</div>
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {['Order', 'Service', 'Number', 'Status', 'Amount', 'Actions'].map(h => (
                <th key={h} className="text-left p-3 font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map(order => (
              <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-3 font-mono text-xs">{order.id.slice(0, 8)}…</td>
                <td className="p-3 capitalize">{order.service_slug} <span className="text-muted-foreground uppercase text-xs">({order.country_code})</span></td>
                <td className="p-3 font-mono text-xs">{order.phone_number ?? '—'}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    ['otp_received', 'completed'].includes(order.status) ? 'bg-emerald-500/10 text-emerald-600' :
                    order.status === 'active' ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'
                  }`}>{order.status}</span>
                </td>
                <td className="p-3">₦{order.amount_ngn.toLocaleString()}</td>
                <td className="p-3">
                  {!['refunded', 'completed', 'cancelled'].includes(order.status) && (
                    <button
                      onClick={() => refundOrder(order.id)}
                      disabled={refunding === order.id}
                      className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      {refunding === order.id ? 'Refunding…' : 'Refund'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminSettings() {
  const [exchangeRate, setExchangeRate] = useState('1650');
  const [margin, setMargin] = useState('25');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('fn_settings').select('key, value').in('key', ['exchange_rate_usd_ngn', 'default_margin_percent']).then(({ data }) => {
      for (const row of data ?? []) {
        if (row.key === 'exchange_rate_usd_ngn') setExchangeRate(String(row.value));
        if (row.key === 'default_margin_percent') setMargin(String(row.value));
      }
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase.from('fn_settings').upsert([
      { key: 'exchange_rate_usd_ngn', value: parseFloat(exchangeRate) },
      { key: 'default_margin_percent', value: parseFloat(margin) },
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-md space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium">USD → NGN Exchange Rate</label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">$1 =</span>
          <input type="number" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <span className="text-muted-foreground text-sm">₦</span>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Default Margin (%)</label>
        <div className="flex items-center gap-2">
          <input type="number" value={margin} onChange={e => setMargin(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <span className="text-muted-foreground text-sm">%</span>
        </div>
      </div>
      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all">
        <Settings className="w-4 h-4" />
        {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Settings'}
      </button>
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
        <div className="flex gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700 dark:text-yellow-400">
            Add provider API keys in Cloudflare Pages environment variables:<br />
            <code>SMS_ACTIVATE_API_KEY</code><br />
            <code>FIVE_SIM_API_KEY</code>
          </p>
        </div>
      </div>
    </div>
  );
}
