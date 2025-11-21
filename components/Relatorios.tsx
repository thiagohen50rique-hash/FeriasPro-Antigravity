

import React from 'react';
import DocumentChartBarIcon from './icons/DocumentChartBarIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

interface ReportsProps {
    onSelectReport: (reportType: string) => void;
}

const ReportCard: React.FC<{
    title: string;
    description: string;
    onClick: () => void;
}> = ({ title, description, onClick }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 flex flex-col">
        <div className="flex items-start mb-4">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full mr-4">
                <DocumentChartBarIcon className="h-6 w-6" />
            </div>
            <div>
                <h4 className="text-lg font-bold text-slate-800">{title}</h4>
                <p className="text-sm text-slate-600 mt-1">{description}</p>
            </div>
        </div>
        <div className="mt-auto pt-4 flex items-center justify-end">
            <button
                onClick={onClick}
                className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary border border-transparent rounded-lg hover:bg-blue-600 transition">
                Gerar Relatório
                <ArrowRightIcon className="h-4 w-4 ml-2" />
            </button>
        </div>
    </div>
);

const Relatorios: React.FC<ReportsProps> = ({ onSelectReport }) => {
    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-bold text-blue-900">Central de Relatórios</h3>
                <p className="text-slate-600 mt-1">
                    Selecione um dos relatórios abaixo para visualizar e exportar os dados.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReportCard
                    title="Férias Programadas"
                    description="Lista todas as férias programadas."
                    onClick={() => onSelectReport('scheduled_chrono')}
                />
                <ReportCard
                    title="Consolidado de Saldos"
                    description="Apresenta o saldo de férias atual de todos os colaboradores."
                    onClick={() => onSelectReport('balance_summary')}
                />
            </div>
        </div>
    );
};

export default Relatorios;