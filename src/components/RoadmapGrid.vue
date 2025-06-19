<template>
  <div class="roadmap-grid">
    <div class="grid-header">
      <div class="empty-cell"></div>
      <div v-for="quarter in allQuarters" :key="quarter.id"
           :class="['quarter-header', `quarter-${quarter.name.toLowerCase()}`]"
           :style="{ gridColumn: `${quarter.startMonthIndex + 2} / span ${quarter.endMonthIndex - quarter.startMonthIndex + 1}` }">
        {{ quarter.name }}
      </div>
      <div class="month-row">
        <div class="empty-month-cell"></div>
        <div v-for="month in allMonths" :key="month.id" class="month-header">
          {{ month.name }}
        </div>
      </div>
    </div>

    <div v-for="categoryRow in roadmapData" :key="categoryRow.category" class="category-row">
      <div class="category-label" :style="{ backgroundColor: getCategoryColor(categoryRow.category) }">
        {{ categoryRow.category }}
      </div>
      <div class="task-cells">
        <div
          v-for="monthIndex in allMonths.length"
          :key="monthIndex"
          :class="['month-cell', { 'quarter-start': isQuarterStart(monthIndex - 1) }]"
        ></div>
        <div
          v-for="task in categoryRow.tasks"
          :key="task.id"
          class="task-item"
          :style="getTaskStyle(task, categoryRow.category)"
          @click="handleTaskClick(task, categoryRow.category)"
        >
          {{ task.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  roadmapData: {
    type: Array,
    required: true,
  },
  allMonths: {
    type: Array,
    required: true,
  },
  allQuarters: {
    type: Array,
    required: true,
  },
  initialCategoryColors: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['start-task-edit', 'delete-task']);

const getCategoryColor = (category) => {
  // hasOwnProperty の呼び出し方を修正
  if (props.initialCategoryColors && Object.prototype.hasOwnProperty.call(props.initialCategoryColors, category)) {
    return props.initialCategoryColors[category];
  }
  return '#ccc';
};

const getTaskStyle = (task, category) => {
  // gridColumn の計算を修正 (カテゴリ列が2列目を占めるため、月の開始は3列目からになる)
  // 修正前のコードでは、カテゴリ列が1列目を占め、月の開始が2列目からでした。
  // grid-template-columns: 220px repeat(12, minmax(90px, 1fr)); で2列目以降が月なので、+2 でOK
  const startColumn = task.startIndex + 2; 
  const endColumn = task.endIndex + 3; // endIndex も同様に +2 して、さらに+1で終了列を調整
  const taskColor = getCategoryColor(category);

  return {
    gridColumn: `${startColumn} / ${endColumn}`,
    backgroundColor: taskColor,
    borderColor: darkenColor(taskColor, 10),
  };
};

const darkenColor = (hslColor, amount) => {
  const parts = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (parts) {
    // parts[1], parts[2], parts[3] に修正
    const h = parseInt(parts[1]);
    const s = parseInt(parts[2]);
    const l = Math.max(0, parseInt(parts[3]) - amount);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  return hslColor;
};

const isQuarterStart = (monthIndex) => {
  return props.allQuarters.some(q => q.startMonthIndex === monthIndex);
};

const handleTaskClick = (task, category) => {
  emit('start-task-edit', { ...task, originalCategory: category }); // originalCategory を渡すように修正
};
</script>

<style scoped>
.roadmap-grid {
  display: grid;
  grid-template-columns: 220px repeat(12, minmax(90px, 1fr)); /* さらに幅を調整 */
  gap: 1px;
  border: 1px solid #e0e0e0;
  background-color: #e0e0e0;
  font-family: 'Arial', sans-serif;
  color: #333;
  margin-top: 20px;
  width: 100%;
}

.grid-header {
  display: contents;
}

.empty-cell {
  grid-column: 1;
  grid-row: 1 / span 2;
  background-color: #f0f0f0;
  border-bottom: 1px solid #e0e0e0;
  min-height: 60px; /* 少し高く */
}

.quarter-header {
  grid-row: 1;
  background-color: #e9ecef;
  text-align: center;
  padding: 12px 0; /* 少し大きく */
  font-weight: bold;
  font-size: 1em; /* 少し大きく */
  border-bottom: 1px solid #e0e0e0;
}

.month-row {
  display: contents;
}

.empty-month-cell {
  grid-column: 1;
  grid-row: 2;
  background-color: #f0f0f0;
}

.month-header {
  grid-row: 2;
  background-color: #f8f9fa; /* 明るい背景色 */
  text-align: center;
  padding: 12px 0; /* 少し大きく */
  font-size: 0.95em; /* 少し大きく */
  border-right: 1px solid #e0e0e0;
}
.month-header:last-child {
    border-right: none;
}

.category-row {
  display: contents;
}

.category-label {
  grid-column: 1;
  padding: 20px; /* さらに大きく */
  font-weight: bold;
  font-size: 1.1em; /* さらに大きく */
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 90px; /* さらに高く */
  box-sizing: border-box;
  border-right: 1px solid #e0e0e0;
}

.task-cells {
  grid-column: 2 / span 12;
  display: grid;
  grid-template-columns: repeat(12, minmax(90px, 1fr)); /* 月の幅に合わせる */
  gap: 1px;
  background-color: #e0e0e0;
  position: relative;
  min-height: 90px; /* さらに高く */
}

.month-cell {
  background-color: #fff;
  border-right: 1px solid #f0f0f0;
  box-sizing: border-box;
}

.month-cell.quarter-start {
  border-left: 2px solid #a0a0a0;
}

.task-item {
  position: absolute;
  height: calc(100% - 28px); /* 上下の余白をさらに増やす (例: 14pxずつ) */
  margin-top: 14px; /* 上下のマージンを増やす */
  margin-bottom: 14px; /* 上下のマージンを増やす */
  border: 1px solid;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05em; /* さらに大きく */
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  padding: 0 12px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 10;
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
}
</style>