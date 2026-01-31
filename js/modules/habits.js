// js/modules/habits.js

export function createHabitModel(title, icon, target, type, frequency = null) {
    return {
        id: crypto.randomUUID(),
        title,
        icon,
        target,
        type, // 'routine', 'flexible', 'timer'
        frequency, // array de dias [0, 1, 2...] ou null
        progress: {}, // Objeto para guardar progresso por data: { "2023-10-27": 10 }
        createdAt: new Date().toISOString()
    };
}

export function getHabitProgress(habit, date) {
    // Retorna 0 se não tiver progresso naquele dia
    if (!habit.progress) return 0;
    return habit.progress[date] || 0;
}

export function incrementHabitProgress(habit, date, amount = 1) {
    if (!habit.progress) habit.progress = {};
    
    const current = habit.progress[date] || 0;
    habit.progress[date] = current + amount;
}

export function isHabitCompleted(habit, date) {
    // 1. Verifica se tem alguma flag antiga de "completed" (Compatibilidade)
    if (habit.completed === true) return true;
    
    // 2. Verifica se atingiu a meta numérica
    const current = getHabitProgress(habit, date);
    return current >= habit.target;
}