import { generatePassword, LENGTHS } from "./password";

function copyToClipboard(text: string, btn: HTMLButtonElement): void {
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = "Copied!";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = "Copy";
      btn.classList.remove("copied");
    }, 1500);
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
    btn.textContent = "Copy";
    btn.onclick = () => copyToClipboard(pw, btn);

    row.appendChild(lenSpan);
    row.appendChild(code);
    row.appendChild(btn);
    container.appendChild(row);
  }
}

document.getElementById("regenerate")!.addEventListener("click", generate);
generate();
