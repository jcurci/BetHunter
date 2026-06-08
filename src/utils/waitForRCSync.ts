import { useSubscriptionStore } from '../storage/subscriptionStore';

/**
 * After Purchases.logIn(), the SDK returns cached (possibly empty) customer
 * info synchronously and fires the update listener 1-3 s later once it gets
 * a fresh response from the RevenueCat server.
 *
 * Hold the caller (loading screen / "Entrando..." spinner) until that fresh
 * response arrives, so the Home-vs-Paywall routing decision is always based
 * on server-confirmed subscription status rather than stale cache.
 *
 * Exits early if isPremium is already true (cached logIn() was correct).
 * Falls back via timeout so the loading screen never stalls indefinitely.
 */
export function waitForRCSync(maxWaitMs = 3000): Promise<void> {
  if (useSubscriptionStore.getState().isPremium) return Promise.resolve();

  return new Promise<void>((resolve) => {
    let resolved = false;

    const finish = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      unsub();
      resolve();
    };

    const timer = setTimeout(finish, maxWaitMs);

    // The next store update after this point will be from the RC listener
    // with server-fresh data. Resolve immediately on isPremium=true (early exit)
    // or on any update (listener fired — proceed with whatever state we have).
    const unsub = useSubscriptionStore.subscribe(finish);
  });
}
