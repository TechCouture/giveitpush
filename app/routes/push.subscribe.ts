import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

type PushSubscriptionPayload = {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
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

  const { session } = await authenticate.public.appProxy(request);

  const shop = session?.shop;

  if (!shop) {
    return new Response(
      JSON.stringify({ error: "Unable to identify Shopify store" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  let body: {
    subscription?: PushSubscriptionPayload;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const subscription = body.subscription;

  const endpoint =
    typeof subscription?.endpoint === "string"
      ? subscription.endpoint
      : null;

  const p256dh =
    typeof subscription?.keys?.p256dh === "string"
      ? subscription.keys.p256dh
      : null;

  const auth =
    typeof subscription?.keys?.auth === "string"
      ? subscription.keys.auth
      : null;

  if (!endpoint || !p256dh || !auth) {
    return new Response(
      JSON.stringify({
        error: "Invalid push subscription",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const savedSubscription = await prisma.pushSubscription.upsert({
    where: {
      shop_endpoint: {
        shop,
        endpoint,
      },
    },
    update: {
      p256dh,
      auth,
      updatedAt: new Date(),
    },
    create: {
      shop,
      endpoint,
      p256dh,
      auth,
    },
  });

  console.log("Giveitpush subscription saved:", {
    id: savedSubscription.id,
    shop,
  });

  return new Response(
    JSON.stringify({
      success: true,
      shop,
      subscriptionId: savedSubscription.id,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};