import { createHabitModel, incrementHabitProgress } from '../modules/habits.js';
import { getStoredHabits, saveStoredHabits } from '../modules/storage.js';
import { renderHabitList, toggleModal, resetForm } from '../modules/ui.js';
import { getTodayDate } from '../modules/utils.js';

let habits = [];

// --- 1. Inicialização ---
function init() {
    console.log("🚀 App Iniciado! Carregando dados...");
    
    // Carrega do LocalStorage
    habits = getStoredHabits();
    
    // Desenha na tela
    renderHabitList(habits);
    updateDateDisplay();

    // Configura os cliques
    setupEventListeners();
}

// --- 2. Configuração de Eventos ---
function setupEventListeners() {
    
    // A. ABRIR MODAL (Botão Novo Hábito)
    const btnOpen = document.getElementById('btn-open-modal');
    if (btnOpen) {
        btnOpen.addEventListener('click', () => toggleModal(true));
    }

    // B. FECHAR MODAL (X, Cancelar, Fundo)
    const closeIds = ['btn-close-modal', 'btn-cancel-modal', 'modal-backdrop'];
    closeIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', () => toggleModal(false));
    });

    // C. SALVAR NOVO HÁBITO (Submit do Formulário)
    const form = document.getElementById('create-habit-form');
    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const inputs = form.elements;
            const title = inputs[0].value;
            const icon = inputs[1].value;
            const target = inputs[2].value;

            if (!title) return alert("O hábito precisa de um nome!");

            // Cria, Salva e Atualiza
            const newHabit = createHabitModel(title, icon, target);
            habits.push(newHabit);
            saveStoredHabits(habits);
            renderHabitList(habits);
            
            toggleModal(false);
            resetForm();
        });
    }

    // D. CLIQUE NA LISTA (Check / Incrementar Progresso)
    // Aqui está a mágica: ouvimos o clique na lista inteira
    // D. CLIQUE NA LISTA (Gerencia tanto o Check quanto o Delete)
    const listContainer = document.getElementById('habits-list');
    
    if (listContainer) {
        listContainer.addEventListener('click', (event) => {
            
            // --- CASO 1: DELETAR HÁBITO ---
            const btnDelete = event.target.closest('.delete-btn');
            if (btnDelete) {
                const card = btnDelete.closest('.habit-card');
                const habitId = card.dataset.id;
                
                // Pergunta de segurança (simples)
                if(confirm("Tem certeza que quer apagar esse hábito?")) {
                    // Filtra a lista removendo o ID clicado
                    habits = habits.filter(h => h.id !== habitId);
                    
                    saveStoredHabits(habits);
                    renderHabitList(habits);
                    console.log("🗑️ Hábito deletado!");
                }
                return; // Para por aqui, não tenta dar check
            }

            // --- CASO 2: DAR CHECK / INCREMENTAR ---
            const btnAction = event.target.closest('.action-btn');
            if (btnAction) {
                const card = btnAction.closest('.habit-card');
                const habitId = card.dataset.id;
                const habit = habits.find(h => h.id === habitId);
                
                if (habit) {
                    const today = getTodayDate();
                    incrementHabitProgress(habit, today);
                    saveStoredHabits(habits);
                    renderHabitList(habits);
                }
            }
        });
    }
}

// --- 3. Atualizar Data no Título ---
function updateDateDisplay() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const todayName = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
        dateElement.innerText = todayName.charAt(0).toUpperCase() + todayName.slice(1);
    }
}

// Inicia quando o HTML estiver pronto
document.addEventListener('DOMContentLoaded', init);