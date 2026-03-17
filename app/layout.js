import "./globals.css";

export const metadata = {
  title: "Kratu Premier League 2026 — Auction Management System",
  description: "Live auction management system for the Kratu Premier League 2026 cricket tournament. Real-time player bidding, team management, and live projector display.",
  keywords: ["KPL", "Kratu Premier League", "Cricket Auction", "2026", "Auction Management"],
  authors: [{ name: "KPL Organizing Committee" }],
  openGraph: {
    title: "Kratu Premier League 2026 — Auction Management System",
    description: "Live auction management system for the Kratu Premier League 2026 cricket tournament. Real-time player bidding, team management, and live projector display.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kratu Premier League 2026 — Auction",
      },
    ],
    type: "website",
    siteName: "KPL 2026 Auction",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kratu Premier League 2026 — Auction Management System",
    description: "Live auction management system for the KPL 2026 cricket tournament.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/og-image.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
