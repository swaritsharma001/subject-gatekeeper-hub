// Service Worker for Push Notifications (StudyX)

// Handle push events
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received');

  event.waitUntil((async () => {
    try {
      // API se latest notification lao
      const res = await fetch('/api/latest-notification');
      const data = await res.json();

      const origin = self.location.origin;

      await self.registration.showNotification(
        data.title || 'StudyX',
        {
          body: data.body || 'New update available',
          icon: origin + (data.icon || '/favicon.png'),
          badge: origin + '/pwa-192x192.png',
          vibrate: [100, 50, 100],
          data: {
            url: data.url || '/',
            dateOfArrival: Date.now(),
          },
          actions: [
            { action: 'open', title: 'Open' },
            { action: 'close', title: 'Dismiss' },
          ],
        }
      );
    } catch (err) {
      console.error('[Service Worker] Push error:', err);

      // Fallback agar API fail ho jaye
      await self.registration.showNotification('StudyX', {
        body: 'New content available',
        icon: self.location.origin + '/favicon.png',
      });
    }
  })());
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Agar koi window already open hai
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Nahi hai to new window open karo
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
