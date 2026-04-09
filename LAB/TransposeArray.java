public class TransposeArray {
    public static void main(String[] args) {
 // Original 2D array with 2 rows and 3 columns
        int[][] originalArray = {
            {10, 20, 30},  // First row
            {40, 50, 60}   // Second row
        };
        
        // Create a new 2D array to hold the transposed array
        int rows = originalArray.length;    // Number of rows in the original array
        System.out.println("No of rows is :"+ rows);
        int cols = originalArray[0].length; // Number of columns in the original array
        System.out.println("No of columns is :"+ cols);

        int[][] transposedArray = new int[cols][rows]; // Transposed array will have columns as rows and rows as columns
        
        // Loop through each element of the original array and transpose it
        for (int i = 0; i < rows; i++) { // Loop through rows of original array
            for (int j = 0; j < cols; j++) { // Loop through columns of original array
                // Transpose: set element at (j, i) in transposedArray to originalArray[i, j]
                transposedArray[j][i] = originalArray[i][j];
                System.out.println(transposedArray[j][i]);

            }
        }
        
        // Print the transposed array
        System.out.println("After changing the rows and columns of the said array:");
        for (int i = 0; i < cols; i++) { // Loop through rows of transposed array
            for (int j = 0; j < rows; j++) { // Loop through columns of transposed array
                // Print each element in the transposed array
                System.out.print(transposedArray[i][j] + " ");
            }
            // Move to the next line after printing each row of the transposed array
            System.out.println();
        }
    }
}