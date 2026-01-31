import { createHabitModel, incrementHabitProgress, isHabitCompleted } from '../modules/habits.js';
import { getStoredHabits, saveStoredHabits, getUserProfile } from '../modules/storage.js';
import { renderHabitList, toggleModal, resetForm, setRunningHabitId, showToast, updateSidebarProfile, showLevelUpModal } from '../modules/ui.js';
import { getTodayDate } from '../modules/utils.js';
import { addXp, removeXp } from '../modules/gamification.js';

let habits = [];
let activeTimerId = null;
let timerInterval = null;
let secondsCounter = 0;

function init() {
    console.log("🚀 App Iniciado (V Final)!");
    habits = getStoredHabits();
    
    // Carrega perfil inicial
    const profile = getUserProfile();
    updateSidebarProfile(profile);

    renderHabitList(habits);
    updateDateDisplay();
    setupEventListeners();
    setupWizardLogic();
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
    const btnOpen = document.getElementById('btn-open-modal');
    if (btnOpen) btnOpen.addEventListener('click', () => {
        resetForm();
        document.getElementById('btn-delete-habit').classList.add('hidden');
        document.querySelector('[name="habit-id"]').value = "";
        const routineRadio = document.querySelector('input[value="routine"]');
        if(routineRadio) { routineRadio.checked = true; routineRadio.dispatchEvent(new Event('change')); }
        toggleModal(true);
    });

    ['btn-close-modal', 'btn-cancel-modal', 'modal-backdrop'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', () => toggleModal(false));
    });

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

    const btnDelete = document.getElementById('btn-delete-habit');
    if (btnDelete) {
        btnDelete.addEventListener('click', () => {
            const id = document.querySelector('[name="habit-id"]').value;
            if (id && confirm("Tem certeza?")) {
                habits = habits.filter(h => h.id !== id);
                if (activeTimerId === id) clearInterval(timerInterval);
                saveStoredHabits(habits);
                renderHabitList(habits);
                toggleModal(false);
                showToast("Hábito excluído.", "error");
            }
        });
    }

    const listContainer = document.getElementById('habits-list');
    if (listContainer) {
        listContainer.addEventListener('click', (event) => {
            const btnEdit = event.target.closest('.edit-btn');
            if (btnEdit) {
                const habit = habits.find(h => h.id === btnEdit.closest('.habit-card').dataset.id);
                if (habit) openEditModal(habit);
                return;
            }

            const btnAction = event.target.closest('.action-btn');
            if (btnAction) {
                const id = btnAction.closest('.habit-card').dataset.id;
                const type = btnAction.closest('.habit-card').dataset.type;
                const habit = habits.find(h => h.id === id);

                if (habit) {
                    if (type === 'timer') {
                        toggleTimer(id);
                    } else {
                        // ANTI-CHEAT LOGIC
                        const wasCompleted = isHabitCompleted(habit, getTodayDate());
                        incrementHabitProgress(habit, getTodayDate());
                        saveStoredHabits(habits);
                        const isNowCompleted = isHabitCompleted(habit, getTodayDate());

                        if (!wasCompleted && isNowCompleted) {
                            const result = addXp(10);
                            updateSidebarProfile(result.profile);
                            if (result.leveledUp) showLevelUpModal(result.profile.level);
                            else showToast("+10 XP! Mandou bem!", "success");
                        } else if (wasCompleted && !isNowCompleted) {
                            const profile = removeXp(10);
                            updateSidebarProfile(profile);
                        }
                        renderHabitList(habits);
                    }
                }
            }
        });
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