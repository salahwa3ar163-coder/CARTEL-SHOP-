// Optional Supabase Edge Function. Configure RESEND_API_KEY and STORE_OWNER_EMAIL
// as Supabase Function secrets, then invoke from a database webhook on orders INSERT.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const secret = Deno.env.get("ORDER_WEBHOOK_SECRET");
  if (secret && req.headers.get("x-webhook-secret") !== secret) return new Response("Unauthorized", { status: 401 });
  const order = await req.json();
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const owner = Deno.env.get("STORE_OWNER_EMAIL");
  if (!apiKey || !owner) return new Response(JSON.stringify({error:"Missing RESEND_API_KEY or STORE_OWNER_EMAIL"}), {status:500});
  const html = `<h2>New CARTEL order: ${order.order_number}</h2>
    <p><b>Customer:</b> ${order.customer_name}<br><b>Phone:</b> ${order.phone}<br><b>Email:</b> ${order.email}<br>
    <b>City:</b> ${order.city}<br><b>Address:</b> ${order.address}</p>
    <h3>Order total: ${order.total} MAD</h3><pre>${JSON.stringify(order.items,null,2)}</pre>`;
  const result = await fetch("https://api.resend.com/emails", {
    method:"POST", headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},
    body:JSON.stringify({from:"CARTEL Store <orders@your-verified-domain.com>",to:[owner],subject:`New CARTEL order ${order.order_number}`,html})
  });
  const data = await result.json();
  return new Response(JSON.stringify(data), {status:result.status,headers:{"Content-Type":"application/json"}});
});
