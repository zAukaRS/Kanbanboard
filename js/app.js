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
});