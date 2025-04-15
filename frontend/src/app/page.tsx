// Arquivo: www/wwwroot/integrazap.shop/frontend/src/app/page.tsx

"use client";

import { useWeb3 } from '../context/Web3Context';
import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import Chart from '../components/Chart';
import StatusCard from '../components/StatusCard';
import RecentTransactions from '../components/RecentTransactions';
import api from '../lib/axios';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import { isAddress } from 'ethers';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface UserInfo {
  isRegistered: boolean;
  currentLevel: number;
  sponsor: string;
  referrals: number;
  balance: number;
  donationsReceived: number;
  hasDonated: boolean;
  queuePosition: number;
  registrationDate: string;
  entryFee: number;
  helpBalance: number;
  isInQueue: boolean;
  lockedAmount: number;
  unlockTimestamp: number;
}

interface Transaction {
  transactionHash: string;
  method: string;
  block: number;
  date: string;
  from: string;
  to: string;
  amount: number;
  token: string;
}

interface VoluntaryDonation {
  transactionHash: string;
  method: string;
  block: number;
  date: string;
  from: string;
  amount: number;
  reservePool: number;
}

interface ChartData {
  name: string;
  value: number;
}

interface ContractInfo {
  helpPrice: number;
  entryFee: number;
  usdtAddress: string;
  helpAddress: string;
  incentiveAmount: number;
  incentiveLimit: number;
  lockPeriod: number;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Home() {
  const { t } = useTranslation();
  const { account, contract, provider, connectWallet } = useWeb3();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [helpPriceData, setHelpPriceData] = useState<ChartData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [helpTransactions, setHelpTransactions] = useState<Transaction[]>([]);
  const [voluntaryDonations, setVoluntaryDonations] = useState<VoluntaryDonation[]>([]);
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isClaimIncentiveModalOpen, setIsClaimIncentiveModalOpen] = useState(false);
  const [sponsorAddress, setSponsorAddress] = useState('');
  const [donateAmount, setDonateAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isLoadingHelpTransactions, setIsLoadingHelpTransactions] = useState(false);
  const [isLoadingAllTransactions, setIsLoadingAllTransactions] = useState(false);
  const [isLoadingVoluntaryDonations, setIsLoadingVoluntaryDonations] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const transactionsPerPage = 10;

