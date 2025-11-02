import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Mock server port
const PORT = process.env.PORT || 8000;

// Sample extract data matching the exact format
const sampleExtractData = {
  argument_graph: {
    nodes: [
      {
        id: 'node_1',
        type: 'claim',
        text: 'Climate change will reduce global GDP by 23% by 2050',
        timestamp: 5.2,
        confidence: 0.85
      },
      {
        id: 'node_2',
        type: 'fact',
        text: 'The Paris Agreement has 195 signatory countries',
        timestamp: 12.5,
        confidence: 0.95
      },
      {
        id: 'node_3',
        type: 'claim',
        text: 'Electric vehicles will completely replace gas cars by 2035',
        timestamp: 18.3,
        confidence: 0.72
      },
      {
        id: 'node_4',
        type: 'fact',
        text: 'Major corporations invested $1.8 trillion in renewable energy in 2023',
        timestamp: 25.0,
        confidence: 0.88
      },
      {
        id: 'node_5',
        type: 'claim',
        text: 'Climate change is the most pressing issue of our time',
        timestamp: 32.1,
        confidence: 0.65
      },
      {
        id: 'node_6',
        type: 'evidence',
        text: 'IPCC report shows 1.5°C warming threshold may be reached by 2030',
        timestamp: 38.5,
        confidence: 0.92
      }
    ],
    edges: [
      {
        source: 'node_6',
        target: 'node_1',
        relationship: 'supports'
      },
      {
        source: 'node_4',
        target: 'node_3',
        relationship: 'partial_support'
      },
      {
        source: 'node_2',
        target: 'node_5',
        relationship: 'contextualizes'
      }
    ]
  },
  summary: {
    total_segments: 45,
    claims: 12,
    facts: 18,
    claims: 8,
    evidence: 7,
    avg_confidence: 0.82,
    video_duration: 180.5,
    language: 'en'
  },
  full_text: `The global economy is facing unprecedented challenges due to climate change.
Studies conducted by leading economists show that by 2050, climate-related losses could reach up to 23% of global GDP.
This projection is based on comprehensive modeling that accounts for both direct and indirect impacts.

The Paris Climate Agreement, signed in 2015, has been ratified by 195 countries worldwide.
This historic agreement aims to limit global warming to well below 2 degrees Celsius above pre-industrial levels.

Major corporations are already taking action. In 2023 alone, Fortune 500 companies invested $1.8 trillion in renewable energy infrastructure.
Tech giants like Apple, Google, and Microsoft have committed to becoming carbon neutral by 2030.

Transportation is undergoing a revolution. Some experts believe that electric vehicles will completely replace gas cars by 2035.
Current sales data shows EVs growing at 60% year-over-year, though challenges remain in battery technology and charging infrastructure.

Recent data from the Intergovernmental Panel on Climate Change (IPCC) suggests warming is accelerating faster than previously predicted.
The 1.5°C warming threshold, considered critical for avoiding catastrophic impacts, may be reached as early as 2030.

While there is broad scientific consensus on climate change, debates continue about the best policy responses.
Carbon pricing, renewable subsidies, and regulatory approaches each have their advocates and critics.

The transition to a low-carbon economy presents both challenges and opportunities.
New industries are emerging, creating millions of jobs in solar, wind, and energy storage sectors.
However, traditional fossil fuel industries face significant disruption, affecting communities dependent on these sectors.`
};

// Sample candidates for classification stage
const sampleCandidates = [
  {
    id: 'fact_1',
    type: 'fact',
    text: 'By 2050, climate-related losses could reach up to 23% of global GDP',
    timestamp: '0:05',
    segment_id: 'seg_001'
  },
  {
    id: 'fact_2',
    type: 'fact',
    text: 'The Paris Climate Agreement has been signed by 195 countries',
    timestamp: '0:45',
    segment_id: 'seg_004'
  },
  {
    id: 'claim_1',
    type: 'claim',
    text: 'Electric vehicles will completely replace gas cars by 2035',
    timestamp: '0:30',
    segment_id: 'seg_003'
  }
];

