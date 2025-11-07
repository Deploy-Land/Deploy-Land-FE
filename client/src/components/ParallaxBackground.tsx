import { useParallax } from "../hooks/useParallax";

export function ParallaxBackground() {
  const { skyRef, farRef, midRef, treesRef, nearRef } = useParallax();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <div
        ref={skyRef}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/parallax_mountain_pack/layers/parallax-mountain-bg.png')",
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
          backgroundPosition: "0px bottom",
          willChange: "background-position",
        }}
      />
      <div
        ref={farRef}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/parallax_mountain_pack/layers/parallax-mountain-montain-far.png')",
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
          backgroundPosition: "0px bottom",
          willChange: "background-position",
        }}
      />
      <div
        ref={midRef}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/parallax_mountain_pack/layers/parallax-mountain-mountains.png')",
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
          backgroundPosition: "0px bottom",
          willChange: "background-position",
        }}
      />
      <div
        ref={treesRef}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/parallax_mountain_pack/layers/parallax-mountain-trees.png')",
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
          backgroundPosition: "0px bottom",
          willChange: "background-position",
        }}
      />
      <div
        ref={nearRef}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/parallax_mountain_pack/layers/parallax-mountain-foreground-trees.png')",
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
          backgroundPosition: "0px bottom",
          willChange: "background-position",
        }}
      />
    </div>
  );
}