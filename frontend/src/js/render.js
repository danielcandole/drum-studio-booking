export const images = {
  hero: "https://images.unsplash.com/photo-1637716340365-4564e51f7995?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  roomA: "https://images.unsplash.com/photo-1537054388073-cf990597af2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  roomB: "https://images.unsplash.com/photo-1568315618710-6210e787eef0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  roomC: "https://images.unsplash.com/photo-1731003163686-040d11411c18?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
};

export const rooms = [
  { id: 1, name: "The Live Room", price: 28, capacity: 4, equipment: "Pearl Export, Zildjian cymbals", image: images.roomA },
  { id: 2, name: "Studio B", price: 22, capacity: 3, equipment: "Tama Superstar, Sabian cymbals", image: images.roomB },
  { id: 3, name: "Practice Pod", price: 16, capacity: 2, equipment: "Yamaha Stage Custom, headphones", image: images.roomC },
];

export const bookings = [
  { id: 1024, customer: "Jamie Carter", room: "The Live Room", date: "18 Jun 2026", time: "4:00 PM – 5:00 PM", status: "confirmed", payment: "Paid", image: images.roomA },
  { id: 1025, customer: "Avery Singh", room: "Studio B", date: "18 Jun 2026", time: "6:00 PM – 7:00 PM", status: "pending", payment: "Pending", image: images.roomB },
  { id: 1026, customer: "Mia Roberts", room: "Practice Pod", date: "19 Jun 2026", time: "3:00 PM – 4:00 PM", status: "cancelled", payment: "Refunded", image: images.roomC },
];

export function renderStatusBadge(status) {
  const icons = { confirmed: "circle-check", pending: "clock", cancelled: "circle-xmark" };
  return `<span class="badge badge-${status}"><i class="fa-solid fa-${icons[status]}"></i>${status[0].toUpperCase() + status.slice(1)}</span>`;
}

export function renderRoomCard(room, selectable = false, owner = false) {
  return `
    <article class="card room-card ${selectable && room.id === 1 ? "selected" : ""}" data-room-id="${room.id}">
      <img class="card-image" src="${room.image}" alt="${room.name} drum kit and studio setup" />
      <div class="card-body">
        <div class="page-heading"><div><h3>${room.name}</h3><span class="price">$${room.price}/hour</span></div>${selectable && room.id === 1 ? '<i class="fa-solid fa-circle-check" aria-label="Selected"></i>' : ""}</div>
        <div class="room-meta">
          <span><i class="fa-solid fa-users"></i> Up to ${room.capacity}</span>
          <span><i class="fa-solid fa-drum"></i> Full kit</span>
        </div>
        <p class="muted">${room.equipment}</p>
        <div class="btn-row">
          ${owner
            ? `<button class="btn btn-secondary btn-small" data-action="edit-room"><i class="fa-solid fa-pencil"></i>Edit</button><button class="btn btn-ghost btn-small" data-action="delete-room"><i class="fa-solid fa-trash"></i>Delete</button>`
            : selectable
              ? `<button class="btn ${room.id === 1 ? "" : "btn-secondary"} btn-small" data-action="select-room">${room.id === 1 ? "Selected" : "Select room"}</button>`
              : `<button class="btn btn-secondary btn-small" data-route="book-studio"><i class="fa-solid fa-eye"></i>View room</button>`}
        </div>
      </div>
    </article>
  `;
}

export function renderBookingCard(booking, actions = true) {
  return `
    <article class="card booking-card">
      <img src="${booking.image}" alt="${booking.room}" />
      <div>
        <div class="btn-row"><h3>${booking.room}</h3>${renderStatusBadge(booking.status)}</div>
        <div class="booking-details">
          <span><i class="fa-solid fa-calendar"></i>${booking.date}</span>
          <span><i class="fa-solid fa-clock"></i>${booking.time}</span>
          <span><i class="fa-solid fa-receipt"></i>#${booking.id}</span>
        </div>
      </div>
      ${actions ? `<div class="btn-row"><button class="btn btn-secondary btn-small" data-action="edit-booking"><i class="fa-solid fa-pencil"></i>Edit</button><button class="btn btn-ghost btn-small" data-action="cancel-booking"><i class="fa-solid fa-ban"></i>Cancel</button></div>` : ""}
    </article>
  `;
}
