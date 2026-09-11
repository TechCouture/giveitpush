import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const body = await request.json();

  console.log("Giveitpush subscription received:", {
    shop: session?.shop,
    subscription: body.subscription,
  });

  return new Response(
    JSON.stringify({
      success: true,
      shop: session?.shop,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};