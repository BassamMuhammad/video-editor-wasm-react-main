import { useEffect, useState } from "react";
import { Slider, Button } from "antd";
import { sliderValueToVideoTime } from "../utils/utils";
import { fetchFile } from "@ffmpeg/ffmpeg";
import { VideoPlayer } from "./VideoPlayer";
import { SketchPicker } from "react-color";

function AddOverlay({
  ffmpeg,
  videoFile,
  videoPlayerState,
  videoPlayer,
  setProcessing,
  canvasRef,
}) {
  const [gifUrl, setGifUrl] = useState();
  const [overlays, setOverlays] = useState([]);

  useEffect(() => {
    // when the current videoFile is removed,
    // restoring the default state
    if (!videoFile) {
      setGifUrl(undefined);
    }
  }, [videoFile]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setOverlays([]);
  };

  const drawRect = (
    x = Math.random() * 1500,
    y = Math.random() * 800,
    width = 150,
    height = 100,
    color = "#000",
    isDragging = false
  ) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    setOverlays((prev) => [
      ...prev,
      {
        type: "rect",
        name: "Rectangle",
        x,
        y,
        width,
        height,
        color,
        isDragging,
      },
    ]);
  };

  const drawText = (
    text = "Hello World",
    x = Math.random() * 1000 + 20,
    y = Math.random() * 600 + 50,
    color = "#000",
    isDragging = false
  ) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.font = `48px Arial`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    const overlay = { type: "text", name: text, x, y, color, isDragging }
    setOverlays((prev) => [
            ...prev,
            overlay,
          ]
    );
  };

  const onGifCreated = (girUrl) => {
    setGifUrl(girUrl);
  };

  const onConversionStart = () => {
    setGifUrl(null);
    setProcessing(true);
  };
  const onConversionEnd = () => {
    setProcessing(false);
  };

  const clipVideo = async () => {
    // starting the conversion process
    onConversionStart(true);
    const filterData = canvasRef.current.toDataURL("image/png")
    const inputFileName = "gif.mp4";
    const filterFileName = "filter.png"
    const outputFileName = "output.mp4";

    // writing the video file to memory
    ffmpeg.FS("writeFile", inputFileName, await fetchFile(videoFile));
    ffmpeg.FS("writeFile", filterFileName, await fetchFile(filterData));

    // cutting the video and converting it to GIF with a FFMpeg command
    await ffmpeg.run("-i", inputFileName, "-i", filterFileName, "-filter_complex", "overlay=0:0", outputFileName)

    // reading the resulting file
    const data = ffmpeg.FS("readFile", outputFileName);

    // converting the GIF file created by FFmpeg to a valid image URL
    const gifUrl = URL.createObjectURL(
      new Blob([data.buffer], { type: "video/mp4" })
    );
    onGifCreated(gifUrl);

    // ending the conversion process
    onConversionEnd(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const getMousePos = (evt) => {
      let rect = canvas.getBoundingClientRect(), // abs. size of element
        scaleX = canvas.width / rect.width, // relationship bitmap vs. element for x
        scaleY = canvas.height / rect.height; // relationship bitmap vs. element for y

      return {
        x: (evt.clientX - rect.left) * scaleX, // scale mouse coordinates after they have
        y: (evt.clientY - rect.top) * scaleY, // been adjusted to be relative to element
      };
    };

    const handleMouseDown = (e) => {
      const mousePosition = getMousePos(e);
      const tempOverlays = [...overlays];
      overlays.forEach((overlay, i) => {
        if (
          overlay.type === "rect" &&
          mousePosition.x > overlay.x &&
          mousePosition.x < overlay.x + overlay.width &&
          mousePosition.y > overlay.y &&
          mousePosition.y < overlay.y + overlay.height
        ) {
          tempOverlays[i].isDragging = true;
        } else if (overlay.type === "text") {
          const textWidth = ctx.measureText(overlay.name).width;
          const textHeight = 48;
          if (
            mousePosition.x > overlay.x &&
            mousePosition.x < overlay.x + textWidth &&
            mousePosition.y < overlay.y &&
            mousePosition.y > overlay.y - textHeight
          ) {
            tempOverlays[i].isDragging = true;
          }
        }
      });
      setOverlays(tempOverlays);
    };

    const handleMouseMove = (e) => {
      const { x, y } = getMousePos(e);
      const tempOverlays = [...overlays];
      let isOverlayUpdate = false;

      for (let i = 0; i < overlays.length; i++) {
        const overlay = overlays[i];
        if (
          overlay.type === "rect" &&
          x > overlay.x &&
          x < overlay.x + overlay.width &&
          y > overlay.y &&
          y < overlay.y + overlay.height
        ) {
          if (overlay.isDragging) {
            isOverlayUpdate = true;
            overlay.x = x - overlay.width / 2;
            overlay.y = y - overlay.height / 2;
            tempOverlays[i] = overlay;
          }
        } else if (overlay.type === "text") {
          const textWidth = ctx.measureText(overlay.name).width;
          const textHeight = 48;
          if (
            x > overlay.x &&
            x < overlay.x + textWidth &&
            y < overlay.y &&
            y > overlay.y - textHeight
          ) {
            if (overlay.isDragging) {
              isOverlayUpdate = true;
              overlay.x = x - textWidth/2;
              overlay.y = y + textHeight/2;
              tempOverlays[i] = overlay;
            }
          }
        }
      }

      if (isOverlayUpdate) {
        setOverlays(tempOverlays);
        redraw(tempOverlays);
      }
    };

    const handleMouseUp = () => {
      const tempOverlays = [...overlays];
      for (let i = 0; i < tempOverlays.length; i++) {
        tempOverlays[i].isDragging = false;
      }
      setOverlays(tempOverlays);
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseout", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseout", handleMouseUp);
    };
  }, [overlays]);

  useEffect(() => {
  }, [overlays]);

  const redraw = (overlays) => {
    clearCanvas();
    overlays.forEach(
      ({ name, type, x, y, width, height, color, isDragging }) => {
        if (type === "rect") drawRect(x, y, width, height, color, isDragging);
        else drawText(name, x, y, color, isDragging);
      }
    );
  };

  const deleteOverlay = (i) => {
    const tempOverlays = [...overlays];
    tempOverlays.splice(i, 1);
    setOverlays(tempOverlays);
    redraw(tempOverlays);
  };

  return (
    <>
      <div className={"slider-div"}>
        <h3>Draw Overlay</h3>
        <button onClick={() => drawRect()}>Draw Rect</button>
        <button onClick={() => drawText()}>Draw Text</button>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          width: "40vw",
        }}
      >
        {overlays.map(({ name, type }, i) => (
          <div
            key={i}
            style={{
              border: "2px solid black",
              padding: 10,
              marginRight: 10,
              marginBottom: 10,
            }}
          >
            <h3>{name}</h3>
            {type === "text" && (
              <>
                <input
                  value={name}
                  onChange={(e) => {
                    const tempOverlays = [...overlays];
                    tempOverlays[i].name = e.target.value;
                    setOverlays(tempOverlays);
                    redraw(tempOverlays);
                  }}
                />
              </>
            )}
            <SketchPicker
              onChangeComplete={(c) => {
                const tempOverlays = [...overlays];
                tempOverlays[i].color = c.hex;
                setOverlays(tempOverlays);
                redraw(tempOverlays);
              }}
            />
            <button onClick={() => deleteOverlay(i)}>Delete</button>
          </div>
        ))}
      </div>
      <div className={"conversion-div"}>
        <Button onClick={() => clipVideo()}>Draw Overlay Video</Button>
      </div>
      {gifUrl && (
        <div className={"gif-div"}>
          <VideoPlayer src={gifUrl} />
          <a
            href={gifUrl}
            download={"test.gif"}
            className={"ant-btn ant-btn-default"}
          >
            Download
          </a>
        </div>
      )}
    </>
  );
}

export default AddOverlay;
