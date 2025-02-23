import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { web3modal } from '@/lib/web3modal';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <Button variant="outline" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => web3modal.open()}>
      Connect Wallet
    </Button>
  );
}