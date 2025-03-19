import { fetchDashboardData } from './api.js';
import { updateDashboard } from './dashboard.js';
import { addStage, stages } from './stages.js';
import { addCustomRisk, addTypicalRisk, risks } from './risks.js';
import { runSimulation, setMitigation } from './simulation.js';
import { saveData, loadData } from './storage.js';
import { createModel } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    window.addStage = addStage;
    window.addRisk = addCustomRisk;
    window.addTypicalRisk = addTypicalRisk;
    window.createModel = async () => {
        console.log("Отправляемые данные:", { stages, risks }); // Для отладки
        const success = await createModel(stages, risks);
        if (success) fetchDashboardData().then(data => data && updateDashboard(data.metrics, data.risks, data.dashboardData)).catch(() => {});
    };
    window.setMitigation = async () => {
        await setMitigation();
    };
    window.runSimulation = runSimulation;
    window.saveData = saveData;
    window.loadData = loadData;
});