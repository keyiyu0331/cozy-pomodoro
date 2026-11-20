// The native (Rust) side of the desktop app. It does one job the web page
// cannot do for itself: when a timer phase ends, bring the app's window to
// the front — even if it is minimised, hidden, or behind other apps.
//
// How it works:
//   1. When the timer starts, the page calls `schedule_alarm` with the clock
//      time at which the phase ends.
//   2. A background thread waits for that moment. It re-checks the real clock
//      twice a second, so it stays correct across pauses and computer sleep.
//   3. At that moment it raises the window (if asked to) and sends the page a
//      "phase-alarm" event, which makes the page finish the phase straight
//      away — the chime, the next phase, the "How did it go?" dialog.
//   4. Pausing, resetting or skipping calls `cancel_alarm`.
//
// Closing the window (the red "x") only hides it: the app keeps running, so
// the timer carries on and the window can come back when the phase ends.
// Clicking the Dock icon shows the window again; Quit (Cmd+Q) really quits.

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Emitter, Manager, RunEvent, State, WindowEvent};

/// Counts alarms. Each new alarm (or a cancel) bumps the number; a waiting
/// thread gives up as soon as the number is no longer its own.
#[derive(Default)]
struct Alarm {
  current: Arc<AtomicU64>,
}

fn now_ms() -> u64 {
  SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map(|d| d.as_millis() as u64)
    .unwrap_or(0)
}

/// Un-minimise, show and focus the main window, in front of other apps.
fn bring_to_front(app: &AppHandle) {
  if let Some(window) = app.get_webview_window("main") {
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
  }
}

/// Called by the page when a phase starts or resumes.
/// `end_ms`: when the phase ends, in milliseconds since 1970 (JavaScript's Date.now()).
/// `pop_up`: whether to bring the window forward at that moment.
#[tauri::command]
fn schedule_alarm(app: AppHandle, alarm: State<Alarm>, end_ms: u64, pop_up: bool) {
  let mine = alarm.current.fetch_add(1, Ordering::SeqCst) + 1;
  let current = alarm.current.clone();

  std::thread::spawn(move || {
    // A hair after the end time, so the page agrees the phase is over.
    let due = end_ms + 50;
    loop {
      if current.load(Ordering::SeqCst) != mine {
        return; // replaced by a newer alarm, or cancelled
      }
      let now = now_ms();
      if now >= due {
        break;
      }
      std::thread::sleep(Duration::from_millis((due - now).min(500)));
    }
    if pop_up {
      bring_to_front(&app);
    }
    let _ = app.emit("phase-alarm", ());
  });
}

/// Called by the page when the timer is paused, reset or skipped.
#[tauri::command]
fn cancel_alarm(alarm: State<Alarm>) {
  alarm.current.fetch_add(1, Ordering::SeqCst);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(Alarm::default())
    .invoke_handler(tauri::generate_handler![schedule_alarm, cancel_alarm])
    .on_window_event(|window, event| {
      // The red "x": hide the window instead of closing it, so the app (and
      // the timer inside it) keeps running.
      if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        let _ = window.hide();
      }
    })
    .setup(|app| {
      // Self-test, used when checking a build. Never set in normal use.
      // Start the app with COZY_POMODORO_SELFTEST=1 in the environment and
      // it brings its window forward 8 seconds after launch. With
      // COZY_POMODORO_SELFTEST=close it also closes its window after 3
      // seconds first, and prints whether the window is showing.
      if let Ok(mode) = std::env::var("COZY_POMODORO_SELFTEST") {
        let handle = app.handle().clone();
        std::thread::spawn(move || {
          let showing = |handle: &AppHandle| {
            handle.get_webview_window("main").and_then(|w| w.is_visible().ok())
          };
          std::thread::sleep(Duration::from_secs(3));
          if mode == "close" {
            if let Some(window) = handle.get_webview_window("main") {
              let _ = window.close();
            }
            std::thread::sleep(Duration::from_secs(1));
            eprintln!("selftest: after close, window showing = {:?}", showing(&handle));
          }
          std::thread::sleep(Duration::from_secs(4));
          bring_to_front(&handle);
          std::thread::sleep(Duration::from_secs(1));
          eprintln!("selftest: after pop-up, window showing = {:?}", showing(&handle));
        });
      }
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|app, event| {
      // macOS: the Dock icon was clicked while no window was showing.
      #[cfg(target_os = "macos")]
      if let RunEvent::Reopen { .. } = event {
        bring_to_front(app);
      }
      #[cfg(not(target_os = "macos"))]
      let _ = (app, event);
    });
}
