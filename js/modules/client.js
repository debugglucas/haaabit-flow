// js/modules/client.js
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

// Verifica se o script do HTML carregou
if (typeof supabase === 'undefined') {
    console.error("ERRO CRÍTICO: A biblioteca do Supabase não foi carregada no HTML.");
}

const { createClient } = supabase;

// Cria a conexão oficial
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("📡 Conexão com Supabase inicializada!");