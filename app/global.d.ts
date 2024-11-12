type ExitFullscreen = typeof document.exitFullscreen;
type RequestFullscreen = typeof document.documentElement.requestFullscreen;

export {} 

declare global {
  interface Document {
    webkitExitFullscreen: ExitFullscreen;
    mozCancelFullScreen: ExitFullscreen;
    msExitFullscreen: ExitFullscreen;
  }

  interface HTMLElement {
    webkitRequestFullscreen?: RequestFullscreen;
    mozRequestFullScreen?: RequestFullscreen;
    msRequestFullscreen?: RequestFullscreen;
  }
}
