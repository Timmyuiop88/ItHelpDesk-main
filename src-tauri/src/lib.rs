use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

const RUSTDESK_TIMEOUT: Duration = Duration::from_secs(5);

fn rustdesk_candidates() -> Vec<String> {
    let mut candidates = Vec::new();

    #[cfg(target_os = "macos")]
    candidates.push("/Applications/RustDesk.app/Contents/MacOS/RustDesk".to_string());

    #[cfg(target_os = "windows")]
    {
        for var in ["ProgramFiles", "ProgramFiles(x86)"] {
            if let Ok(dir) = std::env::var(var) {
                candidates.push(format!("{dir}\\RustDesk\\rustdesk.exe"));
            }
        }
    }

    #[cfg(target_os = "linux")]
    candidates.push("/usr/bin/rustdesk".to_string());

    candidates.push("rustdesk".to_string());
    candidates
}

fn run_get_id(program: &str) -> Option<String> {
    let mut child = Command::new(program)
        .arg("--get-id")
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .ok()?;

    // `--get-id` can hang if RustDesk decides to open its GUI instead.
    let started = Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(_)) => break,
            Ok(None) if started.elapsed() < RUSTDESK_TIMEOUT => {
                std::thread::sleep(Duration::from_millis(100));
            }
            _ => {
                let _ = child.kill();
                let _ = child.wait();
                return None;
            }
        }
    }

    let output = child.wait_with_output().ok()?;
    let id: String = String::from_utf8_lossy(&output.stdout)
        .chars()
        .filter(|c| !c.is_whitespace())
        .collect();

    if !id.is_empty() && id.chars().all(|c| c.is_ascii_digit()) {
        Some(id)
    } else {
        None
    }
}

#[tauri::command]
async fn get_rustdesk_id() -> Option<String> {
    tauri::async_runtime::spawn_blocking(|| {
        rustdesk_candidates()
            .iter()
            .find_map(|program| run_get_id(program))
    })
    .await
    .ok()
    .flatten()
}

#[cfg(any(target_os = "macos", target_os = "windows"))]
fn command_stdout(program: &str, args: &[&str]) -> Option<String> {
    let output = Command::new(program)
        .args(args)
        .stderr(Stdio::null())
        .output()
        .ok()?;
    output
        .status
        .success()
        .then(|| String::from_utf8_lossy(&output.stdout).into_owned())
}

#[cfg(target_os = "macos")]
fn read_machine_fingerprint() -> Option<String> {
    let out = command_stdout("ioreg", &["-rd1", "-c", "IOPlatformExpertDevice"])?;
    let line = out.lines().find(|line| line.contains("\"IOPlatformUUID\""))?;
    line.split('"').nth(3).map(str::to_string)
}

#[cfg(target_os = "windows")]
fn read_machine_fingerprint() -> Option<String> {
    let out = command_stdout(
        "reg",
        &[
            "query",
            r"HKLM\SOFTWARE\Microsoft\Cryptography",
            "/v",
            "MachineGuid",
        ],
    )?;
    let line = out.lines().find(|line| line.contains("MachineGuid"))?;
    line.split_whitespace().last().map(str::to_string)
}

#[cfg(target_os = "linux")]
fn read_machine_fingerprint() -> Option<String> {
    ["/etc/machine-id", "/var/lib/dbus/machine-id"]
        .iter()
        .find_map(|path| std::fs::read_to_string(path).ok())
        .map(|id| id.trim().to_string())
}

#[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
fn read_machine_fingerprint() -> Option<String> {
    None
}

#[tauri::command]
async fn get_machine_fingerprint() -> Option<String> {
    tauri::async_runtime::spawn_blocking(read_machine_fingerprint)
        .await
        .ok()
        .flatten()
        .filter(|id| !id.is_empty())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_rustdesk_id, get_machine_fingerprint])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
