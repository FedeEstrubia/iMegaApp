
-- 1. Create fundas table (Cases)
CREATE TABLE IF NOT EXISTS public.fundas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  compatible_models TEXT[],
  material TEXT,
  color TEXT,
  price NUMERIC NOT NULL,
  stock INTEGER DEFAULT 0,
  thumbnails TEXT[],
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create accesorios table (Accessories)
CREATE TABLE IF NOT EXISTS public.accesorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT,
  price NUMERIC NOT NULL,
  stock INTEGER DEFAULT 0,
  thumbnails TEXT[],
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.fundas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accesorios ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Public Read, Public/Admin Write if needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fundas' AND policyname = 'Public read access fundas'
  ) THEN
    CREATE POLICY "Public read access fundas" ON public.fundas FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'accesorios' AND policyname = 'Public read access accesorios'
  ) THEN
    CREATE POLICY "Public read access accesorios" ON public.accesorios FOR SELECT USING (true);
  END IF;
  
  -- Add write policies if needed (e.g. for Admin functionality)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fundas' AND policyname = 'Authenticated write access fundas'
  ) THEN
    CREATE POLICY "Authenticated write access fundas" ON public.fundas FOR ALL USING (auth.role() = 'authenticated');
  END IF;
    
  IF NOT EXISTS (
     SELECT 1 FROM pg_policies WHERE tablename = 'accesorios' AND policyname = 'Authenticated write access accesorios'
  ) THEN
    CREATE POLICY "Authenticated write access accesorios" ON public.accesorios FOR ALL USING (auth.role() = 'authenticated');
  END IF;

END
$$;
