import { API_URL } from './a-config';

// Obtener preferencias del usuario
export async function getUserPreferences() {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  // Endpoint correcto: /api/preferencias/estado
  const res = await fetch(`${API_URL}/preferencias/estado`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const body = await res.json();

  return { hasPreferences: !!body.hasPreferences };
}

// Guardar preferencias
export async function saveUserPreferences(categorias) {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  const res = await fetch(`${API_URL}/preferencias`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ categories: categorias }),
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.message || "Error guardando preferencias");
  }

  return body;
}
