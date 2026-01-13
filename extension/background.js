const READWISE_HIGHLIGHTS_ENDPOINT = "https://readwise.io/api/v2/highlights/";
const READWISE_AUTH_ENDPOINT = "https://readwise.io/api/v2/auth/";
const READWISE_BOOKS_ENDPOINT = "https://readwise.io/api/v2/books/";

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeText(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim();
}

function bookKey(book) {
  return `${normalizeText(book?.title)}\u0000${normalizeText(book?.author)}`;
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

async function pushHighlightsToReadwise({ token, book, highlights, bookId }) {
  // Readwise highlights API: { highlights: [{text,title,author,source_type,category,location,note,highlighted_at,source_url}] }
  const normalizedBase = highlights
    .map((h) => {
      const out = {
      text: (h.text || "").trim(),
      note: (h.note || "").trim() || undefined,
      location: typeof h.location === "number" ? h.location : undefined,
      highlighted_at: h.highlighted_at || undefined,
      source_url: h.source_url || undefined,
      title: (book?.title || "").trim() || undefined,
      author: (book?.author || "").trim() || undefined,
      source_type: "kindle",
      category: "books"
      };
      if (bookId) out.book_id = bookId;
      return out;
    })
    .filter((h) => h.text);

  if (normalizedBase.length === 0) {
    return { created: 0, attempted: 0, errors: [] };
  }

  const BATCH_SIZE = 100;
  const tryPost = async (normalized, allowRetryWithoutBookId) => {
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
        // Some Readwise accounts/APIs may reject unknown fields like book_id. If so, retry once without it.
        const payload = e?.payload;
        const maybeBookIdError =
          e?.status === 400 &&
          allowRetryWithoutBookId &&
          (String(e?.message || "").toLowerCase().includes("book_id") ||
            (payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "book_id")));

        if (maybeBookIdError) {
          return { retryWithoutBookId: true };
        }

        errors.push({ batch: idx + 1, message: e?.message || String(e) });
      }
    }

    return { created, attempted: normalized.length, errors, retryWithoutBookId: false };
  };

  const res1 = await tryPost(normalizedBase, true);
  if (res1.retryWithoutBookId) {
    const stripped = normalizedBase.map(({ book_id, ...rest }) => rest);
    const res2 = await tryPost(stripped, false);
    return res2;
  }

  return res1;
}

async function readwiseGetAllPages(token, url, maxPages = 50) {
  const results = [];
  let next = url;
  for (let i = 0; i < maxPages && next; i++) {
    const payload = await readwiseFetch(token, next, { method: "GET" });
    if (payload && typeof payload === "object") {
      const pageResults = Array.isArray(payload.results) ? payload.results : [];
      results.push(...pageResults);
      next = payload.next || null;
    } else {
      break;
    }
  }
  return results;
}

const cache = {
  token: null,
  booksByKey: new Map()
};

function invalidateBooksCache() {
  cache.booksByKey = new Map();
}

async function findReadwiseBookId(token, book) {
  const key = bookKey(book);
  if (cache.token === token && cache.booksByKey.has(key)) return cache.booksByKey.get(key);

  // Refresh cache if token changes.
  if (cache.token !== token) {
    cache.token = token;
    cache.booksByKey = new Map();
  }

  const url = `${READWISE_BOOKS_ENDPOINT}?page_size=200`;
  const books = await readwiseGetAllPages(token, url, 50);
  for (const b of books) {
    const k = bookKey({ title: b.title, author: b.author });
    if (!cache.booksByKey.has(k)) cache.booksByKey.set(k, b.id);
  }
  return cache.booksByKey.get(key);
}

