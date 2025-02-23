import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { contractService } from '@/lib/contract';

export function DonationSystem() {
  const [isDonating, setIsDonating] = useState(false);
  const { toast } = useToast();

  async function handleDonate() {
    try {
      setIsDonating(true);
      await contractService.donate();
      toast({
        title: "Donation successful",
        description: "Your donation has been processed"
      });
    } catch (error: any) {
      toast({
        title: "Donation failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDonating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold">Make a Donation</h2>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleDonate} 
          disabled={isDonating}
          className="w-full"
        >
          {isDonating ? 'Processing...' : 'Donate'}
        </Button>
      </CardContent>
    </Card>
  );
}
