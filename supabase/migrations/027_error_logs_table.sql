-- Error monitoring table
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  stack text,
  component_stack text,
  page text,
  route text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email text,
  user_role text,
  source text NOT NULL DEFAULT 'unknown' CHECK (source IN ('error-boundary','unhandled-error','unhandled-rejection','api-error','manual')),
  severity text NOT NULL DEFAULT 'error' CHECK (severity IN ('warning','error','critical')),
  user_agent text,
  viewport text,
  metadata jsonb DEFAULT '{}',
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert error logs
CREATE POLICY "Anyone can log errors" ON public.error_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Anon users can also log errors
CREATE POLICY "Anon can log errors" ON public.error_logs
  FOR INSERT TO anon
  WITH CHECK (true);

-- Only admins can read error logs
CREATE POLICY "Admins can read error logs" ON public.error_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::user_role
    )
  );

-- Only admins can update error logs (resolve)
CREATE POLICY "Admins can update error logs" ON public.error_logs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::user_role
    )
  );

-- Only admins can delete error logs
CREATE POLICY "Admins can delete error logs" ON public.error_logs
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::user_role
    )
  );

-- Index for common queries
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_resolved ON public.error_logs(resolved, created_at DESC);
CREATE INDEX idx_error_logs_source ON public.error_logs(source);
