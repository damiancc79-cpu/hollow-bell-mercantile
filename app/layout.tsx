import type { Metadata } from "next";
import { headers } from "next/headers";
import { Cormorant_Garamond, DM_Mono, Inter } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });
const mono = DM_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = `${protocol}://${host}`;
  const title = "The Hollow Bell — A Seven-Day Shopkeeping Tale";
  const description = "Run a tiny miscellaneous shop, serve a strange town, and uncover the tragic secret beneath the floorboards.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: [{ url: `${base}/og.png`, width: 1536, height: 1024, alt: "The Hollow Bell shop during a storm" }] },
    twitter: { card: "summary_large_image", title, description, images: [`${base}/og.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${display.variable} ${sans.variable} ${mono.variable}`}>{children}</body></html>;
}
