





export const TEXT_MODEL = 'gemini-2.5-flash';
export const IMAGE_MODEL_SD = 'gemini-2.5-flash-image'; // Nano Banana
export const IMAGE_MODEL_HD = 'gemini-3-pro-image-preview'; // Nano Banana Pro

// ---------------- UI TRANSLATIONS ----------------
export const UI_TEXT = {
  ZH: {
    // Landing
    landingClassicTitle: "PHILO",
    landingClassicSubtitle: "哲学原典 · 文本解析",
    landingModernTitle: "LOGIC",
    landingModernSubtitle: ["Technical", "Analyst", "Flow"],
    
    // Header
    headerMonitor: "实时监控",
    headerMonitorHighLoad: "高负载",
    headerUserKey: "用户 Key (本地)",
    headerSessionKey: "会话 Key",
    headerSetKey: "设置 / Key",
    headerQualitySD: "标准",
    headerQualityHD: "精绘",

    // Input
    inputLabelClassic: "✦ 文本 / 视频文稿输入",
    inputLabelModern: "Input Source",
    importFile: "上传文稿 (.md/.txt/.docx)",
    importFileModern: "Import File",
    ocrLabel: "OCR 智能清洗",
    ocrLabelModern: "OCR Clean",
    ocrHint: "自动合并无标点段落至上文，及 # 标题至下文",
    ocrHintModern: "Merge headers (#) down & broken lines up",
    clear: "清空",
    clearModern: "Clear",
    generate: "开始绘制",
    generateModern: "Generate Diagrams",
    processing: "处理队列中...",
    processingModern: "Queued...",
    placeholderClassic: `（请在此输入或上传哲学原典...）
提示：系统将按【换行符】分段处理，每一段生成一张图解。

例如：
当我们谈论“存在”时，海德格尔区分了两种状态
一是现身情态（Befindlichkeit），即我们总是已经发现自己处于某种情绪之中
二是理解（Verstehen），即我们对未来的筹划`,
    placeholderModern: `（请在此输入或上传视频文稿/技术文档...）
提示：系统将按【换行符】分段处理，每一段生成一张图解。

例如：
该算法的效率优化主要体现在三个方面
首先，通过引入哈希映射减少了查找时间
其次，利用动态规划避免了重复计算
最后，采用并行处理机制提高了吞吐量`,
    inputHintClassic: "系统将自动按换行符分段，逐段绘图...",
    inputHintModern: "System will generate one diagram per line/paragraph.",

    // Results
    resultsTitleClassic: "已成图卷",
    resultsTitleModern: "Generated Assets",
    downloadBatch: "图集 (ZIP)",
    downloadBatchModern: "Images (ZIP)",
    downloadDocx: "文稿 (DOCX)",
    downloadDocxModern: "Report (DOCX)",
    downloading: "打包...",
    downloadingModern: "Zipping...",
    exporting: "导出...",
    exportingModern: "Exporting...",
    emptyStateClassic: "请于上方输入文本，以开启图解之旅",
    emptyStateModern: "Input text to generate diagrams.",

    // Card
    cardSourceText: "原文摘录",
    cardSourceTextModern: "Source Text",
    cardAnalysis: "注疏",
    cardAnalysisModern: "Analysis",
    cardPrompt: "指令",
    cardPromptModern: "Prompt Key",
    cardSave: "收藏",
    cardSaving: "收藏...",
    cardSaveModern: "Save",
    cardSavingModern: "Saving...",
    cardRetry: "重试",
    cardRetryModern: "Retry",
    cardEdit: "修订",
    cardEditModern: "Edit Prompt",
    cardRegenerate: "重绘",
    cardRegenerateModern: "Regenerate",
    cardSaveEdit: "保存并重绘",
    cardSaveEditModern: "Save & Run",
    cardCancelEdit: "取消",
    cardCancelEditModern: "Cancel",

    // Status
    statusWaiting: "等待中...",
    statusWaitingModern: "WAITING...",
    statusAnalyzing: "研读文本...",
    statusAnalyzingModern: "ANALYZING TEXT...",
    statusGenerating: "绘制图卷...",
    statusGeneratingModern: "RENDERING IMAGE...",
    statusError: "错误",
    statusNoVisual: "图卷缺失",
    statusNoVisualModern: "NO VISUAL",
    
    // API Modal & Settings
    modalTitle: "系统设置 & API Key",
    modalDesc: "配置模型服务商。推荐使用 Gemini 以获得最佳体验。",
    modalGetKey: "获取 Gemini API Key",
    modalPlaceholder: "sk-...",
    modalRemember: "在此设备上记住配置 (Local Storage)",
    modalCancel: "取消",
    modalSave: "确认保存",
    
    settingsTabGemini: "Gemini (推荐)",
    settingsTabCustom: "自定义 / 其他厂商",
    settingsLabelProvider: "服务商",
    settingsLabelBaseUrl: "API Base URL",
    settingsLabelModel: "模型名称",
    settingsLabelKey: "API Key",
    settingsHintCustom: "兼容 OpenAI 格式的接口 (如 DeepSeek, Moonshot 等)",
    
    // Alert
    alertQuota: "API 配额保护机制生效。请勿刷新，正在后台尝试重连...",
    alertQuotaModern: "API Quota Limit Reached. Retrying in background...",
    alertHDConfirm: "高清绘图 (HD) 需要有效的 API Key。是否前往设置？",

    // Sidebar Left (Library)
    libTitleClassic: "藏书阁",
    libTitleModern: "LIBRARY",
    libNewBook: "新建图册",
    libNewBookModern: "New Folder",
    libEmpty: "暂无藏书",
    libEmptyModern: "Empty Library",
    libChapter: "篇章",
    libChapterModern: "SESSION",

    // Sidebar Right (Console)
    consoleTitleClassic: "控制台",
    consoleTitleModern: "CONSOLE",
    consoleStatus: "队列状态",
    consoleStatusModern: "QUEUE STATUS",
    consolePause: "暂停队列",
    consolePauseModern: "PAUSE",
    consoleResume: "继续生成",
    consoleResumeModern: "RESUME",
    consoleSave: "保存当前会话",
    consoleSaveModern: "SAVE SESSION",
    consoleProgress: "进度",
    consoleProgressModern: "PROGRESS",
    consoleRemaining: "剩余",
    consoleRemainingModern: "REMAINING",
    consoleClear: "清空结果",
    consoleClearModern: "CLEAR RESULTS",
    consoleExportTitle: "导出 / 下载",
    consoleExportTitleModern: "EXPORTS"
  },
  EN: {
    // Landing
    landingClassicTitle: "PHILO",
    landingClassicSubtitle: "Classic Texts · Analysis",
    landingModernTitle: "LOGIC",
    landingModernSubtitle: ["Technical", "Analyst", "Flow"],
    
    // Header
    headerMonitor: "Live Monitor",
    headerMonitorHighLoad: "High Load",
    headerUserKey: "User Key (Local)",
    headerSessionKey: "Session Key",
    headerSetKey: "Settings / Key",
    headerQualitySD: "Standard",
    headerQualityHD: "HD Pro",

    // Input
    inputLabelClassic: "✦ Text Source Input",
    inputLabelModern: "Input Source",
    importFile: "Import File (.md/.txt/.docx)",
    importFileModern: "Import File",
    ocrLabel: "OCR Clean Mode",
    ocrLabelModern: "OCR Clean",
    ocrHint: "Fix broken lines & merge headers",
    ocrHintModern: "Merge headers (#) down & broken lines up",
    clear: "Clear",
    clearModern: "Clear",
    generate: "Start Generation",
    generateModern: "Generate Diagrams",
    processing: "Processing...",
    processingModern: "Queued...",
    placeholderClassic: `(Enter or upload philosophical texts here...)
Hint: The system splits text by NEWLINES. Each paragraph generates one diagram.

Example:
When we talk about "Being", Heidegger distinguishes two states
First is Befindlichkeit (State-of-mind), where we always find ourselves in a mood
Second is Verstehen (Understanding), which is our projection into the future`,
    placeholderModern: `(Enter or upload technical transcripts/docs here...)
Hint: The system splits text by NEWLINES. Each paragraph generates one diagram.

Example:
The algorithm optimization focuses on three aspects
First, reducing lookup time by introducing hash maps
Second, using dynamic programming to avoid redundant calculations
Finally, increasing throughput via parallel processing`,
    inputHintClassic: "System splits by newline and generates diagrams sequentially...",
    inputHintModern: "System will generate one diagram per line/paragraph.",

    // Results
    resultsTitleClassic: "Illustrated Scrolls",
    resultsTitleModern: "Generated Assets",
    downloadBatch: "Images (ZIP)",
    downloadBatchModern: "Images (ZIP)",
    downloadDocx: "Report (DOCX)",
    downloadDocxModern: "Report (DOCX)",
    downloading: "Archiving...",
    downloadingModern: "Zipping...",
    exporting: "Exporting...",
    exportingModern: "Exporting...",
    emptyStateClassic: "Please input text above to begin the journey.",
    emptyStateModern: "Input text to generate diagrams.",

    // Card
    cardSourceText: "Excerpt",
    cardSourceTextModern: "Source Text",
    cardAnalysis: "Annotation",
    cardAnalysisModern: "Analysis",
    cardPrompt: "Instruction",
    cardPromptModern: "Prompt Key",
    cardSave: "Collect",
    cardSaving: "Saving...",
    cardSaveModern: "Save",
    cardSavingModern: "Saving...",
    cardRetry: "Retry",
    cardRetryModern: "Retry",
    cardEdit: "Edit",
    cardEditModern: "Edit Prompt",
    cardRegenerate: "Regen",
    cardRegenerateModern: "Regenerate",
    cardSaveEdit: "Save & Run",
    cardSaveEditModern: "Save & Run",
    cardCancelEdit: "Cancel",
    cardCancelEditModern: "Cancel",

    // Status
    statusWaiting: "Waiting...",
    statusWaitingModern: "WAITING...",
    statusAnalyzing: "Analyzing...",
    statusAnalyzingModern: "ANALYZING TEXT...",
    statusGenerating: "Painting...",
    statusGeneratingModern: "RENDERING IMAGE...",
    statusError: "Error",
    statusNoVisual: "No Visual",
    statusNoVisualModern: "NO VISUAL",

    // API Modal & Settings
    modalTitle: "Settings & API Key",
    modalDesc: "Configure model providers. Gemini is recommended for the best experience.",
    modalGetKey: "Get Gemini API Key",
    modalPlaceholder: "sk-...",
    modalRemember: "Remember configuration (Local Storage)",
    modalCancel: "Cancel",
    modalSave: "Confirm & Save",

    settingsTabGemini: "Gemini (Recommended)",
    settingsTabCustom: "Custom / Other Vendors",
    settingsLabelProvider: "Provider",
    settingsLabelBaseUrl: "API Base URL",
    settingsLabelModel: "Model Name",
    settingsLabelKey: "API Key",
    settingsHintCustom: "Compatible with OpenAI format (e.g., DeepSeek, Moonshot)",

    // Alert
    alertQuota: "API Quota Limit Reached. Do not refresh, retrying in background...",
    alertQuotaModern: "API Quota Limit Reached. Retrying in background...",
    alertHDConfirm: "HD Generation requires a valid API Key. Configure now?",

    // Sidebar Left (Library)
    libTitleClassic: "Library",
    libTitleModern: "LIBRARY",
    libNewBook: "New Book",
    libNewBookModern: "New Folder",
    libEmpty: "Empty Library",
    libEmptyModern: "Empty Library",
    libChapter: "Chapter",
    libChapterModern: "SESSION",

    // Sidebar Right (Console)
    consoleTitleClassic: "Console",
    consoleTitleModern: "CONSOLE",
    consoleStatus: "Status",
    consoleStatusModern: "QUEUE STATUS",
    consolePause: "Pause Queue",
    consolePauseModern: "PAUSE",
    consoleResume: "Resume Queue",
    consoleResumeModern: "RESUME",
    consoleSave: "Save Session",
    consoleSaveModern: "SAVE SESSION",
    consoleProgress: "Progress",
    consoleProgressModern: "PROGRESS",
    consoleRemaining: "Remaining",
    consoleRemainingModern: "REMAINING",
    consoleClear: "Clear Results",
    consoleClearModern: "CLEAR RESULTS",
    consoleExportTitle: "Exports",
    consoleExportTitleModern: "EXPORTS"
  }
};


