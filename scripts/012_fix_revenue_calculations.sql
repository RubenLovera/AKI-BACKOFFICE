-- Script para corregir las fórmulas de revenue que estaban dando valores negativos

-- Eliminar la tabla existente y recrearla con las fórmulas correctas
DROP TABLE IF EXISTS transacciones CASCADE;

-- Recrear tabla transacciones con fórmulas de revenue corregidas
CREATE TABLE transacciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    monto DECIMAL(12,2) NOT NULL,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    referencia_pago TEXT NOT NULL,
    fecha_pago DATE NOT NULL,
    monto_pagar DECIMAL(12,2) GENERATED ALWAYS AS (monto * 0.93) STORED, -- monto - 7%
    monto_menos_costo DECIMAL(12,2) GENERATED ALWAYS AS (monto * 0.99) STORED, -- monto - 1%
    costo_proveedor DECIMAL(12,2) GENERATED ALWAYS AS (monto * 0.01) STORED, -- 1% del monto
    -- Corrigiendo fórmula de revenue_bruto: debe ser 6% del monto (7% - 1%)
    revenue_bruto DECIMAL(12,2) GENERATED ALWAYS AS (monto * 0.06) STORED, -- 6% del monto original
    -- Corrigiendo fórmula de revenue_neto: debe ser 3% del monto (revenue_bruto / 2)
    revenue_neto DECIMAL(12,2) GENERATED ALWAYS AS (monto * 0.03) STORED, -- 3% del monto original
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recrear índices
CREATE INDEX idx_transacciones_cliente_id ON transacciones(cliente_id);
CREATE INDEX idx_transacciones_fecha_pago ON transacciones(fecha_pago);

-- Recrear trigger para updated_at
CREATE TRIGGER update_transacciones_updated_at BEFORE UPDATE ON transacciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;

-- Recrear política de RLS
CREATE POLICY "Allow all operations on transacciones" ON transacciones FOR ALL USING (true);
