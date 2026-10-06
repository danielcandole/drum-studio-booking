export const images = {
  hero: "https://images.unsplash.com/photo-1637716340365-4564e51f7995?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
};

export const currency = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function renderStatusBadge(status) {
  const normalized = status === "approved" ? "confirmed" : status;
  const icons = { confirmed: "circle-check", pending: "clock", cancelled: "circle-xmark" };
  return `<span class="badge badge-${normalized}"><i class="fa-solid fa-${icons[normalized] || "circle-info"}"></i>${normalized[0].toUpperCase() + normalized.slice(1)}</span>`;
}

export function renderRoomCard(room, selectable = false, owner = false) {
  return `
    <article class="card room-card ${selectable && room.selected ? "selected" : ""}" data-room-id="${room.id}">
      <img class="card-image" src="${room.image || images.hero}" alt="${room.name} drum kit and studio setup" />
      <div class="card-body">
        <div class="page-heading"><div><h3>${room.name}</h3><span class="price">${currency(room.price)}/hour</span></div>${selectable && room.selected ? '<i class="fa-solid fa-circle-check" aria-label="Selected"></i>' : ""}</div>
        <div class="room-meta">
          <span><i class="fa-solid fa-users"></i> Up to ${room.capacity}</span>
          <span><i class="fa-solid fa-drum"></i> Full kit</span>
        </div>
        <p class="muted">${room.equipment || "Fully equipped studio"}</p>
        <div class="btn-row">
          ${owner
            ? `<button class="btn btn-secondary btn-small" data-action="edit-room"><i class="fa-solid fa-pencil"></i>Edit</button><button class="btn btn-ghost btn-small" data-action="delete-room"><i class="fa-solid fa-trash"></i>Delete</button>`
            : selectable
              ? `<button class="btn ${room.selected ? "" : "btn-secondary"} btn-small" data-action="select-room">${room.selected ? "Selected" : "Select room"}</button>`
              : `<button class="btn btn-secondary btn-small" data-route="book-studio"><i class="fa-solid fa-eye"></i>View room</button>`}
        </div>
      </div>
    </article>
  `;
}

export function renderBookingCard(booking, actions = true, owner = false) {
  return `
    <article class="card booking-card" data-booking-id="${booking.id}">
      <img src="${booking.image || images.hero}" alt="${booking.room}" />
      <div>
        <div class="btn-row"><h3>${booking.room}</h3>${renderStatusBadge(booking.status)}</div>
        <div class="booking-details">
          <span><i class="fa-solid fa-calendar"></i>${new Date(`${booking.date}T00:00:00`).toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric" })}</span>
          <span><i class="fa-solid fa-clock"></i>${booking.time}</span>
          <span><i class="fa-solid fa-receipt"></i>#${booking.id}</span>
          ${owner ? `<span><i class="fa-solid fa-user"></i>${booking.customer}</span>` : ""}
        </div>
      </div>
      ${actions ? `<div class="btn-row">${booking.status !== "cancelled" ? `<button class="btn btn-secondary btn-small" data-action="edit-booking"><i class="fa-solid fa-pencil"></i>Edit</button><button class="btn btn-ghost btn-small" data-action="cancel-booking"><i class="fa-solid fa-ban"></i>Cancel</button>` : ""}</div>` : ""}
    </article>
  `;
}
