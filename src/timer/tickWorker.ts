// A tiny Web Worker: a script that runs on its own thread, outside the page.
// All it does is send an empty "tick" message four times a second.
//
// Why not setInterval in the page? Browsers slow page timers right down in
// background tabs (to as little as once a minute), which would make the
// end-of-phase chime late. Worker timers are not slowed like that.

setInterval(() => postMessage(null), 250);
