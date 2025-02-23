import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { contractService } from '@/lib/contract';
import { ethers } from 'ethers';

export function ContractInfo() {
  const { data: levelAmount } = useQuery({
    queryKey: ['levelAmount', 1],
    queryFn: () => contractService.getLevelAmount(1)
  });

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold">Contract Information</h2>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <h3 className="text-lg font-semibold">Level 1 Amount</h3>
            <p>{levelAmount ? ethers.formatEther(levelAmount) : 'Loading...'} USDT</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}