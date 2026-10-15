/* admin.js: Administrator screens (users, venues, all events, all bookings) */
/* ===== Administrator: users and venues ===== */
async function users() {
  const u = cache.users = (await api("users")).data;
  const c = r => u.filter(x => x.role === r).length;
  view(`<div class="bar"><h2>Users</h2><button class="pri" onclick="addUser()">Add user</button></div>
  <div class="stats"><div><b>${c("Administrator")}</b>Administrators</div><div><b>${c("Organiser")}</b>Organisers</div><div><b>${c("Customer")}</b>Customers</div></div>` +
    table(["ID", "Name", "Email", "Role", ""], u.map(x => [x.user_id, esc(x.name), esc(x.email), esc(x.role),
      `<button onclick="editUser(${x.user_id})">Edit</button> <button class="del" onclick="delUser(${x.user_id})" ${x.user_id == user.user_id ? "disabled" : ""}>Delete</button>`])));
}
const ROLES = ["Administrator", "Organiser", "Customer"].map(r => [r, r]);
function addUser() {
  form("Add user", [{ name: "name", label: "Full name" }, { name: "email", label: "Email", type: "email" }, { name: "password", label: "Password (at least 6 characters)", type: "password" }, { name: "role", label: "Role", type: "select", options: ROLES }],
    async d => {
      need(d.name, "Name"); if (!/^\S+@\S+\.\S+$/.test(d.email)) throw new Error("Enter a valid email address.");
      if (d.password.length < 6) throw new Error("Password must be at least 6 characters.");
      await api("users", { method: "POST", body: d }); toast("User added."); users();
    }, "Add user");
}
function editUser(id) {
  const u = cache.users.find(x => x.user_id == id);
  form("Edit user", [{ name: "name", label: "Full name", value: u.name }, { name: "role", label: "Role", type: "select", options: ROLES, value: u.role }],
    async d => { need(d.name, "Name"); await api("users", { method: "PUT", body: { user_id: id, name: d.name, role: d.role } }); toast("User updated."); users(); });
}
async function delUser(id) {
  if (!confirm("Delete this user? Their events and bookings will also be removed.")) return;
  try { await api("users", { method: "DELETE", id }); toast("User deleted."); users(); } catch (e) { toast(e.message, true); }
}

async function venues() {
  const v = cache.venues = (await api("venues")).data;
  view(`<div class="bar"><h2>Venues</h2><button class="pri" onclick="addVenue()">Add venue</button></div>` +
    table(["ID", "Name", "Location", "Capacity", ""], v.map(x => [x.venue_id, esc(x.name), esc(x.location), x.capacity,
      `<button onclick="editVenue(${x.venue_id})">Edit</button> <button class="del" onclick="delVenue(${x.venue_id})">Delete</button>`])));
}
function addVenue() {
  form("Add venue", [{ name: "name", label: "Venue name" }, { name: "location", label: "Location" }, { name: "capacity", label: "Capacity", type: "number", min: 1 }],
    async d => { need(d.name, "Name"); need(d.location, "Location"); d.capacity = whole(d.capacity, "Capacity", 1); await api("venues", { method: "POST", body: d }); toast("Venue added."); venues(); }, "Add venue");
}
function editVenue(id) {
  const v = cache.venues.find(x => x.venue_id == id);
  form("Edit venue", [{ name: "name", label: "Venue name", value: v.name }, { name: "capacity", label: "Capacity", type: "number", min: 1, value: v.capacity }],
    async d => { need(d.name, "Name"); d.capacity = whole(d.capacity, "Capacity", 1); await api("venues", { method: "PUT", body: { venue_id: id, ...d } }); toast("Venue updated."); venues(); });
}
async function delVenue(id) {
  if (!confirm("Delete this venue? Events held at this venue will also be removed.")) return;
  try { await api("venues", { method: "DELETE", id }); toast("Venue deleted."); venues(); } catch (e) { toast(e.message, true); }
}

/* ===== Administrator: oversee all events and bookings ===== */
async function allEvents() {
  const e = (await api("events")).data;
  view(`<div class="bar"><h2>All events</h2></div>` + table(["ID", "Title", "Date", "Venue", "Organiser", "Price", "Tickets left", ""],
    e.map(x => [x.event_id, esc(x.title), dt(x.event_date), esc(x.venue_name), esc(x.organiser_name), money(x.ticket_price), x.available_tickets,
      `<button class="del" onclick="delEvent(${x.event_id})">Delete</button>`]), "No events in the system."));
}
async function allBookings() {
  const b = (await api("bookings")).data;
  view(`<div class="bar"><h2>All bookings</h2></div>` + table(["ID", "Event", "Customer", "Qty", "Total", "Booked on", "Status", ""],
    b.map(x => [x.booking_id, esc(x.event_title), esc(x.customer_name), x.quantity, money(x.total_price), dt(x.booking_date), tag(x.status),
      `<button onclick="setStatus(${x.booking_id},'${x.status === "Cancelled" ? "Confirmed" : "Cancelled"}')">${x.status === "Cancelled" ? "Reconfirm" : "Cancel booking"}</button>`]), "No bookings in the system."));
}