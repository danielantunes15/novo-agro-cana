// js/relatorios-simples.js - SISTEMA DE RELATÓRIOS SIMPLIFICADO COM DADOS REAIS

document.addEventListener('DOMContentLoaded', async function() {
    // Elementos do DOM
    const loadingElement = document.getElementById('loading');
    const contentElement = document.getElementById('content');
    const errorElement = document.getElementById('error-message');
    const filtroForm = document.getElementById('filtro-form');
    const funcionarioFiltro = document.getElementById('funcionario-filtro');
    const dataInicio = document.getElementById('data-inicio');
    const dataFim = document.getElementById('data-fim');
    const relatorioContainer = document.getElementById('relatorio-container');
    const semDados = document.getElementById('sem-dados');
    const limparFiltrosBtn = document.getElementById('limpar-filtros');
    const imprimirBtn = document.getElementById('imprimir-relatorio');
    
    // Variáveis para armazenar dados
    let funcionarios = [];
    let dadosRelatorio = [];

    try {
        // Configurar interface inicial
        if (loadingElement) loadingElement.style.display = 'block';
        if (contentElement) contentElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'none';
        if (relatorioContainer) relatorioContainer.style.display = 'none';
        if (semDados) semDados.style.display = 'none';

        // Testar conexão
        await testarConexaoSupabase();
        
        // Mostrar conteúdo principal
        if (loadingElement) loadingElement.style.display = 'none';
        if (contentElement) contentElement.style.display = 'block';

        // Configurar datas padrão (últimos 30 dias)
        configurarDatasPadrao();
        
        // Carregar funcionários para o filtro
        await carregarFuncionariosParaFiltro();
        
        // Configurar event listeners
        configurarEventListeners();

        console.log('✅ Sistema de relatórios simplificado inicializado com sucesso!');

    } catch (error) {
        console.error('Erro na inicialização:', error);
        if (loadingElement) loadingElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'block';
    }

    // Função para testar conexão
    async function testarConexaoSupabase() {
        try {
            const { data, error } = await supabase
                .from('funcionarios')
                .select('*')
                .limit(1);
                
            if (error) throw error;
            console.log('✅ Conexão com Supabase estabelecida (relatórios)');
            return true;
        } catch (error) {
            throw new Error(`Falha na conexão: ${error.message}`);
        }
    }

    // Função para configurar datas padrão
    function configurarDatasPadrao() {
        if (!dataInicio || !dataFim) return;
        
        const hoje = new Date();
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(hoje.getDate() - 30);
        
        dataInicio.value = trintaDiasAtras.toISOString().split('T')[0];
        dataFim.value = hoje.toISOString().split('T')[0];
    }

    // Função para configurar event listeners
    function configurarEventListeners() {
        if (filtroForm) {
            filtroForm.addEventListener('submit', gerarRelatorio);
        }
        
        if (limparFiltrosBtn) {
            limparFiltrosBtn.addEventListener('click', limparFiltros);
        }
        
        if (imprimirBtn) {
            imprimirBtn.addEventListener('click', imprimirRelatorio);
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
            <div style="padding: 1rem; margin: 1rem 0; border-radius: 4px;">
                <strong>${tipo === 'error' ? '⚠️' : '✅'} </strong> ${mensagem}
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="float: right; background: none; border: none; font-size: 1.2rem; cursor: pointer;">×</button>
            </div>
        `;
        
        const container = document.querySelector('.main .container');
        if (container) {
            container.prepend(mensagemDiv);
        }

        setTimeout(() => {
            if (mensagemDiv.parentElement) {
                mensagemDiv.remove();
            }
        }, 5000);
    }

    // Função para carregar funcionários no filtro
    async function carregarFuncionariosParaFiltro() {
        if (!funcionarioFiltro) return;
        
        try {
            const { data, error } = await supabase
                .from('funcionarios')
                .select(`
                    id,
                    nome,
                    cpf,
                    funcao,
                    turmas(nome)
                `)
                .order('nome');
                
            if (error) throw error;
            
            funcionarios = data || [];
            
            funcionarioFiltro.innerHTML = '<option value="">Selecione o funcionário</option>';
            funcionarios.forEach(funcionario => {
                const option = document.createElement('option');
                option.value = funcionario.id;
                option.textContent = `${funcionario.nome} - ${funcionario.turmas?.nome || 'Sem turma'}`;
                funcionarioFiltro.appendChild(option);
            });
            
            console.log(`✅ ${funcionarios.length} funcionários carregados`);
            
        } catch (error) {
            console.error('Erro ao carregar funcionários:', error);
            mostrarMensagem('Erro ao carregar lista de funcionários', 'error');
        }
    }

    // Função principal para gerar relatório
    async function gerarRelatorio(e) {
        if (e) e.preventDefault();
        
        if (!funcionarioFiltro || !dataInicio || !dataFim) return;
        
        const funcionarioId = funcionarioFiltro.value;
        const dataInicioValue = dataInicio.value;
        const dataFimValue = dataFim.value;
        
        // Validações
        if (!funcionarioId || !dataInicioValue || !dataFimValue) {
            mostrarMensagem('Preencha todos os campos obrigatórios marcados com *', 'error');
            return;
        }
        
        if (new Date(dataInicioValue) > new Date(dataFimValue)) {
            mostrarMensagem('A data de início não pode ser maior que a data de fim', 'error');
            return;
        }
        
        // Validar período máximo (90 dias)
        const diffTime = Math.abs(new Date(dataFimValue) - new Date(dataInicioValue));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 90) {
            mostrarMensagem('O período máximo permitido é de 90 dias', 'error');
            return;
        }
        
        try {
            mostrarMensagem('Gerando relatório... Aguarde', 'success');
            
            // Buscar dados do funcionário
            const funcionario = funcionarios.find(f => f.id === funcionarioId);
            if (!funcionario) {
                throw new Error('Funcionário não encontrado na base de dados');
            }
            
            // Buscar apontamentos do funcionário no período
            const { data: apontamentos, error } = await supabase
                .from('cortes_funcionarios')
                .select(`
                    id,
                    metros,
                    valor,
                    created_at,
                    apontamentos(
                        id,
                        data_corte,
                        turma,
                        preco_por_metro,
                        fazendas(nome),
                        talhoes(numero, espacamento, area)
                    )
                `)
                .eq('funcionario_id', funcionarioId)
                .gte('apontamentos.data_corte', dataInicioValue)
                .lte('apontamentos.data_corte', dataFimValue);
                
            if (error) throw error;
            
            dadosRelatorio = apontamentos || [];
            
            // Exibir relatório
            if (dadosRelatorio.length > 0) {
                exibirRelatorio(funcionario, dataInicioValue, dataFimValue, diffDays);
                if (relatorioContainer) relatorioContainer.style.display = 'block';
                if (semDados) semDados.style.display = 'none';
                mostrarMensagem(`Relatório gerado com ${dadosRelatorio.length} registros de produção`);
            } else {
                if (relatorioContainer) relatorioContainer.style.display = 'none';
                if (semDados) semDados.style.display = 'block';
                mostrarMensagem('Nenhum registro encontrado para os filtros selecionados', 'error');
            }
            
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            mostrarMensagem('Erro ao gerar relatório: ' + error.message, 'error');
        }
    }

    // Função para exibir relatório na interface
    function exibirRelatorio(funcionario, dataInicio, dataFim, diasPeriodo) {
        // Preencher informações do funcionário
        const relatorioNome = document.getElementById('relatorio-nome');
        const relatorioPeriodo = document.getElementById('relatorio-periodo');
        const relatorioEmissao = document.getElementById('relatorio-emissao');
        
        if (relatorioNome) relatorioNome.textContent = funcionario.nome;
        
        const dataInicioFormatada = formatarData(dataInicio);
        const dataFimFormatada = formatarData(dataFim);
        
        if (relatorioPeriodo) relatorioPeriodo.textContent = `${dataInicioFormatada} a ${dataFimFormatada}`;
        if (relatorioEmissao) relatorioEmissao.textContent = formatarData(new Date());
        
        // Calcular totais e estatísticas
        const { totalMetros, totalValor, fazendasUnicas, talhoesUnicos, diasTrabalhados } = calcularTotais(dadosRelatorio);
        
        // Atualizar cartões de resumo
        const totalDias = document.getElementById('total-dias');
        const totalMetrosElem = document.getElementById('total-metros');
        const totalValorElem = document.getElementById('total-valor');
        
        if (totalDias) totalDias.textContent = diasTrabalhados;
        if (totalMetrosElem) totalMetrosElem.textContent = totalMetros.toFixed(2);
        if (totalValorElem) totalValorElem.textContent = `R$ ${totalValor.toFixed(2)}`;
        
        // Preencher tabela de detalhes
        preencherTabelaDetalhes(dadosRelatorio, totalMetros, totalValor);
    }

    // Função para calcular totais
    function calcularTotais(dados) {
        let totalMetros = 0;
        let totalValor = 0;
        const fazendasUnicas = new Set();
        const talhoesUnicos = new Set();
        const diasTrabalhados = new Set();
        
        dados.forEach(item => {
            const apontamento = item.apontamentos;
            if (!apontamento) return;
            
            totalMetros += item.metros || 0;
            totalValor += item.valor || 0;
            
            fazendasUnicas.add(apontamento.fazendas?.nome || 'N/A');
            talhoesUnicos.add(`${apontamento.fazendas?.nome || 'N/A'}-${apontamento.talhoes?.numero || 'N/A'}`);
            diasTrabalhados.add(apontamento.data_corte);
        });
        
        return {
            totalMetros,
            totalValor,
            fazendasUnicas: fazendasUnicas.size,
            talhoesUnicos: talhoesUnicos.size,
            diasTrabalhados: diasTrabalhados.size
        };
    }

    // Função para preencher tabela de detalhes
    function preencherTabelaDetalhes(dados, totalMetros, totalValor) {
        const tbody = document.getElementById('detalhes-producao');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        dados.forEach(item => {
            const apontamento = item.apontamentos;
            if (!apontamento) return;
            
            const dataCorte = formatarData(apontamento.data_corte);
            const fazenda = apontamento.fazendas?.nome || 'N/A';
            const talhao = apontamento.talhoes?.numero || 'N/A';
            const metros = item.metros || 0;
            const valor = item.valor || 0;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dataCorte}</td>
                <td>${fazenda}</td>
                <td>${talhao}</td>
                <td>${metros.toFixed(2)}</td>
                <td>R$ ${valor.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
        
        // Adicionar linha de totais
        const trTotal = document.createElement('tr');
        trTotal.className = 'total-row';
        trTotal.innerHTML = `
            <td colspan="3" style="text-align: right; font-weight: bold;">TOTAL GERAL</td>
            <td style="font-weight: bold;">${totalMetros.toFixed(2)}</td>
            <td style="font-weight: bold;">R$ ${totalValor.toFixed(2)}</td>
        `;
        tbody.appendChild(trTotal);
    }

    // Funções auxiliares de formatação
    function formatarData(data) {
        if (!data) return 'N/A';
        return new Date(data).toLocaleDateString('pt-BR');
    }

    // Função para limpar filtros
    function limparFiltros() {
        if (funcionarioFiltro) funcionarioFiltro.value = '';
        configurarDatasPadrao();
        
        if (relatorioContainer) relatorioContainer.style.display = 'none';
        if (semDados) semDados.style.display = 'block';
        
        mostrarMensagem('Filtros limpos com sucesso!');
    }

    // Função para imprimir relatório
    function imprimirRelatorio() {
        window.print();
    }

    // Configurar botão de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (window.sistemaAuth && typeof window.sistemaAuth.fazerLogout === 'function') {
                window.sistemaAuth.fazerLogout();
            } else {
                localStorage.removeItem('usuarioLogado');
                window.location.href = 'login.html';
            }
        });
    }
});