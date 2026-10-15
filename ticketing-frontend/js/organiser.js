/* organiser.js: Organiser screens (own events and their bookings) */
/* ===== Organiser: own events and their bookings ===== */
async function myEvents() {
  const e = cache.events = (await api("events")).data.filter(x => x.organiser_id == user.user_id);
  view(`<div class="bar"><h2>My events</h2><button class="pri" onclick="addEvent()">Create event</button></div>` +
    table(["ID", "Title", "Date", "Venue", "Price", "Tickets left", ""], e.map(x => [x.event_id, esc(x.title), dt(x.event_date), esc(x.venue_name), money(x.ticket_price), x.available_tickets,
      `<button onclick="editEvent(${x.event_id})">Edit</button> <button class="del" onclick="delEvent(${x.event_id})">Delete</button>`]), "You have not created any events yet."));
}
async function addEvent() {
  let v; try { v = (await api("venues")).data; } catch (e) { return toast(e.message, true); }
  if (!v.length) return toast("Ask an administrator to add a venue first.", true);
  form("Create event", [{ name: "title", label: "Title" }, { name: "description", label: "Description (optional)" }, { name: "event_date", label: "Date and time", type: "datetime-local" },
    { name: "venue_id", label: "Venue", type: "select", options: v.map(x => [x.venue_id, x.name + " (" + x.capacity + " seats)"]) },
    { name: "ticket_price", label: "Ticket price (RM)", type: "number", min: 1 }, { name: "available_tickets", label: "Tickets available", type: "number", min: 1 }],
    async d => {
      need(d.title, "Title"); need(d.event_date, "Date and time");
      if (new Date(d.event_date) < new Date()) throw new Error("The event date must be in the future.");
      const venue = v.find(x => x.venue_id == d.venue_id);
      d.ticket_price = num(d.ticket_price, "Ticket price", 1); d.available_tickets = whole(d.available_tickets, "Tickets available", 1);
      if (d.available_tickets > venue.capacity) throw new Error("Tickets cannot exceed the venue capacity of " + venue.capacity + ".");
      await api("events", { method: "POST", body: { ...d, event_date: d.event_date.replace("T", " ") + ":00", organiser_id: user.user_id } }); toast("Event created."); myEvents();
    }, "Create event");
}
function editEvent(id) {
  const x = cache.events.find(e => e.event_id == id);
  form("Edit event", [{ name: "title", label: "Title", value: x.title }, { name: "ticket_price", label: "Ticket price (RM)", type: "number", min: 1, value: x.ticket_price }, { name: "available_tickets", label: "Tickets available", type: "number", min: 0, value: x.available_tickets }],
    async d => { need(d.title, "Title"); d.ticket_price = num(d.ticket_price, "Ticket price", 1); d.available_tickets = whole(d.available_tickets, "Tickets available", 1);
      await api("events", { method: "PUT", body: { event_id: id, ...d } }); toast("Event updated."); myEvents(); });
}
async function delEvent(id) {
  if (!confirm("Delete this event? Its bookings will also be removed.")) return;
  try { await api("events", { method: "DELETE", id }); toast("Event deleted."); go(tab); } catch (e) { toast(e.message, true); }
}
async function orgBookings() {
  const [ev, bk] = await Promise.all([api("events"), api("bookings")]);
  const ids = ev.data.filter(x => x.organiser_id == user.user_id).map(x => x.event_id);
  const b = bk.data.filter(x => ids.includes(Number(x.event_id)));
  view(`<div class="bar"><h2>Bookings for my events</h2></div>` + table(["ID", "Event", "Customer", "Qty", "Total", "Booked on", "Status", ""],
    b.map(x => [x.booking_id, esc(x.event_title), esc(x.customer_name), x.quantity, money(x.total_price), dt(x.booking_date), tag(x.status),
      `<button onclick="setStatus(${x.booking_id},'${x.status === "Cancelled" ? "Confirmed" : "Cancelled"}')">${x.status === "Cancelled" ? "Reconfirm" : "Cancel booking"}</button>`]), "No one has booked your events yet."));
}
async function setStatus(id, status) {
  try { await api("bookings", { method: "PUT", body: { booking_id: id, status } }); toast("Booking " + status.toLowerCase() + "."); go(tab); } catch (e) { toast(e.message, true); }
}