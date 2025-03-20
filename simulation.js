import { fetchDashboardData } from './api.js';
import { updateDashboard } from './dashboard.js';

export async function runSimulation() {
    try {
        const response = await fetch('http://localhost:8089/run', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
        const data = await fetchDashboardData();
        if (data) updateDashboard(data.metrics, data.risks, data.dashboardData);
    } catch (error) {
        console.error("Ошибка симуляции:", error);
    }
}

export async function setMitigation() {
    const strategy = document.getElementById('mitigationStrategy').value;
    const budget = parseFloat(document.getElementById('mitigationBudget').value);
    const success = await setMitigation(strategy, budget);
    if (success) {
        const data = await fetchDashboardData();
        if (data) updateDashboard(data.metrics, data.risks, data.dashboardData);
    }
}