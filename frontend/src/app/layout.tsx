import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ListEverywhere - Directory Submission Automation",
  description: "Universal startup directory submission automation SaaS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
