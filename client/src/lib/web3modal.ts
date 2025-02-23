import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { polygonMumbai } from 'wagmi/chains';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

const metadata = {
  name: 'Help Mutual System Test',
  description: 'Interface de testes para o sistema de ajuda mútua',
  url: 'https://your-url.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [polygonMumbai] as const;
export const config = defaultWagmiConfig({ chains, projectId, metadata });

export const web3modal = createWeb3Modal({ wagmiConfig: config, projectId, defaultChain: polygonMumbai });