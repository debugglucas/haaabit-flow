// js/modules/storage.js

const STORAGE_KEY = 'habitflow_db_v1';

// Pega todos os dados ou retorna um array vazio se for a primeira vez
export function getStoredHabits() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Salva a lista inteira no navegador
export function saveStoredHabits(habits) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch (error) {
        console.error("Erro ao salvar no LocalStorage:", error);
        alert("Ops! Memória cheia ou erro de privacidade.");
    }
}