#include <vector>
#include <string>

template <typename T>
auto sum(const std::vector<T>& xs) -> T {
	T total{};
	for (const auto& x : xs) total += x;
	return total;
}

int main() { return sum<int>({1, 2, 3}) == 6 ? 0 : 1; }
