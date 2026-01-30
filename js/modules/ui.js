// js/modules/ui.js
import { getHabitProgress, isHabitCompleted } from './habits.js';
import { getTodayDate } from './utils.js';

const habitsContainer = document.getElementById('habits-list');

// Variável para saber qual timer está rodando
let runningHabitId = null;

export function setRunningHabitId(id) {
    runningHabitId = id;
}

// --- FUNÇÃO AUXILIAR: Atualiza a Barra de Progresso Global (Topo) ---
function updateGlobalProgress(visibleHabits, today) {
    const progressBar = document.querySelector('.bg-brand-purple.w-0'); // A barra colorida
    const progressText = document.querySelector('.text-brand-purple'); // O texto "0%"

    if (!progressBar || !progressText) return;

    if (visibleHabits.length === 0) {
        progressBar.style.width = '0%';
        progressText.innerText = '0%';
        return;
    }

    let completedCount = 0;
    visibleHabits.forEach(habit => {
        if (isHabitCompleted(habit, today)) {
            completedCount++;
        }
    });

    const percentage = Math.round((completedCount / visibleHabits.length) * 100);

    progressBar.style.width = `${percentage}%`;
    progressText.innerText = `${percentage}%`;
    
    if (percentage === 100) {
        progressText.innerText = '100% 🎉';
    }
}

// --- FUNÇÃO PRINCIPAL: Renderizar a Lista ---
export function renderHabitList(habits) {
    if (!habitsContainer) return;
    
    habitsContainer.innerHTML = '';
    
    // 1. Filtro de Dias (O porteiro do calendário)
    const todayIndex = new Date().getDay();
    const visibleHabits = habits.filter(habit => {
        if (!habit.frequency || habit.frequency.length === 0) return true;
        return habit.frequency.includes(todayIndex);
    });

    // 2. Atualiza a barra de progresso global com os hábitos de HOJE
    updateGlobalProgress(visibleHabits, getTodayDate());

    // 3. Empty State (Se não tiver nada hoje)
    if (visibleHabits.length === 0) {
        habitsContainer.innerHTML = `
            <div class="text-center py-16 opacity-50">
                <div class="text-6xl mb-4">💤</div>
                <h3 class="font-display text-2xl font-bold text-gray-400">Tudo limpo por hoje!</h3>
                <p class="text-gray-400">Nenhum hábito agendado para este dia.</p>
            </div>
        `;
        return;
    }

    // 4. Desenha os Cards
    visibleHabits.forEach(habit => {
        const today = getTodayDate();
        const progress = getHabitProgress(habit, today);
        const isDone = isHabitCompleted(habit, today);
        const isRunning = runningHabitId === habit.id;

        // --- LÓGICA DE ESTILOS ---
        let cardClass = "bg-white border-brand-dark shadow-neo hover:translate-x-[2px] hover:translate-y-[2px]";
        let btnIcon = habit.type === 'timer' ? '<i class="ph-fill ph-play"></i>' : '+';
        let btnClass = "bg-brand-light hover:bg-brand-orange hover:text-white shadow-sm";

        // Estilo: Concluído
        if (isDone) {
            cardClass = "bg-green-50 border-green-200 opacity-75";
            btnIcon = '<i class="ph-bold ph-check"></i>';
            btnClass = "bg-green-500 text-white shadow-none cursor-default";
        }
        // Estilo: Rodando Timer
        else if (isRunning) {
            cardClass = "bg-blue-50 border-blue-200 shadow-neo translate-x-[2px] translate-y-[2px]";
            btnIcon = '<i class="ph-fill ph-pause"></i>';
            btnClass = "bg-brand-orange text-white shadow-none animate-pulse";
        }

        const html = `
            <div class="habit-card relative group flex items-center gap-4 p-4 border-3 rounded-2xl transition-all duration-200 ${cardClass}" data-id="${habit.id}" data-type="${habit.type}">
                
                <button class="edit-btn absolute -top-3 -right-3 bg-white text-gray-500 border-2 border-brand-dark w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:bg-brand-orange hover:text-white shadow-sm z-10">
                    <i class="ph-bold ph-pencil-simple"></i>
                </button>

                <div class="w-12 h-12 flex items-center justify-center bg-brand-light border-2 border-brand-dark rounded-xl text-2xl shadow-sm">
                    ${habit.icon}
                </div>
                
                <div class="flex-1">
                    <div class="flex justify-between items-center">
                        <h4 class="font-display font-bold text-lg leading-tight ${isDone ? 'line-through text-gray-500' : 'text-brand-dark'}">
                            ${habit.title}
                        </h4>
                        ${isRunning ? '<span class="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">FOCANDO...</span>' : ''}
                    </div>
                    
                    <div class="w-full bg-gray-200 h-2 rounded-full mt-2 border border-brand-dark/20 overflow-hidden">
                        <div class="h-full ${isDone ? 'bg-green-500' : (isRunning ? 'bg-blue-500' : 'bg-brand-orange')} transition-all duration-500" style="width: ${(progress / habit.target) * 100}%"></div>
                    </div>
                    
                    <div class="text-xs font-bold text-gray-400 mt-1 text-right">
                        ${progress} / ${habit.target} ${habit.type === 'timer' ? 'min' : ''}
                    </div>
                </div>

                <button class="action-btn w-12 h-12 flex items-center justify-center rounded-xl border-2 border-brand-dark font-bold transition-all text-xl ${btnClass}">
                    ${btnIcon}
                </button>
            </div>
        `;
        habitsContainer.insertAdjacentHTML('beforeend', html);
    });
}

// --- FUNÇÕES DE UTILIDADE ---
export function toggleModal(show) {
    const modal = document.getElementById('create-habit-modal');
    if (modal) {
        if (show) modal.classList.remove('hidden');
        else modal.classList.add('hidden');
    }
}

export function resetForm() {
    const form = document.getElementById('create-habit-form');
    if (form) form.reset();
}