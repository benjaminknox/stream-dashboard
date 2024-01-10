"use client";

import { wait } from "@/utils";
import OBSWebSocket from "obs-websocket-js";
import ReactHlsPlayer from "react-hls-player";
import { useInterval } from "@/hooks/useInterval";
import type OBSWebSocketType from "obs-websocket-js";
import { SceneSelector } from "@/components/scene-selector";
import { StreamActionKind, streamReducer } from "@/types/stream-state";
import { useCallback, useReducer, useEffect, useState, useRef } from "react";

import type { StreamState, StreamAction } from "@/types/stream-state";

import {
  Card,
  Chip,
  Button,
  Tooltip,
  CardBody,
  CardHeader,
  CardFooter,
} from "@nextui-org/react";

export default function Home() {
  const [state, dispatch] = useReducer(streamReducer, {
    active: false,
    loading: false,
    sceneList: [],
  });

  const { obs, active, loading, currentScene, sceneList } = state;

  const playerRef = useRef(null);

  const connectToOBS = useCallback(async () => {
    const _obs = new OBSWebSocket();

    try {
      await _obs.connect(
        process.env.NEXT_PUBLIC_OBS_WEBSOCKETS_SERVER,
        process.env.NEXT_PUBLIC_OBS_WEBSOCKETS_PASSWORD
      );
    } catch {
      console.warn("OBS websockets is not present, resetting");

      dispatch({ type: StreamActionKind.SETOBS });
      dispatch({ type: StreamActionKind.SCENELIST, payload: [] });
      return;
    }

    if (obs) return;

    dispatch({ type: StreamActionKind.SETOBS, payload: _obs });

    try {
      const streamStatus = await _obs.call("GetStreamStatus");
      const sceneList = await _obs.call("GetSceneList");

      dispatch({
        type: StreamActionKind.SCENELIST,
        payload: sceneList.scenes.map((scene) => `${scene.sceneName}`),
      });

      dispatch({
        type: streamStatus.outputActive
          ? StreamActionKind.ACTIVE
          : StreamActionKind.INACTIVE,
      });

      if (streamStatus.outputActive) {
        dispatch({
          type: StreamActionKind.SCENE,
          payload: sceneList.currentProgramSceneName,
        });
      }
    } catch {
      console.warn("OBS Websockets are not ready, resetting");
      dispatch({ type: StreamActionKind.SETOBS });
      dispatch({ type: StreamActionKind.SCENELIST, payload: [] });
    }
  }, [obs]);

  const startStream = () => {
    obs &&
      obs
        .call("StartStream")
        .then(() =>
          wait(() => {
            obs
              .call("GetStreamStatus")
              .then((streamStatus: { outputActive: boolean }) => {
                if (streamStatus.outputActive) {
                  wait(() => {
                    dispatch({
                      type: StreamActionKind.ACTIVE,
                    });
                    dispatch({ type: StreamActionKind.NOTLOADING });
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
    dispatch({ type: StreamActionKind.LOADING });
    dispatch({ type: StreamActionKind.SCENE, payload: sceneName });

    if (!obs) return;

    if (active) {
      await obs.call("StopStream");
      dispatch({
        type: StreamActionKind.INACTIVE,
      });
    }

    await obs.call("SetCurrentProgramScene", { sceneName });

    startStream();
  };

  const handleStopStream = async () => {
    if (!obs) return;
    await obs.call("StopStream");
    dispatch({
      type: StreamActionKind.INACTIVE,
    });
    dispatch({ type: StreamActionKind.SCENE });
  };

  useInterval(() => {
    connectToOBS();
  }, 2000);

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
              loading={loading ?? false}
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
