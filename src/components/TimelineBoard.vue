.task-content {
overflow-y: auto;
max-height: calc(600px - 37px);
}.date-cell-container {
display: flex;
flex-direction: column;
padding: 5px 8px;
border-right: 1px solid #e0e0e0;
font-size: 11px;
background: white;
justify-content: center;
}

.date-top {
text-align: center;
padding: 2px 0;
font-weight: 500;
color: #333;
}

.date-bottom {
text-align: center;
padding: 2px 0;
font-style: italic;
color: #666;
font-size: 10px;
}<template>
  <div class="container">
    <div class="header">
    </div>

    <!-- タスク追加フォーム -->
    <div class="task-input-section">
      <div class="task-input-row">
        <el-input v-model="newTitle" placeholder="タスク名" style="width: 200px;" />
        <el-input v-model="newAssignee" placeholder="担当者" style="width: 150px;" />
        <el-date-picker v-model="newDates" type="daterange" size="small" style="width: 240px;" />
        <el-select v-model="newParentId" placeholder="親タスクを選択（任意）" style="width: 200px;">
          <el-option :label="'（親なし）'" :value="null" />
          <el-option v-for="task in availableParentTasks" :key="task.id" :label="task.title" :value="task.id" />
        </el-select>
        <el-button type="primary" @click="addTask">タスク追加</el-button>
      </div>
    </div>

    <div class="wbs-container">
      <!-- タスク情報部分 -->
      <div class="task-info">
        <div class="info-header">
          <div></div>
          <div>タスク名</div>
          <div>予定開始</div>
          <div>予定完了</div>
          <div>実績開始</div>
          <div>実績完了</div>
          <div>担当者</div>
          <div>操作</div>
        </div>

        <div v-for="task in visibleTasks" :key="`task-${task.id}`" class="task-row" :class="{
          'parent-task': hasChildren(task),
          'child-task': task.parentId
        }">
          <div class="toggle-column">
            <span v-if="hasChildren(task)" class="toggle-btn" @click="toggleExpand(task.id)">
              {{ expandedTasks[task.id] ? '▼' : '▶' }}
            </span>
          </div>

          <div class="task-name" :style="{ paddingLeft: `${getIndentLevel(task) * 20}px` }">
            <span class="status-indicator" :class="`status-${getStatusClass(task.status)}`"></span>
            {{ hasChildren(task) ? '📋' : '📄' }} {{ task.title }}
          </div>

          <div class="date-cell">{{ formatDate(task.plan_start) }}</div>
          <div class="date-cell">{{ formatDate(task.plan_end) }}</div>
          <div class="date-cell">{{ formatDate(task.actual_start) }}</div>
          <div class="date-cell">{{ formatDate(task.actual_end) }}</div>
          <div class="assignee-cell">{{ task.assignee }}</div>

          <div class="action-cell">
            <el-button type="danger" size="small" plain @click="confirmDeleteTask(task)" :disabled="task.id === null">
              🗑️
            </el-button>
          </div>
        </div>
      </div>

      <!-- ガントチャート部分 -->
      <div class="gantt-chart">
        <div class="gantt-content">
          <div class="chart-header">
            <div v-for="date in dateRange" :key="date" class="date-column" :class="{
              'weekend': isWeekend(date),
              'today': isToday(date)
            }">
              {{ formatDateHeader(date) }}
            </div>
          </div>

          <div v-for="task in visibleTasks" :key="`gantt-${task.id}`" class="gantt-row" :class="{
            'parent-row': hasChildren(task),
            'child-row': task.parentId
          }">
            <div v-for="date in dateRange" :key="date" class="gantt-cell" :class="{
              'weekend': isWeekend(date),
              'today': isToday(date)
            }">
              <!-- 予定タスクバー -->
              <div v-if="isDateInRange(date, task.plan_start, task.plan_end)" class="task-bar"
                :class="hasChildren(task) ? 'parent-bar' : 'child-bar'">
              </div>

              <!-- 実績タスクバー -->
              <div v-if="isDateInRange(date, task.actual_start, task.actual_end)" class="task-bar actual-bar">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日付ピッカーモーダル -->
    <el-dialog v-model="showDatePicker" title="日付設定" width="500px">
      <div v-if="selectedTask">
        <h4>{{ selectedTask.title }}</h4>
        <div style="margin: 20px 0;">
          <label>予定期間:</label>
          <el-date-picker v-model="tempPlanDates" type="daterange" style="width: 100%; margin-top: 8px;" />
        </div>
        <div style="margin: 20px 0;">
          <label>実績期間:</label>
          <el-date-picker v-model="tempActualDates" type="daterange" style="width: 100%; margin-top: 8px;" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showDatePicker = false">キャンセル</el-button>
        <el-button type="primary" @click="updateTaskDates">更新</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { format, parseISO, eachDayOfInterval, isWeekend as isWeekendFn, isToday as isTodayFn } from 'date-fns'
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
const expandedTasks = ref({}) // 展開状態
const showDatePicker = ref(false)
const selectedTask = ref(null)
const tempPlanDates = ref([])
const tempActualDates = ref([])

