type FullscreenElement = typeof document.fullscreenElement;
type ExitFullscreen = typeof document.exitFullscreen;
type RequestFullscreen = typeof document.documentElement.requestFullscreen;
type FullscreenEnabled = typeof document.fullscreenEnabled;

export {} 

declare global {
  interface Document {
    webkitExitFullscreen: ExitFullscreen;
    mozCancelFullScreen: ExitFullscreen;
    msExitFullscreen: ExitFullscreen;
    webkitFullscreenElement: FullscreenElement;
    mozFullScreenElement: FullscreenElement;
    msFullscreenElement: FullscreenElement;
    webkitFullscreenEnabled: FullscreenEnabled;
    mozFullScreenEnabled: FullscreenEnabled;
    msFullscreenEnabled: FullscreenEnabled;
    webkitRequestFullscreen: RequestFullscreen;
    mozRequestFullScreen: RequestFullscreen;
    msRequestFullscreen: RequestFullscreen;
  }

  interface HTMLElement {
    webkitRequestFullscreen: RequestFullscreen;
    mozRequestFullScreen: RequestFullscreen;
    msRequestFullscreen: RequestFullscreen;
    webkitFullscreenElement: FullscreenElement;
    mozFullScreenElement: FullscreenElement;
    msFullscreenElement: FullscreenElement;
  }
}
