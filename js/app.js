new Vue({
    el: '#app',
    data() {
        return {
            columns: [
                {title: 'Запланированные задачи', tasks: []},
                {title: 'Задачи в работе', tasks: []},
                {title: 'Тестирование', tasks: []},
                {title: 'Выполненные задачи', tasks: []}
            ],
            newTask: {title: '', description: '', deadline: ''}
        };
    },
    methods: {
        addTask() {
            if (this.newTask.title && this.newTask.description && this.newTask.deadline) {
                this.columns[0].tasks.push({
                    ...this.newTask,
                    createdAt: new Date(),
                    lastEdited: new Date()
                });
                this.newTask = { title: '', description: '', deadline: '' };
            }
        },
        editTask(task) {
            task.lastEdited = new Date();
        },
        deleteTask(task, columnIndex) {
            const index = this.columns[columnIndex].tasks.indexOf(task);
            if (index > -1) {
                this.columns[columnIndex].tasks.splice(index, 1);
            }
        },
        moveTask(task, fromColumn, toColumn) {
            const index = this.columns[fromColumn].tasks.indexOf(task);
            if (index > -1) {
                this.columns[fromColumn].tasks.splice(index, 1);
                this.columns[toColumn].tasks.push({ ...task, lastEdited: new Date() });
                if (toColumn === 3) {
                    const now = new Date();
                    const deadline = new Date(task.deadline);
                    task.status = now > deadline ? 'overdue' : 'completed';
                }
                this.columns[toColumn].tasks.push(task);
            }
        },
        returnTask(task, fromColumn) {
            if (this.returnReason.trim()) {
                const index = this.columns[fromColumn].tasks.indexOf(task);
                if (index > -1) {
                    task.returnReason = this.returnReason;
                    this.columns[fromColumn].tasks.splice(index, 1);
                    this.columns[1].tasks.push(task);
                    this.returnReason = '';
                }
            } else {
                alert('Укажите причину возврата!');
            }
        },

    }
});