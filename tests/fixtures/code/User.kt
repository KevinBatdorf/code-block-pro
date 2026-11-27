package fixtures

data class User(val name: String, val age: Int = 0)

fun main() {
	val users = listOf(User("Ada", 36), User("Linus"))
	val names = users.filter { it.age > 0 }.map { it.name }
	println("Found ${names.size}: $names")
}
