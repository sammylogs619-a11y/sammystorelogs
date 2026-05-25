CREATE OR REPLACE FUNCTION public.register_seller(_business_name text, _business_description text, _logo_url text)
RETURNS public.sellers LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _row public.sellers;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF length(trim(coalesce(_business_name,''))) < 2 THEN RAISE EXCEPTION 'Business name required'; END IF;
  INSERT INTO public.sellers(id, business_name, business_description, logo_url, status)
  VALUES (_uid, trim(_business_name), nullif(trim(coalesce(_business_description,'')),''), nullif(_logo_url,''), 'pending')
  ON CONFLICT (id) DO UPDATE SET business_name = EXCLUDED.business_name,
    business_description = EXCLUDED.business_description,
    logo_url = COALESCE(EXCLUDED.logo_url, public.sellers.logo_url),
    status = CASE WHEN public.sellers.status = 'declined' THEN 'pending'::seller_status ELSE public.sellers.status END,
    updated_at = now()
  RETURNING * INTO _row;
  RETURN _row;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_seller_status(_seller_id uuid, _status public.seller_status)
RETURNS public.sellers LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.sellers;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.sellers SET status = _status, updated_at = now() WHERE id = _seller_id RETURNING * INTO _row;
  IF NOT FOUND THEN RAISE EXCEPTION 'Seller not found'; END IF;
  RETURN _row;
END $$;

CREATE TABLE IF NOT EXISTS public.support_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_chats_user_id_created ON public.support_chats (user_id, created_at);
ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own chats" ON public.support_chats FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own chats" ON public.support_chats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all chats" ON public.support_chats FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));