async function patchReadwiseBook(token, bookId, patch) {
  if (!bookId) return { ok: false, error: "bookId is missing" };
  if (!patch || typeof patch !== "object") return { ok: false, error: "patch is invalid" };

  // Best-effort: the books API typically supports PATCH /api/v2/books/{id}/
  const url = `${READWISE_BOOKS_ENDPOINT}${encodeURIComponent(bookId)}/`;
  try {
    await readwiseFetch(token, url, { method: "PATCH", body: JSON.stringify(patch) });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

async function ensureReadwiseCover(token, book, maybeBookId) {
  const cover = book?.cover_image_url;
  const sourceUrl = book?.source_url;
  if (!cover && !sourceUrl) return { ok: true, skipped: true };

  const bookId = maybeBookId || (await findReadwiseBookId(token, book));
  if (!bookId) return { ok: false, error: "Readwise側に書籍が見つかりませんでした。" };

  const patch = {};
  if (cover) patch.cover_image_url = cover;
  if (sourceUrl) patch.source_url = sourceUrl;

  // Some Readwise accounts may not accept these fields; best-effort.
  return await patchReadwiseBook(token, bookId, patch);
}

async function getExistingHighlightKeys(token, bookId) {
  const url = `${READWISE_HIGHLIGHTS_ENDPOINT}?page_size=200&book_id=${encodeURIComponent(bookId)}`;
  const highlights = await readwiseGetAllPages(token, url, 100);
  const keys = new Set();
  for (const h of highlights) {
    const text = normalizeText(h.text);
    const loc = typeof h.location === "number" ? h.location : "";
    keys.add(`${loc}\u0000${text}`);
  }
  return keys;
}

async function dedupeAndPush({ token, book, highlights }) {
  // If the book exists on Readwise, fetch existing highlights and filter.
  let bookId = await findReadwiseBookId(token, book);
  let existingKeys = null;
  if (bookId) {
    existingKeys = await getExistingHighlightKeys(token, bookId);
  }

  const filtered = [];
  let skipped = 0;
  const seenLocal = new Set();

  for (const h of highlights || []) {
    const text = normalizeText(h.text);
    if (!text) continue;
    const loc = typeof h.location === "number" ? h.location : "";
    const key = `${loc}\u0000${text}`;

    if (seenLocal.has(key)) continue;
    seenLocal.add(key);

    if (existingKeys && existingKeys.has(key)) {
      skipped++;
      continue;
    }
    filtered.push(h);
  }

  const pushed = await pushHighlightsToReadwise({ token, book, highlights: filtered, bookId });
  // If the book didn't exist yet, it may have been created by this push; refresh and set cover.
  if (!bookId) {
    invalidateBooksCache();
    bookId = await findReadwiseBookId(token, book);
  }
  const coverResult = await ensureReadwiseCover(token, book, bookId);
  return {
    ...pushed,
    skipped_duplicates: skipped,
    sent: filtered.length,
    book_id: bookId || null,
    cover: coverResult
  };
}

let bulkJob = null;

async function waitForTabComplete(tabId, timeoutMs = 60000) {
  return await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("ページ読み込みがタイムアウトしました。"));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(listener);
    }

    function listener(id, info, tab) {
      if (id !== tabId) return;
      if (info.status === "complete") {
        cleanup();
        resolve(tab);
      }
    }

    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function sendToTab(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (e) {
    const msg = String(e?.message || e);
    const needsInject =
      msg.includes("Could not establish connection") ||
      msg.includes("Receiving end does not exist") ||
      msg.includes("The message port closed");

    if (!needsInject) throw e;

    // Ensure the content script is injected (helps with SPA navigations / race conditions).
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["contentScript.js"]
    });

    return await chrome.tabs.sendMessage(tabId, message);
  }
}

async function listBooksFromNotebook(tabId) {
  const res = await sendToTab(tabId, { type: "KINDLE_NOTEBOOK_LIST_BOOKS" });
  if (!res?.ok) throw new Error(res?.error || "一覧抽出に失敗しました。");
  const books = Array.isArray(res?.data?.books) ? res.data.books : [];
  return books.filter((b) => b && b.url);
}

async function scrapeCurrentBook(tabId) {
  const res = await sendToTab(tabId, { type: "KINDLE_NOTEBOOK_SCRAPE" });
  if (!res?.ok) throw new Error(res?.error || "ハイライト抽出に失敗しました。");
  return res.data;
}

