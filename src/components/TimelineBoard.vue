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
import { ref, watch, computed, nextTick } from 'vue'
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

    // データ整合性チェック関数
    const validateTaskHierarchy = (tasks) => {
      const issues = []

      tasks.forEach(task => {
        if (task.parentId) {
          // 親タスクが存在するかチェック
          const parent = tasks.find(t => t.id === task.parentId)
          if (!parent) {
            issues.push(`タスク "${task.title}" の親タスク ID ${task.parentId} が見つかりません`)
          }

          // 自分自身を親に指定していないかチェック
          if (task.parentId === task.id) {
            issues.push(`タスク "${task.title}" が自分自身を親に指定しています`)
          }
        }
      })

      // 循環参照チェック
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

    // 階層構造を考慮した表示用タスクリスト（詳細デバッグ版）
    const visibleTasks = computed(() => {
      const result = []
      const processedIds = new Set()
      const rootTasks = localTasks.value.filter(task => {
        // ★ 修正: parentId が null, undefined, または存在しない場合のみルートタスク
        return !task.parentId || task.parentId === null || task.parentId === undefined
      })

      console.log('=== 詳細デバッグ開始 ===')
      console.log('全タスクデータ:')
      localTasks.value.forEach(task => {
        console.log(`  ID: ${task.id}, Title: "${task.title}", ParentID: ${task.parentId}`)
      })
      
      console.log('ルートタスク:', rootTasks.map(t => `${t.title} (ID: ${t.id})`))

      const addTaskAndChildren = (task, level = 0, ancestorIds = new Set()) => {
        console.log(`\n--- 処理開始: "${task.title}" (ID: ${task.id}, Level: ${level}) ---`)
        console.log('現在の祖先IDs:', Array.from(ancestorIds))
        console.log('処理済みIDs:', Array.from(processedIds))

        // 循環参照チェック
        if (ancestorIds.has(task.id)) {
          console.error(`❌ 循環参照を検出: タスクID ${task.id} (${task.title})`)
          console.error('祖先チェーン:', Array.from(ancestorIds))
          return
        }

        // 処理済みチェック
        if (processedIds.has(task.id)) {
          console.warn(`⚠️ 既に処理済み: タスクID ${task.id} (${task.title})`)
          return
        }

        // レベル制限
        if (level > 10) {
          console.warn(`⚠️ 階層が深すぎます: レベル ${level}, タスクID ${task.id}`)
          return
        }

        console.log(`✅ タスクを結果に追加: "${task.title}"`)
        processedIds.add(task.id)
        result.push({ ...task, level })

        // 子タスクの検索
        const children = localTasks.value.filter(child => {
          // ★ 修正: null値の親子関係を除外
          return child.parentId !== null && 
                 child.parentId !== undefined && 
                 child.parentId === task.id
        })
        console.log(`子タスク検索結果: ${children.length}個`)
        children.forEach(child => {
          console.log(`  -> 子: "${child.title}" (ID: ${child.id})`)
        })

        // 展開状態チェック
        const isExpanded = expandedTasks.value[task.id]
        console.log(`展開状態: ${isExpanded ? '展開' : '折りたたみ'}`)

        if (isExpanded && children.length > 0) {
          console.log(`📂 子タスクを処理開始...`)
          
          // 新しい祖先セットを作成
          const newAncestorIds = new Set(ancestorIds)
          newAncestorIds.add(task.id)
          console.log('新しい祖先IDs:', Array.from(newAncestorIds))

          children.forEach((child, index) => {
            console.log(`\n📄 子タスク ${index + 1}/${children.length} を処理`)
            addTaskAndChildren(child, level + 1, newAncestorIds)
          })
        } else if (children.length > 0) {
          console.log(`📁 子タスクは存在するが折りたたまれています`)
        }

        console.log(`--- 処理完了: "${task.title}" ---`)
      }

      console.log('\n🚀 ルートタスクの処理開始')
      rootTasks.forEach((task, index) => {
        console.log(`\n=== ルートタスク ${index + 1}/${rootTasks.length}: "${task.title}" ===`)
        addTaskAndChildren(task, 0, new Set())
      })

      console.log('\n=== 最終結果 ===')
      console.log('表示タスク数:', result.length)
      result.forEach((task, index) => {
        console.log(`${index + 1}. "${task.title}" (Level: ${task.level})`)
      })

      return result
    })

    // 子タスクを持つかどうかの判定
    const hasChildren = (task) => {
      // ★ 修正: id が null の場合は子タスクを持たないとする
      if (task.id === null || task.id === undefined) {
        return false
      }
      
      const children = localTasks.value.filter(t => {
        // ★ 修正: 子タスクの parentId も null チェック
        return t.parentId !== null && t.parentId !== undefined && t.parentId === task.id
      })
      const result = children.length > 0
      
      return result
    }

    // 展開/折りたたみの切り替え
    const toggleExpand = (taskId) => {
      expandedTasks.value[taskId] = !expandedTasks.value[taskId]
      console.log(`展開状態変更: ID ${taskId} -> ${expandedTasks.value[taskId] ? '展開' : '折りたたみ'}`)
    }

    // インデントレベルの取得（無限ループ防止）
    const getIndentLevel = (task) => {
      let level = 0
      let currentTask = task
      const visitedIds = new Set() // 訪問済みIDを追跡

      while (currentTask.parentId && level < 10) { // レベル制限追加
        // 循環参照チェック
        if (visitedIds.has(currentTask.id)) {
          console.warn(`getIndentLevel で循環参照を検出: ${currentTask.title}`)
          break
        }

        visitedIds.add(currentTask.id)
        level++
        currentTask = localTasks.value.find(t => t.id === currentTask.parentId)

        if (!currentTask) break // 親が見つからない場合
      }

      return level
    }

    // props.tasks の変更を監視してlocalTasksを同期
    watch(() => props.tasks, (newTasks, oldTasks) => {
      console.log('=== props.tasks 変更検出 ===')
      console.log('新しいprops.tasks数:', newTasks.length)
      console.log('前のprops.tasks数:', oldTasks ? oldTasks.length : 0)
      
      // localTasksを完全に置き換え
      localTasks.value = [...newTasks]
      
      // データ更新後に展開状態を調整
      nextTick(() => {
        console.log('localTasks更新完了:', localTasks.value.length)
        
        // 新しく追加されたタスクの親があれば自動展開
        newTasks.forEach(task => {
          if (task.parentId) {
            const parentTask = newTasks.find(t => t.id === task.parentId)
            if (parentTask && hasChildren(parentTask)) {
              expandedTasks.value[task.parentId] = true
              console.log(`自動展開: 親タスク "${parentTask.title}" (ID: ${task.parentId})`)
            }
          }
        })
      })
      
    }, { immediate: true, deep: true })

    // localTasks の変更監視（日付マップ更新専用）
    watch(localTasks, (newTasks) => {
      console.log('=== localTasks 変更検出 ===')
      console.log('全タスク数:', newTasks.length)

      // データ整合性チェック
      const issues = validateTaskHierarchy(newTasks)
      if (issues.length > 0) {
        console.error('階層データに問題があります:', issues)
        return
      }

      // 親子関係の確認
      newTasks.forEach(task => {
        if (task.parentId) {
          console.log(`子タスク: ${task.title} (ID: ${task.id}) -> 親ID: ${task.parentId}`)
          const parent = newTasks.find(p => p.id === task.parentId)
          console.log(`親タスク見つかった:`, parent ? parent.title : '見つからない')
        }
      })

      const rootTasks = newTasks.filter(task => !task.parentId)
      console.log('ルートタスク:', rootTasks.map(t => t.title))

      const newExpandedState = { ...expandedTasks.value }

      // 新しい親タスクがあれば自動展開
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
    }, { deep: true })

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

      console.log('=== addTask デバッグ ===')
      console.log('選択された親ID:', newParentId.value)
      console.log('新しいタスク:', newTask)

      // 親コンポーネントに更新を通知
      const updatedTasks = [...localTasks.value, newTask]
      emit('update', updatedTasks)

      // 親タスクがある場合は展開状態を予約
      if (newParentId.value) {
        nextTick(() => {
          expandedTasks.value[newParentId.value] = true
          console.log(`親タスクを展開予約: ID ${newParentId.value}`)
        })
      }

      // フォームをクリア
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