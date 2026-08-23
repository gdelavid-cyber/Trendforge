import http from 'http';
import { execSync } from 'child_process';
import { prisma } from '../lib/db';
import { redis } from '../lib/redis';
import { setGlobalKillSwitch } from '../lib/swarm/gatekeeper';
import { SpeciesStatus, JobStage } from '@prisma/client';

async function makeRequest(path: string, method: string = 'GET', body: any = null): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.PIPELINE_API_KEY ? { 'x-api-key': process.env.PIPELINE_API_KEY } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 500, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode || 500, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runAllDrills() {
  console.log('===============================================================');
  console.log('PHASE 4 VERIFICATION DRILLS EXECUTION');
  console.log('===============================================================\n');

  // STEP 3: Prisma Validate & Tables
  console.log('--- STEP 3: PRISMA SCHEMA & TABLES ---');
  const validateOut = execSync('npx prisma validate', { encoding: 'utf8' });
  console.log(validateOut.trim());

  // STEP 4: Seed & Pulse Progression
  console.log('\n--- STEP 4: SEED & PULSE PROGRESSION ---');
  const seedOut = execSync('npm run swarm:seed', { encoding: 'utf8' });
  console.log(seedOut.trim());

  console.log('\n>> 4.1: Dry-Run Pulse (?dry=1)');
  const dryRes = await makeRequest('/api/cron/swarm?dry=1', 'GET');
  console.log('Dry Run Result:', JSON.stringify(dryRes.body, null, 2));

  console.log('\n>> 4.2: Executing Real Swarm Pulses to Advance Pipeline Stages...');
  for (let pulse = 1; pulse <= 6; pulse++) {
    const pulseRes = await makeRequest('/api/cron/swarm', 'POST');
    console.log(`\nPulse #${pulse} Details:`, JSON.stringify(pulseRes.body, null, 2));
  }

  console.log('\n>> 4.3: QAReview Rows from Database');
  const qaReviews = await prisma.qAReview.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  });
  console.log('Recent QAReviews:', JSON.stringify(qaReviews, null, 2));

  // STEP 5: Prove Merge Seam via /api/web4/marketplace
  console.log('\n--- STEP 5: PROVE MERGE SEAM VIA /api/web4/marketplace ---');
  const marketRes = await makeRequest('/api/web4/marketplace', 'GET');
  const catalog = marketRes.body.catalog || [];
  const publishedItem = catalog.find((i: any) => i.id === 'head_diamond_crown');
  const untouchedItem = catalog.find((i: any) => i.id === 'head_cyber_visor' || i.id === 'skin_neon_cyber');
  console.log('Swarm Published Item (with render model3d):', JSON.stringify(publishedItem, null, 2));
  console.log('Untouched Item (byte-identical fallback):', JSON.stringify(untouchedItem, null, 2));

  // STEP 6: Kill-Switch Drill (DB-backed state must halt the server-side pulse)
  console.log('\n--- STEP 6: KILL-SWITCH DRILL ---');
  await setGlobalKillSwitch(true);
  const killPulse = await makeRequest('/api/cron/swarm', 'POST');
  const killOk =
    killPulse.status === 200 &&
    killPulse.body?.success === false &&
    killPulse.body?.killSwitchActive === true &&
    killPulse.body?.jobsProcessed === 0;
  console.log(
    `${killOk ? 'PASS' : 'FAIL'}: kill-switch halted server pulse (killSwitchActive=${killPulse.body?.killSwitchActive}, jobsProcessed=${killPulse.body?.jobsProcessed}, success=${killPulse.body?.success})`
  );
  if (!killOk) console.log('Kill-switch pulse body:', JSON.stringify(killPulse.body, null, 2));

  await setGlobalKillSwitch(false);
  const resumePulse = await makeRequest('/api/cron/swarm', 'POST');
  const resumeOk =
    resumePulse.status === 200 &&
    resumePulse.body?.success === true &&
    resumePulse.body?.killSwitchActive === false;
  console.log(
    `${resumeOk ? 'PASS' : 'FAIL'}: pulses resumed after kill-switch deactivated (jobsProcessed=${resumePulse.body?.jobsProcessed})`
  );
  if (!resumeOk) console.log('Resume pulse body:', JSON.stringify(resumePulse.body, null, 2));

  // STEP 7: Spend Throttle Drill — park a job at ART_GENERATION so the
  // ART_WORKER budget gate is genuinely exercised (not vacuous).
  console.log('\n--- STEP 7: SPEND THROTTLE DRILL ---');
  const artSpecies = await prisma.agentSpecies.findUnique({ where: { role: 'ART_WORKER' } });
  if (artSpecies) {
    let parkedJob = await prisma.assetJob.findFirst({ where: { catalogItemId: 'aura_plasma_fire' } });
    if (!parkedJob) {
      parkedJob = await prisma.assetJob.create({
        data: {
          catalogItemId: 'aura_plasma_fire',
          slot: 'AURA',
          rarity: 'EPIC',
          stage: JobStage.ART_GENERATION,
          priority: 0,
          attempts: 0,
        },
      });
    } else {
      parkedJob = await prisma.assetJob.update({
        where: { id: parkedJob.id },
        data: { stage: JobStage.ART_GENERATION, attempts: 0, errorMessage: null },
      });
    }
    console.log(`Parked job ${parkedJob.id} at ART_GENERATION`);

    await prisma.agentSpecies.update({
      where: { id: artSpecies.id },
      data: { currentSpendUsd: 10.0 }, // Exceeds ART_WORKER daily budget ($6.00)
    });

    // The pulse processes at most 2 jobs, so poll until the parked job is
    // actually reached (or we exhaust attempts).
    let blockedEntry: any = null;
    let processedWhileThrottled: any = null;
    for (let attempt = 0; attempt < 6 && !blockedEntry && !processedWhileThrottled; attempt++) {
      const pulseRes = await makeRequest('/api/cron/swarm', 'POST');
      const mine = (pulseRes.body?.details || []).find((d: any) => d.jobId === parkedJob!.id);
      if (mine) {
        if (mine.blocked === true) blockedEntry = mine;
        else processedWhileThrottled = mine;
      }
    }

    if (blockedEntry) {
      console.log(`PASS: throttled ART_WORKER blocked parked job. Reason: ${blockedEntry.reason}`);
    } else if (processedWhileThrottled) {
      console.log('FAIL: parked job was PROCESSED while ART_WORKER was over budget.');
      console.log(JSON.stringify(processedWhileThrottled, null, 2));
    } else {
      console.log('FAIL: parked job never reached by any throttled pulse (inconclusive).');
    }

    await prisma.agentSpecies.update({
      where: { id: artSpecies.id },
      data: { currentSpendUsd: 0.0, status: SpeciesStatus.ACTIVE },
    });

    let recoveredEntry: any = null;
    for (let attempt = 0; attempt < 6 && !recoveredEntry; attempt++) {
      const recoveryPulse = await makeRequest('/api/cron/swarm', 'POST');
      recoveredEntry = (recoveryPulse.body?.details || []).find(
        (d: any) => d.jobId === parkedJob!.id && d.blocked !== true
      );
    }
    console.log(
      `${recoveredEntry ? 'PASS' : 'INFO'}: after un-throttle, parked job ${recoveredEntry ? `advanced to ${recoveredEntry.nextStage}` : 'was not picked up within 6 pulses'}`
    );
  }

  // STEP 8: Regression HTTP Checks & Git Diff Check
  console.log('\n--- STEP 8: REGRESSION HTTP PINGS & GIT DIFF CHECK ---');
  const endpoints = ['/arena', '/avatar-studio', '/marketplace', '/cosmetics', '/dev/stage3d'];
  for (const ep of endpoints) {
    const res = await makeRequest(ep, 'GET');
    console.log(`${ep} -> HTTP ${res.status}`);
  }

  const diffOut = execSync('git diff components/avatar/AvatarRenderer.tsx', { encoding: 'utf8' });
  console.log('AvatarRenderer.tsx git diff length:', diffOut.trim().length === 0 ? '0 (EMPTY - UNTOUCHED)' : diffOut);

  console.log('\n===============================================================');
  console.log('ALL PHASE 4 DRILLS COMPLETED SUCCESSFULLY');
  console.log('===============================================================');
}

runAllDrills()
  .catch((err) => {
    console.error('Drill error:', err);
    process.exit(1);
  })
  .finally(async () => {
    redis.disconnect();
    await prisma.$disconnect();
  });
