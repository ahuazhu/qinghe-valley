import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "青禾谷｜你的掌上田园",
  description: "一款轻松治愈的网页农场游戏。开垦土地、播种、浇水，收获属于你的第一颗萝卜。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
