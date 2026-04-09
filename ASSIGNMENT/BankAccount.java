package ASSIGNMENT;

import java.util.ArrayList;

public class BankAccount {

    private final String accountNumber;
    private final String accountType;
    private String accountHolderName;
    private double balance;
    private final ArrayList<String> transactionHistory;

    public BankAccount(String accountNumber, String accountType, String accountHolderName, double initialBalance) {
        if (accountNumber == null || accountNumber.trim().isEmpty()) {
            throw new IllegalArgumentException("Account number cannot be empty.");
        }
        if (accountType == null || accountType.trim().isEmpty()) {
            throw new IllegalArgumentException("Account type cannot be empty.");
        }
        if (accountHolderName == null || accountHolderName.trim().isEmpty()) {
            throw new IllegalArgumentException("Account holder name cannot be empty.");
        }
        if (initialBalance < 0) {
            throw new IllegalArgumentException("Initial balance cannot be negative.");
        }

        this.accountNumber = accountNumber.trim();
        this.accountType = accountType.trim();
        this.accountHolderName = accountHolderName.trim();
        this.balance = initialBalance;
        this.transactionHistory = new ArrayList<>();
        transactionHistory.add("Account opened with balance: Rs. " + String.format("%.2f", initialBalance));
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public String getAccountHolderName() {
        return accountHolderName;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountHolderName(String accountHolderName) {
        if (accountHolderName == null || accountHolderName.trim().isEmpty()) {
            throw new IllegalArgumentException("Account holder name cannot be empty.");
        }
        this.accountHolderName = accountHolderName.trim();
    }

    public double getBalance() {
        return balance;
    }

    public void deposit(double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Deposit amount must be greater than zero.");
        }
        balance += amount;
        transactionHistory.add("Deposited: Rs. " + String.format("%.2f", amount));
    }

    protected void reduceBalance(double amount) {
        balance -= amount;
    }

    protected void recordTransaction(String message) {
        transactionHistory.add(message);
    }

    public ArrayList<String> getTransactionHistory() {
        return new ArrayList<>(transactionHistory);
    }

    protected void addBalance(double amount) {
        balance += amount;
    }

    @Override
    public String toString() {
        return "Account Number  : " + accountNumber + "\n"
                + "Account Holder  : " + accountHolderName + "\n"
                + "Account Type    : " + accountType + "\n"
                + "Balance         : Rs. " + String.format("%.2f", balance);
    }
}