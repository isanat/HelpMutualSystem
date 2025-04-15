// Arquivo: www/wwwroot/integrazap.shop/frontend/src/components/Sidebar.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Adicionando a aba "Dashboard" como a primeira opção
  const tabs = [
    { id: "dashboard", label: "Dashboard" }, // Nova aba para voltar ao dashboard
    { id: "registered-users", label: "Registered Users" },
    { id: "all-transactions", label: "All Contract Transactions" },
    { id: "incentives-report", label: "Incentives Report" },
    { id: "donations-report", label: "User Donations Report" },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Função para fechar o menu e voltar ao dashboard ao clicar fora
  const handleOverlayClick = () => {
    setIsMobileMenuOpen(false);
    setActiveTab("dashboard"); // Volta para o dashboard ao clicar fora
  };

  // Componente interno do menu, para evitar duplicação de código
  const MenuContent = () => (
    <Card className="h-full p-4">
      <h2 className="text-lg sm:text-xl font-bold text-green-500 mb-4">Reports</h2>
      <div className="space-y-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            className="w-full justify-start text-left text-xs sm:text-sm md:text-base"
            onClick={() => {
              setActiveTab(tab.id);
              setIsMobileMenuOpen(false); // Fecha o menu em mobile ao selecionar uma aba
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>
    </Card>
  );

  return (
    <>
      {/* Botão Hamburger (visível apenas em mobile) */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          className="bg-[#111] border-gray-700"
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Menu Lateral no Desktop */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-40 w-64 bg-[#111] border-r border-gray-700">
        <MenuContent />
      </div>

      {/* Menu Lateral no Mobile (com animação) */}
      <motion.div
        className={`md:hidden fixed inset-y-0 left-0 z-40 w-[70%] max-w-[250px] bg-[#111] border-r border-gray-700 transition-transform duration-300`}
        initial={{ x: "-100%" }}
        animate={{ x: isMobileMenuOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <MenuContent />
      </motion.div>

      {/* Overlay para mobile (fecha o menu e volta ao dashboard ao clicar fora) */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={handleOverlayClick} // Ajustado para voltar ao dashboard
        />
      )}
    </>
  );
}