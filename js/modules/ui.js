import { getHabitProgress, isHabitCompleted } from './habits.js';
import { getTodayDate, formatDateFriendly } from './utils.js'; // <--- Importando, não criando!
import { getLevelTitle } from './gamification.js'; 

let runningHabitId = null;

export function setRunningHabitId(id) {
    runningHabitId = id;
}

// --- TOASTS ---
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    let colors = "bg-white border-brand-dark text-brand-dark";
    let icon = "✨";

    if (type === 'success') {
        colors = "bg-green-100 border-brand-dark text-green-800";
        icon = "🎉";
    } else if (type === 'error') {
        colors = "bg-red-100 border-brand-dark text-red-800";
        icon = "🗑️";
    }

    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 px-6 py-4 rounded-xl border-3 shadow-neo font-bold min-w-[300px] toast-enter ${colors}`;
    toast.innerHTML = `<span class="text-xl">${icon}</span><p>${message}</p>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-leave');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- ATUALIZA SIDEBAR ---
export function updateSidebarProfile(profile) {
    const nameEl = document.getElementById('user-name');
    const levelTextEl = document.getElementById('user-level-text');
    const avatarEl = document.getElementById('user-avatar');
    const xpTextEl = document.getElementById('user-xp-text');
    const xpBarEl = document.getElementById('user-xp-bar');

    if (nameEl) nameEl.innerText = profile.name;
    if (avatarEl) avatarEl.innerText = profile.name.charAt(0).toUpperCase();

    if (levelTextEl) {
        const title = getLevelTitle(profile.level);
        levelTextEl.innerHTML = `Nível ${profile.level} · <span class="text-brand-orange">${title}</span>`;
    }

    if (xpTextEl && xpBarEl) {
        xpTextEl.innerText = `${profile.currentXp} / ${profile.nextLevelXp}`;
        const percentage = Math.min(100, Math.max(0, (profile.currentXp / profile.nextLevelXp) * 100));
        xpBarEl.style.width = `${percentage}%`;
    }
}

