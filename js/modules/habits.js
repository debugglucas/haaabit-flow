// js/modules/habits.js
import { generateID, getTodayDate } from './utils.js';

// Fábrica: Cria um novo objeto de hábito padronizado
export function createHabitModel(title, icon = "🔥", target = 1) {
    return {
        id: generateID(),
        title: title,
        icon: icon,
        createdAt: getTodayDate(),
        
        // Configuração da Meta (Quantas vezes por dia?)
        target: parseInt(target),
        
        // Histórico de conclusões
        // Formato: { "2026-01-30": 1, "2026-01-29": 5 }
        history: {},
        
        // Estatísticas para Gamificação
        streak: 0,
        bestStreak: 0
    };
}

// Verifica se o hábito está concluído em uma data específica
export function isHabitCompleted(habit, date) {
    const progress = habit.history[date] || 0;
    return progress >= habit.target;
}

// Calcula o progresso atual (ex: fez 2 de 5)
export function getHabitProgress(habit, date) {
    return habit.history[date] || 0;
}

// ... (mantenha o código anterior)

// Aumenta o progresso do hábito em +1
export function incrementHabitProgress(habit, date) {
    // Se não tiver registro hoje, começa com 0
    const current = habit.history[date] || 0;
    
    // Se já completou, não faz nada (evita passar de 100%)
    if (current >= habit.target) return;

    // Aumenta +1
    habit.history[date] = current + 1;
}

// (Opcional) Remove o progresso (Desfazer)
export function decrementHabitProgress(habit, date) {
    const current = habit.history[date] || 0;
    if (current > 0) {
        habit.history[date] = current - 1;
    }
}