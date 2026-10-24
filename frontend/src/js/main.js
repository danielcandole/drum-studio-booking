import {
  setModalTemplate,
  confirmModal
} from "./modal.js";
import {
  showToast
} from "./toast.js";
import {
  validateForm
} from "./validator.js";
import {
  authApi,
  handleAuth
} from "./auth.js";
import {
  bookingsApi,
  createBooking,
  updateBooking,
  deleteBooking
} from "./bookings.js";
import {
  roomsApi,
  saveRoom,
  deleteRoom
} from "./rooms.js";
import {
  usersApi,
  saveProfile,
  deleteAccount
} from "./users.js";
import {
  currency,
  renderRoomCard,
  renderBookingCard,
  renderStatusBadge
} from "./render.js";

const app = document.querySelector("#app");
let currentUser = null;
let currentRoute = "landing";
let editingRoomId = null;
let selectedRoomId = null;
let selectedBookingId = null;
let selectedBookingDate = "";
let selectedBookingTime = "";
let selectedBookingDuration = 1;
let isEditingBookingInitialized = false;

async function loadSharedComponents() {
  const [navbarTemplate, footerTemplate, modalTemplate] = await Promise.all([
    fetch("/frontend/src/components/navbar.html").then((response) => response.text()),
    fetch("/frontend/src/components/footer.html").then((response) => response.text()),
    fetch("/frontend/src/components/modal.html").then((response) => response.text()),
  ]);
  document.querySelector("#navbar-root").innerHTML = navbarTemplate;
  document.querySelector("#footer-root").innerHTML = footerTemplate;
  setModalTemplate(modalTemplate);
}

const routes = {
  landing: renderLanding,
  login: renderLogin,
  register: renderRegister,
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
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  } [char]));
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatDateTime(booking) {
  return `${formatDate(booking.date)} · ${booking.time}`;
}


