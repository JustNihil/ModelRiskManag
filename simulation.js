import { fetchToken } from './auth.js';
import { fetchDashboardData } from './api.js';
import { setMitigation as apiSetMitigation } from './api.js';

// Логика симуляции и управления рисками
export async function runSimulation() {
    const token = await fetchToken() || localStorage.getItem('superset_token');
    if (!token) return;

    try {
        const response = await fetch('http://localhost:8080/run', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Ошибка запуска симуляции: ${response.status} - ${response.statusText}`);
        const text = await response.text();
        console.log("Симуляция завершена:", text);

        const resultsResponse = await fetch('http://localhost:8080/results', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        if (!resultsResponse.ok) throw new Error(`Ошибка получения результатов: ${resultsResponse.status} - ${resultsResponse.statusText}`);
        const data = await resultsResponse.json();
        console.log("Результаты симуляции:", data);
        fetchDashboardData();
    } catch (error) {
        console.error("Ошибка:", error);
        alert("Ошибка: " + error.message);
    }
}

export function setMitigation() {
    const strategy = document.getElementById('mitigationStrategy').value;
    const budget = parseFloat(document.getElementById('mitigationBudget').value);
    if (!strategy || isNaN(budget) || budget < 0) {
        alert("Введите корректную стратегию и положительный бюджет.");
        return;
    }
    apiSetMitigation(strategy, budget).then(success => {
        if (success) fetchDashboardData();
    });
}