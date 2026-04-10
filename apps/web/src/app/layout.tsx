import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astra Intranet Modern",
  description: "Nova base para reescrita da intranet ASTRA"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

