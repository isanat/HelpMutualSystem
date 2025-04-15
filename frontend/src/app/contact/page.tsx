// Arquivo: www/wwwroot/integrazap.shop/frontend/src/app/contact/page.tsx

"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "react-toastify";
import { Mail, Send } from "lucide-react";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulação de envio (substituir por uma chamada real à API, se necessário)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simula uma chamada à API
      toast.success(t('contact.success', 'Message sent successfully! We will get back to you soon.'));
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error(t('contact.error', 'Failed to send message. Please try again later.'));
    } finally {
      setIsSubmitting(false);
    }
  };

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
          {t('contact.title', 'Contact Us')}
        </h1>
        <p className="text-base sm:text-lg text-gray-300 mb-6 max-w-3xl mx-auto">
          {t('contact.description', 'Have questions or need support? Reach out to us, and we’ll be happy to assist you.')}
        </p>
        <div className="w-full max-w-3xl mx-auto h-64 bg-gray-800 rounded-lg flex items-center justify-center">
          <img
            src="/images/contact-hero.png"
            alt="Support Team Illustration"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      </motion.section>

      {/* Seção Formulário e Informações de Contato */}
      <motion.section
        className="max-w-7xl mx-auto mb-6 sm:mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={sectionVariants}
      >
        {/* Formulário */}
        <div className="bg-[#111] p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">
            {t('contact.formTitle', 'Send Us a Message')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('contact.form.name', 'Your Name')}
              className="w-full text-sm sm:text-base py-3 bg-[#222] border-gray-600 text-white"
              required
            />
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('contact.form.email', 'Your Email')}
              className="w-full text-sm sm:text-base pyldquo3 bg-[#222] border-gray-600 text-white"
              required
            />
            <Textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder={t('contact.form.message', 'Your Message')}
              className="w-full text-sm sm:text-base py-3 bg-[#222] border-gray-600 text-white"
              rows={5}
              required
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-sm sm:text-base py-3 bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                t('contact.form.sending', 'Sending...')
              ) : (
                <>
                  <Send size={16} />
                  {t('contact.form.submit', 'Send Message')}
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Informações de Contato */}
        <div className="bg-[#111] p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">
            {t('contact.infoTitle', 'Get in Touch')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail size={20} className="text-green-500" />
              <p className="text-sm sm:text-base text-gray-300">
                {t('contact.email', 'Email')}: <a href="mailto:support@helpmutualsystem.com" className="text-blue-400 hover:underline">support@helpmutualsystem.com</a>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm sm:text-base text-gray-300">
                {t('contact.socials', 'Follow us on social media for updates:')}
              </p>
            </div>
            <div className="flex gap-4">
              <a href="https://twitter.com/helpmutualsystem" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                Twitter
              </a>
              <a href="https://discord.gg/helpmutualsystem" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                Discord
              </a>
              <a href="https://t.me/helpmutualsystem" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                Telegram
              </a>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}