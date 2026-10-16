import SwiftUI

struct CounterView: View {
	@State private var count = 0

	var body: some View {
		Button("Tapped \(count) times") { count += 1 }
			.padding()
	}
}
