-- ====================================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS SUPABASE - GESTIÓN DE CAMIONES
-- ====================================================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Eliminar tipos y tablas existentes si existen (Limpieza segura)
DROP TABLE IF EXISTS planillas_pago CASCADE;
DROP TABLE IF EXISTS adelantos_sueldo CASCADE;
DROP TABLE IF EXISTS transacciones CASCADE;
DROP TABLE IF EXISTS asignacion_ayudantes CASCADE;
DROP TABLE IF EXISTS asignaciones_diarias CASCADE;
DROP TABLE IF EXISTS camiones CASCADE;
DROP TABLE IF EXISTS personal CASCADE;

DROP TYPE IF EXISTS rol_personal CASCADE;
DROP TYPE IF EXISTS estado_camion CASCADE;
DROP TYPE IF EXISTS estado_asignacion CASCADE;
DROP TYPE IF EXISTS categoria_gasto CASCADE;
DROP TYPE IF EXISTS estado_planilla CASCADE;
DROP TYPE IF EXISTS sync_status_enum CASCADE;

-- 3. Definición de Enums
CREATE TYPE rol_personal AS ENUM ('chofer', 'ayudante');
CREATE TYPE estado_camion AS ENUM ('disponible', 'en_ruta', 'mantenimiento', 'fuera_servicio');
CREATE TYPE estado_asignacion AS ENUM ('en_curso', 'completado', 'cancelado');
CREATE TYPE categoria_gasto AS ENUM ('combustible', 'mantenimiento', 'peaje', 'viaticos', 'mecanica', 'repuestos', 'otros');
CREATE TYPE estado_planilla AS ENUM ('pendiente', 'pagado');
CREATE TYPE sync_status_enum AS ENUM ('synced', 'pending_insert', 'pending_update', 'pending_delete');

-- 4. Función global para actualizar timestamp 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 5. TABLA: Personal (Choferes y Ayudantes)
-- ====================================================================
CREATE TABLE personal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    rol rol_personal NOT NULL,
    pago_diario NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (pago_diario >= 0),
    telefono VARCHAR(20),
    activo BOOLEAN NOT NULL DEFAULT true,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sync_status sync_status_enum DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER trigger_update_personal_updated_at
BEFORE UPDATE ON personal
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 6. TABLA: Camiones (Flota)
-- ====================================================================
CREATE TABLE camiones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placa VARCHAR(20) UNIQUE NOT NULL,
    codigo_interno VARCHAR(50) UNIQUE NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    anio INT NOT NULL CHECK (anio >= 1990 AND anio <= 2050),
    estado estado_camion NOT NULL DEFAULT 'disponible',
    chofer_titular_id UUID REFERENCES personal(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sync_status sync_status_enum DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER trigger_update_camiones_updated_at
BEFORE UPDATE ON camiones
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 7. TABLA: Asignaciones Diarias (Salidas a Ruta del Día)
-- ====================================================================
CREATE TABLE asignaciones_diarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    camion_id UUID NOT NULL REFERENCES camiones(id) ON DELETE CASCADE,
    chofer_id UUID REFERENCES personal(id) ON DELETE SET NULL,
    estado estado_asignacion NOT NULL DEFAULT 'en_curso',
    observaciones TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sync_status sync_status_enum DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER trigger_update_asignaciones_updated_at
BEFORE UPDATE ON asignaciones_diarias
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 8. TABLA: Ayudantes Asignados (Plantilla o Libres/Temporales)
-- ====================================================================
CREATE TABLE asignacion_ayudantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asignacion_id UUID NOT NULL REFERENCES asignaciones_diarias(id) ON DELETE CASCADE,
    personal_id UUID REFERENCES personal(id) ON DELETE SET NULL,
    nombre_temporal VARCHAR(150),
    es_temporal BOOLEAN NOT NULL DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sync_status sync_status_enum DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_ayudante_tipo CHECK (
        (es_temporal = false AND personal_id IS NOT NULL) OR
        (es_temporal = true AND nombre_temporal IS NOT NULL AND LENGTH(TRIM(nombre_temporal)) > 0)
    )
);

