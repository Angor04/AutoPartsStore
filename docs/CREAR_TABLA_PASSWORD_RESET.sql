-- SQL para crear la tabla password_reset_tokens en Supabase
-- Ejecutar en: https://supabase.com/dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_password_reset_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_token_hash ON public.password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_expires_at ON public.password_reset_tokens(expires_at);

-- RLS Policy (Row Level Security)
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Permitir que cualquiera pueda crear tokens (controlado en la aplicación)
CREATE POLICY "Allow anyone to insert reset tokens" ON public.password_reset_tokens
  FOR INSERT WITH CHECK (true);

-- Permitir que se actualicen tokens propios
CREATE POLICY "Allow update own reset tokens" ON public.password_reset_tokens
  FOR UPDATE USING (user_id = auth.uid());

-- Denegar lectura a usuarios normales (solo admin puede ver)
CREATE POLICY "Admin only read reset tokens" ON public.password_reset_tokens
  FOR SELECT USING (false);
