const API = "/api.php?route=";

export async function request(route, options = {}) {
  const config = {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  };

  try {
    const response = await fetch(`${API}${encodeURIComponent(route)}`, config);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Something went wrong.");
    return data;
  } catch (error) {
    throw new Error(error.message || "Unable to connect. Please try again.");
  }
}
