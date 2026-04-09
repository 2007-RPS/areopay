public class ExceptionDemo {
    public static void main(String[] args) {

        try {
            int a = 10;
            int b = 0;

            // This will cause an ArithmeticException
            int result = a / b;

            System.out.println("Result: " + result);
        }

        catch (ArithmeticException e) {
            System.out.println("Exception caught: Division by zero is not allowed.");
        }

        System.out.println("Program continues after handling the exception.");
    }
}
