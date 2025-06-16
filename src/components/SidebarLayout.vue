<template>
  <el-container style="height: 100vh">
    <!-- display:flexで横並び、画面の高さ100% -->  
    <!-- サイドバー -->
    <div
      class="sidebar-wrapper"
      :style="{ width: asideWidth + 'px' }"
    >
      <!--asideWidthで幅を動的に変更可能-->
      <el-menu>
        <!--element plusのコンポーネントで、ナビゲーションメニューを表示-->
        <RecursiveMenu
          :items="menuData"
          :add-sub-menu="addSubMenu"
          @select="handleSelect"
        /><!--メニュー項目のデータ、サブメニューを追加する関数、メニュー項目が選択された際のイベントハンドラ-->
      </el-menu> <!--elmenu配下に、el-menu-itemやel-sub-menuを記載して使う。 -->
    </div>

    <!-- リサイズバー -->
    <div
      class="resizer"
      @mousedown="startResize"
    /> <!--マウスダウン時に、リサイズ処理をする関数を呼び出し-->

    <!-- メイン -->
    <!-- <el-container> -->
    <!-- <el-main> -->
    <slot /> <!--親コンポーネントから渡された内容を表示する。★どう渡す？：本コンポーネントの入れ子の中に書いた内容が、この位置に挿入される。-->
    <!-- </el-main> -->
    <!-- </el-container> -->
  </el-container>
</template>


<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue' 
//ref：リアクティブな変数を作成 onMounted：コンポーネントが画面に表示されたときに実行 onBeforeUnmounted：画面から消える直前に実行
import RecursiveMenu from '@/components/RecursiveMenu.vue'

const emit = defineEmits(['menu-click']) //親コンポーネントにイベントを送るための関数を定義

const menuData = ref([
  { index: '1', title: 'メニュー1' },
  { 
    index: '2',
    title: '〇全プロジェクト', 
    children: [
        { 
            index: '2-1', 
            title: 'アプリ共通チーム' ,
            children: [
                { index: '2-1-1', title: 'アプリ共通' },
                { index: '2-1-2', title: 'アーキチーム' }
            ]
        },
        {index: '2-2', title: '輸出入チーム'}
    ]
  }
])//メニューの初期データ。childrenによってサブメニューを表現。★この構造ってどこで決まった？：どこかで明示的に定義する必要はない。関数でこの構造を前提に使われているだけ。

const asideWidth = ref(300) //サイドバーの幅（初期値）
let isResizing = false //現在リサイズ中かのフラグ

const startResize = () => { //リサイズ開始★
  isResizing = true //リサイズ中ですよというフラグを立てる。
  document.body.style.cursor = 'ew-resize' //マウスカーソルの見た目を⇔に変えてる。
}

const stopResize = () => { //リサイズ終了★
  isResizing = false //リサイズ終わりましたよというフラグを立てる。
  document.body.style.cursor = 'default' //マウスカーソルを元に戻す。
}

const handleMouseMove = (e) => { //マウス移動に応じてサイドバーの幅を変更★
  if (isResizing) {
    asideWidth.value = Math.max(150, e.clientX)
  }
}

const generateIndex = (parent) => { //親メニューのインデックスを基に、新しいサブメニューのインデックスを生成
  const count = parent.children?.length || 0
  return `${parent.index}-${count + 1}`
}

const addSubMenu = (item) => { //指定されたメニュー項目にサブメニューを追加
  if (!item.children) item.children = []
  const newIndex = generateIndex(item)
  item.children.push({
    index: newIndex,
    title: `新しい項目 ${newIndex}`
  })
}

const handleSelect = (item) => { //メニュー項目が選択された時、親コンポーネントへイベント送信
  emit('menu-click', item)
}

onMounted(() => { //コンポーネントがマウントされた時に、マウスイベントを登録
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
})

onBeforeUnmount(() => { //アンマウント時にイベントを解除
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.resizable-aside {
  position: relative;
  background-color: #f5f5f5;
}

.sidebar-wrapper {
  height: 100%;
  background-color: #f5f5f5;
}

.resizer {
  width: 5px;
  cursor: ew-resize;
  background-color: transparent;
}


</style>