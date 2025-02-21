Vue.component('task-item', {
    props: ['task', 'colIndex', 'columnsLength'],
    data() {
        return {
            returnReason: '',
            showReturnHistory: false,
            showSubtaskForm: false,
            isEditing: false,
            newSubtask: { title: '', description: '', createdAt: '', lastEdited: '' },
            editedTask: { title: '', description: '', deadline: '' }
        };
    },
    computed: {
        taskClasses() {
            return {
                pending: this.colIndex === 0,
                'in-progress': this.colIndex === 1,
                testing: this.colIndex === 2,
                completed: this.task.status === 'completed',
                overdue: this.task.status === 'overdue'
            };
        },
        deadlineStatus() {
            if (this.colIndex === this.columnsLength - 1) {
                const deadlineDate = new Date(this.task.deadline);
                const now = new Date();
                return deadlineDate < now ? 'Просрочено' : 'Выполнено в срок';
            }
            return '';
        },
        allSubtasksCompleted() {
            return this.task.subtasks && this.task.subtasks.length > 0
                ? this.task.subtasks.every(subtask => subtask.completed)
                : true;
        },
        canEdit() {
            return this.colIndex < this.columnsLength - 1;
        },
        canEditSubtask() {
            return this.colIndex === 0;
        },
        canMoveTask() {
            return !this.task.subtasks || this.task.subtasks.every(sub => sub.completed);
        },
    },
    methods: {
        toggleEdit() {
            if (!this.isEditing) {
                this.editedTask = { ...this.task };
            }
            this.isEditing = !this.isEditing;
        },
        completeSubtask(index) {
            if (!this.task.subtasks[index].completed) {
                this.$set(this.task.subtasks, index, {
                    ...this.task.subtasks[index],
                    completed: true
                });
            }
        },
        saveEdit() {
            this.task.title = this.editedTask.title;
            this.task.description = this.editedTask.description;
            this.task.deadline = this.editedTask.deadline;
            this.task.lastEdited = Date.now().toString();
            this.$emit('update-task', this.task);
            this.isEditing = false;
        },
        addSubtask() {
            if (!this.newSubtask.title || !this.newSubtask.description) return;
            this.task.subtasks = this.task.subtasks || [];
            this.task.subtasks.push({
                ...this.newSubtask,
                createdAt: Date.now().toString(),
                lastEdited: Date.now().toString(),
                completed: false
            });
            this.newSubtask = { title: '', description: '', createdAt: '', lastEdited: '' };
            this.showSubtaskForm = false;
            this.$emit('update-task', this.task);
        },
        toggleSubtaskForm() {
            this.showSubtaskForm = !this.showSubtaskForm;
        },
        moveTask() {
            if (!this.allSubtasksCompleted) return;
            this.$emit('move-task', this.task, this.colIndex, this.colIndex + 1);
        },
        toggleSubtaskCompletion(subtask) {
            if (!subtask.completed) {
                subtask.completed = true;
                subtask.lastEdited = Date.now().toString();
                this.$emit('update-task', this.task);
                this.$forceUpdate();
            }
        },
        formattedDate(timestamp) {
            return timestamp ? new Date(Number(timestamp)).toLocaleString() : 'Нет данных';
        },
        dragStart(event) {
            if (!this.allSubtasksCompleted) {
                event.preventDefault();
                return;
            }
            event.dataTransfer.setData('taskId', this.task.createdAt);
            event.dataTransfer.setData('fromColumn', this.colIndex);
        },
        editTask() {
            if (this.colIndex === this.columnsLength - 1) return;
            const newTitle = prompt('Введите новое название', this.task.title);
            const newDescription = prompt('Введите новое описание', this.task.description);
            const newDeadline = prompt('Введите новый дедлайн (ГГГГ-ММ-ДД)', this.task.deadline);
            if (newTitle !== null) this.task.title = newTitle;
            if (newDescription !== null) this.task.description = newDescription;
            if (newDeadline !== null && !isNaN(Date.parse(newDeadline))) {
                this.task.deadline = newDeadline;
            } else if (newDeadline !== null) {
                alert('Некорректный формат даты!');
            }
            this.task.lastEdited = Date.now().toString();
            this.$emit('update-task', this.task);
        },
        returnTask() {
            if (!this.returnReason) {
                alert('Укажите причину возврата');
                return;
            }
            this.$emit('return-task', this.task, this.colIndex, this.returnReason);
            this.returnReason = '';
        },
    },
    template: `
    <div class="task" :class="taskClasses" draggable="true"
        @dragstart="dragStart"
        @dragend="$event.target.classList.remove('dragging')"
        @dragover.prevent>
        <p v-if="!isEditing">{{ task.title }}</p>
        <input v-if="isEditing" v-model="task.title">
        <p v-if="!isEditing">{{ task.description }}</p>
        <textarea v-if="isEditing" v-model="task.description"></textarea>
        <p v-if="!isEditing"> Дэдлайн: {{ task.deadline }}</p>
        <input v-if="isEditing" type="date" v-model="editedTask.deadline">
        <p>Создано: {{ formattedDate(task.createdAt) }}</p>
        <p>Изменено: {{ formattedDate(task.lastEdited) }}</p>
        <button v-if="colIndex < columnsLength - 1 && canEdit" @click="isEditing ? saveEdit() : toggleEdit()">
            {{ isEditing ? 'Сохранить' : 'Редактировать' }}
        </button>
        <button v-if="colIndex === 0" @click="toggleSubtaskForm">Добавить подзадачу</button>
        <div v-if="showSubtaskForm">
            <input v-model="newSubtask.title" placeholder="Название">
            <textarea v-model="newSubtask.description" placeholder="Описание"></textarea>
            <button @click="addSubtask">Сохранить подзадачу</button>
        </div>
        <ul v-if="task.subtasks">
            <li v-for="subtask in task.subtasks" :key="subtask.createdAt">
                <p>{{ subtask.title }}</p>
                <p>{{ subtask.description }}</p>
                <input type="checkbox" v-model="subtask.completed" 
                   @change="toggleSubtaskCompletion(subtask)" 
                   :disabled="subtask.completed">
            </li>
        </ul>
        <button @click="$emit('delete-task', task, colIndex)">Удалить</button>
        <button v-if="colIndex < columnsLength - 1" @click="moveTask" :disabled="!allSubtasksCompleted">Далее</button>
        <div v-if="colIndex === 2">
            <input v-model="returnReason" placeholder="Причина возврата">
            <button @click="returnTask">Вернуть</button>
        </div>
        <button v-if="task.returnHistory && task.returnHistory.length" @click="showReturnHistory = !showReturnHistory">
            История возвратов
        </button>
        <ul v-if="showReturnHistory">
            <li v-for="entry in task.returnHistory" :key="entry.timestamp">
                {{ formattedDate(entry.timestamp) }} - {{ entry.reason }}
            </li>
        </ul>
    </div>
`
});


