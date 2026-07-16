import { supabase } from "./supabase";

// Ações que gravam no Supabase — usadas tanto no caminho "online direto"
// quanto como handlers da fila offline (mesma lógica, chamada mais tarde).

async function uploadEvidencia(tenantId, osId, file, label) {
  const path = `${tenantId}/os/${osId}/${Date.now()}-${label}`;
  const { error } = await supabase.storage.from("evidencias").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

async function sha256Hex(blob) {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// O montador aponta o fabricante direto na hora (ex.: "DJ Móveis"), mesmo
// que o produto da OS não tenha fabricante no catálogo. Acha por nome
// (case-insensitive) ou cadastra na hora — vira dado real pro relatório
// de assistências por fabricante (semanal/mensal/anual) no painel.
async function resolveFabricante(tenantId, fabricanteId, fabricanteNome) {
  if (fabricanteId) return fabricanteId;
  if (!fabricanteNome || !fabricanteNome.trim()) return null;
  const nome = fabricanteNome.trim();
  const { data: existente } = await supabase.from("fabricantes").select("id").ilike("nome", nome).limit(1).maybeSingle();
  if (existente) return existente.id;
  const { data: novo, error } = await supabase.from("fabricantes").insert([{ tenant_id: tenantId, nome }]).select("id").single();
  if (error) throw error;
  return novo.id;
}

export const actions = {
  async iniciar_rota({ osId, tenantId, userId, lat, lng }) {
    const { error: e1 } = await supabase.from("ordens_servico").update({ status: "Em Rota" }).eq("id", osId);
    if (e1) throw e1;
    const { error: e2 } = await supabase.from("os_eventos").insert([{ tenant_id: tenantId, os_id: osId, user_id: userId, tipo: "saida_rota", latitude: lat, longitude: lng }]);
    if (e2) throw e2;
  },

  async checkin({ osId, tenantId, userId, lat, lng }) {
    const { error: e1 } = await supabase.from("ordens_servico").update({ status: "Em Montagem" }).eq("id", osId);
    if (e1) throw e1;
    const { error: e2 } = await supabase.from("os_eventos").insert([{ tenant_id: tenantId, os_id: osId, user_id: userId, tipo: "checkin", latitude: lat, longitude: lng }]);
    if (e2) throw e2;
  },

  async foto({ osId, tenantId, userId }, files) {
    const path = await uploadEvidencia(tenantId, osId, files[0], "foto.jpg");
    const { error } = await supabase.from("os_eventos").insert([{ tenant_id: tenantId, os_id: osId, user_id: userId, tipo: "foto", foto_url: path }]);
    if (error) throw error;
  },

  async finalizar_sucesso({ osId, tenantId, userId, lat, lng }, files) {
    const assinaturaBlob = files[0];
    const path = await uploadEvidencia(tenantId, osId, assinaturaBlob, "assinatura.png");
    const hash = await sha256Hex(assinaturaBlob);
    const agora = new Date();
    const { error: e1 } = await supabase.from("ordens_servico").update({
      status: "Concluída com Sucesso", resultado: "sucesso",
      assinatura_url: path, assinatura_hash: hash, assinatura_lat: lat, assinatura_lng: lng, assinatura_at: agora.toISOString(),
      data_realizada: agora.toISOString().split("T")[0], hora_realizada: agora.toTimeString().slice(0, 8),
    }).eq("id", osId);
    if (e1) throw e1;
    const { error: e2 } = await supabase.from("os_eventos").insert([
      { tenant_id: tenantId, os_id: osId, user_id: userId, tipo: "assinatura", latitude: lat, longitude: lng, foto_url: path },
      { tenant_id: tenantId, os_id: osId, user_id: userId, tipo: "checkout", latitude: lat, longitude: lng },
    ]);
    if (e2) throw e2;
  },

  async finalizar_assistencia({ osId, tenantId, userId, motivo, observacoes, fabricanteId, fabricanteNome, lat, lng }) {
    const agora = new Date();
    const fabricanteResolvidoId = await resolveFabricante(tenantId, fabricanteId, fabricanteNome);
    const { error: e1 } = await supabase.from("ordens_servico").update({
      status: "Em Assistência", resultado: "assistencia", motivo_assist: motivo, observacoes,
      fabricante_assist_id: fabricanteResolvidoId,
      data_realizada: agora.toISOString().split("T")[0], hora_realizada: agora.toTimeString().slice(0, 8),
    }).eq("id", osId);
    if (e1) throw e1;
    const { error: e2 } = await supabase.from("os_eventos").insert([{ tenant_id: tenantId, os_id: osId, user_id: userId, tipo: "checkout", latitude: lat, longitude: lng, metadata: { motivo, fabricante: fabricanteNome || null } }]);
    if (e2) throw e2;
  },

  async ponto({ montadorId, tenantId, tipo, lat, lng }) {
    const { error } = await supabase.from("ponto_registros").insert([{ montador_id: montadorId, tenant_id: tenantId, data: new Date().toISOString().split("T")[0], tipo, hora_registro: new Date().toISOString(), latitude: lat, longitude: lng, origem: "app" }]);
    if (error) throw error;
  },
};
