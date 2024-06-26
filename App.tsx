import { Canvas, Circle, Group, Image, Rect, Text, matchFont, useImage } from "@shopify/react-native-skia";
import React, { useEffect, useState } from "react";
import { Alert, Platform, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const GRAVITY = 1000;
const JUMP_FORCE = -500;

const pipeWidth = 104;
const pipeHeight = 640;

const App = () => {
  const { width, height } = useWindowDimensions();
  const [score, setScore] = useState(0);

  const bg = useImage(require('./assets/sprites/background-day.png'));
  const bird = useImage(require('./assets/sprites/yellowbird-upflap.png'));
  const pipeBottom = useImage(require('./assets/sprites/pipe-green.png'));
  const pipeTop = useImage(require('./assets/sprites/pipe-green-top.png'));
  const base = useImage(require('./assets/sprites/base.png'));
  // const font = useFont(require('./assets/fonts/Roboto-Bold.ttf'), 20);

  const gameOver = useSharedValue(false);
  const pipeX = useSharedValue(width);

  const birdY = useSharedValue(height / 3);
  const birdX = width / 4;
  const birdYVelocity = useSharedValue(0);

  const pipeOffset = useSharedValue(0);
  const topPipeY = useDerivedValue(() => pipeOffset.value - 320);
  const bottomPipeY = useDerivedValue(() => height - 320 + pipeOffset.value);

  const pipesSpeed = useDerivedValue(() => {
    return interpolate(score, [0, 20], [1, 2])
  });

  const obstacles = useDerivedValue(() => [
    // add top pipe
    {
      x: pipeX.value,
      y: topPipeY.value,
      h: pipeHeight,
      w: pipeWidth,
    },

    // add bottom pipe
    {
      x: pipeX.value,
      y: bottomPipeY.value,
      h: pipeHeight,
      w: pipeWidth,
    },
  ]);

  useEffect(() => {
    moveTheMap();
  }, []);

  const moveTheMap = () => {
    pipeX.value =
      withSequence(
        withTiming(width, { duration: 0 }),
        withTiming(-150, {
          duration: 3000 / pipesSpeed.value,
          easing: Easing.linear,
        }),
        withTiming(width, { duration: 0 }),
      );
  }

  // Scoring system
  useAnimatedReaction(
    () => pipeX.value,
    (currentValue, previousValue) => {
      const middle = birdX;

      // change offset for the postion of the next gap
      if (currentValue < -100 && previousValue > -100) {
        pipeOffset.value = Math.random() * 400 - 200;
        cancelAnimation(pipeX);
        runOnJS(moveTheMap)();
      }

      if (
        currentValue !== previousValue &&
        currentValue < middle &&
        previousValue > middle
      ) {
        // do something ✨
        runOnJS(setScore)(score + 1);
      }
    }
  );

  const isPointCollidingWithRect = (point, rect) => {
    'worklet';
    return (
      point.x >= rect.x && // right of the left edge AND
      point.x <= rect.x + rect.w && // left of the right edge AND
      point.y >= rect.y && // below the top AND
      point.y <= rect.y + rect.h // above the bottom
    );
  };

  // Collision detection
  useAnimatedReaction(
    () => birdY.value,
    (currentValue, previeusValue) => {
      const center = {
        x: birdX + 32,
        y: birdY.value + 24
      };

      // Groun collision detection
      if (currentValue > height - 100 || currentValue < 0) {
        gameOver.value = true;
      }

      const isColliding = obstacles.value.some((rect) =>
        isPointCollidingWithRect(center, rect)
      );

      if (isColliding) {
        gameOver.value = true;
      }
    }
  );

  useAnimatedReaction(
    () => gameOver.value,
    (currentValue, previeusValue) => {
      if (currentValue && !previeusValue) {
        cancelAnimation(pipeX);
      }
    }
  );

  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt || gameOver.value) {
      return;
    }
    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

  const restartGame = () => {
    'worklet';
    birdY.value = height / 3;
    birdYVelocity.value = 0;
    gameOver.value = false;
    pipeX.value = width;
    runOnJS(moveTheMap)();
    runOnJS(setScore)(0);
  };

  const gesture = Gesture.Tap().onStart(() => {
    if (gameOver.value) {
      // restart
      restartGame();
    } else {
      // Jump
      birdYVelocity.value = JUMP_FORCE;
    }
  });

  const birdTransform = useDerivedValue(() => {
    return [{
      rotate: interpolate(
        birdYVelocity.value,
        [-500, 500],
        [-0.5, 0.5],
        Extrapolation.CLAMP
      )
    }];
  });
  const birdOrigin = useDerivedValue(() => {
    return { x: width / 4 + 32, y: birdY.value + 24 };
  });

  const fontFamily = Platform.select({ ios: "Helvetica", default: "serif" });
  const fontStyle = {
    fontFamily,
    fontSize: 40,
    width: "bold",
  };
  const font = matchFont(fontStyle);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
        <Canvas style={{ width, height }}>
          {/* BG */}
          <Image width={width} height={height} fit={'cover'} image={bg} />

          {/* Pipes */}
          <Image
            image={pipeTop}
            y={topPipeY}
            x={pipeX}
            width={pipeWidth}
            height={pipeHeight}
          />
          <Image
            image={pipeBottom}
            y={bottomPipeY}
            x={pipeX}
            width={pipeWidth}
            height={pipeHeight}
          />

          {/* Base */}
          <Image
            image={base}
            width={width}
            height={150}
            y={height - 75}
            x={0}
            fit={'cover'}
          />

          {/* Bird */}
          <Group
            transform={birdTransform}
            origin={birdOrigin}
          >
            <Image
              image={bird}
              y={birdY}
              x={birdX}
              width={64}
              height={48}
            />
          </Group>

          {/* Score */}
          <Text x={width / 2} y={100} text={score.toString()} font={font} />
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

export default App;