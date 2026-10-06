import { setModalTemplate, confirmModal } from "./modal.js";
import { showToast } from "./toast.js";
import { validateForm } from "./validator.js";
import { authApi, handleAuth } from "./auth.js";
import { bookingsApi, createBooking, deleteBooking, updateBooking } from "./bookings.js";
import { roomsApi, saveRoom, deleteRoom } from "./rooms.js";
import { usersApi, saveProfile, deleteAccount } from "./users.js";
import { peso, renderRoomCard, renderBookingCard, renderStatusBadge } from "./render.js";

const app = document.querySelector("#app");
let currentUser = null;
let currentRoute = "landing";
let rooms = [];
let bookings = [];
let selectedRoomId = null;
let selectedDate = new Date().toISOString().slice(0, 10);
let selectedTime = "16:00";
let editingRoomId = null;

const routes = {
  landing: renderLanding,
  login: () => renderAuth("login"),
  register: () => renderAuth("register"),
  "drummer-home": renderDrummerHome,
  "book-studio": renderBookStudio,
  "my-bookings": renderMyBookings,
  "owner-dashboard": renderOwnerDashboard,
  "manage-bookings": renderManageBookings,
  "manage-rooms": renderManageRooms,
  profile: renderProfile,
};

async function loadSharedComponents() {
  const [navbar, footer, modal] = await Promise.all([
    fetch("/frontend/src/components/navbar.html").then((r) => r.text()),
    fetch("/frontend/src/components/footer.html").then((r) => r.text()),
    fetch("/frontend/src/components/modal.html").then((r) => r.text()),
  ]);
  document.querySelector("#navbar-root").innerHTML = navbar;
  document.querySelector("#footer-root").innerHTML = footer;
  setModalTemplate(modal);
}

async function loadSession() {
  try {
    const result = await authApi.session();
    currentUser = result.authenticated ? result.user : null;
  } catch {
    currentUser = null;
  }
}

async function loadRooms(owner = false) {
  const result = owner ? await roomsApi.all() : await roomsApi.list();
  rooms = result.rooms || [];
  if (!selectedRoomId && rooms.length) selectedRoomId = rooms[0].id;
  if (selectedRoomId && !rooms.some((room) => room.id === selectedRoomId)) selectedRoomId = rooms[0]?.id || null;
  return rooms;
}

async function loadBookings() {
  const result = await bookingsApi.list();
  bookings = result.bookings || [];
  return bookings;
}

