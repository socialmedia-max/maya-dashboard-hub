import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";

export default function PromptEditor() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["prompt"],
    queryFn: api.getPrompt,
    retry: 1,
  });

  const [text, setText] = useState<string | null>(null);
  const currentText = text ?? data?.text ?? "";

  const mutation = useMutation({
    mutationFn: (body: any) => api.updatePrompt(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompt"] });
      setText(null);
      toast.success("Prompt salvo com sucesso!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleRestore = (versionText: string) => {
    setText(versionText);
    toast.info("Versão restaurada no editor. Salve para aplicar.");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editor de Prompt</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prompt Atual da Maya</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <Textarea
              className="min-h-[300px] font-mono text-sm"
              value={currentText}
              onChange={(e) => setText(e.target.value)}
            />
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={mutation.isPending || isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {mutation.isPending ? "Salvando..." : "Salvar Prompt"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  A próxima mensagem da Maya já usará o novo prompt. Essa ação
                  não pode ser desfeita facilmente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => mutation.mutate({ text: currentText })}>
                  Confirmar e Salvar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Version History */}
      {data?.versions?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de Versões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.versions.map((v: any, i: number) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-4 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground mb-1">
                      {new Date(v.created_at || v.date).toLocaleString("pt-BR")}
                    </p>
                    <p className="text-sm line-clamp-2">{v.text}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(v.text)}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Restaurar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
