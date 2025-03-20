export function fetchDashboardData() {
    return fetch('http://localhost:8089/exportDashboard', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => {
        if (!res.ok) throw new Error(`Ошибка: ${res.status} - ${res.statusText}`);
        return res.json();
    })
    .then(data => {
        if (data.error) throw new Error(data.error);
        return { metrics: data.metrics, risks: data.risks, dashboardData: JSON.parse(data.dashboardData) };
    })
    .catch(error => {
        console.error("Ошибка получения данных:", error);
        return null;
    });
}

export async function createModel(stages, risks) {
    if (!stages?.length) {
        alert("Добавьте хотя бы один этап.");
        return false;
    }
    try {
        const timeThreshold = parseFloat(document.getElementById('timeThreshold').value) || 150;
        const costThreshold = parseFloat(document.getElementById('costThreshold').value) || 75000;
        const targetTime = parseFloat(document.getElementById('targetTime').value) || 120;
        const targetCost = parseFloat(document.getElementById('targetCost').value) || 60000;
        const data = { stages, risks, timeThreshold, costThreshold, targetTime, targetCost };
        const response = await fetch('http://localhost:8089/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
        return true;
    } catch (error) {
        console.error('Ошибка создания модели:', error);
        alert("Ошибка: " + error.message);
        return false;
    }
}

export async function addRisk(risk) {
    if (!risk?.name || risk.probability < 0 || risk.impactTime < 0 || risk.impactCost < 0) {
        alert("Заполните все поля риска корректно.");
        return false;
    }
    try {
        const response = await fetch('http://localhost:8089/addRisk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(risk)
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка добавления риска:', error);
        return false;
    }
}

export async function setMitigation(strategy, budget) {
    if (!strategy || isNaN(budget) || budget < 0) {
        alert("Введите корректную стратегию и положительный бюджет.");
        return false;
    }
    try {
        const response = await fetch('http://localhost:8089/mitigation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strategy, budget })
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка установки стратегии:', error);
        return false;
    }
}

export async function fetchRiskLogs() {
    try {
        const response = await fetch('http://localhost:8089/riskLogs', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Ошибка получения логов:', error);
        return [];
    }
}