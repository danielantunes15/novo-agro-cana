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
        const { data: perfil, error } = await supabase
            .from('profiles')
            .select('tipo, ativo')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Erro ao verificar permissões:', error);
            mostrarMensagem('Erro ao verificar permissões', 'error');
            return false;
        }

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
            mostrarMensagem('Erro ao fazer logout', 'error');
        }
    }

    // Função para alternar entre abas
    function switchTab(tabId) {
        tabBtns.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
    }

    // Função para carregar lista de usuários
    async function carregarListaUsuarios() {
        try {
            usuariosBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Carregando...</td></tr>';

            const { data: usuarios, error } = await supabase
                .from('profiles')
                .select('id, nome, username, tipo, ativo, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;

            usuariosBody.innerHTML = '';

            if (!usuarios || usuarios.length === 0) {
                usuariosBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum usuário encontrado</td></tr>';
                return;
            }

            const { data: { user: currentUser } } = await supabase.auth.getUser();

            usuarios.forEach(usuario => {
                const tr = document.createElement('tr');
                const isCurrentUser = usuario.id === currentUser.id;
                
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
                        ${!isCurrentUser ? 
                            `<button class="btn-toggle ${!usuario.ativo ? 'inactive' : ''}" 
                                data-id="${usuario.id}" data-active="${usuario.ativo}">
                                ${usuario.ativo ? 'Desativar' : 'Ativar'}
                            </button>
                            <button class="btn-delete" data-id="${usuario.id}" data-nome="${usuario.nome}">
                                Excluir
                            </button>` : 
                            '<span style="color: #6c757d;">Usuário atual</span>'
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

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', () => excluirUsuario(
                    btn.getAttribute('data-id'),
                    btn.getAttribute('data-nome')
                ));
            });

        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            mostrarMensagem('Erro ao carregar lista de usuários', 'error');
            usuariosBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #dc3545;">Erro ao carregar usuários</td></tr>';
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
            document.getElementById('perfil-username').value = perfil.username || '';

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

            if (profileError) {
                // Se der erro no profile, tentar excluir o usuário do auth
                await supabase.auth.admin.deleteUser(authData.user.id);
                throw profileError;
            }

            mostrarMensagem('Usuário criado com sucesso!', 'success');
            formNovoUsuario.reset();
            await carregarListaUsuarios();
            switchTab('lista-usuarios');

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
        const confirmarSenha = document.getElementById('confirmar-senha-perfil').value;

        if (!nome || !username) {
            mostrarMensagem('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        if (novaSenha && novaSenha !== confirmarSenha) {
            mostrarMensagem('As senhas não coincidem', 'error');
            return;
        }

        if (novaSenha && novaSenha.length < 6) {
            mostrarMensagem('A senha deve ter pelo menos 6 caracteres', 'error');
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
                const { error: passwordError } = await supabase.auth.updateUser({
                    password: novaSenha
                });

                if (passwordError) throw passwordError;
            }

            mostrarMensagem('Perfil atualizado com sucesso!', 'success');
            document.getElementById('nova-senha-perfil').value = '';
            document.getElementById('confirmar-senha-perfil').value = '';

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
            document.getElementById('editar-username').value = usuario.username || '';
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

            mostrarMensagem('Usuário atualizado com sucesso!', 'success');
            fecharModal();
            await carregarListaUsuarios();

        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            mostrarMensagem('Erro ao atualizar usuário: ' + error.message, 'error');
        }
    }

    // Função para ativar/desativar usuário
    async function toggleUsuario(userId, currentlyActive) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (userId === currentUser.id) {
            mostrarMensagem('Você não pode desativar sua própria conta', 'error');
            return;
        }

        if (!confirm(`Tem certeza que deseja ${currentlyActive ? 'desativar' : 'ativar'} este usuário?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ ativo: !currentlyActive })
                .eq('id', userId);

            if (error) throw error;

            mostrarMensagem(`Usuário ${currentlyActive ? 'desativado' : 'ativado'} com sucesso!`, 'success');
            await carregarListaUsuarios();

        } catch (error) {
            console.error('Erro ao alterar status do usuário:', error);
            mostrarMensagem('Erro ao alterar status do usuário', 'error');
        }
    }

    // Função para excluir usuário
    async function excluirUsuario(userId, userName) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (userId === currentUser.id) {
            mostrarMensagem('Você não pode excluir sua própria conta', 'error');
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            // Excluir do Supabase Auth (requer permissões de admin)
            const { error: authError } = await supabase.auth.admin.deleteUser(userId);
            
            if (authError) {
                // Se não conseguir excluir do auth, apenas marcar como inativo
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ ativo: false })
                    .eq('id', userId);
                
                if (profileError) throw profileError;
                
                mostrarMensagem('Usuário desativado (não foi possível excluir completamente)', 'success');
            } else {
                // Excluir do profiles também
                const { error: profileError } = await supabase
                    .from('profiles')
                    .delete()
                    .eq('id', userId);
                
                if (profileError) throw profileError;
                
                mostrarMensagem('Usuário excluído com sucesso!', 'success');
            }

            await carregarListaUsuarios();

        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            mostrarMensagem('Erro ao excluir usuário: ' + error.message, 'error');
        }
    }

    // Função para mostrar mensagens
    function mostrarMensagem(mensagem, tipo = 'success') {
        const alertContainer = document.getElementById('alert-container');
        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `alert-message ${tipo === 'error' ? 'alert-error' : 'alert-success'}`;
        mensagemDiv.innerHTML = `
            ${mensagem}
            <button class="close-alert" onclick="this.parentElement.remove()">×</button>
        `;
        
        alertContainer.appendChild(mensagemDiv);

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