// Arquivo: www/wwwroot/integrazap.shop/frontend/src/components/Header.tsx

"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { useWeb3 } from "../context/Web3Context";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

export default function Header() {
  const { t } = useTranslation();
  const { account, disconnectWallet, connectWallet, isOwner } = useWeb3();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Log para verificar quantas vezes o componente é renderizado
  useEffect(() => {
    console.log("Header.tsx renderizado");
  }, []);

  const navItems = [
    { label: t('nav.home', 'Home'), href: '/' },
    { label: t('nav.about', 'About'), href: '/about' },
    { label: t('nav.howItWorks', 'How It Works'), href: '/how-it-works' },
    { label: t('nav.contact', 'Contact'), href: '/contact' },
  ];

  return (
    <header key="header" className="relative flex flex-col items-center p-4 bg-[#0c0c0c] text-white">
      {/* Logo e Botões no Cabeçalho */}
      <div className="flex justify-between items-center w-full max-w-7xl">
        <div className="text-lg sm:text-xl font-bold">
          <span className="text-green-500">Help</span>MutualSystem
        </div>
        <div className="flex items-center gap-2">
          {account ? (
            <>
              <span className="text-xs sm:text-sm flex items-center px-2">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
              {isOwner && (
                <Link href="/backend">
                  <Button
                    variant="outline"
                    className="hidden sm:flex text-xs sm:text-sm px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white border-none rounded-lg transition-colors"
                    aria-label={t('admin.panel', 'Admin Panel')}
                  >
                    {t('admin.panel', 'Admin Panel')}
                  </Button>
                </Link>
              )}
              <Button
                variant="danger"
                className="hidden sm:flex text-xs sm:text-sm px-3 py-1 bg-red-500 hover:bg-red-600"
                onClick={disconnectWallet}
                aria-label={t('logout', 'Disconnect')}
              >
                {t('logout', 'Disconnect')}
              </Button>
            </>
          ) : (
            <Button
              className="hidden sm:flex text-xs sm:text-sm px-3 py-1 bg-green-500 hover:bg-green-600"
              onClick={() => connectWallet('metamask')}
              aria-label="Connect Wallet"
            >
              Connect Wallet
            </Button>
          )}
          {/* Botão Hamburger para Mobile */}
          <div className="sm:hidden">
            <Button
              variant="outline"
              className="bg-[#111] border-gray-700 p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Menu Sanduíche para Mobile */}
      {isMenuOpen && (
        <motion.div
          key="mobile-menu"
          className="sm:hidden fixed top-0 left-0 w-64 h-full bg-[#1a1a1a] p-4 z-50"
          initial={{ x: -256 }}
          animate={{ x: 0 }}
          transition={{ type: 'tween' }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-green-500">Menu</h2>
            <Button
              onClick={() => setIsMenuOpen(false)}
              className="text-white bg-transparent hover:bg-gray-700 p-2"
              aria-label="Close menu"
            >
              <X size={20} />
            </Button>
          </div>
          <nav className="space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="block text-white hover:text-green-500 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            {account ? (
              <>
                {isOwner && (
                  <Link href="/backend" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full text-sm py-2 bg-blue-500 hover:bg-blue-600 text-white border-none rounded-lg transition-colors"
                      aria-label={t('admin.panel', 'Admin Panel')}
                    >
                      {t('admin.panel', 'Admin Panel')}
                    </Button>
                  </Link>
                )}
                <Button
                  variant="danger"
                  className="w-full text-sm py-2 bg-red-500 hover:bg-red-600"
                  onClick={() => {
                    disconnectWallet();
                    setIsMenuOpen(false);
                  }}
                  aria-label={t('logout', 'Disconnect')}
                >
                  {t('logout', 'Disconnect')}
                </Button>
              </>
            ) : (
              <Button
                className="w-full text-sm py-2 bg-green-500 hover:bg-green-600"
                onClick={() => {
                  connectWallet('metamask');
                  setIsMenuOpen(false);
                }}
                aria-label="Connect Wallet"
              >
                Connect Wallet
              </Button>
            )}
          </nav>
        </motion.div>
      )}

      {/* Menu de Navegação para Desktop */}
      <nav key="desktop-menu" className="hidden sm:flex items-center gap-4 mt-4 w-full max-w-7xl">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <span className="text-sm md:text-base text-gray-300 hover:text-green-500 transition-colors">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </header>
  );
}