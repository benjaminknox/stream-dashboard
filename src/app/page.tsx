"use client";
import dynamic from "next/dynamic";
import OBSWebSocket from "obs-websocket-js";
import { backOff } from "exponential-backoff";
import ReactHlsPlayer from "react-hls-player";
import { useInterval } from "@/hooks/useInterval";
import type OBSWebSocketType from "obs-websocket-js";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  Card,
  Chip,
  Button,
  Tooltip,
  CardBody,
  CardHeader,
  CardFooter,
  CircularProgress,
} from "@nextui-org/react";

const ReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
  loading: () => <CircularProgress />,
});

const Player = ({ active }: { active: boolean }) => {
  return;
};

export default function Home() {
  const [obs, setObs] = useState<OBSWebSocketType>();
  const [active, setActive] = useState<boolean>(false);
  const [changed, setChanged] = useState<
    "Sunday Service Scene" | "Thursday Group Scene" | "StopStream"
  >();
  
  const playerRef = useRef(null);

  const connectToOBS = useCallback(async () => {
    if (obs) return;
    const _obs = new OBSWebSocket();
    setObs(_obs);
    await _obs.connect(
      process.env.NEXT_PUBLIC_OBS_WEBSOCKETS_SERVER,
      process.env.NEXT_PUBLIC_OBS_WEBSOCKETS_PASSWORD
    );
    const streamStatus = await _obs.call("GetStreamStatus");

    setActive(streamStatus.outputActive);
  }, [obs]);

  const handleStartScene = async (
    sceneName: "Sunday Service Scene" | "Thursday Group Scene"
  ) => {
    setChanged(sceneName);

    await backOff(
      async () => {
        if (!obs) return;
        await obs.call("SetCurrentProgramScene", { sceneName });
        await obs.call("StartStream");

        setTimeout(async () => {
          const streamStatus = await obs.call("GetStreamStatus");

          if (!streamStatus.outputActive) {
            throw new Error("The stream didn't start");
          }

          setActive(streamStatus.outputActive);
          setChanged(undefined);
        }, 10000);
      },
      { numOfAttempts: 20, timeMultiple: 4 }
    );
  };

  const handleStopStream = async () => {
    if (!obs) return;
    await obs.call("StopStream");
    setActive(false);
  };

  useEffect(() => {
    connectToOBS();
  }, [connectToOBS]);

  return (
    <main
      style={{
        background:
          "linear-gradient(hsl(var(--stream-primary-50)), hsl(var(--stream-secondary-50)))",
      }}
      className="dark flex min-h-screen justify-center items-center"
    >
      <Card isFooterBlurred style={{ maxWidth: 640 }}>
        <CardHeader className="justify-between">
          <div>Madison Place Community Church Live Stream</div>
          {active ? (
            <Chip color="success">Online</Chip>
          ) : (
            <Chip color="danger">Offline</Chip>
          )}
        </CardHeader>
        <CardBody style={{ width: 640, height: 360 }} className="p-0">
          {active ? (
            <ReactHlsPlayer
              playerRef={playerRef}
              src={`${process.env.NEXT_PUBLIC_STREAM_URL}`}
              autoPlay={true}
              controls={true}
              width="100%"
              height="auto"
            />
          ) : null}
        </CardBody>
        <CardFooter className="gap-5 justify-center">
          <Tooltip
            crossOffset={5}
            color={!active && changed ? "warning" : "secondary"}
            placement="top-start"
            showArrow={true}
            content={
              <div className="p-2 pl-0">
                {!active && changed
                  ? "✋🏽 Just a heads up, the stream may take a moment to get going!"
                  : "👇 You can start a service stream by pressing one of these"}
              </div>
            }
            isOpen={!active}
          >
            <Button
              variant="faded"
              isLoading={!active && changed === "Sunday Service Scene"}
              isDisabled={active || changed === "Thursday Group Scene"}
              onClick={() => handleStartScene("Sunday Service Scene")}
            >
              Start Sunday Service Stream
            </Button>
          </Tooltip>
          <Button
            variant="faded"
            isLoading={!active && changed === "Thursday Group Scene"}
            isDisabled={active || changed === "Sunday Service Scene"}
            onClick={() => handleStartScene("Thursday Group Scene")}
          >
            Start Thursday Group Stream
          </Button>
          <Button
            variant="faded"
            isLoading={active && changed === "StopStream"}
            isDisabled={!active}
            onClick={handleStopStream}
          >
            End Stream
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
