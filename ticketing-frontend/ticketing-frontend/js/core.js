/* core.js: settings, shared helpers, API helper, form dialog, validation */
/* ===== Config: change if your API folder is different ===== */
const API = "http://localhost/ticketing-api/api/";

const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = n => "RM " + Number(n).toFixed(2);
const TABS = {
  Administrator: [["Users", "users"], ["Venues", "venues"], ["All events", "allEvents"], ["All bookings", "allBookings"]],
  Organiser: [["My events", "myEvents"], ["Bookings", "orgBookings"]],
  Customer: [["Browse events", "browse"], ["My bookings", "myBookings"]]
};
let user = null, tab = null, cache = {};
try { user = JSON.parse(sessionStorage.getItem("user")); } catch (e) {}

/* ===== API helper: one place for all requests, JSON and errors ===== */
async function api(file, { method = "GET", id, query, body } = {}) {
  const p = new URLSearchParams(query || {});
  if (id) p.set("id", id);
  const url = API + file + ".php" + ([...p].length ? "?" + p : "");
  let res;
  try {
    res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  } catch (e) { throw new Error("Cannot reach the API. Start Apache and MySQL in XAMPP, then check the API address at the top of this file."); }
  let j;
  try { j = await res.json(); } catch (e) { throw new Error("The server sent an invalid response (HTTP " + res.status + ")."); }
  if (!res.ok || j.status !== "success") throw new Error(j.message || "Request failed (HTTP " + res.status + ").");
  return j;
}

function toast(msg, bad) {
  const t = $("#toast"); t.textContent = msg; t.className = bad ? "bad" : ""; t.style.display = "block";
  clearTimeout(toast.t); toast.t = setTimeout(() => t.style.display = "none", 3200);
}

/* ===== Generic form dialog with validation ===== */
function form(title, fields, submit, saveLabel = "Save changes") {
  const d = $("#modal");
  d.innerHTML = `<form novalidate><h3 style="margin-bottom:14px">${esc(title)}</h3>` + fields.map(f => `<label>${esc(f.label)}` +
    (f.type === "select"
      ? `<select name="${f.name}">${f.options.map(o => `<option value="${esc(o[0])}"${String(o[0]) === String(f.value) ? " selected" : ""}>${esc(o[1])}</option>`).join("")}</select>`
      : `<input name="${f.name}" type="${f.type || "text"}" value="${esc(f.value ?? "")}" ${f.min !== undefined ? `min="${f.min}"` : ""} ${f.max !== undefined ? `max="${f.max}"` : ""}>`) + `</label>`).join("") +
    `<p class="err" id="ferr"></p><div class="row"><button type="button" onclick="$('#modal').close()">Cancel</button><button class="pri">${esc(saveLabel)}</button></div></form>`;
  d.querySelector("form").onsubmit = async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try { await submit(data); d.close(); } catch (er) { $("#ferr").textContent = er.message; }
  };
  d.showModal();
}
const need = (v, label) => { if (!String(v).trim()) throw new Error(label + " is required."); };
const num = (v, label, min) => { const n = Number(v); if (!Number.isFinite(n) || n < min) throw new Error(label + " must be a number of at least " + min + "."); return n; };
const whole = (v, label, min) => { const n = num(v, label, min); if (!Number.isInteger(n)) throw new Error(label + " must be a whole number."); return n; };

/* ===== Layout, login and tabs ===== */
function table(head, rows, emptyMsg) {
  if (!rows.length) return `<div class="empty">${emptyMsg || "Nothing here yet."}</div>`;
  return `<div class="tw"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
const view = h => $("#content").innerHTML = h;
const tag = s => `<span class="tag ${s === "Cancelled" ? "x" : ""}">${esc(s)}</span>`;
const dt = d => String(d || "").slice(0, 16).replace("T", " ");