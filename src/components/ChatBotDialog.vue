<template>
  <el-dialog v-model="visible" title="Gemini チャットボット" width="600px" @close="reset">
    <div class="chat-window" ref="chatWindow">
      <div v-for="(msg, index) in messages" :key="index" :class="['chat-bubble', msg.sender === 'AI' ? 'ai' : 'user']">
        <p>{{ msg.text }}</p>
      </div>
    </div>

    <div class="input-area">
      <el-input
        v-model="userQuestion"
        placeholder="質問を入力してください..."
        @keyup.enter="sendQuestion"
        :disabled="loading"
      />
      <el-button @click="sendQuestion" :disabled="loading || !userQuestion">
        {{ loading ? '送信中...' : '送信' }}
      </el-button>
    </div>
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

const chatWindow=ref(null)
const scrollToBottom = () => {
  if (chatWindow.value) {
    chatWindow.value.scrollTop = chatWindow.value.scrollHeight
  }
}

watch(messages, async () => {
  await nextTick()
  scrollToBottom()
}, { deep: true })

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
  /* margin-left: auto; */
}

.chat-bubble.ai {
  background-color: #e6e6e6;
  align-self: flex-start;
  /* margin-right: auto; */
}

.input-area {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>
