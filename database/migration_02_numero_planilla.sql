-- ====================================================================
-- MIGRACIÓN 02: AGREGAR NÚMERO / FOLIO A PLANILLAS DE CAMIONES
-- Ejecutar en Supabase > SQL Editor
-- ====================================================================

-- 1. Agregar columna numero_planilla si no existe
ALTER TABLE asignaciones_diarias
    ADD COLUMN IF NOT EXISTS numero_planilla VARCHAR(50);

-- 2. Crear índice de búsqueda rápida por número de planilla
CREATE INDEX IF NOT EXISTS idx_asignaciones_numero_planilla
    ON asignaciones_diarias(numero_planilla);

-- 3. Autogenerar número de planilla para registros existentes que no tengan uno
UPDATE asignaciones_diarias
SET numero_planilla = 'PLN-' || TO_CHAR(fecha, 'YYYYMMDD') || '-' || UPPER(SUBSTRING(id::text FROM 1 FOR 4))
WHERE numero_planilla IS NULL OR LENGTH(TRIM(numero_planilla)) = 0;
