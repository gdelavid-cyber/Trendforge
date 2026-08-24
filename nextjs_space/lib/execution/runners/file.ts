import { PutObjectCommand } from '@aws-sdk/client-s3';
import type { LlmFn } from '../skills';
import type { ParsedStep } from '@/lib/tasks/steps';
import { createS3Client, getBucketConfig } from '@/lib/aws-config';

// Real deliverable files: renders CSV/Markdown from the run's outputs and
// uploads to S3 when bucket config exists; otherwise returns the content
// inline (still a real deliverable, just not hosted).

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'artifact';
}

export async function runFileStep(params: {
  step: ParsedStep;
  userId: string;
  userTaskId: string;
  stepIndex: number;
  previousResults: string[];
  llm: LlmFn;
}): Promise<{ output: string; fileName: string; url: string | null; content: string; format: 'csv' | 'md' }> {
  const { step, userId, userTaskId, stepIndex, previousResults, llm } = params;

  const wantsCsv = /\bcsv\b|spreadsheet|sheet/i.test(`${step.title} ${step.description}`);
  const format: 'csv' | 'md' = wantsCsv ? 'csv' : 'md';

  const content = await llm([
    {
      role: 'system',
      content: wantsCsv
        ? 'You produce clean, valid CSV files. Output ONLY raw CSV content — no code fences, no commentary. First row is the header.'
        : 'You produce clean Markdown documents. Output ONLY the Markdown content — no code fences, no commentary.',
    },
    {
      role: 'user',
      content: `Create the deliverable for this step of "${'task'}": ${step.title}\n${step.description}\n\n${previousResults.length ? `Source material from earlier steps:\n${previousResults.map((r, i) => `${i + 1}. ${r}`).join('\n')}` : 'No source material — produce a sensible template with real structure.'}`,
    },
  ]);

  const text = (content || '').replace(/^```[a-z]*\n?|\n?```$/g, '').trim();
  const fileName = `${slugify(step.title)}.${format}`;

  const { bucketName, folderPrefix } = getBucketConfig();
  if (!bucketName) {
    return {
      output: `Generated ${fileName} (S3 not configured — content below).\n\n${text.slice(0, 2000)}`,
      fileName,
      url: null,
      content: text,
      format,
    };
  }

  const key = `${folderPrefix ? `${folderPrefix}/` : ''}artifacts/${userId}/${userTaskId}/${stepIndex}-${fileName}`;
  const client = createS3Client();
  await client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: text,
    ContentType: format === 'csv' ? 'text/csv' : 'text/markdown',
  }));

  return {
    output: `Deliverable ready: ${fileName} — https://${bucketName}.s3.amazonaws.com/${key}`,
    fileName,
    url: `https://${bucketName}.s3.amazonaws.com/${key}`,
    content: text,
    format,
  };
}
