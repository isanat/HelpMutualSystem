interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: 'accountsChanged', callback: (accounts: string[]) => void) => void;
  removeListener: (event: 'accountsChanged', callback: (accounts: string[]) => void) => void;
  send: (method: string, params?: unknown[]) => Promise<unknown>;
}

interface Window {
  ethereum?: EthereumProvider;
}