// 1. INICIALIZA O AOS
AOS.init({ duration: 800, once: true, offset: 50 });

// 2. INICIALIZA O LENIS
const lenis = new Lenis({
    duration: 2.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true
});
function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// FUNÇÃO DE SCROLL SUAVE PARA ÂNCORAS
function smoothScrollTo(e, targetId) {
    e.preventDefault();
    lenis.scrollTo(targetId);
}

// 3. CURSOR PERSONALIZADO
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');
window.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;
    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;
    cursorOutline.animate({ left: `${posX}px`, top: `${posY}px` }, { duration: 500, fill: "forwards" });
});
const hoverTriggers = document.querySelectorAll('.hover-trigger, a, button');
hoverTriggers.forEach(trigger => {
    trigger.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
    trigger.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
});

// 4. HEADER CAMALEÃO (OBSERVA TODAS AS SEÇÕES)
const navbar = document.getElementById('navbar');
// Seleciona todas as seções principais
const sections = document.querySelectorAll('main, section, footer');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Verifica se a seção tem o atributo data-header="dark"
            if (entry.target.getAttribute('data-header') === 'dark') {
                navbar.classList.add('dark-mode');
            } else {
                navbar.classList.remove('dark-mode');
            }
        }
    });
}, { threshold: .9 }); // Ativa quando 20% da seção estiver visível

sections.forEach(section => observer.observe(section));