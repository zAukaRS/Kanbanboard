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
                    createdAt: new Date().toISOString(),
                    lastEdited: new Date().toISOString(),
                    status: 'pending'
                });
                this.newTask = { title: '', description: '', deadline: '' };
            }
        },
        editTask(task) {
            if (this.columns[3].tasks.includes(task)) return;
            task.lastEdited = new Date();
        },
        deleteTask(task, columnIndex) {
            const index = this.columns[columnIndex].tasks.indexOf(task);
            if (index > -1) {
                this.columns[columnIndex].tasks.splice(index, 1);
            }
        },
        moveTask(task, fromColumn, toColumn) {
            if (fromColumn === 3) return;
            const index = this.columns[fromColumn].tasks.indexOf(task);
            if (index > -1) {
                const [movedTask] = this.columns[fromColumn].tasks.splice(index, 1);
                movedTask.lastEdited = new Date();
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
        dragStart(event, task, fromColumn) {
            if (fromColumn === 3) return;
            event.dataTransfer.setData('taskId', task.createdAt);
            event.dataTransfer.setData('fromColumn', fromColumn);
            event.target.classList.add('dragging');
        },
        dragOver(event) {
            event.preventDefault();
            event.currentTarget.classList.add('dragover');
        },
        dragLeave(event) {
            event.currentTarget.classList.remove('dragover');
        },
        drop(event, toColumn) {
            event.preventDefault();
            event.currentTarget.classList.remove('dragover');
            const taskId = event.dataTransfer.getData('taskId');
            const fromColumn = Number(event.dataTransfer.getData('fromColumn'));
            if (!taskId || fromColumn === toColumn || fromColumn === 3) return;
            if (fromColumn === 2 && toColumn < 2 && !this.returnReason.trim()) {
                alert("Укажите причину возврата!");
                return;
            }
            const taskIndex = this.columns[fromColumn].tasks.findIndex(t => t.createdAt === taskId);
            if (taskIndex === -1) return;
            const [movedTask] = this.columns[fromColumn].tasks.splice(taskIndex, 1);
            movedTask.lastEdited = new Date().toISOString();
            if (fromColumn === 2 && toColumn < 2) {
                movedTask.returnReason = this.returnReason;
                this.returnReason = '';
            }
            if (toColumn === 3) {
                const now = new Date();
                const deadline = new Date(movedTask.deadline);
                movedTask.status = now > deadline ? 'overdue' : 'completed';
            }
            this.columns[toColumn].tasks.push(movedTask);
        }
    }
});