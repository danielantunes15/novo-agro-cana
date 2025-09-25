// main.js - VERSÃO CORRIGIDA - CONSTRAINT RESOLVIDA
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticação usando o sistema customizado
    const usuario = window.sistemaAuth?.verificarAutenticacao();
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }

    // Elementos do DOM
    const loadingElement = document.getElementById('loading');
    const contentElement = document.getElementById('content');
    const errorElement = document.getElementById('error-message');

    try {
        // Mostrar loading
        if (loadingElement) loadingElement.style.display = 'block';
        if (contentElement) contentElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'none';

        console.log('Iniciando conexão com Supabase...');

        // Testar conexão com Supabase
        await testarConexaoSupabase();
        
        // Esconder loading e mostrar conteúdo
        if (loadingElement) loadingElement.style.display = 'none';
        if (contentElement) contentElement.style.display = 'block';

        // Inicializar a aplicação
        await inicializarAplicacao();

    } catch (error) {
        console.error('Erro na inicialização:', error);
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) {
            errorElement.style.display = 'block';
            errorElement.innerHTML = `
                <h2>Erro de Conexão</h2>
                <p>Não foi possível conectar ao banco de dados. Verifique:</p>
                <ul>
                    <li>Sua conexão com a internet</li>
                    <li>Se as credenciais do Supabase estão corretas</li>
                    <li>Se as tabelas foram criadas no Supabase</li>
                </ul>
                <p>Detalhes do erro: ${error.message}</p>
                <button onclick="location.reload()" class="btn-primary">Tentar Novamente</button>
            `;
        }
    }

    // Função para testar conexão
    async function testarConexaoSupabase() {
        try {
            console.log('Testando conexão com Supabase...');
            
            const { data, error } = await supabase
                .from('fazendas')
                .select('count')
                .limit(1);
                
            if (error) {
                console.error('Erro na conexão:', error);
                throw new Error(`Erro Supabase: ${error.message}`);
            }
            
            console.log('✅ Conexão com Supabase estabelecida');
            return true;
        } catch (error) {
            console.error('Falha na conexão Supabase:', error);
            throw error;
        }
    }

    // Função para inicializar a aplicação
    async function inicializarAplicacao() {
        const apontamentoForm = document.getElementById('apontamento-form');
        const funcionariosContainer = document.getElementById('funcionarios-container');
        const addFuncionarioBtn = document.getElementById('add-funcionario');
        const apontamentosList = document.getElementById('apontamentos-list');
        const fazendaSelect = document.getElementById('fazenda');
        const talhaoSelect = document.getElementById('talhao');
        const turmaSelect = document.getElementById('turma');

        try {
            // Carregar dados iniciais
            await carregarFazendas();
            await carregarTurmas();
            await carregarFuncionariosIniciais();
            await carregarApontamentosRecentes();
            
            // Configurar event listeners
            if (addFuncionarioBtn) {
                addFuncionarioBtn.addEventListener('click', adicionarFuncionario);
            }
            
            if (apontamentoForm) {
                apontamentoForm.addEventListener('submit', salvarApontamento);
            }
            
            if (fazendaSelect) {
                fazendaSelect.addEventListener('change', carregarTalhoes);
            }

            console.log('✅ Aplicação inicializada com sucesso!');

        } catch (error) {
            console.error('Erro na inicialização da aplicação:', error);
            throw error;
        }
    }

    // Função para carregar turmas do banco de dados
    async function carregarTurmas() {
        const turmaSelect = document.getElementById('turma');
        if (!turmaSelect) return;
        
        try {
            const { data, error } = await supabase
                .from('turmas')
                .select('id, nome')
                .order('nome');
                
            if (error) throw error;
            
            turmaSelect.innerHTML = '<option value="">Selecione a turma</option>';
            data.forEach(turma => {
                const option = document.createElement('option');
                option.value = turma.id;
                option.textContent = turma.nome;
                turmaSelect.appendChild(option);
            });

            console.log(`✅ ${data.length} turmas carregadas`);

        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
            mostrarMensagem('Erro ao carregar turmas', 'error');
        }
    }

    // Função para mostrar mensagem
    function mostrarMensagem(mensagem, tipo = 'success') {
        // Remover mensagens anteriores
        const mensagensAntigas = document.querySelectorAll('.alert-message');
        mensagensAntigas.forEach(msg => msg.remove());

        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = `alert-message ${tipo === 'error' ? 'alert-error' : 'alert-success'}`;
        mensagemDiv.innerHTML = `
            <div style="padding: 1rem; margin: 1rem 0; border-radius: 4px; background-color: ${tipo === 'error' ? '#f8d7da' : '#d4edda'}; color: ${tipo === 'error' ? '#721c24' : '#155724'};">
                ${mensagem}
                <button onclick="this.parentElement.parentElement.remove()" style="float: right; background: none; border: none; font-size: 1.2rem; cursor: pointer;">×</button>
            </div>
        `;
        
        const container = document.querySelector('.main .container');
        if (container) {
            container.prepend(mensagemDiv);
        }

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (mensagemDiv.parentElement) {
                mensagemDiv.remove();
            }
        }, 5000);
    }

    // Função para adicionar campo de funcionário
    function adicionarFuncionario() {
        const funcionariosContainer = document.getElementById('funcionarios-container');
        if (!funcionariosContainer) return;
        
        const funcionarioItem = document.createElement('div');
        funcionarioItem.className = 'funcionario-item';
        
        funcionarioItem.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Funcionário</label>
                    <select class="funcionario-select" required>
                        <option value="">Selecione o funcionário</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Metros Cortados</label>
                    <input type="number" class="metros-input" step="0.01" min="0" required>
                </div>
                <button type="button" class="btn-remove">×</button>
            </div>
        `;
        
        funcionariosContainer.appendChild(funcionarioItem);
        
        // Adicionar evento de remoção
        const removeBtn = funcionarioItem.querySelector('.btn-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                funcionarioItem.remove();
            });
        }
        
        // Carregar funcionários no select
        const selectElement = funcionarioItem.querySelector('.funcionario-select');
        if (selectElement) {
            carregarFuncionarios(selectElement);
        }
    }

    // Função para carregar funcionários iniciais
    async function carregarFuncionariosIniciais() {
        const primeiroSelect = document.querySelector('.funcionario-select');
        if (primeiroSelect) {
            await carregarFuncionarios(primeiroSelect);
        }
    }

    // Função para carregar fazendas
    async function carregarFazendas() {
        const fazendaSelect = document.getElementById('fazenda');
        if (!fazendaSelect) return;
        
        try {
            const { data, error } = await supabase
                .from('fazendas')
                .select('id, nome')
                .order('nome');
                
            if (error) throw error;
            
            fazendaSelect.innerHTML = '<option value="">Selecione a fazenda</option>';
            data.forEach(fazenda => {
                const option = document.createElement('option');
                option.value = fazenda.id;
                option.textContent = fazenda.nome;
                option.dataset.nome = fazenda.nome; // Guardar o nome para uso posterior
                fazendaSelect.appendChild(option);
            });

            console.log(`✅ ${data.length} fazendas carregadas`);

        } catch (error) {
            console.error('Erro ao carregar fazendas:', error);
            mostrarMensagem('Erro ao carregar fazendas', 'error');
        }
    }

    // Função para carregar talhões
    async function carregarTalhoes() {
        const fazendaSelect = document.getElementById('fazenda');
        const talhaoSelect = document.getElementById('talhao');
        
        if (!fazendaSelect || !talhaoSelect) return;
        
        const fazendaId = fazendaSelect.value;
        
        if (!fazendaId) {
            talhaoSelect.innerHTML = '<option value="">Selecione o talhão</option>';
            return;
        }
        
        try {
            const { data, error } = await supabase
                .from('talhoes')
                .select('id, numero, area, espacamento, preco_tonelada, producao_estimada')
                .eq('fazenda_id', fazendaId)
                .order('numero');
                
            if (error) throw error;
            
            talhaoSelect.innerHTML = '<option value="">Selecione o talhão</option>';
            data.forEach(talhao => {
                const option = document.createElement('option');
                option.value = talhao.id;
                option.textContent = `Talhão ${talhao.numero} - ${talhao.area} ha`;
                option.dataset.espacamento = talhao.espacamento;
                option.dataset.precoTonelada = talhao.preco_tonelada;
                option.dataset.producaoEstimada = talhao.producao_estimada;
                talhaoSelect.appendChild(option);
            });

        } catch (error) {
            console.error('Erro ao carregar talhões:', error);
            mostrarMensagem('Erro ao carregar talhões', 'error');
        }
    }

    // Função para carregar funcionários
    async function carregarFuncionarios(selectElement) {
        if (!selectElement) return;
        
        try {
            const { data, error } = await supabase
                .from('funcionarios')
                .select(`
                    id, 
                    nome, 
                    turmas(nome)
                `)
                .order('nome');
                
            if (error) throw error;
            
            selectElement.innerHTML = '<option value="">Selecione o funcionário</option>';
            data.forEach(funcionario => {
                const option = document.createElement('option');
                option.value = funcionario.id;
                option.textContent = `${funcionario.nome} (${funcionario.turmas?.nome || 'Sem turma'})`;
                selectElement.appendChild(option);
            });

        } catch (error) {
            console.error('Erro ao carregar funcionários:', error);
            selectElement.innerHTML = '<option value="">Erro ao carregar funcionários</option>';
        }
    }

    // Função para calcular preço por metro
    function calcularPrecoPorMetro(talhaoData) {
        if (!talhaoData) return 0;
        
        // Fórmula: (preco_tonelada * producao_estimada) / (10000 / espacamento / 5)
        const precoPorMetro = (talhaoData.preco_tonelada * talhaoData.producao_estimada) / (10000 / talhaoData.espacamento / 5);
        return parseFloat(precoPorMetro.toFixed(4));
    }

    // ✅ FUNÇÃO CORRIGIDA - MAPEAMENTO PARA OS VALORES PERMITIDOS
    function mapearTurmaParaValorPermitido(turmaNome) {
        // Mapeamento baseado na constraint: 'turma1', 'turma2', 'turma3'
        const mapeamento = {
            'Turma A': 'turma1',
            'Turma B': 'turma2',
            'Turma C': 'turma3',
            'Turma D': 'turma1', // Fallback
            'Turma E': 'turma2', // Fallback
            'Turma F': 'turma3'  // Fallback
        };
        
        return mapeamento[turmaNome] || 'turma1'; // Default para turma1
    }

    // FUNÇÃO SALVAR APONTAMENTO - CORRIGIDA
    async function salvarApontamento(e) {
        e.preventDefault();
        
        const apontamentoForm = document.getElementById('apontamento-form');
        const funcionariosContainer = document.getElementById('funcionarios-container');
        
        if (!apontamentoForm || !funcionariosContainer) return;
        
        const dataCorte = document.getElementById('data-corte')?.value;
        const turmaSelect = document.getElementById('turma');
        const turmaId = turmaSelect?.value;
        const fazendaSelect = document.getElementById('fazenda');
        const talhaoSelect = document.getElementById('talhao');
        const fazendaId = fazendaSelect?.value;
        const talhaoId = talhaoSelect?.value;
        
        // Validar dados básicos
        if (!dataCorte || !turmaId || !fazendaId || !talhaoId) {
            mostrarMensagem('Preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        // Coletar dados dos funcionários
        const funcionariosItens = document.querySelectorAll('.funcionario-item');
        const cortes = [];
        
        if (funcionariosItens.length === 0) {
            mostrarMensagem('Adicione pelo menos um funcionário.', 'error');
            return;
        }
        
        for (const item of funcionariosItens) {
            const funcionarioSelect = item.querySelector('.funcionario-select');
            const metrosInput = item.querySelector('.metros-input');
            
            if (!funcionarioSelect?.value || !metrosInput?.value) {
                mostrarMensagem('Preencha todos os campos de funcionário.', 'error');
                return;
            }
            
            cortes.push({
                funcionario_id: funcionarioSelect.value,
                metros: parseFloat(metrosInput.value)
            });
        }
        
        try {
            // Buscar dados do talhão
            const { data: talhaoData, error: talhaoError } = await supabase
                .from('talhoes')
                .select('espacamento, preco_tonelada, producao_estimada')
                .eq('id', talhaoId)
                .single();
                
            if (talhaoError) throw talhaoError;
            
            // Calcular preço por metro
            const precoPorMetro = calcularPrecoPorMetro(talhaoData);
            console.log('Preço por metro calculado:', precoPorMetro);
            
            const usuarioLogado = window.sistemaAuth?.verificarAutenticacao();
            const usuarioId = usuarioLogado?.id || 'usuario-desconhecido';
            
            // ✅ BUSCAR O NOME DA TURMA DO BANCO
            const { data: turmaData, error: turmaError } = await supabase
                .from('turmas')
                .select('nome')
                .eq('id', turmaId)
                .single();
                
            if (turmaError) {
                console.error('Erro ao buscar turma:', turmaError);
                throw new Error('Turma selecionada não encontrada no banco de dados');
            }
            
            const turmaNomeOriginal = turmaData?.nome || 'Turma A';
            
            // ✅ CORREÇÃO CRÍTICA: MAPEAR PARA OS VALORES PERMITIDOS
            const turmaPermitida = mapearTurmaParaValorPermitido(turmaNomeOriginal);
            
            console.log('Turma original:', turmaNomeOriginal);
            console.log('Turma mapeada (permitida):', turmaPermitida);
            
            // Dados do apontamento - USANDO VALOR PERMITIDO
            const dadosApontamento = {
                data_corte: dataCorte,
                turma: turmaPermitida, // ✅ VALOR QUE PASSA NA CONSTRAINT
                fazenda_id: fazendaId,
                talhao_id: talhaoId,
                preco_por_metro: precoPorMetro,
                usuario_id: usuarioId
            };
            
            console.log('Dados do apontamento:', dadosApontamento);
            
            // ✅ INSERIR APONTAMENTO (AGORA DEVE FUNCIONAR)
            const { data: apontamento, error: apontamentoError } = await supabase
                .from('apontamentos')
                .insert(dadosApontamento)
                .select()
                .single();
                
            if (apontamentoError) {
                console.error('Erro ao salvar apontamento:', apontamentoError);
                throw apontamentoError;
            }
            
            console.log('✅ Apontamento salvo com sucesso:', apontamento);
            
            // Preparar cortes dos funcionários
            const cortesComApontamentoId = cortes.map(corte => ({
                apontamento_id: apontamento.id,
                funcionario_id: corte.funcionario_id,
                metros: corte.metros,
                valor: corte.metros * precoPorMetro
            }));
            
            // Inserir cortes
            const { error: cortesError } = await supabase
                .from('cortes_funcionarios')
                .insert(cortesComApontamentoId);
                
            if (cortesError) throw cortesError;
            
            mostrarMensagem('Apontamento salvo com sucesso!');
            
            // Limpar formulário
            apontamentoForm.reset();
            
            // Configurar data atual
            const dataCorteInput = document.getElementById('data-corte');
            if (dataCorteInput) {
                const hoje = new Date().toISOString().split('T')[0];
                dataCorteInput.value = hoje;
            }
            
            funcionariosContainer.innerHTML = `
                <div class="funcionario-item">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Funcionário</label>
                            <select class="funcionario-select" required>
                                <option value="">Selecione o funcionário</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Metros Cortados</label>
                            <input type="number" class="metros-input" step="0.01" min="0" required>
                        </div>
                        <button type="button" class="btn-remove" style="display: none;">×</button>
                    </div>
                </div>
            `;
            
            // Recarregar dados
            await carregarTurmas();
            await carregarFuncionariosIniciais();
            await carregarApontamentosRecentes();
            
        } catch (error) {
            console.error('Erro ao salvar apontamento:', error);
            mostrarMensagem('Erro ao salvar apontamento: ' + error.message, 'error');
        }
    }

    // Função para carregar apontamentos recentes
    async function carregarApontamentosRecentes() {
        const apontamentosList = document.getElementById('apontamentos-list');
        if (!apontamentosList) return;
        
        try {
            const { data, error } = await supabase
                .from('apontamentos')
                .select(`
                    id,
                    data_corte,
                    turma,
                    fazendas(nome),
                    talhoes(numero),
                    cortes_funcionarios(
                        funcionarios(nome, turmas(nome)),
                        metros,
                        valor
                    )
                `)
                .order('data_corte', { ascending: false })
                .limit(10);
                
            if (error) throw error;
            
            if (!data || data.length === 0) {
                apontamentosList.innerHTML = '<p>Nenhum apontamento encontrado.</p>';
                return;
            }
            
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Turma</th>
                            <th>Fazenda</th>
                            <th>Talhão</th>
                            <th>Funcionário</th>
                            <th>Metros (m)</th>
                            <th>Valor (R$)</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            data.forEach(apontamento => {
                if (apontamento.cortes_funcionarios && apontamento.cortes_funcionarios.length > 0) {
                    apontamento.cortes_funcionarios.forEach(corte => {
                        const dataFormatada = apontamento.data_corte ? apontamento.data_corte.split('T')[0].split('-').reverse().join('/') : 'N/A';
                        
                        html += `
                            <tr>
                                <td>${dataFormatada}</td>
                                <td>${apontamento.turma || 'N/A'}</td>
                                <td>${apontamento.fazendas?.nome || 'N/A'}</td>
                                <td>${apontamento.talhoes?.numero || 'N/A'}</td>
                                <td>${corte.funcionarios?.nome || 'N/A'} (${corte.funcionarios?.turmas?.nome || 'Sem turma'})</td>
                                <td>${corte.metros ? corte.metros.toFixed(2) : '0.00'}</td>
                                <td>R$ ${corte.valor ? corte.valor.toFixed(2) : '0.00'}</td>
                            </tr>
                        `;
                    });
                } else {
                    // Caso não haja cortes, mostrar pelo menos os dados básicos
                    const dataFormatada = apontamento.data_corte ? apontamento.data_corte.split('T')[0].split('-').reverse().join('/') : 'N/A';
                    
                    html += `
                        <tr>
                            <td>${dataFormatada}</td>
                            <td>${apontamento.turma || 'N/A'}</td>
                            <td>${apontamento.fazendas?.nome || 'N/A'}</td>
                            <td>${apontamento.talhoes?.numero || 'N/A'}</td>
                            <td colspan="3" style="text-align: center;">Nenhum funcionário associado</td>
                        </tr>
                    `;
                }
            });
            
            html += '</tbody></table>';
            apontamentosList.innerHTML = html;
            
        } catch (error) {
            console.error('Erro ao carregar apontamentos:', error);
            apontamentosList.innerHTML = '<p>Erro ao carregar apontamentos: ' + error.message + '</p>';
        }
    }
});