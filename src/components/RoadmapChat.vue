<template>
  <div class="roadmap-chat">
    <div class="chat-messages">
      <div v-for="(message, index) in messages" :key="index" class="chat-message">
        <strong>{{ message.sender }}:</strong> {{ message.text }}
      </div>
    </div>
    <div class="chat-input">
      <input type="text" v-model="newMessage" @keyup.enter="sendMessage" placeholder="メッセージを入力...">
      <button @click="sendMessage">送信</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoadmapChat',
  data() {
    return {
      messages: [
        { sender: 'あなた', text: '' },
        { sender: 'AI', text: 'ロードマップ作成において悩んでいる点を記載ください！' }
      ],
      newMessage: ''
    };
  },
  methods: {
    sendMessage() {
      if (this.newMessage.trim()) {
        this.messages.push({ sender: 'あなた', text: this.newMessage.trim() });
        this.newMessage = '';
        // TODO: ここでメッセージをバックエンドに送信する処理を追加
        // 例: axios.post('/api/chat', { message: this.newMessage, sender: 'あなた' });
      }
    }
  }
};
</script>

<style scoped>
.roadmap-chat {
  flex-grow: 1; /* サイドバー内で利用可能なスペースを全て使う */
  display: flex;
  flex-direction: column;
  padding: 15px;
}

.chat-messages {
  flex-grow: 1; /* メッセージリストが利用可能なスペースを全て使う */
  overflow-y: auto; /* メッセージが多い場合はスクロール可能に */
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 15px;
  background-color: #fff;
  display: flex;
  flex-direction: column-reverse; /* 新しいメッセージが下に来るように */
}

.chat-message {
  margin-bottom: 8px;
  line-height: 1.4;
  word-wrap: break-word; /* 長い単語でも改行されるように */
}

.chat-message strong {
  color: #007bff;
}

.chat-input {
  display: flex;
  gap: 10px;
  padding-top: 10px; /* 入力欄とメッセージの間にスペース */
  border-top: 1px solid #e0e0e0;
}

.chat-input input {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1em;
}

.chat-input button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.chat-input button:hover {
  background-color: #0056b3;
}
</style>