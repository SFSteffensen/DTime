use cfspeedtest::speedtest::test_download;
use cfspeedtest::OutputFormat;
use chrono::Timelike;
use chrono::{Duration, Local};
use serde_json::json;
use std::time::Duration as StdDuration;
use tauri_plugin_http::reqwest;

// Function to calculate download time
#[tauri::command]
pub fn calculate_download_time(file_size: f64, download_speed: f64) -> serde_json::Value {
    let download_time_in_seconds = file_size / download_speed;
    let download_time = StdDuration::from_secs_f64(download_time_in_seconds);

    let hours = download_time.as_secs() / 3600;
    let minutes = (download_time.as_secs() % 3600) / 60;
    let seconds = download_time.as_secs() % 60;

    json!({
        "hours": hours,
        "minutes": minutes,
        "seconds": seconds,
    })
}

// Function to calculate finish time
#[tauri::command]
pub fn calculate_finish_time(download_time: i64) -> String {
    let current_time = Local::now();
    // convert the i64 to a Duration
    let download_time = Duration::seconds(download_time);
    let finish_time = current_time + download_time;
    format!(
        "{:02}:{:02}:{:02}",
        finish_time.hour(),
        finish_time.minute(),
        finish_time.second()
    )
}

#[tauri::command]
pub fn test_internet_speed() -> f64 {
    let download_speed = test_download(
        &reqwest::blocking::Client::new(),
        10_000_000,
        OutputFormat::None,
    );

    download_speed
}
