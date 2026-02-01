import '../modules/client.js';
import { signIn, signUp, getCurrentUser } from '../modules/auth.js';

// 1. Se já estiver logado, manda direto pro DASHBOARD (não index)
async function checkAlreadyLoggedIn() {
    const user = await getCurrentUser();
    if (user) {
        window.location.href = 'dashboard.html'; // <--- AQUI MUDOU
    }
}

function setupAuthLogic() {
    const form = document.getElementById('auth-form');
    const btnSwitch = document.getElementById('btn-auth-switch');
    const nameContainer = document.getElementById('field-name-container');
    const titleText = document.getElementById('auth-switch-text');
    const btnSubmit = document.getElementById('btn-auth-submit');
    const errorBox = document.getElementById('auth-error');

    let isLoginMode = true;

    btnSwitch.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        nameContainer.classList.toggle('hidden');
        
        if (isLoginMode) {
            btnSubmit.innerText = "Entrar na Conta";
            titleText.innerText = "Ainda não tem conta?";
            btnSwitch.innerText = "Criar agora";
            document.querySelector('[name="name"]').required = false;
        } else {
            btnSubmit.innerText = "Criar Conta Grátis";
            titleText.innerText = "Já tem conta?";
            btnSwitch.innerText = "Fazer Login";
            document.querySelector('[name="name"]').required = true;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        const name = formData.get('name');

        btnSubmit.disabled = true;
        btnSubmit.innerText = "Carregando...";
        errorBox.classList.add('hidden');

        try {
            if (isLoginMode) {
                await signIn(email, password);
            } else {
                await signUp(email, password, name);
                alert("Conta criada! Redirecionando...");
            }
            
            // 2. SUCESSO! Manda pro DASHBOARD (não index)
            window.location.href = 'dashboard.html'; // <--- AQUI MUDOU TAMBÉM

        } catch (error) {
            console.error(error);
            errorBox.innerText = error.message.includes('Invalid login') 
                ? "Email ou senha incorretos." 
                : "Erro ao conectar: " + error.message;
            errorBox.classList.remove('hidden');
            btnSubmit.disabled = false;
            btnSubmit.innerText = isLoginMode ? "Entrar na Conta" : "Criar Conta Grátis";
        }
    });
}

checkAlreadyLoggedIn();
setupAuthLogic();