const dateRange = ref([])
const generateDateRange = () => {
  const startDate = parseISO('2025-06-01')
  const endDate = parseISO('2025-08-31')
  dateRange.value = eachDayOfInterval({ start: startDate, end: endDate })
    .filter((_, index) => index % 7 === 0) // 週次表示
    .map(d => format(d, 'yyyy-MM-dd'))
}

// 階層構造を考慮した表示用タスクリスト
const visibleTasks = computed(() => {
  const result = []
  const processedIds = new Set()
  const rootTasks = localTasks.value.filter(task => {
    return !task.parentId || task.parentId === null || task.parentId === undefined
  })

  const addTaskAndChildren = (task, level = 0, ancestorIds = new Set()) => {
    if (ancestorIds.has(task.id) || processedIds.has(task.id) || level > 10) {
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
      break
    }

    visitedIds.add(currentTask.id)
    level++
    currentTask = localTasks.value.find(t => t.id === currentTask.parentId)

    if (!currentTask) break
  }

  return level
}

// 日付フォーマット関数
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === '') return '-'
  try {
    return format(parseISO(dateStr), 'MM/dd')
  } catch {
    return '-'
  }
}

const formatDateHeader = (dateStr) => {
  try {
    const date = parseISO(dateStr)
    return format(date, 'M/d') + '\n' + format(date, 'E')
  } catch {
    return dateStr
  }
}

// ステータスクラス取得
const getStatusClass = (status) => {
  switch (status) {
    case 'TODO': return 'planned'
    case 'Doing': return 'progress'
    case 'Done': return 'completed'
    default: return 'planned'
  }
}

// 日付範囲チェック
const isDateInRange = (date, startDate, endDate) => {
  if (!startDate || !endDate || startDate === '' || endDate === '') return false

  try {
    const d = parseISO(date)
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    return d >= start && d <= end
  } catch {
    return false
  }
}

// 週末判定
const isWeekend = (dateStr) => {
  try {
    return isWeekendFn(parseISO(dateStr))
  } catch {
    return false
  }
}

// 今日判定
const isToday = (dateStr) => {
  try {
    return isTodayFn(parseISO(dateStr))
  } catch {
    return false
  }
}

// タスク削除確認
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
        // キャンセル
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

// props.tasks の変更を監視
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

// addTask 関数
const addTask = () => {
  if (!newTitle.value || !newAssignee.value || newDates.value.length !== 2) {
    ElMessage.warning('全ての項目を入力してください')
    return
  }

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

  ElMessage.success('タスクを追加しました')
}

generateDateRange()
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin: 20px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  text-align: center;
}

.task-input-section {
  background: #f8f9fa;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.task-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.wbs-container {
  display: flex;
  height: 600px;
  overflow: hidden;
}

