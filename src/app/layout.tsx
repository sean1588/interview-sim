import type { Metadata } from "next";
import { Cormorant_Garamond, Jost, IBM_Plex_Mono } from "next/font/google";
import TopNav from "@/components/TopNav";
import "./globals.css";

// The "Dialogue" type system: an editorial serif for prose/headings, a geometric
// sans for UI chrome, and a mono for code. Wired to CSS variables the @theme block
// in globals.css maps onto Tailwind's font-serif / font-sans / font-mono.
const serif = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const sans = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Interview Sim",
  description: "Practice coding, behavioral, and system design interviews with a real-time AI voice interviewer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-app font-sans text-ink">
        <TopNav />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
