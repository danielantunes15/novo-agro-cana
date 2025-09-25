// js/gerenciamento-usuarios.js

document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticação e permissões
    if (!await verificarPermissoes()) return;

    // Elementos do DOM
    const logoutBtn = document.getElementById('logout-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const usuariosBody = document.getElementById('usuarios-body');
    const formNovoUsuario = document.getElementById('form-novo-usuario');
    const formMeuPerfil = document.getElementById('form-meu-perfil');
    const modalEditar = document.getElementById('modal-editar');
    const formEditarUsuario = document.getElementById('form-editar-usuario');
    const fecharModalBtn = document.getElementById('fechar-modal');
    const closeModalSpan = document.querySelector('.close');

    // Event Listeners
    logoutBtn.addEventListener('click', logout);
    
    // Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Forms
    formNovoUsuario.addEventListener('submit', criarUsuario);
    formMeuPerfil.addEventListener('submit', atualizarMeuPerfil);
    formEditarUsuario.addEventListener('submit', salvarEdicaoUsuario);

    // Modal
    fecharModalBtn.addEventListener('click', fecharModal);
    closeModalSpan.addEventListener('click', fecharModal);
    window.addEventListener('click', (e) => {
        if (e.target === modalEditar) fecharModal();
    });

    // Carregar dados iniciais
    await carregarListaUsuarios();
    await carregarMeuPerfil();

    console.log('Gerenciamento de usuários inicializado');

    // Função para verificar permissões
    async function verificarPermissoes() {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            window.location.href = 'login.html';
            return false;
        }

        // Verificar se é admin
        const user = session.user;
        const { data: perfil } = await supabase
            .from('profiles')
            .select('tipo, ativo')
            .eq('id', user.id)
            .single();

        if (!perfil?.ativo) {
            alert('Sua conta está desativada.');
            await logout();
            return false;
        }

        if (perfil.tipo !== 'admin') {
            alert('Acesso negado. Apenas administradores podem gerenciar usuários.');
            window.location.href = 'index.html';
            return false;
        }

        return true;
    }

    // Função para logout
    async function logout() {
        try {
            await supabase.auth.signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    }

    // Função para alternar entre abas
    function switchTab(tabId) {
        // Remover active de todas as abas e conteúdos
        tabBtns.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Ativar aba e conteúdo selecionados
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
    }

    // Função para carregar lista de usuários
    async function carregarListaUsuarios() {
        try {
            const { data: usuarios, error } = await supabase
                .from('profiles')
                .select('id, nome, username, tipo, ativo, created_at')
                .neq('hidden', true) // Excluir usuários ocultos
                .order('created_at', { ascending: false });

            if (error) throw error;

            usuariosBody.innerHTML = '';

            if (!usuarios || usuarios.length === 0) {
                usuariosBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum usuário encontrado</td></tr>';
                return;
            }

            usuarios.forEach(usuario => {
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td>${usuario.nome || 'N/A'}</td>
                    <td>${usuario.username}</td>
                    <td>${usuario.tipo === 'admin' ? 'Administrador' : 'Usuário Normal'}</td>
                    <td>
                        <span class="status-badge ${usuario.ativo ? 'active' : 'inactive'}">
                            ${usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                    </td>
                    <td>
                        <button class="btn-edit" data-id="${usuario.id}">Editar</button>
                        ${usuario.tipo !== 'admin' ? 
                            `<button class="btn-toggle" data-id="${usuario.id}" data-active="${usuario.ativo}">
                                ${usuario.ativo ? 'Desativar' : 'Ativar'}
                            </button>` : 
                            ''
                        }
                    </td>
                `;

                usuariosBody.appendChild(tr);
            });

            // Adicionar eventos aos botões
            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', () => abrirModalEditar(btn.getAttribute('data-id')));
            });

            document.querySelectorAll('.btn-toggle').forEach(btn => {
                btn.addEventListener('click', () => toggleUsuario(
                    btn.getAttribute('data-id'), 
                    btn.getAttribute('data-active') === 'true'
                ));
            });

        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            mostrarMensagem('Erro ao carregar lista de usuários', 'error');
        }
    }

    // Função para carregar dados do meu perfil
    async function carregarMeuPerfil() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: perfil, error } = await supabase
                .from('profiles')
                .select('nome, username')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            document.getElementById('perfil-nome').value = perfil.nome || '';
            document.getElementById('perfil-username').value = perfil.username;

        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            mostrarMensagem('Erro ao carregar dados do perfil', 'error');
        }
    }

    // Função para criar novo usuário
    async function criarUsuario(e) {
        e.preventDefault();

        const nome = document.getElementById('novo-nome').value.trim();
        const username = document.getElementById('novo-username').value.trim();
        const senha = document.getElementById('nova-senha').value;
        const tipo = document.getElementById('tipo-usuario').value;

        if (!nome || !username || !senha) {
            mostrarMensagem('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        if (senha.length < 6) {
            mostrarMensagem('A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        try {
            // Verificar se username já existe
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username)
                .maybeSingle();

            if (existing) {
                mostrarMensagem('Username já está em uso', 'error');
                return;
            }

            // Criar usuário no Auth
            const email = `${username}@agrocanaforte.com`;
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: senha
            });

            if (authError) throw authError;

            // Criar perfil do usuário
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    nome: nome,
                    username: username,
                    email: email,
                    tipo: tipo,
                    ativo: true
                });

            if (profileError) throw profileError;

            mostrarMensagem('Usuário criado com sucesso!');
            formNovoUsuario.reset();
            await carregarListaUsuarios();

        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            mostrarMensagem('Erro ao criar usuário: ' + error.message, 'error');
        }
    }

    // Função para atualizar meu perfil
    async function atualizarMeuPerfil(e) {
        e.preventDefault();

        const nome = document.getElementById('perfil-nome').value.trim();
        const username = document.getElementById('perfil-username').value.trim();
        const novaSenha = document.getElementById('nova-senha-perfil').value;

        if (!nome || !username) {
            mostrarMensagem('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Verificar se username já existe (excluindo o próprio usuário)
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username)
                .neq('id', user.id)
                .maybeSingle();

            if (existing) {
                mostrarMensagem('Username já está em uso', 'error');
                return;
            }

            // Atualizar perfil
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ nome, username })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Atualizar senha se fornecida
            if (novaSenha) {
                if (novaSenha.length < 6) {
                    mostrarMensagem('A senha deve ter pelo menos 6 caracteres', 'error');
                    return;
                }

                const { error: passwordError } = await supabase.auth.updateUser({
                    password: novaSenha
                });

                if (passwordError) throw passwordError;
            }

            mostrarMensagem('Perfil atualizado com sucesso!');
            document.getElementById('nova-senha-perfil').value = '';

        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            mostrarMensagem('Erro ao atualizar perfil: ' + error.message, 'error');
        }
    }

    // Função para abrir modal de edição
    async function abrirModalEditar(userId) {
        try {
            const { data: usuario, error } = await supabase
                .from('profiles')
                .select('id, nome, username, tipo, ativo')
                .eq('id', userId)
                .single();

            if (error) throw error;

            document.getElementById('editar-id').value = usuario.id;
            document.getElementById('editar-nome').value = usuario.nome || '';
            document.getElementById('editar-username').value = usuario.username;
            document.getElementById('editar-tipo').value = usuario.tipo;
            document.getElementById('editar-ativo').checked = usuario.ativo;

            modalEditar.style.display = 'block';

        } catch (error) {
            console.error('Erro ao carregar usuário para edição:', error);
            mostrarMensagem('Erro ao carregar dados do usuário', 'error');
        }
    }

    // Função para fechar modal
    function fecharModal() {
        modalEditar.style.display = 'none';
        formEditarUsuario.reset();
    }

    // Função para salvar edição do usuário
    async function salvarEdicaoUsuario(e) {
        e.preventDefault();

        const id = document.getElementById('editar-id').value;
        const nome = document.getElementById('editar-nome').value.trim();
        const username = document.getElementById('editar-username').value.trim();
        const tipo = document.getElementById('editar-tipo').value;
        const ativo = document.getElementById('editar-ativo').checked;

        if (!nome || !username) {
            mostrarMensagem('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        try {
            // Verificar se username já existe (excluindo o próprio usuário)
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username)
                .neq('id', id)
                .maybeSingle();

            if (existing) {
                mostrarMensagem('Username já está em uso', 'error');
                return;
            }

            // Atualizar usuário
            const { error } = await supabase
                .from('profiles')
                .update({ nome, username, tipo, ativo })
                .eq('id', id);

            if (error) throw error;

            mostrarMensagem('Usuário atualizado com sucesso!');
            fecharModal();
            await carregarListaUsuarios();

        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            mostrarMensagem('Erro ao atualizar usuário: ' + error.message, 'error');
        }
    }

    // Função para ativar/desativar usuário
    async function toggleUsuario(userId, currentlyActive) {
        if (!confirm(`Tem certeza que deseja ${currentlyActive ? 'desativar' : 'ativar'} este usuário?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ ativo: !currentlyActive })
                .eq('id', userId);

            if (error) throw error;

            mostrarMensagem(`Usuário ${currentlyActive ? 'desativado' : 'ativado'} com sucesso!`);
            await carregarListaUsuarios();

        } catch (error) {
            console.error('Erro ao alterar status do usuário:', error);
            mostrarMensagem('Erro ao alterar status do usuário', 'error');
        }
    }

    // Função para mostrar mensagens
    function mostrarMensagem(mensagem, tipo = 'success') {
        // Remover mensagens anteriores
        const mensagensAntigas = document.querySelectorAll('.alert-message');
        mensagensAntigas.forEach(msg => msg.remove());

        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `alert-message ${tipo === 'error' ? 'alert-error' : 'alert-success'}`;
        mensagemDiv.innerHTML = `
            <div style="padding: 1rem; margin: 1rem 0; border-radius: 4px; 
                       ${tipo === 'error' ? 'background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' : 
                         'background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb;'}">
                ${mensagem}
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="float: right; background: none; border: none; font-size: 1.2rem; cursor: pointer;">×</button>
            </div>
        `;
        
        document.querySelector('.main .container').prepend(mensagemDiv);

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (mensagemDiv.parentElement) {
                mensagemDiv.remove();
            }
        }, 5000);
    }
});

// Função global para logout
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('Erro ao fazer logout: ' + error.message);
    }
}