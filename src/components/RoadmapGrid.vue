<template>
  <div class="roadmap-grid-wrapper">
    <div 
      class="roadmap-grid" 
      :style="{
        '--roadmap-data-length': positionedRoadmapData.length,
        '--all-months-length': allMonths.length
      }"
    >
      <div class="grid-header-section">
        <div class="empty-cell">年</div> 
        
        <div class="quarter-headers-container">
          <div v-for="quarter in allQuarters" :key="quarter.id"
               :class="['quarter-header', `quarter-${quarter.name.toLowerCase()}`]"
               :style="{ 
                   gridColumn: `${quarter.startMonthIndex + 2} / span ${quarter.endMonthIndex - quarter.startMonthIndex + 1}`,
                   gridRow: 1 
                }">
            {{ quarter.name }}
          </div>
        </div>
      </div>
      
      <div class="month-headers-container">
        <div v-for="(month, index) in allMonths" :key="month.id" class="month-header"
             :style="{ 
                 gridColumn: `${index + 2}`, // 0-indexedからグリッド列番号に合わせる
                 gridRow: 2 
             }"> 
          {{ month.name }} ({{ month.year }}) 
        </div>
      </div>

      <div v-for="(categoryRow, rowIndex) in positionedRoadmapData" :key="categoryRow.category" class="category-row">
        <div class="category-label" 
             :style="{ backgroundColor: getCategoryColor(categoryRow.category), gridRow: rowIndex + 3 }"> 
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
        
        <div class="task-cells" :style="{ gridColumn: `2 / span ${allMonths.length}` }">
          <div
            v-for="monthIndex in allMonths.length"
            :key="monthIndex"
            :class="['month-cell', { 'quarter-start': isQuarterStart(monthIndex - 1) }]"
            :style="{ gridColumn: monthIndex, gridRow: 1 }" 
          ></div>
          
          <div
            v-for="task in categoryRow.tasks"
            :key="task.id"
            class="task-item"
            :style="getTaskStyle(task, task.verticalOffset)"
            @click="handleTaskClick(task, categoryRow.category)"
          >
            {{ task.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref, nextTick, onMounted} from 'vue';

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

const emit = defineEmits(['start-task-edit', 'delete-task', 'update-category-name']);

const editingCategory = ref(null);
const editedCategoryName = ref('');
const categoryEditSelect = ref(null);

const allExistingCategories = computed(() => {
  const categories = new Set();
  props.roadmapData.forEach(row => {
    categories.add(row.category);
  });
  return Array.from(categories).sort();
});

const startCategoryEdit = (category) => {
  editingCategory.value = category;
  editedCategoryName.value = category;

  nextTick(() => {
    if (categoryEditSelect.value) {
      categoryEditSelect.value.focus();
    }
  });
};

const saveCategoryEdit = (oldCategoryName, newCategoryName) => {
  if (oldCategoryName !== newCategoryName) {
    emit('update-category-name', { oldCategory: oldCategoryName, newCategory: newCategoryName });
  }
  editingCategory.value = null;
};

const cancelCategoryEdit = () => {
  editingCategory.value = null;
};

const taskColorsCache = new Map();

const getCategoryColor = (category) => {
  if (props.initialCategoryColors && Object.prototype.hasOwnProperty.call(props.initialCategoryColors, category)) {
    return props.initialCategoryColors[category];
  }
  return '#ccc'; // デフォルト色
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
  const s = Math.floor(Math.random() * 20) + 70; // 彩度を上げて鮮やかに
  const l = Math.floor(Math.random() * 15) + 70; // 明るさを上げて明るく

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
      if (a.endIndex !== b.endIndex) return b.endIndex - a.endIndex; 
      return a.id - b.id; 
    });

    sortedTasks.forEach(task => {
      const startMonthIndex = task.startIndex;
      const endMonthIndex = task.endIndex;

      let verticalSlot = -1;
      let foundSlot = false;

      for (let slot = 0; slot < 3; slot++) { 
        let isSlotOccupied = false;
        for (let month = startMonthIndex; month <= endMonthIndex; month++) {
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
        for (let month = startMonthIndex; month <= endMonthIndex; month++) {
          occupiedSlots[`${month}-${verticalSlot}`] = true;
        }
        
        tasksWithPositions.push({
          ...task,
          verticalOffset: TASK_VERTICAL_MARGIN_TOP + (verticalSlot * (TASK_HEIGHT + TASK_VERTICAL_GAP))
        });
      } else {
        console.warn(`Warning: Max 3 tasks in the same slot exceeded for category "${categoryRow.category}" period "${startMonthIndex}-${endMonthIndex}". Task: ${task.name}. Displaying at default offset.`);
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

const getTaskStyle = (task, verticalOffset) => {
  const startColumn = task.startIndex + 2; 
  const spanLength = task.endIndex - task.startIndex + 1;

  const taskBgColor = getTaskRandomColor(task.id); 
  const taskBorderColor = darkenColor(taskBgColor, 10);

  return {
    gridColumn: `${startColumn} / span ${spanLength}`, 
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

// 念のため、allMonthsのログは残す
onMounted(() => {
  console.log('All Quarters Data:', props.allQuarters);
  console.log('All Months Data:', props.allMonths);
});

</script>

<style scoped>
.roadmap-grid-wrapper {
  overflow-x: auto; 
  overflow-y: hidden; 
  max-width: 100%; 
  box-shadow: none;
  border: none;
  background-color: transparent;
}

.roadmap-grid {
  --quarter-header-height: 64.5px; 
  --month-header-height: 64.5px; 
  --header-row1-height: var(--quarter-header-height); 
  --header-row2-height: var(--month-header-height);   

  display: grid;
  /*CSS変数の参照を、HTMLのstyle属性で直接設定する名前に合わせる */
  grid-template-rows: var(--header-row1-height) var(--header-row2-height) repeat(var(--roadmap-data-length), minmax(130px, auto)); 
  
  /* CSS変数の参照を、HTMLのstyle属性で直接設定する名前に合わせる */
  grid-template-columns: 220px repeat(var(--all-months-length), minmax(90px, 1fr));
  
  border: none; 
  background-color: transparent; 
  
  gap: 1px; 
  font-family: 'Arial', sans-serif;
  color: #333;
  margin-top: 20px;
  /*CSS変数の参照を、HTMLのstyle属性で直接設定する名前に合わせる */
  min-width: calc(220px + var(--all-months-length) * 90px); 
}


.grid-header-section {
  display: contents; 
}

.empty-cell {
  grid-column: 1; 
  grid-row: 1 / span 2; 
  min-height: calc(var(--header-row1-height) + var(--header-row2-height)); 
  background-color: #f0f0f0;
  border-bottom: 1px solid #e0e0e0;
  position: sticky; 
  left: 0;
  top: 0;
  z-index: 30; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-weight: bold; 
  font-size: 1.1em; 
  padding: 0; 
  margin: 0;
  box-sizing: border-box;
}

.quarter-headers-container {
  display: contents; 
}

.quarter-header {
  grid-row: 1; 
  background-color: #e9ecef;
  text-align: center;
  padding: 12px 0; 
  font-weight: bold;
  font-size: 1em;
  border-bottom: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0; 
  position: sticky; 
  top: 0;
  z-index: 20; 
  box-sizing: border-box; 
}
.quarter-header:last-child {
  border-right: none; 
}

.month-headers-container {
  display: contents; 
}

.month-header {
  grid-row: 2; 
  background-color: #f8f9fa;
  text-align: center;
  padding: 12px 0; 
  font-size: 0.95em;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0; 
  position: sticky; 
  top: var(--header-row1-height); 
  z-index: 20; 
  box-sizing: border-box; 
}
.month-header:last-child {
  border-right: none;
}

.category-row {
  display: contents; 
}

.category-label {
  grid-column: 1; 
  padding: 10px 20px; 
  font-weight: bold;
  font-size: 1.1em;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: auto; 
  height: auto; 
  box-sizing: border-box;
  border-right: 1px solid #e0e0e0; 
  border-bottom: 1px solid #e0e0e0; 
  cursor: pointer;
  position: sticky; 
  left: 0;
  top: calc(var(--header-row1-height) + var(--header-row2-height)); 
  z-index: 25; 
  background-color: inherit; 
}
.category-label select {
  width: 90%;
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 0.9em;
  background-color: white; 
}

.task-cells {
  grid-column: 2 / span var(--all-months-length); 
  display: grid; 
  grid-template-columns: repeat(var(--all-months-length), minmax(90px, 1fr)); 
  
  gap: 1px; 
  background-color: transparent;
  position: relative; 
  min-height: 130px;
  box-sizing: border-box;
}

.month-cell {
  background-color: #fff;
  border-right: 1px solid #f0f0f0; 
  border-bottom: 1px solid #f0f0f0; 
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
  
  padding: 0;
  box-sizing: border-box;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  box-shadow: none; 
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 10;
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25); 
}
</style>