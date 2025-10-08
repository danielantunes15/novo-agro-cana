// consulta-apontamentos.js
document.addEventListener('DOMContentLoaded', async function() {
    const loadingElement = document.getElementById('loading');
    const contentElement = document.getElementById('content');
    const errorElement = document.getElementById('error-message');
    const filtroForm = document.getElementById('filtro-form');
    const apontamentosList = document.getElementById('apontamentos-list');
    const modalEdicao = document.getElementById('modal-edicao');
    const formEdicao = document.getElementById('form-edicao');
    const turmaFiltro = document.getElementById('turma-filtro');
    const fazendaFiltro = document.getElementById('fazenda-filtro');
    const limparFiltrosBtn = document.getElementById('limpar-filtros');

    // Variáveis para armazenar dados
    let apontamentos = [];
    let fazendas = [];
    let turmas = [];

    try {
        loadingElement.style.display = 'block';
        contentElement.style.display = 'none';
        errorElement.style.display = 'none';

        await testarConexaoSupabase();
        
        loadingElement.style.display = 'none';
        contentElement.style.display = 'block';

        await carregarDadosIniciais();
        await carregarApontamentos();
        
        filtroForm.addEventListener('submit', aplicarFiltros);
        limparFiltrosBtn.addEventListener('click', limparFiltros);

        // Configurar modal
        const closeModal = document.querySelector('.close');
        const cancelarEdicao = document.getElementById('cancelar-edicao');
        
        closeModal.addEventListener('click', fecharModal);
        cancelarEdicao.addEventListener('click', fecharModal);
        window.addEventListener('click', function(event) {
            if (event.target === modalEdicao) {
                fecharModal();
            }
        });

        formEdicao.addEventListener('submit', salvarEdicao);

        console.log('Módulo de consulta de apontamentos inicializado com sucesso!');

    } catch (error) {
        console.error('Erro na inicialização:', error);
        loadingElement.style.display = 'none';
        errorElement.style.display = 'block';
    }

    async function testarConexaoSupabase() {
        try {
            const { data, error } = await supabase
                .from('apontamentos')
                .select('*')
                .limit(1);
                
            if (error) throw error;
            console.log('✅ Conexão com Supabase estabelecida (consulta)');
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

    async function carregarDadosIniciais() {
        // Configurar datas padrão (últimos 30 dias)
        const dataFim = new Date();
        const dataInicio = new Date();
        dataInicio.setDate(dataInicio.getDate() - 30);
        
        document.getElementById('data-inicio').value = dataInicio.toISOString().split('T')[0];
        document.getElementById('data-fim').value = dataFim.toISOString().split('T')[0];
        
        // Carregar turmas e fazendas para filtros
        await Promise.all([
            carregarTurmasParaFiltro(),
            carregarFazendasParaFiltro()
        ]);
    }

    async function carregarTurmasParaFiltro() {
        try {
            // Buscamos todas as turmas cadastradas para o filtro
            const { data, error } = await supabase
                .from('turmas')
                .select('nome')
                .order('nome');
                
            if (error) throw error;
            
            // Extrair nomes de turmas únicas e remover nulos
            const turmasUnicas = [...new Set(data.map(item => item.nome))].filter(turma => turma);
            
            turmaFiltro.innerHTML = '<option value="">Todas as turmas</option>';
            turmasUnicas.forEach(turma => {
                const option = document.createElement('option');
                option.value = turma;
                option.textContent = turma;
                turmaFiltro.appendChild(option);
            });
            
            turmas = turmasUnicas;
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
        }
    }

    async function carregarFazendasParaFiltro() {
        try {
            const { data, error } = await supabase
                .from('fazendas')
                .select('id, nome')
                .order('nome');
                
            if (error) throw error;
            
            fazendaFiltro.innerHTML = '<option value="">Todas as fazendas</option>';
            data.forEach(fazenda => {
                const option = document.createElement('option');
                option.value = fazenda.id;
                option.textContent = fazenda.nome;
                fazendaFiltro.appendChild(option);
            });
            
            fazendas = data;
        } catch (error) {
            console.error('Erro ao carregar fazendas:', error);
        }
    }

    async function carregarApontamentos(filtros = {}) {
        try {
            let query = supabase
                .from('apontamentos')
                .select(`
                    id,
                    data_corte,
                    turma,
                    fazenda_id,
                    talhao_id,
                    preco_por_metro,
                    fazendas(nome),
                    talhoes(numero, area),
                    cortes_funcionarios(
                        id,
                        metros,
                        valor,
                        funcionario_id,
                        funcionarios(nome, turmas(nome))
                    )
                `)
                .order('data_corte', { ascending: false });

            // Aplicar filtros
            if (filtros.dataInicio) {
                query = query.gte('data_corte', filtros.dataInicio);
            }
            
            if (filtros.dataFim) {
                query = query.lte('data_corte', filtros.dataFim);
            }
            
            if (filtros.turma) {
                query = query.eq('turma', filtros.turma);
            }
            
            if (filtros.fazendaId) {
                query = query.eq('fazenda_id', filtros.fazendaId);
            }

            const { data, error } = await query;
                
            if (error) throw error;
            
            apontamentos = data || [];
            exibirApontamentos(apontamentos);
            
        } catch (error) {
            console.error('Erro ao carregar apontamentos:', error);
            mostrarMensagem('Erro ao carregar apontamentos: ' + error.message, 'error');
        }
    }

    function exibirApontamentos(apontamentos) {
        if (apontamentos.length === 0) {
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
                        <th>Metros</th>
                        <th>Valor (R$)</th>
                        <th class="actions-cell">Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        apontamentos.forEach(apontamento => {
            // Verifica se o apontamento tem cortes, caso contrário pode ser um registro incompleto
            if (!apontamento.cortes_funcionarios || apontamento.cortes_funcionarios.length === 0) {
                // Linha de aviso para apontamentos sem cortes
                html += `
                    <tr>
                        <td>${formatarData(apontamento.data_corte)}</td>
                        <td>${apontamento.turma || 'N/A'}</td>
                        <td colspan="5" style="text-align: center; color: #dc3545;">Nenhum corte registrado.</td>
                        <td class="actions-cell">
                            <button class="btn btn-secondary btn-sm" onclick="editarApontamento('${apontamento.id}')">Editar</button>
                            <button class="btn btn-remove btn-sm" onclick="excluirApontamentoCompleto('${apontamento.id}')">Excluir Tudo</button>
                        </td>
                    </tr>
                `;
                return; 
            }
            
            apontamento.cortes_funcionarios.forEach(corte => {
                // CORREÇÃO: Usar encadeamento opcional (?.) para acessar propriedades aninhadas
                const nomeFazenda = apontamento.fazendas?.nome || 'N/A (Diária)';
                const numTalhao = apontamento.talhoes?.numero || 'N/A (Diária)';
                const nomeFuncionario = corte.funcionarios?.nome || 'N/A';
                const nomeTurmaFuncionario = corte.funcionarios?.turmas?.nome || 'Sem turma';
                
                html += `
                    <tr>
                        <td>${formatarData(apontamento.data_corte)}</td>
                        <td>${apontamento.turma || 'N/A'}</td>
                        <td>${nomeFazenda}</td>
                        <td>${numTalhao}</td>
                        <td>${nomeFuncionario} (${nomeTurmaFuncionario})</td>
                        <td>${corte.metros.toFixed(2)}</td>
                        <td>R$ ${corte.valor.toFixed(2)}</td>
                        <td class="actions-cell">
                            <button class="btn btn-secondary btn-sm" onclick="editarApontamento('${apontamento.id}')">Editar</button>
                            <button class="btn btn-remove btn-sm" onclick="excluirCorteIndividual('${apontamento.id}', '${corte.id}', '${nomeFuncionario}')">Excluir Corte</button>
                            ${apontamento.cortes_funcionarios.length === 1 ? 
                                `<button class="btn btn-remove btn-sm" onclick="excluirApontamentoCompleto('${apontamento.id}')">Excluir Tudo</button>` : 
                                ''}
                        </td>
                    </tr>
                `;
            });
        });
        
        html += '</tbody></table>';
        apontamentosList.innerHTML = html;
    }

    function formatarData(data) {
        if (!data) return '';
        // CORREÇÃO: Formata a string YYYY-MM-DD para DD/MM/YYYY
        return data.split('T')[0].split('-').reverse().join('/');
    }

    async function aplicarFiltros(e) {
        e.preventDefault();
        
        const dataInicio = document.getElementById('data-inicio').value;
        const dataFim = document.getElementById('data-fim').value;
        const turma = turmaFiltro.value;
        const fazendaId = fazendaFiltro.value;
        
        await carregarApontamentos({
            dataInicio,
            dataFim,
            turma,
            fazendaId
        });
    }

    function limparFiltros() {
        document.getElementById('data-inicio').value = '';
        document.getElementById('data-fim').value = '';
        turmaFiltro.value = '';
        fazendaFiltro.value = '';
        
        carregarApontamentos();
    }

    // Funções para edição de apontamentos
    window.editarApontamento = async function(apontamentoId) {
        try {
            // Buscar dados completos do apontamento
            const { data, error } = await supabase
                .from('apontamentos')
                .select(`
                    *,
                    cortes_funcionarios(
                        id,
                        metros,
                        valor,
                        funcionario_id,
                        funcionarios(nome, turmas(nome))
                    )
                `)
                .eq('id', apontamentoId)
                .single();
                
            if (error) throw error;
            
            // Preencher formulário de edição
            document.getElementById('apontamento-id').value = data.id;
            document.getElementById('editar-data-corte').value = data.data_corte;
            
            // Carregar turmas, fazendas e talhões para o formulário
            await carregarTurmasParaEdicao(data.turma);
            await carregarFazendasParaEdicao(data.fazenda_id);
            // Verifica se fazenda_id existe antes de tentar carregar talhões
            if (data.fazenda_id) {
                await carregarTalhoesParaEdicao(data.fazenda_id, data.talhao_id);
            } else {
                 document.getElementById('editar-talhao').innerHTML = '<option value="">Apontamento de Diária</option>';
            }
            
            // Preencher cortes dos funcionários
            preencherCortesFuncionarios(data.cortes_funcionarios);
            
            // Exibir modal
            modalEdicao.style.display = 'block';
            
        } catch (error) {
            console.error('Erro ao carregar apontamento para edição:', error);
            mostrarMensagem('Erro ao carregar apontamento: ' + error.message, 'error');
        }
    };

    async function carregarTurmasParaEdicao(turmaSelecionada = '') {
        const select = document.getElementById('editar-turma');
        select.innerHTML = '<option value="">Selecione a turma</option>';
        
        // Usamos a lista de turmas já carregada (turmas)
        turmas.forEach(turma => {
            const option = document.createElement('option');
            option.value = turma;
            option.textContent = turma;
            option.selected = (turma === turmaSelecionada);
            select.appendChild(option);
        });
    }

    async function carregarFazendasParaEdicao(fazendaSelecionada = '') {
        const select = document.getElementById('editar-fazenda');
        select.innerHTML = '<option value="">Selecione a fazenda</option>';
        
        // Adiciona a opção de Diária/Nulo se não houver fazenda selecionada
        if (!fazendaSelecionada) {
             select.innerHTML += '<option value="">APONTAMENTO DE DIÁRIA (Sem Fazenda)</option>';
        }

        fazendas.forEach(fazenda => {
            const option = document.createElement('option');
            option.value = fazenda.id;
            option.textContent = fazenda.nome;
            option.selected = (fazenda.id === fazendaSelecionada);
            select.appendChild(option);
        });
        
        // Adicionar evento para carregar talhões quando a fazenda mudar
        select.addEventListener('change', function() {
            const fazendaId = this.value;
            if (fazendaId) {
                carregarTalhoesParaEdicao(fazendaId);
            } else {
                document.getElementById('editar-talhao').innerHTML = '<option value="">Selecione o talhão</option>';
            }
        });
    }

    async function carregarTalhoesParaEdicao(fazendaId, talhaoSelecionado = '') {
        try {
            const { data, error } = await supabase
                .from('talhoes')
                .select('id, numero')
                .eq('fazenda_id', fazendaId)
                .order('numero');
                
            if (error) throw error;
            
            const select = document.getElementById('editar-talhao');
            select.innerHTML = '<option value="">Selecione o talhão</option>';
            
            data.forEach(talhao => {
                const option = document.createElement('option');
                option.value = talhao.id;
                option.textContent = `Talhão ${talhao.numero}`;
                option.selected = (talhao.id === talhaoSelecionado);
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar talhões:', error);
        }
    }

    function preencherCortesFuncionarios(cortes) {
        const container = document.getElementById('cortes-container');
        container.innerHTML = '<h4>Cortes dos Funcionários</h4>';
        
        cortes.forEach((corte, index) => {
            const corteDiv = document.createElement('div');
            corteDiv.className = 'corte-item';
            
            // Determina se é um apontamento de diária (metros muito baixos)
            const isDiaria = corte.metros <= 0.01;
            const metrosExibicao = isDiaria ? `Metros (Diária: ${corte.metros.toFixed(2)}m)` : 'Metros Cortados';
            const metrosValor = isDiaria ? '0.00' : corte.metros; // Exibe 0 se for diária para evitar confusão

            corteDiv.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>Funcionário</label>
                        <input type="text" value="${corte.funcionarios.nome} (${corte.funcionarios.turmas?.nome || 'Sem turma'})" readonly>
                    </div>
                    <div class="form-group">
                        <label>${metrosExibicao}</label>
                        <input type="number" class="metros-corte" value="${metrosValor}" step="0.01" min="0" required ${isDiaria ? 'readonly' : ''}>
                        <input type="hidden" class="corte-id" value="${corte.id}">
                        ${isDiaria ? '<small style="color:#dc3545;">Valor Fixo (Diária): Edite o valor total na tabela cortes_funcionarios no Supabase.</small>' : ''}
                    </div>
                </div>
            `;
            container.appendChild(corteDiv);
        });
    }

    function fecharModal() {
        modalEdicao.style.display = 'none';
        formEdicao.reset();
    }

    async function salvarEdicao(e) {
        e.preventDefault();
        
        const apontamentoId = document.getElementById('apontamento-id').value;
        const dataCorte = document.getElementById('editar-data-corte').value;
        const turma = document.getElementById('editar-turma').value;
        const fazendaId = document.getElementById('editar-fazenda').value || null; // Converte string vazia para null
        const talhaoId = document.getElementById('editar-talhao').value || null; // Converte string vazia para null
        
        const dataCorteISO = dataCorte.split('T')[0];
        
        // Coletar metros dos cortes
        const cortes = [];
        const cortesItens = document.querySelectorAll('.corte-item');
        
        for (const item of cortesItens) {
            const corteId = item.querySelector('.corte-id').value;
            const metrosInput = item.querySelector('.metros-corte');
            
            // Se o campo for somente leitura (Diária), usamos o valor original do banco (0.01)
            const metros = metrosInput.readOnly 
                ? 0.01 
                : parseFloat(metrosInput.value); 
            
            if (isNaN(metros) || metros < 0) {
                mostrarMensagem('Informe valores válidos para os metros cortados.', 'error');
                return;
            }
            
            cortes.push({
                id: corteId,
                metros: metros
            });
        }
        
        try {
            let precoPorMetro = 0;
            
            // Se fazendaId e talhaoId existirem, buscamos o preco_por_metro
            if (fazendaId && talhaoId) {
                const { data: talhao, error: talhaoError } = await supabase
                    .from('talhoes')
                    .select('espacamento, preco_tonelada, producao_estimada')
                    .eq('id', talhaoId)
                    .single();
                
                if (talhaoError) throw talhaoError;
                
                // Função para calcular preco_por_metro (reproduzida da main.js para consistência)
                const calcularPrecoPorMetro = (talhaoData) => {
                    const precoPMetro = (talhaoData.preco_tonelada * talhaoData.producao_estimada) / (10000 / talhaoData.espacamento / 5);
                    return parseFloat(precoPMetro.toFixed(4));
                };
                
                precoPorMetro = calcularPrecoPorMetro(talhao);
            }
            
            // Atualizar apontamento principal
            const { error: apontamentoError } = await supabase
                .from('apontamentos')
                .update({
                    data_corte: dataCorteISO,
                    turma: turma,
                    fazenda_id: fazendaId,
                    talhao_id: talhaoId,
                    preco_por_metro: precoPorMetro
                })
                .eq('id', apontamentoId);
                
            if (apontamentoError) throw apontamentoError;
            
            // Atualizar cortes dos funcionários
            for (const corte of cortes) {
                let novoValor = corte.metros * precoPorMetro;
                
                // Se for diária (metros = 0.01), não recalcula o valor se o preço for zero
                if (corte.metros === 0.01 && precoPorMetro === 0) {
                    // Mantemos o valor original, confiando que o valor foi definido corretamente no lançamento da diária.
                }

                const { error: corteError } = await supabase
                    .from('cortes_funcionarios')
                    .update({ 
                        metros: corte.metros,
                        // Recalcula o valor apenas se for um apontamento de corte (precoPorMetro > 0)
                        valor: (precoPorMetro > 0) ? novoValor : undefined 
                    }) 
                    .eq('id', corte.id);
                    
                if (corteError) throw corteError;
            }
            
            mostrarMensagem('Apontamento atualizado com sucesso!');
            fecharModal();
            await carregarApontamentos();
            
        } catch (error) {
            console.error('Erro ao atualizar apontamento:', error);
            mostrarMensagem('Erro ao atualizar apontamento: ' + error.message, 'error');
        }
    }

    // NOVA FUNÇÃO: Excluir apenas um corte individual
    window.excluirCorteIndividual = async function(apontamentoId, corteId, nomeFuncionario) {
        if (!confirm(`Tem certeza que deseja excluir apenas o corte do funcionário ${nomeFuncionario}?`)) {
            return;
        }
        
        try {
            // Excluir apenas o corte específico
            const { error: corteError } = await supabase
                .from('cortes_funcionarios')
                .delete()
                .eq('id', corteId);
                
            if (corteError) throw corteError;
            
            // Verificar se ainda existem outros cortes neste apontamento
            const { data: cortesRestantes, error: verificaError } = await supabase
                .from('cortes_funcionarios')
                .select('id')
                .eq('apontamento_id', apontamentoId);
                
            if (verificaError) throw verificaError;
            
            // Se não houver mais cortes, excluir o apontamento também
            if (cortesRestantes.length === 0) {
                const { error: apontamentoError } = await supabase
                    .from('apontamentos')
                    .delete()
                    .eq('id', apontamentoId);
                    
                if (apontamentoError) throw apontamentoError;
                mostrarMensagem('Corte excluído e apontamento removido (não havia mais cortes)!');
            } else {
                mostrarMensagem('Corte do funcionário excluído com sucesso!');
            }
            
            await carregarApontamentos();
            
        } catch (error) {
            console.error('Erro ao excluir corte:', error);
            mostrarMensagem('Erro ao excluir corte: ' + error.message, 'error');
        }
    };

    // FUNÇÃO ORIGINAL MODIFICADA: Excluir apontamento completo (todos os cortes)
    window.excluirApontamentoCompleto = async function(apontamentoId) {
        if (!confirm('Tem certeza que deseja excluir TODOS os cortes deste apontamento? Esta ação não pode ser desfeita.')) {
            return;
        }
        
        try {
            // Primeiro excluir os cortes associados
            const { error: cortesError } = await supabase
                .from('cortes_funcionarios')
                .delete()
                .eq('apontamento_id', apontamentoId);
                
            if (cortesError) throw cortesError;
            
            // Depois excluir o apontamento
            const { error: apontamentoError } = await supabase
                .from('apontamentos')
                .delete()
                .eq('id', apontamentoId);
                
            if (apontamentoError) throw apontamentoError;
            
            mostrarMensagem('Apontamento completo excluído com sucesso!');
            await carregarApontamentos();
            
        } catch (error) {
            console.error('Erro ao excluir apontamento:', error);
            mostrarMensagem('Erro ao excluir apontamento: ' + error.message, 'error');
        }
    };
});