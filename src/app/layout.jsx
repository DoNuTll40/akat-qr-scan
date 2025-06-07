import "./globals.css";

export const metadata = {
  title: "ระบบสร้าง QR Code",
  description: "ระบบสร้าง QR Code",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="h-dvh font-sans bg-gray-100">
        {children}
      </body>
    </html>
  );
}
