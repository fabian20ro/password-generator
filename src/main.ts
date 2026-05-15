import { generateAll } from "./password";
import { copyTextToClipboard } from "./clipboard";

const COPY_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M3.5 10.5h-1a1.5 1.5 0 0 1-1.5-1.5v-6a1.5 1.5 0 0 1 1.5-1.5h6a1.5 1.5 0 0 1 1.5 1.5v1"/></svg>`;
const CHECK_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.5 3.5 6.5-8"/></svg>`;

const DEFAULT_COPY_LABEL = "Copy password";
const COPIED_COPY_LABEL = "Password copied";
const ERROR_COPY_LABEL = "Copy failed";

const statusEl = document.getElementById("status") as HTMLParagraphElement;
const srStatusEl = document.getElementById("sr-status") as HTMLDivElement;

function announceStatus(message: string): void {
  statusEl.textContent = message;
  srStatusEl.textContent = message;
}

function resetButtonState(btn: HTMLButtonElement): void {
  btn.innerHTML = COPY_ICON;
  btn.classList.remove("copied", "error");
  btn.title = "";
  btn.setAttribute("aria-label", DEFAULT_COPY_LABEL);
}

async function copyToClipboard(text: string, btn: HTMLButtonElement): Promise<void> {
  const copied = await copyTextToClipboard(navigator.clipboard, text);

  if (copied) {
    btn.innerHTML = CHECK_ICON;
    btn.classList.remove("error");
    btn.classList.add("copied");
    btn.setAttribute("aria-label", COPIED_COPY_LABEL);
    announceStatus("Password copied to clipboard.");

    setTimeout(() => {
      resetButtonState(btn);
    }, 1500);
    return;
  }

  btn.classList.remove("copied");
  btn.classList.add("error");
  btn.title = "Clipboard access unavailable or denied";
  btn.setAttribute("aria-label", ERROR_COPY_LABEL);
  announceStatus("Copy failed. Clipboard access unavailable or denied.");

  setTimeout(() => {
    resetButtonState(btn);
  }, 2000);
}

function generate(): void {
  const container = document.getElementById("passwords") as HTMLDivElement;
  container.innerHTML = "";
  const passwords = generateAll();
  announceStatus(`Generated ${passwords.length} new passwords.`);

  passwords.forEach((pw) => {
    const len = pw.length;

    const row = document.createElement("div");
    row.className = "row";

    const lenSpan = document.createElement("span");
    lenSpan.className = "len";
    lenSpan.textContent = String(len);

    const code = document.createElement("code");
    code.textContent = pw;

    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.innerHTML = COPY_ICON;
    btn.setAttribute("aria-label", `${DEFAULT_COPY_LABEL} (${len} characters)`);
    btn.onclick = () => copyToClipboard(pw, btn);

    row.appendChild(lenSpan);
    row.appendChild(code);
    row.appendChild(btn);
    container.appendChild(row);
  });
}

document.getElementById("regenerate")?.addEventListener("click", generate);
generate();
