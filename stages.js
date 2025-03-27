export const stages = [];

export function addStage() {
    let name = document.getElementById('stageName').value;
    const duration = parseFloat(document.getElementById('stageDuration').value);
    const cost = parseFloat(document.getElementById('stageCost').value);
    const dependencies = document.getElementById('stageDependencies').value.split(',').map(dep => dep.trim()).filter(dep => dep);

    const safeName = name.replace(/[^a-zA-Z0-9-_]/g, '_');

    if (name && !isNaN(duration) && !isNaN(cost) && duration >= 0 && cost >= 0) {
        const invalidDeps = dependencies.filter(dep => !stages.some(stage => stage.name === dep));
        if (invalidDeps.length > 0) {
            alert(`Следующие зависимости не найдены среди этапов: ${invalidDeps.join(', ')}`);
            return;
        }
        stages.push({ name, safeName, duration, cost, dependencies, actualDuration: 0, actualCost: 0 });
        console.log(`Этап "${name}" добавлен`);
        window.updateStagesTable();
        window.updateProgressStagesTable();
        document.getElementById('stageName').value = '';
        document.getElementById('stageDuration').value = '';
        document.getElementById('stageCost').value = '';
        document.getElementById('stageDependencies').value = '';
    } else {
        alert("Заполните все поля корректно.");
    }
}

export function removeStage(index) {
    const stageName = stages[index].name;
    const dependentStages = stages.filter((stage, idx) => idx !== index && stage.dependencies.includes(stageName));
    if (dependentStages.length > 0) {
        alert(`Нельзя удалить этап "${stageName}", так как от него зависят: ${dependentStages.map(s => s.name).join(', ')}`);
        return;
    }
    stages.splice(index, 1);
    console.log(`Этап "${stageName}" удален`);
    window.updateStagesTable();
    window.updateProgressStagesTable();
}

export function updateStagesTable() {
    const table = document.getElementById('stagesTable');
    while (table.rows.length > 1) table.deleteRow(1);
    stages.forEach((stage, index) => {
        const row = table.insertRow();
        row.insertCell().textContent = stage.name;
        row.insertCell().textContent = stage.duration;
        row.insertCell().textContent = stage.cost;
        row.insertCell().textContent = stage.dependencies.join(', ');
        row.insertCell().textContent = stage.actualDuration || 'N/A';
        row.insertCell().textContent = stage.actualCost || 'N/A';
        row.insertCell().innerHTML = `<button class="delete-btn" onclick="window.removeStage(${index})">✖</button>`;
    });
}