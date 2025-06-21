<!-- チャットエリアにメッセージ配列とユーザーを渡す -->
<template>
  <!-- 画面全体のレイアウトを囲む -->
  <div class="app-layout"> 
    <!-- サイドバーを表示するカスタムコンポーネント（別ファイルで定義）
    propsとして、menuDataを渡してる。:はバインディング（javascriptの値を渡す）→バインディング：htmlの属性に、javascriptの値を結びつけること。動的データを渡せる。 props：親コンポーネントから子コンポーネントにデータを渡す仕組み。これは読取り専用のため、子コンポーネント内で直接変更不可。
    @menu-click="handleMenuClick"：サイドバー内でメニューがクリックされたときに発火するカスタムイベント。handleMenuClickメソッドが呼ばれる。→子で@click=~って感じでメソッドが定義されている。そのメソッド内で、親コンポーネントにmenu-clickイベントが通知される。
    @add-root="handleAddRoot"：ルートメニュー（親メニュー）を追加するイベント。→子コンポーネントからadd-rootが通知されたらhandleAddRootメソッドが呼ばれる。
    @add-sub="handleAddSub"：サブメニュー（子メニュー）を追加するイベント。
    -->
    <SidebarLayout 
      :menuData="menuData"
      @menu-click="handleMenuClick" 
      @add-root="handleAddRoot" 
      @add-sub="handleAddSub"
    /> 
    <!-- チャットエリアの表示条件
    v-if="selectedMenu"：selectedMenuが存在する（nullやundefinedでない）ときだけこのdivがDOMに描画される。
    つまりメニューが選択された時だけチャット画面を表示する。
    "chat-area"スタイルを指定。
    -->
    <div
      v-if="selectedMenu"
      class="chat-area"
    >
      <!--チャットエリアを表示するコンポーネント
       :messages="chatHistories[selectedMenu.index] || []"：選択されたメニューに対応するチャット履歴を渡す。該当する履歴がなければ空の配列を渡す（|| []）
       :currentuser="currentUsername.value"：ログインしているユーザー名を渡す。currentUsernameはrefで定義されている可能性が高く、.valueで中身を取り出している。→ref：リアクティブな値（リアルタイムで変化を追跡できる値、値が変わったときに自動で画面（DOM）や処理が更新される値）を作るための関数
       :is-connected="isConnected"：接続状態（WebSocketなど）を渡す。接続中かどうかを示すブール値。
       @send="handleSendMessage"：ユーザーがメッセージを送信したときに発火するイベント。handleSendMessageメソッドが呼ばれる。
     -->
      <ChatArea
        :messages="chatHistories[selectedMenu.index] || []" 
        :currentuser="currentUsername.value"
        :is-connected="isConnected"
        @send="handleSendMessage"
      />
    </div>
  </div>
</template>


<script setup> //compositionAPIを使ったロジック
import { ref,onMounted,onBeforeUnmount } from 'vue' //ref:リアクティブな変数を作る、onMounted:コンポーネントがマウントされた時に実行★
import SidebarLayout from '@/components/SidebarLayout.vue'
import ChatArea from '@/components/ChatArea.vue' //コンポーネントをインポート
import SockJS from 'sockjs-client'//SockJS:WebSocket通信のためのライブラリ★
import { Client } from '@stomp/stompjs'//Client：WebSocket通信のためのライブラリ


const selectedMenu = ref(null) //現在選択されているメニュー項目
const chatHistories = ref({}) //ルームごとのチャット履歴（オブジェクト形式）
const stompClient = ref(null) //STOMPクライアントのインスタンス★
const isConnected = ref(false) //WebSocket接続状態★
const getUsernameFromToken = (token) => {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    console.error('トークンが無効です:', token);
    return null;
  }
  try {
    const payload = JSON.parse(atob(token.split('.')[1])); //JWTのペイロード部分（2番目のドット区切り★）をBase64でコードして、ユーザー名を取得
    return payload.sub || payload.username; //subまたはusername★を返す。（JWTの仕様による）
  } catch (e) {
    console.error('トークンの解析に失敗しました', e);
    return null;
  }
};
const token = localStorage.getItem('token')
const currentUsername = ref(getUsernameFromToken(token)) //JWTトークンから取得したユーザー名
const menuData = ref([]) //チャットルームのツリー構造データ

//親子関係を持つフラットなリストをツリー構造に変換する処理
const buildTree = (flatList) => {
  const map = {} //各ノードをindexをキーにして保存する辞書
  const roots = [] //親を持たない(=ツリーのルート)を格納する配列

  // すべてのノードをマップに登録（index をキーに）
  flatList.forEach(item => {
    map[item.index] = { ...item, children: [] }//children:[]を追加して、子ノードを格納できるように。...item：元のitemを変更せずに、新しいオブジェクトを作成。（今回はchildrenプロパティを追加）
  })

  // 親子関係を構築
  flatList.forEach(item => {
    if (item.parentIndex && map[item.parentIndex]) {
      map[item.parentIndex].children.push(map[item.index]) //親ノードのchildrenに自分を追加
    } else if (!item.parentIndex) {
      roots.push(map[item.index]) //ルートノードとしてrootsに追加
    }
  })

  return roots
}

