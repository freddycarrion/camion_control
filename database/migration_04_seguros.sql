-- Ejecutar en Supabase > SQL Editor después del esquema inicial.
CREATE TABLE IF NOT EXISTS seguros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('camion', 'personal')),
  camion_id UUID REFERENCES camiones(id) ON DELETE RESTRICT,
  personal_id UUID REFERENCES personal(id) ON DELETE RESTRICT,
  aseguradora TEXT NOT NULL CHECK (length(trim(aseguradora)) > 0),
  poliza TEXT NOT NULL DEFAULT '',
  monto NUMERIC(12,2) NOT NULL CHECK (monto >= 0),
  fecha_vencimiento DATE NOT NULL,
  observaciones TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((tipo = 'camion' AND camion_id IS NOT NULL AND personal_id IS NULL)
    OR (tipo = 'personal' AND personal_id IS NOT NULL AND camion_id IS NULL))
);
ALTER TABLE seguros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Seguros del usuario" ON seguros;
CREATE POLICY "Seguros del usuario" ON seguros FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_seguros_usuario_vencimiento ON seguros(user_id, fecha_vencimiento);
DROP TRIGGER IF EXISTS trigger_update_seguros_updated_at ON seguros;
CREATE TRIGGER trigger_update_seguros_updated_at BEFORE UPDATE ON seguros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
