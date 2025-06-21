<template>
  <div class="timeline-container" :style="{ '--day-count': dateRange.length }">
    <div class="task-input-row">
      <el-input v-model="newTitle" placeholder="タスク名" style="width: 200px; margin-right: 8px;" />
      <el-input v-model="newAssignee" placeholder="担当者" style="width: 150px; margin-right: 8px;" />
      <el-date-picker v-model="newDates" type="daterange" size="small" style="margin-right: 8px;" />
      <el-select v-model="newParentId" placeholder="親タスクを選択（任意）" style="width: 200px; margin-right: 8px;">
        <el-option :label="'（親なし）'" :value="null" />
        <el-option v-for="task in localTasks" :key="task.id" :label="task.title" :value="task.id" />
      </el-select>
      <el-button type="primary" @click="addTask">タスク追加</el-button>
    </div>

    <div class="timeline-header">
      <div class="label">作業項目 / 担当 / 親 / 予定 / 実績</div>
      <div class="days">
        <div v-for="date in dateRange" :key="date" class="day">
          {{ date.slice(5) }}
        </div>
      </div>
    </div>

    <div class="timeline-row" v-for="task in localTasks" :key="task.id">
      <div class="label">
        <div class="task-info">
          <div class="task-title" :style="{ paddingLeft: `${getIndentLevel(task)}em` }">
            {{ task.title }}
          </div>
          <el-button size="small" text @click="() => addingUnderTaskId.value = task.id">＋</el-button>

          <div class="task-assignee">担当: {{ task.assignee }}</div>
          <div class="task-parent" v-if="task.parent_id">親: {{ getParentTitle(task.parent_id) }}</div>
          
          <!-- 予定日付入力 -->
          <div class="date-picker-container">
            <span>予定：</span>
            <el-date-picker
              v-if="taskPlanDateMap[task.id]"
              v-model="taskPlanDateMap[task.id]"
              type="daterange"
              size="small"
              start-placeholder="開始日"
              end-placeholder="終了日"
              @change="(value) => onPlanDateChange(task, value)"
            />
          </div>

          <!-- 実績日付入力 -->
          <div class="date-picker-container">
            <span>実績：</span>
            <el-date-picker
              v-if="taskActualDateMap[task.id]"
              v-model="taskActualDateMap[task.id]"
              type="daterange"
              size="small"
              start-placeholder="実績開始日"
              end-placeholder="実績終了日"
              @change="(value) => onActualDateChange(task, value)"
            />
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
  props: {
    tasks: {
      type: Array,
      required: true
    }
  },
  emits: ['update'],
  setup(props, { emit }) {
    const localTasks = ref([...props.tasks])
    const newTitle = ref('')
    const newAssignee = ref('')
    const newDates = ref([])
    const newParentId = ref(null)
    const taskPlanDateMap = ref({})      // 予定日付用
    const taskActualDateMap = ref({})    // 実績日付用

    const dateRange = ref([])
    const generateFixedDateRange = () => {
      const startDate = parseISO('2025-06-01')
      const endDate = parseISO('2027-12-10')
      dateRange.value = eachDayOfInterval({ start: startDate, end: endDate }).map(d =>
        format(d, 'yyyy-MM-dd')
      )
    }

    // 予定日付変更
    const onPlanDateChange = (task, value) => {
      if (!value || value.length !== 2) {
        task.plan_start = ''
        task.plan_end = ''
        taskPlanDateMap.value[task.id] = []
      } else {
        const [startDate, endDate] = value
        task.plan_start = format(startDate, 'yyyy-MM-dd')
        task.plan_end = format(endDate, 'yyyy-MM-dd')
        taskPlanDateMap.value[task.id] = [startDate, endDate]
      }
      emit('update', localTasks.value)
    }

    // 実績日付変更
    const onActualDateChange = (task, value) => {
      if (!value || value.length !== 2) {
        task.actual_start = ''
        task.actual_end = ''
        taskActualDateMap.value[task.id] = []
      } else {
        const [startDate, endDate] = value
        task.actual_start = format(startDate, 'yyyy-MM-dd')
        task.actual_end = format(endDate, 'yyyy-MM-dd')
        taskActualDateMap.value[task.id] = [startDate, endDate]
      }
      emit('update', localTasks.value)
    }

    // タスクデータの初期化と監視
    watch(localTasks, (newTasks) => {
      const newPlanMap = {}
      const newActualMap = {}
      
      newTasks.forEach(task => {
        console.log(`Task ${task.id}:`, {
          plan_start: task.plan_start,
          plan_end: task.plan_end,
          actual_start: task.actual_start,
          actual_end: task.actual_end
        })
        
        // 予定日付の初期化
        if (task.plan_start && task.plan_end && 
            task.plan_start !== '' && task.plan_end !== '') {
          try {
            const planStartDate = parseISO(task.plan_start)
            const planEndDate = parseISO(task.plan_end)
            
            if (!isNaN(planStartDate) && !isNaN(planEndDate)) {
              newPlanMap[task.id] = [planStartDate, planEndDate]
              console.log(`Task ${task.id} 予定日付設定成功:`, [planStartDate, planEndDate])
            } else {
              newPlanMap[task.id] = []
            }
          } catch (error) {
            console.error(`Task ${task.id} 予定日付パースエラー:`, error)
            newPlanMap[task.id] = []
          }
        } else {
          newPlanMap[task.id] = []
        }

        // 実績日付の初期化
        if (task.actual_start && task.actual_end && 
            task.actual_start !== '' && task.actual_end !== '') {
          try {
            const actualStartDate = parseISO(task.actual_start)
            const actualEndDate = parseISO(task.actual_end)
            
            if (!isNaN(actualStartDate) && !isNaN(actualEndDate)) {
              newActualMap[task.id] = [actualStartDate, actualEndDate]
              console.log(`Task ${task.id} 実績日付設定成功:`, [actualStartDate, actualEndDate])
            } else {
              newActualMap[task.id] = []
            }
          } catch (error) {
            console.error(`Task ${task.id} 実績日付パースエラー:`, error)
            newActualMap[task.id] = []
          }
        } else {
          newActualMap[task.id] = []
        }
      })
      
      taskPlanDateMap.value = newPlanMap
      taskActualDateMap.value = newActualMap
      
      console.log('Updated taskPlanDateMap:', taskPlanDateMap.value)
      console.log('Updated taskActualDateMap:', taskActualDateMap.value)
    }, { immediate: true, deep: true })

    const addTask = () => {
      if (!newTitle.value || !newAssignee.value || newDates.value.length !== 2) return

      localTasks.value.push({
        id: null,
        title: newTitle.value,
        assignee: newAssignee.value,
        plan_start: format(newDates.value[0], 'yyyy-MM-dd'),
        plan_end: format(newDates.value[1], 'yyyy-MM-dd'),
        actual_start: '',
        actual_end: '',
        status: 'TODO',
        parent_id: newParentId.value
      })
      emit('update', localTasks.value)
      newTitle.value = ''
      newAssignee.value = ''
      newDates.value = []
      newParentId.value = null
    }

    const getDayColor = (date, task) => {
      const d = new Date(date)
      const plan_start = task.plan_start ? parseISO(task.plan_start) : null
      const plan_end = task.plan_end ? parseISO(task.plan_end) : null
      const actual_start = task.actual_start ? parseISO(task.actual_start) : null
      const actual_end = task.actual_end ? parseISO(task.actual_end) : null
      
      // 実績がある場合は実績色を優先（緑）
      if (actual_start && actual_end && d >= actual_start && d <= actual_end) {
        return '#a8e6cf'  // 緑：実績
      }
      // 予定のみの場合は青
      if (plan_start && plan_end && d >= plan_start && d <= plan_end) {
        return '#d0e8ff'  // 青：予定
      }
      return 'transparent'
    }

    const getIndentLevel = (task) => {
      let level = 0
      let current = task
      while (current.parent_id) {
        current = localTasks.value.find(t => t.id === current.parent_id)
        if (!current) break
        level++
      }
      return level * 2
    }

    const getParentTitle = (parentId) => {
      const parent = localTasks.value.find(t => t.id === parentId)
      return parent ? parent.title : ''
    }

    generateFixedDateRange()

    return {
      newTitle,
      newAssignee,
      newDates,
      newParentId,
      taskPlanDateMap,
      taskActualDateMap,
      localTasks,
      dateRange,
      addTask,
      getDayColor,
      onPlanDateChange,
      onActualDateChange,
      getIndentLevel,
      getParentTitle,
      emit
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
  grid-template-columns: 450px repeat(var(--day-count), 40px);
  align-items: stretch;
  border-bottom: 1px solid #e0e0e0;
}
.timeline-header {
  background-color: #f5f5f5;
  font-weight: bold;
  min-height: 50px;
}
.timeline-row {
  min-height: 160px; /* 高さを増加 */
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
  margin-bottom: 8px;
}
.date-picker-container span {
  min-width: 40px;
  font-weight: bold;
}
.status-container {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-top: 8px;
}
.status-container span {
  min-width: 40px;
  font-weight: bold;
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
.task-input-row {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
</style>