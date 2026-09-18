import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useActionData,
  useLoaderData,
} from "react-router";

import webpush from "web-push";

import { authenticate } from "../shopify.server";
import prisma from "../db.server";

type ActionData =
  | {
      success: true;
      sent: number;
      failed: number;
    }
  | {
      success: false;
      error: string;
    };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const subscriberCount = await prisma.pushSubscription.count({
    where: {
      shop: session.shop,
    },
  });

  return {
    subscriberCount,
  };
};

export const action = async ({
  request,
}: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const shop = session.shop;

  const formData = await request.formData();

  const title =
    String(
      formData.get("title") ||
        "Giveitpush Test Notification",
    ).trim();

  const message =
    String(
      formData.get("message") ||
        "Your Giveitpush browser notifications are working!",
    ).trim();

  if (!process.env.VAPID_PUBLIC_KEY) {
    return Response.json(
      {
        success: false,
        error: "VAPID public key is missing.",
      } satisfies ActionData,
      { status: 500 },
    );
  }

  if (!process.env.VAPID_PRIVATE_KEY) {
    return Response.json(
      {
        success: false,
        error: "VAPID private key is missing.",
      } satisfies ActionData,
      { status: 500 },
    );
  }

  if (!process.env.VAPID_SUBJECT) {
    return Response.json(
      {
        success: false,
        error: "VAPID subject is missing.",
      } satisfies ActionData,
      { status: 500 },
    );
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );

  const subscriptions =
    await prisma.pushSubscription.findMany({
      where: {
        shop,
      },
    });

  let sent = 0;
  let failed = 0;

  for (const item of subscriptions) {
    const pushSubscription = {
      endpoint: item.endpoint,
      keys: {
        p256dh: item.p256dh,
        auth: item.auth,
      },
    };

    try {
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify({
          title,
          body: message,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          url: "/",
        }),
      );

      sent += 1;
    } catch (error: any) {
      failed += 1;

      console.error("Giveitpush push failed:", {
        subscriptionId: item.id,
        shop,
        statusCode: error?.statusCode,
        message: error?.message,
      });

      // Remove subscriptions that the push provider
      // confirms are no longer valid.
      if (
        error?.statusCode === 404 ||
        error?.statusCode === 410
      ) {
        await prisma.pushSubscription.delete({
          where: {
            id: item.id,
          },
        });
      }
    }
  }

  return Response.json({
    success: true,
    sent,
    failed,
  } satisfies ActionData);
};

export default function PushNotifications() {
  const { subscriberCount } =
    useLoaderData<typeof loader>();

  const actionData =
    useActionData<ActionData>();

  return (
    <s-page heading="Push Notifications">

      <s-section heading="Browser subscribers">
        <s-paragraph>
          Current subscribers:{" "}
          <strong>{subscriberCount}</strong>
        </s-paragraph>
      </s-section>

      <s-section heading="Send test notification">

        <Form method="post">

          <s-text-field
            label="Notification title"
            name="title"
            value="Giveitpush Test Notification"
          />

          <s-text-field
            label="Notification message"
            name="message"
            value="Your Giveitpush browser notifications are working!"
          />

          <div style={{ marginTop: "16px" }}>
            <s-button
              variant="primary"
              type="submit"
            >
              Send Test Push
            </s-button>
          </div>

        </Form>

      </s-section>

      {actionData?.success && (
        <s-banner tone="success">
          Push completed. Sent: {actionData.sent}.
          Failed: {actionData.failed}.
        </s-banner>
      )}

      {actionData && !actionData.success && (
        <s-banner tone="critical">
          {actionData.error}
        </s-banner>
      )}

    </s-page>
  );
}