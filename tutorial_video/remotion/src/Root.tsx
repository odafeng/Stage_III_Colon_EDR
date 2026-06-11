import { Composition } from "remotion";
import { Deck, blockDuration, DeckProps } from "./Deck";
import { Journey } from "./Journey";
import { HybridOpen } from "./HybridOpen";
import { World, WORLD_TOTAL } from "./World";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="world" component={World} fps={30} width={1920} height={1080} durationInFrames={WORLD_TOTAL} />
    <Composition
      id="deck"
      component={Deck}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ from: 0, to: 11 } as DeckProps}
      calculateMetadata={({ props }) => ({ durationInFrames: blockDuration(props.from, props.to) })}
    />
    <Composition id="journey" component={Journey} fps={30} width={1920} height={1080} durationInFrames={1000} />
    <Composition id="hybrid" component={HybridOpen} fps={30} width={1920} height={1080} durationInFrames={510} />
  </>
);
