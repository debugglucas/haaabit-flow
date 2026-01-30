// js/modules/utils.js

// Gera um ID aleatório curto (ex: "a1b2c3d4")
export function generateID() {
    return Math.random().toString(36).substr(2, 9);
}

// Retorna a data de hoje no formato YYYY-MM-DD (Padrão ISO simples)
// Importante para comparar se o hábito foi feito "hoje"
export function getTodayDate() {
    const offset = new Date().getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - offset)).toISOString().slice(0, 10);
    return localISOTime;
}

// Formata a data para mostrar na tela (ex: "Sexta-feira, 30/01")
export function formatDateFriendly(dateString) {
    const date = new Date(dateString + 'T00:00:00'); // Força timezone local
    return new Intl.DateTimeFormat('pt-BR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
    }).format(date);
}

// ... (mantenha o código anterior do renderHabitList)

// Controle do Modal
export function toggleModal(show) {
    const modal = document.getElementById('create-habit-modal');
    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

// Limpa os campos do formulário para a próxima vez
export function resetForm() {
    const form = document.getElementById('create-habit-form');
    form.reset();
}