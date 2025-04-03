import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AnimatedFavicon } from "@/components/animated-favicon"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Hi 👋 | BASIT",
  description: "A minimalist developer portfolio",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Default favicon that will be replaced by the animated one */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {/* Animated favicon component */}
          <AnimatedFavicon />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

