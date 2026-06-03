const judge0Adapter = require("../lib/judge0Adapter");

/**
 * Template Method: the shared skeleton for evaluating code against a set of
 * test cases. `runCode` (visible tests) and the submission worker (hidden tests)
 * both call this — they only differ in WHICH test cases they pass and what they
 * do with the parsed result.
 *
 * Steps: build batch → execute via Judge0 (Adapter + circuit breaker) → parse.
 */
async function evaluateTestcases(code, language, testcases) {
  const languageId = judge0Adapter.getLanguageId(language);

  const submissions = testcases.map((tc) => ({
    source_code: code,
    language_id: languageId,
    stdin: tc.input,
    expected_output: tc.output,
  }));

  const results = await judge0Adapter.execute(submissions);

  // Parse Judge0 results into a verdict. status_id 3 = Accepted, 4 = Wrong Answer,
  // others = runtime/compile error.
  let testCasesPassed = 0;
  let runtime = 0;
  let memory = 0;
  let status = "accepted";
  let errorMessage = null;

  for (const test of results) {
    if (test.status_id === 3) {
      testCasesPassed++;
      runtime += parseFloat(test.time) || 0;
      memory = Math.max(memory, test.memory || 0);
    } else if (test.status_id === 4) {
      status = "wrong";
      errorMessage = test.stderr;
    } else {
      status = "error";
      errorMessage = test.stderr || test.compile_output;
    }
  }

  return {
    results,
    testCasesPassed,
    testCasesTotal: testcases.length,
    runtime,
    memory,
    status,        // 'accepted' | 'wrong' | 'error'
    errorMessage,
  };
}

module.exports = { evaluateTestcases };
