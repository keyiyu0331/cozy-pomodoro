// The timer in the Mac menu bar (the strip at the top of the screen): a small
// pie that empties as time runs out, followed by text such as "Focus - 24:22".
//
// How it works:
//   1. Whenever the timer changes (start, pause, reset, next phase, settings),
//      the page calls `set_menu_bar` with a `TimerInfo` describing it.
//   2. A background thread wakes five times a second, works out the time left
//      from the real clock, and redraws the text or the pie only when what
//      they show has changed. Counting down here rather than in the page
//      keeps it ticking while the window is closed.
//   3. Clicking the item brings the app's window to the front.

use std::sync::Mutex;
use std::time::Duration;

use serde::Deserialize;
use tauri::image::Image;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, State};

const TRAY_ID: &str = "timer";

/// The pie is redrawn in this many steps from full to empty.
const PIE_STEPS: u64 = 120;
/// The pie image is a square of this many pixels. macOS shows it 18 points
/// tall, so the circle is kept smaller than the square to leave a margin.
const PIE_SIZE: u32 = 44;
const PIE_RADIUS: f32 = 15.0;
const PIE_OUTLINE: f32 = 2.4;

/// What the page tells us about the timer.
#[derive(Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimerInfo {
  /// The "Show timer in menu bar" setting.
  show: bool,
  /// "Focus", "Short break" or "Long break".
  label: String,
  /// While running: when the phase ends (milliseconds since 1970).
  end_ms: Option<u64>,
  /// While not running: the time left, which is standing still.
  remaining_ms: u64,
  /// Full length of the phase, for the pie.
  total_ms: u64,
  paused: bool,
}

/// The latest `TimerInfo`, shared between the page's calls and the thread.
#[derive(Default)]
pub struct MenuBar(Mutex<TimerInfo>);

/// Called by the page whenever the timer or its settings change.
#[tauri::command]
pub fn set_menu_bar(menu_bar: State<MenuBar>, info: TimerInfo) {
  *menu_bar.0.lock().unwrap() = info;
}

/// 1_462_000 -> "24:22". Rounds up, the same way the page's clock does.
fn format_time(ms: u64) -> String {
  let seconds = ms.div_ceil(1000);
  format!("{:02}:{:02}", seconds / 60, seconds % 60)
}

/// The text to show and how full the pie is (0 = empty, PIE_STEPS = full).
fn describe(info: &TimerInfo, now_ms: u64) -> (String, u64) {
  let left = match info.end_ms {
    Some(end) => end.saturating_sub(now_ms),
    None => info.remaining_ms,
  };
  let mut text = format!("{} - {}", info.label, format_time(left));
  if info.paused {
    text.push_str(" (paused)");
  }
  let total = info.total_ms.max(1);
  let step = (left.min(total) * PIE_STEPS).div_ceil(total);
  (text, step)
}

/// Draw the pie: a ring, filled for the share of time that is left. The used
/// share empties clockwise from 12 o'clock. Drawn in black with see-through
/// edges; macOS recolours it to suit a light or dark menu bar.
fn pie_image(step: u64) -> Image<'static> {
  let used = 1.0 - step as f32 / PIE_STEPS as f32;
  let centre = PIE_SIZE as f32 / 2.0;
  let mut pixels = Vec::with_capacity((PIE_SIZE * PIE_SIZE * 4) as usize);
  for y in 0..PIE_SIZE {
    for x in 0..PIE_SIZE {
      // Test a 4x4 grid of points inside the pixel and average them, so the
      // edges come out smooth rather than jagged.
      let mut inside = 0;
      for sub in 0..16 {
        let dx = x as f32 + (sub % 4) as f32 / 4.0 + 0.125 - centre;
        let dy = y as f32 + (sub / 4) as f32 / 4.0 + 0.125 - centre;
        let distance = (dx * dx + dy * dy).sqrt();
        if distance > PIE_RADIUS {
          continue;
        }
        // Angle as a share of a full turn, clockwise from 12 o'clock.
        let turn = (dx.atan2(-dy) / std::f32::consts::TAU).rem_euclid(1.0);
        if distance >= PIE_RADIUS - PIE_OUTLINE || turn >= used {
          inside += 1;
        }
      }
      pixels.extend_from_slice(&[0, 0, 0, (inside * 255 / 16) as u8]);
    }
  }
  Image::new_owned(pixels, PIE_SIZE, PIE_SIZE)
}

/// Create the menu bar item and start the thread that keeps it up to date.
pub fn init(app: &AppHandle) -> tauri::Result<()> {
  let tray = TrayIconBuilder::with_id(TRAY_ID)
    .icon(pie_image(PIE_STEPS))
    .icon_as_template(true)
    .tooltip("Cozy Pomodoro")
    .on_tray_icon_event(|tray, event| {
      if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
      } = event
      {
        crate::bring_to_front(tray.app_handle());
      }
    })
    .build(app)?;
  // Hidden until the page has told us about the timer and the setting.
  tray.set_visible(false)?;

  let app = app.clone();
  std::thread::spawn(move || {
    // What the menu bar shows right now, so we only redraw on a change.
    let mut shown: Option<(String, u64)> = None;
    loop {
      std::thread::sleep(Duration::from_millis(200));
      let info = app.state::<MenuBar>().0.lock().unwrap().clone();
      let Some(tray) = app.tray_by_id(TRAY_ID) else { return };

      if !info.show {
        if shown.take().is_some() {
          let _ = tray.set_visible(false);
        }
        continue;
      }
      let (text, step) = describe(&info, crate::now_ms());
      let old = shown.as_ref();
      if old.is_none() {
        let _ = tray.set_visible(true);
      }
      if old.map(|o| o.1) != Some(step) {
        let _ = tray.set_icon_with_as_template(Some(pie_image(step)), true);
      }
      if old.map(|o| o.0.as_str()) != Some(text.as_str()) {
        let _ = tray.set_title(Some(&text));
      }
      shown = Some((text, step));
    }
  });
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;

  fn info(end_ms: Option<u64>, remaining_ms: u64, paused: bool) -> TimerInfo {
    TimerInfo { show: true, label: "Focus".into(), end_ms, remaining_ms, total_ms: 1_500_000, paused }
  }

  #[test]
  fn running_counts_down_from_the_end_time() {
    let (text, step) = describe(&info(Some(2_000_000), 0, false), 2_000_000 - 1_462_000);
    assert_eq!(text, "Focus - 24:22");
    assert_eq!(step, 117);
  }

  #[test]
  fn idle_shows_the_full_time_and_a_full_pie() {
    assert_eq!(describe(&info(None, 1_500_000, false), 0), ("Focus - 25:00".to_string(), PIE_STEPS));
  }

  #[test]
  fn paused_says_so_and_past_the_end_shows_zero() {
    assert_eq!(describe(&info(None, 61_000, true), 0).0, "Focus - 01:01 (paused)");
    assert_eq!(describe(&info(Some(10), 0, false), 99), ("Focus - 00:00".to_string(), 0));
  }

  #[test]
  fn pie_is_solid_when_full_and_a_ring_when_empty() {
    let alpha_at_centre = |step| {
      let image = pie_image(step);
      let middle = (PIE_SIZE / 2 * PIE_SIZE + PIE_SIZE / 2) as usize * 4 + 3;
      image.rgba()[middle]
    };
    assert_eq!(alpha_at_centre(PIE_STEPS), 255);
    assert_eq!(alpha_at_centre(0), 0);
  }
}
