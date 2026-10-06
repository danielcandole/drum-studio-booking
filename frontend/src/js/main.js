import { setModalTemplate, confirmModal } from "./modal.js";
import { showToast } from "./toast.js";
import { validateForm } from "./validator.js";
import { handleAuth } from "./auth.js";
import { createBooking, deleteBooking, updateBooking } from "./bookings.js";
import { saveRoom, deleteRoom } from "./rooms.js";
import { saveProfile, deleteAccount } from "./users.js";
import { rooms, bookings, renderRoomCard, renderBookingCard, renderStatusBadge } from "./render.js";
import navbarTemplate from "../components/navbar.html?raw";
import footerTemplate from "../components/footer.html?raw";
import modalTemplate from "../components/modal.html?raw";

const app = document.querySelector("#app");
let role = "drummer";
let currentRoute = "landing";

function loadSharedComponents() {
  document.querySelector("#navbar-root").innerHTML = navbarTemplate;
  document.querySelector("#footer-root").innerHTML = footerTemplate;
  setModalTemplate(modalTemplate);
}

loadSharedComponents();

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

function renderNav() {
  const links = role === "owner"
    ? [["owner-dashboard", "Dashboard"], ["manage-bookings", "Manage Bookings"], ["manage-rooms", "Rooms"], ["profile", "Profile"]]
    : [["drummer-home", "Home"], ["book-studio", "Book Studio"], ["my-bookings", "My Bookings"], ["profile", "Profile"]];
  const isPublic = ["landing", "login", "register"].includes(currentRoute);
  const nav = document.querySelector("#nav-links");
  nav.innerHTML = isPublic
    ? `<button class="nav-link" data-route="landing">Home</button><button class="nav-link" data-route="login">Login</button><button class="btn btn-small" data-route="register">Register</button>`
    : `${links.map(([route, label]) => `<button class="nav-link ${currentRoute === route ? "active" : ""}" data-route="${route}">${label}</button>`).join("")}
      <div class="role-switcher"><label for="role-view" class="sr-only">Preview role</label><select id="role-view"><option value="drummer" ${role === "drummer" ? "selected" : ""}>Drummer view</option><option value="owner" ${role === "owner" ? "selected" : ""}>Owner view</option></select></div>`;
}

