// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/shared/components/mainTemplate";
import { Toaster } from "react-hot-toast"; 
import { UserProvider } from "@/shared/context/UserContext"; // ✅ added
import { CartProvider } from "@/shared/context/CartContext";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME,
  description: "Pick fresh. Eat fresh.",
  icons: {
    icon: "/fr3sh.in_logo.svg", // or "/icon.png"
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <UserProvider> {/* ✅ UserContext now available globally */}
          <CartProvider>
          <Shell>{children}</Shell>
          </CartProvider>
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
