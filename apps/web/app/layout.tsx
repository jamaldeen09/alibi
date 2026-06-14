import { Geist_Mono, Raleway } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { UiContextProvider } from "@/contexts/UiContext";
import { SocketContextProvider } from "@/contexts/SocketContext";

const ralewayHeading = Raleway({ subsets: ['latin'], variable: '--font-heading' });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", raleway.variable, ralewayHeading.variable)}
    >
      <body>
        <ThemeProvider>
          <ClerkProvider>
              <UiContextProvider>
                <SocketContextProvider url="http://localhost:4080">
                  {children}
                </SocketContextProvider>
              </UiContextProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
