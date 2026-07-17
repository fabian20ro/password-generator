import { generateAll } from "./password";
import { copyTextToClipboard } from "./clipboard";
import { scheduleButtonReset } from "./button-reset";
import { generateUsernames } from "./username";

const COPY_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M3.5 10.5h-1a1.5 1.5 0 0 1-1.5-1.5v-6a1.5 1.5 0 0 1 1.5-1.5h6a1.5 1.5 0 0 1 1.5 1.5v1"/></svg>`;

/** Duration before the copy button auto-resets after a successful copy. */
export const COPY_BUTTON_RESET_MS = 1500;

const CHECK_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.5 3.5 6.5-8"/></svg>`;

const DEFAULT_COPY_LABEL = "Copy password";
const COPIED_COPY_LABEL = "Password copied";
const ERROR_COPY_LABEL = "Copy failed";


const USERNAME_COUNT = 10;

const statusEl = document.getElementById("status") as HTMLParagraphElement;
const srStatusEl = document.getElementById("sr-status") as HTMLDivElement;

function announceStatus(message: string, isError?: boolean): void {
  if (statusEl) {
    statusEl.textContent = message;
    if (isError) {
      statusEl.style.color = "var(--error-color, #e74c3c)";
    } else {
      statusEl.style.color = "";
    }
  }
  if (srStatusEl) srStatusEl.textContent = message;
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
    announceStatus("Value copied to clipboard.");

    scheduleButtonReset(btn, COPY_BUTTON_RESET_MS, () => {
      resetButtonState(btn);
    });
    return;
  }

  btn.classList.remove("copied");
  btn.classList.add("error");
  btn.title = "Clipboard access unavailable or denied";
  btn.setAttribute("aria-label", ERROR_COPY_LABEL);
  announceStatus("Copy failed. Clipboard access unavailable or denied.", true);

  scheduleButtonReset(btn, 2000, () => {
    resetButtonState(btn);
  });
}



function renderRows(container: HTMLDivElement, values: string[]): void {
  container.innerHTML = "";

  values.forEach((value) => {
    const len = value.length;

    const row = document.createElement("div");
    row.className = "row";

    const lenSpan = document.createElement("span");
    lenSpan.className = "len";
    lenSpan.textContent = String(len);

    const code = document.createElement("code");
    code.textContent = value;

    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.innerHTML = COPY_ICON;
    btn.setAttribute("aria-label", `${DEFAULT_COPY_LABEL} (${len} characters)`);
    btn.onclick = () => copyToClipboard(value, btn);

    row.appendChild(lenSpan);
    row.appendChild(code);
    row.appendChild(btn);
    container.appendChild(row);
  });
}

function generate(): void {
  const passwordContainer = document.getElementById("passwords") as HTMLDivElement;
  const usernameContainer = document.getElementById("usernames") as HTMLDivElement;

  const passwords = generateAll();
  const usernames = generateUsernames(USERNAME_COUNT);

  renderRows(passwordContainer, passwords);
  renderRows(usernameContainer, usernames);

  announceStatus(`Generated ${passwords.length} new passwords and ${usernames.length} usernames.`);
}

document.getElementById("regenerate")?.addEventListener("click", generate);
generate();
