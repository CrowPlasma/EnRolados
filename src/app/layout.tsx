import type { Metadata } from "next";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Sidebar } from "@/components/Sidebar";
import { LanguageProvider } from "@/i18n/LanguageProvider";

export const metadata: Metadata = {
  title: "EnRolados - SOC",
  description: "SOC Shift Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <LanguageProvider>
          <AuthProvider>
            <div className="app-wrapper">
              <Sidebar />
              <div className="main-content">
                {children}
              </div>
            </div>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
