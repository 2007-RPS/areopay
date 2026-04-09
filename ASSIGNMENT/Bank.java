package ASSIGNMENT;

import java.util.ArrayList;
import java.util.Scanner;

public class Bank {

	private static final Scanner scanner = new Scanner(System.in);
	private static final ArrayList<SavingsAccount> accounts = new ArrayList<>();
	private static int nextAccountNumber = 1001;

	public static void main(String[] args) {
		System.out.println("==============================");
		System.out.println("   BANK ACCOUNT MANAGEMENT");
		System.out.println("==============================");

		int choice;
		do {
			showMenu();
			choice = readInt("Enter your choice: ");

			switch (choice) {
				case 1 -> createSavingsAccount();
				case 2 -> depositToAccount();
				case 3 -> withdrawFromAccount();
				case 4 -> displayAccountDetails();
				case 5 -> displayAllAccounts();
				case 6 -> searchByHolderName();
				case 7 -> viewTransactionHistory();
				case 8 -> System.out.println("Thank you for using the banking system.");
				default -> System.out.println("Invalid choice. Please try again.");
			}

			System.out.println();
		} while (choice != 8);
	}

	private static void showMenu() {
		System.out.println("1. Create Savings Account");
		System.out.println("2. Deposit Money");
		System.out.println("3. Withdraw Money");
		System.out.println("4. Display Account Details");
		System.out.println("5. Display All Accounts");
		System.out.println("6. Search by Account Holder Name");
		System.out.println("7. View Transaction History");
		System.out.println("8. Exit");
	}

	private static void createSavingsAccount() {
		System.out.println("\n--- Create Savings Account ---");
		String accountType = normalizeAccountType(readNonEmptyString("Enter account type: "));
		if (accountType == null) {
			System.out.println("Only Savings Account is supported in this project.");
			return;
		}

		String holderName = readNonEmptyString("Enter account holder name: ");
		double initialDeposit = readPositiveDouble("Enter initial deposit (minimum Rs. 500): ");

		try {
			SavingsAccount account = new SavingsAccount(generateAccountNumber(), holderName, initialDeposit);
			accounts.add(account);
			System.out.println("Account created successfully.");
			System.out.println("Account Number: " + account.getAccountNumber());
			System.out.println("Account Type  : " + accountType);
		} catch (IllegalArgumentException exception) {
			System.out.println("Account creation failed: " + exception.getMessage());
		}
	}

	private static String normalizeAccountType(String accountType) {
		String normalized = accountType.trim().replaceAll("\\s+", " ").toLowerCase();
		if (normalized.equals("savings") || normalized.equals("savings account")) {
			return "Savings Account";
		}
		return null;
	}

	private static void depositToAccount() {
		System.out.println("\n--- Deposit Money ---");
		SavingsAccount account = findAccountByNumber(readNonEmptyString("Enter account number: "));

		if (account == null) {
			System.out.println("Account not found.");
			return;
		}

		double amount = readPositiveDouble("Enter deposit amount: ");

		try {
			account.deposit(amount);
			System.out.println("Deposit successful. Current balance: Rs. " + formatAmount(account.getBalance()));
		} catch (IllegalArgumentException exception) {
			System.out.println("Deposit failed: " + exception.getMessage());
		}
	}

	private static void withdrawFromAccount() {
		System.out.println("\n--- Withdraw Money ---");
		SavingsAccount account = findAccountByNumber(readNonEmptyString("Enter account number: "));

		if (account == null) {
			System.out.println("Account not found.");
			return;
		}

		double amount = readPositiveDouble("Enter withdrawal amount: ");

		try {
			account.withdraw(amount);
			System.out.println("Withdrawal successful. Current balance: Rs. " + formatAmount(account.getBalance()));
		} catch (InsufficientBalanceException | IllegalArgumentException exception) {
			System.out.println("Withdrawal failed: " + exception.getMessage());
		}
	}

	private static void displayAccountDetails() {
		System.out.println("\n--- Display Account Details ---");
		SavingsAccount account = findAccountByNumber(readNonEmptyString("Enter account number: "));

		if (account == null) {
			System.out.println("Account not found.");
			return;
		}

		System.out.println(account);
	}

	private static void displayAllAccounts() {
		System.out.println("\n--- All Accounts ---");

		if (accounts.isEmpty()) {
			System.out.println("No accounts available.");
			return;
		}

		for (SavingsAccount account : accounts) {
			System.out.println(account);
			System.out.println();
		}
	}

	private static void searchByHolderName() {
		System.out.println("\n--- Search by Account Holder Name ---");
		String searchName = readNonEmptyString("Enter account holder name: ");
		boolean found = false;

		for (SavingsAccount account : accounts) {
			if (account.getAccountHolderName().equalsIgnoreCase(searchName)) {
				System.out.println(account);
				System.out.println();
				found = true;
			}
		}

		if (!found) {
			System.out.println("No account found for the given holder name.");
		}
	}

	private static void viewTransactionHistory() {
		System.out.println("\n--- Transaction History ---");
		SavingsAccount account = findAccountByNumber(readNonEmptyString("Enter account number: "));

		if (account == null) {
			System.out.println("Account not found.");
			return;
		}

		System.out.println("Account Number: " + account.getAccountNumber());
		System.out.println("Account Holder : " + account.getAccountHolderName());
		System.out.println("Transaction History:");

		for (String entry : account.getTransactionHistory()) {
			System.out.println("- " + entry);
		}
	}

	private static SavingsAccount findAccountByNumber(String accountNumber) {
		for (SavingsAccount account : accounts) {
			if (account.getAccountNumber().equalsIgnoreCase(accountNumber)) {
				return account;
			}
		}
		return null;
	}

	private static String generateAccountNumber() {
		return "SB" + nextAccountNumber++;
	}

	private static String readNonEmptyString(String prompt) {
		while (true) {
			System.out.print(prompt);
			String value = scanner.nextLine().trim();

			if (!value.isEmpty()) {
				return value;
			}

			System.out.println("Input cannot be empty. Please try again.");
		}
	}

	private static int readInt(String prompt) {
		while (true) {
			System.out.print(prompt);
			String input = scanner.nextLine().trim();

			try {
				return Integer.parseInt(input);
			} catch (NumberFormatException exception) {
				System.out.println("Please enter a valid integer.");
			}
		}
	}

	private static double readPositiveDouble(String prompt) {
		while (true) {
			System.out.print(prompt);
			String input = scanner.nextLine().trim();

			try {
				double value = Double.parseDouble(input);
				if (value > 0) {
					return value;
				}
				System.out.println("Value must be greater than zero.");
			} catch (NumberFormatException exception) {
				System.out.println("Please enter a valid number.");
			}
		}
	}

	private static String formatAmount(double amount) {
		return String.format("%.2f", amount);
	}
}
