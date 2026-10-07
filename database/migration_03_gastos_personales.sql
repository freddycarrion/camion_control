-- ====================================================================
-- MIGRACIÓN 03: REGISTRO Y CONTROL DE GASTOS PERSONALES
-- Ejecutar en Supabase > SQL Editor
-- ====================================================================

-- 1. Crear tabla de Gastos Personales
CREATE TABLE IF NOT EXISTS gastos_personales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    concepto VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL DEFAULT 'otros',
    monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'efectivo',
    observaciones TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sync_status sync_status_enum DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Trigger para actualizar el timestamp 'updated_at'
DROP TRIGGER IF EXISTS trigger_update_gastos_personales_updated_at ON gastos_personales;
CREATE TRIGGER trigger_update_gastos_personales_updated_at
BEFORE UPDATE ON gastos_personales
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_gastos_personales_fecha ON gastos_personales(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_personales_categoria ON gastos_personales(categoria);
CREATE INDEX IF NOT EXISTS idx_gastos_personales_user ON gastos_personales(user_id);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE gastos_personales ENABLE ROW LEVEL SECURITY;

-- 5. Política de Seguridad
DROP POLICY IF EXISTS "Acceso gastos personales autenticados" ON gastos_personales;
CREATE POLICY "Acceso gastos personales autenticados" ON gastos_personales
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
