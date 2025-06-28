<template>
  <div>
    <!-- Excel アップローダーコンポーネント追加 -->
    <ExcelUploader @tasks-generated="handleTasksGenerated" />

    <el-radio-group v-model="viewMode" style="margin-bottom: 20px">
      <el-radio-button label="card">カード</el-radio-button>
      <el-radio-button label="timeline">タイムライン</el-radio-button>
    </el-radio-group>

    <CardBoardView v-if="viewMode === 'card'" :tasks="tasks" @update="handleUpdate" />
    <TimelineBoard v-else :tasks="tasks" @update="handleUpdate" />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import CardBoardView from '@/components/CardBoardView.vue'
import TimelineBoard from '@/components/TimelineBoard.vue'
import ExcelUploader from '@/components/ExcelUploader.vue'

export default {
  components: {
    CardBoardView,
    TimelineBoard,
    ExcelUploader
  },
  setup() {
    const viewMode = ref('card')
    const tasks = ref([])

    // snake_case → camelCase に変換
    const toCamel = (obj) => {
      const converted = {
        id: obj.id,
        title: obj.title,
        assignee: obj.assignee,
        plan_start: obj.plan_start,
        plan_end: obj.plan_end,
        actual_start: obj.actual_start,
        actual_end: obj.actual_end,
        status: obj.status,
        // ★ 修正: parent_id を parentId に変換、数値として扱う
        parentId: obj.parent_id ? parseInt(obj.parent_id) : null
      }
      
      // デバッグ: 親タスクがある場合のみログ出力
      if (obj.parent_id) {
        // console.log(`toCamel変換: ${obj.title} - parent_id: ${obj.parent_id} → parentId: ${converted.parentId}`)
      }
      
      return converted
    }

    // camelCase → snake_case に変換
    const toSnake = (obj) => ({
      id: obj.id,
      title: obj.title,
      assignee: obj.assignee,
      plan_start: obj.plan_start,
      plan_end: obj.plan_end,
      actual_start: obj.actual_start,
      actual_end: obj.actual_end,
      status: obj.status,
      parent_id: obj.parentId ?? null
    })

    // タスク一覧取得
    const fetchTasks = async () => {
      const token = localStorage.getItem('token')
      console.log('トークン:', token)
      if (!token) {
        console.error('トークンが取得できませんでした')
        return
      }

      try {
        const response = await fetch('https://my-image-14467698004.asia-northeast1.run.app/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`取得失敗 status: ${response.status}`)
        }

        const data = await response.json()
        // // console.log('=== サーバーから取得したデータ ===')
        // data.forEach(task => {
        //   // console.log(`ID: ${task.id}, Title: ${task.title}, parent_id: ${task.parent_id} (型: ${typeof task.parent_id})`)
        // })

        tasks.value = Array.isArray(data) ? data.map(toCamel) : []
        
        // console.log('=== toCamel変換後のデータ ===')
        // tasks.value.forEach(task => {
        //   console.log(`ID: ${task.id}, Title: ${task.title}, parentId: ${task.parentId} (型: ${typeof task.parentId})`)
        // })
        
        // 親子関係の確認
        // const parentTasks = tasks.value.filter(t => !t.parentId)
        // const childTasks = tasks.value.filter(t => t.parentId)
        // console.log('=== 親子関係の分析 ===')
        // console.log('親タスク:', parentTasks.map(t => `${t.title} (ID: ${t.id})`))
        // console.log('子タスク:', childTasks.map(t => `${t.title} (ID: ${t.id}, 親ID: ${t.parentId})`))
        
      } catch (error) {
        // console.error('タスクの取得に失敗しました', error)
        // console.log(JSON.stringify(JSON.parse(atob(token.split('.')[1])), null, 2))
      }
    }

    // タスク保存
    const saveTasks = async (newTasks) => {
      const token = localStorage.getItem('token')
      if (!token) {
        // console.error('トークンが取得できませんでした')
        return
      }

      try {
        const payload = newTasks.map(toSnake)
        // console.log('=== 保存前データ確認 ===')
        // console.log('変換前 (parentId):', newTasks)
        // console.log('変換後 (parent_id):', payload)

        // parent_id が設定されているタスクをチェック
        payload.forEach(task => {
          if (task.parent_id) {
            // console.log(`${task.title} の parent_id: ${task.parent_id}`)
          }
        })

        const response = await fetch('https://my-image-14467698004.asia-northeast1.run.app/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`保存失敗 status: ${response.status}`)
        }

        console.log('保存成功')
        
        // ★ 保存後にデータを再取得して最新状態を反映
        await fetchTasks()
        
      } catch (error) {
        console.error('タスクの保存に失敗しました', error)
      }
    }

    // 子コンポーネントから更新通知を受けた時
    const handleUpdate = (newTasks) => {
      tasks.value = newTasks
      saveTasks(newTasks)
    }

    // Excelからタスクが生成された時
    const handleTasksGenerated = (generatedTasks) => {
      // 既存のタスクに新しいタスクを追加
      const newTasks = [...tasks.value, ...generatedTasks]
      tasks.value = newTasks
      saveTasks(newTasks)
    }

    onMounted(fetchTasks)

    return {
      viewMode,
      tasks,
      handleUpdate,
      handleTasksGenerated
    }
  }
}
</script>