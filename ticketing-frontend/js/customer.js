/* customer.js: Customer screens (browse, book, my bookings) */
/* ===== Customer: browse, book, cancel ===== */
const when = d => new Date(String(d).replace(" ", "T"));
async function browse() {
  cache.events = (await api("events")).data;
  view(`<div class="bar"><h2>Upcoming events</h2><div class="row"><input id="q" placeholder="Search title or venue" aria-label="Search events" style="width:210px">
  <select id="sort" aria-label="Sort events" style="width:auto"><option value="date">Soonest first</option><option value="price">Lowest price</option><option value="left">Most tickets left</option></select></div></div><div id="list"></div>`);
  $("#q").oninput = $("#sort").onchange = drawBrowse; drawBrowse();
}
function drawBrowse() {
  const q = $("#q").value.trim().toLowerCase(), s = $("#sort").value, now = new Date();
  const e = cache.events.filter(x => (x.title + " " + x.venue_name).toLowerCase().includes(q))
    .sort((a, b) => s === "price" ? a.ticket_price - b.ticket_price : s === "left" ? b.available_tickets - a.available_tickets : when(a.event_date) - when(b.event_date));
  $("#list").innerHTML = e.length ? `<div class="grid">` + e.map(x => {
    const over = when(x.event_date) < now, out = x.available_tickets < 1;
    const badge = over ? '<span class="tag x">Ended</span>' : out ? '<span class="tag x">Sold out</span>' : x.available_tickets < 50 ? '<span class="tag w">Only ' + x.available_tickets + ' left</span>' : x.available_tickets + " tickets left";
    return `<article class="stub"><div class="hd"><h3>${esc(x.title)}</h3><small>${dt(x.event_date)} at ${esc(x.venue_name)}</small></div>
    <div class="bd"><div><div class="pr">${money(x.ticket_price)}</div><small>${badge}</small></div>
    <div><button onclick="details(${x.event_id})">Details</button> <button class="pri" onclick="book(${x.event_id})" ${over || out ? "disabled" : ""}>Book</button></div></div></article>`;
  }).join("") + `</div>` : '<div class="empty">No events match your search. Try a different word.</div>';
}
function details(id) {
  const x = cache.events.find(e => e.event_id == id), d = $("#modal");
  d.innerHTML = `<h3>${esc(x.title)}</h3><p>${esc(x.description) || "No description."}</p><p><b>When:</b> ${dt(x.event_date)}<br><b>Where:</b> ${esc(x.venue_name)}<br><b>Organiser:</b> ${esc(x.organiser_name)}<br><b>Price:</b> ${money(x.ticket_price)}</p>
  <label>See the price in another currency<select id="cur"><option>USD</option><option>SGD</option><option>EUR</option><option>GBP</option><option>JPY</option></select></label>
  <p id="conv" class="err" style="color:var(--ink)"></p><div class="row"><button onclick="convert(${id})">Convert price</button><button class="pri" onclick="$('#modal').close()">Close</button></div>`;
  d.showModal();
}
async function convert(id) {
  const c = $("#cur").value, out = $("#conv"); out.textContent = "Converting…";
  try {
    const e = (await api("events", { id, query: { currency: c } })).data;
    out.textContent = e.ticket_price_converted !== undefined ? "About " + e.ticket_price_converted + " " + e.currency + " per ticket." : "The exchange rate service is unavailable. Showing MYR only.";
  } catch (er) { out.textContent = er.message; }
}
function book(id) {
  const x = cache.events.find(e => e.event_id == id);
  form("Book: " + x.title, [{ name: "quantity", label: "Number of tickets (max " + x.available_tickets + ")", type: "number", min: 1, max: x.available_tickets, value: 1 }],
    async d => {
      const q = whole(d.quantity, "Number of tickets", 1);
      if (q > x.available_tickets) throw new Error("Only " + x.available_tickets + " tickets are left.");
      const r = await api("bookings", { method: "POST", body: { customer_id: user.user_id, event_id: id, quantity: q } });
      toast("Booked! Total " + money(r.total_price)); browse();
    }, "Confirm booking");
}
async function myBookings() {
  const b = (await api("bookings")).data.filter(x => x.customer_id == user.user_id);
  view(`<div class="bar"><h2>My bookings</h2></div>` + table(["ID", "Event", "Qty", "Total", "Booked on", "Status", ""],
    b.map(x => [x.booking_id, esc(x.event_title), x.quantity, money(x.total_price), dt(x.booking_date), tag(x.status),
      x.status === "Confirmed" ? `<button class="del" onclick="cancelBooking(${x.booking_id})">Cancel</button>` : ""]), "You have no bookings yet. Browse events to book your first ticket."));
}
async function cancelBooking(id) {
  if (!confirm("Cancel this booking?")) return;
  try { await api("bookings", { method: "PUT", body: { booking_id: id, status: "Cancelled" } }); toast("Booking cancelled."); myBookings(); } catch (e) { toast(e.message, true); }
}