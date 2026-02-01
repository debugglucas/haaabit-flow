import '../modules/client.js'; // 1. Garante a conexão com Supabase
import { getCurrentUser, signOut } from '../modules/auth.js'; // 2. Traz a lógica de Auth
import { createHabitModel, incrementHabitProgress, isHabitCompleted } from '../modules/habits.js';
import { getStoredHabits, saveStoredHabits, getUserProfile, loadUserData, deleteHabitFromCloud, saveUserProfile } from '../modules/storage.js';
import { renderHabitList, toggleModal, resetForm, setRunningHabitId, showToast, updateSidebarProfile, showLevelUpModal, setupNavigation } from '../modules/ui.js';
import { getTodayDate } from '../modules/utils.js';
import { addXp, removeXp } from '../modules/gamification.js';

let habits = [];
let activeTimerId = null;
let timerInterval = null;
let secondsCounter = 0;

// --- NOVA FUNÇÃO: O PORTEIRO ---
async function checkSession() {
    const user = await getCurrentUser();
    
    if (!user) {
        // Se não tem usuário logado, manda para o Login
        window.location.href = 'login.html';
        return false;
    }
    
    console.log("✅ Usuário autenticado:", user.email);
    return true;
}

// --- INIT AGORA É ASSÍNCRONO ---
async function init() {
    const isLogged = await checkSession();
    if (!isLogged) return;

    console.log("🚀 Carregando dados da nuvem...");

    // 1. A MÁGICA: Baixa tudo do Supabase antes de continuar
    await loadUserData(); 

    console.log("☁️ Dados carregados!");

    habits = getStoredHabits();
    const profile = getUserProfile();
    updateSidebarProfile(profile); // Agora vai aparecer seu nome real!

    renderHabitList(habits);
    updateDateDisplay();
    setupEventListeners();
    setupWizardLogic();
    setupNavigation(); 
}

function toggleTimer(habitId) {
    if (activeTimerId === habitId) {
        clearInterval(timerInterval);
        activeTimerId = null;
        setRunningHabitId(null);
        secondsCounter = 0;
        renderHabitList(habits);
        return;
    }
    if (activeTimerId) {
        clearInterval(timerInterval);
        secondsCounter = 0;
    }

    activeTimerId = habitId;
    setRunningHabitId(habitId);
    renderHabitList(habits);

    timerInterval = setInterval(() => {
        const habit = habits.find(h => h.id === activeTimerId);
        if (!habit) { clearInterval(timerInterval); return; }

        secondsCounter++;

        if (secondsCounter >= 60) {
            const today = getTodayDate();
            incrementHabitProgress(habit, today);
            saveStoredHabits(habits);
            secondsCounter = 0;

            if (isHabitCompleted(habit, today)) {
                clearInterval(timerInterval);
                activeTimerId = null;
                setRunningHabitId(null);
                
                const result = addXp(10);
                updateSidebarProfile(result.profile);
                if (result.leveledUp) showLevelUpModal(result.profile.level);
                else showToast("+10 XP! Foco total! 🔥", "success");
            }
        }
        renderHabitList(habits, secondsCounter);
    }, 1000); 
}

