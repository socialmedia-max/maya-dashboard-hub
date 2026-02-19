import { supabase } from "@/integrations/supabase/client";

export async function getSettings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveSettings(api_url: string, api_token: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { data: existing } = await supabase
    .from("settings")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("settings")
      .update({ api_url, api_token })
      .eq("user_id", user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("settings")
      .insert({ user_id: user.id, api_url, api_token });
    if (error) throw error;
  }
}

async function apiRequest(path: string, options?: RequestInit) {
  const settings = await getSettings();
  if (!settings?.api_url || !settings?.api_token) {
    throw new Error("Configure a URL da API e o Token nas Configurações.");
  }

  const url = `${settings.api_url.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.api_token}`,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`Erro na API: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  getDashboard: () => apiRequest("/api/dashboard"),
  getConversations: () => apiRequest("/api/conversations"),
  getConversation: (leadId: string) => apiRequest(`/api/conversations/${leadId}`),
  getPrompt: () => apiRequest("/api/prompt"),
  updatePrompt: (body: any) =>
    apiRequest("/api/prompt", { method: "PUT", body: JSON.stringify(body) }),
  testConnection: async () => {
    try {
      await apiRequest("/api/dashboard");
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },
};
