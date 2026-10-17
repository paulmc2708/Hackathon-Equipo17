import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const TEMA_INICIAL = `try{var t=localStorage.getItem("tema");if(!t)t=matchMedia("(prefers-color-scheme: light)").matches?"claro":"oscuro";document.documentElement.dataset.tema=t}catch(e){}`;

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Coach de Instagram",
  description: "Tu coach de Instagram con IA para marca personal",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Pone el tema antes de pintar, así no hay un flash del tema equivocado. */}
        <script dangerouslySetInnerHTML={{ __html: TEMA_INICIAL }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
