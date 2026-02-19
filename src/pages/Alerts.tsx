import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function Alerts() {
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: api.getConversations,
    retry: 1,
  });

  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const escalated = (conversations ?? []).filter((c: any) => c.flag === "ESCALATE");

  const toggleResolved = (leadId: string) => {
    setResolved((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Alertas / Escalonamentos</h1>
        {escalated.filter((c: any) => !resolved.has(c.lead_id)).length > 0 && (
          <Badge variant="destructive">
            {escalated.filter((c: any) => !resolved.has(c.lead_id)).length} pendentes
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : escalated.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mb-3" />
            <p className="text-lg font-semibold">Nenhum escalonamento</p>
            <p className="text-sm text-muted-foreground">Todas as conversas estão sob controle.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {escalated.map((c: any) => {
            const isResolved = resolved.has(c.lead_id);
            return (
              <Card key={c.lead_id} className={isResolved ? "opacity-60" : ""}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${isResolved ? "text-muted-foreground" : "text-destructive"}`} />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{c.lead_name || c.lead_id}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {c.last_message || "Sem mensagem"}
                      </p>
                      {c.escalation_reason && (
                        <p className="text-xs text-destructive mt-1">Motivo: {c.escalation_reason}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {c.last_message_at ? new Date(c.last_message_at).toLocaleString("pt-BR") : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={isResolved ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => toggleResolved(c.lead_id)}
                  >
                    {isResolved ? "Reabrir" : "Resolver"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
