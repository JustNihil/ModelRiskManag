import { addRisk } from './api.js';

// Управление рисками
export const risks = [];
export const typicalRisks = [
    { name: "Задержка в разработке", probability: 0.4, impactTime: 10, impactCost: 5000, strategy: "Mitigate" },
    { name: "Отсутствие сотрудников", probability: 0.3, impactTime: 30, impactCost: 10000, strategy: "Eliminate" },
    { name: "Задержка поставки оборудования", probability: 0.3, impactTime: 15, impactCost: 7000, strategy: "Mitigate" },
    { name: "Неправильное планирование", probability: 0.5, impactTime: 20, impactCost: 15000, strategy: "Mitigate" },
    { name: "Кибератака", probability: 0.2, impactTime: 15, impactCost: 20000, strategy: "Eliminate" }
];

export function addCustomRisk() {
    const riskName = document.getElementById('riskName');
    const riskProb = document.getElementById('riskProb');
    const riskTime = document.getElementById('riskTime');
    const riskCost = document.getElementById('riskCost');
    const riskStrategy = document.getElementById('riskStrategy');
    const name = riskName.value;
    const probability = parseFloat(riskProb.value);
    const impactTime = parseFloat(riskTime.value);
    const impactCost = parseFloat(riskCost.value);
    const strategy = riskStrategy.value || "Ignore";
    if (name && !isNaN(probability) && !isNaN(impactTime) && !isNaN(impactCost)) {
        const risk = { name, probability, impactTime, impactCost, strategy };
        risks.push(risk);
        addRisk(risk).then(success => {
            if (success) {
                updateRisksTable();
                riskName.value = '';
                riskProb.value = '';
                riskTime.value = '';
                riskCost.value = '';
            }
        });
    } else {
        alert("Пожалуйста, заполните все поля корректно (вероятность, время и стоимость должны быть числами)");
    }
}

export function addTypicalRisk(riskName) {
    const risk = typicalRisks.find(r => r.name === riskName);
    if (risk) {
        risks.push(risk);
        addRisk(risk).then(success => {
            if (success) updateRisksTable();
        });
    }
}

export function updateRisksTable() {
    const table = document.getElementById('risksTable');
    while (table.rows.length > 1) table.deleteRow(1);
    risks.forEach(risk => {
        const row = table.insertRow();
        row.insertCell().textContent = risk.name;
        row.insertCell().textContent = risk.probability;
        row.insertCell().textContent = risk.impactTime;
        row.insertCell().textContent = risk.impactCost;
        row.insertCell().textContent = risk.strategy || "Игнорировать (по умолчанию)";
    });
}