import { fetchDashboardData } from './api.js';
import { updateDashboard } from './dashboard.js';
import { addStage, removeStage, stages } from './stages.js'; // Импортируем stages
import { addCustomRisk, addTypicalRisksByCategory, removeRisk, risks } from './risks.js'; // Импортируем risks
import { runSimulation, setMitigation } from './simulation.js';
import { saveData, loadData } from './storage.js';
import { createModel } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    window.addStage = addStage;
    window.addCustomRisk = addCustomRisk;
    window.addTypicalRisksByCategory = addTypicalRisksByCategory;
    window.createModel = async () => {
        const success = await createModel(stages, risks); // Теперь stages и risks доступны
        if (success) {
            const data = await fetchDashboardData();
            if (data) updateDashboard(data.metrics, data.risks, data.dashboardData);
        }
    };
    window.setMitigation = setMitigation;
    window.runSimulation = runSimulation;
    window.saveData = saveData;
    window.loadData = loadData;
    window.removeRisk = removeRisk;
    window.removeStage = removeStage;
});