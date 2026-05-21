// src/models/m-preferencias.js
import { supabase } from "../config/conexionbd.js";

const PreferenciasModel = {
  async getByTurista(id_turista) {
    console.log(" [Model] Buscando preferencias en DB para usuario:", id_turista);

    const { data, error } = await supabase
      .from("preferencia_turista")
      .select("id_categoria")
      .eq("id_turista", id_turista);

    if (error) {
      console.error(" [Model] Error al consultar preferencia_turista:", error);
      throw error;
    }

    console.log(" [Model] Filas encontradas:", data);
    return data.map((r) => r.id_categoria);
  },

  async deleteByTurista(id_turista) {
    const { error } = await supabase
      .from("preferencia_turista")
      .delete()
      .eq("id_turista", id_turista);

    if (error) throw error;
  },

  async insertPreferencias(id_turista, categorias) {
    const rows = categorias.map((id_categoria) => ({
      id_turista,
      id_categoria,
    }));

    const { error } = await supabase.from("preferencia_turista").insert(rows);

    if (error) throw error;
  },
};

export default PreferenciasModel;
