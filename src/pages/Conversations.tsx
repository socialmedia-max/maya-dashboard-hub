import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Conversations() {
  const [search, setSearch] = useState("");
  const [filterFlag, setFilterFlag] = useState("ALL");
  const [filterPhase, setFilterPhase] = useState("ALL");
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: api.getConversations,
    retry: 1,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["conversation", selectedLead],
    queryFn: () => api.getConversation(selectedLead!),
    enabled: !!selectedLead,
    retry: 1,
  });

  const filtered = (conversations ?? []).filter((c: any) => {
    const matchSearch =
      !search ||
      c.lead_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.lead_id?.toLowerCase().includes(search.toLowerCase());
    const matchFlag = filterFlag === "ALL" || c.flag === filterFlag;
    const matchPhase = filterPhase === "ALL" || c.phase === filterPhase;
    return matchSearch && matchFlag && matchPhase;
  });

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-4">
      {/* Left: List */}
      <div className={cn("w-full md:w-96 flex flex-col shrink-0", selectedLead && "hidden md:flex")}>
        <h1 className="text-2xl font-bold mb-4">Conversas</h1>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou ID..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 mb-3">
          <Select value={filterFlag} onValueChange={setFilterFlag}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas Flags</SelectItem>
              <SelectItem value="OK">OK</SelectItem>
              <SelectItem value="ESCALATE">ESCALATE</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPhase} onValueChange={setFilterPhase}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas Fases</SelectItem>
              <SelectItem value="ABERTURA">ABERTURA</SelectItem>
              <SelectItem value="QUALIFICACAO">QUALIFICAÇÃO</SelectItem>
              <SelectItem value="RESISTENCIA">RESISTÊNCIA</SelectItem>
              <SelectItem value="DIRECIONAMENTO">DIRECIONAMENTO</SelectItem>
              <SelectItem value="FINALIZACAO">FINALIZAÇÃO</SelectItem>
              <SelectItem value="SUPORTE">SUPORTE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ScrollArea className="flex-1">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 mb-2 rounded-lg" />)
            : filtered.map((c: any) => (
                <button
                  key={c.lead_id}
                  onClick={() => setSelectedLead(c.lead_id)}
                  className={cn(
                    "w-full text-left rounded-lg p-3 mb-2 transition-colors border",
                    selectedLead === c.lead_id
                      ? "bg-primary/10 border-primary/30"
                      : "bg-card border-transparent hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{c.lead_name || c.lead_id}</span>
                    {c.flag === "ESCALATE" && (
                      <Badge variant="destructive" className="text-[10px] h-5">
                        <AlertTriangle className="h-3 w-3 mr-1" /> ESCALATE
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px] h-4">{c.phase}</Badge>
                    <span>{c.last_message_at ? new Date(c.last_message_at).toLocaleDateString("pt-BR") : ""}</span>
                  </div>
                </button>
              ))}
        </ScrollArea>
      </div>

      {/* Right: Chat Detail */}
      <div className={cn("flex-1 flex flex-col", !selectedLead && "hidden md:flex")}>
        {!selectedLead ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Selecione uma conversa
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedLead(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold">
                {detail?.lead_name || selectedLead}
              </h2>
            </div>
            <ScrollArea className="flex-1">
              {detailLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {(detail?.messages ?? []).map((msg: any, i: number) => {
                    const isLead = msg.role === "lead" || msg.sender === "lead";
                    return (
                      <div key={i} className={cn("flex", isLead ? "justify-start" : "justify-end")}>
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                            isLead
                              ? "bg-muted text-foreground rounded-bl-md"
                              : "bg-primary text-primary-foreground rounded-br-md"
                          )}
                        >
                          <p>{msg.text || msg.content}</p>
                          <div className={cn("flex items-center gap-2 mt-1.5 text-[10px]", isLead ? "text-muted-foreground" : "text-primary-foreground/70")}>
                            {msg.phase && <span>{msg.phase}</span>}
                            {msg.confidence != null && <span>Conf: {(msg.confidence * 100).toFixed(0)}%</span>}
                            {msg.flag === "ESCALATE" && <span className="text-destructive font-bold">⚠ ESCALATE</span>}
                            {msg.timestamp && <span>{new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
}
