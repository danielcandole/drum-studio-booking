import { showToast } from "./toast.js";
import { request } from "./api.js";

export const bookingsApi = {
  create: (payload) => request("bookings", { method: "POST", body: JSON.stringify(payload) }),
  list: () => request("bookings"),
  update: (id, payload) => request(`bookings/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id) => request(`bookings/${id}`, { method: "DELETE" }),
};

export async function createBooking(button, payload, onDone) {
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span>Please wait...';
  try {
    await bookingsApi.create(payload);
    showToast("success", "Your studio has been successfully booked!", "Booking Successful!");
    onDone?.();
  } catch (error) {
    showToast("error", error.message, "Booking failed");
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

export async function updateBooking(id, payload, onDone) {
  try {
    await bookingsApi.update(id, payload);
    showToast("success", "Your booking has been updated.", "Changes saved");
    onDone?.();
  } catch (error) {
    showToast("error", error.message, "Update failed");
  }
}

export async function deleteBooking(id, onDone) {
  try {
    await bookingsApi.delete(id);
    showToast("success", "The booking has been cancelled.", "Booking cancelled");
    onDone?.();
  } catch (error) {
    showToast("error", error.message, "Cancellation failed");
  }
}
