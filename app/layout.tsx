import type { Metadata } from "next";
import { Merriweather, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/templates/theme-provider";
import "./globals.css";

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Live Warehouse Management System",
  description: "A web application for managing warehouse operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${merriweather.variable} ${sourceSerif4.variable} ${jetBrainsMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
