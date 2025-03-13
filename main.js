import { fetchDashboardData } from './api.js';
import { updateDashboard } from './dashboard.js';
import { addStage, stages } from './stages.js';
import { addCustomRisk, addTypicalRisk } from './risks.js';
import { runSimulation, setMitigation } from './simulation.js';
import { saveData, loadData } from './storage.js';
import { createModel } from './api.js';
import { fetchToken } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    let updateIntervalId = null;

    // Привязка функций к глобальному объекту window для использования в HTML
    window.startUpdates = function() {
        const intervalInput = document.getElementById('updateInterval');
        const interval = parseInt(intervalInput.value) * 1000;
        if (interval < 10000) {
            alert("Интервал должен быть не менее 10 секунд.");
            return;
        }
        if (updateIntervalId) clearInterval(updateIntervalId);
        fetchDashboardData().then(data => data && updateDashboard(data.metrics, data.risks, data.dashboardData));
        updateIntervalId = setInterval(() => {
            fetchDashboardData().then(data => data && updateDashboard(data.metrics, data.risks, data.dashboardData));
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

    window.addStage = addStage; // Экспорт функции для добавления этапов
    window.addRisk = addCustomRisk; // Экспорт функции для добавления рисков
    window.addTypicalRisk = addTypicalRisk; // Экспорт функции для типичных рисков
    window.createModel = async () => {
        const token = await fetchToken() || localStorage.getItem('superset_token');
        if (token) {
            await createModel(stages, token);
            fetchDashboardData().then(data => data && updateDashboard(data.metrics, data.risks, data.dashboardData));
        }
    };
    window.setMitigation = () => {
        setMitigation();
        fetchDashboardData().then(data => data && updateDashboard(data.metrics, data.risks, data.dashboardData));
    };
    window.runSimulation = runSimulation; // Экспорт функции симуляции
    window.saveData = saveData; // Экспорт функции сохранения
    window.loadData = loadData; // Экспорт функции загрузки

    // Инициализация (раскомментируй, если нужно автоматическое обновление при загрузке)
    // fetchDashboardData().then(data => data && updateDashboard(data.metrics, data.risks, data.dashboardData));
});