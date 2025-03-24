import { fetchDashboardData, createModel, updateProgress, fetchRiskLogs } from './api.js';
import { updateDashboard, updateRiskLogsTable } from './dashboard.js';
import { addStage, removeStage, stages } from './stages.js';
import { addCustomRisk, addTypicalRisksByCategory, removeRisk, risks } from './risks.js';
import { runSimulation, setMitigation } from './simulation.js';
import { loadData } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
    // Добавляем функции в глобальную область видимости
    window.addStage = addStage;
    window.addCustomRisk = addCustomRisk;
    window.addTypicalRisksByCategory = addTypicalRisksByCategory;
    window.createModel = async () => {
        const success = await createModel(stages, risks);
        if (success) {
            const data = await fetchDashboardData();
            if (data) updateDashboard(data.metrics, data.risks, data.dashboardData);
            const logs = await fetchRiskLogs();
            updateRiskLogsTable(logs);
        }
    };
    window.setMitigation = setMitigation;
    window.runSimulation = async () => {
        await runSimulation();
        const data = await fetchDashboardData();
        if (data) updateDashboard(data.metrics, data.risks, data.dashboardData);
        const logs = await fetchRiskLogs();
        updateRiskLogsTable(logs);
    };
    window.loadData = loadData;
    window.removeRisk = removeRisk;
    window.removeStage = removeStage;
    window.updateProgress = async () => {
        const stageUpdates = stages.map(stage => {
            const actualDurationInput = document.getElementById(`actualDuration_${stage.safeName}`);
            const actualCostInput = document.getElementById(`actualCost_${stage.safeName}`);

            if (!actualDurationInput || !actualCostInput) {
                console.error(`Не найдены поля ввода для этапа ${stage.name}`);
                return null;
            }

            return {
                name: stage.name,
                actualDuration: parseFloat(actualDurationInput.value) || 0,
                actualCost: parseFloat(actualCostInput.value) || 0
            };
        }).filter(update => update !== null);

        if (stageUpdates.length === 0) {
            alert("Нет этапов для обновления или поля ввода не найдены.");
            return;
        }

        const success = await updateProgress(stageUpdates);
        if (success) {
            stageUpdates.forEach(update => {
                const stage = stages.find(s => s.name === update.name);
                if (stage) {
                    stage.actualDuration = update.actualDuration;
                    stage.actualCost = update.actualCost;
                }
            });
            window.updateStagesTable();
            // Запрашиваем обновленные данные с сервера
            const data = await fetchDashboardData();
            if (data) updateDashboard(data.metrics, data.risks, data.dashboardData);
            const logs = await fetchRiskLogs();
            updateRiskLogsTable(logs);
        }
    };
});