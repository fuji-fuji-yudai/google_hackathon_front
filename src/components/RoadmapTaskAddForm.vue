<template>
  <div class="task-add-form">
    <h3>新規目標を追加 / カテゴリを編集</h3>
    
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
      <label for="task-name">目標:</label>
      <input
        id="task-name"
        type="text"
        v-model="internalNewTask.name"
        placeholder="目標を入力してください"
        class="input-field"
        @input="emitUpdatedNewTask"
      />
    </div>

    <div class="form-group month-selection">
      <div class="month-select-item">
        <label for="start-year">開始年:</label>
        <select id="start-year" v-model.number="internalNewTask.startYear" class="input-field" @change="emitUpdatedNewTask">
          <option value="" disabled>-- 選択 --</option>
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}年
          </option>
        </select>
      </div>
      <div class="month-select-item">
        <label for="start-month">開始月:</label>
        <select id="start-month" v-model.number="internalNewTask.startMonth" class="input-field" @change="emitUpdatedNewTask">
          <option value="" disabled>-- 選択 --</option>
          <option v-for="month in months" :key="month.id" :value="month.monthNumber">
            {{ month.name }}
          </option>
        </select>
      </div>
      <div class="month-select-item">
        <label for="end-year">終了年:</label>
        <select id="end-year" v-model.number="internalNewTask.endYear" class="input-field" @change="emitUpdatedNewTask">
          <option value="" disabled>-- 選択 --</option>
          <option v-for="year in availableYears" :key="year" :value="year">
            {{ year }}年
          </option>
        </select>
      </div>
      <div class="month-select-item">
        <label for="end-month">終了月:</label>
        <select id="end-month" v-model.number="internalNewTask.endMonth" class="input-field" @change="emitUpdatedNewTask">
          <option value="" disabled>-- 選択 --</option>
          <option v-for="month in months" :key="month.id" :value="month.monthNumber">
            {{ month.name }}
          </option>
        </select>
      </div>
    </div>

    <button @click="addTask" class="add-task-button">目標を追加</button>
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
    months: { // allMonths のことです
      type: Array,
      required: true,
      // months配列の各要素は { id: string, name: string, year: number, monthNumber: number } の形式を想定
    },
  },
  emits: ['update:newTask', 'update:selectedCategory', 'add-task', 'update-category-name'],

  setup(props, { emit }) {
    // internalNewTask の初期値に startYear と endYear を追加。
    // props.newTask にもこれらのフィールドが来ることを想定し、なければデフォルト値
    const internalNewTask = ref({ 
      ...props.newTask,
      startMonth: props.newTask.startMonth || new Date().getMonth() + 1,
      endMonth: props.newTask.endMonth || new Date().getMonth() + 1,
      startYear: props.newTask.startYear || new Date().getFullYear(),
      endYear: props.newTask.endYear || new Date().getFullYear(),
    });
    const internalSelectedCategory = ref(props.selectedCategory);
    const originalCategoryName = ref(''); // 既存カテゴリ編集のために元の名前を保持

    // props.newTask の変更を internalNewTask に同期
    watch(() => props.newTask, (newVal) => {
      // ★変更: newVal に startYear と endYear が含まれることを期待し、なければデフォルト値で補完
      internalNewTask.value = { 
        ...newVal,
        startYear: newVal.startYear || new Date().getFullYear(),
        endYear: newVal.endYear || new Date().getFullYear(),
      };
    }, { deep: true });

    // props.selectedCategory の変更を internalSelectedCategory に同期
    watch(() => props.selectedCategory, (newVal) => {
      internalSelectedCategory.value = newVal;
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

    // 年の選択肢を生成
    const availableYears = computed(() => {
      const years = new Set();
      // props.monthsに含まれる全ての年を収集
      props.months.forEach(month => years.add(month.year));
      
      // 現在の年と、その前後数年を追加して選択肢を広げる
      const currentYear = new Date().getFullYear();
      for (let i = currentYear - 2; i <= currentYear + 3; i++) { // 例: 現在の年から前後数年
          years.add(i);
      }
      
      return Array.from(years).sort((a, b) => a - b);
    });

    const showCategoryNameInput = computed(() => {
      return internalSelectedCategory.value !== ''; 
    });

    const categoryNameInputLabel = computed(() => {
      return 'カテゴリ名';
    });

    const categoryNameInputPlaceholder = computed(() => {
      return 'カテゴリ名を編集してください';
    });

    const handleCategoryChange = () => {
      const newCategoryValue = internalSelectedCategory.value;
      if (newCategoryValue !== '') {
        internalNewTask.value.category = newCategoryValue; 
      } else {
        internalNewTask.value.category = ''; 
        originalCategoryName.value = ''; 
      }
      emit('update:selectedCategory', newCategoryValue);
      emitUpdatedNewTask();
    };

    const emitUpdatedNewTaskAndCategory = () => {
        emitUpdatedNewTask(); 
    };

    const handleCategoryNameInputBlur = () => {
        const currentCategoryValue = internalNewTask.value.category;
        if (originalCategoryName.value && originalCategoryName.value !== currentCategoryValue) {
            console.log(`Emitting update-category-name: old=${originalCategoryName.value}, new=${currentCategoryValue}`);
            emit('update-category-name', { oldCategory: originalCategoryName.value, newCategory: currentCategoryValue });
            originalCategoryName.value = currentCategoryValue; 
        }
    };

    const emitUpdatedNewTask = () => {
      emit('update:newTask', internalNewTask.value);
      console.log('RoadmapTaskAddForm: Emitting update:newTask with:', internalNewTask.value);
    };

    const addTask = () => {
      // バリデーションを強化
      if (!internalNewTask.value.category || internalNewTask.value.category.trim() === '') {
        alert('カテゴリ名を入力してください。');
        return;
      }
      if (!internalNewTask.value.name || internalNewTask.value.name.trim() === '') {
        alert('目標を入力してください。');
        return;
      }
      // 年と月の両方の選択をチェック
      // ★変更: null と '' の両方をチェック
      if (internalNewTask.value.startMonth === null || internalNewTask.value.startMonth === '' || 
          internalNewTask.value.endMonth === null || internalNewTask.value.endMonth === '' ||
          internalNewTask.value.startYear === null || internalNewTask.value.startYear === '' ||
          internalNewTask.value.endYear === null || internalNewTask.value.endYear === '') {
        alert('開始年・月と終了年・月を選択してください。');
        return;
      }

      // 開始日 (年+月) が終了日 (年+月) より後でないか確認
      // Dateオブジェクトは月を0から11で扱うため、-1する
      const startDate = new Date(internalNewTask.value.startYear, internalNewTask.value.startMonth - 1, 1);
      const endDate = new Date(internalNewTask.value.endYear, internalNewTask.value.endMonth - 1, 1);

      if (startDate > endDate) {
        alert('開始日は終了日より前の日付を選択してください。');
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
      availableYears,
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
  flex-wrap: wrap; /* 小さい画面で折り返すように */
}

.month-select-item {
  flex: 1;
  min-width: 120px; /* ある程度の幅を確保 */
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