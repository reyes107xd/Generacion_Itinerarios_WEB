export function procesarNombreCompleto(nombreCompleto) {
  console.log('Procesando nombre completo:', nombreCompleto);
  
  if (!nombreCompleto || typeof nombreCompleto !== 'string') {
    throw new Error('Nombre inválido');
  }
  
  const trimmed = nombreCompleto.trim();
  if (!trimmed) {
    throw new Error('El nombre no puede estar vacío');
  }
  
  const nombreParts = trimmed.split(/\s+/);
  console.log('Partes del nombre:', nombreParts);
  
  // Validar longitud de cada parte
  nombreParts.forEach((parte, index) => {
    if (parte.length > 30) {
      throw new Error(`"${parte}" tiene ${parte.length} caracteres. Cada parte del nombre debe tener máximo 30 caracteres.`);
    }
  });
  
  let nombre = '';
  let ap_p = null;  // Usar null en lugar de string vacío
  let ap_m = null;  // Usar null en lugar de string vacío

  switch (nombreParts.length) {
    case 1:
      nombre = nombreParts[0];
      break;
    case 2:
      nombre = nombreParts[0];
      ap_p = nombreParts[1];
      break;
    case 3:
      nombre = nombreParts[0];
      ap_p = nombreParts[1];
      ap_m = nombreParts[2];
      break;
    default:
      // Para nombre compuesto (ej: "María José")
      nombre = `${nombreParts[0]} ${nombreParts[1]}`;
      if (nombre.length > 30) {
        throw new Error(`El nombre "${nombre}" tiene ${nombre.length} caracteres (máximo 30)`);
      }
      ap_p = nombreParts[2];
      ap_m = nombreParts[3] || null;
      break;
  }
  
  console.log('Resultado final procesado:', { nombre, ap_p, ap_m });
  
  return { nombre, ap_p, ap_m };
}