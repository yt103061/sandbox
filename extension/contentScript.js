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

function scrapeNotebook() {
  const title = firstText([
    // Common Kindle Notebook title selectors
    "#kp-notebook-title",
    ".kp-notebook-title",
    "h3.kp-notebook-title",
    "h3#kp-notebook-title",
    "h3.a-size-large",
    "h3"
  ]);

  const author = firstText([
    "#kp-notebook-author",
    ".kp-notebook-author",
    ".kp-notebook-metadata",
    ".a-color-secondary",
    "p.kp-notebook-author"
  ]);

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
      title: title || "(タイトル不明)",
      author: author || ""
    },
    highlights
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") return;
  if (message.type !== "KINDLE_NOTEBOOK_SCRAPE") return;

  try {
    const data = scrapeNotebook();
    sendResponse({ ok: true, data });
  } catch (e) {
    sendResponse({ ok: false, error: e?.message || String(e) });
  }
});

