mod commands;

use commands::*;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            test_connection,
            list_topics,
            create_topic,
            add_partitions,
            consumer_lag
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
