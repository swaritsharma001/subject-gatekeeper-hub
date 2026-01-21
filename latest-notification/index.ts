import { serve } from "https://deno.land/std/http/server.ts";

serve(async () => {
  return new Response(
    JSON.stringify({
      title: "New Lecture Available! 📚",
      body: "Physics Chapter 5 uploaded",
      icon: "/pwa-192x192.png",
      url: "/subject/physics"
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
});
