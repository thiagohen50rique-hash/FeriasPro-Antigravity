
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Funcionario, PeriodoAquisitivo, PeriodoDeFerias, InformacaoAssinatura } from '../tipos';
import { getLogoDataUrl } from './logoService';
import { getDynamicStatus, getStatusText } from '../constants';

const formatDate = (dateStr: string | null, withTime = false) => {
    if (!dateStr) return 'N/A';

    // CORREÇÃO BUG-02: Tratamento direto de strings YYYY-MM-DD
    // Evita a criação de objeto Date para datas puras, prevenindo
    // deslocamento de dia devido a diferenças de fuso horário (UTC vs Local).
    if (!withTime && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    try {
        // Use UTC date parts to avoid timezone issues when formatting timestamps
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'N/A';

        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();

        if (withTime) {
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            const seconds = String(date.getUTCSeconds()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        }

        return `${day}/${month}/${year}`;
    } catch (e) {
        return 'N/A';
    }
};


const addPageFooters = (doc: jsPDF, isSigned: boolean) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const footerText = "RH.REG.FER.009 | Requerimento de Programação de Férias | Versão 9.0 | Vigência: 17/11/2025";
    const leftMargin = 15;

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#6B7280'); // gray-500

        if (i === 1) { // First page footer
            doc.setFontSize(6);
            doc.text(footerText, leftMargin, doc.internal.pageSize.height - 10, { align: 'left' });
        } else if (isSigned) { // Certificate pages footer
            const pageNumText = `Página ${i} de ${pageCount}`;
            doc.setFontSize(8);
            doc.text(pageNumText, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 8);
        }
    }
};


