# OBS Studio Stream Dashboard

This is an OBS Studio stream dashboard. It currently has a UI control that can turn a defined scene in OBS studio on and start streaming, as well as a control to stop the stream.

https://github.com/benjaminknox/stream-dashboard/assets/5668789/a6d69fd3-acff-4dec-8759-ab5f4f01c06a

### Prerequisite

- An OBS studio instance set up with websockets enabled, [see here for details](https://github.com/obsproject/obs-websocket)
- An rtmp stream server set up with with an accessible hls based m3u8 stream available, an example is [owncast](https://owncast.online/quickstart/)
- OBS Configured to stream to the rtmp server set up above, [here is a guide](https://mslivecdn.com/blog/obs-custom-rtmp-server/)

### Envrionment Variables

```dotenv

NEXT_PUBLIC_OBS_WEBSOCKETS_PASSWORD=<obs websocket password>
NEXT_PUBLIC_STREAM_URL=<url to your hls stream>
NEXT_PUBLIC_OBS_WEBSOCKETS_SERVER=<your obs websockets url>

```

### Developing & Running Locally

_note: The react hls player has a dependency conflict with the react version, but this is the best player so I am force installing_ 

You can run the server for development using these commands:
```bash
$ npm i -f && npm run dev
```
