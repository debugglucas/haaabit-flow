import { getUserProfile, saveUserProfile } from './storage.js';

const XP_PER_COMPLETION = 10; 

export function addXp(amount = XP_PER_COMPLETION) {
    const profile = getUserProfile();
    
    profile.currentXp += amount;

    let leveledUp = false;
    
    // Verifica se subiu de nível
    while (profile.currentXp >= profile.nextLevelXp) {
        profile.currentXp -= profile.nextLevelXp; 
        profile.level++;
        profile.nextLevelXp = Math.floor(profile.nextLevelXp * 1.5); // Dificuldade aumenta
        leveledUp = true;
    }

    saveUserProfile(profile);
    
    return { profile, leveledUp };
}

export function removeXp(amount = XP_PER_COMPLETION) {
    const profile = getUserProfile();

    profile.currentXp -= amount;

    // XP nunca fica negativo
    if (profile.currentXp < 0) {
        profile.currentXp = 0;
    }

    saveUserProfile(profile);
    return profile;
}

export function getLevelTitle(level) {
    if (level < 5) return "Novato";
    if (level < 10) return "Aprendiz";
    if (level < 20) return "Explorador";
    if (level < 50) return "Mestre";
    return "Lenda";
}