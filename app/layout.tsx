import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/site";
import Toaster from "@/components/ui/Toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const TITLE = "TBD.NYC — NYC Bars & Happy Hours";
const DESCRIPTION =
  "An interactive map of curated New York City bars and happy hours. Filter by neighborhood, type, and happy hour.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "TBD.NYC",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

// Let the full-screen mobile map draw under the notch / home indicator so the
// floating controls (which use `env(safe-area-inset-*)`) can offset themselves.
export const viewport: Viewport = { viewportFit: "cover" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body className="bg-white text-zinc-900">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
