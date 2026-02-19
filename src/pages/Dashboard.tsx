import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Brain,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PHASE_COLORS = [
  "hsl(263, 70%, 58%)",
  "hsl(220, 70%, 55%)",
  "hsl(180, 60%, 45%)",
  "hsl(45, 80%, 55%)",
  "hsl(140, 60%, 45%)",
  "hsl(0, 65%, 55%)",
];

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.getDashboard,
    retry: 1,
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar dados</h2>
        <p className="text-muted-foreground max-w-md">
          {(error as Error).message}. Verifique suas configurações de API.
        </p>
      </div>
    );
  }

  const metrics = [
    {
      title: "Conversas Hoje",
      value: data?.conversations_today ?? "—",
      sub: `Semana: ${data?.conversations_week ?? "—"} · Mês: ${data?.conversations_month ?? "—"}`,
      icon: MessageSquare,
    },
    {
      title: "Taxa de Conversão",
      value: data?.conversion_rate ? `${(data.conversion_rate * 100).toFixed(1)}%` : "—",
      sub: "Leads em FINALIZACAO",
      icon: TrendingUp,
    },
    {
      title: "Escalonamentos",
      value: data?.total_escalations ?? "—",
      sub: "Total para humano",
      icon: AlertTriangle,
    },
    {
      title: "Confiança Média",
      value: data?.avg_confidence ? `${(data.avg_confidence * 100).toFixed(0)}%` : "—",
      sub: "Respostas da Maya",
      icon: Brain,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) =>
          isLoading ? (
            <Skeleton key={m.title} className="h-28 rounded-xl" />
          ) : (
            <Card key={m.title}>
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <m.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{m.title}</p>
                  <p className="text-2xl font-bold">{m.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversas por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data?.conversations_per_day ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(263, 70%, 58%)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Fase</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data?.phase_distribution ?? []}
                    dataKey="value"
                    nameKey="phase"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ phase }) => phase}
                  >
                    {(data?.phase_distribution ?? []).map((_: any, i: number) => (
                      <Cell key={i} fill={PHASE_COLORS[i % PHASE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Objections */}
      {data?.common_objections?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Objeções Mais Comuns</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.common_objections.map((obj: any, i: number) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2 text-sm">
                  <span>{obj.text || obj}</span>
                  {obj.count && (
                    <span className="text-xs text-muted-foreground font-medium">{obj.count}x</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
