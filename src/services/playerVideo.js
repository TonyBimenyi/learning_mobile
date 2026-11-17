/**
 * One persistent <video> element shared by the full lesson player and the
 * floating mini player. It is never destroyed or reloaded during handoff, so
 * playback simply continues while the element is moved between containers.
 */
let videoEl = null;
let attachedSrc = '';

export function getPlayerVideo() {
  if (!videoEl && typeof window !== 'undefined') {
    videoEl = document.createElement('video');
    videoEl.setAttribute('playsinline', '');
    videoEl.setAttribute('webkit-playsinline', '');
    videoEl.preload = 'auto';
    videoEl.className = 'shared-player-video';
  }
  return videoEl;
}

/** Move the shared element into a visible host container. */
export function mountVideoInto(container) {
  const video = getPlayerVideo();
  if (video && container && video.parentElement !== container) {
    container.appendChild(video);
  }
  return video;
}

/** Keep the element in the document (hidden) while neither player shows it. */
export function parkVideo() {
  const video = getPlayerVideo();
  if (!video) return;
  let parking = document.getElementById('twige-video-parking');
  if (!parking) {
    parking = document.createElement('div');
    parking.id = 'twige-video-parking';
    parking.setAttribute('aria-hidden', 'true');
    parking.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:2px;height:2px;overflow:hidden;opacity:0;pointer-events:none;';
    document.body.appendChild(parking);
  }
  if (video.parentElement !== parking) {
    parking.appendChild(video);
  }
}

/** Only touch src (and reload) when the lesson actually changed. */
export function setVideoSrc(url) {
  const video = getPlayerVideo();
  if (!video) return false;
  const next = String(url || '');
  if (!next || attachedSrc === next) return false;
  attachedSrc = next;
  video.src = next;
  video.load();
  return true;
}

export function getAttachedSrc() {
  return attachedSrc;
}
