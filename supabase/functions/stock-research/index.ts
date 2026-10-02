// Supabase edge function: server-side data proxy for the Stock Research page.
// Keeps API keys out of the browser and works around missing CORS headers on
// SEC EDGAR / FRED. See supabase/functions/_shared/researchProxy.ts.
//
// Secrets (Supabase dashboard -> Edge Functions -> Secrets, or via Lovable):
//   SEC_USER_AGENT   required for SEC EDGAR, e.g. "InvesTech.AI you@yourdomain.com"
//   FINNHUB_API_KEY  optional, free at https://finnhub.io/register
//   FRED_API_KEY     optional, free at https://fred.stlouisfed.org/docs/api/api_key.html
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleResearchRequest } from "../_shared/researchProxy.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    // handled below as a malformed request
  }
  const result = await handleResearchRequest(body as never, (name) => Deno.env.get(name));
  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
