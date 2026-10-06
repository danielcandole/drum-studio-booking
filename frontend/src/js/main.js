import { setModalTemplate, confirmModal } from "./modal.js";
import { showToast } from "./toast.js";
import { validateForm } from "./validator.js";
import { authApi, handleAuth } from "./auth.js";
import { bookingsApi, createBooking, updateBooking, deleteBooking } from "./bookings.js";
import { roomsApi, saveRoom, deleteRoom } from "./rooms.js";
import { usersApi, saveProfile, deleteAccount } from "./users.js";
import { currency, renderRoomCard, renderBookingCard, renderStatusBadge } from "./render.js";
import navbarTemplate from "../components/navbar.html?raw";
import footerTemplate from "../components/footer.html?raw";
import modalTemplate from "../components/modal.html?raw";

const app = document.querySelector("#app");
let currentUser = null;
let currentRoute = "landing";
let editingRoomId = null;
let selectedRoomId = null;
let selectedBookingId = null;
let selectedBookingDate = "";
let selectedBookingTime = "";

function loadSharedComponents() {
  document.querySelector("#navbar-root").innerHTML = navbarTemplate;
  document.querySelector("#footer-root").innerHTML = footerTemplate;
  setModalTemplate(modalTemplate);
}

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

const protectedRoutes = new Set([
  "drummer-home", "book-studio", "my-bookings", "owner-dashboard",
  "manage-bookings", "manage-rooms", "profile"
]);
const ownerRoutes = new Set(["owner-dashboard", "manage-bookings", "manage-rooms"]);

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function formatDateTime(booking) {
  return `${formatDate(booking.date)} · ${booking.time}`;
}

function renderNav() {
  const nav = document.querySelector("#nav-links");
  if (!nav) return;

  if (!currentUser) {
    nav.innerHTML = `
      <button class="nav-link ${currentRoute === "landing" ? "active" : ""}" data-route="landing">Home</button>
      <button class="nav-link ${currentRoute === "login" ? "active" : ""}" data-route="login">Login</button>
      <button class="btn btn-small" data-route="register">Register</button>
    `;
    return;
  }

  const links = currentUser.role === "owner"
    ? [
      ["owner-dashboard", "Dashboard"],
      ["manage-bookings", "Manage Bookings"],
      ["manage-rooms", "Rooms"],
      ["profile", "Profile"],
    ]
    : [
      ["drummer-home", "Home"],
      ["book-studio", "Book Studio"],
      ["my-bookings", "My Bookings"],
      ["profile", "Profile"],
    ];

  nav.innerHTML = `
    ${links.map(([route, label]) => `<button class="nav-link ${currentRoute === route ? "active" : ""}" data-route="${route}">${label}</button>`).join("")}
    <button class="nav-link" data-action="logout">Logout</button>
  `;
}

