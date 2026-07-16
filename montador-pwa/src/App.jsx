import { useEffect, useState, useCallback } from "react";
import { C } from "./theme";
import { supabase } from "./lib/supabase";
import { useMontador } from "./lib/useMontador";
import { registerHandlers, syncQueue, listQueue } from "./lib/offlineQueue";
import { actions } from "./lib/actions";
import { Login } from "./pages/Login";
import { Rota } from "./pages/Rota";
import { OSDetalhe } from "./pages/OSDetalhe";
import { Ponto } from "./pages/Ponto";
import { Perfil } from "./pages/Perfil";
import { BottomNav } from "./components/BottomNav";
import { Toast, OfflineBar } from "./components/ui";

registerHandlers(actions);

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [aba, setAba] = useState("rota");
  const [osAberta, setOsAberta] = useState(null);
  const [toastState, setToastState] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [pendentes, setPendentes] = useState(0);

  const { montador, loading: montadorLoading } = useMontador(session);
  const toast = (msg, type = "info") => setToastState({ msg, type });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => { setSession(s); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const refreshPendentes = useCallback(() => { listQueue().then(q => setPendentes(q.length)); }, []);

  const sync = useCallback(async () => {
    const res = await syncQueue();
    refreshPendentes();
    if (res.ok > 0) toast(`${res.ok} ação(ões) sincronizada(s).`, "success");
  }, [refreshPendentes]);

  useEffect(() => {
    refreshPendentes();
    const goOnline = () => { setOnline(true); sync(); };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    const iv = setInterval(refreshPendentes, 15000);
    if (navigator.onLine) sync();
    return () => { window.removeEventListener("online", goOnline); window.removeEventListener("offline", goOffline); clearInterval(iv); };
  }, [sync, refreshPendentes]);

  if (authLoading || (session && montadorLoading)) {
    return (
      <div style={{ minHeight: "100dvh", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>Monta<span style={{ color: C.accent }}>Movel</span></div>
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <div style={{ minHeight: "100dvh", background: C.dark, fontFamily: "'Inter',-apple-system,sans-serif", color: C.text }}>
      {!online && <OfflineBar pending={pendentes} />}
      {osAberta ? (
        <OSDetalhe osId={osAberta} montador={montador} session={session} onVoltar={() => { setOsAberta(null); }} toast={toast} />
      ) : (
        <>
          {aba === "rota" && <Rota montador={montador} onAbrirOS={setOsAberta} />}
          {aba === "ponto" && <Ponto montador={montador} toast={toast} />}
          {aba === "perfil" && <Perfil montador={montador} />}
          <BottomNav ativo={aba} setAtivo={setAba} />
        </>
      )}
      {toastState && <Toast msg={toastState.msg} type={toastState.type} onClose={() => setToastState(null)} />}
    </div>
  );
}
