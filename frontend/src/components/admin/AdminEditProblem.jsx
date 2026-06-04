import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../../utils/axiosClient';
import { useNavigate, useParams } from 'react-router';

const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp']),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
      explanation: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required')
    })
  ).min(1, 'At least one hidden test case required'),
  startCode: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).length(3, 'All three languages required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      completeCode: z.string().min(1, 'Complete code is required')
    })
  ).length(3, 'All three languages required')
});

function AdminEditProblem() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(problemSchema)
  });

  const { fields: visibleFields, append: appendVisible, remove: removeVisible } = useFieldArray({ control, name: 'visibleTestCases' });
  const { fields: hiddenFields, append: appendHidden, remove: removeHidden } = useFieldArray({ control, name: 'hiddenTestCases' });

  useEffect(() => {
    fetchProblem();
  }, [problemId]);

  const fetchProblem = async () => {
    try {
      const { data } = await axiosClient.get(`/problem/problemById/${problemId}`);
      // The API might return an array for tags, but the form expects a single string value from the enum
      let tagValue = 'array';
      if (Array.isArray(data.tags) && data.tags.length > 0) tagValue = data.tags[0];
      else if (typeof data.tags === 'string') tagValue = data.tags;

      reset({
        title: data.title,
        description: data.description,
        difficulty: data.difficulty.toLowerCase(),
        tags: tagValue,
        visibleTestCases: data.visibleTestCases || [],
        hiddenTestCases: data.hiddenTestCases || [],
        startCode: data.startCode || [
          { language: 'C++', initialCode: '' },
          { language: 'Java', initialCode: '' },
          { language: 'JavaScript', initialCode: '' }
        ],
        referenceSolution: data.referenceSolution || [
          { language: 'C++', completeCode: '' },
          { language: 'Java', completeCode: '' },
          { language: 'JavaScript', completeCode: '' }
        ]
      });
    } catch (err) {
      console.error(err);
      alert('Failed to load problem data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      await axiosClient.put(`/problem/update/${problemId}`, data);
      alert('Problem updated successfully!');
      navigate('/admin/update');
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><span className="loading loading-spinner loading-lg"></span></div>;

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-7xl">
      <div className="mb-8 border-b border-white/10 pb-4">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Edit Problem
        </h1>
        <p className="text-gray-400 mt-2 text-sm">Update the existing problem configuration and test cases.</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-[#151515] border border-white/5 shadow-xl rounded-xl p-8 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Basic Information
          </h2>
          
          <div className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-400 font-medium">Problem Title</span>
              </label>
              <input
                {...register('title')}
                placeholder="e.g. Two Sum"
                className={`w-full bg-black/50 border ${errors.title ? 'border-red-500/50' : 'border-white/10'} rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors`}
              />
              {errors.title && (
                <span className="text-red-400 text-xs mt-1">{errors.title.message}</span>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-400 font-medium">Problem Description (Markdown supported)</span>
              </label>
              <textarea
                {...register('description')}
                placeholder="Write a clear and concise description of the problem..."
                className={`w-full bg-black/50 border ${errors.description ? 'border-red-500/50' : 'border-white/10'} rounded-lg px-4 py-3 text-gray-200 h-40 focus:outline-none focus:border-indigo-500 transition-colors resize-y`}
              />
              {errors.description && (
                <span className="text-red-400 text-xs mt-1">{errors.description.message}</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-400 font-medium">Difficulty Level</span>
                </label>
                <div className="relative">
                  <select
                    {...register('difficulty')}
                    className={`w-full appearance-none bg-black/50 border ${errors.difficulty ? 'border-red-500/50' : 'border-white/10'} rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors`}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-400 font-medium">Primary Topic Tag</span>
                </label>
                <div className="relative">
                  <select
                    {...register('tags')}
                    className={`w-full appearance-none bg-black/50 border ${errors.tags ? 'border-red-500/50' : 'border-white/10'} rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors`}
                  >
                    <option value="array">Array</option>
                    <option value="linkedList">Linked List</option>
                    <option value="graph">Graph</option>
                    <option value="dp">Dynamic Programming</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Cases */}
        <div className="bg-[#151515] border border-white/5 shadow-xl rounded-xl p-8 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Test Cases Configuration
          </h2>
          
          <div className="space-y-4 mb-10">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h3 className="font-semibold text-gray-200">Visible Test Cases</h3>
              </div>
              <button
                type="button"
                onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-lg"
              >
                Add Visible Case
              </button>
            </div>
            
            <div className="space-y-4">
              {visibleFields.map((field, index) => (
                <div key={field.id} className="bg-black/20 border border-white/5 p-6 rounded-xl space-y-4 relative group">
                  <div className="absolute top-4 right-4">
                    <button type="button" onClick={() => removeVisible(index)} className="text-gray-500 hover:text-red-400 p-1">Delete</button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Input</label>
                      <input {...register(`visibleTestCases.${index}.input`)} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-gray-200 focus:outline-none focus:border-indigo-500 text-sm font-mono" />
                    </div>
                    <div className="form-control">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Expected Output</label>
                      <input {...register(`visibleTestCases.${index}.output`)} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-gray-200 focus:outline-none focus:border-indigo-500 text-sm font-mono" />
                    </div>
                  </div>
                  
                  <div className="form-control">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Explanation</label>
                    <input {...register(`visibleTestCases.${index}.explanation`)} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-gray-200 focus:outline-none focus:border-indigo-500 text-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h3 className="font-semibold text-gray-200">Hidden Evaluation Cases</h3>
              </div>
              <button
                type="button"
                onClick={() => appendHidden({ input: '', output: '' })}
                className="bg-[#2a2a2a] hover:bg-[#333] border border-white/10 text-gray-300 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-lg"
              >
                Add Hidden Case
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hiddenFields.map((field, index) => (
                <div key={field.id} className="bg-black/20 border border-white/5 p-4 rounded-xl flex flex-col gap-3 relative group">
                  <div className="absolute top-3 right-3">
                    <button type="button" onClick={() => removeHidden(index)} className="text-gray-500 hover:text-red-400 p-1">Delete</button>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1 block">Input</label>
                    <input {...register(`hiddenTestCases.${index}.input`)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-indigo-500 text-xs font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1 block">Expected Output</label>
                    <input {...register(`hiddenTestCases.${index}.output`)} className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-indigo-500 text-xs font-mono" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Code Templates */}
        <div className="bg-[#151515] border border-white/5 shadow-xl rounded-xl p-8 mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            Code Architecture & Templates
          </h2>
          
          <div className="space-y-10">
            {[0, 1, 2].map((index) => (
              <div key={index} className="space-y-4 border-b border-white/5 pb-8 last:border-0 last:pb-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center font-bold text-sm text-gray-200">
                    {index === 0 ? 'C++' : index === 1 ? '☕' : 'JS'}
                  </div>
                  <h3 className="font-semibold text-lg text-gray-200">
                    {index === 0 ? 'C++ Template' : index === 1 ? 'Java Template' : 'JavaScript Template'}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">User Starting Code</label>
                    <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden focus-within:border-indigo-500 transition-colors">
                      <div className="bg-white/5 px-4 py-2 border-b border-white/10 text-xs text-gray-500 font-mono flex items-center gap-2">
                        <span>Solution.{index === 0 ? 'cpp' : index === 1 ? 'java' : 'js'}</span>
                      </div>
                      <Controller
                        name={`startCode.${index}.initialCode`}
                        control={control}
                        render={({ field: { onChange, value } }) => (
                          <Editor
                            height="300px"
                            theme="vs-dark"
                            language={index === 0 ? 'cpp' : index === 1 ? 'java' : 'javascript'}
                            value={value}
                            onChange={onChange}
                            options={{
                              minimap: { enabled: false },
                              fontSize: 14,
                              scrollBeyondLastLine: false,
                              wordWrap: 'on'
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="form-control">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Master Reference Solution</label>
                    <div className="bg-[#0d0d0d] border border-white/10 rounded-xl overflow-hidden focus-within:border-emerald-500 transition-colors">
                      <div className="bg-white/5 px-4 py-2 border-b border-white/10 text-xs text-gray-500 font-mono flex items-center gap-2">
                        <span>Master.{index === 0 ? 'cpp' : index === 1 ? 'java' : 'js'}</span>
                      </div>
                      <Controller
                        name={`referenceSolution.${index}.completeCode`}
                        control={control}
                        render={({ field: { onChange, value } }) => (
                          <Editor
                            height="300px"
                            theme="vs-dark"
                            language={index === 0 ? 'cpp' : index === 1 ? 'java' : 'javascript'}
                            value={value}
                            onChange={onChange}
                            options={{
                              minimap: { enabled: false },
                              fontSize: 14,
                              scrollBeyondLastLine: false,
                              wordWrap: 'on'
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-10 py-4 rounded-xl font-bold text-lg transition-colors shadow-xl shadow-amber-600/20 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminEditProblem;