async function navigate(route) {
  let target = routes[route] ? route : "landing";

  if (protectedRoutes.has(target) && !currentUser) target = "login";
  if (ownerRoutes.has(target) && currentUser?.role !== "owner") target = currentUser ? "drummer-home" : "login";

  if ((target === "login" || target === "register") && currentUser) {
    target = currentUser.role === "owner" ? "owner-dashboard" : "drummer-home";
  }

  currentRoute = target;
  try {
    await routes[currentRoute]();
  } catch (error) {
    app.innerHTML = `<section class="page"><div class="container"><div class="card card-body"><h2>Unable to load this page</h2><p class="muted">${escapeHtml(error.message)}</p></div></div></section>`;
    showToast("error", error.message, "Page error");
  }
  renderNav();
  window.history.replaceState({}, "", `#${currentRoute}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function refreshCurrentRoute() {
  await navigate(currentRoute);
}

async function renderLanding() {
  app.innerHTML = `
    <section class="hero">
      <div class="container hero-content">
        <span class="eyebrow">Your next great session starts here</span>
        <h1>Practice loud. Book simple.</h1>
        <p>Find a fully equipped drum studio, choose a time, and get behind the kit in a few clicks.</p>
        <div class="btn-row"><button class="btn" data-route="register">Start booking</button><button class="btn btn-secondary" data-route="login">Login</button></div>
        
      </div>
    </section>
    <section class="section"><div class="container">
      <div class="section-heading"><span class="eyebrow">Featured spaces</span><h2>Rooms built for your best playing</h2><p class="muted">Acoustically treated, fully equipped, and ready when you are.</p></div>
      <div id="featured-rooms" class="grid"><div class="card card-body"><p class="muted">Loading rooms...</p></div></div>
    </div></section>
    <section class="section feature-strip"><div class="container">
      <div class="section-heading center"><span class="eyebrow">How it works</span><h2>From browsing to playing in three steps</h2></div>
      <div class="grid steps">
        <div class="span-4 step"><h3>Choose your room</h3><p>Compare gear, capacity, and hourly prices.</p></div>
        <div class="span-4 step"><h3>Pick a time</h3><p>See live availability and select your session.</p></div>
        <div class="span-4 step"><h3>Start playing</h3><p>Get confirmed and arrive ready to make noise.</p></div>
      </div>
    </div></section>`;
  try {
    const { rooms } = await roomsApi.list();
    document.querySelector("#featured-rooms").innerHTML = rooms.length
      ? rooms.map((room) => `<div class="span-4">${renderRoomCard(room)}</div>`).join("")
      : `<div class="card card-body"><p class="muted">No studio rooms are available yet.</p></div>`;
  } catch (error) {
    document.querySelector("#featured-rooms").innerHTML = `<div class="card card-body"><p class="muted">${escapeHtml(error.message)}</p></div>`;
  }
}

function renderAuth(type) {
  const register = type === "register";
  app.innerHTML = `
    <section class="auth-page">
      <div class="auth-visual"><blockquote></blockquote></div>
      <div class="auth-panel"><form class="auth-form" id="auth-form" novalidate>
        <span class="eyebrow">${register ? "Join the community" : "Welcome back"}</span>
        <h1>${register ? "Create your account" : "Login to BeatBase"}</h1>
        <p class="muted">${register ? "Book sessions or manage your studio in one place." : "Your next session is only a few clicks away."}</p>
        ${register ? '<div class="form-group"><label for="name">Full name</label><input class="input" id="name" name="name" required data-error="Please enter your name." placeholder="Jamie Carter" /></div>' : ""}
        <div class="form-group"><label for="email">Email address</label><input class="input" id="email" name="email" type="email" required data-error="Please enter your email." placeholder="you@example.com" /></div>
        <div class="form-group"><label for="password">Password</label><input class="input" id="password" name="password" type="password" required data-error="Please enter your password." placeholder="At least 8 characters" /></div>
        ${register ? `
          <div class="form-group"><label for="confirmPassword">Confirm password</label><input class="input" id="confirmPassword" name="confirmPassword" type="password" required data-error="Please confirm your password." /></div>
          <div class="form-group"><label>I am a...</label><div class="role-cards"><button class="role-card active" type="button" data-role-choice="drummer"><i class="fa-solid fa-drum"></i><br /><strong>Drummer</strong><br /><span class="muted">Book practice sessions</span></button><button class="role-card" type="button" data-role-choice="owner"><i class="fa-solid fa-building"></i><br /><strong>Studio Owner</strong><br /><span class="muted">Manage your space</span></button></div></div>` : ""}
        <button class="btn" type="submit">${register ? "Create account" : "Login"} <i class="fa-solid fa-arrow-right"></i></button>
        <p class="muted">${register ? "Already have an account?" : "New to BeatBase?"} <a href="#${register ? "login" : "register"}" data-route="${register ? "login" : "register"}">${register ? "Login" : "Register"}</a></p>
      </form></div>
    </section>`;
}

async function renderDrummerHome() {
  const [{ bookings }, { rooms }] = await Promise.all([bookingsApi.list(), roomsApi.list()]);
  const upcoming = bookings.filter((b) => b.status !== "cancelled" && new Date(`${b.date}T${b.time}`) >= new Date()).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const completed = bookings.filter((b) => b.status === "approved" && new Date(`${b.date}T${b.time}`) < new Date());
  const practiceHours = bookings.filter((b) => b.status !== "cancelled").reduce((sum, b) => sum + Number(b.duration || 1), 0);
  const roomCounts = {};
  bookings.forEach((b) => { roomCounts[b.roomId] = (roomCounts[b.roomId] || 0) + 1; });
  const favoriteRoomId = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const favoriteRoom = rooms.find((r) => String(r.id) === String(favoriteRoomId));
  const next = upcoming[0];

  app.innerHTML = `
    <section class="page"><div class="container">
      <div class="welcome-banner">
        <span class="eyebrow">${next ? `Next session · ${formatDate(next.date)}` : "Your studio"}</span>
        <h1>Ready to make some noise, ${escapeHtml(currentUser.name)}?</h1>
        <p>${next ? `Your next session is ${escapeHtml(next.time)} at ${escapeHtml(next.room)}.` : "You have no upcoming sessions yet."}</p>
        <button class="btn" data-route="book-studio"><i class="fa-solid fa-plus"></i>Book a Studio</button>
      </div>
      <div class="section-heading" style="margin-top: var(--space-xl)"><h2>Up next</h2><p class="muted">Everything you need for your upcoming session.</p></div>
      ${next ? renderBookingCard(next) : `<div class="card card-body"><p class="muted">No upcoming bookings.</p></div>`}
      <div class="grid" style="margin-top: var(--space-xl)">
        <div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-clock-rotate-left"></i></div><div><p class="stat-value">${completed.length}</p><span class="muted">Completed sessions</span></div></div>
        <div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-drum"></i></div><div><p class="stat-value">${practiceHours}h</p><span class="muted">Booked practice time</span></div></div>
        <div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-heart"></i></div><div><p class="stat-value">${favoriteRoom ? escapeHtml(favoriteRoom.name) : "—"}</p><span class="muted">Favorite room</span></div></div>
      </div>
    </div></section>`;
}

async function renderBookStudio() {
  const { rooms } = await roomsApi.list();
  if (selectedBookingId) {
    const { bookings } = await bookingsApi.list();
    const editing = bookings.find((b) => Number(b.id) === Number(selectedBookingId));
    if (editing) {
      selectedRoomId = Number(editing.roomId);
      selectedBookingDate = editing.date;
      selectedBookingTime = editing.time;
    } else {
      selectedBookingId = null;
    }
  }
  if (!selectedRoomId || !rooms.some((r) => r.id === selectedRoomId)) selectedRoomId = rooms[0]?.id ?? null;
  if (!selectedBookingDate) {
    const now = new Date();
    selectedBookingDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  app.innerHTML = `<section class="page"><div class="container">
    <div class="page-heading"><div><span class="eyebrow">Book a studio</span><h1>Find your perfect session</h1><p class="muted">Choose a room, date, and available time.</p></div><span class="badge badge-confirmed"><i class="fa-solid fa-circle-check"></i>Live availability</span></div>
    <div class="grid booking-layout"><div class="span-8">
      <h2>1. Choose a Studio Room</h2>
      <div class="grid">${rooms.map((room) => `<div class="span-6">${renderRoomCard({...room, selected: room.id === selectedRoomId}, true)}</div>`).join("")}</div>
      <h2 style="margin-top: var(--space-xl)">2. Choose a date</h2>
      <div class="card card-body"><div class="form-group"><label for="booking-date">Date</label><input class="input" id="booking-date" type="date" min="${new Date().toISOString().slice(0,10)}" value="${selectedBookingDate}" /></div></div>
      <h2 style="margin-top: var(--space-xl)">3. Pick a time</h2>
      <div class="card card-body"><div class="time-slots" id="time-slots"><p class="muted">Loading availability...</p></div></div>
    </div>
    <aside class="span-4 sticky-panel"><div class="card card-body" id="booking-summary"><p class="muted">Loading...</p></div></aside>
    </div>
  </div></section>`;
  await updateBookingAvailability();
}

async function updateBookingAvailability() {
  const room = (await roomsApi.list()).rooms.find((r) => r.id === selectedRoomId);
  if (!room) return;
  const response = await fetch(`/api.php?route=bookings/availability&roomId=${room.id}&date=${encodeURIComponent(selectedBookingDate)}`, {
    headers: (() => { const token = localStorage.getItem("beatbase_auth_token"); return token ? { Authorization: `Bearer ${token}` } : {}; })()
  });
  const availability = await response.json();
  const booked = new Set(availability.bookedTimes || []);
  const times = ["10:00","11:00","12:00","14:00","15:00","16:00","17:00","18:00"];
  const labels = {"10:00":"10:00 AM","11:00":"11:00 AM","12:00":"12:00 PM","14:00":"2:00 PM","15:00":"3:00 PM","16:00":"4:00 PM","17:00":"5:00 PM","18:00":"6:00 PM"};
  if (!selectedBookingTime || booked.has(selectedBookingTime)) selectedBookingTime = times.find((t) => !booked.has(t)) || "";
  document.querySelector("#time-slots").innerHTML = times.map((time) => {
    const unavailable = booked.has(time);
    return `<button class="time-slot ${selectedBookingTime === time ? "selected" : ""}" data-time="${time}" ${unavailable ? "disabled" : ""}>${labels[time]}${unavailable ? "<br><small>Booked</small>" : ""}</button>`;
  }).join("") || `<p class="muted">No times available.</p>`;

  document.querySelector("#booking-summary").innerHTML = `
    <span class="eyebrow">Booking summary</span><h2>${escapeHtml(room.name)}</h2>
    <div class="summary-line"><span>Date</span><strong>${formatDate(selectedBookingDate)}</strong></div>
    <div class="summary-line"><span>Time</span><strong>${selectedBookingTime ? labels[selectedBookingTime] : "Choose a time"}</strong></div>
    <div class="summary-line"><span>Duration</span><strong>1 hour</strong></div>
    <div class="summary-line summary-total"><span>Total</span><span>${currency(room.price)}</span></div>
    <button class="btn" id="confirm-booking" style="width:100%;margin-top:var(--space-lg)" ${selectedBookingTime ? "" : "disabled"}><i class="fa-solid fa-calendar-check"></i>${selectedBookingId ? "Save Changes" : "Confirm Booking"}</button>
    <p class="muted" style="font-size:var(--font-size-caption);margin-top:var(--space-md)"><i class="fa-solid fa-shield-halved"></i> Availability is calculated from stored bookings.</p>`;
}

async function renderMyBookings() {
  const { bookings } = await bookingsApi.list();
  const upcoming = bookings.filter((b) => b.status !== "cancelled" && new Date(`${b.date}T${b.time}`) >= new Date());
  const past = bookings.filter((b) => b.status === "cancelled" || new Date(`${b.date}T${b.time}`) < new Date());
  app.innerHTML = `<section class="page"><div class="container">
    <div class="page-heading"><div><span class="eyebrow">My Bookings</span><h1>Your sessions</h1><p class="muted">Review, reschedule, or cancel your studio time.</p></div><button class="btn" data-route="book-studio"><i class="fa-solid fa-plus"></i>New Booking</button></div>
    <div class="tabs"><button class="tab active" data-booking-tab="upcoming">Upcoming <span>(${upcoming.length})</span></button><button class="tab" data-booking-tab="past">Past <span>(${past.length})</span></button></div>
    <div id="booking-list">${upcoming.length ? upcoming.map((b) => renderBookingCard(b)).join("") : `<div class="card card-body"><p class="muted">No upcoming bookings.</p></div>`}</div>
  </div></section>`;
}

async function renderOwnerDashboard() {
  const [{ bookings }, { rooms }] = await Promise.all([bookingsApi.list(), roomsApi.list()]);
  const today = new Date().toISOString().slice(0,10);
  const todayCount = bookings.filter((b) => b.date === today && b.status !== "cancelled").length;
  const pending = bookings.filter((b) => b.status === "pending").length;
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0,0,0,0);
  const revenue = bookings.filter((b) => b.status === "approved" && new Date(`${b.date}T${b.time}`) >= weekStart).reduce((sum,b)=>sum+Number(b.total||0),0);
  app.innerHTML = `<section class="page"><div class="container">
    <div class="page-heading"><div><span class="eyebrow">Owner Dashboard</span><h1>Good day, ${escapeHtml(currentUser.name)}</h1><p class="muted">Here’s what’s happening across your studios today.</p></div><button class="btn" data-route="manage-rooms"><i class="fa-solid fa-plus"></i>Add Room</button></div>
    <div class="grid">
      <div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-calendar-day"></i></div><div><p class="stat-value">${todayCount}</p><span class="muted">Today's bookings</span></div></div>
      <div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-clock"></i></div><div><p class="stat-value">${pending}</p><span class="muted">Pending approval</span></div></div>
      <div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-peso-sign"></i></div><div><p class="stat-value">${currency(revenue)}</p><span class="muted">Revenue this week</span></div></div>
    </div>
    <div class="page-heading" style="margin-top:var(--space-xl)"><div><h2>Recent bookings</h2><p class="muted">${rooms.length} studio room${rooms.length === 1 ? "" : "s"} configured.</p></div><button class="btn btn-secondary btn-small" data-route="manage-bookings">View all <i class="fa-solid fa-arrow-right"></i></button></div>
    ${bookings.slice().reverse().slice(0,8).map((b)=>renderBookingCard(b,false,true)).join("") || `<div class="card card-body"><p class="muted">No bookings yet.</p></div>`}
  </div></section>`;
}

async function renderManageBookings() {
  const { bookings } = await bookingsApi.list();
  app.innerHTML = `<section class="page"><div class="container">
    <div class="page-heading"><div><span class="eyebrow">Operations</span><h1>Manage Bookings</h1><p class="muted">Approve sessions, update details, and track payments.</p></div></div>
    <div class="card table-wrap"><table class="data-table"><thead><tr><th>Customer</th><th>Studio Room</th><th>Date & time</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${bookings.map((booking) => `<tr data-booking-id="${booking.id}"><td><strong>${escapeHtml(booking.customer)}</strong><br><span class="muted">#${booking.id}</span></td><td>${escapeHtml(booking.room)}</td><td>${formatDateTime(booking)}<br><span class="muted">${currency(booking.total)}</span></td><td>${escapeHtml(booking.payment)}</td><td>${renderStatusBadge(booking.status)}</td><td><div class="btn-row">${booking.status === "pending" ? '<button class="btn btn-small" data-action="approve-booking"><i class="fa-solid fa-check"></i>Approve</button>' : ""}${booking.status !== "cancelled" ? '<button class="btn btn-secondary btn-small" data-action="edit-owner-booking"><i class="fa-solid fa-pencil"></i>Edit</button><button class="btn btn-ghost btn-small" data-action="cancel-booking"><i class="fa-solid fa-ban"></i>Cancel</button>' : ""}</div></td></tr>`).join("")}
    </tbody></table></div>
  </div></section>`;
}

async function renderManageRooms() {
  const { rooms } = await roomsApi.list();
  const editing = editingRoomId ? rooms.find((r) => r.id === editingRoomId) : null;
  app.innerHTML = `<section class="page"><div class="container">
    <div class="page-heading"><div><span class="eyebrow">Studio setup</span><h1>Manage Rooms</h1><p class="muted">Keep your spaces and equipment up to date.</p></div></div>
    <div class="grid"><div class="span-5"><form class="card card-body sticky-panel" id="room-form" novalidate>
      <h2><i class="fa-solid ${editing ? "fa-pencil" : "fa-plus"}"></i> ${editing ? "Edit Room" : "Add Room"}</h2>
      <div class="form-group"><label for="room-name">Room name</label><input class="input" id="room-name" required value="${escapeHtml(editing?.name || "")}" placeholder="e.g. The Live Room" /></div>
      <div class="grid"><div class="span-6"><div class="form-group"><label for="price">Price per hour</label><input class="input" id="price" type="number" min="0" step="0.01" required value="${editing?.price ?? ""}" placeholder="₱25" /></div></div><div class="span-6"><div class="form-group"><label for="capacity">Capacity</label><input class="input" id="capacity" type="number" min="1" required value="${editing?.capacity ?? ""}" placeholder="4" /></div></div></div>
      <div class="form-group"><label for="equipment">Equipment</label><textarea class="textarea" id="equipment" required>${escapeHtml(editing?.equipment || "")}</textarea></div>
      <div class="form-group"><label for="photo">Room photo URL</label><input class="input" id="photo" value="${escapeHtml(editing?.image || "")}" placeholder="https://..." /></div>
      <div class="btn-row"><button class="btn" id="save-room" type="submit"><i class="fa-solid fa-floppy-disk"></i>${editing ? "Save Changes" : "Add Room"}</button>${editing ? '<button class="btn btn-secondary" type="button" data-action="cancel-room-edit">Cancel</button>' : ""}</div>
    </form></div><div class="span-7"><h2>Your rooms <span class="muted">(${rooms.length})</span></h2><div class="grid">${rooms.map((room) => `<div class="span-6">${renderRoomCard(room,false,true)}</div>`).join("")}</div></div></div>
  </div></section>`;
}

async function renderProfile() {
  const [{ user }, { bookings }] = await Promise.all([usersApi.profile(), bookingsApi.list()]);
  currentUser = user;
  app.innerHTML = `<section class="page"><div class="container">
    <div class="page-heading"><div><span class="eyebrow">Account</span><h1>Your profile</h1><p class="muted">Update your personal details and account settings.</p></div></div>
    <div class="grid"><aside class="span-4"><div class="card card-body"><div class="profile-avatar">${escapeHtml(user.name.split(/\s+/).map((x)=>x[0]).join("").slice(0,2).toUpperCase())}</div><h2>${escapeHtml(user.name)}</h2><p class="muted">${user.role === "owner" ? "Studio Owner" : "Drummer"} · Member since ${new Date(user.createdAt).getFullYear()}</p><div class="summary-line"><span>Bookings</span><strong>${bookings.length}</strong></div><div class="summary-line"><span>Status</span><span class="badge badge-confirmed"><i class="fa-solid fa-circle-check"></i>Active</span></div></div></aside>
    <div class="span-8"><form class="card card-body" id="profile-form"><h2>Edit profile</h2><div class="grid"><div class="span-6"><div class="form-group"><label for="profile-name">Full name</label><input class="input" id="profile-name" required value="${escapeHtml(user.name)}" /></div></div><div class="span-6"><div class="form-group"><label for="profile-email">Email address</label><input class="input" id="profile-email" type="email" required value="${escapeHtml(user.email)}" /></div></div></div><div class="form-group"><label for="profile-phone">Phone number</label><input class="input" id="profile-phone" value="${escapeHtml(user.phone || "")}" /></div><button class="btn" type="submit"><i class="fa-solid fa-floppy-disk"></i>Save Changes</button></form>
      <div class="danger-zone"><h2>Delete my account</h2><p>This removes your profile and cancels your active booking history. This action cannot be undone.</p><button class="btn btn-danger" data-action="delete-account"><i class="fa-solid fa-trash"></i>Delete my account</button></div>
    </div></div>
  </div></section>`;
}

async function logout() {
  try {
    await authApi.logout();
  } catch {
    // Even if the API is unreachable, clear the local authentication state.
  }
  localStorage.removeItem("beatbase_auth_token");
  currentUser = null;
  selectedBookingId = null;
  selectedRoomId = null;
  showToast("success", "You have been logged out.", "Signed out");
  await navigate("landing");
}

async function loadSession() {
  const result = await authApi.session();
  currentUser = result.authenticated ? result.user : null;
  return currentUser;
}

document.addEventListener("click", async (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    event.preventDefault();
    await navigate(routeButton.dataset.route);
    return;
  }

  const roleChoice = event.target.closest("[data-role-choice]");
  if (roleChoice) {
    document.querySelectorAll("[data-role-choice]").forEach((el) => el.classList.remove("active"));
    roleChoice.classList.add("active");
    return;
  }

  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;

  if (action === "logout") {
    confirmModal("Are you sure you want to log out?", logout, "Log out?");
    return;
  }

  if (action === "delete-account") {
    confirmModal("Are you sure you want to permanently delete your account?", () => deleteAccount(async () => {
      currentUser = null;
      await navigate("landing");
    }), "Delete account?");
    return;
  }

  if (action === "cancel-booking") {
    const card = event.target.closest("[data-booking-id]");
    const id = Number(card?.dataset.bookingId);
    if (id) confirmModal("Are you sure you want to cancel this booking?", () => deleteBooking(id, refreshCurrentRoute), "Cancel booking?");
    return;
  }

  if (action === "approve-booking") {
    const row = event.target.closest("[data-booking-id]");
    const id = Number(row?.dataset.bookingId);
    if (id) await updateBooking(id, { status: "approved" }, refreshCurrentRoute);
    return;
  }
  if (action === "edit-owner-booking") {
    const row = event.target.closest("[data-booking-id]");
    const id = Number(row?.dataset.bookingId);
    if (!id) return;
    try {
      const { bookings } = await bookingsApi.list();
      const booking = bookings.find((item) => Number(item.id) === id);
      if (!booking) return;
      const date = window.prompt("Booking date (YYYY-MM-DD):", booking.date);
      if (date === null) return;
      const time = window.prompt("Booking start time (HH:MM):", booking.time);
      if (time === null) return;
      const { rooms } = await roomsApi.list();
      const roomList = rooms.map((room) => `${room.id}: ${room.name}`).join("\n");
      const roomIdInput = window.prompt(`Room ID:\n${roomList}`, String(booking.roomId));
      if (roomIdInput === null) return;
      await updateBooking(id, {
        date: date.trim(),
        time: time.trim(),
        roomId: Number(roomIdInput),
        duration: Number(booking.duration || 1),
      }, refreshCurrentRoute);
    } catch (error) {
      showToast("error", error.message, "Booking edit failed");
    }
    return;
  }

  if (action === "delete-room") {
    const card = event.target.closest("[data-room-id]");
    const id = Number(card?.dataset.roomId);
    if (id) confirmModal("Are you sure you want to delete this room? This cannot be undone.", () => deleteRoom(id, refreshCurrentRoute), "Delete Studio Room?");
    return;
  }

  if (action === "edit-room") {
    editingRoomId = Number(event.target.closest("[data-room-id]")?.dataset.roomId);
    await renderManageRooms();
    renderNav();
    return;
  }

  if (action === "cancel-room-edit") {
    editingRoomId = null;
    await renderManageRooms();
    renderNav();
    return;
  }

  if (action === "select-room") {
    selectedRoomId = Number(event.target.closest("[data-room-id]")?.dataset.roomId);
    selectedBookingTime = "";
    await renderBookStudio();
    return;
  }

  if (action === "edit-booking") {
    const card = event.target.closest("[data-booking-id]");
    selectedBookingId = Number(card?.dataset.bookingId);
    await navigate("book-studio");
    return;
  }

  if (action === "confirm-booking") {
    const button = event.target.closest("#confirm-booking");
    if (!button || !selectedRoomId || !selectedBookingDate || !selectedBookingTime) return;
    if (selectedBookingId) {
      await updateBooking(selectedBookingId, { roomId: selectedRoomId, date: selectedBookingDate, time: selectedBookingTime, duration: 1 }, async () => {
        selectedBookingId = null;
        selectedBookingTime = "";
        await navigate("my-bookings");
      });
    } else {
      await createBooking(button, { roomId: selectedRoomId, date: selectedBookingDate, time: selectedBookingTime, duration: 1 }, async () => {
        selectedBookingTime = "";
        await navigate("my-bookings");
      });
    }
    return;
  }

  const timeSlot = event.target.closest(".time-slot:not(:disabled)");
  if (timeSlot) {
    selectedBookingTime = timeSlot.dataset.time;
    await updateBookingAvailability();
  }

  const bookingTab = event.target.closest("[data-booking-tab]");
  if (bookingTab) {
    document.querySelectorAll(".tab").forEach((el) => el.classList.remove("active"));
    bookingTab.classList.add("active");
    const { bookings } = await bookingsApi.list();
    const isPast = bookingTab.dataset.bookingTab === "past";
    const filtered = bookings.filter((b) => isPast
      ? (b.status === "cancelled" || new Date(`${b.date}T${b.time}`) < new Date())
      : (b.status !== "cancelled" && new Date(`${b.date}T${b.time}`) >= new Date()));
    document.querySelector("#booking-list").innerHTML = filtered.length
      ? filtered.map((b) => renderBookingCard(b)).join("")
      : `<div class="card card-body"><p class="muted">No ${isPast ? "past" : "upcoming"} bookings.</p></div>`;
  }
});

document.addEventListener("change", async (event) => {
  if (event.target.id === "booking-date") {
    selectedBookingDate = event.target.value;
    selectedBookingTime = "";
    await updateBookingAvailability();
  }
});

document.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (event.target.id === "auth-form") {
    await handleAuth(event.target, navigate);
    return;
  }

  if (event.target.id === "room-form") {
    if (!validateForm(event.target)) return;
    const button = event.target.querySelector("#save-room");
    const payload = {
      name: document.querySelector("#room-name").value.trim(),
      price: Number(document.querySelector("#price").value),
      capacity: Number(document.querySelector("#capacity").value),
      equipment: document.querySelector("#equipment").value.trim(),
      image: document.querySelector("#photo").value.trim(),
    };
    await saveRoom(button, payload, editingRoomId, async () => {
      editingRoomId = null;
      await navigate("manage-rooms");
    });
    return;
  }

  if (event.target.id === "profile-form") {
    await saveProfile({
      name: document.querySelector("#profile-name").value.trim(),
      email: document.querySelector("#profile-email").value.trim(),
      phone: document.querySelector("#profile-phone").value.trim(),
    }, async (user) => {
      currentUser = user;
      renderNav();
      await navigate("profile");
    });
  }
});

document.querySelector("#mobile-menu")?.addEventListener("click", (event) => {
  const nav = document.querySelector("#nav-links");
  nav.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(nav.classList.contains("open")));
});

async function init() {
  loadSharedComponents();
  try {
    await loadSession();
  } catch {
    currentUser = null;
  }
  await navigate(location.hash.slice(1) || (currentUser ? (currentUser.role === "owner" ? "owner-dashboard" : "drummer-home") : "landing"));
}

init();
