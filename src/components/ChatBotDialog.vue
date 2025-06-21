<template>
  <el-dialog v-model="visible" title="Gemini チャットボット" width="600px" @close="reset">
    <div class="chat-window" ref="chatWindow">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['chat-bubble', msg.sender === 'AI' ? 'ai' : 'user']"
      >
        <p>{{ msg.text }}</p>
      </div>
    </div>

    <div class="input-area">
      <el-input
        v-model="userQuestion"
        placeholder="質問を入力してください..."
        @keyup.enter="sendQuestion"
        :disabled="loading"
        class="input-flex"
      />
      <el-button @click="sendQuestion" :disabled="loading || !userQuestion">
        {{ loading ? '送信中...' : '送信' }}
      </el-button>
      <el-button type="success" @click="addTask" :disabled="loading">
        タスク追加
      </el-button>
    </div>
  </el-dialog>

  <!-- タスク追加ダイアログ -->
  <el-dialog v-model="taskDialogVisible" title="新しいタスクを追加" width="500px">
    <el-form :model="newTask" label-width="100px">
      <el-form-item label="タスク名">
        <el-input v-model="newTask.name" />
      </el-form-item>
      <el-form-item label="担当者">
        <el-input v-model="newTask.assignee" />
      </el-form-item>
      <el-form-item label="開始日">
        <el-date-picker v-model="newTask.startDate" type="date" placeholder="開始日を選択" />
      </el-form-item>
      <el-form-item label="終了日">
        <el-date-picker v-model="newTask.endDate" type="date" placeholder="終了日を選択" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="taskDialogVisible = false">キャンセル</el-button>
      <!-- <el-button type="primary" @click="submitTask">追加</el-button> -->
      <el-button type="primary">追加</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  roomId: String
})
const emit = defineEmits(['update:modelValue'])

const visible = ref(props.modelValue)
watch(() => props.modelValue, val => visible.value = val)
watch(visible, val => emit('update:modelValue', val))

const userQuestion = ref('')
const messages = ref([
  { sender: 'AI', text: 'こんにちは！何をお手伝いしましょうか？' }
])
const loading = ref(false)

const sendQuestion = async () => {
  if (!userQuestion.value.trim()) return

  const question = userQuestion.value
  messages.value.push({ sender: 'ユーザー', text: question })
  userQuestion.value = ''
  loading.value = true

  try {
    const token = localStorage.getItem('token')
    const response = await fetch('https://my-image-14467698004.asia-northeast1.run.app/api/gemini/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        question,
        roomId: props.roomId,
        similarMessages: [],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      messages.value.push({ sender: 'AI', text: data.error || 'サーバーエラーが発生しました' })
    } else {
      messages.value.push({ sender: 'AI', text: data.answer })
    }
  } catch (err) {
    messages.value.push({ sender: 'AI', text: err.message || '通信エラーが発生しました' })
  } finally {
    loading.value = false
    await nextTick()
    scrollToBottom()
  }
}

const reset = () => {
  userQuestion.value = ''
  messages.value = [{ sender: 'AI', text: 'こんにちは！何をお手伝いしましょうか？' }]
}

const chatWindow = ref(null)
const scrollToBottom = () => {
  if (chatWindow.value) {
    chatWindow.value.scrollTop = chatWindow.value.scrollHeight
  }
}

watch(messages, async () => {
  await nextTick()
  scrollToBottom()
}, { deep: true })

// タスク追加用の状態と関数
const taskDialogVisible = ref(false)
const newTask = ref({
  name: '',
  assignee: '',
  startDate: '',
  endDate: ''
})

const addTask = () => {
  taskDialogVisible.value = true
}

// const submitTask = async () => {
//   const { name, assignee, startDate, endDate } = newTask.value
//   if (!name || !assignee || !startDate || !endDate) {
//     ElMessage.error('すべての項目を入力してください。')
//     return
//   }

//   try {
//     const token = localStorage.getItem('token')
//     const response = await fetch('/api/tasks/create', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`,
//       },
//       body: JSON.stringify({
//         name,
//         assignee,
//         startDate,
//         endDate
//       })
//     })

//     const result = await response.json()

//     if (!response.ok) {
//       ElMessage.error(result.error || 'タスクの作成に失敗しました')
//     } else {
//       ElMessage.success('タスクが正常に追加されました')
//       taskDialogVisible.value = false
//       newTask.value = { name: '', assignee: '', startDate: '', endDate: '' }
//     }
//   } catch (err) {
//     ElMessage.error(err.message || '通信エラーが発生しました')
//   }
// }

</script>

<style scoped>
.chat-window {
  max-height: 300px;
  overflow-y: auto;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 6px;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}

.chat-bubble {
  display: inline-block;
  max-width: 80%;
  padding: 0.6rem 1rem;
  margin: 0.5rem 0;
  border-radius: 12px;
  word-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
  line-height: 1.4;
}

.chat-bubble.user {
  background-color: #d1eaff;
  align-self: flex-end;
}

.chat-bubble.ai {
  background-color: #e6e6e6;
  align-self: flex-start;
}

.input-area {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.input-area {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.input-flex {
  flex: 1;
}

</style>
