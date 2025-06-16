<template>
  <div class="roadmap-base-container">
    <div class="roadmap-container">
      <RoadmapGrid
        :roadmap-data="roadmapData"
        :months="months"
        :quarters="quarters"
        :editing-category-index="editingCategoryIndex"
        :edited-category-name="editedCategoryName"
        :assigned-category-label-colors="assignedCategoryLabelColors"
        :task-color-palette="taskColorPalette"
        @start-category-edit="startCategoryEdit"
        @update:editedCategoryName="updateEditedCategoryName"
        @finish-category-edit="finishCategoryEdit"
        @start-task-edit="startTaskEdit"
        @assign-category-color="assignCategoryColor"
      />

      <p class="roadmap-note">
        ※ カテゴリ欄をダブルクリックで編集できます
      </p>

      <RoadmapTaskAddForm
        :new-task="newTask"
        :selected-category="selectedCategory"
        :all-available-categories="allAvailableCategories"
        :months="months"
        @update:selectedCategory="selectedCategory = $event"
        @update:newTask="updateNewTask"
        @add-task="addTask"
      />

      <RoadmapTaskEditModal
        :editing-task="editingTask"
        :months="months"
        @update:editingTask="editingTask = $event"
        @save-task-edit="saveTaskEdit"
        @cancel-task-edit="cancelTaskEdit"
        @delete-task="deleteTask"
      />
    </div>
  </div>
</template>

<script>
// コンポーネントをインポート
import RoadmapGrid from './RoadmapGrid.vue';
import RoadmapTaskAddForm from './RoadmapTaskAddForm.vue';
import RoadmapTaskEditModal from './RoadmapTaskEditModal.vue';

