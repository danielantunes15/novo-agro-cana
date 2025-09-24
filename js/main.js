// Configuração e inicialização
document.addEventListener('DOMContentLoaded', async function() {
    // Elementos do DOM
    const loadingElement = document.getElementById('loading');
    const contentElement = document.getElementById('content');
    const errorElement = document.getElementById('error-message');
    const apontamentoForm = document.getElementById('apontamento-form');
    const funcionariosContainer = document.getElementById('funcionarios-container');
    const addFuncionarioBtn = document.getElementById('add-funcionario');
    const apontamentosList = document.getElementById('apontamentos-list');
    const fazendaSelect = document.getElementById('fazenda');
    const talhaoSelect = document.getElementById('talhao');

    try {
        // Mostrar loading
        loadingElement.style.display = 'block';
        contentElement.style.display = 'none';
        errorElement.style.display = 'none';

        // Testar conexão com Supabase
        await testarConexaoSupabase();
        
        // Esconder loading e mostrar conteúdo
        loadingElement.style.display = 'none';
        contentElement.style.display = 'block';

        // Carregar dados iniciais
        await carregarFazendas();
        await carregarFuncionariosIniciais();
        await carregarApontamentosRecentes();
        
        // Configurar event listeners
        addFuncionarioBtn.addEventListener('click', adicionarFuncionario);
        apontamentoForm.addEventListener('submit', salvarApontamento);
        fazendaSelect.addEventListener('change', carregarTalhoes);

        console.log('Sistema inicializado com sucesso!');

    } catch (error) {
        console.error('Erro na inicialização:', error);
        loadingElement.style.display = 'none';
        errorElement.style.display = 'block';
    }

    // Função para testar conexão
    async function testarConexaoSupabase() {
        try {
            const { data, error } = await supabase
                .from('fazendas')
                .select('*')
                .limit(1);
                
            if (error) {
                throw new Error(`Erro Supabase: ${error.message}`);
            }
            
            console.log('✅ Conexão com Supabase estabelecida');
            return true;
        } catch (error) {
            throw new Error(`Falha na conexão: ${error.message}`);
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
            <div style="padding: 1rem; margin: 1rem 0; border-radius: 4px;">
                ${mensagem}
                <button onclick="this.parentElement.parentElement.remove()" style="float: right; background: none; border: none; font-size: 1.2rem; cursor: pointer;">×</button>
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

    // Função para adicionar campo de funcionário
    function adicionarFuncionario() {
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
        removeBtn.addEventListener('click', function() {
            funcionarioItem.remove();
        });
        
        // Carregar funcionários no select
        carregarFuncionarios(funcionarioItem.querySelector('.funcionario-select'));
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

    // Função para carregar funcionários - CORRIGIDA
    async function carregarFuncionarios(selectElement) {
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
                // CORREÇÃO: Mostrar nome e nome da turma em vez do ID
                option.textContent = `${funcionario.nome} (${funcionario.turmas?.nome || 'Sem turma'})`;
                selectElement.appendChild(option);
            });

        } catch (error) {
            console.error('Erro ao carregar funcionários:', error);
            // Fallback em caso de erro
            selectElement.innerHTML = '<option value="">Erro ao carregar funcionários</option>';
        }
    }

    // Função para calcular preço por metro
    function calcularPrecoPorMetro(talhaoData) {
        // Fórmula: (preco_tonelada * producao_estimada) / (10000 / espacamento / 5)
        const precoPorMetro = (talhaoData.preco_tonelada * talhaoData.producao_estimada) / (10000 / talhaoData.espacamento / 5);
        return parseFloat(precoPorMetro.toFixed(4));
    }

    // Função para salvar apontamento
    async function salvarApontamento(e) {
        e.preventDefault();
        
        const dataCorte = document.getElementById('data-corte').value;
        const turma = document.getElementById('turma').value;
        const fazendaId = fazendaSelect.value;
        const talhaoId = talhaoSelect.value;
        
        // Validar dados básicos
        if (!dataCorte || !turma || !fazendaId || !talhaoId) {
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
            
            if (!funcionarioSelect.value || !metrosInput.value) {
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
            
            // Inserir apontamento principal
            const { data: apontamento, error: apontamentoError } = await supabase
                .from('apontamentos')
                .insert({
                    data_corte: dataCorte,
                    turma: turma,
                    fazenda_id: fazendaId,
                    talhao_id: talhaoId,
                    preco_por_metro: precoPorMetro
                })
                .select()
                .single();
                
            if (apontamentoError) throw apontamentoError;
            
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
            await carregarFuncionariosIniciais();
            await carregarApontamentosRecentes();
            
        } catch (error) {
            console.error('Erro ao salvar apontamento:', error);
            mostrarMensagem('Erro ao salvar apontamento: ' + error.message, 'error');
        }
    }

    // Função para carregar apontamentos recentes (CORRIGIDA DATA)
    async function carregarApontamentosRecentes() {
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
                apontamento.cortes_funcionarios.forEach(corte => {
                    // CORRIGIDO: mostrar data sem fuso horário
                    const dataFormatada = apontamento.data_corte.split('T')[0].split('-').reverse().join('/');
                    
                    html += `
                        <tr>
                            <td>${dataFormatada}</td>
                            <td>${apontamento.turma}</td>
                            <td>${apontamento.fazendas.nome}</td>
                            <td>${apontamento.talhoes.numero}</td>
                            <td>${corte.funcionarios.nome} (${corte.funcionarios.turmas?.nome || 'Sem turma'})</td>
                            <td>${corte.metros.toFixed(2)}</td>
                            <td>R$ ${corte.valor.toFixed(2)}</td>
                        </tr>
                    `;
                });
            });
            
            html += '</tbody></table>';
            apontamentosList.innerHTML = html;
            
        } catch (error) {
            console.error('Erro ao carregar apontamentos:', error);
            apontamentosList.innerHTML = '<p>Erro ao carregar apontamentos.</p>';
        }
    }
});
