import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Voting DApp - Vote décentralisé sécurisé',
  description: 'Application de vote décentralisée utilisant la blockchain pour un vote transparent et sécurisé',
  keywords: ['blockchain', 'vote', 'décentralisé', 'ethereum', 'smart contract'],
  authors: [{ name: 'Voting DApp Team' }],
  openGraph: {
    title: 'Voting DApp',
    description: 'Vote décentralisé sécurisé sur blockchain',
    type: 'website',
    locale: 'fr_FR',
  },
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}