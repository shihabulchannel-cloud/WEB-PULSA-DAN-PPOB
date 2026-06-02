import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function md5(str: string): string {
  function safeAdd(x: number, y: number) { const l=(x&0xffff)+(y&0xffff); return ((x>>16)+(y>>16)+(l>>16)<<16)|(l&0xffff); }
  function rol(n: number,c: number){ return (n<<c)|(n>>>(32-c)); }
  function cmn(q:number,a:number,b:number,x:number,s:number,t:number){return safeAdd(rol(safeAdd(safeAdd(a,q),safeAdd(x,t)),s),b);}
  function ff(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn((b&c)|(~b&d),a,b,x,s,t);}
  function gg(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn((b&d)|(c&~d),a,b,x,s,t);}
  function hh(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn(b^c^d,a,b,x,s,t);}
  function ii(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cmn(c^(b|~d),a,b,x,s,t);}
  const u=unescape(encodeURIComponent(str));
  const bx:number[]=new Array(Math.ceil((u.length+8+1)/64)*16).fill(0);
  for(let i=0;i<u.length;i++)bx[i>>2]|=u.charCodeAt(i)<<(i%4*8);
  bx[u.length>>2]|=0x80<<(u.length%4*8); bx[bx.length-2]=u.length*8;
  let a=1732584193,bv=-271733879,c=-1732584194,d=271733878;
  for(let i=0;i<bx.length;i+=16){
    const oa=a,ob=bv,oc=c,od=d;
    a=ff(a,bv,c,d,bx[i],7,-680876936);d=ff(d,a,bv,c,bx[i+1],12,-389564586);c=ff(c,d,a,bv,bx[i+2],17,606105819);bv=ff(bv,c,d,a,bx[i+3],22,-1044525330);
    a=ff(a,bv,c,d,bx[i+4],7,-176418897);d=ff(d,a,bv,c,bx[i+5],12,1200080426);c=ff(c,d,a,bv,bx[i+6],17,-1473231341);bv=ff(bv,c,d,a,bx[i+7],22,-45705983);
    a=ff(a,bv,c,d,bx[i+8],7,1770035416);d=ff(d,a,bv,c,bx[i+9],12,-1958414417);c=ff(c,d,a,bv,bx[i+10],17,-42063);bv=ff(bv,c,d,a,bx[i+11],22,-1990404162);
    a=ff(a,bv,c,d,bx[i+12],7,1804603682);d=ff(d,a,bv,c,bx[i+13],12,-40341101);c=ff(c,d,a,bv,bx[i+14],17,-1502002290);bv=ff(bv,c,d,a,bx[i+15],22,1236535329);
    a=gg(a,bv,c,d,bx[i+1],5,-165796510);d=gg(d,a,bv,c,bx[i+6],9,-1069501632);c=gg(c,d,a,bv,bx[i+11],14,643717713);bv=gg(bv,c,d,a,bx[i],20,-373897302);
    a=gg(a,bv,c,d,bx[i+5],5,-701558691);d=gg(d,a,bv,c,bx[i+10],9,38016083);c=gg(c,d,a,bv,bx[i+15],14,-660478335);bv=gg(bv,c,d,a,bx[i+4],20,-405537848);
    a=gg(a,bv,c,d,bx[i+9],5,568446438);d=gg(d,a,bv,c,bx[i+14],9,-1019803690);c=gg(c,d,a,bv,bx[i+3],14,-187363961);bv=gg(bv,c,d,a,bx[i+8],20,1163531501);
    a=gg(a,bv,c,d,bx[i+13],5,-1444681467);d=gg(d,a,bv,c,bx[i+2],9,-51403784);c=gg(c,d,a,bv,bx[i+7],14,1735328473);bv=gg(bv,c,d,a,bx[i+12],20,-1926607734);
    a=hh(a,bv,c,d,bx[i+5],4,-378558);d=hh(d,a,bv,c,bx[i+8],11,-2022574463);c=hh(c,d,a,bv,bx[i+11],16,1839030562);bv=hh(bv,c,d,a,bx[i+14],23,-35309556);
    a=hh(a,bv,c,d,bx[i+1],4,-1530992060);d=hh(d,a,bv,c,bx[i+4],11,1272893353);c=hh(c,d,a,bv,bx[i+7],16,-155497632);bv=hh(bv,c,d,a,bx[i+10],23,-1094730640);
    a=hh(a,bv,c,d,bx[i+13],4,681279174);d=hh(d,a,bv,c,bx[i],11,-358537222);c=hh(c,d,a,bv,bx[i+3],16,-722521979);bv=hh(bv,c,d,a,bx[i+6],23,76029189);
    a=hh(a,bv,c,d,bx[i+9],4,-640364487);d=hh(d,a,bv,c,bx[i+12],11,-421815835);c=hh(c,d,a,bv,bx[i+15],16,530742520);bv=hh(bv,c,d,a,bx[i+2],23,-995338651);
    a=ii(a,bv,c,d,bx[i],6,-198630844);d=ii(d,a,bv,c,bx[i+7],10,1126891415);c=ii(c,d,a,bv,bx[i+14],15,-1416354905);bv=ii(bv,c,d,a,bx[i+5],21,-57434055);
    a=ii(a,bv,c,d,bx[i+12],6,1700485571);d=ii(d,a,bv,c,bx[i+3],10,-1894986606);c=ii(c,d,a,bv,bx[i+10],15,-1051523);bv=ii(bv,c,d,a,bx[i+1],21,-2054922799);
    a=ii(a,bv,c,d,bx[i+8],6,1873313359);d=ii(d,a,bv,c,bx[i+15],10,-30611744);c=ii(c,d,a,bv,bx[i+6],15,-1560198380);bv=ii(bv,c,d,a,bx[i+13],21,1309151649);
    a=ii(a,bv,c,d,bx[i+4],6,-145523070);d=ii(d,a,bv,c,bx[i+11],10,-1120210379);c=ii(c,d,a,bv,bx[i+2],15,718787259);bv=ii(bv,c,d,a,bx[i+9],21,-343485551);
    a=safeAdd(a,oa);bv=safeAdd(bv,ob);c=safeAdd(c,oc);d=safeAdd(d,od);
  }
  const hx='0123456789abcdef';
  return [a,bv,c,d].map(n=>[0,8,16,24].map(s=>hx[(n>>s+4)&0xf]+hx[(n>>s)&0xf]).join('')).join('');
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json();
    const { invoiceNo, amount, customerName, customerEmail, customerPhone, productName, returnUrl } = body;

    if (!invoiceNo || !amount) {
      return new Response(JSON.stringify({ error: "invoiceNo and amount are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: tx } = await supabase.from("transactions").select("id").eq("invoice_no", invoiceNo).maybeSingle();
    if (!tx) return new Response(JSON.stringify({ error: "Invoice tidak ditemukan" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

    const { data: settings } = await supabase.from("settings").select("key, value");
    const cfg = Object.fromEntries((settings || []).map((s: { key: string; value: string }) => [s.key, s.value]));

    const merchantCode = (cfg.duitku_merchant_code || "").trim();
    const apiKey = (cfg.duitku_api_key || "").trim();
    const mode = (cfg.duitku_mode || "sandbox").trim();

    if (!merchantCode || !apiKey) {
      return new Response(JSON.stringify({ error: "Duitku belum dikonfigurasi" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const baseUrl = mode === "production"
      ? "https://passport.duitku.com/webapi/api"
      : "https://sandbox.duitku.com/webapi/api";

    const signature = md5(merchantCode + amount + invoiceNo + apiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";

    const payload = {
      merchantCode, paymentAmount: amount, merchantOrderId: invoiceNo,
      productDetails: productName || "Digital Product",
      email: customerEmail || "", phoneNumber: customerPhone || "",
      additionalParam: "", merchantUserInfo: customerName || "",
      customerVaName: customerName || "Customer",
      callbackUrl: `${supabaseUrl}/functions/v1/duitku-webhook`,
      returnUrl: returnUrl || "", signature, expiryPeriod: 60,
    };

    const response = await fetch(`${baseUrl}/merchant/createinvoice`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (result.statusCode !== "00") {
      return new Response(JSON.stringify({ error: result.statusMessage || "Payment creation failed", detail: result }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    await supabase.from("transactions").update({ payment_reference: result.reference, payment_url: result.paymentUrl }).eq("invoice_no", invoiceNo);

    return new Response(JSON.stringify({ success: true, paymentUrl: result.paymentUrl, reference: result.reference, amount: result.amount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("[duitku-create-payment] error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
