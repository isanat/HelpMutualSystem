
// Arquivo: www/wwwroot/integrazap.shop/frontend/src/app/about/page.tsx

"use client";

import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Card } from "../../components/ui/card";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function About() {
  const { t } = useTranslation();

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
          {t('about.title', 'About HelpMutualSystem')}
        </h1>
        <p className="text-base sm:text-lg text-gray-300 mb-6 max-w-3xl mx-auto">
          {t('about.description', 'Discover the story behind HelpMutualSystem, a decentralized platform built on Polygon to empower communities through mutual help and financial collaboration.')}
        </p>
        <div className="w-full max-w-3xl mx-auto h-64 bg-gray-800 rounded-lg flex items-center justify-center">
          <p className="text-gray-400">[Placeholder: Imagem ilustrativa de uma comunidade colaborativa]</p>
        </div>
      </motion.section>

      {/* Seção Missão, Visão e Valores */}
      <motion.section
        className="max-w-7xl mx-auto mb-6 sm:mb-8"
        variants={sectionVariants}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-6">
          {t('about.ourMission', 'Our Mission, Vision, and Values')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 sm:p-6 bg-[#111] border border-gray-700 rounded-lg">
            <h3 className="text-lg sm:text-xl font-semibold text-green-500 mb-2">
              {t('about.mission', 'Mission')}
            </h3>
            <p className="text-sm sm:text-base text-gray-400">
              {t('about.missionText', 'To create a transparent and decentralized platform that fosters mutual help and financial empowerment for all participants.')}
            </p>
          </Card>
          <Card className="p-4 sm:p-6 bg-[#111] border border-gray-700 rounded-lg">
            <h3 className="text-lg sm:text-xl font-semibold text-purple-500 mb-2">
              {t('about.vision', 'Vision')}
            </h3>
            <p className="text-sm sm:text-base text-gray-400">
              {t('about.visionText', 'A world where communities thrive through collaboration, trust, and shared financial growth.')}
            </p>
          </Card>
          <Card className="p-4 sm:p-6 bg-[#111] border border-gray-700 rounded-lg">
            <h3 className="text-lg sm:text-xl font-semibold text-blue-500 mb-2">
              {t('about.values', 'Values')}
            </h3>
            <p className="text-sm sm:text-base text-gray-400">
              {t('about.valuesText', 'Transparency, collaboration, and empowerment are at the core of everything we do.')}
            </p>
          </Card>
        </div>
      </motion.section>

      {/* Seção Equipe (Opcional) */}
      <motion.section
        className="max-w-7xl mx-auto mb-6 sm:mb-8 text-center"
        variants={sectionVariants}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
          {t('about.ourTeam', 'Our Team')}
        </h2>
        <p className="text-base sm:text-lg text-gray-300 mb-6 max-w-3xl mx-auto">
          {t('about.teamText', 'We are a passionate team dedicated to building a better future through decentralized technology. Meet the minds behind HelpMutualSystem.')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-[#111] border border-gray-700 rounded-lg">
            <div className="w-32 h-32 mx-auto bg-gray-800 rounded-full flex items-center justify-center">
              <p className="text-gray-400">[Placeholder: Foto do Membro da Equipe]</p>
            </div>
            <h3 className="text-lg font-semibold text-white mt-4">John Doe</h3>
            <p className="text-sm text-gray-400">{t('about.teamRole1', 'Founder & CEO')}</p>
          </Card>
          <Card className="p-4 bg-[#111] border border-gray-700 rounded-lg">
            <div className="w-32 h-32 mx-auto bg-gray-800 rounded-full flex items-center justify-center">
              <p className="text-gray-400">[Placeholder: Foto do Membro da Equipe]</p>
            </div>
            <h3 className="text-lg font-semibold text-white mt-4">Jane Smith</h3>
            <p className="text-sm text-gray-400">{t('about.teamRole2', 'Lead Developer')}</p>
          </Card>
          <Card className="p-4 bg-[#111] border border-gray-700 rounded-lg">
            <div className="w-32 h-32 mx-auto bg-gray-800 rounded-full flex items-center justify-center">
              <p className="text-gray-400">[Placeholder: Foto do Membro da Equipe]</p>
            </div>
            <h3 className="text-lg font-semibold text-white mt-4">Alex Brown</h3>
            <p className="text-sm text-gray-400">{t('about.teamRole3', 'Community Manager')}</p>
          </Card>
        </div>
      </motion.section>
    </motion.div>
  );
}