import { createFFmpeg } from "@ffmpeg/ffmpeg"
import { useEffect, useState, useRef, useMemo } from "react"
import { Spin, Tabs } from "antd"
import { VideoPlayer } from "./VideoPlayer"
import { sliderValueToVideoTime } from "../utils/utils"
import VideoUpload from "./VideoUpload"
import GifCreator from "./GifCreater"
import ClipVideo from "./ClipVideo"
import ResizeVideo from "./ResizeVideo"
import AddOverlay from "./AddOverlay"
const ffmpeg = createFFmpeg({ log: true })

function VideoEditor() {
    const [ffmpegLoaded, setFFmpegLoaded] = useState(false)
    const [videoFile, setVideoFile] = useState()
    const [videoPlayerState, setVideoPlayerState] = useState()
    const [videoPlayer, setVideoPlayer] = useState()
    const [processing, setProcessing] = useState(false)
    const canvasRef = useRef()

    useEffect(() => {
        // loading ffmpeg on startup
        ffmpeg.load().then(() => {
            setFFmpegLoaded(true)
        })
    }, [])

    useEffect(() => {
        // when the current videoFile is removed,
        // restoring the default state
        if (!videoFile) {
            setVideoPlayerState(undefined)
            setVideoPlayerState(undefined)
        }
    }, [videoFile])
    const items = useMemo(() => {
        return[
        {
          key: '1',
          label: 'Create Gif',
          children: <GifCreator ffmpeg={ffmpeg} setProcessing={setProcessing} videoFile={videoFile} videoPlayer={videoPlayer} videoPlayerState={videoPlayerState} />
        },
        {
          key: '2',
          label: 'Clip Video',
          children: <ClipVideo ffmpeg={ffmpeg} setProcessing={setProcessing} videoFile={videoFile} videoPlayer={videoPlayer} videoPlayerState={videoPlayerState} />,
        },
        {
          key: '3',
          label: 'AddOverlay',
          children: <AddOverlay canvasRef={canvasRef} ffmpeg={ffmpeg} setProcessing={setProcessing} videoFile={videoFile} videoPlayer={videoPlayer} videoPlayerState={videoPlayerState} />,
        },
        {
          key: '4',
          label: 'Resize',
          children: <ResizeVideo ffmpeg={ffmpeg} setProcessing={setProcessing} videoFile={videoFile} videoPlayer={videoPlayer} videoPlayerState={videoPlayerState} />,
        },
      ]}, [canvasRef, canvasRef?.current, ffmpeg, videoFile, videoPlayer, videoPlayerState])

    return (
        <div>
            <Spin
                spinning={processing || !ffmpegLoaded}
                tip={!ffmpegLoaded ? "Waiting for FFmpeg to load..." : "Processing..."}
            >
                <div style={{position: "relative"}}>
                    {videoFile ? (
                        <>
                        <VideoPlayer
                            src={URL.createObjectURL(videoFile)}
                            onPlayerChange={(videoPlayer) => {
                                setVideoPlayer(videoPlayer)
                            }}
                            onChange={(videoPlayerState) => {
                                setVideoPlayerState(videoPlayerState)
                            }}
                        />
                        <canvas ref={canvasRef} width="1920" height="1080" style={{position: "absolute", display: "inline-block", zIndex: 1, height: "auto", width: "652.444px", top: 0, left: 0}}></canvas>
                        </>
                    ) : (
                        <h1>Upload a video</h1>
                    )}
                </div>
                <div className={"upload-div"}>
                    <VideoUpload
                        disabled={!!videoFile}
                        onChange={(videoFile) => {
                            setVideoFile(videoFile)
                        }}
                        onRemove={() => {
                          setVideoFile(undefined)
                        }}
                    />
                </div>
                <Tabs items={items} />
            </Spin>
        </div>
    )
}

export default VideoEditor
