<template>
  <template v-for="item in items" :key="item.index">
    <!-- 親メニュー（子あり） -->
    <el-sub-menu v-if="item.children" :index="item.index">
      <template #title>
        <div class="menu-title" @click.stop.prevent="$emit('select', item)">
          <span>{{ item.title || item.label }}</span>
          <el-button
            type="text"
            size="small"
          >
            💬
          </el-button>

          <el-button
            type="text"
            size="small"
            @click.stop="addSubMenu(item)"
          >
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>
      </template>
      <RecursiveMenu
        :items="item.children"
        :addSubMenu="addSubMenu"
        @select="$emit('select', $event)"
      />
    </el-sub-menu>

    <!-- 単独メニュー（子なし） -->
    <el-menu-item v-else :index="item.index" @click="$emit('select', item)">
      <div class="menu-title">
        <span>{{ item.title || item.label }}</span>
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

<script setup>
import { Plus } from '@element-plus/icons-vue'

defineProps({
  items: Array,
  addSubMenu: Function
})
</script>

<style scoped>
.menu-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
</style>