import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import '../index.css'
import Providers from '../components/Providers'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Finlytics',
    description: 'AI Finance Assistant',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={outfit.className}>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
