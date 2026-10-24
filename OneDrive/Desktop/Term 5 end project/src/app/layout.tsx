// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DevPulse Dashboard',
  description: 'AI‑driven code‑review & CI/CD analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-gray-900 text-white">
      <body className="min-h-screen flex flex-col">
        <header className="p-4 bg-gray-800 shadow-md">
          <h1 className="text-2xl font-bold">DevPulse</h1>
        </header>
        <main className="flex-1 p-6">{children}</main>
        <footer className="p-4 bg-gray-800 text-center text-sm">
          © {new Date().getFullYear()} DevPulse
        </footer>
      </body>
    </html>
  );
}
