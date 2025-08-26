-- Adding CANCELADA status to existing transaction_status enum
ALTER TYPE transaction_status ADD VALUE 'CANCELADA';

-- Add index for the new status for better query performance
CREATE INDEX IF NOT EXISTS idx_transacciones_estado_cancelada 
ON transacciones (estado) 
WHERE estado = 'CANCELADA';
