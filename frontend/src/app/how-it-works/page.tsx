// Arquivo: www/wwwroot/integrazap.shop/frontend/src/app/how-it-works/page.tsx

"use client";

import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Card } from "../../components/ui/card";
import { DollarSign, Gift, Users, Wallet } from "lucide-react";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: <Wallet size={24} className="text-green-500" />,
      title: t('howItWorks.step1.title', 'Connect Your Wallet'),
      description: t('howItWorks.step1.description', 'Start by connecting your MetaMask or WalletConnect to join the HelpMutualSystem platform.'),
      imagePlaceholder: "[Placeholder: Imagem de uma carteira digital sendo conectada]",
    },
    {
      icon: <Users size={24} className="text-blue-500" />,
      title: t('howItWorks.step2.title', 'Register and Join the Community'),
      description: t('howItWorks.step2.description', 'Pay the entry fee to register and become part of the mutual help network. Invite friends to grow your referrals.'),
      imagePlaceholder: "[Placeholder: Imagem de pessoas se conectando em uma rede]",
    },
    {
      icon: <DollarSign size={24} className="text-green-500" />,
      title: t('howItWorks.step3.title', 'Donate and Move Up the Queue'),
      description: t('howItWorks.step3.description', 'Make donations in USDT to advance in the queue and receive contributions from others.'),
      imagePlaceholder: "[Placeholder: Imagem de uma fila com moedas USDT]",
    },
    {
      icon: <Gift size={24} className="text-purple-500" />,
      title: t('howItWorks.step4.title', 'Earn Incentives and Withdraw'),
      description: t('howItWorks.step4.description', 'Earn HELP tokens as incentives for participation and withdraw your earnings when ready.'),
      imagePlaceholder: "[Placeholder: Imagem de tokens HELP e uma retirada]",
    },
  ];

  return (
    <motion.div
      className="p-4 sm:p-6 bg-[#0c0c0c] min-h-screen text-white"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
    >
      {/* Seção Hero */}
      <motion.section
        className="max-w-7xl mx-auto mb-6 sm:mb-8 text-center"
        variants={sectionVariants}
      >
        <h1 className="text-3xl sm:text-5xl font-bold text-green-500 mb-4">
          {t('howItWorks.title', 'How It Works')}
        </h1>
        <p className="text-base sm:text-lg text-gray-300 mb-6 max-w-3xl mx-auto">
          {t('howItWorks.description', 'Learn how to get started with HelpMutualSystem and make the most of our decentralized mutual help platform.')}
        </p>
        <div className="w-full max-w-3xl mx-auto h-64 bg-gray-800 rounded-lg flex items-center justify-center">
          <p className="text-gray-400">[Placeholder: Imagem ilustrativa do processo]</p>
        </div>
      </motion.section>

      {/* Seção Passos */}
      <motion.section
        className="max-w-7xl mx-auto mb-6 sm:mb-8"
        variants={sectionVariants}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-6">
          {t('howItWorks.steps', 'Step-by-Step Guide')}
        </h2>
        <div className="space-y-6">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="p-4 sm:p-6 bg-[#111] border border-gray-700 rounded-lg flex flex-col sm:flex-row items-center gap-4"
            >
              <div className="w-full sm:w-1/3 h-40 bg-gray-800 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">{step.imagePlaceholder}</p>
              </div>
              <div className="w-full sm:w-2/3">
                <div className="flex items-center gap-2 mb-2">
                  {step.icon}
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    {step.title}
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-gray-400">
                  {step.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}