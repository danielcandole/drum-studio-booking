export const peso = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function renderStatusBadge(status) {
  const icons = { confirmed: "circle-check", pending: "clock", cancelled: "circle-xmark" };
  const icon = icons[status] || "circle-info";
  const label = status ? status[0].toUpperCase() + status.slice(1) : "Unknown";
  return `<span class="badge badge-${status}"><i class="fa-solid fa-${icon}"></i>${label}</span>`;
}

export function renderRoomCard(room, selectable = false, owner = false, selectedId = 1) {
  return `
    <article class="card room-card ${selectable && room.id === selectedId ? "selected" : ""}" data-room-id="${room.id}">
      <img class="card-image" src="${room.image}" alt="${room.name} drum kit and studio setup" />
      <div class="card-body">
        <div class="page-heading"><div><h3>${room.name}</h3><span class="price">${peso(room.price)}/hour</span></div>${selectable && room.id === selectedId ? '<i class="fa-solid fa-circle-check" aria-label="Selected"></i>' : ""}</div>
        <div class="room-meta"><span><i class="fa-solid fa-users"></i> Up to ${room.capacity}</span><span><i class="fa-solid fa-drum"></i> Full kit</span></div>
        <p class="muted">${room.equipment}</p>
        <div class="btn-row">
          ${owner
            ? `<button class="btn btn-secondary btn-small" data-action="edit-room" data-room-id="${room.id}"><i class="fa-solid fa-pencil"></i>Edit</button><button class="btn btn-ghost btn-small" data-action="delete-room" data-room-id="${room.id}"><i class="fa-solid fa-trash"></i>Delete</button>`
            : selectable
              ? `<button class="btn ${room.id === selectedId ? "" : "btn-secondary"} btn-small" data-action="select-room" data-room-id="${room.id}">${room.id === selectedId ? "Selected" : "Select room"}</button>`
              : `<button class="btn btn-secondary btn-small" data-route="book-studio" data-room-id="${room.id}"><i class="fa-solid fa-eye"></i>View room</button>`}
        </div>
      </div>
    </article>`;
}

export function renderBookingCard(booking, actions = true) {
  return `<article class="card booking-card" data-booking-id="${booking.id}">
    <img src="${booking.image}" alt="${booking.room}" />
    <div><div class="btn-row"><h3>${booking.room}</h3>${renderStatusBadge(booking.status)}</div>
    <div class="booking-details"><span><i class="fa-solid fa-calendar"></i>${booking.date}</span><span><i class="fa-solid fa-clock"></i>${booking.time}</span><span><i class="fa-solid fa-receipt"></i>#${booking.id}</span></div>
    <div class="muted">${peso(booking.amount)} · ${booking.payment}</div></div>
    ${actions ? `<div class="btn-row"><button class="btn btn-secondary btn-small" data-action="edit-booking" data-booking-id="${booking.id}"><i class="fa-solid fa-pencil"></i>Edit</button><button class="btn btn-ghost btn-small" data-action="cancel-booking" data-booking-id="${booking.id}"><i class="fa-solid fa-ban"></i>Cancel</button></div>` : ""}
  </article>`;
}
