import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ApplicationServer, PushMessageError } from "jsr:@negrel/webpush@0.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody = {
  title?: string;
  body?: string;
  icon?: string;
  url?: string;
  endpoint?: string;
};

function base64UrlToBytes(input: string): Uint8Array {
  const padding = "=".repeat((4 - (input.length % 4)) % 4);
  const base64 = (input + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function importVapidKeyPair(vapidPublicKeyB64Url: string, vapidPrivateKeyB64Url: string) {
  // VAPID public key is the uncompressed P-256 point: 65 bytes => 0x04 || X(32) || Y(32)
  const pub = base64UrlToBytes(vapidPublicKeyB64Url);
  if (pub.length !== 65 || pub[0] !== 0x04) {
    throw new Error("Invalid VAPID public key format");
  }

  const x = pub.slice(1, 33);
  const y = pub.slice(33, 65);

  const publicJwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x: bytesToBase64Url(x),
    y: bytesToBase64Url(y),
    ext: true,
  };

  const privateJwk: JsonWebKey = {
    ...publicJwk,
    d: vapidPrivateKeyB64Url,
    key_ops: ["sign"],
  };

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    publicJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"],
  );

  const privateKey = await crypto.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"],
  );

  return { publicKey, privateKey };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, body, icon, url, endpoint }: ReqBody = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const baseQuery = supabase
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth");

    const { data: subscriptions, error: subErr } = endpoint
      ? await baseQuery.eq("endpoint", endpoint)
      : await baseQuery;

    if (subErr) {
      console.error("Error fetching subscriptions:", subErr);
      throw subErr;
    }

    console.log(`Sending push to ${subscriptions?.length || 0} subscribers`);

    const vapidKeys = await importVapidKeyPair(vapidPublicKey, vapidPrivateKey);

    const appServer = new ApplicationServer({
      contactInformation: "mailto:admin@studyx.app",
      // The library expects a CryptoKeyPair for both `keys` and `vapidKeys`.
      // Our VAPID keys are imported above.
      keys: vapidKeys,
      vapidKeys,
    });

    const payload = {
      title: title || "StudyX",
      body: body || "New content available!",
      icon: icon || "/pwa-192x192.png",
      url: url || "/",
    };

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions || []) {
      try {
        const subscriber = appServer.subscribe({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        });

        await subscriber.pushTextMessage(JSON.stringify(payload), {
          ttl: 60,
        });

        sent++;
      } catch (e) {
        failed++;
        console.error("Error sending to subscription:", e);

        // If push service indicates the subscription is gone, delete it.
        if (e instanceof PushMessageError && e.isGone()) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    }

    console.log(`Push results: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        total: subscriptions?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Send push error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

