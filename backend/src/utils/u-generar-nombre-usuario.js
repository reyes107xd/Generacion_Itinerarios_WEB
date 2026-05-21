/**
 * Genera un nombre de usuario único basado en el nombre completo.
 * Usa una función externa para verificar si el nombre ya existe.
 *
 * @param {string} nombreCompleto - El nombre completo del usuario.
 * @param {Function} verificarExistencia - Función async(nombre) que devuelve true si existe.
 * @param {number} maxLength - Longitud máxima permitida.
 */
export async function generarNombreUsuario(nombreCompleto, verificarExistencia, maxLength = 30) {
  let base = nombreCompleto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // elimina símbolos
    .trim()
    .replace(/\s+/g, '_'); // espacios → guiones bajos

  if (!base) base = 'usuario';
  base = base.slice(0, maxLength);

  let username = base;
  let contador = 1;

  while (await verificarExistencia(username)) {
    const sufijo = contador++;
    const maxBaseLength = maxLength - String(sufijo).length - 1;
    username = `${base.slice(0, maxBaseLength)}_${sufijo}`;
  }

  return username;
}
