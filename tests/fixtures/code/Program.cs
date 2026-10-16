using System.Linq;

namespace Fixtures;

public record User(string Name, int Age);

public static class Program {
	public static async Task Main() {
		var adults = new[] { new User("Ada", 36) }.Where(u => u.Age >= 18);
		Console.WriteLine($"{adults.Count()} adult(s)");
	}
}
