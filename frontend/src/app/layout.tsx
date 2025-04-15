// arquivo www/wwwroot/integrazap.shop/frontend/src/app/layout.tsx
import './globals.css';
import { Web3Provider } from '../context/Web3Context';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import Header from '../components/Header';
import I18nProvider from '../components/I18nProvider';

export const metadata = {
  title: 'HelpMutualSystem',
  description: 'A mutual help system on Polygon',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0c0c0c] font-inter">
        <I18nProvider>
          <Web3Provider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <footer className="bg-[#111] p-6 text-center text-gray-300">
                <p className="mb-2">© 2025 HelpMutualSystem. All rights reserved.</p>
                <div className="flex justify-center space-x-4">
                  <a href="https://twitter.com" className="hover:text-blue-300 transition duration-300">
                    Twitter
                  </a>
                  <a href="https://discord.com" className="hover:text-blue-300 transition duration-300">
                    Discord
                  </a>
                </div>
              </footer>
              <ToastContainer position="top-right" autoClose={5000} theme="dark" />
            </div>
          </Web3Provider>
        </I18nProvider>
      </body>
    </html>
  );
}