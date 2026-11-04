import { Poppins } from 'next/font/google';
import './globals.css';
const poppins = Poppins({subsets:['latin'],weight:['400','500','600','700'],variable:'--font-poppins',display:'swap'});

export const metadata = {
  title: 'MAFHH Aviation — Operations Dashboard',
  description: 'Real-time operations dashboard for MAFHH Aviation',
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

