class BankAccount {
    double balance;

    BankAccount(double balance) {
        this.balance = balance;
    }

    void deposit(double amount) {
        balance = balance + amount;
        System.out.println("Amount Deposited: " + amount);
        System.out.println("Current Balance: " + balance);
    }

    void withdraw(double amount) {
        if (amount <= balance) {
            balance = balance - amount;
            System.out.println("Amount Withdrawn: " + amount);
        } else {
            System.out.println("Insufficient Balance");
        }
        System.out.println("Current Balance: " + balance);
    }
}

class SavingsAccount extends BankAccount {

    SavingsAccount(double balance) {
        super(balance);
    }

    @Override
    void withdraw(double amount) {
        if ((balance - amount) < 100) {
            System.out.println("Withdrawal denied! Minimum balance of 100 must be maintained.");
        } else {
            balance = balance - amount;
            System.out.println("Amount Withdrawn: " + amount);
            System.out.println("Current Balance: " + balance);
        }
    }
}

public class Main {
    public static void main(String[] args) {

        SavingsAccount acc = new SavingsAccount(500);

        acc.deposit(200);
        acc.withdraw(300);
        acc.withdraw(400); // This should be denied
    }
}
