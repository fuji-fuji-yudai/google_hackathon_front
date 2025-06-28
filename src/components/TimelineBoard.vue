<template>
  <div class="timeline-container" :style="{ '--day-count': dateRange.length }">
    <div class="task-input-row">
      <el-input v-model="newTitle" placeholder="タスク名" style="width: 200px; margin-right: 8px;" />
      <el-input v-model="newAssignee" placeholder="担当者" style="width: 150px; margin-right: 8px;" />
      <el-date-picker v-model="newDates" type="daterange" size="small" style="margin-right: 8px;" />
      <el-select v-model="newParentId" placeholder="親タスクを選択（任意）" style="width: 200px; margin-right: 8px;">
        <el-option :label="'（親なし）'" :value="null" />
        <el-option 
          v-for="task in availableParentTasks" 
          :key="task.id" 
          :label="task.title" 
          :value="task.id" 
        />
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
          <div class="task-title-row">
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
            
            <!-- 削除ボタン -->
            <el-button 
              type="danger" 
              size="small" 
              plain 
              @click="confirmDeleteTask(task)"
              class="delete-btn"
              :disabled="task.id === null"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
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

<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { format, parseISO, eachDayOfInterval } from 'date-fns'
import { ArrowRight, ArrowDown, Delete } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  }
})
const emit = defineEmits(['update'])

const localTasks = ref([...props.tasks])
const newTitle = ref('')
const newAssignee = ref('')
const newDates = ref([])
const newParentId = ref(null)
const taskPlanDateMap = ref({})
const taskActualDateMap = ref({})
const expandedTasks = ref({}) // 展開状態

const dateRange = ref([])
const generateFixedDateRange = () => {
  const startDate = parseISO('2025-06-01')
  const endDate = parseISO('2027-12-10')
  dateRange.value = eachDayOfInterval({ start: startDate, end: endDate }).map(d =>
    format(d, 'yyyy-MM-dd')
  )
}

// データ整合性チェック関数
const validateTaskHierarchy = (tasks) => {
  const issues = []

  tasks.forEach(task => {
    if (task.parentId) {
      const parent = tasks.find(t => t.id === task.parentId)
      if (!parent) {
        issues.push(`タスク "${task.title}" の親タスク ID ${task.parentId} が見つかりません`)
      }
      if (task.parentId === task.id) {
        issues.push(`タスク "${task.title}" が自分自身を親に指定しています`)
      }
    }
  })

  tasks.forEach(task => {
    const visited = new Set()
    let current = task
    let depth = 0

    while (current.parentId && depth < 20) {
      if (visited.has(current.id)) {
        issues.push(`循環参照を検出: タスク "${task.title}" の親子関係`)
        break
      }
      visited.add(current.id)
      current = tasks.find(t => t.id === current.parentId)
      if (!current) break
      depth++
    }

    if (depth >= 20) {
      issues.push(`階層が深すぎます: タスク "${task.title}" (深度: ${depth})`)
    }
  })

  if (issues.length > 0) {
    console.error('=== タスク階層の問題 ===')
    issues.forEach(issue => console.error(issue))
  }

  return issues
}

// 階層構造を考慮した表示用タスクリスト
const visibleTasks = computed(() => {
  const result = []
  const processedIds = new Set()
  const rootTasks = localTasks.value.filter(task => {
    return !task.parentId || task.parentId === null || task.parentId === undefined
  })

  const addTaskAndChildren = (task, level = 0, ancestorIds = new Set()) => {
    if (ancestorIds.has(task.id)) {
      console.warn(`循環参照を検出: タスクID ${task.id} (${task.title})`)
      return
    }

    if (processedIds.has(task.id)) {
      console.warn(`既に処理済み: タスクID ${task.id} (${task.title})`)
      return
    }

    if (level > 10) {
      console.warn(`階層が深すぎます: レベル ${level}, タスクID ${task.id}`)
      return
    }

    processedIds.add(task.id)
    result.push({ ...task, level })

    const children = localTasks.value.filter(child => {
      return child.parentId !== null && 
             child.parentId !== undefined && 
             child.parentId === task.id
    })

    const isExpanded = expandedTasks.value[task.id]

    if (isExpanded && children.length > 0) {
      const newAncestorIds = new Set(ancestorIds)
      newAncestorIds.add(task.id)
      
      children.forEach(child => {
        addTaskAndChildren(child, level + 1, newAncestorIds)
      })
    }
  }

  rootTasks.forEach(task => {
    addTaskAndChildren(task, 0, new Set())
  })

  return result
})

// 親タスクとして選択可能なタスク
const availableParentTasks = computed(() => {
  return localTasks.value.filter(task => {
    return (!task.parentId || task.parentId === null || task.parentId === undefined) &&
           task.id !== null && task.id !== undefined
  })
})

const hasChildren = (task) => {
  if (task.id === null || task.id === undefined) {
    return false
  }
  
  const children = localTasks.value.filter(t => {
    return t.parentId !== null && t.parentId !== undefined && t.parentId === task.id
  })
  
  return children.length > 0
}

// 展開/折りたたみの切り替え
const toggleExpand = (taskId) => {
  expandedTasks.value[taskId] = !expandedTasks.value[taskId]
}