function sortBookingsNewestFirst(bookings) {
  return [...bookings].sort((a, b) =>
    `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)
  );
}


function renderNav() {
  const nav = document.querySelector("#nav-links");
  if (!nav) return;

  if (!currentUser) {
    nav.innerHTML = `
      <button class="nav-link ${currentRoute === "landing" ? "active" : ""}" data-route="landing">Home</button>
      <button class="nav-link ${currentRoute === "login" ? "active" : ""}" data-route="login">Login</button>
      <button class="nav-link ${currentRoute === "register" ? "active" : ""}" data-route="register">Register</button>
    `;
    return;
  }

  const links = currentUser.role === "owner" ? [
    ["owner-dashboard", "Home"],
    ["manage-bookings", "Manage Bookings"],
    ["manage-rooms", "Rooms"],
    //["profile", "Profile"],
  ] : [
    ["drummer-home", "Home"],
    ["book-studio", "Book Studio"],
    ["my-bookings", "My Bookings"],
    //["profile", "Profile"],
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
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function refreshCurrentRoute() {
  await navigate(currentRoute);
}

async function loadPage(name) {
  const response = await fetch(`/frontend/pages/${name}.html`);
  if (!response.ok) throw new Error(`Could not load page: ${name}`);
  const documentText = await response.text();
  const pageDocument = new DOMParser().parseFromString(documentText, "text/html");
  app.replaceChildren(...Array.from(pageDocument.body.childNodes));
}

async function renderLanding() {
  await loadPage("landing");
  try {
    const {
      rooms
    } = await roomsApi.list();
    document.querySelector("#featured-rooms").innerHTML = rooms.length ?
      rooms.map((room) => `<div class="span-4">${renderRoomCard(room)}</div>`).join("") :
      `<div class="card card-body"><p class="muted">No studio rooms are available yet.</p></div>`;
  } catch (error) {
    document.querySelector("#featured-rooms").innerHTML = `<div class="card card-body"><p class="muted">${escapeHtml(error.message)}</p></div>`;
  }
}

async function renderLogin() {
  await loadPage("login");
}

async function renderRegister() {
  await loadPage("register");
}

async function renderDrummerHome() {
  const [{
    bookings
  }, {
    rooms
  }] = await Promise.all([bookingsApi.list(), roomsApi.list()]);
  await loadPage("drummer-home");
  const upcoming = bookings.filter((b) => b.status !== "cancelled" && new Date(`${b.date}T${b.time}`) >= new Date()).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const completed = bookings.filter((b) => b.status === "approved" && new Date(`${b.date}T${b.time}`) < new Date());
  const practiceHours = bookings.filter((b) => b.status !== "cancelled").reduce((sum, b) => sum + Number(b.duration || 1), 0);
  const roomCounts = {};
  bookings.forEach((b) => {
    roomCounts[b.roomId] = (roomCounts[b.roomId] || 0) + 1;
  });
  const favoriteRoomId = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const favoriteRoom = rooms.find((r) => String(r.id) === String(favoriteRoomId));
  const next = upcoming[0];
  document.querySelector("#next-session-eyebrow").textContent = next ? `Next session · ${formatDate(next.date)}` : "Your studio";
  document.querySelector("#welcome-title").textContent = `Ready to make some noise, ${currentUser.name}?`;
  document.querySelector("#welcome-description").textContent = next ? `Your next session is ${next.time} at ${next.room}.` : "You have no upcoming sessions yet.";
  document.querySelector("#next-booking").innerHTML = next ? renderBookingCard(next) : `<div class="card card-body"><p class="muted">No upcoming bookings.</p></div>`;
  //document.querySelector("#completed-count").textContent = completed.length;
  //document.querySelector("#practice-hours").textContent = `${practiceHours}h`;
  //document.querySelector("#favorite-room").textContent = favoriteRoom ? favoriteRoom.name : "—";
}


async function renderBookStudio() {
  const { rooms } = await roomsApi.list();

  if (selectedBookingId && !isEditingBookingInitialized) {
    const { bookings } = await bookingsApi.list();
    const editing = bookings.find(
      (b) => Number(b.id) === Number(selectedBookingId)
    );

    if (!editing) {
      selectedBookingId = null;
      isEditingBookingInitialized = false;
      showToast("error", "The booking could not be found.", "Edit failed");
      await navigate("my-bookings");
      return;
    }

    selectedRoomId = Number(editing.roomId);
    selectedBookingDate = editing.date;
    selectedBookingTime = editing.time;
    selectedBookingDuration = Number(editing.duration) || 1;
    isEditingBookingInitialized = true;
  }

  if (!selectedRoomId || !rooms.some((r) => Number(r.id) === selectedRoomId)) {
    selectedRoomId = rooms.length ? Number(rooms[0].id) : null;
  }

  if (!selectedBookingDate) {
    const now = new Date();
    selectedBookingDate = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    ).toISOString().slice(0, 10);
  }

  await loadPage("book-studio");

  document.querySelector("#studio-rooms").innerHTML = rooms
    .map((room) =>
      `<div class="span-6">${renderRoomCard({
        ...room,
        selected: Number(room.id) === selectedRoomId
      }, true)}</div>`
    )
    .join("");

  document.querySelector("#booking-date").min =
    new Date().toISOString().slice(0, 10);
  document.querySelector("#booking-date").value = selectedBookingDate;

  document.querySelectorAll(".duration-option").forEach((button) => {
    button.classList.toggle(
      "selected",
      Number(button.dataset.duration) === selectedBookingDuration
    );
  });

  await updateBookingAvailability();
}


async function updateBookingAvailability() {
  const room = (await roomsApi.list()).rooms.find((r) => r.id === selectedRoomId);
  if (!room) return;
  const response = await fetch(`/api/bookings/availability?roomId=${room.id}&date=${encodeURIComponent(selectedBookingDate)}`, {
    headers: (() => {
      const token = localStorage.getItem("beatbase_auth_token");
      return token ? {
        Authorization: `Bearer ${token}`
      } : {};
    })()
  });
  const availability = await response.json();
  const booked = new Set(availability.bookedTimes || []);
  const times = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
  const labels = {
    "10:00": "10:00 AM",
    "11:00": "11:00 AM",
    "12:00": "12:00 PM",
    "14:00": "2:00 PM",
    "15:00": "3:00 PM",
    "16:00": "4:00 PM",
    "17:00": "5:00 PM",
    "18:00": "6:00 PM"
  };
  if (!selectedBookingTime || booked.has(selectedBookingTime)) selectedBookingTime = times.find((t) => !booked.has(t)) || "";
  document.querySelector("#time-slots").innerHTML = times.map((time) => {
    const unavailable = booked.has(time);
    return `<button class="time-slot ${selectedBookingTime === time ? "selected" : ""}" data-time="${time}" ${unavailable ? "disabled" : ""}>${labels[time]}${unavailable ? "<br><small>Booked</small>" : ""}</button>`;
  }).join("") || `<p class="muted">No times available.</p>`;



  document.querySelector("#booking-summary").innerHTML = `
    <span class="eyebrow">Booking summary</span>
    <h2>${escapeHtml(room.name)}</h2>
    <div class="summary-line"><span>Date</span><strong>${formatDate(selectedBookingDate)}</strong></div>
    <div class="summary-line"><span>Time</span><strong>${selectedBookingTime ? labels[selectedBookingTime] : "Choose a time"}</strong></div>
    <div class="summary-line"><span>Duration</span><strong>${selectedBookingDuration} ${selectedBookingDuration === 1 ? "hour" : "hours"}</strong></div>
    <div class="summary-line summary-total"><span>Total</span><span>${currency(room.price * selectedBookingDuration)}</span></div>
    <button class="btn" id="confirm-booking" data-action="confirm-booking" style="width:100%;margin-top:var(--space-lg)" ${selectedBookingTime ? "" : "disabled"}><i class="fa-solid fa-calendar-check"></i>${selectedBookingId ? "Save Changes" : "Confirm Booking"}</button>
    `; //<p class="muted" style="font-size:var(--font-size-caption);margin-top:var(--space-md)"><i class="fa-solid fa-shield-halved"></i> Availability is calculated from stored bookings.</p>
}


async function renderMyBookings() {
  const { bookings } = await bookingsApi.list();
  const now = new Date();

  const upcoming = sortBookingsNewestFirst(
    bookings.filter((b) =>
      b.status !== "cancelled" &&
      new Date(`${b.date}T${b.time}`) >= now
    )
  );

  const past = sortBookingsNewestFirst(
    bookings.filter((b) =>
      b.status === "cancelled" ||
      new Date(`${b.date}T${b.time}`) < now
    )
  );

  await loadPage("my-bookings");

  document.querySelector("#upcoming-count").textContent = `(${upcoming.length})`;
  document.querySelector("#past-count").textContent = `(${past.length})`;

  document.querySelector("#booking-list").innerHTML = upcoming.length
    ? upcoming.map((b) => renderBookingCard(b)).join("")
    : `<div class="card card-body"><p class="muted">No upcoming bookings.</p></div>`;
}



async function renderOwnerDashboard() {
  const [{ bookings }, { rooms }] = await Promise.all([
    bookingsApi.list(),
    roomsApi.list()
  ]);

  await loadPage("owner-dashboard");

  document.querySelector("#owner-greeting").textContent = `Good day, ${currentUser.name}`;
  document.querySelector("#room-count").textContent = rooms.length;

  const bookingList = document.querySelector("#recent-bookings");
  const filterButtons = document.querySelectorAll("[data-owner-booking-filter]");

  function renderFilteredBookings(filter = "all") {
    const filteredBookings = sortBookingsNewestFirst(
      filter === "all"
        ? bookings
        : bookings.filter((booking) => booking.status === filter)
    );

    bookingList.innerHTML = filteredBookings.length
      ? filteredBookings.map((booking) => renderBookingCard(booking, false, true)).join("")
      : `<div class="card card-body"><p class="muted">No ${filter === "all" ? "" : `${filter} `}bookings found.</p></div>`;
  }

  filterButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.ownerBookingFilter === "all");
  });

  renderFilteredBookings();

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((tab) => {
        tab.classList.toggle("active", tab === button);
      });

      renderFilteredBookings(button.dataset.ownerBookingFilter);
    });
  });
}

//document.querySelector("#today-count").textContent = todayCount;
//document.querySelector("#pending-count").textContent = pending;
//document.querySelector("#weekly-revenue").textContent = currency(revenue);

async function renderManageBookings() {
  const {
    bookings
  } = await bookingsApi.list();
  await loadPage("manage-bookings");
  document.querySelector("#manage-bookings-list").innerHTML = bookings.map((booking) => `<tr data-booking-id="${booking.id}"><td><strong>${escapeHtml(booking.customer)}</strong><br><span class="muted">#${booking.id}</span></td><td>${escapeHtml(booking.room)}</td><td>${formatDateTime(booking)}<br><span class="muted">${currency(booking.total)}</span></td><td>${escapeHtml(booking.payment)}</td><td>${renderStatusBadge(booking.status)}</td><td><div class="btn-row">${booking.status === "pending" ? '<button class="btn btn-small" data-action="approve-booking"><i class="fa-solid fa-check"></i>Approve</button>' : ""}${booking.status !== "cancelled" ? '<button class="btn btn-secondary btn-small" data-action="edit-owner-booking"><i class="fa-solid fa-pencil"></i>Edit</button><button class="btn btn-ghost btn-small" data-action="cancel-booking"><i class="fa-solid fa-ban"></i>Cancel</button>' : ""}</div></td></tr>`).join("");
}

async function renderManageRooms() {
  const {
    rooms
  } = await roomsApi.list();
  const editing = editingRoomId ? rooms.find((r) => r.id === editingRoomId) : null;
  await loadPage("manage-rooms");
  document.querySelector("#rooms-count").textContent = rooms.length;
  document.querySelector("#managed-rooms").innerHTML = rooms.map((room) => `<div class="span-6">${renderRoomCard(room, false, true)}</div>`).join("");
  if (editing) {
    document.querySelector("#room-form-heading").innerHTML = '<i class="fa-solid fa-pencil"></i> Edit Room';
    document.querySelector("#room-name").value = editing.name || "";
    document.querySelector("#price").value = editing.price ?? "";
    document.querySelector("#capacity").value = editing.capacity ?? "";
    document.querySelector("#equipment").value = editing.equipment || "";
    document.querySelector("#photo").value = editing.image || "";
    document.querySelector("#save-room").innerHTML = '<i class="fa-solid fa-floppy-disk"></i>Save Changes';
    document.querySelector("#cancel-room-edit").hidden = false;
  }
}

async function renderProfile() {
  const [{
    user
  }, {
    bookings
  }] = await Promise.all([usersApi.profile(), bookingsApi.list()]);
  currentUser = user;
  await loadPage("profile");
  document.querySelector("#profile-avatar").textContent = user.name.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase();
  document.querySelector("#profile-display-name").textContent = user.name;
  document.querySelector("#profile-member-info").textContent = `${user.role === "owner" ? "Studio Owner" : "Drummer"} · Member since ${new Date(user.createdAt).getFullYear()}`;
  document.querySelector("#profile-booking-count").textContent = bookings.length;
  document.querySelector("#profile-name").value = user.name;
  document.querySelector("#profile-email").value = user.email;
  document.querySelector("#profile-phone").value = user.phone || "";
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
  const mobileMenu = event.target.closest("#mobile-menu");
  if (mobileMenu) {
    const nav = document.querySelector("#nav-links");
    nav?.classList.toggle("open");
    mobileMenu.setAttribute("aria-expanded", String(nav?.classList.contains("open") || false));
    return;
  }

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

  const timeSlot = event.target.closest(".time-slot:not(:disabled)");

  if (timeSlot) {
    selectedBookingTime = timeSlot.dataset.time;
    await updateBookingAvailability();
  }

  const durationOption = event.target.closest(".duration-option:not(:disabled)");

  if (durationOption) {
    selectedBookingDuration = Number(durationOption.dataset.duration);

    document.querySelectorAll(".duration-option").forEach((button) => {
      button.classList.toggle("selected", button === durationOption);
    });

    await updateBookingAvailability();
    return;
  }

  const bookingTab = event.target.closest("[data-booking-tab]");

  if (bookingTab) {
    document.querySelectorAll("[data-booking-tab]").forEach((tab) => {
      tab.classList.toggle("active", tab === bookingTab);
    });

    const { bookings } = await bookingsApi.list();
    const now = new Date();
    const isPast = bookingTab.dataset.bookingTab === "past";

    const filtered = bookings
      .filter((b) => {
        const bookingDate = new Date(`${b.date}T${b.time}`);

        return isPast
          ? b.status === "cancelled" || bookingDate < now
          : b.status !== "cancelled" && bookingDate >= now;
      })
      .sort((a, b) =>
        `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
      );

    document.querySelector("#booking-list").innerHTML = filtered.length
      ? filtered.map((b) => renderBookingCard(b)).join("")
      : `<div class="card card-body"><p class="muted">No ${isPast ? "past" : "upcoming"} bookings.</p></div>`;

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
    if (id) await updateBooking(id, {
      status: "approved"
    }, refreshCurrentRoute);
    return;
  }

  if (action === "edit-owner-booking") {
    const row = event.target.closest("[data-booking-id]");
    const id = Number(row?.dataset.bookingId);

    if (!id) return;

    selectedBookingId = id;
    isEditingBookingInitialized = false;
    selectedRoomId = null;
    selectedBookingDate = "";
    selectedBookingTime = "";
    selectedBookingDuration = 1;

    await navigate("book-studio");
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
    const id = Number(card?.dataset.bookingId);

    if (!id) return;

    selectedBookingId = id;
    isEditingBookingInitialized = false;
    selectedRoomId = null;
    selectedBookingDate = "";
    selectedBookingTime = "";
    selectedBookingDuration = 1;

    await navigate("book-studio");
    return;
  }


  if (action === "confirm-booking") {
    const button = event.target.closest("#confirm-booking");

    if (!button || !selectedRoomId || !selectedBookingDate || !selectedBookingTime) return;

    if (selectedBookingId) {
      await updateBooking(selectedBookingId, {
        roomId: selectedRoomId,
        date: selectedBookingDate,
        time: selectedBookingTime,
        duration: selectedBookingDuration
      }, async () => {
        selectedBookingId = null;
        isEditingBookingInitialized = false;
        selectedBookingDate = "";
        selectedBookingTime = "";
        selectedBookingDuration = 1;
        selectedRoomId = null;

        await navigate("my-bookings");
      });
    } else {
      await createBooking(button, {
        roomId: selectedRoomId,
        date: selectedBookingDate,
        time: selectedBookingTime,
        duration: selectedBookingDuration
      }, async () => {
        selectedBookingDate = "";
        selectedBookingTime = "";
        selectedBookingDuration = 1;
        selectedRoomId = null;
        await navigate("my-bookings");
      });
    }

    return;
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

async function init() {
  await loadSharedComponents();
  try {
    await loadSession();
  } catch {
    currentUser = null;
  }
  await navigate(location.hash.slice(1) || (currentUser ? (currentUser.role === "owner" ? "owner-dashboard" : "drummer-home") : "landing"));
}

init();