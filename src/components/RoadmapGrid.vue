<template>
  <div class="roadmap-grid-container">
    <div class="roadmap-quarter-header-row">
      <div class="roadmap-quarter-corner-cell"></div>
      <div
        v-for="quarter in quarters"
        :key="quarter.id"
        :class="['roadmap-quarter-header-cell', `quarter-${quarter.id}`]"
        :style="getQuarterHeaderStyle(quarter)"
      >
        {{ quarter.name }}
      </div>
    </div>

    <div class="roadmap-header-row">
      <div class="roadmap-corner-cell">カテゴリ/月</div>
      <div
        v-for="month in months"
        :key="month.id"
        :class="['roadmap-header-month', `quarter-${month.quarterId}`]"
      >
        {{ month.name }}
      </div>
    </div>

    <div
      v-for="(row, rowIndex) in roadmapData"
      :key="rowIndex"
      class="roadmap-data-row"
      :style="getRoadmapRowStyle(row)"
    >
      <div
        class="roadmap-category-label"
        :style="{ backgroundColor: getCategoryLabelColor(row.category) }"
        @dblclick="$emit('start-category-edit', rowIndex)"
      >
        <template v-if="editingCategoryIndex === rowIndex">
          <input
            :value="editedCategoryName"
            @input="$emit('update:editedCategoryName', $event.target.value)"
            @blur="$emit('finish-category-edit', rowIndex)"
            @keyup.enter="$emit('finish-category-edit', rowIndex)"
            class="category-edit-input"
          />
        </template>
        <template v-else>
          {{ row.category }}
        </template>
      </div>

      <div
        v-for="month in months"
        :key="month.id"
        :class="['roadmap-month-background-cell', `quarter-${month.quarterId}`]"
      ></div>

      <div
        v-for="(task, taskIndex) in row.tasks"
        :key="task.id"
        :class="['task-block']"
        :style="getTaskBlockStyle(task, taskIndex)"
        @dblclick="$emit('start-task-edit', task)"
      >
        {{ task.name }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoadmapGrid',
  props: {
    roadmapData: {
      type: Array,
      required: true,
    },
    months: {
      type: Array,
      required: true,
    },
    quarters: {
      type: Array,
      required: true,
    },
    editingCategoryIndex: {
      type: Number,
      default: null,
    },
    editedCategoryName: {
      type: String,
      default: '',
    },
    assignedCategoryLabelColors: {
      type: Object,
      required: true,
    },
    taskColorPalette: {
      type: Array,
      required: true,
    },
  },
  emits: [
    'start-category-edit',
    'update:editedCategoryName',
    'finish-category-edit',
    'start-task-edit',
    'assign-category-color', // 新しいカテゴリに色を割り当てるイベント
  ],
  methods: {
    getQuarterHeaderStyle(quarter) {
      const numberOfMonthsInQuarter = quarter.endMonthIndex - quarter.startMonthIndex + 1;
      const startColumn = quarter.startMonthIndex + 2;
      const endColumn = startColumn + numberOfMonthsInQuarter;

      return {
        gridColumn: `${startColumn} / ${endColumn}`,
      };
    },
    getRoadmapRowStyle(row) {
      const taskHeightWithMargin = 40;
      const calculatedHeight = row.tasks.length > 0
        ? (row.tasks.length * taskHeightWithMargin) + 5
        : 80;

      return {
        height: `${calculatedHeight}px`,
      };
    },
    getTaskBlockStyle(task, taskIndex) {
      const gridColumnStart = task.startIndex + 2;
      const gridColumnEnd = task.endIndex + 2 + 1;

      const bgColor = task.color;
      const textColor = this.getContrastColor(bgColor);

      const topOffset = taskIndex * 40 + 5;

      return {
        backgroundColor: bgColor,
        color: textColor,
        gridColumn: `${gridColumnStart} / ${gridColumnEnd}`,
        gridRow: '1',
        position: 'absolute',
        top: `${topOffset}px`,
        left: '5px',
        right: '5px',
        height: '35px',
        fontSize: '0.85em',
        textAlign: 'left',
        padding: '0 10px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        borderRadius: '5px',
        zIndex: 1,
      };
    },
    getCategoryLabelColor(categoryName) {
      // 親コンポーネントで色を管理するため、既に割り当てられている色を返すか、親に割り当てを依頼する
      if (this.assignedCategoryLabelColors[categoryName]) {
        return this.assignedCategoryLabelColors[categoryName];
      } else {
        // 新しいカテゴリの場合、親に色の割り当てを依頼
        this.$emit('assign-category-color', categoryName);
        // ここでは仮の色を返すか、割り当てられるまで待つ
        return '#888888'; // デフォルト色
      }
    },
    getContrastColor(bgColor) {
      const hsl = bgColor.match(/\d+/g);
      const h = hsl[0];
      const s = hsl[1] / 100;
      const l = hsl[2] / 100;
      let r, g, b;

      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = l - c / 2;

      if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
      } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
      } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
      } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
      } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
      } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
      }
      r = Math.round((r + m) * 255);
      g = Math.round((g + m) * 255);
      b = Math.round((b + m) * 255);

      const luminance = (0.2126 * (r / 255)) + (0.7152 * (g / 255)) + (0.0722 * (b / 255));

      return luminance > 0.179 ? '#333333' : '#ffffff';
    },
  },
};
</script>

