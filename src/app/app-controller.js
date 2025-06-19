/**
 * @file app-controller.js
 * @author Haochen (Billy) Fa
 * @description The core of AI & Logic layer, use Dependency Injection technique to listen and control
 * @description 逻辑和 AI 层的核心，使用「依赖注入」技巧监听和控制组件
 */

import {StateManager} from "../app/state-manager.js";
import {UIManager} from "../ui/ui-manager.js";
import {FRInterface} from "../integration/fr-interface.js";
import {DataProcessor} from "../integration/data-processor.js";
import {ContextManager} from "../core/context-manager.js";
import {PromptBuilder} from "../core/prompt-builder.js";
import {AIEngine} from "../core/vllm-interface.js";
import {AnalysisPipeline} from "../core/ai-analysis-pipeline.js";