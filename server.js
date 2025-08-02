require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const PDFDocument = require('pdfkit');

const app = express();
app.use(cors());
app.use(express.json());

const models = [
  {
    name: "qwen/qwen3-coder:free",
    key: process.env.OPENROUTER_API_KEY_1
  },
  {
    name: "google/gemini-2.0-flash-exp:free",
    key: process.env.OPENROUTER_API_KEY_2
  }
];

async function generateAnswer(question) {
  for (const model of models) {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model.name,
          messages: [
            {
              role: 'user',
              content: `Answer this question in simple WBSU NEP Semester 2 exam style:\n${question}`
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${model.key}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const answer = response.data.choices[0].message.content;
      if (answer) return answer;
    } catch (err) {
      console.warn(`⚠️ ${model.name} failed. Trying next...`);
    }
  }

  return "❌ Answer generation failed from both models.";
}

app.post('/generate-pdf', async (req, res) => {
  const { questions, subject } = req.body;
  if (!questions || questions.length === 0) {
    return res.status(400).send('❌ No questions provided.');
  }

  res.setHeader('Content-Disposition', 'attachment; filename=Answers.pdf');
  res.setHeader('Content-Type', 'application/pdf');

  const doc = new PDFDocument();
  doc.pipe(res);

  doc.fontSize(18).text(`📚 ${subject || 'NEP Semester 2'} - Answer Sheet`, { align: 'center' });
  doc.moveDown();

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    doc.moveDown().fontSize(14).fillColor('black').text(`Q${i + 1}: ${question}`, { underline: true });

    const answer = await generateAnswer(question);
    doc.moveDown().fontSize(12).fillColor('black').text(`Answer:\n${answer}`);
  }

  doc.end();
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server running on http://localhost:" + (process.env.PORT || 3000));
});
