import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        "connect.wallet": "Connect Your Wallet",
        "connect.metamask": "Connect with Metamask",
        "logout": "Disconnect",
        "admin.panel": "Go to Admin",
        "dashboard.status": "Status",
        "status.registered": "Registered",
        "status.sponsor": "Sponsor",
        "status.queue": "Queue Position",
        "status.donations": "Donations Received",
        "status.hasDonated": "Has Donated",
        "status.no": "No",
        "dashboard.balance": "Balance",
        "dashboard.level": "Level",
        "dashboard.referrals": "Referrals",
        "donations.title": "Recent Donations",
        "donations.transaction": "Transaction",
        "donations.method": "Method",
        "donations.date": "Date",
        "donations.amount": "Amount",
        "donations.level": "Level",
        "transactions.title": "Recent Transactions",
        "transactions.amount": "Amount",
        "transactions.help": "Recent HELP Transactions",
        "donation.enterAmount": "Enter donation amount",
        "donation.selectToken": "Select Token",
        "donation.send": "Send Donation",
        "actions.register": "Register",
        "actions.donate": "Donate",
        "actions.withdraw": "Withdraw",
        "actions.stake": "Stake Tokens",
        "actions.claimIncentive": "Claim Incentive", // Novo
        "registration.fee":
          "This fee is used to validate your registration and will be forwarded to the participant ahead of you in the queue.",
        "incentive.title": "Incentive Information", // Novo
        "incentive.lockedAmount": "Locked Amount", // Novo
        "incentive.unlockDate": "Unlock Date", // Novo
        "incentive.status": "Status", // Novo
        "incentive.locked": "Locked", // Novo
        "incentive.available": "Available", // Novo
      },
    },
    // Adicione outros idiomas se necessário
  },
  lng: "en", // Idioma padrão
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;