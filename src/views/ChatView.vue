<!-- チャットエリアにメッセージ配列とユーザーを渡す -->
<template>
  <div class="app-layout"> <!-- 画面全体のレイアウトを囲む -->
    <SidebarLayout :menuData="menuData" @menu-click="handleMenuClick" @add-root="handleAddRoot" @add-sub="handleAddSub"/> <!-- サイドバーのコンポーネント。メニューをクリックしたら@menu-clickイベントが発火し、handlemenuClickが呼ばれる。 @menu-click自体はカスタム。 -->
    <!-- <div v-if="selectedMenu && currentUsername.value" class="chat-area"> selectedMenuつまりメニューが選択されたらチャット画面が表示される。 -->
    <div v-if="selectedMenu" class="chat-area">
      <ChatArea
        :messages="chatHistories[selectedMenu.index] || []" 
        :currentuser="currentUsername.value"
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
const menuData = ref([])

const fetchRooms = async () => {
  const token = localStorage.getItem('token')
  const res = await fetch('https://my-image-14467698004.asia-northeast1.run.app/chat/rooms', {
  headers: {
    Authorization: `Bearer ${token}`
  }
  })
  const data = await res.json()
  menuData.value = data
}



onMounted(() => {
  currentUsername.value = getUsernameFromToken(token)
  connectWebSocket()
  fetchRooms()
})

const fetchChatHistory = async (roomId) => {
  try {
    const token = localStorage.getItem('token')
    console.log('トークルーム保管APIリクエスト時のトークン',token)
    const response = await fetch(`https://my-image-14467698004.asia-northeast1.run.app/chat/history/${roomId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (!response.ok) throw new Error('履歴取得に失敗しました')
    const history = await response.json()
    chatHistories.value[roomId] = history
    currentUsername.value = getUsernameFromToken(token)
    console.log('メニュークリック時のcurrentUsername:', currentUsername.value)
  } catch (error) {
    console.error('履歴取得エラー:', error)
    chatHistories.value[roomId] = [
      { sender: 'Bot', text: '履歴の取得に失敗しました。' }
    ]
  }
}

// WebSocket 接続
const connectWebSocket = () => {
  const socket = new SockJS('https://my-image-14467698004.asia-northeast1.run.app/ws')
  const token = localStorage.getItem('token');

  stompClient.value = new Client({
  webSocketFactory: () => socket,
  connectHeaders:{
    Authorization: `Bearer ${token}`
  },
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

const handleMenuClick = async (menuItem) => {
  selectedMenu.value = menuItem
  const roomId = menuItem.index

  try {
    await fetchChatHistory(roomId)
    //console.log('取得した履歴', history)
    console.log('ログインユーザー',currentUsername.value)
  } catch (e) {
    // 失敗しても空の履歴を初期化
    chatHistories.value[roomId] = [
      { sender: 'Bot', text: `「${menuItem.title}」のチャットを開始します。` }
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


onBeforeUnmount(() => {
  if (stompClient.value) stompClient.value.deactivate()
})

const handleAddRoot = async (title) => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('https://my-image-14467698004.asia-northeast1.run.app/chat/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: title,
        parentIndex: null // ルートメニューなので親なし
      })
    })

    if (!response.ok) throw new Error('作成に失敗しました')

    const newRoom = await response.json()
    menuData.value.push(newRoom)
  } catch (e) {
    console.error('ルーム追加エラー:', e)
  }
}

const handleAddSub = async ({ parent, title }) => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('https://my-image-14467698004.asia-northeast1.run.app/chat/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: title,
        parentIndex: parent.index
      })
    })

    if (!response.ok) throw new Error('サブメニュー作成に失敗')

    const newRoom = await response.json()   
    console.log('新しく追加されたルーム:', newRoom)


    // 親を menuData から探して children に追加
    const addChildToParent = (nodes) => {
      for (const node of nodes) {
        if (node.index === parent.index) {
          if (!node.children) node.children = []
          node.children.push(newRoom)
          return true
        }
        if (node.children && addChildToParent(node.children)) {
          return true
        }
      }
      return false
    }

    addChildToParent(menuData.value)
    console.log('menuData after addSub:', JSON.stringify(menuData.value, null, 2))

  } catch (e) {
    console.error('サブメニュー追加エラー:', e)
  }
}




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
 overflow: hidden;
}

.chat-area {
 flex: 1; /* フレックスコンテナ内で残りのスペースをすべて使う。本ケースだとサイドバー以外をチャットエリアで埋める。 */
 overflow: hidden;/* チャットエリア内で、はみ出したコンテンツを非表示にする。 */
 display: flex;
 flex-direction: column;

}
</style>