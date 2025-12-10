import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/providers/WalletProvider";
import { WalletDialogProvider } from "@/providers/WalletDialogProvider";
import AuthenticationDialog from "@/components/authentication-dialog";
import { RecaptchaProvider } from "@/providers/RecaptchaProvider";
import { Toaster } from "@/components/ui/sonner";
import { QueryClientProvider } from "@/providers/QueryClientProvider";
import { Navigation } from "@/components/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shelby Social - Demo",
  description: "Social media platform powered by the Shelby Network",
  openGraph: {
    title: "Shelby Social - Demo",
    description: "Social media platform powered by the Shelby Network",
    url: "https://social-demo.shelby.xyz",
    type: "website",
    siteName: "Shelby Social - Demo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shelby Social - Demo",
    description: "Social media platform powered by the Shelby Network",
    site: "@shelbyserves",
    creator: "@shelbyserves",
  },
  metadataBase: new URL("https://social-demo.shelby.xyz"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background overflow-hidden`}
      >
        <RecaptchaProvider>
          <QueryClientProvider>
            <WalletProvider>
              <WalletDialogProvider>
                <div className="flex h-screen w-screen overflow-hidden">
                  <Navigation />
                  <main className="flex-1 flex flex-col overflow-hidden">
                    {children}
                  </main>
                </div>
                <AuthenticationDialog />
              </WalletDialogProvider>
            </WalletProvider>
          </QueryClientProvider>
        </RecaptchaProvider>
        <Toaster />
      </body>
    </html>
  );
}
