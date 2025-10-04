// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Shell from "@/shared/components/mainTemplate";
import { Toaster } from "react-hot-toast"; 
import { UserProvider } from "@/shared/context/UserContext"; // ✅ added

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Farmers Republic",
  description: "Pick fresh. Eat fresh.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <UserProvider> {/* ✅ UserContext now available globally */}
          <Shell>{children}</Shell>
          <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#333",
              border: "1px solid #e0e0e0",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#16a34a", secondary: "#fff" },
            },
            error: {
              iconTheme: { primary: "#dc2626", secondary: "#fff" },
            },
          }}
        />
        </UserProvider>
      </body>
    </html>
  );
}
