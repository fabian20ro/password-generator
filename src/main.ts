import { generatePassword, LENGTHS } from "./password";

const COPY_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M3.5 10.5h-1a1.5 1.5 0 0 1-1.5-1.5v-6a1.5 1.5 0 0 1 1.5-1.5h6a1.5 1.5 0 0 1 1.5 1.5v1"/></svg>`;
const CHECK_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.5 3.5 6.5-8"/></svg>`;

function copyToClipboard(text: string, btn: HTMLButtonElement): void {
  navigator.clipboard.writeText(text).then(() => {
    btn.innerHTML = CHECK_ICON;
    btn.classList.add("copied");
    setTimeout(() => {
      btn.innerHTML = COPY_ICON;
      btn.classList.remove("copied");
    }, 1500);
  }).catch(() => {
    btn.title = "Clipboard access denied";
    btn.classList.add("error");
    setTimeout(() => {
      btn.title = "";
      btn.classList.remove("error");
    }, 2000);
  });
}

function generate(): void {
  const container = document.getElementById("passwords")!;
  container.innerHTML = "";

  for (const len of LENGTHS) {
    const pw = generatePassword(len);

    const row = document.createElement("div");
    row.className = "row";

    const lenSpan = document.createElement("span");
    lenSpan.className = "len";
    lenSpan.textContent = String(len);

    const code = document.createElement("code");
    code.textContent = pw;

    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.innerHTML = COPY_ICON;
    btn.onclick = () => copyToClipboard(pw, btn);

    row.appendChild(lenSpan);
    row.appendChild(code);
    row.appendChild(btn);
    container.appendChild(row);
  }
}

document.getElementById("regenerate")!.addEventListener("click", generate);
generate();
