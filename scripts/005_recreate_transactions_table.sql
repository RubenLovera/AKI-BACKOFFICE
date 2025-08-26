-- Creating transactions table with correct calculated fields as requested
CREATE TABLE transacciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    monto DECIMAL(12,2) NOT NULL,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    referencia_pago TEXT NOT NULL,
    fecha_pago DATE NOT NULL,
    monto_pagar DECIMAL(12,2) GENERATED ALWAYS AS (monto * 0.93) STORED, -- monto - 7%
    monto_menos_costo DECIMAL(12,2) GENERATED ALWAYS AS (monto * 0.99) STORED, -- monto - 1%
    costo_proveedor DECIMAL(12,2) GENERATED ALWAYS AS (monto * 0.01) STORED, -- 1% del monto
    revenue_bruto DECIMAL(12,2) GENERATED ALWAYS AS ((monto * 0.93) - (monto * 0.99)) STORED, -- monto_pagar - monto_menos_costo
    revenue_neto DECIMAL(12,2) GENERATED ALWAYS AS (((monto * 0.93) - (monto * 0.99)) / 2) STORED, -- revenue_bruto / 2
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_transacciones_updated_at 
    BEFORE UPDATE ON transacciones 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_transacciones_cliente_id ON transacciones(cliente_id);
CREATE INDEX idx_transacciones_fecha_pago ON transacciones(fecha_pago);
