public class Expression_Calculator {
     public static void main(String[] args) {
        int a = (101 + 0) / 3;
        System.out.println("(101 + 0) / 3 = " + a);
        double b = 3.0e-6 * 10000000.1;
        System.out.println("(3.0e-6 * 10000000.1) = " + b);
        boolean c = (true && true);
        System.out.println("(true && true) = " + c);
        boolean d = (false && true);
        System.out.println("(false && true) = " + d);
        boolean e = (false && (false || true));
        System.out.println("(false && (false || true)) = " + e);
        boolean f = (false || false) && (true && true);
        System.out.println("((false || false) && (true && true)) = " + f);
    }

}
