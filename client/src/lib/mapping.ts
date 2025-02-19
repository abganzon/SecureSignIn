export function calculateMappingScore(source: string, target: string): number {
  // Normalize strings for comparison
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      // Remove special characters and extra spaces
      .replace(/[^a-z0-9]/g, "")
      // Convert common variations
      .replace(/number/g, "num")
      .replace(/address/g, "addr")
      .replace(/telephone/g, "phone")
      .replace(/email/g, "mail");
  };

  const normalizedSource = normalize(source);
  const normalizedTarget = normalize(target);

  // Exact match after normalization
  if (normalizedSource === normalizedTarget) {
    return 1;
  }

  // One string contains the other
  if (normalizedSource.includes(normalizedTarget) || 
      normalizedTarget.includes(normalizedSource)) {
    return 0.8;
  }

  // Calculate Levenshtein distance
  const sourceLength = normalizedSource.length;
  const targetLength = normalizedTarget.length;
  const matrix = Array(sourceLength + 1).fill(null).map(() => 
    Array(targetLength + 1).fill(null)
  );

  for (let i = 0; i <= sourceLength; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= targetLength; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= sourceLength; i++) {
    for (let j = 1; j <= targetLength; j++) {
      const cost = normalizedSource[i - 1] === normalizedTarget[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[sourceLength][targetLength];
  const maxLength = Math.max(sourceLength, targetLength);
  
  // Convert distance to similarity score (0-1)
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
}
