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
          {{ msg.sender }}（current: {{ currentUsername }}）
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

/* .chat-log {
  flex: 0.9;
  overflow-y: auto;
  padding: 10px;
  background: #f9f9f9;
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
} */

.chat-log {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;   /* ← これがポイント！ */
  background: #f9f9f9;
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
}


.chat-message {
  margin-bottom: 10px;
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

.chat-message {
  display: flex;
  margin-bottom: 10px;
}

.from-me {
  justify-content: flex-end;
}

.from-others {
  justify-content: flex-start;
}

.bubble {
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 20px;
  position: relative;
  background-color: #dcf8c6; /* 自分のメッセージ色 */
  color: #000;
  word-wrap: break-word;
}

.from-others .bubble {
  background-color: #fff;
  border: 1px solid #ccc;
}

/* 吹き出しのしっぽ（オプション） */
.from-me .bubble::after {
  content: '';
  position: absolute;
  right: -10px;
  top: 10px;
  border-width: 10px 0 10px 10px;
  border-style: solid;
  border-color: transparent transparent transparent #dcf8c6;
}

.from-others .bubble::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 10px;
  border-width: 10px 10px 10px 0;
  border-style: solid;
  border-color: transparent #fff transparent transparent;
}

.sender-name {
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 2px;
  padding: 0 10px;
}

</style>