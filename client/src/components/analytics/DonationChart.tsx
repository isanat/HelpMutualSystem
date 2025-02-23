import { useState } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { type ContractEvent } from '@shared/types';

interface DonationChartProps {
  events: ContractEvent[];
}

export function DonationChart({ events }: DonationChartProps) {
  const [timeRange, setTimeRange] = useState<string>('24h');
  
  const filterEvents = () => {
    const now = Date.now();
    const ranges = {
      '24h': now - 24 * 60 * 60 * 1000,
      '7d': now - 7 * 24 * 60 * 60 * 1000,
      '30d': now - 30 * 24 * 60 * 60 * 1000
    };
    
    return events
      .filter(e => e.name === 'DonationReceived' && e.timestamp >= ranges[timeRange as keyof typeof ranges])
      .map(e => ({
        time: new Date(e.timestamp).toLocaleString(),
        amount: Number(e.data.amount) / 1e18 // Convert from wei to USDT
      }));
  };

  const data = filterEvents();

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Histórico de Doações</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">24 horas</SelectItem>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorDonation" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorDonation)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
