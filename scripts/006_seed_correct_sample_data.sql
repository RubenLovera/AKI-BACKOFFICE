-- Adding sample data with correct field names
INSERT INTO clientes (nombre_completo, numero_documento, foto_documento_url) VALUES
('Juan Carlos Pérez', '12345678', 'https://example.com/docs/juan_cedula.jpg'),
('María Elena González', '87654321', 'https://example.com/docs/maria_cedula.jpg'),
('Carlos Alberto Rodríguez', '11223344', 'https://example.com/docs/carlos_cedula.jpg'),
('Ana Sofía Martínez', '44332211', 'https://example.com/docs/ana_cedula.jpg'),
('Luis Fernando Torres', '55667788', 'https://example.com/docs/luis_cedula.jpg');

INSERT INTO transacciones (monto, cliente_id, referencia_pago, fecha_pago) VALUES
(1000.00, (SELECT id FROM clientes WHERE numero_documento = '12345678'), 'REF001', '2024-01-15'),
(2500.50, (SELECT id FROM clientes WHERE numero_documento = '87654321'), 'REF002', '2024-01-16'),
(750.25, (SELECT id FROM clientes WHERE numero_documento = '11223344'), 'REF003', '2024-01-17'),
(3200.00, (SELECT id FROM clientes WHERE numero_documento = '44332211'), 'REF004', '2024-01-18'),
(1800.75, (SELECT id FROM clientes WHERE numero_documento = '55667788'), 'REF005', '2024-01-19'),
(950.00, (SELECT id FROM clientes WHERE numero_documento = '12345678'), 'REF006', '2024-01-20'),
(4100.25, (SELECT id FROM clientes WHERE numero_documento = '87654321'), 'REF007', '2024-01-21'),
(675.50, (SELECT id FROM clientes WHERE numero_documento = '11223344'), 'REF008', '2024-01-22');
