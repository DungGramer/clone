import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isFullScreen() {
  return Boolean(
    document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
  );
}

export function doFullScreen(el: HTMLElement) {
  // Use a guard clause to exit out of the function immediately
  if (isFullScreen()) return false;
  // Set a default value for your element parameter
  if (el === undefined) el = document.documentElement;
  // Test for the existence of document.fullscreenEnabled instead of requestFullscreen()
  if (document.fullscreenEnabled) {
    el.requestFullscreen();
  } else if (document.webkitFullscreenEnabled) {
    el.webkitRequestFullscreen();
  } else if (document.mozFullScreenEnabled) {
    el.mozRequestFullScreen();
  } else if (document.msFullscreenEnabled) {
    el.msRequestFullscreen();
  }
}
