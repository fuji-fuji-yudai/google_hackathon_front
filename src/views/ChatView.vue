<!-- <template>
  <el-menu>
    <RecursiveMenu :items="menuData" :addSubMenu="addSubMenu" />メニューデータと、サブメニューを追加する関数を渡す。
  </el-menu>
</template> -->


<!-- <template>
 <el-container style="height: 100vh"> -->
 <!-- サイドバー -->
 <!-- <el-aside width="200px" style="background-color: #f5f5f5">
 <el-menu>
 <RecursiveMenu :items="menuData" :addSubMenu="addSubMenu" />
 </el-menu>
 </el-aside> -->

 <!-- メインコンテンツ -->
 <!-- <el-container>
 <el-header>ヘッダー</el-header>
 <el-main>ここにメインコンテンツが入ります</el-main>
 </el-container>
 </el-container>
</template> -->



<template>
 <SidebarLayout>
  <ChatArea />
 </SidebarLayout>
</template>


<script setup>
import SidebarLayout from '@/components/SidebarLayout.vue'
import ChatArea from '@/components/ChatArea.vue'
</script>



<!-- <script setup>
  import { ref } from 'vue' //ref:Vueのリアクティブな変数を作るための関数
  import RecursiveMenu from '@/components/RecursiveMenu.vue' //コンポーネントのインポート

  const menuData = ref([
  {
    index: '1',
    title: 'Navigator One'
    // children は初期状態ではなし
  }
])


  const generateIndex = (parent) => { //親メニューのインデックスを基に、新しいサブメニューのインデックスを生成
    const count = parent.children?.length || 0
    return `${parent.index}-${count + 1}`
  }

  const addSubMenu = (item) => { //サブメニューを追加する処理
    if (!item.children) item.children = []
    const newIndex = generateIndex(item)
    item.children.push({
    index: newIndex,
    label: `New Option ${newIndex}`
    })
  }
</script> -->
