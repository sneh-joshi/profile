import { profileData } from '../utils/profileData'
import { buildVocabulary, generateEmbedding } from './embeddingService'
import { cosineSimilarity } from './vectorSearch'
import type { DocumentChunk } from '../types/rag'

// ── Knowledge base ─────────────────────────────────────────────────────────────
// Each entry has:
//   matchText  — query-like keywords used for similarity matching only
//   answer     — clean human-readable response returned to the user

interface KnowledgeEntry {
  id: string
  matchText: string
  answer: string
  embedding: number[]
}

const RAW_ENTRIES: Omit<KnowledgeEntry, 'embedding'>[] = [
  {
    id: 'rag-demo',
    matchText: 'RAG pipeline demo browser retrieval augmented generation chunking TF-IDF embedding cosine similarity vector search document upload query answer how does it work',
    answer:
      'The RAG Pipeline demo runs entirely in your browser — no server or API key needed.\n\n' +
      '1. Upload any document\n' +
      '2. It chunks the text using a sliding-window chunker with configurable overlap\n' +
      '3. Builds TF-IDF bag-of-words embeddings (300 dimensions) over the corpus vocabulary\n' +
      '4. Runs cosine similarity search to find the most relevant chunks for your query\n' +
      '5. Generates an answer from the top-K results\n\n' +
      'All pipeline mechanics happen client-side. The chatbot you\'re talking to right now uses the same embedding and search services.',
  },
  {
    id: 'rule-engine',
    matchText: 'rule engine demo JSON validation conditions operators AND OR eq neq lt gt contains not_contains pre-ingestion CMS severity',
    answer:
      'The Rule Engine demo is a JSON-defined validation system — rules are pure data, not code.\n\n' +
      '▸ Operators: eq, neq, lt, gt, contains, not_contains\n' +
      '▸ AND/OR condition grouping with per-rule severity levels\n' +
      '▸ Structured error reporting per rule\n' +
      '▸ Add rules by editing JSON — zero code changes\n\n' +
      'This mirrors the pre-ingestion validation architecture from the Washington Post CMS, where rules gate content before it reaches editors or the ingestion pipeline.',
  },
  {
    id: 'comment-service',
    matchText: 'comment service demo event sourcing domain events reducer stateless Kafka CommentCreated SuggestionAdded ReplyAdded CommentResolved rebuildState append-only log',
    answer:
      'The Comment Service demo models comments using event sourcing.\n\n' +
      '▸ Events: CommentCreated, SuggestionAdded, ReplyAdded, CommentResolved\n' +
      '▸ State is rebuilt by replaying an append-only event log through a pure reducer\n' +
      '▸ rebuildState() replays all events from scratch — fully debuggable\n' +
      '▸ Stateless by design → horizontally scalable\n\n' +
      'This mirrors the Kafka-backed comment architecture at Washington Post, where services consume events independently and rebuild their own state projections.',
  },
  {
    id: 'doc-processing',
    matchText: 'document processing demo PDF extraction confidence score signature detection human in the loop review workflow OCR ML approve reject',
    answer:
      'The Document Processing demo simulates a PDF ingestion pipeline.\n\n' +
      '▸ Extracts structured fields (Vendor, Amount, Date, Signature, etc.)\n' +
      '▸ Each field gets a confidence score from OCR/ML output\n' +
      '▸ Fields above threshold (75%) → auto-approved\n' +
      '▸ Low-confidence fields → routed to human review queue\n' +
      '▸ The expense report shows a real SVG signature at 61% confidence — flagged for review\n\n' +
      'This demonstrates the human-in-the-loop ML pattern used in document ingestion systems.',
  },
  {
    id: 'washington-post',
    matchText: 'Washington Post work built architected led CMS backend platform editorial publishing SaaS senior software engineer',
    answer:
      'At The Washington Post (Nov 2022 – Present) I led backend architecture across the CMS platform:\n\n' +
      '▸ RAG-based semantic search — PostgreSQL + pgvector, hybrid retrieval across 10K+ content entities, searchable in under 30 seconds\n' +
      '▸ Centralized reference graph service — depth-2 modeling for 3–4 downstream services, 30% latency reduction\n' +
      '▸ Rule/validation engine — 5,000+ req/min data ingestion checks with per-client personalization\n' +
      '▸ Stateless comment/suggestion services — Kafka event-driven decoupling across 4+ services\n' +
      '▸ LLM natural language querying — net-new product capability layered on existing RAG infrastructure\n' +
      '▸ 50+ editorial clients served, 4,000+ RPM at 99.70% SLO, zero major outages over 12+ months',
  },
  {
    id: 'scale-slo',
    matchText: 'production scale SLO RPM requests per minute throughput performance reliability 4000 99.70 deployment CI CD pipeline optimization',
    answer:
      'Production metrics at Washington Post:\n\n' +
      '▸ 4,000+ requests per minute processed\n' +
      '▸ 99.70% SLO maintained — zero major outages over 12+ months\n' +
      '▸ Rule/validation engine: 5,000+ req/min ingestion checks\n' +
      '▸ RAG search: end-to-end searchable time under 30 seconds\n' +
      '▸ Reference graph: 30% cross-service query latency reduction\n' +
      '▸ Client onboarding: 4+ hours → under 10 minutes\n' +
      '▸ CI/CD deployment: ~40 min → under 15 min across 5+ services',
  },
  {
    id: 'aws-cloud',
    matchText: 'AWS cloud architecture Lambda API Gateway ECS Step Functions SQS SNS DynamoDB S3 CloudFormation Keyspaces Textract infrastructure',
    answer:
      'AWS stack:\n\n' +
      '▸ Compute: Lambda, ECS, API Gateway\n' +
      '▸ Messaging: SQS, SNS, Step Functions for workflow orchestration\n' +
      '▸ Data: DynamoDB, S3, AWS Keyspaces, CloudFormation (IaC)\n' +
      '▸ ML/OCR: AWS Textract + Tesseract for document automation\n' +
      '▸ Observability: Datadog, CloudWatch, SLO ownership',
  },
  {
    id: 'skills',
    matchText: 'skills languages TypeScript JavaScript Node.js Python Java Spring Boot React programming tech stack',
    answer:
      'Core skills:\n\n' +
      '▸ Languages: TypeScript, Node.js, Python, Java, Go, SQL\n' +
      '▸ AI/Search: RAG, embeddings, pgvector, OpenAI APIs, LangChain, semantic retrieval\n' +
      '▸ Cloud: AWS (Lambda, ECS/Fargate, Step Functions, DynamoDB, S3, Keyspaces), Docker, Terraform\n' +
      '▸ Databases: PostgreSQL, MySQL, DynamoDB, Oracle\n' +
      '▸ Frontend: React, Vite\n' +
      '▸ Observability: Datadog, CloudWatch',
  },
  {
    id: 'education',
    matchText: 'education degree MS master computer science NYIT New York Institute Technology graduate university 2015 bachelor Gujarat 2013',
    answer:
      '▸ MS in Computer Science — New York Institute of Technology (NYIT), Dec 2015\n' +
      '▸ Bachelor of Computer Engineering — Gujarat Technological University, 2013',
  },
  {
    id: 'experience-timeline',
    matchText: 'experience career history companies worked Freedom Mortgage JRI SMBC timeline years background',
    answer:
      '9+ years across three companies:\n\n' +
      '▸ The Washington Post (Nov 2022–Present) — Senior Software Engineer, distributed systems & AI search, 50+ editorial clients\n' +
      '▸ JRI-America / SMBC (Mar 2022–Nov 2022) — Software Engineer, data governance & quality pipelines (20–25% improvement)\n' +
      '▸ Freedom Mortgage (Jun 2016–Mar 2022) — Software Engineer / BPM Developer, Java microservices, AWS Step Functions, OCR pipeline ($1.00→$0.35/page), 500K+ annual loan applications',
  },
  {
    id: 'architecture-principles',
    matchText: 'architecture philosophy principles design patterns stateless decoupled scalable observability system thinking how approach',
    answer:
      'Architecture principles I apply consistently:\n\n' +
      '▸ Stateless services — state lives in the event log or database, not in memory\n' +
      '▸ Event-driven modeling — Kafka-style decoupling for independent scaling\n' +
      '▸ Validation at the boundary — rule engines before ingestion, not inside pipelines\n' +
      '▸ Hybrid search — vector + keyword retrieval outperforms either alone\n' +
      '▸ Observability-first — SLO ownership, alerting, and Datadog from day one\n\n' +
      'The Architecture Philosophy section on this page covers this in more depth.',
  },
]

