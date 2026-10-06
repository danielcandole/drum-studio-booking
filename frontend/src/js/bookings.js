import { showToast } from "./toast.js";
import { request } from "./api.js";

export const bookingsApi = {
  create: (payload) => request("/bookings", { method: "POST", body: JSON.stringify(payload) }),
  list: () => request("/bookings"),
  read: (id) => request(`/bookings/${id}`),
  update: (id, payload) => request(`/bookings/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id) => request(`/bookings/${id}`, { method: "DELETE" }),
};

export function createBooking(button) {
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span>Please wait...';
  setTimeout(() => {
    button.disabled = false;
    button.innerHTML = original;
    showToast("success", "Your studio has been successfully booked!", "Booking Successful!");
  }, 900);
}

export function updateBooking() {
  showToast("success", "Your booking has been updated.", "Changes saved");
}

export function deleteBooking() {
  showToast("success", "The booking has been cancelled.", "Booking cancelled");
}
