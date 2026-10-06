import { showToast } from "./toast.js";
import { request } from "./api.js";

export const roomsApi = {
  create: (payload) => request("/rooms", { method: "POST", body: JSON.stringify(payload) }),
  list: () => request("/rooms"),
  read: (id) => request(`/rooms/${id}`),
  update: (id, payload) => request(`/rooms/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id) => request(`/rooms/${id}`, { method: "DELETE" }),
};

export function saveRoom(button) {
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span>Please wait...';
  setTimeout(() => {
    button.disabled = false;
    button.innerHTML = original;
    showToast("success", "Room added successfully!", "Room saved");
  }, 750);
}

export function deleteRoom() {
  showToast("success", "The studio room was deleted.", "Room deleted");
}
