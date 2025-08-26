-- Limpiar todos los datos de ejemplo de las tablas
-- Esto dejará las tablas vacías para mostrar ceros en el dashboard

-- Eliminar todas las transacciones
DELETE FROM transacciones;

-- Eliminar todos los clientes
DELETE FROM clientes;

-- Reiniciar los contadores de secuencia si es necesario
-- (Esto asegura que los próximos IDs empiecen desde 1)
