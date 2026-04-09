class Employee {
    String name;
    String address;
    double salary;
    String jobTitle;

    Employee(String name, String address, double salary, String jobTitle) {
        this.name = name;
        this.address = address;
        this.salary = salary;
        this.jobTitle = jobTitle;
    }

    void calculateBonus() {
        double bonus = salary * 0.10;
        System.out.println(name + " Bonus: " + bonus);
    }

    void performanceReport() {
        System.out.println("Performance report of " + name + " is Good.");
    }

    void manageProject() {
        System.out.println(name + " is managing a project.");
    }
}

class Manager extends Employee {

    Manager(String name, String address, double salary) {
        super(name, address, salary, "Manager");
    }

    void calculateBonus() {
        double bonus = salary * 0.20;
        System.out.println(name + " (Manager) Bonus: " + bonus);
    }
}

class Developer extends Employee {

    Developer(String name, String address, double salary) {
        super(name, address, salary, "Developer");
    }

    void calculateBonus() {
        double bonus = salary * 0.15;
        System.out.println(name + " (Developer) Bonus: " + bonus);
    }
}

class Programmer extends Employee {

    Programmer(String name, String address, double salary) {
        super(name, address, salary, "Programmer");
    }

    void calculateBonus() {
        double bonus = salary * 0.12;
        System.out.println(name + " (Programmer) Bonus: " + bonus);
    }
}

public class Company {
    public static void main(String[] args) {

        Manager m = new Manager("Ravi", "Hyderabad", 80000);
        Developer d = new Developer("Sneha", "Warangal", 60000);
        Programmer p = new Programmer("Rahul", "Karimnagar", 50000);

        m.calculateBonus();
        m.performanceReport();
        m.manageProject();

        System.out.println();

        d.calculateBonus();
        d.performanceReport();
        d.manageProject();

        System.out.println();

        p.calculateBonus();
        p.performanceReport();
        p.manageProject();
    }
}
