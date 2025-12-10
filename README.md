
# PhiloFlow | LogicFlow

**PhiloFlow** is a specialized visualization tool designed to transform complex texts—ranging from philosophical classics to modern technical documentation—into structural logic diagrams and artistic illustrations using Generative AI.

![Dual Mode Interface](https://via.placeholder.com/800x400?text=Classic+vs+Modern+Interface)

## ✨ Key Features

### 1. Dual Aesthetics & Logic
*   **Classic Mode (Philo)**: Designed for ancient texts and philosophy. Features a parchment/woodblock print aesthetic (`Noto Serif SC`, `Ma Shan Zheng`).
*   **Modern Mode (Logic)**: Designed for technical docs, papers, and transcripts. Features a clean, vector-style engineering aesthetic (`Inter`, `Sans-serif`).

### 2. Intelligent OCR Text Cleaning (New!)
We have implemented a **"Greedy Merge"** pre-processing engine specifically for OCR (Optical Character Recognition) raw output:
*   **Noise Reduction**: Automatically merges lines interrupted by page numbers or headers.
*   **Smart Aggregation**: A paragraph is only considered "ended" when it encounters **Strong Terminal Punctuation** (e.g., `.`, `?`, `!`, `。`).
*   **Quote Handling**: Double quotes alone do not break paragraphs, ensuring dialogue or quoted terms don't fragment sentences.
*   **Structure Awareness**: Markdown headers (`#`) are treated as hard breaks, preserving document structure while fixing body text.

### 3. AI-Powered Visualization Pipeline
*   **Analysis Phase**: The system analyzes text chunks to extract core concepts, relationships, and logic flows.
*   **Generation Phase**: Converts analysis into specific visual prompts for AI image models (Gemini Pro Vision / DALL-E).
*   **Interactive Editing**: Users can modify the generated prompt and regenerate specific images.

### 4. Library & Session Management
*   **Local Storage**: All data is saved locally in your browser (IndexedDB wrapper).
*   **Folder System**: Organize sessions into folders (Books/Projects).
*   **Console**: Manage generation queues, pause/resume processing, and monitor API rate limits.

### 5. Export Capabilities
*   **Word Report (.docx)**: Exports a formatted document containing source text, analytical annotations, and generated images.
*   **Image Batch (.zip)**: Downloads all high-resolution diagrams in a single archive.

---

## 🛠 Tech Stack

*   **Core**: React 19, TypeScript, Vite
*   **Styling**: Tailwind CSS
*   **AI SDK**: `@google/genai` (Gemini 2.5/3.0 models)
*   **Utilities**: 
    *   `docx` & `file-saver` (Reporting)
    *   `jszip` (Batch download)
    *   `html2canvas` (Snapshotting)
    *   `mammoth` (Word document parsing)

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v16 or higher)
*   A Google Gemini API Key (or OpenAI compatible key)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/philo-flow.git
    cd philo-flow
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open `http://localhost:5173` in your browser.

---

## ⚙️ Configuration

### API Keys
1.  Click the **Settings / Key** button in the top right corner.
2.  **Gemini (Recommended)**: Enter your Google GenAI API Key.
    *   Supports `Gemini 2.5 Flash` (Text) and `Gemini 2.5 Flash Image` / `Gemini 3 Pro Image` (Visuals).
3.  **Custom/OpenAI**: You can also configure OpenAI-compatible endpoints (e.g., DeepSeek, Moonshot) for text analysis, and DALL-E for image generation.

### HD Generation
*   Toggle the **HD Pro** button in the header to switch between Standard (Flash) and High-Definition (Pro) image models. *Note: HD models may consume more quota.*

---

## 📝 Usage Guide

1.  **Select Mode**: Choose between Classic or Modern on the landing page.
2.  **Input Text**: Paste text or drag & drop a `.md`, `.txt`, or `.docx` file.
3.  **OCR Toggle**: If your text comes from a PDF scan or subtitle file, enable the **OCR Clean** toggle to fix line breaks.
4.  **Generate**: Click "Start Generation". The Console on the right will show progress.
5.  **Refine**: Click on any result card to edit the prompt or regenerate the image.
6.  **Export**: Use the right sidebar to save your session or download reports.

---

## License

MIT