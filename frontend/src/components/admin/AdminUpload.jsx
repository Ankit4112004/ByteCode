import { useParams } from 'react-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import axiosClient from '../../utils/axiosClient'

function AdminUpload(){
    
    const {problemId}  = useParams();
    
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedVideo, setUploadedVideo] = useState(null);
    
      const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset,
        setError,
        clearErrors
      } = useForm();
    
      const selectedFile = watch('videoFile')?.[0];
    
      // Upload video to Cloudinary
      const onSubmit = async (data) => {
        const file = data.videoFile[0];
        
        setUploading(true);
        setUploadProgress(0);
        clearErrors();
    
        try {
          // Step 1: Get upload signature from backend
          const signatureResponse = await axiosClient.get(`/video/create/${problemId}`);
          const { signature, timestamp, public_id, api_key, cloud_name, upload_url } = signatureResponse.data;
    
          // Step 2: Create FormData for Cloudinary upload
          const formData = new FormData();
          formData.append('file', file);
          formData.append('signature', signature);
          formData.append('timestamp', timestamp);
          formData.append('public_id', public_id);
          formData.append('api_key', api_key);
    
          // Step 3: Upload directly to Cloudinary
          const uploadResponse = await axios.post(upload_url, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(progress);
            },
          });
    
          const cloudinaryResult = uploadResponse.data;
    
          // Step 4: Save video metadata to backend
          const metadataResponse = await axiosClient.post('/video/save', {
            problemId:problemId,
            cloudinaryPublicId: cloudinaryResult.public_id,
            secureUrl: cloudinaryResult.secure_url,
            duration: cloudinaryResult.duration,
          });
    
          setUploadedVideo(metadataResponse.data.videoSolution);
          reset(); // Reset form after successful upload
          
        } catch (err) {
          console.error('Upload error:', err);
          setError('root', {
            type: 'manual',
            message: err.response?.data?.message || 'Upload failed. Please try again.'
          });
        } finally {
          setUploading(false);
          setUploadProgress(0);
        }
      };
    
      // Format file size
      const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };
    
      // Format duration
      const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };
    
      return (
        <div className="container mx-auto p-4 sm:p-8 max-w-2xl">
          <div className="mb-8 border-b border-white/10 pb-4">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Upload Video Solution
            </h1>
            <p className="text-gray-400 mt-2 text-sm">Upload a video explanation to Cloudinary and attach it to this problem.</p>
          </div>
    
          <div className="bg-[#151515] border border-white/5 shadow-2xl rounded-xl p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* File Input */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-400 font-medium">Select Video File (Max 100MB)</span>
                </label>
                <div className="relative mt-2">
                  <input
                    type="file"
                    accept="video/*"
                    {...register('videoFile', {
                      required: 'Please select a video file',
                      validate: {
                        isVideo: (files) => {
                          if (!files || !files[0]) return 'Please select a video file';
                          const file = files[0];
                          return file.type.startsWith('video/') || 'Please select a valid video file';
                        },
                        fileSize: (files) => {
                          if (!files || !files[0]) return true;
                          const file = files[0];
                          const maxSize = 100 * 1024 * 1024; // 100MB
                          return file.size <= maxSize || 'File size must be less than 100MB';
                        }
                      }
                    })}
                    className={`block w-full text-sm text-gray-400
                      file:mr-4 file:py-3 file:px-6
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-600/10 file:text-indigo-500
                      hover:file:bg-indigo-600/20 file:transition-colors file:cursor-pointer
                      bg-black/50 border ${errors.videoFile ? 'border-red-500/50' : 'border-white/10'} rounded-lg focus:outline-none`}
                    disabled={uploading}
                  />
                </div>
                {errors.videoFile && (
                  <span className="text-red-400 text-xs mt-2">{errors.videoFile.message}</span>
                )}
              </div>
  
              {/* Selected File Info */}
              {selectedFile && !uploading && !uploadedVideo && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-200 text-sm">{selectedFile.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
              )}
  
              {/* Upload Progress */}
              {uploading && (
                <div className="bg-black/40 border border-white/5 rounded-xl p-6 space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="font-bold text-gray-200">Uploading Video...</h3>
                      <p className="text-xs text-gray-500 mt-1">Please do not close this window</p>
                    </div>
                    <span className="text-2xl font-black text-indigo-500">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
  
              {/* Error Message */}
              {errors.root && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <h3 className="font-bold text-red-500 text-sm">Upload Failed</h3>
                    <p className="text-xs text-red-400/80 mt-1">{errors.root.message}</p>
                  </div>
                </div>
              )}
  
              {/* Success Message */}
              {uploadedVideo && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-400 text-lg">Upload Successful!</h3>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-wider">Duration</p>
                        <p className="text-sm text-emerald-400/90 font-medium">{formatDuration(uploadedVideo.duration)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-wider">Time</p>
                        <p className="text-sm text-emerald-400/90 font-medium">{new Date(uploadedVideo.uploadedAt).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
  
              {/* Upload Button */}
              <div className="pt-6 border-t border-white/5 flex justify-end">
                <button
                  type="submit"
                  disabled={uploading}
                  className={`bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : 'shadow-indigo-600/20'}`}
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      Upload Video
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
}


export default AdminUpload;