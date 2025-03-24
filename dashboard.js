import { fetchRiskLogs } from './api.js';

// Переменные для хранения объектов Chart
let metricsChart = null;
let costImpactChart = null;
let timeImpactChart = null;
let timeDistChart = null;
let costDistChart = null;

export function createHistogramLabels(data, bins) {
    if (!data || data.length === 0) {
        console.warn("Данные для гистограммы пусты, возвращаем пустые метки");
        return Array.from({ length: bins }, (_, i) => (i * 10).toFixed(1));
    }
    const numericData = data.map(val => Number(val)).filter(val => !isNaN(val));
    if (numericData.length === 0) {
        console.warn("После фильтрации данные пусты, возвращаем фиктивные метки");
        return Array.from({ length: bins }, (_, i) => (i * 10).toFixed(1));
    }
    const min = Math.min(...numericData);
    const max = Math.max(...numericData);
    if (isNaN(min) || isNaN(max)) {
        console.error("Некорректные min или max:", min, max);
        return Array.from({ length: bins }, (_, i) => (i * 10).toFixed(1));
    }
    const binSize = (max - min) / bins;
    console.log("Создание меток гистограммы:", { min, max, binSize });
    return Array.from({ length: bins }, (_, i) => (min + i * binSize));
}

export function createHistogramData(data, bins) {
    if (!data || data.length === 0) {
        console.warn("Данные для гистограммы пусты, возвращаем пустую гистограмму");
        return Array(bins).fill(0);
    }
    const numericData = data.map(val => Number(val)).filter(val => !isNaN(val));
    if (numericData.length === 0) {
        console.warn("После фильтрации данные пусты, возвращаем пустую гистограмму");
        return Array(bins).fill(0);
    }
    const min = Math.min(...numericData);
    const max = Math.max(...numericData);
    if (isNaN(min) || isNaN(max)) {
        console.error("Некорректные min или max:", min, max);
        return Array(bins).fill(0);
    }
    const binSize = (max - min) / bins;
    const histogram = Array(bins).fill(0);
    numericData.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
        histogram[binIndex]++;
    });
    console.log("Создание данных гистограммы:", histogram);
    return histogram;
}

