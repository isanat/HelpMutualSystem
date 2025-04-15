"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { JsonRpcProvider, Contract, BrowserProvider } from 'ethers';
import { toast } from 'react-toastify';
import axios from 'axios';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import contractABI from '../abi/contractABI.json'; // Importar o ABI completo

interface Web3ContextType {
  account: string | null;
  contract: Contract | null;
  provider: BrowserProvider | null;
  connectWallet: (method: 'metamask' | 'walletconnect') => Promise<void>;
  disconnectWallet: () => void;
  isOwner: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

const SUPPORTED_CHAINS = [11155111]; // Sepolia

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [walletConnectProvider, setWalletConnectProvider] = useState<EthereumProvider | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const initializeProvider = async () => {
    try {
      const primaryRpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
      const alternativeRpcUrl = process.env.NEXT_PUBLIC_RPC_URL_ALTERNATIVE;
      if (!primaryRpcUrl || !alternativeRpcUrl) throw new Error('RPC URLs missing');

      let jsonRpcProvider: JsonRpcProvider;
      try {
        jsonRpcProvider = new JsonRpcProvider(primaryRpcUrl);
        await jsonRpcProvider.getNetwork();
      } catch {
        jsonRpcProvider = new JsonRpcProvider(alternativeRpcUrl);
        await jsonRpcProvider.getNetwork();
      }

      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress) throw new Error('Contract address missing');

      setContract(new Contract(contractAddress, contractABI, jsonRpcProvider));
    } catch (error: any) {
      console.error('Initialize provider failed:', error.message);
      toast.error('Failed to connect to blockchain. Check your setup.');
    }
  };

  const checkNetwork = async (provider: BrowserProvider) => {
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    if (!SUPPORTED_CHAINS.includes(chainId)) {
      toast.error('Please switch to Sepolia (Chain ID: 11155111)');
      disconnectWallet();
      return false;
    }
    return true;
  };

  const connectWallet = async (method: 'metamask' | 'walletconnect') => {
    try {
      if (method === 'metamask') {
        if (!window.ethereum) throw new Error('MetaMask not installed');
        const browserProvider = new BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send('eth_requestAccounts', []);
        if (!(await checkNetwork(browserProvider))) return;

        const signer = await browserProvider.getSigner();
        setAccount(accounts[0]);
        setProvider(browserProvider);
        updateContract(signer);
        await checkOwnership(accounts[0]);
        toast.success('Connected via MetaMask!');
      } else if (method === 'walletconnect') {
        const wcProvider = await EthereumProvider.init({
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
          chains: SUPPORTED_CHAINS,
          showQrModal: true,
          methods: ['eth_sendTransaction', 'eth_sign', 'personal_sign', 'eth_requestAccounts'],
          events: ['chainChanged', 'accountsChanged'],
        });
        await wcProvider.connect();
        const browserProvider = new BrowserProvider(wcProvider);
        if (!(await checkNetwork(browserProvider))) return;

        const signer = await browserProvider.getSigner();
        setAccount(wcProvider.accounts[0]);
        setProvider(browserProvider);
        setWalletConnectProvider(wcProvider);
        updateContract(signer);
        await checkOwnership(wcProvider.accounts[0]);
        toast.success('Connected via WalletConnect!');
      }
    } catch (error: any) {
      console.error('Wallet connection failed:', error.message);
      toast.error(error.message === 'MetaMask not installed' ? 'Please install MetaMask' : 'Connection failed');
    }
  };

  const updateContract = (signer: any) => {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    setContract(new Contract(contractAddress!, contractABI, signer));
  };

  const checkOwnership = async (userAccount: string) => {
    try {
      console.log('Verificando ownership...');
      console.log('backendUrl:', backendUrl);
      const response = await axios.get(`${backendUrl}/api/owner`);
      console.log('Endereço do proprietário (backend):', response.data);

      if (typeof response.data.owner === 'string') {
        const ownerAddress = response.data.owner.toLowerCase();
        const userAddress = userAccount.toLowerCase();
        console.log('Endereço do proprietário (backend):', ownerAddress);
        console.log('Endereço conectado:', userAddress);
        const isOwner = userAddress === ownerAddress;
        console.log('Resultado da comparação (isOwner):', isOwner);
        setIsOwner(isOwner);
      } else {
        console.error('Endereço do proprietário não é uma string:', response.data.owner);
        setIsOwner(false);
      }
    } catch (error) {
      console.error('Erro ao verificar ownership:', error);
      setIsOwner(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setContract(null);
    setProvider(null);
    setIsOwner(false);
    if (walletConnectProvider) walletConnectProvider.disconnect();
    setWalletConnectProvider(null);
    toast.info('Wallet disconnected');
    initializeProvider();
  };

  useEffect(() => {
    initializeProvider();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) =>
        accounts.length ? connectWallet('metamask') : disconnectWallet()
      );
      window.ethereum.on('chainChanged', () => {
        if (provider) checkNetwork(provider).then((valid) => !valid && disconnectWallet());
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
      if (walletConnectProvider) walletConnectProvider.disconnect();
    };
  }, [walletConnectProvider]);

  useEffect(() => {
    if (account) {
      checkOwnership(account);
    } else {
      setIsOwner(false);
    }
  }, [account]);

  return (
    <Web3Context.Provider value={{ account, contract, provider, connectWallet, disconnectWallet, isOwner }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) throw new Error('useWeb3 must be used within a Web3Provider');
  return context;
};