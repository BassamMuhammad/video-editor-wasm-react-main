import { useEffect, useState } from "react"
import { Slider, Button } from "antd"
import { sliderValueToVideoTime } from "../utils/utils"
import { fetchFile } from "@ffmpeg/ffmpeg"
import { VideoPlayer } from "./VideoPlayer"

function ResizeVideo({ffmpeg, videoFile, videoPlayerState, videoPlayer, setProcessing}) {
    const [gifUrl, setGifUrl] = useState()
    const [width, setWidth] = useState("")
    const [height, setHeight] = useState("")

    useEffect(() => {
        // when the current videoFile is removed,
        // restoring the default state
        if (!videoFile) {
            setGifUrl(undefined)
        }
    }, [videoFile])

    const onGifCreated = (girUrl) => {
        setGifUrl(girUrl)
    }

    const onConversionStart = () => {
        setGifUrl(null)
        setProcessing(true)
    }
    const onConversionEnd = () => {
        setProcessing(false)
    }

    const clipVideo = async () => {
        // starting the conversion process
        onConversionStart(true)

        const inputFileName = "gif.mp4"
        const outputFileName = "output.mp4"

        // writing the video file to memory
        ffmpeg.FS("writeFile", inputFileName, await fetchFile(videoFile))

        // cutting the video and converting it to GIF with a FFMpeg command
        await ffmpeg.run("-i", inputFileName, "-vf", `scale=${width}:${height}`, outputFileName)

        // reading the resulting file
        const data = ffmpeg.FS("readFile", outputFileName)

        // converting the GIF file created by FFmpeg to a valid image URL
        const gifUrl = URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }))
        onGifCreated(gifUrl)

        // ending the conversion process
        onConversionEnd(false)
    }

    return (
        <>
                <div className={"slider-div"}>
                    <h3>Choose Dimensions</h3>
                    <input style={{marginRight: 10}} type="text" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="Width" />
                    <input type="text" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Height" />
                </div>
                <div className={"conversion-div"}>
                    <Button onClick={() => clipVideo()}>Resize Video</Button>
                </div>
                {gifUrl && (
                    <div className={"gif-div"}>
                        <VideoPlayer
                            src={gifUrl}
                        />
                         <a href={gifUrl} download={"test.gif"} className={"ant-btn ant-btn-default"}>
                            Download
                        </a>
                    </div>
                )}
               </>
    )
                }

export default ResizeVideo
