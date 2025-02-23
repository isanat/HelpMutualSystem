import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { contractService } from '@/lib/contract';
import { type ContractEvent } from '@shared/types';

export function EventLog() {
  const [events, setEvents] = useState<ContractEvent[]>([]);

  useEffect(() => {
    const contract = contractService.contract;
    if (!contract) return;

    const handleEvent = (event: any) => {
      setEvents(prev => [{
        name: event.eventName,
        data: event.args,
        timestamp: Date.now(),
        transactionHash: event.transactionHash
      }, ...prev.slice(0, 49)]); // Mantém apenas os últimos 50 eventos
    };

    contract.on('UserRegistered', handleEvent);
    contract.on('DonationReceived', handleEvent);
    contract.on('LevelUp', handleEvent);
    contract.on('Withdrawal', handleEvent);

    return () => {
      contract.removeAllListeners();
    };
  }, [contractService.contract]);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold">Log de Eventos</h2>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {events.map((event, i) => (
            <div key={i} className="mb-4 p-3 border rounded">
              <h3 className="font-semibold">{event.name}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(event.timestamp).toLocaleString()}
              </p>
              <pre className="text-xs mt-2 bg-muted p-2 rounded overflow-x-auto">
                {JSON.stringify(event.data, null, 2)}
              </pre>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}