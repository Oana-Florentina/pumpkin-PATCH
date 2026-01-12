export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('Notification permission denied');
    return null;
  }

  // Register service worker
  const registration = await navigator.serviceWorker.register('/service-worker.js');
  
  // Subscribe to push
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      'BEl62iUYgUivxIkv69yViEuiBIa-Ib27SAwzV1_FGcmCITzDKAkMu3rWfuj3CDZuyKDWi-3IgfK-twEF6fjadc-c'
    )
  });

  return subscription;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function sendTestNotification() {
  if (Notification.permission === 'granted') {
    new Notification('PhoA Test', {
      body: 'Notifications are working!',
      icon: '/logo192.png'
    });
  }
}