// --- MODAL DE LEVEL UP ---
export function showLevelUpModal(level) {
    const duration = 3000;
    const end = Date.now() + duration;
    (function frame() {
        if (typeof confetti === 'function') {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#FF6B35', '#7209B7'] });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#FF6B35', '#7209B7'] });
        }
        if (Date.now() < end) requestAnimationFrame(frame);
    }());

    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `flex flex-col items-center gap-2 px-8 py-6 rounded-2xl border-4 border-brand-dark bg-yellow-300 text-brand-dark shadow-neo toast-enter pointer-events-auto z-50`;
    toast.innerHTML = `
        <div class="text-4xl animate-bounce">🏆</div>
        <div class="font-black text-2xl uppercase italic">Level Up!</div>
        <p class="font-bold text-center">Parabéns!<br>Você alcançou o Nível ${level}</p>
        <button onclick="this.parentElement.remove()" class="mt-2 text-xs underline font-bold opacity-50 hover:opacity-100">Fechar</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-leave');
        setTimeout(() => toast.remove(), 300);
    }, 6000);
}

// --- BARRA DE PROGRESSO GLOBAL ---
function updateGlobalProgress(visibleHabits, today) {
    const dashboardView = document.getElementById('view-dashboard');
    if (!dashboardView) return;

    const progressBar = dashboardView.querySelector('.bg-brand-purple.h-full') || dashboardView.querySelector('.bg-brand-purple.w-0');
    const progressText = dashboardView.querySelector('.text-brand-purple');

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
    
    const celebrationKey = `habitflow_celebrated_${today}`;
    if (percentage === 100) {
        progressText.innerText = '100% 🎉';
        const hasCelebrated = localStorage.getItem(celebrationKey);
        if (!hasCelebrated) {
            if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            localStorage.setItem(celebrationKey, "true");
        }
    } else {
        localStorage.removeItem(celebrationKey);
    }
}

// --- RENDERIZAR LISTA (TIMELINE & DASHBOARD) ---
export function renderHabitList(habits, activeSeconds = 0) {
    const containerPending = document.getElementById('habits-list-pending');
    const containerCompleted = document.getElementById('habits-list-completed');
    
    if (!containerPending || !containerCompleted) return;
    
    containerPending.innerHTML = '';
    containerCompleted.innerHTML = '';
    
    const todayDate = getTodayDate();
    const todayIndex = new Date().getDay();

    // 1. DASHBOARD (Pendentes de Hoje)
    const habitsForToday = habits.filter(habit => {
        if (!habit.frequency || habit.frequency.length === 0) return true;
        return habit.frequency.includes(todayIndex);
    });

    updateGlobalProgress(habitsForToday, todayDate);

    let hasPendingHabits = false;

    habitsForToday.forEach(habit => {
        const isDone = isHabitCompleted(habit, todayDate);
        if (isDone) return; 

        hasPendingHabits = true;
        const progress = getHabitProgress(habit, todayDate);
        const isRunning = (typeof runningHabitId !== 'undefined') && runningHabitId === habit.id;

        const html = createHabitCard(habit, progress, todayDate, false, isRunning, activeSeconds);
        containerPending.insertAdjacentHTML('beforeend', html);
    });

    if (!hasPendingHabits) {
        if (habitsForToday.length > 0) {
            containerPending.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12 text-center animate-modal-enter">
                    <div class="text-8xl mb-4 animate-bounce">🏆</div>
                    <h3 class="font-display text-3xl font-black text-brand-dark mb-2">Dia Dominado!</h3>
                    <p class="text-gray-500 font-medium mb-6">Tudo feito por hoje.</p>
                    <button onclick="document.getElementById('nav-history').click()" class="text-brand-purple font-bold underline hover:text-brand-orange">Ver Timeline</button>
                </div>`;
        } else {
            containerPending.innerHTML = `
                <div class="flex flex-col items-center justify-center py-16 border-3 border-dashed border-gray-300 rounded-3xl bg-gray-50/50">
                    <div class="text-6xl mb-4">💤</div>
                    <p class="text-gray-400 font-bold">Nada agendado para hoje.</p>
                </div>`;
        }
    }

    // 2. HISTÓRICO (Timeline Agrupada)
    const allDates = new Set();
    allDates.add(todayDate);
    habits.forEach(h => {
        if (h.progress) Object.keys(h.progress).forEach(d => allDates.add(d));
    });

    const sortedDates = Array.from(allDates).sort((a, b) => new Date(b) - new Date(a));
    let hasHistory = false;

    // ... (Dentro de renderHabitList, no loop sortedDates.forEach)

    // Passo C: Criar grupos por data
    sortedDates.forEach(date => {
        // Encontra hábitos completados NESTA data específica
        const completedInDate = habits.filter(h => isHabitCompleted(h, date));

        if (completedInDate.length > 0) {
            hasHistory = true;
            const isToday = date === todayDate;
            const dateTitle = formatDateFriendly(date);

            let groupHTML = `
                <div class="relative border-3 border-dashed border-gray-300/60 rounded-3xl p-5 mb-8 animate-modal-enter group hover:border-gray-400 transition-colors">
                    
                    <div class="absolute -top-3 left-6 bg-[#F9F9F9] px-3 flex items-center gap-2">
                        ${isToday 
                            ? '<span class="w-2 h-2 rounded-full bg-brand-orange animate-pulse shadow-[0_0_8px_rgba(255,107,53,0.6)]"></span>' 
                            : '<span class="w-2 h-2 rounded-full bg-gray-300"></span>'
                        }
                        <span class="font-display text-xs font-black text-gray-400 uppercase tracking-widest pt-0.5">
                            ${dateTitle}
                        </span>
                    </div>

                    <div class="space-y-3 mt-2">
            `;

            // Cria os Cards dentro do Grupo
            completedInDate.forEach(habit => {
                const progress = getHabitProgress(habit, date);
                // Se não for hoje, passa true no isReadOnly
                groupHTML += createHabitCard(habit, progress, date, !isToday, false, 0); 
            });

            groupHTML += `</div></div>`;
            containerCompleted.insertAdjacentHTML('beforeend', groupHTML);
        }
    });

// ...

    if (!hasHistory) {
        containerCompleted.innerHTML = `
            <div class="text-center py-10 opacity-50">
                <div class="text-4xl mb-2">🕰️</div>
                <p class="font-bold text-gray-400">Seu histórico está vazio.</p>
            </div>`;
    }
}

