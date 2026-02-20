
export class SearchService {
  /**
   * Calculates the Levenshtein distance between two strings.
   * This is a measure of the difference between two sequences,
   * representing the number of single-character edits (insertions, deletions, or substitutions)
   * required to change one word into the other.
   */
  private static levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  };

  /**
   * Performs a fuzzy match of a query against a target string.
   * - Prioritizes direct substring matches for speed.
   * - Splits the query into words and checks if each word fuzzily matches any word in the target.
   * - A "fuzzy match" is determined by a low Levenshtein distance, tolerating typos.
   */
  public static fuzzyMatch(query: string, target: string): boolean {
    if (!query) return true; // An empty query matches everything
    if (!target) return false;

    const q = query.toLowerCase().trim();
    const t = target.toLowerCase().trim();

    // Prioritize exact substring match for performance and relevance
    if (t.includes(q)) {
      return true;
    }

    // Word-based fuzzy matching
    const queryWords = q.split(' ').filter(Boolean);
    const targetWords = t.split(' ');

    return queryWords.every(qw =>
      targetWords.some(tw => {
        // Direct substring match for the word for speed
        if (tw.includes(qw)) {
          return true;
        }
        // Fuzzy match via Levenshtein distance for typo tolerance
        const distance = this.levenshteinDistance(qw, tw);
        // Allow more mistakes for longer words, but cap it to avoid overly loose matches.
        const tolerance = Math.min(2, Math.floor(qw.length / 4)); 
        return distance <= tolerance;
      })
    );
  }
}