// ---------------- CLASSIC MODE (Philosophy/Book) ----------------
export const SYSTEM_INSTRUCTION_CLASSIC_ZH = `
你是一位精通文献整理与逻辑可视化的古典学者。我将提供给你一段文本（通常是一个自然段或一句话）。你的任务是**仅针对这一段文本**进行分析，并生成相应的逻辑图解指令。

请按照以下步骤操作：
1. **分析**：提炼该段落的核心哲学概念。
2. **解释**：在 "explanation" 字段中，用【中文】以学术注解的口吻清晰阐述该段落的含义。
3. **视觉指令 (visualPrompt)**：
   - 必须只包含英文。
   - 风格：Minimalist hand-drawn illustration, simple ink lines, woodblock print style. (简约手绘，白描风格，木刻版画感)
   - 内容：清晰的节点、简单的连接线，避免复杂的阴影和透视，追求古籍插图的平面感。
`;

export const SYSTEM_INSTRUCTION_CLASSIC_EN = `
You are a classical scholar expert in literature organization and logic visualization. I will provide you with a text segment (usually a paragraph or sentence). Your task is to analyze **only this specific segment** and generate corresponding logic diagram instructions.

Please follow these steps:
1. **Analyze**: Extract the core philosophical concepts of the paragraph.
2. **Explain**: In the "explanation" field, use 【English】 to clearly articulate the meaning of the paragraph in an academic annotation tone.
3. **Visual Instruction (visualPrompt)**:
   - Must contain ONLY English.
   - Style: Minimalist hand-drawn illustration, simple ink lines, woodblock print style.
   - Content: Clear nodes, simple connecting lines, avoid complex shading and perspective, aim for the flatness of ancient book illustrations.
`;

