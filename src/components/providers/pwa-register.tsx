"use client";

import { useEffect } from "react";

/**
 * Service worker kaydı.
 * PWA kurulumu, offline önbellek ve bildirimler için gereklidir.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (
      window.location.protocol === "http:" &&
      !["localhost", "127.0.0.1"].includes(window.location.hostname)
    ) {
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((error) => {
          // Geliştirme sırasında sessiz kalmak daha iyidir; kritik değil.
          console.warn("Service worker kaydı başarısız:", error);
        });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
