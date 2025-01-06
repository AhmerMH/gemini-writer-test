<template>
  <div class="main-container">
    <div class="left-panel">
      <div class="header-actions">
        <h1>Keywords</h1>
      </div>
      <form @submit.prevent="handleFile">
        <input type="file" accept=".xlsx, .xls" @change="onFileChange" />
      </form>
      <div v-if="errorMessage" class="error-message">
        <p>{{ errorMessage }}</p>
      </div>
      <br />
      <button v-if="jsonResult" @click="copyAllData" class="copy-button">
        <span v-if="copiedAll">Copied!</span>
        <span v-else>Copy All</span>
      </button>
      <div v-if="jsonResult" class="table-container">
        <table>
          <thead>
            <tr>
              <th>Keyword</th>
              <th>Page</th>
              <th>Focus Keyword</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in jsonResult" :key="index">
              <td>{{ item.keyword }}</td>
              <td>{{ item.page }}</td>
              <td>{{ item.focusKeyword }}</td>
              <td>
                <button @click="copyRow(item)" class="copy-row-button">
                  <span v-if="copiedIndex === index">Copied!</span>
                  <span v-else>Copy</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import * as XLSX from 'xlsx'

export default {
  data() {
    return {
      excelFile: null,
      jsonResult: null,
      errorMessage: null,
      copiedIndex: null,
      copiedAll: false
    }
  },
  methods: {
    onFileChange(event) {
      const file = event.target.files[0]
      if (file) {
        this.excelFile = file
        this.errorMessage = null
        // Auto submit form when file is selected
        this.handleFile()
      } else {
        this.errorMessage = 'Please select a valid Excel file.'
      }
    },
    async handleFile() {
      if (!this.excelFile) {
        this.errorMessage = 'No Excel file selected.'
        return
      }

      try {
        const fileData = await this.readFile(this.excelFile)
        const jsonData = this.convertToJSON(fileData)
        this.jsonResult = this.convertJson(jsonData)
        this.$emit('keywords', this.jsonResult);
        this.errorMessage = null
      } catch (error) {
        this.errorMessage = 'Error processing the file: ' + error.message
      }
    },
    convertJson(data) {
      return data.map((item) => ({
        keyword: item.Keywrod || item.Keyword || item.Keywords || '',
        page: item.Page || '',
        focusKeyword: item['Focus Keyword'] || '',
      }))
    },
    readFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const data = new Uint8Array(event.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          resolve(workbook)
        }
        reader.onerror = (error) => reject(error)
        reader.readAsArrayBuffer(file)
      })
    },
    convertToJSON(workbook) {
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
      })

      let previousPage = null
      let previousFocusWord = null
      const processedData = rawData
        .slice(1)
        .filter((row) => row[0] || row[1] || row[2]) // Filter out completely empty rows
        .map((row) => {
          const processedRow = {
            Keyword: row[0] || '',
            Page: row[1] || previousPage || '',
            'Focus Keyword': row[2] || previousFocusWord || '',
          }

          if (processedRow.Page) {
            previousPage = processedRow.Page
          }

          if (processedRow['Focus Keyword']) {
            previousFocusWord = processedRow['Focus Keyword']
          }

          return processedRow
        })
        .filter((row) => row.Keyword || row['Focus Keyword']) // Remove rows with no keywords

      return processedData
    },
    copyRow(item) {
      const jsonStr = JSON.stringify(item, null, 2)
      navigator.clipboard.writeText(jsonStr)
      this.copiedIndex = this.jsonResult.indexOf(item)
      setTimeout(() => {
        this.copiedIndex = null
      }, 2000)
    },
    copyAllData() {
      const jsonStr = JSON.stringify(this.jsonResult, null, 2)
      navigator.clipboard.writeText(jsonStr)
      this.copiedAll = true
      setTimeout(() => {
        this.copiedAll = false
      }, 2000)
    }
  },
}
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
}

.left-panel {
  padding-bottom: 24px;
}

.right-panel {
  flex: 1;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid #4caf50;
}

.copy-button {
  width: 100%;
  margin: 10 0px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

input[type='file'] {
  width: 100%;
  padding: 12px;
  border: 2px dashed #4caf50;
  border-radius: 8px;
  background: #f8f9fa;
  cursor: pointer;
}

input[type='file']:hover {
  border-color: #45a049;
  background: #f0f2f5;
}

button {
  padding: 12px 24px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s ease;
  width: fit-content;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.table-container {
  margin-top: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
}

thead {
  background-color: #4caf50;
  color: white;
  position: sticky;
  top: 0;
}

th {
  padding: 16px 24px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #45a049;
}

td {
  padding: 12px 24px;
  border-bottom: 1px solid #eee;
}

th:not(:last-child),
td:not(:last-child) {
  border-right: 1px solid #e0e0e0;
}

tbody tr:hover {
  background-color: #f5f5f5;
}

tbody tr:last-child td {
  border-bottom: none;
}

.copy-row-button {
  padding: 6px 12px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  min-width: 60px;
}

.copy-row-button:hover {
  background-color: #45a049;
}

th:last-child,
td:last-child {
  text-align: center;
  width: 100px;
}
</style>