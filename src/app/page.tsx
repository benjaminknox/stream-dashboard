"use client";
import dynamic from "next/dynamic";
import OBSWebSocket from "obs-websocket-js";
import { backOff } from "exponential-backoff";
import ReactHlsPlayer from "react-hls-player";
import { useInterval } from "@/hooks/useInterval";
import type OBSWebSocketType from "obs-websocket-js";
import { SceneSelector } from "@/components/scene-selector";
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

const wait = (fn: () => void, timeout = 3000) => setTimeout(fn, timeout);

export default function Home() {
  const [obs, setObs] = useState<OBSWebSocketType>();
  const [active, setActive] = useState<boolean>(false);
  const [currentScene, setCurrentScene] = useState<string>();
  const [sceneList, setSceneList] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

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

    const sceneList = await _obs.call("GetSceneList");

    setSceneList(sceneList.scenes.map((scene) => `${scene.sceneName}`));

    setActive(streamStatus.outputActive);

    if (streamStatus.outputActive) {
      setCurrentScene(sceneList.currentProgramSceneName);
    }
  }, [obs]);

  const startStream = () => {
    obs &&
      obs
        .call("StartStream")
        .then(() =>
          wait(() => {
            obs.call("GetStreamStatus").then((streamStatus) => {
              if (streamStatus.outputActive) {
                wait(() => {
                  setActive(streamStatus.outputActive);
                  setLoading(false);
                });
              } else {
                startStream();
              }
            });
          })
        )
        .catch(() => wait(() => startStream()));
  };

  const handleStartScene = async (sceneName: string) => {
    setLoading(true);
    setCurrentScene(sceneName);

    if (!obs) return;

    if (active) {
      await obs.call("StopStream");
      setActive(false);
    }

    await obs.call("SetCurrentProgramScene", { sceneName });

    startStream();
  };

  const handleStopStream = async () => {
    if (!obs) return;
    await obs.call("StopStream");
    setActive(false);
    setCurrentScene(undefined);
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
      className="flex min-h-screen justify-center items-center"
    >
      <Card isFooterBlurred style={{ maxWidth: 640 }}>
        <CardHeader className="justify-between">
          <div>
            {process.env.NEXT_PUBLIC_STREAM_TITLE ?? `OBS Streaming Service`}
          </div>
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
        <Tooltip
          crossOffset={20}
          color={!active && currentScene ? "warning" : "secondary"}
          placement="top-start"
          showArrow={true}
          content={
            <div className="p-2 pl-0">
              {!active && currentScene
                ? "✋🏽 Just a heads up, the stream may take a moment to get going!"
                : "👇 You can start the stream by selecting one from this dropdown"}
            </div>
          }
          isOpen={!active}
        >
          <CardFooter className="gap-5">
            <SceneSelector
              loading={loading}
              currentScene={currentScene}
              sceneList={sceneList}
              handleStartScene={handleStartScene}
            />
            <Button
              variant="faded"
              isLoading={active && currentScene === "StopStream"}
              isDisabled={!active}
              onClick={handleStopStream}
            >
              End Stream
            </Button>
          </CardFooter>
        </Tooltip>
      </Card>
    </main>
  );
}
