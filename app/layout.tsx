import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ماراثون الخدمة",
  description: "رحلة خدمة ونمو وتحدي للأطفال",

  openGraph: {
    title: "ماراثون الخدمة",
    description: "رحلة خدمة ونمو وتحدي للأطفال",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "ماراثون الخدمة",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "ماراثون الخدمة",
    description: "رحلة خدمة وتحدي للأطفال",
    images: ["/opengraph-image.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}