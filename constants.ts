
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
    headerSetKey: "设置 Key",
    headerQualitySD: "标准",
    headerQualityHD: "精绘",

    // Input
    inputLabelClassic: "✦ 文本 / 视频文稿输入",
    inputLabelModern: "Input Source",
    importFile: "上传文稿 (.md/.txt)",
    importFileModern: "Import File",
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
    downloadBatch: "下载已完成图例 (ZIP)",
    downloadBatchModern: "Download All (ZIP)",
    downloading: "装订中...",
    downloadingModern: "Zipping...",
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
    
    // API Modal
    modalTitle: "API Key 设置",
    modalDesc: "使用您自己的 API Key 可以获得更稳定的体验，并避免公共配额限制。",
    modalGetKey: "获取 Gemini API Key",
    modalPlaceholder: "AIzaSy...",
    modalRemember: "在此设备上记住我 (Local Storage)",
    modalCancel: "取消",
    modalSave: "确认保存",
    
    // Alert
    alertQuota: "API 配额保护机制生效。请勿刷新，正在后台尝试重连...",
    alertQuotaModern: "API Quota Limit Reached. Retrying in background...",
    alertHDConfirm: "Nano Banana Pro (高清绘图) 需要连接 API Key。是否立即连接？",

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
    consoleRemainingModern: "REMAINING"
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
    headerSetKey: "Set API Key",
    headerQualitySD: "Standard",
    headerQualityHD: "HD Pro",

    // Input
    inputLabelClassic: "✦ Text Source Input",
    inputLabelModern: "Input Source",
    importFile: "Import File (.md/.txt)",
    importFileModern: "Import File",
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
    downloadBatch: "Download Completed (ZIP)",
    downloadBatchModern: "Download All (ZIP)",
    downloading: "Archiving...",
    downloadingModern: "Zipping...",
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

    // API Modal
    modalTitle: "Set API Key",
    modalDesc: "Using your own API Key provides a more stable experience and avoids public quota limits.",
    modalGetKey: "Get Gemini API Key",
    modalPlaceholder: "AIzaSy...",
    modalRemember: "Remember on this device (Local Storage)",
    modalCancel: "Cancel",
    modalSave: "Confirm & Save",

    // Alert
    alertQuota: "API Quota Limit Reached. Do not refresh, retrying in background...",
    alertQuotaModern: "API Quota Limit Reached. Retrying in background...",
    alertHDConfirm: "Nano Banana Pro (HD) requires an API Key. Connect now?",

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
    consoleRemainingModern: "REMAINING"
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
   - 风格：Vintage technical drawing, da vinci sketch, etching style, ink on parchment.
   - 内容：描述节点、连接线、层级结构，具有历史感和手绘质感。
`;

export const SYSTEM_INSTRUCTION_CLASSIC_EN = `
You are a classical scholar expert in literature organization and logic visualization. I will provide you with a text segment (usually a paragraph or sentence). Your task is to analyze **only this specific segment** and generate corresponding logic diagram instructions.

Please follow these steps:
1. **Analyze**: Extract the core philosophical concepts of the paragraph.
2. **Explain**: In the "explanation" field, use 【English】 to clearly articulate the meaning of the paragraph in an academic annotation tone.
3. **Visual Instruction (visualPrompt)**:
   - Must contain ONLY English.
   - Style: Vintage technical drawing, da vinci sketch, etching style, ink on parchment.
   - Content: Describe nodes, connecting lines, hierarchical structures with a historical and hand-drawn quality.
`;

// ---------------- MODERN MODE (Technical/Logic) ----------------
export const SYSTEM_INSTRUCTION_MODERN_ZH = `
你是一位资深的技术文档工程师和逻辑分析师。我将提供给你一段文本（可能是视频字幕的一句话、一段旁白或技术说明）。你的任务是**仅针对这一段文本**进行分析，将其转化为清晰、极简的逻辑示意图指令。

请按照以下步骤操作：
1. **分析**：识别该段落中的逻辑关系、因果链条或核心论点。
2. **解释 (explanation)**：在 "explanation" 字段中，用【中文】以简练、专业、客观的口吻解释该逻辑单元的核心内容。
3. **视觉指令 (visualPrompt)**：
   - 必须只包含英文。
   - 风格：Minimalist technical diagram, vector art, clean white background, black lines, high contrast, schematic representation.
   - 关键词： "flowchart", "block diagram", "arrows", "simple geometric shapes", "black on white", "clean layout".
   - 避免：Do not use complex backgrounds, no photorealism, no 3D effects, no chaotic elements.
`;

export const SYSTEM_INSTRUCTION_MODERN_EN = `
You are a senior technical documentation engineer and logic analyst. I will provide you with a text segment (could be a subtitle line, narration, or technical description). Your task is to analyze **only this specific segment** and convert it into clear, minimalist logic diagram instructions.

Please follow these steps:
1. **Analyze**: Identify logical relationships, causal chains, or core arguments in the paragraph.
2. **Explain (explanation)**: In the "explanation" field, use 【English】 to explain the core content of this logical unit in a concise, professional, and objective tone.
3. **Visual Instruction (visualPrompt)**:
   - Must contain ONLY English.
   - Style: Minimalist technical diagram, vector art, clean white background, black lines, high contrast, schematic representation.
   - Keywords: "flowchart", "block diagram", "arrows", "simple geometric shapes", "black on white", "clean layout".
   - Avoid: Do not use complex backgrounds, no photorealism, no 3D effects, no chaotic elements.
`;
