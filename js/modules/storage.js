import { supabaseClient } from './client.js';
import { getCurrentUser } from './auth.js';

// --- CACHE LOCAL (Para o app não ficar lento esperando a internet) ---
let localHabits = [];
let localProfile = {
    name: 'Visitante',
    level: 1,
    currentXp: 0,
    nextLevelXp: 100
};

// --- CARREGAR TUDO (Ao iniciar o app) ---
export async function loadUserData() {
    const user = await getCurrentUser();
    if (!user) return;

    // 1. Busca o Perfil
    const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileData) {
        localProfile = {
            name: profileData.name || user.email.split('@')[0],
            level: profileData.level || 1,
            currentXp: profileData.current_xp || 0,
            nextLevelXp: profileData.next_level_xp || 100
        };
    }

    // 2. Busca os Hábitos
    const { data: habitsData, error: habitsError } = await supabaseClient
        .from('habits')
        .select('*')
        .order('created_at', { ascending: true });

    if (habitsData) {
        // O Supabase retorna os dados puros, garantimos que progress seja um objeto
        localHabits = habitsData.map(h => ({
            ...h,
            progress: h.progress || {} 
        }));
    }
}

// --- FUNÇÕES DE HÁBITOS ---

// Retorna a lista que já carregamos na memória
export function getStoredHabits() {
    return localHabits;
}

// Salva no Banco (Sincronização)
export async function saveStoredHabits(habits) {
    localHabits = habits; // Atualiza local instantaneamente
    const user = await getCurrentUser();
    if (!user) return;

    // A estratégia aqui é: UPSERT (Atualizar ou Inserir)
    // Para simplificar, vamos salvar um por um as alterações ou criar novos
    // Mas para evitar complexidade extrema agora, vamos focar em criar/atualizar
    
    // NOTA: Num app real complexo, usaríamos uma fila de sincronização.
    // Aqui, vamos varrer o array e garantir que tudo está no banco.
    
    for (const habit of habits) {
        // Prepara o objeto para o banco (Snake_case vs CamelCase)
        const habitPayload = {
            id: habit.id,
            user_id: user.id,
            title: habit.title,
            icon: habit.icon,
            target: habit.target,
            type: habit.type,
            frequency: habit.frequency,
            progress: habit.progress
        };

        const { error } = await supabaseClient
            .from('habits')
            .upsert(habitPayload); // Upsert = Se existe atualiza, se não cria

        if (error) console.error("Erro ao salvar hábito:", error);
    }
    
    // Se você deletou um hábito da lista local, precisaria deletar do banco.
    // Vamos deixar a deleção separada por enquanto para não complicar.
}

// Função específica para deletar
export async function deleteHabitFromCloud(habitId) {
    const { error } = await supabaseClient
        .from('habits')
        .delete()
        .eq('id', habitId);
        
    if (error) console.error("Erro ao deletar:", error);
}

// --- FUNÇÕES DE PERFIL ---

export function getUserProfile() {
    return localProfile;
}

export async function saveUserProfile(profile) {
    localProfile = profile; // Atualiza local
    const user = await getCurrentUser();
    if (!user) return;

    const { error } = await supabaseClient
        .from('profiles')
        .update({
            level: profile.level,
            current_xp: profile.currentXp,
            next_level_xp: profile.nextLevelXp
        })
        .eq('id', user.id);

    if (error) console.error("Erro ao salvar perfil:", error);
}