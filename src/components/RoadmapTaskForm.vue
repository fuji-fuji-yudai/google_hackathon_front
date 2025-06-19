<template>
  <div class="task-add-form-container">
    <h3>新規タスク追加</h3>
    <el-form :model="newTask" label-width="120px" @submit.prevent="submitForm">
      <el-row :gutter="20"> <el-col :span="12"> <el-form-item label="タスク名">
            <el-input v-model="newTask.name" placeholder="タスク名を入力" clearable></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="カテゴリ">
            <el-select v-model="selectedCategory" placeholder="カテゴリを選択または入力" filterable allow-create default-first-option>
              <el-option
                v-for="category in allAvailableCategories"
                :key="category"
                :label="category"
                :value="category">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="開始月">
            <el-select v-model="newTask.startMonthIndex" placeholder="開始月を選択">
              <el-option
                v-for="(month, index) in months"
                :key="month.id"
                :label="`${month.year}年${month.name}`"
                :value="index">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="終了月">
            <el-select v-model="newTask.endMonthIndex" placeholder="終了月を選択">
              <el-option
                v-for="(month, index) in months"
                :key="month.id"
                :label="`${month.year}年${month.name}`"
                :value="index">
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item>
        <el-button type="primary" @click="addTask">タスクを追加</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
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
    required: true,
  },
  months: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['update:newTask', 'update:selectedCategory', 'add-task']);

// 内部で newTask のコピーを管理し、変更を親にemit
const internalNewTask = ref({ ...props.newTask });
const internalSelectedCategory = ref(props.selectedCategory);

watch(() => props.newTask, (newVal) => {
  internalNewTask.value = { ...newVal };
}, { deep: true });

watch(() => props.selectedCategory, (newVal) => {
  internalSelectedCategory.value = newVal;
});

watch(internalNewTask, (newVal) => {
  emit('update:newTask', newVal);
}, { deep: true });

watch(internalSelectedCategory, (newVal) => {
  emit('update:newTask', { ...internalNewTask.value, category: newVal });
  emit('update:selectedCategory', newVal);
});

const addTask = () => {
  emit('add-task');
};

const submitForm = () => {
  // フォームのEnterキーでの送信を防止し、addTaskを明示的に呼び出す
  addTask();
};
</script>

<style scoped>
.task-add-form-container {
  padding: 10px 30px; /* 上下のパディングをさらに減らし、左右をさらに増やす */
  margin: 20px auto;
  background-color: #f0f8ff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 1200px; /* フォームの最大幅をさらに広げる */
  width: 95%; /* 親の幅の95%を使用 */
  box-sizing: border-box; /* パディングを幅に含める */
}

h3 {
  color: #2c3e50;
  margin-bottom: 10px; /* 下のマージンをさらに減らす */
  font-size: 1.0em; /* タイトルをさらに小さく */
  text-align: left; /* タイトルを左寄せに */
}

.el-form {
  display: flex;
  flex-direction: column; /* フォーム全体を縦に並べる */
}

.el-row {
  width: 100%; /* 行が親の幅をすべて使うように */
  display: flex; /* Flexboxで子要素を横並びにする */
  flex-wrap: wrap; /* 必要に応じて折り返す */
}

.el-col {
  /* el-col は Element UI のグリッドシステムに依存するため、ここでは直接幅を指定しない */
  /* 必要であれば、el-col の内部に div を置いてその div に幅を指定する */
}

/* El-Form-Item の間隔を狭める */
.el-form-item {
  margin-bottom: 8px; /* デフォルトの20pxからさらに狭める */
  width: 100%; /* フォームアイテムがel-colの幅をすべて使うように */
}

/* 各入力フィールドの高さ調整 */
.el-input,
.el-select {
  width: 100%; /* 入力フィールドが親の幅をすべて使うように */
}

/* ボタンの調整 */
.el-button {
  margin-top: 8px; /* ボタンの上のマージンを調整 */
  width: auto; /* ボタンの幅はコンテンツに合わせる */
  align-self: flex-end; /* ボタンを右寄せに */
}
</style>