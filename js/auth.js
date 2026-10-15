/* auth.js: login, customer registration, role-based layout and tab navigation */
async function signIn(email, password) {
  let notice = "";
  try {
    user = (await api("login", { method: "POST", body: { email, password } })).data;
  } catch (er) {
    if (er.status !== 404) throw er;
    /* login.php is not installed on this backend: look the user up by email instead (no password check) */
    const u = (await api("users")).data.find(x => x.email.toLowerCase() === email);
    if (!u) throw new Error("No account uses that email.");
    user = u; notice = "Signed in by email only: this backend has no login endpoint, so the password was not checked.";
  }
  try { sessionStorage.setItem("user", JSON.stringify(user)); } catch (x) {}
  tab = null; renderApp();
  if (notice) toast(notice);
}

function renderLogin(msg) {
  $("#app").innerHTML = `<form class="login" id="lf" novalidate><h1>Stubline</h1><p>Sign in to open your dashboard.</p>
  <label>Email<input name="email" type="email" autocomplete="username"></label>
  <label>Password<input name="password" type="password" autocomplete="current-password"></label>
  <p class="err">${esc(msg || "")}</p><button class="pri" style="width:100%">Sign in</button>
  <p class="demo">New customer? <a href="#" onclick="renderRegister();return false">Create an account</a></p>
  <p class="demo">Demo accounts:
  <button type="button" onclick="fillDemo('admin1@test.com','hashed_pass_1')">Administrator</button>
  <button type="button" onclick="fillDemo('org1@test.com','hashed_pass_2')">Organiser</button>
  <button type="button" onclick="fillDemo('cust1@test.com','hashed_pass_4')">Customer</button></p></form>`;
  $("#lf").onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target), email = f.get("email").trim().toLowerCase(), password = f.get("password");
    const err = $("#lf .err");
    if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = "Enter a valid email address."; return; }
    if (!password) { err.textContent = "Enter your password."; return; }
    err.textContent = "Signing in…";
    try { await signIn(email, password); } catch (er) { err.textContent = er.message; }
  };
}
function fillDemo(email, password) { const f = $("#lf"); f.email.value = email; f.password.value = password; }

function renderRegister() {
  $("#app").innerHTML = `<form class="login" id="rf" novalidate><h1>Create account</h1><p>Register as a customer to browse and book events.</p>
  <label>Full name<input name="name" autocomplete="name"></label>
  <label>Email<input name="email" type="email" autocomplete="username"></label>
  <label>Password (at least 6 characters)<input name="password" type="password" autocomplete="new-password"></label>
  <label>Confirm password<input name="confirm" type="password" autocomplete="new-password"></label>
  <p class="err"></p><button class="pri" style="width:100%">Create account</button>
  <p class="demo"><a href="#" onclick="renderLogin();return false">Back to sign in</a></p></form>`;
  $("#rf").onsubmit = async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target)), err = $("#rf .err");
    const name = f.name.trim(), email = f.email.trim().toLowerCase();
    if (!name) { err.textContent = "Name is required."; return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = "Enter a valid email address."; return; }
    if (f.password.length < 6) { err.textContent = "Password must be at least 6 characters."; return; }
    if (f.password !== f.confirm) { err.textContent = "The two passwords do not match."; return; }
    err.textContent = "Creating account…";
    try {
      const taken = (await api("users")).data.some(x => x.email.toLowerCase() === email);
      if (taken) throw new Error("That email is already registered. Try signing in instead.");
      await api("users", { method: "POST", body: { name, email, password: f.password, role: "Customer" } });
      await signIn(email, f.password);
      toast("Account created. Welcome, " + name + "!");
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