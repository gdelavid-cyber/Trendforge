import { describe, it, expect } from 'vitest';

async function runBehavioralVerification() {
  const BASE_URL = 'http://localhost:3000';
  console.log(`Starting behavioral verification against ${BASE_URL}...`);

  // 1. Verify /api/tasks/stream baseline
  console.log('1. Testing /api/tasks/stream baseline...');
  const res1 = await fetch(`${BASE_URL}/api/tasks/stream?limit=5`);
  if (!res1.ok) throw new Error(`Stream API failed with status ${res1.status}`);
  const data1 = await res1.json();

  if (!Array.isArray(data1.tasks) || data1.tasks.length === 0) {
    throw new Error(`Expected tasks array with items, got: ${JSON.stringify(data1)}`);
  }
  console.log(`   ✓ Received ${data1.tasks.length} tasks (has nextCursor: ${Boolean(data1.nextCursor)})`);
  const firstTask = data1.tasks[0];
  if (!firstTask.id || !firstTask.title || typeof firstTask.estimatedEarningsHigh !== 'number') {
    throw new Error(`Task shape invalid: ${JSON.stringify(firstTask)}`);
  }
  console.log(`   ✓ Task #1 validated: "${firstTask.title}" (${firstTask.difficulty}, up to $${firstTask.estimatedEarningsHigh})`);

  // 2. Verify pagination with nextCursor
  console.log('2. Testing cursor pagination...');
  const cursor = data1.nextCursor;
  if (!cursor) throw new Error('Missing nextCursor on first page of limit=5');
  const res2 = await fetch(`${BASE_URL}/api/tasks/stream?limit=5&cursor=${encodeURIComponent(cursor)}`);
  const data2 = await res2.json();
  if (!Array.isArray(data2.tasks) || data2.tasks.length === 0) {
    throw new Error('Second page empty on valid cursor');
  }
  // Assert distinct IDs between page 1 and page 2
  const ids1 = new Set(data1.tasks.map((t: any) => t.id));
  const overlap = data2.tasks.filter((t: any) => ids1.has(t.id));
  if (overlap.length > 0) {
    throw new Error(`Cursor pagination returned duplicate IDs: ${overlap.map((o: any) => o.id).join(', ')}`);
  }
  console.log(`   ✓ Page 2 returned ${data2.tasks.length} unique tasks with zero overlap with Page 1.`);

  // 3. Verify filter criteria: sorting by earnings
  console.log('3. Testing sort=earnings...');
  const resEarnings = await fetch(`${BASE_URL}/api/tasks/stream?limit=5&sort=earnings`);
  const dataEarnings = await resEarnings.json();
  const earningsList = dataEarnings.tasks.map((t: any) => t.estimatedEarningsHigh);
  console.log(`   ✓ Earnings values: ${earningsList.join(', ')}`);
  for (let i = 1; i < earningsList.length; i++) {
    // Non-featured items should be descending
    if (!dataEarnings.tasks[i].isFeatured && !dataEarnings.tasks[i - 1].isFeatured) {
      if (earningsList[i] > earningsList[i - 1]) {
        throw new Error(`sort=earnings not descending: ${earningsList[i - 1]} followed by ${earningsList[i]}`);
      }
    }
  }

  // 4. Verify /api/tasks/trending JSON fallback
  console.log('4. Testing /api/tasks/trending JSON endpoint...');
  const resTrending = await fetch(`${BASE_URL}/api/tasks/trending`, {
    headers: { 'Accept': 'application/json' },
  });
  if (!resTrending.ok) throw new Error(`Trending API failed: ${resTrending.status}`);
  const dataTrending = await resTrending.json();
  if (!Array.isArray(dataTrending) || dataTrending.length === 0) {
    throw new Error(`Expected array of trending tasks, got ${JSON.stringify(dataTrending)}`);
  }
  console.log(`   ✓ Received ${dataTrending.length} trending tasks.`);

  // 5. Verify /earn and /tasks HTTP 200 response (no redirect loop or 404/500)
  console.log('5. Testing /earn and /tasks pages HTTP status...');
  const resEarn = await fetch(`${BASE_URL}/earn`);
  if (resEarn.status !== 200) throw new Error(`/earn returned status ${resEarn.status}`);
  console.log('   ✓ /earn returned HTTP 200 OK');

  const resTasks = await fetch(`${BASE_URL}/tasks`, { redirect: 'manual' });
  if (resTasks.status !== 200) {
    throw new Error(`/tasks returned unexpected status ${resTasks.status} (location: ${resTasks.headers.get('location')})`);
  }
  console.log('   ✓ /tasks returned HTTP 200 OK without redirecting to /auth/signin');

  console.log('\n========================================');
  console.log('ALL BEHAVIORAL CHECKS PASSED SUCCESSFULLY');
  console.log('========================================');
}

runBehavioralVerification().catch((err) => {
  console.error('\n❌ BEHAVIORAL VERIFICATION FAILED:', err);
  process.exit(1);
});
