-- Create purchase_documents table for AI Invoice Import
CREATE TABLE IF NOT EXISTS public.purchase_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    company_id UUID, -- For multi-tenancy
    tenant_id UUID,  -- For multi-tenancy
    image_url TEXT,
    extracted_text TEXT,
    parsed_json JSONB,
    total_amount NUMERIC(15, 2),
    supplier TEXT,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending', -- pending, processed, error
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.purchase_documents ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies (basic version, assuming user can only see their own company's docs)
-- Note: Replace with actual business logic if needed
CREATE POLICY "Users can see their own company purchase documents" 
ON public.purchase_documents 
FOR SELECT 
USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can insert their own company purchase documents" 
ON public.purchase_documents 
FOR INSERT 
WITH CHECK (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
));