Vue.component('task-column', {
    props: ['column', 'index', 'columnsLength'],
    template: `
        <div class="column" @dragover.prevent @drop="dropTask">
            <h3>{{ column.title }}</h3>
            <transition-group name="task-transition" tag="div">
                <task-item v-for="task in column.tasks" :key="task.createdAt"
                    :task="task" :colIndex="index" :columnsLength="columnsLength"
                    @edit-task="editTask" @delete-task="deleteTask"
                    @move-task="moveTask" @return-task="returnTask">
                </task-item>
            </transition-group>
        </div>
    `,
    methods: {
        dropTask(event) {
            const taskId = event.dataTransfer.getData('taskId');
            const fromColumn = Number(event.dataTransfer.getData('fromColumn'));
            if (fromColumn === this.index) return;
            const task = this.$root.columns[fromColumn].tasks.find(t => t.createdAt === taskId);
            if (!task) return;
            if (task.subtasks && !task.subtasks.every(subtask => subtask.completed)) {
                console.log("Перемещение запрещено! Не все подзадачи выполнены.");
                return;
            }
            this.$emit('move-task', task, fromColumn, this.index);
        },
        isRestrictedMovement(fromColumn, toColumn) {
            if (fromColumn === 1 && toColumn === 0) return true;
            if (fromColumn === 2 && toColumn === 1) return true;
            return false;
        },
        editTask(task) {
            console.log('Редактирование задачи', task);
            this.$root.editTask(task);
        },
        deleteTask(task, colIndex) {
            console.log('Удаление задачи', task);
            this.$root.deleteTask(task, colIndex);
        },
        moveTask(task, fromColumn, toColumn) {
            console.log('Перемещение задачи', task);
            this.$root.moveTask(task, fromColumn, toColumn);
        },
        returnTask(task, colIndex, reason) {
            console.log('Возврат задачи', task, reason);
            this.$root.returnTask(task, colIndex, reason);
        }
    }
});



