public class ExceptionExample {
	public static void main(String[] args) {
	    try {
	        int[] numbers = {1, 2, 3};
	        System.out.println("Before exception");
	        int result = numbers[5];
	        System.out.println("This line will not execute");
	    } catch (ArrayIndexOutOfBoundsException e) {
	        System.out.println("Caught an ArrayIndexOutOfBoundsException!");
	        System.out.println("Exception message: " + e.getMessage());
	    } finally {
	        System.out.println("This block always executes");
	    }

	    System.out.println("Program continues...");
	}
	}