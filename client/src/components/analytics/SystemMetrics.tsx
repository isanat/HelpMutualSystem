import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Users, ArrowUpCircle, CircleDollarSign, Activity } from "lucide-react";

interface MetricsProps {
  totalUsers: number;
  totalDonations: number;
  averageLevel: number;
  systemActivity: number;
}

export function SystemMetrics({ totalUsers, totalDonations, averageLevel, systemActivity }: MetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-medium">Usuários Totais</p>
              <h4 className="text-2xl font-bold">{totalUsers}</h4>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <CircleDollarSign className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-medium">Total de Doações</p>
              <h4 className="text-2xl font-bold">{totalDonations}</h4>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <ArrowUpCircle className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-medium">Nível Médio</p>
              <h4 className="text-2xl font-bold">{averageLevel.toFixed(1)}</h4>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm font-medium">Atividade</p>
              <h4 className="text-2xl font-bold">{systemActivity}%</h4>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
