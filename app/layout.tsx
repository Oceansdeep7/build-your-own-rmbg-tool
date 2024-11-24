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
      <body>
        {children}
        <footer className="fixed bottom-0 w-full p-4 text-center text-gray-500 text-sm">
          Powered by <a href="https://www.briaai.com" className="underline hover:text-gray-700">Briaai</a>&apos;s RMBG-1.4 Model
        </footer>
      </body>
    </html>
  );
}
