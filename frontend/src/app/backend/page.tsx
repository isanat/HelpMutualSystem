// Arquivo: www/wwwroot/integrazap.shop/frontend/src/app/backend/page.tsx

"use client";

import { useWeb3 } from '../../context/Web3Context';
import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import { isAddress } from 'ethers';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table';
import { AlertCircle, DollarSign, Gift, RefreshCw, Download, TrendingUp, Users } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import HelpTransactions from '../../components/HelpTransactions';
import AllTransactions from '../../components/AllTransactions';

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Admin() {
  const { t } = useTranslation();
  const { account, contract, provider, isOwner } = useWeb3();
  const [injectFundsAmount, setInjectFundsAmount] = useState('');
  const [injectHelpAmount, setInjectHelpAmount] = useState('');
  const [withdrawTo, setWithdrawTo] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [recoverTokenAddress, setRecoverTokenAddress] = useState('');
  const [recoverAmount, setRecoverAmount] = useState('');
  const [newHelpPrice, setNewHelpPrice] = useState('');
  const [contractStats, setContractStats] = useState<{
    totalUsers: number;
    totalDonations: number;
    totalIncentives: number;
    contractBalanceUsdt: number;
    contractBalanceHelp: number;
  } | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [incentivesUserAddress, setIncentivesUserAddress] = useState('');
  const [donationsUserAddress, setDonationsUserAddress] = useState('');
  const [donationsList, setDonationsList] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard"); // Estado para controlar a aba ativa

  // Função para tentar novamente uma requisição com atraso
  const retryRequest = async (fn: () => Promise<any>, retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        if (error.message.includes('Too Many Requests') && i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  };

  // Buscar estatísticas do contrato
  const fetchContractStats = async () => {
    if (!account || !isAddress(account)) {
      setError('Please connect a valid wallet.');
      return;
    }
    try {
      const response = await retryRequest(() =>
        api.get('/api/contract-stats', {
          headers: { 'x-requester': account },
        })
      );
      setContractStats(response.data);
    } catch (error: any) {
      console.error('Error fetching contract stats:', error);
      const errorMessage = error.message.includes('Too Many Requests')
        ? 'Rate limit exceeded. Please try again later.'
        : `Failed to fetch contract stats: ${error.response?.data?.message || error.message}`;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Buscar lista de usuários
  const fetchUsersList = async () => {
    try {
      const response = await retryRequest(() =>
        api.get('/api/users')
      );
      const users = await Promise.all(
        response.data.map(async (userAddress: string) => {
          try {
            const userInfo = await api.get(`/api/user-info?address=${userAddress}`);
            return userInfo.data;
          } catch (error: any) {
            console.error(`Error fetching user info for ${userAddress}:`, error);
            return null;
          }
        })
      );
      setUsersList(users.filter((user) => user !== null));
    } catch (error: any) {
      console.error('Error fetching users list:', error);
      setError('Failed to fetch users list. Please try again.');
      toast.error('Failed to fetch users list. Please try again.');
    }
  };

  // Buscar incentivos (IncentiveGranted e IncentiveClaimed)
  const fetchIncentivesList = async () => {
    if (!incentivesUserAddress || !isAddress(incentivesUserAddress)) {
      toast.error('Please enter a valid user address to fetch incentives.');
      return;
    }
    try {
      const response = await retryRequest(() =>
        api.get(`/api/help-transactions?address=${incentivesUserAddress}`)
      );
      // HelpTransactions gerencia o estado internamente
    } catch (error: any) {
      console.error('Error fetching incentives:', error);
      setError('Failed to fetch incentives. Please try again.');
      toast.error('Failed to fetch incentives. Please try again.');
    }
  };

  // Buscar doações de um usuário
  const fetchUserDonations = async () => {
    if (!donationsUserAddress || !isAddress(donationsUserAddress)) {
      toast.error('Please enter a valid user address to fetch donations.');
      return;
    }
    try {
      const response = await retryRequest(() =>
        api.get(`/api/user-donations?address=${donationsUserAddress}`)
      );
      setDonationsList(response.data);
    } catch (error: any) {
      console.error('Error fetching user donations:', error);
      setError('Failed to fetch user donations. Please try again.');
      toast.error('Failed to fetch user donations. Please try again.');
    }
  };

  // Sincronização manual
  const handleManualSync = async () => {
    if (!account || !isAddress(account)) {
      toast.error('Please connect a valid wallet.');
      return;
    }
    try {
      setIsSyncing(true);
      const response = await api.post('/api/sync', {}, {
        headers: { 'x-requester': account },
      });
      toast.success(response.data.message);
      await fetchContractStats();
      await fetchUsersList();
    } catch (error: any) {
      console.error('Error during manual sync:', error);
      setError('Failed to perform manual sync. Please try again.');
      toast.error('Failed to perform manual sync. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Funções para ações do admin
  const handleInjectFunds = async () => {
    if (!account || !isAddress(account) || !injectFundsAmount || parseFloat(injectFundsAmount) <= 0) {
      toast.error('Please enter a valid amount and ensure your wallet is connected.');
      return;
    }
    try {
      const response = await api.post('/api/inject-funds', { amount: injectFundsAmount }, {
        headers: { 'x-requester': account },
      });
      toast.success('Funds injected successfully!');
      setInjectFundsAmount('');
      await fetchContractStats();
    } catch (error: any) {
      console.error('Error injecting funds:', error);
      toast.error('Failed to inject funds. Please try again.');
    }
  };

  const handleInjectHelp = async () => {
    if (!account || !isAddress(account) || !injectHelpAmount || parseFloat(injectHelpAmount) <= 0) {
      toast.error('Please enter a valid amount and ensure your wallet is connected.');
      return;
    }
    try {
      const response = await api.post('/api/inject-help', { amount: injectHelpAmount }, {
        headers: { 'x-requester': account },
      });
      toast.success('HELP tokens injected successfully!');
      setInjectHelpAmount('');
      await fetchContractStats();
    } catch (error: any) {
      console.error('Error injecting HELP:', error);
      toast.error('Failed to inject HELP tokens. Please try again.');
    }
  };

  const handleResetQueue = async () => {
    if (!account || !isAddress(account)) {
      toast.error('Please connect a valid wallet.');
      return;
    }
    try {
      const response = await api.post('/api/reset-queue', {}, {
        headers: { 'x-requester': account },
      });
      toast.success('Queue reset successfully!');
    } catch (error: any) {
      console.error('Error resetting queue:', error);
      toast.error('Failed to reset queue. Please try again.');
    }
  };

  const handleWithdrawFromReserve = async () => {
    if (!account || !isAddress(account) || !withdrawTo || !isAddress(withdrawTo) || !withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid recipient address and amount.');
      return;
    }
    try {
      const response = await api.post('/api/withdraw-from-reserve', {
        to: withdrawTo,
        amount: withdrawAmount,
      }, {
        headers: { 'x-requester': account },
      });
      toast.success('Withdrawal from reserve successful!');
      setWithdrawTo('');
      setWithdrawAmount('');
      await fetchContractStats();
    } catch (error: any) {
      console.error('Error withdrawing from reserve:', error);
      toast.error('Failed to withdraw from reserve. Please try again.');
    }
  };

  const handleRecoverTokens = async () => {
    if (!account || !isAddress(account) || !recoverTokenAddress || !isAddress(recoverTokenAddress) || !recoverAmount || parseFloat(recoverAmount) <= 0) {
      toast.error('Please enter a valid token address and amount.');
      return;
    }
    try {
      const response = await api.post('/api/recover-tokens', {
        tokenAddress: recoverTokenAddress,
        amount: recoverAmount,
      }, {
        headers: { 'x-requester': account },
      });
      toast.success('Tokens recovered successfully!');
      setRecoverTokenAddress('');
      setRecoverAmount('');
    } catch (error: any) {
      console.error('Error recovering tokens:', error);
      toast.error('Failed to recover tokens. Please try again.');
    }
  };

  const handleUpdateHelpPrice = async () => {
    if (!account || !isAddress(account) || !newHelpPrice || parseFloat(newHelpPrice) <= 0) {
      toast.error('Please enter a valid price and ensure your wallet is connected.');
      return;
    }
    try {
      const amount = ethers.parseUnits(newHelpPrice, 18);
      const signer = await provider.getSigner();
      const tx = await contract.connect(signer).setHelpPrice(amount);
      await tx.wait();
      toast.success('HELP price updated successfully!');
      setNewHelpPrice('');
    } catch (error: any) {
      console.error('Error updating HELP price:', error);
      toast.error('Failed to update HELP price. Please try again.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!isOwner) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchContractStats(),
          fetchUsersList(),
        ]);
      } catch (error: any) {
        console.error('Error fetching initial data:', error);
        setError('Failed to load initial data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOwner, account]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0c0c0c] px-4">
        <motion.div
          className="bg-[#111] p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
        >
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-4">Loading...</h1>
          <p className="text-gray-400">Please wait while we fetch the data.</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0c0c0c] px-4">
        <motion.div
          className="bg-[#111] p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
        >
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-gray-400">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 text-xs sm:text-sm py-2 bg-green-500 hover:bg-green-600 rounded-lg"
          >
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0c0c0c] px-4">
        <motion.div
          className="bg-[#111] p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
        >
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">Only the contract owner can access this page.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-[#0c0c0c] min-h-screen text-white flex"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
    >
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Conteúdo Principal */}
      <div className="flex-1 p-2 sm:p-4 md:p-6 md:ml-64">
        {/* Título Principal */}
        <motion.section
          className="max-w-full mx-auto mb-4 sm:mb-6"
          variants={sectionVariants}
        >
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-green-500">Admin Panel</h1>
        </motion.section>

        {/* Renderizar o Dashboard ou o Relatório Selecionado */}
        {activeTab === "dashboard" && (
          <>
            {/* Notificação */}
            <motion.section
              className="max-w-full mx-auto mb-4 p-2 sm:p-4 bg-yellow-500/10 border border-yellow-400/50 text-yellow-200 rounded-2xl flex items-start gap-2"
              variants={sectionVariants}
            >
              <AlertCircle size={16} className="mt-1 flex-shrink-0" />
              <p className="text-xs sm:text-sm">
                This is the admin panel. Be cautious with the actions you perform here.
              </p>
            </motion.section>

            {/* Estatísticas do Contrato */}
            {contractStats && (
              <motion.section
                className="max-w-full mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6"
                variants={sectionVariants}
              >
                <Card className="p-2 sm:p-4 bg-[#111] border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-green-500" />
                    <div className="text-sm sm:text-base font-semibold">Total Users</div>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-green-500">{contractStats.totalUsers}</p>
                </Card>

                <Card className="p-2 sm:p-4 bg-[#111] border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={16} className="text-purple-500" />
                    <div className="text-sm sm:text-base font-semibold">Total Donations</div>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-purple-500">{contractStats.totalDonations} USDT</p>
                </Card>

                <Card className="p-2 sm:p-4 bg-[#111] border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift size={16} className="text-blue-500" />
                    <div className="text-sm sm:text-base font-semibold">Total Incentives</div>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-blue-500">{contractStats.totalIncentives} HELP</p>
                </Card>

                <Card className="p-2 sm:p-4 bg-[#111] border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={16} className="text-green-500" />
                    <div className="text-sm sm:text-base font-semibold">Contract USDT Balance</div>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-green-500">{contractStats.contractBalanceUsdt} USDT</p>
                </Card>

                <Card className="p-2 sm:p-4 bg-[#111] border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift size={16} className="text-purple-500" />
                    <div className="text-sm sm:text-base font-semibold">Contract HELP Balance</div>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-purple-500">{contractStats.contractBalanceHelp} HELP</p>
                </Card>
              </motion.section>
            )}

            {/* Ações do Admin */}
            <motion.section
              className="max-w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 sm:mb-6"
              variants={sectionVariants}
            >
              <Card className="p-2 sm:p-4 bg-[#111] border border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-green-500" />
                  <div className="text-sm sm:text-base font-semibold">Inject Funds (USDT)</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="number"
                    value={injectFundsAmount}
                    onChange={(e) => setInjectFundsAmount(e.target.value)}
                    placeholder="Amount (USDT)"
                    className="flex-1 text-xs sm:text-sm py-2 bg-[#222] border-gray-600 text-white"
                  />
                  <Button
                    onClick={handleInjectFunds}
                    className="text-xs sm:text-sm py-2 bg-green-500 hover:bg-green-600 rounded-lg"
                  >
                    Inject Funds
                  </Button>
                </div>
              </Card>

              <Card className="p-2 sm:p-4 bg-[#111] border border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Gift size={16} className="text-purple-500" />
                  <div className="text-sm sm:text-base font-semibold">Inject HELP Tokens</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="number"
                    value={injectHelpAmount}
                    onChange={(e) => setInjectHelpAmount(e.target.value)}
                    placeholder="Amount (HELP)"
                    className="flex-1 text-xs sm:text-sm py-2 bg-[#222] border-gray-600 text-white"
                  />
                  <Button
                    onClick={handleInjectHelp}
                    className="text-xs sm:text-sm py-2 bg-purple-500 hover:bg-purple-600 rounded-lg"
                  >
                    Inject HELP
                  </Button>
                </div>
              </Card>

              <Card className="p-2 sm:p-4 bg-[#111] border border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw size={16} className="text-red-500" />
                  <div className="text-sm sm:text-base font-semibold">Reset Queue</div>
                </div>
                <Button
                  onClick={handleResetQueue}
                  className="w-full text-xs sm:text-sm py-2 bg-red-500 hover:bg-red-600 rounded-lg"
                >
                  Reset Queue
                </Button>
              </Card>

              <Card className="p-2 sm:p-4 bg-[#111] border border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Download size={16} className="text-yellow-500" />
                  <div className="text-sm sm:text-base font-semibold">Withdraw from Reserve</div>
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={withdrawTo}
                    onChange={(e) => setWithdrawTo(e.target.value)}
                    placeholder="Recipient Address"
                    className="text-xs sm:text-sm py-2 bg-[#222] border-gray-600 text-white"
                  />
                  <Input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Amount (USDT)"
                    className="text-xs sm:text-sm py-2 bg-[#222] border-gray-600 text-white"
                  />
                  <Button
                    onClick={handleWithdrawFromReserve}
                    className="w-full text-xs sm:text-sm py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg"
                  >
                    Withdraw
                  </Button>
                </div>
              </Card>

              <Card className="p-2 sm:p-4 bg-[#111] border border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Download size={16} className="text-blue-500" />
                  <div className="text-sm sm:text-base font-semibold">Recover Tokens</div>
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={recoverTokenAddress}
                    onChange={(e) => setRecoverTokenAddress(e.target.value)}
                    placeholder="Token Address"
                    className="text-xs sm:text-sm py-2 bg-[#222] border-gray-600 text-white"
                  />
                  <Input
                    type="number"
                    value={recoverAmount}
                    onChange={(e) => setRecoverAmount(e.target.value)}
                    placeholder="Amount"
                    className="text-xs sm:text-sm py-2 bg-[#222] border-gray-600 text-white"
                  />
                  <Button
                    onClick={handleRecoverTokens}
                    className="w-full text-xs sm:text-sm py-2 bg-blue-500 hover:bg-blue-600 rounded-lg"
                  >
                    Recover Tokens
                  </Button>
                </div>
              </Card>

              <Card className="p-2 sm:p-4 bg-[#111] border border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-teal-500" />
                  <div className="text-sm sm:text-base font-semibold">Update HELP Price</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="number"
                    value={newHelpPrice}
                    onChange={(e) => setNewHelpPrice(e.target.value)}
                    placeholder="New HELP Price (USDT)"
                    className="flex-1 text-xs sm:text-sm py-2 bg-[#222] border-gray-600 text-white"
                  />
                  <Button
                    onClick={handleUpdateHelpPrice}
                    className="text-xs sm:text-sm py-2 bg-teal-500 hover:bg-teal-600 rounded-lg"
                  >
                    Update Price
                  </Button>
                </div>
              </Card>

              <Card className="p-2 sm:p-4 bg-[#111] border border-gray-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw size={16} className="text-orange-500" />
                  <div className="text-sm sm:text-base font-semibold">Manual Sync</div>
                </div>
                <Button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="w-full text-xs sm:text-sm py-2 bg-orange-500 hover:bg-orange-600 rounded-lg"
                >
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </Card>
            </motion.section>
          </>
        )}

        {/* Relatórios */}
        {activeTab === "registered-users" && (
          <motion.section className="max-w-full mx-auto mb-4 sm:mb-6" variants={sectionVariants}>
            <Card className="p-2 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold mb-2">Registered Users</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-300 text-[10px] sm:text-xs">Address</TableHead>
                      <TableHead className="text-gray-300 text-[10px] sm:text-xs">Level</TableHead>
                      <TableHead className="text-gray-300 text-[10px] sm:text-xs">Donations Received</TableHead>
                      <TableHead className="text-gray-300 text-[10px] sm:text-xs">Balance (USDT)</TableHead>
                      <TableHead className="text-gray-300 text-[10px] sm:text-xs">HELP Balance</TableHead>
                      <TableHead className="text-gray-300 text-[10px] sm:text-xs">Registration Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersList.length > 0 ? (
                      usersList.map((user, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-gray-400 text-[10px] sm:text-xs">{user.address?.slice(0, 6)}...{user.address?.slice(-4)}</TableCell>
                          <TableCell className="text-gray-400 text-[10px] sm:text-xs">{user.currentLevel}</TableCell>
                          <TableCell className="text-gray-400 text-[10px] sm:text-xs">{user.donationsReceived}</TableCell>
                          <TableCell className="text-gray-400 text-[10px] sm:text-xs">{user.balance}</TableCell>
                          <TableCell className="text-gray-400 text-[10px] sm:text-xs">{user.helpBalance}</TableCell>
                          <TableCell className="text-gray-400 text-[10px] sm:text-xs">{user.registrationDate}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-gray-400 text-[10px] sm:text-xs text-center">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </motion.section>
        )}

        {activeTab === "all-transactions" && (
          <motion.section className="max-w-full mx-auto mb-4 sm:mb-6" variants={sectionVariants}>
            <AllTransactions />
          </motion.section>
        )}

        {activeTab === "incentives-report" && (
          <motion.section className="max-w-full mx-auto mb-4 sm:mb-6" variants={sectionVariants}>
            <Card className="p-2 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold mb-2">Incentives Report</h3>
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <Input
                  type="text"
                  value={incentivesUserAddress}
                  onChange={(e) => setIncentivesUserAddress(e.target.value)}
                  placeholder="User Address"
                  className="flex-1 text-xs sm:text-sm py-2 bg-[#222] border-gray-600 text-white"
                />
                <Button
                  onClick={fetchIncentivesList}
                  className="text-xs sm:text-sm py-2 bg-purple-500 hover:bg-purple-600 rounded-lg"
                >
                  Fetch Incentives
                </Button>
              </div>
              <HelpTransactions address={incentivesUserAddress} />
            </Card>
          </motion.section>
        )}

        {activeTab === "donations-report" && (
          <motion.section className="max-w-full mx-auto mb-4 sm:mb-6" variants={sectionVariants}>
            <Card className="p-2 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold mb-2">User Donations Report</h3>
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <Input
                  type="text"
                  value={donationsUserAddress}
                  onChange={(e) => setDonationsUserAddress(e.target.value)}
                  placeholder="User Address"
                  className="flex-1 text-xs sm:text-sm py-2 bg-[#222] border-gray-600 text-white"
                />
                <Button
                  onClick={fetchUserDonations}
                  className="text-xs sm:text-sm py-2 bg-green-500 hover:bg-green-600 rounded-lg"
                >
                  Fetch Donations
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-300 text-[10px] sm:text-xs">Tx Hash</TableHead>
                      <TableHead className="text-gray-300 text-[10px] sm:text-xs">Method</TableHead>
                      <TableHead className="text-gray-300 text-[10px] sm:text-xs">Amount (USDT)</TableHead>
                      <TableHead className="text-gray-300 text-[10px] sm:text-xs">Level</TableHead>
                      <TableHead className="text-gray-300 text-[10px] sm:text-xs">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donationsList.length > 0 ? (
                      donationsList.map((donation, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-gray-400 text-[10px] sm:text-xs">{donation.transactionHash.slice(0, 6)}...{donation.transactionHash.slice(-4)}</TableCell>
                          <TableCell className="text-gray-400 text-[10px] sm:text-xs">{donation.method}</TableCell>
                          <TableCell className="text-gray-400 text-[10px] sm:text-xs">{donation.amount}</TableCell>
                          <TableCell className="text-gray-400 text-[10px] sm:text-xs">{donation.level}</TableCell>
                          <TableCell className="text-gray-400 text-[10px] sm:text-xs">{new Date(donation.date).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-gray-400 text-[10px] sm:text-xs text-center">
                          No donations found for this user.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </motion.section>
        )}
      </div>
    </motion.div>
  );
}