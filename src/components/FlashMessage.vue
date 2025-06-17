<template>
  <div class="flash-message">
    <el-alert v-if="visible" :title="title" :type="type" />
  </div>
</template>

<script>
export default {
  name: "FlashMessage",
  props: {
    message: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "" // タイトル
    },
    type: {
      type: String,
      default: "success", // メッセージの種類 (success, errorなど)
    },
    duration: {
      type: Number,
      default: 3000, // メッセージを表示する時間 (ミリ秒)
    },
  },
  data() {
    return {
      visible: false, // メッセージの表示/非表示
    };
  },
  watch: {
    message(newMessage) {
      if (newMessage) {
        this.show();
      }
    },
  },
  mounted() {
    if (this.message) {
      this.show();
    }
  },
  methods: {
    show() {
      this.visible = true;
      setTimeout(() => {
        this.visible = false;
        this.$emit("message-hidden"); // メッセージが非表示になったことを通知
      }, this.duration);
    },
  },
};
</script>