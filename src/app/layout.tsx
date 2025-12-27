import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TripHippo - Plan Your Perfect Trip Together",
  description:
    "The all-in-one travel planner that helps you organize your itinerary, track reservations, collaborate with friends, and make the most of every adventure.",
  keywords: [
    "travel planner",
    "trip planning",
    "itinerary",
    "vacation planner",
    "travel app",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
