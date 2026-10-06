-- ====================================================================
-- MIGRACIÓN 01: PAGO DE EMPLEADOS CON DESCUENTO AUTOMÁTICO DE ADELANTOS
-- Ejecutar en Supabase > SQL Editor (es seguro ejecutarlo más de una vez)
-- ====================================================================

-- 1. Cada adelanto queda vinculado a la planilla en la que fue descontado.
--    planilla_id NULL  = adelanto pendiente de descontar
--    planilla_id <> NULL = adelanto ya descontado (no se vuelve a descontar)
ALTER TABLE adelantos_sueldo
    ADD COLUMN IF NOT EXISTS planilla_id UUID REFERENCES planillas_pago(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_adelantos_pendientes
    ON adelantos_sueldo(personal_id, fecha) WHERE planilla_id IS NULL;

DROP FUNCTION IF EXISTS calcular_planilla(DATE, DATE, UUID);
DROP FUNCTION IF EXISTS pagar_empleado(UUID, DATE, DATE);

-- 2. Cálculo de planilla para un período.
--    - Días trabajados = fechas DISTINTAS en que el empleado salió a ruta
--      (como chofer o como ayudante de plantilla), excluyendo salidas canceladas.
--    - Adelantos = TODOS los adelantos aún no descontados con fecha <= fin del período
--      (incluye adelantos de semanas anteriores que quedaron pendientes).
--    - saldo_adelanto = parte de los adelantos que el bruto no alcanza a cubrir.
--    - ya_pagado = existe una planilla del empleado que se cruza con el período.
CREATE OR REPLACE FUNCTION calcular_planilla(
    p_inicio DATE,
    p_fin DATE,
    p_personal_id UUID DEFAULT NULL
)
RETURNS TABLE (
    personal_id UUID,
    nombre TEXT,
    rol rol_personal,
    pago_diario NUMERIC,
    dias_trabajados INT,
    monto_bruto NUMERIC,
    total_adelantos NUMERIC,
    monto_neto NUMERIC,
    saldo_adelanto NUMERIC,
    ya_pagado BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
    WITH dias AS (
        SELECT x.pid, COUNT(DISTINCT x.fecha)::INT AS dias
        FROM (
            SELECT ad.chofer_id AS pid, ad.fecha
            FROM asignaciones_diarias ad
            WHERE ad.fecha BETWEEN p_inicio AND p_fin
              AND ad.estado <> 'cancelado'
              AND ad.chofer_id IS NOT NULL
            UNION ALL
            SELECT aa.personal_id AS pid, ad.fecha
            FROM asignacion_ayudantes aa
            JOIN asignaciones_diarias ad ON ad.id = aa.asignacion_id
            WHERE ad.fecha BETWEEN p_inicio AND p_fin
              AND ad.estado <> 'cancelado'
              AND aa.personal_id IS NOT NULL
        ) x
        GROUP BY x.pid
    ),
    adel AS (
        SELECT a.personal_id AS pid, SUM(a.monto) AS total
        FROM adelantos_sueldo a
        WHERE a.planilla_id IS NULL
          AND a.fecha <= p_fin
        GROUP BY a.personal_id
    )
    SELECT
        p.id,
        p.nombre::TEXT,
        p.rol,
        p.pago_diario,
        COALESCE(d.dias, 0),
        COALESCE(d.dias, 0) * p.pago_diario,
        COALESCE(ad.total, 0),
        GREATEST(COALESCE(d.dias, 0) * p.pago_diario - COALESCE(ad.total, 0), 0),
        GREATEST(COALESCE(ad.total, 0) - COALESCE(d.dias, 0) * p.pago_diario, 0),
        EXISTS (
            SELECT 1 FROM planillas_pago pp
            WHERE pp.personal_id = p.id
              AND pp.fecha_inicio <= p_fin
              AND pp.fecha_fin >= p_inicio
        )
    FROM personal p
    LEFT JOIN dias d ON d.pid = p.id
    LEFT JOIN adel ad ON ad.pid = p.id
    WHERE p.activo
      AND (p_personal_id IS NULL OR p.id = p_personal_id)
    ORDER BY p.nombre;
$$;

-- 3. Pagar a un empleado (operación atómica: todo o nada).
--    a) Recalcula en el servidor (no confía en montos enviados por el cliente).
--    b) Crea la planilla en estado 'pagado' con fecha de liquidación.
--    c) Marca los adelantos pendientes como descontados en esa planilla.
--    d) Si los adelantos superan el bruto, crea un adelanto con el saldo restante
--       para descontarlo en el siguiente período (no se pierde dinero).
CREATE OR REPLACE FUNCTION pagar_empleado(
    p_personal_id UUID,
    p_inicio DATE,
    p_fin DATE
)
RETURNS planillas_pago
LANGUAGE plpgsql
AS $$
DECLARE
    c RECORD;
    v_planilla planillas_pago;
BEGIN
    IF p_fin < p_inicio THEN
        RAISE EXCEPTION 'La fecha fin no puede ser anterior a la fecha de inicio';
    END IF;

    -- Bloquear al empleado para evitar dos pagos simultáneos
    PERFORM 1 FROM personal WHERE id = p_personal_id FOR UPDATE;

    SELECT * INTO c FROM calcular_planilla(p_inicio, p_fin, p_personal_id);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Empleado no encontrado o inactivo';
    END IF;

    IF c.ya_pagado THEN
        RAISE EXCEPTION 'Este empleado ya tiene una planilla registrada que se cruza con el período % al %', p_inicio, p_fin;
    END IF;

    IF c.dias_trabajados = 0 THEN
        RAISE EXCEPTION 'El empleado no tiene días trabajados en el período % al %', p_inicio, p_fin;
    END IF;

    INSERT INTO planillas_pago (
        personal_id, fecha_inicio, fecha_fin, dias_trabajados, pago_diario,
        monto_bruto, total_adelantos, monto_neto, estado, fecha_liquidacion, user_id
    ) VALUES (
        p_personal_id, p_inicio, p_fin, c.dias_trabajados, c.pago_diario,
        c.monto_bruto,
        c.total_adelantos - c.saldo_adelanto,  -- monto realmente descontado
        c.monto_neto,
        'pagado', NOW(), auth.uid()
    )
    RETURNING * INTO v_planilla;

    -- Marcar adelantos como descontados
    UPDATE adelantos_sueldo
       SET planilla_id = v_planilla.id
     WHERE personal_id = p_personal_id
       AND planilla_id IS NULL
       AND fecha <= p_fin;

    -- Arrastrar saldo no cubierto al siguiente período
    IF c.saldo_adelanto > 0 THEN
        INSERT INTO adelantos_sueldo (personal_id, fecha, monto, motivo, user_id)
        VALUES (
            p_personal_id,
            p_fin + 1,
            c.saldo_adelanto,
            'Saldo de adelantos no cubierto por la planilla ' || p_inicio || ' al ' || p_fin,
            auth.uid()
        );
    END IF;

    RETURN v_planilla;
END;
$$;
