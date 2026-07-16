// Fila offline-first (IndexedDB) — plano §14.5: "check-in, fotos, resultado e
// assinatura enfileirados e enviados quando a conexão voltar". Fotos (File/Blob)
// vão direto pro IndexedDB via structured clone; não cabem no localStorage.
const DB_NAME = "montamovel-offline";
const STORE = "queue";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const result = fn(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

export async function enqueue(type, payload, files = []) {
  const job = { id: crypto.randomUUID(), type, payload, files, createdAt: new Date().toISOString() };
  await withStore("readwrite", (store) => store.add(job));
  return job;
}

export async function listQueue() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    req.onerror = () => reject(req.error);
  });
}

async function removeFromQueue(id) {
  await withStore("readwrite", (store) => store.delete(id));
}

// handlers: { [type]: async (payload, files) => void } — registrado uma vez pelo App
let handlers = {};
export function registerHandlers(map) { handlers = map; }

export async function syncQueue() {
  const jobs = await listQueue();
  let ok = 0, fail = 0;
  for (const job of jobs) {
    const handler = handlers[job.type];
    if (!handler) continue;
    try {
      await handler(job.payload, job.files);
      await removeFromQueue(job.id);
      ok++;
    } catch {
      fail++; // mantém na fila, ordem preservada, tenta de novo na próxima sync
    }
  }
  return { ok, fail, remaining: (await listQueue()).length };
}

// Tenta executar direto; se offline ou a chamada falhar, enfileira.
export async function writeOrQueue(type, payload, files, directFn) {
  if (navigator.onLine) {
    try {
      const data = await directFn();
      return { queued: false, data };
    } catch {
      await enqueue(type, payload, files);
      return { queued: true };
    }
  }
  await enqueue(type, payload, files);
  return { queued: true };
}
