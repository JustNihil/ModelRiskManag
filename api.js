import { fetchToken } from './auth.js';

// Функции для работы с API
export function fetchDashboardData(maxAttempts = 3, attempt = 1) {
    let token = localStorage.getItem('superset_token');
    if (!token) {
        console.warn('Токен не найден в localStorage, запрашиваю новый...');
        return fetchToken().then(newToken => {
            if (newToken) {
                token = newToken;
                localStorage.setItem('superset_token', token);
                return proceedWithFetch(token, maxAttempts, attempt);
            } else if (attempt < maxAttempts) {
                console.log(`Попытка ${attempt + 1} из ${maxAttempts}...`);
                return new Promise(resolve => setTimeout(() => resolve(fetchDashboardData(maxAttempts, attempt + 1)), 2000));
            } else {
                alert("Не удалось получить токен после " + maxAttempts + " попыток. Дашборд не обновлен.");
            }
        });
    }
    return proceedWithFetch(token, maxAttempts, attempt);
}

function proceedWithFetch(token, maxAttempts, attempt) {
    return Promise.all([
        fetch('http://localhost:8089/api/v1/chart/121', {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: AbortSignal.timeout(5000)
        }).then(res => {
            if (!res.ok) throw new Error(`Ошибка при получении метрик: ${res.status} - ${res.statusText}`);
            return res.json();
        }),
        fetch('http://localhost:8089/api/v1/chart/122', {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: AbortSignal.timeout(5000)
        }).then(res => {
            if (!res.ok) throw new Error(`Ошибка при получении рисков: ${res.status} - ${res.statusText}`);
            return res.json();
        }),
        fetch('http://localhost:8089/api/v1/dashboard/12', {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: AbortSignal.timeout(5000)
        }).then(res => {
            if (!res.ok) throw new Error(`Ошибка при получении дашборда: ${res.status} - ${res.statusText}`);
            return res.json();
        })
    ])
    .then(([metrics, risksData, dashboardData]) => {
        return { metrics: metrics.result, risks: risksData.result, dashboardData: dashboardData.result };
    })
    .catch(error => {
        console.error("Ошибка при загрузке данных дашборда:", error);
        if ((error.message.includes('422') || error.message.includes('401')) && attempt < maxAttempts) {
            console.warn('Проблема, запрашиваю новый токен...');
            return fetchToken().then(newToken => {
                if (newToken) {
                    localStorage.setItem('superset_token', newToken);
                    return proceedWithFetch(newToken, maxAttempts, attempt + 1);
                } else {
                    console.log(`Попытка ${attempt + 1} из ${maxAttempts} не удалась.`);
                    return new Promise(resolve => setTimeout(() => resolve(fetchDashboardData(maxAttempts, attempt + 1)), 2000));
                }
            });
        } else {
            alert("Невозможно получить данные дашборда: " + error.message);
        }
    });
}

export async function createModel(stages, token) {
    if (stages.length === 0) {
        alert("Добавьте хотя бы один этап перед созданием модели.");
        return;
    }
    try {
        const response = await fetch('http://localhost:8089/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(stages)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}. Details: ${errorText}`);
        }
        const text = await response.text();
        console.log('Response text:', text);
        alert(text);
    } catch (error) {
        console.error('Ошибка создания модели:', error);
        alert("Ошибка создания модели: " + error.message);
    }
}

export async function addRisk(risk) {
    try {
        const response = await fetch('http://localhost:8089/addRisk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(risk)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        alert(text);
        return true;
    } catch (error) {
        alert("Ошибка добавления риска: " + error.message);
        return false;
    }
}

export async function setMitigation(strategy, budget) {
    try {
        const response = await fetch('http://localhost:8089/mitigation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strategy, budget })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        alert(text);
        return true;
    } catch (error) {
        alert("Ошибка установки стратегии: " + error.message);
        return false;
    }
}