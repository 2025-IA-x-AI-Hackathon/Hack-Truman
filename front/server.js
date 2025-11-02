import express from 'express';
import http from 'http';
import { Server as socketIO } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new socketIO(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Sample video data for testing
const sampleVideoData = {
  title: 'The Impact of Climate Change on Global Economy 2024',
  thumbnail: 'https://via.placeholder.com/320x180?text=Climate+Change',
  url: 'https://www.youtube.com/watch?v=example',
};

const sampleTranscript = {
  text: `The global economy is facing unprecedented challenges due to climate change.
    Studies show that by 2050, climate-related losses could reach up to 23% of global GDP.
    Major corporations are already investing billions in renewable energy.
    Some experts believe that electric vehicles will completely replace gas cars by 2035.
    The Paris Climate Agreement has been signed by 195 countries.
    However, not all claims about climate change are scientifically verified.
    Recent data from the IPCC suggests warming is accelerating faster than previously predicted.`,
  timeline: [
    { time: 0, duration: 10 },
    { time: 15, duration: 12 },
    { time: 30, duration: 8 },
  ],
};

const sampleCandidates = [
  {
    id: 'fact_1',
    type: 'fact',
    text: 'By 2050, climate-related losses could reach up to 23% of global GDP',
    timestamp: '0:05',
  },
  {
    id: 'fact_2',
    type: 'fact',
    text: 'The Paris Climate Agreement has been signed by 195 countries',
    timestamp: '0:45',
  },
  {
    id: 'opinion_1',
    type: 'opinion',
    text: 'Electric vehicles will completely replace gas cars by 2035',
    timestamp: '0:30',
  },
  {
    id: 'fact_3',
    type: 'fact',
    text: 'Major corporations are investing billions in renewable energy',
    timestamp: '0:20',
  },
  {
    id: 'opinion_2',
    type: 'opinion',
    text: 'Climate change is the most pressing issue of our time',
    timestamp: '1:00',
  },
];

const sampleVerifications = {
  fact_1: {
    trustScore: 75,
    reasoning:
      'According to World Economic Forum and IMF reports, climate-related economic losses are estimated between 15-23% of global GDP by 2050, depending on various scenarios. This claim is well-supported by peer-reviewed research.',
    references: [
      'World Economic Forum - Global Risks Report 2024',
      'International Monetary Fund - Climate Change Impact Study',
      'IPCC Sixth Assessment Report',
    ],
  },
  fact_2: {
    trustScore: 95,
    reasoning:
      'The Paris Climate Agreement was signed in 2015 and has been ratified by 194 parties (193 UN member states plus the EU). This is a well-documented fact with official records.',
    references: [
      'United Nations Framework Convention on Climate Change (UNFCCC)',
      'Official Paris Agreement Document',
    ],
  },
  opinion_1: {
    trustScore: 35,
    reasoning:
      'While many experts predict increased EV adoption, predicting complete replacement by 2035 is speculative. Current trends suggest EVs could represent 50-70% of new car sales by 2035, not 100%. This is more opinion than fact.',
    references: [
      'International Energy Agency - Global EV Outlook',
      'Various automotive industry forecasts',
    ],
  },
  fact_3: {
    trustScore: 88,
    reasoning:
      'Multiple Fortune 500 companies have publicly announced multi-billion dollar commitments to renewable energy. Apple, Microsoft, Google, and others have significant renewable investments. This claim is factually accurate.',
    references: [
      'Corporate sustainability reports (2023-2024)',
      'Bloomberg NEF - Clean Energy Investment Report',
    ],
  },
  opinion_2: {
    trustScore: 45,
    reasoning:
      'This is primarily an opinion statement reflecting values rather than a factual claim. While climate change is widely recognized as important, prioritization varies by perspective and discipline.',
    references: ['Various policy and research sources'],
  },
};

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('request_analysis', () => {
    console.log('Analysis requested');

    // Simulate API calls with delays
    setTimeout(() => {
      socket.emit('video_info', sampleVideoData);
    }, 500);

    setTimeout(() => {
      socket.emit('transcript', sampleTranscript);
    }, 2000);

    setTimeout(() => {
      socket.emit('candidates', { candidates: sampleCandidates });
    }, 4000);

    // Send verifications one by one
    let delay = 6000;
    sampleCandidates.forEach((candidate) => {
      setTimeout(() => {
        if (sampleVerifications[candidate.id]) {
          socket.emit('verification', {
            candidateId: candidate.id,
            verification: sampleVerifications[candidate.id],
          });
        }
      }, delay);
      delay += 1000;
    });

    // Send conclusion
    setTimeout(() => {
      socket.emit('conclusion', {
        opinionCount: sampleCandidates.filter((c) => c.type === 'opinion').length,
        factCount: sampleCandidates.filter((c) => c.type === 'fact').length,
        trustScore: 68,
      });
    }, delay + 1000);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
