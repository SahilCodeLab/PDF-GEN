// ====== BACKEND: server.js ====== require('dotenv').config(); const express = require('express'); const cors = require('cors'); const axios = require('axios'); const PDFDocument = require('pdfkit');

const app = express(); app.use(cors()); app.use(express.json());

const models = [ { name: "qwen/qwen3-coder:free", key: process.env.OPENROUTER_API_KEY_1 }, { name: "google/gemini-2.0-flash-exp:free", key: process.env.OPENROUTER_API_KEY_2 } ];

function cleanText(text) { return text .replace(/[^�    .replace(/[^\x00-\x7F]/g, "") .replace(/[\uFFFD]/g, "") .replace(/\s{2,}/g, " ") .trim(); }

function sanitizeFilename(str) { return str.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 40); }

function buildPrompt(question, marks) { let formatGuide = ` Use this structure in your answer:

Introduction (1-2 lines)

Main Points (bullet format with subheadings if needed)

Examples (if any)

Conclusion (1-2 line summary)


Keep tone exam-style: clear, academic, WBSU NEP Semester 2 appropriate. `;

let lengthNote = ""; if (marks <= 2) { lengthNote = "Answer in 3-5 lines, around 50-70 words. Keep it very concise with 1-2 main points."; } else if (marks <= 5) { lengthNote = "Answer in 8-12 lines, around 100-150 words. Include 2-3 key points with brief explanation."; } else if (marks <= 10) { lengthNote = "Answer in 20-25 lines, around 250-300 words. Provide 3-4 detailed points with examples."; } else { lengthNote = "Answer in 30-40 lines, around 300-350 words. Provide 4-5 in-depth points with examples and strong conclusion."; }

return 📘 Question: ${question} \n📏 Marks: ${marks} \n🧠 Instruction: Answer the question as per WBSU NEP Semester 2 exam style. ${lengthNote} \n${formatGuide}; }

async function generateAnswer(question, marks) { const prompt = buildPrompt(question, marks);

for (const model of models) { try { const response = await axios.post( 'https://openrouter.ai/api/v1/chat/completions', { model: model.name, messages: [{ role: 'user', content: prompt }] }, { headers: { 'Authorization': Bearer ${model.key}, 'Content-Type': 'application/json' } } ); const answer = response.data.choices[0].message.content; if (answer) return { answer: cleanText(answer), model: model.name }; } catch (err) { console.warn(⚠️ ${model.name} failed. Trying next...); } } return { answer: "❌ Answer could not be generated at this moment.", model: "none" }; }

app.post('/generate-pdf', async (req, res) => { const { questions, subject, marks } = req.body; if (!questions || questions.length === 0 || !marks) { return res.status(400).send('❌ Questions or marks missing.'); }

const filename = sanitizeFilename(${subject || 'WBSU_NEP'}_${questions[0].slice(0, 30)}); res.setHeader('Content-Disposition', attachment; filename=${filename}.pdf); res.setHeader('Content-Type', 'application/pdf');

const doc = new PDFDocument({ margin: 50 }); doc.pipe(res);

doc.fontSize(18).fillColor('black').text(📘 ${subject || 'WBSU NEP'} - Answer Sheet, { align: 'center', underline: true }); doc.moveDown(1);

for (let i = 0; i < questions.length; i++) { const qText = questions[i]; const { answer, model } = await generateAnswer(qText, marks);

doc.fontSize(14).fillColor('black').text(`Q${i + 1} (${marks} Marks): ${qText}`, {
  underline: true
});
doc.moveDown(0.5);
doc.fontSize(12).fillColor('black').text(`Answer:`, { bold: true });
doc.moveDown(0.2);
doc.fontSize(12).text(answer, { lineGap: 4 });
doc.moveDown(0.5);
doc.fontSize(10).fillColor('gray').text(`🤖 Generated using: ${model}`, { align: 'right' });
doc.moveDown(1.5);

}

doc.end(); });

app.listen(process.env.PORT || 3000, () => { console.log("🚀 Server running on http://localhost:" + (process.env.PORT || 3000)); });