export const generateVacationRequestPDF = async (employee: Funcionario, period: PeriodoAquisitivo, allEmployees: Funcionario[], vacation?: PeriodoDeFerias, outputType: 'save' | 'blob' = 'save'): Promise<Blob | null> => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const page_width = doc.internal.pageSize.getWidth();
    const leftMargin = 15;
    const rightMargin = 15;
    const contentWidth = page_width - leftMargin - rightMargin;
    let currentY = 15;
    const sectionSpacing = 10;

    // === HEADER ===
    try {
        const logoDataUrl = await getLogoDataUrl();
        const logoWidth = 45;
        const logoX = page_width - rightMargin - logoWidth;
        doc.addImage(logoDataUrl, 'PNG', logoX, currentY, logoWidth, 0);
    } catch (e) {
        console.error("Error loading logo for PDF:", e);
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#0F172A'); // slate-900
    doc.text('REQUERIMENTO DE FÉRIAS', leftMargin, currentY + 5);

    currentY += 25;

    // === DADOS DO COLABORADOR ===
    doc.setFillColor('#EBF2FF'); // blue-25
    doc.setDrawColor('#B3C0D7'); // blue-200

    doc.rect(leftMargin, currentY, contentWidth, 32, 'FD');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#002C78'); // primary
    doc.text('Dados do Colaborador', leftMargin + 4, currentY + 8);

    autoTable(doc, {
        startY: currentY + 12,
        body: [
            ['Nome:', employee.nome, 'Matrícula:', employee.matricula],
            ['Cargo:', employee.cargo, 'Unidade:', employee.unidade],
            ['Data de Admissão:', formatDate(employee.dataAdmissao), '', ''],
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1.5 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 35, textColor: '#475569' },
            1: { cellWidth: 'auto', textColor: '#1E293B' },
            2: { fontStyle: 'bold', cellWidth: 25, textColor: '#475569' },
            3: { cellWidth: 40, textColor: '#1E293B' },
        },
        margin: { left: leftMargin + 4 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 4; // Add padding

    // === DECLARAÇÃO INICIAL ===
    currentY += sectionSpacing;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#002C78');
    doc.text('Declaração Inicial', leftMargin, currentY);
    currentY += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#1F2937');
    const declarationText = `Eu, na qualidade de funcionário(a) do COMITÊ BRASILEIRO DE CLUBES - CBC, venho por meio deste documento requerer a programação das minhas férias conforme os detalhes abaixo, de acordo com as políticas da empresa e a legislação vigente.`;
    doc.text(declarationText, leftMargin, currentY, { maxWidth: contentWidth, align: 'justify' });
    const declDimensions = doc.getTextDimensions(declarationText, { maxWidth: contentWidth });
    currentY += declDimensions.h;


    // === DADOS DO PERÍODO AQUISITIVO ===
    currentY += sectionSpacing;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#002C78');
    doc.text('Dados do Período Aquisitivo', leftMargin, currentY);
    currentY += 6;

    autoTable(doc, {
        startY: currentY,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1.5 },
        body: [
            ['Período Aquisitivo:', `${formatDate(period.inicioPa)} a ${formatDate(period.terminoPa)}`],
            ['Limite para Concessão:', formatDate(period.limiteConcessao)],
        ],
        columnStyles: {
            0: { fontStyle: 'bold', textColor: '#475569', cellWidth: 45 },
            1: { textColor: '#1E293B' },
        },
        margin: { left: leftMargin },
    });
    currentY = (doc as any).lastAutoTable.finalY;

    // === DADOS DA PROGRAMAÇÃO DE FÉRIAS ===
    currentY += sectionSpacing;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#002C78');
    doc.text('Dados da Programação de Férias', leftMargin, currentY);
    currentY += 6;

    const allFractions = [...period.fracionamentos].sort((a, b) => new Date(a.inicioFerias).getTime() - new Date(b.inicioFerias).getTime());

    const head = [['#', 'Período de Gozo', 'Dias Férias', 'Dias Abono', '13º Salário', 'Status']];
    const body = allFractions.map(f => {
        let displayStatus = getDynamicStatus(f);
        // If the period is in a workflow state (e.g., rejected), and the fraction is just 'planned',
        // the period's status takes precedence for display purposes.
        if (['pending_manager', 'pending_rh', 'rejected'].includes(period.status) && f.status === 'planned') {
            // FIX: Type assertion is needed because TypeScript doesn't infer the narrowed type of `period.status` from `Array.includes`.
            // The values 'pending_manager', 'pending_rh', and 'rejected' are present in both PeriodoDeFerias['status'] and PeriodoAquisitivo['status'],
            // making this a safe cast.
            displayStatus = period.status as PeriodoDeFerias['status'];
        }
        return [
            `${f.sequencia}º`,
            `${formatDate(f.inicioFerias)} a ${formatDate(f.terminoFerias)}`,
            `${f.quantidadeDias} dias`,
            f.diasAbono > 0 ? `${f.diasAbono} dias` : 'Não',
            f.adiantamento13 ? 'Sim' : 'Não',
            getStatusText(displayStatus)
        ];
    });

    autoTable(doc, {
        startY: currentY,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: {
            fillColor: '#475569', // slate-600
            textColor: '#FFFFFF',
            fontSize: 9,
            fontStyle: 'bold',
        },
        styles: {
            fontSize: 9,
            cellPadding: 2,
            lineColor: '#E2E8F0', // slate-200
            lineWidth: 0.2,
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 25, halign: 'center' },
            5: { halign: 'center' },
        },
        margin: { left: leftMargin, right: rightMargin },
        didParseCell: (data) => {
            if (data.section !== 'body' || !vacation) return;
            const rowIndex = data.row.index;
            const currentFraction = allFractions[rowIndex];

            if (currentFraction && currentFraction.id === vacation.id) {
                data.cell.styles.fillColor = '#EBF2FF'; // blue-25
                data.cell.styles.textColor = '#002C78';
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });
    currentY = (doc as any).lastAutoTable.finalY;

    // === COMPROMISSO ===
    currentY += sectionSpacing;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#002C78');
    doc.text('Compromisso', leftMargin, currentY);
    currentY += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#1F2937');
    const commitmentText = `Comprometo-me a comunicar ao meu gestor imediato quaisquer impedimentos para o gozo das férias nas datas programadas e estou ciente de que alterações podem estar sujeitas à aprovação e às necessidades operacionais da empresa.`;
    doc.text(commitmentText, leftMargin, currentY, { maxWidth: contentWidth, align: 'justify' });
    const commitDimensions = doc.getTextDimensions(commitmentText, { maxWidth: contentWidth });
    currentY += commitDimensions.h;

    // === DATE LINE ===
    currentY = Math.max(currentY, 210);
    const today = new Date();
    const formattedDate = today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Brasília/DF, ${formattedDate}`, leftMargin, currentY);

    // === SIGNATURES ===
    currentY += 20;

    const signatureY = currentY + 10;
    doc.setFontSize(9);

    const signatureBlock = (name: string, role: string, x: number, width: number) => {
        let y = signatureY;
        doc.setFont('helvetica', 'bold');
        doc.text(name.toUpperCase(), x, y, { align: 'center', maxWidth: width - 4 });
        y += 4;
        doc.setFont('helvetica', 'normal');
        doc.text(role, x, y, { align: 'center', maxWidth: width - 4 });
        y += 4;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor('#1F2937'); // black
        doc.text('(assinado digitalmente)', x, y, { align: 'center', maxWidth: width - 4 });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
    };

    const signaturesToRender: { name: string; role: string }[] = [];
    const infoAssinatura = period.infoAssinatura;


    // 1. Employee (always present)
    signaturesToRender.push({ name: employee.nome, role: 'Funcionário(a)' });

    // 2. Approvers
    const managerApprover = allEmployees.find(e => e.id === period.idAprovadorGestor);
    const hrApprover = allEmployees.find(e => e.id === period.idAprovadorRH);

    if (managerApprover && hrApprover && managerApprover.id === hrApprover.id) {
        // Same person is manager and HR, show them once with their actual title
        signaturesToRender.push({ name: managerApprover.nome, role: managerApprover.cargo });
    } else {
        if (managerApprover) {
            signaturesToRender.push({ name: managerApprover.nome, role: 'Gestor(a)' });
        }
        if (hrApprover) {
            signaturesToRender.push({ name: hrApprover.nome, role: 'Recursos Humanos' });
        }
    }

    const totalSignatures = signaturesToRender.length;
    const blockWidth = contentWidth / totalSignatures;

    signaturesToRender.forEach((sig, index) => {
        const x = leftMargin + (index * blockWidth) + (blockWidth / 2);
        signatureBlock(sig.name, sig.role, x, blockWidth);
    });

    currentY = signatureY + 15;

    if (infoAssinatura) {
        doc.setFontSize(7);
        doc.setTextColor('#1F2937');
        doc.text('Documento assinado digitalmente. Veja o Certificado de Operação nas páginas seguintes.', page_width / 2, currentY, { align: 'center' });
    }

    // =========== CERTIFICATE PAGES (if signed) ===========
    if (infoAssinatura) {
        const signedParticipants = infoAssinatura.participantes.filter(p => p.dataConclusao);
        doc.addPage();
        let certY = 20;

        signedParticipants.forEach((p, index) => {
            const signerName = p.assinante.nome;
            const signerRole = p.assinante.cargo;
            const signerCpf = p.assinante.cpf;
            const signerEmail = p.assinante.email;

            const signatureDate = p.dataConclusao ? new Date(p.dataConclusao).toLocaleString('pt-BR') : 'N/A';

            const ip = p.enderecoIP;
            const authMethod = p.metodoAutenticacao;
            const device = p.dispositivo;
            const geo = p.geolocalizacao;

            if (certY > 210) {
                doc.addPage();
                certY = 20;
            }

            doc.setFont('helvetica', 'bold');
            doc.setTextColor('#1E293B');
            doc.setFontSize(12);
            doc.text('✓', 14, certY);
            doc.text(signerName, 20, certY);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor('#334155');
            const summaryStartY = certY;
            certY += 6;
            doc.text(`Função: ${signerRole}`, 20, certY);
            certY += 5;
            doc.text(`Concluído em: ${signatureDate}`, 20, certY);
            certY += 5;
            doc.text(`IP: ${ip}`, 20, certY);
            certY += 5;
            doc.text(`Houve dupla autenticação: ${authMethod}`, 20, certY);
            certY += 5;
            doc.text(`Dispositivo utilizado: ${device}`, 20, certY);
            certY += 5;
            doc.text(`Geolocalização: ${geo}`, 20, certY);

            const signatureBoxX = 130;
            const signatureBoxY = summaryStartY - 2;
            doc.setDrawColor('#D1D5DB');
            doc.roundedRect(signatureBoxX, signatureBoxY, 65, 30, 3, 3);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Assinatura', signatureBoxX + 5, signatureBoxY + 7);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor('#6B7280');
            doc.text('Assinatura efetuada por clique', signatureBoxX + 22, signatureBoxY + 14);
            doc.text(signatureDate, signatureBoxX + 22, signatureBoxY + 18);
            doc.setTextColor('#1F2937');
            doc.setFont('helvetica', 'bold');
            doc.text(signerName, signatureBoxX + 22, signatureBoxY + 25, { maxWidth: 40 });

            certY += 8;

            const tableBody = p.eventos.map(event => [
                { content: event.name, styles: { fontStyle: 'bold' as 'bold' } },
                { content: `${formatDate(event.timestamp, true)}\n(GMT -3:00)`, styles: { fontStyle: 'bold' as 'bold' } },
                event.detalhes,
            ]);

            autoTable(doc, {
                startY: certY,
                head: [
                    [{ content: `Histórico de ação de: ${signerName}`, colSpan: 3, styles: { fontStyle: 'bold', fontSize: 11, fillColor: '#F3F4F6', textColor: '#1F2937' } }],
                    ['', 'Data e Hora', 'Histórico de eventos']
                ],
                body: tableBody,
                theme: 'grid',
                headStyles: { fontStyle: 'bold', fillColor: '#FFFFFF', textColor: '#374151' },
                styles: { fontSize: 9, cellPadding: 3, lineColor: '#E5E7EB', lineWidth: 0.2 },
                columnStyles: { 1: { cellWidth: 40 }, 2: { cellWidth: 'auto' } },
                didParseCell: (data) => {
                    if (data.section === 'head' && data.row.index === 1) { data.cell.styles.fillColor = '#FFFFFF'; }
                    if (data.section === 'body' && data.column.index === 0) { data.cell.styles.textColor = '#374151'; }
                }
            });

            certY = (doc as any).lastAutoTable.finalY;

            if (index < signedParticipants.length - 1) {
                certY += 15;
                doc.setDrawColor('#E5E7EB');
                doc.line(14, certY, page_width - rightMargin, certY);
                certY += 10;
            }
        });
    }

    addPageFooters(doc, !!infoAssinatura);

    if (outputType === 'blob') {
        return doc.output('blob');
    }

    doc.save(`Requerimento_Ferias_${employee.nome.replace(' ', '_')}_${period.id}.pdf`);
    return null;
};
