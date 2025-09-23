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
            const { data, error } = await supabase
                .from('apontamentos')
                .select('turma')
                .not('turma', 'is', null);
                
            if (error) throw error;
            
            // Extrair turmas únicas
            const turmasUnicas = [...new Set(data.map(item => item.turma))].filter(turma => turma);
            
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
                        funcionarios(nome)
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
                        <th>Funcionários</th>
                        <th>Metros</th>
                        <th>Valor (R$)</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        apontamentos.forEach(apontamento => {
            const totalMetros = apontamento.cortes_funcionarios.reduce((sum, corte) => sum + corte.metros, 0);
            const totalValor = apontamento.cortes_funcionarios.reduce((sum, corte) => sum + corte.valor, 0);
            const funcionarios = apontamento.cortes_funcionarios.map(corte => corte.funcionarios.nome).join(', ');
            
            html += `
                <tr>
                    <td>${formatarData(apontamento.data_corte)}</td>
                    <td>${apontamento.turma}</td>
                    <td>${apontamento.fazendas.nome}</td>
                    <td>${apontamento.talhoes.numero}</td>
                    <td>${funcionarios}</td>
                    <td>${totalMetros.toFixed(2)}</td>
                    <td>R$ ${totalValor.toFixed(2)}</td>
                    <td>
                        <button class="btn-secondary" onclick="editarApontamento('${apontamento.id}')">Editar</button>
                        <button class="btn-remove" onclick="excluirApontamento('${apontamento.id}')">Excluir</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        apontamentosList.innerHTML = html;
    }

    function formatarData(data) {
        return new Date(data).toLocaleDateString('pt-BR');
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
                        funcionarios(nome)
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
            await carregarTalhoesParaEdicao(data.fazenda_id, data.talhao_id);
            
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
            corteDiv.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>Funcionário</label>
                        <input type="text" value="${corte.funcionarios.nome}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Metros Cortados</label>
                        <input type="number" class="metros-corte" value="${corte.metros}" step="0.01" min="0" required>
                        <input type="hidden" class="corte-id" value="${corte.id}">
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
        const fazendaId = document.getElementById('editar-fazenda').value;
        const talhaoId = document.getElementById('editar-talhao').value;
        
        // Coletar metros dos cortes
        const cortes = [];
        const cortesItens = document.querySelectorAll('.corte-item');
        
        for (const item of cortesItens) {
            const corteId = item.querySelector('.corte-id').value;
            const metros = parseFloat(item.querySelector('.metros-corte').value);
            
            if (isNaN(metros) || metros <= 0) {
                mostrarMensagem('Informe valores válidos para os metros cortados.', 'error');
                return;
            }
            
            cortes.push({
                id: corteId,
                metros: metros
            });
        }
        
        try {
            // Atualizar apontamento principal
            const { error: apontamentoError } = await supabase
                .from('apontamentos')
                .update({
                    data_corte: dataCorte,
                    turma: turma,
                    fazenda_id: fazendaId,
                    talhao_id: talhaoId
                })
                .eq('id', apontamentoId);
                
            if (apontamentoError) throw apontamentoError;
            
            // Atualizar cortes dos funcionários
            for (const corte of cortes) {
                const { error: corteError } = await supabase
                    .from('cortes_funcionarios')
                    .update({ metros: corte.metros })
                    .eq('id', corte.id);
                    
                if (corteError) throw corteError;
            }
            
            mostrarMensagem('Apontamento atualizado com sucesso!');
            fecharModal();
            await carregarApontamentos(); // Recarregar a lista
            
        } catch (error) {
            console.error('Erro ao atualizar apontamento:', error);
            mostrarMensagem('Erro ao atualizar apontamento: ' + error.message, 'error');
        }
    }

    window.excluirApontamento = async function(apontamentoId) {
        if (!confirm('Tem certeza que deseja excluir este apontamento? Esta ação não pode ser desfeita.')) {
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
            
            mostrarMensagem('Apontamento excluído com sucesso!');
            await carregarApontamentos(); // Recarregar a lista
            
        } catch (error) {
            console.error('Erro ao excluir apontamento:', error);
            mostrarMensagem('Erro ao excluir apontamento: ' + error.message, 'error');
        }
    };
});