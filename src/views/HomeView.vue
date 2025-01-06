<template>
  <div>
    <div class="components-container">
      <div class="component-panel">
        <ExcelToJson @keywords="onKeywords" />
      </div>
      <div class="component-panel">
        <PDFQuestions @parsed-questions="onQuestions" />
      </div>
    </div>
    <div>
      <PromptBuilder :questions="questions" :keywords="keywords" />
    </div>
  </div>
</template>

<script setup lang="ts">
import PDFQuestions from '@/components/questionare-pdf/PDFQuestions.vue';
import ExcelToJson from '@/components/xlsx/ExcelToJson.vue';
import PromptBuilder from '@/components/prompt/Prompt.vue';
import { ref } from 'vue';
import type { Keyword, Question } from '@/types';

const keywords = ref<Keyword[]>([]);
const questions = ref<Question[]>([]);

const onKeywords = (newKeywords: Keyword[]) => {
  keywords.value = [...newKeywords];
};

const onQuestions = (newQuestions: Question[]) => {
  questions.value = [...newQuestions];
};
</script>

<style scoped>
.components-container {
  display: flex;
  gap: 30px;
  max-width: 100%;
  padding: 20px;
  height: 400px;
}

.component-panel {
  flex: 1;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}
</style>
