import type { Metadata, Viewport } from "next";
import { Provider } from "@/components/provider";
import { Shell } from "@/components/shell";
import { QueueProvider } from "@/components/queue";
import "./globals.css";
export const metadata: Metadata = {
  title: "fixihub",
  description:
    "Explore Malaysian stories at FIXIHUB. Featured preorder: KACAU: Movie Tie-In by Ariff Adly, RM30 and limited to 1,000 copies. Browse the bookshelf and discover your next read.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/fixi-32.png", apple: "/icons/fixi-180.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "fixihub" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111111",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider>
          <QueueProvider>
            <Shell>{children}</Shell>
          </QueueProvider>
        </Provider>
      </body>
    </html>
  );
}
