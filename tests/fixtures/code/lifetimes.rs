use std::collections::HashMap;

#[derive(Debug, Default)]
pub struct Registry<'a> {
	entries: HashMap<&'a str, Vec<u32>>,
}

impl<'a> Registry<'a> {
	pub fn push(&mut self, key: &'a str, value: u32) -> &[u32] {
		self.entries.entry(key).or_default().push(value);
		self.entries.get(key).map(|v| v.as_slice()).unwrap_or(&[])
	}
}
