import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** Brand mark: the Finance line badge on an ink square. */
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#111A1F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: "62%",
            height: "62%",
            borderRadius: "50%",
            background: "#0A5FAF",
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 190,
            fontWeight: 800,
          }}
        >
          TC
        </div>
      </div>
    ),
    size,
  );
}
