-- Datos de ejemplo con la nueva estructura de tablas

-- Insertar clientes de ejemplo
INSERT INTO clientes (nombre_completo, numero_documento, foto_documento_url) VALUES
('María González Rodríguez', '12345678', 'https://example.com/docs/maria.jpg'),
('Carlos Alberto Mendoza', '87654321', 'https://example.com/docs/carlos.jpg'),
('Ana Patricia Silva', '11223344', 'https://example.com/docs/ana.jpg'),
('Roberto José Herrera', '44332211', 'https://example.com/docs/roberto.jpg'),
('Lucía Fernanda Torres', '55667788', 'https://example.com/docs/lucia.jpg'),
('Diego Alejandro Ruiz', '88776655', 'https://example.com/docs/diego.jpg'),
('Carmen Elena Vásquez', '99887766', 'https://example.com/docs/carmen.jpg'),
('Fernando Luis Castro', '66778899', 'https://example.com/docs/fernando.jpg');

-- Insertar transacciones de ejemplo
INSERT INTO transacciones (monto, cliente_id, referencia_pago, fecha_pago) VALUES
(1500.00, (SELECT id FROM clientes WHERE numero_documento = '12345678'), 'REF001', '2024-01-15'),
(2300.50, (SELECT id FROM clientes WHERE numero_documento = '87654321'), 'REF002', '2024-01-16'),
(850.75, (SELECT id FROM clientes WHERE numero_documento = '11223344'), 'REF003', '2024-01-17'),
(3200.00, (SELECT id FROM clientes WHERE numero_documento = '44332211'), 'REF004', '2024-01-18'),
(1750.25, (SELECT id FROM clientes WHERE numero_documento = '55667788'), 'REF005', '2024-01-19'),
(4100.80, (SELECT id FROM clientes WHERE numero_documento = '88776655'), 'REF006', '2024-01-20'),
(950.00, (SELECT id FROM clientes WHERE numero_documento = '99887766'), 'REF007', '2024-01-21'),
(2800.60, (SELECT id FROM clientes WHERE numero_documento = '66778899'), 'REF008', '2024-01-22'),
(1200.00, (SELECT id FROM clientes WHERE numero_documento = '12345678'), 'REF009', '2024-01-23'),
(3500.75, (SELECT id FROM clientes WHERE numero_documento = '87654321'), 'REF010', '2024-01-24');
