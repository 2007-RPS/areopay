
class BankAccount {
    protected double balance;

    public BankAccount(double initialBalance) {
        this.balance = initialBalance;
    }

    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
            System.out.println("Deposited: $" + amount + ", New Balance: $" + balance);
        } else {
            System.out.println("Deposit amount must be positive.");
        }
    }

    public void withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
    System.out.println("Withdrawn: $" + amount + ", Remaining Balance: $" + balance);
        } else {
    System.out.println("Invalid withdrawal amount or insufficient balance.");
        }
    }

    public void displayBalance() {
        System.out.println("Current Balance: $" + balance);
    }
}

class SavingsAccount extends BankAccount {

    public SavingsAccount(double initialBalance) {
        super(initialBalance);
    }

    @Override
    public void withdraw(double amount) {
        if (balance - amount < 100) {
            System.out.println("Withdrawal denied! Minimum balance of $100 must be maintained.");
        } else {
            super.withdraw(amount);
        }
    }
}

public class BankMain {
    public static void main(String[] args) {
        SavingsAccount myAccount = new SavingsAccount(700);

        myAccount.displayBalance();

        myAccount.deposit(200);

        myAccount.withdraw(300);

        myAccount.withdraw(350);

        myAccount.displayBalance();
    }}