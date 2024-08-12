use cfspeedtest::speedtest::test_download;
use cfspeedtest::OutputFormat;
use chrono::{Duration as ChronoDuration, Local, Timelike};
use serde::{Deserialize, Serialize};
use std::time::Duration as StdDuration;
use tauri::async_runtime::spawn_blocking;
use tauri_plugin_http::reqwest;

#[derive(Serialize, Deserialize)]
pub struct DownloadTime {
    hours: u64,
    minutes: u64,
    seconds: u64,
}

// Function to calculate download time
#[tauri::command]
pub fn calculate_download_time(file_size: f64, download_speed: f64) -> DownloadTime {
    let download_time_in_seconds = file_size / download_speed;
    let download_time = StdDuration::from_secs_f64(download_time_in_seconds);

    DownloadTime {
        hours: download_time.as_secs() / 3600,
        minutes: (download_time.as_secs() % 3600) / 60,
        seconds: download_time.as_secs() % 60,
    }
}

// Function to calculate finish time
#[tauri::command]
pub fn calculate_finish_time(download_time: i64) -> String {
    let finish_time = Local::now() + ChronoDuration::seconds(download_time);
    finish_time.format("%H:%M:%S").to_string()
}

// Asynchronous function to test internet speed
#[tauri::command]
pub async fn test_internet_speed() -> Result<f64, String> {
    // Use spawn_blocking to run the blocking code in a separate thread
    let download_speed = spawn_blocking(|| {
        test_download(
            &reqwest::blocking::Client::new(),
            10_000_000,
            OutputFormat::None,
        )
    })
    .await
    .map_err(|e| format!("Failed to run speed test: {:?}", e))?;

    Ok(download_speed)
}
