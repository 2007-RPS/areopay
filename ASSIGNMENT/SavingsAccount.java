package ASSIGNMENT;

public class SavingsAccount extends BankAccount {

    public static final double MINIMUM_BALANCE = 500.0;

    public SavingsAccount(String accountNumber, String accountHolderName, double initialBalance) {
        super(accountNumber, "Savings Account", accountHolderName, initialBalance);

        if (initialBalance < MINIMUM_BALANCE) {
            throw new IllegalArgumentException("Initial deposit must be at least Rs. " + MINIMUM_BALANCE + ".");
        }
    }

    public void withdraw(double amount) throws InsufficientBalanceException {
        if (amount <= 0) {
            throw new IllegalArgumentException("Withdrawal amount must be greater than zero.");
        }

        if (getBalance() - amount < MINIMUM_BALANCE) {
            throw new InsufficientBalanceException(
                    "Insufficient balance. Minimum balance of Rs. " + String.format("%.2f", MINIMUM_BALANCE)
                            + " must be maintained.");
        }

        reduceBalance(amount);
        recordTransaction("Withdrawn: Rs. " + String.format("%.2f", amount));
    }

    @Override
    public String toString() {
        return "Account Number  : " + getAccountNumber() + "\n"
                + "Account Holder  : " + getAccountHolderName() + "\n"
                + "Account Type    : " + getAccountType() + "\n"
                + "Balance         : Rs. " + String.format("%.2f", getBalance()) + "\n"
                + "Minimum Balance : Rs. " + String.format("%.2f", MINIMUM_BALANCE);
    }
}