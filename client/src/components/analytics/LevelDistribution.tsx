import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { type UserInfo } from '@shared/types';

interface LevelDistributionProps {
  users: UserInfo[];
}

export function LevelDistribution({ users }: LevelDistributionProps) {
  const distribution = users.reduce((acc, user) => {
    acc[user.currentLevel - 1] = (acc[user.currentLevel - 1] || 0) + 1;
    return acc;
  }, Array(6).fill(0));

  const data = distribution.map((count, index) => ({
    name: `Nível ${index + 1}`,
    value: count
  }));

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--primary))'
  ];

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Distribuição por Nível</h3>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
