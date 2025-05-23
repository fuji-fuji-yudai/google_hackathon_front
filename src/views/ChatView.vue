<!-- チャットエリアにメッセージ配列とユーザーを渡す -->
<template>
  <div class="app-layout"> <!-- 画面全体のレイアウトを囲む -->
    <SidebarLayout @menu-click="handleMenuClick" /> <!-- サイドバーのコンポーネント。メニューをクリックしたら@menu-clickイベントが発火し、handlemenuClickが呼ばれる。 @menu-click自体はカスタム。 -->
    <div v-if="selectedMenu" class="chat-area"> <!-- selectedMenuつまりメニューが選択されたらチャット画面が表示される。 -->
      <ChatArea
        :messages="chatHistories[selectedMenu.index] || []" 
        currentuser="You"
        @send="handleSendMessage"
      /> <!-- チャット画面を表示するコンポーネント。選択されたメニューに対応するチャット履歴を表示する。無ければ空の配列。
      現在のユーザーも渡す。メッセージが送信されたらhandleSendMessageメソッドが呼ばれる。 -->
    </div>
  </div>
</template>

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



<script setup> //compositionAPIを使ったロジック
import { ref } from 'vue' //refはVueのリアクティブな状態を作るための関数→この変数は画面に関係しているから、変わったら自動で再描画してねというやつ
import SidebarLayout from '@/components/SidebarLayout.vue'
import ChatArea from '@/components/ChatArea.vue' //コンポーネントをインポート

const selectedMenu = ref(null) //現在選択されているメニュー項目（オブジェクトを保持）★なぜref null?：初期値nullつまり未選択なことを示す
const chatHistories = ref({}) //各メニューごとのチャット履歴を保持するオブジェクト。キーはmenuItem.index ★上記と同様：初期値は空のオブジェクト、これからデータを追加していく。

const handleMenuClick = (menuItem) => { //menuitemは、SidebarLayoutから渡される選択されたメニューの情報★どこでどうやって渡してる？：$emit('menu-click', menuItem)というのを子コンポーネントで定義しており、menu-clickメソッドが発火したときにmenuItemが渡される。
  selectedMenu.value = menuItem //selectedmenuにそのメニューをセット。
  if (!chatHistories.value[menuItem.index]) { //チャット履歴がなければ初期メッセージを追加
    chatHistories.value[menuItem.index] = [
      { sender: 'Bot', text: `「${menuItem.title}」のチャットを開始します。` } //トークルームごとに送信者とテキストの配列が格納されてる
    ]
  }
}

const handleSendMessage = (message) => { //ユーザーの入力メッセージ
  if (selectedMenu.value) { 
    chatHistories.value[selectedMenu.value.index].push({ //チャット履歴にメッセージを追加
      sender: 'You',//ログインユーザー名を渡す
      text: message//メッセージ内容
    })
  }
}
</script>

<style scoped> /* 対象はこのコンポーネントのみ */
::v-deep(.el-container) { /* v-deepによって子コンポーネント内部にスタイルを適用可能 */
 flex: initial !important; /* flexプロパティを初期値に戻している。 */
}
</style>