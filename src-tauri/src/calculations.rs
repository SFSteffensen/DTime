use cfspeedtest::speedtest::test_download;
use cfspeedtest::OutputFormat;
use chrono::{DateTime, Duration as ChronoDuration, Local, Timelike, Utc};
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

// The maximum number of seconds `chrono` can represent without overflow
const MAX_SECONDS: i64 = i64::MAX / 1_000_000_000;

#[tauri::command]
pub fn calculate_download_time(
    file_size: f64,
    download_speed: f64,
) -> Result<DownloadTime, String> {
    if download_speed <= 0.0 {
        return Err("Download speed must be greater than zero.".to_string());
    }

    let download_time_in_seconds = file_size / download_speed;

    if download_time_in_seconds.is_infinite() || download_time_in_seconds > MAX_SECONDS as f64 {
        return Err("Download time exceeds the bounds of what can be calculated.".to_string());
    }

    let download_time = StdDuration::from_secs_f64(download_time_in_seconds);

    Ok(DownloadTime {
        hours: download_time.as_secs() / 3600,
        minutes: (download_time.as_secs() % 3600) / 60,
        seconds: download_time.as_secs() % 60,
    })
}

#[tauri::command]
pub fn calculate_finish_time(download_time: i64) -> Result<String, String> {
    let current_time: DateTime<Utc> = Utc::now();

    // Check if the addition of the download_time will cause an overflow
    let download_duration = ChronoDuration::seconds(download_time);

    if let Some(finish_time) = current_time.checked_add_signed(download_duration) {
        Ok(finish_time.format("%H:%M:%S").to_string())
    } else {
        Err("The calculated finish time is too large and caused an overflow.".into())
    }
}

#[tauri::command]
pub async fn test_internet_speed() -> Result<f64, String> {
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