new Vue({
    el: '#app',
    data() {
        return {
            showCalendar: false,
            columns: [
                { title: 'Запланированные задачи', tasks: [] },
                { title: 'В работе', tasks: [] },
                { title: 'Тестирование', tasks: [] },
                { title: 'Готово', tasks: [] }
            ],
            newTask: { title: '', description: '', deadline: '' },
            calendarEvents: []
        };
    },
    mounted() {
        this.initCalendar();
    },
    created() {
        this.loadTasks();
    },
    methods: {
        toggleCalendar() {
            this.showCalendar = !this.showCalendar;
            if (this.showCalendar) {
                this.$nextTick(() => {
                    const calendarEl = document.getElementById('calendar');
                    new FullCalendar.Calendar(calendarEl, { initialView: 'dayGridMonth' }).render();
                });
            }
        },
        initCalendar() {
            const calendarEl = document.getElementById('calendar');
            this.calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                events: this.calendarEvents
            });
            this.calendar.render();
        },
        updateCalendar() {
            this.calendarEvents = this.columns.flatMap(column =>
                column.tasks.map(task => ({
                    title: task.title,
                    start: task.deadline,
                    color: column.name === "Готово" ? "#28a745" : "#007bff"
                }))
            );
            this.calendar.removeAllEvents();
            this.calendar.addEventSource(this.calendarEvents);
        },
        addTask() {
            if (!this.newTask.title || !this.newTask.description || !this.newTask.deadline) return;
            this.columns[0].tasks.push({
                ...this.newTask,
                createdAt: Date.now().toString(),
                lastEdited: Date.now().toString(),
                status: 'pending'
            });
            this.newTask = { title: '', description: '', deadline: '' };
            this.saveTasks();
        },
        editTask(task) {
            console.log('Редактировать задачу', task);
            const newTitle = prompt('Введите новое название', task.title);
            const newDescription = prompt('Введите новое описание', task.description);
            if (newTitle !== null && newDescription !== null) {
                task.title = newTitle;
                task.description = newDescription;
                task.lastEdited = Date.now().toString();
                this.saveTasks();
            }
            this.updateCalendar();
        },
        deleteTask(task, colIndex) {
            console.log('Удалить задачу', task);
            this.columns[colIndex].tasks = this.columns[colIndex].tasks.filter(t => t !== task);
            this.saveTasks();
            this.updateCalendar();
        },
        moveTask(task, fromColumn, toColumn) {
            if (Math.abs(fromColumn - toColumn) !== 1 || this.isRestrictedMovement(fromColumn, toColumn)) return;
            const taskIndex = this.columns[fromColumn].tasks.findIndex(t => t === task);
            if (taskIndex === -1) return;
            const [movedTask] = this.columns[fromColumn].tasks.splice(taskIndex, 1);
            movedTask.lastEdited = Date.now().toString();
            if (toColumn === this.columns.length - 1) {
                const deadlineDate = new Date(movedTask.deadline);
                const now = new Date();
                movedTask.status = deadlineDate < now ? 'overdue' : 'completed';
            }
            this.columns[toColumn].tasks.push(movedTask);
            this.saveTasks();
            this.updateCalendar();
        },
        returnTask(task, colIndex, reason) {
            if (!task.returnHistory) task.returnHistory = [];
            task.returnHistory.push({ reason, timestamp: Date.now().toString() });
            this.columns[1].tasks.push({ ...task, lastEdited: Date.now().toString() });
            this.columns[colIndex].tasks = this.columns[colIndex].tasks.filter(t => t !== task);
            this.saveTasks();
        },
        saveTasks() {
            localStorage.setItem('kanbanTasks', JSON.stringify(this.columns));
        },
        loadTasks() {
            const saved = localStorage.getItem('kanbanTasks');
            if (saved) this.columns = JSON.parse(saved);
        },
        isRestrictedMovement(fromColumn, toColumn) {
            if (fromColumn === 1 && toColumn === 0) return true;
            if (fromColumn === 2 && toColumn === 1) return true;
            return false;
        }
    },
    template: `
    <div>
        <div class="header">
            <h2>Kanban Board</h2>
            <button @click="toggleCalendar">📅 Открыть/Закрыть Календарь</button>
            <div v-if="showCalendar" id="calendar"></div>
            
            <div class="task-form">
                <input v-model="newTask.title" placeholder="🔖 Название задачи">
                <input v-model="newTask.description" placeholder="📝 Описание">
                <input type="date" v-model="newTask.deadline">
                <button @click="addTask">Добавить</button>
            </div>
        </div>
        <div class="board">
            <task-column
                 v-for="(column, index) in columns" 
                :key="column.title" 
                :column="column" 
                :index="index" 
                :columnsLength="columns.length"
                @edit-task="editTask" 
                @delete-task="deleteTask" 
                @move-task="moveTask" 
                @return-task="returnTask">
            </task-column>
        </div>
    </div>
`
});


