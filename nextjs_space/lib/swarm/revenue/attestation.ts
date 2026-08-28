import crypto from 'crypto';

export interface MerkleProof {
  leaf: string;
  root: string;
  proof: { position: 'left' | 'right'; hash: string }[];
  verified: boolean;
}

export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

export interface RevenueAttestationData {
  taskId: string;
  templateType: string;
  salePriceCents: number;
  computeCostCents: number;
  netProfitCents: number;
  merkleRoot: string;
  timestamp: number;
}

export const EIP712_DOMAIN: EIP712Domain = {
  name: 'Trendly Revenue Attestation Swarm',
  version: '2.0.0',
  chainId: 137, // Polygon Mainnet
  verifyingContract: process.env.POLYGON_ANCHOR_CONTRACT_ADDRESS || '0x71C3A5A1b183669149fFA44E0E3D1e20499C6A7b',
};

export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Computes a standard SHA-256 Merkle Root from an array of raw strings / objects
 */
export function computeMerkleRoot(leaves: (string | object)[]): string {
  if (!leaves || leaves.length === 0) {
    return sha256('empty_tree');
  }

  let currentLevel = leaves.map(leaf => {
    const raw = typeof leaf === 'string' ? leaf : JSON.stringify(leaf);
    return sha256(raw);
  });

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : currentLevel[i];
      nextLevel.push(sha256(left + right));
    }
    currentLevel = nextLevel;
  }

  return currentLevel[0];
}

/**
 * Generates Merkle proof for a given leaf index
 */
export function generateMerkleProof(leaves: (string | object)[], index: number): MerkleProof {
  const leafRaw = typeof leaves[index] === 'string' ? (leaves[index] as string) : JSON.stringify(leaves[index]);
  const targetHash = sha256(leafRaw);
  const proofSteps: { position: 'left' | 'right'; hash: string }[] = [];

  let currentLevel = leaves.map(l => (typeof l === 'string' ? sha256(l) : sha256(JSON.stringify(l))));
  let currentIndex = index;

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : currentLevel[i];
      nextLevel.push(sha256(left + right));

      if (i === currentIndex || i + 1 === currentIndex) {
        if (currentIndex % 2 === 0) {
          if (i + 1 < currentLevel.length) {
            proofSteps.push({ position: 'right', hash: right });
          } else {
            proofSteps.push({ position: 'right', hash: left });
          }
        } else {
          proofSteps.push({ position: 'left', hash: left });
        }
      }
    }
    currentIndex = Math.floor(currentIndex / 2);
    currentLevel = nextLevel;
  }

  const root = currentLevel[0] || sha256('empty');
  return {
    leaf: targetHash,
    root,
    proof: proofSteps,
    verified: verifyMerkleProof(targetHash, proofSteps, root),
  };
}

/**
 * Verifies a Merkle proof against a root
 */
export function verifyMerkleProof(
  leafHash: string,
  proof: { position: 'left' | 'right'; hash: string }[],
  root: string
): boolean {
  let computedHash = leafHash;
  for (const step of proof) {
    if (step.position === 'left') {
      computedHash = sha256(step.hash + computedHash);
    } else {
      computedHash = sha256(computedHash + step.hash);
    }
  }
  return computedHash === root;
}

/**
 * Encodes and signs an EIP-712 structured revenue attestation
 */
export function signEIP712Attestation(
  data: RevenueAttestationData,
  privateKey?: string
): { signature: string; typedHash: string; domain: EIP712Domain } {
  const secret = privateKey || process.env.ATTESTATION_SIGNER_PRIVATE_KEY || 'trendly_eip712_secret_master_key_2026';

  const domainHash = sha256(
    JSON.stringify({
      type: 'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)',
      data: EIP712_DOMAIN,
    })
  );

  const structHash = sha256(
    JSON.stringify({
      type: 'RevenueAttestation(string taskId,string templateType,uint256 salePriceCents,uint256 computeCostCents,uint256 netProfitCents,string merkleRoot,uint256 timestamp)',
      data,
    })
  );

  const typedHash = sha256(`\x19\x01${domainHash}${structHash}`);
  const signature = '0x' + crypto.createHmac('sha256', secret).update(typedHash).digest('hex');

  return { signature, typedHash, domain: EIP712_DOMAIN };
}

/**
 * Verifies an EIP-712 revenue attestation signature
 */
export function verifyEIP712Attestation(
  data: RevenueAttestationData,
  signature: string,
  privateKey?: string
): boolean {
  const { signature: expected } = signEIP712Attestation(data, privateKey);
  return signature === expected;
}

/**
 * Backward-compatible HMAC signing
 */
export function signAttestationPayload(
  payload: Record<string, any>,
  privateKey?: string
): { signature: string; payloadHash: string } {
  const secret = privateKey || process.env.ATTESTATION_SIGNER_PRIVATE_KEY || 'trendly_sec_key_2026';
  const payloadStr = JSON.stringify(payload, Object.keys(payload).sort());
  const payloadHash = sha256(payloadStr);
  const signature = crypto.createHmac('sha256', secret).update(payloadHash).digest('hex');
  return { signature, payloadHash };
}

export function verifyAttestationSignature(
  payload: Record<string, any>,
  signature: string,
  privateKey?: string
): boolean {
  const { signature: expected } = signAttestationPayload(payload, privateKey);
  return signature === expected;
}