function navigate(route) {
  currentRoute = routes[route] ? route : "landing";
  routes[currentRoute]();
  renderNav();
  window.history.replaceState({}, "", `#${currentRoute}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderLanding() {
  app.innerHTML = `
    <section class="hero">
      <div class="container hero-content">
        <span class="eyebrow">Your next great session starts here</span>
        <h1>Practice loud. Book simple.</h1>
        <p>Find a fully equipped drum studio, choose a time, and get behind the kit in a few clicks.</p>
        <div class="btn-row"><button class="btn" data-route="register">Start booking <i class="fa-solid fa-arrow-right"></i></button><button class="btn btn-secondary" data-route="login">Login</button></div>
        <div class="hero-proof"><span><i class="fa-solid fa-circle-check"></i>Instant availability</span><span><i class="fa-solid fa-shield-halved"></i>Secure booking</span><span><i class="fa-solid fa-headphones"></i>Quality gear</span></div>
      </div>
    </section>
    <section class="section"><div class="container">
      <div class="section-heading"><span class="eyebrow">Featured spaces</span><h2>Rooms built for your best playing</h2><p class="muted">Acoustically treated, fully equipped, and ready when you are.</p></div>
      <div class="grid">${rooms.map((room) => `<div class="span-4">${renderRoomCard(room)}</div>`).join("")}</div>
    </div></section>
    <section class="section feature-strip"><div class="container">
      <div class="section-heading center"><span class="eyebrow">How it works</span><h2>From browsing to playing in three steps</h2></div>
      <div class="grid steps">
        <div class="span-4 step"><h3>Choose your room</h3><p>Compare gear, capacity, and hourly prices.</p></div>
        <div class="span-4 step"><h3>Pick a time</h3><p>See live availability and select your session.</p></div>
        <div class="span-4 step"><h3>Start playing</h3><p>Get confirmed and arrive ready to make noise.</p></div>
      </div>
    </div></section>`;
}

function renderAuth(type) {
  const register = type === "register";
  app.innerHTML = `
    <section class="auth-page">
      <div class="auth-visual"><blockquote>“A smooth booking flow means more time where it matters: behind the kit.”</blockquote></div>
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

function renderDrummerHome() {
  app.innerHTML = `<section class="page"><div class="container">
    <div class="welcome-banner"><span class="eyebrow">Tuesday, 16 June</span><h1>Ready to make some noise, Jamie?</h1><p>Your next session is confirmed for Thursday.</p><button class="btn" data-route="book-studio"><i class="fa-solid fa-plus"></i>Book a Studio</button></div>
    <div class="section-heading" style="margin-top: var(--space-xl)"><h2>Up next</h2><p class="muted">Everything you need for your upcoming session.</p></div>
    ${renderBookingCard(bookings[0])}
    <div class="grid" style="margin-top: var(--space-xl)">
      <div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-clock-rotate-left"></i></div><div><p class="stat-value">12</p><span class="muted">Sessions completed</span></div></div>
      <div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-drum"></i></div><div><p class="stat-value">18h</p><span class="muted">Practice time</span></div></div>
      <div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-star"></i></div><div><p class="stat-value">3</p><span class="muted">Favorite rooms</span></div></div>
    </div>
  </div></section>`;
}

function renderBookStudio() {
  app.innerHTML = `<section class="page"><div class="container">
    <div class="page-heading"><div><span class="eyebrow">Book a studio</span><h1>Find your perfect session</h1><p class="muted">Choose a room, date, and available time.</p></div><span class="badge badge-confirmed"><i class="fa-solid fa-circle-check"></i>Live availability</span></div>
    <div class="grid booking-layout"><div class="span-8">
      <h2>1. Choose a Studio Room</h2><div class="grid">${rooms.map((room) => `<div class="span-6">${renderRoomCard(room, true)}</div>`).join("")}</div>
      <h2 style="margin-top: var(--space-xl)">2. Choose a date</h2><div class="card card-body"><div class="form-group"><label for="booking-date">Date</label><input class="input" id="booking-date" type="date" value="2026-06-18" /></div></div>
      <h2 style="margin-top: var(--space-xl)">3. Pick a time</h2><div class="card card-body"><div class="time-slots">${["10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"].map((time, index) => `<button class="time-slot ${index === 5 ? "selected" : ""}" ${index === 2 || index === 6 ? "disabled" : ""}>${time}${index === 2 || index === 6 ? "<br><small>Booked</small>" : ""}</button>`).join("")}</div></div>
    </div>
    <aside class="span-4 sticky-panel"><div class="card card-body"><span class="eyebrow">Booking summary</span><h2>The Live Room</h2><div class="summary-line"><span>Date</span><strong>18 Jun 2026</strong></div><div class="summary-line"><span>Time</span><strong>4:00 PM</strong></div><div class="summary-line"><span>Duration</span><strong>1 hour</strong></div><div class="summary-line summary-total"><span>Total</span><span>$28.00</span></div><button class="btn" id="confirm-booking" style="width: 100%; margin-top: var(--space-lg)"><i class="fa-solid fa-calendar-check"></i>Confirm Booking</button><p class="muted" style="font-size: var(--font-size-caption); margin-top: var(--space-md)"><i class="fa-solid fa-shield-halved"></i> You can reschedule up to 24 hours before.</p></div></aside>
    </div>
  </div></section>`;
}

function renderMyBookings() {
  app.innerHTML = `<section class="page"><div class="container">
    <div class="page-heading"><div><span class="eyebrow">My Bookings</span><h1>Your sessions</h1><p class="muted">Review, reschedule, or cancel your studio time.</p></div><button class="btn" data-route="book-studio"><i class="fa-solid fa-plus"></i>New Booking</button></div>
    <div class="tabs"><button class="tab active" data-booking-tab="upcoming">Upcoming <span>(2)</span></button><button class="tab" data-booking-tab="past">Past</button></div>
    <div id="booking-list">${bookings.slice(0, 2).map((booking) => renderBookingCard(booking)).join("")}</div>
  </div></section>`;
}

function renderOwnerDashboard() {
  app.innerHTML = `<section class="page"><div class="container">
    <div class="page-heading"><div><span class="eyebrow">Owner Dashboard</span><h1>Good morning, Alex</h1><p class="muted">Here’s what’s happening across your studios today.</p></div><button class="btn" data-route="manage-rooms"><i class="fa-solid fa-plus"></i>Add Room</button></div>
    <div class="grid">
      <div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-calendar-day"></i></div><div><p class="stat-value">8</p><span class="muted">Today's bookings</span></div></div>
      <div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-clock"></i></div><div><p class="stat-value">3</p><span class="muted">Pending approval</span></div></div>
      <div class="span-4 card stat-card"><div class="stat-icon"><i class="fa-solid fa-dollar-sign"></i></div><div><p class="stat-value">$486</p><span class="muted">Revenue this week</span></div></div>
    </div>
    <div class="page-heading" style="margin-top: var(--space-xl)"><div><h2>Recent bookings</h2><p class="muted">Latest activity across all studio rooms.</p></div><button class="btn btn-secondary btn-small" data-route="manage-bookings">View all <i class="fa-solid fa-arrow-right"></i></button></div>
    ${bookings.map((booking) => renderBookingCard(booking, false)).join("")}
  </div></section>`;
}

function renderManageBookings() {
  app.innerHTML = `<section class="page"><div class="container">
    <div class="page-heading"><div><span class="eyebrow">Operations</span><h1>Manage Bookings</h1><p class="muted">Approve sessions, update details, and track payments.</p></div><div class="btn-row"><button class="btn btn-secondary"><i class="fa-solid fa-filter"></i>Filter</button><button class="btn"><i class="fa-solid fa-download"></i>Export</button></div></div>
    <div class="card table-wrap"><table class="data-table"><thead><tr><th>Customer</th><th>Studio Room</th><th>Date & time</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${bookings.map((booking) => `<tr><td><strong>${booking.customer}</strong><br><span class="muted">#${booking.id}</span></td><td>${booking.room}</td><td>${booking.date}<br><span class="muted">${booking.time}</span></td><td>${booking.payment}</td><td>${renderStatusBadge(booking.status)}</td><td><div class="btn-row">${booking.status === "pending" ? '<button class="btn btn-small" data-action="approve-booking"><i class="fa-solid fa-check"></i>Approve</button>' : ""}<button class="btn btn-secondary btn-small" data-action="edit-booking"><i class="fa-solid fa-pencil"></i>Update</button><button class="btn btn-ghost btn-small" data-action="cancel-booking"><i class="fa-solid fa-ban"></i>Cancel</button></div></td></tr>`).join("")}
    </tbody></table></div>
  </div></section>`;
}

function renderManageRooms() {
  app.innerHTML = `<section class="page"><div class="container">
    <div class="page-heading"><div><span class="eyebrow">Studio setup</span><h1>Manage Rooms</h1><p class="muted">Keep your spaces and equipment up to date.</p></div></div>
    <div class="grid"><div class="span-5"><form class="card card-body sticky-panel" id="room-form" novalidate><h2><i class="fa-solid fa-plus"></i> Add Room</h2>
      <div class="form-group"><label for="room-name">Room name</label><input class="input" id="room-name" required data-error="Please enter a room name." placeholder="e.g. The Live Room" /></div>
      <div class="grid"><div class="span-6"><div class="form-group"><label for="price">Price per hour</label><input class="input" id="price" type="number" required placeholder="$25" /></div></div><div class="span-6"><div class="form-group"><label for="capacity">Capacity</label><input class="input" id="capacity" type="number" required placeholder="4" /></div></div></div>
      <div class="form-group"><label for="equipment">Equipment</label><textarea class="textarea" id="equipment" required placeholder="List the kit, cymbals, and extras"></textarea></div>
      <div class="form-group"><label for="photo">Room photo</label><input class="input" id="photo" type="file" accept="image/*" /></div>
      <button class="btn" id="save-room" type="submit"><i class="fa-solid fa-plus"></i>Add Room</button>
    </form></div><div class="span-7"><h2>Your rooms <span class="muted">(3)</span></h2><div class="grid">${rooms.map((room) => `<div class="span-6">${renderRoomCard(room, false, true)}</div>`).join("")}</div></div></div>
  </div></section>`;
}

function renderProfile() {
  const owner = role === "owner";
  app.innerHTML = `<section class="page"><div class="container">
    <div class="page-heading"><div><span class="eyebrow">Account</span><h1>Your profile</h1><p class="muted">Update your personal details and account settings.</p></div></div>
    <div class="grid"><aside class="span-4"><div class="card card-body"><div class="profile-avatar">${owner ? "AS" : "JC"}</div><h2>${owner ? "Alex Stone" : "Jamie Carter"}</h2><p class="muted">${owner ? "Studio Owner" : "Drummer"} · Member since 2025</p><div class="summary-line"><span>Bookings</span><strong>${owner ? "184" : "12"}</strong></div><div class="summary-line"><span>Status</span><span class="badge badge-confirmed"><i class="fa-solid fa-circle-check"></i>Active</span></div></div></aside>
    <div class="span-8"><form class="card card-body" id="profile-form"><h2>Edit profile</h2><div class="grid"><div class="span-6"><div class="form-group"><label for="profile-name">Full name</label><input class="input" id="profile-name" value="${owner ? "Alex Stone" : "Jamie Carter"}" /></div></div><div class="span-6"><div class="form-group"><label for="profile-email">Email address</label><input class="input" id="profile-email" type="email" value="${owner ? "alex@beatbase.test" : "jamie@example.com"}" /></div></div></div><div class="form-group"><label for="profile-phone">Phone number</label><input class="input" id="profile-phone" value="+1 (555) 013-2849" /></div><button class="btn" type="submit"><i class="fa-solid fa-floppy-disk"></i>Save Changes</button></form>
      <div class="danger-zone"><h2>Delete my account</h2><p>This permanently removes your profile and booking history. This action cannot be undone.</p><button class="btn btn-danger" data-action="delete-account"><i class="fa-solid fa-trash"></i>Delete my account</button></div>
    </div></div>
  </div></section>`;
}

document.addEventListener("click", (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    event.preventDefault();
    navigate(routeButton.dataset.route);
    return;
  }

  const roleChoice = event.target.closest("[data-role-choice]");
  if (roleChoice) {
    document.querySelectorAll("[data-role-choice]").forEach((el) => el.classList.remove("active"));
    roleChoice.classList.add("active");
    role = roleChoice.dataset.roleChoice;
  }

  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "cancel-booking") confirmModal("Are you sure you want to cancel this booking?", deleteBooking, "Cancel booking?");
  if (action === "delete-room") confirmModal("Are you sure you want to delete this room? This cannot be undone.", deleteRoom, "Delete Studio Room?");
  if (action === "delete-account") confirmModal("Are you sure you want to delete your account?", deleteAccount, "Delete account?");
  if (action === "edit-booking") updateBooking();
  if (action === "edit-room") {
    document.querySelector("#room-name").value = "The Live Room";
    document.querySelector("#price").value = "28";
    document.querySelector("#capacity").value = "4";
    document.querySelector("#equipment").value = "Pearl Export, Zildjian cymbals";
    document.querySelector("#room-form h2").innerHTML = '<i class="fa-solid fa-pencil"></i> Edit Room';
    document.querySelector("#save-room").innerHTML = '<i class="fa-solid fa-floppy-disk"></i>Save Changes';
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (action === "approve-booking") showToast("success", "Booking approved successfully!", "Booking confirmed");

  const timeSlot = event.target.closest(".time-slot:not(:disabled)");
  if (timeSlot) {
    document.querySelectorAll(".time-slot").forEach((el) => el.classList.remove("selected"));
    timeSlot.classList.add("selected");
  }

  const roomCard = event.target.closest("[data-action='select-room']");
  if (roomCard) {
    document.querySelectorAll(".room-card").forEach((el) => el.classList.remove("selected"));
    roomCard.closest(".room-card").classList.add("selected");
  }

  const bookingTab = event.target.closest("[data-booking-tab]");
  if (bookingTab) {
    document.querySelectorAll(".tab").forEach((el) => el.classList.remove("active"));
    bookingTab.classList.add("active");
    document.querySelector("#booking-list").innerHTML = bookingTab.dataset.bookingTab === "past"
      ? renderBookingCard({ ...bookings[2], status: "confirmed", date: "4 May 2026" }, false)
      : bookings.slice(0, 2).map((booking) => renderBookingCard(booking)).join("");
  }
});

document.addEventListener("submit", (event) => {
  event.preventDefault();
  if (event.target.id === "auth-form") handleAuth(event.target, navigate);
  if (event.target.id === "room-form" && validateForm(event.target)) saveRoom(event.target.querySelector("#save-room"));
  if (event.target.id === "profile-form") saveProfile();
});

document.addEventListener("change", (event) => {
  if (event.target.id === "role-view") {
    role = event.target.value;
    navigate(role === "owner" ? "owner-dashboard" : "drummer-home");
  }
});

document.querySelector("#mobile-menu").addEventListener("click", (event) => {
  const nav = document.querySelector("#nav-links");
  nav.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(nav.classList.contains("open")));
});

document.addEventListener("click", (event) => {
  if (event.target.closest("#confirm-booking")) createBooking(event.target.closest("#confirm-booking"));
});

navigate(location.hash.slice(1) || "landing");
