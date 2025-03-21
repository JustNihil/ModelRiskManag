// main.js
import { fetchDashboardData, createModel, updateProgress, fetchRiskLogs } from './api.js';
import { updateDashboard, updateRiskLogsTable } from './dashboard.js';
import { addStage, removeStage, stages } from './stages.js';
import { addCustomRisk, addTypicalRisksByCategory, removeRisk, risks } from './risks.js';
import { runSimulation, setMitigation } from './simulation.js';
import { saveData, loadData } from './storage.js';

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
    window.saveData = saveData;
    window.loadData = loadData;
    window.removeRisk = removeRisk;
    window.removeStage = removeStage;
    window.updateProgress = async () => {
        const stageUpdates = stages.map(stage => ({
            name: stage.name,
            actualDuration: parseFloat(document.getElementById(`actualDuration_${stage.name}`).value) || 0,
            actualCost: parseFloat(document.getElementById(`actualCost_${stage.name}`).value) || 0
        }));
        const success = await updateProgress(stageUpdates);
        if (success) {
            // Обновляем локальные данные этапов
            stageUpdates.forEach(update => {
                const stage = stages.find(s => s.name === update.name);
                if (stage) {
                    stage.actualDuration = update.actualDuration;
                    stage.actualCost = update.actualCost;
                }
            });
            window.updateStagesTable();
            const data = await fetchDashboardData();
            if (data) updateDashboard(data.metrics, data.risks, data.dashboardData);
            const logs = await fetchRiskLogs();
            updateRiskLogsTable(logs);
        }
    };
});