const CircuitBreaker = require("opossum");
const { getLanguageById, submitBatch, submitToken } = require("../utils/problemUtility");

  // Adapter pattern: a single clean interface in front of Judge0 (RapidAPI).

async function executeRaw(submissions) {
  const submitResult = await submitBatch(submissions);
  if (!submitResult || !Array.isArray(submitResult)) {
    throw new Error("Judge0 submitBatch failed");
  }

  const tokens = submitResult.map((v) => v.token);
  const results = await submitToken(tokens); // throws on timeout (see problemUtility)
  return results;
}

const breaker = new CircuitBreaker(executeRaw, {
  timeout: 20000,                 // a batch must resolve within 20s
  errorThresholdPercentage: 50,   // open once half of recent calls fail
  resetTimeout: 30000,            // stay open 30s, then probe
  volumeThreshold: 5,             // need >=5 calls in the window before it can trip
  name: "judge0",
});

breaker.on("open", () => console.warn("Judge0 circuit OPEN — failing fast"));
breaker.on("halfOpen", () => console.warn("Judge0 circuit HALF-OPEN — probing"));
breaker.on("close", () => console.warn("Judge0 circuit CLOSED — recovered"));

const judge0Adapter = {
  getLanguageId: (language) => getLanguageById(language),
  execute: (submissions) => breaker.fire(submissions),
  breaker, // exposed for tests/metrics
};

module.exports = judge0Adapter;
