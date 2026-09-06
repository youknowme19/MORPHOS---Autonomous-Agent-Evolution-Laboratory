import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { LabProvider } from "@/components/LabProvider";
import { Shell } from "@/components/Shell";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument",
});

export const metadata = {
  title: "MORPHOS — Evolve an agent",
  description: "Autonomous agent evolution laboratory",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} ${instrument.variable} font-sans antialiased`}>
        <LabProvider>
          <Shell>{children}</Shell>
        </LabProvider>
      </body>
    </html>
  );
}
