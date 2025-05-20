<template>
  <el-container style="height: 100vh">
    <el-aside :width="asideWidth + 'px'" class="resizable-aside">
      <el-menu>
        <RecursiveMenu :items="menuData" :addSubMenu="addSubMenu" />
      </el-menu>
      <div class="resizer" @mousedown="startResize"></div>
    </el-aside>

    <el-container>
      <el-header>ヘッダー</el-header>
      <el-main>
        <slot />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import RecursiveMenu from '@/components/RecursiveMenu.vue'

const asideWidth = ref(200)

const menuData = ref([
  { index: '1', title: 'Navigator One' }
])

const generateIndex = (parent) => {
  const count = parent.children?.length || 0
  return `${parent.index}-${count + 1}`
}

const addSubMenu = (item) => {
  if (!item.children) item.children = []
  const newIndex = generateIndex(item)
  item.children.push({
    index: newIndex,
    label: `New Option ${newIndex}`
  })
}

let isResizing = false

const startResize = () => {
  isResizing = true
  document.body.style.cursor = 'ew-resize'
}

const stopResize = () => {
  isResizing = false
  document.body.style.cursor = 'default'
}

const handleMouseMove = (e) => {
  if (isResizing) {
    asideWidth.value = Math.max(150, e.clientX)
  }
}

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.resizable-aside {
  position: relative;
  background-color: #f5f5f5;
}

.resizer {
  position: absolute;
  top: 0;
  right: 0;
  width: 5px;
  height: 100%;
  cursor: ew-resize;
  background-color: transparent;
}
</style>
