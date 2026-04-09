// Base class Employee
class Employee {
    String name, address, jobTitle;
    double salary;

    // Constructor
    Employee(String name, String address, double salary, String jobTitle) {
        this.name = name;
        this.address = address;
        this.salary = salary;
        this.jobTitle = jobTitle;
    }

    // Method to calculate bonus (default 10%)
    double calculateBonus() {
        return salary * 0.10;
    }

    // Method to generate performance report
    void generateReport() {
        System.out.println(jobTitle + " " + name + " has a good performance.");
    }
}

// Subclass Manager
class Manager extends Employee {
    Manager(String name, String address, double salary) {
        super(name, address, salary, "Manager");
    }

    // Additional method for managing projects
    void manageProject() {
        System.out.println(name + " is managing a project.");
    }

    // Override bonus (15%)
    @Override
    double calculateBonus() {
        return salary * 0.15;
    }
}

// Subclass Developer
class Developer extends Employee {
    Developer(String name, String address, double salary) {
        super(name, address, salary, "Developer");
    }

    void manageProject() {
        System.out.println(name + " is developing a project.");
    }
}

// Subclass Programmer
class Programmer extends Employee {
    Programmer(String name, String address, double salary) {
        super(name, address, salary, "Programmer");
    }

    void manageProject() {
        System.out.println(name + " is coding for a project.");
    }
}

// Main class to test
public class EmployeeTest {
    public static void main(String[] args) {
        Manager mgr = new Manager("SAM-ALTMAN", "NY", 80000);
        Developer dev = new Developer("ELON MUSK", "LA", 70000);
        Programmer prog = new Programmer("STEVE JOBS", "SF", 60000);

        // Call methods
        mgr.generateReport();
        mgr.manageProject();
        System.out.println("Manager Bonus: " + mgr.calculateBonus());

        dev.generateReport();
        dev.manageProject();
        System.out.println("Developer Bonus: " + dev.calculateBonus());

        prog.generateReport();
        prog.manageProject();
        System.out.println("Programmer Bonus: " + prog.calculateBonus());
    }
}