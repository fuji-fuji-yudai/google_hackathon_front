<template>
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
          <el-option 
            v-for="task in availableParentTasks" 
            :key="task.id" 
            :label="task.title" 
            :value="task.id" 
          />
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
          <div>開始予定</div>
          <div>完了予定</div>
          <div>開始実績</div>
          <div>完了実績</div>
          <div>担当者</div>
          <div>操作</div>
        </div>
        
        <div 
          v-for="task in visibleTasks" 
          :key="`task-${task.id}`"
          class="task-row"
          :class="{ 
            'parent-task': hasChildren(task), 
            'child-task': task.parentId 
          }"
        >
          <div class="toggle-column">
            <!-- IDソート表示のため展開/折りたたみ機能は無効 -->
          </div>
          
          <div class="task-name">
            <span class="status-indicator" :class="`status-${getStatusClass(task.status)}`"></span>
            <span class="task-id">ID:{{ task.id }}</span>
            {{ hasChildren(task) ? '📋' : '📄' }} {{ task.title }}
          </div>
          
          <div class="date-cell" @click="openDatePicker(task, 'plan_start')">
            {{ formatDate(task.plan_start) || 'クリックして設定' }}
          </div>
          <div class="date-cell" @click="openDatePicker(task, 'plan_end')">
            {{ formatDate(task.plan_end) || 'クリックして設定' }}
          </div>
          <div class="date-cell" @click="openDatePicker(task, 'actual_start')">
            {{ formatDate(task.actual_start) || 'クリックして設定' }}
          </div>
          <div class="date-cell" @click="openDatePicker(task, 'actual_end')">
            {{ formatDate(task.actual_end) || 'クリックして設定' }}
          </div>
          <div class="assignee-cell">{{ task.assignee }}</div>
          
          <div class="action-cell">
            <el-button 
              type="danger" 
              size="small" 
              plain 
              @click="confirmDeleteTask(task)"
              :disabled="task.id === null"
            >
              🗑️
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- ガントチャート部分 -->
      <div class="gantt-chart">
        <div class="gantt-content">
          <!-- 固定ヘッダー -->
          <div class="chart-header-fixed">
            <div 
              v-for="date in dateRange" 
              :key="date" 
              class="date-column"
              :class="{ 
                'weekend': isWeekend(date),
                'today': isToday(date)
              }"
            >
              <div class="date-year-month">{{ formatDateHeader(date).yearMonth }}</div>
              <div class="date-day">{{ formatDateHeader(date).day }}</div>
            </div>
          </div>
          
          <!-- スクロール可能なタスク行エリア -->
          <div class="gantt-rows-container">
            <div 
              v-for="task in visibleTasks" 
              :key="`gantt-${task.id}`"
              class="gantt-row"
              :class="{ 
                'parent-row': hasChildren(task), 
                'child-row': task.parentId 
              }"
            >
              <div class="gantt-row-container">
                <div 
                  v-for="date in dateRange" 
                  :key="date"
                  class="gantt-cell"
                  :class="{ 
                    'weekend': isWeekend(date),
                    'today': isToday(date)
                  }"
                >
                </div>
                
                <!-- 予定タスクバー -->
                <div 
                  v-if="task.plan_start && task.plan_end"
                  class="task-bar planned-bar"
                  :class="hasChildren(task) ? 'parent-bar' : 'child-bar'"
                  :style="getTaskBarStyle(task, 'planned')"
                  @click="openGanttDatePicker(task, 'planned', $event)"
                  :title="`予定: ${formatDate(task.plan_start)} - ${formatDate(task.plan_end)} (クリックで編集)`"
                >
                  <span class="bar-label">{{ task.title }}</span>
                </div>
                
                <!-- 実績タスクバー -->
                <div 
                  v-if="task.actual_start && task.actual_end"
                  class="task-bar actual-bar"
                  :style="getTaskBarStyle(task, 'actual')"
                  @click="openGanttDatePicker(task, 'actual', $event)"
                  :title="`実績: ${formatDate(task.actual_start)} - ${formatDate(task.actual_end)} (クリックで編集)`"
                >
                  <span class="bar-label">実績</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日付ピッカーモーダル -->
    <el-dialog v-model="showDatePicker" title="日付設定" width="400px">
      <div v-if="selectedTask">
        <h4>{{ selectedTask.title }}</h4>
        <div style="margin: 20px 0;">
          <label>{{ getDateLabel(selectedDateField) }}:</label>
          <el-date-picker 
            v-model="tempDate" 
            type="date"
            placeholder="日付を選択"
            style="width: 100%; margin-top: 8px;"
            format="YYYY/MM/DD"
            value-format="YYYY-MM-DD"
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="showDatePicker = false">キャンセル</el-button>
        <el-button type="primary" @click="updateTaskDate">更新</el-button>
      </template>
    </el-dialog>

    <!-- ガントチャート用日付範囲ピッカーモーダル -->
    <el-dialog v-model="showGanttDatePicker" title="期間設定" width="500px">
      <div v-if="selectedTask">
        <h4>{{ selectedTask.title }}</h4>
        <div style="margin: 20px 0;">
          <label>{{ selectedDateType === 'planned' ? '予定期間' : '実績期間' }}:</label>
          <el-date-picker 
            v-model="tempDateRange" 
            type="daterange"
            range-separator="〜"
            start-placeholder="開始日"
            end-placeholder="終了日"
            style="width: 100%; margin-top: 8px;"
            format="YYYY/MM/DD"
            value-format="YYYY-MM-DD"
          />
        </div>
        <div style="margin: 20px 0;">
          <el-button @click="clearDateRange" type="info" plain>期間をクリア</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="showGanttDatePicker = false">キャンセル</el-button>
        <el-button type="primary" @click="updateTaskDateRange">更新</el-button>
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

