/**
 * @file context-manager.js
 * @author Haochen (Billy) Fa
 * @description Smart context manager with intelligent message scoring, compression, and dynamic capacity management.
 */
import { Logger } from "../utils/logger.js";

const DEFAULT_CONFIG = {
  baseMaxMessages: 8,
  maxMessages: 12,
  enableCompression: true,
  enableDynamicCapacity: true,
  compressionThreshold: 300,
  qualityCheckInterval: 5,
};

/**
 * 智能上下文管理器 - 集成智能评分、压缩和动态容量管理
 */
export class ContextManager {
  constructor(config = {}) {
    // 配置参数
    this.config = { ...DEFAULT_CONFIG, ...config };

    // 核心数据
    this.history = [];
    this.messageMetadata = new Map(); // 存储消息元数据
    this.qualityStats = {
      totalMessages: 0,
      highQualityCount: 0,
      lastCapacityAdjust: 0,
    };

    Logger.log(
      "[ContextManager] Smart context manager initialized with config:",
      this.config
    );
  }

  /**
   * 一次性计算消息的完整元数据
   */
  _analyzeMessage(message, index) {
    const content = message.content;
    const metadata = {
      originalLength: content.length,
      timestamp: Date.now(),
      index: index,
      importance: 0,
      compressed: false,
      shouldCompress: false,
    };

    // 1. 计算重要性评分
    metadata.importance = this._calculateImportance(content, index);

    // 2. 判断是否需要压缩
    metadata.shouldCompress = this._shouldCompress(
      content,
      metadata.importance
    );

    // 3. 如果需要压缩，执行压缩
    if (metadata.shouldCompress && this.config.enableCompression) {
      message.content = this._compressContent(content);
      metadata.compressed = true;
      metadata.compressedLength = message.content.length;
    }

    return metadata;
  }

  /**
   * 优化的重要性评分算法
   */
  _calculateImportance(content, index) {
    let score = 0;
    const lowerContent = content.toLowerCase();

    // 位置权重（初始分析永远重要）
    if (index <= 1) {
      score += 100; // 初始分析和第一次回复
    } else if (index >= this.history.length - 2) {
      score += 40; // 最近2条消息
    }

    // 内容质量评分（使用权重系统）
    const qualityFactors = {
      data: {
        keywords: [
          "数据",
          "指标",
          "数值",
          "百分比",
          "万元",
          "台",
          "率",
          "同比",
          "环比",
        ],
        weight: 8,
      },
      issues: {
        keywords: [
          "异常",
          "问题",
          "风险",
          "下降",
          "超标",
          "不良",
          "故障",
          "警告",
        ],
        weight: 12,
      },
      insights: {
        keywords: ["分析", "趋势", "原因", "影响", "关联", "预测"],
        weight: 10,
      },
      actions: {
        keywords: ["建议", "改善", "优化", "措施", "方案", "行动", "执行"],
        weight: 9,
      },
      questions: {
        keywords: ["为什么", "如何", "怎么", "原因", "建议", "?", "？"],
        weight: 7,
      },
    };

    Object.values(qualityFactors).forEach((factor) => {
      const matches = factor.keywords.filter((keyword) =>
        lowerContent.includes(keyword)
      ).length;
      score += matches * factor.weight;
    });

    // 长度权重（信息密度考虑）
    const length = content.length;
    if (length > 150 && length < 400) {
      score += 15; // 适中长度，信息密度高
    } else if (length > 400 && length < 800) {
      score += 8; // 较长但可能有价值
    } else if (length > 800) {
      score += 3; // 很长，可能冗余
    }

    return score;
  }

  /**
   * 判断是否应该压缩消息
   */
  _shouldCompress(content, importance) {
    return content.length > this.config.compressionThreshold && importance < 50; // 只压缩低重要性的长消息
  }

  /**
   * 智能内容压缩
   */
  _compressContent(content) {
    // 提取关键信息的模式
    const extractors = [
      {
        pattern: /(\d+(?:\.\d+)?(?:%|万元|台|个|次|人|天))/g,
        prefix: "数据：",
      },
      {
        pattern: /(上升|下降|增长|减少|提升|下滑)(?:了)?(\d+(?:\.\d+)?%?)/g,
        prefix: "变化：",
      },
      { pattern: /(异常|问题|风险|超标|不良|故障)[^。]*。/g, prefix: "问题：" },
      { pattern: /(建议|应该|需要|可以)[^。]*。/g, prefix: "建议：" },
    ];

    let compressed = "";
    let extractedCount = 0;

    extractors.forEach((extractor) => {
      const matches = content.match(extractor.pattern);
      if (matches && matches.length > 0) {
        compressed += `${extractor.prefix}${matches.slice(0, 2).join("、")}。`;
        extractedCount += matches.length;
      }
    });

    // 如果提取的信息太少，保留原文的前200字符
    if (extractedCount < 3) {
      compressed = content.substring(0, 200) + "...";
    }

    return compressed;
  }

