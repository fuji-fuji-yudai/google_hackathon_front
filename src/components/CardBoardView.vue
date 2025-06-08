<template>
  <div class="board">
    <div v-for="status in statuses" :key="status" class="list">
      <h3>{{ status }}</h3>
      <draggable
        v-model="taskByStatus[status]"
        group="cards"
        @end="onDragEnd"
        class="card-list"
      >
        <template #item="{ element }">
          <el-card class="card">
            <div>{{ element.title }}</div>
            <small>{{ element.planStart }} ~ {{ element.planEnd }}</small>
          </el-card>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup>
import { computed} from 'vue'
import draggable from 'vuedraggable'

const props = defineProps({
  tasks: Array
})
const emit = defineEmits(['update'])

const statuses = ['ToDo', 'Doing', 'Done']

// ステータスごとに分類
const taskByStatus = computed(() =>
  Object.fromEntries(
    statuses.map(s => [s, props.tasks.filter(t => t.status === s)])
  )
)

function onDragEnd() {
  // 全タスクをまとめ直して親に渡す
  const updated = statuses.flatMap(status =>
    taskByStatus.value[status].map(t => ({ ...t, status }))
  )
  emit('update', updated)
}
</script>

<style scoped>
.board {
  display: flex;
  gap: 16px;
}
.list {
  background: #f4f4f4;
  padding: 10px;
  width: 250px;
  border-radius: 8px;
}
.card-list {
  min-height: 100px;
}
.card {
  margin-bottom: 8px;
}
</style>
