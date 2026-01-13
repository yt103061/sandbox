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

async function validateToken(token) {
  return await chrome.runtime.sendMessage({
    type: "READWISE_VALIDATE_TOKEN",
    token
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const tokenInput = document.getElementById("token");
  const validateBtn = document.getElementById("validate");
  const saveBtn = document.getElementById("save");

  tokenInput.value = await getStoredToken();

  validateBtn.addEventListener("click", async () => {
    const token = tokenInput.value.trim();
    if (!token) {
      setStatus("Tokenが空です。");
      return;
    }
    setStatus("検証中...");
    const res = await validateToken(token);
    if (!res?.ok) {
      setStatus(`失敗: ${res?.error || "不明なエラー"}`);
      return;
    }
    setStatus("OK: Tokenは有効です。");
  });

  saveBtn.addEventListener("click", async () => {
    const token = tokenInput.value.trim();
    if (!token) {
      setStatus("Tokenが空です。");
      return;
    }
    setStatus("保存中...");
    await setStoredToken(token);
    setStatus("保存しました。");
  });
});

