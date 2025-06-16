<template>
  <div class="task-add-form">
    <h3>新しいタスクを追加</h3>
    <div class="form-grid">
      <div class="form-row">
        <label for="selectCategory">カテゴリ選択:</label>
        <select
          id="selectCategory"
          v-model="selectedCategory"
          class="small-input"
          @change="handleCategoryChange"
        >
          <option value="">
            新しいカテゴリを追加
          </option>
          <option
            v-for="cat in allAvailableCategories"
            :key="cat"
            :value="cat"
          >
            {{ cat }}
          </option>
        </select>
      </div>
      <div
        v-if="selectedCategory === ''"
        class="form-row"
      >
        <label for="newCategoryInput">新しいカテゴリ名:</label>
        <input
          id="newCategoryInput"
          v-model="newTaskCategory"
          type="text"
          placeholder="例: ソフトウェア開発"
          class="small-input"
        >
      </div>
      <div class="form-row">
        <label for="newName">タスク名:</label>
        <input
          id="newName"
          v-model="newTaskName"
          type="text"
          placeholder="例: UIデザイン改善"
          class="small-input"
        >
      </div>
      <div class="form-row">
        <label for="startMonth">開始月:</label>
        <select
          id="startMonth"
          v-model="newTaskStartMonthIndex"
          class="small-input"
        >
          <option
            v-for="(m, index) in months"
            :key="m.id"
            :value="index"
          >
            {{ m.name }}
          </option>
        </select>
      </div>
      <div class="form-row">
        <label for="endMonth">終了月:</label>
        <select
          id="endMonth"
          v-model="newTaskEndMonthIndex"
          class="small-input"
        >
          <option
            v-for="(m, index) in months"
            :key="m.id"
            :value="index"
          >
            {{ m.name }}
          </option>
        </select>
      </div>
    </div>
    <button
      class="small-button"
      @click="emitAddTask"
    >
      タスクを追加
    </button>
  </div>
</template>

<script>
export default {
  name: 'RoadmapTaskForm',
  props: {
    months: {
      type: Array,
      required: true
    },
    allAvailableCategories: {
      type: Array,
      required: true
    }
  },
  emits: ['add-task'],
  data() {
    return {
      selectedCategory: '',
      newTaskCategory: '',
      newTaskName: '',
      newTaskStartMonthIndex: 0,
      newTaskEndMonthIndex: 0
    };
  },
  methods: {
    handleCategoryChange() {
      if (this.selectedCategory !== '') {
        this.newTaskCategory = this.selectedCategory;
      } else {
        this.newTaskCategory = '';
      }
    },
    emitAddTask() {
      const finalCategory = this.selectedCategory === '' ? this.newTaskCategory : this.selectedCategory;
      this.$emit('add-task', {
        category: finalCategory,
        name: this.newTaskName,
        startMonthIndex: this.newTaskStartMonthIndex,
        endMonthIndex: this.newTaskEndMonthIndex
      });
      // フォームをリセット
      this.selectedCategory = '';
      this.newTaskCategory = '';
      this.newTaskName = '';
      this.newTaskStartMonthIndex = 0;
      this.newTaskEndMonthIndex = 0;
    }
  }
};
</script>

<style scoped>
.task-add-form {
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 25px;
  margin-top: 40px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.task-add-form h3 {
  margin-top: 0;
  color: #333;
  font-size: 1.8em;
  margin-bottom: 25px;
  text-align: center;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px 30px;
  max-width: 700px;
  margin: 0 auto 25px auto;
}

.form-row {
  display: flex;
  align-items: center;
}

.form-row label {
  width: 120px;
  text-align: right;
  margin-right: 15px;
  font-weight: bold;
  color: #555;
  font-size: 0.95em;
}

.small-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 0.9em;
  box-sizing: border-box;
  background-color: #fdfdfd;
  color: #333;
}

.small-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  outline: none;
}

.small-button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  display: block;
  margin: 25px auto 0;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.small-button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}
</style>