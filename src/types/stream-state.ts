import type OBSWebSocket from "obs-websocket-js";

export interface StreamState {
  obs: OBSWebSocket;
  active: boolean;
  currentScene: string;
  sceneList: string[];
  loading: boolean;
}

export enum StreamActionKind {
  SETOBS = "SETOBS",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  LOADING = "LOADING",
  NOTLOADING = "NOTLOADING",
  SCENE = "SCENE",
  SCENELIST = "SCENELIST",
}

export interface StreamAction {
  type: StreamActionKind;
  payload?: any;
}

export const streamReducer = (state: Partial<StreamState>, action: StreamAction) => {
  const { type, payload } = action;
  switch (type) {
    case StreamActionKind.SETOBS:
      return {
        ...state,
        obs: payload,
      };
    case StreamActionKind.ACTIVE:
      return {
        ...state,
        active: true,
      };
    case StreamActionKind.INACTIVE:
      return {
        ...state,
        active: false,
      };
    case StreamActionKind.LOADING:
      return {
        ...state,
        loading: true,
      };
    case StreamActionKind.NOTLOADING:
      return {
        ...state,
        loading: false,
      };
    case StreamActionKind.SCENE:
      return {
        ...state,
        currentScene: payload,
      };
    case StreamActionKind.SCENELIST:
      return {
        ...state,
        sceneList: payload,
      };
    default:
      return state;
  }
};

