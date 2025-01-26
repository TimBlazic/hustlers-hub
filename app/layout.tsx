import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { LayoutClient } from "./layout-client";

export const metadata: Metadata = {
  title: "Hustlers Hub",
  description: "Freelance marketplace with crypto payments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={GeistSans.className}>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
