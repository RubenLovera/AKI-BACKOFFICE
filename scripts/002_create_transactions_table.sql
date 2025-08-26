-- Create transactions table for AKI Transfer
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('send', 'receive', 'exchange')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Amounts and currencies
  amount_origin DECIMAL(15,2) NOT NULL,
  currency_origin TEXT NOT NULL DEFAULT 'VES',
  amount_destination DECIMAL(15,2) NOT NULL,
  currency_destination TEXT NOT NULL DEFAULT 'USD',
  exchange_rate DECIMAL(10,4),
  
  -- Fees and costs
  fee_amount DECIMAL(10,2) DEFAULT 0,
  cost_amount DECIMAL(10,2) DEFAULT 0,
  net_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Payment methods
  payment_method_origin TEXT CHECK (payment_method_origin IN ('bank_transfer', 'cash', 'zelle', 'paypal', 'crypto')),
  payment_method_destination TEXT CHECK (payment_method_destination IN ('bank_transfer', 'cash', 'zelle', 'paypal', 'crypto')),
  
  -- Reference numbers
  reference_number TEXT UNIQUE NOT NULL,
  external_reference TEXT,
  
  -- Additional data
  notes TEXT,
  processed_by TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for transactions table
CREATE POLICY "Allow authenticated users to view transactions" 
  ON public.transactions FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert transactions" 
  ON public.transactions FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update transactions" 
  ON public.transactions FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete transactions" 
  ON public.transactions FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON public.transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON public.transactions(reference_number);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