async function runBulkImport({ token, tabId }) {
  if (bulkJob) throw new Error("すでに一括取り込みが実行中です。");
  bulkJob = { startedAt: Date.now() };

  try {
    const tab = await chrome.tabs.get(tabId);
    const origin = tab?.url ? new URL(tab.url).origin : null;
    if (!origin) throw new Error("タブURLが取得できませんでした。");

    // Ensure we are on the notebook library page for listing.
    let books = [];
    try {
      books = await listBooksFromNotebook(tabId);
    } catch {
      // Navigate to notebook library and retry (Amazon may redirect between /kp/notebook and /notebook/).
      const candidates = [`${origin}/kp/notebook`, `${origin}/notebook/`, `${origin}/notebook`];
      let lastErr = null;
      for (const candidate of candidates) {
        try {
          await chrome.tabs.update(tabId, { url: candidate });
          await waitForTabComplete(tabId);
          await sleep(900);
          books = await listBooksFromNotebook(tabId);
          if (books.length) break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!books.length && lastErr) throw lastErr;
    }

    if (books.length === 0) {
      throw new Error("取り込み対象の本が見つかりませんでした。ノートブックのライブラリ一覧を開いてください。");
    }

    chrome.runtime.sendMessage({ type: "BULK_PROGRESS", stage: "start", total: books.length });

    const summary = {
      totalBooks: books.length,
      processedBooks: 0,
      totalAttempted: 0,
      totalSent: 0,
      totalCreatedEstimated: 0,
      totalSkippedDuplicates: 0,
      failures: []
    };

    for (const [i, b] of books.entries()) {
      chrome.runtime.sendMessage({
        type: "BULK_PROGRESS",
        stage: "book_start",
        index: i + 1,
        total: books.length,
        url: b.url,
        title_hint: b.title || ""
      });

      try {
        await chrome.tabs.update(tabId, { url: b.url });
        await waitForTabComplete(tabId);
        await sleep(800);

        const scraped = await scrapeCurrentBook(tabId);
        const book = scraped?.book || {};
        const highlights = Array.isArray(scraped?.highlights) ? scraped.highlights : [];

        const result = await dedupeAndPush({ token, book, highlights });

        summary.processedBooks++;
        summary.totalAttempted += result.attempted || 0;
        summary.totalSent += result.sent || 0;
        summary.totalCreatedEstimated += result.created || 0;
        summary.totalSkippedDuplicates += result.skipped_duplicates || 0;

        chrome.runtime.sendMessage({
          type: "BULK_PROGRESS",
          stage: "book_done",
          index: i + 1,
          total: books.length,
          book,
          attempted: result.attempted,
          sent: result.sent,
          skipped_duplicates: result.skipped_duplicates,
          created: result.created
        });
      } catch (e) {
        summary.processedBooks++;
        summary.failures.push({ index: i + 1, url: b.url, error: e?.message || String(e) });
        chrome.runtime.sendMessage({
          type: "BULK_PROGRESS",
          stage: "book_failed",
          index: i + 1,
          total: books.length,
          url: b.url,
          error: e?.message || String(e)
        });
      }

      // small throttle
      await sleep(300);
    }

    chrome.runtime.sendMessage({ type: "BULK_PROGRESS", stage: "done", summary });
    return summary;
  } finally {
    bulkJob = null;
  }
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

    if (message.type === "READWISE_DEDUPE_AND_PUSH") {
      const result = await dedupeAndPush({
        token: message.token,
        book: message.book,
        highlights: message.highlights
      });
      sendResponse({ ok: true, result });
      return;
    }

    if (message.type === "READWISE_BULK_IMPORT") {
      const summary = await runBulkImport({
        token: message.token,
        tabId: message.tabId
      });
      sendResponse({ ok: true, summary });
      return;
    }
  })().catch((err) => {
    sendResponse({ ok: false, error: err?.message || String(err) });
  });

  return true; // keep message channel open for async sendResponse
});

