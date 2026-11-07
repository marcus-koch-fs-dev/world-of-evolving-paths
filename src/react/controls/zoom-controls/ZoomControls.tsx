import { useCameraZoom } from '../../hooks/useCameraZoom';
import { usePathWorldHandle } from '../../PathWorldContext';
import './zoomControls.css';

const ZOOM_STEP = 1.25;

/** Zoom out, zoom in, center and fit. Place it inside `<PathWorld>`. */
export function ZoomControls() {
  const handle = usePathWorldHandle();
  const zoom = useCameraZoom(handle);

  return (
    <div className="pw-zoom-controls">
      <button type="button" className="pw-button" aria-label="Zoom out" onClick={() => handle.zoomBy(1 / ZOOM_STEP)}>
        −
      </button>
      <span className="pw-zoom-value">{Math.round(zoom * 100)} %</span>
      <button type="button" className="pw-button" aria-label="Zoom in" onClick={() => handle.zoomBy(ZOOM_STEP)}>
        +
      </button>
      <button
        type="button"
        className="pw-button"
        title="Put the content in the middle, zoom stays (key M)"
        onClick={() => handle.center()}
      >
        Center
      </button>
      <button type="button" className="pw-button" title="Show everything (key E)" onClick={() => handle.fit()}>
        Fit
      </button>
    </div>
  );
}
