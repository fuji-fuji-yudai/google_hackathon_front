<template>
  <div class="chat-wrapper">
    <!-- チャットログ -->
    <div
      ref="chatLog"
      class="chat-log"
    >
      <div
        v-for="(msg, index) in props.messages" 
        :key="index" 
        :class="['chat-message', msg.sender === currentUsername ? 'from-me' : 'from-others']"
      >
        <div class="sender-name">
          {{ msg.sender }}
          <!-- （current: {{ currentUsername }}） -->
          <!-- {{ JSON.stringify(msg) }} -->
        </div> 
        <div class="bubble">
          {{ msg.text }}
          <!-- {{ props.currentuser }} -->
        </div>
      </div>
    </div>

    <!-- 入力フォーム -->
    <div class="chat-input">
      <el-input
        v-model="newMessage"
        placeholder="メッセージを入力..."
        clearable
        class="chat-textbox"
        @keyup.enter="sendMessage"
      />
      <el-button
        :disabled="!isConnected"
        type="primary"
        @click="sendMessage"
      >
        送信
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick,computed} from 'vue'
import { watch } from 'vue'

const props = defineProps({
  messages: Array,
  currentuser: String,
  isConnected:Boolean
})

const emit = defineEmits(['send'])
console.log('ChatAreaで受け取ったcurrentuser:', props.currentuser)
const newMessage = ref('')
const chatLog = ref(null)
const getUsernameFromToken = (token) => {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    console.error('トークンが無効です:', token);
    return null;
  }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.username; // JWTの構造に応じて
  } catch (e) {
    console.error('トークンの解析に失敗しました', e);
    return null;
  }
};

const token = localStorage.getItem('token')

const currentUsername = computed(() => {
 return props.currentuser || getUsernameFromToken(token)
})

const sendMessage = () => {
  if (newMessage.value.trim() === '') return
  emit('send', newMessage.value)
  newMessage.value = ''
  nextTick(() => {
    chatLog.value.scrollTop = chatLog.value.scrollHeight
  })
}

watch(() => props.currentuser, (newVal) => {
 console.log('currentuser が更新されました:', newVal)
})
</script>


<style scoped>
.chat-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-log {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  background: #f9f9f9;
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
}

.chat-message {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
  max-width: 80%;
}

.from-me {
  align-self: flex-end;
  align-items: flex-end;
}

.from-others {
  align-self: flex-start;
  align-items: flex-start;
}

.sender-name {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 4px;
  padding: 0 8px;
}

.bubble {
  white-space: pre-wrap;         /* 改行をそのまま表示 */
  line-height: 1.8;              /* 行間を広めに */
  font-size: 0.95rem;
  padding: 12px 16px;
  border-radius: 16px;
  /* border: 1px solid #ccc; */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  background-color: #dcf8c6;
  color: #000;
  word-break: break-word;
}


.from-others .bubble {
  background-color: #fff;
  /* border: 1px solid #bbb; */
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #fff;
  border-top: 1px solid #ddd;
  flex-shrink: 0;
}

.chat-textbox {
  flex: 1;
}


</style>