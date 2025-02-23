import { useAccount } from 'wagmi';
import { Navigation } from '@/components/Navigation';
import { ContractInfo } from '@/components/ContractInfo';
import { UserRegistration } from '@/components/UserRegistration';
import { DonationSystem } from '@/components/DonationSystem';
import { UserDashboard } from '@/components/UserDashboard';
import { EventLog } from '@/components/EventLog';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">
              Connect your wallet to interact with the system
            </h2>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-8">
              <ContractInfo />
              <UserRegistration />
              <DonationSystem />
            </div>
            <div className="space-y-8">
              <UserDashboard />
              <EventLog />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}