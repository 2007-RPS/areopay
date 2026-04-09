import java.util.Scanner;
import java.util.Arrays;
public class K_Largest_Elements {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        // Step 1: Input array size
        System.out.print("Enter array size: ");
        int n = sc.nextInt();

        // Step 2: Input array elements
        int[] arr = new int[n];
        System.out.println("Enter array elements:");
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }

        // Step 3: Input value of k
        System.out.print("Enter value of k: ");
        int k = sc.nextInt();

        // Step 4: Sort the array
        Arrays.sort(arr);

        // Step 5: Print k largest elements
        System.out.println("K largest elements:");
        for (int i = n - 1; i >= n - k; i--) {
            System.out.print(arr[i] + " ");
        }
    }
}
