<template>
  <a-modal
    v-model:visible="visible"
    title="详情"
    fullscreen
    :footer="false"
    @cancel="handleClose"
  >
    <a-split v-model:size="size" min="0.5" v-if="model" style="width: 100%">
      <template #first>
        <div style="overflow: auto">
          <pre><code class="hljs language-json" v-html="code"></code></pre>
        </div>
      </template>
      <template #second>
        <a-descriptions :column="1" style="padding: 12px">
          <a-descriptions-item label="记录时间">
            <span>{{ model.timestamp }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="日志等级">
            <span>{{ model.level }}</span>
          </a-descriptions-item>
          <a-descriptions-item label="业务标签">
            <a-space direction="vertical">
              <a-tag v-for="(tag, ind) in Object.entries(model.tags || {})" :key="ind">
                {{ tagsMap[tag[0]] }}: {{ tag[1] }}
              </a-tag>
            </a-space>
          </a-descriptions-item>
          <a-descriptions-item label="调用栈" v-if="model.stack">
            <ul style="padding: 0; white-space: nowrap">
              <li v-for="(row, i) in model.stack" :key="i">{{ row }}</li>
            </ul>
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </a-split>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
// @ts-ignore
import highlight from "../../highlight/es/highlight";
// @ts-ignore
import hljsGrammar from "../../highlight/es/languages/json.min.js";
import "../../highlight/styles/base16/monokai.min.css";

highlight.registerLanguage("json", hljsGrammar);

const size = ref(0.8);
const visible = ref(false);
const model = ref<any>({});
const index = ref(0);
const tagsMap = ref<any>({});
const code = computed(() => {
  try {
    let a = highlight.highlight(
      JSON.stringify(model.value.message || {}, null, 4),
      {
        language: "json",
        ignoreIllegals: true,
      },
      true
    );
    return a.value;
  } catch (e) {
    return model.value.message;
  }
});

function handleClose() {
  visible.value = false;
}

defineExpose({
  visible,
  model,
  index,
  tagsMap,
});
</script>
../../highlight/es/highlight
