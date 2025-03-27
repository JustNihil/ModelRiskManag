import { setMitigation as setMitigationApi } from './api.js';

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