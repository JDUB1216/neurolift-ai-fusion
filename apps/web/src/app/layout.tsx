import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'NeuroLift AI Fusion',
  description: 'ADHD simulation and coaching platform powered by AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-gray-950 text-gray-100 antialiased`}>
        {children}
      </body>
    </html>
  )
}
