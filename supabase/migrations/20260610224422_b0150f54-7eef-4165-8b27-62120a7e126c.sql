DROP POLICY IF EXISTS "Allow insert from service role" ON public.scans;
DROP POLICY IF EXISTS "Allow select from service role" ON public.scans;
REVOKE ALL ON public.scans FROM anon, authenticated;
GRANT ALL ON public.scans TO service_role;