  const retryRequest = async (fn: () => Promise<any>, retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        if ((error.message.includes('Too Many Requests') || error.response?.status === 502) && i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  };

  const fetchUserInfo = async () => {
    if (!account || !contract || !isAddress(account)) {
      setErrorMessage('Please connect a valid wallet.');
      setUserInfo(null);
      return;
    }
    try {
      setIsLoadingHelpTransactions(true);
      const response = await retryRequest(() =>
        api.get(`/api/user-info?address=${account}`)
      );
      const userData: UserInfo = response.data;
      userData.referrals = userData.referrals || 0;
      userData.hasDonated = userData.donationsReceived > 0;

      const queueAndIncentiveInfo = await contract.getUserQueueAndIncentiveInfo(account);
      userData.isInQueue = queueAndIncentiveInfo.isInQueue;
      userData.queuePosition = Number(queueAndIncentiveInfo.queuePosition);
      userData.lockedAmount = Number(ethers.formatUnits(queueAndIncentiveInfo.lockedAmount, 18));
      userData.unlockTimestamp = Number(queueAndIncentiveInfo.unlockTimestamp);

      setUserInfo(userData);
      setErrorMessage(null);

      const price = await contract.getHelpPrice();
      const currentPrice = Number(ethers.formatUnits(price, 18));
      const mockChartData: ChartData[] = [
        { name: 'Jan', value: currentPrice * 0.8 },
        { name: 'Feb', value: currentPrice * 0.9 },
        { name: 'Mar', value: currentPrice * 0.95 },
        { name: 'Apr', value: currentPrice },
        { name: 'May', value: currentPrice * 1.05 },
      ];
      setHelpPriceData(mockChartData);

      if (userData.isRegistered) {
        const txResponse = await retryRequest(() =>
          api.get(`/api/transactions?address=${account}`)
        );
        if (txResponse.data.length === 0) {
          toast.info('No transactions found for this account.');
        }
        setTransactions(txResponse.data);

        const helpTxResponse = await retryRequest(() =>
          api.get(`/api/help-transactions?address=${account}`)
        );
        if (helpTxResponse.data.length === 0) {
          toast.info('No HELP transactions found for this account.');
        }
        setHelpTransactions(helpTxResponse.data);

        const voluntaryDonationsResponse = await retryRequest(() =>
          api.get(`/api/voluntary-donations?address=${account}`)
        );
        if (voluntaryDonationsResponse.data.length === 0) {
          toast.info('No voluntary donations found for this account.');
        }
        setVoluntaryDonations(voluntaryDonationsResponse.data);
      } else {
        setTransactions([]);
        setHelpTransactions([]);
        setVoluntaryDonations([]);
      }
    } catch (error: any) {
      console.error('Error fetching user info:', error);
      const errorMessage = error.message.includes('Too Many Requests')
        ? 'Rate limit exceeded. Please try again later.'
        : error.response?.status === 502
        ? 'Backend is currently unavailable (502 Bad Gateway). Please try again later.'
        : `Failed to fetch user info: ${error.response?.data?.message || error.message}`;
      setErrorMessage(errorMessage);
      toast.error(errorMessage);
      setUserInfo(null);
    } finally {
      setIsLoadingHelpTransactions(false);
    }
  };

  const fetchContractInfo = async () => {
    if (!contract) {
      setErrorMessage('Contract not available. Please try again.');
      return;
    }
    try {
      const helpPrice = Number(ethers.formatUnits(await contract.getHelpPrice(), 18));
      const entryFee = Number(ethers.formatUnits(await contract.ENTRY_FEE(), 6));
      const usdtAddress = await contract.usdt();
      const helpAddress = await contract.helpToken();
      const incentiveAmount = Number(ethers.formatUnits(await contract.INCENTIVE_AMOUNT(), 18));
      const incentiveLimit = Number(await contract.INCENTIVE_LIMIT());
      const lockPeriod = Number(await contract.LOCK_PERIOD());
      setContractInfo({
        helpPrice,
        entryFee,
        usdtAddress,
        helpAddress,
        incentiveAmount,
        incentiveLimit,
        lockPeriod,
      });
      setErrorMessage(null);
    } catch (error) {
      console.error('Error fetching contract info:', error);
      setErrorMessage('Failed to fetch contract info. Please try again.');
      toast.error('Failed to fetch contract info. Please try again.');
    }
  };

  const fetchAllTransactions = async () => {
    try {
      setIsLoadingAllTransactions(true);
      const response = await retryRequest(() =>
        api.get('/api/all-contract-transactions')
      );
      const allTxs = response.data || [];
      if (allTxs.length === 0) {
        toast.info('No transactions found on the blockchain.');
      }
      console.log(`Total transactions fetched: ${allTxs.length}`);
      setAllTransactions(allTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setErrorMessage(null);
    } catch (error: any) {
      console.error('Error fetching all transactions:', error);
      const errorMessage = error.message.includes('Too Many Requests')
        ? 'Rate limit exceeded. Please try again later.'
        : error.response?.status === 502
        ? 'Backend is currently unavailable (502 Bad Gateway). Please try again later.'
        : 'Failed to fetch all transactions. Please try again.';
      setErrorMessage(errorMessage);
      toast.error(errorMessage);
      setAllTransactions([]);
    } finally {
      setIsLoadingAllTransactions(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      await fetchUserInfo();
      await delay(1000);
      await fetchContractInfo();
      await delay(1000);
      await fetchAllTransactions();
    };

    fetchData();

    if (account && contract && provider) {
      let entryFeeValue = 20;
      contract.ENTRY_FEE().then((fee: any) => {
        entryFeeValue = Number(ethers.formatUnits(fee, 6));
      }).catch((error: any) => {
        console.error('Error fetching ENTRY_FEE:', error);
        toast.error('Failed to fetch entry fee. Using default value.');
      });

      contract.on('DonationReceived', async (user, amount, level, newBalance, event) => {
        if (user.toLowerCase() === account.toLowerCase()) {
          toast.success(`Donation received: ${Number(ethers.formatUnits(amount, 6))} USDT at level ${level}`);
          await fetchUserInfo();
          await fetchAllTransactions();

          const block = await provider.getBlock(event.blockNumber);
          if (block) {
            const newTx = {
              transactionHash: event.transactionHash,
              method: 'DonationReceived',
              block: event.blockNumber,
              date: new Date(block.timestamp * 1000).toISOString(),
              from: user,
              to: contract.target,
              amount: Number(ethers.formatUnits(amount, 6)),
              token: 'USDT',
            };
            setTransactions((prev) => [newTx, ...prev]);
            setAllTransactions((prev) => [newTx, ...prev]);
          }
        }
      });

      contract.on('Withdrawal', async (user, amountUsdt, amountHelp, remainingBalance, event) => {
        if (user.toLowerCase() === account.toLowerCase()) {
          toast.success(`Withdrawal successful: ${Number(ethers.formatUnits(amountUsdt, 6))} USDT`);
          await fetchUserInfo();
          await fetchAllTransactions();

          const block = await provider.getBlock(event.blockNumber);
          if (block) {
            const newTx = {
              transactionHash: event.transactionHash,
              method: 'Withdrawal',
              block: event.blockNumber,
              date: new Date(block.timestamp * 1000).toISOString(),
              from: contract.target,
              to: user,
              amount: Number(ethers.formatUnits(amountUsdt, 6)),
              token: 'USDT',
            };
            setTransactions((prev) => [newTx, ...prev]);
            setAllTransactions((prev) => [newTx, ...prev]);
          }
        }
      });

      contract.on('UserRegistered', async (user, sponsor, event) => {
        if (user.toLowerCase() === account.toLowerCase()) {
          toast.success('Successfully registered!');
          await fetchUserInfo();
          await fetchAllTransactions();

          const block = await provider.getBlock(event.blockNumber);
          if (block) {
            const newTx = {
              transactionHash: event.transactionHash,
              method: 'Register',
              block: event.blockNumber,
              date: new Date(block.timestamp * 1000).toISOString(),
              from: user,
              to: contract.target,
              amount: entryFeeValue,
              token: 'USDT',
            };
            setTransactions((prev) => [newTx, ...prev]);
            setAllTransactions((prev) => [newTx, ...prev]);
          }
        }
      });

      contract.on('IncentiveGranted', async (user, amount, unlockTimestamp, event) => {
        if (user.toLowerCase() === account.toLowerCase()) {
          toast.success(`Incentive granted: ${Number(ethers.formatUnits(amount, 18))} HELP, unlock at ${new Date(Number(unlockTimestamp) * 1000).toLocaleString()}`);
          await fetchUserInfo();
          await fetchAllTransactions();

          const block = await provider.getBlock(event.blockNumber);
          if (block) {
            const newTx = {
              transactionHash: event.transactionHash,
              method: 'IncentiveGranted',
              block: event.blockNumber,
              date: new Date(block.timestamp * 1000).toISOString(),
              from: contract.target,
              to: user,
              amount: Number(ethers.formatUnits(amount, 18)),
              token: 'HELP',
            };
            setTransactions((prev) => [newTx, ...prev]);
            setAllTransactions((prev) => [newTx, ...prev]);
          }
        }
      });

      contract.on('IncentiveClaimed', async (user, amount, event) => {
        if (user.toLowerCase() === account.toLowerCase()) {
          toast.success(`Incentive claimed: ${Number(ethers.formatUnits(amount, 18))} HELP`);
          await fetchUserInfo();
          await fetchAllTransactions();

          const block = await provider.getBlock(event.blockNumber);
          if (block) {
            const newTx = {
              transactionHash: event.transactionHash,
              method: 'IncentiveClaimed',
              block: event.blockNumber,
              date: new Date(block.timestamp * 1000).toISOString(),
              from: contract.target,
              to: user,
              amount: Number(ethers.formatUnits(amount, 18)),
              token: 'HELP',
            };
            setTransactions((prev) => [newTx, ...prev]);
            setAllTransactions((prev) => [newTx, ...prev]);
          }
        }
      });

      contract.on('LevelUp', async (user, newLevel, remainingBalance, event) => {
        if (user.toLowerCase() === account.toLowerCase()) {
          toast.success(`Level up! You are now at level ${newLevel}`);
          await fetchUserInfo();
          await fetchAllTransactions();

          const block = await provider.getBlock(event.blockNumber);
          if (block) {
            const newTx = {
              transactionHash: event.transactionHash,
              method: 'LevelUp',
              block: event.blockNumber,
              date: new Date(block.timestamp * 1000).toISOString(),
              from: user,
              to: contract.target,
              amount: 0,
              token: 'N/A',
            };
            setTransactions((prev) => [newTx, ...prev]);
            setAllTransactions((prev) => [newTx, ...prev]);
          }
        }
      });

      contract.on('VoluntaryDonation', async (user, amount, reservePool, event) => {
        if (user.toLowerCase() === account.toLowerCase()) {
          toast.success(`Voluntary donation made: ${Number(ethers.formatUnits(amount, 6))} USDT`);
          await fetchUserInfo();
          await fetchAllTransactions();

          const block = await provider.getBlock(event.blockNumber);
          if (block) {
            const newTx = {
              transactionHash: event.transactionHash,
              method: 'VoluntaryDonation',
              block: event.blockNumber,
              date: new Date(block.timestamp * 1000).toISOString(),
              from: user,
              to: contract.target,
              amount: Number(ethers.formatUnits(amount, 6)),
              token: 'USDT',
            };
            const newVoluntaryDonation = {
              transactionHash: event.transactionHash,
              method: 'VoluntaryDonation',
              block: event.blockNumber,
              date: new Date(block.timestamp * 1000).toISOString(),
              from: user,
              amount: Number(ethers.formatUnits(amount, 6)),
              reservePool: Number(ethers.formatUnits(reservePool, 6)),
            };
            setTransactions((prev) => [newTx, ...prev]);
            setAllTransactions((prev) => [newTx, ...prev]);
            setVoluntaryDonations((prev) => [newVoluntaryDonation, ...prev]);
          }
        }
      });

      return () => {
        contract.removeAllListeners('DonationReceived');
        contract.removeAllListeners('Withdrawal');
        contract.removeAllListeners('UserRegistered');
        contract.removeAllListeners('IncentiveGranted');
        contract.removeAllListeners('IncentiveClaimed');
        contract.removeAllListeners('LevelUp');
        contract.removeAllListeners('VoluntaryDonation');
      };
    }
  }, [account, contract, provider]);

  const handleRegister = async () => {
    if (!contract || !account || !provider || !isAddress(account)) {
      toast.error('Please connect a valid wallet.');
      return;
    }

    try {
      const signer = await provider.getSigner();
      const usdtAddress = await contract.usdt();
      const usdtContract = new ethers.Contract(
        usdtAddress,
        [
          'function approve(address spender, uint256 amount) public returns (bool)',
          'function allowance(address owner, address spender) public view returns (uint256)',
          'function balanceOf(address account) public view returns (uint256)',
        ],
        signer
      );

      const entryFee = await contract.ENTRY_FEE();
      const balance = await usdtContract.balanceOf(account);
      if (balance < entryFee) {
        toast.error('Insufficient USDT balance for registration.');
        return;
      }

      const allowance = await usdtContract.allowance(account, contract.target);
      if (allowance < entryFee) {
        toast.info('Approving USDT for registration...');
        const approveTx = await usdtContract.approve(contract.target, entryFee);
        await approveTx.wait();
        toast.success('USDT approved successfully!');
      }

      toast.info('Registering...');
      const tx = await contract.connect(signer).register(sponsorAddress || ethers.ZeroAddress);
      await tx.wait();

      setIsRegisterModalOpen(false);
      await fetchUserInfo();
    } catch (error: any) {
      console.error('Error registering:', error);
      if (error.code === 4001) {
        toast.error('Transaction rejected by user.');
      } else if (error.reason === 'User already registered') {
        toast.info('User already registered.');
        await fetchUserInfo();
      } else {
        toast.error('Failed to register. Please try again.');
      }
    }
  };

  const handleDonate = async () => {
    if (!contract || !account || !provider || !isAddress(account)) {
      toast.error('Please connect a valid wallet.');
      return;
    }

    try {
      if (!donateAmount || parseFloat(donateAmount) <= 0) {
        toast.error('Please enter a valid donation amount.');
        return;
      }

      const signer = await provider.getSigner();
      const usdtAddress = await contract.usdt();
      const usdtContract = new ethers.Contract(
        usdtAddress,
        [
          'function approve(address spender, uint256 amount) public returns (bool)',
          'function allowance(address owner, address spender) public view returns (uint256)',
          'function balanceOf(address account) public view returns (uint256)',
        ],
        signer
      );

      const amount = ethers.parseUnits(donateAmount, 6);
      const balance = await usdtContract.balanceOf(account);
      if (balance < amount) {
        toast.error('Insufficient USDT balance.');
        return;
      }

      const allowance = await usdtContract.allowance(account, contract.target);
      if (allowance < amount) {
        toast.info('Approving USDT for donation...');
        const approveTx = await usdtContract.approve(contract.target, amount);
        await approveTx.wait();
        toast.success('USDT approved successfully!');
      }

      toast.info('Processing donation...');
      const tx = await contract.connect(signer).donate(amount);
      await tx.wait();

      setIsDonateModalOpen(false);
      setDonateAmount('');
      await fetchUserInfo();
    } catch (error: any) {
      console.error('Error donating:', error);
      if (error.code === 4001) {
        toast.error('Transaction rejected by user.');
      } else if (error.message.includes('Insufficient USDT allowance')) {
        toast.error('Insufficient USDT allowance. Please try again.');
      } else {
        toast.error('Failed to donate. Please try again.');
      }
    }
  };

  const handleWithdraw = async () => {
    if (!contract || !account || !provider || !isAddress(account)) {
      toast.error('Please connect a valid wallet.');
      return;
    }

    try {
      if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
        toast.error('Please enter a valid withdrawal amount.');
        return;
      }

      const amount = ethers.parseUnits(withdrawAmount, 6);
      const userBalance = userInfo?.balance || 0;
      if (parseFloat(withdrawAmount) > userBalance) {
        toast.error('Insufficient balance for withdrawal.');
        return;
      }

      const signer = await provider.getSigner();
      toast.info('Processing withdrawal...');
      const tx = await contract.connect(signer).withdraw(amount);
      await tx.wait();

      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      await fetchUserInfo();
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      if (error.code === 4001) {
        toast.error('Transaction rejected by user.');
      } else if (error.message.includes('Insufficient balance')) {
        toast.error('Insufficient balance in the contract.');
      } else {
        toast.error('Failed to withdraw. Please try again.');
      }
    }
  };

  const handleClaimIncentive = async () => {
    if (!contract || !account || !provider || !isAddress(account)) {
      toast.error('Please connect a valid wallet.');
      return;
    }

    try {
      if (!userInfo?.lockedAmount || userInfo.lockedAmount <= 0) {
        toast.error('No incentive available to claim.');
        return;
      }

      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (currentTimestamp < userInfo.unlockTimestamp) {
        toast.error(`Incentive is locked until ${new Date(userInfo.unlockTimestamp * 1000).toLocaleString()}`);
        return;
      }

      const signer = await provider.getSigner();
      toast.info('Claiming incentive...');
      const tx = await contract.connect(signer).claimIncentive();
      await tx.wait();

      setIsClaimIncentiveModalOpen(false);
      await fetchUserInfo();
    } catch (error: any) {
      console.error('Error claiming incentive:', error);
      if (error.code === 4001) {
        toast.error('Transaction rejected by user.');
      } else {
        toast.error('Failed to claim incentive. Please try again.');
      }
    }
  };

  const indexOfLastTx = currentPage * transactionsPerPage;
  const indexOfFirstTx = indexOfLastTx - transactionsPerPage;
  const currentTransactions = allTransactions.slice(indexOfFirstTx, indexOfLastTx);
  const totalPages = Math.ceil(allTransactions.length / transactionsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!account) {
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
            Welcome to <span className="text-purple-500">HelpMutualSystem</span>
          </h1>
          <div className="w-full max-w-3xl mx-auto h-64 bg-gray-800 rounded-lg flex items-center justify-center mb-6">
            <img
              src="/images/home-hero.png"
              alt="Join HelpMutualSystem"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <p className="text-base sm:text-lg text-gray-300 mb-6">
            Join a decentralized mutual help system on Polygon. Donate, earn incentives, and grow your network through referrals. Start your journey today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => connectWallet('metamask')}
              className="w-full sm:w-auto text-sm sm:text-base py-3 bg-green-500 hover:bg-green-600"
            >
              {t('connect.metamask', 'Connect with MetaMask')}
            </Button>
            <Button
              onClick={() => connectWallet('walletconnect')}
              className="w-full sm:w-auto text-sm sm:text-base py-3 bg-purple-500 hover:bg-purple-600"
            >
              Connect with WalletConnect
            </Button>
          </div>
        </motion.section>

        {/* Seção "Como Ganhar" */}
        <motion.section
          className="max-w-7xl mx-auto mb-6 sm:mb-8"
          variants={sectionVariants}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-6">
            How You Can Earn with HelpMutualSystem
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 sm:p-6 bg-[#111] border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src="/images/receive-donations.png"
                  alt="Receive Donations Icon"
                  className="w-6 h-6"
                />
                <h3 className="text-lg sm:text-xl font-semibold text-white">Receive Donations</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-400">
                Make donations to move up in the queue and receive contributions from other participants.
              </p>
            </Card>
            <Card className="p-4 sm:p-6 bg-[#111] border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src="/images/earn-incentives.png"
                  alt="Earn Incentives Icon"
                  className="w-6 h-6"
                />
                <h3 className="text-lg sm:text-xl font-semibold text-white">Earn Incentives</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-400">
                Get rewarded with HELP tokens as incentives for your participation and contributions.
              </p>
            </Card>
            <Card className="p-4 sm:p-6 bg-[#111] border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src="/images/grow-referrals.png"
                  alt="Grow with Referrals Icon"
                  className="w-6 h-6"
                />
                <h3 className="text-lg sm:text-xl font-semibold text-white">Grow with Referrals</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-400">
                Invite friends to join and earn bonuses as they participate in the system.
              </p>
            </Card>
          </div>
        </motion.section>

        {/* Seção "Sobre o Sistema" */}
        <motion.section
          className="max-w-7xl mx-auto mb-6 sm:mb-8 text-center"
          variants={sectionVariants}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            About HelpMutualSystem
          </h2>
          <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto">
            HelpMutualSystem is a decentralized platform built on the Polygon blockchain, designed to foster mutual help through donations and incentives. Our mission is to create a transparent and rewarding system where participants can support each other and grow together. Join us and be part of a community that values collaboration and financial empowerment.
          </p>
        </motion.section>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="p-4 sm:p-6 bg-[#0c0c0c] min-h-screen text-white overflow-x-hidden"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
    >
      {errorMessage && (
        <motion.section
          className="max-w-4xl w-full mx-auto mb-6 p-4 bg-red-500/10 border border-red-400/50 text-red-200 rounded-2xl flex items-start gap-3"
          variants={sectionVariants}
        >
          <AlertCircle size={20} className="mt-1 flex-shrink-0" />
          <p className="text-xs sm:text-sm">{errorMessage}</p>
        </motion.section>
      )}

      <motion.section
        className="max-w-4xl w-full mx-auto mb-6 p-4 bg-yellow-500/10 border border-yellow-400/50 text-yellow-200 rounded-2xl flex items-start gap-3"
        variants={sectionVariants}
      >
        <AlertCircle size={20} className="mt-1 flex-shrink-0" />
        <p className="text-xs sm:text-sm">
          {t('registration.fee', 'This fee is used to validate your registration and will be forwarded to the participant ahead of you in the queue.')}
        </p>
      </motion.section>

      <motion.section
        className="max-w-7xl w-full mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 sm:mb-8"
        variants={sectionVariants}
      >
        <Card className="w-full">
          <div className="text-base sm:text-lg font-semibold mb-2">{t('dashboard.balance', 'Balance')}</div>
          <p className="text-lg sm:text-xl font-bold text-green-500">{userInfo?.balance || 0} USDT</p>
        </Card>

        <Card className="w-full">
          <div className="text-base sm:text-lg font-semibold mb-2">HELP Balance</div>
          <p className="text-lg sm:text-xl font-bold text-purple-500">{userInfo?.helpBalance || 0} HELP</p>
        </Card>

        <Card className="w-full">
          <div className="text-base sm:text-lg font-semibold mb-2">{t('dashboard.level', 'Level')}</div>
          <p className="text-lg sm:text-xl text-gray-200">{userInfo?.currentLevel || 0}</p>
        </Card>

        <Card className="w-full">
          <div className="text-base sm:text-lg font-semibold mb-2">{t('dashboard.referrals', 'Referrals')}</div>
          <p className="text-lg sm:text-xl text-gray-200">{userInfo?.referrals || 0}</p>
        </Card>
      </motion.section>

      {contractInfo && (
        <motion.section
          className="max-w-7xl w-full mx-auto mb-6 sm:mb-8"
          variants={sectionVariants}
        >
          <Card className="w-full">
            <div className="text-base sm:text-lg font-semibold mb-2">Contract Information</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400">HELP Price</p>
                <p className="text-lg font-bold text-green-500">{contractInfo.helpPrice} USDT</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Entry Fee</p>
                <p className="text-lg font-bold text-green-500">{contractInfo.entryFee} USDT</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Incentive Amount</p>
                <p className="text-lg font-bold text-purple-500">{contractInfo.incentiveAmount} HELP</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Lock Period</p>
                <p className="text-lg font-bold text-gray-200">{contractInfo.lockPeriod / 86400} days</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">USDT Contract</p>
                <a
                  href={`${process.env.NEXT_PUBLIC_EXPLORER_URL}/address/${contractInfo.usdtAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:underline"
                >
                  {contractInfo.usdtAddress.slice(0, 6)}...{contractInfo.usdtAddress.slice(-4)}
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-400">HELP Contract</p>
                <a
                  href={`${process.env.NEXT_PUBLIC_EXPLORER_URL}/address/${contractInfo.helpAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:underline"
                >
                  {contractInfo.helpAddress.slice(0, 6)}...{contractInfo.helpAddress.slice(-4)}
                </a>
              </div>
            </div>
          </Card>
        </motion.section>
      )}

      {userInfo?.isRegistered && userInfo.lockedAmount > 0 && (
        <motion.section
          className="max-w-7xl w-full mx-auto mb-6 sm:mb-8"
          variants={sectionVariants}
        >
          <Card className="w-full">
            <div className="text-base sm:text-lg font-semibold mb-2">Incentive Information</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-400">Locked Amount</p>
                <p className="text-lg font-bold text-purple-500">{userInfo.lockedAmount} HELP</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Unlock Date</p>
                <p className="text-lg font-bold text-gray-200">{new Date(userInfo.unlockTimestamp * 1000).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-lg font-bold text-gray-200">
                  {Math.floor(Date.now() / 1000) < userInfo.unlockTimestamp ? 'Locked' : 'Available'}
                </p>
              </div>
            </div>
          </Card>
        </motion.section>
      )}

      <motion.section
        className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 sm:mb-8"
        variants={sectionVariants}
      >
        <div className="lg:col-span-2 space-y-6">
          <Chart data={helpPriceData} />

          {userInfo?.isRegistered && (
            <Card className="p-6 w-full">
              <div className="text-base sm:text-lg font-semibold mb-2">{t('transactions.help', 'Recent HELP Transactions')}</div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs sm:text-sm text-gray-400">
                      <TableHead>{t('donations.transaction', 'Transaction')}</TableHead>
                      <TableHead>{t('donations.method', 'Method')}</TableHead>
                      <TableHead>{t('donations.date', 'Date')}</TableHead>
                      <TableHead>{t('donations.amount', 'Amount')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingHelpTransactions ? (
                      <TableRow className="text-gray-500 text-xs sm:text-sm">
                        <TableCell colSpan={4}>Loading...</TableCell>
                      </TableRow>
                    ) : helpTransactions.length > 0 ? (
                      helpTransactions.map((tx, index) => (
                        <TableRow key={index} className="text-xs sm:text-sm text-gray-500">
                          <TableCell>
                            <a
                              href={`${process.env.NEXT_PUBLIC_EXPLORER_URL}/tx/${tx.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                            >
                              {tx.transactionHash.slice(0, 6)}...
                            </a>
                          </TableCell>
                          <TableCell>{tx.method}</TableCell>
                          <TableCell>{new Date(tx.date).toLocaleString()}</TableCell>
                          <TableCell>{tx.amount} {tx.token}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="text-gray-500 text-xs sm:text-sm">
                        <TableCell colSpan={4}>No HELP transactions found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {userInfo?.isRegistered && (
            <Card className="p-6 w-full">
              <div className="text-base sm:text-lg font-semibold mb-2">Voluntary Donations</div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs sm:text-sm text-gray-400">
                      <TableHead>Transaction</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reserve Pool</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingVoluntaryDonations ? (
                      <TableRow className="text-gray-500 text-xs sm:text-sm">
                        <TableCell colSpan={6}>Loading...</TableCell>
                      </TableRow>
                    ) : voluntaryDonations.length > 0 ? (
                      voluntaryDonations.map((donation, index) => (
                        <TableRow key={index} className="text-xs sm:text-sm text-gray-500">
                          <TableCell>
                            <a
                              href={`${process.env.NEXT_PUBLIC_EXPLORER_URL}/tx/${donation.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                            >
                              {donation.transactionHash.slice(0, 6)}...
                            </a>
                          </TableCell>
                          <TableCell>{donation.method}</TableCell>
                          <TableCell>{new Date(donation.date).toLocaleString()}</TableCell>
                          <TableCell>{donation.from.slice(0, 6)}...{donation.from.slice(-4)}</TableCell>
                          <TableCell>{donation.amount} USDT</TableCell>
                          <TableCell>{donation.reservePool} USDT</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="text-gray-500 text-xs sm:text-sm">
                        <TableCell colSpan={6}>No voluntary donations found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          <Card className="p-6 w-full">
            <div className="text-base sm:text-lg font-semibold mb-2">All Transactions</div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs sm:text-sm text-gray-400">
                    <TableHead>Transaction</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Token</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAllTransactions ? (
                    <TableRow className="text-gray-500 text-xs sm:text-sm">
                      <TableCell colSpan={7}>Loading...</TableCell>
                    </TableRow>
                  ) : currentTransactions.length > 0 ? (
                    currentTransactions.map((tx, index) => (
                      <TableRow key={index} className="text-xs sm:text-sm text-gray-500">
                        <TableCell>
                          <a
                            href={`${process.env.NEXT_PUBLIC_EXPLORER_URL}/tx/${tx.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {tx.transactionHash.slice(0, 6)}...
                          </a>
                        </TableCell>
                        <TableCell>{tx.method}</TableCell>
                        <TableCell>{new Date(tx.date).toLocaleString()}</TableCell>
                        <TableCell>{tx.from.slice(0, 6)}...{tx.from.slice(-4)}</TableCell>
                        <TableCell>{tx.to.slice(0, 6)}...{tx.to.slice(-4)}</TableCell>
                        <TableCell>{tx.amount}</TableCell>
                        <TableCell>{tx.token}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="text-gray-500 text-xs sm:text-sm">
                      <TableCell colSpan={7}>No transactions found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-sm py-2 px-3"
                >
                  <ChevronLeft size={16} />
                  Previous
                </Button>
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-sm py-2 px-3"
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {userInfo ? (
            <StatusCard
              userInfo={userInfo}
              onRegister={() => setIsRegisterModalOpen(true)}
              onDonate={() => setIsDonateModalOpen(true)}
              onWithdraw={() => setIsWithdrawModalOpen(true)}
              onClaimIncentive={() => setIsClaimIncentiveModalOpen(true)}
            />
          ) : (
            <Card className="p-6 w-full">
              <div className="text-base sm:text-lg font-semibold mb-2 text-red-500">
                Error: Unable to load user info
              </div>
              <p className="text-sm text-gray-400">
                Please try reconnecting your wallet.
              </p>
            </Card>
          )}

          {userInfo?.isRegistered && transactions.length > 0 && (
            <RecentTransactions transactions={transactions} />
          )}
        </div>
      </motion.section>

      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title={t('modal.register.title', 'Register')}
      >
        <div className="space-y-4">
          <Input
            type="text"
            value={sponsorAddress}
            onChange={(e) => setSponsorAddress(e.target.value)}
            placeholder={t('modal.register.sponsor', 'Sponsor Address (Optional)')}
            className="w-full text-sm sm:text-base py-3 bg-[#222] border-gray-600 text-white"
          />
          <p className="text-sm text-gray-400">
            {t('modal.register.fee', 'Registration Fee')}: {contractInfo?.entryFee || 0} USDT
          </p>
          <Button
            onClick={handleRegister}
            className="w-full text-sm sm:text-base py-3 bg-green-500 hover:bg-green-600"
          >
            {t('modal.register.button', 'Register Now')}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isDonateModalOpen}
        onClose={() => setIsDonateModalOpen(false)}
        title={t('modal.donate.title', 'Donate')}
      >
        <div className="space-y-4">
          <Input
            type="number"
            value={donateAmount}
            onChange={(e) => setDonateAmount(e.target.value)}
            placeholder={t('modal.donate.amount', 'Amount (USDT)')}
            className="w-full text-sm sm:text-base py-3 bg-[#222] border-gray-600 text-white"
          />
          <Button
            onClick={handleDonate}
            className="w-full text-sm sm:text-base py-3 bg-blue-500 hover:bg-blue-600"
          >
            {t('modal.donate.button', 'Donate Now')}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        title={t('modal.withdraw.title', 'Withdraw')}
      >
        <div className="space-y-4">
          <Input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder={t('modal.withdraw.amount', 'Amount (USDT)')}
            className="w-full text-sm sm:text-base py-3 bg-[#222] border-gray-600 text-white"
          />
          <Button
            onClick={handleWithdraw}
            className="w-full text-sm sm:text-base py-3 bg-purple-500 hover:bg-purple-600"
          >
            {t('modal.withdraw.button', 'Withdraw Now')}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isClaimIncentiveModalOpen}
        onClose={() => setIsClaimIncentiveModalOpen(false)}
        title={t('modal.claimIncentive.title', 'Claim Incentive')}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            {t('modal.claimIncentive.available', 'Available Incentive')}: {userInfo?.lockedAmount || 0} HELP
          </p>
          <p className="text-sm text-gray-400">
            {t('modal.claimIncentive.unlockDate', 'Unlock Date')}: {userInfo?.unlockTimestamp ? new Date(userInfo.unlockTimestamp * 1000).toLocaleString() : 'N/A'}
          </p>
          <Button
            onClick={handleClaimIncentive}
            className="w-full text-sm sm:text-base py-3 bg-green-500 hover:bg-green-600"
          >
            {t('modal.claimIncentive.button', 'Claim Incentive')}
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}