<template>
  <div>
    <el-radio-group
      v-model="viewMode"
      style="margin-bottom: 20px"
    >
      <el-radio-button label="card">カード</el-radio-button>
      <el-radio-button label="timeline">タイムライン</el-radio-button>
    </el-radio-group>

    <CardBoardView
      v-if="viewMode === 'card'"
      :tasks="tasks"
      @update="handleUpdate"
    />
    <TimelineBoard
      v-else
      :tasks="tasks"
      @update="handleUpdate"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import CardBoardView from '@/components/CardBoardView.vue'
import TimelineBoard from '@/components/TimelineBoard.vue'

export default {
  components: {
    CardBoardView,
    TimelineBoard
  },
  setup() {
    const viewMode = ref('card')
    const tasks = ref([])

    // snake_case → camelCase に変換
    const toCamel = (obj) => ({
      id: obj.id,
      title: obj.title,
      assignee: obj.assignee,
      planStart: obj.plan_start,
      planEnd: obj.plan_end,
      actualStart: obj.actual_start,
      actualEnd: obj.actual_end,
      status: obj.status,
      parentId: obj.parent_id ?? null
    })

    // camelCase → snake_case に変換
    const toSnake = (obj) => ({
      id: obj.id,
      title: obj.title,
      assignee: obj.assignee,
      plan_start: obj.planStart,
      plan_end: obj.planEnd,
      actual_start: obj.actualStart,
      actual_end: obj.actualEnd,
      status: obj.status,
      parent_id: obj.parentId ?? null
    })

    // タスク一覧取得
    const fetchTasks = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('トークンが取得できませんでした')
        return
      }

      try {
        const response = await fetch('/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error(`取得失敗 status: ${response.status}`)
        }

        const data = await response.json()
        console.log('取得成功:', data)

        tasks.value = Array.isArray(data) ? data.map(toCamel) : []
      } catch (error) {
        console.error('タスクの取得に失敗しました', error)
      }
    }

    // タスク保存
    const saveTasks = async (newTasks) => {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('トークンが取得できませんでした')
        return
      }

      try {
        const payload = newTasks.map(toSnake)

        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          throw new Error(`保存失敗 status: ${response.status}`)
        }

        console.log('保存成功')
      } catch (error) {
        console.error('タスクの保存に失敗しました', error)
      }
    }

    // 子コンポーネントから更新通知を受けた時
    const handleUpdate = (newTasks) => {
      tasks.value = newTasks
      saveTasks(newTasks)
    }

    onMounted(fetchTasks)

    return {
      viewMode,
      tasks,
      handleUpdate
    }
  }
}
</script>
