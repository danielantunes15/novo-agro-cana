// js/auth.js - Sistema de autenticação customizado
class SistemaAuth {
    constructor() {
        this.usuarioLogado = null;
        this.carregarUsuarioSalvo();
    }

    // Carregar usuário do localStorage
    carregarUsuarioSalvo() {
        const usuarioSalvo = localStorage.getItem('usuarioLogado');
        if (usuarioSalvo) {
            this.usuarioLogado = JSON.parse(usuarioSalvo);
        }
    }

    // Verificar se o usuário está autenticado
    verificarAutenticacao() {
        this.carregarUsuarioSalvo();
        return this.usuarioLogado;
    }

    // Fazer login
    async fazerLogin(username, senha) {
        try {
            // Fazer hash da senha para comparar
            const senhaHash = await this.hashSenha(senha);
            
            // Buscar usuário no banco
            const { data: usuarios, error } = await supabase
                .from('sistema_usuarios')
                .select('*')
                .eq('username', username)
                .eq('senha_hash', senhaHash)
                .eq('ativo', true)
                .maybeSingle();

            if (error) throw error;

            if (!usuarios) {
                throw new Error('Usuário ou senha incorretos');
            }

            // Salvar usuário logado (sem a senha)
            this.usuarioLogado = {
                id: usuarios.id,
                nome: usuarios.nome,
                username: usuarios.username,
                tipo: usuarios.tipo,
                ativo: usuarios.ativo
            };

            localStorage.setItem('usuarioLogado', JSON.stringify(this.usuarioLogado));
            
            return { success: true, usuario: this.usuarioLogado };

        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, error: error.message };
        }
    }

    // Fazer logout
    fazerLogout() {
        this.usuarioLogado = null;
        localStorage.removeItem('usuarioLogado');
        window.location.href = 'login.html';
    }

    // Função de hash (igual à usada no gerenciamento de usuários)
    async hashSenha(senha) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(senha + 'agrocana_salt_2024');
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        } catch (error) {
            console.error('Erro ao gerar hash:', error);
            return btoa(senha); // Fallback
        }
    }

    // Verificar se usuário é admin
    isAdmin() {
        return this.usuarioLogado && this.usuarioLogado.tipo === 'admin';
    }

    // Redirecionar se não estiver autenticado
    requerAutenticacao() {
        if (!this.verificarAutenticacao()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Redirecionar se não for admin
    requerAdmin() {
        if (!this.requerAutenticacao()) return false;
        if (!this.isAdmin()) {
            alert('Acesso restrito a administradores');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
}

// Instância global
window.sistemaAuth = new SistemaAuth();