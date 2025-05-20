<script setup>
  import { Plus } from '@element-plus/icons-vue'

  // こう書くことで props を直接使わずに済みます
  defineProps({
  items: Array,
  addSubMenu: Function
  })
</script>

<template>
  <!-- item配列をループして各メニュー項目を描画。item.indexをkeyに指定して、Vueの仮想DOMの最適化を助ける。 -->
  <template v-for="item in items" :key="item.index">
    <!-- 子がある場合は el-sub-menu -->
    <el-sub-menu v-if="item.children && item.children.length" :index="item.index">
      <!-- #titleでタイトル部にプラスボタンを表示 -->
      <template #title>
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <span>{{ item.title || item.label }}</span>
          <el-button
            type="text"
            size="small"
            @click.stop="addSubMenu(item)"
          >
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>
      </template>
      <!-- 再帰的に子を描画 -->
      <RecursiveMenu :items="item.children" :addSubMenu="addSubMenu" />
    </el-sub-menu>

    <!-- 子がない場合は el-menu-item -->
    <el-menu-item v-else :index="item.index">
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <span>{{ item.label || item.title }}</span>
        <el-button
          type="text"
          size="small"
          @click.stop="addSubMenu(item)"
        >
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
    </el-menu-item>
  </template>
</template>