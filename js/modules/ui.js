// js/modules/ui.js
import { getHabitProgress, isHabitCompleted } from './habits.js';
import { getTodayDate } from './utils.js';

const habitsContainer = document.getElementById('habits-list');
let runningHabitId = null;

export function setRunningHabitId(id) {
    runningHabitId = id;
}

// --- Atualiza a Barra de Progresso Global (Topo) ---
function updateGlobalProgress(visibleHabits, today) {
    const progressBar = document.querySelector('.bg-brand-purple.w-0');
    const progressText = document.querySelector('.text-brand-purple');

    if (!progressBar || !progressText) return;

    if (visibleHabits.length === 0) {
        progressBar.style.width = '0%';
        progressText.innerText = '0%';
        return;
    }

    let completedCount = 0;
    visibleHabits.forEach(habit => {
        if (isHabitCompleted(habit, today)) completedCount++;
    });

    const percentage = Math.round((completedCount / visibleHabits.length) * 100);

    progressBar.style.width = `${percentage}%`;
    progressText.innerText = `${percentage}%`;
    
    // --- LÓGICA DO CONFETE INTELIGENTE (RESOLVIDO) ---
    // Cria uma chave única para o dia de hoje. Ex: "habitflow_celebrated_2026-01-30"
    const celebrationKey = `habitflow_celebrated_${today}`;

    if (percentage === 100) {
        progressText.innerText = '100% 🎉';
        
        // Pergunta pro navegador: "Já soltei confete hoje?"
        const hasCelebrated = localStorage.getItem(celebrationKey);

        if (!hasCelebrated) {
            triggerConfetti();
            // Marca que já celebrou para não repetir no F5
            localStorage.setItem(celebrationKey, "true");
        }
    } else {
        // Se baixou de 100%, apaga a chave. Assim se completar de novo, celebra.
        localStorage.removeItem(celebrationKey);
    }
}

function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF6B35', '#7209B7', '#FFD166']
        });
    }
}

// --- Renderizar a Lista de Hábitos ---
// NOVIDADE: Aceita 'activeSeconds' para mostrar a contagem regressiva visual
export function renderHabitList(habits, activeSeconds = 0) {
    if (!habitsContainer) return;
    
    habitsContainer.innerHTML = '';
    
    const todayIndex = new Date().getDay();
    const todayDate = getTodayDate();

    // Filtra para mostrar apenas o que é de hoje
    const visibleHabits = habits.filter(habit => {
        if (!habit.frequency || habit.frequency.length === 0) return true;
        return habit.frequency.includes(todayIndex);
    });

    updateGlobalProgress(visibleHabits, todayDate);

    // Empty State
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

    visibleHabits.forEach(habit => {
        const progress = getHabitProgress(habit, todayDate);
        const isDone = isHabitCompleted(habit, todayDate);
        const isRunning = runningHabitId === habit.id;

        let cardClass = "bg-white border-brand-dark shadow-neo hover:translate-x-[2px] hover:translate-y-[2px]";
        let btnIcon = habit.type === 'timer' ? '<i class="ph-fill ph-play"></i>' : '+';
        let btnClass = "bg-brand-light hover:bg-brand-orange hover:text-white shadow-sm";

        // --- LÓGICA VISUAL DO TIMER (MM:SS) ---
        let displayProgressText = `${progress} / ${habit.target}`;
        
        if (habit.type === 'timer') {
            if (isRunning) {
                // Formata os segundos para ter sempre 2 dígitos (ex: 5 vira 05)
                const secFormatted = activeSeconds < 10 ? `0${activeSeconds}` : activeSeconds;
                // Mostra: "15:05 / 30"
                displayProgressText = `<span class="text-brand-orange font-black text-sm">${progress}:${secFormatted}</span> / ${habit.target}`;
            } else {
                displayProgressText = `${progress} / ${habit.target}`;
            }
            displayProgressText += ' min';
        }

        if (isDone) {
            cardClass = "bg-green-50 border-green-200 opacity-75";
            btnIcon = '<i class="ph-bold ph-check"></i>';
            btnClass = "bg-green-500 text-white shadow-none cursor-default";
        } else if (isRunning) {
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
                        ${displayProgressText}
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

// Controle do Modal
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