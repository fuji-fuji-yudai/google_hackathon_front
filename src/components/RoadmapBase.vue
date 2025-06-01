<template>
  <div class="main-layout-with-sidebar">
    <div class="roadmap-content-area">
      <div class="roadmap-container">
        <div class="roadmap-grid-container">
          <div class="roadmap-quarter-header-row">
            <div class="roadmap-quarter-corner-cell"></div> 
            <div v-for="quarter in quarters" :key="quarter.id" :class="['roadmap-quarter-header-cell', `quarter-${quarter.id}`]" :style="getQuarterHeaderStyle(quarter)">
              {{ quarter.name }}
            </div>
          </div>

          <div class="roadmap-header-row">
            <div class="roadmap-corner-cell">カテゴリ/月</div> 
            <div v-for="month in months" :key="month.id" :class="['roadmap-header-month', `quarter-${month.quarterId}`]">
              {{ month.name }}
            </div>
          </div>

          <div v-for="(row, rowIndex) in roadmapData" :key="rowIndex" class="roadmap-data-row" :style="getRoadmapRowStyle(row)">
            <div 
              class="roadmap-category-label" 
              :style="{ backgroundColor: getCategoryLabelColor(row.category) }"
              @dblclick="startCategoryEdit(rowIndex)"
            >
              <template v-if="editingCategoryIndex === rowIndex">
                <input 
                  v-model="editedCategoryName" 
                  @blur="finishCategoryEdit(rowIndex)"
                  @keyup.enter="finishCategoryEdit(rowIndex)"
                  ref="categoryInput"
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
              @dblclick="startTaskEdit(task)"
            >
              {{ task.name }}
            </div>
          </div>
        </div>

        <p class="roadmap-note">※ カテゴリ欄をダブルクリックで編集できます</p>

        <div class="task-add-form">
          <h3>新しいタスクを追加</h3>
          <div class="form-grid">
            <div class="form-row">
              <label for="selectCategory">カテゴリ選択:</label>
              <select v-model="selectedCategory" @change="handleCategoryChange" id="selectCategory" class="small-input">
                <option value="">新しいカテゴリを追加</option>
                <option v-for="cat in allAvailableCategories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div class="form-row" v-if="selectedCategory === ''">
              <label for="newCategoryInput">新しいカテゴリ名:</label>
              <input v-model="newTask.category" id="newCategoryInput" type="text" placeholder="例: ソフトウェア開発" class="small-input">
            </div>
            <div class="form-row">
              <label for="newName">タスク名:</label>
              <input v-model="newTask.name" id="newName" type="text" placeholder="例: UIデザイン改善" class="small-input">
            </div>
            <div class="form-row">
              <label for="startMonth">開始月:</label>
              <select v-model="newTask.startMonthIndex" id="startMonth" class="small-input">
                <option v-for="(m, index) in months" :key="m.id" :value="index">{{ m.name }}</option>
              </select>
            </div>
            <div class="form-row">
              <label for="endMonth">終了月:</label>
              <select v-model="newTask.endMonthIndex" id="endMonth" class="small-input">
                <option v-for="(m, index) in months" :key="m.id" :value="index">{{ m.name }}</option>
              </select>
            </div>
          </div>
          <button @click="addTask" class="small-button">タスクを追加</button>
        </div>

        <div v-if="editingTask" class="modal-overlay" @click.self="cancelTaskEdit">
          <div class="modal-content">
            <h2>タスクを編集</h2>
            <div class="form-grid">
              <div class="form-row">
                <label for="editTaskName">タスク名:</label>
                <input v-model="editingTask.name" id="editTaskName" type="text" class="small-input">
              </div>
              <div class="form-row">
                <label for="editStartMonth">開始月:</label>
                <select v-model="editingTask.startIndex" id="editStartMonth" class="small-input">
                  <option v-for="(m, index) in months" :key="m.id" :value="index">{{ m.name }}</option>
                </select>
              </div>
              <div class="form-row">
                <label for="editEndMonth">終了月:</label>
                <select v-model="editingTask.endIndex" id="editEndMonth" class="small-input">
                  <option v-for="(m, index) in months" :key="m.id" :value="index">{{ m.name }}</option>
                </select>
              </div>
            </div>
            <div class="modal-actions">
              <button @click="saveTaskEdit" class="small-button">保存</button>
              <button @click="cancelTaskEdit" class="small-button secondary">キャンセル</button>
              <button @click="deleteTask" class="small-button delete">削除</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <button class="toggle-sidebar-button" @click="toggleSidebar">
      <span v-if="isSidebarOpen">チャットを閉じる</span>
      <span v-else>AIにチャットで質問する</span>
    </button>

    <aside :class="['chat-sidebar', { 'is-open': isSidebarOpen }]">
      <ChatArea
        :messages="chatMessages"
        :currentuser="currentUser"
        :is-connected="isConnected"
        @send="handleSendMessage"
      />
    </aside>
  </div>
