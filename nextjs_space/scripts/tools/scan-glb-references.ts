import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runScan() {
  const args = process.argv.slice(2);
  const isDelete = args.includes('--delete');
  const filesArg = args.filter(a => !a.startsWith('--'));
  const targetFile = filesArg[0];

  const cosmeticsDir = path.join(process.cwd(), 'public', 'cosmetics');
  let filesToScan: string[] = [];

  if (targetFile) {
    filesToScan.push(targetFile);
  } else {
    filesToScan = fs.readdirSync(cosmeticsDir).filter(f => f.endsWith('.glb'));
  }

  console.log(`Scanning ${filesToScan.length} .glb files...`);

  for (const filename of filesToScan) {
    console.log(`\n--- Report for ${filename} ---`);
    let codeRefsCount = 0;
    try {
      const grepOut = execSync(`git grep -F "${filename}"`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
      const lines = grepOut.trim().split('\n').filter(Boolean);
      codeRefsCount = lines.length;
    } catch (e) {
      // no matches
    }

    const cosmetics = await prisma.cosmetic.findMany();
    let dbRefsCount = 0;
    const referencingRows: string[] = [];

    for (const c of cosmetics) {
      const rc = c.renderConfig as any;
      if (c.assetUrl?.includes(filename) || rc?.glbUrl?.includes(filename)) {
        dbRefsCount++;
        referencingRows.push(c.id);
      }
    }

    console.log(`codeRefs count: ${codeRefsCount}`);
    console.log(`dbRefs count: ${dbRefsCount}`);
    if (dbRefsCount > 0) {
      console.log(`Referencing DB rows: ${referencingRows.join(', ')}`);
    }

    if (isDelete) {
      if (codeRefsCount === 0 && dbRefsCount === 0) {
        const filepath = path.join(cosmeticsDir, filename);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          console.log(`[DELETED] ${filename}`);
        } else {
          console.log(`[NOT FOUND ON DISK] ${filename}`);
        }
      } else {
        console.log(`[SKIPPED DELETE] ${filename} - References exist.`);
      }
    }
  }
}

runScan().catch(e => console.error(e)).finally(() => prisma.$disconnect());
