<template>
  <div class="chat-container">
    <div class="chat-log" ref="chatLog">
      <div v-for="(msg, index) in messages" :key="index" class="chat-message">
        <strong>{{ msg.sender }}:</strong> {{ msg.text }}
      </div>
    </div>
    <div class="chat-input">
      <el-input
        v-model="newMessage"
        placeholder="メッセージを入力..."
        @keyup.enter="sendMessage"
        clearable
      />
      <el-button type="primary" @click="sendMessage">送信</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const messages = ref([
  { sender: 'Bot', text: 'こんにちは！何かお手伝いしましょうか？' }
])
const newMessage = ref('')
const chatLog = ref(null)

const sendMessage = () => {
  if (newMessage.value.trim() === '') return
  messages.value.push({ sender: 'You', text: newMessage.value })
  newMessage.value = ''
  nextTick(() => {
    chatLog.value.scrollTop = chatLog.value.scrollHeight
  })
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-log {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background: #f9f9f9;
  border: 1px solid #ddd;
}

.chat-message {
  margin-bottom: 10px;
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-top: 1px solid #ddd;
  background: #fff;
}
</style>