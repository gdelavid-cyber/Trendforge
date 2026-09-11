/**
 * Framer Motion Animation Principles Demo Page
 * Demonstrates all 12 Disney animation principles using Framer Motion
 */

import React from "react";
import {
  SquashAndStretch,
  Anticipation,
  Staging,
  StraightAhead,
  FollowThrough,
  SlowInSlowOut,
  Arc,
  SecondaryAction,
  Timing,
  Exaggeration,
  SolidDrawing,
  Appeal,
  StaggerChildren,
  AnimatePresenceDemo,
  LayoutAnimation,
  CombinedDemo,
} from "@/app/_components/framer-motion-principles";

const DemoPage = () => {
  return (
    <main
      style={{
        padding: 32,
        maxWidth: 960,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        color: "#111",
      }}
    >
      <h1 style={{ marginBottom: 32, textAlign: "center" }}>
        Framer Motion — 12 Disney Animation Principles
      </h1>

      <section style={{ marginBottom: 48 }}>
        <h2>1. Squash and Stretch</h2>
        <SquashAndStretch />
        <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Scale X/Y animation with custom timing times
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2>2. Anticipation</h2>
        <Anticipation />
        <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Y-scale drop before jump motion
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2>3. Staging</h2>
        <Staging />
        <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Blurred background + emphasized hero
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2>4. Straight Ahead / Pose to Pose</h2>
        <StraightAhead />
        <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Multi-keyframe positional animation
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2>5. Follow Through and Overlapping Action</h2>
        <FollowThrough />
        <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Delayed child spans create overlap
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2>6. Slow In and Slow Out</h2>
        <SlowInSlowOut />
        <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Cubic-bezier eased movement
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2>7. Arc</h2>
        <Arc />
        <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Parabolic trajectory motion
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2>8. Secondary Action</h2>
        <SecondaryAction />
        <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Hover scale + rotating secondary icon
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2>9. Timing</h2>
        <Timing />
        <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Fast/normal/slow/spring duration presets
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2>10. Exaggeration</h2>
        <Exaggeration />
        <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Spring overshoot with low damping
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2>11. Solid Drawing</h2>
        <SolidDrawing />
        <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          3D perspective + rotation
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2>12. Appeal</h2>
        <Appeal />
        <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Hover scale + shadow elevation
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2>Stagger Children</h2>
        <StaggerChildren />
        <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Staggered list entrance with spring
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2>AnimatePresence</h2>
        <AnimatePresenceDemo />
        <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Exit animations on element removal
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2>Layout Animation</h2>
        <LayoutAnimation />
        <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Animate on mount + layout toggle
        </p>
      </section>

      <section>
        <h2>Combined Principles</h2>
        <CombinedDemo />
        <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
          Hover + tap + spring combined
        </p>
      </section>
    </main>
  );
};

export default DemoPage;