function setupEventListeners() {
    // NOVA LÓGICA: BOTÃO DE SAIR (LOGOUT)
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await signOut();
        });
    }

    // 1. Botão de abrir modal
    const btnOpen = document.getElementById('btn-open-modal');
    if (btnOpen) btnOpen.addEventListener('click', () => {
        resetForm();
        document.getElementById('btn-delete-habit').classList.add('hidden');
        document.querySelector('[name="habit-id"]').value = "";
        const routineRadio = document.querySelector('input[value="routine"]');
        if(routineRadio) { routineRadio.checked = true; routineRadio.dispatchEvent(new Event('change')); }
        toggleModal(true);
    });

    // 2. Botões de fechar modal
    ['btn-close-modal', 'btn-cancel-modal', 'modal-backdrop'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', () => toggleModal(false));
    });

    // 3. Submit do Formulário
    const form = document.getElementById('create-habit-form');
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const id = formData.get('habit-id');
            const title = formData.get('habit-name');
            const icon = formData.get('habit-icon');
            const type = formData.get('habit-type');
            
            if (!title.trim()) { showToast("Dê um nome ao hábito!", "error"); return; }

            let target = type === 'timer' ? parseInt(formData.get('habit-minutes')) : parseInt(formData.get('habit-target'));

            let frequency = null;
            if (type === 'flexible') {
                const checkedBoxes = document.querySelectorAll('.day-checkbox:checked');
                frequency = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
                if (frequency.length === 0) { showToast("Selecione um dia!", "error"); return; }
            }

            if (id) {
                habits = habits.map(h => h.id === id ? { ...h, title, icon, target, type, frequency } : h);
                showToast("Hábito atualizado!", "success");
            } else {
                habits.push(createHabitModel(title, icon, target, type, frequency));
                showToast("Hábito criado!", "success");
            }
            saveStoredHabits(habits);
            renderHabitList(habits);
            toggleModal(false);
            resetForm();
        });
    }

    // 4. Botão de Excluir
    const btnDelete = document.getElementById('btn-delete-habit');
    if (btnDelete) {
        btnDelete.addEventListener('click', () => {
            const id = document.querySelector('[name="habit-id"]').value;
            if (id && confirm("Tem certeza?")) {
                habits = habits.filter(h => h.id !== id);
                if (activeTimerId === id) clearInterval(timerInterval);

                deleteHabitFromCloud(id); // <--- ADICIONE ISSO
                // saveStoredHabits(habits); <--- PODE REMOVER ESSA LINHA NO DELETE

                renderHabitList(habits);
                toggleModal(false);
                showToast("Hábito excluído.", "error");
            }
        });
    }

    // 5. CLICK NAS LISTAS (PENDENTES E CONCLUÍDOS)
    const handleListClick = (event) => {
        // Tenta achar o botão de EDITAR
        const btnEdit = event.target.closest('.edit-btn');
        if (btnEdit) {
            const habit = habits.find(h => h.id === btnEdit.closest('.habit-card').dataset.id);
            if (habit) openEditModal(habit);
            return;
        }

        // Tenta achar o botão de AÇÃO (Check ou Voltar)
        const btnAction = event.target.closest('.action-btn');
        if (btnAction) {
            const card = btnAction.closest('.habit-card');
            const id = card.dataset.id;
            const type = card.dataset.type;
            
            // Encontra o hábito no array global 'habits'
            const habitIndex = habits.findIndex(h => h.id === id);
            if (habitIndex === -1) return;
            
            const habit = habits[habitIndex];
            const today = getTodayDate();

            console.log("Clicou no hábito:", habit.title, "| Tipo:", type); // Debug

            if (type === 'timer') {
                toggleTimer(id);
            } else {
                const wasCompleted = isHabitCompleted(habit, today);
                
                if (wasCompleted) {
                    // --- AÇÃO: DESFAZER (Exorcismo de Hábito Zumbi 🧟‍♂️) ---
                    console.log("Desfazendo hábito (Modo Nuclear)...");
                    
                    if (!habit.progress) habit.progress = {};
                    habit.progress[today] = 0;
                    
                    if (habit.completedDays && Array.isArray(habit.completedDays)) {
                        habit.completedDays = habit.completedDays.filter(d => d !== today);
                    }

                    habit.completed = false;
                    habit.done = false;
                    delete habit.completed;
                    delete habit.done;

                    const profile = removeXp(10);
                    updateSidebarProfile(profile);
                    
                    saveUserProfile(profile); 
                } else {
                    console.log("Completando hábito...");
                    incrementHabitProgress(habit, today);
                    
                    if (isHabitCompleted(habit, today)) {
                        const result = addXp(10);
                        updateSidebarProfile(result.profile);
                        saveUserProfile(result.profile);
                        if (result.leveledUp) showLevelUpModal(result.profile.level);
                        else showToast("+10 XP! Foco total! 🔥", "success");
                    }
                }

                saveStoredHabits(habits);
                renderHabitList(habits);
            }
        }
    };

    const pendingList = document.getElementById('habits-list-pending');
    const completedList = document.getElementById('habits-list-completed');

    if (pendingList) {
        pendingList.removeEventListener('click', handleListClick); 
        pendingList.addEventListener('click', handleListClick);
    }
    if (completedList) {
        completedList.removeEventListener('click', handleListClick); 
        completedList.addEventListener('click', handleListClick);
    }
}

function openEditModal(habit) {
    const form = document.getElementById('create-habit-form');
    form.querySelector('[name="habit-id"]').value = habit.id;
    form.querySelector('[name="habit-name"]').value = habit.title;
    form.querySelector('[name="habit-icon"]').value = habit.icon;
    const radio = form.querySelector(`input[value="${habit.type}"]`);
    if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change')); }
    if (habit.type === 'timer') form.querySelector('[name="habit-minutes"]').value = habit.target;
    else form.querySelector('[name="habit-target"]').value = habit.target;
    if (habit.type === 'flexible' && habit.frequency) {
        const checkboxes = form.querySelectorAll('.day-checkbox');
        checkboxes.forEach(cb => cb.checked = habit.frequency.includes(parseInt(cb.value)));
    }
    document.getElementById('btn-delete-habit').classList.remove('hidden');
    toggleModal(true);
}

function setupWizardLogic() {
    const radios = document.querySelectorAll('input[name="habit-type"]');
    const days = document.getElementById('setup-days');
    const timer = document.getElementById('setup-timer');
    const target = document.getElementById('setup-target');
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const type = e.target.value;
            days.classList.add('hidden'); timer.classList.add('hidden'); target.classList.add('hidden');
            if (type === 'routine') target.classList.remove('hidden');
            else if (type === 'flexible') { days.classList.remove('hidden'); target.classList.remove('hidden'); }
            else if (type === 'timer') timer.classList.remove('hidden');
        });
    });
}

function updateDateDisplay() {
    const el = document.getElementById('current-date');
    if (el) {
        const todayName = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
        el.innerText = todayName.charAt(0).toUpperCase() + todayName.slice(1);
    }
}

document.addEventListener('DOMContentLoaded', init);