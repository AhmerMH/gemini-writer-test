<template>
  <div class="card">
    <div class="tabs">
      <button :class="['tab-button', { active: activeTab === 'builder' }]" @click="activeTab = 'builder'">
        Prompt Builder
      </button>
      <button :class="['tab-button', { active: activeTab === 'custom' }]" @click="activeTab = 'custom'">
        Custom Blog
      </button>
    </div>

    <div class="tab-content">
      <!-- Existing Prompt Builder -->
      <div v-if="activeTab === 'builder'" class="prompt-builder">
        <!-- Image Upload Section -->
        <div class="upload-section">
          <div class="drop-zone" @drop.prevent="handleDrop" @dragover.prevent="dragover = true"
            @dragleave.prevent="dragover = false" @paste="handlePaste" tabindex="0" :class="{ dragover: dragover }">
            <div class="upload-content">
              <img v-if="selectedImage" :src="selectedImage" class="preview-image" />
              <div class="upload-text">
                <span>Drop image here, paste from clipboard, or</span>
                <button class="upload-button" @click="$refs.fileInput.click()">Choose File</button>
              </div>
            </div>
            <input type="file" ref="fileInput" @change="handleFileSelect" accept="image/*" class="file-input" />
          </div>
        </div>

        <!-- Word Count Selection -->
        <div class="section">
          <h3>How many words do you need to write</h3>
          <div class="radio-group">
            <label v-for="option in wordCountOptions" :key="option.value">
              <input type="radio" v-model="selectedWordCount" :value="option.value" @change="updatePrompt" />
              <input type="text" v-model="option.label" class="editable-radio-label" @input="updatePrompt" />
            </label>
            <div class="custom-count">
              <input type="radio" v-model="selectedWordCount" value="custom" @change="updatePrompt" />
              <input type="number" v-model="customWordCount" placeholder="Custom word count"
                :disabled="selectedWordCount !== 'custom'" @input="updatePrompt" />
            </div>
          </div>
          <div class="button-text-update">
            <label>
              <input type="checkbox" v-model="updateButtonsText" @change="updatePrompt" />
              Do buttons text update is required?
            </label>
          </div>
        </div>

        <!-- Page Selection -->
        <div class="section">
          <h3>Page</h3>
          <div class="radio-group">
            <label v-for="page in uniquePages" :key="page">
              <input type="radio" v-model="selectedPage" :value="page" @change="updatePrompt" />
              {{ page }}
            </label>
          </div>
        </div>
        <!-- Keywords Selection -->
        <div v-if="selectedPage" class="section">
          <h3>Keywords</h3>
          <div class="checkbox-group">
            <label v-for="keyword in filteredKeywords" :key="keyword.value">
              <input type="checkbox" v-model="selectedKeywords" :value="keyword" @change="updatePrompt" />
              <input type="text" v-model="keyword.value" class="editable-keyword-label" @input="updatePrompt" />
            </label>
          </div>
        </div>

        <!-- Prompt Preview -->
        <div class="section">
          <h3>Generated Prompt</h3>
          <textarea v-model="generatedPrompt" class="prompt-preview" rows="10" @input="updatePrompt"></textarea>
        </div>

        <!-- Generate Response -->
        <div class="section">
          <button @click="generateResponse" class="generate-btn" :disabled="!isValidPrompt">
            Generate Response
          </button>
        </div>
      </div>

      <!-- New Custom Blog Tab -->
      <div v-if="activeTab === 'custom'" class="custom-prompt">
        <textarea v-model="customPrompt" class="custom-textarea" rows="6"
          placeholder="Enter your custom prompt here..."></textarea>
        <button @click="generateCustomResponse" class="generate-btn">Generate Blog</button>
      </div>

      <!-- AI Response (shared between tabs) -->
      <div v-if="aiResponse" class="section">
        <div class="response-header">
          <h3>AI Response</h3>
          <button @click="copyResponse" class="copy-button">
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>
        <div class="ai-response">
          {{ aiResponse }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { ref, computed, watch } from 'vue';
import type { Keyword, Question } from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_KEY } from '@/consts';

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const copied = ref(false);

const props = defineProps<{
  questions: Question[];
  keywords: Keyword[];
}>();

// Add global paste event listener
const handleGlobalPaste = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) handleFile(file);
      break;
    }
  }
};

onMounted(() => {
  document.addEventListener('paste', handleGlobalPaste);
});

onUnmounted(() => {
  document.removeEventListener('paste', handleGlobalPaste);
});

// State management
const dragover = ref(false);
const selectedImage = ref('');
const selectedWordCount = ref('');
const customWordCount = ref('');
const selectedPage = ref('');
const selectedKeywords = ref<Array<Keyword>>([]);
const generatedPrompt = ref('');
const aiResponse = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const activeTab = ref('builder');
const updateButtonsText = ref(false);

const customPrompt = computed(() =>
  `Write a blog that is 800-1000 words long comprising of 3-4 paragraphs. Please do not use the much difficult words and use normal english words used in real life but not jargon words.\n\n${JSON.stringify(props.questions, null, 2)}`
);
// Computed properties
const wordCountOptions = [
  { label: '20-30 words', value: '20-30' },
  { label: '50-60 words', value: '50-60' },
  { label: '80-100 words', value: '80-100' },
  { label: '150-200 words', value: '150-200' },
  { label: '800-1000 words', value: '800-1000' },
];

