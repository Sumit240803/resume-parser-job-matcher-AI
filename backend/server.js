const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Pinecone } = require("@pinecone-database/pinecone");
const express = require("express")
const multer = require("multer");
const PdfParse = require("pdf-parse");
const cors = require('cors');
const upload = multer({storage : multer.memoryStorage()})
const app = express();
require("dotenv").config()
const PORT = process.env.port 
app.use(express.json())
app.use(cors());
const genAi = new GoogleGenerativeAI(process.env.gemini_key);
const pinecone = new Pinecone({
    apiKey : process.env.pincecone_key
});
const index = pinecone.index("job-details");
async function summarize(text) {
    const model = genAi.getGenerativeModel({model : "gemini-pro"});
    const prompt = `Summarize this resume and extract key details like name, skills, education, and experience:\n\n${text}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
}

async function evaluate(resumeText,jobDescription){
    const model = genAi.getGenerativeModel({model : "gemini-1.5-pro"});
    const prompt = `
    Evaluate this candidate for the given job. Score the candidate from 1 to 10 based on skill match, experience, and relevance.

    Resume:
    ${resumeText}

    Job Description:
    ${jobDescription}

    Provide a detailed reason along with the score.
    `;
    const result = await model.generateContent(prompt);
    return result.response.text();
}
async function extractDetailsUsingGemini(text) {
    try {
       
        const model = genAi.getGenerativeModel({ model: "gemini-1.5-pro" }); 


        const prompt = `
        Extract key details from this resume. The resume format may vary.
        
        Resume:
        ${text}
    
        Provide the response in this structured JSON format:
        {
            "skills": ["Skill1", "Skill2", "Skill3"],
            "education": ["Degree in XYZ from ABC University"],
            "experience": ["Job Title at Company - Duration"]
        }
        `;
        const result = await model.generateContent(prompt);

      

        return result.response.text();
    } catch (error) {
        console.error("Gemini API Error:", error); // ✅ Log API error
        throw new Error("Error fetching data from Gemini API");
    }
}



app.post("/parse-resume", upload.single("resume"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        const pdfData = await PdfParse(req.file.buffer);
        console.log(pdfData.text);
        const extractedData = await extractDetailsUsingGemini(pdfData.text);
        res.json(extractedData);
    } catch (error) {
        res.status(500).json({ error });
    }
});


app.post("/store-job", async(req,res)=>{
    try {
        const {jobId , jobName , jobDescription} = req.body;
        if (!jobId || !jobName || !jobDescription) {
            return res.status(400).json({ error: "jobId, jobName, and jobDescription are required" });
        }

        const model = genAi.getGenerativeModel({ model: "text-embedding-004" });
        const response = await model.embedContent(jobDescription);
        const jobVector = response.embedding.values;
        await index.upsert([
            {
                id : jobId,
                values : jobVector,
                metadata : {name : jobName , description : jobDescription}
            }
        ]);
        res.json({ message: `✅ Job "${jobName}" stored successfully!` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

app.post("/match-candidate" , async(req,res)=>{
    try {
        const {resumeText} = req.body;
        if (!resumeText) {
            return res.status(400).json({ error: "resumeText is required" });
        }
        const model = genAi.getGenerativeModel({ model: "text-embedding-004" });
        const response = await model.embedContent(resumeText);
        const resumeVector = response.embedding.values;
        const result = await index.query({
            vector: resumeVector,
            topK: 3,
            includeMetadata: true
        }).catch(err => {
            console.error("Pinecone query error:", err);
            throw new Error("Failed to retrieve job matches");
        });
        const jobs = result.matches.map((match) => ({
            id: match.id,
            name: match.metadata.name,
            description: match.metadata.description,
            score: match.score
        }));

        res.json({ jobs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

app.post("/evaluate-candidate", async (req, res) => {
    try {
        const { resumeText, jobDescription } = req.body;
        if (!resumeText || !jobDescription) {
            return res.status(400).json({ error: "resumeText and jobDescription are required" });
        }

        const evaluation = await evaluate(resumeText, jobDescription);
        res.json({ evaluation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});