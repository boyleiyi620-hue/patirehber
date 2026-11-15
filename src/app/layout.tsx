import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/components/providers/app-provider";
import { NotificationScheduler } from "@/components/providers/notification-scheduler";
import { PwaRegister } from "@/components/providers/pwa-register";
import { AppShell } from "@/components/layout/app-shell";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://patirehber.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PatiRehber — Kedi Bakım Rehberi",
    template: "%s · PatiRehber",
  },
  description:
    "Kedinizin mama, su, kum, aşı ve kilo takibini tek yerden yönetin. 51 ırk rehberi, porsiyon hesaplayıcı, hatırlatıcılar ve acil durum bilgileri. Çevrimdışı çalışır, veriler yalnızca cihazınızda kalır.",
  applicationName: "PatiRehber",
  keywords: [
    "kedi bakımı",
    "kedi rehberi",
    "kedi mama hesaplama",
    "kedi aşı takvimi",
    "kedi ırkları",
    "hatırlatıcı",
    "PWA",
    "PatiRehber",
  ],
  authors: [{ name: "PatiRehber" }],
  creator: "PatiRehber",
  manifest: "/manifest.json",
  category: "lifestyle",
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    title: "PatiRehber",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: siteUrl,
    siteName: "PatiRehber",
    title: "PatiRehber — Kedi Bakım Rehberi",
    description:
      "Kedi bakımını tek bir yerde yönetin: mama ve su takibi, hatırlatıcılar, aşı takvimi, 51 ırk rehberi ve hesaplayıcılar.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PatiRehber — Kedi Bakım Rehberi",
    description:
      "Mama, su, kum, aşı ve kilo takibi; 51 ırk rehberi ve porsiyon hesaplayıcı. Yalnızca cihazınızda çalışır.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF6F1" },
    { media: "(prefers-color-scheme: dark)", color: "#12100E" },
  ],
};

/**
 * Tema yanıp sönmesini önleyen küçük script.
 * LocalStorage'daki ayarı sayfa boyanmadan önce uygular.
 */
const themeInitScript = `
(function () {
  try {
    var raw = localStorage.getItem("patirehber:data:v1");
    var mode = "system";
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.settings && parsed.settings.theme) mode = parsed.settings.theme;
    }
    var dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  } catch (error) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,800;9..144,900&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="mesh-bg">
        <AppProvider>
          <PwaRegister />
          <NotificationScheduler />
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
