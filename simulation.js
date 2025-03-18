import { fetchDashboardData } from './api.js';
import { setMitigation as setMitigationApi } from './api.js'; // Переименуем для ясности

export async function runSimulation() {
    try {
        const response = await fetch('http://localhost:8089/run', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`Ошибка запуска симуляции: ${response.status} - ${response.statusText}`);
        const text = await response.text();
        console.log("Симуляция завершена:", text);
        await fetchDashboardData(); // Обновляем данные после симуляции
    } catch (error) {
        console.error("Ошибка симуляции:", error);
        alert("Ошибка: " + error.message);
    }
}

export async function setMitigation() {
    const strategy = document.getElementById('mitigationStrategy').value;
    const budget = parseFloat(document.getElementById('mitigationBudget').value);
    const success = await setMitigationApi(strategy, budget); // Используем функцию из api.js
    if (success) {
        try {
            await fetchDashboardData();
        } catch (error) {
            console.error("Ошибка обновления данных после установки стратегии:", error);
        }
    }
}