// js/modules/utils.js

// Gera um ID aleatório curto
export function generateID() {
    return Math.random().toString(36).substr(2, 9);
}

// Retorna a data de hoje no formato YYYY-MM-DD
export function getTodayDate() {
    const offset = new Date().getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - offset)).toISOString().slice(0, 10);
    return localISOTime;
}

// Formata a data para a Timeline (Hoje, Ontem, DD/MM)
export function formatDateFriendly(dateString) {
    const date = new Date(dateString + 'T00:00:00'); // Garante fuso local
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Zera horas para comparação justa
    const d = date.setHours(0,0,0,0);
    const t = today.setHours(0,0,0,0);
    const y = yesterday.setHours(0,0,0,0);

    if (d === t) return "Hoje";
    if (d === y) return "Ontem";
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}