CREATE TRIGGER trigger_update_ayudantes_updated_at
BEFORE UPDATE ON asignacion_ayudantes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 9. TABLA: Transacciones (Gastos Operativos)
-- ====================================================================
CREATE TABLE transacciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    camion_id UUID REFERENCES camiones(id) ON DELETE SET NULL, -- NULL si es gasto general de flota
    concepto VARCHAR(255) NOT NULL,
    categoria categoria_gasto NOT NULL,
    monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
    observaciones TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sync_status sync_status_enum DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER trigger_update_transacciones_updated_at
BEFORE UPDATE ON transacciones
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 10. TABLA: Adelantos de Sueldo
-- ====================================================================
CREATE TABLE adelantos_sueldo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personal_id UUID NOT NULL REFERENCES personal(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
    motivo TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sync_status sync_status_enum DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER trigger_update_adelantos_updated_at
BEFORE UPDATE ON adelantos_sueldo
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 11. TABLA: Planillas de Pago
-- ====================================================================
CREATE TABLE planillas_pago (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personal_id UUID NOT NULL REFERENCES personal(id) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    dias_trabajados INT NOT NULL DEFAULT 0 CHECK (dias_trabajados >= 0),
    pago_diario NUMERIC(10,2) NOT NULL CHECK (pago_diario >= 0),
    monto_bruto NUMERIC(10,2) NOT NULL CHECK (monto_bruto >= 0),
    total_adelantos NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (total_adelantos >= 0),
    monto_neto NUMERIC(10,2) NOT NULL,
    estado estado_planilla NOT NULL DEFAULT 'pendiente',
    fecha_liquidacion TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sync_status sync_status_enum DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER trigger_update_planillas_updated_at
BEFORE UPDATE ON planillas_pago
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 12. ÍNDICES DE RENDIMIENTO
-- ====================================================================
CREATE INDEX idx_personal_rol ON personal(rol);
CREATE INDEX idx_personal_activo ON personal(activo);
CREATE INDEX idx_camiones_placa ON camiones(placa);
CREATE INDEX idx_camiones_estado ON camiones(estado);
CREATE INDEX idx_asignaciones_fecha ON asignaciones_diarias(fecha);
CREATE INDEX idx_asignaciones_camion ON asignaciones_diarias(camion_id);
CREATE INDEX idx_transacciones_fecha ON transacciones(fecha);
CREATE INDEX idx_transacciones_camion ON transacciones(camion_id);
CREATE INDEX idx_transacciones_categoria ON transacciones(categoria);
CREATE INDEX idx_adelantos_personal_fecha ON adelantos_sueldo(personal_id, fecha);
CREATE INDEX idx_planillas_personal_periodo ON planillas_pago(personal_id, fecha_inicio, fecha_fin);

-- ====================================================================
-- 13. POLÍTICAS RLS (Row Level Security)
-- ====================================================================
ALTER TABLE personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE camiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignacion_ayudantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE adelantos_sueldo ENABLE ROW LEVEL SECURITY;
ALTER TABLE planillas_pago ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios autenticados (Acceso total si el user_id coincide o si autenticado)
CREATE POLICY "Acceso personal autenticados" ON personal
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso camiones autenticados" ON camiones
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso asignaciones autenticados" ON asignaciones_diarias
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso ayudantes autenticados" ON asignacion_ayudantes
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso transacciones autenticados" ON transacciones
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso adelantos autenticados" ON adelantos_sueldo
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Acceso planillas autenticados" ON planillas_pago
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ====================================================================
-- 14. PUBLICACIÓN SUPABASE REALTIME
-- ====================================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    camiones, 
    asignaciones_diarias, 
    asignacion_ayudantes, 
    transacciones, 
    personal;
COMMIT;
