-- Insert sample clients
INSERT INTO public.clients (full_name, email, phone, document_type, document_number, address, city, country) VALUES
('María González', 'maria.gonzalez@email.com', '+58-412-1234567', 'cedula', 'V-12345678', 'Av. Principal, Caracas', 'Caracas', 'Venezuela'),
('Carlos Rodríguez', 'carlos.rodriguez@email.com', '+58-414-2345678', 'cedula', 'V-23456789', 'Calle 5, Maracaibo', 'Maracaibo', 'Venezuela'),
('Ana Martínez', 'ana.martinez@email.com', '+58-416-3456789', 'cedula', 'V-34567890', 'Av. Bolívar, Valencia', 'Valencia', 'Venezuela'),
('Luis Pérez', 'luis.perez@email.com', '+58-424-4567890', 'cedula', 'V-45678901', 'Calle Real, Barquisimeto', 'Barquisimeto', 'Venezuela'),
('Carmen Silva', 'carmen.silva@email.com', '+58-426-5678901', 'cedula', 'V-56789012', 'Av. Universidad, Mérida', 'Mérida', 'Venezuela')
ON CONFLICT (email) DO NOTHING;

-- Insert sample transactions
INSERT INTO public.transactions (
  client_id, 
  transaction_type, 
  status, 
  amount_origin, 
  currency_origin, 
  amount_destination, 
  currency_destination, 
  exchange_rate,
  fee_amount,
  cost_amount,
  net_revenue,
  payment_method_origin,
  payment_method_destination,
  reference_number,
  notes
) 
SELECT 
  c.id,
  'send',
  CASE 
    WHEN random() < 0.7 THEN 'completed'
    WHEN random() < 0.9 THEN 'processing'
    ELSE 'pending'
  END,
  (random() * 5000 + 100)::DECIMAL(15,2),
  'VES',
  (random() * 100 + 10)::DECIMAL(15,2),
  'USD',
  (random() * 10 + 35)::DECIMAL(10,4),
  (random() * 50 + 5)::DECIMAL(10,2),
  (random() * 20 + 2)::DECIMAL(10,2),
  (random() * 30 + 10)::DECIMAL(10,2),
  CASE WHEN random() < 0.5 THEN 'bank_transfer' ELSE 'cash' END,
  CASE WHEN random() < 0.6 THEN 'zelle' ELSE 'bank_transfer' END,
  'AKI-' || LPAD((random() * 999999)::INT::TEXT, 6, '0'),
  'Transacción de prueba'
FROM public.clients c
CROSS JOIN generate_series(1, 3)
ON CONFLICT (reference_number) DO NOTHING;

-- Add some additional random transactions
INSERT INTO public.transactions (
  client_id, 
  transaction_type, 
  status, 
  amount_origin, 
  currency_origin, 
  amount_destination, 
  currency_destination, 
  exchange_rate,
  fee_amount,
  cost_amount,
  net_revenue,
  payment_method_origin,
  payment_method_destination,
  reference_number,
  notes
) 
SELECT 
  (SELECT id FROM public.clients ORDER BY random() LIMIT 1),
  CASE WHEN random() < 0.8 THEN 'send' ELSE 'receive' END,
  CASE 
    WHEN random() < 0.6 THEN 'completed'
    WHEN random() < 0.8 THEN 'processing'
    ELSE 'pending'
  END,
  (random() * 8000 + 200)::DECIMAL(15,2),
  'VES',
  (random() * 150 + 20)::DECIMAL(15,2),
  'USD',
  (random() * 5 + 36)::DECIMAL(10,4),
  (random() * 80 + 10)::DECIMAL(10,2),
  (random() * 30 + 5)::DECIMAL(10,2),
  (random() * 50 + 15)::DECIMAL(10,2),
  CASE 
    WHEN random() < 0.3 THEN 'bank_transfer'
    WHEN random() < 0.6 THEN 'cash'
    ELSE 'zelle'
  END,
  CASE 
    WHEN random() < 0.4 THEN 'zelle'
    WHEN random() < 0.7 THEN 'bank_transfer'
    ELSE 'paypal'
  END,
  'AKI-' || LPAD((random() * 999999)::INT::TEXT, 6, '0'),
  'Transacción adicional de prueba'
FROM generate_series(1, 10)
ON CONFLICT (reference_number) DO NOTHING;
