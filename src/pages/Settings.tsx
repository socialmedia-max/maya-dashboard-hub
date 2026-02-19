import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, saveSettings, api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Wifi, WifiOff, Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const [apiUrl, setApiUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [testResult, setTestResult] = useState<null | { success: boolean; error?: string }>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (settings) {
      setApiUrl(settings.api_url || "");
      setApiToken(settings.api_token || "");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => saveSettings(apiUrl, apiToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Configurações salvas!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    // Save first so test uses new values
    try {
      await saveSettings(apiUrl, apiToken);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      const result = await api.testConnection();
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    }
    setTesting(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conexão com API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL da API</Label>
            <Input
              placeholder="https://sua-vps.com"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Bearer Token</Label>
            <Input
              type="password"
              placeholder="Seu token de autenticação"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wifi className="h-4 w-4 mr-2" />}
              Testar Conexão
            </Button>
          </div>

          {testResult && (
            <div
              className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                testResult.success
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {testResult.success ? (
                <>
                  <Wifi className="h-4 w-4" /> Conexão estabelecida com sucesso!
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" /> Falha: {testResult.error}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
