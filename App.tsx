import { Canvas, Image, useImage } from "@shopify/react-native-skia";
import React, { useEffect } from "react";
import { useWindowDimensions } from "react-native";
import { Easing, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

const App = () => {
  const { width, height } = useWindowDimensions();
  const r = width * 0.33;
  const bg = useImage(require('./assets/sprites/background-day.png'));
  const bird = useImage(require('./assets/sprites/yellowbird-upflap.png'));
  const pipeBottom = useImage(require('./assets/sprites/pipe-green.png'));
  const pipeTop = useImage(require('./assets/sprites/pipe-green-top.png'));
  const base = useImage(require('./assets/sprites/base.png'));

  const x = useSharedValue(width - 50);

  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(-150, { duration: 3000, easing: Easing.linear }),
        withTiming(width, { duration: 0 }),
      ),
      -1
    );
  }, []);


  const pipeOffset = 0;

  return (
    <Canvas style={{ width, height }}>
      {/* BG */}
      <Image width={width} height={height} fit={'cover'} image={bg} />

      {/* Pipes */}
      < Image
        image={pipeTop}
        y={pipeOffset - 320}
        x={x}
        width={103}
        height={640}
      />
      <Image
        image={pipeBottom}
        y={height - 320 + pipeOffset}
        x={x}
        width={103}
        height={640}
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
      <Image image={bird} y={height / 2} x={width / 4} width={64} height={48} />
    </Canvas>
  );
};

export default App;