<!-- チャットエリアにメッセージ配列とユーザーを渡す -->
<template>
  <div class="app-layout"> <!-- 画面全体のレイアウトを囲む -->
    <SidebarLayout @menu-click="handleMenuClick" /> <!-- サイドバーのコンポーネント。メニューをクリックしたら@menu-clickイベントが発火し、handlemenuClickが呼ばれる。 @menu-click自体はカスタム。 -->
    <div v-if="selectedMenu" class="chat-area"> <!-- selectedMenuつまりメニューが選択されたらチャット画面が表示される。 -->
      <ChatArea
        :messages="chatHistories[selectedMenu.index] || []" 
        :currentuser="currentUsername"
        @send="handleSendMessage"
        :isConnected="isConnected"
      /> <!-- チャット画面を表示するコンポーネント。選択されたメニューに対応するチャット履歴を表示する。無ければ空の配列。
      現在のユーザーも渡す。メッセージが送信されたらhandleSendMessageメソッドが呼ばれる。 -->
    </div>
  </div>
</template>


<script setup> //compositionAPIを使ったロジック
import { ref,onMounted,onBeforeUnmount } from 'vue' //refはVueのリアクティブな状態を作るための関数→この変数は画面に関係しているから、変わったら自動で再描画してねというやつ
import SidebarLayout from '@/components/SidebarLayout.vue'
import ChatArea from '@/components/ChatArea.vue' //コンポーネントをインポート
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'


const selectedMenu = ref(null) //現在選択されているメニュー項目（オブジェクトを保持）★なぜref null?：初期値nullつまり未選択なことを示す
const chatHistories = ref({}) //各メニューごとのチャット履歴を保持するオブジェクト。キーはmenuItem.index ★上記と同様：初期値は空のオブジェクト、これからデータを追加していく。
const stompClient = ref(null)
const isConnected = ref(false)

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
const currentUsername = ref(getUsernameFromToken(token))




// WebSocket 接続
const connectWebSocket = () => {
  const socket = new SockJS('https://my-image-14467698004.asia-northeast1.run.app/ws')
  stompClient.value = new Client({
  webSocketFactory: () => socket,
  reconnectDelay: 5000,
  onConnect: () => {
    isConnected.value = true
    console.log('接続成功！isConnected:', isConnected.value)
      if (selectedMenu.value) {
        subscribeToRoom(selectedMenu.value.index)
      }
  },
  onDisconnect: () => {
    isConnected.value = false
  },
  
onStompError: (frame) => {
 console.error('❌ STOMP エラー:', frame)
 },
 onWebSocketError: (event) => {
 console.error('❌ WebSocket エラー:', event)
 }

})
stompClient.value.activate()
}


// ルーム購読
const subscribeToRoom = (roomId) => {
  stompClient.value.subscribe(`/topic/chat/${roomId}`, (message) => {
  const msg = JSON.parse(message.body)
  console.log('受信メッセージ：',msg)
  console.log('現在のユーザー：',currentUsername.value)
  if (msg.sender === currentUsername.value) return
  if (!chatHistories.value[roomId]) {
  chatHistories.value[roomId] = []
  }
  chatHistories.value[roomId].push(msg)
  })
}

const handleMenuClick = (menuItem) => { //menuitemは、SidebarLayoutから渡される選択されたメニューの情報★どこでどうやって渡してる？：$emit('menu-click', menuItem)というのを子コンポーネントで定義しており、menu-clickメソッドが発火したときにmenuItemが渡される。
  selectedMenu.value = menuItem //selectedmenuにそのメニューをセット。
  const roomId = menuItem.index
  if (!chatHistories.value[roomId]) { //チャット履歴がなければ初期メッセージを追加
    chatHistories.value[roomId] = [
      { sender: 'Bot', text: `「${menuItem.title}」のチャットを開始します。` } //トークルームごとに送信者とテキストの配列が格納されてる
    ]
  }
  if (isConnected.value) {
    subscribeToRoom(roomId)
  }
}

const handleSendMessage = (message) => { //ユーザーの入力メッセージ
  const roomId = selectedMenu.value.index

const msg = {
    text: message,
    roomId: roomId
  }
chatHistories.value[roomId].push(msg)


if (stompClient.value && stompClient.value.connected) {
  stompClient.value.publish({
  destination: `/app/chat/${roomId}`,
  body: JSON.stringify(msg),
  headers:{
    Authorization: `Bearer ${token}` //トークンをヘッダーに含める
  }
  })
} else {
console.warn('STOMP 接続が確立されていません。メッセージは送信されませんでした。')
}
}

  
onMounted(() => {
  connectWebSocket()
  })

onBeforeUnmount(() => {
  if (stompClient.value) stompClient.value.deactivate()
})


</script>

<style scoped> /* 対象はこのコンポーネントのみ */
::v-deep(.el-container) { /* v-deepによって子コンポーネント内部にスタイルを適用可能 */
 flex: initial !important; /* flexプロパティを初期値に戻している。 */
}
</style>

<style>
.app-layout {
 display: flex; /* 子要素を横並びに配置する。 */
 height: 100vh; /* 画面の高さいっぱいに広げる。 */
 gap: 0; /*子要素間の隙間をゼロにする。*/
}

.chat-area {
 flex: 1; /* フレックスコンテナ内で残りのスペースをすべて使う。本ケースだとサイドバー以外をチャットエリアで埋める。 */
 overflow: hidden;/* チャットエリア内で、はみ出したコンテンツを非表示にする。 */
 margin-left: 0; /* 左側の余白はゼロ */
}
</style>