/* auth.js: login screen, role-based layout and tab navigation */
function renderLogin(msg) {
  $("#app").innerHTML = `<form class="login" id="lf" novalidate><h1>Stubline</h1><p>Sign in to open your dashboard.</p>
  <label>Email<input name="email" type="email" autocomplete="username"></label>
  <label>Password<input name="password" type="password" autocomplete="current-password"></label>
  <p class="err">${esc(msg || "")}</p><button class="pri" style="width:100%">Sign in</button></form>`;
  $("#lf").onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target), email = f.get("email").trim().toLowerCase(), password = f.get("password");
    const err = $("#lf .err");
    if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = "Enter a valid email address."; return; }
    if (!password) { err.textContent = "Enter your password."; return; }
    err.textContent = "Signing in…";
    try {
      user = (await api("login", { method: "POST", body: { email, password } })).data;
      try { sessionStorage.setItem("user", JSON.stringify(user)); } catch (x) {}
      tab = null; renderApp();
    } catch (er) { err.textContent = er.message; }
  };
}

function renderApp() {
  if (!user) return renderLogin();
  const tabs = TABS[user.role] || [];
  if (!tab || !tabs.some(t => t[1] === tab)) tab = tabs[0] && tabs[0][1];
  $("#app").innerHTML = `<header class="top"><h1>Stubline</h1><div><span>${esc(user.name)} (${esc(user.role)})</span><button onclick="logout()">Sign out</button></div></header>
  <nav>${tabs.map(t => `<button class="${t[1] === tab ? "on" : ""}" onclick="go('${t[1]}')">${t[0]}</button>`).join("")}</nav><main id="content"></main>`;
  go(tab);
}
function logout() { user = null; try { sessionStorage.removeItem("user"); } catch (e) {} renderLogin(); }
async function go(name) {
  tab = name;
  document.querySelectorAll("nav button").forEach((b, i) => b.classList.toggle("on", TABS[user.role][i][1] === name));
  view('<div class="load">Loading…</div>');
  try { await SCREENS[name](); } catch (e) { view(`<div class="empty"><b>Something went wrong.</b><br>${esc(e.message)}<br><br><button onclick="go('${name}')">Try again</button></div>`); }
}