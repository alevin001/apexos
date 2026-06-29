import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApexOS Executive",
  description: "Executive interface for ApexOS — Build 10",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
