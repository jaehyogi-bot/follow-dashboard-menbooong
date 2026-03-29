import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "\uC0AC\uBAA8\uD380\uB4DC \uC218\uAE09 \uB7AD\uD0B9",
  description:
    "\uC0AC\uBAA8\uD380\uB4DC \uC21C\uB9E4\uC218\uC640 \uC2DC\uAC00\uCD1D\uC561 \uB300\uBE44 \uC218\uAE09 \uBE44\uC911\uC744 \uBE44\uAD50\uD558\uB294 \uB300\uC2DC\uBCF4\uB4DC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
