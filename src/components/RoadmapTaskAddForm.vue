<template>
  <div class="task-add-form">
    <h3>新規タスクを追加</h3>
    
    <div class="form-row">
      <div class="form-group flex-grow">
        <label for="category-select">カテゴリ:</label>
        <select id="category-select" v-model="internalSelectedCategory" @change="handleCategoryChange" class="input-field">
          <option value="">-- カテゴリを選択 --</option>
          <option v-for="category in allAvailableCategories" :key="category" :value="category">
            {{ category }}
          </option>
          <option value="__new__">新しいカテゴリを作成</option>
        </select>
      </div>

      <div class="form-group flex-grow" v-if="internalSelectedCategory === '__new__'">
        <label for="new-category-name">新しいカテゴリ名:</label>
        <input
          id="new-category-name"
          type="text"
          v-model="internalNewTask.category"
          placeholder="新しいカテゴリ名を入力してください"
          class="input-field"
        />
      </div>
    </div>

    <div class="form-group">
      <label for="task-name">タスク名:</label>
      <input
        id="task-name"
        type="text"
        v-model="internalNewTask.name"
        placeholder="タスク名を入力してください"
        class="input-field"
      />
    </div>

    <div class="form-group month-selection">
      <div class="month-select-item">
        <label for="start-month">開始月:</label>
        <select id="start-month" v-model.number="internalNewTask.startMonthIndex" class="input-field">
          <option value="" disabled>-- 選択 --</option>
          <option v-for="(month, index) in months" :key="month.id" :value="index">
            {{ month.name }} ({{ month.year }})
          </option>
        </select>
      </div>
      <div class="month-select-item">
        <label for="end-month">終了月:</label>
        <select id="end-month" v-model.number="internalNewTask.endMonthIndex" class="input-field">
          <option value="" disabled>-- 選択 --</option>
          <option v-for="(month, index) in months" :key="month.id" :value="index">
            {{ month.name }} ({{ month.year }})
          </option>
        </select>
      </div>
    </div>

    <button @click="addTask" class="add-task-button">タスクを追加</button>
  </div>
</template>

<script>
// JavaScript部分は変更なし
import { ref, watch } from 'vue';

export default {
  name: 'RoadmapTaskAddForm',
  props: {
    newTask: {
      type: Object,
      required: true,
    },
    selectedCategory: {
      type: String,
      required: true,
    },
    allAvailableCategories: {
      type: Array,
      default: () => [],
    },
    months: {
      type: Array,
      required: true,
    },
  },
  emits: ['update:newTask', 'update:selectedCategory', 'add-task'],

  setup(props, { emit }) {
    const internalNewTask = ref({ ...props.newTask });
    const internalSelectedCategory = ref(props.selectedCategory);

    watch(() => props.newTask, (newVal) => {
      internalNewTask.value = { ...newVal };
    }, { deep: true });

    watch(() => props.selectedCategory, (newVal) => {
      internalSelectedCategory.value = newVal;
    });

    const handleCategoryChange = () => {
      if (internalSelectedCategory.value === '__new__') {
        internalNewTask.value.category = '';
      } else {
        internalNewTask.value.category = internalSelectedCategory.value;
      }
      emit('update:selectedCategory', internalSelectedCategory.value);
      emit('update:newTask', internalNewTask.value);
    };

    const addTask = () => {
      emit('add-task');
    };

    return {
      internalNewTask,
      internalSelectedCategory,
      handleCategoryChange,
      addTask,
    };
  },
};
</script>

<style scoped>
.task-add-form {
  background-color: #f8f8f8;
  padding: 15px 20px;
  border-radius: 8px;
  margin-top: 30px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

h3 {
  color: #333;
  margin-bottom: 8px; /* タイトルとフォーム要素の間をさらに詰める */
  text-align: center;
  font-size: 1.15em; /* タイトルをさらに小さく */
  font-weight: 600;
}

.form-row {
  display: flex;
  gap: 15px;
  width: 100%;
}

.form-group {
  margin-bottom: 0;
  text-align: left;
}

.form-group.flex-grow {
    flex-grow: 1;
    min-width: 130px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #555;
  font-weight: bold;
  font-size: 0.9em;
}

.input-field {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95em;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-field:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
  outline: none;
}

.month-selection {
  display: flex;
  gap: 10px;
}

.month-select-item {
  flex: 1;
}

.add-task-button {
  background-color: #28a745;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  margin-top: 20px;
  width: 100%;
  transition: background-color 0.3s ease, transform 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 123, 255, 0.25);
}

.add-task-button:hover {
  background-color: #218838;
  transform: translateY(-1px);
}
</style>