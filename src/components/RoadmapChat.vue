<template>
  <div class="roadmap-chat">
    <h3>ロードマップチャット</h3>
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
        { sender: 'システム', text: 'チャットが開始されました。' },
        { sender: '太郎', text: '皆さん、おはようございます！' }
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
      }
    }
  }
};
</script>

<style scoped>
.roadmap-chat {
  margin-top: 30px;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

h3 {
  color: #333;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.chat-messages {
  height: 250px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 15px;
  background-color: #fcfcfc;
}

.chat-message {
  margin-bottom: 8px;
  line-height: 1.4;
}

.chat-message strong {
  color: #007bff;
}

.chat-input {
  display: flex;
  gap: 10px;
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