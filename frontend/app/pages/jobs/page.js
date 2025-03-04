"use client"
import axios from 'axios';
import React, { useState } from 'react'

const Page = () => {
    const [resume, setResume] = useState(null);
    const [resumeText, setResumeText] = useState("");
    const [jobs, setJobs] = useState([]);
    const [evaluation, setEvaluation] = useState("");
    const [selectedJob, setSelectedJob] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleFileChange = (e) => {
        setResume(e.target.files[0]);
        setMessage("File selected: " + e.target.files[0].name);
    };

    const handleUpload = async () => {
        if (!resume) {
            setMessage("Please select a resume before uploading.");
            return;
        }
        setLoading(true);
        setMessage("Uploading and parsing resume...");
        const formData = new FormData();
        formData.append("resume", resume);
        try {
            const response = await axios.post("http://localhost:5000/parse-resume", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setResumeText(response.data);
            setMessage("Resume parsed successfully.");
        } catch (error) {
            setMessage("Error parsing resume.");
        }
        setLoading(false);
    };

    const handleMatchCandidate = async () => {
        if (!resumeText) {
            setMessage("Please upload and parse a resume first.");
            return;
        }
        setLoading(true);
        setMessage("Matching candidate with job descriptions...");
        try {
            const response = await axios.post("http://localhost:5000/match-candidate", { resumeText });
            setJobs(response.data.jobs);
            setMessage("Matching completed.");
        } catch (error) {
            setMessage("Error in matching candidate.");
        }
        setLoading(false);
    };

    const handleEvaluate = async () => {
        if (!selectedJob) {
            setMessage("Please select a job before evaluation.");
            return;
        }
        setLoading(true);
        setMessage("Evaluating candidate...");
        try {
            const response = await axios.post("http://localhost:5000/evaluate-candidate", { resumeText, jobDescription: selectedJob });
            setEvaluation(response.data.evaluation);
            setMessage("Evaluation completed.");
        } catch (error) {
            setMessage("Error in evaluation.");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-gray-100 rounded-lg shadow-lg mt-10">
            <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">Resume Matcher</h1>
            
            {message && <div className="mb-4 p-2 bg-yellow-200 text-yellow-800 rounded-md text-center">{message}</div>}
            
            <div className="flex flex-col items-center space-y-4">
                <input type="file" onChange={handleFileChange} className="p-2 border border-gray-300 rounded-md" />
                <button onClick={handleUpload} className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">Upload & Parse</button>
                <button onClick={handleMatchCandidate} className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">Match Candidate</button>
            </div>
            
            <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-700">Matched Jobs</h2>
                <ul className="mt-2 space-y-2">
                    {jobs.map(job => (
                        <li key={job.id} className={`p-4 bg-white rounded-md shadow flex justify-between items-center ${selectedJob === job.description ? 'border-2 border-blue-500 bg-blue-100' : ''}`}>
                            <div>
                                <strong className="text-gray-800">{job.name}</strong> - <span className="text-gray-600">{job.score}</span>
                            </div>
                            <button 
                                onClick={() => setSelectedJob(job.description)} 
                                className={`px-2 py-1 rounded-md transition ${selectedJob === job.description ? 'bg-blue-500 text-white' : 'text-blue-500 hover:bg-blue-200'}`}
                            >
                                {selectedJob === job.description ? 'Selected' : 'Select'}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            
            <button onClick={handleEvaluate} className="w-full bg-red-600 text-white px-4 py-2 mt-6 rounded-md hover:bg-red-700 transition">Evaluate Candidate</button>
            
            {loading && <p className="mt-4 text-center text-gray-600">Loading...</p>}
            {evaluation && <p className="mt-4 p-4 bg-white rounded-md shadow text-gray-800">{evaluation}</p>}
        </div>
    );
}

export default Page;