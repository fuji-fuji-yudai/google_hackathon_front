// RoadmapBase.vue
<template>
  <div>
    <button @click="addNewEntry">新しいタスクを追加</button>

    <div v-for="entry in roadmapData" :key="entry.id">
      <p>カテゴリ: {{ entry.categoryName }}</p>
      <p>タスク: {{ entry.taskName }}</p>
      <p>期間: {{ entry.startMonth }} - {{ entry.endMonth }}</p>
      <button @click="editEntry(entry)">編集</button>
      <button @click="deleteEntry(entry.id)">削除</button>
    </div>

    <div v-if="editingEntry">
      <h3>{{ editingEntry.id ? 'タスクを編集' : '新しいタスクを追加' }}</h3>
      <label>カテゴリ名:</label>
      <input v-model="editingEntry.categoryName" /><br>
      <label>タスク名:</label>
      <input v-model="editingEntry.taskName" /><br>
      <label>開始月:</label>
      <input v-model="editingEntry.startMonth" /><br>
      <label>終了月:</label>
      <input v-model="editingEntry.endMonth" /><br>
      <button @click="saveEditedEntry">保存</button>
      <button @click="cancelEdit">キャンセル</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoadmapBase',
  props: {
    roadmapData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      editingEntry: null // 編集中のエントリを保持
    };
  },
  methods: {
    addNewEntry() {
      this.editingEntry = {
        id: null, // 新規なのでIDはnull
        categoryName: '',
        taskName: '',
        startMonth: '',
        endMonth: ''
      };
    },
    editEntry(entry) {
      // 既存のエントリを編集するためにコピーを作成 (リアクティブな変更を避けるため)
      this.editingEntry = { ...entry };
    },
    async saveEditedEntry() {
      if (!this.editingEntry.categoryName || !this.editingEntry.taskName ||
          !this.editingEntry.startMonth || !this.editingEntry.endMonth) {
        alert('全ての必須項目を入力してください。');
        return;
      }

      try {
        if (this.editingEntry.id) {
          // 既存エントリの更新
          await this.$emit('update-roadmap', {
            action: 'update',
            id: this.editingEntry.id,
            entry: {
              categoryName: this.editingEntry.categoryName,
              taskName: this.editingEntry.taskName,
              startMonth: this.editingEntry.startMonth,
              endMonth: this.editingEntry.endMonth
            }
          });
        } else {
          // 新しいエントリの保存
          await this.$emit('update-roadmap', {
            action: 'save',
            entry: {
              categoryName: this.editingEntry.categoryName,
              taskName: this.editingEntry.taskName,
              startMonth: this.editingEntry.startMonth,
              endMonth: this.editingEntry.endMonth
            }
          });
        }
        this.editingEntry = null; // フォームを閉じる
      } catch (error) {
        console.error('データの保存/更新に失敗しました。');
        // TODO: エラーメッセージを表示
      }
    },
    async deleteEntry(id) {
      if (confirm('このタスクを削除しますか？')) {
        try {
          await this.$emit('update-roadmap', { action: 'delete', id: id });
        } catch (error) {
          console.error('データの削除に失敗しました。');
          // TODO: エラーメッセージを表示
        }
      }
    },
    cancelEdit() {
      this.editingEntry = null;
    }
  }
}
</script>

<style scoped>
/* RoadmapBase のUIに合わせたスタイル */
div {
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
button {
  margin-right: 5px;
  padding: 5px 10px;
  cursor: pointer;
}
input {
  margin: 5px 0;
  padding: 5px;
  width: 200px;
}
</style>