-- Script completo para limpiar y recrear la base de datos con la estructura exacta solicitada

-- Eliminar tablas existentes si existen
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS transacciones CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;

-- Crear tabla clientes con la estructura exacta solicitada
CREATE TABLE clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre_completo TEXT NOT NULL,
    numero_documento TEXT UNIQUE NOT NULL,
    foto_documento_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla transacciones con la estructura exacta solicitada
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

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_clientes_numero_documento ON clientes(numero_documento);
CREATE INDEX idx_transacciones_cliente_id ON transacciones(cliente_id);
CREATE INDEX idx_transacciones_fecha_pago ON transacciones(fecha_pago);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transacciones_updated_at BEFORE UPDATE ON transacciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de RLS (permitir todo por ahora, se puede restringir después)
CREATE POLICY "Allow all operations on clientes" ON clientes FOR ALL USING (true);
CREATE POLICY "Allow all operations on transacciones" ON transacciones FOR ALL USING (true);
