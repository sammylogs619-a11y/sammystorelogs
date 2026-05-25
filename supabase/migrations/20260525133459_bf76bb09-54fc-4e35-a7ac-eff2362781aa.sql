-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _count int;
BEGIN
  SELECT count(*) INTO _count FROM public.user_roles;
  IF _count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_assign_role AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text,
  is_custom boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.categories (name, slug, icon, sort_order) VALUES
  ('Facebook','facebook','facebook',1),('Instagram','instagram','instagram',2),('TikTok','tiktok','tiktok',3),
  ('Telegram','telegram','telegram',4),('Twitter/X','twitter','twitter',5),('Netflix','netflix','netflix',6),
  ('Canva','canva','canva',7),('Spotify','spotify','spotify',8),('Gmail','gmail','gmail',9),
  ('Crypto Accounts','crypto','crypto',10),('Others','others','others',11);

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON public.products(category_id);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active products" ON public.products FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- PRODUCT LOGINS
CREATE TABLE public.product_logins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  credential text NOT NULL,
  password text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','sold','reserved')),
  sold_to uuid REFERENCES auth.users(id),
  sold_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_logins_product_status ON public.product_logins(product_id, status);
ALTER TABLE public.product_logins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage logins" ON public.product_logins FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.sync_product_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pid uuid;
BEGIN
  _pid := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.products
  SET stock = (SELECT count(*) FROM public.product_logins WHERE product_id = _pid AND status = 'available'),
      updated_at = now()
  WHERE id = _pid;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_sync_stock_ins AFTER INSERT ON public.product_logins FOR EACH ROW EXECUTE FUNCTION public.sync_product_stock();
CREATE TRIGGER trg_sync_stock_upd AFTER UPDATE OF status ON public.product_logins FOR EACH ROW EXECUTE FUNCTION public.sync_product_stock();
CREATE TRIGGER trg_sync_stock_del AFTER DELETE ON public.product_logins FOR EACH ROW EXECUTE FUNCTION public.sync_product_stock();

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  price numeric(10,2) NOT NULL,
  delivered_credential text NOT NULL,
  delivered_password text NOT NULL,
  delivered_notes text,
  login_id uuid REFERENCES public.product_logins(id),
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user ON public.orders(user_id);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PURCHASE FUNCTION
CREATE OR REPLACE FUNCTION public.purchase_product(_product_id uuid)
RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _prod public.products; _login public.product_logins; _balance numeric; _order public.orders;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _prod FROM public.products WHERE id = _product_id AND is_active = true FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not available'; END IF;
  SELECT * INTO _login FROM public.product_logins WHERE product_id = _product_id AND status = 'available' ORDER BY created_at ASC FOR UPDATE SKIP LOCKED LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Out of stock'; END IF;
  SELECT balance INTO _balance FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF _balance IS NULL THEN RAISE EXCEPTION 'Profile missing'; END IF;
  IF _balance < _prod.price THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;
  UPDATE public.profiles SET balance = balance - _prod.price, updated_at = now() WHERE id = _uid;
  UPDATE public.product_logins SET status = 'sold', sold_to = _uid, sold_at = now() WHERE id = _login.id;
  INSERT INTO public.orders (user_id, product_id, product_name, price, delivered_credential, delivered_password, delivered_notes, login_id)
  VALUES (_uid, _prod.id, _prod.name, _prod.price, _login.credential, _login.password, _login.notes, _login.id)
  RETURNING * INTO _order;
  RETURN _order;
END; $$;

REVOKE ALL ON FUNCTION public.purchase_product(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.purchase_product(uuid) TO authenticated;

-- STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('product_images','product_images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT USING (bucket_id = 'product_images');
CREATE POLICY "Authed upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product_images');
CREATE POLICY "Admins update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product_images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product_images' AND public.has_role(auth.uid(), 'admin'));