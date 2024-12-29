import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";

export const metadata: Metadata = {
  title: "Fantastic Pancake",
  description: "便利なツール集",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="h-full flex flex-col">
        <Header />
        {/* ヘッダー以降の領域をすべて背景黄色にする */}
        <main className="bg-amber-100 flex-grow">{children}</main>
      </body>
    </html>
  );
}
