-- Agregar columna calculada de liquidación a la tabla transacciones
-- liquidación = revenue_neto + monto_pagar

ALTER TABLE transacciones 
ADD COLUMN liquidacion DECIMAL(10,2) GENERATED ALWAYS AS (
  (monto * 0.03) + (monto * 0.93)
) STORED;

-- Comentario para claridad
COMMENT ON COLUMN transacciones.liquidacion IS 'Liquidación calculada: revenue_neto + monto_pagar';
