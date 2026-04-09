# Bank Account Management System

## 1. Introduction
This project is a simple menu-driven Java banking application developed using object-oriented programming concepts. It demonstrates how a bank account system can be modeled using classes, inheritance, encapsulation, `ArrayList`, and custom exception handling.

## 2. Objectives
The main objectives of this project are:

- To create and manage savings accounts.
- To perform deposit and withdrawal operations safely.
- To maintain a minimum balance in savings accounts.
- To store multiple accounts using `ArrayList`.
- To handle invalid operations using a custom exception.
- To design a clear menu-driven console program.

## 3. System Overview
The system allows the user to:

- Enter the account type during creation.
- Create a new savings account.
- Deposit money into an existing account.
- Withdraw money from an account.
- Display details of one account.
- Display all available accounts.
- Search accounts by account holder name.
- View transaction history for each account.

Each account has an account number, account type, account holder name, and balance. A savings account also enforces a minimum balance rule.

## 4. Class Design Explanation

### BankAccount Class
This is the base class. It stores common account data such as account number, account type, account holder name, and balance. It provides methods for deposit and basic data access.

### SavingsAccount Class
This class extends `BankAccount`. It adds the minimum balance rule and overrides withdrawal behavior so the balance does not go below the required limit.

### InsufficientBalanceException Class
This is a custom exception class used when a withdrawal would break the minimum balance condition.

### Bank Class
This is the main class. It contains the menu-driven program and uses an `ArrayList<SavingsAccount>` to store multiple accounts.

## 5. OOP Concepts Used

- **Encapsulation**: Data members are private, and access is controlled through methods.
- **Inheritance**: `SavingsAccount` extends `BankAccount`.
- **Polymorphism**: Method overriding is used in `SavingsAccount` for withdrawal behavior and `toString()`.
- **Abstraction**: The user interacts with simple menu options while internal account processing remains hidden.

## 6. Data Structures Used
The project uses `ArrayList` to store all bank accounts dynamically. This is better than a fixed-size array because the number of accounts can grow as needed.

## 7. Exception Handling
The program uses both standard and custom exception handling.

- `IllegalArgumentException` is used for invalid input such as empty names, negative amounts, or zero deposit/withdrawal values.
- `InsufficientBalanceException` is used when a withdrawal would reduce the balance below the minimum required amount.

This makes the program more reliable and user-friendly.

## 8. Menu-Driven Logic Explanation
The program continuously displays a menu until the user chooses to exit.

1. Create account.
2. Deposit money.
3. Withdraw money.
4. Display a specific account.
5. Display all accounts.
6. Search by account holder name.
7. View transaction history.
8. Exit.

The `switch` statement is used to execute the selected operation. Input validation is performed before each operation.

## 9. Challenges Faced and Solutions

- **Challenge: Preventing invalid input**  
  **Solution:** Input is checked carefully using loops and exception handling.

- **Challenge: Maintaining minimum balance**  
  **Solution:** A custom exception is thrown when a withdrawal violates the minimum balance rule.

- **Challenge: Storing multiple accounts**  
  **Solution:** `ArrayList` is used to store and search for account objects easily.

## 10. Conclusion
This project successfully demonstrates a basic banking system using core Java and object-oriented programming. It is simple, structured, and suitable for academic submission and viva preparation. The use of inheritance, encapsulation, `ArrayList`, and custom exceptions makes the project complete and practical.

## 11. UML Class Diagram in Text Format