//チャットルーム一覧をAPIから取得する。非同期関数として定義。非同期関数：時間のかかる処理を待っている間に、他の処理を止めずに進められるようにする仕組み
const fetchRooms = async () => {
  const token = localStorage.getItem('token') //localStorageに保存されているtoken(JWT)を取得
  const res = await fetch('https://my-image-14467698004.asia-northeast1.run.app/chat/rooms', { //fetch★を使ってgetリクエストを送信
  headers: {
    Authorization: `Bearer ${token}` //Authorization ヘッダーに Bearer トークン★ を付けて、認証付きリクエストを実行
  }
  }) //awaitを使ってレスポンスを待つ await：この処理が終わるのを待ってから、次に進める。
  const data = await res.json() //レスポンスをjson形式に変換：Responseオブジェクトが返ってくる。（ステータス＋ヘッダー＋本文）形式を指定して中身を解釈する。jsonで読み込むと、JavaScriptのオブジェクトや配列としてそのまま使えるようになる。
  console.log('初期取得 menuData:', JSON.stringify(data, null, 2))
  menuData.value = buildTree(data)//フラットな配列をツリー構造に変換。変換後のデータをリアクティブ変数menuDataに代入。
}



onMounted(() => { //VueコンポーネントがDOMにマウント（表示）された時に実行する関数を登録。（初期化処理をここで行うのが一般的）
  currentUsername.value = getUsernameFromToken(token)
  connectWebSocket() //websocket接続を開始する関数。リアルタイム通信を行うために、サーバーと双方向通信を確立する。websocketサーバーに接続して、イベントリスナーを登録して、必要に応じて認証情報を送信したり。
  fetchRooms()
})

//特定のチャットルームのチャット履歴を取得する
const fetchChatHistory = async (roomId) => {
  try {
    const token = localStorage.getItem('token')
    console.log('トークルーム保管APIリクエスト時のトークン',token)
    const response = await fetch(`https://my-image-14467698004.asia-northeast1.run.app/chat/history/${roomId}`, {//fetchはAPI通信を行うための関数。
      headers: {
        Authorization: `Bearer ${token}`//Bearerトークンを付けて、認証付きリクエスト
      }
    })
    if (!response.ok) throw new Error('履歴取得に失敗しました')
    const history = await response.json()//レスポンスをjsonとして取得
    chatHistories.value[roomId] = history //リアクティブオブジェクトに、roomidに対応する履歴を保存
    currentUsername.value = getUsernameFromToken(token)
    console.log('メニュークリック時のcurrentUsername:', currentUsername.value)
    console.log(history)
  } catch (error) {
    console.error('履歴取得エラー:', error)
    chatHistories.value[roomId] = [
      { sender: 'Bot', text: '履歴の取得に失敗しました。' }
    ]
  }
}

// WebSocketサーバーに接続し、認証トークンを使ってSTOMPクライアントを初期化・接続するためのもの
// WebSocket
// WebSocketは、ブラウザとサーバーの間でリアルタイム通信を可能にする技術。
// 通常のweb通信は「リクエスト⇒レスポンス」ですが、Websocketは常に接続が開いたままで、サーバーからも自由にメッセージが送れる。
// STOMPクライアント
// STOMPはWebsocketの上で動くメッセージ通信のルール
// クライアント：STOMPを使ってメッセージを送受信するプログラムのこと
const connectWebSocket = () => {
  const socket = new SockJS('https://my-image-14467698004.asia-northeast1.run.app/ws')//SockJSはWebSocketのラッパーライブラリで、古いブラウザでも動作するようにフォールバック機能を提供。指定されたURLにWebSocket接続を開始。
  //SockJSはライブラリのこと。Websocketが使えないブラウザでも似たようなリアルタイム通信を出来るようにする。
  //SockJSはWebSocketの機能を使いやすくしたり、足りない部分を補ったりするライブラリ。
  //WebSocketが使えないブラウザでは、HTTPの長い接続（long polling）などを使って、似たような通信を実現。
  //socketは、サーバーとのリアルタイム通信を管理するためのオブジェクトで、「接続の状態を知る」「メッセージを送る・受け取る」「接続を閉じる」などの機能を持つ。
  const token = localStorage.getItem('token');
  //STOMPクライアントの作成
  stompClient.value = new Client({ //stompClientはSTOMPプロトコルを使うクライアント。STOMPクライアントは、WebSocketを使ってリアルタイム通信を行うときに、メッセージの送受信を整理してくれる便利なツール。ClientはSTOMPクライアントを作るためのクラス。
    webSocketFactory: () => socket, //webSocketFactoryで先ほど作成したSockJSソケットを使うように指定。
    connectHeaders:{
      Authorization: `Bearer ${token}` //connectHeadersにトークンを含めて、サーバーに「このユーザーは認証済みです」と伝えます。
    },
    reconnectDelay: 5000,
    //接続成功時の処理
    onConnect: () => {
      isConnected.value = true
      console.log('接続成功！isConnected:', isConnected.value)
      if (selectedMenu.value) {
        subscribeToRoom(selectedMenu.value.index)
      }
    },
    //切断された時の処理
    onDisconnect: () => {
      isConnected.value = false
    },
    //STOMPプロトコルのエラーが起きたときの処理
    onStompError: (frame) => {
      console.error('❌ STOMP エラー:', frame)
    },
    //Websocket自体のエラーが起きたときの処理
    onWebSocketError: (event) => {
      console.error('❌ WebSocket エラー:', event)
    }

  }
  )
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
    roomId: roomId,
    sender: currentUsername.value
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