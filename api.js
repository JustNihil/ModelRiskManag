export function fetchDashboardData() {
    return fetch('http://localhost:8089/exportDashboard', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => {
        if (!res.ok) throw new Error(`Ошибка получения данных: ${res.status} - ${res.statusText}`);
        return res.json();
    })
    .then(data => {
        if (data.error) throw new Error(data.error);
        return { metrics: data.metrics, risks: data.risks, dashboardData: data.dashboardData };
    })
    .catch(error => {
        console.error("Ошибка получения данных дашборда:", error);
        alert("Ошибка: " + error.message);
        throw error;
    });
}

export async function createModel(stages, risks) {
    if (!stages || stages.length === 0) {
        alert("Добавьте хотя бы один этап перед созданием модели.");
        return false;
    }
    try {
        const data = { stages, risks };
        console.log("Формируемые данные для отправки:", data); // Для отладки
        console.log("JSON для отправки:", JSON.stringify(data)); // Для отладки
        const response = await fetch('http://localhost:8089/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        const text = await response.text();
        alert(text);
        return true;
    } catch (error) {
        console.error('Ошибка создания модели:', error);
        alert("Ошибка создания модели: " + error.message);
        return false;
    }
}

export async function addRisk(risk) {
    if (!risk || !risk.name) {
        alert("Заполните все поля риска корректно.");
        return false;
    }
    try {
        const response = await fetch('http://localhost:8089/addRisk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(risk)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        const text = await response.text();
        alert(text);
        return true;
    } catch (error) {
        console.error('Ошибка добавления риска:', error);
        alert("Ошибка добавления риска: " + error.message);
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
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        const text = await response.text();
        alert(text);
        return true;
    } catch (error) {
        console.error('Ошибка установки стратегии:', error);
        alert("Ошибка установки стратегии: " + error.message);
        return false;
    }
}