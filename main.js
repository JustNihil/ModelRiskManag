import { fetchDashboardData } from './api.js';
import { updateDashboard } from './dashboard.js';
import { addStage, stages } from './stages.js';
import { addCustomRisk, addTypicalRisk } from './risks.js';
import { runSimulation, setMitigation } from './simulation.js';
import { saveData, loadData } from './storage.js';
import { createModel } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    let updateIntervalId = null;

    window.startUpdates = function() {
        const intervalInput = document.getElementById('updateInterval');
        const interval = parseInt(intervalInput.value) * 1000;
        if (isNaN(interval) || interval < 10000) {
            alert("Интервал должен быть числом и не менее 10 секунд.");
            return;
        }
        if (updateIntervalId) clearInterval(updateIntervalId);
        fetchDashboardData().then(data => data && updateDashboard(data.metrics, data.risks, data.dashboardData)).catch(() => {});
        updateIntervalId = setInterval(() => {
            fetchDashboardData().then(data => data && updateDashboard(data.metrics, data.risks, data.dashboardData)).catch(() => {});
        }, interval);
        alert(`Обновление запущено с интервалом ${interval / 1000} секунд.`);
    };

    window.stopUpdates = function() {
        if (updateIntervalId) {
            clearInterval(updateIntervalId);
            updateIntervalId = null;
            alert("Обновление остановлено.");
        } else {
            alert("Обновление не запущено.");
        }
    };

    window.addStage = addStage;
    window.addRisk = addCustomRisk;
    window.addTypicalRisk = addTypicalRisk;
    window.createModel = async () => {
        const success = await createModel(stages);
        if (success) fetchDashboardData().then(data => data && updateDashboard(data.metrics, data.risks, data.dashboardData)).catch(() => {});
    };
    window.setMitigation = async () => {
        await setMitigation();
    };
    window.runSimulation = runSimulation;
    window.saveData = saveData;
    window.loadData = loadData;
});