export function generateRecommendations(metrics, risks, dashboardData) {
    const recs = [];

    if (metrics.total_time > 100) {
        recs.push("Ожидаемое время проекта превышает 100 дней. Рассмотрите возможность ускорения этапов.");
    }
    if (dashboardData?.timeStdDev > 10) {
        recs.push(`Высокая неопределённость по времени: стандартное отклонение составляет ${dashboardData.timeStdDev.toFixed(1)} дней. Сфокусируйтесь на снижении неопределённости в критических этапах.`);
    }
    if (dashboardData?.timeTargetProbability < 0.5) {
        recs.push(`Низкая вероятность уложиться в целевое время (${dashboardData.targetTime.toFixed(1)} дней): ${(dashboardData.timeTargetProbability * 100).toFixed(1)}%. Добавьте буфер времени или пересмотрите этапы.`);
    }
    if (dashboardData?.timeExceedProbability > 0.2) {
        recs.push(`Высокий риск задержки: вероятность превышения ${dashboardData.timeThreshold.toFixed(1)} дней составляет ${(dashboardData.timeExceedProbability * 100).toFixed(1)}%. Рассмотрите меры по ускорению критических этапов.`);
    }
    if (dashboardData?.criticalStages && dashboardData.criticalStages.length > 0) {
        const criticalStageNames = dashboardData.criticalStages.map(stage => stage.name).join(', ');
        recs.push(`Критические этапы, вносящие наибольшую неопределённость: ${criticalStageNames}. Проверьте возможность оптимизации этих этапов.`);
    }
    if (dashboardData?.scheduleVariance && dashboardData.scheduleVariance > 0) {
        recs.push(`Проект отстает от графика на ${dashboardData.scheduleVariance.toFixed(1)} дней. Ускорьте выполнение этапов.`);
    }

    if (metrics.total_cost > 50000) {
        recs.push("Ожидаемая стоимость проекта превышает 50,000$. Рассмотрите оптимизацию бюджета.");
    }
    if (dashboardData?.costStdDev > 5000) {
        recs.push(`Высокая неопределённость по стоимости: стандартное отклонение составляет $${dashboardData.costStdDev.toFixed(0)}. Сфокусируйтесь на снижении неопределённости в критических рисках.`);
    }
    if (dashboardData?.costTargetProbability < 0.5) {
        recs.push(`Низкая вероятность уложиться в целевой бюджет ($${dashboardData.targetCost.toFixed(0)}): ${(dashboardData.costTargetProbability * 100).toFixed(1)}%. Добавьте финансовый буфер или пересмотрите затраты.`);
    }
    if (dashboardData?.costExceedProbability > 0.2) {
        recs.push(`Высокий риск превышения бюджета: вероятность превышения $${dashboardData.costThreshold.toFixed(0)} составляет ${(dashboardData.costExceedProbability * 100).toFixed(1)}%. Рассмотрите меры по снижению затрат.`);
    }
    if (dashboardData?.costVariance && dashboardData.costVariance > 0) {
        recs.push(`Проект превышает бюджет на $${dashboardData.costVariance.toFixed(0)}. Оптимизируйте затраты.`);
    }

    if (risks.some(r => r.priority > 10)) {
        const highPriorityRisks = risks.filter(r => r.priority > 10).map(r => r.name).join(', ');
        recs.push(`Обратите внимание на риски с высоким приоритетом (>10): ${highPriorityRisks}. Разработайте стратегии их снижения.`);
    }
    if (dashboardData?.criticalRisks && dashboardData.criticalRisks.length > 0) {
        const criticalRiskNames = dashboardData.criticalRisks.map(risk => risk.name).join(', ');
        recs.push(`Критические риски, вносящие наибольшую неопределённость: ${criticalRiskNames}. Приоритетно разработайте меры по их управлению.`);
    }

    if (dashboardData?.timeConfidenceUpper > dashboardData?.timeThreshold) {
        recs.push(`Верхняя граница доверительного интервала времени (${dashboardData.timeConfidenceUpper.toFixed(1)} дней) превышает пороговое значение (${dashboardData.timeThreshold.toFixed(1)} дней). Увеличьте буфер времени или пересмотрите риски.`);
    }
    if (dashboardData?.costConfidenceUpper > dashboardData?.costThreshold) {
        recs.push(`Верхняя граница доверительного интервала стоимости ($${dashboardData.costConfidenceUpper.toFixed(0)}) превышает пороговое значение ($${dashboardData.costThreshold.toFixed(0)}). Увеличьте бюджетный резерв или пересмотрите затраты.`);
    }

    if (dashboardData?.contingencyReserveUsed > dashboardData?.contingencyReserve * 0.8) {
        recs.push(`Использовано более 80% резерва на риски ($${dashboardData.contingencyReserveUsed.toFixed(0)} из $${dashboardData.contingencyReserve.toFixed(0)}). Рассмотрите увеличение резерва.`);
    }
    if (risks.some(r => r.strategy === "Ignore" && r.priority > 5)) {
        const ignoredRisks = risks.filter(r => r.strategy === "Ignore" && r.priority > 5).map(r => r.name).join(', ');
        recs.push(`Риски с приоритетом выше 5 игнорируются: ${ignoredRisks}. Рекомендуется разработать стратегии управления для этих рисков.`);
    }

    return recs.length ? recs : ["Нет критических рекомендаций на данный момент."];
}

export function updateRiskLogsTable(logs) {
    const table = document.getElementById('riskLogsTable');
    while (table.rows.length > 1) table.deleteRow(1);
    if (logs && Array.isArray(logs) && logs.length > 0) {
        logs.forEach(log => {
            const row = table.insertRow();
            row.insertCell().textContent = log.riskName || 'N/A';
            row.insertCell().textContent = log.action || 'N/A';
            row.insertCell().textContent = log.details || 'N/A';
        });
    } else {
        const row = table.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 3;
        cell.textContent = "Логи отсутствуют";
    }
}

