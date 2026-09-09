const judge0Adapter = require("../lib/judge0Adapter");


async function evaluateTestcases(code, language, testcases) {
  const languageId = judge0Adapter.getLanguageId(language);

  const submissions = testcases.map((tc) => ({
    source_code: code,
    language_id: languageId,
    stdin: tc.input,
    expected_output: tc.output,
  }));

  const results = await judge0Adapter.execute(submissions);

  
  
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
    status,        
    errorMessage,
  };
}

module.exports = { evaluateTestcases };
