import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import {
  Video, FileText, BookOpen, Lightbulb, History, Bot,
  ChevronDown, Copy, Check, RotateCcw, Play, Send, Loader2,
  Clock, Cpu, CheckCircle2, XCircle, FlaskConical, BadgeCheck,
  Maximize2, Minimize2, LayoutGrid, Crown,
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import axiosClient from "../utils/axiosClient"
import socket from "../utils/socket";
import SubmissionHistory from "../components/problem/SubmissionHistory"
import ChatAi from '../components/chat/ChatAi';
import Editorial from '../components/problem/Editorial';


const langMap = {
        cpp: 'C++',
        java: 'Java',
        javascript: 'JavaScript'
};

const LANGUAGES = [
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
  { id: 'javascript', label: 'JavaScript' },
];

const LEFT_TABS = [
  { id: 'description', label: 'Description', icon: FileText },
  { id: 'editorial', label: 'Editorial', icon: BookOpen },
  { id: 'solutions', label: 'Solutions', icon: Lightbulb },
  { id: 'submissions', label: 'Submissions', icon: History },
  { id: 'chatAI', label: 'ChatAI', icon: Bot },

];

// default panel layouts
const DEFAULT_H = [50, 50];
const DEFAULT_V = [62, 38];

// Render `backtick` terms as inline code chips within a string.
const renderInline = (str) => {
  const parts = String(str).split(/(`[^`]+`)/g);
  return parts.map((p, idx) => {
    if (p.startsWith('`') && p.endsWith('`') && p.length > 2) {
      return (
        <code key={idx} className="px-2 py-1 mx-1 rounded bg-base-300/70 text-primary font-medium font-mono text-[0.85em]">
          {p.slice(1, -1)}
        </code>
      );
    }
    return <span key={idx}>{p}</span>;
  });
};

// Render a problem description: bold leading labels (e.g. "Input format:"),
// inline code for `backticks`, and breathing room between paragraphs.
const renderDescription = (text = '') =>
  text.split('\n').map((line, i) => {
    if (line.trim() === '') return <div key={i} className="h-3" />;
    const m = line.match(/^(\s*)([A-Z][A-Za-z ]{1,24}:)(.*)$/);
    if (m) {
      return (
        <p key={i} className="mb-1.5">
          <strong className="font-bold text-base-content">{m[2]}</strong>
          {renderInline(m[3])}
        </p>
      );
    }
    return <p key={i} className="mb-1.5">{renderInline(line)}</p>;
  });

// Soft, calm difficulty chips (low-opacity fill + matching text/border).
const difficultyChip = (difficulty) => {
  switch ((difficulty || '').toLowerCase()) {
    case 'easy':   return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'hard':   return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    default:       return 'bg-base-content/10 text-base-content/60 border-base-content/20';
  }
};

const ProblemPage = () => {
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('cpp');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [lastAction, setLastAction] = useState(null); // 'run' | 'submit'
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [openSolution, setOpenSolution] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedCase, setSelectedCase] = useState(0);
  const [maximized, setMaximized] = useState(null); // 'left' | 'editor' | 'console' | null
  const [leftPct, setLeftPct] = useState(DEFAULT_H[0]);   // width % of left panel
  const [editorPct, setEditorPct] = useState(DEFAULT_V[0]); // height % of editor
  const editorRef = useRef(null);
  const rootRef = useRef(null);   // horizontal container (left | right)
  const rightRef = useRef(null);  // vertical container (editor | console)
  const judgeTimeoutRef = useRef(null); // safety timeout if the socket verdict never arrives
  let {problemId}  = useParams();

  const user = useSelector((s) => s.auth.user);

  const { handleSubmit } = useForm();

  // Real-time: join our user room and listen for async submission verdicts.
  useEffect(() => {
    if (!user?._id) return;
    socket.emit("join", user._id);

    const onResult = (result) => {
      if (judgeTimeoutRef.current) { clearTimeout(judgeTimeoutRef.current); judgeTimeoutRef.current = null; }
      setSubmitResult(result);
      setLastAction('submit');
    };
    socket.on("submission:result", onResult);

    return () => {
      socket.off("submission:result", onResult);
      if (judgeTimeoutRef.current) clearTimeout(judgeTimeoutRef.current);
    };
  }, [user]);

 useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {

        const response = await axiosClient.get(`/problem/problemById/${problemId}`);

        const initialCode = response.data.startCode.find(sc => sc.language === langMap[selectedLanguage]).initialCode;

        setProblem(response.data);

        setCode(initialCode);
        setLoading(false);

      } catch (error) {
        console.error('Error fetching problem:', error);
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  // Update code when language changes
  useEffect(() => {
    if (problem) {
      const initialCode = problem.startCode.find(sc => sc.language === langMap[selectedLanguage]).initialCode;
      setCode(initialCode);
    }
  }, [selectedLanguage, problem]);

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    document.activeElement?.blur(); // close the dropdown
  };

  const handleResetCode = () => {
    if (!problem) return;
    const initial = problem.startCode.find(sc => sc.language === langMap[selectedLanguage])?.initialCode || '';
    setCode(initial);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  // ---- Resizable layout controls ----
  const resetLayout = () => {
    setLeftPct(DEFAULT_H[0]);
    setEditorPct(DEFAULT_V[0]);
    setMaximized(null);
  };

  const toggleMaximize = (region) => {
    if (maximized === region) { resetLayout(); return; }
    if (region === 'left') {
      setLeftPct(100);
    } else if (region === 'editor') {
      setLeftPct(0);
      setEditorPct(100);
    } else if (region === 'console') {
      setLeftPct(0);
      setEditorPct(0);
    }
    setMaximized(region);
  };

  // Drag the vertical divider (left | right)
  const startHDrag = (e) => {
    e.preventDefault();
    setMaximized(null);
    const onMove = (ev) => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(88, Math.max(12, pct)));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  // Drag the horizontal divider (editor | console)
  const startVDrag = (e) => {
    e.preventDefault();
    setMaximized(null);
    const onMove = (ev) => {
      const rect = rightRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pct = ((ev.clientY - rect.top) / rect.height) * 100;
      setEditorPct(Math.min(92, Math.max(8, pct)));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';
  };

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    setLastAction('run');

    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage
      });

      setRunResult(response.data);
      setLoading(false);

    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: error.response?.data?.error || 'Could not run your code. Please try again.'
      });
      setLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    // Async pipeline: POST returns 202 immediately; the verdict arrives later
    // over the websocket (submission:result). Show a "judging" state until then.
    setSubmitResult({ status: 'pending' });
    setLastAction('submit');

    // Safety net: if the websocket verdict never arrives (missed event, worker
    // down), stop the spinner after 45s and point the user at the Submissions tab.
    if (judgeTimeoutRef.current) clearTimeout(judgeTimeoutRef.current);
    judgeTimeoutRef.current = setTimeout(() => {
      judgeTimeoutRef.current = null;
      setSubmitResult((prev) => (prev && prev.status === 'pending' ? { status: 'timeout' } : prev));
    }, 45000);

    try {
      await axiosClient.post(`/submission/submit/${problemId}`, {
        code: code,
        language: selectedLanguage
      });
      // result handled by the socket listener
    } catch (error) {
      console.error('Error submitting code:', error);
      if (judgeTimeoutRef.current) { clearTimeout(judgeTimeoutRef.current); judgeTimeoutRef.current = null; }
      setSubmitResult({ status: 'error', error: error.response?.data || 'Submission failed' });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "'") {
        e.preventDefault();
        handleRun();
      }
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleSubmitCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [handleRun, handleSubmitCode]);

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  const isJudging = submitResult?.status === 'pending';
  const currentLangLabel = LANGUAGES.find(l => l.id === selectedLanguage)?.label;

  if (loading && !problem) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const StatChip = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-2 rounded-lg bg-base-300/60 px-3 py-1.5 text-sm">
      <Icon className="w-4 h-4 text-base-content/40" />
      <span className="text-base-content/50">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );

  // Maximize/restore toggle for a region
  const MaxBtn = ({ region, title }) => (
    <button
      onClick={() => toggleMaximize(region)}
      title={maximized === region ? 'Restore layout' : title}
      className={`p-1.5 rounded-md text-base-content/45 hover:text-base-content hover:bg-base-content/10 transition-all ${
        region !== 'editor' ? 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100' : ''
      }`}
    >
      {maximized === region ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
    </button>
  );

  // ---- Console: visible test cases + run/submit output, all in one view ----
  const renderConsole = () => {
    const visibleCases = problem?.visibleTestCases || [];
    const sel = Math.min(selectedCase, Math.max(visibleCases.length - 1, 0));
    const tc = visibleCases[sel];
    const runCase = lastAction === 'run' ? runResult?.testCases?.[sel] : null;

    return (
      <div className="space-y-4">
        {/* Submission verdict (hidden tests) */}
        {lastAction === 'submit' && (
          isJudging ? (
            <div className="flex items-center gap-3 rounded-lg border border-primary/25 bg-primary/10 px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-base-content/70">Judging against hidden test cases…</span>
            </div>
          ) : submitResult?.status === 'timeout' ? (
            <div className="flex items-center gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-base-content/70">
                Still judging… check the <strong>Submissions</strong> tab in a moment for the result.
              </span>
            </div>
          ) : submitResult?.accepted ? (
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
                <CheckCircle2 className="w-5 h-5" /> Accepted
              </div>
              <div className="flex flex-wrap gap-2">
                <StatChip icon={BadgeCheck} label="Passed" value={`${submitResult.passedTestCases}/${submitResult.totalTestCases}`} />
                <StatChip icon={Clock} label="Runtime" value={`${submitResult.runtime} s`} />
                <StatChip icon={Cpu} label="Memory" value={`${submitResult.memory} KB`} />
              </div>
            </div>
          ) : submitResult ? (
            <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-4 py-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold capitalize">
                <XCircle className="w-5 h-5" /> {submitResult.error || submitResult.status || 'Rejected'}
              </div>
              {submitResult.passedTestCases !== undefined && (
                <div className="mt-2">
                  <StatChip icon={BadgeCheck} label="Passed" value={`${submitResult.passedTestCases}/${submitResult.totalTestCases}`} />
                </div>
              )}
            </div>
          ) : null
        )}

        {/* Run summary line */}
        {lastAction === 'run' && runResult && (
          <div className={`flex items-center gap-2 text-sm font-semibold ${runResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
            {runResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {runResult.success ? 'All test cases passed' : (runResult.error || 'Some test cases failed')}
            {runResult.success && (
              <span className="text-base-content/40 font-normal">· {runResult.runtime}s · {runResult.memory}KB</span>
            )}
          </div>
        )}

        {/* Test case pills + selected case detail (always visible) */}
        {visibleCases.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2">
              {visibleCases.map((_, i) => {
                const r = lastAction === 'run' ? runResult?.testCases?.[i] : null;
                const passed = r ? r.status_id == 3 : null;
                const active = sel === i;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedCase(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                      ${active ? 'bg-base-content/10 text-base-content' : 'text-base-content/45 hover:bg-base-content/5'}`}
                  >
                    {passed !== null && (
                      <span className={`w-1.5 h-1.5 rounded-full ${passed ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    )}
                    Case {i + 1}
                  </button>
                );
              })}
            </div>

            {tc && (
              <div className="space-y-3 text-sm font-mono">
                <div>
                  <div className="text-xs text-base-content/45 mb-1.5 select-none">Input</div>
                  <div className="rounded-md bg-base-300/40 border border-base-content/10 px-3 py-2.5 break-words">{tc.input}</div>
                </div>
                <div>
                  <div className="text-xs text-base-content/45 mb-1.5 select-none">Expected</div>
                  <div className="rounded-md bg-base-300/40 border border-base-content/10 px-3 py-2.5 break-words">{tc.output}</div>
                </div>
                {runCase && (
                  <div>
                    <div className="text-xs text-base-content/45 mb-1.5 select-none">Output</div>
                    <div className={`rounded-md px-3 py-2.5 break-words border ${runCase.status_id == 3 ? 'border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-200' : 'border-rose-500/30 bg-rose-500/[0.06] text-rose-200'}`}>
                      {runCase.stdout ?? '—'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-base-content/35 gap-2">
            <FlaskConical className="w-8 h-8" />
            <p className="text-sm">No test cases available.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="problem-page h-screen flex flex-col bg-base-100 text-base-content overflow-hidden">
      <div ref={rootRef} className="flex-1 min-h-0 flex">

        {/* ===================== LEFT PANEL ===================== */}
        <div style={{ width: `${leftPct}%` }} className="min-w-0 h-full overflow-hidden">
          <section className="group h-full flex flex-col min-h-0">
            {/* Tabs */}
            <div className="flex items-center border-b border-base-content/10 bg-base-200/30">
              <div className="flex items-center gap-1 px-2 overflow-x-auto flex-1 no-scrollbar">
                {LEFT_TABS.map(({ id, label, icon: Icon }) => {
                  const on = activeLeftTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveLeftTab(id)}
                      className={`relative flex items-center gap-1.5 whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors
                        ${on ? 'text-primary' : 'text-base-content/50 hover:text-base-content/80'}`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                      <span className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-all ${on ? 'bg-primary' : 'bg-transparent'}`} />
                    </button>
                  );
                })}
              </div>
              <div className="px-1.5"><MaxBtn region="left" title="Maximize description" /></div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0 thin-scroll">
              {problem && (
                <>
                  {activeLeftTab === 'description' && (
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-5">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                          {problem.title}
                          {(Array.isArray(problem.tags) ? problem.tags.includes("premium") : problem.tags === "premium") && (
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/15 text-yellow-500" title="Premium Problem">
                              <Crown className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {(Array.isArray(problem.tags) ? problem.tags.includes("video") : problem.tags === "video") && (
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/15 text-blue-500" title="Video Solution Available">
                              <Video className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </h1>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${difficultyChip(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {Array.isArray(problem.tags) ? problem.tags.filter(t => t !== 'premium' && t !== 'video').map(tag => (
                          <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">{tag}</span>
                        )) : (
                          problem.tags !== 'premium' && problem.tags !== 'video' && (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">{problem.tags}</span>
                          )
                        )}
                      </div>

                      <div className="text-[0.95rem] leading-[1.85] [word-spacing:0.06em] text-base-content/85">
                        {renderDescription(problem.description)}
                      </div>

                      <div className="mt-8">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-4">Examples</h3>
                        <div className="space-y-4">
                          {problem.visibleTestCases.map((example, index) => (
                            <div key={index} className="rounded-xl border border-base-content/10 bg-base-200/40 overflow-hidden">
                              <div className="px-4 py-2 border-b border-base-content/10 text-xs font-semibold text-base-content/60">
                                Example {index + 1}
                              </div>
                              <div className="p-4 space-y-3 text-sm font-mono">
                                <div>
                                  <span className="text-xs font-bold uppercase tracking-wider text-sky-300 select-none">Input</span>
                                  <div className="mt-1.5 rounded-md bg-base-300/60 px-3 py-2 break-words">{example.input}</div>
                                </div>
                                <div>
                                  <span className="text-xs font-bold uppercase tracking-wider text-violet-300 select-none">Output</span>
                                  <div className="mt-1.5 rounded-md bg-base-300/60 px-3 py-2 break-words">{example.output}</div>
                                </div>
                                <div>
                                  <span className="text-xs font-bold uppercase tracking-wider text-base-content/50 select-none">Explanation</span>
                                  <div className="mt-1.5 text-base-content/70 font-sans leading-relaxed">{example.explanation}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeLeftTab === 'editorial' && (
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-4">Editorial</h2>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        <Editorial
                          secureUrl={problem.secureUrl}
                          thumbnailUrl={problem.thumbnailUrl}
                          duration={problem.duration}
                          editorialText={problem.editorialText}
                          timeComplexity={problem.timeComplexity}
                          spaceComplexity={problem.spaceComplexity}
                        />
                      </div>
                    </div>
                  )}

                  {activeLeftTab === 'solutions' && (
                    <div className="h-full flex flex-col">
                      <div className="space-y-4 pb-4">
                        {problem.referenceSolution?.length > 0 ? problem.referenceSolution.map((solution, index) => {
                          const lineCount = solution?.completeCode?.split('\n').length || 10;
                          const editorHeight = Math.max(150, lineCount * 21 + 40);
                          const isOpen = openSolution === index;

                          return (
                          <div key={index} className={`collapse rounded-xl border border-base-content/10 bg-base-200/30 overflow-hidden transition-all ${isOpen ? 'collapse-open' : 'collapse-close'}`}>
                            <div 
                              className="collapse-title text-sm px-4 py-3 min-h-0 bg-base-300/60 hover:bg-base-300/80 border-b border-base-content/10 flex items-center justify-between cursor-pointer select-none transition-colors"
                              onClick={() => setOpenSolution(isOpen ? null : index)}
                            >
                              <span className="text-base-content/90 font-medium tracking-wide">{langMap[solution?.language?.toLowerCase()] || solution?.language}</span>
                              <ChevronDown className={`w-4 h-4 text-base-content/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                            </div>
                            <div className="collapse-content p-0">
                              {isOpen && (
                                <div style={{ height: `${editorHeight}px` }} className="w-full">
                                  <Editor
                                    height="100%"
                                    language={getLanguageForMonaco(solution?.language?.toLowerCase() || 'javascript')}
                                    value={solution?.completeCode}
                                    theme="vs-dark"
                                    options={{
                                      fontSize: 14,
                                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                      fontLigatures: true,
                                      minimap: { enabled: false },
                                      scrollBeyondLastLine: false,
                                      readOnly: true,
                                      wordWrap: 'on',
                                      padding: { top: 16, bottom: 16 },
                                      domReadOnly: true,
                                      automaticLayout: true,
                                      scrollbar: { alwaysConsumeMouseWheel: false }
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}) : <p className="text-base-content/40 text-sm">Solutions will be available after you solve the problem.</p>}
                      </div>
                    </div>
                  )}

                  {activeLeftTab === 'submissions' && (
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-4">My Submissions</h2>
                      <SubmissionHistory problemId={problemId} />
                    </div>
                  )}

                  {activeLeftTab === 'chatAI' && (
                    <div className="h-full">
                      <ChatAi problem={problem}></ChatAi>
                    </div>
                  )}


                </>
              )}
            </div>
          </section>
        </div>

        <div onMouseDown={startHDrag} className="rrp-handle-h cursor-col-resize shrink-0" />

        {/* ===================== RIGHT PANEL ===================== */}
        <div ref={rightRef} className="flex-1 min-w-0 h-full flex flex-col">

            {/* ---------- EDITOR ---------- */}
            <div style={{ height: `${editorPct}%` }} className="min-h-0">
              <div className="group h-full flex flex-col min-h-0">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-base-content/10 bg-base-200/30">
                  {/* Language dropdown */}
                  <div className="dropdown">
                    <div
                      tabIndex={0}
                      role="button"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-base-200 hover:bg-base-300 border border-base-content/10 transition-colors"
                    >
                      {currentLangLabel}
                      <ChevronDown className="w-4 h-4 opacity-60" />
                    </div>
                    <ul tabIndex={0} className="dropdown-content menu z-20 mt-1 p-1 w-40 bg-base-100 rounded-lg border border-base-content/10 shadow-xl">
                      {LANGUAGES.map((lang) => (
                        <li key={lang.id}>
                          <button
                            onClick={() => handleLanguageChange(lang.id)}
                            className={`text-sm ${selectedLanguage === lang.id ? 'text-primary font-semibold' : ''}`}
                          >
                            {lang.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button onClick={handleCopyCode} title="Copy code"
                      className="p-1.5 rounded-md text-base-content/45 hover:text-base-content hover:bg-base-content/10 transition-colors">
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={handleResetCode} title="Reset to starter code"
                      className="p-1.5 rounded-md text-base-content/45 hover:text-base-content hover:bg-base-content/10 transition-colors">
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <div className="w-px h-5 bg-base-content/10 mx-1" />

                    <div className="relative group/run inline-flex">
                      <button
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-base-content/80 hover:bg-base-content/10 disabled:opacity-50 transition-colors"
                        onClick={handleRun}
                        disabled={loading}
                      >
                        {loading && lastAction === 'run' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-emerald-400" />}
                        Run
                      </button>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-base-300 rounded-md opacity-0 group-hover/run:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 flex items-center gap-1 shadow-xl border border-base-content/10">
                        <span className="text-xs font-semibold text-base-content/70">Ctrl</span>
                        <span className="text-xs font-semibold text-base-content/70">+</span>
                        <span className="text-sm font-mono font-bold text-base-content/70">'</span>
                      </div>
                    </div>

                    <div className="relative group/submit inline-flex">
                      <button
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        onClick={handleSubmitCode}
                        disabled={loading || isJudging}
                      >
                        {isJudging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Submit
                      </button>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-base-300 rounded-md opacity-0 group-hover/submit:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 flex items-center gap-1 shadow-xl border border-base-content/10">
                        <span className="text-xs font-semibold text-base-content/70">Ctrl</span>
                        <span className="text-xs font-semibold text-base-content/70">+</span>
                        <span className="text-xs font-semibold text-base-content/70">Enter</span>
                      </div>
                    </div>

                    <div className="w-px h-5 bg-base-content/10 mx-1" />
                    <MaxBtn region="editor" title="Maximize editor" />
                  </div>
                </div>

                {/* Monaco */}
                <div className="flex-1 min-h-0">
                  <Editor
                    height="100%"
                    language={getLanguageForMonaco(selectedLanguage)}
                    value={code}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    theme="vs-dark"
                    options={{
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontLigatures: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      insertSpaces: true,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      glyphMargin: false,
                      folding: true,
                      lineDecorationsWidth: 10,
                      lineNumbersMinChars: 3,
                      renderLineHighlight: 'line',
                      selectOnLineNumbers: true,
                      roundedSelection: false,
                      readOnly: false,
                      cursorStyle: 'line',
                      padding: { top: 14 },
                      mouseWheelZoom: true,
                    }}
                  />
                </div>
              </div>
            </div>

            <div onMouseDown={startVDrag} className="rrp-handle-v cursor-row-resize shrink-0" />

            {/* ---------- CONSOLE ---------- */}
            <div className="flex-1 min-h-0">
              <div className="group h-full flex flex-col bg-base-200/20 min-h-0">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-base-content/10">
                  <span className="text-[13px] font-semibold text-base-content/55">Console</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={resetLayout} title="Reset layout"
                      className="p-1.5 rounded-md text-base-content/45 hover:text-base-content hover:bg-base-content/10 transition-colors">
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <MaxBtn region="console" title="Maximize console" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 min-h-0 thin-scroll">
                  {renderConsole()}
                </div>
              </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ProblemPage;
