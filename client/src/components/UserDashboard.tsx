import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { contractService } from '@/lib/contract';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function UserDashboard() {
  const { address } = useAccount();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const { toast } = useToast();

  const { data: userInfo } = useQuery({
    queryKey: ['userInfo', address],
    queryFn: () => address ? contractService.getUserInfo(address) : null,
    enabled: !!address
  });

  async function handleWithdraw() {
    if (!userInfo?.balance) return;

    try {
      setIsWithdrawing(true);
      await contractService.withdraw(userInfo.balance);
      toast({
        title: "Saque realizado com sucesso",
        description: "Seus fundos foram transferidos"
      });
    } catch (error: any) {
      toast({
        title: "Falha no saque",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsWithdrawing(false);
    }
  }

  if (!userInfo) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold">Seu Painel</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Nível Atual</h3>
          <p>{userInfo.currentLevel}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Progresso</h3>
          <Progress value={(userInfo.donationsReceived / 10) * 100} className="mt-2" />
          <p className="text-sm text-muted-foreground mt-1">
            {userInfo.donationsReceived}/10 doações recebidas
          </p>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Saldo</h3>
          <p>{contractService.formatAmount(userInfo.balance)} USDT</p>
          <Button
            onClick={handleWithdraw}
            disabled={isWithdrawing || userInfo.balance <= BigInt(0)}
            className="mt-2"
          >
            {isWithdrawing ? 'Sacando...' : 'Sacar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}