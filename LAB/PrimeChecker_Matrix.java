/*
 * PrimeChecker_Matrix
 * --------------------
 * This program builds a 5×5 boolean matrix where each cell A[i][j] is:
 *   - false  when BOTH the row index i AND the column index j are prime numbers
 *   - true   otherwise (at least one of i or j is NOT prime)
 *
 * For m = 5, the valid indices are 0, 1, 2, 3, 4.
 * Among these, the prime numbers are: 2 and 3.
 *
 * So A[i][j] will be false only at positions where i ∈ {2,3} AND j ∈ {2,3},
 * i.e., at (2,2), (2,3), (3,2), (3,3) — exactly 4 cells.
 *
 * Expected output:
 *   true  true  true  true  true
 *   true  true  true  true  true
 *   true  true  false false true
 *   true  true  false false true
 *   true  true  true  true  true
 */
public class PrimeChecker_Matrix {

    /*
     * isPrime(int n)
     * ---------------
     * A helper method that determines whether a given integer n is a prime number.
     *
     * Algorithm (Trial Division):
     *   1. If n < 2, return false immediately (0 and 1 are not prime by definition).
     *   2. Try dividing n by every integer from 2 up to n/2.
     *      - If any of them divides n evenly (remainder == 0), n is composite → return false.
     *   3. If no divisor is found, n is prime → return true.
     *
     * Why n/2?  Any factor of n greater than n/2 would pair with a factor smaller
     * than 2, which is impossible for integers ≥ 2.  (Using √n would be even faster,
     * but n/2 is sufficient and simpler for small values.)
     *
     * The method is 'static' so it can be called directly from the static main()
     * method without creating an instance of the class.
     */
    static boolean isPrime(int n) {
        if (n < 2) return false;           // 0 and 1 are not prime
        for (int i = 2; i <= n / 2; i++)   // check every possible divisor from 2 to n/2
            if (n % i == 0) return false;   // n is divisible by i → not prime
        return true;                        // no divisor found → n is prime
    }

    public static void main(String[] args) {

        // -------- Step 1: Define matrix size --------
        // m = 5 means we work with indices 0 through 4.
        int m = 5;

        // -------- Step 2: Create the boolean matrix --------
        // A 2D boolean array of size m × m.
        // In Java, all elements default to false initially.
        boolean[][] A = new boolean[m][m];

        // -------- Step 3: Populate the matrix --------
        // For every cell (i, j):
        //   isPrime(i) && isPrime(j)  → true only when BOTH indices are prime
        //   !(...)                    → negate: cell becomes false when both are prime,
        //                               and true otherwise.
        //
        // This effectively marks the "intersection" of prime row and prime column
        // indices with false, and everything else with true.
        for (int i = 0; i < m; i++)        // iterate over each row index
            for (int j = 0; j < m; j++)    // iterate over each column index
                A[i][j] = !(isPrime(i) && isPrime(j));

        // -------- Step 4: Print the matrix --------
        // Uses a for-each loop to traverse each row, then each value in that row.
        // Each value is printed on the same line separated by a space;
        // after finishing a row, println() moves the cursor to the next line.
        for (boolean[] row : A) {          // row is a 1D boolean array (one row of the matrix)
            for (boolean val : row)        // val is a single boolean element in that row
                System.out.print(val + " ");
            System.out.println();          // newline after each row

            // Note: The total number of 'false' values equals
            // (number of prime indices)² — here 2² = 4 false values.
        }
    }
}
