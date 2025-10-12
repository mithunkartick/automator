import type { Metadata } from "next";
import { DM_Sans} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider"
import { ClerkProvider } from '@clerk/nextjs'
import ModalProvider from "@/providers/modal-provider";
import { dark } from '@clerk/themes'

const font = DM_Sans({subsets: ['latin']})

export const metadata: Metadata = {
  title: "Flowly",
  description: "Create Workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          appearance={{
            baseTheme: dark,
            variables: {
              colorText: '#ffffff',
              colorTextSecondary: '#e5e7eb',
              colorBackground: '#0b1220',
            },
          }}
        >
  <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <ModalProvider>
              {children}
            </ModalProvider>
          </ThemeProvider>
        
      </body>
    </html>
    </ClerkProvider>
  );
}
