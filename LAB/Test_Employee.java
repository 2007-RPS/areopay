class Employee {
    void work() {
        System.out.println("Employee is working");
    }
    double getSalary() {
        return 30000;
    }
}
class HRManager extends Employee {
    @Override
    void work() {
        System.out.println("HR Manager manages employees");
    }
    void addEmployee() {
        System.out.println("Adding new employee");
    }
}
public class Test_Employee {
    public static void main(String[] args) {
        HRManager hr = new HRManager();
        hr.work();
        System.out.println("Salary: " + hr.getSalary());
        hr.addEmployee();
    }
}
