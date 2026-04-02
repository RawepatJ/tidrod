import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Header from "../components/Header";
import { ToastProvider } from "../components/Toast";
import { SessionProvider } from "../components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anakotmai = localFont({
  src: [
    {
      path: "../public/fonts/anakotmai-light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/anakotmai-medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/anakotmai-bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-anakotmai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TidRod — ชุมชนนักเดินทางและแผนที่ท่องเที่ยวยอดนิยม",
  description: "แบ่งปันประสบการณ์การเดินทางบนแผนที่ ค้นหาสถานที่ใหม่ๆ ผ่านเพื่อนร่วมทาง แชทเรียลไทม์ และออกสำรวจเมืองไทยไปด้วยกัน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${anakotmai.variable} ${anakotmai.className} antialiased min-h-screen flex flex-col`}
      >
        <SessionProvider>
          <ToastProvider>
            <div className={'font-main flex flex-col h-screen'}>
              <Header />
              {children}
            </div>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