<style scoped>
/* ロードマップグリッドコンテナ */
.roadmap-grid-container {
  display: grid;
  grid-template-columns: 200px repeat(12, minmax(70px, 1fr));
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  background-color: white;
  min-height: 600px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
  position: relative;
}

/* 四半期ヘッダー行 */
.roadmap-quarter-header-row {
  display: contents;
}

.roadmap-quarter-corner-cell {
  background-color: #f7f7f7;
  grid-column: 1;
  grid-row: 1;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 3;
}

.roadmap-quarter-header-cell {
  background-color: #e6e6e6;
  font-weight: 700;
  color: #333;
  padding: 10px 0;
  font-size: 1.1em;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  grid-row: 1;
  position: sticky;
  top: 0;
  z-index: 1;
}
.roadmap-quarter-header-cell:last-child {
  border-right: none;
}

/* 月とカテゴリのヘッダー行 */
.roadmap-header-row {
  display: contents;
}

.roadmap-corner-cell {
  background-color: #f7f7f7;
  font-weight: 600;
  color: #555;
  padding: 15px 20px;
  font-size: 1em;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  grid-column: 1;
  grid-row: 2;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 2;
}

.roadmap-header-month {
  background-color: #f7f7f7;
  font-weight: 600;
  color: #555;
  padding: 15px 0;
  font-size: 0.95em;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  grid-row: 2;
  position: sticky;
  top: 0;
  z-index: 1;
}

.roadmap-header-month:last-child {
  border-right: none;
}

/* 四半期ごとの背景色をヘッダーに適用（会計年度の四半期） */
.roadmap-header-month.quarter-q1_fy { background-color: #f2f7ff; }
.roadmap-header-month.quarter-q2_fy { background-color: #e0f2ff; }
.roadmap-header-month.quarter-q3_fy { background-color: #f2f7ff; }
.roadmap-header-month.quarter-q4_fy { background-color: #e0f2ff; }


/* データ行 - ここが大きく変わります */
.roadmap-data-row {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
  position: relative;
  border-bottom: 1px solid #e0e0e0;
}
.roadmap-data-row:last-child {
  border-bottom: none;
}

.roadmap-category-label {
  grid-column: 1;
  grid-row: 1 / -1;
  padding: 15px 20px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border-right: 1px solid #e0e0e0;
  box-sizing: border-box;
  cursor: pointer;
  z-index: 2;
}

.roadmap-category-label:hover {
  filter: brightness(1.1);
}

.category-edit-input {
  width: 100%;
  height: 100%;
  padding: 0 5px;
  border: none;
  background-color: rgba(255, 255, 255, 0.8);
  color: #333;
  font-size: 1em;
  font-weight: 600;
  box-sizing: border-box;
  border-radius: 5px;
}

.category-edit-input:focus {
  outline: 2px solid #007bff;
}


/* 月の背景セル - タスクではなく、背景と境界線を提供します */
.roadmap-month-background-cell {
  border-right: 1px solid #e0e0e0;
  box-sizing: border-box;
}

.roadmap-month-background-cell:last-child {
  border-right: none;
}

/* 四半期ごとの背景色をデータセルにも適用（会計年度の四半期） */
.roadmap-month-background-cell.quarter-q1_fy { background-color: #f7faff; }
.roadmap-month-background-cell.quarter-q2_fy { background-color: #edf5ff; }
.roadmap-month-background-cell.quarter-q3_fy { background-color: #f7faff; }
.roadmap-month-background-cell.quarter-q4_fy { background-color: #edf5ff; }


/* タスクブロックの変更 - roadmap-data-row の子として配置 */
.task-block {
  position: absolute;
  height: 35px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
  transition: background-color 0.3s ease, transform 0.2s ease;
  cursor: pointer;
  z-index: 1;
  border-radius: 5px;
}
.task-block:hover {
  filter: brightness(1.1);
}
</style>