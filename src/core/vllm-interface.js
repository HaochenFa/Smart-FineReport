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
    if (!config || !config.url) {
      const errorMsg = "AIEngine Error: Configuration object must contain a 'url'.";
      log.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.url = config.url;
    this.apiKey = config.apiKey; // Can be undefined if not provided

    log.log(`[AIEngine] Initialized with URL: ${this.url}`);
  }

  /**
   * @description Send prompt and process returned response
   * @param {string} prompt - The user prompt to send to the AI.
   * @return {Promise<string>} - Processed return text from the AI.
   */
  async getResponse(prompt) {
    log.log(`[AIEngine] Preparing to send prompt...`);

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      const errorMsg = "[AIEngine] Error: Prompt cannot be null, empty, or invalid.";
      log.error(errorMsg);
      throw new Error(errorMsg);
    }

    const headers = {};
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // OpenAI-compatible API (vLLM)
    const body = {
      prompt: prompt,
      max_tokens: 1024,
      temperature: 0.7,
      n: 1,
      stream: false,
    };

    try {
      log.log('[AIEngine] Sending request to vLLM API...');
      const response = await APIService.post(this.url, body, headers);
      log.log('[AIEngine] Received API response.');

      // Validate the structure of the response and extract the text
      if (response && Array.isArray(response.choices) && response.choices.length > 0 && response.choices[0].text) {
        const processedText = response.choices[0].text.trim();
        log.log('[AIEngine] Successfully processed response text.');
        return processedText;
      } else {
        const errorMsg = "[AIEngine] Error: Invalid or unexpected response structure from API.";
        log.error(errorMsg, response); // Log the problematic response object
        throw new Error(errorMsg);
      }
    } catch (error) {
      // The APIService already logs the initial error, we can add context here.
      log.error('[AIEngine] An error occurred during the getResponse process.');
      // Re-throw the error to allow the caller to handle it.
      throw error;
    }
  }
}