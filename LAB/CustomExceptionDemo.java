class InvalidAgeException extends Exception {
    InvalidAgeException(String message) {
        super(message);
    }
}

public class CustomExceptionDemo {

    static void checkAge(int age) throws InvalidAgeException {

        if (age < 18) {
            // Throw custom exception
            throw new InvalidAgeException("Age must be 18 or above.");
        } else {
            System.out.println("Age is valid. You are eligible.");
        }
    }

    public static void main(String[] args) {

        try {
            checkAge(16);  // Invalid input
        }

        catch (InvalidAgeException e) {
            System.out.println("Exception: " + e.getMessage());
        }

    }
}
