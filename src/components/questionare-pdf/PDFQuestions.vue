<template>
  <div class="main-container">
    <div class="pdf-questions-container">
      <div class="upload-section">
        <input type="file" accept="application/pdf" @change="handlePDFUpload" ref="fileInput" class="file-input" />
      </div>

      <div v-if="uploadedImage" class="image-section">
        <div class="question-input">
          <textarea v-model="question" :placeholder="PNG_TO_JSON_PROMPT" @keyup.enter="askQuestion"
            class="question-textarea" rows="4"></textarea>
          <button @click="askQuestion" :disabled="isLoading">Ask</button>
        </div>
      </div>
      <div v-if="response" class="response-section">
        <div class="response-header">
          <span>Response</span>
          <button class="copy-button" @click="copyResponse">
            <span v-if="copied">Copied!</span>
            <span v-else>Copy</span>
          </button>
        </div>
        <div class="response-content">
          <pre><code>{{ response }}</code></pre>
        </div>
      </div>
    </div>

    <div class="qa-history-panel" v-if="parsedResponses.length">
      <div v-for="(item, index) in parsedResponses" :key="index" class="parsed-item">
        <div class="qa-pairs">
          <div v-for="(qa, qaIndex) in item" :key="qaIndex" class="qa-item">
            <div class="question-text">Q: {{ qa.question }}</div>
            <div class="answer-text">A: {{ qa.answer }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_KEY, PNG_TO_JSON_PROMPT } from '@/consts';

export default {
  name: 'PDFQuestions',
  setup(_, { emit }) {
    const fileInput = ref(null);
    const uploadedImage = ref(null);
    const question = ref(PNG_TO_JSON_PROMPT);
    const response = ref('');
    const isLoading = ref(false);
    const copied = ref(false);
    const parsedResponses = ref([]);

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const parseJsonResponse = (jsonString) => {
      try {
        const cleanJson = jsonString
          .replace(/```json\n?/, '')
          .replace(/```$/, '')
          .trim();
        const data = JSON.parse(cleanJson);
        return (
          data.info?.map((q) => ({
            question: q.question,
            answer: q.answer,
          })) || []
        );
      } catch (e) {
        return null;
      }
    };

    const askQuestion = async () => {
      if (!uploadedImage.value || !question.value) return;

      isLoading.value = true;
      try {
        const result = await model.generateContent([
          question.value,
          {
            inlineData: {
              mimeType: 'image/png',
              data: uploadedImage.value.split(',')[1],
            },
          },
        ]);

        const responseText = await result.response.text();
        response.value = responseText;

        const parsed = parseJsonResponse(responseText);
        if (parsed) {
          parsedResponses.value = [];
          parsedResponses.value.push(parsed);
          emit('parsed-questions', parsed);
        }
      } catch (error) {
        console.error('Error getting response:', error);
        response.value = 'Error processing your question';
      }
      isLoading.value = false;
    };

    const handlePDFUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const pdfData = new Uint8Array(e.target.result);

        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });

        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: 1.5 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        uploadedImage.value = canvas.toDataURL('image/png');
        askQuestion();
      };
      reader.readAsArrayBuffer(file);
    };

    const openImageInNewTab = () => {
      window.open(uploadedImage.value, '_blank');
    };

    const copyResponse = () => {
      navigator.clipboard.writeText(response.value);
      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    };

    return {
      fileInput,
      uploadedImage,
      question,
      response,
      isLoading,
      copied,
      parsedResponses,
      handlePDFUpload,
      askQuestion,
      openImageInNewTab,
      copyResponse,
    };
  },
};
</script>

<style scoped>
.main-container {
  display: flex;
  gap: 20px;
  margin: 0 auto;
  padding: 20px;
  /* Full viewport height minus padding */
}

.pdf-questions-container {
  flex: 1;
  overflow-y: auto;
  height: 100%;
}

.qa-history-panel {
  flex: 1;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  height: 800px;
  overflow-y: auto;
}

.parsed-item {
  margin-bottom: 30px;
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.main-heading {
  color: #2c3e50;
  font-size: 1.5em;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #4caf50;
}

.qa-pairs {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.qa-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
}

.question-text {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.answer-text {
  color: #34495e;
  line-height: 1.6;
}

.upload-section {
  margin-bottom: 20px;
}

.response-section {
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 20px;
  border: 1px solid #e9ecef;
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: #e9ecef;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.copy-button {
  padding: 6px 12px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.copy-button:hover {
  background-color: #45a049;
}

.response-content {
  height: 300px;
  overflow-y: auto;
  padding: 20px;
}

.response-content pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: 'Courier New', Courier, monospace;
}

.response-content::-webkit-scrollbar {
  width: 8px;
}

.response-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.response-content::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.response-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.file-input {
  width: 100%;
  padding: 12px;
  border: 2px dashed #4caf50;
  border-radius: 8px;
  background: #f8f9fa;
  cursor: pointer;
}

.file-input:hover {
  border-color: #45a049;
  background: #f0f2f5;
}

.preview-container {
  position: relative;
  width: 300px;
  height: 200px;
  margin: 20px auto;
  cursor: pointer;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.preview-container:hover {
  transform: scale(1.02);
}

.preview-container:hover .preview-overlay {
  opacity: 1;
}

.pdf-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px;
  text-align: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.question-input {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.question-input input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.question-input button {
  padding: 12px 24px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s ease;
}

.question-input button:hover:not(:disabled) {
  background-color: #45a049;
}

.question-input button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.question-textarea {
  width: 100%;
  padding: 4px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
  font-size: 14px;
  line-height: 1.5;
}
</style>
