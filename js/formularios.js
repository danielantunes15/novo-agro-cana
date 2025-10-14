document.addEventListener('DOMContentLoaded', async () => {
    const turmaSelect = document.getElementById('turma-select');
    const gerarPdfBtn = document.getElementById('gerar-pdf-btn');
    const loadingElement = document.getElementById('loading');
    const contentElement = document.getElementById('content');
    const errorElement = document.getElementById('error-message');

    // Função para carregar as turmas no select
    async function carregarTurmas() {
        try {
            loadingElement.style.display = 'block';
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
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    // Função para gerar o PDF
    async function gerarPDF() {
        const turmaId = turmaSelect.value;
        const turmaNome = turmaSelect.options[turmaSelect.selectedIndex].text;

        if (!turmaId) {
            mostrarMensagem('Por favor, selecione uma turma.', 'error');
            return;
        }

        try {
            loadingElement.style.display = 'block';

            // Buscar funcionários da turma selecionada
            const { data: funcionarios, error } = await supabase
                .from('funcionarios')
                .select('nome')
                .eq('turma', turmaId)
                .order('nome');

            if (error) throw error;

            if (funcionarios.length === 0) {
                mostrarMensagem('Nenhum funcionário encontrado para esta turma.', 'error');
                return;
            }

            // Iniciar a criação do PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Cabeçalho do PDF
            doc.setFontSize(18);
            doc.text('Formulário de Apontamento Manual', 105, 20, null, null, 'center');
            doc.setFontSize(12);
            doc.text(`Turma: ${turmaNome}`, 20, 30);
            doc.text(`Data: ___/___/______`, 150, 30);
            doc.text('Fazenda/Talhão: ________________________', 20, 40);

            // Tabela com os funcionários
            const tableColumn = ["Funcionário", "Metros", "Valor (R$)", "Assinatura"];
            const tableRows = [];

            funcionarios.forEach(func => {
                const row = [
                    func.nome,
                    '', // Deixar em branco para preenchimento manual
                    '', // Deixar em branco
                    ''  // Deixar em branco
                ];
                tableRows.push(row);
            });

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 50,
                theme: 'striped',
                headStyles: {
                    fillColor: [44, 119, 68] // Verde do Agro Cana Forte
                }
            });
            
            // Salvar o PDF
            doc.save(`formulario-apontamento-${turmaNome}.pdf`);

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            mostrarMensagem('Erro ao gerar o PDF: ' + error.message, 'error');
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    // Adicionar Event Listener ao botão
    gerarPdfBtn.addEventListener('click', gerarPDF);

    // Carregar as turmas ao iniciar a página
    await carregarTurmas();
});