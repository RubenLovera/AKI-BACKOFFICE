-- Recrear completamente el ENUM de estados de transacciones
-- para incluir CANCELADA y solucionar el error

-- Primero, agregar una columna temporal con el nuevo tipo
DO $$ 
BEGIN
    -- Crear el nuevo tipo ENUM con todos los valores
    DROP TYPE IF EXISTS transaction_status_new CASCADE;
    CREATE TYPE transaction_status_new AS ENUM (
        'CREADA',
        'PAGO RECIBIDO', 
        'COMPLETADA',
        'CANCELADA'
    );
    
    -- Agregar columna temporal con el nuevo tipo
    ALTER TABLE transacciones ADD COLUMN estado_new transaction_status_new;
    
    -- Migrar datos existentes
    UPDATE transacciones SET estado_new = estado::text::transaction_status_new;
    
    -- Eliminar la columna antigua
    ALTER TABLE transacciones DROP COLUMN estado;
    
    -- Renombrar la columna nueva
    ALTER TABLE transacciones RENAME COLUMN estado_new TO estado;
    
    -- Eliminar el tipo antiguo y renombrar el nuevo
    DROP TYPE IF EXISTS transaction_status CASCADE;
    ALTER TYPE transaction_status_new RENAME TO transaction_status;
    
    -- Establecer valor por defecto
    ALTER TABLE transacciones ALTER COLUMN estado SET DEFAULT 'CREADA';
    
    -- Agregar constraint NOT NULL
    ALTER TABLE transacciones ALTER COLUMN estado SET NOT NULL;
    
END $$;

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_transacciones_estado ON transacciones(estado);

-- Verificar que todo funcionó correctamente
SELECT DISTINCT estado FROM transacciones;
