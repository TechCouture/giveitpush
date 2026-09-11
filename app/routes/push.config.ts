import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.public.appProxy(request);

  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return new Response(
      JSON.stringify({ error: "VAPID public key is not configured" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  return new Response(JSON.stringify({ publicKey }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
};