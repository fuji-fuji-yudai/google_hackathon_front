<template>
  <div class="timeline-container" :style="{ '--day-count': dateRange.length }">
    <!-- タスクの予定入力欄（登録用） -->
    <div class="task-input-row">
      <el-input v-model="newTitle" placeholder="タスク名" style="width: 200px; margin-right: 8px;" />
      <el-input v-model="newAssignee" placeholder="担当者" style="width: 150px; margin-right: 8px;" />
      <el-date-picker v-model="newDates" type="daterange" size="small" :placeholder="''" style="margin-right: 8px;" />
      <el-select v-model="newParentId" placeholder="親タスクを選択（任意）" style="width: 200px; margin-right: 8px;">
        <el-option :label="'（親なし）'" :value="null" />
        <el-option v-for="task in tasks" :key="task.id" :label="task.title" :value="task.id" />
      </el-select>
      <el-button type="primary" @click="addTask">タスク追加</el-button>
    </div>

    <!-- ヘッダー（固定日付範囲） -->
    <div class="timeline-header">
      <div class="label">作業項目 / 担当 / 親 / 予定 / 実績</div>
      <div class="days">
        <div v-for="date in dateRange" :key="date" class="day">
          {{ date.slice(5) }}
        </div>
      </div>
    </div>

    <!-- タスク行 -->
    <div class="timeline-row" v-for="task in tasks" :key="task.id">
      <div class="label">
        <div class="task-info">
          <div class="task-title" :style="{ paddingLeft: `${getIndentLevel(task)}em` }">
            {{ task.title }}
          </div>
          <el-button size="small" text @click="() => addingUnderTaskId.value = task.id">＋</el-button>

          <div class="task-assignee">担当: {{ task.assignee }}</div>
          <div class="task-parent" v-if="task.parentId">親: {{ getParentTitle(task.parentId) }}</div>
          <div class="date-picker-container">
            <span>予定：</span>
            <el-date-picker v-if="taskDateMap[task.id]" v-model="taskDateMap[task.id]" type="daterange" size="small"
              start-placeholder="開始日" end-placeholder="終了日" @change="(value) => onTaskDateChange(task, value)" />
          </div>
        </div>
      </div>
      <div class="days">
        <div v-for="date in dateRange" :key="date" class="day" :style="{ backgroundColor: getDayColor(date, task) }" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import { format, parseISO, eachDayOfInterval } from 'date-fns'

export default {
  setup() {
    const newTitle = ref('')
    const newAssignee = ref('')
    const newDates = ref([])
    const newParentId = ref(null)
    const taskDateMap = ref({})
    const tasks = ref([
      {
        id: 1,
        title: '最初のタスク',
        assignee: '未設定',
        planStart: '2025-06-01',
        planEnd: '2025-06-03',
        actualStart: '',
        actualEnd: '',
        parentId: null
      }
    ])

    const dateRange = ref([])
    const generateFixedDateRange = () => {
      const startDate = parseISO('2025-06-01')
      const endDate = parseISO('2027-12-10')
      dateRange.value = eachDayOfInterval({ start: startDate, end: endDate }).map(d =>
        format(d, 'yyyy-MM-dd')
      )
    }

    const onTaskDateChange = (task, value) => {
      if (!value || value.length !== 2) return
      const [startDate, endDate] = value
      task.planStart = format(startDate, 'yyyy-MM-dd')
      task.planEnd = format(endDate, 'yyyy-MM-dd')
      taskDateMap.value[task.id] = [startDate, endDate]
    }

    watch(tasks, (newTasks) => {
      const newTaskDateMap = {}
      newTasks.forEach(task => {
        newTaskDateMap[task.id] = [
          task.planStart ? parseISO(task.planStart) : null,
          task.planEnd ? parseISO(task.planEnd) : null
        ]
      })
      taskDateMap.value = newTaskDateMap
    }, { immediate: true, deep: true })

    const addTask = () => {
      if (!newTitle.value || !newAssignee.value || newDates.value.length !== 2) return
      const id = Date.now()
      tasks.value.push({
        id,
        title: newTitle.value,
        assignee: newAssignee.value,
        planStart: format(newDates.value[0], 'yyyy-MM-dd'),
        planEnd: format(newDates.value[1], 'yyyy-MM-dd'),
        actualStart: '',
        actualEnd: '',
        parentId: newParentId.value
      })
      newTitle.value = ''
      newAssignee.value = ''
      newDates.value = []
      newParentId.value = null
    }

    const getDayColor = (date, task) => {
      const d = new Date(date)
      const planStart = task.planStart ? parseISO(task.planStart) : null
      const planEnd = task.planEnd ? parseISO(task.planEnd) : null
      const actualStart = task.actualStart ? parseISO(task.actualStart) : null
      const actualEnd = task.actualEnd ? parseISO(task.actualEnd) : null
      if (actualStart && actualEnd && d >= actualStart && d <= actualEnd) return '#a8e6cf'
      if (planStart && planEnd && d >= planStart && d <= planEnd) return '#d0e8ff'
      return 'transparent'
    }

    const getIndentLevel = (task) => {
      let level = 0
      let current = task
      while (current.parentId) {
        current = tasks.value.find(t => t.id === current.parentId)
        if (!current) break
        level++
      }
      return level * 2
    }

    const getParentTitle = (parentId) => {
      const parent = tasks.value.find(t => t.id === parentId)
      return parent ? parent.title : ''
    }

    generateFixedDateRange()

    return {
      newTitle,
      newAssignee,
      newDates,
      newParentId,
      tasks,
      taskDateMap,
      dateRange,
      addTask,
      getDayColor,
      onTaskDateChange,
      getIndentLevel,
      getParentTitle
    }
  }
}
</script>

<style scoped>
.timeline-container {
  padding: 16px;
  overflow-x: auto;
}

.timeline-header,
.timeline-row {
  display: grid;
  grid-template-columns: 400px repeat(var(--day-count), 40px);
  align-items: stretch;
  border-bottom: 1px solid #e0e0e0;
}

.timeline-header {
  background-color: #f5f5f5;
  font-weight: bold;
  min-height: 50px;
}

.timeline-row {
  min-height: 120px;
}

.label {
  padding: 12px;
  border-right: 2px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.task-info {
  flex: 1;
}

.task-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.task-assignee {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.task-parent {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.date-picker-container {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.days {
  display: contents;
}

.day {
  height: 100%;
  border: 1px solid #ddd;
  min-width: 40px;
  text-align: center;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timeline-header .day {
  height: 50px;
  font-weight: bold;
  background-color: #f8f9fa;
}
</style>