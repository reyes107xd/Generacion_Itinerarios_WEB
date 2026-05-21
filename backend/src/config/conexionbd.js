// src/config/conexionbd.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = "https://avroynjvtjdxztjigtpy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;  // <--- USA SOLO ESTE

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from("usuario")
      .select("*")
      .limit(1);

    if (error) throw error;
    console.log("Conectado a Supabase correctamente");
    return true;
  } catch (error) {
    console.log("Error de conexión:", error.message);
    return false;
  }
}

