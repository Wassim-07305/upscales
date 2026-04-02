// Off-Market Push Notification Service Worker

// Forcer l'activation immediate des nouvelles versions du SW
self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("push", function (event) {
  if (!event.data) return;

  try {
    var payload = event.data.json();

    var options = {
      body: payload.body || "",
      icon: "/logo.png",
      badge: "/logo.png",
      tag: payload.tag || "off-market",
      data: {
        url: payload.url || "/",
      },
      actions: payload.actions || [],
      vibrate: [200, 100, 200],
      requireInteraction: payload.requireInteraction || false,
    };

    event.waitUntil(
      self.registration.showNotification(
        payload.title || "Off Market",
        options,
      ),
    );
  } catch (e) {
    var text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("Off Market", {
        body: text,
        icon: "/logo.png",
      }),
    );
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  var url =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (
            client.url.indexOf(self.location.origin) !== -1 &&
            "focus" in client
          ) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

// Re-enregistrer l'abonnement push quand le navigateur le renouvelle
self.addEventListener("pushsubscriptionchange", function (event) {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(
        event.oldSubscription
          ? event.oldSubscription.options
          : { userVisibleOnly: true },
      )
      .then(function (subscription) {
        return fetch("/api/notifications/push-resubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });
      })
      .catch(function () {
        // Echec silencieux - le prochain login re-souscrira
      }),
  );
});
