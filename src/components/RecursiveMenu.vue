<template>
  <template v-for="item in items" :key="item.index">
    <!-- 親メニュー（子あり） -->
    <el-sub-menu v-if="item.children && item.children.length > 0" :index="item.index">
      <template #title>
        <div
          class="menu-title"
          :class="{ 'is-selected': selectedMenu?.index === item.index }"
          @click.stop.prevent="$emit('select', item)"
        >
          <div class="left-group">
            <span>{{ item.title || item.label }}</span>
            <el-button
              class="ai-button"
              size="small"
              @click.stop="openChatBot(item.index)"
            >
              AI
            </el-button>
            <ChatBotDialog v-model="showChatMap[item.index]" :roomId="item.index" />
          </div>
          <div class="right-group">
            <el-button
              type="text"
              size="small"
              @click.stop="addSubMenu(item)"
            >
              <el-icon><Plus /></el-icon>
            </el-button>
          </div>
        </div>
      </template>
      <RecursiveMenu
        :items="item.children"
        :add-sub-menu="addSubMenu"
        :selectedMenu="selectedMenu"
        @select="$emit('select', $event)"
      />
    </el-sub-menu>

    <!-- 単独メニュー（子なし） -->
    <el-menu-item
      v-else
      :index="item.index"
      @click="$emit('select', item)"
    >
      <div
        class="menu-title"
        :class="{ 'is-selected': selectedMenu?.index === item.index }"
      >
        <div class="left-group">
          <span>{{ item.title || item.label }}</span>
          <el-button class="ai-button" size="small" @click.stop="openChatBot(item.index)">AI</el-button>
          <ChatBotDialog v-model="showChatMap[item.index]" :roomId="item.index" />
        </div>
        <div class="right-group">
          <el-button
            type="text"
            size="small"
            @click.stop="addSubMenu(item)"
          >
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>
      </div>
    </el-menu-item>
  </template>
</template>


<script setup>
import { Plus } from '@element-plus/icons-vue'
import { reactive } from 'vue'
import ChatBotDialog from './ChatBotDialog.vue'

const showChatMap = reactive({})

const openChatBot = (index) => {
  console.log('openChatBot called with index:', index)
  showChatMap[index] = true
}

defineProps({
  items: Array,
  addSubMenu: Function,
  selectedMenu: Object
})

// 子や孫が選択されているかを再帰的にチェック
// const isItemOrDescendantSelected = (item) => {
//   if (props.selectedMenu?.index === item.index) return true
//   if (!item.children) return false
//   return item.children.some(child => isItemOrDescendantSelected(child))
// }

</script>

<style scoped>
.menu-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.ai-button {
  padding: 0 6px;
  min-width: auto;
  width: auto;
  line-height: 1;
  font-size: 12px;
}

.left-group,
.right-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.menu-title.is-selected {
  color: var(--el-color-primary);
  font-weight: 500;
}

/* Element Plus の選択色を打ち消す（必要なら） */
.el-menu-item.is-active {
  color: inherit !important;
  background-color: inherit !important;
}

</style>