// ── Build vocabulary and embeddings once at module load ────────────────────────

const VOCAB_DOCS: DocumentChunk[] = RAW_ENTRIES.map((e, i) => ({
  id: e.id,
  text: e.matchText,
  startChar: 0,
  endChar: e.matchText.length,
  chunkIndex: i,
}))

const VOCAB = buildVocabulary(VOCAB_DOCS)

const KNOWLEDGE: KnowledgeEntry[] = RAW_ENTRIES.map((e) => ({
  ...e,
  embedding: generateEmbedding(e.matchText, VOCAB),
}))

// ── Public API ─────────────────────────────────────────────────────────────────

export function getPredefinedPrompts(): string[] {
  return [
    'What did you build at Washington Post?',
    'How does the RAG Pipeline demo work?',
    'Explain the Rule Engine project',
    'What is the Document Processing demo?',
    'What production scale have you handled?',
  ]
}

export function answerExperienceQuestion(question: string): string {
  const queryVec = generateEmbedding(question, VOCAB)

  const scored = KNOWLEDGE
    .map((entry) => ({ entry, score: cosineSimilarity(queryVec, entry.embedding) }))
    .sort((a, b) => b.score - a.score)

  const top = scored[0]

  if (!top || top.score < 0.05) {
    return 'I can answer questions about experience, skills, architecture, and the four project demos (RAG Pipeline, Rule Engine, Comment Service, Document Processing). Try one of the suggested prompts.'
  }

  return top.entry.answer
}

export function getWelcomeMessage(): string {
  return `Ask me anything about ${profileData.name}'s experience, skills, or the project demos — RAG Pipeline, Rule Engine, Comment Service, or Document Processing.`
}