.task-info {
  width: 720px;
  border-right: 2px solid #e0e0e0;
  flex-shrink: 0;
  background: white;
  z-index: 10;
  overflow: hidden;
}

.gantt-chart {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  min-width: 0;
}

.gantt-content {
  min-width: 880px;
}

.info-header {
  background: #f8f9fa;
  border-bottom: 2px solid #e0e0e0;
  font-weight: bold;
  font-size: 12px;
  color: #333;
  position: sticky;
  top: 0;
  z-index: 15;
  display: grid;
  grid-template-columns: 40px 200px 100px 100px 100px 100px 100px 80px;
  gap: 0;
  padding: 0;
  height: 37px;
}

.info-header>div {
  padding: 0 8px;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  border-bottom: 2px solid #e0e0e0;
  text-align: center;
  height: 37px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-header {
  background: #f8f9fa;
  border-bottom: 2px solid #e0e0e0;
  font-weight: bold;
  font-size: 12px;
  color: #333;
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  padding: 0;
  height: 37px;
}

.date-column {
  min-width: 80px;
  padding: 0 4px;
  border-right: 1px solid #e0e0e0;
  border-bottom: 2px solid #e0e0e0;
  text-align: center;
  font-size: 10px;
  background: #f8f9fa;
  font-weight: bold;
  color: #333;
  white-space: pre-line;
  height: 37px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-column.weekend {
  background-color: #ffeaa7 !important;
}

.date-column.today {
  background-color: #74b9ff !important;
  color: white;
}

.task-row {
  display: grid;
  grid-template-columns: 40px 200px 100px 100px 100px 100px 100px 80px;
  gap: 1px;
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s;
  min-height: 41px;
}

.task-row:hover {
  background-color: #f0f8ff;
}

.task-row>div {
  padding: 10px 8px;
  border-right: 1px solid #e0e0e0;
  font-size: 12px;
  background: white;
  display: flex;
  align-items: center;
  min-height: 41px;
}

.parent-task {
  background: #e8f4f8 !important;
  font-weight: bold;
}

.parent-task>div {
  background: #e8f4f8 !important;
}

.child-task {
  background: #fafafa;
}

.toggle-column {
  justify-content: center;
}

.toggle-btn {
  cursor: pointer;
  color: #666;
  font-size: 14px;
  user-select: none;
  width: 20px;
  text-align: center;
  transition: color 0.2s;
}

.toggle-btn:hover {
  color: #1890ff;
}

.task-name {
  text-align: left;
  justify-content: flex-start;
  font-weight: 500;
}

.date-cell,
.assignee-cell {
  text-align: center;
  font-size: 11px;
  justify-content: center;
}

.action-cell {
  justify-content: center;
}

.gantt-row {
  display: flex;
  height: 37px;
  border-bottom: 1px solid #e0e0e0;
  align-items: center;
}

.gantt-row.parent-row {
  background: #f8f9fa;
}

.gantt-row.child-row {
  background: #fdfdfd;
}

.gantt-cell {
  min-width: 80px;
  height: 100%;
  border-right: 1px solid #f0f0f0;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2px;
}

.gantt-cell.weekend {
  background-color: #ffeaa7;
}

.gantt-cell.today {
  background-color: #ddeeff;
}

.task-bar {
  height: 16px;
  border-radius: 8px;
  margin: 1px 0;
  position: relative;
  font-size: 10px;
  color: white;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.parent-bar {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  height: 20px;
}

.child-bar {
  background: linear-gradient(45deg, #2196F3, #1976D2);
  height: 16px;
}

.actual-bar {
  background: linear-gradient(45deg, #FF9800, #F57C00);
  height: 12px;
  margin-top: 2px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
  flex-shrink: 0;
}

.status-planned {
  background-color: #95a5a6;
}

.status-progress {
  background-color: #f39c12;
}

.status-completed {
  background-color: #27ae60;
}
</style>