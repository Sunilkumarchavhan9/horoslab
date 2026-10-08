// Keep the browser-facing V12 route aligned with the backend's stable mount.
// The implementation is shared with the legacy proxy so auth and org headers
// remain identical while clients migrate from /api/horos to /api/v1/horos.
export {
  DELETE,
  GET,
  PATCH,
  POST,
  PUT,
} from "@/app/api/horos/[...horosPath]/route";
