const CircuitBreaker = require("opossum");
const { getLanguageById, submitBatch, submitToken } = require("../utils/problemUtility");

  

async function executeRaw(submissions) {
  const submitResult = await submitBatch(submissions);
  if (!submitResult || !Array.isArray(submitResult)) {
    throw new Error("Judge0 submitBatch failed");
  }

  const tokens = submitResult.map((v) => v.token);
  const results = await submitToken(tokens); 
  return results;
}

const breaker = new CircuitBreaker(executeRaw, {
  timeout: 20000,                 
  errorThresholdPercentage: 50,   
  resetTimeout: 30000,            
  volumeThreshold: 5,             
  name: "judge0",
});

breaker.on("open", () => console.warn("Judge0 circuit OPEN — failing fast"));
breaker.on("halfOpen", () => console.warn("Judge0 circuit HALF-OPEN — probing"));
breaker.on("close", () => console.warn("Judge0 circuit CLOSED — recovered"));

const judge0Adapter = {
  getLanguageId: (language) => getLanguageById(language),
  execute: (submissions) => breaker.fire(submissions),
  breaker, 
};

module.exports = judge0Adapter;