export default {
  name: 'RoadmapBase',
  components: {
    RoadmapGrid,
    RoadmapTaskAddForm,
    RoadmapTaskEditModal,
  },
  data() {
    const allMonths = [
      { id: 'm4_25', name: '4月', quarterId: 'q2_fy' },
      { id: 'm5_25', name: '5月', quarterId: 'q2_fy' },
      { id: 'm6_25', name: '6月', quarterId: 'q2_fy' },
      { id: 'm7_25', name: '7月', quarterId: 'q3_fy' },
      { id: 'm8_25', name: '8月', quarterId: 'q3_fy' },
      { id: 'm9_25', name: '9月', quarterId: 'q3_fy' },
      { id: 'm10_25', name: '10月', quarterId: 'q4_fy' },
      { id: 'm11_25', name: '11月', quarterId: 'q4_fy' },
      { id: 'm12_25', name: '12月', quarterId: 'q4_fy' },
      { id: 'm1_26', name: '1月', quarterId: 'q1_fy' },
      { id: 'm2_26', name: '2月', quarterId: 'q1_fy' },
      { id: 'm3_26', name: '3月', quarterId: 'q1_fy' },
    ];

    const quarters = [
      { id: 'q1_fy', name: 'Q1', startMonthIndex: 9, endMonthIndex: 11 },
      { id: 'q2_fy', name: 'Q2', startMonthIndex: 0, endMonthIndex: 2 },
      { id: 'q3_fy', name: 'Q3', startMonthIndex: 3, endMonthIndex: 5 },
      { id: 'q4_fy', name: 'Q4', startMonthIndex: 6, endMonthIndex: 8 },
    ];

    const initialCategories = [
      '新規カテゴリ1',
      '新規カテゴリ2',
      '新規カテゴリ3',
      '新規カテゴリ4',
    ];
    const initialRoadmapData = initialCategories.map((cat) => ({
      category: cat,
      tasks: [],
    }));

    return {
      months: allMonths,
      quarters: quarters,
      roadmapData: initialRoadmapData,
      newTask: {
        category: '',
        name: '',
        startMonthIndex: 0,
        endMonthIndex: 0,
        color: '',
      },
      selectedCategory: '',
      assignedCategoryLabelColors: {},
      editingCategoryIndex: null,
      editedCategoryName: '',
      editingTask: null,
      originalTask: null,
      taskColorPalette: [
        'hsl(200, 80%, 75%)',
        'hsl(120, 70%, 75%)',
        'hsl(30, 90%, 75%)',
        'hsl(280, 70%, 80%)',
        'hsl(180, 80%, 75%)',
        'hsl(340, 80%, 80%)',
        'hsl(60, 90%, 75%)',
        'hsl(240, 70%, 80%)',
        'hsl(150, 60%, 70%)',
        'hsl(220, 60%, 70%)',
        'hsl(10, 80%, 75%)',
        'hsl(270, 50%, 75%)',
      ],
    };
  },
  computed: {
    allAvailableCategories() {
      const categories = new Set(this.roadmapData.map((row) => row.category));
      return Array.from(categories);
    },
  },
  created() {
    this.roadmapData.forEach((row) => {
      this.assignCategoryColor(row.category);
    });
  },
  methods: {
    updateNewTask(updatedTask) {
      this.newTask = updatedTask;
      if (this.selectedCategory !== updatedTask.category && updatedTask.category !== '') {
        this.selectedCategory = updatedTask.category;
      }
    },
    assignCategoryColor(categoryName) {
      if (!this.assignedCategoryLabelColors[categoryName]) {
        const specificColors = {
          'カテゴリのデフォルト名を入力してください': '#888888',
        };
        this.assignedCategoryLabelColors = {
          ...this.assignedCategoryLabelColors,
          [categoryName]: specificColors[categoryName] || this.generateCategoryColor(),
        };
      }
    },
    generateTaskColor() {
      const randomIndex = Math.floor(Math.random() * this.taskColorPalette.length);
      return this.taskColorPalette[randomIndex];
    },
    generateCategoryColor() {
      const hues = [
        [180, 220],
        [300, 340],
        [40, 80],
        [160, 190],
      ];
      const randomHueRange = hues[Math.floor(Math.random() * hues.length)];
      const hue =
        Math.floor(Math.random() * (randomHueRange[1] - randomHueRange[0] + 1)) +
        randomHueRange[0];

      const saturation = 50 + Math.floor(Math.random() * 10);
      const lightness = 60 + Math.floor(Math.random() * 10);
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    },
    addTask() {
      let finalCategory = this.newTask.category;
      if (this.selectedCategory !== '' && this.selectedCategory !== null) {
        finalCategory = this.selectedCategory;
      }

      if (!this.newTask.name || !finalCategory) {
        alert('タスク名とカテゴリは必須です。');
        return;
      }
      if (this.newTask.startMonthIndex === undefined || this.newTask.endMonthIndex === undefined) {
        alert('開始月と終了月を選択してください。');
        return;
      }
      if (this.newTask.startMonthIndex > this.newTask.endMonthIndex) {
        alert('開始月は終了月より前に設定してください。');
        return;
      }

      const newTaskToAdd = {
        name: this.newTask.name,
        startIndex: this.newTask.startMonthIndex,
        endIndex: this.newTask.endMonthIndex,
        category: finalCategory,
        id: Date.now(),
        color: this.generateTaskColor(),
      };

      const existingCategoryRow = this.roadmapData.find(
        (row) => row.category === finalCategory
      );

      if (existingCategoryRow) {
        existingCategoryRow.tasks.push(newTaskToAdd);
      } else {
        this.roadmapData.push({
          category: finalCategory,
          tasks: [newTaskToAdd],
        });
        this.assignCategoryColor(finalCategory);
        this.roadmapData.sort((a, b) => a.category.localeCompare(b.category));
      }

      this.resetForm();
    },
    resetForm() {
      this.newTask = {
        category: '',
        name: '',
        startMonthIndex: 0,
        endMonthIndex: 0,
        color: '',
      };
      this.selectedCategory = '';
    },
    startCategoryEdit(rowIndex) {
      this.editingCategoryIndex = rowIndex;
      this.editedCategoryName = this.roadmapData[rowIndex].category;
    },
    updateEditedCategoryName(value) {
      this.editedCategoryName = value;
    },
    finishCategoryEdit(rowIndex) {
      if (this.editingCategoryIndex === rowIndex) {
        const oldCategoryName = this.roadmapData[rowIndex].category;
        const newCategoryName = this.editedCategoryName.trim();

        if (newCategoryName && newCategoryName !== oldCategoryName) {
          const isDuplicate = this.roadmapData.some(
            (row, index) => index !== rowIndex && row.category === newCategoryName
          );

          if (isDuplicate) {
            alert('そのカテゴリ名は既に存在します。別の名前を入力してください。');
            this.editedCategoryName = oldCategoryName;
            this.editingCategoryIndex = null;
            return;
          }

          this.roadmapData[rowIndex].category = newCategoryName;
          this.roadmapData[rowIndex].tasks.forEach((task) => {
            task.category = newCategoryName;
          });

          if (this.assignedCategoryLabelColors[oldCategoryName]) {
            this.assignedCategoryLabelColors[newCategoryName] =
              this.assignedCategoryLabelColors[oldCategoryName];
            delete this.assignedCategoryLabelColors[oldCategoryName];
          } else {
            this.assignCategoryColor(newCategoryName);
          }

          this.selectedCategory = newCategoryName;
        } else if (!newCategoryName) {
          this.roadmapData[rowIndex].category = 'カテゴリのデフォルト名を入力してください';
          alert('カテゴリ名は空にできません。デフォルトの文字列に戻します。');
        }

        this.editingCategoryIndex = null;
      }
    },
    startTaskEdit(task) {
      this.editingTask = { ...task };
      this.originalTask = task;
    },
    saveTaskEdit() {
      if (!this.editingTask.name) {
        alert('タスク名は必須です。');
        return;
      }
      if (this.editingTask.startIndex > this.editingTask.endIndex) {
        alert('開始月は終了月より前に設定してください。');
        return;
      }

      if (this.originalTask) {
        this.originalTask.name = this.editingTask.name;
        this.originalTask.startIndex = this.editingTask.startIndex;
        this.originalTask.endIndex = this.editingTask.endIndex;
      }

      this.cancelTaskEdit();
    },
    cancelTaskEdit() {
      this.editingTask = null;
      this.originalTask = null;
    },
    deleteTask() {
      if (!confirm('このタスクを削除してもよろしいですか？')) {
        return;
      }

      this.roadmapData.forEach((row) => {
        row.tasks = row.tasks.filter((task) => task.id !== this.editingTask.id);
      });
      this.cancelTaskEdit();
    },
  },
};
</script>

<style scoped>
.roadmap-base-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.roadmap-container {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 0;
  max-width: 1200px;
  width: 100%;
  margin: 0;
  background-color: #fcfcfc;
  border-radius: 0;
  box-shadow: none;
  padding-top: 20px;
  padding-bottom: 20px;
}

.roadmap-note {
  font-size: 0.9em;
  color: #d9534f;
  text-align: left;
  margin-top: 15px;
  padding-left: 20px;
  position: relative;
  z-index: 1;
}
</style>