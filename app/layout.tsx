import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TBD.NYC — NYC Bars & Happy Hours",
  description:
    "An interactive map of curated New York City bars and happy hours. Filter by neighborhood, type, and happy hour.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body className="bg-white text-zinc-900">{children}</body>
    </html>
  );
}
