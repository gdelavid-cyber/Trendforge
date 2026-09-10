/**
 * Framer Motion Animation Principles Demo
 * Implements all 12 Disney animation principles using Framer Motion's declarative React API
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

// ==================== PRINCIPLE 1: Squash and Stretch ====================
const SquashAndStretch = () => (
  <motion.div
    animate={{ scaleX: [1, 1.2, 1], scaleY: [1, 0.8, 1] }}
    transition={{ duration: 0.3, times: [0, 0.5, 1] }}
    style={{ height: 50, width: 50, background: "tomato", borderRadius: 10 }}
  />
);

// ==================== PRINCIPLE 2: Anticipation ====================
const Anticipation = () => (
  <motion.div
    variants={{
      idle: { y: 0, scaleY: 1 },
      anticipate: { y: 10, scaleY: 0.9 },
      jump: { y: -200 }
    }}
    initial="idle"
    animate={["anticipate", "jump"]}
    transition={{ duration: 0.5, times: [0, 0.2, 1] }}
    style={{ height: 50, width: 50, background: "lightblue", borderRadius: 10 }}
  />
);

// ==================== PRINCIPLE 3: Staging ====================
const Staging = () => (
  <>
    <motion.div style={{ height: 30, width: 30, background: "#aaa", borderRadius: 5, filter: "blur(3px)", opacity: 0.6 }} /> {/* bg */}
    <motion.div style={{ height: 50, width: 50, background: "orange", borderRadius: 10, scale: 1.1, zIndex: 10 }} /> {/* hero */}
  </>
);

// ==================== PRINCIPLE 4: Straight Ahead / Pose to Pose ====================
const StraightAhead = () => (
  <motion.div
    animate={{ x: [0, 100, 200, 300], y: [0, -50, 0, -30] }}
    transition={{ duration: 1, ease: "easeInOut" }}
    style={{ height: 50, width: 50, background: "lightgreen", borderRadius: 10 }}
  />
);

// ==================== PRINCIPLE 5: Follow Through and Overlapping Action ====================
const FollowThrough = () => (
  <motion.div animate={{ x: 200 }} transition={{ duration: 0.5 }}>
    <motion.span
      animate={{ x: 200 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      style={{ marginLeft: 20, fontSize: 20, display: "inline-block" }} // hair
    >
      ⚡
    </motion.span>
    <motion.span
      animate={{ x: 200 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      style={{ marginLeft: 20, fontSize: 20, display: "inline-block" }} // cape
    >
      ✨
    </motion.span>
  </motion.div>
);

// ==================== PRINCIPLE 6: Slow In and Slow Out ====================
const SlowInSlowOut = () => (
  <motion.div
    animate={{ x: 300 }}
    transition={{
      duration: 0.6,
      ease: [0.42, 0, 0.58, 1] // easeInOut cubic-bezier
    }}
    style={{ height: 50, width: 50, background: "purple", borderRadius: 10 }}
  />
);

// ==================== PRINCIPLE 7: Arc ====================
const Arc = () => (
  <motion.div
    animate={{ x: [0, 100, 200], y: [0, -100, 0] }}
    transition={{ duration: 1, ease: "easeInOut" }}
    style={{ height: 50, width: 50, background: "gold", borderRadius: 10 }}
  />
);

// ==================== PRINCIPLE 8: Secondary Action ====================
const SecondaryAction = () => (
  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
    <motion.span
      animate={{ rotate: [0, 10, -10, 0] }}
      transition={{ duration: 0.3 }}
      style={{ marginRight: 8, display: "inline-block" }}
    >
      🎯
    </motion.span>
    Click Me
  </motion.button>
);

// ==================== PRINCIPLE 9: Timing ====================
const Timing = () => {
  const timings = {
    fast: { duration: 0.15 },
    normal: { duration: 0.3 },
    slow: { duration: 0.6 },
    spring: { type: "spring", stiffness: 300, damping: 20 }
  };

  return (
    <>
      <motion.div animate={{ x: 100 }} transition={timings.fast} style={{ height: 30, width: 30, background: "red", borderRadius: 5 }} />
      <motion.div animate={{ x: 100 }} transition={timings.normal} style={{ height: 30, width: 30, background: "orange", borderRadius: 5 }} />
      <motion.div animate={{ x: 100 }} transition={timings.slow} style={{ height: 30, width: 30, background: "yellow", borderRadius: 5 }} />
      <motion.div animate={{ x: 100 }} transition={timings.spring} style={{ height: 30, width: 30, background: "green", borderRadius: 5 }} />
    </>
  );
};

// ==================== PRINCIPLE 10: Exaggeration ====================
const Exaggeration = () => (
  <motion.div
    animate={{ scale: 1.5, rotate: 720 }}
    transition={{
      type: "spring",
      stiffness: 200,
      damping: 10 // low damping = overshoot
    }}
    style={{ height: 50, width: 50, background: "cyan", borderRadius: 10 }}
  />
);

// ==================== PRINCIPLE 11: Solid Drawing ====================
const SolidDrawing = () => (
  <motion.div
    style={{ perspective: 1000, height: 50, width: 50, background: "pink", borderRadius: 10 }}
    animate={{ rotateX: 45, rotateY: 30 }}
    transition={{ duration: 0.5 }}
  />
);

// ==================== PRINCIPLE 12: Appeal ====================
const Appeal = () => (
  <motion.div
    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
    transition={{ duration: 0.3 }}
    style={{ height: 50, width: 50, background: "lightgray", borderRadius: 10 }}
  />
);

// ==================== STAGGER CHILDREN ====================
const items = ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariant = {
  hidden: { y: 20, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 150 }
  }
};

const StaggerChildren = () => (
  <motion.ul variants={staggerContainer} initial="hidden" animate="show">
    {items.map((item, index) => (
      <motion.li key={item} variants={itemVariant} style={{ listStyle: "none", margin: 10, padding: 10, background: `hsl(${index * 50}, 70%, 60%)` }}>
        {item}
      </motion.li>
    ))}
  </motion.ul>
);

// ==================== ANIMATE PRESENCE ====================
const itemsForPresence = ["A", "B", "C"];

const presenceVariant = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 }
};

const AnimatePresenceDemo = () => (
  <AnimatePresence variants={presenceVariant} mode="wait">
    {itemsForPresence.map((item, index) => (
      <motion.key key={item} initial="hidden" animate="visible" exit="exit" style={{ display: "inline-block", margin: 5, padding: 10, background: "teal" }}>
        {item}
      </motion.key>
    ))}
  </AnimatePresence>
);

// ==================== LAYOUT ANIMATION ====================
const LayoutAnimation = () => {
  const [visible, setVisible] = React.useState(true);

  return (
    <>
      <motion.div
        layout
        hidden="hidden"
        animate="show"
        exit="hidden"
        transition={{ duration: 0.5 }}
        style={{ display: "inline-block", margin: 10, padding: 10, background: "brown" }}
      >
        Layout Animated
      </motion.div>
      <button onClick={() => setVisible(!visible)} style={{ marginTop: 10 }}>
        Toggle
      </button>
    </>
  );
};

// ==================== COMBINED PRINCIPLES DEMO ====================
const CombinedDemo = () => (
  <motion.div
    whileHover={{ scale: 1.02, rotate: 10 }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: "spring", stiffness: 250, damping: 25 }}
    style={{ height: 60, width: 60, background: "teal", borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
  >
    🎨
  </motion.div>
);

// ==================== EXPORTS ====================
export {
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
  CombinedDemo
};