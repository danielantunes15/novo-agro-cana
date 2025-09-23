document.addEventListener('DOMContentLoaded', async function() {
    const loadingElement = document.getElementById('loading');
    const contentElement = document.getElementById('content');
    const errorElement = document.getElementById('error-message');
    const funcionarioForm = document.getElementById('funcionario-form');
    const turmaForm = document.getElementById('turma-form');
    const funcionariosList = document.getElementById('funcionarios-list');
    const turmasList = document.getElementById('turmas-list');
    const turmaFuncionarioSelect = document.getElementById('turma-funcionario');

    // Máscaras para CPF e Telefone
    function aplicarMascaras() {
        const cpfInput = document.getElementById('cpf-funcionario');
        const telefoneInput = document.getElementById('telefone-funcionario');

        cpfInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            
            if (value.length <= 11) {
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            }
            
            e.target.value = value;
        });

        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            
            if (value.length === 11) {
                value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            } else if (value.length === 10) {
                value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
            }
            
            e.target.value = value;
        });
    }

    try {
        loadingElement.style.display = 'block';
        contentElement.style.display = 'none';
        errorElement.style.display = 'none';

        await testarConexaoSupabase();
        
        loadingElement.style.display = 'none';
        contentElement.style.display = 'block';

        aplicarMascaras();
        await carregarTurmasParaSelect();
        await carregarFuncionarios();
        await carregarTurmas();
        
        funcionarioForm.addEventListener('submit', salvarFuncionario);
        turmaForm.addEventListener('submit', salvarTurma);

    } catch (error) {
        console.error('Erro na inicialização:', error);
        loadingElement.style.display = 'none';
        errorElement.style.display = 'block';
    }

    async function testarConexaoSupabase() {
        try {
            const { data, error } = await supabase
                .from('funcionarios')
                .select('*')
                .limit(1);
                
            if (error) throw error;
            console.log('✅ Conexão com Supabase estabelecida (cadastros)');
            return true;
        } catch (error) {
            throw new Error(`Falha na conexão: ${error.message}`);
        }
    }

    function mostrarMensagem(mensagem, tipo = 'success') {
        const mensagensAntigas = document.querySelectorAll('.alert-message');
        mensagensAntigas.forEach(msg => msg.remove());

        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `alert-message ${tipo === 'error' ? 'alert-error' : 'alert-success'}`;
        mensagemDiv.innerHTML = `
            <div style="padding: 1rem; margin: 1rem 0; border-radius: 4px;">
                ${mensagem}
                <button onclick="this.parentElement.parentElement.remove()" style="float: right; background: none; border: none; font-size: 1.2rem; cursor: pointer;">×</button>
            </div>
        `;
        
        document.querySelector('.main .container').prepend(mensagemDiv);

        setTimeout(() => {
            if (mensagemDiv.parentElement) {
                mensagemDiv.remove();
            }
        }, 5000);
    }

    async function salvarFuncionario(e) {
        e.preventDefault();
        
        const nome = document.getElementById('nome-funcionario').value.trim();
        const cpf = document.getElementById('cpf-funcionario').value.replace(/\D/g, '');
        const nascimento = document.getElementById('nascimento-funcionario').value;
        const telefone = document.getElementById('telefone-funcionario').value.replace(/\D/g, '');
        const funcao = document.getElementById('funcao-funcionario').value;
        const turmaId = document.getElementById('turma-funcionario').value;
        
        if (!nome || !cpf || !nascimento || !funcao || !turmaId) {
            mostrarMensagem('Preencha todos os campos obrigatórios.', 'error');
            return;
        }

        if (cpf.length !== 11) {
            mostrarMensagem('CPF deve ter 11 dígitos.', 'error');
            return;
        }
        
        try {
            const { data, error } = await supabase
                .from('funcionarios')
                .insert([{
                    nome: nome,
                    cpf: cpf,
                    data_nascimento: nascimento,
                    telefone: telefone,
                    funcao: funcao,
                    turma: turmaId
                }])
                .select()
                .single();
                
            if (error) throw error;
            
            mostrarMensagem('Funcionário salvo com sucesso!');
            funcionarioForm.reset();
            await carregarFuncionarios();
            
        } catch (error) {
            console.error('Erro ao salvar funcionário:', error);
            mostrarMensagem('Erro ao salvar funcionário: ' + error.message, 'error');
        }
    }

    async function salvarTurma(e) {
        e.preventDefault();
        
        const nome = document.getElementById('nome-turma').value.trim();
        const encarregado = document.getElementById('encarregado-turma').value.trim();
        
        if (!nome) {
            mostrarMensagem('Informe o nome da turma.', 'error');
            return;
        }
        
        try {
            const { data, error } = await supabase
                .from('turmas')
                .insert([{
                    nome: nome,
                    encarregado: encarregado
                }])
                .select()
                .single();
                
            if (error) throw error;
            
            mostrarMensagem('Turma salva com sucesso!');
            turmaForm.reset();
            await carregarTurmasParaSelect();
            await carregarTurmas();
            
        } catch (error) {
            console.error('Erro ao salvar turma:', error);
            mostrarMensagem('Erro ao salvar turma: ' + error.message, 'error');
        }
    }

    async function carregarTurmasParaSelect() {
        try {
            const { data, error } = await supabase
                .from('turmas')
                .select('id, nome')
                .order('nome');
                
            if (error) throw error;
            
            turmaFuncionarioSelect.innerHTML = '<option value="">Selecione a turma</option>';
            data.forEach(turma => {
                const option = document.createElement('option');
                option.value = turma.id;
                option.textContent = turma.nome;
                turmaFuncionarioSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
        }
    }

    async function carregarFuncionarios() {
        try {
            const { data, error } = await supabase
                .from('funcionarios')
                .select(`
                    id,
                    nome,
                    cpf,
                    data_nascimento,
                    telefone,
                    funcao,
                    turmas(nome)
                `)
                .order('nome');
                
            if (error) throw error;
            
            if (data.length === 0) {
                funcionariosList.innerHTML = '<p>Nenhum funcionário cadastrado.</p>';
                return;
            }
            
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>CPF</th>
                            <th>Nascimento</th>
                            <th>Telefone</th>
                            <th>Função</th>
                            <th>Turma</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.forEach(funcionario => {
                const nascimento = new Date(funcionario.data_nascimento).toLocaleDateString('pt-BR');
                const telefone = funcionario.telefone ? 
                    funcionario.telefone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3') : 
                    'Não informado';
                
                html += `
                    <tr>
                        <td>${funcionario.nome}</td>
                        <td>${funcionario.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</td>
                        <td>${nascimento}</td>
                        <td>${telefone}</td>
                        <td>${formatarFuncao(funcionario.funcao)}</td>
                        <td>${funcionario.turmas?.nome || 'N/A'}</td>
                        <td>
                            <button class="btn-secondary" onclick="editarFuncionario('${funcionario.id}')">Editar</button>
                            <button class="btn-remove" onclick="excluirFuncionario('${funcionario.id}')" title="Excluir">
                                <i class="delete-icon">🗑️</i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            funcionariosList.innerHTML = html;
            
        } catch (error) {
            console.error('Erro ao carregar funcionários:', error);
            funcionariosList.innerHTML = '<p>Erro ao carregar funcionários.</p>';
        }
    }

    async function carregarTurmas() {
        try {
            const { data, error } = await supabase
                .from('turmas')
                .select('*')
                .order('nome');
                
            if (error) throw error;
            
            if (data.length === 0) {
                turmasList.innerHTML = '<p>Nenhuma turma cadastrada.</p>';
                return;
            }
            
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Encarregado</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.forEach(turma => {
                html += `
                    <tr>
                        <td>${turma.nome}</td>
                        <td>${turma.encarregado || 'Não definido'}</td>
                        <td>
                            <button class="btn-secondary" onclick="editarTurma('${turma.id}')">Editar</button>
                            <button class="btn-remove" onclick="excluirTurma('${turma.id}')" title="Excluir">
                                <i class="delete-icon">🗑️</i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            turmasList.innerHTML = html;
            
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
            turmasList.innerHTML = '<p>Erro ao carregar turmas.</p>';
        }
    }

    function formatarFuncao(funcao) {
        const funcoes = {
            'cortador': 'Cortador de Cana',
            'apontador': 'Apontador',
            'fiscal': 'Fiscal de Corte'
        };
        return funcoes[funcao] || funcao;
    }

    // Funções globais
    window.editarFuncionario = async function(id) {
        mostrarMensagem('Funcionalidade de edição em desenvolvimento.', 'error');
    };

    window.excluirFuncionario = async function(id) {
        if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;
        
        try {
            const { error } = await supabase
                .from('funcionarios')
                .delete()
                .eq('id', id);
                
            if (error) throw error;
            
            mostrarMensagem('Funcionário excluído com sucesso!');
            await carregarFuncionarios();
            
        } catch (error) {
            console.error('Erro ao excluir funcionário:', error);
            mostrarMensagem('Erro ao excluir funcionário: ' + error.message, 'error');
        }
    };

    window.editarTurma = async function(id) {
        mostrarMensagem('Funcionalidade de edição em desenvolvimento.', 'error');
    };

    window.excluirTurma = async function(id) {
        if (!confirm('Tem certeza que deseja excluir esta turma?')) return;
        
        try {
            const { error } = await supabase
                .from('turmas')
                .delete()
                .eq('id', id);
                
            if (error) throw error;
            
            mostrarMensagem('Turma excluída com sucesso!');
            await carregarTurmas();
            await carregarTurmasParaSelect();
            
        } catch (error) {
            console.error('Erro ao excluir turma:', error);
            mostrarMensagem('Erro ao excluir turma: ' + error.message, 'error');
        }
    };
});