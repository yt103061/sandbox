/**
 * Amazon Kindle Notebook scraper (read.amazon.co.jp / read.amazon.com)
 *
 * Strategy:
 * - The Notebook DOM varies a bit; we use multiple selector fallbacks.
 * - We only scrape the *currently displayed* book's highlights.
 */

function firstText(selectors) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    const txt = el?.textContent?.trim();
    if (txt) return txt;
  }
  return "";
}

function firstTextFiltered(selectors, rejectSet) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    const txt = el?.textContent?.trim();
    if (!txt) continue;
    if (rejectSet && rejectSet.has(txt)) continue;
    return txt;
  }
  return "";
}

function normalizeText(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAuthorFromMeta(raw) {
  const s = normalizeText(raw);
  if (!s) return "";
  // Examples: "著者: 山田 太郎" / "著：山田太郎" / "Author: ..."
  const m =
    s.match(/(?:著者|著|Author|作者)\s*[:：]\s*(.+)$/i) ||
    s.match(/(?:著者|著|Author|作者)\s+(.+)$/i);
  return m ? normalizeText(m[1]) : s;
}

function parseLocationNumber(raw) {
  if (!raw) return undefined;
  const m = String(raw).replace(/,/g, "").match(/(\d+)/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

function uniqueByText(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const key = (it.text || "").trim();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

function uniqByUrl(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const key = (it.url || "").trim();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ensureHighlightsLoaded() {
  // Some notebook pages lazy-load annotations as you scroll.
  const scroller =
    document.querySelector("#kp-notebook-annotations") ||
    document.querySelector("#annotations") ||
    document.querySelector("#kp-notebook-annotation-container") ||
    document.scrollingElement ||
    document.documentElement;

  if (!scroller) return;

  let last = -1;
  for (let i = 0; i < 20; i++) {
    const height = scroller.scrollHeight || 0;
    if (height === last) break;
    last = height;

    try {
      scroller.scrollTop = height;
    } catch {
      window.scrollTo(0, document.body.scrollHeight);
    }

    await sleep(500);
  }
}

async function ensureLibraryLoaded() {
  // Library pages often lazy-load more books as you scroll.
  const scroller = document.scrollingElement || document.documentElement;
  if (!scroller) return;

  let lastCount = 0;
  for (let i = 0; i < 30; i++) {
    // Count current book links (asin=...).
    const count = Array.from(document.querySelectorAll("a[href*='notebook'][href*='asin=']")).length;
    if (count === lastCount && i > 2) break;
    lastCount = count;

    try {
      scroller.scrollTop = scroller.scrollHeight;
    } catch {
      window.scrollTo(0, document.body.scrollHeight);
    }

    await sleep(500);
  }
}

function scrapeNotebook() {
  const rejectTitles = new Set(["メモとハイライト", "メモとハイライト。"]);
  const rejectAuthors = new Set(["メモ付きのkindle本", "メモ付きのKindle本"]);

  // Title candidates (avoid overly broad selectors like plain h3)
  const title =
    firstTextFiltered(
      [
        "#kp-notebook-title",
        ".kp-notebook-title",
        "h3.kp-notebook-title",
        "h3#kp-notebook-title",
        "[data-testid='kp-notebook-title']",
        "[data-testid='notebook-book-title']",
        ".kp-notebook-library-title",
        ".kp-notebook-book-title",
        // Some pages use cover image alt as title
        "img[alt][class*='kp-notebook']",
        "#kp-notebook-cover-image img[alt]",
        "img[alt][src*='images-na']"
      ],
      rejectTitles
    ) ||
    // Fallback: try document title but reject generic
    (() => {
      const dt = normalizeText(document.title);
      if (!dt) return "";
      if (dt.includes("メモとハイライト")) return "";
      return dt;
    })();

  // Author candidates (avoid generic secondary color text)
  const authorRaw =
    firstTextFiltered(
      [
        "#kp-notebook-author",
        ".kp-notebook-author",
        "p.kp-notebook-author",
        "[data-testid='kp-notebook-author']",
        "[data-testid='notebook-book-author']",
        ".kp-notebook-metadata"
      ],
      rejectAuthors
    ) || "";

  const author = rejectAuthors.has(normalizeText(authorRaw)) ? "" : parseAuthorFromMeta(authorRaw);

  // Candidate highlight containers.
  const containers = [
    document.querySelector("#kp-notebook-annotations"),
    document.querySelector("#annotations"),
    document.querySelector("#kp-notebook-annotation-container"),
    document.querySelector("body")
  ].filter(Boolean);

  let highlights = [];

  for (const container of containers) {
    // Known class names used by the notebook page.
    const highlightEls = container.querySelectorAll(
      [
        ".kp-notebook-highlight",
        "[id^='highlight-']",
        "[id^='kp-notebook-highlight-']",
        "[data-annotation-id] .kp-notebook-highlight",
        ".kp-notebook-annotation .kp-notebook-highlight",
        ".kp-notebook-annotation"
      ].join(",")
    );

    for (const el of highlightEls) {
      // Extract highlight text
      const text =
        el.querySelector?.(".kp-notebook-highlight")?.textContent?.trim() ||
        el.querySelector?.("[id^='highlight-']")?.textContent?.trim() ||
        el.textContent?.trim() ||
        "";

      // Extract note and location if present nearby
      const root = el.closest?.(".kp-notebook-annotation") || el;
      const note =
        root.querySelector?.(".kp-notebook-note")?.textContent?.trim() ||
        root.querySelector?.("[id^='note-']")?.textContent?.trim() ||
        "";

      const locationRaw =
        root.querySelector?.(".kp-notebook-location")?.textContent?.trim() ||
        root.querySelector?.("[id^='location-']")?.textContent?.trim() ||
        "";

      highlights.push({
        text,
        note,
        location: parseLocationNumber(locationRaw),
        source_url: location.href
      });
    }

    if (highlights.length) break;
  }

  highlights = uniqueByText(highlights);

  return {
    book: {
      title: title && !rejectTitles.has(normalizeText(title)) ? title : "(タイトル不明)",
      author: author || ""
    },
    highlights
  };
}

function scrapeLibraryBooks() {
  // Notebook library/list page: extract book links.
  const anchors = Array.from(document.querySelectorAll("a[href]"));
  const books = [];

  for (const a of anchors) {
    const href = a.getAttribute("href") || "";
    if (!href) continue;
    if (!href.includes("notebook")) continue;

    const url = new URL(href, location.href).toString();
    // Most book pages include asin=... (but be tolerant of variations)
    const u = new URL(url);
    const asin = u.searchParams.get("asin") || u.searchParams.get("ASIN") || u.searchParams.get("book");
    if (!asin) continue;

    const title =
      a.querySelector?.(".kp-notebook-library-title")?.textContent?.trim() ||
      a.querySelector?.(".kp-notebook-title")?.textContent?.trim() ||
      a.textContent?.trim() ||
      "";

    books.push({ url, title });
  }

  return { books: uniqByUrl(books) };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (!message || typeof message !== "object") return;

    if (message.type === "KINDLE_NOTEBOOK_SCRAPE") {
      await ensureHighlightsLoaded();
      const data = scrapeNotebook();
      sendResponse({ ok: true, data });
      return;
    }

    if (message.type === "KINDLE_NOTEBOOK_LIST_BOOKS") {
      await ensureLibraryLoaded();
      const data = scrapeLibraryBooks();
      sendResponse({ ok: true, data });
      return;
    }
  })().catch((e) => {
    sendResponse({ ok: false, error: e?.message || String(e) });
  });

  return true;
});

