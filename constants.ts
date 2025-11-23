export const TEXT_MODEL = 'gemini-3-pro-preview';
export const IMAGE_MODEL = 'gemini-2.5-flash-image';

export const SYSTEM_INSTRUCTION_ANALYST = `
你是一位专家级逻辑学家和技术插画师。你的任务是分析哲学或复杂的文本，并将其转化为生成技术图表（流程图、思维导图或示意图）的指令。

对于提供的文本：
1. 识别概念之间的逻辑结构、过程流向或关系。
2. 在 "explanation" 字段中用【中文】清晰地解释这些逻辑。
3. 关键：创建一个 "visualPrompt" 供 AI 图像生成器使用，以生成【清晰、技术性的图表】。
   - 为了保证图像生成质量，visualPrompt 必须只包含英文，禁止包含中文。
   - 提示词必须描述一个画在白纸或网格纸上的流程图、信息图或示意图。
   - 使用关键词如："minimalist vector flowchart" (极简矢量流程图), "connected nodes" (连接的节点), "infographic style" (信息图风格), "arrows showing flow" (显示流向的箭头), "schematic structure" (图解结构), "high contrast" (高对比度)。
   - 描述布局：例如 "A central circular node labeled with the main concept, branching into three rectangular nodes connected by straight arrows." (一个标有主要概念的中心圆形节点，分支连接三个矩形节点)。
   - 不要要求现实场景或隐喻。要求几何形状、线条和结构化布局。
`;

export const PLACEHOLDER_TEXT = `黑格尔的辩证法是一个发展框架。它由三个阶段组成：
1. 正题（The Thesis）：最初的命题或存在状态。
2. 反题（The Antithesis）：对正题的否定或矛盾。
3. 合题（The Synthesis）：正题与反题之间冲突的解决，形成一个新的、更高的命题。
这一过程创造了一个不断上升的进步螺旋。`;