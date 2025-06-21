<template>
  <div>
    <div class="board">
      <div v-for="status in statuses" :key="status" class="list">
        <h3>{{ status }}</h3>
        <draggable
          v-model="taskByStatus[status]"
          group="cards"
          class="card-list"
          @end="onDragEnd"
        >
          <template #item="{ element }">
            <el-card class="card">
              <div>{{ element.title }}</div>
              <small>予定：{{ element.plan_start }} ~ {{ element.plan_end }}</small>
            </el-card>
          </template>
        </draggable>
      </div>
    </div>

    <div class="task-input">
      <el-input
        v-model="newTitle"
        placeholder="タスク名を入力"
        class="input"
      />
      <el-input
        v-model="newAssignee"
        placeholder="担当者を入力"
        class="input"
        style="margin-top: 8px;"
      />
      <el-date-picker
        v-model="newDates"
        type="daterange"
        range-separator="〜"
        start-placeholder="開始日"
        end-placeholder="終了日"
        class="input"
        style="margin-top: 8px;"
      />
      <el-button type="primary" @click="addTask" style="margin-top: 8px;">
        追加
      </el-button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import draggable from 'vuedraggable'
import { format } from 'date-fns'

export default {
  components: {
    draggable
  },
  props: {
    tasks: {
      type: Array,
      required: true
    }
  },
  emits: ['update'],
  setup(props, { emit }) {
    const statuses = ['ToDo', 'Doing', 'Done']

    const taskByStatus = computed(() => {
      if (!Array.isArray(props.tasks)) return {}
      return Object.fromEntries(
        statuses.map(s => [s, props.tasks.filter(t => t.status === s)])
      )
    })

    const newTitle = ref('')
    const newAssignee = ref('')
    const newDates = ref([])

    function addTask() {
      if (!newTitle.value || !newAssignee.value || newDates.value.length !== 2) return

      const newTask = {
        id: Date.now(),
        title: newTitle.value,
        assignee: newAssignee.value,
        plan_start: format(newDates.value[0], 'yyyy-MM-dd'),
        plan_end: format(newDates.value[1], 'yyyy-MM-dd'),
        actual_start: '',
        actual_end: '',
        status: 'ToDo'
      }

      const updated = [...props.tasks, newTask]
      emit('update', updated)

      newTitle.value = ''
      newAssignee.value = ''
      newDates.value = []
    }

    function onDragEnd() {
      const updated = statuses.flatMap(status =>
        taskByStatus.value[status].map(t => ({ ...t, status }))
      )
      emit('update', updated)
    }

    return {
      statuses,
      taskByStatus,
      onDragEnd,
      newTitle,
      newAssignee,
      newDates,
      addTask
    }
  }
}
</script>

<style scoped>
.board {
  display: flex;
  gap: 16px;
}

.list {
  background: #f4f4f4;
  padding: 10px;
  width: 250px;
  border-radius: 8px;
}

.card-list {
  min-height: 100px;
}

.card {
  margin-bottom: 8px;
}

.task-input {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  width: 300px;
}
</style>
