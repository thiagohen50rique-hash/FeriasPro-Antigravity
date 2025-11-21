import React, { useMemo, useState } from 'react';
import { Funcionario } from '../tipos';
import { getDynamicStatus } from '../constants';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface TeamVacationChartProps {
    teamMembers: Funcionario[];
}

const GraficoFeriasEquipe: React.FC<TeamVacationChartProps> = ({ teamMembers }) => {
    const [year, setYear] = useState(2025); // Inicia em 2025 para mostrar os dados futuros

    const chartData = useMemo(() => {
        const monthlyEmployeeSets: Set<string>[] = Array(12).fill(0).map(() => new Set<string>());
        const monthlyTotalDays: number[] = Array(12).fill(0);
        const validStatuses = ['approved', 'enjoying', 'scheduled', 'pending_manager', 'pending_rh'];

        teamMembers.forEach(emp => {
            emp.periodosAquisitivos.forEach(pa => {
                pa.fracionamentos.forEach(vac => {
                    const dynamicStatus = getDynamicStatus(vac);
                    if (validStatuses.includes(dynamicStatus)) {
                        const startDate = new Date(`${vac.inicioFerias}T12:00:00Z`);
                        const endDate = new Date(`${vac.terminoFerias}T12:00:00Z`);

                        for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
                            if (d.getUTCFullYear() === year) {
                                const monthIndex = d.getUTCMonth();
                                monthlyEmployeeSets[monthIndex].add(emp.nome);
                                monthlyTotalDays[monthIndex] += 1;
                            }
                        }
                    }
                });
            });
        });

        const maxDays = Math.max(...monthlyTotalDays, 1);
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        return {
            labels: months,
            employeeSets: monthlyEmployeeSets,
            dayTotals: monthlyTotalDays,
            maxDays: maxDays,
        };
    }, [teamMembers, year]);

    return (
        <div className="bg-white p-6 rounded-lg shadow border border-slate-200 mt-6">
            <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg font-bold text-slate-800">Distribuição de Férias da Equipe ({year})</h3>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setYear(y => y - 1)} className="p-1.5 rounded-full hover:bg-slate-100" aria-label="Ano anterior">
                        <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
                    </button>
                    <button onClick={() => setYear(y => y + 1)} className="p-1.5 rounded-full hover:bg-slate-100" aria-label="Próximo ano">
                        <ChevronRightIcon className="h-5 w-5 text-slate-600" />
                    </button>
                </div>
            </div>
            <p className="text-sm text-slate-500 mb-6">Soma de dias de férias agendados por mês. Ajuda a identificar picos e planejar a cobertura da equipe.</p>
            <div className="w-full h-64 flex justify-between" aria-label={`Gráfico de barras mostrando a soma de dias de férias por mês em ${year}`}>
                {chartData.labels.map((label, index) => {
                    const totalDays = chartData.dayTotals[index];
                    const namesSet = chartData.employeeSets[index];
                    const totalEmployees = namesSet.size;

                    const barHeight = (totalDays / chartData.maxDays) * 100;
                    const namesList = Array.from(namesSet).join(', ');

                    return (
                        <div key={index} className="flex-1 flex flex-col items-center justify-end group relative px-1">
                            {totalEmployees > 0 && (
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-max max-w-xs text-center">
                                    <p className="font-bold text-sm text-white">{totalEmployees} {totalEmployees === 1 ? 'colaborador' : 'colaboradores'}</p>
                                    <p className="font-normal whitespace-normal text-white">{namesList}</p>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4" style={{ borderColor: 'transparent', borderTopColor: 'rgb(30 41 59)' }}></div>
                                </div>
                            )}
                            <div
                                className="w-full bg-blue-200 hover:bg-blue-400 rounded-t-md transition-all duration-300 relative"
                                style={{ height: `${barHeight}%` }}
                                role="tooltip"
                                aria-label={`${totalDays} dias de férias e ${totalEmployees} colaborador(es) em ${label}`}
                            >
                                {barHeight > 10 && (
                                    <span className="absolute top-1 left-1/2 -translate-x-1/2 text-xs font-bold text-blue-800">{totalDays}</span>
                                )}
                            </div>
                            <span className="text-xs font-semibold text-slate-500 mt-2">{label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GraficoFeriasEquipe;