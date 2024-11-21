import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "RMBG Tool",
  description: "Build your own client side RMBG Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      >
        {children}
      </body>
    </html>
  );
}
