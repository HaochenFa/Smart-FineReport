/**
 * @file vllm-interface.js
 * @author Haochen (Billy) Fa
 * @description vLLM API wrapper 封装vLLM AI请求的API
 *
 * @import ../services/api-service.js
 * @import ../utils/logger.js
 */

/**
 * @typedef {Object} VLLMChoice
 * @property {string} text - The generated text.
 * @property {number} index - The index of the choice.
 * @property {string | null} finish_reason - The reason the model stopped generating text.
 */

/**
 * @typedef {Object} VLLMResponse
 * @property {string} id - The unique identifier for the response.
 * @property {string} object - The object type, e.g., "text_completion".
 * @property {number} created - The Unix timestamp of when the response was created.
 * @property {string} model - The model used for the generation.
 * @property {VLLMChoice[]} choices - An array of generated choices.
 */

import {APIService} from "../services/api-service.js";
import {Logger as log} from "../utils/logger.js";

export class AIEngine {
  /**
   * @param {Object} config - The config (API KEY, URL) from "../utils/settings.js", but injected by main.js
   * @param {string} config.url - The API endpoint URL for the vLLM server.
   * @param {string} [config.apiKey] - The optional API key (bearer token).
   */
  constructor(config) {
    if (!config || !config.url || (Array.isArray(config.url) && config.url.length === 0)) {
      const errorMsg = "AIEngine Error: Configuration object must contain a 'url' (string or non-empty array).";
      log.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.url = config.url;
    this.apiKey = config.apiKey;

    log.log(`[AIEngine] Initialized with URL(s): ${Array.isArray(this.url) ? this.url.join(", ") : this.url}`);
  }

  /**
   * @description Send prompt and process returned response
   * @param {string} prompt - The user prompt to send to the AI.
   * @return {Promise<string>} - Processed return text from the AI.
   */
  async getResponse(prompt) {
    log.log("[AIEngine] Preparing to send prompt...");

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      const errorMsg = "[AIEngine] Error: Prompt cannot be null, empty, or invalid.";
      log.error(errorMsg);
      throw new Error(errorMsg);
    }

    // The prompt is now a JSON string payload for multimodal chat completion
    let body;
    try {
      body = JSON.parse(prompt);
    } catch (error) {
      const errorMsg = "[AIEngine] Error: Prompt is not a valid JSON string.";
      log.error(errorMsg, error);
      throw new Error(errorMsg);
    }

    const urlsToTry = Array.isArray(this.url) ? this.url : [this.url];
    let lastError = null;

    for (const url of urlsToTry) {
      try {
        log.log(`[AIEngine] Sending request to vLLM API at: ${url}`);

        const headers = {};
        if (this.apiKey) {
          headers["Authorization"] = `Bearer ${this.apiKey}`;
        }

        const response = await APIService.post(url, body, headers);
        log.log("[AIEngine] Received API response.");

        // Validate the structure of the response for chat completions and extract the message content
        if (response && Array.isArray(response.choices) && response.choices.length > 0 && response.choices[0].message && typeof response.choices[0].message.content === "string") {
          const processedText = response.choices[0].message.content.trim();
          log.log("[AIEngine] Successfully processed response message.");
          return processedText;
        } else {
          const errorMsg = "[AIEngine] Error: Invalid or unexpected response structure from ChatCompletion API.";
          log.error(errorMsg, response); // Log the problematic response object
          throw new Error(errorMsg);
        }
      } catch (error) {
        log.error(`[AIEngine] Error connecting to ${url}:`, error.message);
        lastError = error;
      }
    }

    // If we reach here, all URLs failed
    log.error("[AIEngine] All configured vLLM API URLs failed.");
    throw lastError || new Error("All configured vLLM API URLs failed.");
  }
}