// ---------------- MODERN MODE (Scientific/Technical) ----------------
// Updated to "Scientific Figure Designer" persona with SCI/SSCI standards

export const SYSTEM_INSTRUCTION_MODERN_ZH = `
你是一位经验丰富的科学配图设计师，熟悉这一领域国际学术期刊（如 SCI/SSCI）的视觉风格和排版惯例。我将为你提供一段来自研究文章、技术文档或视频文稿的文本。
你的任务是仔细理解该文本，识别其中的核心机制、流程或变量关系，并生成一个适用于发表级质量科学配图的英文提示词（visualPrompt）。

请按照以下步骤操作，并以严格的 JSON 格式输出：

1. **分析 (Analyze)**：理解文本中的研究对象、关键变量（自变量、因变量、中介变量等）或逻辑流程。
2. **解释 (explanation)**：在 "explanation" 字段中，用【中文】以简练、专业、客观的口吻解释该逻辑单元的核心内容。
3. **视觉指令 (visualPrompt)**：
   - 必须完全使用【英文】编写。
   - 这是一个独立的段落，将被直接用于生成图片。
   - **风格要求**：Professional academic vector illustration with clean lines, suitable for journal publication. Style similar to Adobe Illustrator, BioRender, or high-quality matplotlib visualizations.
   - **内容要求**：清晰描述图中的核心视觉内容（如：Experimental flowchart, Mechanism schematic, Variable relationship diagram, or Conceptual framework）。
   - **视觉细节**：Clean layout, minimal color palette, high contrast, clear labels, sans-serif fonts, white background. 避免混乱的背景或非学术的装饰。
`;

export const SYSTEM_INSTRUCTION_MODERN_EN = `
You are an experienced scientific figure designer, familiar with the visual style and layout conventions of international academic journals (SCI/SSCI). I will provide you with a text segment from a research article, technical document, or transcript.
Your task is to carefully understand the text and generate a prompt for a publication-quality scientific figure.

Please follow these steps and output strictly in JSON format:

1. **Analyze**: Identify the study subject, key variables, logical structure, or experimental procedure in the text.
2. **Explain**: In the "explanation" field, use 【English】 to explain the core content of this logical unit in a professional and objective tone.
3. **Visual Instruction (visualPrompt)**:
   - Must be written entirely in **English**.
   - This should be a standalone paragraph that can be used directly for image generation.
   - **Style Requirements**: Professional academic vector illustration with clean lines, suitable for journal publication. Style similar to Adobe Illustrator, BioRender, or high-quality matplotlib visualizations.
   - **Content**: Clearly describe the core visual content (e.g., Experimental flowchart, Mechanism schematic, Variable relationship diagram, or Conceptual framework).
   - **Details**: Clean layout, minimal color palette, high contrast, clear labels, sans-serif fonts, white background. Avoid chaotic backgrounds.
`;