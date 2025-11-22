import { useState, useEffect, useCallback } from 'react';
import {
    FeriadoEmpresa,
    ConfiguracaoApp,
    RegraFeriasColetivas,
    UnidadeOrganizacional,
    NivelHierarquico,
    NovoFeriadoEmpresa,
    NovaRegraFeriasColetivas
} from '../tipos';
import * as api from '../services/api';

export const useAppData = () => {
    const [holidays, setHolidays] = useState<FeriadoEmpresa[]>([]);
    const [config, setConfig] = useState<ConfiguracaoApp | null>(null);
    const [collectiveVacationRules, setCollectiveVacationRules] = useState<RegraFeriasColetivas[]>([]);
    const [orgUnits, setOrgUnits] = useState<UnidadeOrganizacional[]>([]);
    const [hierarchyLevels, setHierarchyLevels] = useState<NivelHierarquico[]>([]);
    const [holidayTypes, setHolidayTypes] = useState<string[]>(['feriado', 'ponto_facultativo', 'recesso']);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [
                holidaysData,
                configData,
                orgUnitsData,
                collectiveRulesData
            ] = await Promise.all([
                api.fetchHolidays(),
                api.fetchConfig(),
                api.fetchOrgUnits(),
                api.fetchCollectiveVacationRules()
            ]);

            setHolidays(holidaysData);
            setConfig(configData);
            setOrgUnits(orgUnitsData);
            setCollectiveVacationRules(collectiveRulesData);
        } catch (error) {
            console.error("Error loading app data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addHoliday = useCallback(async (holidayData: NovoFeriadoEmpresa) => {
        try {
            await api.createHoliday(holidayData);
            const holidays = await api.fetchHolidays();
            setHolidays(holidays);
        } catch (error) {
            console.error("Failed to add holiday:", error);
        }
    }, []);

    const updateHoliday = useCallback((updatedHoliday: FeriadoEmpresa) => {
        setHolidays(prev =>
            prev
                .map(h => h.id === updatedHoliday.id ? updatedHoliday : h)
                .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
        );
        // API call
    }, []);

    const deleteHoliday = useCallback((holidayId: number) => {
        setHolidays(prev => prev.filter(h => h.id !== holidayId));
        // API call
    }, []);

    const updateConfig = useCallback((newConfig: ConfiguracaoApp) => {
        setConfig(newConfig);
        // API call
    }, []);

    const addCollectiveVacationRule = useCallback((ruleData: NovaRegraFeriasColetivas) => {
        const newRule: RegraFeriasColetivas = {
            ...ruleData,
            id: 0, // ID será retornado pela API
        };
        setCollectiveVacationRules(prev => [...prev, newRule]);
        // API call
    }, []);

    const updateCollectiveVacationRule = useCallback((updatedRule: RegraFeriasColetivas) => {
        setCollectiveVacationRules(prev =>
            prev.map(rule => (rule.id === updatedRule.id ? updatedRule : rule))
        );
        // API call
    }, []);

    const deleteCollectiveVacationRule = useCallback((ruleId: number) => {
        setCollectiveVacationRules(prev => prev.filter(rule => rule.id !== ruleId));
        // API call
    }, []);

    const updateOrgUnits = useCallback((newOrgUnits: UnidadeOrganizacional[]) => {
        setOrgUnits(newOrgUnits);
    }, []);

    const updateHierarchyLevels = useCallback((newLevels: NivelHierarquico[]) => {
        setHierarchyLevels(newLevels);
    }, []);

    return {
        holidays,
        config,
        collectiveVacationRules,
        orgUnits,
        hierarchyLevels,
        holidayTypes,
        loading,
        setHolidayTypes,
        addHoliday,
        updateHoliday,
        deleteHoliday,
        updateConfig,
        addCollectiveVacationRule,
        updateCollectiveVacationRule,
        deleteCollectiveVacationRule,
        updateOrgUnits,
        updateHierarchyLevels,
        refreshData: fetchData
    };
};
