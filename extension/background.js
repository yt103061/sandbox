const READWISE_HIGHLIGHTS_ENDPOINT = "https://readwise.io/api/v2/highlights/";
const READWISE_AUTH_ENDPOINT = "https://readwise.io/api/v2/auth/";

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

async function readwiseFetch(token, url, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Token ${token}`);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");

  const res = await fetch(url, { ...init, headers });
  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && (payload.detail || payload.error)) ||
      (typeof payload === "string" ? payload : "") ||
      `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

async function validateToken(token) {
  await readwiseFetch(token, READWISE_AUTH_ENDPOINT, { method: "GET" });
}

async function pushHighlightsToReadwise({ token, book, highlights }) {
  // Readwise highlights API: { highlights: [{text,title,author,source_type,category,location,note,highlighted_at,source_url}] }
  const normalized = highlights
    .map((h) => ({
      text: (h.text || "").trim(),
      note: (h.note || "").trim() || undefined,
      location: typeof h.location === "number" ? h.location : undefined,
      highlighted_at: h.highlighted_at || undefined,
      source_url: h.source_url || undefined,
      title: (book?.title || "").trim() || undefined,
      author: (book?.author || "").trim() || undefined,
      source_type: "kindle",
      category: "books"
    }))
    .filter((h) => h.text);

  if (normalized.length === 0) {
    return { created: 0, attempted: 0, errors: [] };
  }

  const BATCH_SIZE = 100;
  const batches = chunkArray(normalized, BATCH_SIZE);

  let created = 0;
  const errors = [];

  for (const [idx, batch] of batches.entries()) {
    try {
      const payload = await readwiseFetch(token, READWISE_HIGHLIGHTS_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({ highlights: batch })
      });
      // Readwise returns {count: n} in some cases; tolerate unknown shapes.
      if (payload && typeof payload === "object" && typeof payload.count === "number") created += payload.count;
      else created += batch.length;
    } catch (e) {
      errors.push({ batch: idx + 1, message: e?.message || String(e) });
    }
  }

  return { created, attempted: normalized.length, errors };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (!message || typeof message !== "object") return;

    if (message.type === "READWISE_VALIDATE_TOKEN") {
      await validateToken(message.token);
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "READWISE_PUSH_HIGHLIGHTS") {
      const result = await pushHighlightsToReadwise({
        token: message.token,
        book: message.book,
        highlights: message.highlights
      });
      sendResponse({ ok: true, result });
      return;
    }
  })().catch((err) => {
    sendResponse({ ok: false, error: err?.message || String(err) });
  });

  return true; // keep message channel open for async sendResponse
});