// Sample verifications
const sampleVerifications = {
  fact_1: {
    trustScore: 75,
    reasoning: 'According to World Economic Forum and IMF reports, climate-related economic losses are estimated between 15-23% of global GDP by 2050.',
    references: [
      'World Economic Forum - Global Risks Report 2024',
      'International Monetary Fund - Climate Change Impact Study'
    ]
  },
  fact_2: {
    trustScore: 95,
    reasoning: 'The Paris Climate Agreement was signed in 2015 and has been ratified by 194 parties.',
    references: ['United Nations Framework Convention on Climate Change (UNFCCC)']
  }
};

// Sample conclusion
const sampleConclusion = {
  claimCount: 8,
  factCount: 18,
  claimCount: 12,
  evidenceCount: 7,
  overallTrustScore: 72,
  summary: 'The video presents a balanced view on climate change with mostly factual information supported by credible sources.',
  keyFindings: [
    'Most economic projections are based on peer-reviewed research',
    'Corporate investment figures are verifiable through public reports',
    'EV adoption predictions vary widely among experts'
  ]
};

// YouTube download mock endpoint
app.post('/api/youtube/download', async (req, res) => {
  const { url } = req.body;
  console.log('Mock download requested for:', url);

  // Simulate download delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Return mock file path
  res.json({
    status: 'success',
    file_path: `/downloads/mock_video_${Date.now()}.wav`,
    download_info: {
      file_path: `/downloads/mock_video_${Date.now()}.wav`,
      title: 'Climate Change Impact Analysis',
      duration: 180.5,
      filesize: 28500000
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'mock-server' });
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws/analyze`);
});

// Create WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');

    try {
      const data = JSON.parse(message.toString());
      console.log('Received WebSocket message:', data);

      // Simulate processing stages

      // Stage 1: Send extract data
      setTimeout(() => {
        ws.send(JSON.stringify({
          stage: 'extract',
          data: sampleExtractData
        }));
        console.log('Sent extract data');
      }, 1000);

      // Stage 2: Send candidates (optional - if you want to show classification)
      setTimeout(() => {
        ws.send(JSON.stringify({
          stage: 'candidates',
          data: {
            candidates: sampleCandidates
          }
        }));
        console.log('Sent candidates');
      }, 3000);

      // Stage 3: Send verifications one by one
      let verificationDelay = 4000;
      for (const [candidateId, verification] of Object.entries(sampleVerifications)) {
        setTimeout(() => {
          ws.send(JSON.stringify({
            stage: 'verification',
            data: {
              candidateId,
              verification
            }
          }));
          console.log(`Sent verification for ${candidateId}`);
        }, verificationDelay);
        verificationDelay += 1000;
      }

      // Stage 4: Send conclusion
      setTimeout(() => {
        ws.send(JSON.stringify({
          stage: 'conclusion',
          data: sampleConclusion
        }));
        console.log('Sent conclusion');
      }, verificationDelay + 1000);

      // Stage 5: Send complete signal
      setTimeout(() => {
        ws.send(JSON.stringify({
          stage: 'complete',
          data: {
            message: 'Analysis completed successfully',
            duration: verificationDelay + 2000
          }
        }));
        console.log('Analysis complete');
      }, verificationDelay + 2000);

    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        stage: 'error',
        error: error.message
      }));
    }


  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Handle upgrade requests for WebSocket
server.on('upgrade', (request, socket, head) => {
  if (request.url === '/ws/analyze') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

console.log('\nMock Server Ready!');
console.log('================');
console.log('Endpoints:');
console.log('- POST http://localhost:8000/api/youtube/download');
console.log('- WS   ws://localhost:8000/ws/analyze');
console.log('- GET  http://localhost:8000/health');
console.log('\nThis mock server simulates the FastAPI backend for testing.');