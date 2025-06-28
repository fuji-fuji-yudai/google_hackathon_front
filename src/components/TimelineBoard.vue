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
      <div class="label">作業項目 / 担当 / 予定 / 実績</div>
      <div class="days">
        <div v-for="date in dateRange" :key="date" class="day">
          {{ date.slice(5) }}
        </div>
      </div>
    </div>

    <!-- 階層化されたタスクを表示 -->
    <div v-for="task in visibleTasks" :key="`task-${task.id}`" class="timeline-row"
      :class="{ 'parent-task': hasChildren(task), 'child-task': task.parentId }">
      <div class="label">
        <div class="task-info">
          <div class="task-title" :style="{ paddingLeft: `${getIndentLevel(task) * 20}px` }">
            <!-- 展開/折りたたみボタン（親タスクのみ） -->
            <span v-if="hasChildren(task)" class="expand-toggle" @click="toggleExpand(task.id)">
              <el-icon>
                <ArrowRight v-if="!expandedTasks[task.id]" />
                <ArrowDown v-else />
              </el-icon>
            </span>
            <!-- インデントスペース（子タスク） -->
            <span v-else-if="task.parentId" class="indent-space"></span>

            <!-- タスクタイトル -->
            <span class="title-text" :class="{ 'parent-title': hasChildren(task) }">{{ task.title }}</span>
          </div>

          <div class="task-assignee">担当: {{ task.assignee }}</div>

          <!-- 予定日付入力 -->
          <div class="date-picker-container">
            <el-date-picker v-if="taskPlanDateMap[task.id]" v-model="taskPlanDateMap[task.id]" type="daterange"
              size="small" start-placeholder="Plan Start" end-placeholder="Plan End"
              @change="(value) => onPlanDateChange(task, value)" />
          </div>

          <!-- 実績日付入力 -->
          <div class="date-picker-container">
            <el-date-picker v-if="taskActualDateMap[task.id]" v-model="taskActualDateMap[task.id]" type="daterange"
              size="small" start-placeholder="Actual Start" end-placeholder="Actual End"
              @change="(value) => onActualDateChange(task, value)" />
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
import { ref, watch, computed } from 'vue'
import { format, parseISO, eachDayOfInterval } from 'date-fns'
import { ArrowRight, ArrowDown } from '@element-plus/icons-vue'