// インデントレベルの取得
const getIndentLevel = (task) => {
  let level = 0
  let currentTask = task
  const visitedIds = new Set()

  while (currentTask.parentId && level < 10) {
    if (visitedIds.has(currentTask.id)) {
      console.warn(`getIndentLevel で循環参照を検出: ${currentTask.title}`)
      break
    }

    visitedIds.add(currentTask.id)
    level++
    currentTask = localTasks.value.find(t => t.id === currentTask.parentId)

    if (!currentTask) break
  }

  return level
}

// タスク削除確認ダイアログ
const confirmDeleteTask = async (task) => {
  if (task.id === null || task.id === undefined) {
    ElMessage.warning('保存されていないタスクです')
    return
  }

  const childTasks = localTasks.value.filter(t => t.parentId === task.id)
  const hasChildTasks = childTasks.length > 0

  try {
    let deleteChildren = false

    if (hasChildTasks) {
      await ElMessageBox.confirm(
        `「${task.title}」を削除します。\n子タスク（${childTasks.length}件）も一緒に削除しますか？`,
        '削除確認',
        {
          confirmButtonText: '子タスクも削除',
          cancelButtonText: '子タスクは残す',
          distinguishCancelAndClose: true,
          type: 'warning'
        }
      )
      deleteChildren = true
    } else {
      await ElMessageBox.confirm(
        `「${task.title}」を削除してもよろしいですか？`,
        '削除確認',
        {
          confirmButtonText: '削除',
          cancelButtonText: 'キャンセル',
          type: 'warning'
        }
      )
    }

    await deleteTask(task.id, deleteChildren)

  } catch (action) {
    if (action === 'cancel' && hasChildTasks) {
      try {
        await ElMessageBox.confirm(
          `「${task.title}」のみを削除し、子タスクは残します。よろしいですか？`,
          '削除確認',
          {
            confirmButtonText: '削除',
            cancelButtonText: 'キャンセル',
            type: 'warning'
          }
        )
        await deleteTask(task.id, false)
      } catch (e) {
        // キャンセルされた場合は何もしない
      }
    }
  }
}

// タスク削除処理
const deleteTask = async (taskId, deleteChildren) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      ElMessage.error('認証トークンが見つかりません')
      return
    }

    const response = await fetch(
      `https://my-image-14467698004.asia-northeast1.run.app/api/tasks/${taskId}?deleteChildren=${deleteChildren}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      }
    )

    if (!response.ok) {
      throw new Error(`削除失敗 status: ${response.status}`)
    }

    if (deleteChildren) {
      const tasksToDelete = getTaskAndChildren(taskId)
      const updatedTasks = localTasks.value.filter(task => !tasksToDelete.includes(task.id))
      ElMessage.success(`タスクと子タスク（${tasksToDelete.length}件）を削除しました`)
      emit('update', updatedTasks)
    } else {
      const updatedTasks = localTasks.value.filter(task => task.id !== taskId)
      updatedTasks.forEach(task => {
        if (task.parentId === taskId) {
          task.parentId = null
        }
      })
      ElMessage.success('タスクを削除しました')
      emit('update', updatedTasks)
    }

  } catch (error) {
    console.error('タスクの削除に失敗しました', error)
    ElMessage.error('タスクの削除に失敗しました: ' + error.message)
  }
}

// 指定タスクとその子タスクのIDを再帰的に取得
const getTaskAndChildren = (taskId) => {
  const result = [taskId]
  const children = localTasks.value.filter(task => task.parentId === taskId)
  children.forEach(child => {
    result.push(...getTaskAndChildren(child.id))
  })
  return result
}

// props.tasks の変更を監視してlocalTasksを同期
watch(() => props.tasks, (newTasks) => {
  localTasks.value = [...newTasks]
  
  nextTick(() => {
    newTasks.forEach(task => {
      if (task.parentId) {
        const parentTask = newTasks.find(t => t.id === task.parentId)
        if (parentTask && hasChildren(parentTask)) {
          expandedTasks.value[task.parentId] = true
        }
      }
    })
  })
}, { immediate: true, deep: true })

// localTasks の変更監視（日付マップ更新専用）
watch(localTasks, (newTasks) => {
  const issues = validateTaskHierarchy(newTasks)
  if (issues.length > 0) {
    console.error('階層データに問題があります:', issues)
    return
  }

  const newExpandedState = { ...expandedTasks.value }

  newTasks.forEach(task => {
    if (hasChildren(task) && !(task.id in newExpandedState)) {
      newExpandedState[task.id] = true
    }
  })

  expandedTasks.value = newExpandedState

  // 日付マップの更新
  const newPlanMap = {}
  const newActualMap = {}

  newTasks.forEach(task => {
    // taskのIDが存在することを確認
    if (task.id !== null && task.id !== undefined) {
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

// addTask 関数
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

  const updatedTasks = [...localTasks.value, newTask]
  emit('update', updatedTasks)

  if (newParentId.value) {
    nextTick(() => {
      expandedTasks.value[newParentId.value] = true
    })
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

generateFixedDateRange()
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

.task-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.task-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
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

.delete-btn {
  min-width: 32px;
  height: 28px;
  padding: 0 8px;
  flex-shrink: 0;
}

.task-assignee {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.date-picker-container {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 8px;
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