```text
-------------------------------------------------
| BankAccount                                    |
-------------------------------------------------
| - accountNumber : String                       |
| - accountHolderName : String                   |
| - balance : double                             |
-------------------------------------------------
| + BankAccount(accountNumber, accountType,      |
|   name, balance)                               |
| + getAccountNumber() : String                  |
| + getAccountType() : String                    |
| + getAccountHolderName() : String              |
| + setAccountHolderName(name) : void            |
| + getBalance() : double                        |
| + deposit(amount) : void                       |
| # reduceBalance(amount) : void                 |
| # addBalance(amount) : void                    |
| + toString() : String                          |
-------------------------------------------------
                 ▲
                 |
-------------------------------------------------
| SavingsAccount                                 |
-------------------------------------------------
| + MINIMUM_BALANCE : double                     |
-------------------------------------------------
| + SavingsAccount(accountNumber, name, balance) |
| + withdraw(amount) : void                      |
| + toString() : String                          |
-------------------------------------------------
                 ▲
                 |
-------------------------------------------------
| InsufficientBalanceException                   |
-------------------------------------------------
| + InsufficientBalanceException(message)        |
-------------------------------------------------
```

## 12. Sample Output for Screenshots

```text
==============================
   BANK ACCOUNT MANAGEMENT
==============================
1. Create Savings Account
2. Deposit Money
3. Withdraw Money
4. Display Account Details
5. Display All Accounts
6. Search by Account Holder Name
7. View Transaction History
8. Exit
Enter your choice: 1

--- Create Savings Account ---
Enter account type: Savings
Enter account holder name: Rahul Sharma
Enter initial deposit (minimum Rs. 500): 2000
Account created successfully.
Account Number: SB1001
Account Type  : Savings Account

1. Create Savings Account
2. Deposit Money
3. Withdraw Money
4. Display Account Details
5. Display All Accounts
6. Search by Account Holder Name
7. View Transaction History
8. Exit
Enter your choice: 2

--- Deposit Money ---
Enter account number: SB1001
Enter deposit amount: 1000
Deposit successful. Current balance: Rs. 3000.00

1. Create Savings Account
2. Deposit Money
3. Withdraw Money
4. Display Account Details
5. Display All Accounts
6. Search by Account Holder Name
7. View Transaction History
8. Exit
Enter your choice: 3

--- Withdraw Money ---
Enter account number: SB1001
Enter withdrawal amount: 1200
Withdrawal successful. Current balance: Rs. 1800.00

1. Create Savings Account
2. Deposit Money
3. Withdraw Money
4. Display Account Details
5. Display All Accounts
6. Search by Account Holder Name
7. View Transaction History
8. Exit
Enter your choice: 3

--- Withdraw Money ---
Enter account number: SB1001
Enter withdrawal amount: 1500
Withdrawal failed: Insufficient balance. Minimum balance of Rs. 500.00 must be maintained.

1. Create Savings Account
2. Deposit Money
3. Withdraw Money
4. Display Account Details
5. Display All Accounts
6. Search by Account Holder Name
7. View Transaction History
8. Exit
Enter your choice: 4

--- Display Account Details ---
Enter account number: SB1001
Account Number  : SB1001
Account Holder  : Rahul Sharma
Account Type    : Savings Account
Balance         : Rs. 1800.00
Minimum Balance : Rs. 500.00

1. Create Savings Account
2. Deposit Money
3. Withdraw Money
4. Display Account Details
5. Display All Accounts
6. Search by Account Holder Name
7. View Transaction History
8. Exit
Enter your choice: 8
Thank you for using the banking system.
```

## 13. Additional Features for Extra Marks

### Feature 1: Interest Calculation
Add a method to calculate yearly interest for a savings account.

```java
public double calculateYearlyInterest(double rate) {
    return getBalance() * rate / 100;
}
```

### Feature 2: Search by Account Holder Name
Add a search method to find accounts by name.

```java
public static void searchByName(String name) {
    for (SavingsAccount account : accounts) {
        if (account.getAccountHolderName().equalsIgnoreCase(name)) {
            System.out.println(account);
        }
    }
}
```

### Feature 3: Transaction History
Maintain a list of deposits and withdrawals for each account.

```java
private final ArrayList<String> transactionHistory = new ArrayList<>();
```

### Feature 4: Search by Account Holder Name
This helps the user quickly locate matching accounts.

```java
public static void searchByHolderName(String name) {
  for (SavingsAccount account : accounts) {
    if (account.getAccountHolderName().equalsIgnoreCase(name)) {
      System.out.println(account);
    }
  }
}
```
