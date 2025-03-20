export const stages = [];

export function addStage() {
    const name = document.getElementById('stageName').value;
    const duration = parseFloat(document.getElementById('stageDuration').value);
    const cost = parseFloat(document.getElementById('stageCost').value);
    if (name && !isNaN(duration) && !isNaN(cost) && duration >= 0 && cost >= 0) {
        stages.push({ name, duration, cost });
        updateStagesTable();
        document.getElementById('stageName').value = '';
        document.getElementById('stageDuration').value = '';
        document.getElementById('stageCost').value = '';
    } else {
        alert("Заполните все поля корректно.");
    }
}

export function removeStage(index) {
    stages.splice(index, 1);
    updateStagesTable();
}

export function updateStagesTable() {
    const table = document.getElementById('stagesTable');
    while (table.rows.length > 1) table.deleteRow(1);
    stages.forEach((stage, index) => {
        const row = table.insertRow();
        row.insertCell().textContent = stage.name;
        row.insertCell().textContent = stage.duration;
        row.insertCell().textContent = stage.cost;
        row.insertCell().innerHTML = `<button class="delete-btn" onclick="removeStage(${index})">✖</button>`;
    });
}