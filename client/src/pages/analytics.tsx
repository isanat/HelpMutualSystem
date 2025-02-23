import { useEffect, useState } from 'react';
import { DonationChart } from '@/components/analytics/DonationChart';
import { LevelDistribution } from '@/components/analytics/LevelDistribution';
import { SystemMetrics } from '@/components/analytics/SystemMetrics';
import { type ContractEvent, type UserInfo } from '@shared/types';
import { contractService } from '@/lib/contract';
import { useAccount } from 'wagmi';
import { Navigation } from '@/components/Navigation';

export default function Analytics() {
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const { isConnected } = useAccount();

  useEffect(() => {
    async function loadUsers() {
      try {
        const allUsers = await contractService.getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      }
    }

    if (isConnected) {
      loadUsers();
    }
  }, [isConnected]);

  useEffect(() => {
    const contract = contractService.contract;
    if (!contract) return;

    const handleEvent = (event: any) => {
      setEvents(prev => [{
        name: event.eventName,
        data: event.args,
        timestamp: Date.now(),
        transactionHash: event.transactionHash
      }, ...prev.slice(0, 999)]); // Mantém até 1000 eventos
    };

    // Atualiza a lista de usuários quando houver novos registros
    const handleUserRegistered = async () => {
      const allUsers = await contractService.getAllUsers();
      setUsers(allUsers);
    };

    contract.on('UserRegistered', async (...args) => {
      handleEvent({ eventName: 'UserRegistered', args });
      await handleUserRegistered();
    });
    contract.on('DonationReceived', handleEvent);
    contract.on('LevelUp', handleEvent);
    contract.on('Withdrawal', handleEvent);

    return () => {
      contract.removeAllListeners();
    };
  }, [contractService.contract]);

  const calculateMetrics = () => {
    const totalUsers = users.length;
    const totalDonations = events.filter(e => e.name === 'DonationReceived').length;
    const averageLevel = users.reduce((acc, user) => acc + user.currentLevel, 0) / (totalUsers || 1);

    // Atividade baseada em eventos nas últimas 24 horas
    const recentEvents = events.filter(e => e.timestamp > Date.now() - 24 * 60 * 60 * 1000);
    const systemActivity = Math.min(100, (recentEvents.length / 10) * 100);

    return {
      totalUsers,
      totalDonations,
      averageLevel,
      systemActivity
    };
  };

  const metrics = calculateMetrics();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">
              Connect your wallet to view analytics
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard Analítico</h1>

        <div className="space-y-8">
          <SystemMetrics {...metrics} />

          <div className="grid gap-8 md:grid-cols-3">
            <DonationChart events={events} />
            <LevelDistribution users={users} />
          </div>
        </div>
      </div>
    </div>
  );
}