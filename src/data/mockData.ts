import { DocFile, Chunk, ChunksMap } from "@/types";

export const mockFiles: DocFile[] = [
  { id: "file-1", name: "Product_Requirements_Document.docx", type: "docx" },
  { id: "file-2", name: "Technical_Specification.docx", type: "docx" },
  { id: "file-3", name: "Project_Proposal_2024.docx", type: "docx" },
  { id: "file-4", name: "Marketing_Strategy_Q2.docx", type: "docx" },
  { id: "file-5", name: "User_Research_Findings.docx", type: "docx" },
  { id: "file-6", name: "Meeting_Notes_January.docx", type: "docx" },
];

export const mockChunks: ChunksMap = {
  "file-1": [
    {
      id: "chunk-1-1",
      title: "Chunk 1: Executive Summary",
      preview: "This document outlines the core product requirements for the upcoming release...",
      content: "<h1>Executive Summary</h1><p>This document outlines the core product requirements for the upcoming release. Our goal is to deliver a user-friendly experience that meets market demands while maintaining technical excellence.</p><h2>Key Objectives</h2><ul><li>Improve user onboarding</li><li>Enhance performance metrics</li><li>Integrate feedback from beta testing</li></ul>",
    },
    {
      id: "chunk-1-2",
      title: "Chunk 2: Feature Overview",
      preview: "The new features include an enhanced dashboard, real-time notifications...",
      content: "<h1>Feature Overview</h1><p>The new features include:</p><h2>Enhanced Dashboard</h2><ul><li>Real-time analytics</li><li>Customizable widgets</li><li>Export functionality</li></ul><h2>Real-time Notifications</h2><ul><li>Push notifications</li><li>Email digests</li><li>In-app alerts</li></ul>",
    },
    {
      id: "chunk-1-3",
      title: "Chunk 3: Technical Requirements",
      preview: "System must support minimum 10,000 concurrent users with sub-second response times...",
      content: "<h1>Technical Requirements</h1><h2>Performance Metrics</h2><ul><li>Support minimum 10,000 concurrent users</li><li>Sub-second response times for all API calls</li><li>99.9% uptime SLA</li></ul><h2>Infrastructure</h2><ul><li>Cloud-native architecture</li><li>Horizontal scaling capabilities</li><li>Automated backup and recovery</li></ul>",
    },
  ],
  "file-2": [
    {
      id: "chunk-2-1",
      title: "Chunk 1: Architecture Overview",
      preview: "The system architecture follows a microservices pattern with clear separation...",
      content: "<h1>Architecture Overview</h1><p>The system architecture follows a microservices pattern with clear separation of concerns.</p><h2>Core Components</h2><ul><li>API Gateway</li><li>Authentication Service</li><li>Data Processing Layer</li><li>Storage Layer</li></ul><h2>Technology Stack</h2><ul><li>React for frontend</li><li>Node.js for backend services</li><li>PostgreSQL for data persistence</li><li>Redis for caching</li></ul>",
    },
    {
      id: "chunk-2-2",
      title: "Chunk 2: API Specifications",
      preview: "RESTful API design with consistent naming conventions and error handling...",
      content: "<h1>API Specifications</h1><h2>Authentication Endpoints</h2><ul><li>POST /api/auth/login</li><li>POST /api/auth/register</li><li>POST /api/auth/refresh</li><li>DELETE /api/auth/logout</li></ul><h2>Data Endpoints</h2><ul><li>GET /api/resources</li><li>POST /api/resources</li><li>PUT /api/resources/:id</li><li>DELETE /api/resources/:id</li></ul>",
    },
  ],
  "file-3": [
    {
      id: "chunk-3-1",
      title: "Chunk 1: Project Background",
      preview: "This proposal addresses the growing need for digital transformation in our sector...",
      content: "<h1>Project Background</h1><p>This proposal addresses the growing need for digital transformation in our sector. Market research indicates significant opportunity for innovation.</p><h2>Current Challenges</h2><ul><li>Legacy systems limiting growth</li><li>Manual processes reducing efficiency</li><li>Customer expectations evolving rapidly</li></ul>",
    },
    {
      id: "chunk-3-2",
      title: "Chunk 2: Proposed Solution",
      preview: "We propose a phased implementation approach starting with core functionality...",
      content: "<h1>Proposed Solution</h1><h2>Phase 1: Foundation (Months 1-3)</h2><ul><li>System architecture design</li><li>Core platform development</li><li>Initial user testing</li></ul><h2>Phase 2: Enhancement (Months 4-6)</h2><ul><li>Feature additions</li><li>Integration with existing systems</li><li>Performance optimization</li></ul>",
    },
    {
      id: "chunk-3-3",
      title: "Chunk 3: Budget & Timeline",
      preview: "Total project budget estimated at $450,000 over 12 months with quarterly milestones...",
      content: "<h1>Budget &amp; Timeline</h1><h2>Financial Overview</h2><ul><li>Development: $280,000</li><li>Infrastructure: $80,000</li><li>Training &amp; Support: $50,000</li><li>Contingency: $40,000</li></ul><p><strong>Total</strong>: $450,000</p><h2>Timeline</h2><ul><li>Q1 2024: Planning &amp; Design</li><li>Q2 2024: Development Phase 1</li><li>Q3 2024: Development Phase 2</li><li>Q4 2024: Launch &amp; Optimization</li></ul>",
    },
  ],
  "file-4": [
    {
      id: "chunk-4-1",
      title: "Chunk 1: Market Analysis",
      preview: "Q2 market analysis reveals shifting consumer behaviors and emerging trends...",
      content: "<h1>Market Analysis</h1><p>Q2 market analysis reveals shifting consumer behaviors and emerging trends.</p><h2>Key Findings</h2><ul><li>45% increase in mobile traffic</li><li>Growing preference for personalized content</li><li>Social media engagement up 30%</li></ul><h2>Competitive Landscape</h2><ul><li>Three new competitors entered market</li><li>Price pressure increasing</li><li>Innovation becoming key differentiator</li></ul>",
    },
    {
      id: "chunk-4-2",
      title: "Chunk 2: Campaign Strategy",
      preview: "Multi-channel campaign focusing on digital channels with emphasis on content marketing...",
      content: "<h1>Campaign Strategy</h1><h2>Digital Channels</h2><ul><li>Social media advertising</li><li>Content marketing</li><li>Email campaigns</li><li>Influencer partnerships</li></ul><h2>Content Themes</h2><ol><li>Product innovation stories</li><li>Customer success testimonials</li><li>Industry thought leadership</li><li>Educational content series</li></ol>",
    },
  ],
  "file-5": [
    {
      id: "chunk-5-1",
      title: "Chunk 1: Research Methodology",
      preview: "Mixed-methods approach combining quantitative surveys with qualitative interviews...",
      content: "<h1>Research Methodology</h1><h2>Approach</h2><p>Mixed-methods combining:</p><ul><li>Quantitative surveys (n=500)</li><li>Qualitative interviews (n=25)</li><li>Usability testing sessions (n=15)</li><li>Analytics data analysis</li></ul><h2>Participant Demographics</h2><ul><li>Age range: 25-54</li><li>60% female, 40% male</li><li>Urban and suburban locations</li><li>Mixed technical proficiency</li></ul>",
    },
    {
      id: "chunk-5-2",
      title: "Chunk 2: Key Insights",
      preview: "Users prioritize simplicity and speed over feature richness. Trust and security...",
      content: "<h1>Key Insights</h1><h2>Primary Findings</h2><ol><li><strong>Simplicity Matters</strong>: Users prefer clean interfaces</li><li><strong>Speed is Critical</strong>: Page load times impact satisfaction</li><li><strong>Trust Signals</strong>: Security badges and reviews important</li><li><strong>Mobile-First</strong>: 70% of users primarily use mobile devices</li></ol><h2>Pain Points</h2><ul><li>Current onboarding too complex</li><li>Search functionality inadequate</li><li>Help documentation difficult to find</li></ul>",
    },
    {
      id: "chunk-5-3",
      title: "Chunk 3: Recommendations",
      preview: "Based on research findings, we recommend streamlining the user journey...",
      content: "<h1>Recommendations</h1><h2>Immediate Actions</h2><ol><li>Simplify registration process</li><li>Improve search with filters</li><li>Add contextual help tooltips</li><li>Optimize mobile experience</li></ol><h2>Long-term Initiatives</h2><ul><li>Personalization engine</li><li>AI-powered recommendations</li><li>Enhanced analytics dashboard</li><li>Community features</li></ul>",
    },
  ],
  "file-6": [
    {
      id: "chunk-6-1",
      title: "Chunk 1: Meeting Overview",
      preview: "Strategic planning session held on January 15, 2024. Attendees included executive team...",
      content: "<h1>Meeting Overview</h1><p><strong>Date</strong>: January 15, 2024<br><strong>Time</strong>: 10:00 AM - 12:00 PM<br><strong>Location</strong>: Conference Room A</p><h2>Attendees</h2><ul><li>Sarah Chen (CEO)</li><li>Michael Park (CTO)</li><li>Lisa Rodriguez (CMO)</li><li>James Wilson (CFO)</li><li>Team leads from each department</li></ul><h2>Agenda</h2><ol><li>Q4 review</li><li>Q1 objectives</li><li>Strategic initiatives</li><li>Budget allocation</li></ol>",
    },
    {
      id: "chunk-6-2",
      title: "Chunk 2: Action Items",
      preview: "Key decisions and action items assigned with owners and deadlines...",
      content: "<h1>Action Items</h1><h2>Immediate (This Week)</h2><ul><li>Finalize Q1 budget (James - Jan 19)</li><li>Schedule customer interviews (Lisa - Jan 20)</li><li>Review technical roadmap (Michael - Jan 21)</li></ul><h2>Short-term (This Month)</h2><ul><li>Launch new marketing campaign</li><li>Complete security audit</li><li>Hire two senior developers</li></ul><h2>Follow-up Meeting</h2><p>Scheduled for January 29, 2024</p>",
    },
  ],
};
