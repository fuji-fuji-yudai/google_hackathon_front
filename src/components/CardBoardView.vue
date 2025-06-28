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
            <el-card class="card" :class="{ 'child-card': element.parentId }">
              <div class="card-content">
                <div class="task-title" :style="{ paddingLeft: `${getIndentLevel(element) * 16}px` }">
                  <!-- 親タスクの場合は太字表示 -->
                  <span :class="{ 'parent-title': hasChildren(element) }">
                    {{ element.title }}
                  </span>
                </div>
                <div class="task-info">
                  <small>担当: {{ element.assignee }}</small>
                  <small>予定：{{ element.plan_start }} ~ {{ element.plan_end }}</small>
                  <!-- 親タスク情報を表示 -->
                  <small v-if="element.parentId" class="parent-info">
                    親: {{ getParentTitle(element.parentId) }}
                  </small>
                </div>
              </div>
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
      <!-- 親タスク選択を追加 -->
      <el-select 
        v-model="newParentId" 
        placeholder="親タスクを選択（任意）" 
        class="input"
        style="margin-top: 8px;"
        clearable
      >
        <el-option :label="'（親なし）'" :value="null" />
        <el-option 
          v-for="task in props.tasks" 
          :key="task.id" 
          :label="task.title" 
          :value="task.id" 
        />
      </el-select>
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
    const newParentId = ref(null)

    // 子タスクを持つかどうかの判定
    const hasChildren = (task) => {
      return props.tasks.some(t => t.parentId === task.id)
    }

    // インデントレベルの取得
    const getIndentLevel = (task) => {
      let level = 0
      let currentTask = task
      while (currentTask.parentId) {
        level++
        currentTask = props.tasks.find(t => t.id === currentTask.parentId)
        if (!currentTask) break // 無限ループ防止
      }
      return level
    }

    // 親タスクのタイトルを取得
    const getParentTitle = (parentId) => {
      const parent = props.tasks.find(t => t.id === parentId)
      return parent ? parent.title : ''
    }

    function addTask() {
      if (!newTitle.value || !newAssignee.value || newDates.value.length !== 2) return

      const newTask = {
        id: null,
        title: newTitle.value,
        assignee: newAssignee.value,
        plan_start: format(newDates.value[0], 'yyyy-MM-dd'),
        plan_end: format(newDates.value[1], 'yyyy-MM-dd'),
        actual_start: '',
        actual_end: '',
        status: 'ToDo',
        parentId: newParentId.value
      }

      const updated = [...props.tasks, newTask]
      emit('update', updated)

      newTitle.value = ''
      newAssignee.value = ''
      newDates.value = []
      newParentId.value = null
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
      newParentId,
      addTask,
      hasChildren,
      getIndentLevel,
      getParentTitle,
      props
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
  transition: all 0.2s;
}

.card.child-card {
  background-color: #f8f9fa;
  border-left: 3px solid #1890ff;
}

.card-content {
  padding: 0;
}

.task-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.task-title .parent-title {
  font-weight: 600;
  color: #1890ff;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-info small {
  color: #666;
  font-size: 12px;
}

.parent-info {
  color: #999 !important;
  font-style: italic;
}

.task-input {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  width: 300px;
}

.input {
  margin-bottom: 8px;
}
</style>