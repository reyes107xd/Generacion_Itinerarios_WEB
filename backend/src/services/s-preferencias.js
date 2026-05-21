import PreferenciasModel from "../models/m-preferencias.js";

const PreferenciasService = {
  // true/false si tiene o no preferencias
  async verificar(id_usuario) {
    const categorias = await PreferenciasModel.getByTurista(id_usuario);
    console.log(" [Service] Categorías encontradas:", categorias);
    return categorias.length > 0;
  },

  // Obtener lista de IDs de categoría (por si la quieres en otra parte)
  async getPreferencias(id_usuario) {
    return await PreferenciasModel.getByTurista(id_usuario);
  },

  // Guardar preferencias (borrar anteriores y poner nuevas)
  async guardar(id_usuario, categorias) {
    await PreferenciasModel.deleteByTurista(id_usuario);
    await PreferenciasModel.insertPreferencias(id_usuario, categorias);
  },
};

export default PreferenciasService;
