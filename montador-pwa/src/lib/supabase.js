import { createClient } from "@supabase/supabase-js";
import { DEMO, DEMO_RPC } from "./demoData";

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

// Proxy "thenable" que ignora qualquer chamada de método (.select, .eq, .order,
// .limit...) e sempre resolve pra mesma promise — suficiente pra navegar pela
// interface com dados fake, sem reimplementar o query builder do Supabase.
function chainable(promise) {
  return new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === "then") return promise.then.bind(promise);
      if (prop === "catch") return promise.catch.bind(promise);
      if (prop === "finally") return promise.finally.bind(promise);
      if (prop === "single" || prop === "maybeSingle") {
        return () => chainable(promise.then((r) => ({ ...r, data: Array.isArray(r.data) ? r.data[0] ?? null : r.data })));
      }
      return () => chainable(promise);
    },
  });
}

function mockClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: "demo-user" } } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: async () => ({ error: null }),
      signOut: async () => { window.location.reload(); },
    },
    from(table) { return chainable(Promise.resolve({ data: DEMO[table] ?? [], error: null })); },
    rpc(fn) { return chainable(Promise.resolve({ data: DEMO_RPC[fn] ?? null, error: null })); },
    channel() { return { on() { return this; }, subscribe() { return this; } }; },
    removeChannel() {},
    storage: { from() { return { upload: async () => ({ error: null }) }; } },
  };
}

export const supabase = DEMO_MODE
  ? mockClient()
  : createClient(
      import.meta.env.VITE_SUPABASE_URL || "https://SEU_PROJETO.supabase.co",
      import.meta.env.VITE_SUPABASE_ANON_KEY || "SEU_ANON_KEY"
    );