export default {
  components: {
    ArrowRight,
    ArrowDown
  },
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
    const taskPlanDateMap = ref({})
    const taskActualDateMap = ref({})
    const expandedTasks = ref({}) // 展開状態を管理

    const dateRange = ref([])
    const generateFixedDateRange = () => {
      const startDate = parseISO('2025-06-01')
      const endDate = parseISO('2027-12-10')
      dateRange.value = eachDayOfInterval({ start: startDate, end: endDate }).map(d =>
        format(d, 'yyyy-MM-dd')
      )
    }

    // 階層構造を考慮した表示用タスクリスト
    const visibleTasks = computed(() => {
      const result = []

      // ★ 修正: parent_id → parentId に変更
      const rootTasks = localTasks.value.filter(task => !task.parentId)
      
      // console.log('=== visibleTasks デバッグ ===')
      // console.log('全タスク数:', localTasks.value.length)
      // console.log('ルートタスク数:', rootTasks.length)
      // console.log('ルートタスク:', rootTasks.map(t => `${t.title} (ID: ${t.id})`))

      const addTaskAndChildren = (task, level = 0) => {
        result.push({ ...task, level })

        // この親タスクが展開されている場合のみ子タスクを追加
        if (expandedTasks.value[task.id]) {
          // ★ 修正: parent_id → parentId に変更
          const children = localTasks.value.filter(child => child.parentId === task.id)
          // console.log(`${task.title} の子タスク:`, children.map(c => c.title))
          children.forEach(child => addTaskAndChildren(child, level + 1))
        }
      }

      rootTasks.forEach(task => addTaskAndChildren(task))
      return result
    })

    // 子タスクを持つかどうかの判定
    const hasChildren = (task) => {
      // ★ 修正: parent_id → parentId に変更
      return localTasks.value.some(t => t.parentId === task.id)
    }

    // 展開/折りたたみの切り替え
    const toggleExpand = (taskId) => {
      expandedTasks.value[taskId] = !expandedTasks.value[taskId]
    }

    // サブタスク追加
    const showAddSubTask = (parentId) => {
      newParentId.value = parentId
      // 自動的に展開
      expandedTasks.value[parentId] = true
    }

    // 初期状態で親タスクを展開
    watch(localTasks, (newTasks) => {
      // console.log('=== TimelineBoard watch デバッグ ===')
      // console.log('全タスク数:', newTasks.length)
      
      // 親子関係の確認（★ 修正: parent_id → parentId に変更）
      newTasks.forEach(task => {
        if (task.parentId) {
          // console.log(`子タスク: ${task.title} (ID: ${task.id}) -> 親ID: ${task.parentId}`)
          // const parent = newTasks.find(p => p.id === task.parentId)
          // console.log(`親タスク見つかった:`, parent ? parent.title : '見つからない')
        }
      })
      
      // ルートタスクの確認（★ 修正: parent_id → parentId に変更）
      // const rootTasks = newTasks.filter(task => !task.parentId)
      // console.log('ルートタスク:', rootTasks.map(t => t.title))

      const newExpandedState = { ...expandedTasks.value }

      // 新しい親タスクがあれば自動展開
      newTasks.forEach(task => {
        if (hasChildren(task) && !(task.id in newExpandedState)) {
          newExpandedState[task.id] = true
        }
      })

      expandedTasks.value = newExpandedState

      // 日付マップの更新（既存のロジック）
      const newPlanMap = {}
      const newActualMap = {}

      newTasks.forEach(task => {
        // 予定日付の初期化
        if (task.plan_start && task.plan_end &&
          task.plan_start !== '' && task.plan_end !== '') {
          try {
            const planStartDate = parseISO(task.plan_start)
            const planEndDate = parseISO(task.plan_end)

            if (!isNaN(planStartDate) && !isNaN(planEndDate)) {
              newPlanMap[task.id] = [planStartDate, planEndDate]
            } else {
              newPlanMap[task.id] = []
            }
          } catch (error) {
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
            } else {
              newActualMap[task.id] = []
            }
          } catch (error) {
            newActualMap[task.id] = []
          }
        } else {
          newActualMap[task.id] = []
        }
      })

      taskPlanDateMap.value = newPlanMap
      taskActualDateMap.value = newActualMap
    }, { immediate: true, deep: true })

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

    const addTask = () => {
      if (!newTitle.value || !newAssignee.value || newDates.value.length !== 2) return

      const newTask = {
        id: null,
        title: newTitle.value,
        assignee: newAssignee.value,
        plan_start: format(newDates.value[0], 'yyyy-MM-dd'),
        plan_end: format(newDates.value[1], 'yyyy-MM-dd'),
        actual_start: '',
        actual_end: '',
        status: 'TODO',
        parentId: newParentId.value
      }

      // console.log('=== addTask デバッグ ===')
      // console.log('選択された親ID:', newParentId.value)
      // console.log('新しいタスク:', newTask)
      // console.log('parentId の型:', typeof newTask.parentId)

      localTasks.value.push(newTask)
      emit('update', localTasks.value)

      // 親タスクがある場合は展開
      if (newParentId.value) {
        expandedTasks.value[newParentId.value] = true
      }

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

      if (actual_start && actual_end && d >= actual_start && d <= actual_end) {
        return '#a8e6cf'
      }
      if (plan_start && plan_end && d >= plan_start && d <= plan_end) {
        return '#d0e8ff'
      }
      return 'transparent'
    }

    const getIndentLevel = (task) => {
      return task.level || 0
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
      visibleTasks,
      expandedTasks,
      addTask,
      getDayColor,
      onPlanDateChange,
      onActualDateChange,
      getIndentLevel,
      getParentTitle,
      hasChildren,
      toggleExpand,
      showAddSubTask,
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
  min-height: 160px;
  transition: background-color 0.2s;
}

.timeline-row.parent-task {
  background-color: #fafbfc;
}

.timeline-row.child-task {
  background-color: #f8f9fa;
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-toggle {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.expand-toggle:hover {
  background-color: #e6f7ff;
}

.indent-space {
  width: 20px;
  display: inline-block;
}

.title-text {
  flex: 1;
}

.title-text.parent-title {
  font-weight: 600;
  color: #1890ff;
}

.add-subtask-btn {
  margin-left: auto;
  min-width: 24px;
  height: 24px;
  padding: 0;
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

.date-picker-container.compact {
  margin-bottom: 0;
  min-width: 220px;
}

.date-picker-container span {
  min-width: 40px;
  font-weight: bold;
  flex-shrink: 0;
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