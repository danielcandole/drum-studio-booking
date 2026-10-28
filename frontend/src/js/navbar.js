
export function renderNav(currentUser, currentRoute) {
  const nav = document.querySelector("#nav-links");
  if (!nav) return;

  if (!currentUser) {
    nav.innerHTML = `
      <button class="nav-link ${currentRoute === "landing" ? "active" : ""}" data-route="landing">Home</button>
      <button class="nav-link ${currentRoute === "login" ? "active" : ""}" data-route="login">Login</button>
      <button class="nav-link ${currentRoute === "register" ? "active" : ""}" data-route="register">Register</button>
    `;
  } else {
    const links = currentUser.role === "owner"
      ? [
          ["owner-dashboard", "Home"],
          ["manage-bookings", "Manage Bookings"],
          ["manage-rooms", "Rooms"],
        ]
      : [
          ["drummer-home", "Home"],
          ["book-studio", "Book Studio"],
          ["my-bookings", "My Bookings"],
        ];

    nav.innerHTML = `
      ${links.map(([route, label]) => `
        <button
          class="nav-link ${currentRoute === route ? "active" : ""}"
          data-route="${route}"
        >${label}</button>
      `).join("")}
      <button class="nav-link" data-action="logout">Logout</button>
    `;
  }
}

export function initMobileNavbar() {
  const mobileMenu = document.querySelector("#mobile-menu");
  const nav = document.querySelector("#nav-links");

  if (!mobileMenu || !nav || mobileMenu.dataset.initialized === "true") {
    return;
  }

  mobileMenu.dataset.initialized = "true";

  mobileMenu.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");

    mobileMenu.setAttribute("aria-expanded", String(isOpen));
    mobileMenu.setAttribute(
      "aria-label",
      isOpen ? "Close menu" : "Open menu"
    );

    setMobileMenuIcon(mobileMenu, isOpen);
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest(".nav-link")) {
      closeMobileNavbar();
    }
  });
}

function setMobileMenuIcon(mobileMenu, isOpen) {
  const iconPath = isOpen
    ? "frontend/src/images/icons/close_icon.svg"
    : "frontend/src/images/icons/ham_icon.svg";

  mobileMenu.innerHTML = `
    <img src="${iconPath}" alt="" aria-hidden="true">
  `;
}

export function closeMobileNavbar() {
  const mobileMenu = document.querySelector("#mobile-menu");
  const nav = document.querySelector("#nav-links");

  nav?.classList.remove("open");

  if (mobileMenu) {
    mobileMenu.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-label", "Open menu");

    setMobileMenuIcon(mobileMenu, false);
  }
}
