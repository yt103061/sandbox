import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TrueHour",
  description: "AI time management for freelancers with client transparency",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
