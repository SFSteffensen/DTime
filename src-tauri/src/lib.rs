mod calculations;

use calculations::{calculate_download_time, calculate_finish_time, test_internet_speed};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            calculate_download_time,
            calculate_finish_time,
            test_internet_speed
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
