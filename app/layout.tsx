import './globals.css'
import { Inter } from 'next/font/google'
import Navigation from '../components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Business Tracker',
  description: 'Track your business expenses, inventory, and sales',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover"
        />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.className} overflow-x-hidden`}
      >
        <Navigation />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
}