export function updateDashboard(metrics, risks, dashboardData) {
    console.log("Обновление дашборда, метрики:", metrics, "риски:", risks, "данные дашборда:", dashboardData);

    const summary = document.getElementById('dashboardSummary');
    const riskTable = document.getElementById('riskResultsTable');
    const recDiv = document.getElementById('recommendations');

    if (!metrics || typeof metrics !== 'object') {
        console.error("Метрики не найдены или результат пустой:", metrics);
        summary.innerHTML = "<p>Ошибка: Метрики не загружены.</p>";
        return;
    }

    summary.innerHTML = `
        <h3>Ключевые метрики</h3>
        <p>Ожидаемое время проекта: ${metrics.total_time ? metrics.total_time.toFixed(1) : 'N/A'} дней</p>
        <p>Стандартное отклонение времени: ${dashboardData?.timeStdDev ? dashboardData.timeStdDev.toFixed(1) : 'N/A'} дней</p>
        <p>95% доверительный интервал времени: от ${dashboardData?.timeConfidenceLower ? dashboardData.timeConfidenceLower.toFixed(1) : 'N/A'} до ${dashboardData?.timeConfidenceUpper ? dashboardData.timeConfidenceUpper.toFixed(1) : 'N/A'} дней</p>
        <p>Вероятность уложиться в ${dashboardData?.targetTime ? dashboardData.targetTime.toFixed(1) : 'N/A'} дней: ${(dashboardData?.timeTargetProbability * 100).toFixed(1)}%</p>
        <p>Вероятность превышения ${dashboardData?.timeThreshold ? dashboardData.timeThreshold.toFixed(1) : 'N/A'} дней: ${(dashboardData?.timeExceedProbability * 100).toFixed(1)}%</p>
        <p>Ожидаемая стоимость проекта: $${metrics.total_cost ? metrics.total_cost.toFixed(0) : 'N/A'}</p>
        <p>Базовая стоимость (без учета рисков): $${metrics.base_cost ? metrics.base_cost.toFixed(0) : 'N/A'}</p>
        <p>Резерв на риски: $${metrics.contingency_reserve ? metrics.contingency_reserve.toFixed(0) : 'N/A'}</p>
        <p>Использовано резерва: $${metrics.contingency_reserve_used ? metrics.contingency_reserve_used.toFixed(0) : 'N/A'}</p>
        <p>Отклонение по времени: ${dashboardData?.scheduleVariance ? dashboardData.scheduleVariance.toFixed(1) : 'N/A'} дней</p>
        <p>Отклонение по стоимости: $${dashboardData?.costVariance ? dashboardData.costVariance.toFixed(0) : 'N/A'}</p>
        <p>Стандартное отклонение стоимости: $${dashboardData?.costStdDev ? dashboardData.costStdDev.toFixed(0) : 'N/A'}</p>
        <p>95% доверительный интервал стоимости: от $${dashboardData?.costConfidenceLower ? dashboardData.costConfidenceLower.toFixed(0) : 'N/A'} до $${dashboardData?.costConfidenceUpper ? dashboardData.costConfidenceUpper.toFixed(0) : 'N/A'}</p>
        <p>Вероятность уложиться в $${dashboardData?.targetCost ? dashboardData.targetCost.toFixed(0) : 'N/A'}: ${(dashboardData?.costTargetProbability * 100).toFixed(1)}%</p>
        <p>Вероятность превышения $${dashboardData?.costThreshold ? dashboardData.costThreshold.toFixed(0) : 'N/A'}: ${(dashboardData?.costExceedProbability * 100).toFixed(1)}%</p>
        <p>Стратегия управления: ${metrics.mitigation_strategy || 'N/A'}</p>
        <p>Бюджет на управление: $${metrics.mitigation_budget ? metrics.mitigation_budget.toFixed(0) : 'N/A'}</p>
        <h4>Критические риски:</h4>
        <ul>
            ${dashboardData?.criticalRisks && dashboardData.criticalRisks.length > 0 ? dashboardData.criticalRisks.map(risk => `<li>${risk.name} (Приоритет: ${risk.priority.toFixed(2)})</li>`).join('') : '<li>Критические риски отсутствуют</li>'}
        </ul>
        <h4>Критические этапы:</h4>
        <ul>
            ${dashboardData?.criticalStages && dashboardData.criticalStages.length > 0 ? 
                dashboardData.criticalStages.map(stage => {
                    const displayDuration = stage.actualDuration > 0 ? stage.actualDuration : stage.duration;
                    const displayCost = stage.actualCost > 0 ? stage.actualCost : stage.cost;
                    return `<li>${stage.name} (Длительность: ${displayDuration}, Стоимость: $${displayCost})</li>`;
                }).join('') : 
                '<li>Критические этапы отсутствуют</li>'}
        </ul>
    `;

    // Проверка и обновление графика метрик
    const metricsCanvas = document.getElementById('metricsChart');
    if (!metricsCanvas) {
        console.error("Элемент <canvas> с ID 'metricsChart' не найден");
        return;
    }
    if (metricsChart) {
        console.log("Уничтожение старого графика метрик");
        metricsChart.destroy();
        metricsChart = null;
    }
    const metricsCtx = metricsCanvas.getContext('2d');
    console.log("Создание нового графика метрик");
    metricsChart = new Chart(metricsCtx, {
        type: 'bar',
        data: {
            labels: ['СТОИМОСТЬ', 'БАЗОВАЯ СТОИМОСТЬ', 'РЕЗЕРВ НА РИСКИ', 'ИСПОЛЬЗОВАНО РЕЗЕРВА'],
            datasets: [{
                label: 'Метрики проекта',
                data: [
                    metrics.total_cost || 0,
                    metrics.base_cost || 0,
                    metrics.contingency_reserve || 0,
                    metrics.contingency_reserve_used || 0
                ],
                backgroundColor: ['#FF6384', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
        },
        options: { 
            scales: { 
                y: { 
                    beginAtZero: true,
                    title: { 
                        display: true, 
                        text: 'ЗНАЧЕНИЕ ($)',
                        font: {
                            size: 10 // Уменьшаем шрифт для заголовка оси Y
                        }
                    },
                    ticks: {
                        font: {
                            size: 8 // Уменьшаем шрифт для значений на оси Y
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'ВЛИЯНИЕ РИСКОВ',
                        font: {
                            size: 10 // Уменьшаем шрифт для заголовка оси X
                        }
                    },
                    ticks: {
                        font: {
                            size: 8 // Уменьшаем шрифт для меток на оси X
                        },
                        maxRotation: 45, // Поворачиваем метки для компактности
                        minRotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Отключаем легенду
                }
            }
        }
    });

    // Проверка и обновление графика влияния на стоимость
    const costImpactCanvas = document.getElementById('costImpactChart');
    if (!costImpactCanvas) {
        console.error("Элемент <canvas> с ID 'costImpactChart' не найден");
        return;
    }
    if (costImpactChart) {
        console.log("Уничтожение старого графика влияния на стоимость");
        costImpactChart.destroy();
        costImpactChart = null;
    }
    const costImpactCtx = costImpactCanvas.getContext('2d');
    console.log("Создание нового графика влияния на стоимость");

    const costImpactData = risks ? risks.map(r => r.impactCost || 0) : [];
    const costLabels = risks ? risks.map(r => r.name) : [];
    const costPriorities = risks ? risks.map(r => r.priority || 0) : [];
    const costProbabilities = risks ? risks.map(r => (r.probability || 0) * 100) : [];
    const costMaxImpact = Math.max(...costImpactData);

    const costBackgroundColors = costPriorities.map(priority => 
        priority > 10 ? 'rgba(255, 99, 132, 1)' : 'rgba(255, 99, 132, 0.6)'
    );

    costImpactChart = new Chart(costImpactCtx, {
        type: 'bar',
        data: {
            labels: costLabels,
            datasets: [
                {
                    label: 'Влияние на стоимость',
                    data: costImpactData,
                    backgroundColor: costBackgroundColors,
                    yAxisID: 'y-cost'
                },
                {
                    label: 'Вероятность риска (%)',
                    type: 'scatter',
                    data: costProbabilities.map((prob, index) => ({
                        x: index,
                        y: prob
                    })),
                    backgroundColor: '#FFD700',
                    pointRadius: 5,
                    yAxisID: 'y-probability'
                }
            ]
        },
        options: {
            scales: {
                'y-cost': {
                    position: 'left',
                    beginAtZero: true,
                    title: { display: true, text: 'Влияние на стоимость ($)' },
                    max: costMaxImpact * 1.2
                },
                'y-probability': {
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Вероятность (%)' },
                    grid: { display: false }
                },
                x: {
                    title: { display: true, text: 'Риски' }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const datasetLabel = context.dataset.label || '';
                            const riskIndex = context.dataIndex;
                            const risk = risks[riskIndex];
                            if (datasetLabel === 'Влияние на стоимость') {
                                return [
                                    `Риск: ${risk.name}`,
                                    `Влияние на стоимость: $${context.parsed.y}`,
                                    `Приоритет: ${risk.priority?.toFixed(2) || 'N/A'}`,
                                    `Вероятность: ${(risk.probability * 100)?.toFixed(1) || 0}%`,
                                    `Категория: ${risk.category || 'Не указано'}`,
                                    `Смягчён: ${risk.mitigated ? 'Да' : 'Нет'}`
                                ];
                            } else if (datasetLabel === 'Вероятность риска (%)') {
                                return `Вероятность: ${context.parsed.y}%`;
                            }
                            return datasetLabel + ': ' + context.parsed.y;
                        }
                    }
                }
            }
        }
    });

    // Проверка и обновление графика влияния на время
    const timeImpactCanvas = document.getElementById('timeImpactChart');
    if (!timeImpactCanvas) {
        console.error("Элемент <canvas> с ID 'timeImpactChart' не найден");
        return;
    }
    if (timeImpactChart) {
        console.log("Уничтожение старого графика влияния на время");
        timeImpactChart.destroy();
        timeImpactChart = null;
    }
    const timeImpactCtx = timeImpactCanvas.getContext('2d');
    console.log("Создание нового графика влияния на время");

    const timeImpactData = risks ? risks.map(r => r.impactTime || 0) : [];
    const timeLabels = risks ? risks.map(r => r.name) : [];
    const timePriorities = risks ? risks.map(r => r.priority || 0) : [];
    const timeProbabilities = risks ? risks.map(r => (r.probability || 0) * 100) : [];
    const timeMaxImpact = Math.max(...timeImpactData);

    const timeBackgroundColors = timePriorities.map(priority => 
        priority > 10 ? 'rgba(54, 162, 235, 1)' : 'rgba(54, 162, 235, 0.6)'
    );

    timeImpactChart = new Chart(timeImpactCtx, {
        type: 'bar',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Влияние на время (дни)',
                    data: timeImpactData,
                    backgroundColor: timeBackgroundColors,
                    yAxisID: 'y-time'
                },
                {
                    label: 'Вероятность риска (%)',
                    type: 'scatter',
                    data: timeProbabilities.map((prob, index) => ({
                        x: index,
                        y: prob
                    })),
                    backgroundColor: '#FFD700',
                    pointRadius: 5,
                    yAxisID: 'y-probability'
                }
            ]
        },
        options: {
            scales: {
                'y-time': {
                    position: 'left',
                    beginAtZero: true,
                    title: { display: true, text: 'Влияние на время (дни)' },
                    max: timeMaxImpact * 1.2
                },
                'y-probability': {
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Вероятность (%)' },
                    grid: { display: false }
                },
                x: {
                    title: { display: true, text: 'Риски' }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const datasetLabel = context.dataset.label || '';
                            const riskIndex = context.dataIndex;
                            const risk = risks[riskIndex];
                            if (datasetLabel === 'Влияние на время (дни)') {
                                return [
                                    `Риск: ${risk.name}`,
                                    `Влияние на время: ${context.parsed.y} дней`,
                                    `Приоритет: ${risk.priority?.toFixed(2) || 'N/A'}`,
                                    `Вероятность: ${(risk.probability * 100)?.toFixed(1) || 0}%`,
                                    `Категория: ${risk.category || 'Не указано'}`,
                                    `Смягчён: ${risk.mitigated ? 'Да' : 'Нет'}`
                                ];
                            } else if (datasetLabel === 'Вероятность риска (%)') {
                                return `Вероятность: ${context.parsed.y}%`;
                            }
                            return datasetLabel + ': ' + context.parsed.y;
                        }
                    }
                }
            }
        }
    });

    // Проверка и обновление графика распределения времени
    const timeDistCanvas = document.getElementById('timeDistributionChart');
    if (!timeDistCanvas) {
        console.error("Элемент <canvas> с ID 'timeDistributionChart' не найден");
        return;
    }
    if (timeDistChart) {
        console.log("Уничтожение старого графика распределения времени");
        timeDistChart.destroy();
        timeDistChart = null;
    }
    const timeDistCtx = timeDistCanvas.getContext('2d');
    console.log("Создание нового графика распределения времени");

    const timeResults = (dashboardData?.timeResults || []).map(val => Number(val)).filter(val => !isNaN(val) && val !== undefined);
    console.log("timeResults после фильтрации:", timeResults);

    if (timeResults.length === 0) {
        console.warn("Нет данных для построения графика распределения времени");
        timeDistCtx.fillText("Нет данных", 10, 50);
        timeDistChart = new Chart(timeDistCtx, {
            type: 'bar',
            data: {
                labels: Array.from({ length: 10 }, (_, i) => (i * 10).toString()),
                datasets: [
                    {
                        label: 'Распределение времени',
                        data: Array(10).fill(0),
                        backgroundColor: '#36A2EB'
                    }
                ]
            },
            options: {
                scales: {
                    x: { title: { display: true, text: 'Время (дни)' } },
                    y: { title: { display: true, text: 'Частота' }, beginAtZero: true }
                }
            }
        });
    } else {
        const timeBins = 50;
        const timeHistogramData = createHistogramData(timeResults, timeBins);
        const timeMaxFrequency = Math.max(...timeHistogramData);

        console.log("Time Confidence Interval:", dashboardData?.timeConfidenceLower, dashboardData?.timeConfidenceUpper);
        console.log("Time Results Range:", Math.min(...timeResults), Math.max(...timeResults));
        console.log("Time Histogram Data:", timeHistogramData);

        timeDistChart = new Chart(timeDistCtx, {
            type: 'bar',
            data: {
                labels: createHistogramLabels(timeResults, timeBins),
                datasets: [
                    {
                        label: 'Распределение времени',
                        data: timeHistogramData,
                        backgroundColor: '#36A2EB'
                    },
                    {
                        label: '95% доверительный интервал',
                        type: 'line',
                        data: [
                            { x: Number(dashboardData?.timeConfidenceLower) || 0, y: 0 },
                            { x: Number(dashboardData?.timeConfidenceLower) || 0, y: timeMaxFrequency * 1.1 },
                            { x: Number(dashboardData?.timeConfidenceUpper) || 0, y: timeMaxFrequency * 1.1 },
                            { x: Number(dashboardData?.timeConfidenceUpper) || 0, y: 0 }
                        ],
                        borderColor: '#FF0000',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0
                    },
                    {
                        label: 'Среднее значение',
                        type: 'line',
                        data: [
                            { x: Number(metrics.total_time) || 0, y: 0 },
                            { x: Number(metrics.total_time) || 0, y: timeMaxFrequency * 1.1 }
                        ],
                        borderColor: '#00FF00',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Время (дни)' },
                        min: Math.min(...timeResults, Number(dashboardData?.timeConfidenceLower) || 0),
                        max: Math.max(...timeResults, Number(dashboardData?.timeConfidenceUpper) || 0)
                    },
                    y: {
                        title: { display: true, text: 'Частота' },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Проверка и обновление графика распределения стоимости
    const costDistCanvas = document.getElementById('costDistributionChart');
    if (!costDistCanvas) {
        console.error("Элемент <canvas> с ID 'costDistributionChart' не найден");
        return;
    }
    if (costDistChart) {
        console.log("Уничтожение старого графика распределения стоимости");
        costDistChart.destroy();
        costDistChart = null;
    }
    const costDistCtx = costDistCanvas.getContext('2d');
    console.log("Создание нового графика распределения стоимости");

    const costResults = (dashboardData?.costResults || []).map(val => Number(val)).filter(val => !isNaN(val) && val !== undefined);
    console.log("costResults после фильтрации:", costResults);

    if (costResults.length === 0) {
        console.warn("Нет данных для построения графика распределения стоимости");
        costDistCtx.fillText("Нет данных", 10, 50);
        costDistChart = new Chart(costDistCtx, {
            type: 'bar',
            data: {
                labels: Array.from({ length: 10 }, (_, i) => (i * 1000).toString()),
                datasets: [
                    {
                        label: 'Распределение стоимости',
                        data: Array(10).fill(0),
                        backgroundColor: '#FF6384'
                    }
                ]
            },
            options: {
                scales: {
                    x: { title: { display: true, text: 'Стоимость ($)' } },
                    y: { title: { display: true, text: 'Частота' }, beginAtZero: true }
                }
            }
        });
    } else {
        const costBins = 50;
        const costHistogramData = createHistogramData(costResults, costBins);
        const costMaxFrequency = Math.max(...costHistogramData);

        console.log("Cost Confidence Interval:", dashboardData?.costConfidenceLower, dashboardData?.costConfidenceUpper);
        console.log("Cost Results Range:", Math.min(...costResults), Math.max(...costResults));
        console.log("Cost Histogram Data:", costHistogramData);

        costDistChart = new Chart(costDistCtx, {
            type: 'bar',
            data: {
                labels: createHistogramLabels(costResults, costBins),
                datasets: [
                    {
                        label: 'Распределение стоимости',
                        data: costHistogramData,
                        backgroundColor: '#FF6384'
                    },
                    {
                        label: '95% доверительный интервал',
                        type: 'line',
                        data: [
                            { x: Number(dashboardData?.costConfidenceLower) || 0, y: 0 },
                            { x: Number(dashboardData?.costConfidenceLower) || 0, y: costMaxFrequency * 1.1 },
                            { x: Number(dashboardData?.costConfidenceUpper) || 0, y: costMaxFrequency * 1.1 },
                            { x: Number(dashboardData?.costConfidenceUpper) || 0, y: 0 }
                        ],
                        borderColor: '#FF0000',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0
                    },
                    {
                        label: 'Среднее значение',
                        type: 'line',
                        data: [
                            { x: Number(metrics.total_cost) || 0, y: 0 },
                            { x: Number(metrics.total_cost) || 0, y: costMaxFrequency * 1.1 }
                        ],
                        borderColor: '#00FF00',
                        borderWidth: 2,
                        fill: false,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Стоимость ($)' },
                        min: Math.min(...costResults, Number(dashboardData?.costConfidenceLower) || 0),
                        max: Math.max(...costResults, Number(dashboardData?.costConfidenceUpper) || 0)
                    },
                    y: {
                        title: { display: true, text: 'Частота' },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    while (riskTable.rows.length > 1) riskTable.deleteRow(1);
    if (risks && Array.isArray(risks) && risks.length > 0) {
        risks.forEach(risk => {
            const row = riskTable.insertRow();
            row.insertCell().textContent = risk.name || 'N/A';
            row.insertCell().textContent = risk.mitigated ? "Да" : "Нет";
            row.insertCell().textContent = risk.impactTime || 0;
            row.insertCell().textContent = risk.impactCost || 0;
            row.insertCell().textContent = risk.strategy || "Игнорировать (по умолчанию)";
            row.insertCell().textContent = risk.category || "Не указано";
            row.insertCell().textContent = risk.priority ? risk.priority.toFixed(2) : "N/A";
        });
    } else {
        console.warn("Риски не найдены или массив пуст:", risks);
        const row = riskTable.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 7;
        cell.textContent = "Риски отсутствуют";
    }

    const recommendations = generateRecommendations(metrics, risks || [], dashboardData);
    recDiv.innerHTML = `
        <h3>Рекомендации и прогнозы</h3>
        ${recommendations.map(rec => `<p>${rec}</p>`).join('')}
    `;
}