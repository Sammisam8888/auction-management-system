import "./globals.css";

export const metadata = {
  title: "KPL 2026 Auction | Kratu Premier League",
  description: "Live auction management system for the Kratu Premier League 2026 cricket tournament",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
