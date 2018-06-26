import _ from "lodash";

function setPropToTimeline(timeline, obj, prop, fps, assignToObj) {
  if (prop.a === 0) {
    timeline.set(obj, assignToObj({}, prop.k), 0);
    return;
  }

  if(prop.k.length <= 0) {
    return;
  }

  timeline.set(
    obj,
    assignToObj({__dummy: 0}, prop.k[0].s),
    0,
  );

  for(let i = 0; i < prop.k.length - 1; i++) {
    const frameData = prop.k[i];
    const nextFrameData = prop.k[i + 1];
    let toVars = assignToObj({}, frameData.e);
    if (frameData.ti && frameData.to) {
      /*
         空間補完が必要なケース
       */
      const controlPoint1 = [];
      const controlPoint2 = [];
      for (let i = 0; i < frameData.s.length; i++) {
        controlPoint1[i] = frameData.s[i] + frameData.to[i];
        controlPoint2[i] = frameData.e[i] + frameData.ti[i];
      }
      toVars = {
        bezier: {
          type: "cubic",
          values: [
            assignToObj({}, frameData.s),
            assignToObj({}, controlPoint1),
            assignToObj({}, controlPoint2),
            assignToObj({}, frameData.e),
          ],
        },
      };
    }
    toVars.ease = CustomEase.create(
      "custom",
      `M0,0,C${frameData.o.x},${frameData.o.y},${frameData.i.x},${frameData.i.y},1,1`,
    );
    timeline.to(
      obj,
      (nextFrameData.t - frameData.t) / fps,
      toVars,
      frameData.t / fps,
    );
  }
  return timeline;
}

function extractProp(prop, index) {
  const flattenedProp = _.clone(prop);

  if (prop.a === 0) {
    flattenedProp.k = _.isArray(prop.k) ? prop.k[index] : prop.k;
    return flattenedProp;
  }

  flattenedProp.k = _.map(prop.k, frameData => {
    const flattenedFrameData = _.clone(frameData);
    if (frameData.o) {
      flattenedFrameData.o = {
        x: _.isArray(frameData.o.x) ? frameData.o.x[index] : frameData.o.x,
        y: _.isArray(frameData.o.y) ? frameData.o.y[index] : frameData.o.y,
      };
    }
    if (frameData.i) {
      flattenedFrameData.i = {
        x: _.isArray(frameData.i.x) ? frameData.i.x[index] : frameData.i.x,
        y: _.isArray(frameData.i.y) ? frameData.i.y[index] : frameData.i.y,
      };
    }
    if (frameData.s) {
      flattenedFrameData.s = _.isArray(frameData.s) ? frameData.s[index] : frameData.s;
    }
    if (frameData.e) {
      flattenedFrameData.e = _.isArray(frameData.e) ? frameData.e[index] : frameData.e;
    }
    return flattenedFrameData;
  });
  return flattenedProp;
}

function createBodymovinContainer(data) {
  const container = new PIXI.Container();
  const timeline = new TimelineMax();

  const fps = data.fr;
  const inPoint = data.ip;
  const outPoint = data.op;
  const width = data.w;
  const height = data.h;
  const name = data.nm;
  const is3d = data.ddd;

  for (let i = 0; i < data.layers.length; i++) {
    const layer = data.layers[i];
    const asset = data.assets.find(asset => asset.id === layer.refId);
    const sprite = PIXI.Sprite.fromImage(`${asset.p}`, true);

    _.forEach(layer.ks, (prop, key) => {
      switch (key) {
        case "o":
          // alpha
          setPropToTimeline(timeline, sprite, extractProp(prop, 0), fps, (obj, v) => {
            obj.alpha = v / 100;
            return obj;
          });
          break;
        case "r":
          // rotation
          setPropToTimeline(timeline, sprite, extractProp(prop, 0), fps, (obj, v) => {
            obj.rotation = v / 180 * Math.PI;
            return obj;
          });
          break;
        case "p":
          // position
          setPropToTimeline(timeline, sprite.position, prop, fps, (obj, v) => {
            obj.x = v[0];
            obj.y = v[1];
            return obj;
          });
          break;
        case "a":
          // anchor
          setPropToTimeline(timeline, sprite.pivot, prop, fps, (obj, v) => {
            obj.x = v[0];
            obj.y = v[1];
            return obj;
          });
          break;
        case "s":
          // scale
          setPropToTimeline(timeline, sprite.scale, extractProp(prop, 0), fps, (obj, v) => {
            obj.x = v / 100;
            return obj;
          });
          setPropToTimeline(timeline, sprite.scale, extractProp(prop, 1), fps, (obj, v) => {
            obj.y = v / 100;
            return obj;
          });
          break;
      }
    });
    container.addChildAt(sprite, 0);
  }

  return {
    container,
    timeline
  };
}

module.exports = createBodymovinContainer;