// --- HELPER: CRIA O CARD ---
function createHabitCard(habit, progress, date, isReadOnly, isRunning, activeSeconds) {
    let cardClass = "bg-white border-3 border-brand-dark shadow-neo";
    let btnIcon = habit.type === 'timer' ? '<i class="ph-fill ph-play"></i>' : '<i class="ph-bold ph-plus"></i>';
    let btnClass = "bg-brand-light hover:bg-brand-orange hover:text-white hover:border-brand-dark shadow-sm";
    
    let displayProgress = `${progress} / ${habit.target}`;
    if (habit.type === 'timer') {
         if (isRunning) {
            const secFormatted = activeSeconds < 10 ? `0${activeSeconds}` : activeSeconds;
            displayProgress = `<span class="text-brand-orange font-black">${progress}:${secFormatted}</span>/${habit.target}m`;
        } else {
            displayProgress = `${progress}/${habit.target} min`;
        }
    }

    const isDone = progress >= habit.target || (habit.progress && habit.progress[date] >= habit.target);
    
    if (isDone) {
        cardClass = "bg-gray-50 border-gray-200 opacity-90"; 
        btnIcon = '<i class="ph-bold ph-arrow-u-up-left"></i>';
        btnClass = "bg-white text-gray-400 hover:text-red-500 hover:border-red-500 shadow-none";
    } 
    else if (isRunning) {
        cardClass = "bg-blue-50 border-blue-500 shadow-neo translate-x-[2px] translate-y-[2px]";
        btnIcon = '<i class="ph-fill ph-pause"></i>';
        btnClass = "bg-brand-orange text-white shadow-none animate-pulse border-brand-orange";
    }

    let actionButtonHTML = `
        <button class="action-btn w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl border-2 border-brand-dark font-bold transition-all text-xl ${btnClass}" title="${isDone ? 'Desfazer' : 'Completar'}">
            ${btnIcon}
        </button>`;

    let editButtonHTML = `
        <button class="edit-btn absolute -top-2 -right-2 bg-white text-gray-500 border-2 border-brand-dark w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:bg-brand-yellow hover:text-brand-dark shadow-sm z-10">
            <i class="ph-bold ph-pencil-simple text-sm"></i>
        </button>`;

    if (isReadOnly) {
        actionButtonHTML = `<div class="w-12 h-12 flex items-center justify-center text-green-500 text-2xl"><i class="ph-fill ph-check-circle"></i></div>`;
        editButtonHTML = ``; 
        cardClass = "bg-gray-50/50 border-gray-200 grayscale-[0.8]"; 
    }

    return `
        <div class="habit-card relative group flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 ${cardClass} mb-3" data-id="${habit.id}" data-type="${habit.type}">
            ${editButtonHTML}
            <div class="w-12 h-12 flex items-center justify-center bg-white border-2 border-brand-dark rounded-xl text-2xl shadow-sm">${habit.icon}</div>
            <div class="flex-1 min-w-0"> 
                <div class="flex justify-between items-center mb-1">
                    <h4 class="font-display font-bold text-base leading-tight truncate text-brand-dark">${habit.title}</h4>
                    ${isRunning ? '<span class="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">FOCANDO</span>' : ''}
                </div>
                <div class="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div class="h-full ${isDone ? 'bg-green-500' : 'bg-brand-orange'}" style="width: ${(Math.min(1, progress / habit.target) * 100)}%"></div>
                </div>
            </div>
            ${actionButtonHTML}
        </div>`;
}

export function toggleModal(show) {
    const modal = document.getElementById('create-habit-modal');
    if (modal) show ? modal.classList.remove('hidden') : modal.classList.add('hidden');
}

export function resetForm() {
    const form = document.getElementById('create-habit-form');
    if (form) form.reset();
}

// --- NAVEGAÇÃO ENTRE ABAS ---
export function setupNavigation() {
    const btnDash = document.getElementById('nav-dashboard');
    const btnHist = document.getElementById('nav-history');
    const viewDash = document.getElementById('view-dashboard');
    const viewHist = document.getElementById('view-history');

    const activeStyle = "bg-brand-orange text-white border-brand-dark shadow-neo-sm";
    const inactiveStyle = "bg-transparent text-gray-500 border-transparent hover:bg-gray-100 hover:border-brand-dark";

    function showDashboard() {
        viewDash.classList.remove('hidden');
        viewHist.classList.add('hidden');
        
        btnDash.className = btnDash.className.replace(inactiveStyle, "").replace("bg-transparent", "") + " " + activeStyle;
        btnHist.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium border-2 text-left " + inactiveStyle;
    }

    function showHistory() {
        viewDash.classList.add('hidden');
        viewHist.classList.remove('hidden');

        btnHist.className = btnHist.className.replace(inactiveStyle, "").replace("bg-transparent", "") + " " + activeStyle;
        btnDash.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium border-2 text-left " + inactiveStyle;
    }

    if(btnDash) btnDash.addEventListener('click', showDashboard);
    if(btnHist) btnHist.addEventListener('click', showHistory);
}