"use client"
import axios from 'axios';
import React, { useState } from 'react'

const page = () => {
    const [jobId, setJobId] = useState("");
    const [jobName, setJobName] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const handleStoreJob = async () => {
        setLoading(true);
        setSuccessMessage("");
        await axios.post("http://localhost:5000/store-job", { jobId, jobName, jobDescription });
        setLoading(false);
        setSuccessMessage("Job stored successfully!");
    };

    return (
        <div className="container mx-auto p-6 max-w-lg bg-white shadow-lg rounded-lg">
            <h1 className="text-3xl font-bold mb-6 text-center">Store Job</h1>
            <input type="text" placeholder="Job ID" value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full border p-3 mb-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <input type="text" placeholder="Job Name" value={jobName} onChange={(e) => setJobName(e.target.value)} className="w-full border p-3 mb-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <textarea placeholder="Job Description" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="w-full border p-3 mb-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 h-24" />
            <button onClick={handleStoreJob} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md transition">{loading ? "Storing..." : "Store Job"}</button>
            {successMessage && <p className="mt-4 text-green-600 text-center font-semibold">{successMessage}</p>}
        </div>
    );
}

export default page
