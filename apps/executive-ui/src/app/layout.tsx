import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApexOS Executive",
  description: "Executive conversation interface for ApexOS — Build 11",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
