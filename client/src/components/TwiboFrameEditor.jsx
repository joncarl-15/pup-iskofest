import { useEffect, useRef, useState } from "react";

const CANVAS_SIZE = 800;
const OFFSET_RANGE = 600;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1;
const ROTATION_RANGE = 90;

const TwiboFrameEditor = () => {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageOffsetX, setImageOffsetX] = useState(0);
  const [imageOffsetY, setImageOffsetY] = useState(0);
  const [zoomFactor, setZoomFactor] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const canvasRef = useRef(null);
  const userImageRef = useRef(null);
  const frameImageRef = useRef(null);
  const baseScaleRef = useRef(1);
  const dragStateRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    initialOffsetX: 0,
    initialOffsetY: 0,
  });

  useEffect(() => {
    const frameImage = new Image();
    frameImage.src = "/frame.png";
    frameImage.onload = () => {
      frameImageRef.current = frameImage;
      setFrameLoaded(true);
      drawCanvas();
    };
    frameImage.onerror = () => {
      setFrameLoaded(false);
    };

    return () => {
      frameImage.onload = null;
      frameImage.onerror = null;
    };
  }, []);

  useEffect(() => {
    drawCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    imageUrl,
    frameLoaded,
    imageOffsetY,
    imageOffsetX,
    zoomFactor,
    imageRotation,
  ]);

  useEffect(() => {
    return () => {
      if (userImageRef.current?.src) {
        URL.revokeObjectURL(userImageRef.current.src);
      }
    };
  }, []);

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (userImageRef.current?.src) {
      URL.revokeObjectURL(userImageRef.current.src);
    }

    const blobUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      userImageRef.current = image;

      const baseScale = Math.min(
        1,
        CANVAS_SIZE / image.width,
        CANVAS_SIZE / image.height
      );
      baseScaleRef.current = baseScale;

      const drawWidth = image.width * baseScale;
      const drawHeight = image.height * baseScale;
      setImageOffsetX((CANVAS_SIZE - drawWidth) / 2);
      setImageOffsetY((CANVAS_SIZE - drawHeight) / 2);
      setZoomFactor(1);
      setImageUrl(blobUrl);
      drawCanvas();
    };
    image.src = blobUrl;
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (userImageRef.current) {
      const scale = baseScaleRef.current * zoomFactor;
      const drawWidth = userImageRef.current.width * scale;
      const drawHeight = userImageRef.current.height * scale;
      const radians = (imageRotation * Math.PI) / 180;
      const centerX = imageOffsetX + drawWidth / 2;
      const centerY = imageOffsetY + drawHeight / 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(radians);
      ctx.drawImage(
        userImageRef.current,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );
      ctx.restore();
    } else {
      drawPlaceholder(ctx);
    }

    if (frameImageRef.current) {
      ctx.drawImage(frameImageRef.current, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }
  };

  const drawPlaceholder = (ctx) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, CANVAS_SIZE - 40, CANVAS_SIZE - 40);
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "32px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Upload an image to begin", CANVAS_SIZE / 2, CANVAS_SIZE / 2);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "twibo-frame.png";
    link.click();
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const handleImageOffsetChange = (next) => {
    setImageOffsetY(clamp(next, -OFFSET_RANGE, OFFSET_RANGE));
  };

  const handleImageOffsetXChange = (next) => {
    setImageOffsetX(clamp(next, -OFFSET_RANGE, OFFSET_RANGE));
  };

  const handleZoomChange = (next) => {
    setZoomFactor(clamp(next, ZOOM_MIN, ZOOM_MAX));
  };

  const handleRotationChange = (next) => {
    setImageRotation(clamp(next, -ROTATION_RANGE, ROTATION_RANGE));
  };

  const handlePointerDown = (event) => {
    if (!userImageRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    canvas?.setPointerCapture?.(event.pointerId);
    dragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialOffsetX: imageOffsetX,
      initialOffsetY: imageOffsetY,
    };
  };

  const handlePointerMove = (event) => {
    if (!dragStateRef.current.active) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;
    handleImageOffsetXChange(
      dragStateRef.current.initialOffsetX + deltaX
    );
    handleImageOffsetChange(
      dragStateRef.current.initialOffsetY + deltaY
    );
  };

  const handlePointerUp = (event) => {
    if (dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }
    const canvas = canvasRef.current;
    canvas?.releasePointerCapture?.(event.pointerId);
    dragStateRef.current = {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      initialOffsetX: 0,
      initialOffsetY: 0,
    };
  };

  return (
    <section className="editor-card glass-panel">
      <div className="editor-headline">
        <h2>PUP-CSC LQ Frame Maker</h2>
        <p>Align your photo with the Iska-Fest frame before exporting.</p>
      </div>

      <div className="editor-grid">
        <div className="control-stack">
          <label className="file-input">
            <span>Upload image</span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleUpload}
            />
          </label>

          <div className="slider-group">
            <div className="slider-label">
              <span>Photo horizontal offset</span>
              <span>{Math.round(imageOffsetX)}px</span>
            </div>
            <input
              type="range"
              min={-OFFSET_RANGE}
              max={OFFSET_RANGE}
              value={imageOffsetX}
              onChange={(event) =>
                handleImageOffsetXChange(Number(event.target.value))
              }
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Photo vertical offset</span>
              <span>{Math.round(imageOffsetY)}px</span>
            </div>
            <input
              type="range"
              min={-OFFSET_RANGE}
              max={OFFSET_RANGE}
              value={imageOffsetY}
              onChange={(event) =>
                handleImageOffsetChange(Number(event.target.value))
              }
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Photo zoom</span>
              <span>{Math.round(zoomFactor * 100)}%</span>
            </div>
            <input
              type="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={0.01}
              value={zoomFactor}
              onChange={(event) =>
                handleZoomChange(Number(event.target.value))
              }
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Photo rotation</span>
              <span>{Math.round(imageRotation)}°</span>
            </div>
            <input
              type="range"
              min={-ROTATION_RANGE}
              max={ROTATION_RANGE}
              value={imageRotation}
              onChange={(event) =>
                handleRotationChange(Number(event.target.value))
              }
            />
          </div>

          <button
            className="primary-button"
            onClick={handleDownload}
            disabled={!imageUrl || !frameLoaded}
          >
            Download Image
          </button>
        </div>

        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </div>
      </div>
    </section>
  );
};

export default TwiboFrameEditor;