const uniquePages = computed(() => {
  return [...new Set(props.keywords.map((k) => k.page))];
});

const filteredKeywords = computed(() => {
  if (!selectedPage.value) return [];

  const pageKeywords = props.keywords.filter((k) => k.page === selectedPage.value);
  const uniqueKeywords = new Set();

  return pageKeywords.reduce((acc: any[], curr) => {
    if (!uniqueKeywords.has(curr.keyword)) {
      uniqueKeywords.add(curr.keyword);
      acc.push({ value: curr.keyword, type: 'keyword' });
    }
    if (!uniqueKeywords.has(curr.focusKeyword)) {
      uniqueKeywords.add(curr.focusKeyword);
      acc.push({ value: curr.focusKeyword, type: 'focus' });
    }
    return acc;
  }, []);
});

const isValidPrompt = computed(() => {
  return (
    selectedImage.value &&
    (selectedWordCount.value || (selectedWordCount.value === 'custom' && customWordCount.value)) &&
    selectedPage.value &&
    selectedKeywords.value.length > 0
  );
});

// Methods
const handleDrop = (e: DragEvent) => {
  dragover.value = false;
  const files = e.dataTransfer?.files;
  if (files && files[0]) {
    handleFile(files[0]);
  }
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    handleFile(input.files[0]);
  }
};

const handleFile = (file: File) => {
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedImage.value = e.target?.result as string;
      updatePrompt();
    };
    reader.readAsDataURL(file);
  }
};

const updatePrompt = () => {
  const wordCount =
    selectedWordCount.value === 'custom' ? customWordCount.value : selectedWordCount.value;

  const selectedKeywordsList = selectedKeywords.value.map((k) => k.value).join(', ');

  const questionsJson = JSON.stringify(props.questions, null, 2);

  let promptText = `I want you to write ${wordCount} words for the provided image. The image is part of ${selectedPage.value} page. Use the questionares I provided below in JSON format to write about this. The text should include ${selectedKeywordsList}. Only give the text and nothing else. I dont want any extra info.`;

  if (updateButtonsText.value) {
    promptText += ' Please also update the buttons text in the image.';
  }

  generatedPrompt.value = `${promptText}\n\n${questionsJson}`;
};
const generateResponse = async (prompt = generatedPrompt.value) => {
  try {
    const result = await model.generateContent([
      prompt,
      ...(selectedImage.value
        ? [
          {
            inlineData: {
              mimeType: 'image/png',
              data: selectedImage.value.split(',')[1],
            },
          },
        ]
        : []),
    ]);

    aiResponse.value = await result.response.text();
  } catch (error) {
    console.error('Error generating response:', error);
    aiResponse.value = 'Error generating response. Please try again.';
  }
};

const generateCustomResponse = () => {
  generateResponse(customPrompt.value);
};

const copyResponse = () => {
  navigator.clipboard.writeText(aiResponse.value);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};

// Watch for prop changes to update the prompt
watch([() => props.questions, () => props.keywords], () => {
  updatePrompt();
});
</script>

<style scoped>
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin: 20px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #eee;
  padding-bottom: 12px;
}

.tab-button {
  padding: 10px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.tab-button:hover {
  background: #f5f5f5;
}

.tab-button.active {
  background: #4caf50;
  color: white;
}

.tab-content {
  padding: 20px 0;
}

.custom-prompt {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.custom-textarea {
  width: 100%;
  min-height: 200px;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
}

.custom-textarea:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.prompt-builder {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.section {
  margin-bottom: 24px;
}

.drop-zone {
  border: 2px dashed #ccc;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: border 0.3s ease;
}

.dragover {
  border-color: #2196f3;
  background: rgba(33, 150, 243, 0.1);
}

.file-input {
  display: none;
}

.preview-image {
  max-width: 200px;
  max-height: 200px;
  margin-top: 10px;
}

.radio-group,
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-group {
  flex-direction: column;
}

.custom-count {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prompt-preview {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: monospace;
}

.generate-btn {
  padding: 12px 24px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.generate-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.ai-response {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  white-space: pre-wrap;
}

label {
  display: flex;
  align-items: center;
  gap: 4px;
}

h3 {
  margin-bottom: 12px;
  color: #333;
}

.editable-radio-label {
  border: none;
  background: transparent;
  padding: 2px 4px;
  margin-left: 4px;
  border-bottom: 1px dashed transparent;
}

.editable-radio-label:hover,
.editable-radio-label:focus {
  border-bottom-color: #4caf50;
  outline: none;
}

.button-text-update {
  margin-top: 20px;
  font-weight: bold;
}

.editable-keyword-label {
  border: none;
  background: transparent;
  padding: 2px 4px;
  margin-left: 4px;
  border-bottom: 1px dashed transparent;
  width: 100%;
  min-width: 200px;
}

.editable-keyword-label:hover,
.editable-keyword-label:focus {
  border-bottom-color: #4caf50;
  outline: none;
}
</style>
