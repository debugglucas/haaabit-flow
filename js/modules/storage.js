const HABITS_KEY = 'habitflow_data';
const PROFILE_KEY = 'habitflow_profile'; 

// --- HÁBITOS ---
export function getStoredHabits() {
    const stored = localStorage.getItem(HABITS_KEY);
    return stored ? JSON.parse(stored) : [];
}

export function saveStoredHabits(habits) {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

// --- PERFIL (NOVO) ---
export function getUserProfile() {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) return JSON.parse(stored);

    // Perfil inicial padrão
    return {
        name: 'Lucas Dev', 
        level: 1,
        currentXp: 0,
        nextLevelXp: 100
    };
}

export function saveUserProfile(profile) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}