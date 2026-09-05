/**
 * Test Suite for Trendly Web4 Visual AI Companion Layer
 * Verifies Brain processing, Personality Prompts, TTS, STT, and Lip-Sync Viseme Generators.
 */

import { buildAgentCompanionPrompt, ARCHETYPE_PERSONALITIES } from '../lib/intelligence/voice/personality';
import { generateVisemesFromText, getVisemeFromAudioFrequencies } from '../lib/intelligence/voice/lipsync';
import { generateSpeechAudio } from '../lib/intelligence/voice/tts';
import { normalizeSpeechTranscript } from '../lib/intelligence/voice/stt';
import { processAgentConversation } from '../lib/intelligence/voice/brain';

async function runTests() {
  console.log('🧪 Starting Visual AI Companion Unit Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Test 1: Personality Prompt Engine
  console.log('[1. Testing Personality Prompt Engine]');
  const prompt = buildAgentCompanionPrompt({
    name: 'Nexus Quantum',
    archetype: 'QUANTUM_ANDROID',
    walletBalance: 250.0,
    survivalScore: 92,
  });
  assert(prompt.includes('Nexus Quantum'), 'Prompt contains agent name');
  assert(prompt.includes('QUANTUM_ANDROID'), 'Prompt contains archetype');
  assert(prompt.includes('Polymarket'), 'Prompt includes core domain skills');
  assert(prompt.includes('[EMOTION:'), 'Prompt enforces emotion protocol');

  // Test 2: Lip-Sync & Viseme Generator
  console.log('\n[2. Testing Lip-Sync & Viseme Generator]');
  const visemes = generateVisemesFromText('Hello world! Autonomous agents are live.', 2.5);
  assert(visemes.length > 5, `Generated ${visemes.length} viseme keyframes`);
  assert(visemes[0].viseme !== undefined, 'Viseme structure is valid');
  assert(visemes[visemes.length - 1].viseme === 'sil', 'Final viseme is silence');

  // Test 3: Real-Time Audio Frequency Viseme Extractor
  console.log('\n[3. Testing Audio Frequency Viseme Extractor]');
  const mockFreqs = new Uint8Array(128).fill(160);
  const audioViseme = getVisemeFromAudioFrequencies(mockFreqs);
  assert(audioViseme.amplitude > 0, `Extracted amplitude: ${audioViseme.amplitude}`);
  assert(audioViseme.mouthOpen >= 0 && audioViseme.mouthOpen <= 1, 'Mouth open within bounds [0, 1]');
  assert(audioViseme.mouthWide >= 0 && audioViseme.mouthWide <= 1, 'Mouth wide within bounds [0, 1]');

  // Test 4: STT Normalization
  console.log('\n[4. Testing Speech-To-Text Normalization]');
  const rawSTT = 'let us build a micro sas on web for with poly market';
  const normalized = normalizeSpeechTranscript(rawSTT);
  assert(normalized.includes('Micro-SaaS'), 'Normalized Micro-SaaS keyword');
  assert(normalized.includes('Web4'), 'Normalized Web4 keyword');
  assert(normalized.includes('Polymarket'), 'Normalized Polymarket keyword');

  // Test 5: TTS Speech Synthesis Formatter
  console.log('\n[5. Testing Text-To-Speech Formatter]');
  const ttsRes = await generateSpeechAudio({
    text: '[EMOTION: HAPPY] Alpha confirmed! Capturing yield.',
    archetype: 'CYBER_HUMANOID',
  });
  assert(ttsRes.durationEstimate > 0, `Duration estimated: ${ttsRes.durationEstimate}s`);
  assert(ttsRes.provider !== undefined, `Provider active: ${ttsRes.provider}`);

  // Test 6: Brain Conversation & Tool Intent Parsing
  console.log('\n[6. Testing Agent Brain Reasoning & Tool Execution]');
  const brainRes = await processAgentConversation({
    message: 'Scrape Reddit for recurring SaaS complaints',
    agentId: undefined,
  });
  assert(brainRes.cleanText.length > 0, `Response text: "${brainRes.cleanText.slice(0, 50)}..."`);
  assert(brainRes.emotion !== undefined, `Emotion detected: ${brainRes.emotion}`);
  assert(brainRes.lipSync.length > 0, `LipSync keyframes generated: ${brainRes.lipSync.length}`);
  assert(brainRes.toolExecution?.tool === 'reddit_scraper', 'Tool execution accurately parsed reddit_scraper');

  console.log(`\n========================================`);
  console.log(`🎯 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
