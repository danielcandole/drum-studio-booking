import { showToast } from "./toast.js";
import { request } from "./api.js";

export const bookingsApi = {
  create: (payload) => request("/api/bookings", { method: "POST", body: JSON.stringify(payload) }),
  list: () => request("/api/bookings"),
  read: (id) => request(`/api/bookings/${id}`),
  update: (id, payload) => request(`/api/bookings/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id) => request(`/api/bookings/${id}`, { method: "DELETE" }),
};

export async function createBooking(button, payload, onSuccess) {
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span>Please wait...';
  try {
    await bookingsApi.create(payload);
    showToast("success", "Your studio has been successfully booked!", "Booking Successful!");
    await onSuccess?.();
  } catch (error) {
    showToast("error", error.message, "Booking failed");
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

export async function updateBooking(id, payload, onSuccess) {
  try {
    await bookingsApi.update(id, payload);
    showToast("success", "Your booking has been updated.", "Changes saved");
    await onSuccess?.();
  } catch (error) {
    showToast("error", error.message, "Update failed");
  }
}

export async function deleteBooking(id, onSuccess) {
  try {
    await bookingsApi.delete(id);
    showToast("success", "The booking has been cancelled.", "Booking cancelled");
    await onSuccess?.();
  } catch (error) {
    showToast("error", error.message, "Cancellation failed");
  }
}
