import { createClient } from "@supabase/supabase-js";
import { DEMO_RPC } from "./demoData";

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

function chainable(promise) {
  return new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === "then") return promise.then.bind(promise);
      if (prop === "catch") return promise.catch.bind(promise);
      if (prop === "finally") return promise.finally.bind(promise);
      return () => chainable(promise);
    },
  });
}

function mockClient() {
  return {
    rpc(fn) { return chainable(Promise.resolve({ data: DEMO_RPC[fn] ?? null, error: null })); },
  };
}

export const supabase = DEMO_MODE
  ? mockClient()
  : createClient(
      import.meta.env.VITE_SUPABASE_URL || "https://SEU_PROJETO.supabase.co",
      import.meta.env.VITE_SUPABASE_ANON_KEY || "SEU_ANON_KEY"
    );
