import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

//CARGAR variables de entorno
dotenv.config()

const supabaseUrl = 'https://avroynjvtjdxztjigtpy.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Crear cliente
export const supabase = createClient(supabaseUrl, supabaseKey)

// Verificar conexión
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('usuario')
      .select('*')
      .limit(1)
    
    if (error) throw error
    console.log('Se ha conectado con éxito.')
    return true
  } catch (error) {
    console.log(' Error de conexión:', error.message)
    return false
  }
}