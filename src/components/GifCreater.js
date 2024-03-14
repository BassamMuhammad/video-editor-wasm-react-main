import { useEffect, useState } from "react"
import { Slider, Button } from "antd"
import { sliderValueToVideoTime } from "../utils/utils"
import { fetchFile } from "@ffmpeg/ffmpeg"

function GifCreator({ffmpeg, videoFile, videoPlayerState, videoPlayer, setProcessing}) {
    const [gifUrl, setGifUrl] = useState()
    const [sliderValues, setSliderValues] = useState([0, 100])

    useEffect(() => {
        const min = sliderValues[0]
        // when the slider values are updated, updating the
        // video time
        if (min !== undefined && videoPlayerState && videoPlayer) {
            videoPlayer.seek(sliderValueToVideoTime(videoPlayerState.duration, min))
        }
    }, [sliderValues])

    useEffect(() => {
        if (videoPlayer && videoPlayerState) {
            // allowing users to watch only the portion of
            // the video selected by the slider
            const [min, max] = sliderValues

            const minTime = sliderValueToVideoTime(videoPlayerState.duration, min)
            const maxTime = sliderValueToVideoTime(videoPlayerState.duration, max)

            if (videoPlayerState.currentTime < minTime) {
                videoPlayer.seek(minTime)
            }
            if (videoPlayerState.currentTime > maxTime) {
                // looping logic
                videoPlayer.seek(minTime)
            }
        }
    }, [videoPlayerState])

    useEffect(() => {
        // when the current videoFile is removed,
        // restoring the default state
        if (!videoFile) {
            setSliderValues([0, 100])
            setGifUrl(undefined)
        }
    }, [videoFile])

    const onGifCreated = (girUrl) => {
        setGifUrl(girUrl)
    }

    const onConversionStart = () => {
        setProcessing(true)
    }
    const onConversionEnd = () => {
        setProcessing(false)
    }

    const convertToGif = async () => {
        // starting the conversion process
        onConversionStart(true)

        const inputFileName = "gif.mp4"
        const outputFileName = "output.gif"

        // writing the video file to memory
        ffmpeg.FS("writeFile", inputFileName, await fetchFile(videoFile))

        const [min, max] = sliderValues
        const minTime = sliderValueToVideoTime(videoPlayerState.duration, min)
        const maxTime = sliderValueToVideoTime(videoPlayerState.duration, max)

        // cutting the video and converting it to GIF with a FFMpeg command
        await ffmpeg.run("-i", inputFileName, "-ss", `${minTime}`, "-to", `${maxTime}`, "-f", "gif", outputFileName)

        // reading the resulting file
        const data = ffmpeg.FS("readFile", outputFileName)

        // converting the GIF file created by FFmpeg to a valid image URL
        const gifUrl = URL.createObjectURL(new Blob([data.buffer], { type: "image/gif" }))
        onGifCreated(gifUrl)

        // ending the conversion process
        onConversionEnd(false)
    }

    return (
        <>
                <div className={"slider-div"}>
                    <h3>Choose Gif Content</h3>
                    <Slider
                        disabled={!videoPlayerState}
                        value={sliderValues}
                        range={true}
                        onChange={(values) => {
                            setSliderValues(values)
                        }}
                        tooltip={{
                            formatter: null,
                        }}
                    />
                </div>
                <div className={"conversion-div"}>
                    <Button onClick={() => convertToGif()}>Convert to GIF</Button>
                </div>
                {gifUrl && (
                    <div className={"gif-div"}>
                        <h3>Resulting GIF</h3>
                        <img src={gifUrl} className={"gif"} alt={"GIF file generated in the client side"} />
                        <a href={gifUrl} download={"test.gif"} className={"ant-btn ant-btn-default"}>
                            Download
                        </a>
                    </div>
                )}
               </>
    )
                }

export default GifCreator
