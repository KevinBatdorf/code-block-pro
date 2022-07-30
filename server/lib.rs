use rand::Rng;
use wasm_bindgen::prelude::*;
use web_sys::console::log_1 as log;

#[wasm_bindgen]
pub fn get_text() -> String {
    // This will log to the JS console
    log(&"Logging from Rust!".into());

    let quotes = [
        "\"The secret of getting ahead is getting started.\" -Mark Twain.",
        "\"Your own mind is the best laboratory\" -Derek Sivers.",
        "\"The best way to predict your future is to create it.\" -Abraham Lincoln.",
        "\"The best way to find yourself is to lose yourself in the service of others.\" -Mahatma Gandhi.",
        "\"All big things come from small beginnings. The seed of every habit is a single, tiny decision.\" -James Clear.",
        "\"Low-level programming is good for the programmer's soul.\" -John Carmack.",
        "\"Testing leads to failure, and failure leads to understanding.\" - Burt Rutan",
        "\"The only way to learn a new programming language is by writing programs in it.\" - Dennis Ritchie",
        "\"Code is like humor. When you have to explain it, it's bad.\" - Cory House",
        "\"Controlling complexity is the essence of computer programming.\" - Brian Kernigan",
        "\"Don't worry if it doesn't work right.  If everything did, you'd be out of a job.\" - Mosher's Law of Software Engineering",
    ];

    // This will generate a random number between 0 and the array length
    let num = rand::thread_rng().gen_range(0..quotes.len());

    // This will return the string at the index
    quotes[num].into()
}
