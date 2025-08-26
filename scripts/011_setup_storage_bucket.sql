-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('client-documents', 'client-documents', true);

-- Create policies for the bucket
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'client-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public access to files" ON storage.objects
  FOR SELECT USING (bucket_id = 'client-documents');

CREATE POLICY "Allow authenticated users to update files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'client-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete files" ON storage.objects
  FOR DELETE USING (bucket_id = 'client-documents' AND auth.role() = 'authenticated');
