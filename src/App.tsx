import { createSignal, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";



function App() {
  const [theme, setTheme] = createSignal(localStorage.getItem('theme') || 'light');
  const [loading, setLoading] = createSignal(false);
  const [downloadTime, setDownloadTime] = createSignal("");
  const [finishTime, setFinishTime] = createSignal("");
  const [fileSize, setFileSize] = createSignal(0);
  const [downloadSpeed, setDownloadSpeed] = createSignal(0);
  const [fileSizeUnit, setFileSizeUnit] = createSignal("");
  const [internetSpeedUnit, setInternetSpeedUnit] = createSignal("bps");

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme); // Update the state
    localStorage.setItem('theme', newTheme); // Save the new theme to localStorage
    document.documentElement.setAttribute('data-theme', newTheme); // Apply the theme
  };

  onMount(() => {
    document.documentElement.setAttribute('data-theme', theme());
  });

  function convertToBytes(size: number, unit: string): number {
    switch (unit) {
      case "kb":
        return size * 1024;
      case "mb":
        return size * 1024 * 1024;
      case "gb":
        return size * 1024 * 1024 * 1024;
      case "tb":
        return size * 1024 * 1024 * 1024 * 1024;
      default:
        return size;
    }
  }

  function convertToBytesPerSecond(speed: number, unit: string): number {
    switch (unit) {
      case "kbps": // kilobits per second
        return speed * 1024 / 8;
      case "kbs": // kilobytes per second
        return speed * 1024;
      case "mbps": // megabits per second
        return speed * 1024 * 1024 / 8;
      case "mbs": // megabytes per second
        return speed * 1024 * 1024;
      case "gbps": // gigabits per second
        return speed * 1024 * 1024 * 1024 / 8;
      case "gbs": // gigabytes per second
        return speed * 1024 * 1024 * 1024;
      default:
        return speed;
    }
  }

  async function calculate() {
    if (!fileSize() || !downloadSpeed() || !fileSizeUnit() || !internetSpeedUnit()) {
      // One or both of the fields are empty, or units are not selected, do nothing
      return;
    }

    setLoading(true);
    const fileSizeInBytes = convertToBytes(fileSize(), fileSizeUnit());
    const downloadSpeedInBytesPerSecond = convertToBytesPerSecond(downloadSpeed(), internetSpeedUnit());
    const downloadTimeResult = await invoke("calculate_download_time", { fileSize: fileSizeInBytes, downloadSpeed: downloadSpeedInBytesPerSecond });
    const downloadTime = downloadTimeResult as { hours: number, minutes: number, seconds: number };
    const finishTime = await invoke("calculate_finish_time", { downloadTime: downloadTime.hours * 3600 + downloadTime.minutes * 60 + downloadTime.seconds });
    const downloadTimeHours = downloadTime.hours === 1 ? "Hour" : "Hours";
    const downloadTimeMinutes = downloadTime.minutes === 1 ? "Minute" : "Minutes";
    const downloadTimeSeconds = downloadTime.seconds === 1 ? "Second" : "Seconds";
    setDownloadTime(`${downloadTime.hours} ${downloadTimeHours} ${downloadTime.minutes} ${downloadTimeMinutes} ${downloadTime.seconds} ${downloadTimeSeconds}`);
    setDownloadTime(`${downloadTime.hours} Hours ${downloadTime.minutes} Minutes ${downloadTime.seconds} Seconds`);
    setFinishTime(finishTime as string);
    setLoading(false);

    console.log(downloadTime, finishTime);
  }

  async function testSpeed() {
    setLoading(true);
    const downloadSpeed = await invoke("test_internet_speed");
    setDownloadSpeed(downloadSpeed as number);
    setInternetSpeedUnit("mbps");
    document.getElementById("internet-speed")!.value = downloadSpeed as string;
    document.getElementById("internet-speed-unit")!.value = "mbps";
    setLoading(false);
  }

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return (
    <div class="flex items-center justify-center min-h-screen bg-base-100 text-base-content">
      <div class="px-4 sm:px-6 md:px-8 lg:px-32 xl:px-64 2xl:px-96 relative">
        <h1 class="text-center text-3xl font-bold tracking-tighter">File Size & Internet Speed Calculator</h1>
        <p class="text-accent text-center">Quickly calculate the download time for any file based on your internet speed.</p>
        <div>
          <form class="mt-8 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="grid gap-2">
                <label class="text-sm font-medium">
                  File Size
                </label>
                <div class="flex items-center gap-2">
                  <input id="file-size" type="number" min="0" placeholder="0" class="form-control flex-1 px-4 py-3 input input-bordered input-primary" onChange={(e) => setFileSize(Number(e.currentTarget.value))} />
                  <label class="form-control w-full max-w-xs">
                    <select class="select select-primary w-full max-w-xs" onChange={(e) => setFileSizeUnit(e.currentTarget.value)}>
                      <option disabled selected>Unit</option>
                      <option value="b">B</option>
                      <option value="kb">KB</option>
                      <option value="mb">MB</option>
                      <option value="gb">GB</option>
                      <option value="tb">TB</option>
                    </select>
                  </label>
                </div>
              </div>
              <div class="grid gap-2">
                <label class="text-sm font-medium">
                  Internet Speed
                </label>
                <div class="flex items-center gap-2">
                  <input id="internet-speed" type="number" min="0" placeholder="0" class="form-control flex-1 px-4 py-3 input input-bordered input-primary" onChange={(e) => setDownloadSpeed(Number(e.currentTarget.value))} />
                  <label class="form-control w-full max-w-xs">
                    <select id="internet-speed-unit" class="select select-primary w-full max-w-xs" onChange={(e) => setInternetSpeedUnit(e.currentTarget.value)}>
                      <option disabled selected>Unit</option>
                      <option value="bps">B/s</option>
                      <option value="kbps">Kbps</option>
                      <option value="kbs">KB/s</option>
                      <option value="mbps">Mbps</option>
                      <option value="mbs">MB/s</option>
                      <option value="gbps">Gbps</option>
                      <option value="gbs">GB/s</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <button type="button" class="btn btn-primary flex-1" onMouseDown={calculate} disabled={loading() || !fileSize() || !downloadSpeed() || !fileSizeUnit() || !internetSpeedUnit()}>
                {loading() ? "Calculating..." : "Calculate"}
              </button>
              <button type="button" class="btn btn-outline btn-primary flex-1" onClick={testSpeed} disabled={loading()}>
                {loading() ? "Testing..." : "Test Speed"}
              </button>
            </div>
          </form>
        </div>
        <div class="mt-8 space-y-4 text-center">
          <h2 class="text-2xl font-bold">
            Download Time: <span class="text-secondary">{downloadTime()}</span>
          </h2>
          <p class="text-accent">Based on a {fileSize()} {capitalize(fileSizeUnit())} file and an internet speed of {downloadSpeed()} {capitalize(internetSpeedUnit())}, the download will be finished at approximately {finishTime()}</p>
        </div>
      </div>
      <div class="absolute top-0 right-0 mt-4 mr-4">
        <details class="collapse collapse-arrow join-item border border-base-300">
          <summary class="collapse-title text-xl font-medium">
            Theme
          </summary>
          <div class="collapse-content">
            <div>
              {['light', 'dark', 'nord', 'retro', 'black', 'lofi', 'night', 'cyberpunk', 'aqua', 'valentine'].map(t => (
                <div class="form-control">
                  <label class="label cursor-pointer gap-4">
                    <span class="label-text">{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                    <input
                      type="radio"
                      name="theme-radios"
                      class="radio theme-controller"
                      value={t}
                      checked={theme() === t}
                      onChange={(e) => {
                        changeTheme(e.currentTarget.value);
                        // Close the details element after a theme is selected
                        e.currentTarget.closest('details')!.open = false;
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

export default App;
