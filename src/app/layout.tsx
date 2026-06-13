import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuantumDesk Mini",
  description: "Minimal helpdesk with real-time ticket conversations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
