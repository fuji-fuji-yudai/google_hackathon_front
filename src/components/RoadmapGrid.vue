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

    <div v-for="categoryRow in positionedRoadmapData" :key="categoryRow.category" class="category-row">
      <div class="category-label" :style="{ backgroundColor: getCategoryColor(categoryRow.category) }">
        <template v-if="editingCategory !== categoryRow.category">
          <span @click="startCategoryEdit(categoryRow.category)">
            {{ categoryRow.category }}
          </span>
        </template>
        <template v-else>
          <select
            v-model="editedCategoryName"
            @change="saveCategoryEdit(categoryRow.category, $event.target.value)"
            @blur="cancelCategoryEdit"
            ref="categoryEditSelect"
          >
            <option v-for="cat in allExistingCategories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </template>
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
          :style="getTaskStyle(task, categoryRow.category, task.verticalOffset)"
          @click="handleTaskClick(task, categoryRow.category)"
        >
          {{ task.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref, nextTick } from 'vue';

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

// 親に発火するイベントに 'update-category-name' を追加
const emit = defineEmits(['start-task-edit', 'delete-task', 'update-category-name']);

// カテゴリ名編集用の状態
const editingCategory = ref(null); // 編集中のカテゴリ名（元々の名前）
const editedCategoryName = ref(''); // 選択された新しいカテゴリ名
const categoryEditSelect = ref(null); // select要素への参照

// 全ての既存カテゴリ名を重複なく取得
const allExistingCategories = computed(() => {
  const categories = new Set();
  props.roadmapData.forEach(row => {
    categories.add(row.category);
  });
  return Array.from(categories).sort();
});

// カテゴリ編集モード開始
const startCategoryEdit = (category) => {
  editingCategory.value = category; // 編集中のカテゴリ（元の名前）を設定
  editedCategoryName.value = category; // ドロップダウンの初期値を現在のカテゴリ名に設定

  nextTick(() => {
    if (categoryEditSelect.value) {
      categoryEditSelect.value.focus(); // select要素にフォーカス
    }
  });
};

// カテゴリ編集保存
const saveCategoryEdit = (oldCategoryName, newCategoryName) => {
  if (oldCategoryName !== newCategoryName) {
    emit('update-category-name', { oldCategory: oldCategoryName, newCategory: newCategoryName });
  }
  editingCategory.value = null; // 編集モード終了
};

// カテゴリ編集キャンセル
const cancelCategoryEdit = () => {
  editingCategory.value = null; // 編集モード終了
};

// タスクIDごとの色をキャッシュするためのMap
const taskColorsCache = new Map();

const getCategoryColor = (category) => {
  if (props.initialCategoryColors && Object.prototype.hasOwnProperty.call(props.initialCategoryColors, category)) {
    return props.initialCategoryColors[category];
  }
  return '#ccc';
};

const darkenColor = (hslColor, amount) => {
  const parts = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (parts) {
    const h = parseInt(parts[1] || '0');
    const s = parseInt(parts[2] || '0');
    const l = Math.max(0, parseInt(parts[3] || '0') - amount);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  return hslColor;
};

const getTaskRandomColor = (taskId) => {
  if (taskColorsCache.has(taskId)) {
    return taskColorsCache.get(taskId);
  }

  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(Math.random() * 20) + 70;
  const l = Math.floor(Math.random() * 15) + 70;

  const newColor = `hsl(${h}, ${s}%, ${l}%)`;
  taskColorsCache.set(taskId, newColor);
  return newColor;
};

const TASK_HEIGHT = 28;
const TASK_VERTICAL_GAP = 6;
const TASK_VERTICAL_MARGIN_TOP = 14;

const positionedRoadmapData = computed(() => {
  return props.roadmapData.map(categoryRow => {
    const tasksWithPositions = [];
    const occupiedSlots = {};

    const sortedTasks = [...categoryRow.tasks].sort((a, b) => {
      if (a.startIndex !== b.startIndex) return a.startIndex - b.startIndex;
      if (a.endIndex !== b.endIndex) return a.endIndex - b.endIndex;
      return a.id.localeCompare(b.id);
    });

    sortedTasks.forEach(task => {
      const startMonth = task.startIndex;
      const endMonth = task.endIndex;

      let verticalSlot = -1;
      let foundSlot = false;

      for (let slot = 0; slot < 3; slot++) {
        let isSlotOccupied = false;
        for (let month = startMonth; month <= endMonth; month++) {
          const key = `${month}-${slot}`;
          if (occupiedSlots[key]) {
            isSlotOccupied = true;
            break;
          }
        }
        if (!isSlotOccupied) {
          verticalSlot = slot;
          foundSlot = true;
          break;
        }
      }

      if (foundSlot) {
        for (let month = startMonth; month <= endMonth; month++) {
          occupiedSlots[`${month}-${verticalSlot}`] = true;
        }
        
        tasksWithPositions.push({
          ...task,
          verticalOffset: TASK_VERTICAL_MARGIN_TOP + (verticalSlot * (TASK_HEIGHT + TASK_VERTICAL_GAP))
        });
      } else {
        console.warn(`Warning: Max 3 tasks in the same slot exceeded for category "${categoryRow.category}" period "${startMonth}-${endMonth}". Task: ${task.name}. Displaying at default offset.`);
        tasksWithPositions.push({
          ...task,
          verticalOffset: TASK_VERTICAL_MARGIN_TOP
        });
      }
    });

    return {
      ...categoryRow,
      tasks: tasksWithPositions
    };
  });
});

const getTaskStyle = (task, category, verticalOffset) => {
  const startColumn = task.startIndex + 1; 
  const endColumn = task.endIndex + 2; 

  const taskBgColor = getTaskRandomColor(task.id); 
  const taskBorderColor = darkenColor(taskBgColor, 10);

  return {
    gridColumn: `${startColumn} / ${endColumn}`,
    backgroundColor: taskBgColor,
    borderColor: taskBorderColor,
    top: `${verticalOffset}px`, 
  };
};

const isQuarterStart = (monthIndex) => {
  return props.allQuarters.some(q => q.startMonthIndex === monthIndex);
};

const handleTaskClick = (task, category) => {
  emit('start-task-edit', { ...task, originalCategory: category });
};
</script>

<style scoped>
/* ... （スタイルは変更なし） ... */

.roadmap-grid {
  display: grid;
  grid-template-columns: 220px repeat(12, minmax(90px, 1fr));
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
  min-height: 60px;
}

.quarter-header {
  grid-row: 1;
  background-color: #e9ecef;
  text-align: center;
  padding: 12px 0;
  font-weight: bold;
  font-size: 1em;
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
  background-color: #f8f9fa;
  text-align: center;
  padding: 12px 0;
  font-size: 0.95em;
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
  padding: 20px;
  font-weight: bold;
  font-size: 1.1em;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 130px;
  box-sizing: border-box;
  border-right: 1px solid #e0e0e0;
  cursor: pointer; /* クリック可能であることを示す */
}
/* 編集モードのselect要素のスタイル */
.category-label select {
  width: 90%; /* 親要素の幅に合わせて調整 */
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 0.9em;
}

.task-cells {
  grid-column: 2 / span 12;
  display: grid;
  grid-template-columns: repeat(12, minmax(90px, 1fr));
  gap: 1px;
  background-color: #e0e0e0;
  position: relative;
  min-height: 130px;
  overflow: hidden;
  box-sizing: border-box;
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
  height: 28px;
  border: 1px solid;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05em;
  color: #333;
  text-shadow: none;
  
  width: 100%;           
  margin-left: -1px;     
  margin-right: -1px;    
  padding: 0;
  box-sizing: border-box; 

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