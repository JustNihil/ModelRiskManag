// simulation.js
import { setMitigation as setMitigationApi } from './api.js';

export async function runSimulation() {
    try {
        const response = await fetch('http://localhost:8089/run', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`Ошибка: ${response.status} - ${response.statusText}`);
        console.log("Симуляция запущена успешно");
    } catch (error) {
        console.error("Ошибка симуляции:", error);
        alert("Ошибка симуляции: " + error.message);
    }
}

export async function setMitigation() {
    const strategy = document.getElementById('mitigationStrategy').value;
    const budget = parseFloat(document.getElementById('mitigationBudget').value);
    const success = await setMitigationApi(strategy, budget);
    if (success) {
        console.log("Стратегия управления рисками установлена");
    } else {
        alert("Ошибка установки стратегии");
    }
}