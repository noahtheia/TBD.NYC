import type { Metadata, Viewport } from "next";
import { Archivo, Inter, Space_Mono, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/site";
import Toaster from "@/components/ui/Toaster";
import "./globals.css";

// Four-voice type system from the brand identity: Archivo Black for display/logo,
// Inter for body & UI, Space Mono for tags/metadata, Fraunces italic for blurbs.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "800", "900"],
});
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["italic"],
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
    <html
      lang="en"
      className={`${archivo.variable} ${inter.variable} ${spaceMono.variable} ${fraunces.variable} antialiased`}
    >
      <body className="bg-newsprint text-ink">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
