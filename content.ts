console.log("Content script loading salty indigo");

if (window.__CMD_LISTENER__) {
  // console.log('listener already attached')
} else {
  window.__CMD_LISTENER__ = true;

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "OPEN_PALETTE") {
      togglePalette();
    }
    if (msg.type === "SCRAPE_IMAGES") {
      const urls = Array.from(document.querySelectorAll("img"))
        .map((img) => img.src || img.getAttribute("src"))
        .filter(Boolean)
        .filter((url) => url.includes("banhmyus.com/images"));

      const prefix = document.title.replace(/[\\/:*?"<>|]/g, "_").trim();

      chrome.runtime.sendMessage({
        type: "DOWNLOAD_IMAGES",
        urls,
        prefix,
      });
    }
  });
}

if (window.__cmd_palette_loaded__) {
  // already loaded
} else {
  window.__cmd_palette_loaded__ = true;

  let commands = [];
  let paletteOpen = false;
  let paletteRoot = null;
  let selectedIndex = 0;

  const state = {
    filtered: [],
  };

  // -------------------------
  // COMMAND LOAD
  // -------------------------
  chrome.runtime.sendMessage({ type: "GET_COMMANDS" }, (res) => {
    commands = res?.commands || [];
  });

  if (!window.__CMD_LISTENER__) {
    window.__CMD_LISTENER__ = true;

    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === "OPEN_PALETTE") {
        togglePalette();
      }
    });
  }

  async function runSnippet5() {
    try {
      console.log("Scrape images script loaded");

      const urls = Array.from(document.querySelectorAll("img"))
        .map((img) => img.src || img.getAttribute("src"))
        .filter(Boolean)
        .filter((url) => url.includes("banhmyus.com/images"))
        .map((url) => url.replace("small", "original"));

      const prefix = document.title.replace(/[\\/:*?"<>|]/g, "_").trim();

      chrome.runtime.sendMessage({
        type: "DOWNLOAD_IMAGES",
        urls,
        prefix,
      });

      console.log(`Queued ${urls.length} downloads`);
    } catch (e) {
      console.error("❌ runSnippet5 failed:", e);
    }
  }

  // -------------------------
  // RENDER LIST
  // -------------------------
  function renderList(container, items) {
    container.innerHTML = "";

    items.forEach((cmd, index) => {
      const el = document.createElement("div");

      el.textContent = cmd.title;

      el.style = `
        padding: 10px;
        cursor: pointer;
      `;

      el.onmouseenter = () => {
        selectedIndex = index;
        updateHighlight(container);
      };

      el.onclick = () => {
        chrome.runtime.sendMessage({
          type: "RUN",
          command: cmd.id,
        });

        document.getElementById("cmd-palette")?.remove();
        paletteRoot = null;
        paletteOpen = false;
      };

      container.appendChild(el);
    });

    updateHighlight(container);
  }

  // -------------------------
  // HIGHLIGHT
  // -------------------------
  function updateHighlight(list) {
    const children = [...list.children];

    children.forEach((el, i) => {
      el.style.background = i === selectedIndex ? "#333" : "transparent";
    });
  }

  function normalize(str) {
    return str
      .toLowerCase()
      .replace(/\(|\)|\-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function fuzzyMatch(query, text) {
    const qTokens = normalize(query).split(" ");
    const tTokens = normalize(text).split(" ");

    return qTokens.every((q) => tTokens.some((t) => t.includes(q)));
  }

  // -------------------------
  // PALETTE MOUNT
  // -------------------------
  function mountPalette() {
    if (paletteRoot) return;

    paletteRoot = document.createElement("div");
    paletteRoot.id = "cmd-palette";

    paletteRoot.style = `
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      width: 520px;
      background: #111;
      color: white;
      border-radius: 12px;
      z-index: 999999;
      font-family: sans-serif;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;

    paletteRoot.innerHTML = `
      <input
        id="cmd-input"
        placeholder="Search commands..."
        autocomplete="off"
        spellcheck="false"
        style="width:100%; padding:12px; background:#222; color:white; border:none; outline:none;"
      />
      <div id="cmd-list" style="max-height:300px; overflow:auto;"></div>
    `;

    document.body.appendChild(paletteRoot);

    const input = paletteRoot.querySelector("#cmd-input");
    const list = paletteRoot.querySelector("#cmd-list");

    state.filtered = commands;
    selectedIndex = 0;

    renderList(list, state.filtered);

    // -------------------------
    // SEARCH
    // -------------------------
    input.addEventListener("input", (e) => {
      const q = e.target.value;

      state.filtered = commands.filter((c) => fuzzyMatch(q, c.title));

      selectedIndex = 0;
      renderList(list, state.filtered);
    });

    // -------------------------
    // KEY NAVIGATION
    // -------------------------
    input.addEventListener("keydown", (e) => {
      const items = state.filtered;

      if (!items.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateHighlight(list);
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateHighlight(list);
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = items[selectedIndex];

        if (!cmd) return;

        chrome.runtime.sendMessage({
          type: "RUN",
          command: cmd.id,
        });

        document.getElementById("cmd-palette")?.remove();
        paletteRoot = null;
        paletteOpen = false;
      }

      if (e.key === "Escape") {
        togglePalette();
      }
    });

    focusInput();
  }

  // -------------------------
  // UNMOUNT
  // -------------------------
  function unmountPalette() {
    if (!paletteRoot) return;

    paletteRoot.remove();
    paletteRoot = null;
    paletteOpen = false;
  }

  // -------------------------
  // FOCUS INPUT
  // -------------------------
  function focusInput() {
    requestAnimationFrame(() => {
      const input = document.getElementById("cmd-input");
      if (!input) return;

      input.focus({ preventScroll: true });
    });
  }

  // -------------------------
  // TOGGLE
  // -------------------------
  function togglePalette() {
    if (paletteOpen) {
      unmountPalette();
      return;
    }

    paletteOpen = true;
    mountPalette();
  }
}
