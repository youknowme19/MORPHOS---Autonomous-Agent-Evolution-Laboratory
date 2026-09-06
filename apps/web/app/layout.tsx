import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LabProvider } from "@/components/LabProvider";
import { Shell } from "@/components/Shell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "MORPHOS — Autonomous Agent Evolution Laboratory",
  description: "Closed-loop evolutionary agent compiler and optimization laboratory",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={`${inter.className} font-sans antialiased bg-[#08090d] text-[#e4e4e7] selection:bg-cyan-500/20 selection:text-cyan-200`}>
        <LabProvider>
          <Shell>{children}</Shell>
        </LabProvider>
      </body>
    </html>
  );
}
