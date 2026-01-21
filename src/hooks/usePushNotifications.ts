import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// VAPID public key can be provided at build-time, but we also fetch it from the backend as fallback
const VAPID_PUBLIC_KEY_ENV = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [vapidPublicKey, setVapidPublicKey] = useState<string>(VAPID_PUBLIC_KEY_ENV);

  const loadVapidKey = useCallback(async () => {
    if (vapidPublicKey) return vapidPublicKey;

    try {
      const { data, error } = await supabase.functions.invoke('vapid-public-key');
      if (error) throw error;

      const key = (data as any)?.publicKey as string | undefined;
      if (key) {
        setVapidPublicKey(key);
        return key;
      }
    } catch (e) {
      console.error('Failed to load VAPID public key:', e);
    }

    return '';
  }, [vapidPublicKey]);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
      // ensure we have a key early
      void loadVapidKey();
    }
  }, []);

  const getPushRegistration = async () => {
    // IMPORTANT:
    // The PWA (vite-plugin-pwa) also registers a service worker at scope '/'.
    // Only one SW can control a given scope, so registering our push SW at '/'
    // can be replaced by the PWA SW later (breaking push delivery).
    //
    // Fix: Register the push SW under a dedicated scope that doesn't conflict.
    const PUSH_SCOPE = '/push/';

    const existing = await navigator.serviceWorker.getRegistration(PUSH_SCOPE);
    if (existing?.active?.scriptURL?.includes('sw-push.js')) {
      return existing;
    }

    const reg = await navigator.serviceWorker.register('/sw-push.js', { scope: PUSH_SCOPE });
    await navigator.serviceWorker.ready;
    return reg;
  };

  const checkSubscription = async () => {
    try {
      const registration = await getPushRegistration();
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      console.error('Push notifications not supported');
      return false;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);

      if (newPermission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      const key = await loadVapidKey();
      if (!key) {
        console.error('Missing VAPID public key');
        return false;
      }

      // Get (or register) service worker registration
      const registration = await getPushRegistration();

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      // Send subscription to backend
      const { error } = await supabase.functions.invoke('push-subscribe', {
        body: {
          subscription: subscription.toJSON(),
          action: 'subscribe',
        },
      });

      if (error) {
        console.error('Error saving subscription:', error);
        throw error;
      }

      setIsSubscribed(true);
      console.log('Push subscription successful');
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, loadVapidKey]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);

    try {
      const registration = await getPushRegistration();
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe();

        // Remove from backend
        await supabase.functions.invoke('push-subscribe', {
          body: {
            subscription: subscription.toJSON(),
            action: 'unsubscribe',
          },
        });
      }

      setIsSubscribed(false);
      console.log('Push unsubscribe successful');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
  };
};
