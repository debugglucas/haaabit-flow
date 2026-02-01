// js/modules/auth.js
import { supabaseClient } from './client.js';

// --- CADASTRO (SIGN UP) ---
export async function signUp(email, password, name) {
    // 1. Cria o usuário na autenticação
    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { full_name: name } // Isso vai pro nosso gatilho criar o perfil!
        }
    });

    if (error) throw error;
    return data;
}

// --- LOGIN (SIGN IN) ---
export async function signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) throw error;
    return data;
}

// --- SAIR (LOGOUT) ---
export async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    // Redireciona para a tela de login
    window.location.href = 'login.html'; 
}

// --- PEGAR USUÁRIO ATUAL ---
export async function getCurrentUser() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return null;
    return session.user;
}