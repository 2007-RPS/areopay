import java.util.Scanner;
public class CheckDoubleRange {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter first double value: ");
        double x = sc.nextDouble();
        System.out.print("Enter second double value: ");
        double y = sc.nextDouble();
        if (x > 0 && x < 1 && y > 0 && y < 1) {
            System.out.println("true");
        } else {
            System.out.println("false");
        }
    }
}
