// risks.js
import { addRisk } from './api.js';

export const risks = [];
export const typicalRisks = {
    "Технические": [
        { name: "Задержка в разработке", probability: 0.4, impactTime: 10, impactCost: 5000, strategy: "Mitigate" },
        { name: "Кибератака", probability: 0.2, impactTime: 15, impactCost: 20000, strategy: "Eliminate" },
        { name: "Сбой сервера", probability: 0.25, impactTime: 5, impactCost: 3000, strategy: "Mitigate" }
    ],
    "Организационные": [
        { name: "Отсутствие сотрудников", probability: 0.3, impactTime: 30, impactCost: 10000, strategy: "Eliminate" },
        { name: "Неправильное планирование", probability: 0.5, impactTime: 20, impactCost: 15000, strategy: "Mitigate" },
        { name: "Конфликт в команде", probability: 0.35, impactTime: 15, impactCost: 8000, strategy: "Mitigate" }
    ],
    "Внешние": [
        { name: "Задержка поставки оборудования", probability: 0.3, impactTime: 15, impactCost: 7000, strategy: "Mitigate" },
        { name: "Изменение законодательства", probability: 0.15, impactTime: 20, impactCost: 12000, strategy: "Monitor" },
        { name: "Погодные условия", probability: 0.1, impactTime: 10, impactCost: 5000, strategy: "Monitor" }
    ]
};

export async function addCustomRisk() {
    const risk = {
        name: document.getElementById('riskName').value,
        probability: parseFloat(document.getElementById('riskProb').value),
        impactTime: parseFloat(document.getElementById('riskTime').value),
        impactCost: parseFloat(document.getElementById('riskCost').value),
        strategy: document.getElementById('riskStrategy').value || "Ignore",
        category: document.getElementById('riskCategory').value || "Не указано"
    };
    if (risk.name && risk.probability >= 0 && risk.probability <= 1 && risk.impactTime >= 0 && risk.impactCost >= 0) {
        // Проверяем, существует ли риск с таким именем
        if (risks.some(r => r.name === risk.name)) {
            alert(`Риск с именем "${risk.name}" уже существует.`);
            return;
        }
        const success = await addRisk(risk);
        if (success) {
            risks.push(risk);
            updateRisksTable();
            // Очищаем поля ввода после успешного добавления
            document.getElementById('riskName').value = '';
            document.getElementById('riskProb').value = '';
            document.getElementById('riskTime').value = '';
            document.getElementById('riskCost').value = '';
            document.getElementById('riskStrategy').value = 'Ignore';
            document.getElementById('riskCategory').value = 'Не указано';
        } else {
            alert("Не удалось добавить риск. Возможно, он уже существует на сервере.");
        }
    } else {
        alert("Заполните все поля корректно.");
    }
}

export async function addTypicalRisksByCategory(category) {
    const categoryRisks = typicalRisks[category] || [];
    let added = false;
    for (const risk of categoryRisks) {
        // Проверяем, существует ли риск с таким именем
        if (risks.some(r => r.name === risk.name)) {
            console.log(`Риск "${risk.name}" уже существует, пропускаем.`);
            continue;
        }
        const newRisk = { ...risk, category };
        const success = await addRisk(newRisk);
        if (success) {
            risks.push(newRisk);
            added = true;
        }
    }
    if (added) {
        updateRisksTable();
    } else {
        alert("Все риски этой категории уже добавлены.");
    }
}

export function removeRisk(index) {
    risks.splice(index, 1);
    updateRisksTable();
}

export function updateRisksTable() {
    const table = document.getElementById('risksTable');
    while (table.rows.length > 1) table.deleteRow(1);
    risks.forEach((risk, index) => {
        const row = table.insertRow();
        row.insertCell().textContent = risk.name;
        row.insertCell().textContent = risk.probability;
        row.insertCell().textContent = risk.impactTime;
        row.insertCell().textContent = risk.impactCost;
        row.insertCell().textContent = risk.strategy;
        row.insertCell().textContent = risk.category;
        row.insertCell().innerHTML = `<button class="delete-btn" onclick="removeRisk(${index})">✖</button>`;
    });
}