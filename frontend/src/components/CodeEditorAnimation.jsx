import { useEffect, useState } from "react";

/* ===================== CODE SNIPPETS ===================== */
const snippets = [
  {
    lang: "Python",
    code: [
      "# Two Sum Problem",
      "def two_sum(nums, target):",
      "    seen = {}",
      "    for i, num in enumerate(nums):",
      "        diff = target - num",
      "        if diff in seen:",
      "            return [seen[diff], i]",
      "        seen[num] = i",
      "    return []",
    ],
  },
  {
    lang: "C++",
    code: [
      "// Calculate sum of array",
      "int calculateSum(int arr[], int n) {",
      "    int sum = 0;",
      "    for (int i = 0; i < n; i++) {",
      "        sum += arr[i];",
      "    }",
      "    return sum;",
      "}",
      "// Output: 15",
    ],
  },
  {
    lang: "Java",
    code: [
      "// Calculate sum of array",
      "public static int calculateSum(int[] arr, int n) {",
      "    int sum = 0;",
      "    for (int i = 0; i < n; i++) {",
      "        sum += arr[i];",
      "    }",
      "    return sum;",
      "}",
    ],
  },
];




/* ===================== HTML ESCAPE ===================== */
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ===================== SYNTAX HIGHLIGHTER ===================== */
function highlight(line) {
  let code = escapeHtml(line);

  code = code.replace(
    /\b(int|return|for|if|def|in|public|static|void)\b/g,
    '<span class="token-keyword">$1</span>'
  );

  code = code.replace(
    /\b(calculateSum|two_sum|enumerate)\b/g,
    '<span class="token-function">$1</span>'
  );

  code = code.replace(/\b\d+\b/g, '<span class="token-number">$&</span>');

  code = code.replace(
    /(\/\/.*$|#.*$)/g,
    '<span class="token-comment">$1</span>'
  );

  return code;
}

/* ===================== COMPONENT ===================== */
export default function CodeEditorAnimation() {
  const [snippetIndex, setSnippetIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [lines, setLines] = useState([]);

  useEffect(() => {
    const snippet = snippets[snippetIndex];

    if (lineIndex < snippet.code.length) {
      const timer = setTimeout(() => {
        setLines((p) => [...p, snippet.code[lineIndex]]);
        setLineIndex((p) => p + 1);
      }, 250);

      return () => clearTimeout(timer);
    } else {
      const reset = setTimeout(() => {
        setLines([]);
        setLineIndex(0);
        setSnippetIndex((p) => (p + 1) % snippets.length);
      }, 2500);

      return () => clearTimeout(reset);
    }
  }, [lineIndex, snippetIndex]);

  return (
    <div className="bg-[#0f0f0f] border border-white/10 rounded-xl shadow-2xl w-[520px]">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 bg-white/5 border-b border-white/10">
        <span className="text-xs text-gray-400 bg-white/10 px-3 py-1 rounded">
          {snippets[snippetIndex].lang}
        </span>
        <span className="text-xs bg-orange-600 px-4 py-1 rounded text-white">
          Run
        </span>
      </div>

      {/* Code */}
      <pre className="p-5 text-sm font-mono text-gray-200 bg-black/60 h-80 overflow-hidden">
        {lines.map((line, i) => {
          const isLast = i === lines.length - 1;
          return (
            <div
              key={i}
              dangerouslySetInnerHTML={{
                __html:
                  highlight(line) +
                  (isLast ? '<span class="cursor"></span>' : ""),
              }}
            />
          );
        })}
      </pre>
    </div>
  );
}