// リアクティブ変数
const localTasks = ref([...props.tasks])
const newTitle = ref('')
const newAssignee = ref('')
const newDates = ref([])
const newParentId = ref(null)
const expandedTasks = ref({}) // 展開状態
const showDatePicker = ref(false)
const showGanttDatePicker = ref(false)
const selectedTask = ref(null)
const selectedDateField = ref('')
const selectedDateType = ref('') // 'planned' または 'actual'
const tempDate = ref('')
const tempDateRange = ref([])
const dateRange = ref([])

// 日付範囲生成（日単位）
const generateDateRange = () => {
  const startDate = parseISO('2025-06-01')
  const endDate = parseISO('2025-08-31')
  dateRange.value = eachDayOfInterval({ start: startDate, end: endDate })
    .map(d => format(d, 'yyyy-MM-dd'))
}

// タスクIDの昇順で表示用タスクリスト
const visibleTasks = computed(() => {
  // IDでソートしてから階層構造を無視して全て表示
  return localTasks.value
    .filter(task => task.id !== null && task.id !== undefined)
    .sort((a, b) => {
      // IDが数値の場合は数値でソート、そうでなければ文字列でソート
      if (typeof a.id === 'number' && typeof b.id === 'number') {
        return a.id - b.id
      }
      return String(a.id).localeCompare(String(b.id))
    })
})

// 親タスクとして選択可能なタスク
const availableParentTasks = computed(() => {
  return localTasks.value.filter(task => {
    return (!task.parentId || task.parentId === null || task.parentId === undefined) &&
           task.id !== null && task.id !== undefined
  })
})

