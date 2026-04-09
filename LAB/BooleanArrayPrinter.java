public class BooleanArrayPrinter {
    public static void main(String[] args) {
// Step 1: Define a 2D boolean array with sample values (2 rows, 3 columns)
        boolean[][] array = {
            {true, false, true},
            {false, true, false} 
        };

        // Step 2: Loop through the rows of the 2D array
        for (int i = 0; i < array.length; i++) { // Outer loop iterates over each row
            
            // Step 3: Loop through each element (column) in the current row
            for (int j = 0; j < array[i].length; j++) { // Inner loop iterates over each column
                
                // Step 4: Check the boolean value and print 't' if true, 'f' if false
                if (array[i][j]) { // If the element is true
                    System.out.print("t "); // Print 't' followed by a space
                } else { // If the element is false
                    System.out.print("f "); // Print 'f' followed by a space
                }
            }
            
            // Step 5: Move to the next line after printing all elements in a row
            System.out.println(); // Prints a newline to format the output properly
        }
    }
}