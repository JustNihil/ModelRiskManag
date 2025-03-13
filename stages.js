// Управление этапами проекта
export const stages = [];

export function addStage() {
    const stageName = document.getElementById('stageName');
    const stageDuration = document.getElementById('stageDuration');
    const stageCost = document.getElementById('stageCost');
    const name = stageName.value;
    const duration = parseFloat(stageDuration.value);
    const cost = parseFloat(stageCost.value);
    if (name && !isNaN(duration) && !isNaN(cost)) {
        stages.push({ name, duration, cost });
        updateStagesTable();
        stageName.value = '';
        stageDuration.value = '';
        stageCost.value = '';
    } else {
        alert("Пожалуйста, заполните все поля корректно (продолжительность и стоимость должны быть числами)");
    }
}

export function updateStagesTable() {
    const table = document.getElementById('stagesTable');
    while (table.rows.length > 1) table.deleteRow(1);
    stages.forEach(stage => {
        const row = table.insertRow();
        row.insertCell().textContent = stage.name;
        row.insertCell().textContent = stage.duration;
        row.insertCell().textContent = stage.cost;
    });
}