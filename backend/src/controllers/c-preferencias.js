import PreferenciasService from "../services/s-preferencias.js";

const PreferenciasController = {
  async getEstadoPreferencias(req, res) {
    try {
      const id_usuario = req.user.id; 
      console.log(" [Controller] Verificando preferencias para usuario:", id_usuario);

      const tiene = await PreferenciasService.verificar(id_usuario);

      return res.json({
        hasPreferences: tiene,
      });
    } catch (error) {
      console.error(" [Controller] Error en getEstadoPreferencias:", error);
      res.status(500).json({ message: "Error al obtener estado de preferencias." });
    }
  },

  async savePreferencias(req, res) {
    try {
      const id_usuario = req.user.id;
      const { categories } = req.body;

      await PreferenciasService.guardar(id_usuario, categories);
      res.json({ message: "Preferencias guardadas con éxito." });
    } catch (error) {
      console.error(" [Controller] Error en savePreferencias:", error);
      res.status(500).json({ message: "Error al guardar preferencias." });
    }
  },
};

export default PreferenciasController;