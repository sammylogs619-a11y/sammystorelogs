
-- 1. Structured fields on product_logins
ALTER TABLE public.product_logins
  ADD COLUMN IF NOT EXISTS login_email text,
  ADD COLUMN IF NOT EXISTS login_password text,
  ADD COLUMN IF NOT EXISTS twofa_code text,
  ADD COLUMN IF NOT EXISTS recovery_email text,
  ADD COLUMN IF NOT EXISTS recovery_password text;

-- Backfill from legacy credential/password
UPDATE public.product_logins
  SET login_email = COALESCE(login_email, credential),
      login_password = COALESCE(login_password, password)
  WHERE login_email IS NULL OR login_password IS NULL;

-- Status check (allow reserved)
DO $$ BEGIN
  ALTER TABLE public.product_logins DROP CONSTRAINT IF EXISTS product_logins_status_check;
EXCEPTION WHEN others THEN NULL; END $$;
ALTER TABLE public.product_logins
  ADD CONSTRAINT product_logins_status_check
  CHECK (status IN ('available','sold','reserved'));

-- 2. Mirror fields on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivered_login_email text,
  ADD COLUMN IF NOT EXISTS delivered_login_password text,
  ADD COLUMN IF NOT EXISTS delivered_twofa text,
  ADD COLUMN IF NOT EXISTS delivered_recovery_email text,
  ADD COLUMN IF NOT EXISTS delivered_recovery_password text;

-- 3. Update purchase_product to deliver structured fields
CREATE OR REPLACE FUNCTION public.purchase_product(_product_id uuid, _coupon_code text DEFAULT NULL::text)
 RETURNS orders
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid(); _prod public.products; _login public.product_logins; _profile public.profiles;
  _seller public.sellers; _order public.orders; _price numeric; _discount numeric := 0; _coupon_id uuid; _quote jsonb;
  _new_balance numeric; _seller_new_balance numeric;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _profile FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile missing'; END IF;
  IF _profile.is_suspended THEN RAISE EXCEPTION 'Account suspended'; END IF;
  SELECT * INTO _prod FROM public.products WHERE id = _product_id AND is_active = true FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not available'; END IF;
  IF _prod.seller_id IS NOT NULL THEN
    SELECT * INTO _seller FROM public.sellers WHERE id = _prod.seller_id FOR UPDATE;
    IF NOT FOUND OR _seller.status <> 'active' THEN RAISE EXCEPTION 'Seller unavailable'; END IF;
  END IF;
  _price := _prod.price;
  IF _coupon_code IS NOT NULL AND length(trim(_coupon_code)) > 0 THEN
    _quote := public.quote_coupon(_coupon_code, _price, 'purchase');
    _discount := (_quote->>'discount')::numeric;
    _coupon_id := (_quote->>'coupon_id')::uuid;
    _price := greatest(_price - _discount, 0);
  END IF;
  SELECT * INTO _login FROM public.product_logins
    WHERE product_id = _product_id AND status = 'available'
    ORDER BY created_at ASC FOR UPDATE SKIP LOCKED LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Out of stock'; END IF;
  IF _profile.balance < _price THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;
  UPDATE public.profiles SET balance = balance - _price, updated_at = now() WHERE id = _uid RETURNING balance INTO _new_balance;
  UPDATE public.product_logins SET status='sold', sold_to=_uid, sold_at=now() WHERE id = _login.id;
  INSERT INTO public.orders(
    user_id, product_id, product_name, price,
    delivered_credential, delivered_password, delivered_notes, login_id,
    delivered_login_email, delivered_login_password,
    delivered_twofa, delivered_recovery_email, delivered_recovery_password
  )
  VALUES (
    _uid, _prod.id, _prod.name, _price,
    COALESCE(_login.login_email, _login.credential),
    COALESCE(_login.login_password, _login.password),
    _login.notes, _login.id,
    COALESCE(_login.login_email, _login.credential),
    COALESCE(_login.login_password, _login.password),
    _login.twofa_code, _login.recovery_email, _login.recovery_password
  ) RETURNING * INTO _order;
  INSERT INTO public.wallet_transactions(user_id,type,amount,balance_after,description,reference_id,metadata)
  VALUES (_uid,'purchase',-_price,_new_balance,_prod.name,_order.id, jsonb_build_object('product_id',_prod.id,'discount',_discount,'seller_id',_prod.seller_id));
  IF _prod.seller_id IS NOT NULL THEN
    UPDATE public.sellers SET balance = balance + _price, updated_at = now() WHERE id = _prod.seller_id RETURNING balance INTO _seller_new_balance;
    INSERT INTO public.seller_transactions(seller_id,type,amount,balance_after,description,reference_id,metadata)
    VALUES (_prod.seller_id,'sale',_price,_seller_new_balance,_prod.name,_order.id, jsonb_build_object('buyer_id',_uid,'product_id',_prod.id));
  END IF;
  IF _coupon_id IS NOT NULL THEN
    INSERT INTO public.coupon_redemptions(coupon_id,user_id,context,reference_id,amount_discounted)
    VALUES (_coupon_id,_uid,'purchase',_order.id,_discount);
    UPDATE public.coupons SET uses_count = uses_count + 1 WHERE id = _coupon_id;
  END IF;
  RETURN _order;
END $function$;

-- 4. Make legacy credential/password nullable for new inserts
ALTER TABLE public.product_logins ALTER COLUMN credential DROP NOT NULL;
ALTER TABLE public.product_logins ALTER COLUMN password DROP NOT NULL;
