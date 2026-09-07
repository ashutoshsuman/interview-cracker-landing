export function track(
  event: string,
  params?: Record<string, string | number | boolean>
): void {
  try {
    if (typeof window === "undefined") return;
    const w = window as any;
    if (typeof w.gtag !== "function") return;
    w.gtag("event", event, params ?? {});
  } catch {
    /* analytics must never break the app */
  }
}
