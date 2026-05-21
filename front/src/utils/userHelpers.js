// utils/userHelpers.js
export const getFullName = (user) => {
  if (!user) return 'Usuario';
  
  // Prioridad: nombre ya concatenado > ap_p + ap_m > solo nombre
  if (user.name && typeof user.name === 'string') {
    return user.name;
  }
  
  const apellidoPaterno = user.ap_p || user.apellidoPaterno || '';
  const apellidoMaterno = user.ap_m || user.apellidoMaterno || '';
  
  // Si tenemos ambos apellidos
  if (apellidoPaterno && apellidoPaterno.trim() !== '' && apellidoPaterno !== 'null' && apellidoPaterno !== 'undefined' &&
      apellidoMaterno && apellidoMaterno.trim() !== '' && apellidoMaterno !== 'null' && apellidoMaterno !== 'undefined') {
    return `${user.nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();
  }
  
  // Si solo tenemos apellido paterno
  if (apellidoPaterno && apellidoPaterno.trim() !== '' && apellidoPaterno !== 'null' && apellidoPaterno !== 'undefined') {
    return `${user.nombre} ${apellidoPaterno}`.trim();
  }
  
  // Si solo tenemos apellido materno (caso poco común pero posible)
  if (apellidoMaterno && apellidoMaterno.trim() !== '' && apellidoMaterno !== 'null' && apellidoMaterno !== 'undefined') {
    return `${user.nombre} ${apellidoMaterno}`.trim();
  }
  
  return user.nombre || 'Usuario';
};

export const generateAvatarUrl = (foto, nombreCompleto) => {
  if (foto && typeof foto === 'string' && foto.trim() !== '' && 
      foto !== 'null' && foto !== 'undefined' && !foto.includes('undefined')) {
    return foto.startsWith('http') ? foto : `http://localhost:3000${foto}`;
  }

  const nombreParaAvatar = nombreCompleto || 'Usuario';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreParaAvatar)}&background=1D7743&color=fff&bold=true`;
};