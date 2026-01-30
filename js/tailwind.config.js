// js/tailwind.config.js
tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF6B35',    // Ação principal (Botões, CTA)
          purple: '#A855F7',    // XP / Gamificação
          yellow: '#FACC15',    // Destaques / Badges
          dark: '#111827',      // Textos / Bordas
          light: '#FAFAFA',     // Fundo da página
          surface: '#FFFFFF'    // Fundo dos cards
        }
      },
      fontFamily: {
        // Use 'font-display' para Títulos (H1, H2)
        display: ['Space Grotesk', 'sans-serif'],
        // Use 'font-body' para textos longos
        body: ['Inter', 'sans-serif']
      },
      boxShadow: {
        // Sombra padrão (Cards estáticos)
        'neo': '4px 4px 0px 0px #111827',
        // Sombra menor (Botões secundários)
        'neo-sm': '2px 2px 0px 0px #111827',
        // Estado de Hover (parece que o botão foi apertado)
        'neo-pressed': '1px 1px 0px 0px #111827',
      },
      borderWidth: {
        '3': '3px', // Grossura padrão das nossas bordas
      }
    }
  }
}