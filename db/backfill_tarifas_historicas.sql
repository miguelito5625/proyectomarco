-- ==========================================
-- SCRIPT: backfill_tarifas_historicas.sql
-- Propósito: Congelar las tarifas de los 183 registros históricos de registros_tiempo
-- que tenían tarifa_regular, tarifa_extra y tarifa_sabado en NULL, evitando
-- alteraciones retroactivas ante futuros cambios en trabajadores.
-- ==========================================

UPDATE registros_tiempo rt
SET 
    tarifa_regular = t.pago_hora_regular,
    tarifa_extra = t.pago_hora_extra,
    tarifa_sabado = t.pago_sabado
FROM trabajadores t
WHERE rt.trabajador_id = t.id
  AND (rt.tarifa_regular IS NULL OR rt.tarifa_extra IS NULL OR rt.tarifa_sabado IS NULL);