</template>

<script>
// ChatArea コンポーネントをインポート
import ChatArea from './ChatArea.vue'; 

export default {
  name: 'RoadmapBase',
  // ChatArea コンポーネントを使用できるように登録
  components: {
    ChatArea
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
      { id: 'q3_fy', 'name': 'Q3', startMonthIndex: 3, endMonthIndex: 5 },
      { id: 'q4_fy', name: 'Q4', startMonthIndex: 6, endMonthIndex: 8 },
    ];

    const initialCategories = [
      '新規カテゴリ1',
      '新規カテゴリ2',
      '新規カテゴリ3',
      '新規カテゴリ4'
    ]; 
    const initialRoadmapData = initialCategories.map(cat => ({
      category: cat,
      tasks: []
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
        color: '' 
      },
      selectedCategory: '',
      // カテゴリラベル用の色 (カテゴリ名ごとに一貫した色)
      assignedCategoryLabelColors: {}, 
      editingCategoryIndex: null,
      editedCategoryName: '',
      editingTask: null, // 編集中のタスクオブジェクト
      originalTask: null, // 編集前のタスクを保持（キャンセル用）
      // 黒文字に合うよう調整されたタスクブロックの色パレット (HSL)
      taskColorPalette: [
        'hsl(200, 80%, 75%)', // 明るい青
        'hsl(120, 70%, 75%)', // 明るい緑
        'hsl(30, 90%, 75%)',  // 明るいオレンジ
        'hsl(280, 70%, 80%)', // 明るい紫
        'hsl(180, 80%, 75%)', // 明るいシアン
        'hsl(340, 80%, 80%)', // 明るいピンク
        'hsl(60, 90%, 75%)',  // 明るい黄
        'hsl(240, 70%, 80%)', // 明るいインディゴ
        'hsl(150, 60%, 70%)', // ミントグリーン
        'hsl(220, 60%, 70%)', // スカイブルー
        'hsl(10, 80%, 75%)',  // コーラル
        'hsl(270, 50%, 75%)', // ラベンダー
      ],
      // ★チャット関連のデータ
      chatMessages: [
        { sender: 'ユーザーA', text: 'ロードマップについて質問があります。' },
        { sender: 'ユーザーB', text: '何でしょうか？' },
        { sender: 'ユーザーA', text: '〇〇機能の実装予定はありますか？' }
      ],
      currentUser: 'ユーザーA', // 現在のユーザー名
      isConnected: true, // ソケット接続状態を仮定
      // ★追加: サイドバーの表示状態
      isSidebarOpen: false, // 初期状態は閉じる
    };
  },
  computed: {
    allAvailableCategories() {
      const categories = new Set(this.roadmapData.map(row => row.category));
      return Array.from(categories);
    }
  },
  methods: {
    handleCategoryChange() {
      if (this.selectedCategory !== '') {
        this.newTask.category = this.selectedCategory;
      } else {
        this.newTask.category = '';
      }
    },
    getQuarterHeaderStyle(quarter) {
        const numberOfMonthsInQuarter = quarter.endMonthIndex - quarter.startMonthIndex + 1;
        // カテゴリ列が1列目なので、月の列は2列目から始まる
        const startColumn = quarter.startMonthIndex + 2; 
        const endColumn = startColumn + numberOfMonthsInQuarter;

        return {
          gridColumn: `${startColumn} / ${endColumn}`,
        };
    },
    // roadmap-data-row の高さを動的に計算
    getRoadmapRowStyle(row) {
      // タスクブロックの高さ 35px + 上下マージン 5px = 40px
      // 最初のタスクは top: 5px から始まる
      const taskHeightWithMargin = 40; // 1タスクあたりの占有高さ

      // タスクの数に応じて高さを決定
      // タスクがある場合は、タスクの数 * 1タスクあたりの占有高さ + 最下部マージン5px
      // タスクがない場合はデフォルトの最小高さ80px
      const calculatedHeight = row.tasks.length > 0 
        ? (row.tasks.length * taskHeightWithMargin) + 5 // +5pxは一番下のタスクの下マージン
        : 80; // タスクがない場合の最小高さ

      return {
        height: `${calculatedHeight}px`,
      };
    },
    // タスクブロックのスタイルを返します。grid-column で期間を制御し、top で縦位置を制御します。
    getTaskBlockStyle(task, taskIndex) {
      // grid-column-start はカテゴリ列 (1) の次から始まるので +2
      const gridColumnStart = task.startIndex + 2; 
      // grid-column-end は grid-column-start + durationMonths
      const gridColumnEnd = task.endIndex + 2 + 1; // +1はグリッドの終了位置のため

      const bgColor = task.color; 
      const textColor = this.getContrastColor(bgColor);

      // 同じ行内のタスクが重ならないように、top オフセットを計算
      // タスクブロックの高さ(35px) + マージン(5px) = 40px ごとにずらす
      const topOffset = taskIndex * 40 + 5; // 5pxは上からの余白

      return {
        backgroundColor: bgColor,
        color: textColor,
        gridColumn: `${gridColumnStart} / ${gridColumnEnd}`,
        gridRow: '1', // roadmap-data-row の中で1行目に配置 (このグリッド行の1行目にタスクを置く)
        position: 'absolute', // 親要素 (roadmap-data-row) に対して絶対位置指定
        top: `${topOffset}px`, // 縦方向のオフセット
        left: '5px', // セルの左端から少し余白
        right: '5px', // セルの右端から少し余白 (grid-column で幅を制御するため left/right が適切)
        height: '35px', // タスクブロックの高さ
        fontSize: '0.85em',
        textAlign: 'left', // 文字を左寄せにする
        padding: '0 10px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        borderRadius: '5px',
        zIndex: 1, 
      };
    },
    // カテゴリラベル用の色を取得
    getCategoryLabelColor(categoryName) {
      if (!this.assignedCategoryLabelColors[categoryName]) {
        const specificColors = {
          'カテゴリのデフォルト名を入力してください': '#888888', // 落ち着いたグレー
        };
        
        this.assignedCategoryLabelColors = {
          ...this.assignedCategoryLabelColors,
          [categoryName]: specificColors[categoryName] || this.generateCategoryColor() 
        };
      }
      return this.assignedCategoryLabelColors[categoryName];
    },
    // タスクごとに定義済みパレットからランダムな色を生成する関数
    generateTaskColor() {
      const randomIndex = Math.floor(Math.random() * this.taskColorPalette.length);
      return this.taskColorPalette[randomIndex];
    },
    // カテゴリラベル用に、より落ち着いた色を生成する関数（タスク色とは異なるベーシックな色合い）
    generateCategoryColor() {
      // 特定の基色（hue）の範囲を定義し、そこからランダムに選択
      const hues = [
        [180, 220], // シアン〜青系
        [300, 340], // マゼンタ〜ピンク系
        [40, 80],   // 黄色〜オレンジ系
        [160, 190]  // 緑〜水色系
      ];
      const randomHueRange = hues[Math.floor(Math.random() * hues.length)];
      const hue = Math.floor(Math.random() * (randomHueRange[1] - randomHueRange[0] + 1)) + randomHueRange[0];
      
      const saturation = 50 + Math.floor(Math.random() * 10); // 50-59% (さらに彩度を抑える)
      const lightness = 60 + Math.floor(Math.random() * 10);   // 60-69% (明るさも落ち着いた範囲に)
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    },
    // 背景色に応じてコントラストが最も高い文字色（白または黒）を返す
    getContrastColor(bgColor) {
        // HSL値をRGBに変換
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

        // 輝度を計算 (WCAG 2.0)
        const luminance = (0.2126 * (r / 255)) + (0.7152 * (g / 255)) + (0.0722 * (b / 255));
        
        // 輝度に基づいて白か黒を返す (閾値 0.179 は黒文字を優先)
        return luminance > 0.179 ? '#333333' : '#ffffff'; // 明るい色は黒文字、暗い色は白文字
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
        id: Date.now(), // 一意なIDを付与
        color: this.generateTaskColor(), // 各タスクに個別の色を割り当て
      };

      const existingCategoryRow = this.roadmapData.find(row => row.category === finalCategory);

      if (existingCategoryRow) {
        existingCategoryRow.tasks.push(newTaskToAdd);
      } else {
        this.roadmapData.push({
          category: finalCategory,
          tasks: [newTaskToAdd],
        });
        // 新しいカテゴリが追加された場合、カテゴリラベルの色を割り当てる
        this.getCategoryLabelColor(finalCategory); 
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
        color: ''
      };
      this.selectedCategory = '';
    },
    startCategoryEdit(rowIndex) {
      this.editingCategoryIndex = rowIndex;
      this.editedCategoryName = this.roadmapData[rowIndex].category;
      this.$nextTick(() => {
        if (this.$refs.categoryInput && this.$refs.categoryInput[0]) {
          this.$refs.categoryInput[0].focus();
          this.$refs.categoryInput[0].select();
        }
      });
    },
    finishCategoryEdit(rowIndex) {
      if (this.editingCategoryIndex === rowIndex) {
        const oldCategoryName = this.roadmapData[rowIndex].category;
        const newCategoryName = this.editedCategoryName.trim();

        if (newCategoryName && newCategoryName !== oldCategoryName) {
          const isDuplicate = this.roadmapData.some((row, index) => 
            index !== rowIndex && row.category === newCategoryName
          );

          if (isDuplicate) {
            alert('そのカテゴリ名は既に存在します。別の名前を入力してください。');
            this.editedCategoryName = oldCategoryName;
            this.editingCategoryIndex = null;
            return;
          }

          // カテゴリ名とそれに紐づくタスクのカテゴリ名を更新
          this.roadmapData[rowIndex].category = newCategoryName;
          this.roadmapData[rowIndex].tasks.forEach(task => {
            task.category = newCategoryName;
          });
          
          // カテゴリラベルの色も新しい名前に引き継ぐか、新しく割り当てる
          if (this.assignedCategoryLabelColors[oldCategoryName]) {
            this.assignedCategoryLabelColors[newCategoryName] = this.assignedCategoryLabelColors[oldCategoryName];
            delete this.assignedCategoryLabelColors[oldCategoryName];
          } else {
            this.getCategoryLabelColor(newCategoryName); // 新しい色を割り当てる
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
      // 編集のためにタスクのディープコピーを作成
      this.editingTask = { ...task };
      // キャンセル用に元のタスクへの参照を保存
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

      // 元のタスクオブジェクトを更新
      if (this.originalTask) {
        this.originalTask.name = this.editingTask.name;
        this.originalTask.startIndex = this.editingTask.startIndex;
        this.originalTask.endIndex = this.editingTask.endIndex;
      }

      this.cancelTaskEdit(); // モーダルを閉じる
    },
    cancelTaskEdit() {
      this.editingTask = null;
      this.originalTask = null;
    },
    deleteTask() {
      if (!confirm('このタスクを削除してもよろしいですか？')) {
        return;
      }

      // roadmapDataから該当タスクを削除
      this.roadmapData.forEach(row => {
        row.tasks = row.tasks.filter(task => task.id !== this.editingTask.id);
      });
      this.cancelTaskEdit(); // モーダルを閉じる
    },
    // ★追加: サイドバーの表示/非表示を切り替えるメソッド
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
    },
    // ★チャットからのメッセージ送信を受け取るメソッド
    handleSendMessage(newMessageText) {
      if (newMessageText.trim() === '') return;

      // 新しいメッセージを配列に追加（実際のチャットではサーバーに送信します）
      this.chatMessages.push({
        sender: this.currentUser,
        text: newMessageText,
      });
      console.log('送信されたメッセージ:', newMessageText);
    }
  },
  // 初期カテゴリのロード時に色を割り当てる
  created() {
    this.roadmapData.forEach(row => {
      this.getCategoryLabelColor(row.category);
    });
  }
};
</script>

<style scoped>
/* ★追加・変更されたスタイル */
.main-layout-with-sidebar {
  display: flex; /* ロードマップコンテンツとサイドバーを横に並べる */
  height: 100vh; /* ビューポートの高さいっぱいを使う */
  width: 100%;
  overflow: hidden; /* 子要素がはみ出さないように */
  position: relative; /* サイドバー切り替えボタンの基準のため追加 */
}

/* ロードマップコンテンツのエリア */
.roadmap-content-area {
  flex: 1; /* 残りのスペースを全て占める */
  overflow-y: auto; /* ロードマップコンテンツが長い場合にスクロール */
  padding: 20px; /* ロードマップエリア自体の内側の余白 */
  /* サイドバーが開閉してもコンテンツの幅が変わらないように、max-width を指定 */
  /* サイドバーが開いた時にロードマップが狭まるのを避けるため */
  /* もしくは、flex-shrink: 0 を使用 */
  flex-shrink: 0; 
  min-width: 0; /* flexアイテムの最小幅 */
}

/* チャットサイドバーのエリア */
.chat-sidebar {
  width: 350px; /* サイドバーの幅を固定 */
  background-color: #f5f5f5;
  border-left: 1px solid #ddd;
  display: flex; /* ChatAreaがflexboxの子なので、ここもflexboxに */
  flex-direction: column; /* ChatAreaが縦方向に伸びるように */
  padding: 15px; /* チャットエリア自体の内側の余白 */
  box-shadow: -2px 0 5px rgba(0,0,0,0.05); /* サイドバーに影 */

  /* ★ここから追加・変更 */
  position: absolute; /* 親要素に対して絶対位置指定 */
  top: 0;
  right: 0; /* デフォルトで右端に配置 */
  height: 100%; /* 親の高さに合わせる */
  transform: translateX(100%); /* 初期状態は完全に右に隠す */
  transition: transform 0.3s ease-out; /* スライドアニメーション */
  z-index: 999; /* 他のコンテンツより手前に表示 */
}

.chat-sidebar.is-open {
  transform: translateX(0); /* is-open クラスがあればスライドイン */
}

/* サイドバー表示切り替えボタンのスタイル */
.toggle-sidebar-button {
  position: absolute;
  top: 50%;
  right: 20px; /* サイドバーがない状態では右端に */
  transform: translateY(-50%);
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 15px;
  cursor: pointer;
  z-index: 1000; /* サイドバーより前面 */
  transition: right 0.3s ease-out; /* サイドバーの動きに合わせてボタンも動かす */
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  white-space: nowrap; /* ボタン内のテキストが折り返されないように */
}

.chat-sidebar.is-open + .toggle-sidebar-button {
  right: 370px; /* サイドバーが開いたら、サイドバーの幅 + 20px 分左に移動 */
}

/* 既存の .roadmap-container のスタイル調整 */
.roadmap-container {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  padding: 0; /* paddingを解除（.roadmap-content-areaで設定するため） */
  max-width: none; /* max-width も解除（flex:1で制御するため） */
  margin: 0; /* margin も解除 */
  background-color: #fcfcfc;
  border-radius: 0;
  box-shadow: none;
  /* position: relative; は維持 */
}

/* ここから下の既存のスタイルは変更なし */
/* ロードマップグリッドコンテナ */
.roadmap-grid-container {
  display: grid;
  /* カテゴリ列 (200px) + 月の列 (minmax(70px, 1fr) が12ヶ月分) */
  grid-template-columns: 200px repeat(12, minmax(70px, 1fr)); 
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  background-color: white;
  min-height: 600px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
  position: relative; /* 全体のグリッドコンテナもposition:relativeにする */
}

/* 四半期ヘッダー行 */
.roadmap-quarter-header-row {
  display: contents; /* 親のグリッドに参加 */
}

.roadmap-quarter-corner-cell {
  background-color: #f7f7f7;
  grid-column: 1; /* 1列目 (カテゴリ列) に配置 */
  grid-row: 1; /* 1行目に配置 */
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 3; /* 月ヘッダーより前面 */
}

.roadmap-quarter-header-cell {
  background-color: #e6e6e6; /* 四半期ヘッダーの背景色 */
  font-weight: 700;
  color: #333;
  padding: 10px 0;
  font-size: 1.1em;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  grid-row: 1; /* 1行目に配置 */
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
  grid-column: 1; /* 1列目に配置 */
  grid-row: 2; /* 2行目に配置 */
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0; /* 四半期ヘッダーの下に固定されるように */
  z-index: 2; /* 四半期ヘッダーより前面 */
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
  grid-row: 2; /* 2行目に配置 */
  position: sticky;
  top: 0; /* 四半期ヘッダーの下に固定されるように */
  z-index: 1;
}

.roadmap-header-month:last-child {
  border-right: none;
}

/* 四半期ごとの背景色をヘッダーに適用（会計年度の四半期） */
.roadmap-header-month.quarter-q1_fy { background-color: #f2f7ff; } /* 1-3月 */
.roadmap-header-month.quarter-q2_fy { background-color: #e0f2ff; } /* 4-6月 */
.roadmap-header-month.quarter-q3_fy { background-color: #f2f7ff; } /* 7-9月 */
.roadmap-header-month.quarter-q4_fy { background-color: #e0f2ff; } /* 10-12月 */


/* データ行 - ここが大きく変わります */
.roadmap-data-row {
  display: grid; /* 各データ行自身がグリッドコンテナになります */
  grid-template-columns: subgrid; /* 親のグリッドの列設定を継承 */
  grid-column: 1 / -1; /* 親のグリッドの全幅を占める */
  position: relative; /* 子要素のタスクブロックのabsolute配置の基準 */
  /* heightはJSで計算 */
  border-bottom: 1px solid #e0e0e0;
}
.roadmap-data-row:last-child {
  border-bottom: none;
}

.roadmap-category-label {
  grid-column: 1; /* 1列目に配置 */
  grid-row: 1 / -1; /* 行の高さ全体を占める */
  padding: 15px 20px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border-right: 1px solid #e0e0e0;
  /* border-bottom は親の .roadmap-data-row で設定 */
  box-sizing: border-box;
  cursor: pointer;
  z-index: 2; /* タスクブロックより前面 */
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
  /* border-bottom は親の .roadmap-data-row で設定 */
  box-sizing: border-box;
  /* background-color は下記の quarter-qX_fy で設定 */
}

.roadmap-month-background-cell:last-child {
  border-right: none;
}

/* 四半期ごとの背景色をデータセルにも適用（会計年度の四半期） */
.roadmap-month-background-cell.quarter-q1_fy { background-color: #f7faff; } /* 1-3月 */
.roadmap-month-background-cell.quarter-q2_fy { background-color: #edf5ff; } /* 4-6月 */
.roadmap-month-background-cell.quarter-q3_fy { background-color: #f7faff; } /* 7-9月 */
.roadmap-month-background-cell.quarter-q4_fy { background-color: #edf5ff; } /* 10-12月 */


/* タスクブロックの変更 - roadmap-data-row の子として配置 */
.task-block {
  /* grid-column, top, background-color, color はJSで設定 */
  position: absolute; /* 親の .roadmap-data-row に対して絶対位置 */
  height: 35px; /* タスクブロックの高さ */
  display: flex;
  align-items: center;
  /* justify-content: center; -> 不要、padding-leftで対応 */
  padding: 0 10px; /* テキストが見えるように左右にパディング */
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
  transition: background-color 0.3s ease, transform 0.2s ease;
  cursor: pointer;
  z-index: 1; /* カテゴリラベルよりは下、背景セルよりは上 */
  /* white-space, overflow, text-overflow はJSで設定 */
  border-radius: 5px;
}
.task-block:hover {
  filter: brightness(1.1);
}


/* ロードマップ下部の注意書き */
.roadmap-note {
  font-size: 0.9em;
  color: #d9534f;
  text-align: left;
  margin-top: 15px;
  padding-left: 20px;
}

/* フォームのスタイル */
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

.small-button.secondary {
  background-color: #6c757d;
  margin-left: 10px;
}
.small-button.secondary:hover {
  background-color: #5a6268;
}

.small-button.delete {
  background-color: #dc3545;
  margin-left: auto; /* 右寄せ */
}
.small-button.delete:hover {
  background-color: #c82333;
}

/* モーダルオーバーレイ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  text-align: center;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 25px;
  color: #333;
  font-size: 1.6em;
}

.modal-content .form-grid {
  grid-template-columns: 1fr; /* モーダル内は1カラムに */
  max-width: 100%;
  margin-bottom: 25px;
}

.modal-content .form-row label {
  text-align: left;
  width: 100px;
}

.modal-actions {
  display: flex;
  justify-content: flex-start; /* ボタンを左に寄せる */
  margin-top: 20px;
}
</style>