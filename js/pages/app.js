import { createHabitModel, incrementHabitProgress, isHabitCompleted } from '../modules/habits.js';
import { getStoredHabits, saveStoredHabits } from '../modules/storage.js';
import { renderHabitList, toggleModal, resetForm, setRunningHabitId } from '../modules/ui.js';
import { getTodayDate } from '../modules/utils.js';

let habits = [];
let activeTimerId = null;
let timerInterval = null;

function init() {
    console.log("🚀 App Iniciado (V4 - Edit Mode)!");
    habits = getStoredHabits();
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
        renderHabitList(habits);
        return;
    }
    if (activeTimerId) clearInterval(timerInterval);

    activeTimerId = habitId;
    setRunningHabitId(habitId);
    renderHabitList(habits);

    timerInterval = setInterval(() => {
        const habit = habits.find(h => h.id === activeTimerId);
        if (!habit) {
            clearInterval(timerInterval);
            return;
        }
        const today = getTodayDate();
        incrementHabitProgress(habit, today);
        saveStoredHabits(habits);
        
        if (isHabitCompleted(habit, today)) {
            clearInterval(timerInterval);
            activeTimerId = null;
            setRunningHabitId(null);
        }
        renderHabitList(habits);
    }, 60000);
}

// --- FUNÇÃO AUXILIAR: Preencher o Modal com dados existentes ---
function openEditModal(habit) {
    const form = document.getElementById('create-habit-form');
    
    // 1. Preenche ID
    form.querySelector('[name="habit-id"]').value = habit.id;
    
    // 2. Preenche Nome e Ícone
    form.querySelector('[name="habit-name"]').value = habit.title;
    form.querySelector('[name="habit-icon"]').value = habit.icon;
    
    // 3. Seleciona o Tipo (Click no radio dispara a lógica visual)
    const radio = form.querySelector(`input[value="${habit.type}"]`);
    if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change')); // Força atualização visual
    }

    // 4. Preenche Metas
    if (habit.type === 'timer') {
        form.querySelector('[name="habit-minutes"]').value = habit.target;
    } else {
        form.querySelector('[name="habit-target"]').value = habit.target;
    }

    // 5. Preenche Dias (Se for flexível)
    if (habit.type === 'flexible' && habit.frequency) {
        const checkboxes = form.querySelectorAll('.day-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = habit.frequency.includes(parseInt(cb.value));
        });
    }

    // 6. Mostra botão de Excluir
    document.getElementById('btn-delete-habit').classList.remove('hidden');
    
    toggleModal(true);
}

function setupWizardLogic() {
    const radios = document.querySelectorAll('input[name="habit-type"]');
    const containerDays = document.getElementById('setup-days');
    const containerTimer = document.getElementById('setup-timer');
    const containerTarget = document.getElementById('setup-target');

    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const type = e.target.value;
            containerDays.classList.add('hidden');
            containerTimer.classList.add('hidden');
            containerTarget.classList.add('hidden');

            if (type === 'routine') containerTarget.classList.remove('hidden');
            else if (type === 'flexible') {
                containerDays.classList.remove('hidden');
                containerTarget.classList.remove('hidden');
            } else if (type === 'timer') containerTimer.classList.remove('hidden');
        });
    });
}

function setupEventListeners() {
    // 1. BOTÃO NOVO HÁBITO (Limpa tudo antes de abrir)
    const btnOpen = document.getElementById('btn-open-modal');
    if (btnOpen) btnOpen.addEventListener('click', () => {
        resetForm();
        // Esconde botão de excluir no modo criação
        document.getElementById('btn-delete-habit').classList.add('hidden');
        document.querySelector('[name="habit-id"]').value = ""; // Limpa ID
        // Reseta visual dos tipos para Rotina
        const routineRadio = document.querySelector('input[value="routine"]');
        if(routineRadio) {
            routineRadio.checked = true;
            routineRadio.dispatchEvent(new Event('change'));
        }
        toggleModal(true);
    });

    const closeIds = ['btn-close-modal', 'btn-cancel-modal', 'modal-backdrop'];
    closeIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', () => toggleModal(false));
    });

    // 2. SALVAR (Criação ou Edição)
    const form = document.getElementById('create-habit-form');
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            
            const id = formData.get('habit-id'); // TEM ID?
            const title = formData.get('habit-name');
            const icon = formData.get('habit-icon');
            const type = formData.get('habit-type');
            
            let target = 1;
            if (type === 'timer') target = parseInt(formData.get('habit-minutes'));
            else target = parseInt(formData.get('habit-target'));

            let frequency = null;
            if (type === 'flexible') {
                const checkedBoxes = document.querySelectorAll('.day-checkbox:checked');
                frequency = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
                if (frequency.length === 0) return alert("Selecione um dia!");
            }

            if (!title) return alert("Nome obrigatório!");

            if (id) {
                // --- MODO EDIÇÃO (ATUALIZAR) ---
                console.log("📝 Atualizando hábito existente:", id);
                habits = habits.map(h => {
                    if (h.id === id) {
                        return { 
                            ...h, // Mantém histórico e datas
                            title, icon, target, type, frequency 
                        }; 
                    }
                    return h;
                });
            } else {
                // --- MODO CRIAÇÃO (NOVO) ---
                console.log("✨ Criando novo hábito");
                const newHabit = createHabitModel(title, icon, target, type, frequency);
                habits.push(newHabit);
            }

            saveStoredHabits(habits);
            renderHabitList(habits);
            toggleModal(false);
            resetForm();
        });
    }

    // 3. BOTÃO DELETAR (Dentro do Modal)
    const btnDeleteInside = document.getElementById('btn-delete-habit');
    if (btnDeleteInside) {
        btnDeleteInside.addEventListener('click', () => {
            const form = document.getElementById('create-habit-form');
            const id = form.querySelector('[name="habit-id"]').value;
            
            if (id && confirm("Tem certeza? Isso apagará todo o histórico deste hábito para sempre.")) {
                habits = habits.filter(h => h.id !== id);
                
                // Se estava rodando timer dele, para
                if (activeTimerId === id) clearInterval(timerInterval);

                saveStoredHabits(habits);
                renderHabitList(habits);
                toggleModal(false);
            }
        });
    }

    // 4. CLIQUES NA LISTA (Agora chama o Editar)
    const listContainer = document.getElementById('habits-list');
    if (listContainer) {
        listContainer.addEventListener('click', (event) => {
            
            // CLIQUE NO LÁPIS (EDITAR)
            const btnEdit = event.target.closest('.edit-btn');
            if (btnEdit) {
                const card = btnEdit.closest('.habit-card');
                const id = card.dataset.id;
                const habit = habits.find(h => h.id === id);
                if (habit) openEditModal(habit);
                return;
            }

            // AÇÃO PRINCIPAL (Check ou Play/Pause)
            const btnAction = event.target.closest('.action-btn');
            if (btnAction) {
                const card = btnAction.closest('.habit-card');
                const id = card.dataset.id;
                const type = card.dataset.type;
                const habit = habits.find(h => h.id === id);

                if (habit) {
                    if (type === 'timer') {
                        toggleTimer(id);
                    } else {
                        incrementHabitProgress(habit, getTodayDate());
                        saveStoredHabits(habits);
                        renderHabitList(habits);
                    }
                }
            }
        });
    }
}

function updateDateDisplay() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const todayName = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
        dateElement.innerText = todayName.charAt(0).toUpperCase() + todayName.slice(1);
    }
}

document.addEventListener('DOMContentLoaded', init);