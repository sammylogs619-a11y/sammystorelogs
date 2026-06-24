import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { FnCountry, FnService, FnOrder, FnServiceAvailability } from '../types/foreignNumbers';

export function useCountries() {
  const [countries, setCountries] = useState<FnCountry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('fn_countries')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        setCountries(data ?? []);
        setLoading(false);
      });
  }, []);

  return { countries, loading };
}

export function useCountryServices(countryCode: string | undefined) {
  const [services, setServices] = useState<FnService[]>([]);
  const [availability, setAvailability] = useState<Record<string, FnServiceAvailability>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!countryCode) return;
    setLoading(true);

    supabase
      .from('fn_services')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(async ({ data: svcs }) => {
        setServices(svcs ?? []);

        const { data: inventory } = await supabase
          .from('fn_provider_inventory')
          .select('*')
          .eq('country_code', countryCode)
          .eq('is_available', true)
          .gt('stock', 0);

        const availMap: Record<string, FnServiceAvailability> = {};
        for (const item of inventory ?? []) {
          if (!availMap[item.service_slug]) {
            const svc = svcs?.find(s => s.slug === item.service_slug);
            if (!svc) continue;
            availMap[item.service_slug] = {
              service: svc,
              best_price_ngn: item.price_ngn ?? 0,
              total_stock: item.stock,
              estimated_wait_seconds: 60,
              providers: [],
            };
          } else {
            const current = availMap[item.service_slug];
            current.total_stock += item.stock;
            if ((item.price_ngn ?? Infinity) < current.best_price_ngn) {
              current.best_price_ngn = item.price_ngn ?? current.best_price_ngn;
            }
          }
          availMap[item.service_slug].providers.push(item);
        }

        setAvailability(availMap);
        setLoading(false);
      });
  }, [countryCode]);

  return { services, availability, loading };
}

export function useMyOrders() {
  const [orders, setOrders] = useState<FnOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('fn_orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('fn_orders_realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'fn_orders',
      }, (payload) => {
        setOrders(prev =>
          prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  return { orders, loading, refetch: fetchOrders };
}

export function useOtpPolling(orderId: string | null, isActive: boolean) {
  const [status, setStatus] = useState<string>('waiting');
  const [otpCode, setOtpCode] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!orderId || !isActive) return;

    const poll = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `/api/foreign-numbers/check-otp?order_id=${orderId}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      const data = await res.json() as { status: string; otp_code?: string };
      setStatus(data.status);

      if (data.otp_code) {
        setOtpCode(data.otp_code);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }

      if (['expired', 'cancelled', 'failed'].includes(data.status)) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [orderId, isActive]);

  return { status, otpCode };
}