  /**
   * 智能消息管理 - 核心算法
   */
  _manageMessages() {
    if (this.history.length <= this.config.maxMessages) return;

    // 获取所有消息的元数据并排序
    const messageData = this.history.map((message, index) => {
      const id = this._getMessageId(message);
      const metadata = this.messageMetadata.get(id);
      return { message, metadata, index };
    });

    // 按重要性排序，保留最重要的消息
    messageData.sort((a, b) => b.metadata.importance - a.metadata.importance);

    // 确保保留初始分析（前2条消息）
    const initialMessages = messageData.filter((item) => item.index <= 1);
    const otherMessages = messageData.filter((item) => item.index > 1);

    // 计算可用空间
    const availableSlots = this.config.maxMessages - initialMessages.length;
    const toKeep = [
      ...initialMessages,
      ...otherMessages.slice(0, availableSlots),
    ];

    // 按原始顺序重新排列
    toKeep.sort((a, b) => a.index - b.index);

    // 更新历史记录
    this.history = toKeep.map((item) => item.message);

    // 清理元数据
    const keptIds = new Set(this.history.map((msg) => this._getMessageId(msg)));
    for (const [id] of this.messageMetadata.entries()) {
      if (!keptIds.has(id)) {
        this.messageMetadata.delete(id);
      }
    }

    Logger.log(
      `[ContextManager] Managed messages: kept ${this.history.length}/${messageData.length}`
    );
  }

  /**
   * 动态容量调整
   */
  _adjustCapacityIfNeeded() {
    if (!this.config.enableDynamicCapacity) return;

    const { totalMessages, highQualityCount, lastCapacityAdjust } =
      this.qualityStats;

    // 每隔一定消息数量才调整一次
    if (totalMessages - lastCapacityAdjust < this.config.qualityCheckInterval)
      return;

    const qualityRatio = highQualityCount / Math.max(totalMessages, 1);
    const oldCapacity = this.config.maxMessages;

    if (qualityRatio > 0.7) {
      // 高质量对话，增加容量
      this.config.maxMessages = Math.min(this.config.baseMaxMessages + 4, 15);
    } else if (qualityRatio > 0.4) {
      // 中等质量，适中容量
      this.config.maxMessages = this.config.baseMaxMessages + 2;
    } else {
      // 低质量对话，基础容量
      this.config.maxMessages = this.config.baseMaxMessages;
    }

    this.qualityStats.lastCapacityAdjust = totalMessages;

    if (oldCapacity !== this.config.maxMessages) {
      Logger.log(
        `[ContextManager] Capacity adjusted: ${oldCapacity} -> ${
          this.config.maxMessages
        } (quality: ${(qualityRatio * 100).toFixed(1)}%)`
      );
    }
  }

  /**
   * 生成消息唯一ID
   */
  _getMessageId(message) {
    return `${message.role}-${message.content.substring(0, 50)}-${
      message.timestamp || Date.now()
    }`;
  }

  /**
   * 添加消息 - 统一入口
   */
  addMessage(role, content) {
    if (role === "system") {
      Logger.log(
        `[ContextManager] System message ignored: { role: "${role}" }`
      );
      return;
    }

    // 创建消息对象
    const message = { role, content, timestamp: Date.now() };
    this.history.push(message);

    // 分析消息并存储元数据
    const metadata = this._analyzeMessage(message, this.history.length - 1);
    const messageId = this._getMessageId(message);
    this.messageMetadata.set(messageId, metadata);

    // 更新质量统计
    this.qualityStats.totalMessages++;
    if (metadata.importance > 50) {
      this.qualityStats.highQualityCount++;
    }

    // 执行智能管理
    this._manageMessages();
    this._adjustCapacityIfNeeded();

    Logger.log(
      `[ContextManager] Message added: { role: "${role}", importance: ${metadata.importance}, compressed: ${metadata.compressed} }`
    );
  }

  /**
   * 获取历史记录
   */
  getHistory() {
    Logger.log(`[ContextManager] Returning ${this.history.length} messages`);
    return [...this.history];
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const totalImportance = Array.from(this.messageMetadata.values()).reduce(
      (sum, meta) => sum + meta.importance,
      0
    );
    const avgImportance =
      totalImportance / Math.max(this.messageMetadata.size, 1);

    return {
      messageCount: this.history.length,
      capacity: this.config.maxMessages,
      averageImportance: Math.round(avgImportance),
      qualityRatio:
        this.qualityStats.highQualityCount /
        Math.max(this.qualityStats.totalMessages, 1),
      compressionRate:
        Array.from(this.messageMetadata.values()).filter((m) => m.compressed)
          .length / Math.max(this.messageMetadata.size, 1),
    };
  }

  /**
   * 清理历史记录
   */
  clear() {
    this.history = [];
    this.messageMetadata.clear();
    this.qualityStats = {
      totalMessages: 0,
      highQualityCount: 0,
      lastCapacityAdjust: 0,
    };
    Logger.log("[ContextManager] Context cleared");
  }
}
