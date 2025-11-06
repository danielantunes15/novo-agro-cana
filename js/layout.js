// js/layout.js
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const mainNav = document.getElementById('main-nav'); // A nav principal

    function toggleSidebar() {
        document.body.classList.toggle('sidebar-open');
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }

    // Lógica do botão "Sair" (movido do inline script para cá)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (window.sistemaAuth && typeof window.sistemaAuth.fazerLogout === 'function') {
                window.sistemaAuth.fazerLogout();
            } else {
                // Fallback
                localStorage.removeItem('usuarioLogado');
                window.location.href = 'login.html';
            }
        });
    }
    
    // Lógica do Título da Página (Bônus, mas muito bom)
    // Encontra o link 'active' e define o título da página
    const pageTitle = document.getElementById('page-title');
    if (pageTitle && mainNav) {
        const activeLink = mainNav.querySelector('.nav-link.active');
        if (activeLink) {
            // Pega o texto do link, removendo emojis se houver
            const linkText = activeLink.textContent.trim();
            pageTitle.textContent = linkText;
        } else {
            pageTitle.textContent = "Dashboard"; // Fallback
        }
    }
});