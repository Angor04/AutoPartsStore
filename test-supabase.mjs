// Test rápido para verificar conexión a Supabase
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://aebzgxrpvbwmcktnvkea.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlYnpneHJwdmJ3bWNrdG52a2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NTMwMTcsImV4cCI6MjA4MzQyOTAxN30.W2w0oM9CZfKk5_ri3QtLvEy37Y36qxiBUAQyOHzUlso"

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testConnection() {
  console.log("🔍 Probando conexión a Supabase...")
  
  try {
    // Test 1: Obtener categorías
    const { data: categorias, error: catError } = await supabase
      .from('categorias')
      .select('*')
    
    if (catError) {
      console.error("❌ Error en categorias:", catError)
    } else {
      console.log("✅ Categorías encontradas:", categorias?.length || 0)
      console.log(categorias)
    }
    
    // Test 2: Obtener productos
    const { data: productos, error: prodError } = await supabase
      .from('productos')
      .select('*')
      .limit(5)
    
    if (prodError) {
      console.error("❌ Error en productos:", prodError)
    } else {
      console.log("✅ Productos encontrados:", productos?.length || 0)
      console.log(productos)
    }
    
  } catch (err) {
    console.error("❌ Error general:", err)
  }
}

testConnection()