function navigate(route) {
  currentRoute = routes[route] ? route : "landing";
  Promise.resolve(routes[currentRoute]()).then(() => {
    renderNav();
    window.history.replaceState({}, "", `#${currentRoute}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }).catch((error) => {
    app.innerHTML = `<section class="page"><div class="container"><div class="card card-body"><h1>Unable to load this page</h1><p class="muted">${error.message}</p></div></div></section>`;
    renderNav();
  });
}

function renderNav() {
  const nav = document.querySelector("#nav-links");
  if (!nav) return;
  const isPublic = ["landing", "login", "register"].includes(currentRoute);
  if (isPublic || !currentUser) {
    nav.innerHTML = `<button class="nav-link ${currentRoute === "landing" ? "active" : ""}" data-route="landing">Home</button><button class="nav-link" data-route="login">Login</button><button class="btn btn-small" data-route="register">Register</button>`;
    return;
  }
  const owner = currentUser.role === "owner";
  const links = owner
    ? [["owner-dashboard", "Dashboard"], ["manage-bookings", "Manage Bookings"], ["manage-rooms", "Rooms"], ["profile", "Profile"]]
    : [["drummer-home", "Home"], ["book-studio", "Book Studio"], ["my-bookings", "My Bookings"], ["profile", "Profile"]];
  nav.innerHTML = `${links.map(([route, label]) => `<button class="nav-link ${currentRoute === route ? "active" : ""}" data-route="${route}">${label}</button>`).join("")}<button class="btn btn-small btn-secondary" data-action="logout">Logout</button>`;
}

function renderLanding() {
  return loadRooms().then(() => {
    app.innerHTML = `<section class="hero"><div class="container hero-content"><span class="eyebrow">Your next great session starts here</span><h1>Practice loud. Book simple.</h1><p>Find a fully equipped drum studio, choose a time, and get behind the kit in a few clicks.</p><div class="btn-row"><button class="btn" data-route="register">Start booking <i class="fa-solid fa-arrow-right"></i></button><button class="btn btn-secondary" data-route="login">Login</button></div><div class="hero-proof"><span><i class="fa-solid fa-circle-check"></i>Instant availability</span><span><i class="fa-solid fa-shield-halved"></i>Secure booking</span><span><i class="fa-solid fa-headphones"></i>Quality gear</span></div></div></section><section class="section"><div class="container"><div class="section-heading"><span class="eyebrow">Featured spaces</span><h2>Rooms built for your best playing</h2><p class="muted">Acoustically treated, fully equipped, and ready when you are.</p></div><div class="grid">${rooms.map((room) => `<div class="span-4">${renderRoomCard(room)}</div>`).join("")}</div></div></section><section class="section feature-strip"><div class="container"><div class="section-heading center"><span class="eyebrow">How it works</span><h2>From browsing to playing in three steps</h2></div><div class="grid steps"><div class="span-4 step"><h3>Choose your room</h3><p>Compare gear, capacity, and hourly prices.</p></div><div class="span-4 step"><h3>Pick a time</h3><p>See live availability and select your session.</p></div><div class="span-4 step"><h3>Start playing</h3><p>Get confirmed and arrive ready to make noise.</p></div></div></div></section>`;
  });
}

function renderAuth(type) {
  const register = type === "register";
  app.innerHTML = `<section class="auth-page"><div class="auth-visual"><blockquote>“A smooth booking flow means more time where it matters: behind the kit.”</blockquote></div><div class="auth-panel"><form class="auth-form" id="auth-form" novalidate><span class="eyebrow">${register ? "Join the community" : "Welcome back"}</span><h1>${register ? "Create your account" : "Login to BeatBase"}</h1><p class="muted">${register ? "Book sessions or manage your studio in one place." : "Your next session is only a few clicks away."}</p>${register ? '<div class="form-group"><label for="name">Full name</label><input class="input" id="name" name="name" required data-error="Please enter your name." placeholder="Jamie Carter" /></div>' : ""}<div class="form-group"><label for="email">Email address</label><input class="input" id="email" name="email" type="email" required data-error="Please enter your email." placeholder="you@example.com" /></div><div class="form-group"><label for="password">Password</label><input class="input" id="password" name="password" type="password" required data-error="Please enter your password." placeholder="At least 8 characters" /></div>${register ? '<div class="form-group"><label for="confirmPassword">Confirm password</label><input class="input" id="confirmPassword" name="confirmPassword" type="password" required data-error="Please confirm your password." /></div><div class="form-group"><label>I am a...</label><div class="role-cards"><button class="role-card active" type="button" data-role-choice="drummer"><i class="fa-solid fa-drum"></i><br /><strong>Drummer</strong><br /><span class="muted">Book practice sessions</span></button><button class="role-card" type="button" data-role-choice="owner"><i class="fa-solid fa-building"></i><br /><strong>Studio Owner</strong><br /><span class="muted">Manage your space</span></button></div></div>' : ""}<button class="btn" type="submit">${register ? "Create account" : "Login"} <i class="fa-solid fa-arrow-right"></i></button><p class="muted">${register ? "Already have an account?" : "New to BeatBase?"} <a href="#${register ? "login" : "register"}" data-route="${register ? "login" : "register"}">${register ? "Login" : "Register"}</a></p></form></div></section>`;
}

async function renderDrummerHome() {
  if (!currentUser) return navigate("login");
  await Promise.all([loadRooms(), loadBookings()]);
  const completed = bookings.filter((b) => b.status === "confirmed" && b.date < new Date().toISOString().slice(0, 10)).length;
  const hours = bookings.filter((b) => b.status === "confirmed").reduce((sum, b) => sum + Number(b.duration || 1), 0);
  const favorites = new Set(bookings.map((b) => b.room_id)).size;
  const next = bookings.find((b) => ["pending", "confirmed"].includes(b.status)) || bookings[0];
  app.innerHTML = `<section class="page"><div class="container"><div class="welcome-banner"><span class="eyebrow">${new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}</span><h1>Ready to make some noise, ${currentUser.name.split(" ")[0]}?</h1><p>${next ? `Your next session is ${next.status}.` : "You have no upcoming sessions yet."}</p><button class="btn" data-route="book-studio"><i class="fa-solid fa-plus"></i>Book a Studio</button></div><div class="section-heading" style="margin-top: var(--space-xl)"><h2>Up next</h2><p class="muted">Everything you need for your upcoming session.</p></div>${next ? renderBookingCard(next) : '<div class="card card-body"><p class="muted">No bookings yet.</p></div>'}<div class="grid" style="margin-top: var(--space-xl)"><div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-clock-rotate-left"></i></div><div><p class="stat-value">${completed}</p><span class="muted">Sessions completed</span></div></div><div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-drum"></i></div><div><p class="stat-value">${hours}h</p><span class="muted">Practice time</span></div></div><div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-star"></i></div><div><p class="stat-value">${favorites}</p><span class="muted">Favorite rooms</span></div></div></div></div></section>`;
}

async function renderBookStudio() {
  if (!currentUser) return navigate("login");
  await Promise.all([loadRooms(), loadBookings()]);
  const selected = rooms.find((r) => r.id === selectedRoomId) || rooms[0];
  if (selected) selectedRoomId = selected.id;
  const slots = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
  const booked = bookings.filter((b) => Number(b.room_id) === Number(selected?.id) && b.date === selectedDate && b.status !== "cancelled").map((b) => b.start_time);
  const selectedLabel = new Date(`1970-01-01T${selectedTime}:00`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  app.innerHTML = `<section class="page"><div class="container"><div class="page-heading"><div><span class="eyebrow">Book a studio</span><h1>Find your perfect session</h1><p class="muted">Choose a room, date, and available time.</p></div><span class="badge badge-confirmed"><i class="fa-solid fa-circle-check"></i>Live availability</span></div><div class="grid booking-layout"><div class="span-8"><h2>1. Choose a Studio Room</h2><div class="grid">${rooms.map((room) => `<div class="span-6">${renderRoomCard(room, true, false, selectedRoomId)}</div>`).join("")}</div><h2 style="margin-top: var(--space-xl)">2. Choose a date</h2><div class="card card-body"><div class="form-group"><label for="booking-date">Date</label><input class="input" id="booking-date" type="date" value="${selectedDate}" /></div></div><h2 style="margin-top: var(--space-xl)">3. Pick a time</h2><div class="card card-body"><div class="time-slots">${slots.map((time) => { const unavailable = booked.includes(time); const selectedClass = time === selectedTime && !unavailable ? "selected" : ""; const label = new Date(`1970-01-01T${time}:00`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); return `<button class="time-slot ${selectedClass}" data-time="${time}" ${unavailable ? "disabled" : ""}>${label}${unavailable ? "<br><small>Booked</small>" : ""}</button>`; }).join("")}</div></div></div><aside class="span-4 sticky-panel"><div class="card card-body"><span class="eyebrow">Booking summary</span><h2>${selected?.name || "No room"}</h2><div class="summary-line"><span>Date</span><strong>${new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-PH", { day: "2-digit", month: "short", year: "numeric" })}</strong></div><div class="summary-line"><span>Time</span><strong>${selectedLabel}</strong></div><div class="summary-line"><span>Duration</span><strong>1 hour</strong></div><div class="summary-line summary-total"><span>Total</span><span>${peso(selected?.price)}</span></div><button class="btn" id="confirm-booking" style="width: 100%; margin-top: var(--space-lg)"><i class="fa-solid fa-calendar-check"></i>Confirm Booking</button><p class="muted" style="font-size: var(--font-size-caption); margin-top: var(--space-md)"><i class="fa-solid fa-shield-halved"></i> You can reschedule up to 24 hours before.</p></div></aside></div></div></section>`;
}

async function renderMyBookings() {
  if (!currentUser) return navigate("login");
  await loadBookings();
  const upcoming = bookings.filter((b) => b.status !== "cancelled");
  const past = bookings.filter((b) => b.status === "cancelled");
  app.innerHTML = `<section class="page"><div class="container"><div class="page-heading"><div><span class="eyebrow">My Bookings</span><h1>Your sessions</h1><p class="muted">Review, reschedule, or cancel your studio time.</p></div><button class="btn" data-route="book-studio"><i class="fa-solid fa-plus"></i>New Booking</button></div><div class="tabs"><button class="tab active" data-booking-tab="upcoming">Upcoming <span>(${upcoming.length})</span></button><button class="tab" data-booking-tab="past">Past <span>(${past.length})</span></button></div><div id="booking-list">${upcoming.length ? upcoming.map((b) => renderBookingCard(b)).join("") : '<div class="card card-body"><p class="muted">No upcoming bookings.</p></div>'}</div></div></section>`;
}

async function renderOwnerDashboard() {
  if (!currentUser) return navigate("login");
  if (currentUser.role !== "owner") return navigate("drummer-home");
  await loadBookings();
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = bookings.filter((b) => b.date === today && b.status !== "cancelled").length;
  const pending = bookings.filter((b) => b.status === "pending").length;
  const weekRevenue = bookings.filter((b) => b.status === "confirmed").reduce((sum, b) => sum + Number(b.amount || 0), 0);
  app.innerHTML = `<section class="page"><div class="container"><div class="page-heading"><div><span class="eyebrow">Owner Dashboard</span><h1>Good morning, ${currentUser.name.split(" ")[0]}</h1><p class="muted">Here’s what’s happening across your studios today.</p></div><button class="btn" data-route="manage-rooms"><i class="fa-solid fa-plus"></i>Add Room</button></div><div class="grid"><div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-calendar-day"></i></div><div><p class="stat-value">${todayCount}</p><span class="muted">Today's bookings</span></div></div><div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-clock"></i></div><div><p class="stat-value">${pending}</p><span class="muted">Pending approval</span></div></div><div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-peso-sign"></i></div><div><p class="stat-value">${peso(weekRevenue)}</p><span class="muted">Revenue from confirmed bookings</span></div></div></div><div class="page-heading" style="margin-top: var(--space-xl)"><div><h2>Recent bookings</h2><p class="muted">Latest activity across all studio rooms.</p></div><button class="btn btn-secondary btn-small" data-route="manage-bookings">View all <i class="fa-solid fa-arrow-right"></i></button></div>${bookings.slice().sort((a, b) => b.id - a.id).slice(0, 8).map((b) => renderBookingCard(b, false)).join("") || '<div class="card card-body"><p class="muted">No bookings yet.</p></div>'}</div></section>`;
}

async function renderManageBookings() {
  if (!currentUser || currentUser.role !== "owner") return navigate("drummer-home");
  await loadBookings();
  app.innerHTML = `<section class="page"><div class="container"><div class="page-heading"><div><span class="eyebrow">Operations</span><h1>Manage Bookings</h1><p class="muted">Approve sessions, update details, and track payments.</p></div></div><div class="card table-wrap"><table class="data-table"><thead><tr><th>Customer</th><th>Studio Room</th><th>Date & time</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead><tbody>${bookings.map((booking) => `<tr><td><strong>${booking.customer}</strong><br><span class="muted">#${booking.id}</span></td><td>${booking.room}</td><td>${booking.date}<br><span class="muted">${booking.time}</span></td><td>${booking.payment}<br><span class="muted">${peso(booking.amount)}</span></td><td>${renderStatusBadge(booking.status)}</td><td><div class="btn-row">${booking.status === "pending" ? `<button class="btn btn-small" data-action="approve-booking" data-booking-id="${booking.id}"><i class="fa-solid fa-check"></i>Approve</button>` : ""}${booking.status !== "cancelled" ? `<button class="btn btn-ghost btn-small" data-action="cancel-booking" data-booking-id="${booking.id}"><i class="fa-solid fa-ban"></i>Cancel</button>` : ""}</div></td></tr>`).join("")}</tbody></table></div></div></section>`;
}

async function renderManageRooms() {
  if (!currentUser || currentUser.role !== "owner") return navigate("drummer-home");
  await loadRooms(true);
  const editing = rooms.find((r) => r.id === editingRoomId);
  app.innerHTML = `<section class="page"><div class="container"><div class="page-heading"><div><span class="eyebrow">Studio setup</span><h1>Manage Rooms</h1><p class="muted">Keep your spaces and equipment up to date.</p></div></div><div class="grid"><div class="span-5"><form class="card card-body sticky-panel" id="room-form" novalidate><h2><i class="fa-solid fa-${editing ? "pencil" : "plus"}"></i> ${editing ? "Edit Room" : "Add Room"}</h2><div class="form-group"><label for="room-name">Room name</label><input class="input" id="room-name" value="${editing?.name || ""}" required data-error="Please enter a room name." placeholder="e.g. The Live Room" /></div><div class="grid"><div class="span-6"><div class="form-group"><label for="price">Price per hour</label><input class="input" id="price" type="number" min="0" step="0.01" value="${editing?.price ?? ""}" required placeholder="₱1,400" /></div></div><div class="span-6"><div class="form-group"><label for="capacity">Capacity</label><input class="input" id="capacity" type="number" min="1" value="${editing?.capacity ?? ""}" required placeholder="4" /></div></div></div><div class="form-group"><label for="equipment">Equipment</label><textarea class="textarea" id="equipment" required placeholder="List the kit, cymbals, and extras">${editing?.equipment || ""}</textarea></div><div class="form-group"><label for="photo">Room photo URL</label><input class="input" id="photo" value="${editing?.image || ""}" placeholder="https://..." /></div><button class="btn" id="save-room" type="submit"><i class="fa-solid fa-${editing ? "floppy-disk" : "plus"}"></i>${editing ? "Save Changes" : "Add Room"}</button>${editing ? '<button class="btn btn-ghost" type="button" data-action="cancel-room-edit">Cancel edit</button>' : ""}</form></div><div class="span-7"><h2>Your rooms <span class="muted">(${rooms.length})</span></h2><div class="grid">${rooms.map((room) => `<div class="span-6">${renderRoomCard(room, false, true)}</div>`).join("")}</div></div></div></div></section>`;
}

async function renderProfile() {
  if (!currentUser) return navigate("login");
  const result = await usersApi.profile();
  currentUser = result.user;
  await loadBookings();
  const initials = currentUser.name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();
  app.innerHTML = `<section class="page"><div class="container"><div class="page-heading"><div><span class="eyebrow">Account</span><h1>Your profile</h1><p class="muted">Update your personal details and account settings.</p></div></div><div class="grid"><aside class="span-4"><div class="card card-body"><div class="profile-avatar">${initials}</div><h2>${currentUser.name}</h2><p class="muted">${currentUser.role === "owner" ? "Studio Owner" : "Drummer"} · Member since ${new Date(currentUser.created_at).getFullYear()}</p><div class="summary-line"><span>Bookings</span><strong>${bookings.length}</strong></div><div class="summary-line"><span>Status</span><span class="badge badge-confirmed"><i class="fa-solid fa-circle-check"></i>Active</span></div></div></aside><div class="span-8"><form class="card card-body" id="profile-form"><h2>Edit profile</h2><div class="grid"><div class="span-6"><div class="form-group"><label for="profile-name">Full name</label><input class="input" id="profile-name" value="${currentUser.name}" required /></div></div><div class="span-6"><div class="form-group"><label for="profile-email">Email address</label><input class="input" id="profile-email" type="email" value="${currentUser.email}" required /></div></div></div><div class="form-group"><label for="profile-phone">Phone number</label><input class="input" id="profile-phone" value="${currentUser.phone || ""}" /></div><div class="form-group"><label for="profile-password">New password</label><input class="input" id="profile-password" type="password" placeholder="Leave blank to keep current password" /></div><button class="btn" type="submit"><i class="fa-solid fa-floppy-disk"></i>Save Changes</button></form><div class="danger-zone"><h2>Delete my account</h2><p>This permanently removes your profile and booking history. This action cannot be undone.</p><button class="btn btn-danger" data-action="delete-account"><i class="fa-solid fa-trash"></i>Delete my account</button></div></div></div></div></section>`;
}

document.addEventListener("click", async (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    event.preventDefault();
    if (routeButton.dataset.roomId) selectedRoomId = Number(routeButton.dataset.roomId);
    navigate(routeButton.dataset.route);
    return;
  }

  const roleChoice = event.target.closest("[data-role-choice]");
  if (roleChoice) {
    document.querySelectorAll("[data-role-choice]").forEach((el) => el.classList.remove("active"));
    roleChoice.classList.add("active");
    return;
  }

  const actionEl = event.target.closest("[data-action]");
  const action = actionEl?.dataset.action;
  if (action === "logout") {
    await authApi.logout();
    currentUser = null;
    showToast("success", "You have been logged out.", "Signed out");
    navigate("landing");
  }
  if (action === "cancel-booking") {
    confirmModal("Are you sure you want to cancel this booking?", () => deleteBooking(Number(actionEl.dataset.bookingId), () => navigate(currentRoute)), "Cancel booking?");
  }
  if (action === "approve-booking") {
    await updateBooking(Number(actionEl.dataset.bookingId), { status: "confirmed", payment: "Paid" }, () => navigate("manage-bookings"));
  }
  if (action === "delete-room") {
    confirmModal("Are you sure you want to delete this room? This cannot be undone.", () => deleteRoom(Number(actionEl.dataset.roomId), () => navigate("manage-rooms")), "Delete Studio Room?");
  }
  if (action === "edit-room") {
    editingRoomId = Number(actionEl.dataset.roomId);
    navigate("manage-rooms");
  }
  if (action === "cancel-room-edit") {
    editingRoomId = null;
    navigate("manage-rooms");
  }
  if (action === "delete-account") {
    confirmModal("Are you sure you want to delete your account?", () => deleteAccount(() => { currentUser = null; navigate("landing"); }), "Delete account?");
  }
  if (action === "select-room") {
    selectedRoomId = Number(actionEl.dataset.roomId);
    navigate("book-studio");
  }

  const timeSlot = event.target.closest(".time-slot:not(:disabled)");
  if (timeSlot) {
    selectedTime = timeSlot.dataset.time;
    document.querySelectorAll(".time-slot").forEach((el) => el.classList.remove("selected"));
    timeSlot.classList.add("selected");
    return;
  }

  const bookingTab = event.target.closest("[data-booking-tab]");
  if (bookingTab) {
    const list = document.querySelector("#booking-list");
    if (!list) return;
    document.querySelectorAll(".tab").forEach((el) => el.classList.remove("active"));
    bookingTab.classList.add("active");
    const source = bookingTab.dataset.bookingTab === "past" ? bookings.filter((b) => b.status === "cancelled") : bookings.filter((b) => b.status !== "cancelled");
    list.innerHTML = source.length ? source.map((b) => renderBookingCard(b, bookingTab.dataset.bookingTab !== "past")).join("") : '<div class="card card-body"><p class="muted">No bookings found.</p></div>';
  }
});

document.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (event.target.id === "auth-form") return handleAuth(event.target, navigate);

  if (event.target.id === "room-form" && validateForm(event.target)) {
    const payload = { name: document.querySelector("#room-name").value, price: Number(document.querySelector("#price").value), capacity: Number(document.querySelector("#capacity").value), equipment: document.querySelector("#equipment").value, image: document.querySelector("#photo").value };
    return saveRoom(event.target.querySelector("#save-room"), payload, editingRoomId, () => { editingRoomId = null; navigate("manage-rooms"); });
  }

  if (event.target.id === "profile-form" && validateForm(event.target)) {
    const password = document.querySelector("#profile-password").value;
    return saveProfile({ name: document.querySelector("#profile-name").value, email: document.querySelector("#profile-email").value, phone: document.querySelector("#profile-phone").value, ...(password ? { password } : {}) }, (user) => { currentUser = user; navigate("profile"); });
  }
});

document.addEventListener("change", (event) => {
  if (event.target.id === "booking-date") {
    selectedDate = event.target.value;
    navigate("book-studio");
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("#confirm-booking");
  if (!button) return;
  const room = rooms.find((r) => r.id === selectedRoomId);
  if (!room) return;
  const label = new Date(`1970-01-01T${selectedTime}:00`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const end = new Date(`1970-01-01T${selectedTime}:00`);
  end.setHours(end.getHours() + 1);
  const endLabel = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  await createBooking(button, { room_id: room.id, date: selectedDate, start_time: selectedTime, time: `${label} – ${endLabel}`, duration: 1 }, () => navigate("my-bookings"));
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("#mobile-menu")) return;
  const nav = document.querySelector("#nav-links");
  nav.classList.toggle("open");
  event.target.closest("#mobile-menu").setAttribute("aria-expanded", String(nav.classList.contains("open")));
});

window.addEventListener("hashchange", () => navigate(location.hash.slice(1) || "landing"));

(async function init() {
  try {
    await loadSharedComponents();
    await loadSession();
    await routes[location.hash.slice(1) || "landing"]();
    renderNav();
  } catch (error) {
    app.innerHTML = `<section class="page"><div class="container"><div class="card card-body"><h1>Unable to start BeatBase</h1><p class="muted">${error.message}</p></div></div></section>`;
  }
})();
