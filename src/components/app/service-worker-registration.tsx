"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || window.location.protocol !== "https:") return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // PWA install remains optional; failures should not affect the finance UI.
    });
  }, []);

  return null;
}
