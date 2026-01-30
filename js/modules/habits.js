// js/modules/habits.js
import { generateID, getTodayDate } from './utils.js';

// Fábrica: Cria um novo objeto de hábito (Agora Turbinado!)
export function createHabitModel(title, icon, target, type = 'routine', frequency = []) {
    return {
        id: generateID(),
        title: title,
        icon: icon,
        createdAt: getTodayDate(),
        
        // Configurações Novas
        type: type, // 'routine' | 'flexible' | 'timer'
        target: parseInt(target), // Meta (vezes ou minutos)
        frequency: frequency, // Array de dias: [1, 3, 5] (Seg, Qua, Sex) ou null
        
        history: {},
        streak: 0,
        bestStreak: 0
    };
}

// Verifica se o hábito está concluído
export function isHabitCompleted(habit, date) {
    const progress = habit.history[date] || 0;
    return progress >= habit.target;
}

// Aumenta o progresso
export function incrementHabitProgress(habit, date) {
    const current = habit.history[date] || 0;
    
    // Se for Timer, aumenta de 5 em 5 minutos (exemplo) ou 1 em 1
    // Por enquanto vamos manter +1 para tudo para simplificar
    if (current >= habit.target) return;
    habit.history[date] = current + 1;
}

// Retorna o progresso atual
export function getHabitProgress(habit, date) {
    return habit.history[date] || 0;
}