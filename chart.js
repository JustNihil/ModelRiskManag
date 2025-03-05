let chart;

function updateChart(data) {
    const ctx = document.getElementById('resultsChart').getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Общее время', 'Общая стоимость'],
            datasets: [{
                label: 'Метрики проекта',
                data: [data.totalTime, data.totalCost],
                backgroundColor: ['#36A2EB', '#FF6384']
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });
}

function updateRiskResults(risks) {
    const table = document.getElementById('riskResultsTable');
    while (table.rows.length > 1) table.deleteRow(1);
    risks.forEach(risk => {
        const row = table.insertRow();
        row.insertCell().textContent = risk.name;
        row.insertCell().textContent = risk.mitigated ? "Да" : "Нет";
        row.insertCell().textContent = risk.impactTime;
        row.insertCell().textContent = risk.impactCost;
        row.insertCell().textContent = risk.strategy || "Не указано";
    });
}