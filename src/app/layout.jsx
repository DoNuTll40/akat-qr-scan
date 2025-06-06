import "./globals.css";

export const metadata = {
  title: "ระบบสร้าง QR Code",
  description: "ระบบสร้าง QR Code",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="w-dvw h-dvh font-sans">
        {children}
      </body>
    </html>
  );
}
