/**
 * Utility functions for computing and working with diffs between text content.
 */

export type DiffLineType = "unchanged" | "added" | "removed" | "modified";

export interface DiffLine {
  type: DiffLineType;
  oldLineNum?: number;
  newLineNum?: number;
  oldContent?: string;
  newContent?: string;
}

/**
 * Computes a line-by-line diff between two strings using a simple LCS algorithm.
 */
export function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  // Compute longest common subsequence for line matching
  const lcs = computeLCS(oldLines, newLines);

  const result: DiffLine[] = [];
  let oldIdx = 0;
  let newIdx = 0;
  let oldLineNum = 1;
  let newLineNum = 1;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldLines[oldIdx];
    const newLine = newLines[newIdx];

    // Check if both lines are in LCS (unchanged)
    if (
      oldIdx < oldLines.length &&
      newIdx < newLines.length &&
      lcs[oldIdx][newIdx]
    ) {
      result.push({
        type: "unchanged",
        oldLineNum: oldLineNum++,
        newLineNum: newLineNum++,
        oldContent: oldLine,
        newContent: newLine,
      });
      oldIdx++;
      newIdx++;
    }
    // Line removed from old
    else if (
      oldIdx < oldLines.length &&
      (newIdx >= newLines.length || !lcs[oldIdx][newIdx])
    ) {
      result.push({
        type: "removed",
        oldLineNum: oldLineNum++,
        oldContent: oldLine,
      });
      oldIdx++;
    }
    // Line added in new
    else if (
      newIdx < newLines.length &&
      (oldIdx >= oldLines.length || !lcs[oldIdx][newIdx])
    ) {
      result.push({
        type: "added",
        newLineNum: newLineNum++,
        newContent: newLine,
      });
      newIdx++;
    }
  }

  return result;
}

/**
 * Computes longest common subsequence for line matching.
 * Returns a 2D boolean array where lcs[i][j] is true if lines match.
 */
function computeLCS(oldLines: string[], newLines: string[]): boolean[][] {
  const m = oldLines.length;
  const n = newLines.length;

  // DP table for LCS lengths
  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  // Compute LCS lengths
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find which lines are in the LCS
  const lcs: boolean[][] = Array(m)
    .fill(false)
    .map(() => Array(n).fill(false));

  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (oldLines[i - 1] === newLines[j - 1]) {
      lcs[i - 1][j - 1] = true;
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

/**
 * Groups consecutive diff lines into hunks for better readability.
 * Includes context lines around changes.
 */
export function groupIntoHunks(
  diffLines: DiffLine[],
  contextLines: number = 3,
): DiffLine[][] {
  const hunks: DiffLine[][] = [];
  let currentHunk: DiffLine[] = [];
  let unchangedCount = 0;

  for (const line of diffLines) {
    if (line.type === "unchanged") {
      unchangedCount++;

      // If we have a current hunk and too many unchanged lines, close it
      if (currentHunk.length > 0 && unchangedCount > contextLines * 2) {
        // Add trailing context
        for (let i = 0; i < contextLines && i < currentHunk.length; i++) {
          if (currentHunk[currentHunk.length - 1 - i].type !== "unchanged") {
            break;
          }
        }
        hunks.push([...currentHunk]);
        currentHunk = [];
        unchangedCount = 1;
      }

      currentHunk.push(line);
    } else {
      // Changed line - include previous context if starting new hunk
      if (currentHunk.length === 0 && unchangedCount > 0) {
        const contextStart = Math.max(
          0,
          diffLines.indexOf(line) - contextLines,
        );
        for (let i = contextStart; i < diffLines.indexOf(line); i++) {
          currentHunk.push(diffLines[i]);
        }
      }

      currentHunk.push(line);
      unchangedCount = 0;
    }
  }

  // Add final hunk if exists
  if (currentHunk.length > 0) {
    hunks.push(currentHunk);
  }

  return hunks;
}

/**
 * Generates a summary of changes from diff lines.
 */
export function getDiffSummary(diffLines: DiffLine[]): {
  additions: number;
  deletions: number;
  unchanged: number;
} {
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const line of diffLines) {
    switch (line.type) {
      case "added":
        additions++;
        break;
      case "removed":
        deletions++;
        break;
      case "unchanged":
        unchanged++;
        break;
    }
  }

  return { additions, deletions, unchanged };
}
