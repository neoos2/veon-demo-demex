// Live VIN field: one native <input>, 17 cells and the phone ruler mirror its value.
// Sending is honest: a mailto: link to zakaz@demex.com.ua with the typed VIN in the letter template.
import { vinMailto } from "../data/site";

const VIN_LEN = 17;
// Cyrillic letters that look like Latin ones (typed on a Ukrainian layout) -> Latin.
const LOOKALIKE: Record<string, string> = {
  А: "A", В: "B", Е: "E", К: "K", М: "M", Н: "H", Р: "P", С: "C", Т: "T", Х: "X", У: "Y",
  І: "I", О: "O",
};
const MSG_IOQ = "Літер I, O і Q у VIN немає: можливо, це цифри 1 або 0.";
const MSG_CHARS = "У VIN лише латинські літери і цифри.";

interface Clean { value: string; problem: string; }
export function cleanVin(raw: string): Clean {
  let problem = "";
  let value = "";
  for (const ch of raw.toUpperCase()) {
    const c = LOOKALIKE[ch] ?? ch;
    if (/\s|-/.test(c)) continue;
    if (c === "I" || c === "O" || c === "Q") { problem = MSG_IOQ; continue; }
    if (!/^[A-Z0-9]$/.test(c)) { problem ||= MSG_CHARS; continue; }
    value += c;
  }
  return { value: value.slice(0, VIN_LEN), problem };
}

const root = document.querySelector<HTMLElement>("[data-vin]");
const input = document.querySelector<HTMLInputElement>("[data-vin-input]");

if (root && input) {
  // Effect 1 runs once: the class is removed after the assembly, so a later re-layout
  // (full-page screenshot, breakpoint change) never replays or freezes it half-way.
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.add("is-assembling");
    window.setTimeout(() => root.classList.remove("is-assembling"), 900);
  }
  const cells = Array.from(root.querySelectorAll<HTMLElement>(".vin__cell"));
  const chars = Array.from(root.querySelectorAll<HTMLElement>("[data-cell]"));
  const ticks = Array.from(root.querySelectorAll<HTMLElement>("[data-tick]"));
  const segs = Array.from(root.querySelectorAll<HTMLElement>(".vin__seg"));
  const count = root.querySelector<HTMLElement>("[data-vin-count]");
  const error = root.querySelector<HTMLElement>("[data-vin-error]");
  const sends = () => Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-vin-send]"));
  let prev = "";

  const setError = (text: string) => {
    if (error) error.textContent = text;
    input.setAttribute("aria-invalid", text ? "true" : "false");
  };

  const segOf = (i: number) => Number(cells[i]?.dataset.seg ?? -1);

  const markActive = () => {
    const pos = input.selectionStart ?? input.value.length;
    cells.forEach((c, i) => c.classList.toggle("is-active", i === pos));
    const seg = segOf(Math.min(pos, VIN_LEN - 1));
    segs.forEach((s) => s.classList.toggle("is-active", document.activeElement === input && Number(s.dataset.seg) === seg));
  };

  const render = () => {
    const v = input.value;
    chars.forEach((el, i) => {
      const ch = v[i] ?? "";
      const cell = cells[i];
      if (el.textContent !== ch) {
        el.textContent = ch;
        if (cell && ch && ch !== prev[i]) {
          cell.classList.remove("is-pop");
          void cell.offsetWidth; // restart the 200 ms pop
          cell.classList.add("is-pop");
        }
      }
      cell?.classList.toggle("is-filled", Boolean(ch));
    });
    ticks.forEach((t, i) => t.classList.toggle("is-filled", i < v.length));
    if (count) count.textContent = String(v.length);
    const href = vinMailto(v.length === VIN_LEN ? v : "");
    sends().forEach((a) => { a.href = href; });
    prev = v;
    markActive();
  };

  input.addEventListener("input", () => {
    const caret = input.selectionStart ?? input.value.length;
    const before = cleanVin(input.value.slice(0, caret));
    const all = cleanVin(input.value);
    if (input.value !== all.value) {
      input.value = all.value;
      const pos = Math.min(before.value.length, all.value.length);
      input.setSelectionRange(pos, pos);
    }
    // A format hint stays until the code is complete or cleared; a new problem replaces it.
    if (all.problem) setError(all.problem);
    else if (all.value.length === VIN_LEN || all.value.length === 0) setError("");
    render();
  });
  ["keyup", "click", "focus", "blur", "select"].forEach((ev) => input.addEventListener(ev, markActive));
  document.addEventListener("selectionchange", () => { if (document.activeElement === input) markActive(); });

  cells.forEach((c) => c.addEventListener("animationend", () => c.classList.remove("is-pop")));

  // Effect 3: hovering a segment of the scheme keeps its cells, dims the others.
  segs.forEach((s) => {
    s.addEventListener("pointerenter", () => {
      const n = Number(s.dataset.seg);
      root.setAttribute("data-hover-seg", String(n));
      cells.forEach((c) => c.classList.toggle("is-dim", Number(c.dataset.seg) !== n));
    });
    s.addEventListener("pointerleave", () => {
      root.removeAttribute("data-hover-seg");
      cells.forEach((c) => c.classList.remove("is-dim"));
    });
  });

  const tooShort = () => {
    const n = input.value.length;
    return n > 0 && n < VIN_LEN ? n : 0;
  };

  const focusField = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    input.focus({ preventScroll: true });
  };

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const send = target.closest<HTMLAnchorElement>("[data-vin-send]");
    if (send) {
      const n = tooShort();
      if (n) {
        e.preventDefault();
        setError(`У VIN-коді 17 знаків, зараз ${n}. Допишіть код або очистіть поле, щоб надіслати лист без нього.`);
        focusField();
      }
      return;
    }
    // Phone bar «Надіслати VIN»: a full VIN goes straight to the letter, otherwise the field gets focus.
    const bar = target.closest<HTMLAnchorElement>("[data-vin-bar]");
    if (bar) {
      e.preventDefault();
      if (input.value.length === VIN_LEN) {
        window.location.href = vinMailto(input.value);
      } else {
        focusField();
      }
    }
  });

  render();
}
