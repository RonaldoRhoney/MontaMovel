import { useRef, useState } from "react";
import { C } from "../theme";
import { supabase } from "../lib/supabase";
import { useDB } from "../lib/hooks";
import { parseCsv } from "../lib/csv";
import { Badge, Btn, DTable, Empty, Pill } from "../components/ui";

const COLUNAS_ESPERADAS = [
  "numero_pedido", "cliente_nome", "cliente_cpf", "cliente_telefone", "cliente_email",
  "cliente_logradouro", "cliente_numero", "cliente_complemento", "cliente_bairro", "cliente_cidade", "cliente_estado", "cliente_cep",
  "produto_nome", "produto_sku", "data_compra", "valor", "canal_origem",
];

export const Pedidos = ({ user, toast }) => {
  const [filtro, setFiltro] = useState("Disponíveis");
  const [importando, setImportando] = useState(false);
  const [resumo, setResumo] = useState(null);
  const fileRef = useRef(null);

  const { data: pedidos, loading, refetch } = useDB("pedidos", (q) =>
    q.select("id,numero_pedido,data_compra,valor,canal_origem,utilizado,produto_descricao,clientes(nome,telefone),produtos(nome)")
      .order("importado_em", { ascending: false }).limit(300)
  );

  const rows = pedidos.filter((p) => filtro === "Todos" || (filtro === "Disponíveis" ? !p.utilizado : p.utilizado));

  const importarCsv = async (file) => {
    if (!user?.tenant_id) return toast("Sem empresa vinculada.", "error");
    setImportando(true);
    setResumo(null);
    const texto = await file.text();
    const linhas = parseCsv(texto);
    let ok = 0, duplicados = 0, erros = 0;

    for (const linha of linhas) {
      try {
        if (!linha.numero_pedido || !linha.cliente_nome || !linha.cliente_telefone) { erros++; continue; }

        let clienteId = null;
        if (linha.cliente_cpf) {
          const { data: existente } = await supabase.from("clientes").select("id").eq("cpf_enc", linha.cliente_cpf).limit(1).maybeSingle();
          if (existente) clienteId = existente.id;
        }
        if (!clienteId) {
          const { data: novo, error: erroCliente } = await supabase.from("clientes").insert([{
            nome: linha.cliente_nome, cpf_enc: linha.cliente_cpf || null, telefone: linha.cliente_telefone, email: linha.cliente_email || null,
            logradouro: linha.cliente_logradouro || null, numero: linha.cliente_numero || null, complemento: linha.cliente_complemento || null,
            bairro: linha.cliente_bairro || null, cidade: linha.cliente_cidade || null, estado: linha.cliente_estado || null, cep: linha.cliente_cep || null,
            canal_origem: "importacao",
          }]).select("id").single();
          if (erroCliente) { erros++; continue; }
          clienteId = novo.id;
        }

        let produtoId = null;
        if (linha.produto_sku) {
          const { data: prod } = await supabase.from("produtos").select("id").eq("sku", linha.produto_sku).limit(1).maybeSingle();
          if (prod) produtoId = prod.id;
        }

        const { error: erroPedido } = await supabase.from("pedidos").insert([{
          numero_pedido: linha.numero_pedido, cliente_id: clienteId, produto_id: produtoId,
          produto_descricao: produtoId ? null : (linha.produto_nome || null),
          data_compra: linha.data_compra || null, valor: linha.valor ? Number(linha.valor) : null,
          canal_origem: linha.canal_origem || null,
        }]);
        if (erroPedido) {
          if (erroPedido.code === "23505") duplicados++; else erros++;
          continue;
        }
        ok++;
      } catch { erros++; }
    }

    setImportando(false);
    setResumo({ total: linhas.length, ok, duplicados, erros });
    if (ok > 0) toast(`${ok} pedido(s) importado(s)!`, "success");
    refetch();
  };

  return <div style={{ padding: 24 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
      <div style={{ display: "flex", gap: 7 }}>
        {["Disponíveis", "Utilizados", "Todos"].map((f) => <Pill key={f} label={f} active={filtro === f} onClick={() => setFiltro(f)} />)}
      </div>
      <div>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }}
          onChange={(e) => e.target.files[0] && importarCsv(e.target.files[0])} />
        <Btn onClick={() => fileRef.current?.click()} disabled={importando}>{importando ? "Importando..." : "⬆ Importar CSV"}</Btn>
      </div>
    </div>
    <div style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>
      Pedidos vêm do sistema de vendas da loja (ERP/e-commerce). Colunas esperadas no CSV: <code style={{ color: C.text }}>{COLUNAS_ESPERADAS.join(", ")}</code>
    </div>

    {resumo && (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 18, display: "flex", gap: 20, fontSize: 13 }}>
        <span style={{ color: C.text }}>{resumo.total} linha(s) no arquivo</span>
        <span style={{ color: C.green }}>✅ {resumo.ok} importado(s)</span>
        {resumo.duplicados > 0 && <span style={{ color: C.yellow }}>⚠ {resumo.duplicados} já existiam</span>}
        {resumo.erros > 0 && <span style={{ color: C.accent }}>❌ {resumo.erros} com erro</span>}
      </div>
    )}

    {!loading && rows.length === 0 && <Empty icon="🧾" msg="Nenhum pedido encontrado. Importe um CSV do sistema de vendas da loja." />}
    {(loading || rows.length > 0) && (
      <DTable loading={loading} cols={["Pedido", "Cliente", "Produto", "Data Compra", "Valor", "Origem", "Status"]}
        rows={rows.map((p) => ({ _raw: p, cells: [
          <span style={{ color: C.accent, fontWeight: 700, fontSize: 12 }}>{p.numero_pedido}</span>,
          p.clientes?.nome || "—",
          <span style={{ fontSize: 12, color: C.muted }}>{p.produtos?.nome || p.produto_descricao || "—"}</span>,
          <span style={{ fontSize: 12, color: C.muted }}>{p.data_compra || "—"}</span>,
          <span style={{ fontSize: 12, color: C.muted }}>{p.valor ? `R$ ${Number(p.valor).toFixed(2)}` : "—"}</span>,
          <span style={{ fontSize: 11, color: C.muted }}>{p.canal_origem || "—"}</span>,
          <Badge status={p.utilizado ? "Utilizado" : "Disponível"} />,
        ]}))}
      />
    )}
  </div>;
};
