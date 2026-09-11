import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.public.appProxy(request);

  const serviceWorker = `
self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: "Giveitpush",
      body: "You have a new notification.",
    };
  }

  const title = data.title || "Giveitpush";

  const options = {
    body: data.body || "You have a new notification.",
    icon: data.icon || "/favicon.ico",
    badge: data.badge || "/favicon.ico",
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.navigate(url).then(() => client.focus());
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }

      return undefined;
    })
  );
});
`;

  return new Response(serviceWorker, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};