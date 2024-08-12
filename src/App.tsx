import { createSignal, onMount, createMemo } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [theme, setTheme] = createSignal(localStorage.getItem('theme') || 'light');
  const [loadingCalculate, setLoadingCalculate] = createSignal(false);
  const [loadingSpeedTest, setLoadingSpeedTest] = createSignal(false);
  const [downloadTime, setDownloadTime] = createSignal("");
  const [finishTime, setFinishTime] = createSignal("");
  const [fileSize, setFileSize] = createSignal(0);
  const [downloadSpeed, setDownloadSpeed] = createSignal(0);
  const [fileSizeUnit, setFileSizeUnit] = createSignal("");
  const [internetSpeedUnit, setInternetSpeedUnit] = createSignal("mbps");

  onMount(() => {
    document.documentElement.setAttribute('data-theme', theme());
  });

  const fileSizeInBytes = createMemo(() => convertToBytes(fileSize(), fileSizeUnit()));
  const downloadSpeedInBytesPerSecond = createMemo(() => convertToBytesPerSecond(downloadSpeed(), internetSpeedUnit()));

  const handleThemeChange = (newTheme: string) => {
    if (theme() !== newTheme) {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  async function calculate() {
    if (!fileSize() || !downloadSpeed()) return;

    setLoadingCalculate(true);
    try {
      const downloadTimeResult = await invoke("calculate_download_time", { fileSize: fileSizeInBytes(), downloadSpeed: downloadSpeedInBytesPerSecond() });
      const { hours, minutes, seconds } = downloadTimeResult as { hours: number, minutes: number, seconds: number };
      const downloadTimeStr = `${hours} ${hours === 1 ? "Hour" : "Hours"} ${minutes} ${minutes === 1 ? "Minute" : "Minutes"} ${seconds} ${seconds === 1 ? "Second" : "Seconds"}`;
      setDownloadTime(downloadTimeStr);

      const finishTimeResult = await invoke("calculate_finish_time", { downloadTime: hours * 3600 + minutes * 60 + seconds });
      setFinishTime(finishTimeResult as string);
    } finally {
      setLoadingCalculate(false);
    }
  }

  async function testSpeed() {
    setLoadingSpeedTest(true);
    try {
      const speed = await invoke("test_internet_speed");
      setDownloadSpeed(speed as number);
      setInternetSpeedUnit("mbps");

      // Update the input fields directly
      const speedInput = document.getElementById("internet-speed") as HTMLInputElement;
      if (speedInput) speedInput.value = String(speed);

      const unitInput = document.getElementById("internet-speed-unit") as HTMLSelectElement;
      if (unitInput) unitInput.value = "mbps";
    } finally {
      setLoadingSpeedTest(false);
    }
  }

  return (
    <div class="flex items-center justify-center min-h-screen bg-base-100 text-base-content">
      <div class="px-4 sm:px-6 md:px-8 lg:px-32 xl:px-64 2xl:px-96 relative">
        <h1 class="text-center text-3xl font-bold tracking-tighter">File Size & Internet Speed Calculator</h1>
        <p class="text-accent text-center">Quickly calculate the download time for any file based on your internet speed.</p>
        <form class="mt-8 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <label class="text-sm font-medium">File Size</label>
              <div class="flex items-center gap-2">
                <input type="number" min="0" placeholder="0" class="form-control flex-1 px-4 py-3 input input-bordered input-primary" onInput={(e) => setFileSize(+e.currentTarget.value)} />
                <select class="select select-primary w-full max-w-xs" onChange={(e) => setFileSizeUnit(e.currentTarget.value)}>
                  <option disabled selected>Unit</option>
                  <option value="b">B</option>
                  <option value="kb">KB</option>
                  <option value="mb">MB</option>
                  <option value="gb">GB</option>
                  <option value="tb">TB</option>
                </select>
              </div>
            </div>
            <div class="grid gap-2">
              <label class="text-sm font-medium">Internet Speed</label>
              <div class="flex items-center gap-2">
                <input id="internet-speed" type="number" min="0" placeholder="0" class="form-control flex-1 px-4 py-3 input input-bordered input-primary" onInput={(e) => setDownloadSpeed(+e.currentTarget.value)} />
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
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <button type="button" class="btn btn-primary flex-1" onClick={calculate} disabled={loadingCalculate() || !fileSize() || !downloadSpeed() || !fileSizeUnit() || !internetSpeedUnit()}>
              {loadingCalculate() ? "Calculating..." : "Calculate"}
            </button>
            <button type="button" class="btn btn-outline btn-primary flex-1" onClick={testSpeed} disabled={loadingSpeedTest()}>
              {loadingSpeedTest() ? "Testing..." : "Test Speed"}
            </button>
          </div>
        </form>
        <div class="mt-8 space-y-4 text-center">
          <h2 class="text-2xl font-bold">
            Download Time: <span class="text-secondary">{downloadTime()}</span>
          </h2>
          <p class="text-accent">
            Based on a {fileSize()} {capitalize(fileSizeUnit())} file and an internet speed of {downloadSpeed().toFixed(2)} {capitalize(internetSpeedUnit())}, the download will be finished at approximately {finishTime()}.
          </p>
        </div>
      </div>
      <div class="absolute top-0 right-0 mt-4 mr-4">
        <details class="collapse collapse-arrow join-item border border-base-300">
          <summary class="collapse-title text-xl font-medium">Theme</summary>
          <div class="collapse-content">
            {['light', 'dark', 'nord', 'retro', 'black', 'lofi', 'night', 'cyberpunk', 'aqua', 'valentine'].map(t => (
              <div class="form-control" key={t}>
                <label class="label cursor-pointer gap-4">
                  <span class="label-text">{capitalize(t)}</span>
                  <input
                    type="radio"
                    name="theme-radios"
                    class="radio theme-controller"
                    value={t}
                    checked={theme() === t}
                    onChange={(e) => {
                      handleThemeChange(e.currentTarget.value);
                      e.currentTarget.closest('details')!.open = false;
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

function convertToBytes(size: number, unit: string): number {
  const units = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4 };
  return size * (units[unit.toLowerCase()] || 1);
}

function convertToBytesPerSecond(speed: number, unit: string): number {
  const units = { bps: 1 / 8, kbps: 1024 / 8, kbs: 1024, mbps: 1024 ** 2 / 8, mbs: 1024 ** 2, gbps: 1024 ** 3 / 8, gbs: 1024 ** 3 };
  return speed * (units[unit.toLowerCase()] || 1);
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default App;
