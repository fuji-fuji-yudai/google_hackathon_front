<template>
  <div class="task-add-form">
    <h3>新規タスクを追加 / カテゴリを編集</h3>
    
    <div class="form-row">
      <div class="form-group flex-grow">
        <label for="category-select">カテゴリ:</label>
        <select id="category-select" v-model="internalSelectedCategory" @change="handleCategoryChange" class="input-field">
          <option value="">-- カテゴリを選択 --</option>
          <option v-for="category in allAvailableCategories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>

      <div class="form-group flex-grow" v-if="showCategoryNameInput">
        <label for="category-name-input">{{ categoryNameInputLabel }}:</label>
        <input
          id="category-name-input"
          type="text"
          v-model="internalNewTask.category"
          :placeholder="categoryNameInputPlaceholder"
          class="input-field"
          @input="emitUpdatedNewTaskAndCategory"
          @blur="handleCategoryNameInputBlur"
          :disabled="internalSelectedCategory === '__new__' && allAvailableCategories.length >= 4"
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
        @input="emitUpdatedNewTask"
      />
    </div>

    <div class="form-group month-selection">
      <div class="month-select-item">
        <label for="start-month">開始月:</label>
        <select id="start-month" v-model.number="internalNewTask.startMonth" class="input-field" @change="emitUpdatedNewTask">
          <option value="" disabled>-- 選択 --</option>
          <option v-for="month in months" :key="month.id" :value="month.monthNumber">
            {{ month.name }} ({{ month.year }})
          </option>
        </select>
      </div>
      <div class="month-select-item">
        <label for="end-month">終了月:</label>
        <select id="end-month" v-model.number="internalNewTask.endMonth" class="input-field" @change="emitUpdatedNewTask">
          <option value="" disabled>-- 選択 --</option>
          <option v-for="month in months" :key="month.id" :value="month.monthNumber">
            {{ month.name }} ({{ month.year }})
          </option>
        </select>
      </div>
    </div>

    <button @click="addTask" class="add-task-button">タスクを追加</button>
  </div>
</template>

<script>
import { ref, watch, computed } from 'vue';

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
    allAvailableCategories: { // これが既存カテゴリのリスト
      type: Array,
      default: () => [],
    },
    months: {
      type: Array,
      required: true,
      // months配列の各要素は { id: number, name: string, year: number, monthNumber: number } の形式を想定
      // 例: { id: 1, name: '1月', year: 2025, monthNumber: 1 }
    },
  },
  emits: ['update:newTask', 'update:selectedCategory', 'add-task', 'update-category-name'],

  setup(props, { emit }) {
    const internalNewTask = ref({ ...props.newTask });
    const internalSelectedCategory = ref(props.selectedCategory);
    const originalCategoryName = ref(''); // 既存カテゴリ編集のために元の名前を保持

    // props.newTask の変更を internalNewTask に同期
    watch(() => props.newTask, (newVal) => {
      internalNewTask.value = { ...newVal };
    }, { deep: true });

    // props.selectedCategory の変更を internalSelectedCategory に同期
    watch(() => props.selectedCategory, (newVal) => {
      internalSelectedCategory.value = newVal;
      // カテゴリが外部から変更された場合も、元のカテゴリ名をリセット
      originalCategoryName.value = newVal !== '__new__' ? newVal : '';
    });

    // コンポーネントがマウントされたとき、またはカテゴリが初期化されたときに元のカテゴリ名をセット
    watch(() => internalSelectedCategory.value, (newVal) => {
      if (newVal !== '__new__' && newVal !== '') {
        originalCategoryName.value = newVal;
      } else {
        originalCategoryName.value = '';
      }
    }, { immediate: true });


    const showCategoryNameInput = computed(() => {
      return internalSelectedCategory.value !== ''; 
    });

    const categoryNameInputLabel = computed(() => {
      return 'カテゴリ名';
    });

    // この computed property は正しく定義されているので変更なし
    const categoryNameInputPlaceholder = computed(() => {
      return 'カテゴリ名を編集してください';
    });


    const handleCategoryChange = () => {
      const newCategoryValue = internalSelectedCategory.value;
      if (newCategoryValue !== '') {
        internalNewTask.value.category = newCategoryValue; // 既存カテゴリ選択の場合、カテゴリ名を設定
      } else {
        // 「-- カテゴリを選択 --」が選択された場合
        internalNewTask.value.category = ''; // カテゴリ名をクリア
        originalCategoryName.value = ''; // 元のカテゴリ名もクリア
      }
      emit('update:selectedCategory', newCategoryValue);
      emitUpdatedNewTask();
    };

    // カテゴリ名入力フィールドの更新とイベント発火
    const emitUpdatedNewTaskAndCategory = () => {
        emitUpdatedNewTask(); // newTaskの更新イベント
    };

    // カテゴリ名入力フィールドからフォーカスが外れたときにカテゴリ変更イベントを発火
    const handleCategoryNameInputBlur = () => {
        const currentCategoryValue = internalNewTask.value.category;
        if (originalCategoryName.value && originalCategoryName.value !== currentCategoryValue) {
            console.log(`Emitting update-category-name: old=${originalCategoryName.value}, new=${currentCategoryValue}`);
            emit('update-category-name', { oldCategory: originalCategoryName.value, newCategory: currentCategoryValue });
            originalCategoryName.value = currentCategoryValue; // 更新後、元のカテゴリ名も新しいものに設定
        }
    };


    const emitUpdatedNewTask = () => {
      emit('update:newTask', internalNewTask.value);
      console.log('RoadmapTaskAddForm: Emitting update:newTask with:', internalNewTask.value);
    };

    const addTask = () => {
      // カテゴリ名が未入力の場合のバリデーションを追加
      if (!internalNewTask.value.category || internalNewTask.value.category.trim() === '') {
        alert('カテゴリ名を入力してください。');
        return;
      }
      // タスク名が未入力の場合のバリデーションを追加
      if (!internalNewTask.value.name || internalNewTask.value.name.trim() === '') {
        alert('タスク名を入力してください。');
        return;
      }
      // 開始月と終了月が選択されているか確認
      if (internalNewTask.value.startMonth === null || internalNewTask.value.startMonth === '' || internalNewTask.value.endMonth === null || internalNewTask.value.endMonth === '') {
        alert('開始月と終了月を選択してください。');
        return;
      }
      // 開始月が終了月より後でないか確認
      if (internalNewTask.value.startMonth > internalNewTask.value.endMonth) {
        alert('開始月は終了月より前の月を選択してください。');
        return;
      }

      emit('add-task');
      console.log('RoadmapTaskAddForm: Emitting add-task event.');
    };

    return {
      internalNewTask,
      internalSelectedCategory,
      handleCategoryChange,
      addTask,
      emitUpdatedNewTask,
      showCategoryNameInput,
      categoryNameInputLabel,
      categoryNameInputPlaceholder, 
      emitUpdatedNewTaskAndCategory,
      handleCategoryNameInputBlur,
    };
  },
};
</script>

<style scoped>
/* スタイルは変更なし */
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
  margin-bottom: 8px;
  text-align: center;
  font-size: 1.15em;
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