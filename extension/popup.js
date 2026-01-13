async function getStoredToken() {
  const { readwiseToken } = await chrome.storage.sync.get(["readwiseToken"]);
  return readwiseToken || "";
}

async function setStoredToken(token) {
  await chrome.storage.sync.set({ readwiseToken: token });
}

function setStatus(msg) {
  const el = document.getElementById("status");
  el.textContent = msg || "";
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function scrapeFromTab(tabId) {
  return await chrome.tabs.sendMessage(tabId, { type: "KINDLE_NOTEBOOK_SCRAPE" });
}

async function pushToReadwise(token, book, highlights) {
  return await chrome.runtime.sendMessage({
    type: "READWISE_PUSH_HIGHLIGHTS",
    token,
    book,
    highlights
  });
}

async function validateToken(token) {
  return await chrome.runtime.sendMessage({
    type: "READWISE_VALIDATE_TOKEN",
    token
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const tokenInput = document.getElementById("token");
  const saveBtn = document.getElementById("save");
  const importBtn = document.getElementById("import");
  const openOptionsBtn = document.getElementById("openOptions");

  tokenInput.value = await getStoredToken();

  saveBtn.addEventListener("click", async () => {
    const token = tokenInput.value.trim();
    if (!token) {
      setStatus("Tokenが空です。");
      return;
    }
    setStatus("Tokenを検証中...");
    const res = await validateToken(token);
    if (!res?.ok) {
      setStatus(`Token検証に失敗しました: ${res?.error || "不明なエラー"}`);
      return;
    }
    await setStoredToken(token);
    setStatus("保存しました。");
  });

  importBtn.addEventListener("click", async () => {
    const token = (tokenInput.value || "").trim() || (await getStoredToken());
    if (!token) {
      setStatus("Readwise Tokenが未設定です。先に保存してください。");
      return;
    }

    const tab = await getActiveTab();
    if (!tab?.id) {
      setStatus("アクティブタブが取得できませんでした。");
      return;
    }

    setStatus("Kindleノートブックから抽出中...");
    const scraped = await scrapeFromTab(tab.id).catch((e) => ({ ok: false, error: e?.message || String(e) }));
    if (!scraped?.ok) {
      setStatus(
        `抽出に失敗しました。\n- Kindleノートブック( read.amazon.co.jp / read.amazon.com )を開いていますか？\n- エラー: ${
          scraped?.error || "不明"
        }`
      );
      return;
    }

    const { book, highlights } = scraped.data || {};
    const count = Array.isArray(highlights) ? highlights.length : 0;
    if (!count) {
      setStatus(
        `ハイライトが見つかりませんでした。\n- 取り込みたい本のページを開き、ハイライトが表示されている状態で実行してください。\n- (DOM構造が変わっている可能性もあります)`
      );
      return;
    }

    setStatus(`Readwiseへ送信中... (${count}件)`);
    const pushed = await pushToReadwise(token, book, highlights);
    if (!pushed?.ok) {
      setStatus(`Readwise送信に失敗しました: ${pushed?.error || "不明なエラー"}`);
      return;
    }

    const result = pushed.result || {};
    const errors = Array.isArray(result.errors) ? result.errors : [];
    const errText =
      errors.length > 0 ? `\n\n失敗バッチ:\n${errors.map((e) => `- batch ${e.batch}: ${e.message}`).join("\n")}` : "";

    setStatus(
      `完了:\n- 本: ${book?.title || "(不明)"}\n- 送信: ${result.attempted ?? count}件\n- 作成(推定): ${result.created ?? "不明"}件${errText}`
    );
  });

  openOptionsBtn.addEventListener("click", async () => {
    await chrome.runtime.openOptionsPage();
  });
});