// 子タスクを持つかどうかの判定
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
    return {
      yearMonth: format(date, 'yyyy/MM'),
      day: format(date, 'dd')
    }
  } catch {
    return {
      yearMonth: '',
      day: ''
    }
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

// タスクバーの位置とサイズを計算
const getTaskBarStyle = (task, type) => {
  let startDate, endDate
  
  if (type === 'planned') {
    startDate = task.plan_start
    endDate = task.plan_end
  } else {
    startDate = task.actual_start
    endDate = task.actual_end
  }
  
  if (!startDate || !endDate || startDate === '' || endDate === '') {
    return { display: 'none' }
  }
  
  try {
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    const rangeStart = parseISO(dateRange.value[0])
    const rangeEnd = parseISO(dateRange.value[dateRange.value.length - 1])
    
    // 表示範囲外の場合は非表示
    if (end < rangeStart || start > rangeEnd) {
      return { display: 'none' }
    }
    
    // 開始位置の計算（表示範囲内での位置）
    const actualStart = start < rangeStart ? rangeStart : start
    const actualEnd = end > rangeEnd ? rangeEnd : end
    
    const startIndex = dateRange.value.findIndex(date => date === format(actualStart, 'yyyy-MM-dd'))
    const endIndex = dateRange.value.findIndex(date => date === format(actualEnd, 'yyyy-MM-dd'))
    
    if (startIndex === -1) return { display: 'none' }
    
    const validEndIndex = endIndex === -1 ? dateRange.value.length - 1 : endIndex
    const width = (validEndIndex - startIndex + 1) * 15 // 15pxは各日付セルの幅
    
    return {
      position: 'absolute',
      left: `${startIndex * 15}px`,
      width: `${width}px`,
      zIndex: type === 'actual' ? 2 : 1
    }
  } catch {
    return { display: 'none' }
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

// 日付ラベル取得
const getDateLabel = (field) => {
  const labels = {
    'plan_start': '開始予定日',
    'plan_end': '完了予定日',
    'actual_start': '開始実績日',
    'actual_end': '完了実績日'
  }
  return labels[field] || field
}

// 日付ピッカーを開く（単一日付用）
const openDatePicker = (task, field) => {
  selectedTask.value = task
  selectedDateField.value = field
  tempDate.value = task[field] || ''
  showDatePicker.value = true
}

// ガントチャート用日付ピッカーを開く（期間用）
const openGanttDatePicker = (task, type, event) => {
  event.stopPropagation()
  selectedTask.value = task
  selectedDateType.value = type
  
  if (type === 'planned') {
    tempDateRange.value = [task.plan_start || '', task.plan_end || ''].filter(d => d !== '')
  } else {
    tempDateRange.value = [task.actual_start || '', task.actual_end || ''].filter(d => d !== '')
  }
  
  showGanttDatePicker.value = true
}

// 単一日付更新
const updateTaskDate = () => {
  if (selectedTask.value && selectedDateField.value) {
    const taskIndex = localTasks.value.findIndex(t => t.id === selectedTask.value.id)
    if (taskIndex !== -1) {
      localTasks.value[taskIndex][selectedDateField.value] = tempDate.value
      emit('update', [...localTasks.value])
      ElMessage.success('日付を更新しました')
    }
  }
  showDatePicker.value = false
}

// 期間更新
const updateTaskDateRange = () => {
  if (selectedTask.value && selectedDateType.value) {
    const taskIndex = localTasks.value.findIndex(t => t.id === selectedTask.value.id)
    if (taskIndex !== -1) {
      if (selectedDateType.value === 'planned') {
        localTasks.value[taskIndex].plan_start = tempDateRange.value[0] || ''
        localTasks.value[taskIndex].plan_end = tempDateRange.value[1] || ''
      } else {
        localTasks.value[taskIndex].actual_start = tempDateRange.value[0] || ''
        localTasks.value[taskIndex].actual_end = tempDateRange.value[1] || ''
      }
      emit('update', [...localTasks.value])
      ElMessage.success('期間を更新しました')
    }
  }
  showGanttDatePicker.value = false
}

// 期間クリア
const clearDateRange = () => {
  if (selectedTask.value && selectedDateType.value) {
    const taskIndex = localTasks.value.findIndex(t => t.id === selectedTask.value.id)
    if (taskIndex !== -1) {
      if (selectedDateType.value === 'planned') {
        localTasks.value[taskIndex].plan_start = ''
        localTasks.value[taskIndex].plan_end = ''
      } else {
        localTasks.value[taskIndex].actual_start = ''
        localTasks.value[taskIndex].actual_end = ''
      }
      emit('update', [...localTasks.value])
      ElMessage.success('期間をクリアしました')
    }
  }
  showGanttDatePicker.value = false
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

// タスク追加
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

// 初期化
generateDateRange()
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
  margin: 20px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 5px;
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
  height: 650px;
}

.task-info {
  width: 720px;
  border-right: 2px solid #e0e0e0;
  flex-shrink: 0;
  background: white;
  z-index: 10;
  overflow-x: auto;
  overflow-y: auto;
  position: relative;
}

.gantt-chart {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  min-width: 0;
}

.gantt-content {
  min-width: 1350px; /* 日付列幅を半分にしたため幅も半分に */
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
  grid-template-columns: 40px 220px 90px 90px 90px 90px 100px 80px;
  gap: 0;
  padding: 0;
  height: 37px;
}

.info-header > div {
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
  height: 50px;
}

.date-column {
  min-width: 15px;
  width: 15px;
  padding: 0;
  border-right: 1px solid #e0e0e0;
  border-bottom: 2px solid #e0e0e0;
  text-align: center;
  background: #f8f9fa;
  font-weight: bold;
  color: #333;
  height: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.date-year-month {
  font-size: 7px;
  line-height: 1;
  margin-bottom: 2px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.date-day {
  font-size: 10px;
  line-height: 1;
  font-weight: bold;
}

.date-column.weekend {
  background-color: #d3d3d3 !important;
  color: #666;
}

.date-column.today {
  background-color: #74b9ff !important;
  color: white;
}

.task-row {
  display: grid;
  grid-template-columns: 40px 220px 90px 90px 90px 90px 100px 80px;
  gap: 0;
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s;
  height: 37px;
}

.task-row:hover {
  background-color: #f0f8ff;
}

.task-row > div {
  padding: 0 8px;
  border-right: 1px solid #e0e0e0;
  font-size: 12px;
  background: white;
  display: flex;
  align-items: center;
  height: 37px;
  overflow: hidden;
}

.parent-task {
  background: #e8f4f8 !important;
  font-weight: bold;
}

.parent-task > div {
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

.date-cell, .assignee-cell {
  text-align: center;
  font-size: 11px;
  justify-content: center;
}

.date-cell {
  cursor: pointer;
  transition: background-color 0.2s;
}

.date-cell:hover {
  background-color: #e6f7ff !important;
}

.action-cell {
  justify-content: center;
}

.gantt-row {
  height: 37px;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
}

.gantt-row.parent-row {
  background: #f8f9fa;
}

.gantt-row.child-row {
  background: #fdfdfd;
}

.gantt-row-container {
  display: flex;
  height: 100%;
  position: relative;
}

.gantt-cell {
  min-width: 15px;
  width: 15px;
  height: 100%;
  border-right: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.gantt-cell.weekend {
  background-color: #d3d3d3;
}

.gantt-cell.today {
  background-color: #ddeeff;
}

.task-bar {
  height: 16px;
  border-radius: 8px;
  margin: 2px 0;
  font-size: 10px;
  color: white;
  font-weight: bold;
  display: flex;
  align-items: center;
  padding-left: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-bar:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

.planned-bar {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  top: 4px;
}

.parent-bar {
  height: 20px;
}

.child-bar {
  height: 16px;
}

.actual-bar {
  background: linear-gradient(45deg, #FF9800, #F57C00) !important;
  height: 12px;
  top: 22px;
}

.bar-label {
  font-size: 9px;
  font-weight: bold;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-id {
  font-size: 10px;
  color: #666;
  margin-right: 8px;
  font-weight: normal;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
  flex-shrink: 0;
}

.status-planned { background-color: #95a5a6; }
.status-progress { background-color: #f39c12; }
.status-completed { background-color: #27ae60; }
</style>