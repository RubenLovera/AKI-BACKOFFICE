-- Add estado column to transacciones table
-- This script adds transaction status functionality to AKI Transfer

-- Create enum type for transaction status
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('CREADA', 'PAGO RECIBIDO', 'COMPLETADA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add estado column to transacciones table
ALTER TABLE transacciones 
ADD COLUMN IF NOT EXISTS estado transaction_status DEFAULT 'CREADA';

-- Update existing transactions to have default status
UPDATE transacciones 
SET estado = 'CREADA' 
WHERE estado IS NULL;

-- Make the column NOT NULL
ALTER TABLE transacciones 
ALTER COLUMN estado SET NOT NULL;

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_transacciones_estado ON transacciones(estado);

-- Add comment to document the column
COMMENT ON COLUMN transacciones.estado IS 'Estado de la transacción: CREADA (inicial), PAGO RECIBIDO (pago confirmado), COMPLETADA (liquidada)';
