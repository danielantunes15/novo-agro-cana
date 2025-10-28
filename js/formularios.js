document.addEventListener('DOMContentLoaded', async () => {
    // Autenticação
    if (!window.sistemaAuth || !window.sistemaAuth.requerAutenticacao()) return;

    // Elementos do DOM
    const turmaSelect = document.getElementById('turma-select');
    const gerarPreviewBtn = document.getElementById('gerar-preview-btn');
    const gerarBrancoBtn = document.getElementById('gerar-branco-btn');
    const imprimirBtn = document.getElementById('imprimir-btn');
    const previewContainer = document.getElementById('preview-container');
    const errorElement = document.getElementById('error-message');
    
    // NOVO: Capturar o botão de Excel
    const exportarExcelBtn = document.getElementById('exportar-excel-btn');
    
    // Carrega as turmas no select
    async function carregarTurmas() {
        try {
            const { data, error } = await supabase
                .from('turmas')
                .select('id, nome')
                .order('nome');

            if (error) throw error;

            turmaSelect.innerHTML = '<option value="">Selecione uma turma</option>';
            data.forEach(turma => {
                const option = document.createElement('option');
                option.value = turma.id;
                option.textContent = turma.nome;
                turmaSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
            errorElement.style.display = 'block';
            mostrarMensagem('Falha ao carregar a lista de turmas.', 'error');
        }
    }

    // Gera a pré-visualização do formulário POR TURMA
    async function gerarPreviewPorTurma() {
        const turmaId = turmaSelect.value;
        const turmaNome = turmaSelect.options[turmaSelect.selectedIndex].text;
        
        if (!turmaId) {
            mostrarMensagem('Por favor, selecione a turma.', 'error');
            return;
        }

        try {
            const { data: funcionarios, error } = await supabase
                .from('funcionarios')
                .select('nome, codigo')
                .eq('turma', turmaId)
                .order('nome'); // ALTERADO: Ordena APENAS por nome (ordem alfabética)

            if (error) throw error;

            // Preenche o cabeçalho
            document.getElementById('preview-turma').textContent = turmaNome;
            
            const tbody = document.getElementById('funcionarios-tbody');
            tbody.innerHTML = '';
            
            // Adiciona funcionários da turma
            funcionarios.forEach(func => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${func.codigo || ''}</td> <td>${func.nome}</td>           <td></td><td></td><td></td><td></td><td></td> `;
                tbody.appendChild(tr);
            });
            
            // Adiciona 5 linhas em branco extras para anotações (Total de 7 colunas)
            for (let i = 0; i < 5; i++) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td></td><td></td><td></td><td></td><td></td><td></td><td></td> `;
                tbody.appendChild(tr);
            }

            // Exibe o formulário
            previewContainer.style.display = 'block';
            imprimirBtn.style.display = 'inline-block';
            
            // NOVO: Exibe o botão de Excel
            if (exportarExcelBtn) exportarExcelBtn.style.display = 'inline-block';
            
            mostrarMensagem('Formulário da turma gerado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao gerar preview:', error);
            mostrarMensagem('Erro ao buscar funcionários: ' + error.message, 'error');
        }
    }

    // Gera um formulário EM BRANCO com 45 linhas
    function gerarFormularioEmBranco() {
        // Limpa o campo de turma
        document.getElementById('preview-turma').textContent = "__________________";

        const tbody = document.getElementById('funcionarios-tbody');
        tbody.innerHTML = '';
            
        // Adiciona 45 linhas totalmente em branco (Total de 7 colunas)
        for (let i = 0; i < 45; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td></td><td></td><td></td><td></td><td></td><td></td><td></td> `;
            tbody.appendChild(tr);
        }

        // Exibe o formulário
        previewContainer.style.display = 'block';
        imprimirBtn.style.display = 'inline-block';
        
        // NOVO: Exibe o botão de Excel
        if (exportarExcelBtn) exportarExcelBtn.style.display = 'inline-block';
        
        mostrarMensagem('Formulário em branco gerado com sucesso!', 'success');
    }

    // Função de impressão
    function imprimirFormulario() {
        window.print();
    }

    //
    // --- INÍCIO DA NOVA FUNÇÃO DE EXPORTAR EXCEL ---
    //
    function exportarFormularioExcel() {
        const previewContainer = document.getElementById('preview-container');
        if (!previewContainer || previewContainer.style.display === 'none') {
            mostrarMensagem('Gere um formulário primeiro para poder exportar.', 'error');
            return;
        }

        const turmaNome = document.getElementById('preview-turma').textContent.trim();
        const dataAtual = new Date().toISOString().split('T')[0];
        const fileName = `Formulario_Apontamento_${turmaNome || 'Em_Branco'}_${dataAtual}.csv`;

        let csvContent = "\uFEFF"; // BOM (Byte Order Mark) para garantir UTF-8 no Excel

        // 1. Cabeçalho do Formulário (informações)
        csvContent += "AGRO CANA FORTE\n";
        csvContent += "FORMULÁRIO DE APONTAMENTO DE PRODUÇÃO\n\n";
        
        // Usamos ponto e vírgula (;) como delimitador, comum no Excel em português
        csvContent += `FAZENDA:; \n`;
        csvContent += `TALHÃO:; \n`;
        csvContent += `DATA:; \n`;
        // Coloca a turma na segunda coluna
        csvContent += `TURMA:;${turmaNome}\n\n`;

        // 2. Cabeçalho da Tabela (Thead)
        const tableHead = document.querySelector('.form-sheet table thead tr');
        let headers = [];
        tableHead.querySelectorAll('th').forEach(th => {
            // Coloca o texto entre aspas para tratar espaços ou caracteres especiais
            headers.push(`"${th.textContent.trim()}"`);
        });
        csvContent += headers.join(';') + '\n';

        // 3. Corpo da Tabela (Tbody)
        const tableBody = document.getElementById('funcionarios-tbody');
        tableBody.querySelectorAll('tr').forEach(tr => {
            let rowData = [];
            tr.querySelectorAll('td').forEach(td => {
                rowData.push(`"${td.textContent.trim()}"`);
            });
            csvContent += rowData.join(';') + '\n';
        });

        // 4. Rodapé da Tabela (Tfoot)
        const tableFoot = document.querySelector('.form-sheet table tfoot tr');
        let footerData = [];
        tableFoot.querySelectorAll('td').forEach(td => {
            footerData.push(`"${td.textContent.trim()}"`);
        });
        csvContent += footerData.join(';') + '\n\n';
        
        // 5. Assinatura
        csvContent += "Assinatura do Responsável:;\n";

        // 6. Criação e Download do Blob (Arquivo CSV)
        try {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) { // Verifica se o navegador suporta download
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', fileName);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                mostrarMensagem('Exportação para Excel (CSV) iniciada!', 'success');
            } else {
                mostrarMensagem('Seu navegador não suporta o download automático.', 'error');
            }
        } catch (error) {
            console.error('Erro ao exportar Excel (CSV):', error);
            mostrarMensagem('Ocorreu um erro ao tentar gerar o arquivo Excel.', 'error');
        }
    }
    //
    // --- FIM DA NOVA FUNÇÃO ---
    //

    // Event Listeners
    gerarPreviewBtn.addEventListener('click', gerarPreviewPorTurma);
    gerarBrancoBtn.addEventListener('click', gerarFormularioEmBranco);
    imprimirBtn.addEventListener('click', imprimirFormulario);
    
    // NOVO: Adiciona o listener para o botão de Excel
    if (exportarExcelBtn) {
        exportarExcelBtn.addEventListener('click', exportarFormularioExcel);
    }

    // Inicialização
    await carregarTurmas();
});