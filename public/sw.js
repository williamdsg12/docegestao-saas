self.addEventListener("push", function (event) {
  const data = event.data?.json() || { message: "Novo pedido recebido! 🚀" };

  self.registration.showNotification("DoceGestão 🚀", {
    body: data.message,
    icon: "/logo_cupcake.png",
  });
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("/dashboard/pedidos")
  );
});
