import { commands } from "./commands.js";

function renderList(filter = "") {
  const list = document.getElementById("cmd-result");

  const filtered = commands.filter((c) => c.title.toLowerCase().includes(filter.toLowerCase()));

  list.innerHTML = filtered
    .map(
      (c) =>
        `<div class="cmd-item" data-id="${c.id}">
      ${c.title}
    </div>`,
    )
    .join("");
}

document.addEventListener("click", (e) => {
  const el = e.target.closest(".cmd-item");
  if (!el) return;

  const cmd = commands.find((c) => c.id === el.dataset.id);
  cmd?.run();
});
