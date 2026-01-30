import { getHabitProgress, isHabitCompleted } from './habits.js';
import { getTodayDate } from './utils.js';

// Seleciona o container onde os hábitos vão morar
const habitsContainer = document.getElementById('habits-list');

// --- 1. Renderizar a Lista ---
// js/modules/ui.js (Apenas atualizando a renderHabitList)

export function renderHabitList(habits) {
    if (habitsContainer) {
        habitsContainer.innerHTML = '';
    
        if (habits.length === 0) {
            habitsContainer.innerHTML = `
                <div class="text-center py-16 opacity-50">
                    <div class="text-6xl mb-4">💤</div>
                    <h3 class="font-display text-2xl font-bold text-gray-400">Nenhum hábito hoje</h3>
                    <p class="text-gray-400">Clique em "Novo Hábito" para começar.</p>
                </div>
            `;
            return;
        }

        habits.forEach(habit => {
            const today = getTodayDate();
            const progress = getHabitProgress(habit, today);
            const isDone = isHabitCompleted(habit, today);
            
            const cardClass = isDone 
                ? "bg-green-50 border-green-200 opacity-75" 
                : "bg-white border-brand-dark shadow-neo hover:translate-x-[2px] hover:translate-y-[2px]";

            const html = `
                <div class="habit-card relative group flex items-center gap-4 p-4 border-3 rounded-2xl transition-all duration-200 ${cardClass}" data-id="${habit.id}">
                    
                    <button class="delete-btn absolute -top-3 -right-3 bg-red-100 text-red-500 border-2 border-brand-dark w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:bg-red-500 hover:text-white shadow-sm z-10">
                        <i class="ph-bold ph-trash"></i>
                    </button>

                    <div class="w-12 h-12 flex items-center justify-center bg-brand-light border-2 border-brand-dark rounded-xl text-2xl shadow-sm">
                        ${habit.icon}
                    </div>
                    <div class="flex-1">
                        <h4 class="font-display font-bold text-lg leading-tight ${isDone ? 'line-through text-gray-500' : 'text-brand-dark'}">
                            ${habit.title}
                        </h4>
                        <div class="w-full bg-gray-200 h-2 rounded-full mt-2 border border-brand-dark/20 overflow-hidden">
                            <div class="h-full bg-brand-orange transition-all duration-500" style="width: ${(progress / habit.target) * 100}%"></div>
                        </div>
                    </div>
                    <button class="action-btn w-10 h-10 flex items-center justify-center rounded-xl border-2 border-brand-dark font-bold transition-all ${isDone ? 'bg-green-500 text-white shadow-none' : 'bg-brand-light hover:bg-brand-orange hover:text-white shadow-sm'}">
                        ${isDone ? '✓' : '+'}
                    </button>
                </div>
            `;
            habitsContainer.insertAdjacentHTML('beforeend', html);
        });
    }
}
// --- 2. Abrir/Fechar Modal ---
export function toggleModal(show) {
    const modal = document.getElementById('create-habit-modal');
    if (modal) {
        if (show) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }
}

// --- 3. Limpar Formulário ---
export function resetForm() {
    const form = document.getElementById('create-habit-form');
    if (form) form.reset();
}