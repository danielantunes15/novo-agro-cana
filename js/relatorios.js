document.addEventListener('DOMContentLoaded', function() {
    const relatorioForm = document.getElementById('relatorio-form');
    const quinzenaForm = document.getElementById('quinzena-form');
    const exportPdfBtn = document.getElementById('export-pdf');
    const exportQuinzenaBtn = document.getElementById('export-quinzena');
    const fazendaRelatorioSelect = document.getElementById('fazenda-relatorio');
    const resultadoRelatorio = document.getElementById('resultado-relatorio');
    const resultadoQuinzena = document.getElementById('resultado-quinzena');
    
    let dadosRelatorioAtual = null;
    let dadosQuinzenaAtual = null;
    
    // Carregar dados iniciais
    carregarFazendasParaRelatorio();
    
    // Event Listeners
    relatorioForm.addEventListener('submit', gerarRelatorio);
    quinzenaForm.addEventListener('submit', gerarEspelhoQuinzena);
    exportPdfBtn.addEventListener('click', exportarRelatorioPDF);
    exportQuinzenaBtn.addEventListener('click', exportarQuinzenaPDF);
    
    // Função para carregar fazendas no select de relatórios
    async function carregarFazendasParaRelatorio() {
        try {
            const { data, error } = await supabase
                .from('fazendas')
                .select('id, nome')
                .order('nome');
                
            if (error) throw error;
            
            fazendaRelatorioSelect.innerHTML = '<option value="">Todas as fazendas</option>';
            data.forEach(fazenda => {
                const option = document.createElement('option');
                option.value = fazenda.id;
                option.textContent = fazenda.nome;
                fazendaRelatorioSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar fazendas:', error);
        }
    }
    
    // Função para gerar relatório
    async function gerarRelatorio(e) {
        e.preventDefault();
        
        const dataInicio = document.getElementById('data-inicio').value;
        const dataFim = document.getElementById('data-fim').value;
        const turma = document.getElementById('turma-relatorio').value;
        const fazendaId = fazendaRelatorioSelect.value;
        
        if (!dataInicio || !dataFim) {
            alert('Informe o período do relatório.');
            return;
        }
        
        try {
            let query = supabase
                .from('apontamentos')
                .select(`
                    id,
                    data_corte,
                    turma,
                    fazendas(nome),
                    talhoes(numero, area, espacamento),
                    preco_por_metro,
                    cortes_funcionarios(
                        funcionarios(nome),
                        metros,
                        valor
                    )
                `)
                .gte('data_corte', dataInicio)
                .lte('data_corte', dataFim)
                .order('data_corte', { ascending: false });
            
            if (turma) {
                query = query.eq('turma', turma);
            }
            
            if (fazendaId) {
                query = query.eq('fazenda_id', fazendaId);
            }
            
            const { data, error } = await query;
                
            if (error) throw error;
            
            dadosRelatorioAtual = data;
            exibirRelatorio(data);
            exportPdfBtn.disabled = false;
            
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            resultadoRelatorio.innerHTML = '<p>Erro ao gerar relatório.</p>';
        }
    }
    
    // Função para exibir relatório
    function exibirRelatorio(dados) {
        if (dados.length === 0) {
            resultadoRelatorio.innerHTML = '<p>Nenhum dado encontrado para o período selecionado.</p>';
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
                    </tr>
                </thead>
                <tbody>
        `;
        
        let totalMetros = 0;
        let totalValor = 0;
        
        dados.forEach(apontamento => {
            apontamento.cortes_funcionarios.forEach(corte => {
                totalMetros += corte.metros;
                totalValor += corte.valor;
                
                html += `
                    <tr>
                        <td>${new Date(apontamento.data_corte).toLocaleDateString('pt-BR')}</td>
                        <td>${apontamento.turma}</td>
                        <td>${apontamento.fazendas.nome}</td>
                        <td>${apontamento.talhoes.numero}</td>
                        <td>${corte.funcionarios.nome}</td>
                        <td>${corte.metros.toFixed(2)}</td>
                        <td>R$ ${corte.valor.toFixed(2)}</td>
                    </tr>
                `;
            });
        });
        
        html += `
                </tbody>
                <tfoot>
                    <tr style="font-weight: bold; background-color: #f8f9fa;">
                        <td colspan="5">TOTAL</td>
                        <td>${totalMetros.toFixed(2)}</td>
                        <td>R$ ${totalValor.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        resultadoRelatorio.innerHTML = html;
    }
    
    // Função para gerar espelho de quinzena
    async function gerarEspelhoQuinzena(e) {
        e.preventDefault();
        
        const quinzena = document.getElementById('quinzena').value;
        const turma = document.getElementById('turma-quinzena').value;
        
        if (!quinzena || !turma) {
            alert('Selecione a quinzena e a turma.');
            return;
        }
        
        // Calcular datas da quinzena (1-15 e 16-final do mês)
        const [ano, mes] = quinzena.split('-');
        const dataInicioPrimeira = `${ano}-${mes}-01`;
        const dataFimPrimeira = `${ano}-${mes}-15`;
        const dataInicioSegunda = `${ano}-${mes}-16`;
        
        // Último dia do mês
        const ultimoDia = new Date(ano, mes, 0).getDate();
        const dataFimSegunda = `${ano}-${mes}-${ultimoDia}`;
        
        try {
            // Buscar dados da primeira quinzena
            const { data: primeiraQuinzena, error: error1 } = await supabase
                .from('apontamentos')
                .select(`
                    data_corte,
                    cortes_funcionarios(
                        funcionarios(nome, turma),
                        metros,
                        valor
                    )
                `)
                .eq('turma', turma)
                .gte('data_corte', dataInicioPrimeira)
                .lte('data_corte', dataFimPrimeira);
                
            if (error1) throw error1;
            
            // Buscar dados da segunda quinzena
            const { data: segundaQuinzena, error: error2 } = await supabase
                .from('apontamentos')
                .select(`
                    data_corte,
                    cortes_funcionarios(
                        funcionarios(nome, turma),
                        metros,
                        valor
                    )
                `)
                .eq('turma', turma)
                .gte('data_corte', dataInicioSegunda)
                .lte('data_corte', dataFimSegunda);
                
            if (error2) throw error2;
            
            const dadosCompletos = [...(primeiraQuinzena || []), ...(segundaQuinzena || [])];
            dadosQuinzenaAtual = {
                primeiraQuinzena: primeiraQuinzena || [],
                segundaQuinzena: segundaQuinzena || [],
                mes: mes,
                ano: ano,
                turma: turma
            };
            
            exibirEspelhoQuinzena(dadosCompletos, primeiraQuinzena || [], segundaQuinzena || []);
            exportQuinzenaBtn.disabled = false;
            
        } catch (error) {
            console.error('Erro ao gerar espelho de quinzena:', error);
            resultadoQuinzena.innerHTML = '<p>Erro ao gerar espelho de quinzena.</p>';
        }
    }
    
    // Função para exibir espelho de quinzena
    function exibirEspelhoQuinzena(dadosCompletos, primeiraQuinzena, segundaQuinzena) {
        if (dadosCompletos.length === 0) {
            resultadoQuinzena.innerHTML = '<p>Nenhum dado encontrado para a quinzena selecionada.</p>';
            return;
        }
        
        // Agrupar por funcionário
        const funcionariosMap = new Map();
        
        dadosCompletos.forEach(apontamento => {
            apontamento.cortes_funcionarios.forEach(corte => {
                const funcionarioNome = corte.funcionarios.nome;
                
                if (!funcionariosMap.has(funcionarioNome)) {
                    funcionariosMap.set(funcionarioNome, {
                        primeiraQuinzena: { metros: 0, valor: 0 },
                        segundaQuinzena: { metros: 0, valor: 0 },
                        total: { metros: 0, valor: 0 }
                    });
                }
                
                const data = new Date(apontamento.data_corte);
                const dia = data.getDate();
                const quinzena = dia <= 15 ? 'primeiraQuinzena' : 'segundaQuinzena';
                
                funcionariosMap.get(funcionarioNome)[quinzena].metros += corte.metros;
                funcionariosMap.get(funcionarioNome)[quinzena].valor += corte.valor;
                funcionariosMap.get(funcionarioNome).total.metros += corte.metros;
                funcionariosMap.get(funcionarioNome).total.valor += corte.valor;
            });
        });
        
        let html = `
            <h3>Espelho de Quinzena - ${dadosQuinzenaAtual.turma.toUpperCase()} - ${dadosQuinzenaAtual.mes}/${dadosQuinzenaAtual.ano}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Funcionário</th>
                        <th>1ª Quinzena (m)</th>
                        <th>1ª Quinzena (R$)</th>
                        <th>2ª Quinzena (m)</th>
                        <th>2ª Quinzena (R$)</th>
                        <th>Total (m)</th>
                        <th>Total (R$)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        let totalGeral = { primeiraQuinzena: { metros: 0, valor: 0 }, segundaQuinzena: { metros: 0, valor: 0 }, total: { metros: 0, valor: 0 } };
        
        funcionariosMap.forEach((dados, funcionario) => {
            totalGeral.primeiraQuinzena.metros += dados.primeiraQuinzena.metros;
            totalGeral.primeiraQuinzena.valor += dados.primeiraQuinzena.valor;
            totalGeral.segundaQuinzena.metros += dados.segundaQuinzena.metros;
            totalGeral.segundaQuinzena.valor += dados.segundaQuinzena.valor;
            totalGeral.total.metros += dados.total.metros;
            totalGeral.total.valor += dados.total.valor;
            
            html += `
                <tr>
                    <td>${funcionario}</td>
                    <td>${dados.primeiraQuinzena.metros.toFixed(2)}</td>
                    <td>R$ ${dados.primeiraQuinzena.valor.toFixed(2)}</td>
                    <td>${dados.segundaQuinzena.metros.toFixed(2)}</td>
                    <td>R$ ${dados.segundaQuinzena.valor.toFixed(2)}</td>
                    <td>${dados.total.metros.toFixed(2)}</td>
                    <td>R$ ${dados.total.valor.toFixed(2)}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
                <tfoot>
                    <tr style="font-weight: bold; background-color: #f8f9fa;">
                        <td>TOTAL GERAL</td>
                        <td>${totalGeral.primeiraQuinzena.metros.toFixed(2)}</td>
                        <td>R$ ${totalGeral.primeiraQuinzena.valor.toFixed(2)}</td>
                        <td>${totalGeral.segundaQuinzena.metros.toFixed(2)}</td>
                        <td>R$ ${totalGeral.segundaQuinzena.valor.toFixed(2)}</td>
                        <td>${totalGeral.total.metros.toFixed(2)}</td>
                        <td>R$ ${totalGeral.total.valor.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        resultadoQuinzena.innerHTML = html;
    }
    
    // Função para exportar relatório em PDF
    function exportarRelatorioPDF() {
        if (!dadosRelatorioAtual) return;
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.text('Relatório de Corte de Cana', 20, 20);
        doc.text(`Período: ${document.getElementById('data-inicio').value} a ${document.getElementById('data-fim').value}`, 20, 30);
        
        const headers = [['Data', 'Turma', 'Fazenda', 'Talhão', 'Funcionário', 'Metros', 'Valor (R$)']];
        const data = [];
        
        let totalMetros = 0;
        let totalValor = 0;
        
        dadosRelatorioAtual.forEach(apontamento => {
            apontamento.cortes_funcionarios.forEach(corte => {
                totalMetros += corte.metros;
                totalValor += corte.valor;
                
                data.push([
                    new Date(apontamento.data_corte).toLocaleDateString('pt-BR'),
                    apontamento.turma,
                    apontamento.fazendas.nome,
                    apontamento.talhoes.numero.toString(),
                    corte.funcionarios.nome,
                    corte.metros.toFixed(2),
                    'R$ ' + corte.valor.toFixed(2)
                ]);
            });
        });
        
        data.push(['TOTAL', '', '', '', '', totalMetros.toFixed(2), 'R$ ' + totalValor.toFixed(2)]);
        
        doc.autoTable({
            head: headers,
            body: data,
            startY: 40,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [44, 119, 68] }
        });
        
        doc.save('relatorio_corte_cana.pdf');
    }
    
    // Função para exportar espelho de quinzena em PDF
    function exportarQuinzenaPDF() {
        if (!dadosQuinzenaAtual) return;
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.text('Espelho de Quinzena - Corte de Cana', 20, 20);
        doc.text(`Turma: ${dadosQuinzenaAtual.turma.toUpperCase()} - ${dadosQuinzenaAtual.mes}/${dadosQuinzenaAtual.ano}`, 20, 30);
        
        const headers = [['Funcionário', '1ª Quinzena (m)', '1ª Quinzena (R$)', '2ª Quinzena (m)', '2ª Quinzena (R$)', 'Total (m)', 'Total (R$)']];
        const data = [];
        
        // Agrupar por funcionário (mesma lógica da exibição)
        const funcionariosMap = new Map();
        
        const todosDados = [...dadosQuinzenaAtual.primeiraQuinzena, ...dadosQuinzenaAtual.segundaQuinzena];
        
        todosDados.forEach(apontamento => {
            apontamento.cortes_funcionarios.forEach(corte => {
                const funcionarioNome = corte.funcionarios.nome;
                
                if (!funcionariosMap.has(funcionarioNome)) {
                    funcionariosMap.set(funcionarioNome, {
                        primeiraQuinzena: { metros: 0, valor: 0 },
                        segundaQuinzena: { metros: 0, valor: 0 },
                        total: { metros: 0, valor: 0 }
                    });
                }
                
                const dataCorte = new Date(apontamento.data_corte);
                const dia = dataCorte.getDate();
                const quinzena = dia <= 15 ? 'primeiraQuinzena' : 'segundaQuinzena';
                
                funcionariosMap.get(funcionarioNome)[quinzena].metros += corte.metros;
                funcionariosMap.get(funcionarioNome)[quinzena].valor += corte.valor;
                funcionariosMap.get(funcionarioNome).total.metros += corte.metros;
                funcionariosMap.get(funcionarioNome).total.valor += corte.valor;
            });
        });
        
        let totalGeral = { primeiraQuinzena: { metros: 0, valor: 0 }, segundaQuinzena: { metros: 0, valor: 0 }, total: { metros: 0, valor: 0 } };
        
        funcionariosMap.forEach((dados, funcionario) => {
            totalGeral.primeiraQuinzena.metros += dados.primeiraQuinzena.metros;
            totalGeral.primeiraQuinzena.valor += dados.primeiraQuinzena.valor;
            totalGeral.segundaQuinzena.metros += dados.segundaQuinzena.metros;
            totalGeral.segundaQuinzena.valor += dados.segundaQuinzena.valor;
            totalGeral.total.metros += dados.total.metros;
            totalGeral.total.valor += dados.total.valor;
            
            data.push([
                funcionario,
                dados.primeiraQuinzena.metros.toFixed(2),
                'R$ ' + dados.primeiraQuinzena.valor.toFixed(2),
                dados.segundaQuinzena.metros.toFixed(2),
                'R$ ' + dados.segundaQuinzena.valor.toFixed(2),
                dados.total.metros.toFixed(2),
                'R$ ' + dados.total.valor.toFixed(2)
            ]);
        });
        
        data.push([
            'TOTAL GERAL',
            totalGeral.primeiraQuinzena.metros.toFixed(2),
            'R$ ' + totalGeral.primeiraQuinzena.valor.toFixed(2),
            totalGeral.segundaQuinzena.metros.toFixed(2),
            'R$ ' + totalGeral.segundaQuinzena.valor.toFixed(2),
            totalGeral.total.metros.toFixed(2),
            'R$ ' + totalGeral.total.valor.toFixed(2)
        ]);
        
        doc.autoTable({
            head: headers,
            body: data,
            startY: 40,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [44, 119, 68] }
        });
        
        doc.save(`espelho_quinzena_${dadosQuinzenaAtual.turma}_${dadosQuinzenaAtual.mes}_${dadosQuinzenaAtual.ano}.pdf`);
    }
});