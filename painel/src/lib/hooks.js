import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

export function useDB(table, buildQuery, deps=[]) {
  const [data,setData]       = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError]     = useState(null);
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const {data:rows,error:err} = await buildQuery(supabase.from(table));
      if(err) throw err;
      setData(rows||[]);
    } catch(e){ setError(e.message); }
    finally{ setLoading(false); }
  }, deps);
  useEffect(()=>{ fetch(); },[fetch]);
  return {data,loading,error,refetch:fetch};
}

export function useRT(table, cb) {
  useEffect(()=>{
    const ch = supabase.channel("rt_"+table)
      .on("postgres_changes",{event:"*",schema:"public",table},cb)
      .subscribe();
    return ()=>supabase.removeChannel(ch);
  },[table]);
}
