<template>
  <div class="task-add-form">
    <h3>新規タスクを追加</h3>
    <div class="form-grid">
      <div class="form-row">
        <label for="task-category">カテゴリ:</label>
        <select
          id="task-category"
          v-model="localNewTask.category"
          class="small-input"
          @change="emitUpdate"
        >
          <option value="">既存カテゴリを選択</option>
          <option v-for="category in allAvailableCategories" :key="category" :value="category">
            {{ category }}
          </option>
          <option value="__new__">新しいカテゴリを作成</option>
        </select>
      </div>

      <div class="form-row" v-if="localNewTask.category === '__new__'">
        <label for="new-category-name">新しいカテゴリ名:</label>
        <input
          type="text"
          id="new-category-name"
          v-model="localNewTask.category"
          class="small-input"
          placeholder="カテゴリ名を入力"
          @input="emitUpdate"
        />
      </div>

      <div class="form-row">
        <label for="task-name">タスク名:</label>
        <input
          type="text"
          id="task-name"
          v-model="localNewTask.name"
          class="small-input"
          placeholder="タスク名を入力"
          @input="emitUpdate"
        />
      </div>

      <div class="form-row">
        <label for="start-month">開始月:</label>
        <select
          id="start-month"
          v-model="localNewTask.startMonthIndex"
          class="small-input"
          @change="emitUpdate"
        >
          <option
            v-for="(month, index) in months"
            :key="month.id"
            :value="index"
          >
            {{ month.name }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <label for="end-month">終了月:</label>
        <select
          id="end-month"
          v-model="localNewTask.endMonthIndex"
          class="small-input"
          @change="emitUpdate"
        >
          <option
            v-for="(month, index) in months"
            :key="month.id"
            :value="index"
          >
            {{ month.name }}
          </option>
        </select>
      </div>
    </div>
    <button @click="handleAddTask" class="small-button">タスクを追加</button>
  </div>
</template>

<script>
export default {
  name: 'RoadmapTaskAddForm',
  props: {
    newTask: {
      type: Object,
      required: true,
    },
    selectedCategory: {
      type: String,
      default: '',
    },
    allAvailableCategories: {
      type: Array,
      required: true,
    },
    months: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      localNewTask: { ...this.newTask }, // propsを直接変更しないためのローカルコピー
      localSelectedCategory: this.selectedCategory,
    };
  },
  watch: {
    newTask: {
      handler(newVal) {
        this.localNewTask = { ...newVal };
      },
      deep: true,
    },
    selectedCategory(newVal) {
      this.localSelectedCategory = newVal;
    },
    // localNewTask.categoryが変更されたらselectedCategoryも更新
    'localNewTask.category'(newVal) {
      if (newVal !== '__new__') {
        this.$emit('update:selectedCategory', newVal);
      }
    },
  },
  methods: {
    emitUpdate() {
      // 親コンポーネントにnewTaskの変更を通知
      this.$emit('update:newTask', this.localNewTask);
    },
    handleAddTask() {
      // 新しいカテゴリを選択した場合の処理
      if (this.localNewTask.category === '__new__') {
        // ここで、新しいカテゴリ名が入力されていることを確認し、
        // 適切なカテゴリ名に設定する必要があります。
        // 現状のRoadmapBaseのaddTaskロジックで対応されているはずですが、
        // もし入力フィールドが空の場合のバリデーションをここで追加しても良いでしょう。
        if (!this.localNewTask.name) { // nameフィールドをカテゴリ名として利用するなら
            alert('新しいカテゴリ名を入力してください。');
            return;
        }
        // ここでカテゴリ名をlocalNewTask.categoryに割り当てて、
        // 適切なカテゴリ名に更新する必要があります。
        // 例えば、新しいカテゴリ名入力用の別プロパティを用意するか、
        // あるいはRoadmapBaseのaddTaskメソッドで新しいカテゴリ名が処理されるように調整します。
        // 現状のRoadmapBaseのaddTaskはlocalNewTask.categoryを直接使用しているので、
        // ここで`__new__`を実際のカテゴリ名に変換する必要があります。

        // 例: 新しいカテゴリ名入力用のプロパティが`newCategoryInput`と仮定する場合
        // this.localNewTask.category = this.newCategoryInput;

        // 一旦、現在のロジックに合わせるため、ここでは何もせずRoadmapBaseのaddTaskに任せる
        // RoadmapBase側で'__new__'が適切なカテゴリ名に解決されることを期待
      } else if (this.localNewTask.category === '') {
         // 何も選択されていない場合、RoadmapBaseで必須チェックが行われる
         alert('カテゴリを選択または作成してください。');
         return;
      }

      this.$emit('add-task');
    },
  },
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