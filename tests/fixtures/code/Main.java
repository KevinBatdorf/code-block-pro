package com.example;

import java.util.List;

public final class Main {
	@Override
	public String toString() {
		List<Integer> xs = List.of(1, 2, 3);
		return "sum=" + xs.stream().mapToInt(Integer::intValue).sum();
	}
}
