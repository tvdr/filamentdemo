(() => {
  // node_modules/@awcodes/alpine-floating-ui/dist/module.esm.js
  function getSide(placement) {
    return placement.split("-")[0];
  }
  function getAlignment(placement) {
    return placement.split("-")[1];
  }
  function getMainAxisFromPlacement(placement) {
    return ["top", "bottom"].includes(getSide(placement)) ? "x" : "y";
  }
  function getLengthFromAxis(axis) {
    return axis === "y" ? "height" : "width";
  }
  function computeCoordsFromPlacement(_ref, placement, rtl) {
    let {
      reference,
      floating
    } = _ref;
    const commonX = reference.x + reference.width / 2 - floating.width / 2;
    const commonY = reference.y + reference.height / 2 - floating.height / 2;
    const mainAxis = getMainAxisFromPlacement(placement);
    const length = getLengthFromAxis(mainAxis);
    const commonAlign = reference[length] / 2 - floating[length] / 2;
    const side = getSide(placement);
    const isVertical = mainAxis === "x";
    let coords;
    switch (side) {
      case "top":
        coords = {
          x: commonX,
          y: reference.y - floating.height
        };
        break;
      case "bottom":
        coords = {
          x: commonX,
          y: reference.y + reference.height
        };
        break;
      case "right":
        coords = {
          x: reference.x + reference.width,
          y: commonY
        };
        break;
      case "left":
        coords = {
          x: reference.x - floating.width,
          y: commonY
        };
        break;
      default:
        coords = {
          x: reference.x,
          y: reference.y
        };
    }
    switch (getAlignment(placement)) {
      case "start":
        coords[mainAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
        break;
      case "end":
        coords[mainAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
        break;
    }
    return coords;
  }
  var computePosition = async (reference, floating, config) => {
    const {
      placement = "bottom",
      strategy = "absolute",
      middleware = [],
      platform: platform2
    } = config;
    const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(floating));
    if (true) {
      if (platform2 == null) {
        console.error(["Floating UI: `platform` property was not passed to config. If you", "want to use Floating UI on the web, install @floating-ui/dom", "instead of the /core package. Otherwise, you can create your own", "`platform`: https://floating-ui.com/docs/platform"].join(" "));
      }
      if (middleware.filter((_ref) => {
        let {
          name
        } = _ref;
        return name === "autoPlacement" || name === "flip";
      }).length > 1) {
        throw new Error(["Floating UI: duplicate `flip` and/or `autoPlacement`", "middleware detected. This will lead to an infinite loop. Ensure only", "one of either has been passed to the `middleware` array."].join(" "));
      }
    }
    let rects = await platform2.getElementRects({
      reference,
      floating,
      strategy
    });
    let {
      x,
      y
    } = computeCoordsFromPlacement(rects, placement, rtl);
    let statefulPlacement = placement;
    let middlewareData = {};
    let _debug_loop_count_ = 0;
    for (let i = 0; i < middleware.length; i++) {
      if (true) {
        _debug_loop_count_++;
        if (_debug_loop_count_ > 100) {
          throw new Error(["Floating UI: The middleware lifecycle appears to be", "running in an infinite loop. This is usually caused by a `reset`", "continually being returned without a break condition."].join(" "));
        }
      }
      const {
        name,
        fn
      } = middleware[i];
      const {
        x: nextX,
        y: nextY,
        data,
        reset
      } = await fn({
        x,
        y,
        initialPlacement: placement,
        placement: statefulPlacement,
        strategy,
        middlewareData,
        rects,
        platform: platform2,
        elements: {
          reference,
          floating
        }
      });
      x = nextX != null ? nextX : x;
      y = nextY != null ? nextY : y;
      middlewareData = {
        ...middlewareData,
        [name]: {
          ...middlewareData[name],
          ...data
        }
      };
      if (reset) {
        if (typeof reset === "object") {
          if (reset.placement) {
            statefulPlacement = reset.placement;
          }
          if (reset.rects) {
            rects = reset.rects === true ? await platform2.getElementRects({
              reference,
              floating,
              strategy
            }) : reset.rects;
          }
          ({
            x,
            y
          } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
        }
        i = -1;
        continue;
      }
    }
    return {
      x,
      y,
      placement: statefulPlacement,
      strategy,
      middlewareData
    };
  };
  function expandPaddingObject(padding) {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      ...padding
    };
  }
  function getSideObjectFromPadding(padding) {
    return typeof padding !== "number" ? expandPaddingObject(padding) : {
      top: padding,
      right: padding,
      bottom: padding,
      left: padding
    };
  }
  function rectToClientRect(rect) {
    return {
      ...rect,
      top: rect.y,
      left: rect.x,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height
    };
  }
  async function detectOverflow(middlewareArguments, options) {
    var _await$platform$isEle;
    if (options === void 0) {
      options = {};
    }
    const {
      x,
      y,
      platform: platform2,
      rects,
      elements,
      strategy
    } = middlewareArguments;
    const {
      boundary = "clippingAncestors",
      rootBoundary = "viewport",
      elementContext = "floating",
      altBoundary = false,
      padding = 0
    } = options;
    const paddingObject = getSideObjectFromPadding(padding);
    const altContext = elementContext === "floating" ? "reference" : "floating";
    const element = elements[altBoundary ? altContext : elementContext];
    const clippingClientRect = rectToClientRect(await platform2.getClippingRect({
      element: ((_await$platform$isEle = await (platform2.isElement == null ? void 0 : platform2.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || await (platform2.getDocumentElement == null ? void 0 : platform2.getDocumentElement(elements.floating)),
      boundary,
      rootBoundary,
      strategy
    }));
    const elementClientRect = rectToClientRect(platform2.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform2.convertOffsetParentRelativeRectToViewportRelativeRect({
      rect: elementContext === "floating" ? {
        ...rects.floating,
        x,
        y
      } : rects.reference,
      offsetParent: await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(elements.floating)),
      strategy
    }) : rects[elementContext]);
    return {
      top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
      bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
      left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
      right: elementClientRect.right - clippingClientRect.right + paddingObject.right
    };
  }
  var min = Math.min;
  var max = Math.max;
  function within(min$1, value, max$1) {
    return max(min$1, min(value, max$1));
  }
  var arrow = (options) => ({
    name: "arrow",
    options,
    async fn(middlewareArguments) {
      const {
        element,
        padding = 0
      } = options != null ? options : {};
      const {
        x,
        y,
        placement,
        rects,
        platform: platform2
      } = middlewareArguments;
      if (element == null) {
        if (true) {
          console.warn("Floating UI: No `element` was passed to the `arrow` middleware.");
        }
        return {};
      }
      const paddingObject = getSideObjectFromPadding(padding);
      const coords = {
        x,
        y
      };
      const axis = getMainAxisFromPlacement(placement);
      const length = getLengthFromAxis(axis);
      const arrowDimensions = await platform2.getDimensions(element);
      const minProp = axis === "y" ? "top" : "left";
      const maxProp = axis === "y" ? "bottom" : "right";
      const endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
      const startDiff = coords[axis] - rects.reference[axis];
      const arrowOffsetParent = await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(element));
      const clientSize = arrowOffsetParent ? axis === "y" ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
      const centerToReference = endDiff / 2 - startDiff / 2;
      const min3 = paddingObject[minProp];
      const max3 = clientSize - arrowDimensions[length] - paddingObject[maxProp];
      const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
      const offset2 = within(min3, center, max3);
      return {
        data: {
          [axis]: offset2,
          centerOffset: center - offset2
        }
      };
    }
  });
  var hash$1 = {
    left: "right",
    right: "left",
    bottom: "top",
    top: "bottom"
  };
  function getOppositePlacement(placement) {
    return placement.replace(/left|right|bottom|top/g, (matched) => hash$1[matched]);
  }
  function getAlignmentSides(placement, rects, rtl) {
    if (rtl === void 0) {
      rtl = false;
    }
    const alignment = getAlignment(placement);
    const mainAxis = getMainAxisFromPlacement(placement);
    const length = getLengthFromAxis(mainAxis);
    let mainAlignmentSide = mainAxis === "x" ? alignment === (rtl ? "end" : "start") ? "right" : "left" : alignment === "start" ? "bottom" : "top";
    if (rects.reference[length] > rects.floating[length]) {
      mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
    }
    return {
      main: mainAlignmentSide,
      cross: getOppositePlacement(mainAlignmentSide)
    };
  }
  var hash = {
    start: "end",
    end: "start"
  };
  function getOppositeAlignmentPlacement(placement) {
    return placement.replace(/start|end/g, (matched) => hash[matched]);
  }
  var sides = ["top", "right", "bottom", "left"];
  var allPlacements = /* @__PURE__ */ sides.reduce((acc, side) => acc.concat(side, side + "-start", side + "-end"), []);
  function getPlacementList(alignment, autoAlignment, allowedPlacements) {
    const allowedPlacementsSortedByAlignment = alignment ? [...allowedPlacements.filter((placement) => getAlignment(placement) === alignment), ...allowedPlacements.filter((placement) => getAlignment(placement) !== alignment)] : allowedPlacements.filter((placement) => getSide(placement) === placement);
    return allowedPlacementsSortedByAlignment.filter((placement) => {
      if (alignment) {
        return getAlignment(placement) === alignment || (autoAlignment ? getOppositeAlignmentPlacement(placement) !== placement : false);
      }
      return true;
    });
  }
  var autoPlacement = function(options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: "autoPlacement",
      options,
      async fn(middlewareArguments) {
        var _middlewareData$autoP, _middlewareData$autoP2, _middlewareData$autoP3, _middlewareData$autoP4, _placementsSortedByLe;
        const {
          x,
          y,
          rects,
          middlewareData,
          placement,
          platform: platform2,
          elements
        } = middlewareArguments;
        const {
          alignment = null,
          allowedPlacements = allPlacements,
          autoAlignment = true,
          ...detectOverflowOptions
        } = options;
        const placements = getPlacementList(alignment, autoAlignment, allowedPlacements);
        const overflow = await detectOverflow(middlewareArguments, detectOverflowOptions);
        const currentIndex = (_middlewareData$autoP = (_middlewareData$autoP2 = middlewareData.autoPlacement) == null ? void 0 : _middlewareData$autoP2.index) != null ? _middlewareData$autoP : 0;
        const currentPlacement = placements[currentIndex];
        if (currentPlacement == null) {
          return {};
        }
        const {
          main,
          cross
        } = getAlignmentSides(currentPlacement, rects, await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating)));
        if (placement !== currentPlacement) {
          return {
            x,
            y,
            reset: {
              placement: placements[0]
            }
          };
        }
        const currentOverflows = [overflow[getSide(currentPlacement)], overflow[main], overflow[cross]];
        const allOverflows = [...(_middlewareData$autoP3 = (_middlewareData$autoP4 = middlewareData.autoPlacement) == null ? void 0 : _middlewareData$autoP4.overflows) != null ? _middlewareData$autoP3 : [], {
          placement: currentPlacement,
          overflows: currentOverflows
        }];
        const nextPlacement = placements[currentIndex + 1];
        if (nextPlacement) {
          return {
            data: {
              index: currentIndex + 1,
              overflows: allOverflows
            },
            reset: {
              placement: nextPlacement
            }
          };
        }
        const placementsSortedByLeastOverflow = allOverflows.slice().sort((a, b) => a.overflows[0] - b.overflows[0]);
        const placementThatFitsOnAllSides = (_placementsSortedByLe = placementsSortedByLeastOverflow.find((_ref) => {
          let {
            overflows
          } = _ref;
          return overflows.every((overflow2) => overflow2 <= 0);
        })) == null ? void 0 : _placementsSortedByLe.placement;
        const resetPlacement = placementThatFitsOnAllSides != null ? placementThatFitsOnAllSides : placementsSortedByLeastOverflow[0].placement;
        if (resetPlacement !== placement) {
          return {
            data: {
              index: currentIndex + 1,
              overflows: allOverflows
            },
            reset: {
              placement: resetPlacement
            }
          };
        }
        return {};
      }
    };
  };
  function getExpandedPlacements(placement) {
    const oppositePlacement = getOppositePlacement(placement);
    return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
  }
  var flip = function(options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: "flip",
      options,
      async fn(middlewareArguments) {
        var _middlewareData$flip;
        const {
          placement,
          middlewareData,
          rects,
          initialPlacement,
          platform: platform2,
          elements
        } = middlewareArguments;
        const {
          mainAxis: checkMainAxis = true,
          crossAxis: checkCrossAxis = true,
          fallbackPlacements: specifiedFallbackPlacements,
          fallbackStrategy = "bestFit",
          flipAlignment = true,
          ...detectOverflowOptions
        } = options;
        const side = getSide(placement);
        const isBasePlacement = side === initialPlacement;
        const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
        const placements = [initialPlacement, ...fallbackPlacements];
        const overflow = await detectOverflow(middlewareArguments, detectOverflowOptions);
        const overflows = [];
        let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
        if (checkMainAxis) {
          overflows.push(overflow[side]);
        }
        if (checkCrossAxis) {
          const {
            main,
            cross
          } = getAlignmentSides(placement, rects, await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating)));
          overflows.push(overflow[main], overflow[cross]);
        }
        overflowsData = [...overflowsData, {
          placement,
          overflows
        }];
        if (!overflows.every((side2) => side2 <= 0)) {
          var _middlewareData$flip$, _middlewareData$flip2;
          const nextIndex = ((_middlewareData$flip$ = (_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) != null ? _middlewareData$flip$ : 0) + 1;
          const nextPlacement = placements[nextIndex];
          if (nextPlacement) {
            return {
              data: {
                index: nextIndex,
                overflows: overflowsData
              },
              reset: {
                placement: nextPlacement
              }
            };
          }
          let resetPlacement = "bottom";
          switch (fallbackStrategy) {
            case "bestFit": {
              var _overflowsData$map$so;
              const placement2 = (_overflowsData$map$so = overflowsData.map((d) => [d, d.overflows.filter((overflow2) => overflow2 > 0).reduce((acc, overflow2) => acc + overflow2, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$map$so[0].placement;
              if (placement2) {
                resetPlacement = placement2;
              }
              break;
            }
            case "initialPlacement":
              resetPlacement = initialPlacement;
              break;
          }
          if (placement !== resetPlacement) {
            return {
              reset: {
                placement: resetPlacement
              }
            };
          }
        }
        return {};
      }
    };
  };
  function getSideOffsets(overflow, rect) {
    return {
      top: overflow.top - rect.height,
      right: overflow.right - rect.width,
      bottom: overflow.bottom - rect.height,
      left: overflow.left - rect.width
    };
  }
  function isAnySideFullyClipped(overflow) {
    return sides.some((side) => overflow[side] >= 0);
  }
  var hide = function(_temp) {
    let {
      strategy = "referenceHidden",
      ...detectOverflowOptions
    } = _temp === void 0 ? {} : _temp;
    return {
      name: "hide",
      async fn(middlewareArguments) {
        const {
          rects
        } = middlewareArguments;
        switch (strategy) {
          case "referenceHidden": {
            const overflow = await detectOverflow(middlewareArguments, {
              ...detectOverflowOptions,
              elementContext: "reference"
            });
            const offsets = getSideOffsets(overflow, rects.reference);
            return {
              data: {
                referenceHiddenOffsets: offsets,
                referenceHidden: isAnySideFullyClipped(offsets)
              }
            };
          }
          case "escaped": {
            const overflow = await detectOverflow(middlewareArguments, {
              ...detectOverflowOptions,
              altBoundary: true
            });
            const offsets = getSideOffsets(overflow, rects.floating);
            return {
              data: {
                escapedOffsets: offsets,
                escaped: isAnySideFullyClipped(offsets)
              }
            };
          }
          default: {
            return {};
          }
        }
      }
    };
  };
  function convertValueToCoords(placement, rects, value, rtl) {
    if (rtl === void 0) {
      rtl = false;
    }
    const side = getSide(placement);
    const alignment = getAlignment(placement);
    const isVertical = getMainAxisFromPlacement(placement) === "x";
    const mainAxisMulti = ["left", "top"].includes(side) ? -1 : 1;
    const crossAxisMulti = rtl && isVertical ? -1 : 1;
    const rawValue = typeof value === "function" ? value({
      ...rects,
      placement
    }) : value;
    let {
      mainAxis,
      crossAxis,
      alignmentAxis
    } = typeof rawValue === "number" ? {
      mainAxis: rawValue,
      crossAxis: 0,
      alignmentAxis: null
    } : {
      mainAxis: 0,
      crossAxis: 0,
      alignmentAxis: null,
      ...rawValue
    };
    if (alignment && typeof alignmentAxis === "number") {
      crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis;
    }
    return isVertical ? {
      x: crossAxis * crossAxisMulti,
      y: mainAxis * mainAxisMulti
    } : {
      x: mainAxis * mainAxisMulti,
      y: crossAxis * crossAxisMulti
    };
  }
  var offset = function(value) {
    if (value === void 0) {
      value = 0;
    }
    return {
      name: "offset",
      options: value,
      async fn(middlewareArguments) {
        const {
          x,
          y,
          placement,
          rects,
          platform: platform2,
          elements
        } = middlewareArguments;
        const diffCoords = convertValueToCoords(placement, rects, value, await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating)));
        return {
          x: x + diffCoords.x,
          y: y + diffCoords.y,
          data: diffCoords
        };
      }
    };
  };
  function getCrossAxis(axis) {
    return axis === "x" ? "y" : "x";
  }
  var shift = function(options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: "shift",
      options,
      async fn(middlewareArguments) {
        const {
          x,
          y,
          placement
        } = middlewareArguments;
        const {
          mainAxis: checkMainAxis = true,
          crossAxis: checkCrossAxis = false,
          limiter = {
            fn: (_ref) => {
              let {
                x: x2,
                y: y2
              } = _ref;
              return {
                x: x2,
                y: y2
              };
            }
          },
          ...detectOverflowOptions
        } = options;
        const coords = {
          x,
          y
        };
        const overflow = await detectOverflow(middlewareArguments, detectOverflowOptions);
        const mainAxis = getMainAxisFromPlacement(getSide(placement));
        const crossAxis = getCrossAxis(mainAxis);
        let mainAxisCoord = coords[mainAxis];
        let crossAxisCoord = coords[crossAxis];
        if (checkMainAxis) {
          const minSide = mainAxis === "y" ? "top" : "left";
          const maxSide = mainAxis === "y" ? "bottom" : "right";
          const min3 = mainAxisCoord + overflow[minSide];
          const max3 = mainAxisCoord - overflow[maxSide];
          mainAxisCoord = within(min3, mainAxisCoord, max3);
        }
        if (checkCrossAxis) {
          const minSide = crossAxis === "y" ? "top" : "left";
          const maxSide = crossAxis === "y" ? "bottom" : "right";
          const min3 = crossAxisCoord + overflow[minSide];
          const max3 = crossAxisCoord - overflow[maxSide];
          crossAxisCoord = within(min3, crossAxisCoord, max3);
        }
        const limitedCoords = limiter.fn({
          ...middlewareArguments,
          [mainAxis]: mainAxisCoord,
          [crossAxis]: crossAxisCoord
        });
        return {
          ...limitedCoords,
          data: {
            x: limitedCoords.x - x,
            y: limitedCoords.y - y
          }
        };
      }
    };
  };
  var size = function(options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: "size",
      options,
      async fn(middlewareArguments) {
        const {
          placement,
          rects,
          platform: platform2,
          elements
        } = middlewareArguments;
        const {
          apply,
          ...detectOverflowOptions
        } = options;
        const overflow = await detectOverflow(middlewareArguments, detectOverflowOptions);
        const side = getSide(placement);
        const alignment = getAlignment(placement);
        let heightSide;
        let widthSide;
        if (side === "top" || side === "bottom") {
          heightSide = side;
          widthSide = alignment === (await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating)) ? "start" : "end") ? "left" : "right";
        } else {
          widthSide = side;
          heightSide = alignment === "end" ? "top" : "bottom";
        }
        const xMin = max(overflow.left, 0);
        const xMax = max(overflow.right, 0);
        const yMin = max(overflow.top, 0);
        const yMax = max(overflow.bottom, 0);
        const dimensions = {
          height: rects.floating.height - (["left", "right"].includes(placement) ? 2 * (yMin !== 0 || yMax !== 0 ? yMin + yMax : max(overflow.top, overflow.bottom)) : overflow[heightSide]),
          width: rects.floating.width - (["top", "bottom"].includes(placement) ? 2 * (xMin !== 0 || xMax !== 0 ? xMin + xMax : max(overflow.left, overflow.right)) : overflow[widthSide])
        };
        const prevDimensions = await platform2.getDimensions(elements.floating);
        apply == null ? void 0 : apply({
          ...dimensions,
          ...rects
        });
        const nextDimensions = await platform2.getDimensions(elements.floating);
        if (prevDimensions.width !== nextDimensions.width || prevDimensions.height !== nextDimensions.height) {
          return {
            reset: {
              rects: true
            }
          };
        }
        return {};
      }
    };
  };
  var inline = function(options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: "inline",
      options,
      async fn(middlewareArguments) {
        var _await$platform$getCl;
        const {
          placement,
          elements,
          rects,
          platform: platform2,
          strategy
        } = middlewareArguments;
        const {
          padding = 2,
          x,
          y
        } = options;
        const fallback = rectToClientRect(platform2.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform2.convertOffsetParentRelativeRectToViewportRelativeRect({
          rect: rects.reference,
          offsetParent: await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(elements.floating)),
          strategy
        }) : rects.reference);
        const clientRects = (_await$platform$getCl = await (platform2.getClientRects == null ? void 0 : platform2.getClientRects(elements.reference))) != null ? _await$platform$getCl : [];
        const paddingObject = getSideObjectFromPadding(padding);
        function getBoundingClientRect2() {
          if (clientRects.length === 2 && clientRects[0].left > clientRects[1].right && x != null && y != null) {
            var _clientRects$find;
            return (_clientRects$find = clientRects.find((rect) => x > rect.left - paddingObject.left && x < rect.right + paddingObject.right && y > rect.top - paddingObject.top && y < rect.bottom + paddingObject.bottom)) != null ? _clientRects$find : fallback;
          }
          if (clientRects.length >= 2) {
            if (getMainAxisFromPlacement(placement) === "x") {
              const firstRect = clientRects[0];
              const lastRect = clientRects[clientRects.length - 1];
              const isTop = getSide(placement) === "top";
              const top2 = firstRect.top;
              const bottom2 = lastRect.bottom;
              const left2 = isTop ? firstRect.left : lastRect.left;
              const right2 = isTop ? firstRect.right : lastRect.right;
              const width2 = right2 - left2;
              const height2 = bottom2 - top2;
              return {
                top: top2,
                bottom: bottom2,
                left: left2,
                right: right2,
                width: width2,
                height: height2,
                x: left2,
                y: top2
              };
            }
            const isLeftSide = getSide(placement) === "left";
            const maxRight = max(...clientRects.map((rect) => rect.right));
            const minLeft = min(...clientRects.map((rect) => rect.left));
            const measureRects = clientRects.filter((rect) => isLeftSide ? rect.left === minLeft : rect.right === maxRight);
            const top = measureRects[0].top;
            const bottom = measureRects[measureRects.length - 1].bottom;
            const left = minLeft;
            const right = maxRight;
            const width = right - left;
            const height = bottom - top;
            return {
              top,
              bottom,
              left,
              right,
              width,
              height,
              x: left,
              y: top
            };
          }
          return fallback;
        }
        const resetRects = await platform2.getElementRects({
          reference: {
            getBoundingClientRect: getBoundingClientRect2
          },
          floating: elements.floating,
          strategy
        });
        if (rects.reference.x !== resetRects.reference.x || rects.reference.y !== resetRects.reference.y || rects.reference.width !== resetRects.reference.width || rects.reference.height !== resetRects.reference.height) {
          return {
            reset: {
              rects: resetRects
            }
          };
        }
        return {};
      }
    };
  };
  function isWindow(value) {
    return value && value.document && value.location && value.alert && value.setInterval;
  }
  function getWindow(node) {
    if (node == null) {
      return window;
    }
    if (!isWindow(node)) {
      const ownerDocument = node.ownerDocument;
      return ownerDocument ? ownerDocument.defaultView || window : window;
    }
    return node;
  }
  function getComputedStyle$1(element) {
    return getWindow(element).getComputedStyle(element);
  }
  function getNodeName(node) {
    return isWindow(node) ? "" : node ? (node.nodeName || "").toLowerCase() : "";
  }
  function isHTMLElement(value) {
    return value instanceof getWindow(value).HTMLElement;
  }
  function isElement(value) {
    return value instanceof getWindow(value).Element;
  }
  function isNode(value) {
    return value instanceof getWindow(value).Node;
  }
  function isShadowRoot(node) {
    if (typeof ShadowRoot === "undefined") {
      return false;
    }
    const OwnElement = getWindow(node).ShadowRoot;
    return node instanceof OwnElement || node instanceof ShadowRoot;
  }
  function isOverflowElement(element) {
    const {
      overflow,
      overflowX,
      overflowY
    } = getComputedStyle$1(element);
    return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
  }
  function isTableElement(element) {
    return ["table", "td", "th"].includes(getNodeName(element));
  }
  function isContainingBlock(element) {
    const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
    const css2 = getComputedStyle$1(element);
    return css2.transform !== "none" || css2.perspective !== "none" || css2.contain === "paint" || ["transform", "perspective"].includes(css2.willChange) || isFirefox && css2.willChange === "filter" || isFirefox && (css2.filter ? css2.filter !== "none" : false);
  }
  function isLayoutViewport() {
    return !/^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }
  var min2 = Math.min;
  var max2 = Math.max;
  var round = Math.round;
  function getBoundingClientRect(element, includeScale, isFixedStrategy) {
    var _win$visualViewport$o, _win$visualViewport, _win$visualViewport$o2, _win$visualViewport2;
    if (includeScale === void 0) {
      includeScale = false;
    }
    if (isFixedStrategy === void 0) {
      isFixedStrategy = false;
    }
    const clientRect = element.getBoundingClientRect();
    let scaleX = 1;
    let scaleY = 1;
    if (includeScale && isHTMLElement(element)) {
      scaleX = element.offsetWidth > 0 ? round(clientRect.width) / element.offsetWidth || 1 : 1;
      scaleY = element.offsetHeight > 0 ? round(clientRect.height) / element.offsetHeight || 1 : 1;
    }
    const win = isElement(element) ? getWindow(element) : window;
    const addVisualOffsets = !isLayoutViewport() && isFixedStrategy;
    const x = (clientRect.left + (addVisualOffsets ? (_win$visualViewport$o = (_win$visualViewport = win.visualViewport) == null ? void 0 : _win$visualViewport.offsetLeft) != null ? _win$visualViewport$o : 0 : 0)) / scaleX;
    const y = (clientRect.top + (addVisualOffsets ? (_win$visualViewport$o2 = (_win$visualViewport2 = win.visualViewport) == null ? void 0 : _win$visualViewport2.offsetTop) != null ? _win$visualViewport$o2 : 0 : 0)) / scaleY;
    const width = clientRect.width / scaleX;
    const height = clientRect.height / scaleY;
    return {
      width,
      height,
      top: y,
      right: x + width,
      bottom: y + height,
      left: x,
      x,
      y
    };
  }
  function getDocumentElement(node) {
    return ((isNode(node) ? node.ownerDocument : node.document) || window.document).documentElement;
  }
  function getNodeScroll(element) {
    if (isElement(element)) {
      return {
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop
      };
    }
    return {
      scrollLeft: element.pageXOffset,
      scrollTop: element.pageYOffset
    };
  }
  function getWindowScrollBarX(element) {
    return getBoundingClientRect(getDocumentElement(element)).left + getNodeScroll(element).scrollLeft;
  }
  function isScaled(element) {
    const rect = getBoundingClientRect(element);
    return round(rect.width) !== element.offsetWidth || round(rect.height) !== element.offsetHeight;
  }
  function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
    const isOffsetParentAnElement = isHTMLElement(offsetParent);
    const documentElement = getDocumentElement(offsetParent);
    const rect = getBoundingClientRect(
      element,
      isOffsetParentAnElement && isScaled(offsetParent),
      strategy === "fixed"
    );
    let scroll = {
      scrollLeft: 0,
      scrollTop: 0
    };
    const offsets = {
      x: 0,
      y: 0
    };
    if (isOffsetParentAnElement || !isOffsetParentAnElement && strategy !== "fixed") {
      if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
        scroll = getNodeScroll(offsetParent);
      }
      if (isHTMLElement(offsetParent)) {
        const offsetRect = getBoundingClientRect(offsetParent, true);
        offsets.x = offsetRect.x + offsetParent.clientLeft;
        offsets.y = offsetRect.y + offsetParent.clientTop;
      } else if (documentElement) {
        offsets.x = getWindowScrollBarX(documentElement);
      }
    }
    return {
      x: rect.left + scroll.scrollLeft - offsets.x,
      y: rect.top + scroll.scrollTop - offsets.y,
      width: rect.width,
      height: rect.height
    };
  }
  function getParentNode(node) {
    if (getNodeName(node) === "html") {
      return node;
    }
    return node.assignedSlot || node.parentNode || (isShadowRoot(node) ? node.host : null) || getDocumentElement(node);
  }
  function getTrueOffsetParent(element) {
    if (!isHTMLElement(element) || getComputedStyle(element).position === "fixed") {
      return null;
    }
    return element.offsetParent;
  }
  function getContainingBlock(element) {
    let currentNode = getParentNode(element);
    if (isShadowRoot(currentNode)) {
      currentNode = currentNode.host;
    }
    while (isHTMLElement(currentNode) && !["html", "body"].includes(getNodeName(currentNode))) {
      if (isContainingBlock(currentNode)) {
        return currentNode;
      } else {
        currentNode = currentNode.parentNode;
      }
    }
    return null;
  }
  function getOffsetParent(element) {
    const window2 = getWindow(element);
    let offsetParent = getTrueOffsetParent(element);
    while (offsetParent && isTableElement(offsetParent) && getComputedStyle(offsetParent).position === "static") {
      offsetParent = getTrueOffsetParent(offsetParent);
    }
    if (offsetParent && (getNodeName(offsetParent) === "html" || getNodeName(offsetParent) === "body" && getComputedStyle(offsetParent).position === "static" && !isContainingBlock(offsetParent))) {
      return window2;
    }
    return offsetParent || getContainingBlock(element) || window2;
  }
  function getDimensions(element) {
    if (isHTMLElement(element)) {
      return {
        width: element.offsetWidth,
        height: element.offsetHeight
      };
    }
    const rect = getBoundingClientRect(element);
    return {
      width: rect.width,
      height: rect.height
    };
  }
  function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
    let {
      rect,
      offsetParent,
      strategy
    } = _ref;
    const isOffsetParentAnElement = isHTMLElement(offsetParent);
    const documentElement = getDocumentElement(offsetParent);
    if (offsetParent === documentElement) {
      return rect;
    }
    let scroll = {
      scrollLeft: 0,
      scrollTop: 0
    };
    const offsets = {
      x: 0,
      y: 0
    };
    if (isOffsetParentAnElement || !isOffsetParentAnElement && strategy !== "fixed") {
      if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
        scroll = getNodeScroll(offsetParent);
      }
      if (isHTMLElement(offsetParent)) {
        const offsetRect = getBoundingClientRect(offsetParent, true);
        offsets.x = offsetRect.x + offsetParent.clientLeft;
        offsets.y = offsetRect.y + offsetParent.clientTop;
      }
    }
    return {
      ...rect,
      x: rect.x - scroll.scrollLeft + offsets.x,
      y: rect.y - scroll.scrollTop + offsets.y
    };
  }
  function getViewportRect(element, strategy) {
    const win = getWindow(element);
    const html = getDocumentElement(element);
    const visualViewport = win.visualViewport;
    let width = html.clientWidth;
    let height = html.clientHeight;
    let x = 0;
    let y = 0;
    if (visualViewport) {
      width = visualViewport.width;
      height = visualViewport.height;
      const layoutViewport = isLayoutViewport();
      if (layoutViewport || !layoutViewport && strategy === "fixed") {
        x = visualViewport.offsetLeft;
        y = visualViewport.offsetTop;
      }
    }
    return {
      width,
      height,
      x,
      y
    };
  }
  function getDocumentRect(element) {
    var _element$ownerDocumen;
    const html = getDocumentElement(element);
    const scroll = getNodeScroll(element);
    const body = (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body;
    const width = max2(html.scrollWidth, html.clientWidth, body ? body.scrollWidth : 0, body ? body.clientWidth : 0);
    const height = max2(html.scrollHeight, html.clientHeight, body ? body.scrollHeight : 0, body ? body.clientHeight : 0);
    let x = -scroll.scrollLeft + getWindowScrollBarX(element);
    const y = -scroll.scrollTop;
    if (getComputedStyle$1(body || html).direction === "rtl") {
      x += max2(html.clientWidth, body ? body.clientWidth : 0) - width;
    }
    return {
      width,
      height,
      x,
      y
    };
  }
  function getNearestOverflowAncestor(node) {
    const parentNode = getParentNode(node);
    if (["html", "body", "#document"].includes(getNodeName(parentNode))) {
      return node.ownerDocument.body;
    }
    if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
      return parentNode;
    }
    return getNearestOverflowAncestor(parentNode);
  }
  function getOverflowAncestors(node, list) {
    var _node$ownerDocument;
    if (list === void 0) {
      list = [];
    }
    const scrollableAncestor = getNearestOverflowAncestor(node);
    const isBody = scrollableAncestor === ((_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.body);
    const win = getWindow(scrollableAncestor);
    const target = isBody ? [win].concat(win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : []) : scrollableAncestor;
    const updatedList = list.concat(target);
    return isBody ? updatedList : updatedList.concat(getOverflowAncestors(target));
  }
  function contains(parent, child) {
    const rootNode = child == null ? void 0 : child.getRootNode == null ? void 0 : child.getRootNode();
    if (parent != null && parent.contains(child)) {
      return true;
    } else if (rootNode && isShadowRoot(rootNode)) {
      let next = child;
      do {
        if (next && parent === next) {
          return true;
        }
        next = next.parentNode || next.host;
      } while (next);
    }
    return false;
  }
  function getInnerBoundingClientRect(element, strategy) {
    const clientRect = getBoundingClientRect(element, false, strategy === "fixed");
    const top = clientRect.top + element.clientTop;
    const left = clientRect.left + element.clientLeft;
    return {
      top,
      left,
      x: left,
      y: top,
      right: left + element.clientWidth,
      bottom: top + element.clientHeight,
      width: element.clientWidth,
      height: element.clientHeight
    };
  }
  function getClientRectFromClippingAncestor(element, clippingParent, strategy) {
    if (clippingParent === "viewport") {
      return rectToClientRect(getViewportRect(element, strategy));
    }
    if (isElement(clippingParent)) {
      return getInnerBoundingClientRect(clippingParent, strategy);
    }
    return rectToClientRect(getDocumentRect(getDocumentElement(element)));
  }
  function getClippingAncestors(element) {
    const clippingAncestors = getOverflowAncestors(element);
    const canEscapeClipping = ["absolute", "fixed"].includes(getComputedStyle$1(element).position);
    const clipperElement = canEscapeClipping && isHTMLElement(element) ? getOffsetParent(element) : element;
    if (!isElement(clipperElement)) {
      return [];
    }
    return clippingAncestors.filter((clippingAncestors2) => isElement(clippingAncestors2) && contains(clippingAncestors2, clipperElement) && getNodeName(clippingAncestors2) !== "body");
  }
  function getClippingRect(_ref) {
    let {
      element,
      boundary,
      rootBoundary,
      strategy
    } = _ref;
    const mainClippingAncestors = boundary === "clippingAncestors" ? getClippingAncestors(element) : [].concat(boundary);
    const clippingAncestors = [...mainClippingAncestors, rootBoundary];
    const firstClippingAncestor = clippingAncestors[0];
    const clippingRect = clippingAncestors.reduce((accRect, clippingAncestor) => {
      const rect = getClientRectFromClippingAncestor(element, clippingAncestor, strategy);
      accRect.top = max2(rect.top, accRect.top);
      accRect.right = min2(rect.right, accRect.right);
      accRect.bottom = min2(rect.bottom, accRect.bottom);
      accRect.left = max2(rect.left, accRect.left);
      return accRect;
    }, getClientRectFromClippingAncestor(element, firstClippingAncestor, strategy));
    return {
      width: clippingRect.right - clippingRect.left,
      height: clippingRect.bottom - clippingRect.top,
      x: clippingRect.left,
      y: clippingRect.top
    };
  }
  var platform = {
    getClippingRect,
    convertOffsetParentRelativeRectToViewportRelativeRect,
    isElement,
    getDimensions,
    getOffsetParent,
    getDocumentElement,
    getElementRects: (_ref) => {
      let {
        reference,
        floating,
        strategy
      } = _ref;
      return {
        reference: getRectRelativeToOffsetParent(reference, getOffsetParent(floating), strategy),
        floating: {
          ...getDimensions(floating),
          x: 0,
          y: 0
        }
      };
    },
    getClientRects: (element) => Array.from(element.getClientRects()),
    isRTL: (element) => getComputedStyle$1(element).direction === "rtl"
  };
  function autoUpdate(reference, floating, update, options) {
    if (options === void 0) {
      options = {};
    }
    const {
      ancestorScroll: _ancestorScroll = true,
      ancestorResize: _ancestorResize = true,
      elementResize: _elementResize = true,
      animationFrame = false
    } = options;
    let cleanedUp = false;
    const ancestorScroll = _ancestorScroll && !animationFrame;
    const ancestorResize = _ancestorResize && !animationFrame;
    const elementResize = _elementResize && !animationFrame;
    const ancestors = ancestorScroll || ancestorResize ? [...isElement(reference) ? getOverflowAncestors(reference) : [], ...getOverflowAncestors(floating)] : [];
    ancestors.forEach((ancestor) => {
      ancestorScroll && ancestor.addEventListener("scroll", update, {
        passive: true
      });
      ancestorResize && ancestor.addEventListener("resize", update);
    });
    let observer2 = null;
    if (elementResize) {
      observer2 = new ResizeObserver(update);
      isElement(reference) && observer2.observe(reference);
      observer2.observe(floating);
    }
    let frameId;
    let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
    if (animationFrame) {
      frameLoop();
    }
    function frameLoop() {
      if (cleanedUp) {
        return;
      }
      const nextRefRect = getBoundingClientRect(reference);
      if (prevRefRect && (nextRefRect.x !== prevRefRect.x || nextRefRect.y !== prevRefRect.y || nextRefRect.width !== prevRefRect.width || nextRefRect.height !== prevRefRect.height)) {
        update();
      }
      prevRefRect = nextRefRect;
      frameId = requestAnimationFrame(frameLoop);
    }
    return () => {
      var _observer;
      cleanedUp = true;
      ancestors.forEach((ancestor) => {
        ancestorScroll && ancestor.removeEventListener("scroll", update);
        ancestorResize && ancestor.removeEventListener("resize", update);
      });
      (_observer = observer2) == null ? void 0 : _observer.disconnect();
      observer2 = null;
      if (animationFrame) {
        cancelAnimationFrame(frameId);
      }
    };
  }
  var computePosition2 = (reference, floating, options) => computePosition(reference, floating, {
    platform,
    ...options
  });
  var buildConfigFromModifiers = (modifiers) => {
    const config = {
      placement: "bottom",
      middleware: []
    };
    const keys = Object.keys(modifiers);
    const getModifierArgument = (modifier) => {
      return modifiers[modifier];
    };
    if (keys.includes("offset")) {
      config.middleware.push(offset(getModifierArgument("offset")));
    }
    if (keys.includes("placement")) {
      config.placement = getModifierArgument("placement");
    }
    if (keys.includes("autoPlacement") && !keys.includes("flip")) {
      config.middleware.push(autoPlacement(getModifierArgument("autoPlacement")));
    }
    if (keys.includes("flip")) {
      config.middleware.push(flip(getModifierArgument("flip")));
    }
    if (keys.includes("shift")) {
      config.middleware.push(shift(getModifierArgument("shift")));
    }
    if (keys.includes("inline")) {
      config.middleware.push(inline(getModifierArgument("inline")));
    }
    if (keys.includes("arrow")) {
      config.middleware.push(arrow(getModifierArgument("arrow")));
    }
    if (keys.includes("hide")) {
      config.middleware.push(hide(getModifierArgument("hide")));
    }
    if (keys.includes("size")) {
      config.middleware.push(size(getModifierArgument("size")));
    }
    return config;
  };
  var buildDirectiveConfigFromModifiers = (modifiers, settings) => {
    const config = {
      component: {
        trap: false
      },
      float: {
        placement: "bottom",
        strategy: "absolute",
        middleware: []
      }
    };
    const getModifierArgument = (modifier) => {
      return modifiers[modifiers.indexOf(modifier) + 1];
    };
    if (modifiers.includes("trap")) {
      config.component.trap = true;
    }
    if (modifiers.includes("teleport")) {
      config.float.strategy = "fixed";
    }
    if (modifiers.includes("offset")) {
      config.float.middleware.push(offset(settings["offset"] || 10));
    }
    if (modifiers.includes("placement")) {
      config.float.placement = getModifierArgument("placement");
    }
    if (modifiers.includes("autoPlacement") && !modifiers.includes("flip")) {
      config.float.middleware.push(autoPlacement(settings["autoPlacement"]));
    }
    if (modifiers.includes("flip")) {
      config.float.middleware.push(flip(settings["flip"]));
    }
    if (modifiers.includes("shift")) {
      config.float.middleware.push(shift(settings["shift"]));
    }
    if (modifiers.includes("inline")) {
      config.float.middleware.push(inline(settings["inline"]));
    }
    if (modifiers.includes("arrow")) {
      config.float.middleware.push(arrow(settings["arrow"]));
    }
    if (modifiers.includes("hide")) {
      config.float.middleware.push(hide(settings["hide"]));
    }
    if (modifiers.includes("size")) {
      config.float.middleware.push(size(settings["size"]));
    }
    return config;
  };
  var randomString = (length) => {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz".split("");
    var str = "";
    if (!length) {
      length = Math.floor(Math.random() * chars.length);
    }
    for (var i = 0; i < length; i++) {
      str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
  };
  var onAttributeAddeds = [];
  var onElRemoveds = [];
  var onElAddeds = [];
  function cleanupAttributes(el, names) {
    if (!el._x_attributeCleanups)
      return;
    Object.entries(el._x_attributeCleanups).forEach(([name, value]) => {
      if (names === void 0 || names.includes(name)) {
        value.forEach((i) => i());
        delete el._x_attributeCleanups[name];
      }
    });
  }
  var observer = new MutationObserver(onMutate);
  var currentlyObserving = false;
  function startObservingMutations() {
    observer.observe(document, { subtree: true, childList: true, attributes: true, attributeOldValue: true });
    currentlyObserving = true;
  }
  function stopObservingMutations() {
    flushObserver();
    observer.disconnect();
    currentlyObserving = false;
  }
  var recordQueue = [];
  var willProcessRecordQueue = false;
  function flushObserver() {
    recordQueue = recordQueue.concat(observer.takeRecords());
    if (recordQueue.length && !willProcessRecordQueue) {
      willProcessRecordQueue = true;
      queueMicrotask(() => {
        processRecordQueue();
        willProcessRecordQueue = false;
      });
    }
  }
  function processRecordQueue() {
    onMutate(recordQueue);
    recordQueue.length = 0;
  }
  function mutateDom(callback) {
    if (!currentlyObserving)
      return callback();
    stopObservingMutations();
    let result = callback();
    startObservingMutations();
    return result;
  }
  var isCollecting = false;
  var deferredMutations = [];
  function onMutate(mutations) {
    if (isCollecting) {
      deferredMutations = deferredMutations.concat(mutations);
      return;
    }
    let addedNodes = [];
    let removedNodes = [];
    let addedAttributes = /* @__PURE__ */ new Map();
    let removedAttributes = /* @__PURE__ */ new Map();
    for (let i = 0; i < mutations.length; i++) {
      if (mutations[i].target._x_ignoreMutationObserver)
        continue;
      if (mutations[i].type === "childList") {
        mutations[i].addedNodes.forEach((node) => node.nodeType === 1 && addedNodes.push(node));
        mutations[i].removedNodes.forEach((node) => node.nodeType === 1 && removedNodes.push(node));
      }
      if (mutations[i].type === "attributes") {
        let el = mutations[i].target;
        let name = mutations[i].attributeName;
        let oldValue = mutations[i].oldValue;
        let add = () => {
          if (!addedAttributes.has(el))
            addedAttributes.set(el, []);
          addedAttributes.get(el).push({ name, value: el.getAttribute(name) });
        };
        let remove = () => {
          if (!removedAttributes.has(el))
            removedAttributes.set(el, []);
          removedAttributes.get(el).push(name);
        };
        if (el.hasAttribute(name) && oldValue === null) {
          add();
        } else if (el.hasAttribute(name)) {
          remove();
          add();
        } else {
          remove();
        }
      }
    }
    removedAttributes.forEach((attrs, el) => {
      cleanupAttributes(el, attrs);
    });
    addedAttributes.forEach((attrs, el) => {
      onAttributeAddeds.forEach((i) => i(el, attrs));
    });
    for (let node of removedNodes) {
      if (addedNodes.includes(node))
        continue;
      onElRemoveds.forEach((i) => i(node));
      if (node._x_cleanups) {
        while (node._x_cleanups.length)
          node._x_cleanups.pop()();
      }
    }
    addedNodes.forEach((node) => {
      node._x_ignoreSelf = true;
      node._x_ignore = true;
    });
    for (let node of addedNodes) {
      if (removedNodes.includes(node))
        continue;
      if (!node.isConnected)
        continue;
      delete node._x_ignoreSelf;
      delete node._x_ignore;
      onElAddeds.forEach((i) => i(node));
      node._x_ignore = true;
      node._x_ignoreSelf = true;
    }
    addedNodes.forEach((node) => {
      delete node._x_ignoreSelf;
      delete node._x_ignore;
    });
    addedNodes = null;
    removedNodes = null;
    addedAttributes = null;
    removedAttributes = null;
  }
  function once(callback, fallback = () => {
  }) {
    let called = false;
    return function() {
      if (!called) {
        called = true;
        callback.apply(this, arguments);
      } else {
        fallback.apply(this, arguments);
      }
    };
  }
  function src_default(Alpine) {
    const defaultOptions = {
      dismissable: true,
      trap: false
    };
    function setupA11y(component, trigger, panel = null) {
      if (!trigger)
        return;
      if (!trigger.hasAttribute("aria-expanded")) {
        trigger.setAttribute("aria-expanded", false);
      }
      if (!panel.hasAttribute("id")) {
        const panelId = `panel-${randomString(8)}`;
        trigger.setAttribute("aria-controls", panelId);
        panel.setAttribute("id", panelId);
      } else {
        trigger.setAttribute("aria-controls", panel.getAttribute("id"));
      }
      panel.setAttribute("aria-modal", true);
      panel.setAttribute("role", "dialog");
    }
    const atMagicTrigger = document.querySelectorAll('[\\@click^="$float"]');
    const xMagicTrigger = document.querySelectorAll('[x-on\\:click^="$float"]');
    [...atMagicTrigger, ...xMagicTrigger].forEach((trigger) => {
      const component = trigger.parentElement.closest("[x-data]");
      const panel = component.querySelector('[x-ref="panel"]');
      setupA11y(component, trigger, panel);
    });
    Alpine.magic("float", (el) => {
      return (modifiers = {}, settings = {}) => {
        const options = { ...defaultOptions, ...settings };
        const config = Object.keys(modifiers).length > 0 ? buildConfigFromModifiers(modifiers) : { middleware: [autoPlacement()] };
        const trigger = el;
        const component = el.parentElement.closest("[x-data]");
        const panel = component.querySelector('[x-ref="panel"]');
        function isFloating() {
          return panel.style.display == "block";
        }
        function closePanel() {
          panel.style.display = "";
          trigger.setAttribute("aria-expanded", false);
          if (options.trap)
            panel.setAttribute("x-trap", false);
          autoUpdate(el, panel, update);
        }
        function openPanel() {
          panel.style.display = "block";
          trigger.setAttribute("aria-expanded", true);
          if (options.trap)
            panel.setAttribute("x-trap", true);
          update();
        }
        function togglePanel() {
          isFloating() ? closePanel() : openPanel();
        }
        async function update() {
          return await computePosition2(el, panel, config).then(({ middlewareData, placement, x, y }) => {
            if (middlewareData.arrow) {
              const ax = middlewareData.arrow?.x;
              const ay = middlewareData.arrow?.y;
              const aEl = config.middleware.filter((middleware) => middleware.name == "arrow")[0].options.element;
              const staticSide = {
                top: "bottom",
                right: "left",
                bottom: "top",
                left: "right"
              }[placement.split("-")[0]];
              Object.assign(aEl.style, {
                left: ax != null ? `${ax}px` : "",
                top: ay != null ? `${ay}px` : "",
                right: "",
                bottom: "",
                [staticSide]: "-4px"
              });
            }
            if (middlewareData.hide) {
              const { referenceHidden } = middlewareData.hide;
              Object.assign(panel.style, {
                visibility: referenceHidden ? "hidden" : "visible"
              });
            }
            Object.assign(panel.style, {
              left: `${x}px`,
              top: `${y}px`
            });
          });
        }
        if (options.dismissable) {
          window.addEventListener("click", (event) => {
            if (!component.contains(event.target) && isFloating()) {
              togglePanel();
            }
          });
          window.addEventListener(
            "keydown",
            (event) => {
              if (event.key === "Escape" && isFloating()) {
                togglePanel();
              }
            },
            true
          );
        }
        togglePanel();
      };
    });
    Alpine.directive("float", (panel, { modifiers, expression }, { evaluate, effect }) => {
      const settings = expression ? evaluate(expression) : {};
      const config = modifiers.length > 0 ? buildDirectiveConfigFromModifiers(modifiers, settings) : {};
      let cleanup = null;
      if (config.float.strategy == "fixed") {
        panel.style.position = "fixed";
      }
      const clickAway = (event) => panel.parentElement && !panel.parentElement.closest("[x-data]").contains(event.target) ? panel.close() : null;
      const keyEscape = (event) => event.key === "Escape" ? panel.close() : null;
      const refName = panel.getAttribute("x-ref");
      const component = panel.parentElement.closest("[x-data]");
      const atTrigger = component.querySelectorAll(`[\\@click^="$refs.${refName}"]`);
      const xTrigger = component.querySelectorAll(`[x-on\\:click^="$refs.${refName}"]`);
      panel.style.setProperty("display", "none");
      setupA11y(component, [...atTrigger, ...xTrigger][0], panel);
      panel._x_isShown = false;
      panel.trigger = null;
      if (!panel._x_doHide)
        panel._x_doHide = () => {
          mutateDom(() => {
            panel.style.setProperty("display", "none", modifiers.includes("important") ? "important" : void 0);
          });
        };
      if (!panel._x_doShow)
        panel._x_doShow = () => {
          mutateDom(() => {
            panel.style.setProperty("display", "block", modifiers.includes("important") ? "important" : void 0);
          });
        };
      let hide2 = () => {
        panel._x_doHide();
        panel._x_isShown = false;
      };
      let show = () => {
        panel._x_doShow();
        panel._x_isShown = true;
      };
      let clickAwayCompatibleShow = () => setTimeout(show);
      let toggle = once(
        (value) => value ? show() : hide2(),
        (value) => {
          if (typeof panel._x_toggleAndCascadeWithTransitions === "function") {
            panel._x_toggleAndCascadeWithTransitions(panel, value, show, hide2);
          } else {
            value ? clickAwayCompatibleShow() : hide2();
          }
        }
      );
      let oldValue;
      let firstTime = true;
      effect(
        () => evaluate((value) => {
          if (!firstTime && value === oldValue)
            return;
          if (modifiers.includes("immediate"))
            value ? clickAwayCompatibleShow() : hide2();
          toggle(value);
          oldValue = value;
          firstTime = false;
        })
      );
      panel.open = async function(event) {
        panel.trigger = event.currentTarget ? event.currentTarget : event;
        toggle(true);
        panel.trigger.setAttribute("aria-expanded", true);
        if (config.component.trap)
          panel.setAttribute("x-trap", true);
        cleanup = autoUpdate(panel.trigger, panel, () => {
          computePosition2(panel.trigger, panel, config.float).then(({ middlewareData, placement, x, y }) => {
            if (middlewareData.arrow) {
              const ax = middlewareData.arrow?.x;
              const ay = middlewareData.arrow?.y;
              const aEl = config.float.middleware.filter((middleware) => middleware.name == "arrow")[0].options.element;
              const staticSide = {
                top: "bottom",
                right: "left",
                bottom: "top",
                left: "right"
              }[placement.split("-")[0]];
              Object.assign(aEl.style, {
                left: ax != null ? `${ax}px` : "",
                top: ay != null ? `${ay}px` : "",
                right: "",
                bottom: "",
                [staticSide]: "-4px"
              });
            }
            if (middlewareData.hide) {
              const { referenceHidden } = middlewareData.hide;
              Object.assign(panel.style, {
                visibility: referenceHidden ? "hidden" : "visible"
              });
            }
            Object.assign(panel.style, {
              left: `${x}px`,
              top: `${y}px`
            });
          });
        });
        window.addEventListener("click", clickAway);
        window.addEventListener("keydown", keyEscape, true);
      };
      panel.close = function() {
        toggle(false);
        panel.trigger.setAttribute("aria-expanded", false);
        if (config.component.trap)
          panel.setAttribute("x-trap", false);
        cleanup();
        window.removeEventListener("click", clickAway);
        window.removeEventListener("keydown", keyEscape, false);
      };
      panel.toggle = function(event) {
        panel._x_isShown ? panel.close() : panel.open(event);
      };
    });
  }
  var module_default = src_default;

  // node_modules/alpine-lazy-load-assets/dist/alpine-lazy-load-assets.esm.js
  function alpine_lazy_load_assets_default(Alpine) {
    Alpine.store("lazyLoadedAssets", {
      loaded: /* @__PURE__ */ new Set(),
      check(paths) {
        return Array.isArray(paths) ? paths.every((path) => this.loaded.has(path)) : this.loaded.has(paths);
      },
      markLoaded(paths) {
        Array.isArray(paths) ? paths.forEach((path) => this.loaded.add(path)) : this.loaded.add(paths);
      }
    });
    function assetLoadedEvent(eventName) {
      return new CustomEvent(eventName, {
        bubbles: true,
        composed: true,
        cancelable: true
      });
    }
    async function loadCSS(path, mediaAttr) {
      if (document.querySelector(`link[href="${path}"]`) || Alpine.store("lazyLoadedAssets").check(path)) {
        return;
      }
      const link = document.createElement("link");
      link.type = "text/css";
      link.rel = "stylesheet";
      link.href = path;
      if (mediaAttr) {
        link.media = mediaAttr;
      }
      document.head.append(link);
      await new Promise((resolve, reject) => {
        link.onload = () => {
          Alpine.store("lazyLoadedAssets").markLoaded(path);
          resolve();
        };
        link.onerror = () => {
          reject(new Error(`Failed to load CSS: ${path}`));
        };
      });
    }
    async function loadJS(path, position) {
      if (document.querySelector(`script[src="${path}"]`) || Alpine.store("lazyLoadedAssets").check(path)) {
        return;
      }
      const script = document.createElement("script");
      script.src = path;
      position.has("body-start") ? document.body.prepend(script) : document[position.has("body-end") ? "body" : "head"].append(script);
      await new Promise((resolve, reject) => {
        script.onload = () => {
          Alpine.store("lazyLoadedAssets").markLoaded(path);
          resolve();
        };
        script.onerror = () => {
          reject(new Error(`Failed to load JS: ${path}`));
        };
      });
    }
    Alpine.directive("load-css", (el, { expression }, { evaluate }) => {
      const paths = evaluate(expression);
      const mediaAttr = el.media;
      const eventName = el.getAttribute("data-dispatch");
      Promise.all(paths.map((path) => loadCSS(path, mediaAttr))).then(() => {
        if (eventName) {
          window.dispatchEvent(assetLoadedEvent(eventName + "-css"));
        }
      }).catch((error) => {
        console.error(error);
      });
    });
    Alpine.directive("load-js", (el, { expression, modifiers }, { evaluate }) => {
      const paths = evaluate(expression);
      const position = new Set(modifiers);
      const eventName = el.getAttribute("data-dispatch");
      Promise.all(paths.map((path) => loadJS(path, position))).then(() => {
        if (eventName) {
          window.dispatchEvent(assetLoadedEvent(eventName + "-js"));
        }
      }).catch((error) => {
        console.error(error);
      });
    });
  }
  var module_default2 = alpine_lazy_load_assets_default;

  // node_modules/sortablejs/modular/sortable.esm.js
  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) {
        symbols = symbols.filter(function(sym) {
          return Object.getOwnPropertyDescriptor(object, sym).enumerable;
        });
      }
      keys.push.apply(keys, symbols);
    }
    return keys;
  }
  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};
      if (i % 2) {
        ownKeys(Object(source), true).forEach(function(key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(Object(source)).forEach(function(key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }
    return target;
  }
  function _typeof(obj) {
    "@babel/helpers - typeof";
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function(obj2) {
        return typeof obj2;
      };
    } else {
      _typeof = function(obj2) {
        return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
      };
    }
    return _typeof(obj);
  }
  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function _extends() {
    _extends = Object.assign || function(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    };
    return _extends.apply(this, arguments);
  }
  function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null)
      return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;
    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0)
        continue;
      target[key] = source[key];
    }
    return target;
  }
  function _objectWithoutProperties(source, excluded) {
    if (source == null)
      return {};
    var target = _objectWithoutPropertiesLoose(source, excluded);
    var key, i;
    if (Object.getOwnPropertySymbols) {
      var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
      for (i = 0; i < sourceSymbolKeys.length; i++) {
        key = sourceSymbolKeys[i];
        if (excluded.indexOf(key) >= 0)
          continue;
        if (!Object.prototype.propertyIsEnumerable.call(source, key))
          continue;
        target[key] = source[key];
      }
    }
    return target;
  }
  var version = "1.15.1";
  function userAgent(pattern) {
    if (typeof window !== "undefined" && window.navigator) {
      return !!/* @__PURE__ */ navigator.userAgent.match(pattern);
    }
  }
  var IE11OrLess = userAgent(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i);
  var Edge = userAgent(/Edge/i);
  var FireFox = userAgent(/firefox/i);
  var Safari = userAgent(/safari/i) && !userAgent(/chrome/i) && !userAgent(/android/i);
  var IOS = userAgent(/iP(ad|od|hone)/i);
  var ChromeForAndroid = userAgent(/chrome/i) && userAgent(/android/i);
  var captureMode = {
    capture: false,
    passive: false
  };
  function on(el, event, fn) {
    el.addEventListener(event, fn, !IE11OrLess && captureMode);
  }
  function off(el, event, fn) {
    el.removeEventListener(event, fn, !IE11OrLess && captureMode);
  }
  function matches(el, selector) {
    if (!selector)
      return;
    selector[0] === ">" && (selector = selector.substring(1));
    if (el) {
      try {
        if (el.matches) {
          return el.matches(selector);
        } else if (el.msMatchesSelector) {
          return el.msMatchesSelector(selector);
        } else if (el.webkitMatchesSelector) {
          return el.webkitMatchesSelector(selector);
        }
      } catch (_) {
        return false;
      }
    }
    return false;
  }
  function getParentOrHost(el) {
    return el.host && el !== document && el.host.nodeType ? el.host : el.parentNode;
  }
  function closest(el, selector, ctx, includeCTX) {
    if (el) {
      ctx = ctx || document;
      do {
        if (selector != null && (selector[0] === ">" ? el.parentNode === ctx && matches(el, selector) : matches(el, selector)) || includeCTX && el === ctx) {
          return el;
        }
        if (el === ctx)
          break;
      } while (el = getParentOrHost(el));
    }
    return null;
  }
  var R_SPACE = /\s+/g;
  function toggleClass(el, name, state) {
    if (el && name) {
      if (el.classList) {
        el.classList[state ? "add" : "remove"](name);
      } else {
        var className = (" " + el.className + " ").replace(R_SPACE, " ").replace(" " + name + " ", " ");
        el.className = (className + (state ? " " + name : "")).replace(R_SPACE, " ");
      }
    }
  }
  function css(el, prop, val) {
    var style = el && el.style;
    if (style) {
      if (val === void 0) {
        if (document.defaultView && document.defaultView.getComputedStyle) {
          val = document.defaultView.getComputedStyle(el, "");
        } else if (el.currentStyle) {
          val = el.currentStyle;
        }
        return prop === void 0 ? val : val[prop];
      } else {
        if (!(prop in style) && prop.indexOf("webkit") === -1) {
          prop = "-webkit-" + prop;
        }
        style[prop] = val + (typeof val === "string" ? "" : "px");
      }
    }
  }
  function matrix(el, selfOnly) {
    var appliedTransforms = "";
    if (typeof el === "string") {
      appliedTransforms = el;
    } else {
      do {
        var transform = css(el, "transform");
        if (transform && transform !== "none") {
          appliedTransforms = transform + " " + appliedTransforms;
        }
      } while (!selfOnly && (el = el.parentNode));
    }
    var matrixFn = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
    return matrixFn && new matrixFn(appliedTransforms);
  }
  function find(ctx, tagName, iterator) {
    if (ctx) {
      var list = ctx.getElementsByTagName(tagName), i = 0, n = list.length;
      if (iterator) {
        for (; i < n; i++) {
          iterator(list[i], i);
        }
      }
      return list;
    }
    return [];
  }
  function getWindowScrollingElement() {
    var scrollingElement = document.scrollingElement;
    if (scrollingElement) {
      return scrollingElement;
    } else {
      return document.documentElement;
    }
  }
  function getRect(el, relativeToContainingBlock, relativeToNonStaticParent, undoScale, container) {
    if (!el.getBoundingClientRect && el !== window)
      return;
    var elRect, top, left, bottom, right, height, width;
    if (el !== window && el.parentNode && el !== getWindowScrollingElement()) {
      elRect = el.getBoundingClientRect();
      top = elRect.top;
      left = elRect.left;
      bottom = elRect.bottom;
      right = elRect.right;
      height = elRect.height;
      width = elRect.width;
    } else {
      top = 0;
      left = 0;
      bottom = window.innerHeight;
      right = window.innerWidth;
      height = window.innerHeight;
      width = window.innerWidth;
    }
    if ((relativeToContainingBlock || relativeToNonStaticParent) && el !== window) {
      container = container || el.parentNode;
      if (!IE11OrLess) {
        do {
          if (container && container.getBoundingClientRect && (css(container, "transform") !== "none" || relativeToNonStaticParent && css(container, "position") !== "static")) {
            var containerRect = container.getBoundingClientRect();
            top -= containerRect.top + parseInt(css(container, "border-top-width"));
            left -= containerRect.left + parseInt(css(container, "border-left-width"));
            bottom = top + elRect.height;
            right = left + elRect.width;
            break;
          }
        } while (container = container.parentNode);
      }
    }
    if (undoScale && el !== window) {
      var elMatrix = matrix(container || el), scaleX = elMatrix && elMatrix.a, scaleY = elMatrix && elMatrix.d;
      if (elMatrix) {
        top /= scaleY;
        left /= scaleX;
        width /= scaleX;
        height /= scaleY;
        bottom = top + height;
        right = left + width;
      }
    }
    return {
      top,
      left,
      bottom,
      right,
      width,
      height
    };
  }
  function getContentRect(el) {
    var rect = getRect(el);
    var paddingLeft = parseInt(css(el, "padding-left")), paddingTop = parseInt(css(el, "padding-top")), paddingRight = parseInt(css(el, "padding-right")), paddingBottom = parseInt(css(el, "padding-bottom"));
    rect.top += paddingTop + parseInt(css(el, "border-top-width"));
    rect.left += paddingLeft + parseInt(css(el, "border-left-width"));
    rect.width = el.clientWidth - paddingLeft - paddingRight;
    rect.height = el.clientHeight - paddingTop - paddingBottom;
    rect.bottom = rect.top + rect.height;
    rect.right = rect.left + rect.width;
    return rect;
  }
  function isScrolledPast(el, elSide, parentSide) {
    var parent = getParentAutoScrollElement(el, true), elSideVal = getRect(el)[elSide];
    while (parent) {
      var parentSideVal = getRect(parent)[parentSide], visible = void 0;
      if (parentSide === "top" || parentSide === "left") {
        visible = elSideVal >= parentSideVal;
      } else {
        visible = elSideVal <= parentSideVal;
      }
      if (!visible)
        return parent;
      if (parent === getWindowScrollingElement())
        break;
      parent = getParentAutoScrollElement(parent, false);
    }
    return false;
  }
  function getChild(el, childNum, options, includeDragEl) {
    var currentChild = 0, i = 0, children = el.children;
    while (i < children.length) {
      if (children[i].style.display !== "none" && children[i] !== Sortable.ghost && (includeDragEl || children[i] !== Sortable.dragged) && closest(children[i], options.draggable, el, false)) {
        if (currentChild === childNum) {
          return children[i];
        }
        currentChild++;
      }
      i++;
    }
    return null;
  }
  function lastChild(el, selector) {
    var last = el.lastElementChild;
    while (last && (last === Sortable.ghost || css(last, "display") === "none" || selector && !matches(last, selector))) {
      last = last.previousElementSibling;
    }
    return last || null;
  }
  function index(el, selector) {
    var index2 = 0;
    if (!el || !el.parentNode) {
      return -1;
    }
    while (el = el.previousElementSibling) {
      if (el.nodeName.toUpperCase() !== "TEMPLATE" && el !== Sortable.clone && (!selector || matches(el, selector))) {
        index2++;
      }
    }
    return index2;
  }
  function getRelativeScrollOffset(el) {
    var offsetLeft = 0, offsetTop = 0, winScroller = getWindowScrollingElement();
    if (el) {
      do {
        var elMatrix = matrix(el), scaleX = elMatrix.a, scaleY = elMatrix.d;
        offsetLeft += el.scrollLeft * scaleX;
        offsetTop += el.scrollTop * scaleY;
      } while (el !== winScroller && (el = el.parentNode));
    }
    return [offsetLeft, offsetTop];
  }
  function indexOfObject(arr, obj) {
    for (var i in arr) {
      if (!arr.hasOwnProperty(i))
        continue;
      for (var key in obj) {
        if (obj.hasOwnProperty(key) && obj[key] === arr[i][key])
          return Number(i);
      }
    }
    return -1;
  }
  function getParentAutoScrollElement(el, includeSelf) {
    if (!el || !el.getBoundingClientRect)
      return getWindowScrollingElement();
    var elem = el;
    var gotSelf = false;
    do {
      if (elem.clientWidth < elem.scrollWidth || elem.clientHeight < elem.scrollHeight) {
        var elemCSS = css(elem);
        if (elem.clientWidth < elem.scrollWidth && (elemCSS.overflowX == "auto" || elemCSS.overflowX == "scroll") || elem.clientHeight < elem.scrollHeight && (elemCSS.overflowY == "auto" || elemCSS.overflowY == "scroll")) {
          if (!elem.getBoundingClientRect || elem === document.body)
            return getWindowScrollingElement();
          if (gotSelf || includeSelf)
            return elem;
          gotSelf = true;
        }
      }
    } while (elem = elem.parentNode);
    return getWindowScrollingElement();
  }
  function extend(dst, src) {
    if (dst && src) {
      for (var key in src) {
        if (src.hasOwnProperty(key)) {
          dst[key] = src[key];
        }
      }
    }
    return dst;
  }
  function isRectEqual(rect1, rect2) {
    return Math.round(rect1.top) === Math.round(rect2.top) && Math.round(rect1.left) === Math.round(rect2.left) && Math.round(rect1.height) === Math.round(rect2.height) && Math.round(rect1.width) === Math.round(rect2.width);
  }
  var _throttleTimeout;
  function throttle(callback, ms) {
    return function() {
      if (!_throttleTimeout) {
        var args = arguments, _this = this;
        if (args.length === 1) {
          callback.call(_this, args[0]);
        } else {
          callback.apply(_this, args);
        }
        _throttleTimeout = setTimeout(function() {
          _throttleTimeout = void 0;
        }, ms);
      }
    };
  }
  function cancelThrottle() {
    clearTimeout(_throttleTimeout);
    _throttleTimeout = void 0;
  }
  function scrollBy(el, x, y) {
    el.scrollLeft += x;
    el.scrollTop += y;
  }
  function clone(el) {
    var Polymer = window.Polymer;
    var $ = window.jQuery || window.Zepto;
    if (Polymer && Polymer.dom) {
      return Polymer.dom(el).cloneNode(true);
    } else if ($) {
      return $(el).clone(true)[0];
    } else {
      return el.cloneNode(true);
    }
  }
  var expando = "Sortable" + (/* @__PURE__ */ new Date()).getTime();
  function AnimationStateManager() {
    var animationStates = [], animationCallbackId;
    return {
      captureAnimationState: function captureAnimationState() {
        animationStates = [];
        if (!this.options.animation)
          return;
        var children = [].slice.call(this.el.children);
        children.forEach(function(child) {
          if (css(child, "display") === "none" || child === Sortable.ghost)
            return;
          animationStates.push({
            target: child,
            rect: getRect(child)
          });
          var fromRect = _objectSpread2({}, animationStates[animationStates.length - 1].rect);
          if (child.thisAnimationDuration) {
            var childMatrix = matrix(child, true);
            if (childMatrix) {
              fromRect.top -= childMatrix.f;
              fromRect.left -= childMatrix.e;
            }
          }
          child.fromRect = fromRect;
        });
      },
      addAnimationState: function addAnimationState(state) {
        animationStates.push(state);
      },
      removeAnimationState: function removeAnimationState(target) {
        animationStates.splice(indexOfObject(animationStates, {
          target
        }), 1);
      },
      animateAll: function animateAll(callback) {
        var _this = this;
        if (!this.options.animation) {
          clearTimeout(animationCallbackId);
          if (typeof callback === "function")
            callback();
          return;
        }
        var animating = false, animationTime = 0;
        animationStates.forEach(function(state) {
          var time = 0, target = state.target, fromRect = target.fromRect, toRect = getRect(target), prevFromRect = target.prevFromRect, prevToRect = target.prevToRect, animatingRect = state.rect, targetMatrix = matrix(target, true);
          if (targetMatrix) {
            toRect.top -= targetMatrix.f;
            toRect.left -= targetMatrix.e;
          }
          target.toRect = toRect;
          if (target.thisAnimationDuration) {
            if (isRectEqual(prevFromRect, toRect) && !isRectEqual(fromRect, toRect) && // Make sure animatingRect is on line between toRect & fromRect
            (animatingRect.top - toRect.top) / (animatingRect.left - toRect.left) === (fromRect.top - toRect.top) / (fromRect.left - toRect.left)) {
              time = calculateRealTime(animatingRect, prevFromRect, prevToRect, _this.options);
            }
          }
          if (!isRectEqual(toRect, fromRect)) {
            target.prevFromRect = fromRect;
            target.prevToRect = toRect;
            if (!time) {
              time = _this.options.animation;
            }
            _this.animate(target, animatingRect, toRect, time);
          }
          if (time) {
            animating = true;
            animationTime = Math.max(animationTime, time);
            clearTimeout(target.animationResetTimer);
            target.animationResetTimer = setTimeout(function() {
              target.animationTime = 0;
              target.prevFromRect = null;
              target.fromRect = null;
              target.prevToRect = null;
              target.thisAnimationDuration = null;
            }, time);
            target.thisAnimationDuration = time;
          }
        });
        clearTimeout(animationCallbackId);
        if (!animating) {
          if (typeof callback === "function")
            callback();
        } else {
          animationCallbackId = setTimeout(function() {
            if (typeof callback === "function")
              callback();
          }, animationTime);
        }
        animationStates = [];
      },
      animate: function animate(target, currentRect, toRect, duration) {
        if (duration) {
          css(target, "transition", "");
          css(target, "transform", "");
          var elMatrix = matrix(this.el), scaleX = elMatrix && elMatrix.a, scaleY = elMatrix && elMatrix.d, translateX = (currentRect.left - toRect.left) / (scaleX || 1), translateY = (currentRect.top - toRect.top) / (scaleY || 1);
          target.animatingX = !!translateX;
          target.animatingY = !!translateY;
          css(target, "transform", "translate3d(" + translateX + "px," + translateY + "px,0)");
          this.forRepaintDummy = repaint(target);
          css(target, "transition", "transform " + duration + "ms" + (this.options.easing ? " " + this.options.easing : ""));
          css(target, "transform", "translate3d(0,0,0)");
          typeof target.animated === "number" && clearTimeout(target.animated);
          target.animated = setTimeout(function() {
            css(target, "transition", "");
            css(target, "transform", "");
            target.animated = false;
            target.animatingX = false;
            target.animatingY = false;
          }, duration);
        }
      }
    };
  }
  function repaint(target) {
    return target.offsetWidth;
  }
  function calculateRealTime(animatingRect, fromRect, toRect, options) {
    return Math.sqrt(Math.pow(fromRect.top - animatingRect.top, 2) + Math.pow(fromRect.left - animatingRect.left, 2)) / Math.sqrt(Math.pow(fromRect.top - toRect.top, 2) + Math.pow(fromRect.left - toRect.left, 2)) * options.animation;
  }
  var plugins = [];
  var defaults = {
    initializeByDefault: true
  };
  var PluginManager = {
    mount: function mount(plugin) {
      for (var option2 in defaults) {
        if (defaults.hasOwnProperty(option2) && !(option2 in plugin)) {
          plugin[option2] = defaults[option2];
        }
      }
      plugins.forEach(function(p) {
        if (p.pluginName === plugin.pluginName) {
          throw "Sortable: Cannot mount plugin ".concat(plugin.pluginName, " more than once");
        }
      });
      plugins.push(plugin);
    },
    pluginEvent: function pluginEvent(eventName, sortable, evt) {
      var _this = this;
      this.eventCanceled = false;
      evt.cancel = function() {
        _this.eventCanceled = true;
      };
      var eventNameGlobal = eventName + "Global";
      plugins.forEach(function(plugin) {
        if (!sortable[plugin.pluginName])
          return;
        if (sortable[plugin.pluginName][eventNameGlobal]) {
          sortable[plugin.pluginName][eventNameGlobal](_objectSpread2({
            sortable
          }, evt));
        }
        if (sortable.options[plugin.pluginName] && sortable[plugin.pluginName][eventName]) {
          sortable[plugin.pluginName][eventName](_objectSpread2({
            sortable
          }, evt));
        }
      });
    },
    initializePlugins: function initializePlugins(sortable, el, defaults2, options) {
      plugins.forEach(function(plugin) {
        var pluginName = plugin.pluginName;
        if (!sortable.options[pluginName] && !plugin.initializeByDefault)
          return;
        var initialized = new plugin(sortable, el, sortable.options);
        initialized.sortable = sortable;
        initialized.options = sortable.options;
        sortable[pluginName] = initialized;
        _extends(defaults2, initialized.defaults);
      });
      for (var option2 in sortable.options) {
        if (!sortable.options.hasOwnProperty(option2))
          continue;
        var modified = this.modifyOption(sortable, option2, sortable.options[option2]);
        if (typeof modified !== "undefined") {
          sortable.options[option2] = modified;
        }
      }
    },
    getEventProperties: function getEventProperties(name, sortable) {
      var eventProperties = {};
      plugins.forEach(function(plugin) {
        if (typeof plugin.eventProperties !== "function")
          return;
        _extends(eventProperties, plugin.eventProperties.call(sortable[plugin.pluginName], name));
      });
      return eventProperties;
    },
    modifyOption: function modifyOption(sortable, name, value) {
      var modifiedValue;
      plugins.forEach(function(plugin) {
        if (!sortable[plugin.pluginName])
          return;
        if (plugin.optionListeners && typeof plugin.optionListeners[name] === "function") {
          modifiedValue = plugin.optionListeners[name].call(sortable[plugin.pluginName], value);
        }
      });
      return modifiedValue;
    }
  };
  function dispatchEvent(_ref) {
    var sortable = _ref.sortable, rootEl2 = _ref.rootEl, name = _ref.name, targetEl = _ref.targetEl, cloneEl2 = _ref.cloneEl, toEl = _ref.toEl, fromEl = _ref.fromEl, oldIndex2 = _ref.oldIndex, newIndex2 = _ref.newIndex, oldDraggableIndex2 = _ref.oldDraggableIndex, newDraggableIndex2 = _ref.newDraggableIndex, originalEvent = _ref.originalEvent, putSortable2 = _ref.putSortable, extraEventProperties = _ref.extraEventProperties;
    sortable = sortable || rootEl2 && rootEl2[expando];
    if (!sortable)
      return;
    var evt, options = sortable.options, onName = "on" + name.charAt(0).toUpperCase() + name.substr(1);
    if (window.CustomEvent && !IE11OrLess && !Edge) {
      evt = new CustomEvent(name, {
        bubbles: true,
        cancelable: true
      });
    } else {
      evt = document.createEvent("Event");
      evt.initEvent(name, true, true);
    }
    evt.to = toEl || rootEl2;
    evt.from = fromEl || rootEl2;
    evt.item = targetEl || rootEl2;
    evt.clone = cloneEl2;
    evt.oldIndex = oldIndex2;
    evt.newIndex = newIndex2;
    evt.oldDraggableIndex = oldDraggableIndex2;
    evt.newDraggableIndex = newDraggableIndex2;
    evt.originalEvent = originalEvent;
    evt.pullMode = putSortable2 ? putSortable2.lastPutMode : void 0;
    var allEventProperties = _objectSpread2(_objectSpread2({}, extraEventProperties), PluginManager.getEventProperties(name, sortable));
    for (var option2 in allEventProperties) {
      evt[option2] = allEventProperties[option2];
    }
    if (rootEl2) {
      rootEl2.dispatchEvent(evt);
    }
    if (options[onName]) {
      options[onName].call(sortable, evt);
    }
  }
  var _excluded = ["evt"];
  var pluginEvent2 = function pluginEvent3(eventName, sortable) {
    var _ref = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {}, originalEvent = _ref.evt, data = _objectWithoutProperties(_ref, _excluded);
    PluginManager.pluginEvent.bind(Sortable)(eventName, sortable, _objectSpread2({
      dragEl,
      parentEl,
      ghostEl,
      rootEl,
      nextEl,
      lastDownEl,
      cloneEl,
      cloneHidden,
      dragStarted: moved,
      putSortable,
      activeSortable: Sortable.active,
      originalEvent,
      oldIndex,
      oldDraggableIndex,
      newIndex,
      newDraggableIndex,
      hideGhostForTarget: _hideGhostForTarget,
      unhideGhostForTarget: _unhideGhostForTarget,
      cloneNowHidden: function cloneNowHidden() {
        cloneHidden = true;
      },
      cloneNowShown: function cloneNowShown() {
        cloneHidden = false;
      },
      dispatchSortableEvent: function dispatchSortableEvent(name) {
        _dispatchEvent({
          sortable,
          name,
          originalEvent
        });
      }
    }, data));
  };
  function _dispatchEvent(info) {
    dispatchEvent(_objectSpread2({
      putSortable,
      cloneEl,
      targetEl: dragEl,
      rootEl,
      oldIndex,
      oldDraggableIndex,
      newIndex,
      newDraggableIndex
    }, info));
  }
  var dragEl;
  var parentEl;
  var ghostEl;
  var rootEl;
  var nextEl;
  var lastDownEl;
  var cloneEl;
  var cloneHidden;
  var oldIndex;
  var newIndex;
  var oldDraggableIndex;
  var newDraggableIndex;
  var activeGroup;
  var putSortable;
  var awaitingDragStarted = false;
  var ignoreNextClick = false;
  var sortables = [];
  var tapEvt;
  var touchEvt;
  var lastDx;
  var lastDy;
  var tapDistanceLeft;
  var tapDistanceTop;
  var moved;
  var lastTarget;
  var lastDirection;
  var pastFirstInvertThresh = false;
  var isCircumstantialInvert = false;
  var targetMoveDistance;
  var ghostRelativeParent;
  var ghostRelativeParentInitialScroll = [];
  var _silent = false;
  var savedInputChecked = [];
  var documentExists = typeof document !== "undefined";
  var PositionGhostAbsolutely = IOS;
  var CSSFloatProperty = Edge || IE11OrLess ? "cssFloat" : "float";
  var supportDraggable = documentExists && !ChromeForAndroid && !IOS && "draggable" in document.createElement("div");
  var supportCssPointerEvents = function() {
    if (!documentExists)
      return;
    if (IE11OrLess) {
      return false;
    }
    var el = document.createElement("x");
    el.style.cssText = "pointer-events:auto";
    return el.style.pointerEvents === "auto";
  }();
  var _detectDirection = function _detectDirection2(el, options) {
    var elCSS = css(el), elWidth = parseInt(elCSS.width) - parseInt(elCSS.paddingLeft) - parseInt(elCSS.paddingRight) - parseInt(elCSS.borderLeftWidth) - parseInt(elCSS.borderRightWidth), child1 = getChild(el, 0, options), child2 = getChild(el, 1, options), firstChildCSS = child1 && css(child1), secondChildCSS = child2 && css(child2), firstChildWidth = firstChildCSS && parseInt(firstChildCSS.marginLeft) + parseInt(firstChildCSS.marginRight) + getRect(child1).width, secondChildWidth = secondChildCSS && parseInt(secondChildCSS.marginLeft) + parseInt(secondChildCSS.marginRight) + getRect(child2).width;
    if (elCSS.display === "flex") {
      return elCSS.flexDirection === "column" || elCSS.flexDirection === "column-reverse" ? "vertical" : "horizontal";
    }
    if (elCSS.display === "grid") {
      return elCSS.gridTemplateColumns.split(" ").length <= 1 ? "vertical" : "horizontal";
    }
    if (child1 && firstChildCSS["float"] && firstChildCSS["float"] !== "none") {
      var touchingSideChild2 = firstChildCSS["float"] === "left" ? "left" : "right";
      return child2 && (secondChildCSS.clear === "both" || secondChildCSS.clear === touchingSideChild2) ? "vertical" : "horizontal";
    }
    return child1 && (firstChildCSS.display === "block" || firstChildCSS.display === "flex" || firstChildCSS.display === "table" || firstChildCSS.display === "grid" || firstChildWidth >= elWidth && elCSS[CSSFloatProperty] === "none" || child2 && elCSS[CSSFloatProperty] === "none" && firstChildWidth + secondChildWidth > elWidth) ? "vertical" : "horizontal";
  };
  var _dragElInRowColumn = function _dragElInRowColumn2(dragRect, targetRect, vertical) {
    var dragElS1Opp = vertical ? dragRect.left : dragRect.top, dragElS2Opp = vertical ? dragRect.right : dragRect.bottom, dragElOppLength = vertical ? dragRect.width : dragRect.height, targetS1Opp = vertical ? targetRect.left : targetRect.top, targetS2Opp = vertical ? targetRect.right : targetRect.bottom, targetOppLength = vertical ? targetRect.width : targetRect.height;
    return dragElS1Opp === targetS1Opp || dragElS2Opp === targetS2Opp || dragElS1Opp + dragElOppLength / 2 === targetS1Opp + targetOppLength / 2;
  };
  var _detectNearestEmptySortable = function _detectNearestEmptySortable2(x, y) {
    var ret;
    sortables.some(function(sortable) {
      var threshold = sortable[expando].options.emptyInsertThreshold;
      if (!threshold || lastChild(sortable))
        return;
      var rect = getRect(sortable), insideHorizontally = x >= rect.left - threshold && x <= rect.right + threshold, insideVertically = y >= rect.top - threshold && y <= rect.bottom + threshold;
      if (insideHorizontally && insideVertically) {
        return ret = sortable;
      }
    });
    return ret;
  };
  var _prepareGroup = function _prepareGroup2(options) {
    function toFn(value, pull) {
      return function(to, from, dragEl2, evt) {
        var sameGroup = to.options.group.name && from.options.group.name && to.options.group.name === from.options.group.name;
        if (value == null && (pull || sameGroup)) {
          return true;
        } else if (value == null || value === false) {
          return false;
        } else if (pull && value === "clone") {
          return value;
        } else if (typeof value === "function") {
          return toFn(value(to, from, dragEl2, evt), pull)(to, from, dragEl2, evt);
        } else {
          var otherGroup = (pull ? to : from).options.group.name;
          return value === true || typeof value === "string" && value === otherGroup || value.join && value.indexOf(otherGroup) > -1;
        }
      };
    }
    var group = {};
    var originalGroup = options.group;
    if (!originalGroup || _typeof(originalGroup) != "object") {
      originalGroup = {
        name: originalGroup
      };
    }
    group.name = originalGroup.name;
    group.checkPull = toFn(originalGroup.pull, true);
    group.checkPut = toFn(originalGroup.put);
    group.revertClone = originalGroup.revertClone;
    options.group = group;
  };
  var _hideGhostForTarget = function _hideGhostForTarget2() {
    if (!supportCssPointerEvents && ghostEl) {
      css(ghostEl, "display", "none");
    }
  };
  var _unhideGhostForTarget = function _unhideGhostForTarget2() {
    if (!supportCssPointerEvents && ghostEl) {
      css(ghostEl, "display", "");
    }
  };
  if (documentExists && !ChromeForAndroid) {
    document.addEventListener("click", function(evt) {
      if (ignoreNextClick) {
        evt.preventDefault();
        evt.stopPropagation && evt.stopPropagation();
        evt.stopImmediatePropagation && evt.stopImmediatePropagation();
        ignoreNextClick = false;
        return false;
      }
    }, true);
  }
  var nearestEmptyInsertDetectEvent = function nearestEmptyInsertDetectEvent2(evt) {
    if (dragEl) {
      evt = evt.touches ? evt.touches[0] : evt;
      var nearest = _detectNearestEmptySortable(evt.clientX, evt.clientY);
      if (nearest) {
        var event = {};
        for (var i in evt) {
          if (evt.hasOwnProperty(i)) {
            event[i] = evt[i];
          }
        }
        event.target = event.rootEl = nearest;
        event.preventDefault = void 0;
        event.stopPropagation = void 0;
        nearest[expando]._onDragOver(event);
      }
    }
  };
  var _checkOutsideTargetEl = function _checkOutsideTargetEl2(evt) {
    if (dragEl) {
      dragEl.parentNode[expando]._isOutsideThisEl(evt.target);
    }
  };
  function Sortable(el, options) {
    if (!(el && el.nodeType && el.nodeType === 1)) {
      throw "Sortable: `el` must be an HTMLElement, not ".concat({}.toString.call(el));
    }
    this.el = el;
    this.options = options = _extends({}, options);
    el[expando] = this;
    var defaults2 = {
      group: null,
      sort: true,
      disabled: false,
      store: null,
      handle: null,
      draggable: /^[uo]l$/i.test(el.nodeName) ? ">li" : ">*",
      swapThreshold: 1,
      // percentage; 0 <= x <= 1
      invertSwap: false,
      // invert always
      invertedSwapThreshold: null,
      // will be set to same as swapThreshold if default
      removeCloneOnHide: true,
      direction: function direction() {
        return _detectDirection(el, this.options);
      },
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      dragClass: "sortable-drag",
      ignore: "a, img",
      filter: null,
      preventOnFilter: true,
      animation: 0,
      easing: null,
      setData: function setData(dataTransfer, dragEl2) {
        dataTransfer.setData("Text", dragEl2.textContent);
      },
      dropBubble: false,
      dragoverBubble: false,
      dataIdAttr: "data-id",
      delay: 0,
      delayOnTouchOnly: false,
      touchStartThreshold: (Number.parseInt ? Number : window).parseInt(window.devicePixelRatio, 10) || 1,
      forceFallback: false,
      fallbackClass: "sortable-fallback",
      fallbackOnBody: false,
      fallbackTolerance: 0,
      fallbackOffset: {
        x: 0,
        y: 0
      },
      supportPointer: Sortable.supportPointer !== false && "PointerEvent" in window && !Safari,
      emptyInsertThreshold: 5
    };
    PluginManager.initializePlugins(this, el, defaults2);
    for (var name in defaults2) {
      !(name in options) && (options[name] = defaults2[name]);
    }
    _prepareGroup(options);
    for (var fn in this) {
      if (fn.charAt(0) === "_" && typeof this[fn] === "function") {
        this[fn] = this[fn].bind(this);
      }
    }
    this.nativeDraggable = options.forceFallback ? false : supportDraggable;
    if (this.nativeDraggable) {
      this.options.touchStartThreshold = 1;
    }
    if (options.supportPointer) {
      on(el, "pointerdown", this._onTapStart);
    } else {
      on(el, "mousedown", this._onTapStart);
      on(el, "touchstart", this._onTapStart);
    }
    if (this.nativeDraggable) {
      on(el, "dragover", this);
      on(el, "dragenter", this);
    }
    sortables.push(this.el);
    options.store && options.store.get && this.sort(options.store.get(this) || []);
    _extends(this, AnimationStateManager());
  }
  Sortable.prototype = /** @lends Sortable.prototype */
  {
    constructor: Sortable,
    _isOutsideThisEl: function _isOutsideThisEl(target) {
      if (!this.el.contains(target) && target !== this.el) {
        lastTarget = null;
      }
    },
    _getDirection: function _getDirection(evt, target) {
      return typeof this.options.direction === "function" ? this.options.direction.call(this, evt, target, dragEl) : this.options.direction;
    },
    _onTapStart: function _onTapStart(evt) {
      if (!evt.cancelable)
        return;
      var _this = this, el = this.el, options = this.options, preventOnFilter = options.preventOnFilter, type = evt.type, touch = evt.touches && evt.touches[0] || evt.pointerType && evt.pointerType === "touch" && evt, target = (touch || evt).target, originalTarget = evt.target.shadowRoot && (evt.path && evt.path[0] || evt.composedPath && evt.composedPath()[0]) || target, filter = options.filter;
      _saveInputCheckedState(el);
      if (dragEl) {
        return;
      }
      if (/mousedown|pointerdown/.test(type) && evt.button !== 0 || options.disabled) {
        return;
      }
      if (originalTarget.isContentEditable) {
        return;
      }
      if (!this.nativeDraggable && Safari && target && target.tagName.toUpperCase() === "SELECT") {
        return;
      }
      target = closest(target, options.draggable, el, false);
      if (target && target.animated) {
        return;
      }
      if (lastDownEl === target) {
        return;
      }
      oldIndex = index(target);
      oldDraggableIndex = index(target, options.draggable);
      if (typeof filter === "function") {
        if (filter.call(this, evt, target, this)) {
          _dispatchEvent({
            sortable: _this,
            rootEl: originalTarget,
            name: "filter",
            targetEl: target,
            toEl: el,
            fromEl: el
          });
          pluginEvent2("filter", _this, {
            evt
          });
          preventOnFilter && evt.cancelable && evt.preventDefault();
          return;
        }
      } else if (filter) {
        filter = filter.split(",").some(function(criteria) {
          criteria = closest(originalTarget, criteria.trim(), el, false);
          if (criteria) {
            _dispatchEvent({
              sortable: _this,
              rootEl: criteria,
              name: "filter",
              targetEl: target,
              fromEl: el,
              toEl: el
            });
            pluginEvent2("filter", _this, {
              evt
            });
            return true;
          }
        });
        if (filter) {
          preventOnFilter && evt.cancelable && evt.preventDefault();
          return;
        }
      }
      if (options.handle && !closest(originalTarget, options.handle, el, false)) {
        return;
      }
      this._prepareDragStart(evt, touch, target);
    },
    _prepareDragStart: function _prepareDragStart(evt, touch, target) {
      var _this = this, el = _this.el, options = _this.options, ownerDocument = el.ownerDocument, dragStartFn;
      if (target && !dragEl && target.parentNode === el) {
        var dragRect = getRect(target);
        rootEl = el;
        dragEl = target;
        parentEl = dragEl.parentNode;
        nextEl = dragEl.nextSibling;
        lastDownEl = target;
        activeGroup = options.group;
        Sortable.dragged = dragEl;
        tapEvt = {
          target: dragEl,
          clientX: (touch || evt).clientX,
          clientY: (touch || evt).clientY
        };
        tapDistanceLeft = tapEvt.clientX - dragRect.left;
        tapDistanceTop = tapEvt.clientY - dragRect.top;
        this._lastX = (touch || evt).clientX;
        this._lastY = (touch || evt).clientY;
        dragEl.style["will-change"] = "all";
        dragStartFn = function dragStartFn2() {
          pluginEvent2("delayEnded", _this, {
            evt
          });
          if (Sortable.eventCanceled) {
            _this._onDrop();
            return;
          }
          _this._disableDelayedDragEvents();
          if (!FireFox && _this.nativeDraggable) {
            dragEl.draggable = true;
          }
          _this._triggerDragStart(evt, touch);
          _dispatchEvent({
            sortable: _this,
            name: "choose",
            originalEvent: evt
          });
          toggleClass(dragEl, options.chosenClass, true);
        };
        options.ignore.split(",").forEach(function(criteria) {
          find(dragEl, criteria.trim(), _disableDraggable);
        });
        on(ownerDocument, "dragover", nearestEmptyInsertDetectEvent);
        on(ownerDocument, "mousemove", nearestEmptyInsertDetectEvent);
        on(ownerDocument, "touchmove", nearestEmptyInsertDetectEvent);
        on(ownerDocument, "mouseup", _this._onDrop);
        on(ownerDocument, "touchend", _this._onDrop);
        on(ownerDocument, "touchcancel", _this._onDrop);
        if (FireFox && this.nativeDraggable) {
          this.options.touchStartThreshold = 4;
          dragEl.draggable = true;
        }
        pluginEvent2("delayStart", this, {
          evt
        });
        if (options.delay && (!options.delayOnTouchOnly || touch) && (!this.nativeDraggable || !(Edge || IE11OrLess))) {
          if (Sortable.eventCanceled) {
            this._onDrop();
            return;
          }
          on(ownerDocument, "mouseup", _this._disableDelayedDrag);
          on(ownerDocument, "touchend", _this._disableDelayedDrag);
          on(ownerDocument, "touchcancel", _this._disableDelayedDrag);
          on(ownerDocument, "mousemove", _this._delayedDragTouchMoveHandler);
          on(ownerDocument, "touchmove", _this._delayedDragTouchMoveHandler);
          options.supportPointer && on(ownerDocument, "pointermove", _this._delayedDragTouchMoveHandler);
          _this._dragStartTimer = setTimeout(dragStartFn, options.delay);
        } else {
          dragStartFn();
        }
      }
    },
    _delayedDragTouchMoveHandler: function _delayedDragTouchMoveHandler(e) {
      var touch = e.touches ? e.touches[0] : e;
      if (Math.max(Math.abs(touch.clientX - this._lastX), Math.abs(touch.clientY - this._lastY)) >= Math.floor(this.options.touchStartThreshold / (this.nativeDraggable && window.devicePixelRatio || 1))) {
        this._disableDelayedDrag();
      }
    },
    _disableDelayedDrag: function _disableDelayedDrag() {
      dragEl && _disableDraggable(dragEl);
      clearTimeout(this._dragStartTimer);
      this._disableDelayedDragEvents();
    },
    _disableDelayedDragEvents: function _disableDelayedDragEvents() {
      var ownerDocument = this.el.ownerDocument;
      off(ownerDocument, "mouseup", this._disableDelayedDrag);
      off(ownerDocument, "touchend", this._disableDelayedDrag);
      off(ownerDocument, "touchcancel", this._disableDelayedDrag);
      off(ownerDocument, "mousemove", this._delayedDragTouchMoveHandler);
      off(ownerDocument, "touchmove", this._delayedDragTouchMoveHandler);
      off(ownerDocument, "pointermove", this._delayedDragTouchMoveHandler);
    },
    _triggerDragStart: function _triggerDragStart(evt, touch) {
      touch = touch || evt.pointerType == "touch" && evt;
      if (!this.nativeDraggable || touch) {
        if (this.options.supportPointer) {
          on(document, "pointermove", this._onTouchMove);
        } else if (touch) {
          on(document, "touchmove", this._onTouchMove);
        } else {
          on(document, "mousemove", this._onTouchMove);
        }
      } else {
        on(dragEl, "dragend", this);
        on(rootEl, "dragstart", this._onDragStart);
      }
      try {
        if (document.selection) {
          _nextTick(function() {
            document.selection.empty();
          });
        } else {
          window.getSelection().removeAllRanges();
        }
      } catch (err) {
      }
    },
    _dragStarted: function _dragStarted(fallback, evt) {
      awaitingDragStarted = false;
      if (rootEl && dragEl) {
        pluginEvent2("dragStarted", this, {
          evt
        });
        if (this.nativeDraggable) {
          on(document, "dragover", _checkOutsideTargetEl);
        }
        var options = this.options;
        !fallback && toggleClass(dragEl, options.dragClass, false);
        toggleClass(dragEl, options.ghostClass, true);
        Sortable.active = this;
        fallback && this._appendGhost();
        _dispatchEvent({
          sortable: this,
          name: "start",
          originalEvent: evt
        });
      } else {
        this._nulling();
      }
    },
    _emulateDragOver: function _emulateDragOver() {
      if (touchEvt) {
        this._lastX = touchEvt.clientX;
        this._lastY = touchEvt.clientY;
        _hideGhostForTarget();
        var target = document.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
        var parent = target;
        while (target && target.shadowRoot) {
          target = target.shadowRoot.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
          if (target === parent)
            break;
          parent = target;
        }
        dragEl.parentNode[expando]._isOutsideThisEl(target);
        if (parent) {
          do {
            if (parent[expando]) {
              var inserted = void 0;
              inserted = parent[expando]._onDragOver({
                clientX: touchEvt.clientX,
                clientY: touchEvt.clientY,
                target,
                rootEl: parent
              });
              if (inserted && !this.options.dragoverBubble) {
                break;
              }
            }
            target = parent;
          } while (parent = parent.parentNode);
        }
        _unhideGhostForTarget();
      }
    },
    _onTouchMove: function _onTouchMove(evt) {
      if (tapEvt) {
        var options = this.options, fallbackTolerance = options.fallbackTolerance, fallbackOffset = options.fallbackOffset, touch = evt.touches ? evt.touches[0] : evt, ghostMatrix = ghostEl && matrix(ghostEl, true), scaleX = ghostEl && ghostMatrix && ghostMatrix.a, scaleY = ghostEl && ghostMatrix && ghostMatrix.d, relativeScrollOffset = PositionGhostAbsolutely && ghostRelativeParent && getRelativeScrollOffset(ghostRelativeParent), dx = (touch.clientX - tapEvt.clientX + fallbackOffset.x) / (scaleX || 1) + (relativeScrollOffset ? relativeScrollOffset[0] - ghostRelativeParentInitialScroll[0] : 0) / (scaleX || 1), dy = (touch.clientY - tapEvt.clientY + fallbackOffset.y) / (scaleY || 1) + (relativeScrollOffset ? relativeScrollOffset[1] - ghostRelativeParentInitialScroll[1] : 0) / (scaleY || 1);
        if (!Sortable.active && !awaitingDragStarted) {
          if (fallbackTolerance && Math.max(Math.abs(touch.clientX - this._lastX), Math.abs(touch.clientY - this._lastY)) < fallbackTolerance) {
            return;
          }
          this._onDragStart(evt, true);
        }
        if (ghostEl) {
          if (ghostMatrix) {
            ghostMatrix.e += dx - (lastDx || 0);
            ghostMatrix.f += dy - (lastDy || 0);
          } else {
            ghostMatrix = {
              a: 1,
              b: 0,
              c: 0,
              d: 1,
              e: dx,
              f: dy
            };
          }
          var cssMatrix = "matrix(".concat(ghostMatrix.a, ",").concat(ghostMatrix.b, ",").concat(ghostMatrix.c, ",").concat(ghostMatrix.d, ",").concat(ghostMatrix.e, ",").concat(ghostMatrix.f, ")");
          css(ghostEl, "webkitTransform", cssMatrix);
          css(ghostEl, "mozTransform", cssMatrix);
          css(ghostEl, "msTransform", cssMatrix);
          css(ghostEl, "transform", cssMatrix);
          lastDx = dx;
          lastDy = dy;
          touchEvt = touch;
        }
        evt.cancelable && evt.preventDefault();
      }
    },
    _appendGhost: function _appendGhost() {
      if (!ghostEl) {
        var container = this.options.fallbackOnBody ? document.body : rootEl, rect = getRect(dragEl, true, PositionGhostAbsolutely, true, container), options = this.options;
        if (PositionGhostAbsolutely) {
          ghostRelativeParent = container;
          while (css(ghostRelativeParent, "position") === "static" && css(ghostRelativeParent, "transform") === "none" && ghostRelativeParent !== document) {
            ghostRelativeParent = ghostRelativeParent.parentNode;
          }
          if (ghostRelativeParent !== document.body && ghostRelativeParent !== document.documentElement) {
            if (ghostRelativeParent === document)
              ghostRelativeParent = getWindowScrollingElement();
            rect.top += ghostRelativeParent.scrollTop;
            rect.left += ghostRelativeParent.scrollLeft;
          } else {
            ghostRelativeParent = getWindowScrollingElement();
          }
          ghostRelativeParentInitialScroll = getRelativeScrollOffset(ghostRelativeParent);
        }
        ghostEl = dragEl.cloneNode(true);
        toggleClass(ghostEl, options.ghostClass, false);
        toggleClass(ghostEl, options.fallbackClass, true);
        toggleClass(ghostEl, options.dragClass, true);
        css(ghostEl, "transition", "");
        css(ghostEl, "transform", "");
        css(ghostEl, "box-sizing", "border-box");
        css(ghostEl, "margin", 0);
        css(ghostEl, "top", rect.top);
        css(ghostEl, "left", rect.left);
        css(ghostEl, "width", rect.width);
        css(ghostEl, "height", rect.height);
        css(ghostEl, "opacity", "0.8");
        css(ghostEl, "position", PositionGhostAbsolutely ? "absolute" : "fixed");
        css(ghostEl, "zIndex", "100000");
        css(ghostEl, "pointerEvents", "none");
        Sortable.ghost = ghostEl;
        container.appendChild(ghostEl);
        css(ghostEl, "transform-origin", tapDistanceLeft / parseInt(ghostEl.style.width) * 100 + "% " + tapDistanceTop / parseInt(ghostEl.style.height) * 100 + "%");
      }
    },
    _onDragStart: function _onDragStart(evt, fallback) {
      var _this = this;
      var dataTransfer = evt.dataTransfer;
      var options = _this.options;
      pluginEvent2("dragStart", this, {
        evt
      });
      if (Sortable.eventCanceled) {
        this._onDrop();
        return;
      }
      pluginEvent2("setupClone", this);
      if (!Sortable.eventCanceled) {
        cloneEl = clone(dragEl);
        cloneEl.removeAttribute("id");
        cloneEl.draggable = false;
        cloneEl.style["will-change"] = "";
        this._hideClone();
        toggleClass(cloneEl, this.options.chosenClass, false);
        Sortable.clone = cloneEl;
      }
      _this.cloneId = _nextTick(function() {
        pluginEvent2("clone", _this);
        if (Sortable.eventCanceled)
          return;
        if (!_this.options.removeCloneOnHide) {
          rootEl.insertBefore(cloneEl, dragEl);
        }
        _this._hideClone();
        _dispatchEvent({
          sortable: _this,
          name: "clone"
        });
      });
      !fallback && toggleClass(dragEl, options.dragClass, true);
      if (fallback) {
        ignoreNextClick = true;
        _this._loopId = setInterval(_this._emulateDragOver, 50);
      } else {
        off(document, "mouseup", _this._onDrop);
        off(document, "touchend", _this._onDrop);
        off(document, "touchcancel", _this._onDrop);
        if (dataTransfer) {
          dataTransfer.effectAllowed = "move";
          options.setData && options.setData.call(_this, dataTransfer, dragEl);
        }
        on(document, "drop", _this);
        css(dragEl, "transform", "translateZ(0)");
      }
      awaitingDragStarted = true;
      _this._dragStartId = _nextTick(_this._dragStarted.bind(_this, fallback, evt));
      on(document, "selectstart", _this);
      moved = true;
      if (Safari) {
        css(document.body, "user-select", "none");
      }
    },
    // Returns true - if no further action is needed (either inserted or another condition)
    _onDragOver: function _onDragOver(evt) {
      var el = this.el, target = evt.target, dragRect, targetRect, revert, options = this.options, group = options.group, activeSortable = Sortable.active, isOwner = activeGroup === group, canSort = options.sort, fromSortable = putSortable || activeSortable, vertical, _this = this, completedFired = false;
      if (_silent)
        return;
      function dragOverEvent(name, extra) {
        pluginEvent2(name, _this, _objectSpread2({
          evt,
          isOwner,
          axis: vertical ? "vertical" : "horizontal",
          revert,
          dragRect,
          targetRect,
          canSort,
          fromSortable,
          target,
          completed,
          onMove: function onMove(target2, after2) {
            return _onMove(rootEl, el, dragEl, dragRect, target2, getRect(target2), evt, after2);
          },
          changed
        }, extra));
      }
      function capture() {
        dragOverEvent("dragOverAnimationCapture");
        _this.captureAnimationState();
        if (_this !== fromSortable) {
          fromSortable.captureAnimationState();
        }
      }
      function completed(insertion) {
        dragOverEvent("dragOverCompleted", {
          insertion
        });
        if (insertion) {
          if (isOwner) {
            activeSortable._hideClone();
          } else {
            activeSortable._showClone(_this);
          }
          if (_this !== fromSortable) {
            toggleClass(dragEl, putSortable ? putSortable.options.ghostClass : activeSortable.options.ghostClass, false);
            toggleClass(dragEl, options.ghostClass, true);
          }
          if (putSortable !== _this && _this !== Sortable.active) {
            putSortable = _this;
          } else if (_this === Sortable.active && putSortable) {
            putSortable = null;
          }
          if (fromSortable === _this) {
            _this._ignoreWhileAnimating = target;
          }
          _this.animateAll(function() {
            dragOverEvent("dragOverAnimationComplete");
            _this._ignoreWhileAnimating = null;
          });
          if (_this !== fromSortable) {
            fromSortable.animateAll();
            fromSortable._ignoreWhileAnimating = null;
          }
        }
        if (target === dragEl && !dragEl.animated || target === el && !target.animated) {
          lastTarget = null;
        }
        if (!options.dragoverBubble && !evt.rootEl && target !== document) {
          dragEl.parentNode[expando]._isOutsideThisEl(evt.target);
          !insertion && nearestEmptyInsertDetectEvent(evt);
        }
        !options.dragoverBubble && evt.stopPropagation && evt.stopPropagation();
        return completedFired = true;
      }
      function changed() {
        newIndex = index(dragEl);
        newDraggableIndex = index(dragEl, options.draggable);
        _dispatchEvent({
          sortable: _this,
          name: "change",
          toEl: el,
          newIndex,
          newDraggableIndex,
          originalEvent: evt
        });
      }
      if (evt.preventDefault !== void 0) {
        evt.cancelable && evt.preventDefault();
      }
      target = closest(target, options.draggable, el, true);
      dragOverEvent("dragOver");
      if (Sortable.eventCanceled)
        return completedFired;
      if (dragEl.contains(evt.target) || target.animated && target.animatingX && target.animatingY || _this._ignoreWhileAnimating === target) {
        return completed(false);
      }
      ignoreNextClick = false;
      if (activeSortable && !options.disabled && (isOwner ? canSort || (revert = parentEl !== rootEl) : putSortable === this || (this.lastPutMode = activeGroup.checkPull(this, activeSortable, dragEl, evt)) && group.checkPut(this, activeSortable, dragEl, evt))) {
        vertical = this._getDirection(evt, target) === "vertical";
        dragRect = getRect(dragEl);
        dragOverEvent("dragOverValid");
        if (Sortable.eventCanceled)
          return completedFired;
        if (revert) {
          parentEl = rootEl;
          capture();
          this._hideClone();
          dragOverEvent("revert");
          if (!Sortable.eventCanceled) {
            if (nextEl) {
              rootEl.insertBefore(dragEl, nextEl);
            } else {
              rootEl.appendChild(dragEl);
            }
          }
          return completed(true);
        }
        var elLastChild = lastChild(el, options.draggable);
        if (!elLastChild || _ghostIsLast(evt, vertical, this) && !elLastChild.animated) {
          if (elLastChild === dragEl) {
            return completed(false);
          }
          if (elLastChild && el === evt.target) {
            target = elLastChild;
          }
          if (target) {
            targetRect = getRect(target);
          }
          if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, !!target) !== false) {
            capture();
            if (elLastChild && elLastChild.nextSibling) {
              el.insertBefore(dragEl, elLastChild.nextSibling);
            } else {
              el.appendChild(dragEl);
            }
            parentEl = el;
            changed();
            return completed(true);
          }
        } else if (elLastChild && _ghostIsFirst(evt, vertical, this)) {
          var firstChild = getChild(el, 0, options, true);
          if (firstChild === dragEl) {
            return completed(false);
          }
          target = firstChild;
          targetRect = getRect(target);
          if (_onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, false) !== false) {
            capture();
            el.insertBefore(dragEl, firstChild);
            parentEl = el;
            changed();
            return completed(true);
          }
        } else if (target.parentNode === el) {
          targetRect = getRect(target);
          var direction = 0, targetBeforeFirstSwap, differentLevel = dragEl.parentNode !== el, differentRowCol = !_dragElInRowColumn(dragEl.animated && dragEl.toRect || dragRect, target.animated && target.toRect || targetRect, vertical), side1 = vertical ? "top" : "left", scrolledPastTop = isScrolledPast(target, "top", "top") || isScrolledPast(dragEl, "top", "top"), scrollBefore = scrolledPastTop ? scrolledPastTop.scrollTop : void 0;
          if (lastTarget !== target) {
            targetBeforeFirstSwap = targetRect[side1];
            pastFirstInvertThresh = false;
            isCircumstantialInvert = !differentRowCol && options.invertSwap || differentLevel;
          }
          direction = _getSwapDirection(evt, target, targetRect, vertical, differentRowCol ? 1 : options.swapThreshold, options.invertedSwapThreshold == null ? options.swapThreshold : options.invertedSwapThreshold, isCircumstantialInvert, lastTarget === target);
          var sibling;
          if (direction !== 0) {
            var dragIndex = index(dragEl);
            do {
              dragIndex -= direction;
              sibling = parentEl.children[dragIndex];
            } while (sibling && (css(sibling, "display") === "none" || sibling === ghostEl));
          }
          if (direction === 0 || sibling === target) {
            return completed(false);
          }
          lastTarget = target;
          lastDirection = direction;
          var nextSibling = target.nextElementSibling, after = false;
          after = direction === 1;
          var moveVector = _onMove(rootEl, el, dragEl, dragRect, target, targetRect, evt, after);
          if (moveVector !== false) {
            if (moveVector === 1 || moveVector === -1) {
              after = moveVector === 1;
            }
            _silent = true;
            setTimeout(_unsilent, 30);
            capture();
            if (after && !nextSibling) {
              el.appendChild(dragEl);
            } else {
              target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
            }
            if (scrolledPastTop) {
              scrollBy(scrolledPastTop, 0, scrollBefore - scrolledPastTop.scrollTop);
            }
            parentEl = dragEl.parentNode;
            if (targetBeforeFirstSwap !== void 0 && !isCircumstantialInvert) {
              targetMoveDistance = Math.abs(targetBeforeFirstSwap - getRect(target)[side1]);
            }
            changed();
            return completed(true);
          }
        }
        if (el.contains(dragEl)) {
          return completed(false);
        }
      }
      return false;
    },
    _ignoreWhileAnimating: null,
    _offMoveEvents: function _offMoveEvents() {
      off(document, "mousemove", this._onTouchMove);
      off(document, "touchmove", this._onTouchMove);
      off(document, "pointermove", this._onTouchMove);
      off(document, "dragover", nearestEmptyInsertDetectEvent);
      off(document, "mousemove", nearestEmptyInsertDetectEvent);
      off(document, "touchmove", nearestEmptyInsertDetectEvent);
    },
    _offUpEvents: function _offUpEvents() {
      var ownerDocument = this.el.ownerDocument;
      off(ownerDocument, "mouseup", this._onDrop);
      off(ownerDocument, "touchend", this._onDrop);
      off(ownerDocument, "pointerup", this._onDrop);
      off(ownerDocument, "touchcancel", this._onDrop);
      off(document, "selectstart", this);
    },
    _onDrop: function _onDrop(evt) {
      var el = this.el, options = this.options;
      newIndex = index(dragEl);
      newDraggableIndex = index(dragEl, options.draggable);
      pluginEvent2("drop", this, {
        evt
      });
      parentEl = dragEl && dragEl.parentNode;
      newIndex = index(dragEl);
      newDraggableIndex = index(dragEl, options.draggable);
      if (Sortable.eventCanceled) {
        this._nulling();
        return;
      }
      awaitingDragStarted = false;
      isCircumstantialInvert = false;
      pastFirstInvertThresh = false;
      clearInterval(this._loopId);
      clearTimeout(this._dragStartTimer);
      _cancelNextTick(this.cloneId);
      _cancelNextTick(this._dragStartId);
      if (this.nativeDraggable) {
        off(document, "drop", this);
        off(el, "dragstart", this._onDragStart);
      }
      this._offMoveEvents();
      this._offUpEvents();
      if (Safari) {
        css(document.body, "user-select", "");
      }
      css(dragEl, "transform", "");
      if (evt) {
        if (moved) {
          evt.cancelable && evt.preventDefault();
          !options.dropBubble && evt.stopPropagation();
        }
        ghostEl && ghostEl.parentNode && ghostEl.parentNode.removeChild(ghostEl);
        if (rootEl === parentEl || putSortable && putSortable.lastPutMode !== "clone") {
          cloneEl && cloneEl.parentNode && cloneEl.parentNode.removeChild(cloneEl);
        }
        if (dragEl) {
          if (this.nativeDraggable) {
            off(dragEl, "dragend", this);
          }
          _disableDraggable(dragEl);
          dragEl.style["will-change"] = "";
          if (moved && !awaitingDragStarted) {
            toggleClass(dragEl, putSortable ? putSortable.options.ghostClass : this.options.ghostClass, false);
          }
          toggleClass(dragEl, this.options.chosenClass, false);
          _dispatchEvent({
            sortable: this,
            name: "unchoose",
            toEl: parentEl,
            newIndex: null,
            newDraggableIndex: null,
            originalEvent: evt
          });
          if (rootEl !== parentEl) {
            if (newIndex >= 0) {
              _dispatchEvent({
                rootEl: parentEl,
                name: "add",
                toEl: parentEl,
                fromEl: rootEl,
                originalEvent: evt
              });
              _dispatchEvent({
                sortable: this,
                name: "remove",
                toEl: parentEl,
                originalEvent: evt
              });
              _dispatchEvent({
                rootEl: parentEl,
                name: "sort",
                toEl: parentEl,
                fromEl: rootEl,
                originalEvent: evt
              });
              _dispatchEvent({
                sortable: this,
                name: "sort",
                toEl: parentEl,
                originalEvent: evt
              });
            }
            putSortable && putSortable.save();
          } else {
            if (newIndex !== oldIndex) {
              if (newIndex >= 0) {
                _dispatchEvent({
                  sortable: this,
                  name: "update",
                  toEl: parentEl,
                  originalEvent: evt
                });
                _dispatchEvent({
                  sortable: this,
                  name: "sort",
                  toEl: parentEl,
                  originalEvent: evt
                });
              }
            }
          }
          if (Sortable.active) {
            if (newIndex == null || newIndex === -1) {
              newIndex = oldIndex;
              newDraggableIndex = oldDraggableIndex;
            }
            _dispatchEvent({
              sortable: this,
              name: "end",
              toEl: parentEl,
              originalEvent: evt
            });
            this.save();
          }
        }
      }
      this._nulling();
    },
    _nulling: function _nulling() {
      pluginEvent2("nulling", this);
      rootEl = dragEl = parentEl = ghostEl = nextEl = cloneEl = lastDownEl = cloneHidden = tapEvt = touchEvt = moved = newIndex = newDraggableIndex = oldIndex = oldDraggableIndex = lastTarget = lastDirection = putSortable = activeGroup = Sortable.dragged = Sortable.ghost = Sortable.clone = Sortable.active = null;
      savedInputChecked.forEach(function(el) {
        el.checked = true;
      });
      savedInputChecked.length = lastDx = lastDy = 0;
    },
    handleEvent: function handleEvent(evt) {
      switch (evt.type) {
        case "drop":
        case "dragend":
          this._onDrop(evt);
          break;
        case "dragenter":
        case "dragover":
          if (dragEl) {
            this._onDragOver(evt);
            _globalDragOver(evt);
          }
          break;
        case "selectstart":
          evt.preventDefault();
          break;
      }
    },
    /**
     * Serializes the item into an array of string.
     * @returns {String[]}
     */
    toArray: function toArray() {
      var order = [], el, children = this.el.children, i = 0, n = children.length, options = this.options;
      for (; i < n; i++) {
        el = children[i];
        if (closest(el, options.draggable, this.el, false)) {
          order.push(el.getAttribute(options.dataIdAttr) || _generateId(el));
        }
      }
      return order;
    },
    /**
     * Sorts the elements according to the array.
     * @param  {String[]}  order  order of the items
     */
    sort: function sort(order, useAnimation) {
      var items = {}, rootEl2 = this.el;
      this.toArray().forEach(function(id, i) {
        var el = rootEl2.children[i];
        if (closest(el, this.options.draggable, rootEl2, false)) {
          items[id] = el;
        }
      }, this);
      useAnimation && this.captureAnimationState();
      order.forEach(function(id) {
        if (items[id]) {
          rootEl2.removeChild(items[id]);
          rootEl2.appendChild(items[id]);
        }
      });
      useAnimation && this.animateAll();
    },
    /**
     * Save the current sorting
     */
    save: function save() {
      var store = this.options.store;
      store && store.set && store.set(this);
    },
    /**
     * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
     * @param   {HTMLElement}  el
     * @param   {String}       [selector]  default: `options.draggable`
     * @returns {HTMLElement|null}
     */
    closest: function closest$1(el, selector) {
      return closest(el, selector || this.options.draggable, this.el, false);
    },
    /**
     * Set/get option
     * @param   {string} name
     * @param   {*}      [value]
     * @returns {*}
     */
    option: function option(name, value) {
      var options = this.options;
      if (value === void 0) {
        return options[name];
      } else {
        var modifiedValue = PluginManager.modifyOption(this, name, value);
        if (typeof modifiedValue !== "undefined") {
          options[name] = modifiedValue;
        } else {
          options[name] = value;
        }
        if (name === "group") {
          _prepareGroup(options);
        }
      }
    },
    /**
     * Destroy
     */
    destroy: function destroy() {
      pluginEvent2("destroy", this);
      var el = this.el;
      el[expando] = null;
      off(el, "mousedown", this._onTapStart);
      off(el, "touchstart", this._onTapStart);
      off(el, "pointerdown", this._onTapStart);
      if (this.nativeDraggable) {
        off(el, "dragover", this);
        off(el, "dragenter", this);
      }
      Array.prototype.forEach.call(el.querySelectorAll("[draggable]"), function(el2) {
        el2.removeAttribute("draggable");
      });
      this._onDrop();
      this._disableDelayedDragEvents();
      sortables.splice(sortables.indexOf(this.el), 1);
      this.el = el = null;
    },
    _hideClone: function _hideClone() {
      if (!cloneHidden) {
        pluginEvent2("hideClone", this);
        if (Sortable.eventCanceled)
          return;
        css(cloneEl, "display", "none");
        if (this.options.removeCloneOnHide && cloneEl.parentNode) {
          cloneEl.parentNode.removeChild(cloneEl);
        }
        cloneHidden = true;
      }
    },
    _showClone: function _showClone(putSortable2) {
      if (putSortable2.lastPutMode !== "clone") {
        this._hideClone();
        return;
      }
      if (cloneHidden) {
        pluginEvent2("showClone", this);
        if (Sortable.eventCanceled)
          return;
        if (dragEl.parentNode == rootEl && !this.options.group.revertClone) {
          rootEl.insertBefore(cloneEl, dragEl);
        } else if (nextEl) {
          rootEl.insertBefore(cloneEl, nextEl);
        } else {
          rootEl.appendChild(cloneEl);
        }
        if (this.options.group.revertClone) {
          this.animate(dragEl, cloneEl);
        }
        css(cloneEl, "display", "");
        cloneHidden = false;
      }
    }
  };
  function _globalDragOver(evt) {
    if (evt.dataTransfer) {
      evt.dataTransfer.dropEffect = "move";
    }
    evt.cancelable && evt.preventDefault();
  }
  function _onMove(fromEl, toEl, dragEl2, dragRect, targetEl, targetRect, originalEvent, willInsertAfter) {
    var evt, sortable = fromEl[expando], onMoveFn = sortable.options.onMove, retVal;
    if (window.CustomEvent && !IE11OrLess && !Edge) {
      evt = new CustomEvent("move", {
        bubbles: true,
        cancelable: true
      });
    } else {
      evt = document.createEvent("Event");
      evt.initEvent("move", true, true);
    }
    evt.to = toEl;
    evt.from = fromEl;
    evt.dragged = dragEl2;
    evt.draggedRect = dragRect;
    evt.related = targetEl || toEl;
    evt.relatedRect = targetRect || getRect(toEl);
    evt.willInsertAfter = willInsertAfter;
    evt.originalEvent = originalEvent;
    fromEl.dispatchEvent(evt);
    if (onMoveFn) {
      retVal = onMoveFn.call(sortable, evt, originalEvent);
    }
    return retVal;
  }
  function _disableDraggable(el) {
    el.draggable = false;
  }
  function _unsilent() {
    _silent = false;
  }
  function _ghostIsFirst(evt, vertical, sortable) {
    var firstElRect = getRect(getChild(sortable.el, 0, sortable.options, true));
    var sortableContentRect = getContentRect(sortable.el);
    var spacer = 10;
    return vertical ? evt.clientX < sortableContentRect.left - spacer || evt.clientY < firstElRect.top && evt.clientX < firstElRect.right : evt.clientY < sortableContentRect.top - spacer || evt.clientY < firstElRect.bottom && evt.clientX < firstElRect.left;
  }
  function _ghostIsLast(evt, vertical, sortable) {
    var lastElRect = getRect(lastChild(sortable.el, sortable.options.draggable));
    var sortableContentRect = getContentRect(sortable.el);
    var spacer = 10;
    return vertical ? evt.clientX > sortableContentRect.right + spacer || evt.clientY > lastElRect.bottom && evt.clientX > lastElRect.left : evt.clientY > sortableContentRect.bottom + spacer || evt.clientX > lastElRect.right && evt.clientY > lastElRect.top;
  }
  function _getSwapDirection(evt, target, targetRect, vertical, swapThreshold, invertedSwapThreshold, invertSwap, isLastTarget) {
    var mouseOnAxis = vertical ? evt.clientY : evt.clientX, targetLength = vertical ? targetRect.height : targetRect.width, targetS1 = vertical ? targetRect.top : targetRect.left, targetS2 = vertical ? targetRect.bottom : targetRect.right, invert = false;
    if (!invertSwap) {
      if (isLastTarget && targetMoveDistance < targetLength * swapThreshold) {
        if (!pastFirstInvertThresh && (lastDirection === 1 ? mouseOnAxis > targetS1 + targetLength * invertedSwapThreshold / 2 : mouseOnAxis < targetS2 - targetLength * invertedSwapThreshold / 2)) {
          pastFirstInvertThresh = true;
        }
        if (!pastFirstInvertThresh) {
          if (lastDirection === 1 ? mouseOnAxis < targetS1 + targetMoveDistance : mouseOnAxis > targetS2 - targetMoveDistance) {
            return -lastDirection;
          }
        } else {
          invert = true;
        }
      } else {
        if (mouseOnAxis > targetS1 + targetLength * (1 - swapThreshold) / 2 && mouseOnAxis < targetS2 - targetLength * (1 - swapThreshold) / 2) {
          return _getInsertDirection(target);
        }
      }
    }
    invert = invert || invertSwap;
    if (invert) {
      if (mouseOnAxis < targetS1 + targetLength * invertedSwapThreshold / 2 || mouseOnAxis > targetS2 - targetLength * invertedSwapThreshold / 2) {
        return mouseOnAxis > targetS1 + targetLength / 2 ? 1 : -1;
      }
    }
    return 0;
  }
  function _getInsertDirection(target) {
    if (index(dragEl) < index(target)) {
      return 1;
    } else {
      return -1;
    }
  }
  function _generateId(el) {
    var str = el.tagName + el.className + el.src + el.href + el.textContent, i = str.length, sum = 0;
    while (i--) {
      sum += str.charCodeAt(i);
    }
    return sum.toString(36);
  }
  function _saveInputCheckedState(root) {
    savedInputChecked.length = 0;
    var inputs = root.getElementsByTagName("input");
    var idx = inputs.length;
    while (idx--) {
      var el = inputs[idx];
      el.checked && savedInputChecked.push(el);
    }
  }
  function _nextTick(fn) {
    return setTimeout(fn, 0);
  }
  function _cancelNextTick(id) {
    return clearTimeout(id);
  }
  if (documentExists) {
    on(document, "touchmove", function(evt) {
      if ((Sortable.active || awaitingDragStarted) && evt.cancelable) {
        evt.preventDefault();
      }
    });
  }
  Sortable.utils = {
    on,
    off,
    css,
    find,
    is: function is(el, selector) {
      return !!closest(el, selector, el, false);
    },
    extend,
    throttle,
    closest,
    toggleClass,
    clone,
    index,
    nextTick: _nextTick,
    cancelNextTick: _cancelNextTick,
    detectDirection: _detectDirection,
    getChild
  };
  Sortable.get = function(element) {
    return element[expando];
  };
  Sortable.mount = function() {
    for (var _len = arguments.length, plugins2 = new Array(_len), _key = 0; _key < _len; _key++) {
      plugins2[_key] = arguments[_key];
    }
    if (plugins2[0].constructor === Array)
      plugins2 = plugins2[0];
    plugins2.forEach(function(plugin) {
      if (!plugin.prototype || !plugin.prototype.constructor) {
        throw "Sortable: Mounted plugin must be a constructor function, not ".concat({}.toString.call(plugin));
      }
      if (plugin.utils)
        Sortable.utils = _objectSpread2(_objectSpread2({}, Sortable.utils), plugin.utils);
      PluginManager.mount(plugin);
    });
  };
  Sortable.create = function(el, options) {
    return new Sortable(el, options);
  };
  Sortable.version = version;
  var autoScrolls = [];
  var scrollEl;
  var scrollRootEl;
  var scrolling = false;
  var lastAutoScrollX;
  var lastAutoScrollY;
  var touchEvt$1;
  var pointerElemChangedInterval;
  function AutoScrollPlugin() {
    function AutoScroll() {
      this.defaults = {
        scroll: true,
        forceAutoScrollFallback: false,
        scrollSensitivity: 30,
        scrollSpeed: 10,
        bubbleScroll: true
      };
      for (var fn in this) {
        if (fn.charAt(0) === "_" && typeof this[fn] === "function") {
          this[fn] = this[fn].bind(this);
        }
      }
    }
    AutoScroll.prototype = {
      dragStarted: function dragStarted(_ref) {
        var originalEvent = _ref.originalEvent;
        if (this.sortable.nativeDraggable) {
          on(document, "dragover", this._handleAutoScroll);
        } else {
          if (this.options.supportPointer) {
            on(document, "pointermove", this._handleFallbackAutoScroll);
          } else if (originalEvent.touches) {
            on(document, "touchmove", this._handleFallbackAutoScroll);
          } else {
            on(document, "mousemove", this._handleFallbackAutoScroll);
          }
        }
      },
      dragOverCompleted: function dragOverCompleted(_ref2) {
        var originalEvent = _ref2.originalEvent;
        if (!this.options.dragOverBubble && !originalEvent.rootEl) {
          this._handleAutoScroll(originalEvent);
        }
      },
      drop: function drop3() {
        if (this.sortable.nativeDraggable) {
          off(document, "dragover", this._handleAutoScroll);
        } else {
          off(document, "pointermove", this._handleFallbackAutoScroll);
          off(document, "touchmove", this._handleFallbackAutoScroll);
          off(document, "mousemove", this._handleFallbackAutoScroll);
        }
        clearPointerElemChangedInterval();
        clearAutoScrolls();
        cancelThrottle();
      },
      nulling: function nulling() {
        touchEvt$1 = scrollRootEl = scrollEl = scrolling = pointerElemChangedInterval = lastAutoScrollX = lastAutoScrollY = null;
        autoScrolls.length = 0;
      },
      _handleFallbackAutoScroll: function _handleFallbackAutoScroll(evt) {
        this._handleAutoScroll(evt, true);
      },
      _handleAutoScroll: function _handleAutoScroll(evt, fallback) {
        var _this = this;
        var x = (evt.touches ? evt.touches[0] : evt).clientX, y = (evt.touches ? evt.touches[0] : evt).clientY, elem = document.elementFromPoint(x, y);
        touchEvt$1 = evt;
        if (fallback || this.options.forceAutoScrollFallback || Edge || IE11OrLess || Safari) {
          autoScroll(evt, this.options, elem, fallback);
          var ogElemScroller = getParentAutoScrollElement(elem, true);
          if (scrolling && (!pointerElemChangedInterval || x !== lastAutoScrollX || y !== lastAutoScrollY)) {
            pointerElemChangedInterval && clearPointerElemChangedInterval();
            pointerElemChangedInterval = setInterval(function() {
              var newElem = getParentAutoScrollElement(document.elementFromPoint(x, y), true);
              if (newElem !== ogElemScroller) {
                ogElemScroller = newElem;
                clearAutoScrolls();
              }
              autoScroll(evt, _this.options, newElem, fallback);
            }, 10);
            lastAutoScrollX = x;
            lastAutoScrollY = y;
          }
        } else {
          if (!this.options.bubbleScroll || getParentAutoScrollElement(elem, true) === getWindowScrollingElement()) {
            clearAutoScrolls();
            return;
          }
          autoScroll(evt, this.options, getParentAutoScrollElement(elem, false), false);
        }
      }
    };
    return _extends(AutoScroll, {
      pluginName: "scroll",
      initializeByDefault: true
    });
  }
  function clearAutoScrolls() {
    autoScrolls.forEach(function(autoScroll2) {
      clearInterval(autoScroll2.pid);
    });
    autoScrolls = [];
  }
  function clearPointerElemChangedInterval() {
    clearInterval(pointerElemChangedInterval);
  }
  var autoScroll = throttle(function(evt, options, rootEl2, isFallback) {
    if (!options.scroll)
      return;
    var x = (evt.touches ? evt.touches[0] : evt).clientX, y = (evt.touches ? evt.touches[0] : evt).clientY, sens = options.scrollSensitivity, speed = options.scrollSpeed, winScroller = getWindowScrollingElement();
    var scrollThisInstance = false, scrollCustomFn;
    if (scrollRootEl !== rootEl2) {
      scrollRootEl = rootEl2;
      clearAutoScrolls();
      scrollEl = options.scroll;
      scrollCustomFn = options.scrollFn;
      if (scrollEl === true) {
        scrollEl = getParentAutoScrollElement(rootEl2, true);
      }
    }
    var layersOut = 0;
    var currentParent = scrollEl;
    do {
      var el = currentParent, rect = getRect(el), top = rect.top, bottom = rect.bottom, left = rect.left, right = rect.right, width = rect.width, height = rect.height, canScrollX = void 0, canScrollY = void 0, scrollWidth = el.scrollWidth, scrollHeight = el.scrollHeight, elCSS = css(el), scrollPosX = el.scrollLeft, scrollPosY = el.scrollTop;
      if (el === winScroller) {
        canScrollX = width < scrollWidth && (elCSS.overflowX === "auto" || elCSS.overflowX === "scroll" || elCSS.overflowX === "visible");
        canScrollY = height < scrollHeight && (elCSS.overflowY === "auto" || elCSS.overflowY === "scroll" || elCSS.overflowY === "visible");
      } else {
        canScrollX = width < scrollWidth && (elCSS.overflowX === "auto" || elCSS.overflowX === "scroll");
        canScrollY = height < scrollHeight && (elCSS.overflowY === "auto" || elCSS.overflowY === "scroll");
      }
      var vx = canScrollX && (Math.abs(right - x) <= sens && scrollPosX + width < scrollWidth) - (Math.abs(left - x) <= sens && !!scrollPosX);
      var vy = canScrollY && (Math.abs(bottom - y) <= sens && scrollPosY + height < scrollHeight) - (Math.abs(top - y) <= sens && !!scrollPosY);
      if (!autoScrolls[layersOut]) {
        for (var i = 0; i <= layersOut; i++) {
          if (!autoScrolls[i]) {
            autoScrolls[i] = {};
          }
        }
      }
      if (autoScrolls[layersOut].vx != vx || autoScrolls[layersOut].vy != vy || autoScrolls[layersOut].el !== el) {
        autoScrolls[layersOut].el = el;
        autoScrolls[layersOut].vx = vx;
        autoScrolls[layersOut].vy = vy;
        clearInterval(autoScrolls[layersOut].pid);
        if (vx != 0 || vy != 0) {
          scrollThisInstance = true;
          autoScrolls[layersOut].pid = setInterval(function() {
            if (isFallback && this.layer === 0) {
              Sortable.active._onTouchMove(touchEvt$1);
            }
            var scrollOffsetY = autoScrolls[this.layer].vy ? autoScrolls[this.layer].vy * speed : 0;
            var scrollOffsetX = autoScrolls[this.layer].vx ? autoScrolls[this.layer].vx * speed : 0;
            if (typeof scrollCustomFn === "function") {
              if (scrollCustomFn.call(Sortable.dragged.parentNode[expando], scrollOffsetX, scrollOffsetY, evt, touchEvt$1, autoScrolls[this.layer].el) !== "continue") {
                return;
              }
            }
            scrollBy(autoScrolls[this.layer].el, scrollOffsetX, scrollOffsetY);
          }.bind({
            layer: layersOut
          }), 24);
        }
      }
      layersOut++;
    } while (options.bubbleScroll && currentParent !== winScroller && (currentParent = getParentAutoScrollElement(currentParent, false)));
    scrolling = scrollThisInstance;
  }, 30);
  var drop = function drop2(_ref) {
    var originalEvent = _ref.originalEvent, putSortable2 = _ref.putSortable, dragEl2 = _ref.dragEl, activeSortable = _ref.activeSortable, dispatchSortableEvent = _ref.dispatchSortableEvent, hideGhostForTarget = _ref.hideGhostForTarget, unhideGhostForTarget = _ref.unhideGhostForTarget;
    if (!originalEvent)
      return;
    var toSortable = putSortable2 || activeSortable;
    hideGhostForTarget();
    var touch = originalEvent.changedTouches && originalEvent.changedTouches.length ? originalEvent.changedTouches[0] : originalEvent;
    var target = document.elementFromPoint(touch.clientX, touch.clientY);
    unhideGhostForTarget();
    if (toSortable && !toSortable.el.contains(target)) {
      dispatchSortableEvent("spill");
      this.onSpill({
        dragEl: dragEl2,
        putSortable: putSortable2
      });
    }
  };
  function Revert() {
  }
  Revert.prototype = {
    startIndex: null,
    dragStart: function dragStart(_ref2) {
      var oldDraggableIndex2 = _ref2.oldDraggableIndex;
      this.startIndex = oldDraggableIndex2;
    },
    onSpill: function onSpill(_ref3) {
      var dragEl2 = _ref3.dragEl, putSortable2 = _ref3.putSortable;
      this.sortable.captureAnimationState();
      if (putSortable2) {
        putSortable2.captureAnimationState();
      }
      var nextSibling = getChild(this.sortable.el, this.startIndex, this.options);
      if (nextSibling) {
        this.sortable.el.insertBefore(dragEl2, nextSibling);
      } else {
        this.sortable.el.appendChild(dragEl2);
      }
      this.sortable.animateAll();
      if (putSortable2) {
        putSortable2.animateAll();
      }
    },
    drop
  };
  _extends(Revert, {
    pluginName: "revertOnSpill"
  });
  function Remove() {
  }
  Remove.prototype = {
    onSpill: function onSpill2(_ref4) {
      var dragEl2 = _ref4.dragEl, putSortable2 = _ref4.putSortable;
      var parentSortable = putSortable2 || this.sortable;
      parentSortable.captureAnimationState();
      dragEl2.parentNode && dragEl2.parentNode.removeChild(dragEl2);
      parentSortable.animateAll();
    },
    drop
  };
  _extends(Remove, {
    pluginName: "removeOnSpill"
  });
  Sortable.mount(new AutoScrollPlugin());
  Sortable.mount(Remove, Revert);
  var sortable_esm_default = Sortable;

  // packages/support/resources/js/sortable.js
  window.Sortable = sortable_esm_default;
  var sortable_default = (Alpine) => {
    Alpine.directive("sortable", (el) => {
      let animation = parseInt(el.dataset?.sortableAnimationDuration);
      if (animation !== 0 && !animation) {
        animation = 300;
      }
      el.sortable = sortable_esm_default.create(el, {
        draggable: "[x-sortable-item]",
        handle: "[x-sortable-handle]",
        dataIdAttr: "x-sortable-item",
        animation,
        ghostClass: "fi-sortable-ghost"
      });
    });
  };

  // node_modules/@ryangjchandler/alpine-tooltip/dist/module.esm.js
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
  var __commonJS = (callback, module) => () => {
    if (!module) {
      module = { exports: {} };
      callback(module.exports, module);
    }
    return module.exports;
  };
  var __exportStar = (target, module, desc) => {
    if (module && typeof module === "object" || typeof module === "function") {
      for (let key of __getOwnPropNames(module))
        if (!__hasOwnProp.call(target, key) && key !== "default")
          __defProp(target, key, { get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable });
    }
    return target;
  };
  var __toModule = (module) => {
    return __exportStar(__markAsModule(__defProp(module != null ? __create(__getProtoOf(module)) : {}, "default", module && module.__esModule && "default" in module ? { get: () => module.default, enumerable: true } : { value: module, enumerable: true })), module);
  };
  var require_popper = __commonJS((exports) => {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getBoundingClientRect2(element) {
      var rect = element.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        x: rect.left,
        y: rect.top
      };
    }
    function getWindow2(node) {
      if (node == null) {
        return window;
      }
      if (node.toString() !== "[object Window]") {
        var ownerDocument = node.ownerDocument;
        return ownerDocument ? ownerDocument.defaultView || window : window;
      }
      return node;
    }
    function getWindowScroll(node) {
      var win = getWindow2(node);
      var scrollLeft = win.pageXOffset;
      var scrollTop = win.pageYOffset;
      return {
        scrollLeft,
        scrollTop
      };
    }
    function isElement2(node) {
      var OwnElement = getWindow2(node).Element;
      return node instanceof OwnElement || node instanceof Element;
    }
    function isHTMLElement2(node) {
      var OwnElement = getWindow2(node).HTMLElement;
      return node instanceof OwnElement || node instanceof HTMLElement;
    }
    function isShadowRoot2(node) {
      if (typeof ShadowRoot === "undefined") {
        return false;
      }
      var OwnElement = getWindow2(node).ShadowRoot;
      return node instanceof OwnElement || node instanceof ShadowRoot;
    }
    function getHTMLElementScroll(element) {
      return {
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop
      };
    }
    function getNodeScroll2(node) {
      if (node === getWindow2(node) || !isHTMLElement2(node)) {
        return getWindowScroll(node);
      } else {
        return getHTMLElementScroll(node);
      }
    }
    function getNodeName2(element) {
      return element ? (element.nodeName || "").toLowerCase() : null;
    }
    function getDocumentElement2(element) {
      return ((isElement2(element) ? element.ownerDocument : element.document) || window.document).documentElement;
    }
    function getWindowScrollBarX2(element) {
      return getBoundingClientRect2(getDocumentElement2(element)).left + getWindowScroll(element).scrollLeft;
    }
    function getComputedStyle2(element) {
      return getWindow2(element).getComputedStyle(element);
    }
    function isScrollParent(element) {
      var _getComputedStyle = getComputedStyle2(element), overflow = _getComputedStyle.overflow, overflowX = _getComputedStyle.overflowX, overflowY = _getComputedStyle.overflowY;
      return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
    }
    function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
      if (isFixed === void 0) {
        isFixed = false;
      }
      var documentElement = getDocumentElement2(offsetParent);
      var rect = getBoundingClientRect2(elementOrVirtualElement);
      var isOffsetParentAnElement = isHTMLElement2(offsetParent);
      var scroll = {
        scrollLeft: 0,
        scrollTop: 0
      };
      var offsets = {
        x: 0,
        y: 0
      };
      if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
        if (getNodeName2(offsetParent) !== "body" || isScrollParent(documentElement)) {
          scroll = getNodeScroll2(offsetParent);
        }
        if (isHTMLElement2(offsetParent)) {
          offsets = getBoundingClientRect2(offsetParent);
          offsets.x += offsetParent.clientLeft;
          offsets.y += offsetParent.clientTop;
        } else if (documentElement) {
          offsets.x = getWindowScrollBarX2(documentElement);
        }
      }
      return {
        x: rect.left + scroll.scrollLeft - offsets.x,
        y: rect.top + scroll.scrollTop - offsets.y,
        width: rect.width,
        height: rect.height
      };
    }
    function getLayoutRect(element) {
      var clientRect = getBoundingClientRect2(element);
      var width = element.offsetWidth;
      var height = element.offsetHeight;
      if (Math.abs(clientRect.width - width) <= 1) {
        width = clientRect.width;
      }
      if (Math.abs(clientRect.height - height) <= 1) {
        height = clientRect.height;
      }
      return {
        x: element.offsetLeft,
        y: element.offsetTop,
        width,
        height
      };
    }
    function getParentNode2(element) {
      if (getNodeName2(element) === "html") {
        return element;
      }
      return element.assignedSlot || element.parentNode || (isShadowRoot2(element) ? element.host : null) || getDocumentElement2(element);
    }
    function getScrollParent(node) {
      if (["html", "body", "#document"].indexOf(getNodeName2(node)) >= 0) {
        return node.ownerDocument.body;
      }
      if (isHTMLElement2(node) && isScrollParent(node)) {
        return node;
      }
      return getScrollParent(getParentNode2(node));
    }
    function listScrollParents(element, list) {
      var _element$ownerDocumen;
      if (list === void 0) {
        list = [];
      }
      var scrollParent = getScrollParent(element);
      var isBody = scrollParent === ((_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body);
      var win = getWindow2(scrollParent);
      var target = isBody ? [win].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
      var updatedList = list.concat(target);
      return isBody ? updatedList : updatedList.concat(listScrollParents(getParentNode2(target)));
    }
    function isTableElement2(element) {
      return ["table", "td", "th"].indexOf(getNodeName2(element)) >= 0;
    }
    function getTrueOffsetParent2(element) {
      if (!isHTMLElement2(element) || getComputedStyle2(element).position === "fixed") {
        return null;
      }
      return element.offsetParent;
    }
    function getContainingBlock2(element) {
      var isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") !== -1;
      var isIE = navigator.userAgent.indexOf("Trident") !== -1;
      if (isIE && isHTMLElement2(element)) {
        var elementCss = getComputedStyle2(element);
        if (elementCss.position === "fixed") {
          return null;
        }
      }
      var currentNode = getParentNode2(element);
      while (isHTMLElement2(currentNode) && ["html", "body"].indexOf(getNodeName2(currentNode)) < 0) {
        var css2 = getComputedStyle2(currentNode);
        if (css2.transform !== "none" || css2.perspective !== "none" || css2.contain === "paint" || ["transform", "perspective"].indexOf(css2.willChange) !== -1 || isFirefox && css2.willChange === "filter" || isFirefox && css2.filter && css2.filter !== "none") {
          return currentNode;
        } else {
          currentNode = currentNode.parentNode;
        }
      }
      return null;
    }
    function getOffsetParent2(element) {
      var window2 = getWindow2(element);
      var offsetParent = getTrueOffsetParent2(element);
      while (offsetParent && isTableElement2(offsetParent) && getComputedStyle2(offsetParent).position === "static") {
        offsetParent = getTrueOffsetParent2(offsetParent);
      }
      if (offsetParent && (getNodeName2(offsetParent) === "html" || getNodeName2(offsetParent) === "body" && getComputedStyle2(offsetParent).position === "static")) {
        return window2;
      }
      return offsetParent || getContainingBlock2(element) || window2;
    }
    var top = "top";
    var bottom = "bottom";
    var right = "right";
    var left = "left";
    var auto = "auto";
    var basePlacements = [top, bottom, right, left];
    var start = "start";
    var end = "end";
    var clippingParents = "clippingParents";
    var viewport = "viewport";
    var popper = "popper";
    var reference = "reference";
    var variationPlacements = /* @__PURE__ */ basePlacements.reduce(function(acc, placement) {
      return acc.concat([placement + "-" + start, placement + "-" + end]);
    }, []);
    var placements = /* @__PURE__ */ [].concat(basePlacements, [auto]).reduce(function(acc, placement) {
      return acc.concat([placement, placement + "-" + start, placement + "-" + end]);
    }, []);
    var beforeRead = "beforeRead";
    var read = "read";
    var afterRead = "afterRead";
    var beforeMain = "beforeMain";
    var main = "main";
    var afterMain = "afterMain";
    var beforeWrite = "beforeWrite";
    var write = "write";
    var afterWrite = "afterWrite";
    var modifierPhases = [beforeRead, read, afterRead, beforeMain, main, afterMain, beforeWrite, write, afterWrite];
    function order(modifiers) {
      var map = /* @__PURE__ */ new Map();
      var visited = /* @__PURE__ */ new Set();
      var result = [];
      modifiers.forEach(function(modifier) {
        map.set(modifier.name, modifier);
      });
      function sort2(modifier) {
        visited.add(modifier.name);
        var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
        requires.forEach(function(dep) {
          if (!visited.has(dep)) {
            var depModifier = map.get(dep);
            if (depModifier) {
              sort2(depModifier);
            }
          }
        });
        result.push(modifier);
      }
      modifiers.forEach(function(modifier) {
        if (!visited.has(modifier.name)) {
          sort2(modifier);
        }
      });
      return result;
    }
    function orderModifiers(modifiers) {
      var orderedModifiers = order(modifiers);
      return modifierPhases.reduce(function(acc, phase) {
        return acc.concat(orderedModifiers.filter(function(modifier) {
          return modifier.phase === phase;
        }));
      }, []);
    }
    function debounce(fn) {
      var pending;
      return function() {
        if (!pending) {
          pending = new Promise(function(resolve) {
            Promise.resolve().then(function() {
              pending = void 0;
              resolve(fn());
            });
          });
        }
        return pending;
      };
    }
    function format(str) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      return [].concat(args).reduce(function(p, c) {
        return p.replace(/%s/, c);
      }, str);
    }
    var INVALID_MODIFIER_ERROR = 'Popper: modifier "%s" provided an invalid %s property, expected %s but got %s';
    var MISSING_DEPENDENCY_ERROR = 'Popper: modifier "%s" requires "%s", but "%s" modifier is not available';
    var VALID_PROPERTIES = ["name", "enabled", "phase", "fn", "effect", "requires", "options"];
    function validateModifiers(modifiers) {
      modifiers.forEach(function(modifier) {
        Object.keys(modifier).forEach(function(key) {
          switch (key) {
            case "name":
              if (typeof modifier.name !== "string") {
                console.error(format(INVALID_MODIFIER_ERROR, String(modifier.name), '"name"', '"string"', '"' + String(modifier.name) + '"'));
              }
              break;
            case "enabled":
              if (typeof modifier.enabled !== "boolean") {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"enabled"', '"boolean"', '"' + String(modifier.enabled) + '"'));
              }
            case "phase":
              if (modifierPhases.indexOf(modifier.phase) < 0) {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"phase"', "either " + modifierPhases.join(", "), '"' + String(modifier.phase) + '"'));
              }
              break;
            case "fn":
              if (typeof modifier.fn !== "function") {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"fn"', '"function"', '"' + String(modifier.fn) + '"'));
              }
              break;
            case "effect":
              if (typeof modifier.effect !== "function") {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"effect"', '"function"', '"' + String(modifier.fn) + '"'));
              }
              break;
            case "requires":
              if (!Array.isArray(modifier.requires)) {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"requires"', '"array"', '"' + String(modifier.requires) + '"'));
              }
              break;
            case "requiresIfExists":
              if (!Array.isArray(modifier.requiresIfExists)) {
                console.error(format(INVALID_MODIFIER_ERROR, modifier.name, '"requiresIfExists"', '"array"', '"' + String(modifier.requiresIfExists) + '"'));
              }
              break;
            case "options":
            case "data":
              break;
            default:
              console.error('PopperJS: an invalid property has been provided to the "' + modifier.name + '" modifier, valid properties are ' + VALID_PROPERTIES.map(function(s) {
                return '"' + s + '"';
              }).join(", ") + '; but "' + key + '" was provided.');
          }
          modifier.requires && modifier.requires.forEach(function(requirement) {
            if (modifiers.find(function(mod) {
              return mod.name === requirement;
            }) == null) {
              console.error(format(MISSING_DEPENDENCY_ERROR, String(modifier.name), requirement, requirement));
            }
          });
        });
      });
    }
    function uniqueBy(arr, fn) {
      var identifiers = /* @__PURE__ */ new Set();
      return arr.filter(function(item) {
        var identifier = fn(item);
        if (!identifiers.has(identifier)) {
          identifiers.add(identifier);
          return true;
        }
      });
    }
    function getBasePlacement(placement) {
      return placement.split("-")[0];
    }
    function mergeByName(modifiers) {
      var merged = modifiers.reduce(function(merged2, current) {
        var existing = merged2[current.name];
        merged2[current.name] = existing ? Object.assign({}, existing, current, {
          options: Object.assign({}, existing.options, current.options),
          data: Object.assign({}, existing.data, current.data)
        }) : current;
        return merged2;
      }, {});
      return Object.keys(merged).map(function(key) {
        return merged[key];
      });
    }
    function getViewportRect2(element) {
      var win = getWindow2(element);
      var html = getDocumentElement2(element);
      var visualViewport = win.visualViewport;
      var width = html.clientWidth;
      var height = html.clientHeight;
      var x = 0;
      var y = 0;
      if (visualViewport) {
        width = visualViewport.width;
        height = visualViewport.height;
        if (!/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
          x = visualViewport.offsetLeft;
          y = visualViewport.offsetTop;
        }
      }
      return {
        width,
        height,
        x: x + getWindowScrollBarX2(element),
        y
      };
    }
    var max3 = Math.max;
    var min3 = Math.min;
    var round2 = Math.round;
    function getDocumentRect2(element) {
      var _element$ownerDocumen;
      var html = getDocumentElement2(element);
      var winScroll = getWindowScroll(element);
      var body = (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body;
      var width = max3(html.scrollWidth, html.clientWidth, body ? body.scrollWidth : 0, body ? body.clientWidth : 0);
      var height = max3(html.scrollHeight, html.clientHeight, body ? body.scrollHeight : 0, body ? body.clientHeight : 0);
      var x = -winScroll.scrollLeft + getWindowScrollBarX2(element);
      var y = -winScroll.scrollTop;
      if (getComputedStyle2(body || html).direction === "rtl") {
        x += max3(html.clientWidth, body ? body.clientWidth : 0) - width;
      }
      return {
        width,
        height,
        x,
        y
      };
    }
    function contains2(parent, child) {
      var rootNode = child.getRootNode && child.getRootNode();
      if (parent.contains(child)) {
        return true;
      } else if (rootNode && isShadowRoot2(rootNode)) {
        var next = child;
        do {
          if (next && parent.isSameNode(next)) {
            return true;
          }
          next = next.parentNode || next.host;
        } while (next);
      }
      return false;
    }
    function rectToClientRect2(rect) {
      return Object.assign({}, rect, {
        left: rect.x,
        top: rect.y,
        right: rect.x + rect.width,
        bottom: rect.y + rect.height
      });
    }
    function getInnerBoundingClientRect2(element) {
      var rect = getBoundingClientRect2(element);
      rect.top = rect.top + element.clientTop;
      rect.left = rect.left + element.clientLeft;
      rect.bottom = rect.top + element.clientHeight;
      rect.right = rect.left + element.clientWidth;
      rect.width = element.clientWidth;
      rect.height = element.clientHeight;
      rect.x = rect.left;
      rect.y = rect.top;
      return rect;
    }
    function getClientRectFromMixedType(element, clippingParent) {
      return clippingParent === viewport ? rectToClientRect2(getViewportRect2(element)) : isHTMLElement2(clippingParent) ? getInnerBoundingClientRect2(clippingParent) : rectToClientRect2(getDocumentRect2(getDocumentElement2(element)));
    }
    function getClippingParents(element) {
      var clippingParents2 = listScrollParents(getParentNode2(element));
      var canEscapeClipping = ["absolute", "fixed"].indexOf(getComputedStyle2(element).position) >= 0;
      var clipperElement = canEscapeClipping && isHTMLElement2(element) ? getOffsetParent2(element) : element;
      if (!isElement2(clipperElement)) {
        return [];
      }
      return clippingParents2.filter(function(clippingParent) {
        return isElement2(clippingParent) && contains2(clippingParent, clipperElement) && getNodeName2(clippingParent) !== "body";
      });
    }
    function getClippingRect2(element, boundary, rootBoundary) {
      var mainClippingParents = boundary === "clippingParents" ? getClippingParents(element) : [].concat(boundary);
      var clippingParents2 = [].concat(mainClippingParents, [rootBoundary]);
      var firstClippingParent = clippingParents2[0];
      var clippingRect = clippingParents2.reduce(function(accRect, clippingParent) {
        var rect = getClientRectFromMixedType(element, clippingParent);
        accRect.top = max3(rect.top, accRect.top);
        accRect.right = min3(rect.right, accRect.right);
        accRect.bottom = min3(rect.bottom, accRect.bottom);
        accRect.left = max3(rect.left, accRect.left);
        return accRect;
      }, getClientRectFromMixedType(element, firstClippingParent));
      clippingRect.width = clippingRect.right - clippingRect.left;
      clippingRect.height = clippingRect.bottom - clippingRect.top;
      clippingRect.x = clippingRect.left;
      clippingRect.y = clippingRect.top;
      return clippingRect;
    }
    function getVariation(placement) {
      return placement.split("-")[1];
    }
    function getMainAxisFromPlacement2(placement) {
      return ["top", "bottom"].indexOf(placement) >= 0 ? "x" : "y";
    }
    function computeOffsets(_ref) {
      var reference2 = _ref.reference, element = _ref.element, placement = _ref.placement;
      var basePlacement = placement ? getBasePlacement(placement) : null;
      var variation = placement ? getVariation(placement) : null;
      var commonX = reference2.x + reference2.width / 2 - element.width / 2;
      var commonY = reference2.y + reference2.height / 2 - element.height / 2;
      var offsets;
      switch (basePlacement) {
        case top:
          offsets = {
            x: commonX,
            y: reference2.y - element.height
          };
          break;
        case bottom:
          offsets = {
            x: commonX,
            y: reference2.y + reference2.height
          };
          break;
        case right:
          offsets = {
            x: reference2.x + reference2.width,
            y: commonY
          };
          break;
        case left:
          offsets = {
            x: reference2.x - element.width,
            y: commonY
          };
          break;
        default:
          offsets = {
            x: reference2.x,
            y: reference2.y
          };
      }
      var mainAxis = basePlacement ? getMainAxisFromPlacement2(basePlacement) : null;
      if (mainAxis != null) {
        var len = mainAxis === "y" ? "height" : "width";
        switch (variation) {
          case start:
            offsets[mainAxis] = offsets[mainAxis] - (reference2[len] / 2 - element[len] / 2);
            break;
          case end:
            offsets[mainAxis] = offsets[mainAxis] + (reference2[len] / 2 - element[len] / 2);
            break;
        }
      }
      return offsets;
    }
    function getFreshSideObject() {
      return {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      };
    }
    function mergePaddingObject(paddingObject) {
      return Object.assign({}, getFreshSideObject(), paddingObject);
    }
    function expandToHashMap(value, keys) {
      return keys.reduce(function(hashMap, key) {
        hashMap[key] = value;
        return hashMap;
      }, {});
    }
    function detectOverflow2(state, options) {
      if (options === void 0) {
        options = {};
      }
      var _options = options, _options$placement = _options.placement, placement = _options$placement === void 0 ? state.placement : _options$placement, _options$boundary = _options.boundary, boundary = _options$boundary === void 0 ? clippingParents : _options$boundary, _options$rootBoundary = _options.rootBoundary, rootBoundary = _options$rootBoundary === void 0 ? viewport : _options$rootBoundary, _options$elementConte = _options.elementContext, elementContext = _options$elementConte === void 0 ? popper : _options$elementConte, _options$altBoundary = _options.altBoundary, altBoundary = _options$altBoundary === void 0 ? false : _options$altBoundary, _options$padding = _options.padding, padding = _options$padding === void 0 ? 0 : _options$padding;
      var paddingObject = mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
      var altContext = elementContext === popper ? reference : popper;
      var referenceElement = state.elements.reference;
      var popperRect = state.rects.popper;
      var element = state.elements[altBoundary ? altContext : elementContext];
      var clippingClientRect = getClippingRect2(isElement2(element) ? element : element.contextElement || getDocumentElement2(state.elements.popper), boundary, rootBoundary);
      var referenceClientRect = getBoundingClientRect2(referenceElement);
      var popperOffsets2 = computeOffsets({
        reference: referenceClientRect,
        element: popperRect,
        strategy: "absolute",
        placement
      });
      var popperClientRect = rectToClientRect2(Object.assign({}, popperRect, popperOffsets2));
      var elementClientRect = elementContext === popper ? popperClientRect : referenceClientRect;
      var overflowOffsets = {
        top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
        bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
        left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
        right: elementClientRect.right - clippingClientRect.right + paddingObject.right
      };
      var offsetData = state.modifiersData.offset;
      if (elementContext === popper && offsetData) {
        var offset22 = offsetData[placement];
        Object.keys(overflowOffsets).forEach(function(key) {
          var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
          var axis = [top, bottom].indexOf(key) >= 0 ? "y" : "x";
          overflowOffsets[key] += offset22[axis] * multiply;
        });
      }
      return overflowOffsets;
    }
    var INVALID_ELEMENT_ERROR = "Popper: Invalid reference or popper argument provided. They must be either a DOM element or virtual element.";
    var INFINITE_LOOP_ERROR = "Popper: An infinite loop in the modifiers cycle has been detected! The cycle has been interrupted to prevent a browser crash.";
    var DEFAULT_OPTIONS = {
      placement: "bottom",
      modifiers: [],
      strategy: "absolute"
    };
    function areValidElements() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      return !args.some(function(element) {
        return !(element && typeof element.getBoundingClientRect === "function");
      });
    }
    function popperGenerator(generatorOptions) {
      if (generatorOptions === void 0) {
        generatorOptions = {};
      }
      var _generatorOptions = generatorOptions, _generatorOptions$def = _generatorOptions.defaultModifiers, defaultModifiers2 = _generatorOptions$def === void 0 ? [] : _generatorOptions$def, _generatorOptions$def2 = _generatorOptions.defaultOptions, defaultOptions = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
      return function createPopper2(reference2, popper2, options) {
        if (options === void 0) {
          options = defaultOptions;
        }
        var state = {
          placement: "bottom",
          orderedModifiers: [],
          options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions),
          modifiersData: {},
          elements: {
            reference: reference2,
            popper: popper2
          },
          attributes: {},
          styles: {}
        };
        var effectCleanupFns = [];
        var isDestroyed = false;
        var instance = {
          state,
          setOptions: function setOptions(options2) {
            cleanupModifierEffects();
            state.options = Object.assign({}, defaultOptions, state.options, options2);
            state.scrollParents = {
              reference: isElement2(reference2) ? listScrollParents(reference2) : reference2.contextElement ? listScrollParents(reference2.contextElement) : [],
              popper: listScrollParents(popper2)
            };
            var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers2, state.options.modifiers)));
            state.orderedModifiers = orderedModifiers.filter(function(m) {
              return m.enabled;
            });
            if (true) {
              var modifiers = uniqueBy([].concat(orderedModifiers, state.options.modifiers), function(_ref) {
                var name = _ref.name;
                return name;
              });
              validateModifiers(modifiers);
              if (getBasePlacement(state.options.placement) === auto) {
                var flipModifier = state.orderedModifiers.find(function(_ref2) {
                  var name = _ref2.name;
                  return name === "flip";
                });
                if (!flipModifier) {
                  console.error(['Popper: "auto" placements require the "flip" modifier be', "present and enabled to work."].join(" "));
                }
              }
              var _getComputedStyle = getComputedStyle2(popper2), marginTop = _getComputedStyle.marginTop, marginRight = _getComputedStyle.marginRight, marginBottom = _getComputedStyle.marginBottom, marginLeft = _getComputedStyle.marginLeft;
              if ([marginTop, marginRight, marginBottom, marginLeft].some(function(margin) {
                return parseFloat(margin);
              })) {
                console.warn(['Popper: CSS "margin" styles cannot be used to apply padding', "between the popper and its reference element or boundary.", "To replicate margin, use the `offset` modifier, as well as", "the `padding` option in the `preventOverflow` and `flip`", "modifiers."].join(" "));
              }
            }
            runModifierEffects();
            return instance.update();
          },
          forceUpdate: function forceUpdate() {
            if (isDestroyed) {
              return;
            }
            var _state$elements = state.elements, reference3 = _state$elements.reference, popper3 = _state$elements.popper;
            if (!areValidElements(reference3, popper3)) {
              if (true) {
                console.error(INVALID_ELEMENT_ERROR);
              }
              return;
            }
            state.rects = {
              reference: getCompositeRect(reference3, getOffsetParent2(popper3), state.options.strategy === "fixed"),
              popper: getLayoutRect(popper3)
            };
            state.reset = false;
            state.placement = state.options.placement;
            state.orderedModifiers.forEach(function(modifier) {
              return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
            });
            var __debug_loops__ = 0;
            for (var index2 = 0; index2 < state.orderedModifiers.length; index2++) {
              if (true) {
                __debug_loops__ += 1;
                if (__debug_loops__ > 100) {
                  console.error(INFINITE_LOOP_ERROR);
                  break;
                }
              }
              if (state.reset === true) {
                state.reset = false;
                index2 = -1;
                continue;
              }
              var _state$orderedModifie = state.orderedModifiers[index2], fn = _state$orderedModifie.fn, _state$orderedModifie2 = _state$orderedModifie.options, _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2, name = _state$orderedModifie.name;
              if (typeof fn === "function") {
                state = fn({
                  state,
                  options: _options,
                  name,
                  instance
                }) || state;
              }
            }
          },
          update: debounce(function() {
            return new Promise(function(resolve) {
              instance.forceUpdate();
              resolve(state);
            });
          }),
          destroy: function destroy2() {
            cleanupModifierEffects();
            isDestroyed = true;
          }
        };
        if (!areValidElements(reference2, popper2)) {
          if (true) {
            console.error(INVALID_ELEMENT_ERROR);
          }
          return instance;
        }
        instance.setOptions(options).then(function(state2) {
          if (!isDestroyed && options.onFirstUpdate) {
            options.onFirstUpdate(state2);
          }
        });
        function runModifierEffects() {
          state.orderedModifiers.forEach(function(_ref3) {
            var name = _ref3.name, _ref3$options = _ref3.options, options2 = _ref3$options === void 0 ? {} : _ref3$options, effect2 = _ref3.effect;
            if (typeof effect2 === "function") {
              var cleanupFn = effect2({
                state,
                name,
                instance,
                options: options2
              });
              var noopFn = function noopFn2() {
              };
              effectCleanupFns.push(cleanupFn || noopFn);
            }
          });
        }
        function cleanupModifierEffects() {
          effectCleanupFns.forEach(function(fn) {
            return fn();
          });
          effectCleanupFns = [];
        }
        return instance;
      };
    }
    var passive = {
      passive: true
    };
    function effect$2(_ref) {
      var state = _ref.state, instance = _ref.instance, options = _ref.options;
      var _options$scroll = options.scroll, scroll = _options$scroll === void 0 ? true : _options$scroll, _options$resize = options.resize, resize = _options$resize === void 0 ? true : _options$resize;
      var window2 = getWindow2(state.elements.popper);
      var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);
      if (scroll) {
        scrollParents.forEach(function(scrollParent) {
          scrollParent.addEventListener("scroll", instance.update, passive);
        });
      }
      if (resize) {
        window2.addEventListener("resize", instance.update, passive);
      }
      return function() {
        if (scroll) {
          scrollParents.forEach(function(scrollParent) {
            scrollParent.removeEventListener("scroll", instance.update, passive);
          });
        }
        if (resize) {
          window2.removeEventListener("resize", instance.update, passive);
        }
      };
    }
    var eventListeners = {
      name: "eventListeners",
      enabled: true,
      phase: "write",
      fn: function fn() {
      },
      effect: effect$2,
      data: {}
    };
    function popperOffsets(_ref) {
      var state = _ref.state, name = _ref.name;
      state.modifiersData[name] = computeOffsets({
        reference: state.rects.reference,
        element: state.rects.popper,
        strategy: "absolute",
        placement: state.placement
      });
    }
    var popperOffsets$1 = {
      name: "popperOffsets",
      enabled: true,
      phase: "read",
      fn: popperOffsets,
      data: {}
    };
    var unsetSides = {
      top: "auto",
      right: "auto",
      bottom: "auto",
      left: "auto"
    };
    function roundOffsetsByDPR(_ref) {
      var x = _ref.x, y = _ref.y;
      var win = window;
      var dpr = win.devicePixelRatio || 1;
      return {
        x: round2(round2(x * dpr) / dpr) || 0,
        y: round2(round2(y * dpr) / dpr) || 0
      };
    }
    function mapToStyles(_ref2) {
      var _Object$assign2;
      var popper2 = _ref2.popper, popperRect = _ref2.popperRect, placement = _ref2.placement, offsets = _ref2.offsets, position = _ref2.position, gpuAcceleration = _ref2.gpuAcceleration, adaptive = _ref2.adaptive, roundOffsets = _ref2.roundOffsets;
      var _ref3 = roundOffsets === true ? roundOffsetsByDPR(offsets) : typeof roundOffsets === "function" ? roundOffsets(offsets) : offsets, _ref3$x = _ref3.x, x = _ref3$x === void 0 ? 0 : _ref3$x, _ref3$y = _ref3.y, y = _ref3$y === void 0 ? 0 : _ref3$y;
      var hasX = offsets.hasOwnProperty("x");
      var hasY = offsets.hasOwnProperty("y");
      var sideX = left;
      var sideY = top;
      var win = window;
      if (adaptive) {
        var offsetParent = getOffsetParent2(popper2);
        var heightProp = "clientHeight";
        var widthProp = "clientWidth";
        if (offsetParent === getWindow2(popper2)) {
          offsetParent = getDocumentElement2(popper2);
          if (getComputedStyle2(offsetParent).position !== "static") {
            heightProp = "scrollHeight";
            widthProp = "scrollWidth";
          }
        }
        offsetParent = offsetParent;
        if (placement === top) {
          sideY = bottom;
          y -= offsetParent[heightProp] - popperRect.height;
          y *= gpuAcceleration ? 1 : -1;
        }
        if (placement === left) {
          sideX = right;
          x -= offsetParent[widthProp] - popperRect.width;
          x *= gpuAcceleration ? 1 : -1;
        }
      }
      var commonStyles = Object.assign({
        position
      }, adaptive && unsetSides);
      if (gpuAcceleration) {
        var _Object$assign;
        return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? "0" : "", _Object$assign[sideX] = hasX ? "0" : "", _Object$assign.transform = (win.devicePixelRatio || 1) < 2 ? "translate(" + x + "px, " + y + "px)" : "translate3d(" + x + "px, " + y + "px, 0)", _Object$assign));
      }
      return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y + "px" : "", _Object$assign2[sideX] = hasX ? x + "px" : "", _Object$assign2.transform = "", _Object$assign2));
    }
    function computeStyles(_ref4) {
      var state = _ref4.state, options = _ref4.options;
      var _options$gpuAccelerat = options.gpuAcceleration, gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat, _options$adaptive = options.adaptive, adaptive = _options$adaptive === void 0 ? true : _options$adaptive, _options$roundOffsets = options.roundOffsets, roundOffsets = _options$roundOffsets === void 0 ? true : _options$roundOffsets;
      if (true) {
        var transitionProperty = getComputedStyle2(state.elements.popper).transitionProperty || "";
        if (adaptive && ["transform", "top", "right", "bottom", "left"].some(function(property) {
          return transitionProperty.indexOf(property) >= 0;
        })) {
          console.warn(["Popper: Detected CSS transitions on at least one of the following", 'CSS properties: "transform", "top", "right", "bottom", "left".', "\n\n", 'Disable the "computeStyles" modifier\'s `adaptive` option to allow', "for smooth transitions, or remove these properties from the CSS", "transition declaration on the popper element if only transitioning", "opacity or background-color for example.", "\n\n", "We recommend using the popper element as a wrapper around an inner", "element that can have any CSS property transitioned for animations."].join(" "));
        }
      }
      var commonStyles = {
        placement: getBasePlacement(state.placement),
        popper: state.elements.popper,
        popperRect: state.rects.popper,
        gpuAcceleration
      };
      if (state.modifiersData.popperOffsets != null) {
        state.styles.popper = Object.assign({}, state.styles.popper, mapToStyles(Object.assign({}, commonStyles, {
          offsets: state.modifiersData.popperOffsets,
          position: state.options.strategy,
          adaptive,
          roundOffsets
        })));
      }
      if (state.modifiersData.arrow != null) {
        state.styles.arrow = Object.assign({}, state.styles.arrow, mapToStyles(Object.assign({}, commonStyles, {
          offsets: state.modifiersData.arrow,
          position: "absolute",
          adaptive: false,
          roundOffsets
        })));
      }
      state.attributes.popper = Object.assign({}, state.attributes.popper, {
        "data-popper-placement": state.placement
      });
    }
    var computeStyles$1 = {
      name: "computeStyles",
      enabled: true,
      phase: "beforeWrite",
      fn: computeStyles,
      data: {}
    };
    function applyStyles(_ref) {
      var state = _ref.state;
      Object.keys(state.elements).forEach(function(name) {
        var style = state.styles[name] || {};
        var attributes = state.attributes[name] || {};
        var element = state.elements[name];
        if (!isHTMLElement2(element) || !getNodeName2(element)) {
          return;
        }
        Object.assign(element.style, style);
        Object.keys(attributes).forEach(function(name2) {
          var value = attributes[name2];
          if (value === false) {
            element.removeAttribute(name2);
          } else {
            element.setAttribute(name2, value === true ? "" : value);
          }
        });
      });
    }
    function effect$1(_ref2) {
      var state = _ref2.state;
      var initialStyles = {
        popper: {
          position: state.options.strategy,
          left: "0",
          top: "0",
          margin: "0"
        },
        arrow: {
          position: "absolute"
        },
        reference: {}
      };
      Object.assign(state.elements.popper.style, initialStyles.popper);
      state.styles = initialStyles;
      if (state.elements.arrow) {
        Object.assign(state.elements.arrow.style, initialStyles.arrow);
      }
      return function() {
        Object.keys(state.elements).forEach(function(name) {
          var element = state.elements[name];
          var attributes = state.attributes[name] || {};
          var styleProperties = Object.keys(state.styles.hasOwnProperty(name) ? state.styles[name] : initialStyles[name]);
          var style = styleProperties.reduce(function(style2, property) {
            style2[property] = "";
            return style2;
          }, {});
          if (!isHTMLElement2(element) || !getNodeName2(element)) {
            return;
          }
          Object.assign(element.style, style);
          Object.keys(attributes).forEach(function(attribute) {
            element.removeAttribute(attribute);
          });
        });
      };
    }
    var applyStyles$1 = {
      name: "applyStyles",
      enabled: true,
      phase: "write",
      fn: applyStyles,
      effect: effect$1,
      requires: ["computeStyles"]
    };
    function distanceAndSkiddingToXY(placement, rects, offset22) {
      var basePlacement = getBasePlacement(placement);
      var invertDistance = [left, top].indexOf(basePlacement) >= 0 ? -1 : 1;
      var _ref = typeof offset22 === "function" ? offset22(Object.assign({}, rects, {
        placement
      })) : offset22, skidding = _ref[0], distance = _ref[1];
      skidding = skidding || 0;
      distance = (distance || 0) * invertDistance;
      return [left, right].indexOf(basePlacement) >= 0 ? {
        x: distance,
        y: skidding
      } : {
        x: skidding,
        y: distance
      };
    }
    function offset2(_ref2) {
      var state = _ref2.state, options = _ref2.options, name = _ref2.name;
      var _options$offset = options.offset, offset22 = _options$offset === void 0 ? [0, 0] : _options$offset;
      var data = placements.reduce(function(acc, placement) {
        acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset22);
        return acc;
      }, {});
      var _data$state$placement = data[state.placement], x = _data$state$placement.x, y = _data$state$placement.y;
      if (state.modifiersData.popperOffsets != null) {
        state.modifiersData.popperOffsets.x += x;
        state.modifiersData.popperOffsets.y += y;
      }
      state.modifiersData[name] = data;
    }
    var offset$1 = {
      name: "offset",
      enabled: true,
      phase: "main",
      requires: ["popperOffsets"],
      fn: offset2
    };
    var hash$12 = {
      left: "right",
      right: "left",
      bottom: "top",
      top: "bottom"
    };
    function getOppositePlacement2(placement) {
      return placement.replace(/left|right|bottom|top/g, function(matched) {
        return hash$12[matched];
      });
    }
    var hash2 = {
      start: "end",
      end: "start"
    };
    function getOppositeVariationPlacement(placement) {
      return placement.replace(/start|end/g, function(matched) {
        return hash2[matched];
      });
    }
    function computeAutoPlacement(state, options) {
      if (options === void 0) {
        options = {};
      }
      var _options = options, placement = _options.placement, boundary = _options.boundary, rootBoundary = _options.rootBoundary, padding = _options.padding, flipVariations = _options.flipVariations, _options$allowedAutoP = _options.allowedAutoPlacements, allowedAutoPlacements = _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
      var variation = getVariation(placement);
      var placements$1 = variation ? flipVariations ? variationPlacements : variationPlacements.filter(function(placement2) {
        return getVariation(placement2) === variation;
      }) : basePlacements;
      var allowedPlacements = placements$1.filter(function(placement2) {
        return allowedAutoPlacements.indexOf(placement2) >= 0;
      });
      if (allowedPlacements.length === 0) {
        allowedPlacements = placements$1;
        if (true) {
          console.error(["Popper: The `allowedAutoPlacements` option did not allow any", "placements. Ensure the `placement` option matches the variation", "of the allowed placements.", 'For example, "auto" cannot be used to allow "bottom-start".', 'Use "auto-start" instead.'].join(" "));
        }
      }
      var overflows = allowedPlacements.reduce(function(acc, placement2) {
        acc[placement2] = detectOverflow2(state, {
          placement: placement2,
          boundary,
          rootBoundary,
          padding
        })[getBasePlacement(placement2)];
        return acc;
      }, {});
      return Object.keys(overflows).sort(function(a, b) {
        return overflows[a] - overflows[b];
      });
    }
    function getExpandedFallbackPlacements(placement) {
      if (getBasePlacement(placement) === auto) {
        return [];
      }
      var oppositePlacement = getOppositePlacement2(placement);
      return [getOppositeVariationPlacement(placement), oppositePlacement, getOppositeVariationPlacement(oppositePlacement)];
    }
    function flip2(_ref) {
      var state = _ref.state, options = _ref.options, name = _ref.name;
      if (state.modifiersData[name]._skip) {
        return;
      }
      var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis, specifiedFallbackPlacements = options.fallbackPlacements, padding = options.padding, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, _options$flipVariatio = options.flipVariations, flipVariations = _options$flipVariatio === void 0 ? true : _options$flipVariatio, allowedAutoPlacements = options.allowedAutoPlacements;
      var preferredPlacement = state.options.placement;
      var basePlacement = getBasePlacement(preferredPlacement);
      var isBasePlacement = basePlacement === preferredPlacement;
      var fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipVariations ? [getOppositePlacement2(preferredPlacement)] : getExpandedFallbackPlacements(preferredPlacement));
      var placements2 = [preferredPlacement].concat(fallbackPlacements).reduce(function(acc, placement2) {
        return acc.concat(getBasePlacement(placement2) === auto ? computeAutoPlacement(state, {
          placement: placement2,
          boundary,
          rootBoundary,
          padding,
          flipVariations,
          allowedAutoPlacements
        }) : placement2);
      }, []);
      var referenceRect = state.rects.reference;
      var popperRect = state.rects.popper;
      var checksMap = /* @__PURE__ */ new Map();
      var makeFallbackChecks = true;
      var firstFittingPlacement = placements2[0];
      for (var i = 0; i < placements2.length; i++) {
        var placement = placements2[i];
        var _basePlacement = getBasePlacement(placement);
        var isStartVariation = getVariation(placement) === start;
        var isVertical = [top, bottom].indexOf(_basePlacement) >= 0;
        var len = isVertical ? "width" : "height";
        var overflow = detectOverflow2(state, {
          placement,
          boundary,
          rootBoundary,
          altBoundary,
          padding
        });
        var mainVariationSide = isVertical ? isStartVariation ? right : left : isStartVariation ? bottom : top;
        if (referenceRect[len] > popperRect[len]) {
          mainVariationSide = getOppositePlacement2(mainVariationSide);
        }
        var altVariationSide = getOppositePlacement2(mainVariationSide);
        var checks = [];
        if (checkMainAxis) {
          checks.push(overflow[_basePlacement] <= 0);
        }
        if (checkAltAxis) {
          checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
        }
        if (checks.every(function(check) {
          return check;
        })) {
          firstFittingPlacement = placement;
          makeFallbackChecks = false;
          break;
        }
        checksMap.set(placement, checks);
      }
      if (makeFallbackChecks) {
        var numberOfChecks = flipVariations ? 3 : 1;
        var _loop = function _loop2(_i2) {
          var fittingPlacement = placements2.find(function(placement2) {
            var checks2 = checksMap.get(placement2);
            if (checks2) {
              return checks2.slice(0, _i2).every(function(check) {
                return check;
              });
            }
          });
          if (fittingPlacement) {
            firstFittingPlacement = fittingPlacement;
            return "break";
          }
        };
        for (var _i = numberOfChecks; _i > 0; _i--) {
          var _ret = _loop(_i);
          if (_ret === "break")
            break;
        }
      }
      if (state.placement !== firstFittingPlacement) {
        state.modifiersData[name]._skip = true;
        state.placement = firstFittingPlacement;
        state.reset = true;
      }
    }
    var flip$1 = {
      name: "flip",
      enabled: true,
      phase: "main",
      fn: flip2,
      requiresIfExists: ["offset"],
      data: {
        _skip: false
      }
    };
    function getAltAxis(axis) {
      return axis === "x" ? "y" : "x";
    }
    function within2(min$1, value, max$1) {
      return max3(min$1, min3(value, max$1));
    }
    function preventOverflow(_ref) {
      var state = _ref.state, options = _ref.options, name = _ref.name;
      var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, padding = options.padding, _options$tether = options.tether, tether = _options$tether === void 0 ? true : _options$tether, _options$tetherOffset = options.tetherOffset, tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
      var overflow = detectOverflow2(state, {
        boundary,
        rootBoundary,
        padding,
        altBoundary
      });
      var basePlacement = getBasePlacement(state.placement);
      var variation = getVariation(state.placement);
      var isBasePlacement = !variation;
      var mainAxis = getMainAxisFromPlacement2(basePlacement);
      var altAxis = getAltAxis(mainAxis);
      var popperOffsets2 = state.modifiersData.popperOffsets;
      var referenceRect = state.rects.reference;
      var popperRect = state.rects.popper;
      var tetherOffsetValue = typeof tetherOffset === "function" ? tetherOffset(Object.assign({}, state.rects, {
        placement: state.placement
      })) : tetherOffset;
      var data = {
        x: 0,
        y: 0
      };
      if (!popperOffsets2) {
        return;
      }
      if (checkMainAxis || checkAltAxis) {
        var mainSide = mainAxis === "y" ? top : left;
        var altSide = mainAxis === "y" ? bottom : right;
        var len = mainAxis === "y" ? "height" : "width";
        var offset22 = popperOffsets2[mainAxis];
        var min$1 = popperOffsets2[mainAxis] + overflow[mainSide];
        var max$1 = popperOffsets2[mainAxis] - overflow[altSide];
        var additive = tether ? -popperRect[len] / 2 : 0;
        var minLen = variation === start ? referenceRect[len] : popperRect[len];
        var maxLen = variation === start ? -popperRect[len] : -referenceRect[len];
        var arrowElement = state.elements.arrow;
        var arrowRect = tether && arrowElement ? getLayoutRect(arrowElement) : {
          width: 0,
          height: 0
        };
        var arrowPaddingObject = state.modifiersData["arrow#persistent"] ? state.modifiersData["arrow#persistent"].padding : getFreshSideObject();
        var arrowPaddingMin = arrowPaddingObject[mainSide];
        var arrowPaddingMax = arrowPaddingObject[altSide];
        var arrowLen = within2(0, referenceRect[len], arrowRect[len]);
        var minOffset = isBasePlacement ? referenceRect[len] / 2 - additive - arrowLen - arrowPaddingMin - tetherOffsetValue : minLen - arrowLen - arrowPaddingMin - tetherOffsetValue;
        var maxOffset = isBasePlacement ? -referenceRect[len] / 2 + additive + arrowLen + arrowPaddingMax + tetherOffsetValue : maxLen + arrowLen + arrowPaddingMax + tetherOffsetValue;
        var arrowOffsetParent = state.elements.arrow && getOffsetParent2(state.elements.arrow);
        var clientOffset = arrowOffsetParent ? mainAxis === "y" ? arrowOffsetParent.clientTop || 0 : arrowOffsetParent.clientLeft || 0 : 0;
        var offsetModifierValue = state.modifiersData.offset ? state.modifiersData.offset[state.placement][mainAxis] : 0;
        var tetherMin = popperOffsets2[mainAxis] + minOffset - offsetModifierValue - clientOffset;
        var tetherMax = popperOffsets2[mainAxis] + maxOffset - offsetModifierValue;
        if (checkMainAxis) {
          var preventedOffset = within2(tether ? min3(min$1, tetherMin) : min$1, offset22, tether ? max3(max$1, tetherMax) : max$1);
          popperOffsets2[mainAxis] = preventedOffset;
          data[mainAxis] = preventedOffset - offset22;
        }
        if (checkAltAxis) {
          var _mainSide = mainAxis === "x" ? top : left;
          var _altSide = mainAxis === "x" ? bottom : right;
          var _offset = popperOffsets2[altAxis];
          var _min = _offset + overflow[_mainSide];
          var _max = _offset - overflow[_altSide];
          var _preventedOffset = within2(tether ? min3(_min, tetherMin) : _min, _offset, tether ? max3(_max, tetherMax) : _max);
          popperOffsets2[altAxis] = _preventedOffset;
          data[altAxis] = _preventedOffset - _offset;
        }
      }
      state.modifiersData[name] = data;
    }
    var preventOverflow$1 = {
      name: "preventOverflow",
      enabled: true,
      phase: "main",
      fn: preventOverflow,
      requiresIfExists: ["offset"]
    };
    var toPaddingObject = function toPaddingObject2(padding, state) {
      padding = typeof padding === "function" ? padding(Object.assign({}, state.rects, {
        placement: state.placement
      })) : padding;
      return mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
    };
    function arrow2(_ref) {
      var _state$modifiersData$;
      var state = _ref.state, name = _ref.name, options = _ref.options;
      var arrowElement = state.elements.arrow;
      var popperOffsets2 = state.modifiersData.popperOffsets;
      var basePlacement = getBasePlacement(state.placement);
      var axis = getMainAxisFromPlacement2(basePlacement);
      var isVertical = [left, right].indexOf(basePlacement) >= 0;
      var len = isVertical ? "height" : "width";
      if (!arrowElement || !popperOffsets2) {
        return;
      }
      var paddingObject = toPaddingObject(options.padding, state);
      var arrowRect = getLayoutRect(arrowElement);
      var minProp = axis === "y" ? top : left;
      var maxProp = axis === "y" ? bottom : right;
      var endDiff = state.rects.reference[len] + state.rects.reference[axis] - popperOffsets2[axis] - state.rects.popper[len];
      var startDiff = popperOffsets2[axis] - state.rects.reference[axis];
      var arrowOffsetParent = getOffsetParent2(arrowElement);
      var clientSize = arrowOffsetParent ? axis === "y" ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
      var centerToReference = endDiff / 2 - startDiff / 2;
      var min22 = paddingObject[minProp];
      var max22 = clientSize - arrowRect[len] - paddingObject[maxProp];
      var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
      var offset22 = within2(min22, center, max22);
      var axisProp = axis;
      state.modifiersData[name] = (_state$modifiersData$ = {}, _state$modifiersData$[axisProp] = offset22, _state$modifiersData$.centerOffset = offset22 - center, _state$modifiersData$);
    }
    function effect(_ref2) {
      var state = _ref2.state, options = _ref2.options;
      var _options$element = options.element, arrowElement = _options$element === void 0 ? "[data-popper-arrow]" : _options$element;
      if (arrowElement == null) {
        return;
      }
      if (typeof arrowElement === "string") {
        arrowElement = state.elements.popper.querySelector(arrowElement);
        if (!arrowElement) {
          return;
        }
      }
      if (true) {
        if (!isHTMLElement2(arrowElement)) {
          console.error(['Popper: "arrow" element must be an HTMLElement (not an SVGElement).', "To use an SVG arrow, wrap it in an HTMLElement that will be used as", "the arrow."].join(" "));
        }
      }
      if (!contains2(state.elements.popper, arrowElement)) {
        if (true) {
          console.error(['Popper: "arrow" modifier\'s `element` must be a child of the popper', "element."].join(" "));
        }
        return;
      }
      state.elements.arrow = arrowElement;
    }
    var arrow$1 = {
      name: "arrow",
      enabled: true,
      phase: "main",
      fn: arrow2,
      effect,
      requires: ["popperOffsets"],
      requiresIfExists: ["preventOverflow"]
    };
    function getSideOffsets2(overflow, rect, preventedOffsets) {
      if (preventedOffsets === void 0) {
        preventedOffsets = {
          x: 0,
          y: 0
        };
      }
      return {
        top: overflow.top - rect.height - preventedOffsets.y,
        right: overflow.right - rect.width + preventedOffsets.x,
        bottom: overflow.bottom - rect.height + preventedOffsets.y,
        left: overflow.left - rect.width - preventedOffsets.x
      };
    }
    function isAnySideFullyClipped2(overflow) {
      return [top, right, bottom, left].some(function(side) {
        return overflow[side] >= 0;
      });
    }
    function hide2(_ref) {
      var state = _ref.state, name = _ref.name;
      var referenceRect = state.rects.reference;
      var popperRect = state.rects.popper;
      var preventedOffsets = state.modifiersData.preventOverflow;
      var referenceOverflow = detectOverflow2(state, {
        elementContext: "reference"
      });
      var popperAltOverflow = detectOverflow2(state, {
        altBoundary: true
      });
      var referenceClippingOffsets = getSideOffsets2(referenceOverflow, referenceRect);
      var popperEscapeOffsets = getSideOffsets2(popperAltOverflow, popperRect, preventedOffsets);
      var isReferenceHidden = isAnySideFullyClipped2(referenceClippingOffsets);
      var hasPopperEscaped = isAnySideFullyClipped2(popperEscapeOffsets);
      state.modifiersData[name] = {
        referenceClippingOffsets,
        popperEscapeOffsets,
        isReferenceHidden,
        hasPopperEscaped
      };
      state.attributes.popper = Object.assign({}, state.attributes.popper, {
        "data-popper-reference-hidden": isReferenceHidden,
        "data-popper-escaped": hasPopperEscaped
      });
    }
    var hide$1 = {
      name: "hide",
      enabled: true,
      phase: "main",
      requiresIfExists: ["preventOverflow"],
      fn: hide2
    };
    var defaultModifiers$1 = [eventListeners, popperOffsets$1, computeStyles$1, applyStyles$1];
    var createPopper$1 = /* @__PURE__ */ popperGenerator({
      defaultModifiers: defaultModifiers$1
    });
    var defaultModifiers = [eventListeners, popperOffsets$1, computeStyles$1, applyStyles$1, offset$1, flip$1, preventOverflow$1, arrow$1, hide$1];
    var createPopper = /* @__PURE__ */ popperGenerator({
      defaultModifiers
    });
    exports.applyStyles = applyStyles$1;
    exports.arrow = arrow$1;
    exports.computeStyles = computeStyles$1;
    exports.createPopper = createPopper;
    exports.createPopperLite = createPopper$1;
    exports.defaultModifiers = defaultModifiers;
    exports.detectOverflow = detectOverflow2;
    exports.eventListeners = eventListeners;
    exports.flip = flip$1;
    exports.hide = hide$1;
    exports.offset = offset$1;
    exports.popperGenerator = popperGenerator;
    exports.popperOffsets = popperOffsets$1;
    exports.preventOverflow = preventOverflow$1;
  });
  var require_tippy_cjs = __commonJS((exports) => {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var core = require_popper();
    var ROUND_ARROW = '<svg width="16" height="6" xmlns="http://www.w3.org/2000/svg"><path d="M0 6s1.796-.013 4.67-3.615C5.851.9 6.93.006 8 0c1.07-.006 2.148.887 3.343 2.385C14.233 6.005 16 6 16 6H0z"></svg>';
    var BOX_CLASS = "tippy-box";
    var CONTENT_CLASS = "tippy-content";
    var BACKDROP_CLASS = "tippy-backdrop";
    var ARROW_CLASS = "tippy-arrow";
    var SVG_ARROW_CLASS = "tippy-svg-arrow";
    var TOUCH_OPTIONS = {
      passive: true,
      capture: true
    };
    function hasOwnProperty(obj, key) {
      return {}.hasOwnProperty.call(obj, key);
    }
    function getValueAtIndexOrReturn(value, index2, defaultValue) {
      if (Array.isArray(value)) {
        var v = value[index2];
        return v == null ? Array.isArray(defaultValue) ? defaultValue[index2] : defaultValue : v;
      }
      return value;
    }
    function isType(value, type) {
      var str = {}.toString.call(value);
      return str.indexOf("[object") === 0 && str.indexOf(type + "]") > -1;
    }
    function invokeWithArgsOrReturn(value, args) {
      return typeof value === "function" ? value.apply(void 0, args) : value;
    }
    function debounce(fn, ms) {
      if (ms === 0) {
        return fn;
      }
      var timeout;
      return function(arg) {
        clearTimeout(timeout);
        timeout = setTimeout(function() {
          fn(arg);
        }, ms);
      };
    }
    function removeProperties(obj, keys) {
      var clone2 = Object.assign({}, obj);
      keys.forEach(function(key) {
        delete clone2[key];
      });
      return clone2;
    }
    function splitBySpaces(value) {
      return value.split(/\s+/).filter(Boolean);
    }
    function normalizeToArray(value) {
      return [].concat(value);
    }
    function pushIfUnique(arr, value) {
      if (arr.indexOf(value) === -1) {
        arr.push(value);
      }
    }
    function unique(arr) {
      return arr.filter(function(item, index2) {
        return arr.indexOf(item) === index2;
      });
    }
    function getBasePlacement(placement) {
      return placement.split("-")[0];
    }
    function arrayFrom(value) {
      return [].slice.call(value);
    }
    function removeUndefinedProps(obj) {
      return Object.keys(obj).reduce(function(acc, key) {
        if (obj[key] !== void 0) {
          acc[key] = obj[key];
        }
        return acc;
      }, {});
    }
    function div() {
      return document.createElement("div");
    }
    function isElement2(value) {
      return ["Element", "Fragment"].some(function(type) {
        return isType(value, type);
      });
    }
    function isNodeList(value) {
      return isType(value, "NodeList");
    }
    function isMouseEvent(value) {
      return isType(value, "MouseEvent");
    }
    function isReferenceElement(value) {
      return !!(value && value._tippy && value._tippy.reference === value);
    }
    function getArrayOfElements(value) {
      if (isElement2(value)) {
        return [value];
      }
      if (isNodeList(value)) {
        return arrayFrom(value);
      }
      if (Array.isArray(value)) {
        return value;
      }
      return arrayFrom(document.querySelectorAll(value));
    }
    function setTransitionDuration(els, value) {
      els.forEach(function(el) {
        if (el) {
          el.style.transitionDuration = value + "ms";
        }
      });
    }
    function setVisibilityState(els, state) {
      els.forEach(function(el) {
        if (el) {
          el.setAttribute("data-state", state);
        }
      });
    }
    function getOwnerDocument(elementOrElements) {
      var _element$ownerDocumen;
      var _normalizeToArray = normalizeToArray(elementOrElements), element = _normalizeToArray[0];
      return (element == null ? void 0 : (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body) ? element.ownerDocument : document;
    }
    function isCursorOutsideInteractiveBorder(popperTreeData, event) {
      var clientX = event.clientX, clientY = event.clientY;
      return popperTreeData.every(function(_ref) {
        var popperRect = _ref.popperRect, popperState = _ref.popperState, props = _ref.props;
        var interactiveBorder = props.interactiveBorder;
        var basePlacement = getBasePlacement(popperState.placement);
        var offsetData = popperState.modifiersData.offset;
        if (!offsetData) {
          return true;
        }
        var topDistance = basePlacement === "bottom" ? offsetData.top.y : 0;
        var bottomDistance = basePlacement === "top" ? offsetData.bottom.y : 0;
        var leftDistance = basePlacement === "right" ? offsetData.left.x : 0;
        var rightDistance = basePlacement === "left" ? offsetData.right.x : 0;
        var exceedsTop = popperRect.top - clientY + topDistance > interactiveBorder;
        var exceedsBottom = clientY - popperRect.bottom - bottomDistance > interactiveBorder;
        var exceedsLeft = popperRect.left - clientX + leftDistance > interactiveBorder;
        var exceedsRight = clientX - popperRect.right - rightDistance > interactiveBorder;
        return exceedsTop || exceedsBottom || exceedsLeft || exceedsRight;
      });
    }
    function updateTransitionEndListener(box, action, listener) {
      var method = action + "EventListener";
      ["transitionend", "webkitTransitionEnd"].forEach(function(event) {
        box[method](event, listener);
      });
    }
    var currentInput = {
      isTouch: false
    };
    var lastMouseMoveTime = 0;
    function onDocumentTouchStart() {
      if (currentInput.isTouch) {
        return;
      }
      currentInput.isTouch = true;
      if (window.performance) {
        document.addEventListener("mousemove", onDocumentMouseMove);
      }
    }
    function onDocumentMouseMove() {
      var now = performance.now();
      if (now - lastMouseMoveTime < 20) {
        currentInput.isTouch = false;
        document.removeEventListener("mousemove", onDocumentMouseMove);
      }
      lastMouseMoveTime = now;
    }
    function onWindowBlur() {
      var activeElement = document.activeElement;
      if (isReferenceElement(activeElement)) {
        var instance = activeElement._tippy;
        if (activeElement.blur && !instance.state.isVisible) {
          activeElement.blur();
        }
      }
    }
    function bindGlobalEventListeners() {
      document.addEventListener("touchstart", onDocumentTouchStart, TOUCH_OPTIONS);
      window.addEventListener("blur", onWindowBlur);
    }
    var isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
    var ua = isBrowser ? navigator.userAgent : "";
    var isIE = /MSIE |Trident\//.test(ua);
    function createMemoryLeakWarning(method) {
      var txt = method === "destroy" ? "n already-" : " ";
      return [method + "() was called on a" + txt + "destroyed instance. This is a no-op but", "indicates a potential memory leak."].join(" ");
    }
    function clean(value) {
      var spacesAndTabs = /[ \t]{2,}/g;
      var lineStartWithSpaces = /^[ \t]*/gm;
      return value.replace(spacesAndTabs, " ").replace(lineStartWithSpaces, "").trim();
    }
    function getDevMessage(message) {
      return clean("\n  %ctippy.js\n\n  %c" + clean(message) + "\n\n  %c\u{1F477}\u200D This is a development-only message. It will be removed in production.\n  ");
    }
    function getFormattedMessage(message) {
      return [
        getDevMessage(message),
        "color: #00C584; font-size: 1.3em; font-weight: bold;",
        "line-height: 1.5",
        "color: #a6a095;"
      ];
    }
    var visitedMessages;
    if (true) {
      resetVisitedMessages();
    }
    function resetVisitedMessages() {
      visitedMessages = /* @__PURE__ */ new Set();
    }
    function warnWhen(condition, message) {
      if (condition && !visitedMessages.has(message)) {
        var _console;
        visitedMessages.add(message);
        (_console = console).warn.apply(_console, getFormattedMessage(message));
      }
    }
    function errorWhen(condition, message) {
      if (condition && !visitedMessages.has(message)) {
        var _console2;
        visitedMessages.add(message);
        (_console2 = console).error.apply(_console2, getFormattedMessage(message));
      }
    }
    function validateTargets(targets) {
      var didPassFalsyValue = !targets;
      var didPassPlainObject = Object.prototype.toString.call(targets) === "[object Object]" && !targets.addEventListener;
      errorWhen(didPassFalsyValue, ["tippy() was passed", "`" + String(targets) + "`", "as its targets (first) argument. Valid types are: String, Element,", "Element[], or NodeList."].join(" "));
      errorWhen(didPassPlainObject, ["tippy() was passed a plain object which is not supported as an argument", "for virtual positioning. Use props.getReferenceClientRect instead."].join(" "));
    }
    var pluginProps = {
      animateFill: false,
      followCursor: false,
      inlinePositioning: false,
      sticky: false
    };
    var renderProps = {
      allowHTML: false,
      animation: "fade",
      arrow: true,
      content: "",
      inertia: false,
      maxWidth: 350,
      role: "tooltip",
      theme: "",
      zIndex: 9999
    };
    var defaultProps = Object.assign({
      appendTo: function appendTo() {
        return document.body;
      },
      aria: {
        content: "auto",
        expanded: "auto"
      },
      delay: 0,
      duration: [300, 250],
      getReferenceClientRect: null,
      hideOnClick: true,
      ignoreAttributes: false,
      interactive: false,
      interactiveBorder: 2,
      interactiveDebounce: 0,
      moveTransition: "",
      offset: [0, 10],
      onAfterUpdate: function onAfterUpdate() {
      },
      onBeforeUpdate: function onBeforeUpdate() {
      },
      onCreate: function onCreate() {
      },
      onDestroy: function onDestroy() {
      },
      onHidden: function onHidden() {
      },
      onHide: function onHide() {
      },
      onMount: function onMount() {
      },
      onShow: function onShow() {
      },
      onShown: function onShown() {
      },
      onTrigger: function onTrigger() {
      },
      onUntrigger: function onUntrigger() {
      },
      onClickOutside: function onClickOutside() {
      },
      placement: "top",
      plugins: [],
      popperOptions: {},
      render: null,
      showOnCreate: false,
      touch: true,
      trigger: "mouseenter focus",
      triggerTarget: null
    }, pluginProps, {}, renderProps);
    var defaultKeys = Object.keys(defaultProps);
    var setDefaultProps = function setDefaultProps2(partialProps) {
      if (true) {
        validateProps(partialProps, []);
      }
      var keys = Object.keys(partialProps);
      keys.forEach(function(key) {
        defaultProps[key] = partialProps[key];
      });
    };
    function getExtendedPassedProps(passedProps) {
      var plugins2 = passedProps.plugins || [];
      var pluginProps2 = plugins2.reduce(function(acc, plugin) {
        var name = plugin.name, defaultValue = plugin.defaultValue;
        if (name) {
          acc[name] = passedProps[name] !== void 0 ? passedProps[name] : defaultValue;
        }
        return acc;
      }, {});
      return Object.assign({}, passedProps, {}, pluginProps2);
    }
    function getDataAttributeProps(reference, plugins2) {
      var propKeys = plugins2 ? Object.keys(getExtendedPassedProps(Object.assign({}, defaultProps, {
        plugins: plugins2
      }))) : defaultKeys;
      var props = propKeys.reduce(function(acc, key) {
        var valueAsString = (reference.getAttribute("data-tippy-" + key) || "").trim();
        if (!valueAsString) {
          return acc;
        }
        if (key === "content") {
          acc[key] = valueAsString;
        } else {
          try {
            acc[key] = JSON.parse(valueAsString);
          } catch (e) {
            acc[key] = valueAsString;
          }
        }
        return acc;
      }, {});
      return props;
    }
    function evaluateProps(reference, props) {
      var out = Object.assign({}, props, {
        content: invokeWithArgsOrReturn(props.content, [reference])
      }, props.ignoreAttributes ? {} : getDataAttributeProps(reference, props.plugins));
      out.aria = Object.assign({}, defaultProps.aria, {}, out.aria);
      out.aria = {
        expanded: out.aria.expanded === "auto" ? props.interactive : out.aria.expanded,
        content: out.aria.content === "auto" ? props.interactive ? null : "describedby" : out.aria.content
      };
      return out;
    }
    function validateProps(partialProps, plugins2) {
      if (partialProps === void 0) {
        partialProps = {};
      }
      if (plugins2 === void 0) {
        plugins2 = [];
      }
      var keys = Object.keys(partialProps);
      keys.forEach(function(prop) {
        var nonPluginProps = removeProperties(defaultProps, Object.keys(pluginProps));
        var didPassUnknownProp = !hasOwnProperty(nonPluginProps, prop);
        if (didPassUnknownProp) {
          didPassUnknownProp = plugins2.filter(function(plugin) {
            return plugin.name === prop;
          }).length === 0;
        }
        warnWhen(didPassUnknownProp, ["`" + prop + "`", "is not a valid prop. You may have spelled it incorrectly, or if it's", "a plugin, forgot to pass it in an array as props.plugins.", "\n\n", "All props: https://atomiks.github.io/tippyjs/v6/all-props/\n", "Plugins: https://atomiks.github.io/tippyjs/v6/plugins/"].join(" "));
      });
    }
    var innerHTML = function innerHTML2() {
      return "innerHTML";
    };
    function dangerouslySetInnerHTML(element, html) {
      element[innerHTML()] = html;
    }
    function createArrowElement(value) {
      var arrow2 = div();
      if (value === true) {
        arrow2.className = ARROW_CLASS;
      } else {
        arrow2.className = SVG_ARROW_CLASS;
        if (isElement2(value)) {
          arrow2.appendChild(value);
        } else {
          dangerouslySetInnerHTML(arrow2, value);
        }
      }
      return arrow2;
    }
    function setContent(content, props) {
      if (isElement2(props.content)) {
        dangerouslySetInnerHTML(content, "");
        content.appendChild(props.content);
      } else if (typeof props.content !== "function") {
        if (props.allowHTML) {
          dangerouslySetInnerHTML(content, props.content);
        } else {
          content.textContent = props.content;
        }
      }
    }
    function getChildren(popper) {
      var box = popper.firstElementChild;
      var boxChildren = arrayFrom(box.children);
      return {
        box,
        content: boxChildren.find(function(node) {
          return node.classList.contains(CONTENT_CLASS);
        }),
        arrow: boxChildren.find(function(node) {
          return node.classList.contains(ARROW_CLASS) || node.classList.contains(SVG_ARROW_CLASS);
        }),
        backdrop: boxChildren.find(function(node) {
          return node.classList.contains(BACKDROP_CLASS);
        })
      };
    }
    function render(instance) {
      var popper = div();
      var box = div();
      box.className = BOX_CLASS;
      box.setAttribute("data-state", "hidden");
      box.setAttribute("tabindex", "-1");
      var content = div();
      content.className = CONTENT_CLASS;
      content.setAttribute("data-state", "hidden");
      setContent(content, instance.props);
      popper.appendChild(box);
      box.appendChild(content);
      onUpdate(instance.props, instance.props);
      function onUpdate(prevProps, nextProps) {
        var _getChildren = getChildren(popper), box2 = _getChildren.box, content2 = _getChildren.content, arrow2 = _getChildren.arrow;
        if (nextProps.theme) {
          box2.setAttribute("data-theme", nextProps.theme);
        } else {
          box2.removeAttribute("data-theme");
        }
        if (typeof nextProps.animation === "string") {
          box2.setAttribute("data-animation", nextProps.animation);
        } else {
          box2.removeAttribute("data-animation");
        }
        if (nextProps.inertia) {
          box2.setAttribute("data-inertia", "");
        } else {
          box2.removeAttribute("data-inertia");
        }
        box2.style.maxWidth = typeof nextProps.maxWidth === "number" ? nextProps.maxWidth + "px" : nextProps.maxWidth;
        if (nextProps.role) {
          box2.setAttribute("role", nextProps.role);
        } else {
          box2.removeAttribute("role");
        }
        if (prevProps.content !== nextProps.content || prevProps.allowHTML !== nextProps.allowHTML) {
          setContent(content2, instance.props);
        }
        if (nextProps.arrow) {
          if (!arrow2) {
            box2.appendChild(createArrowElement(nextProps.arrow));
          } else if (prevProps.arrow !== nextProps.arrow) {
            box2.removeChild(arrow2);
            box2.appendChild(createArrowElement(nextProps.arrow));
          }
        } else if (arrow2) {
          box2.removeChild(arrow2);
        }
      }
      return {
        popper,
        onUpdate
      };
    }
    render.$$tippy = true;
    var idCounter = 1;
    var mouseMoveListeners = [];
    var mountedInstances = [];
    function createTippy(reference, passedProps) {
      var props = evaluateProps(reference, Object.assign({}, defaultProps, {}, getExtendedPassedProps(removeUndefinedProps(passedProps))));
      var showTimeout;
      var hideTimeout;
      var scheduleHideAnimationFrame;
      var isVisibleFromClick = false;
      var didHideDueToDocumentMouseDown = false;
      var didTouchMove = false;
      var ignoreOnFirstUpdate = false;
      var lastTriggerEvent;
      var currentTransitionEndListener;
      var onFirstUpdate;
      var listeners = [];
      var debouncedOnMouseMove = debounce(onMouseMove, props.interactiveDebounce);
      var currentTarget;
      var id = idCounter++;
      var popperInstance = null;
      var plugins2 = unique(props.plugins);
      var state = {
        isEnabled: true,
        isVisible: false,
        isDestroyed: false,
        isMounted: false,
        isShown: false
      };
      var instance = {
        id,
        reference,
        popper: div(),
        popperInstance,
        props,
        state,
        plugins: plugins2,
        clearDelayTimeouts,
        setProps,
        setContent: setContent2,
        show,
        hide: hide2,
        hideWithInteractivity,
        enable,
        disable,
        unmount,
        destroy: destroy2
      };
      if (!props.render) {
        if (true) {
          errorWhen(true, "render() function has not been supplied.");
        }
        return instance;
      }
      var _props$render = props.render(instance), popper = _props$render.popper, onUpdate = _props$render.onUpdate;
      popper.setAttribute("data-tippy-root", "");
      popper.id = "tippy-" + instance.id;
      instance.popper = popper;
      reference._tippy = instance;
      popper._tippy = instance;
      var pluginsHooks = plugins2.map(function(plugin) {
        return plugin.fn(instance);
      });
      var hasAriaExpanded = reference.hasAttribute("aria-expanded");
      addListeners();
      handleAriaExpandedAttribute();
      handleStyles();
      invokeHook("onCreate", [instance]);
      if (props.showOnCreate) {
        scheduleShow();
      }
      popper.addEventListener("mouseenter", function() {
        if (instance.props.interactive && instance.state.isVisible) {
          instance.clearDelayTimeouts();
        }
      });
      popper.addEventListener("mouseleave", function(event) {
        if (instance.props.interactive && instance.props.trigger.indexOf("mouseenter") >= 0) {
          getDocument().addEventListener("mousemove", debouncedOnMouseMove);
          debouncedOnMouseMove(event);
        }
      });
      return instance;
      function getNormalizedTouchSettings() {
        var touch = instance.props.touch;
        return Array.isArray(touch) ? touch : [touch, 0];
      }
      function getIsCustomTouchBehavior() {
        return getNormalizedTouchSettings()[0] === "hold";
      }
      function getIsDefaultRenderFn() {
        var _instance$props$rende;
        return !!((_instance$props$rende = instance.props.render) == null ? void 0 : _instance$props$rende.$$tippy);
      }
      function getCurrentTarget() {
        return currentTarget || reference;
      }
      function getDocument() {
        var parent = getCurrentTarget().parentNode;
        return parent ? getOwnerDocument(parent) : document;
      }
      function getDefaultTemplateChildren() {
        return getChildren(popper);
      }
      function getDelay(isShow) {
        if (instance.state.isMounted && !instance.state.isVisible || currentInput.isTouch || lastTriggerEvent && lastTriggerEvent.type === "focus") {
          return 0;
        }
        return getValueAtIndexOrReturn(instance.props.delay, isShow ? 0 : 1, defaultProps.delay);
      }
      function handleStyles() {
        popper.style.pointerEvents = instance.props.interactive && instance.state.isVisible ? "" : "none";
        popper.style.zIndex = "" + instance.props.zIndex;
      }
      function invokeHook(hook, args, shouldInvokePropsHook) {
        if (shouldInvokePropsHook === void 0) {
          shouldInvokePropsHook = true;
        }
        pluginsHooks.forEach(function(pluginHooks) {
          if (pluginHooks[hook]) {
            pluginHooks[hook].apply(void 0, args);
          }
        });
        if (shouldInvokePropsHook) {
          var _instance$props;
          (_instance$props = instance.props)[hook].apply(_instance$props, args);
        }
      }
      function handleAriaContentAttribute() {
        var aria = instance.props.aria;
        if (!aria.content) {
          return;
        }
        var attr = "aria-" + aria.content;
        var id2 = popper.id;
        var nodes = normalizeToArray(instance.props.triggerTarget || reference);
        nodes.forEach(function(node) {
          var currentValue = node.getAttribute(attr);
          if (instance.state.isVisible) {
            node.setAttribute(attr, currentValue ? currentValue + " " + id2 : id2);
          } else {
            var nextValue = currentValue && currentValue.replace(id2, "").trim();
            if (nextValue) {
              node.setAttribute(attr, nextValue);
            } else {
              node.removeAttribute(attr);
            }
          }
        });
      }
      function handleAriaExpandedAttribute() {
        if (hasAriaExpanded || !instance.props.aria.expanded) {
          return;
        }
        var nodes = normalizeToArray(instance.props.triggerTarget || reference);
        nodes.forEach(function(node) {
          if (instance.props.interactive) {
            node.setAttribute("aria-expanded", instance.state.isVisible && node === getCurrentTarget() ? "true" : "false");
          } else {
            node.removeAttribute("aria-expanded");
          }
        });
      }
      function cleanupInteractiveMouseListeners() {
        getDocument().removeEventListener("mousemove", debouncedOnMouseMove);
        mouseMoveListeners = mouseMoveListeners.filter(function(listener) {
          return listener !== debouncedOnMouseMove;
        });
      }
      function onDocumentPress(event) {
        if (currentInput.isTouch) {
          if (didTouchMove || event.type === "mousedown") {
            return;
          }
        }
        if (instance.props.interactive && popper.contains(event.target)) {
          return;
        }
        if (getCurrentTarget().contains(event.target)) {
          if (currentInput.isTouch) {
            return;
          }
          if (instance.state.isVisible && instance.props.trigger.indexOf("click") >= 0) {
            return;
          }
        } else {
          invokeHook("onClickOutside", [instance, event]);
        }
        if (instance.props.hideOnClick === true) {
          instance.clearDelayTimeouts();
          instance.hide();
          didHideDueToDocumentMouseDown = true;
          setTimeout(function() {
            didHideDueToDocumentMouseDown = false;
          });
          if (!instance.state.isMounted) {
            removeDocumentPress();
          }
        }
      }
      function onTouchMove() {
        didTouchMove = true;
      }
      function onTouchStart() {
        didTouchMove = false;
      }
      function addDocumentPress() {
        var doc = getDocument();
        doc.addEventListener("mousedown", onDocumentPress, true);
        doc.addEventListener("touchend", onDocumentPress, TOUCH_OPTIONS);
        doc.addEventListener("touchstart", onTouchStart, TOUCH_OPTIONS);
        doc.addEventListener("touchmove", onTouchMove, TOUCH_OPTIONS);
      }
      function removeDocumentPress() {
        var doc = getDocument();
        doc.removeEventListener("mousedown", onDocumentPress, true);
        doc.removeEventListener("touchend", onDocumentPress, TOUCH_OPTIONS);
        doc.removeEventListener("touchstart", onTouchStart, TOUCH_OPTIONS);
        doc.removeEventListener("touchmove", onTouchMove, TOUCH_OPTIONS);
      }
      function onTransitionedOut(duration, callback) {
        onTransitionEnd(duration, function() {
          if (!instance.state.isVisible && popper.parentNode && popper.parentNode.contains(popper)) {
            callback();
          }
        });
      }
      function onTransitionedIn(duration, callback) {
        onTransitionEnd(duration, callback);
      }
      function onTransitionEnd(duration, callback) {
        var box = getDefaultTemplateChildren().box;
        function listener(event) {
          if (event.target === box) {
            updateTransitionEndListener(box, "remove", listener);
            callback();
          }
        }
        if (duration === 0) {
          return callback();
        }
        updateTransitionEndListener(box, "remove", currentTransitionEndListener);
        updateTransitionEndListener(box, "add", listener);
        currentTransitionEndListener = listener;
      }
      function on2(eventType, handler, options) {
        if (options === void 0) {
          options = false;
        }
        var nodes = normalizeToArray(instance.props.triggerTarget || reference);
        nodes.forEach(function(node) {
          node.addEventListener(eventType, handler, options);
          listeners.push({
            node,
            eventType,
            handler,
            options
          });
        });
      }
      function addListeners() {
        if (getIsCustomTouchBehavior()) {
          on2("touchstart", onTrigger, {
            passive: true
          });
          on2("touchend", onMouseLeave, {
            passive: true
          });
        }
        splitBySpaces(instance.props.trigger).forEach(function(eventType) {
          if (eventType === "manual") {
            return;
          }
          on2(eventType, onTrigger);
          switch (eventType) {
            case "mouseenter":
              on2("mouseleave", onMouseLeave);
              break;
            case "focus":
              on2(isIE ? "focusout" : "blur", onBlurOrFocusOut);
              break;
            case "focusin":
              on2("focusout", onBlurOrFocusOut);
              break;
          }
        });
      }
      function removeListeners() {
        listeners.forEach(function(_ref) {
          var node = _ref.node, eventType = _ref.eventType, handler = _ref.handler, options = _ref.options;
          node.removeEventListener(eventType, handler, options);
        });
        listeners = [];
      }
      function onTrigger(event) {
        var _lastTriggerEvent;
        var shouldScheduleClickHide = false;
        if (!instance.state.isEnabled || isEventListenerStopped(event) || didHideDueToDocumentMouseDown) {
          return;
        }
        var wasFocused = ((_lastTriggerEvent = lastTriggerEvent) == null ? void 0 : _lastTriggerEvent.type) === "focus";
        lastTriggerEvent = event;
        currentTarget = event.currentTarget;
        handleAriaExpandedAttribute();
        if (!instance.state.isVisible && isMouseEvent(event)) {
          mouseMoveListeners.forEach(function(listener) {
            return listener(event);
          });
        }
        if (event.type === "click" && (instance.props.trigger.indexOf("mouseenter") < 0 || isVisibleFromClick) && instance.props.hideOnClick !== false && instance.state.isVisible) {
          shouldScheduleClickHide = true;
        } else {
          scheduleShow(event);
        }
        if (event.type === "click") {
          isVisibleFromClick = !shouldScheduleClickHide;
        }
        if (shouldScheduleClickHide && !wasFocused) {
          scheduleHide(event);
        }
      }
      function onMouseMove(event) {
        var target = event.target;
        var isCursorOverReferenceOrPopper = getCurrentTarget().contains(target) || popper.contains(target);
        if (event.type === "mousemove" && isCursorOverReferenceOrPopper) {
          return;
        }
        var popperTreeData = getNestedPopperTree().concat(popper).map(function(popper2) {
          var _instance$popperInsta;
          var instance2 = popper2._tippy;
          var state2 = (_instance$popperInsta = instance2.popperInstance) == null ? void 0 : _instance$popperInsta.state;
          if (state2) {
            return {
              popperRect: popper2.getBoundingClientRect(),
              popperState: state2,
              props
            };
          }
          return null;
        }).filter(Boolean);
        if (isCursorOutsideInteractiveBorder(popperTreeData, event)) {
          cleanupInteractiveMouseListeners();
          scheduleHide(event);
        }
      }
      function onMouseLeave(event) {
        var shouldBail = isEventListenerStopped(event) || instance.props.trigger.indexOf("click") >= 0 && isVisibleFromClick;
        if (shouldBail) {
          return;
        }
        if (instance.props.interactive) {
          instance.hideWithInteractivity(event);
          return;
        }
        scheduleHide(event);
      }
      function onBlurOrFocusOut(event) {
        if (instance.props.trigger.indexOf("focusin") < 0 && event.target !== getCurrentTarget()) {
          return;
        }
        if (instance.props.interactive && event.relatedTarget && popper.contains(event.relatedTarget)) {
          return;
        }
        scheduleHide(event);
      }
      function isEventListenerStopped(event) {
        return currentInput.isTouch ? getIsCustomTouchBehavior() !== event.type.indexOf("touch") >= 0 : false;
      }
      function createPopperInstance() {
        destroyPopperInstance();
        var _instance$props2 = instance.props, popperOptions = _instance$props2.popperOptions, placement = _instance$props2.placement, offset2 = _instance$props2.offset, getReferenceClientRect = _instance$props2.getReferenceClientRect, moveTransition = _instance$props2.moveTransition;
        var arrow2 = getIsDefaultRenderFn() ? getChildren(popper).arrow : null;
        var computedReference = getReferenceClientRect ? {
          getBoundingClientRect: getReferenceClientRect,
          contextElement: getReferenceClientRect.contextElement || getCurrentTarget()
        } : reference;
        var tippyModifier = {
          name: "$$tippy",
          enabled: true,
          phase: "beforeWrite",
          requires: ["computeStyles"],
          fn: function fn(_ref2) {
            var state2 = _ref2.state;
            if (getIsDefaultRenderFn()) {
              var _getDefaultTemplateCh = getDefaultTemplateChildren(), box = _getDefaultTemplateCh.box;
              ["placement", "reference-hidden", "escaped"].forEach(function(attr) {
                if (attr === "placement") {
                  box.setAttribute("data-placement", state2.placement);
                } else {
                  if (state2.attributes.popper["data-popper-" + attr]) {
                    box.setAttribute("data-" + attr, "");
                  } else {
                    box.removeAttribute("data-" + attr);
                  }
                }
              });
              state2.attributes.popper = {};
            }
          }
        };
        var modifiers = [{
          name: "offset",
          options: {
            offset: offset2
          }
        }, {
          name: "preventOverflow",
          options: {
            padding: {
              top: 2,
              bottom: 2,
              left: 5,
              right: 5
            }
          }
        }, {
          name: "flip",
          options: {
            padding: 5
          }
        }, {
          name: "computeStyles",
          options: {
            adaptive: !moveTransition
          }
        }, tippyModifier];
        if (getIsDefaultRenderFn() && arrow2) {
          modifiers.push({
            name: "arrow",
            options: {
              element: arrow2,
              padding: 3
            }
          });
        }
        modifiers.push.apply(modifiers, (popperOptions == null ? void 0 : popperOptions.modifiers) || []);
        instance.popperInstance = core.createPopper(computedReference, popper, Object.assign({}, popperOptions, {
          placement,
          onFirstUpdate,
          modifiers
        }));
      }
      function destroyPopperInstance() {
        if (instance.popperInstance) {
          instance.popperInstance.destroy();
          instance.popperInstance = null;
        }
      }
      function mount2() {
        var appendTo = instance.props.appendTo;
        var parentNode;
        var node = getCurrentTarget();
        if (instance.props.interactive && appendTo === defaultProps.appendTo || appendTo === "parent") {
          parentNode = node.parentNode;
        } else {
          parentNode = invokeWithArgsOrReturn(appendTo, [node]);
        }
        if (!parentNode.contains(popper)) {
          parentNode.appendChild(popper);
        }
        createPopperInstance();
        if (true) {
          warnWhen(instance.props.interactive && appendTo === defaultProps.appendTo && node.nextElementSibling !== popper, ["Interactive tippy element may not be accessible via keyboard", "navigation because it is not directly after the reference element", "in the DOM source order.", "\n\n", "Using a wrapper <div> or <span> tag around the reference element", "solves this by creating a new parentNode context.", "\n\n", "Specifying `appendTo: document.body` silences this warning, but it", "assumes you are using a focus management solution to handle", "keyboard navigation.", "\n\n", "See: https://atomiks.github.io/tippyjs/v6/accessibility/#interactivity"].join(" "));
        }
      }
      function getNestedPopperTree() {
        return arrayFrom(popper.querySelectorAll("[data-tippy-root]"));
      }
      function scheduleShow(event) {
        instance.clearDelayTimeouts();
        if (event) {
          invokeHook("onTrigger", [instance, event]);
        }
        addDocumentPress();
        var delay = getDelay(true);
        var _getNormalizedTouchSe = getNormalizedTouchSettings(), touchValue = _getNormalizedTouchSe[0], touchDelay = _getNormalizedTouchSe[1];
        if (currentInput.isTouch && touchValue === "hold" && touchDelay) {
          delay = touchDelay;
        }
        if (delay) {
          showTimeout = setTimeout(function() {
            instance.show();
          }, delay);
        } else {
          instance.show();
        }
      }
      function scheduleHide(event) {
        instance.clearDelayTimeouts();
        invokeHook("onUntrigger", [instance, event]);
        if (!instance.state.isVisible) {
          removeDocumentPress();
          return;
        }
        if (instance.props.trigger.indexOf("mouseenter") >= 0 && instance.props.trigger.indexOf("click") >= 0 && ["mouseleave", "mousemove"].indexOf(event.type) >= 0 && isVisibleFromClick) {
          return;
        }
        var delay = getDelay(false);
        if (delay) {
          hideTimeout = setTimeout(function() {
            if (instance.state.isVisible) {
              instance.hide();
            }
          }, delay);
        } else {
          scheduleHideAnimationFrame = requestAnimationFrame(function() {
            instance.hide();
          });
        }
      }
      function enable() {
        instance.state.isEnabled = true;
      }
      function disable() {
        instance.hide();
        instance.state.isEnabled = false;
      }
      function clearDelayTimeouts() {
        clearTimeout(showTimeout);
        clearTimeout(hideTimeout);
        cancelAnimationFrame(scheduleHideAnimationFrame);
      }
      function setProps(partialProps) {
        if (true) {
          warnWhen(instance.state.isDestroyed, createMemoryLeakWarning("setProps"));
        }
        if (instance.state.isDestroyed) {
          return;
        }
        invokeHook("onBeforeUpdate", [instance, partialProps]);
        removeListeners();
        var prevProps = instance.props;
        var nextProps = evaluateProps(reference, Object.assign({}, instance.props, {}, partialProps, {
          ignoreAttributes: true
        }));
        instance.props = nextProps;
        addListeners();
        if (prevProps.interactiveDebounce !== nextProps.interactiveDebounce) {
          cleanupInteractiveMouseListeners();
          debouncedOnMouseMove = debounce(onMouseMove, nextProps.interactiveDebounce);
        }
        if (prevProps.triggerTarget && !nextProps.triggerTarget) {
          normalizeToArray(prevProps.triggerTarget).forEach(function(node) {
            node.removeAttribute("aria-expanded");
          });
        } else if (nextProps.triggerTarget) {
          reference.removeAttribute("aria-expanded");
        }
        handleAriaExpandedAttribute();
        handleStyles();
        if (onUpdate) {
          onUpdate(prevProps, nextProps);
        }
        if (instance.popperInstance) {
          createPopperInstance();
          getNestedPopperTree().forEach(function(nestedPopper) {
            requestAnimationFrame(nestedPopper._tippy.popperInstance.forceUpdate);
          });
        }
        invokeHook("onAfterUpdate", [instance, partialProps]);
      }
      function setContent2(content) {
        instance.setProps({
          content
        });
      }
      function show() {
        if (true) {
          warnWhen(instance.state.isDestroyed, createMemoryLeakWarning("show"));
        }
        var isAlreadyVisible = instance.state.isVisible;
        var isDestroyed = instance.state.isDestroyed;
        var isDisabled = !instance.state.isEnabled;
        var isTouchAndTouchDisabled = currentInput.isTouch && !instance.props.touch;
        var duration = getValueAtIndexOrReturn(instance.props.duration, 0, defaultProps.duration);
        if (isAlreadyVisible || isDestroyed || isDisabled || isTouchAndTouchDisabled) {
          return;
        }
        if (getCurrentTarget().hasAttribute("disabled")) {
          return;
        }
        invokeHook("onShow", [instance], false);
        if (instance.props.onShow(instance) === false) {
          return;
        }
        instance.state.isVisible = true;
        if (getIsDefaultRenderFn()) {
          popper.style.visibility = "visible";
        }
        handleStyles();
        addDocumentPress();
        if (!instance.state.isMounted) {
          popper.style.transition = "none";
        }
        if (getIsDefaultRenderFn()) {
          var _getDefaultTemplateCh2 = getDefaultTemplateChildren(), box = _getDefaultTemplateCh2.box, content = _getDefaultTemplateCh2.content;
          setTransitionDuration([box, content], 0);
        }
        onFirstUpdate = function onFirstUpdate2() {
          var _instance$popperInsta2;
          if (!instance.state.isVisible || ignoreOnFirstUpdate) {
            return;
          }
          ignoreOnFirstUpdate = true;
          void popper.offsetHeight;
          popper.style.transition = instance.props.moveTransition;
          if (getIsDefaultRenderFn() && instance.props.animation) {
            var _getDefaultTemplateCh3 = getDefaultTemplateChildren(), _box = _getDefaultTemplateCh3.box, _content = _getDefaultTemplateCh3.content;
            setTransitionDuration([_box, _content], duration);
            setVisibilityState([_box, _content], "visible");
          }
          handleAriaContentAttribute();
          handleAriaExpandedAttribute();
          pushIfUnique(mountedInstances, instance);
          (_instance$popperInsta2 = instance.popperInstance) == null ? void 0 : _instance$popperInsta2.forceUpdate();
          instance.state.isMounted = true;
          invokeHook("onMount", [instance]);
          if (instance.props.animation && getIsDefaultRenderFn()) {
            onTransitionedIn(duration, function() {
              instance.state.isShown = true;
              invokeHook("onShown", [instance]);
            });
          }
        };
        mount2();
      }
      function hide2() {
        if (true) {
          warnWhen(instance.state.isDestroyed, createMemoryLeakWarning("hide"));
        }
        var isAlreadyHidden = !instance.state.isVisible;
        var isDestroyed = instance.state.isDestroyed;
        var isDisabled = !instance.state.isEnabled;
        var duration = getValueAtIndexOrReturn(instance.props.duration, 1, defaultProps.duration);
        if (isAlreadyHidden || isDestroyed || isDisabled) {
          return;
        }
        invokeHook("onHide", [instance], false);
        if (instance.props.onHide(instance) === false) {
          return;
        }
        instance.state.isVisible = false;
        instance.state.isShown = false;
        ignoreOnFirstUpdate = false;
        isVisibleFromClick = false;
        if (getIsDefaultRenderFn()) {
          popper.style.visibility = "hidden";
        }
        cleanupInteractiveMouseListeners();
        removeDocumentPress();
        handleStyles();
        if (getIsDefaultRenderFn()) {
          var _getDefaultTemplateCh4 = getDefaultTemplateChildren(), box = _getDefaultTemplateCh4.box, content = _getDefaultTemplateCh4.content;
          if (instance.props.animation) {
            setTransitionDuration([box, content], duration);
            setVisibilityState([box, content], "hidden");
          }
        }
        handleAriaContentAttribute();
        handleAriaExpandedAttribute();
        if (instance.props.animation) {
          if (getIsDefaultRenderFn()) {
            onTransitionedOut(duration, instance.unmount);
          }
        } else {
          instance.unmount();
        }
      }
      function hideWithInteractivity(event) {
        if (true) {
          warnWhen(instance.state.isDestroyed, createMemoryLeakWarning("hideWithInteractivity"));
        }
        getDocument().addEventListener("mousemove", debouncedOnMouseMove);
        pushIfUnique(mouseMoveListeners, debouncedOnMouseMove);
        debouncedOnMouseMove(event);
      }
      function unmount() {
        if (true) {
          warnWhen(instance.state.isDestroyed, createMemoryLeakWarning("unmount"));
        }
        if (instance.state.isVisible) {
          instance.hide();
        }
        if (!instance.state.isMounted) {
          return;
        }
        destroyPopperInstance();
        getNestedPopperTree().forEach(function(nestedPopper) {
          nestedPopper._tippy.unmount();
        });
        if (popper.parentNode) {
          popper.parentNode.removeChild(popper);
        }
        mountedInstances = mountedInstances.filter(function(i) {
          return i !== instance;
        });
        instance.state.isMounted = false;
        invokeHook("onHidden", [instance]);
      }
      function destroy2() {
        if (true) {
          warnWhen(instance.state.isDestroyed, createMemoryLeakWarning("destroy"));
        }
        if (instance.state.isDestroyed) {
          return;
        }
        instance.clearDelayTimeouts();
        instance.unmount();
        removeListeners();
        delete reference._tippy;
        instance.state.isDestroyed = true;
        invokeHook("onDestroy", [instance]);
      }
    }
    function tippy2(targets, optionalProps) {
      if (optionalProps === void 0) {
        optionalProps = {};
      }
      var plugins2 = defaultProps.plugins.concat(optionalProps.plugins || []);
      if (true) {
        validateTargets(targets);
        validateProps(optionalProps, plugins2);
      }
      bindGlobalEventListeners();
      var passedProps = Object.assign({}, optionalProps, {
        plugins: plugins2
      });
      var elements = getArrayOfElements(targets);
      if (true) {
        var isSingleContentElement = isElement2(passedProps.content);
        var isMoreThanOneReferenceElement = elements.length > 1;
        warnWhen(isSingleContentElement && isMoreThanOneReferenceElement, ["tippy() was passed an Element as the `content` prop, but more than", "one tippy instance was created by this invocation. This means the", "content element will only be appended to the last tippy instance.", "\n\n", "Instead, pass the .innerHTML of the element, or use a function that", "returns a cloned version of the element instead.", "\n\n", "1) content: element.innerHTML\n", "2) content: () => element.cloneNode(true)"].join(" "));
      }
      var instances = elements.reduce(function(acc, reference) {
        var instance = reference && createTippy(reference, passedProps);
        if (instance) {
          acc.push(instance);
        }
        return acc;
      }, []);
      return isElement2(targets) ? instances[0] : instances;
    }
    tippy2.defaultProps = defaultProps;
    tippy2.setDefaultProps = setDefaultProps;
    tippy2.currentInput = currentInput;
    var hideAll = function hideAll2(_temp) {
      var _ref = _temp === void 0 ? {} : _temp, excludedReferenceOrInstance = _ref.exclude, duration = _ref.duration;
      mountedInstances.forEach(function(instance) {
        var isExcluded = false;
        if (excludedReferenceOrInstance) {
          isExcluded = isReferenceElement(excludedReferenceOrInstance) ? instance.reference === excludedReferenceOrInstance : instance.popper === excludedReferenceOrInstance.popper;
        }
        if (!isExcluded) {
          var originalDuration = instance.props.duration;
          instance.setProps({
            duration
          });
          instance.hide();
          if (!instance.state.isDestroyed) {
            instance.setProps({
              duration: originalDuration
            });
          }
        }
      });
    };
    var applyStylesModifier = Object.assign({}, core.applyStyles, {
      effect: function effect(_ref) {
        var state = _ref.state;
        var initialStyles = {
          popper: {
            position: state.options.strategy,
            left: "0",
            top: "0",
            margin: "0"
          },
          arrow: {
            position: "absolute"
          },
          reference: {}
        };
        Object.assign(state.elements.popper.style, initialStyles.popper);
        state.styles = initialStyles;
        if (state.elements.arrow) {
          Object.assign(state.elements.arrow.style, initialStyles.arrow);
        }
      }
    });
    var createSingleton = function createSingleton2(tippyInstances, optionalProps) {
      var _optionalProps$popper;
      if (optionalProps === void 0) {
        optionalProps = {};
      }
      if (true) {
        errorWhen(!Array.isArray(tippyInstances), ["The first argument passed to createSingleton() must be an array of", "tippy instances. The passed value was", String(tippyInstances)].join(" "));
      }
      var individualInstances = tippyInstances;
      var references = [];
      var currentTarget;
      var overrides = optionalProps.overrides;
      var interceptSetPropsCleanups = [];
      var shownOnCreate = false;
      function setReferences() {
        references = individualInstances.map(function(instance) {
          return instance.reference;
        });
      }
      function enableInstances(isEnabled) {
        individualInstances.forEach(function(instance) {
          if (isEnabled) {
            instance.enable();
          } else {
            instance.disable();
          }
        });
      }
      function interceptSetProps(singleton2) {
        return individualInstances.map(function(instance) {
          var originalSetProps2 = instance.setProps;
          instance.setProps = function(props) {
            originalSetProps2(props);
            if (instance.reference === currentTarget) {
              singleton2.setProps(props);
            }
          };
          return function() {
            instance.setProps = originalSetProps2;
          };
        });
      }
      function prepareInstance(singleton2, target) {
        var index2 = references.indexOf(target);
        if (target === currentTarget) {
          return;
        }
        currentTarget = target;
        var overrideProps = (overrides || []).concat("content").reduce(function(acc, prop) {
          acc[prop] = individualInstances[index2].props[prop];
          return acc;
        }, {});
        singleton2.setProps(Object.assign({}, overrideProps, {
          getReferenceClientRect: typeof overrideProps.getReferenceClientRect === "function" ? overrideProps.getReferenceClientRect : function() {
            return target.getBoundingClientRect();
          }
        }));
      }
      enableInstances(false);
      setReferences();
      var plugin = {
        fn: function fn() {
          return {
            onDestroy: function onDestroy() {
              enableInstances(true);
            },
            onHidden: function onHidden() {
              currentTarget = null;
            },
            onClickOutside: function onClickOutside(instance) {
              if (instance.props.showOnCreate && !shownOnCreate) {
                shownOnCreate = true;
                currentTarget = null;
              }
            },
            onShow: function onShow(instance) {
              if (instance.props.showOnCreate && !shownOnCreate) {
                shownOnCreate = true;
                prepareInstance(instance, references[0]);
              }
            },
            onTrigger: function onTrigger(instance, event) {
              prepareInstance(instance, event.currentTarget);
            }
          };
        }
      };
      var singleton = tippy2(div(), Object.assign({}, removeProperties(optionalProps, ["overrides"]), {
        plugins: [plugin].concat(optionalProps.plugins || []),
        triggerTarget: references,
        popperOptions: Object.assign({}, optionalProps.popperOptions, {
          modifiers: [].concat(((_optionalProps$popper = optionalProps.popperOptions) == null ? void 0 : _optionalProps$popper.modifiers) || [], [applyStylesModifier])
        })
      }));
      var originalShow = singleton.show;
      singleton.show = function(target) {
        originalShow();
        if (!currentTarget && target == null) {
          return prepareInstance(singleton, references[0]);
        }
        if (currentTarget && target == null) {
          return;
        }
        if (typeof target === "number") {
          return references[target] && prepareInstance(singleton, references[target]);
        }
        if (individualInstances.includes(target)) {
          var ref = target.reference;
          return prepareInstance(singleton, ref);
        }
        if (references.includes(target)) {
          return prepareInstance(singleton, target);
        }
      };
      singleton.showNext = function() {
        var first = references[0];
        if (!currentTarget) {
          return singleton.show(0);
        }
        var index2 = references.indexOf(currentTarget);
        singleton.show(references[index2 + 1] || first);
      };
      singleton.showPrevious = function() {
        var last = references[references.length - 1];
        if (!currentTarget) {
          return singleton.show(last);
        }
        var index2 = references.indexOf(currentTarget);
        var target = references[index2 - 1] || last;
        singleton.show(target);
      };
      var originalSetProps = singleton.setProps;
      singleton.setProps = function(props) {
        overrides = props.overrides || overrides;
        originalSetProps(props);
      };
      singleton.setInstances = function(nextInstances) {
        enableInstances(true);
        interceptSetPropsCleanups.forEach(function(fn) {
          return fn();
        });
        individualInstances = nextInstances;
        enableInstances(false);
        setReferences();
        interceptSetProps(singleton);
        singleton.setProps({
          triggerTarget: references
        });
      };
      interceptSetPropsCleanups = interceptSetProps(singleton);
      return singleton;
    };
    var BUBBLING_EVENTS_MAP = {
      mouseover: "mouseenter",
      focusin: "focus",
      click: "click"
    };
    function delegate(targets, props) {
      if (true) {
        errorWhen(!(props && props.target), ["You must specity a `target` prop indicating a CSS selector string matching", "the target elements that should receive a tippy."].join(" "));
      }
      var listeners = [];
      var childTippyInstances = [];
      var disabled = false;
      var target = props.target;
      var nativeProps = removeProperties(props, ["target"]);
      var parentProps = Object.assign({}, nativeProps, {
        trigger: "manual",
        touch: false
      });
      var childProps = Object.assign({}, nativeProps, {
        showOnCreate: true
      });
      var returnValue = tippy2(targets, parentProps);
      var normalizedReturnValue = normalizeToArray(returnValue);
      function onTrigger(event) {
        if (!event.target || disabled) {
          return;
        }
        var targetNode = event.target.closest(target);
        if (!targetNode) {
          return;
        }
        var trigger = targetNode.getAttribute("data-tippy-trigger") || props.trigger || defaultProps.trigger;
        if (targetNode._tippy) {
          return;
        }
        if (event.type === "touchstart" && typeof childProps.touch === "boolean") {
          return;
        }
        if (event.type !== "touchstart" && trigger.indexOf(BUBBLING_EVENTS_MAP[event.type]) < 0) {
          return;
        }
        var instance = tippy2(targetNode, childProps);
        if (instance) {
          childTippyInstances = childTippyInstances.concat(instance);
        }
      }
      function on2(node, eventType, handler, options) {
        if (options === void 0) {
          options = false;
        }
        node.addEventListener(eventType, handler, options);
        listeners.push({
          node,
          eventType,
          handler,
          options
        });
      }
      function addEventListeners(instance) {
        var reference = instance.reference;
        on2(reference, "touchstart", onTrigger, TOUCH_OPTIONS);
        on2(reference, "mouseover", onTrigger);
        on2(reference, "focusin", onTrigger);
        on2(reference, "click", onTrigger);
      }
      function removeEventListeners() {
        listeners.forEach(function(_ref) {
          var node = _ref.node, eventType = _ref.eventType, handler = _ref.handler, options = _ref.options;
          node.removeEventListener(eventType, handler, options);
        });
        listeners = [];
      }
      function applyMutations(instance) {
        var originalDestroy = instance.destroy;
        var originalEnable = instance.enable;
        var originalDisable = instance.disable;
        instance.destroy = function(shouldDestroyChildInstances) {
          if (shouldDestroyChildInstances === void 0) {
            shouldDestroyChildInstances = true;
          }
          if (shouldDestroyChildInstances) {
            childTippyInstances.forEach(function(instance2) {
              instance2.destroy();
            });
          }
          childTippyInstances = [];
          removeEventListeners();
          originalDestroy();
        };
        instance.enable = function() {
          originalEnable();
          childTippyInstances.forEach(function(instance2) {
            return instance2.enable();
          });
          disabled = false;
        };
        instance.disable = function() {
          originalDisable();
          childTippyInstances.forEach(function(instance2) {
            return instance2.disable();
          });
          disabled = true;
        };
        addEventListeners(instance);
      }
      normalizedReturnValue.forEach(applyMutations);
      return returnValue;
    }
    var animateFill = {
      name: "animateFill",
      defaultValue: false,
      fn: function fn(instance) {
        var _instance$props$rende;
        if (!((_instance$props$rende = instance.props.render) == null ? void 0 : _instance$props$rende.$$tippy)) {
          if (true) {
            errorWhen(instance.props.animateFill, "The `animateFill` plugin requires the default render function.");
          }
          return {};
        }
        var _getChildren = getChildren(instance.popper), box = _getChildren.box, content = _getChildren.content;
        var backdrop = instance.props.animateFill ? createBackdropElement() : null;
        return {
          onCreate: function onCreate() {
            if (backdrop) {
              box.insertBefore(backdrop, box.firstElementChild);
              box.setAttribute("data-animatefill", "");
              box.style.overflow = "hidden";
              instance.setProps({
                arrow: false,
                animation: "shift-away"
              });
            }
          },
          onMount: function onMount() {
            if (backdrop) {
              var transitionDuration = box.style.transitionDuration;
              var duration = Number(transitionDuration.replace("ms", ""));
              content.style.transitionDelay = Math.round(duration / 10) + "ms";
              backdrop.style.transitionDuration = transitionDuration;
              setVisibilityState([backdrop], "visible");
            }
          },
          onShow: function onShow() {
            if (backdrop) {
              backdrop.style.transitionDuration = "0ms";
            }
          },
          onHide: function onHide() {
            if (backdrop) {
              setVisibilityState([backdrop], "hidden");
            }
          }
        };
      }
    };
    function createBackdropElement() {
      var backdrop = div();
      backdrop.className = BACKDROP_CLASS;
      setVisibilityState([backdrop], "hidden");
      return backdrop;
    }
    var mouseCoords = {
      clientX: 0,
      clientY: 0
    };
    var activeInstances = [];
    function storeMouseCoords(_ref) {
      var clientX = _ref.clientX, clientY = _ref.clientY;
      mouseCoords = {
        clientX,
        clientY
      };
    }
    function addMouseCoordsListener(doc) {
      doc.addEventListener("mousemove", storeMouseCoords);
    }
    function removeMouseCoordsListener(doc) {
      doc.removeEventListener("mousemove", storeMouseCoords);
    }
    var followCursor2 = {
      name: "followCursor",
      defaultValue: false,
      fn: function fn(instance) {
        var reference = instance.reference;
        var doc = getOwnerDocument(instance.props.triggerTarget || reference);
        var isInternalUpdate = false;
        var wasFocusEvent = false;
        var isUnmounted = true;
        var prevProps = instance.props;
        function getIsInitialBehavior() {
          return instance.props.followCursor === "initial" && instance.state.isVisible;
        }
        function addListener() {
          doc.addEventListener("mousemove", onMouseMove);
        }
        function removeListener() {
          doc.removeEventListener("mousemove", onMouseMove);
        }
        function unsetGetReferenceClientRect() {
          isInternalUpdate = true;
          instance.setProps({
            getReferenceClientRect: null
          });
          isInternalUpdate = false;
        }
        function onMouseMove(event) {
          var isCursorOverReference = event.target ? reference.contains(event.target) : true;
          var followCursor3 = instance.props.followCursor;
          var clientX = event.clientX, clientY = event.clientY;
          var rect = reference.getBoundingClientRect();
          var relativeX = clientX - rect.left;
          var relativeY = clientY - rect.top;
          if (isCursorOverReference || !instance.props.interactive) {
            instance.setProps({
              getReferenceClientRect: function getReferenceClientRect() {
                var rect2 = reference.getBoundingClientRect();
                var x = clientX;
                var y = clientY;
                if (followCursor3 === "initial") {
                  x = rect2.left + relativeX;
                  y = rect2.top + relativeY;
                }
                var top = followCursor3 === "horizontal" ? rect2.top : y;
                var right = followCursor3 === "vertical" ? rect2.right : x;
                var bottom = followCursor3 === "horizontal" ? rect2.bottom : y;
                var left = followCursor3 === "vertical" ? rect2.left : x;
                return {
                  width: right - left,
                  height: bottom - top,
                  top,
                  right,
                  bottom,
                  left
                };
              }
            });
          }
        }
        function create() {
          if (instance.props.followCursor) {
            activeInstances.push({
              instance,
              doc
            });
            addMouseCoordsListener(doc);
          }
        }
        function destroy2() {
          activeInstances = activeInstances.filter(function(data) {
            return data.instance !== instance;
          });
          if (activeInstances.filter(function(data) {
            return data.doc === doc;
          }).length === 0) {
            removeMouseCoordsListener(doc);
          }
        }
        return {
          onCreate: create,
          onDestroy: destroy2,
          onBeforeUpdate: function onBeforeUpdate() {
            prevProps = instance.props;
          },
          onAfterUpdate: function onAfterUpdate(_, _ref2) {
            var followCursor3 = _ref2.followCursor;
            if (isInternalUpdate) {
              return;
            }
            if (followCursor3 !== void 0 && prevProps.followCursor !== followCursor3) {
              destroy2();
              if (followCursor3) {
                create();
                if (instance.state.isMounted && !wasFocusEvent && !getIsInitialBehavior()) {
                  addListener();
                }
              } else {
                removeListener();
                unsetGetReferenceClientRect();
              }
            }
          },
          onMount: function onMount() {
            if (instance.props.followCursor && !wasFocusEvent) {
              if (isUnmounted) {
                onMouseMove(mouseCoords);
                isUnmounted = false;
              }
              if (!getIsInitialBehavior()) {
                addListener();
              }
            }
          },
          onTrigger: function onTrigger(_, event) {
            if (isMouseEvent(event)) {
              mouseCoords = {
                clientX: event.clientX,
                clientY: event.clientY
              };
            }
            wasFocusEvent = event.type === "focus";
          },
          onHidden: function onHidden() {
            if (instance.props.followCursor) {
              unsetGetReferenceClientRect();
              removeListener();
              isUnmounted = true;
            }
          }
        };
      }
    };
    function getProps(props, modifier) {
      var _props$popperOptions;
      return {
        popperOptions: Object.assign({}, props.popperOptions, {
          modifiers: [].concat((((_props$popperOptions = props.popperOptions) == null ? void 0 : _props$popperOptions.modifiers) || []).filter(function(_ref) {
            var name = _ref.name;
            return name !== modifier.name;
          }), [modifier])
        })
      };
    }
    var inlinePositioning = {
      name: "inlinePositioning",
      defaultValue: false,
      fn: function fn(instance) {
        var reference = instance.reference;
        function isEnabled() {
          return !!instance.props.inlinePositioning;
        }
        var placement;
        var cursorRectIndex = -1;
        var isInternalUpdate = false;
        var modifier = {
          name: "tippyInlinePositioning",
          enabled: true,
          phase: "afterWrite",
          fn: function fn2(_ref2) {
            var state = _ref2.state;
            if (isEnabled()) {
              if (placement !== state.placement) {
                instance.setProps({
                  getReferenceClientRect: function getReferenceClientRect() {
                    return _getReferenceClientRect(state.placement);
                  }
                });
              }
              placement = state.placement;
            }
          }
        };
        function _getReferenceClientRect(placement2) {
          return getInlineBoundingClientRect(getBasePlacement(placement2), reference.getBoundingClientRect(), arrayFrom(reference.getClientRects()), cursorRectIndex);
        }
        function setInternalProps(partialProps) {
          isInternalUpdate = true;
          instance.setProps(partialProps);
          isInternalUpdate = false;
        }
        function addModifier() {
          if (!isInternalUpdate) {
            setInternalProps(getProps(instance.props, modifier));
          }
        }
        return {
          onCreate: addModifier,
          onAfterUpdate: addModifier,
          onTrigger: function onTrigger(_, event) {
            if (isMouseEvent(event)) {
              var rects = arrayFrom(instance.reference.getClientRects());
              var cursorRect = rects.find(function(rect) {
                return rect.left - 2 <= event.clientX && rect.right + 2 >= event.clientX && rect.top - 2 <= event.clientY && rect.bottom + 2 >= event.clientY;
              });
              cursorRectIndex = rects.indexOf(cursorRect);
            }
          },
          onUntrigger: function onUntrigger() {
            cursorRectIndex = -1;
          }
        };
      }
    };
    function getInlineBoundingClientRect(currentBasePlacement, boundingRect, clientRects, cursorRectIndex) {
      if (clientRects.length < 2 || currentBasePlacement === null) {
        return boundingRect;
      }
      if (clientRects.length === 2 && cursorRectIndex >= 0 && clientRects[0].left > clientRects[1].right) {
        return clientRects[cursorRectIndex] || boundingRect;
      }
      switch (currentBasePlacement) {
        case "top":
        case "bottom": {
          var firstRect = clientRects[0];
          var lastRect = clientRects[clientRects.length - 1];
          var isTop = currentBasePlacement === "top";
          var top = firstRect.top;
          var bottom = lastRect.bottom;
          var left = isTop ? firstRect.left : lastRect.left;
          var right = isTop ? firstRect.right : lastRect.right;
          var width = right - left;
          var height = bottom - top;
          return {
            top,
            bottom,
            left,
            right,
            width,
            height
          };
        }
        case "left":
        case "right": {
          var minLeft = Math.min.apply(Math, clientRects.map(function(rects) {
            return rects.left;
          }));
          var maxRight = Math.max.apply(Math, clientRects.map(function(rects) {
            return rects.right;
          }));
          var measureRects = clientRects.filter(function(rect) {
            return currentBasePlacement === "left" ? rect.left === minLeft : rect.right === maxRight;
          });
          var _top = measureRects[0].top;
          var _bottom = measureRects[measureRects.length - 1].bottom;
          var _left = minLeft;
          var _right = maxRight;
          var _width = _right - _left;
          var _height = _bottom - _top;
          return {
            top: _top,
            bottom: _bottom,
            left: _left,
            right: _right,
            width: _width,
            height: _height
          };
        }
        default: {
          return boundingRect;
        }
      }
    }
    var sticky = {
      name: "sticky",
      defaultValue: false,
      fn: function fn(instance) {
        var reference = instance.reference, popper = instance.popper;
        function getReference() {
          return instance.popperInstance ? instance.popperInstance.state.elements.reference : reference;
        }
        function shouldCheck(value) {
          return instance.props.sticky === true || instance.props.sticky === value;
        }
        var prevRefRect = null;
        var prevPopRect = null;
        function updatePosition() {
          var currentRefRect = shouldCheck("reference") ? getReference().getBoundingClientRect() : null;
          var currentPopRect = shouldCheck("popper") ? popper.getBoundingClientRect() : null;
          if (currentRefRect && areRectsDifferent(prevRefRect, currentRefRect) || currentPopRect && areRectsDifferent(prevPopRect, currentPopRect)) {
            if (instance.popperInstance) {
              instance.popperInstance.update();
            }
          }
          prevRefRect = currentRefRect;
          prevPopRect = currentPopRect;
          if (instance.state.isMounted) {
            requestAnimationFrame(updatePosition);
          }
        }
        return {
          onMount: function onMount() {
            if (instance.props.sticky) {
              updatePosition();
            }
          }
        };
      }
    };
    function areRectsDifferent(rectA, rectB) {
      if (rectA && rectB) {
        return rectA.top !== rectB.top || rectA.right !== rectB.right || rectA.bottom !== rectB.bottom || rectA.left !== rectB.left;
      }
      return true;
    }
    tippy2.setDefaultProps({
      render
    });
    exports.animateFill = animateFill;
    exports.createSingleton = createSingleton;
    exports.default = tippy2;
    exports.delegate = delegate;
    exports.followCursor = followCursor2;
    exports.hideAll = hideAll;
    exports.inlinePositioning = inlinePositioning;
    exports.roundArrow = ROUND_ARROW;
    exports.sticky = sticky;
  });
  var import_tippy2 = __toModule(require_tippy_cjs());
  var import_tippy = __toModule(require_tippy_cjs());
  var buildConfigFromModifiers2 = (modifiers) => {
    const config = {
      plugins: []
    };
    const getModifierArgument = (modifier) => {
      return modifiers[modifiers.indexOf(modifier) + 1];
    };
    if (modifiers.includes("animation")) {
      config.animation = getModifierArgument("animation");
    }
    if (modifiers.includes("duration")) {
      config.duration = parseInt(getModifierArgument("duration"));
    }
    if (modifiers.includes("delay")) {
      const delay = getModifierArgument("delay");
      config.delay = delay.includes("-") ? delay.split("-").map((n) => parseInt(n)) : parseInt(delay);
    }
    if (modifiers.includes("cursor")) {
      config.plugins.push(import_tippy.followCursor);
      const next = getModifierArgument("cursor");
      if (["x", "initial"].includes(next)) {
        config.followCursor = next === "x" ? "horizontal" : "initial";
      } else {
        config.followCursor = true;
      }
    }
    if (modifiers.includes("on")) {
      config.trigger = getModifierArgument("on");
    }
    if (modifiers.includes("arrowless")) {
      config.arrow = false;
    }
    if (modifiers.includes("html")) {
      config.allowHTML = true;
    }
    if (modifiers.includes("interactive")) {
      config.interactive = true;
    }
    if (modifiers.includes("border") && config.interactive) {
      config.interactiveBorder = parseInt(getModifierArgument("border"));
    }
    if (modifiers.includes("debounce") && config.interactive) {
      config.interactiveDebounce = parseInt(getModifierArgument("debounce"));
    }
    if (modifiers.includes("max-width")) {
      config.maxWidth = parseInt(getModifierArgument("max-width"));
    }
    if (modifiers.includes("theme")) {
      config.theme = getModifierArgument("theme");
    }
    if (modifiers.includes("placement")) {
      config.placement = getModifierArgument("placement");
    }
    return config;
  };
  function Tooltip(Alpine) {
    Alpine.magic("tooltip", (el) => {
      return (content, config = {}) => {
        const instance = (0, import_tippy2.default)(el, {
          content,
          trigger: "manual",
          ...config
        });
        instance.show();
        setTimeout(() => {
          instance.hide();
          setTimeout(() => instance.destroy(), config.duration || 300);
        }, config.timeout || 2e3);
      };
    });
    Alpine.directive("tooltip", (el, { modifiers, expression }, { evaluateLater, effect }) => {
      const config = modifiers.length > 0 ? buildConfigFromModifiers2(modifiers) : {};
      if (!el.__x_tippy) {
        el.__x_tippy = (0, import_tippy2.default)(el, config);
      }
      const enableTooltip = () => el.__x_tippy.enable();
      const disableTooltip = () => el.__x_tippy.disable();
      const setupTooltip = (content) => {
        if (!content) {
          disableTooltip();
        } else {
          enableTooltip();
          el.__x_tippy.setContent(content);
        }
      };
      if (modifiers.includes("raw")) {
        setupTooltip(expression);
      } else {
        const getContent = evaluateLater(expression);
        effect(() => {
          getContent((content) => {
            if (typeof content === "object") {
              el.__x_tippy.setProps(content);
              enableTooltip();
            } else {
              setupTooltip(content);
            }
          });
        });
      }
    });
  }
  Tooltip.defaultProps = (props) => {
    import_tippy2.default.setDefaultProps(props);
    return Tooltip;
  };
  var src_default2 = Tooltip;
  var module_default3 = src_default2;

  // packages/support/resources/js/index.js
  document.addEventListener("alpine:init", () => {
    window.Alpine.plugin(module_default);
    window.Alpine.plugin(module_default2);
    window.Alpine.plugin(sortable_default);
    window.Alpine.plugin(module_default3);
  });
  var pluralize = function(text, number, variables) {
    function extract(segments2, number2) {
      for (const part of segments2) {
        const line = extractFromString(part, number2);
        if (line !== null) {
          return line;
        }
      }
    }
    function extractFromString(part, number2) {
      const matches2 = part.match(/^[\{\[]([^\[\]\{\}]*)[\}\]](.*)/s);
      if (matches2 === null || matches2.length !== 3) {
        return null;
      }
      const condition = matches2[1];
      const value2 = matches2[2];
      if (condition.includes(",")) {
        const [from, to] = condition.split(",", 2);
        if (to === "*" && number2 >= from) {
          return value2;
        } else if (from === "*" && number2 <= to) {
          return value2;
        } else if (number2 >= from && number2 <= to) {
          return value2;
        }
      }
      return condition == number2 ? value2 : null;
    }
    function ucfirst(string) {
      return string.toString().charAt(0).toUpperCase() + string.toString().slice(1);
    }
    function replace(line, replace2) {
      if (replace2.length === 0) {
        return line;
      }
      const shouldReplace = {};
      for (let [key, value2] of Object.entries(replace2)) {
        shouldReplace[":" + ucfirst(key ?? "")] = ucfirst(value2 ?? "");
        shouldReplace[":" + key.toUpperCase()] = value2.toString().toUpperCase();
        shouldReplace[":" + key] = value2;
      }
      Object.entries(shouldReplace).forEach(([key, value2]) => {
        line = line.replaceAll(key, value2);
      });
      return line;
    }
    function stripConditions(segments2) {
      return segments2.map(
        (part) => part.replace(/^[\{\[]([^\[\]\{\}]*)[\}\]]/, "")
      );
    }
    let segments = text.split("|");
    const value = extract(segments, number);
    if (value !== null && value !== void 0) {
      return replace(value.trim(), variables);
    }
    segments = stripConditions(segments);
    return replace(
      segments.length > 1 && number > 1 ? segments[1] : segments[0],
      variables
    );
  };
  window.pluralize = pluralize;
})();
/*! Bundled license information:

sortablejs/modular/sortable.esm.js:
  (**!
   * Sortable 1.15.1
   * @author	RubaXa   <trash@rubaxa.org>
   * @author	owenm    <owen23355@gmail.com>
   * @license MIT
   *)
*/
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0Bhd2NvZGVzL2FscGluZS1mbG9hdGluZy11aS9kaXN0L21vZHVsZS5lc20uanMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2FscGluZS1sYXp5LWxvYWQtYXNzZXRzL2Rpc3QvYWxwaW5lLWxhenktbG9hZC1hc3NldHMuZXNtLmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9zb3J0YWJsZWpzL21vZHVsYXIvc29ydGFibGUuZXNtLmpzIiwgIi4uL3Jlc291cmNlcy9qcy9zb3J0YWJsZS5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQHJ5YW5namNoYW5kbGVyL2FscGluZS10b29sdGlwL2Rpc3QvbW9kdWxlLmVzbS5qcyIsICIuLi9yZXNvdXJjZXMvanMvaW5kZXguanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIG5vZGVfbW9kdWxlcy9AZmxvYXRpbmctdWkvY29yZS9kaXN0L2Zsb2F0aW5nLXVpLmNvcmUuZXNtLmpzXG5mdW5jdGlvbiBnZXRTaWRlKHBsYWNlbWVudCkge1xuICByZXR1cm4gcGxhY2VtZW50LnNwbGl0KFwiLVwiKVswXTtcbn1cbmZ1bmN0aW9uIGdldEFsaWdubWVudChwbGFjZW1lbnQpIHtcbiAgcmV0dXJuIHBsYWNlbWVudC5zcGxpdChcIi1cIilbMV07XG59XG5mdW5jdGlvbiBnZXRNYWluQXhpc0Zyb21QbGFjZW1lbnQocGxhY2VtZW50KSB7XG4gIHJldHVybiBbXCJ0b3BcIiwgXCJib3R0b21cIl0uaW5jbHVkZXMoZ2V0U2lkZShwbGFjZW1lbnQpKSA/IFwieFwiIDogXCJ5XCI7XG59XG5mdW5jdGlvbiBnZXRMZW5ndGhGcm9tQXhpcyhheGlzKSB7XG4gIHJldHVybiBheGlzID09PSBcInlcIiA/IFwiaGVpZ2h0XCIgOiBcIndpZHRoXCI7XG59XG5mdW5jdGlvbiBjb21wdXRlQ29vcmRzRnJvbVBsYWNlbWVudChfcmVmLCBwbGFjZW1lbnQsIHJ0bCkge1xuICBsZXQge1xuICAgIHJlZmVyZW5jZSxcbiAgICBmbG9hdGluZ1xuICB9ID0gX3JlZjtcbiAgY29uc3QgY29tbW9uWCA9IHJlZmVyZW5jZS54ICsgcmVmZXJlbmNlLndpZHRoIC8gMiAtIGZsb2F0aW5nLndpZHRoIC8gMjtcbiAgY29uc3QgY29tbW9uWSA9IHJlZmVyZW5jZS55ICsgcmVmZXJlbmNlLmhlaWdodCAvIDIgLSBmbG9hdGluZy5oZWlnaHQgLyAyO1xuICBjb25zdCBtYWluQXhpcyA9IGdldE1haW5BeGlzRnJvbVBsYWNlbWVudChwbGFjZW1lbnQpO1xuICBjb25zdCBsZW5ndGggPSBnZXRMZW5ndGhGcm9tQXhpcyhtYWluQXhpcyk7XG4gIGNvbnN0IGNvbW1vbkFsaWduID0gcmVmZXJlbmNlW2xlbmd0aF0gLyAyIC0gZmxvYXRpbmdbbGVuZ3RoXSAvIDI7XG4gIGNvbnN0IHNpZGUgPSBnZXRTaWRlKHBsYWNlbWVudCk7XG4gIGNvbnN0IGlzVmVydGljYWwgPSBtYWluQXhpcyA9PT0gXCJ4XCI7XG4gIGxldCBjb29yZHM7XG4gIHN3aXRjaCAoc2lkZSkge1xuICAgIGNhc2UgXCJ0b3BcIjpcbiAgICAgIGNvb3JkcyA9IHtcbiAgICAgICAgeDogY29tbW9uWCxcbiAgICAgICAgeTogcmVmZXJlbmNlLnkgLSBmbG9hdGluZy5oZWlnaHRcbiAgICAgIH07XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwiYm90dG9tXCI6XG4gICAgICBjb29yZHMgPSB7XG4gICAgICAgIHg6IGNvbW1vblgsXG4gICAgICAgIHk6IHJlZmVyZW5jZS55ICsgcmVmZXJlbmNlLmhlaWdodFxuICAgICAgfTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJyaWdodFwiOlxuICAgICAgY29vcmRzID0ge1xuICAgICAgICB4OiByZWZlcmVuY2UueCArIHJlZmVyZW5jZS53aWR0aCxcbiAgICAgICAgeTogY29tbW9uWVxuICAgICAgfTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJsZWZ0XCI6XG4gICAgICBjb29yZHMgPSB7XG4gICAgICAgIHg6IHJlZmVyZW5jZS54IC0gZmxvYXRpbmcud2lkdGgsXG4gICAgICAgIHk6IGNvbW1vbllcbiAgICAgIH07XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgY29vcmRzID0ge1xuICAgICAgICB4OiByZWZlcmVuY2UueCxcbiAgICAgICAgeTogcmVmZXJlbmNlLnlcbiAgICAgIH07XG4gIH1cbiAgc3dpdGNoIChnZXRBbGlnbm1lbnQocGxhY2VtZW50KSkge1xuICAgIGNhc2UgXCJzdGFydFwiOlxuICAgICAgY29vcmRzW21haW5BeGlzXSAtPSBjb21tb25BbGlnbiAqIChydGwgJiYgaXNWZXJ0aWNhbCA/IC0xIDogMSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwiZW5kXCI6XG4gICAgICBjb29yZHNbbWFpbkF4aXNdICs9IGNvbW1vbkFsaWduICogKHJ0bCAmJiBpc1ZlcnRpY2FsID8gLTEgOiAxKTtcbiAgICAgIGJyZWFrO1xuICB9XG4gIHJldHVybiBjb29yZHM7XG59XG52YXIgY29tcHV0ZVBvc2l0aW9uID0gYXN5bmMgKHJlZmVyZW5jZSwgZmxvYXRpbmcsIGNvbmZpZykgPT4ge1xuICBjb25zdCB7XG4gICAgcGxhY2VtZW50ID0gXCJib3R0b21cIixcbiAgICBzdHJhdGVneSA9IFwiYWJzb2x1dGVcIixcbiAgICBtaWRkbGV3YXJlID0gW10sXG4gICAgcGxhdGZvcm06IHBsYXRmb3JtMlxuICB9ID0gY29uZmlnO1xuICBjb25zdCBydGwgPSBhd2FpdCAocGxhdGZvcm0yLmlzUlRMID09IG51bGwgPyB2b2lkIDAgOiBwbGF0Zm9ybTIuaXNSVEwoZmxvYXRpbmcpKTtcbiAgaWYgKHRydWUpIHtcbiAgICBpZiAocGxhdGZvcm0yID09IG51bGwpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoW1wiRmxvYXRpbmcgVUk6IGBwbGF0Zm9ybWAgcHJvcGVydHkgd2FzIG5vdCBwYXNzZWQgdG8gY29uZmlnLiBJZiB5b3VcIiwgXCJ3YW50IHRvIHVzZSBGbG9hdGluZyBVSSBvbiB0aGUgd2ViLCBpbnN0YWxsIEBmbG9hdGluZy11aS9kb21cIiwgXCJpbnN0ZWFkIG9mIHRoZSAvY29yZSBwYWNrYWdlLiBPdGhlcndpc2UsIHlvdSBjYW4gY3JlYXRlIHlvdXIgb3duXCIsIFwiYHBsYXRmb3JtYDogaHR0cHM6Ly9mbG9hdGluZy11aS5jb20vZG9jcy9wbGF0Zm9ybVwiXS5qb2luKFwiIFwiKSk7XG4gICAgfVxuICAgIGlmIChtaWRkbGV3YXJlLmZpbHRlcigoX3JlZikgPT4ge1xuICAgICAgbGV0IHtcbiAgICAgICAgbmFtZVxuICAgICAgfSA9IF9yZWY7XG4gICAgICByZXR1cm4gbmFtZSA9PT0gXCJhdXRvUGxhY2VtZW50XCIgfHwgbmFtZSA9PT0gXCJmbGlwXCI7XG4gICAgfSkubGVuZ3RoID4gMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFtcIkZsb2F0aW5nIFVJOiBkdXBsaWNhdGUgYGZsaXBgIGFuZC9vciBgYXV0b1BsYWNlbWVudGBcIiwgXCJtaWRkbGV3YXJlIGRldGVjdGVkLiBUaGlzIHdpbGwgbGVhZCB0byBhbiBpbmZpbml0ZSBsb29wLiBFbnN1cmUgb25seVwiLCBcIm9uZSBvZiBlaXRoZXIgaGFzIGJlZW4gcGFzc2VkIHRvIHRoZSBgbWlkZGxld2FyZWAgYXJyYXkuXCJdLmpvaW4oXCIgXCIpKTtcbiAgICB9XG4gIH1cbiAgbGV0IHJlY3RzID0gYXdhaXQgcGxhdGZvcm0yLmdldEVsZW1lbnRSZWN0cyh7XG4gICAgcmVmZXJlbmNlLFxuICAgIGZsb2F0aW5nLFxuICAgIHN0cmF0ZWd5XG4gIH0pO1xuICBsZXQge1xuICAgIHgsXG4gICAgeVxuICB9ID0gY29tcHV0ZUNvb3Jkc0Zyb21QbGFjZW1lbnQocmVjdHMsIHBsYWNlbWVudCwgcnRsKTtcbiAgbGV0IHN0YXRlZnVsUGxhY2VtZW50ID0gcGxhY2VtZW50O1xuICBsZXQgbWlkZGxld2FyZURhdGEgPSB7fTtcbiAgbGV0IF9kZWJ1Z19sb29wX2NvdW50XyA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbWlkZGxld2FyZS5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0cnVlKSB7XG4gICAgICBfZGVidWdfbG9vcF9jb3VudF8rKztcbiAgICAgIGlmIChfZGVidWdfbG9vcF9jb3VudF8gPiAxMDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFtcIkZsb2F0aW5nIFVJOiBUaGUgbWlkZGxld2FyZSBsaWZlY3ljbGUgYXBwZWFycyB0byBiZVwiLCBcInJ1bm5pbmcgaW4gYW4gaW5maW5pdGUgbG9vcC4gVGhpcyBpcyB1c3VhbGx5IGNhdXNlZCBieSBhIGByZXNldGBcIiwgXCJjb250aW51YWxseSBiZWluZyByZXR1cm5lZCB3aXRob3V0IGEgYnJlYWsgY29uZGl0aW9uLlwiXS5qb2luKFwiIFwiKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHtcbiAgICAgIG5hbWUsXG4gICAgICBmblxuICAgIH0gPSBtaWRkbGV3YXJlW2ldO1xuICAgIGNvbnN0IHtcbiAgICAgIHg6IG5leHRYLFxuICAgICAgeTogbmV4dFksXG4gICAgICBkYXRhLFxuICAgICAgcmVzZXRcbiAgICB9ID0gYXdhaXQgZm4oe1xuICAgICAgeCxcbiAgICAgIHksXG4gICAgICBpbml0aWFsUGxhY2VtZW50OiBwbGFjZW1lbnQsXG4gICAgICBwbGFjZW1lbnQ6IHN0YXRlZnVsUGxhY2VtZW50LFxuICAgICAgc3RyYXRlZ3ksXG4gICAgICBtaWRkbGV3YXJlRGF0YSxcbiAgICAgIHJlY3RzLFxuICAgICAgcGxhdGZvcm06IHBsYXRmb3JtMixcbiAgICAgIGVsZW1lbnRzOiB7XG4gICAgICAgIHJlZmVyZW5jZSxcbiAgICAgICAgZmxvYXRpbmdcbiAgICAgIH1cbiAgICB9KTtcbiAgICB4ID0gbmV4dFggIT0gbnVsbCA/IG5leHRYIDogeDtcbiAgICB5ID0gbmV4dFkgIT0gbnVsbCA/IG5leHRZIDogeTtcbiAgICBtaWRkbGV3YXJlRGF0YSA9IHtcbiAgICAgIC4uLm1pZGRsZXdhcmVEYXRhLFxuICAgICAgW25hbWVdOiB7XG4gICAgICAgIC4uLm1pZGRsZXdhcmVEYXRhW25hbWVdLFxuICAgICAgICAuLi5kYXRhXG4gICAgICB9XG4gICAgfTtcbiAgICBpZiAocmVzZXQpIHtcbiAgICAgIGlmICh0eXBlb2YgcmVzZXQgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgaWYgKHJlc2V0LnBsYWNlbWVudCkge1xuICAgICAgICAgIHN0YXRlZnVsUGxhY2VtZW50ID0gcmVzZXQucGxhY2VtZW50O1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXNldC5yZWN0cykge1xuICAgICAgICAgIHJlY3RzID0gcmVzZXQucmVjdHMgPT09IHRydWUgPyBhd2FpdCBwbGF0Zm9ybTIuZ2V0RWxlbWVudFJlY3RzKHtcbiAgICAgICAgICAgIHJlZmVyZW5jZSxcbiAgICAgICAgICAgIGZsb2F0aW5nLFxuICAgICAgICAgICAgc3RyYXRlZ3lcbiAgICAgICAgICB9KSA6IHJlc2V0LnJlY3RzO1xuICAgICAgICB9XG4gICAgICAgICh7XG4gICAgICAgICAgeCxcbiAgICAgICAgICB5XG4gICAgICAgIH0gPSBjb21wdXRlQ29vcmRzRnJvbVBsYWNlbWVudChyZWN0cywgc3RhdGVmdWxQbGFjZW1lbnQsIHJ0bCkpO1xuICAgICAgfVxuICAgICAgaSA9IC0xO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICB9XG4gIHJldHVybiB7XG4gICAgeCxcbiAgICB5LFxuICAgIHBsYWNlbWVudDogc3RhdGVmdWxQbGFjZW1lbnQsXG4gICAgc3RyYXRlZ3ksXG4gICAgbWlkZGxld2FyZURhdGFcbiAgfTtcbn07XG5mdW5jdGlvbiBleHBhbmRQYWRkaW5nT2JqZWN0KHBhZGRpbmcpIHtcbiAgcmV0dXJuIHtcbiAgICB0b3A6IDAsXG4gICAgcmlnaHQ6IDAsXG4gICAgYm90dG9tOiAwLFxuICAgIGxlZnQ6IDAsXG4gICAgLi4ucGFkZGluZ1xuICB9O1xufVxuZnVuY3Rpb24gZ2V0U2lkZU9iamVjdEZyb21QYWRkaW5nKHBhZGRpbmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBwYWRkaW5nICE9PSBcIm51bWJlclwiID8gZXhwYW5kUGFkZGluZ09iamVjdChwYWRkaW5nKSA6IHtcbiAgICB0b3A6IHBhZGRpbmcsXG4gICAgcmlnaHQ6IHBhZGRpbmcsXG4gICAgYm90dG9tOiBwYWRkaW5nLFxuICAgIGxlZnQ6IHBhZGRpbmdcbiAgfTtcbn1cbmZ1bmN0aW9uIHJlY3RUb0NsaWVudFJlY3QocmVjdCkge1xuICByZXR1cm4ge1xuICAgIC4uLnJlY3QsXG4gICAgdG9wOiByZWN0LnksXG4gICAgbGVmdDogcmVjdC54LFxuICAgIHJpZ2h0OiByZWN0LnggKyByZWN0LndpZHRoLFxuICAgIGJvdHRvbTogcmVjdC55ICsgcmVjdC5oZWlnaHRcbiAgfTtcbn1cbmFzeW5jIGZ1bmN0aW9uIGRldGVjdE92ZXJmbG93KG1pZGRsZXdhcmVBcmd1bWVudHMsIG9wdGlvbnMpIHtcbiAgdmFyIF9hd2FpdCRwbGF0Zm9ybSRpc0VsZTtcbiAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkge1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfVxuICBjb25zdCB7XG4gICAgeCxcbiAgICB5LFxuICAgIHBsYXRmb3JtOiBwbGF0Zm9ybTIsXG4gICAgcmVjdHMsXG4gICAgZWxlbWVudHMsXG4gICAgc3RyYXRlZ3lcbiAgfSA9IG1pZGRsZXdhcmVBcmd1bWVudHM7XG4gIGNvbnN0IHtcbiAgICBib3VuZGFyeSA9IFwiY2xpcHBpbmdBbmNlc3RvcnNcIixcbiAgICByb290Qm91bmRhcnkgPSBcInZpZXdwb3J0XCIsXG4gICAgZWxlbWVudENvbnRleHQgPSBcImZsb2F0aW5nXCIsXG4gICAgYWx0Qm91bmRhcnkgPSBmYWxzZSxcbiAgICBwYWRkaW5nID0gMFxuICB9ID0gb3B0aW9ucztcbiAgY29uc3QgcGFkZGluZ09iamVjdCA9IGdldFNpZGVPYmplY3RGcm9tUGFkZGluZyhwYWRkaW5nKTtcbiAgY29uc3QgYWx0Q29udGV4dCA9IGVsZW1lbnRDb250ZXh0ID09PSBcImZsb2F0aW5nXCIgPyBcInJlZmVyZW5jZVwiIDogXCJmbG9hdGluZ1wiO1xuICBjb25zdCBlbGVtZW50ID0gZWxlbWVudHNbYWx0Qm91bmRhcnkgPyBhbHRDb250ZXh0IDogZWxlbWVudENvbnRleHRdO1xuICBjb25zdCBjbGlwcGluZ0NsaWVudFJlY3QgPSByZWN0VG9DbGllbnRSZWN0KGF3YWl0IHBsYXRmb3JtMi5nZXRDbGlwcGluZ1JlY3Qoe1xuICAgIGVsZW1lbnQ6ICgoX2F3YWl0JHBsYXRmb3JtJGlzRWxlID0gYXdhaXQgKHBsYXRmb3JtMi5pc0VsZW1lbnQgPT0gbnVsbCA/IHZvaWQgMCA6IHBsYXRmb3JtMi5pc0VsZW1lbnQoZWxlbWVudCkpKSAhPSBudWxsID8gX2F3YWl0JHBsYXRmb3JtJGlzRWxlIDogdHJ1ZSkgPyBlbGVtZW50IDogZWxlbWVudC5jb250ZXh0RWxlbWVudCB8fCBhd2FpdCAocGxhdGZvcm0yLmdldERvY3VtZW50RWxlbWVudCA9PSBudWxsID8gdm9pZCAwIDogcGxhdGZvcm0yLmdldERvY3VtZW50RWxlbWVudChlbGVtZW50cy5mbG9hdGluZykpLFxuICAgIGJvdW5kYXJ5LFxuICAgIHJvb3RCb3VuZGFyeSxcbiAgICBzdHJhdGVneVxuICB9KSk7XG4gIGNvbnN0IGVsZW1lbnRDbGllbnRSZWN0ID0gcmVjdFRvQ2xpZW50UmVjdChwbGF0Zm9ybTIuY29udmVydE9mZnNldFBhcmVudFJlbGF0aXZlUmVjdFRvVmlld3BvcnRSZWxhdGl2ZVJlY3QgPyBhd2FpdCBwbGF0Zm9ybTIuY29udmVydE9mZnNldFBhcmVudFJlbGF0aXZlUmVjdFRvVmlld3BvcnRSZWxhdGl2ZVJlY3Qoe1xuICAgIHJlY3Q6IGVsZW1lbnRDb250ZXh0ID09PSBcImZsb2F0aW5nXCIgPyB7XG4gICAgICAuLi5yZWN0cy5mbG9hdGluZyxcbiAgICAgIHgsXG4gICAgICB5XG4gICAgfSA6IHJlY3RzLnJlZmVyZW5jZSxcbiAgICBvZmZzZXRQYXJlbnQ6IGF3YWl0IChwbGF0Zm9ybTIuZ2V0T2Zmc2V0UGFyZW50ID09IG51bGwgPyB2b2lkIDAgOiBwbGF0Zm9ybTIuZ2V0T2Zmc2V0UGFyZW50KGVsZW1lbnRzLmZsb2F0aW5nKSksXG4gICAgc3RyYXRlZ3lcbiAgfSkgOiByZWN0c1tlbGVtZW50Q29udGV4dF0pO1xuICByZXR1cm4ge1xuICAgIHRvcDogY2xpcHBpbmdDbGllbnRSZWN0LnRvcCAtIGVsZW1lbnRDbGllbnRSZWN0LnRvcCArIHBhZGRpbmdPYmplY3QudG9wLFxuICAgIGJvdHRvbTogZWxlbWVudENsaWVudFJlY3QuYm90dG9tIC0gY2xpcHBpbmdDbGllbnRSZWN0LmJvdHRvbSArIHBhZGRpbmdPYmplY3QuYm90dG9tLFxuICAgIGxlZnQ6IGNsaXBwaW5nQ2xpZW50UmVjdC5sZWZ0IC0gZWxlbWVudENsaWVudFJlY3QubGVmdCArIHBhZGRpbmdPYmplY3QubGVmdCxcbiAgICByaWdodDogZWxlbWVudENsaWVudFJlY3QucmlnaHQgLSBjbGlwcGluZ0NsaWVudFJlY3QucmlnaHQgKyBwYWRkaW5nT2JqZWN0LnJpZ2h0XG4gIH07XG59XG52YXIgbWluID0gTWF0aC5taW47XG52YXIgbWF4ID0gTWF0aC5tYXg7XG5mdW5jdGlvbiB3aXRoaW4obWluJDEsIHZhbHVlLCBtYXgkMSkge1xuICByZXR1cm4gbWF4KG1pbiQxLCBtaW4odmFsdWUsIG1heCQxKSk7XG59XG52YXIgYXJyb3cgPSAob3B0aW9ucykgPT4gKHtcbiAgbmFtZTogXCJhcnJvd1wiLFxuICBvcHRpb25zLFxuICBhc3luYyBmbihtaWRkbGV3YXJlQXJndW1lbnRzKSB7XG4gICAgY29uc3Qge1xuICAgICAgZWxlbWVudCxcbiAgICAgIHBhZGRpbmcgPSAwXG4gICAgfSA9IG9wdGlvbnMgIT0gbnVsbCA/IG9wdGlvbnMgOiB7fTtcbiAgICBjb25zdCB7XG4gICAgICB4LFxuICAgICAgeSxcbiAgICAgIHBsYWNlbWVudCxcbiAgICAgIHJlY3RzLFxuICAgICAgcGxhdGZvcm06IHBsYXRmb3JtMlxuICAgIH0gPSBtaWRkbGV3YXJlQXJndW1lbnRzO1xuICAgIGlmIChlbGVtZW50ID09IG51bGwpIHtcbiAgICAgIGlmICh0cnVlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIkZsb2F0aW5nIFVJOiBObyBgZWxlbWVudGAgd2FzIHBhc3NlZCB0byB0aGUgYGFycm93YCBtaWRkbGV3YXJlLlwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gICAgY29uc3QgcGFkZGluZ09iamVjdCA9IGdldFNpZGVPYmplY3RGcm9tUGFkZGluZyhwYWRkaW5nKTtcbiAgICBjb25zdCBjb29yZHMgPSB7XG4gICAgICB4LFxuICAgICAgeVxuICAgIH07XG4gICAgY29uc3QgYXhpcyA9IGdldE1haW5BeGlzRnJvbVBsYWNlbWVudChwbGFjZW1lbnQpO1xuICAgIGNvbnN0IGxlbmd0aCA9IGdldExlbmd0aEZyb21BeGlzKGF4aXMpO1xuICAgIGNvbnN0IGFycm93RGltZW5zaW9ucyA9IGF3YWl0IHBsYXRmb3JtMi5nZXREaW1lbnNpb25zKGVsZW1lbnQpO1xuICAgIGNvbnN0IG1pblByb3AgPSBheGlzID09PSBcInlcIiA/IFwidG9wXCIgOiBcImxlZnRcIjtcbiAgICBjb25zdCBtYXhQcm9wID0gYXhpcyA9PT0gXCJ5XCIgPyBcImJvdHRvbVwiIDogXCJyaWdodFwiO1xuICAgIGNvbnN0IGVuZERpZmYgPSByZWN0cy5yZWZlcmVuY2VbbGVuZ3RoXSArIHJlY3RzLnJlZmVyZW5jZVtheGlzXSAtIGNvb3Jkc1theGlzXSAtIHJlY3RzLmZsb2F0aW5nW2xlbmd0aF07XG4gICAgY29uc3Qgc3RhcnREaWZmID0gY29vcmRzW2F4aXNdIC0gcmVjdHMucmVmZXJlbmNlW2F4aXNdO1xuICAgIGNvbnN0IGFycm93T2Zmc2V0UGFyZW50ID0gYXdhaXQgKHBsYXRmb3JtMi5nZXRPZmZzZXRQYXJlbnQgPT0gbnVsbCA/IHZvaWQgMCA6IHBsYXRmb3JtMi5nZXRPZmZzZXRQYXJlbnQoZWxlbWVudCkpO1xuICAgIGNvbnN0IGNsaWVudFNpemUgPSBhcnJvd09mZnNldFBhcmVudCA/IGF4aXMgPT09IFwieVwiID8gYXJyb3dPZmZzZXRQYXJlbnQuY2xpZW50SGVpZ2h0IHx8IDAgOiBhcnJvd09mZnNldFBhcmVudC5jbGllbnRXaWR0aCB8fCAwIDogMDtcbiAgICBjb25zdCBjZW50ZXJUb1JlZmVyZW5jZSA9IGVuZERpZmYgLyAyIC0gc3RhcnREaWZmIC8gMjtcbiAgICBjb25zdCBtaW4zID0gcGFkZGluZ09iamVjdFttaW5Qcm9wXTtcbiAgICBjb25zdCBtYXgzID0gY2xpZW50U2l6ZSAtIGFycm93RGltZW5zaW9uc1tsZW5ndGhdIC0gcGFkZGluZ09iamVjdFttYXhQcm9wXTtcbiAgICBjb25zdCBjZW50ZXIgPSBjbGllbnRTaXplIC8gMiAtIGFycm93RGltZW5zaW9uc1tsZW5ndGhdIC8gMiArIGNlbnRlclRvUmVmZXJlbmNlO1xuICAgIGNvbnN0IG9mZnNldDIgPSB3aXRoaW4obWluMywgY2VudGVyLCBtYXgzKTtcbiAgICByZXR1cm4ge1xuICAgICAgZGF0YToge1xuICAgICAgICBbYXhpc106IG9mZnNldDIsXG4gICAgICAgIGNlbnRlck9mZnNldDogY2VudGVyIC0gb2Zmc2V0MlxuICAgICAgfVxuICAgIH07XG4gIH1cbn0pO1xudmFyIGhhc2gkMSA9IHtcbiAgbGVmdDogXCJyaWdodFwiLFxuICByaWdodDogXCJsZWZ0XCIsXG4gIGJvdHRvbTogXCJ0b3BcIixcbiAgdG9wOiBcImJvdHRvbVwiXG59O1xuZnVuY3Rpb24gZ2V0T3Bwb3NpdGVQbGFjZW1lbnQocGxhY2VtZW50KSB7XG4gIHJldHVybiBwbGFjZW1lbnQucmVwbGFjZSgvbGVmdHxyaWdodHxib3R0b218dG9wL2csIChtYXRjaGVkKSA9PiBoYXNoJDFbbWF0Y2hlZF0pO1xufVxuZnVuY3Rpb24gZ2V0QWxpZ25tZW50U2lkZXMocGxhY2VtZW50LCByZWN0cywgcnRsKSB7XG4gIGlmIChydGwgPT09IHZvaWQgMCkge1xuICAgIHJ0bCA9IGZhbHNlO1xuICB9XG4gIGNvbnN0IGFsaWdubWVudCA9IGdldEFsaWdubWVudChwbGFjZW1lbnQpO1xuICBjb25zdCBtYWluQXhpcyA9IGdldE1haW5BeGlzRnJvbVBsYWNlbWVudChwbGFjZW1lbnQpO1xuICBjb25zdCBsZW5ndGggPSBnZXRMZW5ndGhGcm9tQXhpcyhtYWluQXhpcyk7XG4gIGxldCBtYWluQWxpZ25tZW50U2lkZSA9IG1haW5BeGlzID09PSBcInhcIiA/IGFsaWdubWVudCA9PT0gKHJ0bCA/IFwiZW5kXCIgOiBcInN0YXJ0XCIpID8gXCJyaWdodFwiIDogXCJsZWZ0XCIgOiBhbGlnbm1lbnQgPT09IFwic3RhcnRcIiA/IFwiYm90dG9tXCIgOiBcInRvcFwiO1xuICBpZiAocmVjdHMucmVmZXJlbmNlW2xlbmd0aF0gPiByZWN0cy5mbG9hdGluZ1tsZW5ndGhdKSB7XG4gICAgbWFpbkFsaWdubWVudFNpZGUgPSBnZXRPcHBvc2l0ZVBsYWNlbWVudChtYWluQWxpZ25tZW50U2lkZSk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBtYWluOiBtYWluQWxpZ25tZW50U2lkZSxcbiAgICBjcm9zczogZ2V0T3Bwb3NpdGVQbGFjZW1lbnQobWFpbkFsaWdubWVudFNpZGUpXG4gIH07XG59XG52YXIgaGFzaCA9IHtcbiAgc3RhcnQ6IFwiZW5kXCIsXG4gIGVuZDogXCJzdGFydFwiXG59O1xuZnVuY3Rpb24gZ2V0T3Bwb3NpdGVBbGlnbm1lbnRQbGFjZW1lbnQocGxhY2VtZW50KSB7XG4gIHJldHVybiBwbGFjZW1lbnQucmVwbGFjZSgvc3RhcnR8ZW5kL2csIChtYXRjaGVkKSA9PiBoYXNoW21hdGNoZWRdKTtcbn1cbnZhciBzaWRlcyA9IFtcInRvcFwiLCBcInJpZ2h0XCIsIFwiYm90dG9tXCIsIFwibGVmdFwiXTtcbnZhciBhbGxQbGFjZW1lbnRzID0gLyogQF9fUFVSRV9fICovIHNpZGVzLnJlZHVjZSgoYWNjLCBzaWRlKSA9PiBhY2MuY29uY2F0KHNpZGUsIHNpZGUgKyBcIi1zdGFydFwiLCBzaWRlICsgXCItZW5kXCIpLCBbXSk7XG5mdW5jdGlvbiBnZXRQbGFjZW1lbnRMaXN0KGFsaWdubWVudCwgYXV0b0FsaWdubWVudCwgYWxsb3dlZFBsYWNlbWVudHMpIHtcbiAgY29uc3QgYWxsb3dlZFBsYWNlbWVudHNTb3J0ZWRCeUFsaWdubWVudCA9IGFsaWdubWVudCA/IFsuLi5hbGxvd2VkUGxhY2VtZW50cy5maWx0ZXIoKHBsYWNlbWVudCkgPT4gZ2V0QWxpZ25tZW50KHBsYWNlbWVudCkgPT09IGFsaWdubWVudCksIC4uLmFsbG93ZWRQbGFjZW1lbnRzLmZpbHRlcigocGxhY2VtZW50KSA9PiBnZXRBbGlnbm1lbnQocGxhY2VtZW50KSAhPT0gYWxpZ25tZW50KV0gOiBhbGxvd2VkUGxhY2VtZW50cy5maWx0ZXIoKHBsYWNlbWVudCkgPT4gZ2V0U2lkZShwbGFjZW1lbnQpID09PSBwbGFjZW1lbnQpO1xuICByZXR1cm4gYWxsb3dlZFBsYWNlbWVudHNTb3J0ZWRCeUFsaWdubWVudC5maWx0ZXIoKHBsYWNlbWVudCkgPT4ge1xuICAgIGlmIChhbGlnbm1lbnQpIHtcbiAgICAgIHJldHVybiBnZXRBbGlnbm1lbnQocGxhY2VtZW50KSA9PT0gYWxpZ25tZW50IHx8IChhdXRvQWxpZ25tZW50ID8gZ2V0T3Bwb3NpdGVBbGlnbm1lbnRQbGFjZW1lbnQocGxhY2VtZW50KSAhPT0gcGxhY2VtZW50IDogZmFsc2UpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG59XG52YXIgYXV0b1BsYWNlbWVudCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkge1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfVxuICByZXR1cm4ge1xuICAgIG5hbWU6IFwiYXV0b1BsYWNlbWVudFwiLFxuICAgIG9wdGlvbnMsXG4gICAgYXN5bmMgZm4obWlkZGxld2FyZUFyZ3VtZW50cykge1xuICAgICAgdmFyIF9taWRkbGV3YXJlRGF0YSRhdXRvUCwgX21pZGRsZXdhcmVEYXRhJGF1dG9QMiwgX21pZGRsZXdhcmVEYXRhJGF1dG9QMywgX21pZGRsZXdhcmVEYXRhJGF1dG9QNCwgX3BsYWNlbWVudHNTb3J0ZWRCeUxlO1xuICAgICAgY29uc3Qge1xuICAgICAgICB4LFxuICAgICAgICB5LFxuICAgICAgICByZWN0cyxcbiAgICAgICAgbWlkZGxld2FyZURhdGEsXG4gICAgICAgIHBsYWNlbWVudCxcbiAgICAgICAgcGxhdGZvcm06IHBsYXRmb3JtMixcbiAgICAgICAgZWxlbWVudHNcbiAgICAgIH0gPSBtaWRkbGV3YXJlQXJndW1lbnRzO1xuICAgICAgY29uc3Qge1xuICAgICAgICBhbGlnbm1lbnQgPSBudWxsLFxuICAgICAgICBhbGxvd2VkUGxhY2VtZW50cyA9IGFsbFBsYWNlbWVudHMsXG4gICAgICAgIGF1dG9BbGlnbm1lbnQgPSB0cnVlLFxuICAgICAgICAuLi5kZXRlY3RPdmVyZmxvd09wdGlvbnNcbiAgICAgIH0gPSBvcHRpb25zO1xuICAgICAgY29uc3QgcGxhY2VtZW50cyA9IGdldFBsYWNlbWVudExpc3QoYWxpZ25tZW50LCBhdXRvQWxpZ25tZW50LCBhbGxvd2VkUGxhY2VtZW50cyk7XG4gICAgICBjb25zdCBvdmVyZmxvdyA9IGF3YWl0IGRldGVjdE92ZXJmbG93KG1pZGRsZXdhcmVBcmd1bWVudHMsIGRldGVjdE92ZXJmbG93T3B0aW9ucyk7XG4gICAgICBjb25zdCBjdXJyZW50SW5kZXggPSAoX21pZGRsZXdhcmVEYXRhJGF1dG9QID0gKF9taWRkbGV3YXJlRGF0YSRhdXRvUDIgPSBtaWRkbGV3YXJlRGF0YS5hdXRvUGxhY2VtZW50KSA9PSBudWxsID8gdm9pZCAwIDogX21pZGRsZXdhcmVEYXRhJGF1dG9QMi5pbmRleCkgIT0gbnVsbCA/IF9taWRkbGV3YXJlRGF0YSRhdXRvUCA6IDA7XG4gICAgICBjb25zdCBjdXJyZW50UGxhY2VtZW50ID0gcGxhY2VtZW50c1tjdXJyZW50SW5kZXhdO1xuICAgICAgaWYgKGN1cnJlbnRQbGFjZW1lbnQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4ge307XG4gICAgICB9XG4gICAgICBjb25zdCB7XG4gICAgICAgIG1haW4sXG4gICAgICAgIGNyb3NzXG4gICAgICB9ID0gZ2V0QWxpZ25tZW50U2lkZXMoY3VycmVudFBsYWNlbWVudCwgcmVjdHMsIGF3YWl0IChwbGF0Zm9ybTIuaXNSVEwgPT0gbnVsbCA/IHZvaWQgMCA6IHBsYXRmb3JtMi5pc1JUTChlbGVtZW50cy5mbG9hdGluZykpKTtcbiAgICAgIGlmIChwbGFjZW1lbnQgIT09IGN1cnJlbnRQbGFjZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB4LFxuICAgICAgICAgIHksXG4gICAgICAgICAgcmVzZXQ6IHtcbiAgICAgICAgICAgIHBsYWNlbWVudDogcGxhY2VtZW50c1swXVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGN1cnJlbnRPdmVyZmxvd3MgPSBbb3ZlcmZsb3dbZ2V0U2lkZShjdXJyZW50UGxhY2VtZW50KV0sIG92ZXJmbG93W21haW5dLCBvdmVyZmxvd1tjcm9zc11dO1xuICAgICAgY29uc3QgYWxsT3ZlcmZsb3dzID0gWy4uLihfbWlkZGxld2FyZURhdGEkYXV0b1AzID0gKF9taWRkbGV3YXJlRGF0YSRhdXRvUDQgPSBtaWRkbGV3YXJlRGF0YS5hdXRvUGxhY2VtZW50KSA9PSBudWxsID8gdm9pZCAwIDogX21pZGRsZXdhcmVEYXRhJGF1dG9QNC5vdmVyZmxvd3MpICE9IG51bGwgPyBfbWlkZGxld2FyZURhdGEkYXV0b1AzIDogW10sIHtcbiAgICAgICAgcGxhY2VtZW50OiBjdXJyZW50UGxhY2VtZW50LFxuICAgICAgICBvdmVyZmxvd3M6IGN1cnJlbnRPdmVyZmxvd3NcbiAgICAgIH1dO1xuICAgICAgY29uc3QgbmV4dFBsYWNlbWVudCA9IHBsYWNlbWVudHNbY3VycmVudEluZGV4ICsgMV07XG4gICAgICBpZiAobmV4dFBsYWNlbWVudCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGluZGV4OiBjdXJyZW50SW5kZXggKyAxLFxuICAgICAgICAgICAgb3ZlcmZsb3dzOiBhbGxPdmVyZmxvd3NcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlc2V0OiB7XG4gICAgICAgICAgICBwbGFjZW1lbnQ6IG5leHRQbGFjZW1lbnRcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBjb25zdCBwbGFjZW1lbnRzU29ydGVkQnlMZWFzdE92ZXJmbG93ID0gYWxsT3ZlcmZsb3dzLnNsaWNlKCkuc29ydCgoYSwgYikgPT4gYS5vdmVyZmxvd3NbMF0gLSBiLm92ZXJmbG93c1swXSk7XG4gICAgICBjb25zdCBwbGFjZW1lbnRUaGF0Rml0c09uQWxsU2lkZXMgPSAoX3BsYWNlbWVudHNTb3J0ZWRCeUxlID0gcGxhY2VtZW50c1NvcnRlZEJ5TGVhc3RPdmVyZmxvdy5maW5kKChfcmVmKSA9PiB7XG4gICAgICAgIGxldCB7XG4gICAgICAgICAgb3ZlcmZsb3dzXG4gICAgICAgIH0gPSBfcmVmO1xuICAgICAgICByZXR1cm4gb3ZlcmZsb3dzLmV2ZXJ5KChvdmVyZmxvdzIpID0+IG92ZXJmbG93MiA8PSAwKTtcbiAgICAgIH0pKSA9PSBudWxsID8gdm9pZCAwIDogX3BsYWNlbWVudHNTb3J0ZWRCeUxlLnBsYWNlbWVudDtcbiAgICAgIGNvbnN0IHJlc2V0UGxhY2VtZW50ID0gcGxhY2VtZW50VGhhdEZpdHNPbkFsbFNpZGVzICE9IG51bGwgPyBwbGFjZW1lbnRUaGF0Rml0c09uQWxsU2lkZXMgOiBwbGFjZW1lbnRzU29ydGVkQnlMZWFzdE92ZXJmbG93WzBdLnBsYWNlbWVudDtcbiAgICAgIGlmIChyZXNldFBsYWNlbWVudCAhPT0gcGxhY2VtZW50KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgaW5kZXg6IGN1cnJlbnRJbmRleCArIDEsXG4gICAgICAgICAgICBvdmVyZmxvd3M6IGFsbE92ZXJmbG93c1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVzZXQ6IHtcbiAgICAgICAgICAgIHBsYWNlbWVudDogcmVzZXRQbGFjZW1lbnRcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICB9O1xufTtcbmZ1bmN0aW9uIGdldEV4cGFuZGVkUGxhY2VtZW50cyhwbGFjZW1lbnQpIHtcbiAgY29uc3Qgb3Bwb3NpdGVQbGFjZW1lbnQgPSBnZXRPcHBvc2l0ZVBsYWNlbWVudChwbGFjZW1lbnQpO1xuICByZXR1cm4gW2dldE9wcG9zaXRlQWxpZ25tZW50UGxhY2VtZW50KHBsYWNlbWVudCksIG9wcG9zaXRlUGxhY2VtZW50LCBnZXRPcHBvc2l0ZUFsaWdubWVudFBsYWNlbWVudChvcHBvc2l0ZVBsYWNlbWVudCldO1xufVxudmFyIGZsaXAgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zID09PSB2b2lkIDApIHtcbiAgICBvcHRpb25zID0ge307XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcImZsaXBcIixcbiAgICBvcHRpb25zLFxuICAgIGFzeW5jIGZuKG1pZGRsZXdhcmVBcmd1bWVudHMpIHtcbiAgICAgIHZhciBfbWlkZGxld2FyZURhdGEkZmxpcDtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgcGxhY2VtZW50LFxuICAgICAgICBtaWRkbGV3YXJlRGF0YSxcbiAgICAgICAgcmVjdHMsXG4gICAgICAgIGluaXRpYWxQbGFjZW1lbnQsXG4gICAgICAgIHBsYXRmb3JtOiBwbGF0Zm9ybTIsXG4gICAgICAgIGVsZW1lbnRzXG4gICAgICB9ID0gbWlkZGxld2FyZUFyZ3VtZW50cztcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgbWFpbkF4aXM6IGNoZWNrTWFpbkF4aXMgPSB0cnVlLFxuICAgICAgICBjcm9zc0F4aXM6IGNoZWNrQ3Jvc3NBeGlzID0gdHJ1ZSxcbiAgICAgICAgZmFsbGJhY2tQbGFjZW1lbnRzOiBzcGVjaWZpZWRGYWxsYmFja1BsYWNlbWVudHMsXG4gICAgICAgIGZhbGxiYWNrU3RyYXRlZ3kgPSBcImJlc3RGaXRcIixcbiAgICAgICAgZmxpcEFsaWdubWVudCA9IHRydWUsXG4gICAgICAgIC4uLmRldGVjdE92ZXJmbG93T3B0aW9uc1xuICAgICAgfSA9IG9wdGlvbnM7XG4gICAgICBjb25zdCBzaWRlID0gZ2V0U2lkZShwbGFjZW1lbnQpO1xuICAgICAgY29uc3QgaXNCYXNlUGxhY2VtZW50ID0gc2lkZSA9PT0gaW5pdGlhbFBsYWNlbWVudDtcbiAgICAgIGNvbnN0IGZhbGxiYWNrUGxhY2VtZW50cyA9IHNwZWNpZmllZEZhbGxiYWNrUGxhY2VtZW50cyB8fCAoaXNCYXNlUGxhY2VtZW50IHx8ICFmbGlwQWxpZ25tZW50ID8gW2dldE9wcG9zaXRlUGxhY2VtZW50KGluaXRpYWxQbGFjZW1lbnQpXSA6IGdldEV4cGFuZGVkUGxhY2VtZW50cyhpbml0aWFsUGxhY2VtZW50KSk7XG4gICAgICBjb25zdCBwbGFjZW1lbnRzID0gW2luaXRpYWxQbGFjZW1lbnQsIC4uLmZhbGxiYWNrUGxhY2VtZW50c107XG4gICAgICBjb25zdCBvdmVyZmxvdyA9IGF3YWl0IGRldGVjdE92ZXJmbG93KG1pZGRsZXdhcmVBcmd1bWVudHMsIGRldGVjdE92ZXJmbG93T3B0aW9ucyk7XG4gICAgICBjb25zdCBvdmVyZmxvd3MgPSBbXTtcbiAgICAgIGxldCBvdmVyZmxvd3NEYXRhID0gKChfbWlkZGxld2FyZURhdGEkZmxpcCA9IG1pZGRsZXdhcmVEYXRhLmZsaXApID09IG51bGwgPyB2b2lkIDAgOiBfbWlkZGxld2FyZURhdGEkZmxpcC5vdmVyZmxvd3MpIHx8IFtdO1xuICAgICAgaWYgKGNoZWNrTWFpbkF4aXMpIHtcbiAgICAgICAgb3ZlcmZsb3dzLnB1c2gob3ZlcmZsb3dbc2lkZV0pO1xuICAgICAgfVxuICAgICAgaWYgKGNoZWNrQ3Jvc3NBeGlzKSB7XG4gICAgICAgIGNvbnN0IHtcbiAgICAgICAgICBtYWluLFxuICAgICAgICAgIGNyb3NzXG4gICAgICAgIH0gPSBnZXRBbGlnbm1lbnRTaWRlcyhwbGFjZW1lbnQsIHJlY3RzLCBhd2FpdCAocGxhdGZvcm0yLmlzUlRMID09IG51bGwgPyB2b2lkIDAgOiBwbGF0Zm9ybTIuaXNSVEwoZWxlbWVudHMuZmxvYXRpbmcpKSk7XG4gICAgICAgIG92ZXJmbG93cy5wdXNoKG92ZXJmbG93W21haW5dLCBvdmVyZmxvd1tjcm9zc10pO1xuICAgICAgfVxuICAgICAgb3ZlcmZsb3dzRGF0YSA9IFsuLi5vdmVyZmxvd3NEYXRhLCB7XG4gICAgICAgIHBsYWNlbWVudCxcbiAgICAgICAgb3ZlcmZsb3dzXG4gICAgICB9XTtcbiAgICAgIGlmICghb3ZlcmZsb3dzLmV2ZXJ5KChzaWRlMikgPT4gc2lkZTIgPD0gMCkpIHtcbiAgICAgICAgdmFyIF9taWRkbGV3YXJlRGF0YSRmbGlwJCwgX21pZGRsZXdhcmVEYXRhJGZsaXAyO1xuICAgICAgICBjb25zdCBuZXh0SW5kZXggPSAoKF9taWRkbGV3YXJlRGF0YSRmbGlwJCA9IChfbWlkZGxld2FyZURhdGEkZmxpcDIgPSBtaWRkbGV3YXJlRGF0YS5mbGlwKSA9PSBudWxsID8gdm9pZCAwIDogX21pZGRsZXdhcmVEYXRhJGZsaXAyLmluZGV4KSAhPSBudWxsID8gX21pZGRsZXdhcmVEYXRhJGZsaXAkIDogMCkgKyAxO1xuICAgICAgICBjb25zdCBuZXh0UGxhY2VtZW50ID0gcGxhY2VtZW50c1tuZXh0SW5kZXhdO1xuICAgICAgICBpZiAobmV4dFBsYWNlbWVudCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIGluZGV4OiBuZXh0SW5kZXgsXG4gICAgICAgICAgICAgIG92ZXJmbG93czogb3ZlcmZsb3dzRGF0YVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2V0OiB7XG4gICAgICAgICAgICAgIHBsYWNlbWVudDogbmV4dFBsYWNlbWVudFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlc2V0UGxhY2VtZW50ID0gXCJib3R0b21cIjtcbiAgICAgICAgc3dpdGNoIChmYWxsYmFja1N0cmF0ZWd5KSB7XG4gICAgICAgICAgY2FzZSBcImJlc3RGaXRcIjoge1xuICAgICAgICAgICAgdmFyIF9vdmVyZmxvd3NEYXRhJG1hcCRzbztcbiAgICAgICAgICAgIGNvbnN0IHBsYWNlbWVudDIgPSAoX292ZXJmbG93c0RhdGEkbWFwJHNvID0gb3ZlcmZsb3dzRGF0YS5tYXAoKGQpID0+IFtkLCBkLm92ZXJmbG93cy5maWx0ZXIoKG92ZXJmbG93MikgPT4gb3ZlcmZsb3cyID4gMCkucmVkdWNlKChhY2MsIG92ZXJmbG93MikgPT4gYWNjICsgb3ZlcmZsb3cyLCAwKV0pLnNvcnQoKGEsIGIpID0+IGFbMV0gLSBiWzFdKVswXSkgPT0gbnVsbCA/IHZvaWQgMCA6IF9vdmVyZmxvd3NEYXRhJG1hcCRzb1swXS5wbGFjZW1lbnQ7XG4gICAgICAgICAgICBpZiAocGxhY2VtZW50Mikge1xuICAgICAgICAgICAgICByZXNldFBsYWNlbWVudCA9IHBsYWNlbWVudDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FzZSBcImluaXRpYWxQbGFjZW1lbnRcIjpcbiAgICAgICAgICAgIHJlc2V0UGxhY2VtZW50ID0gaW5pdGlhbFBsYWNlbWVudDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwbGFjZW1lbnQgIT09IHJlc2V0UGxhY2VtZW50KSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc2V0OiB7XG4gICAgICAgICAgICAgIHBsYWNlbWVudDogcmVzZXRQbGFjZW1lbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICB9O1xufTtcbmZ1bmN0aW9uIGdldFNpZGVPZmZzZXRzKG92ZXJmbG93LCByZWN0KSB7XG4gIHJldHVybiB7XG4gICAgdG9wOiBvdmVyZmxvdy50b3AgLSByZWN0LmhlaWdodCxcbiAgICByaWdodDogb3ZlcmZsb3cucmlnaHQgLSByZWN0LndpZHRoLFxuICAgIGJvdHRvbTogb3ZlcmZsb3cuYm90dG9tIC0gcmVjdC5oZWlnaHQsXG4gICAgbGVmdDogb3ZlcmZsb3cubGVmdCAtIHJlY3Qud2lkdGhcbiAgfTtcbn1cbmZ1bmN0aW9uIGlzQW55U2lkZUZ1bGx5Q2xpcHBlZChvdmVyZmxvdykge1xuICByZXR1cm4gc2lkZXMuc29tZSgoc2lkZSkgPT4gb3ZlcmZsb3dbc2lkZV0gPj0gMCk7XG59XG52YXIgaGlkZSA9IGZ1bmN0aW9uKF90ZW1wKSB7XG4gIGxldCB7XG4gICAgc3RyYXRlZ3kgPSBcInJlZmVyZW5jZUhpZGRlblwiLFxuICAgIC4uLmRldGVjdE92ZXJmbG93T3B0aW9uc1xuICB9ID0gX3RlbXAgPT09IHZvaWQgMCA/IHt9IDogX3RlbXA7XG4gIHJldHVybiB7XG4gICAgbmFtZTogXCJoaWRlXCIsXG4gICAgYXN5bmMgZm4obWlkZGxld2FyZUFyZ3VtZW50cykge1xuICAgICAgY29uc3Qge1xuICAgICAgICByZWN0c1xuICAgICAgfSA9IG1pZGRsZXdhcmVBcmd1bWVudHM7XG4gICAgICBzd2l0Y2ggKHN0cmF0ZWd5KSB7XG4gICAgICAgIGNhc2UgXCJyZWZlcmVuY2VIaWRkZW5cIjoge1xuICAgICAgICAgIGNvbnN0IG92ZXJmbG93ID0gYXdhaXQgZGV0ZWN0T3ZlcmZsb3cobWlkZGxld2FyZUFyZ3VtZW50cywge1xuICAgICAgICAgICAgLi4uZGV0ZWN0T3ZlcmZsb3dPcHRpb25zLFxuICAgICAgICAgICAgZWxlbWVudENvbnRleHQ6IFwicmVmZXJlbmNlXCJcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBjb25zdCBvZmZzZXRzID0gZ2V0U2lkZU9mZnNldHMob3ZlcmZsb3csIHJlY3RzLnJlZmVyZW5jZSk7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgcmVmZXJlbmNlSGlkZGVuT2Zmc2V0czogb2Zmc2V0cyxcbiAgICAgICAgICAgICAgcmVmZXJlbmNlSGlkZGVuOiBpc0FueVNpZGVGdWxseUNsaXBwZWQob2Zmc2V0cylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJlc2NhcGVkXCI6IHtcbiAgICAgICAgICBjb25zdCBvdmVyZmxvdyA9IGF3YWl0IGRldGVjdE92ZXJmbG93KG1pZGRsZXdhcmVBcmd1bWVudHMsIHtcbiAgICAgICAgICAgIC4uLmRldGVjdE92ZXJmbG93T3B0aW9ucyxcbiAgICAgICAgICAgIGFsdEJvdW5kYXJ5OiB0cnVlXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY29uc3Qgb2Zmc2V0cyA9IGdldFNpZGVPZmZzZXRzKG92ZXJmbG93LCByZWN0cy5mbG9hdGluZyk7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgZXNjYXBlZE9mZnNldHM6IG9mZnNldHMsXG4gICAgICAgICAgICAgIGVzY2FwZWQ6IGlzQW55U2lkZUZ1bGx5Q2xpcHBlZChvZmZzZXRzKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcbn07XG5mdW5jdGlvbiBjb252ZXJ0VmFsdWVUb0Nvb3JkcyhwbGFjZW1lbnQsIHJlY3RzLCB2YWx1ZSwgcnRsKSB7XG4gIGlmIChydGwgPT09IHZvaWQgMCkge1xuICAgIHJ0bCA9IGZhbHNlO1xuICB9XG4gIGNvbnN0IHNpZGUgPSBnZXRTaWRlKHBsYWNlbWVudCk7XG4gIGNvbnN0IGFsaWdubWVudCA9IGdldEFsaWdubWVudChwbGFjZW1lbnQpO1xuICBjb25zdCBpc1ZlcnRpY2FsID0gZ2V0TWFpbkF4aXNGcm9tUGxhY2VtZW50KHBsYWNlbWVudCkgPT09IFwieFwiO1xuICBjb25zdCBtYWluQXhpc011bHRpID0gW1wibGVmdFwiLCBcInRvcFwiXS5pbmNsdWRlcyhzaWRlKSA/IC0xIDogMTtcbiAgY29uc3QgY3Jvc3NBeGlzTXVsdGkgPSBydGwgJiYgaXNWZXJ0aWNhbCA/IC0xIDogMTtcbiAgY29uc3QgcmF3VmFsdWUgPSB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIiA/IHZhbHVlKHtcbiAgICAuLi5yZWN0cyxcbiAgICBwbGFjZW1lbnRcbiAgfSkgOiB2YWx1ZTtcbiAgbGV0IHtcbiAgICBtYWluQXhpcyxcbiAgICBjcm9zc0F4aXMsXG4gICAgYWxpZ25tZW50QXhpc1xuICB9ID0gdHlwZW9mIHJhd1ZhbHVlID09PSBcIm51bWJlclwiID8ge1xuICAgIG1haW5BeGlzOiByYXdWYWx1ZSxcbiAgICBjcm9zc0F4aXM6IDAsXG4gICAgYWxpZ25tZW50QXhpczogbnVsbFxuICB9IDoge1xuICAgIG1haW5BeGlzOiAwLFxuICAgIGNyb3NzQXhpczogMCxcbiAgICBhbGlnbm1lbnRBeGlzOiBudWxsLFxuICAgIC4uLnJhd1ZhbHVlXG4gIH07XG4gIGlmIChhbGlnbm1lbnQgJiYgdHlwZW9mIGFsaWdubWVudEF4aXMgPT09IFwibnVtYmVyXCIpIHtcbiAgICBjcm9zc0F4aXMgPSBhbGlnbm1lbnQgPT09IFwiZW5kXCIgPyBhbGlnbm1lbnRBeGlzICogLTEgOiBhbGlnbm1lbnRBeGlzO1xuICB9XG4gIHJldHVybiBpc1ZlcnRpY2FsID8ge1xuICAgIHg6IGNyb3NzQXhpcyAqIGNyb3NzQXhpc011bHRpLFxuICAgIHk6IG1haW5BeGlzICogbWFpbkF4aXNNdWx0aVxuICB9IDoge1xuICAgIHg6IG1haW5BeGlzICogbWFpbkF4aXNNdWx0aSxcbiAgICB5OiBjcm9zc0F4aXMgKiBjcm9zc0F4aXNNdWx0aVxuICB9O1xufVxudmFyIG9mZnNldCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PT0gdm9pZCAwKSB7XG4gICAgdmFsdWUgPSAwO1xuICB9XG4gIHJldHVybiB7XG4gICAgbmFtZTogXCJvZmZzZXRcIixcbiAgICBvcHRpb25zOiB2YWx1ZSxcbiAgICBhc3luYyBmbihtaWRkbGV3YXJlQXJndW1lbnRzKSB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIHgsXG4gICAgICAgIHksXG4gICAgICAgIHBsYWNlbWVudCxcbiAgICAgICAgcmVjdHMsXG4gICAgICAgIHBsYXRmb3JtOiBwbGF0Zm9ybTIsXG4gICAgICAgIGVsZW1lbnRzXG4gICAgICB9ID0gbWlkZGxld2FyZUFyZ3VtZW50cztcbiAgICAgIGNvbnN0IGRpZmZDb29yZHMgPSBjb252ZXJ0VmFsdWVUb0Nvb3JkcyhwbGFjZW1lbnQsIHJlY3RzLCB2YWx1ZSwgYXdhaXQgKHBsYXRmb3JtMi5pc1JUTCA9PSBudWxsID8gdm9pZCAwIDogcGxhdGZvcm0yLmlzUlRMKGVsZW1lbnRzLmZsb2F0aW5nKSkpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogeCArIGRpZmZDb29yZHMueCxcbiAgICAgICAgeTogeSArIGRpZmZDb29yZHMueSxcbiAgICAgICAgZGF0YTogZGlmZkNvb3Jkc1xuICAgICAgfTtcbiAgICB9XG4gIH07XG59O1xuZnVuY3Rpb24gZ2V0Q3Jvc3NBeGlzKGF4aXMpIHtcbiAgcmV0dXJuIGF4aXMgPT09IFwieFwiID8gXCJ5XCIgOiBcInhcIjtcbn1cbnZhciBzaGlmdCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkge1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfVxuICByZXR1cm4ge1xuICAgIG5hbWU6IFwic2hpZnRcIixcbiAgICBvcHRpb25zLFxuICAgIGFzeW5jIGZuKG1pZGRsZXdhcmVBcmd1bWVudHMpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgeCxcbiAgICAgICAgeSxcbiAgICAgICAgcGxhY2VtZW50XG4gICAgICB9ID0gbWlkZGxld2FyZUFyZ3VtZW50cztcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgbWFpbkF4aXM6IGNoZWNrTWFpbkF4aXMgPSB0cnVlLFxuICAgICAgICBjcm9zc0F4aXM6IGNoZWNrQ3Jvc3NBeGlzID0gZmFsc2UsXG4gICAgICAgIGxpbWl0ZXIgPSB7XG4gICAgICAgICAgZm46IChfcmVmKSA9PiB7XG4gICAgICAgICAgICBsZXQge1xuICAgICAgICAgICAgICB4OiB4MixcbiAgICAgICAgICAgICAgeTogeTJcbiAgICAgICAgICAgIH0gPSBfcmVmO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgeDogeDIsXG4gICAgICAgICAgICAgIHk6IHkyXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLi4uZGV0ZWN0T3ZlcmZsb3dPcHRpb25zXG4gICAgICB9ID0gb3B0aW9ucztcbiAgICAgIGNvbnN0IGNvb3JkcyA9IHtcbiAgICAgICAgeCxcbiAgICAgICAgeVxuICAgICAgfTtcbiAgICAgIGNvbnN0IG92ZXJmbG93ID0gYXdhaXQgZGV0ZWN0T3ZlcmZsb3cobWlkZGxld2FyZUFyZ3VtZW50cywgZGV0ZWN0T3ZlcmZsb3dPcHRpb25zKTtcbiAgICAgIGNvbnN0IG1haW5BeGlzID0gZ2V0TWFpbkF4aXNGcm9tUGxhY2VtZW50KGdldFNpZGUocGxhY2VtZW50KSk7XG4gICAgICBjb25zdCBjcm9zc0F4aXMgPSBnZXRDcm9zc0F4aXMobWFpbkF4aXMpO1xuICAgICAgbGV0IG1haW5BeGlzQ29vcmQgPSBjb29yZHNbbWFpbkF4aXNdO1xuICAgICAgbGV0IGNyb3NzQXhpc0Nvb3JkID0gY29vcmRzW2Nyb3NzQXhpc107XG4gICAgICBpZiAoY2hlY2tNYWluQXhpcykge1xuICAgICAgICBjb25zdCBtaW5TaWRlID0gbWFpbkF4aXMgPT09IFwieVwiID8gXCJ0b3BcIiA6IFwibGVmdFwiO1xuICAgICAgICBjb25zdCBtYXhTaWRlID0gbWFpbkF4aXMgPT09IFwieVwiID8gXCJib3R0b21cIiA6IFwicmlnaHRcIjtcbiAgICAgICAgY29uc3QgbWluMyA9IG1haW5BeGlzQ29vcmQgKyBvdmVyZmxvd1ttaW5TaWRlXTtcbiAgICAgICAgY29uc3QgbWF4MyA9IG1haW5BeGlzQ29vcmQgLSBvdmVyZmxvd1ttYXhTaWRlXTtcbiAgICAgICAgbWFpbkF4aXNDb29yZCA9IHdpdGhpbihtaW4zLCBtYWluQXhpc0Nvb3JkLCBtYXgzKTtcbiAgICAgIH1cbiAgICAgIGlmIChjaGVja0Nyb3NzQXhpcykge1xuICAgICAgICBjb25zdCBtaW5TaWRlID0gY3Jvc3NBeGlzID09PSBcInlcIiA/IFwidG9wXCIgOiBcImxlZnRcIjtcbiAgICAgICAgY29uc3QgbWF4U2lkZSA9IGNyb3NzQXhpcyA9PT0gXCJ5XCIgPyBcImJvdHRvbVwiIDogXCJyaWdodFwiO1xuICAgICAgICBjb25zdCBtaW4zID0gY3Jvc3NBeGlzQ29vcmQgKyBvdmVyZmxvd1ttaW5TaWRlXTtcbiAgICAgICAgY29uc3QgbWF4MyA9IGNyb3NzQXhpc0Nvb3JkIC0gb3ZlcmZsb3dbbWF4U2lkZV07XG4gICAgICAgIGNyb3NzQXhpc0Nvb3JkID0gd2l0aGluKG1pbjMsIGNyb3NzQXhpc0Nvb3JkLCBtYXgzKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGxpbWl0ZWRDb29yZHMgPSBsaW1pdGVyLmZuKHtcbiAgICAgICAgLi4ubWlkZGxld2FyZUFyZ3VtZW50cyxcbiAgICAgICAgW21haW5BeGlzXTogbWFpbkF4aXNDb29yZCxcbiAgICAgICAgW2Nyb3NzQXhpc106IGNyb3NzQXhpc0Nvb3JkXG4gICAgICB9KTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLmxpbWl0ZWRDb29yZHMsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICB4OiBsaW1pdGVkQ29vcmRzLnggLSB4LFxuICAgICAgICAgIHk6IGxpbWl0ZWRDb29yZHMueSAtIHlcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIH07XG59O1xudmFyIHNpemUgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zID09PSB2b2lkIDApIHtcbiAgICBvcHRpb25zID0ge307XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcInNpemVcIixcbiAgICBvcHRpb25zLFxuICAgIGFzeW5jIGZuKG1pZGRsZXdhcmVBcmd1bWVudHMpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgcGxhY2VtZW50LFxuICAgICAgICByZWN0cyxcbiAgICAgICAgcGxhdGZvcm06IHBsYXRmb3JtMixcbiAgICAgICAgZWxlbWVudHNcbiAgICAgIH0gPSBtaWRkbGV3YXJlQXJndW1lbnRzO1xuICAgICAgY29uc3Qge1xuICAgICAgICBhcHBseSxcbiAgICAgICAgLi4uZGV0ZWN0T3ZlcmZsb3dPcHRpb25zXG4gICAgICB9ID0gb3B0aW9ucztcbiAgICAgIGNvbnN0IG92ZXJmbG93ID0gYXdhaXQgZGV0ZWN0T3ZlcmZsb3cobWlkZGxld2FyZUFyZ3VtZW50cywgZGV0ZWN0T3ZlcmZsb3dPcHRpb25zKTtcbiAgICAgIGNvbnN0IHNpZGUgPSBnZXRTaWRlKHBsYWNlbWVudCk7XG4gICAgICBjb25zdCBhbGlnbm1lbnQgPSBnZXRBbGlnbm1lbnQocGxhY2VtZW50KTtcbiAgICAgIGxldCBoZWlnaHRTaWRlO1xuICAgICAgbGV0IHdpZHRoU2lkZTtcbiAgICAgIGlmIChzaWRlID09PSBcInRvcFwiIHx8IHNpZGUgPT09IFwiYm90dG9tXCIpIHtcbiAgICAgICAgaGVpZ2h0U2lkZSA9IHNpZGU7XG4gICAgICAgIHdpZHRoU2lkZSA9IGFsaWdubWVudCA9PT0gKGF3YWl0IChwbGF0Zm9ybTIuaXNSVEwgPT0gbnVsbCA/IHZvaWQgMCA6IHBsYXRmb3JtMi5pc1JUTChlbGVtZW50cy5mbG9hdGluZykpID8gXCJzdGFydFwiIDogXCJlbmRcIikgPyBcImxlZnRcIiA6IFwicmlnaHRcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdpZHRoU2lkZSA9IHNpZGU7XG4gICAgICAgIGhlaWdodFNpZGUgPSBhbGlnbm1lbnQgPT09IFwiZW5kXCIgPyBcInRvcFwiIDogXCJib3R0b21cIjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHhNaW4gPSBtYXgob3ZlcmZsb3cubGVmdCwgMCk7XG4gICAgICBjb25zdCB4TWF4ID0gbWF4KG92ZXJmbG93LnJpZ2h0LCAwKTtcbiAgICAgIGNvbnN0IHlNaW4gPSBtYXgob3ZlcmZsb3cudG9wLCAwKTtcbiAgICAgIGNvbnN0IHlNYXggPSBtYXgob3ZlcmZsb3cuYm90dG9tLCAwKTtcbiAgICAgIGNvbnN0IGRpbWVuc2lvbnMgPSB7XG4gICAgICAgIGhlaWdodDogcmVjdHMuZmxvYXRpbmcuaGVpZ2h0IC0gKFtcImxlZnRcIiwgXCJyaWdodFwiXS5pbmNsdWRlcyhwbGFjZW1lbnQpID8gMiAqICh5TWluICE9PSAwIHx8IHlNYXggIT09IDAgPyB5TWluICsgeU1heCA6IG1heChvdmVyZmxvdy50b3AsIG92ZXJmbG93LmJvdHRvbSkpIDogb3ZlcmZsb3dbaGVpZ2h0U2lkZV0pLFxuICAgICAgICB3aWR0aDogcmVjdHMuZmxvYXRpbmcud2lkdGggLSAoW1widG9wXCIsIFwiYm90dG9tXCJdLmluY2x1ZGVzKHBsYWNlbWVudCkgPyAyICogKHhNaW4gIT09IDAgfHwgeE1heCAhPT0gMCA/IHhNaW4gKyB4TWF4IDogbWF4KG92ZXJmbG93LmxlZnQsIG92ZXJmbG93LnJpZ2h0KSkgOiBvdmVyZmxvd1t3aWR0aFNpZGVdKVxuICAgICAgfTtcbiAgICAgIGNvbnN0IHByZXZEaW1lbnNpb25zID0gYXdhaXQgcGxhdGZvcm0yLmdldERpbWVuc2lvbnMoZWxlbWVudHMuZmxvYXRpbmcpO1xuICAgICAgYXBwbHkgPT0gbnVsbCA/IHZvaWQgMCA6IGFwcGx5KHtcbiAgICAgICAgLi4uZGltZW5zaW9ucyxcbiAgICAgICAgLi4ucmVjdHNcbiAgICAgIH0pO1xuICAgICAgY29uc3QgbmV4dERpbWVuc2lvbnMgPSBhd2FpdCBwbGF0Zm9ybTIuZ2V0RGltZW5zaW9ucyhlbGVtZW50cy5mbG9hdGluZyk7XG4gICAgICBpZiAocHJldkRpbWVuc2lvbnMud2lkdGggIT09IG5leHREaW1lbnNpb25zLndpZHRoIHx8IHByZXZEaW1lbnNpb25zLmhlaWdodCAhPT0gbmV4dERpbWVuc2lvbnMuaGVpZ2h0KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcmVzZXQ6IHtcbiAgICAgICAgICAgIHJlY3RzOiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbiAgfTtcbn07XG52YXIgaW5saW5lID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7XG4gICAgb3B0aW9ucyA9IHt9O1xuICB9XG4gIHJldHVybiB7XG4gICAgbmFtZTogXCJpbmxpbmVcIixcbiAgICBvcHRpb25zLFxuICAgIGFzeW5jIGZuKG1pZGRsZXdhcmVBcmd1bWVudHMpIHtcbiAgICAgIHZhciBfYXdhaXQkcGxhdGZvcm0kZ2V0Q2w7XG4gICAgICBjb25zdCB7XG4gICAgICAgIHBsYWNlbWVudCxcbiAgICAgICAgZWxlbWVudHMsXG4gICAgICAgIHJlY3RzLFxuICAgICAgICBwbGF0Zm9ybTogcGxhdGZvcm0yLFxuICAgICAgICBzdHJhdGVneVxuICAgICAgfSA9IG1pZGRsZXdhcmVBcmd1bWVudHM7XG4gICAgICBjb25zdCB7XG4gICAgICAgIHBhZGRpbmcgPSAyLFxuICAgICAgICB4LFxuICAgICAgICB5XG4gICAgICB9ID0gb3B0aW9ucztcbiAgICAgIGNvbnN0IGZhbGxiYWNrID0gcmVjdFRvQ2xpZW50UmVjdChwbGF0Zm9ybTIuY29udmVydE9mZnNldFBhcmVudFJlbGF0aXZlUmVjdFRvVmlld3BvcnRSZWxhdGl2ZVJlY3QgPyBhd2FpdCBwbGF0Zm9ybTIuY29udmVydE9mZnNldFBhcmVudFJlbGF0aXZlUmVjdFRvVmlld3BvcnRSZWxhdGl2ZVJlY3Qoe1xuICAgICAgICByZWN0OiByZWN0cy5yZWZlcmVuY2UsXG4gICAgICAgIG9mZnNldFBhcmVudDogYXdhaXQgKHBsYXRmb3JtMi5nZXRPZmZzZXRQYXJlbnQgPT0gbnVsbCA/IHZvaWQgMCA6IHBsYXRmb3JtMi5nZXRPZmZzZXRQYXJlbnQoZWxlbWVudHMuZmxvYXRpbmcpKSxcbiAgICAgICAgc3RyYXRlZ3lcbiAgICAgIH0pIDogcmVjdHMucmVmZXJlbmNlKTtcbiAgICAgIGNvbnN0IGNsaWVudFJlY3RzID0gKF9hd2FpdCRwbGF0Zm9ybSRnZXRDbCA9IGF3YWl0IChwbGF0Zm9ybTIuZ2V0Q2xpZW50UmVjdHMgPT0gbnVsbCA/IHZvaWQgMCA6IHBsYXRmb3JtMi5nZXRDbGllbnRSZWN0cyhlbGVtZW50cy5yZWZlcmVuY2UpKSkgIT0gbnVsbCA/IF9hd2FpdCRwbGF0Zm9ybSRnZXRDbCA6IFtdO1xuICAgICAgY29uc3QgcGFkZGluZ09iamVjdCA9IGdldFNpZGVPYmplY3RGcm9tUGFkZGluZyhwYWRkaW5nKTtcbiAgICAgIGZ1bmN0aW9uIGdldEJvdW5kaW5nQ2xpZW50UmVjdDIoKSB7XG4gICAgICAgIGlmIChjbGllbnRSZWN0cy5sZW5ndGggPT09IDIgJiYgY2xpZW50UmVjdHNbMF0ubGVmdCA+IGNsaWVudFJlY3RzWzFdLnJpZ2h0ICYmIHggIT0gbnVsbCAmJiB5ICE9IG51bGwpIHtcbiAgICAgICAgICB2YXIgX2NsaWVudFJlY3RzJGZpbmQ7XG4gICAgICAgICAgcmV0dXJuIChfY2xpZW50UmVjdHMkZmluZCA9IGNsaWVudFJlY3RzLmZpbmQoKHJlY3QpID0+IHggPiByZWN0LmxlZnQgLSBwYWRkaW5nT2JqZWN0LmxlZnQgJiYgeCA8IHJlY3QucmlnaHQgKyBwYWRkaW5nT2JqZWN0LnJpZ2h0ICYmIHkgPiByZWN0LnRvcCAtIHBhZGRpbmdPYmplY3QudG9wICYmIHkgPCByZWN0LmJvdHRvbSArIHBhZGRpbmdPYmplY3QuYm90dG9tKSkgIT0gbnVsbCA/IF9jbGllbnRSZWN0cyRmaW5kIDogZmFsbGJhY2s7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNsaWVudFJlY3RzLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgaWYgKGdldE1haW5BeGlzRnJvbVBsYWNlbWVudChwbGFjZW1lbnQpID09PSBcInhcIikge1xuICAgICAgICAgICAgY29uc3QgZmlyc3RSZWN0ID0gY2xpZW50UmVjdHNbMF07XG4gICAgICAgICAgICBjb25zdCBsYXN0UmVjdCA9IGNsaWVudFJlY3RzW2NsaWVudFJlY3RzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgY29uc3QgaXNUb3AgPSBnZXRTaWRlKHBsYWNlbWVudCkgPT09IFwidG9wXCI7XG4gICAgICAgICAgICBjb25zdCB0b3AyID0gZmlyc3RSZWN0LnRvcDtcbiAgICAgICAgICAgIGNvbnN0IGJvdHRvbTIgPSBsYXN0UmVjdC5ib3R0b207XG4gICAgICAgICAgICBjb25zdCBsZWZ0MiA9IGlzVG9wID8gZmlyc3RSZWN0LmxlZnQgOiBsYXN0UmVjdC5sZWZ0O1xuICAgICAgICAgICAgY29uc3QgcmlnaHQyID0gaXNUb3AgPyBmaXJzdFJlY3QucmlnaHQgOiBsYXN0UmVjdC5yaWdodDtcbiAgICAgICAgICAgIGNvbnN0IHdpZHRoMiA9IHJpZ2h0MiAtIGxlZnQyO1xuICAgICAgICAgICAgY29uc3QgaGVpZ2h0MiA9IGJvdHRvbTIgLSB0b3AyO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdG9wOiB0b3AyLFxuICAgICAgICAgICAgICBib3R0b206IGJvdHRvbTIsXG4gICAgICAgICAgICAgIGxlZnQ6IGxlZnQyLFxuICAgICAgICAgICAgICByaWdodDogcmlnaHQyLFxuICAgICAgICAgICAgICB3aWR0aDogd2lkdGgyLFxuICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodDIsXG4gICAgICAgICAgICAgIHg6IGxlZnQyLFxuICAgICAgICAgICAgICB5OiB0b3AyXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBpc0xlZnRTaWRlID0gZ2V0U2lkZShwbGFjZW1lbnQpID09PSBcImxlZnRcIjtcbiAgICAgICAgICBjb25zdCBtYXhSaWdodCA9IG1heCguLi5jbGllbnRSZWN0cy5tYXAoKHJlY3QpID0+IHJlY3QucmlnaHQpKTtcbiAgICAgICAgICBjb25zdCBtaW5MZWZ0ID0gbWluKC4uLmNsaWVudFJlY3RzLm1hcCgocmVjdCkgPT4gcmVjdC5sZWZ0KSk7XG4gICAgICAgICAgY29uc3QgbWVhc3VyZVJlY3RzID0gY2xpZW50UmVjdHMuZmlsdGVyKChyZWN0KSA9PiBpc0xlZnRTaWRlID8gcmVjdC5sZWZ0ID09PSBtaW5MZWZ0IDogcmVjdC5yaWdodCA9PT0gbWF4UmlnaHQpO1xuICAgICAgICAgIGNvbnN0IHRvcCA9IG1lYXN1cmVSZWN0c1swXS50b3A7XG4gICAgICAgICAgY29uc3QgYm90dG9tID0gbWVhc3VyZVJlY3RzW21lYXN1cmVSZWN0cy5sZW5ndGggLSAxXS5ib3R0b207XG4gICAgICAgICAgY29uc3QgbGVmdCA9IG1pbkxlZnQ7XG4gICAgICAgICAgY29uc3QgcmlnaHQgPSBtYXhSaWdodDtcbiAgICAgICAgICBjb25zdCB3aWR0aCA9IHJpZ2h0IC0gbGVmdDtcbiAgICAgICAgICBjb25zdCBoZWlnaHQgPSBib3R0b20gLSB0b3A7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRvcCxcbiAgICAgICAgICAgIGJvdHRvbSxcbiAgICAgICAgICAgIGxlZnQsXG4gICAgICAgICAgICByaWdodCxcbiAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgICAgeDogbGVmdCxcbiAgICAgICAgICAgIHk6IHRvcFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbGxiYWNrO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVzZXRSZWN0cyA9IGF3YWl0IHBsYXRmb3JtMi5nZXRFbGVtZW50UmVjdHMoe1xuICAgICAgICByZWZlcmVuY2U6IHtcbiAgICAgICAgICBnZXRCb3VuZGluZ0NsaWVudFJlY3Q6IGdldEJvdW5kaW5nQ2xpZW50UmVjdDJcbiAgICAgICAgfSxcbiAgICAgICAgZmxvYXRpbmc6IGVsZW1lbnRzLmZsb2F0aW5nLFxuICAgICAgICBzdHJhdGVneVxuICAgICAgfSk7XG4gICAgICBpZiAocmVjdHMucmVmZXJlbmNlLnggIT09IHJlc2V0UmVjdHMucmVmZXJlbmNlLnggfHwgcmVjdHMucmVmZXJlbmNlLnkgIT09IHJlc2V0UmVjdHMucmVmZXJlbmNlLnkgfHwgcmVjdHMucmVmZXJlbmNlLndpZHRoICE9PSByZXNldFJlY3RzLnJlZmVyZW5jZS53aWR0aCB8fCByZWN0cy5yZWZlcmVuY2UuaGVpZ2h0ICE9PSByZXNldFJlY3RzLnJlZmVyZW5jZS5oZWlnaHQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICByZXNldDoge1xuICAgICAgICAgICAgcmVjdHM6IHJlc2V0UmVjdHNcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICB9O1xufTtcblxuLy8gbm9kZV9tb2R1bGVzL0BmbG9hdGluZy11aS9kb20vZGlzdC9mbG9hdGluZy11aS5kb20uZXNtLmpzXG5mdW5jdGlvbiBpc1dpbmRvdyh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgJiYgdmFsdWUuZG9jdW1lbnQgJiYgdmFsdWUubG9jYXRpb24gJiYgdmFsdWUuYWxlcnQgJiYgdmFsdWUuc2V0SW50ZXJ2YWw7XG59XG5mdW5jdGlvbiBnZXRXaW5kb3cobm9kZSkge1xuICBpZiAobm9kZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIHdpbmRvdztcbiAgfVxuICBpZiAoIWlzV2luZG93KG5vZGUpKSB7XG4gICAgY29uc3Qgb3duZXJEb2N1bWVudCA9IG5vZGUub3duZXJEb2N1bWVudDtcbiAgICByZXR1cm4gb3duZXJEb2N1bWVudCA/IG93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXcgfHwgd2luZG93IDogd2luZG93O1xuICB9XG4gIHJldHVybiBub2RlO1xufVxuZnVuY3Rpb24gZ2V0Q29tcHV0ZWRTdHlsZSQxKGVsZW1lbnQpIHtcbiAgcmV0dXJuIGdldFdpbmRvdyhlbGVtZW50KS5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpO1xufVxuZnVuY3Rpb24gZ2V0Tm9kZU5hbWUobm9kZSkge1xuICByZXR1cm4gaXNXaW5kb3cobm9kZSkgPyBcIlwiIDogbm9kZSA/IChub2RlLm5vZGVOYW1lIHx8IFwiXCIpLnRvTG93ZXJDYXNlKCkgOiBcIlwiO1xufVxuZnVuY3Rpb24gaXNIVE1MRWxlbWVudCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBnZXRXaW5kb3codmFsdWUpLkhUTUxFbGVtZW50O1xufVxuZnVuY3Rpb24gaXNFbGVtZW50KHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIGdldFdpbmRvdyh2YWx1ZSkuRWxlbWVudDtcbn1cbmZ1bmN0aW9uIGlzTm9kZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBnZXRXaW5kb3codmFsdWUpLk5vZGU7XG59XG5mdW5jdGlvbiBpc1NoYWRvd1Jvb3Qobm9kZSkge1xuICBpZiAodHlwZW9mIFNoYWRvd1Jvb3QgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgT3duRWxlbWVudCA9IGdldFdpbmRvdyhub2RlKS5TaGFkb3dSb290O1xuICByZXR1cm4gbm9kZSBpbnN0YW5jZW9mIE93bkVsZW1lbnQgfHwgbm9kZSBpbnN0YW5jZW9mIFNoYWRvd1Jvb3Q7XG59XG5mdW5jdGlvbiBpc092ZXJmbG93RWxlbWVudChlbGVtZW50KSB7XG4gIGNvbnN0IHtcbiAgICBvdmVyZmxvdyxcbiAgICBvdmVyZmxvd1gsXG4gICAgb3ZlcmZsb3dZXG4gIH0gPSBnZXRDb21wdXRlZFN0eWxlJDEoZWxlbWVudCk7XG4gIHJldHVybiAvYXV0b3xzY3JvbGx8b3ZlcmxheXxoaWRkZW4vLnRlc3Qob3ZlcmZsb3cgKyBvdmVyZmxvd1kgKyBvdmVyZmxvd1gpO1xufVxuZnVuY3Rpb24gaXNUYWJsZUVsZW1lbnQoZWxlbWVudCkge1xuICByZXR1cm4gW1widGFibGVcIiwgXCJ0ZFwiLCBcInRoXCJdLmluY2x1ZGVzKGdldE5vZGVOYW1lKGVsZW1lbnQpKTtcbn1cbmZ1bmN0aW9uIGlzQ29udGFpbmluZ0Jsb2NrKGVsZW1lbnQpIHtcbiAgY29uc3QgaXNGaXJlZm94ID0gbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwiZmlyZWZveFwiKTtcbiAgY29uc3QgY3NzID0gZ2V0Q29tcHV0ZWRTdHlsZSQxKGVsZW1lbnQpO1xuICByZXR1cm4gY3NzLnRyYW5zZm9ybSAhPT0gXCJub25lXCIgfHwgY3NzLnBlcnNwZWN0aXZlICE9PSBcIm5vbmVcIiB8fCBjc3MuY29udGFpbiA9PT0gXCJwYWludFwiIHx8IFtcInRyYW5zZm9ybVwiLCBcInBlcnNwZWN0aXZlXCJdLmluY2x1ZGVzKGNzcy53aWxsQ2hhbmdlKSB8fCBpc0ZpcmVmb3ggJiYgY3NzLndpbGxDaGFuZ2UgPT09IFwiZmlsdGVyXCIgfHwgaXNGaXJlZm94ICYmIChjc3MuZmlsdGVyID8gY3NzLmZpbHRlciAhPT0gXCJub25lXCIgOiBmYWxzZSk7XG59XG5mdW5jdGlvbiBpc0xheW91dFZpZXdwb3J0KCkge1xuICByZXR1cm4gIS9eKCg/IWNocm9tZXxhbmRyb2lkKS4pKnNhZmFyaS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG59XG52YXIgbWluMiA9IE1hdGgubWluO1xudmFyIG1heDIgPSBNYXRoLm1heDtcbnZhciByb3VuZCA9IE1hdGgucm91bmQ7XG5mdW5jdGlvbiBnZXRCb3VuZGluZ0NsaWVudFJlY3QoZWxlbWVudCwgaW5jbHVkZVNjYWxlLCBpc0ZpeGVkU3RyYXRlZ3kpIHtcbiAgdmFyIF93aW4kdmlzdWFsVmlld3BvcnQkbywgX3dpbiR2aXN1YWxWaWV3cG9ydCwgX3dpbiR2aXN1YWxWaWV3cG9ydCRvMiwgX3dpbiR2aXN1YWxWaWV3cG9ydDI7XG4gIGlmIChpbmNsdWRlU2NhbGUgPT09IHZvaWQgMCkge1xuICAgIGluY2x1ZGVTY2FsZSA9IGZhbHNlO1xuICB9XG4gIGlmIChpc0ZpeGVkU3RyYXRlZ3kgPT09IHZvaWQgMCkge1xuICAgIGlzRml4ZWRTdHJhdGVneSA9IGZhbHNlO1xuICB9XG4gIGNvbnN0IGNsaWVudFJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICBsZXQgc2NhbGVYID0gMTtcbiAgbGV0IHNjYWxlWSA9IDE7XG4gIGlmIChpbmNsdWRlU2NhbGUgJiYgaXNIVE1MRWxlbWVudChlbGVtZW50KSkge1xuICAgIHNjYWxlWCA9IGVsZW1lbnQub2Zmc2V0V2lkdGggPiAwID8gcm91bmQoY2xpZW50UmVjdC53aWR0aCkgLyBlbGVtZW50Lm9mZnNldFdpZHRoIHx8IDEgOiAxO1xuICAgIHNjYWxlWSA9IGVsZW1lbnQub2Zmc2V0SGVpZ2h0ID4gMCA/IHJvdW5kKGNsaWVudFJlY3QuaGVpZ2h0KSAvIGVsZW1lbnQub2Zmc2V0SGVpZ2h0IHx8IDEgOiAxO1xuICB9XG4gIGNvbnN0IHdpbiA9IGlzRWxlbWVudChlbGVtZW50KSA/IGdldFdpbmRvdyhlbGVtZW50KSA6IHdpbmRvdztcbiAgY29uc3QgYWRkVmlzdWFsT2Zmc2V0cyA9ICFpc0xheW91dFZpZXdwb3J0KCkgJiYgaXNGaXhlZFN0cmF0ZWd5O1xuICBjb25zdCB4ID0gKGNsaWVudFJlY3QubGVmdCArIChhZGRWaXN1YWxPZmZzZXRzID8gKF93aW4kdmlzdWFsVmlld3BvcnQkbyA9IChfd2luJHZpc3VhbFZpZXdwb3J0ID0gd2luLnZpc3VhbFZpZXdwb3J0KSA9PSBudWxsID8gdm9pZCAwIDogX3dpbiR2aXN1YWxWaWV3cG9ydC5vZmZzZXRMZWZ0KSAhPSBudWxsID8gX3dpbiR2aXN1YWxWaWV3cG9ydCRvIDogMCA6IDApKSAvIHNjYWxlWDtcbiAgY29uc3QgeSA9IChjbGllbnRSZWN0LnRvcCArIChhZGRWaXN1YWxPZmZzZXRzID8gKF93aW4kdmlzdWFsVmlld3BvcnQkbzIgPSAoX3dpbiR2aXN1YWxWaWV3cG9ydDIgPSB3aW4udmlzdWFsVmlld3BvcnQpID09IG51bGwgPyB2b2lkIDAgOiBfd2luJHZpc3VhbFZpZXdwb3J0Mi5vZmZzZXRUb3ApICE9IG51bGwgPyBfd2luJHZpc3VhbFZpZXdwb3J0JG8yIDogMCA6IDApKSAvIHNjYWxlWTtcbiAgY29uc3Qgd2lkdGggPSBjbGllbnRSZWN0LndpZHRoIC8gc2NhbGVYO1xuICBjb25zdCBoZWlnaHQgPSBjbGllbnRSZWN0LmhlaWdodCAvIHNjYWxlWTtcbiAgcmV0dXJuIHtcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgdG9wOiB5LFxuICAgIHJpZ2h0OiB4ICsgd2lkdGgsXG4gICAgYm90dG9tOiB5ICsgaGVpZ2h0LFxuICAgIGxlZnQ6IHgsXG4gICAgeCxcbiAgICB5XG4gIH07XG59XG5mdW5jdGlvbiBnZXREb2N1bWVudEVsZW1lbnQobm9kZSkge1xuICByZXR1cm4gKChpc05vZGUobm9kZSkgPyBub2RlLm93bmVyRG9jdW1lbnQgOiBub2RlLmRvY3VtZW50KSB8fCB3aW5kb3cuZG9jdW1lbnQpLmRvY3VtZW50RWxlbWVudDtcbn1cbmZ1bmN0aW9uIGdldE5vZGVTY3JvbGwoZWxlbWVudCkge1xuICBpZiAoaXNFbGVtZW50KGVsZW1lbnQpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNjcm9sbExlZnQ6IGVsZW1lbnQuc2Nyb2xsTGVmdCxcbiAgICAgIHNjcm9sbFRvcDogZWxlbWVudC5zY3JvbGxUb3BcbiAgICB9O1xuICB9XG4gIHJldHVybiB7XG4gICAgc2Nyb2xsTGVmdDogZWxlbWVudC5wYWdlWE9mZnNldCxcbiAgICBzY3JvbGxUb3A6IGVsZW1lbnQucGFnZVlPZmZzZXRcbiAgfTtcbn1cbmZ1bmN0aW9uIGdldFdpbmRvd1Njcm9sbEJhclgoZWxlbWVudCkge1xuICByZXR1cm4gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGdldERvY3VtZW50RWxlbWVudChlbGVtZW50KSkubGVmdCArIGdldE5vZGVTY3JvbGwoZWxlbWVudCkuc2Nyb2xsTGVmdDtcbn1cbmZ1bmN0aW9uIGlzU2NhbGVkKGVsZW1lbnQpIHtcbiAgY29uc3QgcmVjdCA9IGdldEJvdW5kaW5nQ2xpZW50UmVjdChlbGVtZW50KTtcbiAgcmV0dXJuIHJvdW5kKHJlY3Qud2lkdGgpICE9PSBlbGVtZW50Lm9mZnNldFdpZHRoIHx8IHJvdW5kKHJlY3QuaGVpZ2h0KSAhPT0gZWxlbWVudC5vZmZzZXRIZWlnaHQ7XG59XG5mdW5jdGlvbiBnZXRSZWN0UmVsYXRpdmVUb09mZnNldFBhcmVudChlbGVtZW50LCBvZmZzZXRQYXJlbnQsIHN0cmF0ZWd5KSB7XG4gIGNvbnN0IGlzT2Zmc2V0UGFyZW50QW5FbGVtZW50ID0gaXNIVE1MRWxlbWVudChvZmZzZXRQYXJlbnQpO1xuICBjb25zdCBkb2N1bWVudEVsZW1lbnQgPSBnZXREb2N1bWVudEVsZW1lbnQob2Zmc2V0UGFyZW50KTtcbiAgY29uc3QgcmVjdCA9IGdldEJvdW5kaW5nQ2xpZW50UmVjdChcbiAgICBlbGVtZW50LFxuICAgIGlzT2Zmc2V0UGFyZW50QW5FbGVtZW50ICYmIGlzU2NhbGVkKG9mZnNldFBhcmVudCksXG4gICAgc3RyYXRlZ3kgPT09IFwiZml4ZWRcIlxuICApO1xuICBsZXQgc2Nyb2xsID0ge1xuICAgIHNjcm9sbExlZnQ6IDAsXG4gICAgc2Nyb2xsVG9wOiAwXG4gIH07XG4gIGNvbnN0IG9mZnNldHMgPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG4gIH07XG4gIGlmIChpc09mZnNldFBhcmVudEFuRWxlbWVudCB8fCAhaXNPZmZzZXRQYXJlbnRBbkVsZW1lbnQgJiYgc3RyYXRlZ3kgIT09IFwiZml4ZWRcIikge1xuICAgIGlmIChnZXROb2RlTmFtZShvZmZzZXRQYXJlbnQpICE9PSBcImJvZHlcIiB8fCBpc092ZXJmbG93RWxlbWVudChkb2N1bWVudEVsZW1lbnQpKSB7XG4gICAgICBzY3JvbGwgPSBnZXROb2RlU2Nyb2xsKG9mZnNldFBhcmVudCk7XG4gICAgfVxuICAgIGlmIChpc0hUTUxFbGVtZW50KG9mZnNldFBhcmVudCkpIHtcbiAgICAgIGNvbnN0IG9mZnNldFJlY3QgPSBnZXRCb3VuZGluZ0NsaWVudFJlY3Qob2Zmc2V0UGFyZW50LCB0cnVlKTtcbiAgICAgIG9mZnNldHMueCA9IG9mZnNldFJlY3QueCArIG9mZnNldFBhcmVudC5jbGllbnRMZWZ0O1xuICAgICAgb2Zmc2V0cy55ID0gb2Zmc2V0UmVjdC55ICsgb2Zmc2V0UGFyZW50LmNsaWVudFRvcDtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50RWxlbWVudCkge1xuICAgICAgb2Zmc2V0cy54ID0gZ2V0V2luZG93U2Nyb2xsQmFyWChkb2N1bWVudEVsZW1lbnQpO1xuICAgIH1cbiAgfVxuICByZXR1cm4ge1xuICAgIHg6IHJlY3QubGVmdCArIHNjcm9sbC5zY3JvbGxMZWZ0IC0gb2Zmc2V0cy54LFxuICAgIHk6IHJlY3QudG9wICsgc2Nyb2xsLnNjcm9sbFRvcCAtIG9mZnNldHMueSxcbiAgICB3aWR0aDogcmVjdC53aWR0aCxcbiAgICBoZWlnaHQ6IHJlY3QuaGVpZ2h0XG4gIH07XG59XG5mdW5jdGlvbiBnZXRQYXJlbnROb2RlKG5vZGUpIHtcbiAgaWYgKGdldE5vZGVOYW1lKG5vZGUpID09PSBcImh0bWxcIikge1xuICAgIHJldHVybiBub2RlO1xuICB9XG4gIHJldHVybiBub2RlLmFzc2lnbmVkU2xvdCB8fCBub2RlLnBhcmVudE5vZGUgfHwgKGlzU2hhZG93Um9vdChub2RlKSA/IG5vZGUuaG9zdCA6IG51bGwpIHx8IGdldERvY3VtZW50RWxlbWVudChub2RlKTtcbn1cbmZ1bmN0aW9uIGdldFRydWVPZmZzZXRQYXJlbnQoZWxlbWVudCkge1xuICBpZiAoIWlzSFRNTEVsZW1lbnQoZWxlbWVudCkgfHwgZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KS5wb3NpdGlvbiA9PT0gXCJmaXhlZFwiKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIGVsZW1lbnQub2Zmc2V0UGFyZW50O1xufVxuZnVuY3Rpb24gZ2V0Q29udGFpbmluZ0Jsb2NrKGVsZW1lbnQpIHtcbiAgbGV0IGN1cnJlbnROb2RlID0gZ2V0UGFyZW50Tm9kZShlbGVtZW50KTtcbiAgaWYgKGlzU2hhZG93Um9vdChjdXJyZW50Tm9kZSkpIHtcbiAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLmhvc3Q7XG4gIH1cbiAgd2hpbGUgKGlzSFRNTEVsZW1lbnQoY3VycmVudE5vZGUpICYmICFbXCJodG1sXCIsIFwiYm9keVwiXS5pbmNsdWRlcyhnZXROb2RlTmFtZShjdXJyZW50Tm9kZSkpKSB7XG4gICAgaWYgKGlzQ29udGFpbmluZ0Jsb2NrKGN1cnJlbnROb2RlKSkge1xuICAgICAgcmV0dXJuIGN1cnJlbnROb2RlO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLnBhcmVudE5vZGU7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuZnVuY3Rpb24gZ2V0T2Zmc2V0UGFyZW50KGVsZW1lbnQpIHtcbiAgY29uc3Qgd2luZG93MiA9IGdldFdpbmRvdyhlbGVtZW50KTtcbiAgbGV0IG9mZnNldFBhcmVudCA9IGdldFRydWVPZmZzZXRQYXJlbnQoZWxlbWVudCk7XG4gIHdoaWxlIChvZmZzZXRQYXJlbnQgJiYgaXNUYWJsZUVsZW1lbnQob2Zmc2V0UGFyZW50KSAmJiBnZXRDb21wdXRlZFN0eWxlKG9mZnNldFBhcmVudCkucG9zaXRpb24gPT09IFwic3RhdGljXCIpIHtcbiAgICBvZmZzZXRQYXJlbnQgPSBnZXRUcnVlT2Zmc2V0UGFyZW50KG9mZnNldFBhcmVudCk7XG4gIH1cbiAgaWYgKG9mZnNldFBhcmVudCAmJiAoZ2V0Tm9kZU5hbWUob2Zmc2V0UGFyZW50KSA9PT0gXCJodG1sXCIgfHwgZ2V0Tm9kZU5hbWUob2Zmc2V0UGFyZW50KSA9PT0gXCJib2R5XCIgJiYgZ2V0Q29tcHV0ZWRTdHlsZShvZmZzZXRQYXJlbnQpLnBvc2l0aW9uID09PSBcInN0YXRpY1wiICYmICFpc0NvbnRhaW5pbmdCbG9jayhvZmZzZXRQYXJlbnQpKSkge1xuICAgIHJldHVybiB3aW5kb3cyO1xuICB9XG4gIHJldHVybiBvZmZzZXRQYXJlbnQgfHwgZ2V0Q29udGFpbmluZ0Jsb2NrKGVsZW1lbnQpIHx8IHdpbmRvdzI7XG59XG5mdW5jdGlvbiBnZXREaW1lbnNpb25zKGVsZW1lbnQpIHtcbiAgaWYgKGlzSFRNTEVsZW1lbnQoZWxlbWVudCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgd2lkdGg6IGVsZW1lbnQub2Zmc2V0V2lkdGgsXG4gICAgICBoZWlnaHQ6IGVsZW1lbnQub2Zmc2V0SGVpZ2h0XG4gICAgfTtcbiAgfVxuICBjb25zdCByZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGVsZW1lbnQpO1xuICByZXR1cm4ge1xuICAgIHdpZHRoOiByZWN0LndpZHRoLFxuICAgIGhlaWdodDogcmVjdC5oZWlnaHRcbiAgfTtcbn1cbmZ1bmN0aW9uIGNvbnZlcnRPZmZzZXRQYXJlbnRSZWxhdGl2ZVJlY3RUb1ZpZXdwb3J0UmVsYXRpdmVSZWN0KF9yZWYpIHtcbiAgbGV0IHtcbiAgICByZWN0LFxuICAgIG9mZnNldFBhcmVudCxcbiAgICBzdHJhdGVneVxuICB9ID0gX3JlZjtcbiAgY29uc3QgaXNPZmZzZXRQYXJlbnRBbkVsZW1lbnQgPSBpc0hUTUxFbGVtZW50KG9mZnNldFBhcmVudCk7XG4gIGNvbnN0IGRvY3VtZW50RWxlbWVudCA9IGdldERvY3VtZW50RWxlbWVudChvZmZzZXRQYXJlbnQpO1xuICBpZiAob2Zmc2V0UGFyZW50ID09PSBkb2N1bWVudEVsZW1lbnQpIHtcbiAgICByZXR1cm4gcmVjdDtcbiAgfVxuICBsZXQgc2Nyb2xsID0ge1xuICAgIHNjcm9sbExlZnQ6IDAsXG4gICAgc2Nyb2xsVG9wOiAwXG4gIH07XG4gIGNvbnN0IG9mZnNldHMgPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG4gIH07XG4gIGlmIChpc09mZnNldFBhcmVudEFuRWxlbWVudCB8fCAhaXNPZmZzZXRQYXJlbnRBbkVsZW1lbnQgJiYgc3RyYXRlZ3kgIT09IFwiZml4ZWRcIikge1xuICAgIGlmIChnZXROb2RlTmFtZShvZmZzZXRQYXJlbnQpICE9PSBcImJvZHlcIiB8fCBpc092ZXJmbG93RWxlbWVudChkb2N1bWVudEVsZW1lbnQpKSB7XG4gICAgICBzY3JvbGwgPSBnZXROb2RlU2Nyb2xsKG9mZnNldFBhcmVudCk7XG4gICAgfVxuICAgIGlmIChpc0hUTUxFbGVtZW50KG9mZnNldFBhcmVudCkpIHtcbiAgICAgIGNvbnN0IG9mZnNldFJlY3QgPSBnZXRCb3VuZGluZ0NsaWVudFJlY3Qob2Zmc2V0UGFyZW50LCB0cnVlKTtcbiAgICAgIG9mZnNldHMueCA9IG9mZnNldFJlY3QueCArIG9mZnNldFBhcmVudC5jbGllbnRMZWZ0O1xuICAgICAgb2Zmc2V0cy55ID0gb2Zmc2V0UmVjdC55ICsgb2Zmc2V0UGFyZW50LmNsaWVudFRvcDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHtcbiAgICAuLi5yZWN0LFxuICAgIHg6IHJlY3QueCAtIHNjcm9sbC5zY3JvbGxMZWZ0ICsgb2Zmc2V0cy54LFxuICAgIHk6IHJlY3QueSAtIHNjcm9sbC5zY3JvbGxUb3AgKyBvZmZzZXRzLnlcbiAgfTtcbn1cbmZ1bmN0aW9uIGdldFZpZXdwb3J0UmVjdChlbGVtZW50LCBzdHJhdGVneSkge1xuICBjb25zdCB3aW4gPSBnZXRXaW5kb3coZWxlbWVudCk7XG4gIGNvbnN0IGh0bWwgPSBnZXREb2N1bWVudEVsZW1lbnQoZWxlbWVudCk7XG4gIGNvbnN0IHZpc3VhbFZpZXdwb3J0ID0gd2luLnZpc3VhbFZpZXdwb3J0O1xuICBsZXQgd2lkdGggPSBodG1sLmNsaWVudFdpZHRoO1xuICBsZXQgaGVpZ2h0ID0gaHRtbC5jbGllbnRIZWlnaHQ7XG4gIGxldCB4ID0gMDtcbiAgbGV0IHkgPSAwO1xuICBpZiAodmlzdWFsVmlld3BvcnQpIHtcbiAgICB3aWR0aCA9IHZpc3VhbFZpZXdwb3J0LndpZHRoO1xuICAgIGhlaWdodCA9IHZpc3VhbFZpZXdwb3J0LmhlaWdodDtcbiAgICBjb25zdCBsYXlvdXRWaWV3cG9ydCA9IGlzTGF5b3V0Vmlld3BvcnQoKTtcbiAgICBpZiAobGF5b3V0Vmlld3BvcnQgfHwgIWxheW91dFZpZXdwb3J0ICYmIHN0cmF0ZWd5ID09PSBcImZpeGVkXCIpIHtcbiAgICAgIHggPSB2aXN1YWxWaWV3cG9ydC5vZmZzZXRMZWZ0O1xuICAgICAgeSA9IHZpc3VhbFZpZXdwb3J0Lm9mZnNldFRvcDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgeCxcbiAgICB5XG4gIH07XG59XG5mdW5jdGlvbiBnZXREb2N1bWVudFJlY3QoZWxlbWVudCkge1xuICB2YXIgX2VsZW1lbnQkb3duZXJEb2N1bWVuO1xuICBjb25zdCBodG1sID0gZ2V0RG9jdW1lbnRFbGVtZW50KGVsZW1lbnQpO1xuICBjb25zdCBzY3JvbGwgPSBnZXROb2RlU2Nyb2xsKGVsZW1lbnQpO1xuICBjb25zdCBib2R5ID0gKF9lbGVtZW50JG93bmVyRG9jdW1lbiA9IGVsZW1lbnQub3duZXJEb2N1bWVudCkgPT0gbnVsbCA/IHZvaWQgMCA6IF9lbGVtZW50JG93bmVyRG9jdW1lbi5ib2R5O1xuICBjb25zdCB3aWR0aCA9IG1heDIoaHRtbC5zY3JvbGxXaWR0aCwgaHRtbC5jbGllbnRXaWR0aCwgYm9keSA/IGJvZHkuc2Nyb2xsV2lkdGggOiAwLCBib2R5ID8gYm9keS5jbGllbnRXaWR0aCA6IDApO1xuICBjb25zdCBoZWlnaHQgPSBtYXgyKGh0bWwuc2Nyb2xsSGVpZ2h0LCBodG1sLmNsaWVudEhlaWdodCwgYm9keSA/IGJvZHkuc2Nyb2xsSGVpZ2h0IDogMCwgYm9keSA/IGJvZHkuY2xpZW50SGVpZ2h0IDogMCk7XG4gIGxldCB4ID0gLXNjcm9sbC5zY3JvbGxMZWZ0ICsgZ2V0V2luZG93U2Nyb2xsQmFyWChlbGVtZW50KTtcbiAgY29uc3QgeSA9IC1zY3JvbGwuc2Nyb2xsVG9wO1xuICBpZiAoZ2V0Q29tcHV0ZWRTdHlsZSQxKGJvZHkgfHwgaHRtbCkuZGlyZWN0aW9uID09PSBcInJ0bFwiKSB7XG4gICAgeCArPSBtYXgyKGh0bWwuY2xpZW50V2lkdGgsIGJvZHkgPyBib2R5LmNsaWVudFdpZHRoIDogMCkgLSB3aWR0aDtcbiAgfVxuICByZXR1cm4ge1xuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICB4LFxuICAgIHlcbiAgfTtcbn1cbmZ1bmN0aW9uIGdldE5lYXJlc3RPdmVyZmxvd0FuY2VzdG9yKG5vZGUpIHtcbiAgY29uc3QgcGFyZW50Tm9kZSA9IGdldFBhcmVudE5vZGUobm9kZSk7XG4gIGlmIChbXCJodG1sXCIsIFwiYm9keVwiLCBcIiNkb2N1bWVudFwiXS5pbmNsdWRlcyhnZXROb2RlTmFtZShwYXJlbnROb2RlKSkpIHtcbiAgICByZXR1cm4gbm9kZS5vd25lckRvY3VtZW50LmJvZHk7XG4gIH1cbiAgaWYgKGlzSFRNTEVsZW1lbnQocGFyZW50Tm9kZSkgJiYgaXNPdmVyZmxvd0VsZW1lbnQocGFyZW50Tm9kZSkpIHtcbiAgICByZXR1cm4gcGFyZW50Tm9kZTtcbiAgfVxuICByZXR1cm4gZ2V0TmVhcmVzdE92ZXJmbG93QW5jZXN0b3IocGFyZW50Tm9kZSk7XG59XG5mdW5jdGlvbiBnZXRPdmVyZmxvd0FuY2VzdG9ycyhub2RlLCBsaXN0KSB7XG4gIHZhciBfbm9kZSRvd25lckRvY3VtZW50O1xuICBpZiAobGlzdCA9PT0gdm9pZCAwKSB7XG4gICAgbGlzdCA9IFtdO1xuICB9XG4gIGNvbnN0IHNjcm9sbGFibGVBbmNlc3RvciA9IGdldE5lYXJlc3RPdmVyZmxvd0FuY2VzdG9yKG5vZGUpO1xuICBjb25zdCBpc0JvZHkgPSBzY3JvbGxhYmxlQW5jZXN0b3IgPT09ICgoX25vZGUkb3duZXJEb2N1bWVudCA9IG5vZGUub3duZXJEb2N1bWVudCkgPT0gbnVsbCA/IHZvaWQgMCA6IF9ub2RlJG93bmVyRG9jdW1lbnQuYm9keSk7XG4gIGNvbnN0IHdpbiA9IGdldFdpbmRvdyhzY3JvbGxhYmxlQW5jZXN0b3IpO1xuICBjb25zdCB0YXJnZXQgPSBpc0JvZHkgPyBbd2luXS5jb25jYXQod2luLnZpc3VhbFZpZXdwb3J0IHx8IFtdLCBpc092ZXJmbG93RWxlbWVudChzY3JvbGxhYmxlQW5jZXN0b3IpID8gc2Nyb2xsYWJsZUFuY2VzdG9yIDogW10pIDogc2Nyb2xsYWJsZUFuY2VzdG9yO1xuICBjb25zdCB1cGRhdGVkTGlzdCA9IGxpc3QuY29uY2F0KHRhcmdldCk7XG4gIHJldHVybiBpc0JvZHkgPyB1cGRhdGVkTGlzdCA6IHVwZGF0ZWRMaXN0LmNvbmNhdChnZXRPdmVyZmxvd0FuY2VzdG9ycyh0YXJnZXQpKTtcbn1cbmZ1bmN0aW9uIGNvbnRhaW5zKHBhcmVudCwgY2hpbGQpIHtcbiAgY29uc3Qgcm9vdE5vZGUgPSBjaGlsZCA9PSBudWxsID8gdm9pZCAwIDogY2hpbGQuZ2V0Um9vdE5vZGUgPT0gbnVsbCA/IHZvaWQgMCA6IGNoaWxkLmdldFJvb3ROb2RlKCk7XG4gIGlmIChwYXJlbnQgIT0gbnVsbCAmJiBwYXJlbnQuY29udGFpbnMoY2hpbGQpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAocm9vdE5vZGUgJiYgaXNTaGFkb3dSb290KHJvb3ROb2RlKSkge1xuICAgIGxldCBuZXh0ID0gY2hpbGQ7XG4gICAgZG8ge1xuICAgICAgaWYgKG5leHQgJiYgcGFyZW50ID09PSBuZXh0KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgbmV4dCA9IG5leHQucGFyZW50Tm9kZSB8fCBuZXh0Lmhvc3Q7XG4gICAgfSB3aGlsZSAobmV4dCk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gZ2V0SW5uZXJCb3VuZGluZ0NsaWVudFJlY3QoZWxlbWVudCwgc3RyYXRlZ3kpIHtcbiAgY29uc3QgY2xpZW50UmVjdCA9IGdldEJvdW5kaW5nQ2xpZW50UmVjdChlbGVtZW50LCBmYWxzZSwgc3RyYXRlZ3kgPT09IFwiZml4ZWRcIik7XG4gIGNvbnN0IHRvcCA9IGNsaWVudFJlY3QudG9wICsgZWxlbWVudC5jbGllbnRUb3A7XG4gIGNvbnN0IGxlZnQgPSBjbGllbnRSZWN0LmxlZnQgKyBlbGVtZW50LmNsaWVudExlZnQ7XG4gIHJldHVybiB7XG4gICAgdG9wLFxuICAgIGxlZnQsXG4gICAgeDogbGVmdCxcbiAgICB5OiB0b3AsXG4gICAgcmlnaHQ6IGxlZnQgKyBlbGVtZW50LmNsaWVudFdpZHRoLFxuICAgIGJvdHRvbTogdG9wICsgZWxlbWVudC5jbGllbnRIZWlnaHQsXG4gICAgd2lkdGg6IGVsZW1lbnQuY2xpZW50V2lkdGgsXG4gICAgaGVpZ2h0OiBlbGVtZW50LmNsaWVudEhlaWdodFxuICB9O1xufVxuZnVuY3Rpb24gZ2V0Q2xpZW50UmVjdEZyb21DbGlwcGluZ0FuY2VzdG9yKGVsZW1lbnQsIGNsaXBwaW5nUGFyZW50LCBzdHJhdGVneSkge1xuICBpZiAoY2xpcHBpbmdQYXJlbnQgPT09IFwidmlld3BvcnRcIikge1xuICAgIHJldHVybiByZWN0VG9DbGllbnRSZWN0KGdldFZpZXdwb3J0UmVjdChlbGVtZW50LCBzdHJhdGVneSkpO1xuICB9XG4gIGlmIChpc0VsZW1lbnQoY2xpcHBpbmdQYXJlbnQpKSB7XG4gICAgcmV0dXJuIGdldElubmVyQm91bmRpbmdDbGllbnRSZWN0KGNsaXBwaW5nUGFyZW50LCBzdHJhdGVneSk7XG4gIH1cbiAgcmV0dXJuIHJlY3RUb0NsaWVudFJlY3QoZ2V0RG9jdW1lbnRSZWN0KGdldERvY3VtZW50RWxlbWVudChlbGVtZW50KSkpO1xufVxuZnVuY3Rpb24gZ2V0Q2xpcHBpbmdBbmNlc3RvcnMoZWxlbWVudCkge1xuICBjb25zdCBjbGlwcGluZ0FuY2VzdG9ycyA9IGdldE92ZXJmbG93QW5jZXN0b3JzKGVsZW1lbnQpO1xuICBjb25zdCBjYW5Fc2NhcGVDbGlwcGluZyA9IFtcImFic29sdXRlXCIsIFwiZml4ZWRcIl0uaW5jbHVkZXMoZ2V0Q29tcHV0ZWRTdHlsZSQxKGVsZW1lbnQpLnBvc2l0aW9uKTtcbiAgY29uc3QgY2xpcHBlckVsZW1lbnQgPSBjYW5Fc2NhcGVDbGlwcGluZyAmJiBpc0hUTUxFbGVtZW50KGVsZW1lbnQpID8gZ2V0T2Zmc2V0UGFyZW50KGVsZW1lbnQpIDogZWxlbWVudDtcbiAgaWYgKCFpc0VsZW1lbnQoY2xpcHBlckVsZW1lbnQpKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG4gIHJldHVybiBjbGlwcGluZ0FuY2VzdG9ycy5maWx0ZXIoKGNsaXBwaW5nQW5jZXN0b3JzMikgPT4gaXNFbGVtZW50KGNsaXBwaW5nQW5jZXN0b3JzMikgJiYgY29udGFpbnMoY2xpcHBpbmdBbmNlc3RvcnMyLCBjbGlwcGVyRWxlbWVudCkgJiYgZ2V0Tm9kZU5hbWUoY2xpcHBpbmdBbmNlc3RvcnMyKSAhPT0gXCJib2R5XCIpO1xufVxuZnVuY3Rpb24gZ2V0Q2xpcHBpbmdSZWN0KF9yZWYpIHtcbiAgbGV0IHtcbiAgICBlbGVtZW50LFxuICAgIGJvdW5kYXJ5LFxuICAgIHJvb3RCb3VuZGFyeSxcbiAgICBzdHJhdGVneVxuICB9ID0gX3JlZjtcbiAgY29uc3QgbWFpbkNsaXBwaW5nQW5jZXN0b3JzID0gYm91bmRhcnkgPT09IFwiY2xpcHBpbmdBbmNlc3RvcnNcIiA/IGdldENsaXBwaW5nQW5jZXN0b3JzKGVsZW1lbnQpIDogW10uY29uY2F0KGJvdW5kYXJ5KTtcbiAgY29uc3QgY2xpcHBpbmdBbmNlc3RvcnMgPSBbLi4ubWFpbkNsaXBwaW5nQW5jZXN0b3JzLCByb290Qm91bmRhcnldO1xuICBjb25zdCBmaXJzdENsaXBwaW5nQW5jZXN0b3IgPSBjbGlwcGluZ0FuY2VzdG9yc1swXTtcbiAgY29uc3QgY2xpcHBpbmdSZWN0ID0gY2xpcHBpbmdBbmNlc3RvcnMucmVkdWNlKChhY2NSZWN0LCBjbGlwcGluZ0FuY2VzdG9yKSA9PiB7XG4gICAgY29uc3QgcmVjdCA9IGdldENsaWVudFJlY3RGcm9tQ2xpcHBpbmdBbmNlc3RvcihlbGVtZW50LCBjbGlwcGluZ0FuY2VzdG9yLCBzdHJhdGVneSk7XG4gICAgYWNjUmVjdC50b3AgPSBtYXgyKHJlY3QudG9wLCBhY2NSZWN0LnRvcCk7XG4gICAgYWNjUmVjdC5yaWdodCA9IG1pbjIocmVjdC5yaWdodCwgYWNjUmVjdC5yaWdodCk7XG4gICAgYWNjUmVjdC5ib3R0b20gPSBtaW4yKHJlY3QuYm90dG9tLCBhY2NSZWN0LmJvdHRvbSk7XG4gICAgYWNjUmVjdC5sZWZ0ID0gbWF4MihyZWN0LmxlZnQsIGFjY1JlY3QubGVmdCk7XG4gICAgcmV0dXJuIGFjY1JlY3Q7XG4gIH0sIGdldENsaWVudFJlY3RGcm9tQ2xpcHBpbmdBbmNlc3RvcihlbGVtZW50LCBmaXJzdENsaXBwaW5nQW5jZXN0b3IsIHN0cmF0ZWd5KSk7XG4gIHJldHVybiB7XG4gICAgd2lkdGg6IGNsaXBwaW5nUmVjdC5yaWdodCAtIGNsaXBwaW5nUmVjdC5sZWZ0LFxuICAgIGhlaWdodDogY2xpcHBpbmdSZWN0LmJvdHRvbSAtIGNsaXBwaW5nUmVjdC50b3AsXG4gICAgeDogY2xpcHBpbmdSZWN0LmxlZnQsXG4gICAgeTogY2xpcHBpbmdSZWN0LnRvcFxuICB9O1xufVxudmFyIHBsYXRmb3JtID0ge1xuICBnZXRDbGlwcGluZ1JlY3QsXG4gIGNvbnZlcnRPZmZzZXRQYXJlbnRSZWxhdGl2ZVJlY3RUb1ZpZXdwb3J0UmVsYXRpdmVSZWN0LFxuICBpc0VsZW1lbnQsXG4gIGdldERpbWVuc2lvbnMsXG4gIGdldE9mZnNldFBhcmVudCxcbiAgZ2V0RG9jdW1lbnRFbGVtZW50LFxuICBnZXRFbGVtZW50UmVjdHM6IChfcmVmKSA9PiB7XG4gICAgbGV0IHtcbiAgICAgIHJlZmVyZW5jZSxcbiAgICAgIGZsb2F0aW5nLFxuICAgICAgc3RyYXRlZ3lcbiAgICB9ID0gX3JlZjtcbiAgICByZXR1cm4ge1xuICAgICAgcmVmZXJlbmNlOiBnZXRSZWN0UmVsYXRpdmVUb09mZnNldFBhcmVudChyZWZlcmVuY2UsIGdldE9mZnNldFBhcmVudChmbG9hdGluZyksIHN0cmF0ZWd5KSxcbiAgICAgIGZsb2F0aW5nOiB7XG4gICAgICAgIC4uLmdldERpbWVuc2lvbnMoZmxvYXRpbmcpLFxuICAgICAgICB4OiAwLFxuICAgICAgICB5OiAwXG4gICAgICB9XG4gICAgfTtcbiAgfSxcbiAgZ2V0Q2xpZW50UmVjdHM6IChlbGVtZW50KSA9PiBBcnJheS5mcm9tKGVsZW1lbnQuZ2V0Q2xpZW50UmVjdHMoKSksXG4gIGlzUlRMOiAoZWxlbWVudCkgPT4gZ2V0Q29tcHV0ZWRTdHlsZSQxKGVsZW1lbnQpLmRpcmVjdGlvbiA9PT0gXCJydGxcIlxufTtcbmZ1bmN0aW9uIGF1dG9VcGRhdGUocmVmZXJlbmNlLCBmbG9hdGluZywgdXBkYXRlLCBvcHRpb25zKSB7XG4gIGlmIChvcHRpb25zID09PSB2b2lkIDApIHtcbiAgICBvcHRpb25zID0ge307XG4gIH1cbiAgY29uc3Qge1xuICAgIGFuY2VzdG9yU2Nyb2xsOiBfYW5jZXN0b3JTY3JvbGwgPSB0cnVlLFxuICAgIGFuY2VzdG9yUmVzaXplOiBfYW5jZXN0b3JSZXNpemUgPSB0cnVlLFxuICAgIGVsZW1lbnRSZXNpemU6IF9lbGVtZW50UmVzaXplID0gdHJ1ZSxcbiAgICBhbmltYXRpb25GcmFtZSA9IGZhbHNlXG4gIH0gPSBvcHRpb25zO1xuICBsZXQgY2xlYW5lZFVwID0gZmFsc2U7XG4gIGNvbnN0IGFuY2VzdG9yU2Nyb2xsID0gX2FuY2VzdG9yU2Nyb2xsICYmICFhbmltYXRpb25GcmFtZTtcbiAgY29uc3QgYW5jZXN0b3JSZXNpemUgPSBfYW5jZXN0b3JSZXNpemUgJiYgIWFuaW1hdGlvbkZyYW1lO1xuICBjb25zdCBlbGVtZW50UmVzaXplID0gX2VsZW1lbnRSZXNpemUgJiYgIWFuaW1hdGlvbkZyYW1lO1xuICBjb25zdCBhbmNlc3RvcnMgPSBhbmNlc3RvclNjcm9sbCB8fCBhbmNlc3RvclJlc2l6ZSA/IFsuLi5pc0VsZW1lbnQocmVmZXJlbmNlKSA/IGdldE92ZXJmbG93QW5jZXN0b3JzKHJlZmVyZW5jZSkgOiBbXSwgLi4uZ2V0T3ZlcmZsb3dBbmNlc3RvcnMoZmxvYXRpbmcpXSA6IFtdO1xuICBhbmNlc3RvcnMuZm9yRWFjaCgoYW5jZXN0b3IpID0+IHtcbiAgICBhbmNlc3RvclNjcm9sbCAmJiBhbmNlc3Rvci5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsIHVwZGF0ZSwge1xuICAgICAgcGFzc2l2ZTogdHJ1ZVxuICAgIH0pO1xuICAgIGFuY2VzdG9yUmVzaXplICYmIGFuY2VzdG9yLmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgdXBkYXRlKTtcbiAgfSk7XG4gIGxldCBvYnNlcnZlcjIgPSBudWxsO1xuICBpZiAoZWxlbWVudFJlc2l6ZSkge1xuICAgIG9ic2VydmVyMiA9IG5ldyBSZXNpemVPYnNlcnZlcih1cGRhdGUpO1xuICAgIGlzRWxlbWVudChyZWZlcmVuY2UpICYmIG9ic2VydmVyMi5vYnNlcnZlKHJlZmVyZW5jZSk7XG4gICAgb2JzZXJ2ZXIyLm9ic2VydmUoZmxvYXRpbmcpO1xuICB9XG4gIGxldCBmcmFtZUlkO1xuICBsZXQgcHJldlJlZlJlY3QgPSBhbmltYXRpb25GcmFtZSA/IGdldEJvdW5kaW5nQ2xpZW50UmVjdChyZWZlcmVuY2UpIDogbnVsbDtcbiAgaWYgKGFuaW1hdGlvbkZyYW1lKSB7XG4gICAgZnJhbWVMb29wKCk7XG4gIH1cbiAgZnVuY3Rpb24gZnJhbWVMb29wKCkge1xuICAgIGlmIChjbGVhbmVkVXApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbmV4dFJlZlJlY3QgPSBnZXRCb3VuZGluZ0NsaWVudFJlY3QocmVmZXJlbmNlKTtcbiAgICBpZiAocHJldlJlZlJlY3QgJiYgKG5leHRSZWZSZWN0LnggIT09IHByZXZSZWZSZWN0LnggfHwgbmV4dFJlZlJlY3QueSAhPT0gcHJldlJlZlJlY3QueSB8fCBuZXh0UmVmUmVjdC53aWR0aCAhPT0gcHJldlJlZlJlY3Qud2lkdGggfHwgbmV4dFJlZlJlY3QuaGVpZ2h0ICE9PSBwcmV2UmVmUmVjdC5oZWlnaHQpKSB7XG4gICAgICB1cGRhdGUoKTtcbiAgICB9XG4gICAgcHJldlJlZlJlY3QgPSBuZXh0UmVmUmVjdDtcbiAgICBmcmFtZUlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZyYW1lTG9vcCk7XG4gIH1cbiAgcmV0dXJuICgpID0+IHtcbiAgICB2YXIgX29ic2VydmVyO1xuICAgIGNsZWFuZWRVcCA9IHRydWU7XG4gICAgYW5jZXN0b3JzLmZvckVhY2goKGFuY2VzdG9yKSA9PiB7XG4gICAgICBhbmNlc3RvclNjcm9sbCAmJiBhbmNlc3Rvci5yZW1vdmVFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsIHVwZGF0ZSk7XG4gICAgICBhbmNlc3RvclJlc2l6ZSAmJiBhbmNlc3Rvci5yZW1vdmVFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHVwZGF0ZSk7XG4gICAgfSk7XG4gICAgKF9vYnNlcnZlciA9IG9ic2VydmVyMikgPT0gbnVsbCA/IHZvaWQgMCA6IF9vYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgb2JzZXJ2ZXIyID0gbnVsbDtcbiAgICBpZiAoYW5pbWF0aW9uRnJhbWUpIHtcbiAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKGZyYW1lSWQpO1xuICAgIH1cbiAgfTtcbn1cbnZhciBjb21wdXRlUG9zaXRpb24yID0gKHJlZmVyZW5jZSwgZmxvYXRpbmcsIG9wdGlvbnMpID0+IGNvbXB1dGVQb3NpdGlvbihyZWZlcmVuY2UsIGZsb2F0aW5nLCB7XG4gIHBsYXRmb3JtLFxuICAuLi5vcHRpb25zXG59KTtcblxuLy8gc3JjL2J1aWxkQ29uZmlnRnJvbU1vZGlmaWVycy5qc1xudmFyIGJ1aWxkQ29uZmlnRnJvbU1vZGlmaWVycyA9IChtb2RpZmllcnMpID0+IHtcbiAgY29uc3QgY29uZmlnID0ge1xuICAgIHBsYWNlbWVudDogXCJib3R0b21cIixcbiAgICBtaWRkbGV3YXJlOiBbXVxuICB9O1xuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMobW9kaWZpZXJzKTtcbiAgY29uc3QgZ2V0TW9kaWZpZXJBcmd1bWVudCA9IChtb2RpZmllcikgPT4ge1xuICAgIHJldHVybiBtb2RpZmllcnNbbW9kaWZpZXJdO1xuICB9O1xuICBpZiAoa2V5cy5pbmNsdWRlcyhcIm9mZnNldFwiKSkge1xuICAgIGNvbmZpZy5taWRkbGV3YXJlLnB1c2gob2Zmc2V0KGdldE1vZGlmaWVyQXJndW1lbnQoXCJvZmZzZXRcIikpKTtcbiAgfVxuICBpZiAoa2V5cy5pbmNsdWRlcyhcInBsYWNlbWVudFwiKSkge1xuICAgIGNvbmZpZy5wbGFjZW1lbnQgPSBnZXRNb2RpZmllckFyZ3VtZW50KFwicGxhY2VtZW50XCIpO1xuICB9XG4gIGlmIChrZXlzLmluY2x1ZGVzKFwiYXV0b1BsYWNlbWVudFwiKSAmJiAha2V5cy5pbmNsdWRlcyhcImZsaXBcIikpIHtcbiAgICBjb25maWcubWlkZGxld2FyZS5wdXNoKGF1dG9QbGFjZW1lbnQoZ2V0TW9kaWZpZXJBcmd1bWVudChcImF1dG9QbGFjZW1lbnRcIikpKTtcbiAgfVxuICBpZiAoa2V5cy5pbmNsdWRlcyhcImZsaXBcIikpIHtcbiAgICBjb25maWcubWlkZGxld2FyZS5wdXNoKGZsaXAoZ2V0TW9kaWZpZXJBcmd1bWVudChcImZsaXBcIikpKTtcbiAgfVxuICBpZiAoa2V5cy5pbmNsdWRlcyhcInNoaWZ0XCIpKSB7XG4gICAgY29uZmlnLm1pZGRsZXdhcmUucHVzaChzaGlmdChnZXRNb2RpZmllckFyZ3VtZW50KFwic2hpZnRcIikpKTtcbiAgfVxuICBpZiAoa2V5cy5pbmNsdWRlcyhcImlubGluZVwiKSkge1xuICAgIGNvbmZpZy5taWRkbGV3YXJlLnB1c2goaW5saW5lKGdldE1vZGlmaWVyQXJndW1lbnQoXCJpbmxpbmVcIikpKTtcbiAgfVxuICBpZiAoa2V5cy5pbmNsdWRlcyhcImFycm93XCIpKSB7XG4gICAgY29uZmlnLm1pZGRsZXdhcmUucHVzaChhcnJvdyhnZXRNb2RpZmllckFyZ3VtZW50KFwiYXJyb3dcIikpKTtcbiAgfVxuICBpZiAoa2V5cy5pbmNsdWRlcyhcImhpZGVcIikpIHtcbiAgICBjb25maWcubWlkZGxld2FyZS5wdXNoKGhpZGUoZ2V0TW9kaWZpZXJBcmd1bWVudChcImhpZGVcIikpKTtcbiAgfVxuICBpZiAoa2V5cy5pbmNsdWRlcyhcInNpemVcIikpIHtcbiAgICBjb25maWcubWlkZGxld2FyZS5wdXNoKHNpemUoZ2V0TW9kaWZpZXJBcmd1bWVudChcInNpemVcIikpKTtcbiAgfVxuICByZXR1cm4gY29uZmlnO1xufTtcblxuLy8gc3JjL2J1aWxkRGlyZWN0aXZlQ29uZmlnRnJvbU1vZGlmaWVycy5qc1xudmFyIGJ1aWxkRGlyZWN0aXZlQ29uZmlnRnJvbU1vZGlmaWVycyA9IChtb2RpZmllcnMsIHNldHRpbmdzKSA9PiB7XG4gIGNvbnN0IGNvbmZpZyA9IHtcbiAgICBjb21wb25lbnQ6IHtcbiAgICAgIHRyYXA6IGZhbHNlXG4gICAgfSxcbiAgICBmbG9hdDoge1xuICAgICAgcGxhY2VtZW50OiBcImJvdHRvbVwiLFxuICAgICAgc3RyYXRlZ3k6IFwiYWJzb2x1dGVcIixcbiAgICAgIG1pZGRsZXdhcmU6IFtdXG4gICAgfVxuICB9O1xuICBjb25zdCBnZXRNb2RpZmllckFyZ3VtZW50ID0gKG1vZGlmaWVyKSA9PiB7XG4gICAgcmV0dXJuIG1vZGlmaWVyc1ttb2RpZmllcnMuaW5kZXhPZihtb2RpZmllcikgKyAxXTtcbiAgfTtcbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcInRyYXBcIikpIHtcbiAgICBjb25maWcuY29tcG9uZW50LnRyYXAgPSB0cnVlO1xuICB9XG4gIGlmIChtb2RpZmllcnMuaW5jbHVkZXMoXCJ0ZWxlcG9ydFwiKSkge1xuICAgIGNvbmZpZy5mbG9hdC5zdHJhdGVneSA9IFwiZml4ZWRcIjtcbiAgfVxuICBpZiAobW9kaWZpZXJzLmluY2x1ZGVzKFwib2Zmc2V0XCIpKSB7XG4gICAgY29uZmlnLmZsb2F0Lm1pZGRsZXdhcmUucHVzaChvZmZzZXQoc2V0dGluZ3NbXCJvZmZzZXRcIl0gfHwgMTApKTtcbiAgfVxuICBpZiAobW9kaWZpZXJzLmluY2x1ZGVzKFwicGxhY2VtZW50XCIpKSB7XG4gICAgY29uZmlnLmZsb2F0LnBsYWNlbWVudCA9IGdldE1vZGlmaWVyQXJndW1lbnQoXCJwbGFjZW1lbnRcIik7XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcImF1dG9QbGFjZW1lbnRcIikgJiYgIW1vZGlmaWVycy5pbmNsdWRlcyhcImZsaXBcIikpIHtcbiAgICBjb25maWcuZmxvYXQubWlkZGxld2FyZS5wdXNoKGF1dG9QbGFjZW1lbnQoc2V0dGluZ3NbXCJhdXRvUGxhY2VtZW50XCJdKSk7XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcImZsaXBcIikpIHtcbiAgICBjb25maWcuZmxvYXQubWlkZGxld2FyZS5wdXNoKGZsaXAoc2V0dGluZ3NbXCJmbGlwXCJdKSk7XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcInNoaWZ0XCIpKSB7XG4gICAgY29uZmlnLmZsb2F0Lm1pZGRsZXdhcmUucHVzaChzaGlmdChzZXR0aW5nc1tcInNoaWZ0XCJdKSk7XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcImlubGluZVwiKSkge1xuICAgIGNvbmZpZy5mbG9hdC5taWRkbGV3YXJlLnB1c2goaW5saW5lKHNldHRpbmdzW1wiaW5saW5lXCJdKSk7XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcImFycm93XCIpKSB7XG4gICAgY29uZmlnLmZsb2F0Lm1pZGRsZXdhcmUucHVzaChhcnJvdyhzZXR0aW5nc1tcImFycm93XCJdKSk7XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcImhpZGVcIikpIHtcbiAgICBjb25maWcuZmxvYXQubWlkZGxld2FyZS5wdXNoKGhpZGUoc2V0dGluZ3NbXCJoaWRlXCJdKSk7XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcInNpemVcIikpIHtcbiAgICBjb25maWcuZmxvYXQubWlkZGxld2FyZS5wdXNoKHNpemUoc2V0dGluZ3NbXCJzaXplXCJdKSk7XG4gIH1cbiAgcmV0dXJuIGNvbmZpZztcbn07XG5cbi8vIHNyYy9yYW5kb21TdHJpbmcuanNcbnZhciByYW5kb21TdHJpbmcgPSAobGVuZ3RoKSA9PiB7XG4gIHZhciBjaGFycyA9IFwiMDEyMzQ1Njc4OUFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFRaYWJjZGVmZ2hpa2xtbm9wcXJzdHV2d3h5elwiLnNwbGl0KFwiXCIpO1xuICB2YXIgc3RyID0gXCJcIjtcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGFycy5sZW5ndGgpO1xuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBzdHIgKz0gY2hhcnNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2hhcnMubGVuZ3RoKV07XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cbi8vIG5vZGVfbW9kdWxlcy9hbHBpbmVqcy9zcmMvbXV0YXRpb24uanNcbnZhciBvbkF0dHJpYnV0ZUFkZGVkcyA9IFtdO1xudmFyIG9uRWxSZW1vdmVkcyA9IFtdO1xudmFyIG9uRWxBZGRlZHMgPSBbXTtcbmZ1bmN0aW9uIGNsZWFudXBBdHRyaWJ1dGVzKGVsLCBuYW1lcykge1xuICBpZiAoIWVsLl94X2F0dHJpYnV0ZUNsZWFudXBzKVxuICAgIHJldHVybjtcbiAgT2JqZWN0LmVudHJpZXMoZWwuX3hfYXR0cmlidXRlQ2xlYW51cHMpLmZvckVhY2goKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICBpZiAobmFtZXMgPT09IHZvaWQgMCB8fCBuYW1lcy5pbmNsdWRlcyhuYW1lKSkge1xuICAgICAgdmFsdWUuZm9yRWFjaCgoaSkgPT4gaSgpKTtcbiAgICAgIGRlbGV0ZSBlbC5feF9hdHRyaWJ1dGVDbGVhbnVwc1tuYW1lXTtcbiAgICB9XG4gIH0pO1xufVxudmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIob25NdXRhdGUpO1xudmFyIGN1cnJlbnRseU9ic2VydmluZyA9IGZhbHNlO1xuZnVuY3Rpb24gc3RhcnRPYnNlcnZpbmdNdXRhdGlvbnMoKSB7XG4gIG9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQsIHsgc3VidHJlZTogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlLCBhdHRyaWJ1dGVzOiB0cnVlLCBhdHRyaWJ1dGVPbGRWYWx1ZTogdHJ1ZSB9KTtcbiAgY3VycmVudGx5T2JzZXJ2aW5nID0gdHJ1ZTtcbn1cbmZ1bmN0aW9uIHN0b3BPYnNlcnZpbmdNdXRhdGlvbnMoKSB7XG4gIGZsdXNoT2JzZXJ2ZXIoKTtcbiAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICBjdXJyZW50bHlPYnNlcnZpbmcgPSBmYWxzZTtcbn1cbnZhciByZWNvcmRRdWV1ZSA9IFtdO1xudmFyIHdpbGxQcm9jZXNzUmVjb3JkUXVldWUgPSBmYWxzZTtcbmZ1bmN0aW9uIGZsdXNoT2JzZXJ2ZXIoKSB7XG4gIHJlY29yZFF1ZXVlID0gcmVjb3JkUXVldWUuY29uY2F0KG9ic2VydmVyLnRha2VSZWNvcmRzKCkpO1xuICBpZiAocmVjb3JkUXVldWUubGVuZ3RoICYmICF3aWxsUHJvY2Vzc1JlY29yZFF1ZXVlKSB7XG4gICAgd2lsbFByb2Nlc3NSZWNvcmRRdWV1ZSA9IHRydWU7XG4gICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgcHJvY2Vzc1JlY29yZFF1ZXVlKCk7XG4gICAgICB3aWxsUHJvY2Vzc1JlY29yZFF1ZXVlID0gZmFsc2U7XG4gICAgfSk7XG4gIH1cbn1cbmZ1bmN0aW9uIHByb2Nlc3NSZWNvcmRRdWV1ZSgpIHtcbiAgb25NdXRhdGUocmVjb3JkUXVldWUpO1xuICByZWNvcmRRdWV1ZS5sZW5ndGggPSAwO1xufVxuZnVuY3Rpb24gbXV0YXRlRG9tKGNhbGxiYWNrKSB7XG4gIGlmICghY3VycmVudGx5T2JzZXJ2aW5nKVxuICAgIHJldHVybiBjYWxsYmFjaygpO1xuICBzdG9wT2JzZXJ2aW5nTXV0YXRpb25zKCk7XG4gIGxldCByZXN1bHQgPSBjYWxsYmFjaygpO1xuICBzdGFydE9ic2VydmluZ011dGF0aW9ucygpO1xuICByZXR1cm4gcmVzdWx0O1xufVxudmFyIGlzQ29sbGVjdGluZyA9IGZhbHNlO1xudmFyIGRlZmVycmVkTXV0YXRpb25zID0gW107XG5mdW5jdGlvbiBvbk11dGF0ZShtdXRhdGlvbnMpIHtcbiAgaWYgKGlzQ29sbGVjdGluZykge1xuICAgIGRlZmVycmVkTXV0YXRpb25zID0gZGVmZXJyZWRNdXRhdGlvbnMuY29uY2F0KG11dGF0aW9ucyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGxldCBhZGRlZE5vZGVzID0gW107XG4gIGxldCByZW1vdmVkTm9kZXMgPSBbXTtcbiAgbGV0IGFkZGVkQXR0cmlidXRlcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG4gIGxldCByZW1vdmVkQXR0cmlidXRlcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbXV0YXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKG11dGF0aW9uc1tpXS50YXJnZXQuX3hfaWdub3JlTXV0YXRpb25PYnNlcnZlcilcbiAgICAgIGNvbnRpbnVlO1xuICAgIGlmIChtdXRhdGlvbnNbaV0udHlwZSA9PT0gXCJjaGlsZExpc3RcIikge1xuICAgICAgbXV0YXRpb25zW2ldLmFkZGVkTm9kZXMuZm9yRWFjaCgobm9kZSkgPT4gbm9kZS5ub2RlVHlwZSA9PT0gMSAmJiBhZGRlZE5vZGVzLnB1c2gobm9kZSkpO1xuICAgICAgbXV0YXRpb25zW2ldLnJlbW92ZWROb2Rlcy5mb3JFYWNoKChub2RlKSA9PiBub2RlLm5vZGVUeXBlID09PSAxICYmIHJlbW92ZWROb2Rlcy5wdXNoKG5vZGUpKTtcbiAgICB9XG4gICAgaWYgKG11dGF0aW9uc1tpXS50eXBlID09PSBcImF0dHJpYnV0ZXNcIikge1xuICAgICAgbGV0IGVsID0gbXV0YXRpb25zW2ldLnRhcmdldDtcbiAgICAgIGxldCBuYW1lID0gbXV0YXRpb25zW2ldLmF0dHJpYnV0ZU5hbWU7XG4gICAgICBsZXQgb2xkVmFsdWUgPSBtdXRhdGlvbnNbaV0ub2xkVmFsdWU7XG4gICAgICBsZXQgYWRkID0gKCkgPT4ge1xuICAgICAgICBpZiAoIWFkZGVkQXR0cmlidXRlcy5oYXMoZWwpKVxuICAgICAgICAgIGFkZGVkQXR0cmlidXRlcy5zZXQoZWwsIFtdKTtcbiAgICAgICAgYWRkZWRBdHRyaWJ1dGVzLmdldChlbCkucHVzaCh7IG5hbWUsIHZhbHVlOiBlbC5nZXRBdHRyaWJ1dGUobmFtZSkgfSk7XG4gICAgICB9O1xuICAgICAgbGV0IHJlbW92ZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKCFyZW1vdmVkQXR0cmlidXRlcy5oYXMoZWwpKVxuICAgICAgICAgIHJlbW92ZWRBdHRyaWJ1dGVzLnNldChlbCwgW10pO1xuICAgICAgICByZW1vdmVkQXR0cmlidXRlcy5nZXQoZWwpLnB1c2gobmFtZSk7XG4gICAgICB9O1xuICAgICAgaWYgKGVsLmhhc0F0dHJpYnV0ZShuYW1lKSAmJiBvbGRWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgICBhZGQoKTtcbiAgICAgIH0gZWxzZSBpZiAoZWwuaGFzQXR0cmlidXRlKG5hbWUpKSB7XG4gICAgICAgIHJlbW92ZSgpO1xuICAgICAgICBhZGQoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlbW92ZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZW1vdmVkQXR0cmlidXRlcy5mb3JFYWNoKChhdHRycywgZWwpID0+IHtcbiAgICBjbGVhbnVwQXR0cmlidXRlcyhlbCwgYXR0cnMpO1xuICB9KTtcbiAgYWRkZWRBdHRyaWJ1dGVzLmZvckVhY2goKGF0dHJzLCBlbCkgPT4ge1xuICAgIG9uQXR0cmlidXRlQWRkZWRzLmZvckVhY2goKGkpID0+IGkoZWwsIGF0dHJzKSk7XG4gIH0pO1xuICBmb3IgKGxldCBub2RlIG9mIHJlbW92ZWROb2Rlcykge1xuICAgIGlmIChhZGRlZE5vZGVzLmluY2x1ZGVzKG5vZGUpKVxuICAgICAgY29udGludWU7XG4gICAgb25FbFJlbW92ZWRzLmZvckVhY2goKGkpID0+IGkobm9kZSkpO1xuICAgIGlmIChub2RlLl94X2NsZWFudXBzKSB7XG4gICAgICB3aGlsZSAobm9kZS5feF9jbGVhbnVwcy5sZW5ndGgpXG4gICAgICAgIG5vZGUuX3hfY2xlYW51cHMucG9wKCkoKTtcbiAgICB9XG4gIH1cbiAgYWRkZWROb2Rlcy5mb3JFYWNoKChub2RlKSA9PiB7XG4gICAgbm9kZS5feF9pZ25vcmVTZWxmID0gdHJ1ZTtcbiAgICBub2RlLl94X2lnbm9yZSA9IHRydWU7XG4gIH0pO1xuICBmb3IgKGxldCBub2RlIG9mIGFkZGVkTm9kZXMpIHtcbiAgICBpZiAocmVtb3ZlZE5vZGVzLmluY2x1ZGVzKG5vZGUpKVxuICAgICAgY29udGludWU7XG4gICAgaWYgKCFub2RlLmlzQ29ubmVjdGVkKVxuICAgICAgY29udGludWU7XG4gICAgZGVsZXRlIG5vZGUuX3hfaWdub3JlU2VsZjtcbiAgICBkZWxldGUgbm9kZS5feF9pZ25vcmU7XG4gICAgb25FbEFkZGVkcy5mb3JFYWNoKChpKSA9PiBpKG5vZGUpKTtcbiAgICBub2RlLl94X2lnbm9yZSA9IHRydWU7XG4gICAgbm9kZS5feF9pZ25vcmVTZWxmID0gdHJ1ZTtcbiAgfVxuICBhZGRlZE5vZGVzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICBkZWxldGUgbm9kZS5feF9pZ25vcmVTZWxmO1xuICAgIGRlbGV0ZSBub2RlLl94X2lnbm9yZTtcbiAgfSk7XG4gIGFkZGVkTm9kZXMgPSBudWxsO1xuICByZW1vdmVkTm9kZXMgPSBudWxsO1xuICBhZGRlZEF0dHJpYnV0ZXMgPSBudWxsO1xuICByZW1vdmVkQXR0cmlidXRlcyA9IG51bGw7XG59XG5cbi8vIG5vZGVfbW9kdWxlcy9hbHBpbmVqcy9zcmMvdXRpbHMvb25jZS5qc1xuZnVuY3Rpb24gb25jZShjYWxsYmFjaywgZmFsbGJhY2sgPSAoKSA9PiB7XG59KSB7XG4gIGxldCBjYWxsZWQgPSBmYWxzZTtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIGlmICghY2FsbGVkKSB7XG4gICAgICBjYWxsZWQgPSB0cnVlO1xuICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZmFsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH07XG59XG5cbi8vIHNyYy9pbmRleC5qc1xuZnVuY3Rpb24gc3JjX2RlZmF1bHQoQWxwaW5lKSB7XG4gIGNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICAgIGRpc21pc3NhYmxlOiB0cnVlLFxuICAgIHRyYXA6IGZhbHNlXG4gIH07XG4gIGZ1bmN0aW9uIHNldHVwQTExeShjb21wb25lbnQsIHRyaWdnZXIsIHBhbmVsID0gbnVsbCkge1xuICAgIGlmICghdHJpZ2dlcilcbiAgICAgIHJldHVybjtcbiAgICBpZiAoIXRyaWdnZXIuaGFzQXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiKSkge1xuICAgICAgdHJpZ2dlci5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsIGZhbHNlKTtcbiAgICB9XG4gICAgaWYgKCFwYW5lbC5oYXNBdHRyaWJ1dGUoXCJpZFwiKSkge1xuICAgICAgY29uc3QgcGFuZWxJZCA9IGBwYW5lbC0ke3JhbmRvbVN0cmluZyg4KX1gO1xuICAgICAgdHJpZ2dlci5zZXRBdHRyaWJ1dGUoXCJhcmlhLWNvbnRyb2xzXCIsIHBhbmVsSWQpO1xuICAgICAgcGFuZWwuc2V0QXR0cmlidXRlKFwiaWRcIiwgcGFuZWxJZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyaWdnZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1jb250cm9sc1wiLCBwYW5lbC5nZXRBdHRyaWJ1dGUoXCJpZFwiKSk7XG4gICAgfVxuICAgIHBhbmVsLnNldEF0dHJpYnV0ZShcImFyaWEtbW9kYWxcIiwgdHJ1ZSk7XG4gICAgcGFuZWwuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcImRpYWxvZ1wiKTtcbiAgfVxuICBjb25zdCBhdE1hZ2ljVHJpZ2dlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tcXFxcQGNsaWNrXj1cIiRmbG9hdFwiXScpO1xuICBjb25zdCB4TWFnaWNUcmlnZ2VyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW3gtb25cXFxcOmNsaWNrXj1cIiRmbG9hdFwiXScpO1xuICBbLi4uYXRNYWdpY1RyaWdnZXIsIC4uLnhNYWdpY1RyaWdnZXJdLmZvckVhY2goKHRyaWdnZXIpID0+IHtcbiAgICBjb25zdCBjb21wb25lbnQgPSB0cmlnZ2VyLnBhcmVudEVsZW1lbnQuY2xvc2VzdChcIlt4LWRhdGFdXCIpO1xuICAgIGNvbnN0IHBhbmVsID0gY29tcG9uZW50LnF1ZXJ5U2VsZWN0b3IoJ1t4LXJlZj1cInBhbmVsXCJdJyk7XG4gICAgc2V0dXBBMTF5KGNvbXBvbmVudCwgdHJpZ2dlciwgcGFuZWwpO1xuICB9KTtcbiAgQWxwaW5lLm1hZ2ljKFwiZmxvYXRcIiwgKGVsKSA9PiB7XG4gICAgcmV0dXJuIChtb2RpZmllcnMgPSB7fSwgc2V0dGluZ3MgPSB7fSkgPT4ge1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IHsgLi4uZGVmYXVsdE9wdGlvbnMsIC4uLnNldHRpbmdzIH07XG4gICAgICBjb25zdCBjb25maWcgPSBPYmplY3Qua2V5cyhtb2RpZmllcnMpLmxlbmd0aCA+IDAgPyBidWlsZENvbmZpZ0Zyb21Nb2RpZmllcnMobW9kaWZpZXJzKSA6IHsgbWlkZGxld2FyZTogW2F1dG9QbGFjZW1lbnQoKV0gfTtcbiAgICAgIGNvbnN0IHRyaWdnZXIgPSBlbDtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IGVsLnBhcmVudEVsZW1lbnQuY2xvc2VzdChcIlt4LWRhdGFdXCIpO1xuICAgICAgY29uc3QgcGFuZWwgPSBjb21wb25lbnQucXVlcnlTZWxlY3RvcignW3gtcmVmPVwicGFuZWxcIl0nKTtcbiAgICAgIGZ1bmN0aW9uIGlzRmxvYXRpbmcoKSB7XG4gICAgICAgIHJldHVybiBwYW5lbC5zdHlsZS5kaXNwbGF5ID09IFwiYmxvY2tcIjtcbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIGNsb3NlUGFuZWwoKSB7XG4gICAgICAgIHBhbmVsLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICB0cmlnZ2VyLnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgZmFsc2UpO1xuICAgICAgICBpZiAob3B0aW9ucy50cmFwKVxuICAgICAgICAgIHBhbmVsLnNldEF0dHJpYnV0ZShcIngtdHJhcFwiLCBmYWxzZSk7XG4gICAgICAgIGF1dG9VcGRhdGUoZWwsIHBhbmVsLCB1cGRhdGUpO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gb3BlblBhbmVsKCkge1xuICAgICAgICBwYW5lbC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgICB0cmlnZ2VyLnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgdHJ1ZSk7XG4gICAgICAgIGlmIChvcHRpb25zLnRyYXApXG4gICAgICAgICAgcGFuZWwuc2V0QXR0cmlidXRlKFwieC10cmFwXCIsIHRydWUpO1xuICAgICAgICB1cGRhdGUoKTtcbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIHRvZ2dsZVBhbmVsKCkge1xuICAgICAgICBpc0Zsb2F0aW5nKCkgPyBjbG9zZVBhbmVsKCkgOiBvcGVuUGFuZWwoKTtcbiAgICAgIH1cbiAgICAgIGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGNvbXB1dGVQb3NpdGlvbjIoZWwsIHBhbmVsLCBjb25maWcpLnRoZW4oKHsgbWlkZGxld2FyZURhdGEsIHBsYWNlbWVudCwgeCwgeSB9KSA9PiB7XG4gICAgICAgICAgaWYgKG1pZGRsZXdhcmVEYXRhLmFycm93KSB7XG4gICAgICAgICAgICBjb25zdCBheCA9IG1pZGRsZXdhcmVEYXRhLmFycm93Py54O1xuICAgICAgICAgICAgY29uc3QgYXkgPSBtaWRkbGV3YXJlRGF0YS5hcnJvdz8ueTtcbiAgICAgICAgICAgIGNvbnN0IGFFbCA9IGNvbmZpZy5taWRkbGV3YXJlLmZpbHRlcigobWlkZGxld2FyZSkgPT4gbWlkZGxld2FyZS5uYW1lID09IFwiYXJyb3dcIilbMF0ub3B0aW9ucy5lbGVtZW50O1xuICAgICAgICAgICAgY29uc3Qgc3RhdGljU2lkZSA9IHtcbiAgICAgICAgICAgICAgdG9wOiBcImJvdHRvbVwiLFxuICAgICAgICAgICAgICByaWdodDogXCJsZWZ0XCIsXG4gICAgICAgICAgICAgIGJvdHRvbTogXCJ0b3BcIixcbiAgICAgICAgICAgICAgbGVmdDogXCJyaWdodFwiXG4gICAgICAgICAgICB9W3BsYWNlbWVudC5zcGxpdChcIi1cIilbMF1dO1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihhRWwuc3R5bGUsIHtcbiAgICAgICAgICAgICAgbGVmdDogYXggIT0gbnVsbCA/IGAke2F4fXB4YCA6IFwiXCIsXG4gICAgICAgICAgICAgIHRvcDogYXkgIT0gbnVsbCA/IGAke2F5fXB4YCA6IFwiXCIsXG4gICAgICAgICAgICAgIHJpZ2h0OiBcIlwiLFxuICAgICAgICAgICAgICBib3R0b206IFwiXCIsXG4gICAgICAgICAgICAgIFtzdGF0aWNTaWRlXTogXCItNHB4XCJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobWlkZGxld2FyZURhdGEuaGlkZSkge1xuICAgICAgICAgICAgY29uc3QgeyByZWZlcmVuY2VIaWRkZW4gfSA9IG1pZGRsZXdhcmVEYXRhLmhpZGU7XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKHBhbmVsLnN0eWxlLCB7XG4gICAgICAgICAgICAgIHZpc2liaWxpdHk6IHJlZmVyZW5jZUhpZGRlbiA/IFwiaGlkZGVuXCIgOiBcInZpc2libGVcIlxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIE9iamVjdC5hc3NpZ24ocGFuZWwuc3R5bGUsIHtcbiAgICAgICAgICAgIGxlZnQ6IGAke3h9cHhgLFxuICAgICAgICAgICAgdG9wOiBgJHt5fXB4YFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zLmRpc21pc3NhYmxlKSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgaWYgKCFjb21wb25lbnQuY29udGFpbnMoZXZlbnQudGFyZ2V0KSAmJiBpc0Zsb2F0aW5nKCkpIHtcbiAgICAgICAgICAgIHRvZ2dsZVBhbmVsKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICAgXCJrZXlkb3duXCIsXG4gICAgICAgICAgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVzY2FwZVwiICYmIGlzRmxvYXRpbmcoKSkge1xuICAgICAgICAgICAgICB0b2dnbGVQYW5lbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgdG9nZ2xlUGFuZWwoKTtcbiAgICB9O1xuICB9KTtcbiAgQWxwaW5lLmRpcmVjdGl2ZShcImZsb2F0XCIsIChwYW5lbCwgeyBtb2RpZmllcnMsIGV4cHJlc3Npb24gfSwgeyBldmFsdWF0ZSwgZWZmZWN0IH0pID0+IHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IGV4cHJlc3Npb24gPyBldmFsdWF0ZShleHByZXNzaW9uKSA6IHt9O1xuICAgIGNvbnN0IGNvbmZpZyA9IG1vZGlmaWVycy5sZW5ndGggPiAwID8gYnVpbGREaXJlY3RpdmVDb25maWdGcm9tTW9kaWZpZXJzKG1vZGlmaWVycywgc2V0dGluZ3MpIDoge307XG4gICAgbGV0IGNsZWFudXAgPSBudWxsO1xuICAgIGlmIChjb25maWcuZmxvYXQuc3RyYXRlZ3kgPT0gXCJmaXhlZFwiKSB7XG4gICAgICBwYW5lbC5zdHlsZS5wb3NpdGlvbiA9IFwiZml4ZWRcIjtcbiAgICB9XG4gICAgY29uc3QgY2xpY2tBd2F5ID0gKGV2ZW50KSA9PiBwYW5lbC5wYXJlbnRFbGVtZW50ICYmICFwYW5lbC5wYXJlbnRFbGVtZW50LmNsb3Nlc3QoXCJbeC1kYXRhXVwiKS5jb250YWlucyhldmVudC50YXJnZXQpID8gcGFuZWwuY2xvc2UoKSA6IG51bGw7XG4gICAgY29uc3Qga2V5RXNjYXBlID0gKGV2ZW50KSA9PiBldmVudC5rZXkgPT09IFwiRXNjYXBlXCIgPyBwYW5lbC5jbG9zZSgpIDogbnVsbDtcbiAgICBjb25zdCByZWZOYW1lID0gcGFuZWwuZ2V0QXR0cmlidXRlKFwieC1yZWZcIik7XG4gICAgY29uc3QgY29tcG9uZW50ID0gcGFuZWwucGFyZW50RWxlbWVudC5jbG9zZXN0KFwiW3gtZGF0YV1cIik7XG4gICAgY29uc3QgYXRUcmlnZ2VyID0gY29tcG9uZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYFtcXFxcQGNsaWNrXj1cIiRyZWZzLiR7cmVmTmFtZX1cIl1gKTtcbiAgICBjb25zdCB4VHJpZ2dlciA9IGNvbXBvbmVudC5xdWVyeVNlbGVjdG9yQWxsKGBbeC1vblxcXFw6Y2xpY2tePVwiJHJlZnMuJHtyZWZOYW1lfVwiXWApO1xuICAgIHBhbmVsLnN0eWxlLnNldFByb3BlcnR5KFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgc2V0dXBBMTF5KGNvbXBvbmVudCwgWy4uLmF0VHJpZ2dlciwgLi4ueFRyaWdnZXJdWzBdLCBwYW5lbCk7XG4gICAgcGFuZWwuX3hfaXNTaG93biA9IGZhbHNlO1xuICAgIHBhbmVsLnRyaWdnZXIgPSBudWxsO1xuICAgIGlmICghcGFuZWwuX3hfZG9IaWRlKVxuICAgICAgcGFuZWwuX3hfZG9IaWRlID0gKCkgPT4ge1xuICAgICAgICBtdXRhdGVEb20oKCkgPT4ge1xuICAgICAgICAgIHBhbmVsLnN0eWxlLnNldFByb3BlcnR5KFwiZGlzcGxheVwiLCBcIm5vbmVcIiwgbW9kaWZpZXJzLmluY2x1ZGVzKFwiaW1wb3J0YW50XCIpID8gXCJpbXBvcnRhbnRcIiA6IHZvaWQgMCk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICBpZiAoIXBhbmVsLl94X2RvU2hvdylcbiAgICAgIHBhbmVsLl94X2RvU2hvdyA9ICgpID0+IHtcbiAgICAgICAgbXV0YXRlRG9tKCgpID0+IHtcbiAgICAgICAgICBwYW5lbC5zdHlsZS5zZXRQcm9wZXJ0eShcImRpc3BsYXlcIiwgXCJibG9ja1wiLCBtb2RpZmllcnMuaW5jbHVkZXMoXCJpbXBvcnRhbnRcIikgPyBcImltcG9ydGFudFwiIDogdm9pZCAwKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIGxldCBoaWRlMiA9ICgpID0+IHtcbiAgICAgIHBhbmVsLl94X2RvSGlkZSgpO1xuICAgICAgcGFuZWwuX3hfaXNTaG93biA9IGZhbHNlO1xuICAgIH07XG4gICAgbGV0IHNob3cgPSAoKSA9PiB7XG4gICAgICBwYW5lbC5feF9kb1Nob3coKTtcbiAgICAgIHBhbmVsLl94X2lzU2hvd24gPSB0cnVlO1xuICAgIH07XG4gICAgbGV0IGNsaWNrQXdheUNvbXBhdGlibGVTaG93ID0gKCkgPT4gc2V0VGltZW91dChzaG93KTtcbiAgICBsZXQgdG9nZ2xlID0gb25jZShcbiAgICAgICh2YWx1ZSkgPT4gdmFsdWUgPyBzaG93KCkgOiBoaWRlMigpLFxuICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgcGFuZWwuX3hfdG9nZ2xlQW5kQ2FzY2FkZVdpdGhUcmFuc2l0aW9ucyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgcGFuZWwuX3hfdG9nZ2xlQW5kQ2FzY2FkZVdpdGhUcmFuc2l0aW9ucyhwYW5lbCwgdmFsdWUsIHNob3csIGhpZGUyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWx1ZSA/IGNsaWNrQXdheUNvbXBhdGlibGVTaG93KCkgOiBoaWRlMigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICBsZXQgb2xkVmFsdWU7XG4gICAgbGV0IGZpcnN0VGltZSA9IHRydWU7XG4gICAgZWZmZWN0KFxuICAgICAgKCkgPT4gZXZhbHVhdGUoKHZhbHVlKSA9PiB7XG4gICAgICAgIGlmICghZmlyc3RUaW1lICYmIHZhbHVlID09PSBvbGRWYWx1ZSlcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmIChtb2RpZmllcnMuaW5jbHVkZXMoXCJpbW1lZGlhdGVcIikpXG4gICAgICAgICAgdmFsdWUgPyBjbGlja0F3YXlDb21wYXRpYmxlU2hvdygpIDogaGlkZTIoKTtcbiAgICAgICAgdG9nZ2xlKHZhbHVlKTtcbiAgICAgICAgb2xkVmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgZmlyc3RUaW1lID0gZmFsc2U7XG4gICAgICB9KVxuICAgICk7XG4gICAgcGFuZWwub3BlbiA9IGFzeW5jIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBwYW5lbC50cmlnZ2VyID0gZXZlbnQuY3VycmVudFRhcmdldCA/IGV2ZW50LmN1cnJlbnRUYXJnZXQgOiBldmVudDtcbiAgICAgIHRvZ2dsZSh0cnVlKTtcbiAgICAgIHBhbmVsLnRyaWdnZXIuc2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiLCB0cnVlKTtcbiAgICAgIGlmIChjb25maWcuY29tcG9uZW50LnRyYXApXG4gICAgICAgIHBhbmVsLnNldEF0dHJpYnV0ZShcIngtdHJhcFwiLCB0cnVlKTtcbiAgICAgIGNsZWFudXAgPSBhdXRvVXBkYXRlKHBhbmVsLnRyaWdnZXIsIHBhbmVsLCAoKSA9PiB7XG4gICAgICAgIGNvbXB1dGVQb3NpdGlvbjIocGFuZWwudHJpZ2dlciwgcGFuZWwsIGNvbmZpZy5mbG9hdCkudGhlbigoeyBtaWRkbGV3YXJlRGF0YSwgcGxhY2VtZW50LCB4LCB5IH0pID0+IHtcbiAgICAgICAgICBpZiAobWlkZGxld2FyZURhdGEuYXJyb3cpIHtcbiAgICAgICAgICAgIGNvbnN0IGF4ID0gbWlkZGxld2FyZURhdGEuYXJyb3c/Lng7XG4gICAgICAgICAgICBjb25zdCBheSA9IG1pZGRsZXdhcmVEYXRhLmFycm93Py55O1xuICAgICAgICAgICAgY29uc3QgYUVsID0gY29uZmlnLmZsb2F0Lm1pZGRsZXdhcmUuZmlsdGVyKChtaWRkbGV3YXJlKSA9PiBtaWRkbGV3YXJlLm5hbWUgPT0gXCJhcnJvd1wiKVswXS5vcHRpb25zLmVsZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCBzdGF0aWNTaWRlID0ge1xuICAgICAgICAgICAgICB0b3A6IFwiYm90dG9tXCIsXG4gICAgICAgICAgICAgIHJpZ2h0OiBcImxlZnRcIixcbiAgICAgICAgICAgICAgYm90dG9tOiBcInRvcFwiLFxuICAgICAgICAgICAgICBsZWZ0OiBcInJpZ2h0XCJcbiAgICAgICAgICAgIH1bcGxhY2VtZW50LnNwbGl0KFwiLVwiKVswXV07XG4gICAgICAgICAgICBPYmplY3QuYXNzaWduKGFFbC5zdHlsZSwge1xuICAgICAgICAgICAgICBsZWZ0OiBheCAhPSBudWxsID8gYCR7YXh9cHhgIDogXCJcIixcbiAgICAgICAgICAgICAgdG9wOiBheSAhPSBudWxsID8gYCR7YXl9cHhgIDogXCJcIixcbiAgICAgICAgICAgICAgcmlnaHQ6IFwiXCIsXG4gICAgICAgICAgICAgIGJvdHRvbTogXCJcIixcbiAgICAgICAgICAgICAgW3N0YXRpY1NpZGVdOiBcIi00cHhcIlxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChtaWRkbGV3YXJlRGF0YS5oaWRlKSB7XG4gICAgICAgICAgICBjb25zdCB7IHJlZmVyZW5jZUhpZGRlbiB9ID0gbWlkZGxld2FyZURhdGEuaGlkZTtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24ocGFuZWwuc3R5bGUsIHtcbiAgICAgICAgICAgICAgdmlzaWJpbGl0eTogcmVmZXJlbmNlSGlkZGVuID8gXCJoaWRkZW5cIiA6IFwidmlzaWJsZVwiXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgT2JqZWN0LmFzc2lnbihwYW5lbC5zdHlsZSwge1xuICAgICAgICAgICAgbGVmdDogYCR7eH1weGAsXG4gICAgICAgICAgICB0b3A6IGAke3l9cHhgXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNsaWNrQXdheSk7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwga2V5RXNjYXBlLCB0cnVlKTtcbiAgICB9O1xuICAgIHBhbmVsLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgICB0b2dnbGUoZmFsc2UpO1xuICAgICAgcGFuZWwudHJpZ2dlci5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsIGZhbHNlKTtcbiAgICAgIGlmIChjb25maWcuY29tcG9uZW50LnRyYXApXG4gICAgICAgIHBhbmVsLnNldEF0dHJpYnV0ZShcIngtdHJhcFwiLCBmYWxzZSk7XG4gICAgICBjbGVhbnVwKCk7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNsaWNrQXdheSk7XG4gICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwga2V5RXNjYXBlLCBmYWxzZSk7XG4gICAgfTtcbiAgICBwYW5lbC50b2dnbGUgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgcGFuZWwuX3hfaXNTaG93biA/IHBhbmVsLmNsb3NlKCkgOiBwYW5lbC5vcGVuKGV2ZW50KTtcbiAgICB9O1xuICB9KTtcbn1cblxuLy8gYnVpbGRzL21vZHVsZS5qc1xudmFyIG1vZHVsZV9kZWZhdWx0ID0gc3JjX2RlZmF1bHQ7XG5leHBvcnQge1xuICBtb2R1bGVfZGVmYXVsdCBhcyBkZWZhdWx0XG59O1xuIiwgIi8vIHNyYy9jb3JlL2FscGluZS1sYXp5LWxvYWQtYXNzZXRzLmpzXG5mdW5jdGlvbiBhbHBpbmVfbGF6eV9sb2FkX2Fzc2V0c19kZWZhdWx0KEFscGluZSkge1xuICBBbHBpbmUuc3RvcmUoXCJsYXp5TG9hZGVkQXNzZXRzXCIsIHtcbiAgICBsb2FkZWQ6IG5ldyBTZXQoKSxcbiAgICBjaGVjayhwYXRocykge1xuICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkocGF0aHMpID8gcGF0aHMuZXZlcnkoKHBhdGgpID0+IHRoaXMubG9hZGVkLmhhcyhwYXRoKSkgOiB0aGlzLmxvYWRlZC5oYXMocGF0aHMpO1xuICAgIH0sXG4gICAgbWFya0xvYWRlZChwYXRocykge1xuICAgICAgQXJyYXkuaXNBcnJheShwYXRocykgPyBwYXRocy5mb3JFYWNoKChwYXRoKSA9PiB0aGlzLmxvYWRlZC5hZGQocGF0aCkpIDogdGhpcy5sb2FkZWQuYWRkKHBhdGhzKTtcbiAgICB9XG4gIH0pO1xuICBmdW5jdGlvbiBhc3NldExvYWRlZEV2ZW50KGV2ZW50TmFtZSkge1xuICAgIHJldHVybiBuZXcgQ3VzdG9tRXZlbnQoZXZlbnROYW1lLCB7XG4gICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgY29tcG9zZWQ6IHRydWUsXG4gICAgICBjYW5jZWxhYmxlOiB0cnVlXG4gICAgfSk7XG4gIH1cbiAgYXN5bmMgZnVuY3Rpb24gbG9hZENTUyhwYXRoLCBtZWRpYUF0dHIpIHtcbiAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgbGlua1tocmVmPVwiJHtwYXRofVwiXWApIHx8IEFscGluZS5zdG9yZShcImxhenlMb2FkZWRBc3NldHNcIikuY2hlY2socGF0aCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaW5rXCIpO1xuICAgIGxpbmsudHlwZSA9IFwidGV4dC9jc3NcIjtcbiAgICBsaW5rLnJlbCA9IFwic3R5bGVzaGVldFwiO1xuICAgIGxpbmsuaHJlZiA9IHBhdGg7XG4gICAgaWYgKG1lZGlhQXR0cikge1xuICAgICAgbGluay5tZWRpYSA9IG1lZGlhQXR0cjtcbiAgICB9XG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmQobGluayk7XG4gICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbGluay5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgIEFscGluZS5zdG9yZShcImxhenlMb2FkZWRBc3NldHNcIikubWFya0xvYWRlZChwYXRoKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfTtcbiAgICAgIGxpbmsub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgRmFpbGVkIHRvIGxvYWQgQ1NTOiAke3BhdGh9YCkpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuICBhc3luYyBmdW5jdGlvbiBsb2FkSlMocGF0aCwgcG9zaXRpb24pIHtcbiAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihgc2NyaXB0W3NyYz1cIiR7cGF0aH1cIl1gKSB8fCBBbHBpbmUuc3RvcmUoXCJsYXp5TG9hZGVkQXNzZXRzXCIpLmNoZWNrKHBhdGgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIik7XG4gICAgc2NyaXB0LnNyYyA9IHBhdGg7XG4gICAgcG9zaXRpb24uaGFzKFwiYm9keS1zdGFydFwiKSA/IGRvY3VtZW50LmJvZHkucHJlcGVuZChzY3JpcHQpIDogZG9jdW1lbnRbcG9zaXRpb24uaGFzKFwiYm9keS1lbmRcIikgPyBcImJvZHlcIiA6IFwiaGVhZFwiXS5hcHBlbmQoc2NyaXB0KTtcbiAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBzY3JpcHQub25sb2FkID0gKCkgPT4ge1xuICAgICAgICBBbHBpbmUuc3RvcmUoXCJsYXp5TG9hZGVkQXNzZXRzXCIpLm1hcmtMb2FkZWQocGF0aCk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH07XG4gICAgICBzY3JpcHQub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgRmFpbGVkIHRvIGxvYWQgSlM6ICR7cGF0aH1gKSk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG4gIEFscGluZS5kaXJlY3RpdmUoXCJsb2FkLWNzc1wiLCAoZWwsIHsgZXhwcmVzc2lvbiB9LCB7IGV2YWx1YXRlIH0pID0+IHtcbiAgICBjb25zdCBwYXRocyA9IGV2YWx1YXRlKGV4cHJlc3Npb24pO1xuICAgIGNvbnN0IG1lZGlhQXR0ciA9IGVsLm1lZGlhO1xuICAgIGNvbnN0IGV2ZW50TmFtZSA9IGVsLmdldEF0dHJpYnV0ZShcImRhdGEtZGlzcGF0Y2hcIik7XG4gICAgUHJvbWlzZS5hbGwocGF0aHMubWFwKChwYXRoKSA9PiBsb2FkQ1NTKHBhdGgsIG1lZGlhQXR0cikpKS50aGVuKCgpID0+IHtcbiAgICAgIGlmIChldmVudE5hbWUpIHtcbiAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQoYXNzZXRMb2FkZWRFdmVudChldmVudE5hbWUgKyBcIi1jc3NcIikpO1xuICAgICAgfVxuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfSk7XG4gIH0pO1xuICBBbHBpbmUuZGlyZWN0aXZlKFwibG9hZC1qc1wiLCAoZWwsIHsgZXhwcmVzc2lvbiwgbW9kaWZpZXJzIH0sIHsgZXZhbHVhdGUgfSkgPT4ge1xuICAgIGNvbnN0IHBhdGhzID0gZXZhbHVhdGUoZXhwcmVzc2lvbik7XG4gICAgY29uc3QgcG9zaXRpb24gPSBuZXcgU2V0KG1vZGlmaWVycyk7XG4gICAgY29uc3QgZXZlbnROYW1lID0gZWwuZ2V0QXR0cmlidXRlKFwiZGF0YS1kaXNwYXRjaFwiKTtcbiAgICBQcm9taXNlLmFsbChwYXRocy5tYXAoKHBhdGgpID0+IGxvYWRKUyhwYXRoLCBwb3NpdGlvbikpKS50aGVuKCgpID0+IHtcbiAgICAgIGlmIChldmVudE5hbWUpIHtcbiAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQoYXNzZXRMb2FkZWRFdmVudChldmVudE5hbWUgKyBcIi1qc1wiKSk7XG4gICAgICB9XG4gICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbi8vIHNyYy9tb2R1bGUuanNcbnZhciBtb2R1bGVfZGVmYXVsdCA9IGFscGluZV9sYXp5X2xvYWRfYXNzZXRzX2RlZmF1bHQ7XG5leHBvcnQge1xuICBtb2R1bGVfZGVmYXVsdCBhcyBkZWZhdWx0XG59O1xuIiwgIi8qKiFcbiAqIFNvcnRhYmxlIDEuMTUuMVxuICogQGF1dGhvclx0UnViYVhhICAgPHRyYXNoQHJ1YmF4YS5vcmc+XG4gKiBAYXV0aG9yXHRvd2VubSAgICA8b3dlbjIzMzU1QGdtYWlsLmNvbT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5mdW5jdGlvbiBvd25LZXlzKG9iamVjdCwgZW51bWVyYWJsZU9ubHkpIHtcbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmplY3QpO1xuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHZhciBzeW1ib2xzID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhvYmplY3QpO1xuICAgIGlmIChlbnVtZXJhYmxlT25seSkge1xuICAgICAgc3ltYm9scyA9IHN5bWJvbHMuZmlsdGVyKGZ1bmN0aW9uIChzeW0pIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBzeW0pLmVudW1lcmFibGU7XG4gICAgICB9KTtcbiAgICB9XG4gICAga2V5cy5wdXNoLmFwcGx5KGtleXMsIHN5bWJvbHMpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufVxuZnVuY3Rpb24gX29iamVjdFNwcmVhZDIodGFyZ2V0KSB7XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXSAhPSBudWxsID8gYXJndW1lbnRzW2ldIDoge307XG4gICAgaWYgKGkgJSAyKSB7XG4gICAgICBvd25LZXlzKE9iamVjdChzb3VyY2UpLCB0cnVlKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgX2RlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCBzb3VyY2Vba2V5XSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKHNvdXJjZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvd25LZXlzKE9iamVjdChzb3VyY2UpKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHNvdXJjZSwga2V5KSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRhcmdldDtcbn1cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7XG4gIFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjtcblxuICBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHtcbiAgICBfdHlwZW9mID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBvYmo7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBfdHlwZW9mID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gX3R5cGVvZihvYmopO1xufVxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnR5KG9iaiwga2V5LCB2YWx1ZSkge1xuICBpZiAoa2V5IGluIG9iaikge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwge1xuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgb2JqW2tleV0gPSB2YWx1ZTtcbiAgfVxuICByZXR1cm4gb2JqO1xufVxuZnVuY3Rpb24gX2V4dGVuZHMoKSB7XG4gIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07XG4gICAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7XG4gICAgICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0O1xuICB9O1xuICByZXR1cm4gX2V4dGVuZHMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cbmZ1bmN0aW9uIF9vYmplY3RXaXRob3V0UHJvcGVydGllc0xvb3NlKHNvdXJjZSwgZXhjbHVkZWQpIHtcbiAgaWYgKHNvdXJjZSA9PSBudWxsKSByZXR1cm4ge307XG4gIHZhciB0YXJnZXQgPSB7fTtcbiAgdmFyIHNvdXJjZUtleXMgPSBPYmplY3Qua2V5cyhzb3VyY2UpO1xuICB2YXIga2V5LCBpO1xuICBmb3IgKGkgPSAwOyBpIDwgc291cmNlS2V5cy5sZW5ndGg7IGkrKykge1xuICAgIGtleSA9IHNvdXJjZUtleXNbaV07XG4gICAgaWYgKGV4Y2x1ZGVkLmluZGV4T2Yoa2V5KSA+PSAwKSBjb250aW51ZTtcbiAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldO1xuICB9XG4gIHJldHVybiB0YXJnZXQ7XG59XG5mdW5jdGlvbiBfb2JqZWN0V2l0aG91dFByb3BlcnRpZXMoc291cmNlLCBleGNsdWRlZCkge1xuICBpZiAoc291cmNlID09IG51bGwpIHJldHVybiB7fTtcbiAgdmFyIHRhcmdldCA9IF9vYmplY3RXaXRob3V0UHJvcGVydGllc0xvb3NlKHNvdXJjZSwgZXhjbHVkZWQpO1xuICB2YXIga2V5LCBpO1xuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHZhciBzb3VyY2VTeW1ib2xLZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzb3VyY2UpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBzb3VyY2VTeW1ib2xLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBrZXkgPSBzb3VyY2VTeW1ib2xLZXlzW2ldO1xuICAgICAgaWYgKGV4Y2x1ZGVkLmluZGV4T2Yoa2V5KSA+PSAwKSBjb250aW51ZTtcbiAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHNvdXJjZSwga2V5KSkgY29udGludWU7XG4gICAgICB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGFyZ2V0O1xufVxuZnVuY3Rpb24gX3RvQ29uc3VtYWJsZUFycmF5KGFycikge1xuICByZXR1cm4gX2FycmF5V2l0aG91dEhvbGVzKGFycikgfHwgX2l0ZXJhYmxlVG9BcnJheShhcnIpIHx8IF91bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheShhcnIpIHx8IF9ub25JdGVyYWJsZVNwcmVhZCgpO1xufVxuZnVuY3Rpb24gX2FycmF5V2l0aG91dEhvbGVzKGFycikge1xuICBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSByZXR1cm4gX2FycmF5TGlrZVRvQXJyYXkoYXJyKTtcbn1cbmZ1bmN0aW9uIF9pdGVyYWJsZVRvQXJyYXkoaXRlcikge1xuICBpZiAodHlwZW9mIFN5bWJvbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBpdGVyW1N5bWJvbC5pdGVyYXRvcl0gIT0gbnVsbCB8fCBpdGVyW1wiQEBpdGVyYXRvclwiXSAhPSBudWxsKSByZXR1cm4gQXJyYXkuZnJvbShpdGVyKTtcbn1cbmZ1bmN0aW9uIF91bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheShvLCBtaW5MZW4pIHtcbiAgaWYgKCFvKSByZXR1cm47XG4gIGlmICh0eXBlb2YgbyA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIF9hcnJheUxpa2VUb0FycmF5KG8sIG1pbkxlbik7XG4gIHZhciBuID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pLnNsaWNlKDgsIC0xKTtcbiAgaWYgKG4gPT09IFwiT2JqZWN0XCIgJiYgby5jb25zdHJ1Y3RvcikgbiA9IG8uY29uc3RydWN0b3IubmFtZTtcbiAgaWYgKG4gPT09IFwiTWFwXCIgfHwgbiA9PT0gXCJTZXRcIikgcmV0dXJuIEFycmF5LmZyb20obyk7XG4gIGlmIChuID09PSBcIkFyZ3VtZW50c1wiIHx8IC9eKD86VWl8SSludCg/Ojh8MTZ8MzIpKD86Q2xhbXBlZCk/QXJyYXkkLy50ZXN0KG4pKSByZXR1cm4gX2FycmF5TGlrZVRvQXJyYXkobywgbWluTGVuKTtcbn1cbmZ1bmN0aW9uIF9hcnJheUxpa2VUb0FycmF5KGFyciwgbGVuKSB7XG4gIGlmIChsZW4gPT0gbnVsbCB8fCBsZW4gPiBhcnIubGVuZ3RoKSBsZW4gPSBhcnIubGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMCwgYXJyMiA9IG5ldyBBcnJheShsZW4pOyBpIDwgbGVuOyBpKyspIGFycjJbaV0gPSBhcnJbaV07XG4gIHJldHVybiBhcnIyO1xufVxuZnVuY3Rpb24gX25vbkl0ZXJhYmxlU3ByZWFkKCkge1xuICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBhdHRlbXB0IHRvIHNwcmVhZCBub24taXRlcmFibGUgaW5zdGFuY2UuXFxuSW4gb3JkZXIgdG8gYmUgaXRlcmFibGUsIG5vbi1hcnJheSBvYmplY3RzIG11c3QgaGF2ZSBhIFtTeW1ib2wuaXRlcmF0b3JdKCkgbWV0aG9kLlwiKTtcbn1cblxudmFyIHZlcnNpb24gPSBcIjEuMTUuMVwiO1xuXG5mdW5jdGlvbiB1c2VyQWdlbnQocGF0dGVybikge1xuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lm5hdmlnYXRvcikge1xuICAgIHJldHVybiAhISAvKkBfX1BVUkVfXyovbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaChwYXR0ZXJuKTtcbiAgfVxufVxudmFyIElFMTFPckxlc3MgPSB1c2VyQWdlbnQoLyg/OlRyaWRlbnQuKnJ2WyA6XT8xMVxcLnxtc2llfGllbW9iaWxlfFdpbmRvd3MgUGhvbmUpL2kpO1xudmFyIEVkZ2UgPSB1c2VyQWdlbnQoL0VkZ2UvaSk7XG52YXIgRmlyZUZveCA9IHVzZXJBZ2VudCgvZmlyZWZveC9pKTtcbnZhciBTYWZhcmkgPSB1c2VyQWdlbnQoL3NhZmFyaS9pKSAmJiAhdXNlckFnZW50KC9jaHJvbWUvaSkgJiYgIXVzZXJBZ2VudCgvYW5kcm9pZC9pKTtcbnZhciBJT1MgPSB1c2VyQWdlbnQoL2lQKGFkfG9kfGhvbmUpL2kpO1xudmFyIENocm9tZUZvckFuZHJvaWQgPSB1c2VyQWdlbnQoL2Nocm9tZS9pKSAmJiB1c2VyQWdlbnQoL2FuZHJvaWQvaSk7XG5cbnZhciBjYXB0dXJlTW9kZSA9IHtcbiAgY2FwdHVyZTogZmFsc2UsXG4gIHBhc3NpdmU6IGZhbHNlXG59O1xuZnVuY3Rpb24gb24oZWwsIGV2ZW50LCBmbikge1xuICBlbC5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBmbiwgIUlFMTFPckxlc3MgJiYgY2FwdHVyZU1vZGUpO1xufVxuZnVuY3Rpb24gb2ZmKGVsLCBldmVudCwgZm4pIHtcbiAgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgZm4sICFJRTExT3JMZXNzICYmIGNhcHR1cmVNb2RlKTtcbn1cbmZ1bmN0aW9uIG1hdGNoZXMoIC8qKkhUTUxFbGVtZW50Ki9lbCwgLyoqU3RyaW5nKi9zZWxlY3Rvcikge1xuICBpZiAoIXNlbGVjdG9yKSByZXR1cm47XG4gIHNlbGVjdG9yWzBdID09PSAnPicgJiYgKHNlbGVjdG9yID0gc2VsZWN0b3Iuc3Vic3RyaW5nKDEpKTtcbiAgaWYgKGVsKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChlbC5tYXRjaGVzKSB7XG4gICAgICAgIHJldHVybiBlbC5tYXRjaGVzKHNlbGVjdG9yKTtcbiAgICAgIH0gZWxzZSBpZiAoZWwubXNNYXRjaGVzU2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGVsLm1zTWF0Y2hlc1NlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgIH0gZWxzZSBpZiAoZWwud2Via2l0TWF0Y2hlc1NlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBlbC53ZWJraXRNYXRjaGVzU2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gZ2V0UGFyZW50T3JIb3N0KGVsKSB7XG4gIHJldHVybiBlbC5ob3N0ICYmIGVsICE9PSBkb2N1bWVudCAmJiBlbC5ob3N0Lm5vZGVUeXBlID8gZWwuaG9zdCA6IGVsLnBhcmVudE5vZGU7XG59XG5mdW5jdGlvbiBjbG9zZXN0KCAvKipIVE1MRWxlbWVudCovZWwsIC8qKlN0cmluZyovc2VsZWN0b3IsIC8qKkhUTUxFbGVtZW50Ki9jdHgsIGluY2x1ZGVDVFgpIHtcbiAgaWYgKGVsKSB7XG4gICAgY3R4ID0gY3R4IHx8IGRvY3VtZW50O1xuICAgIGRvIHtcbiAgICAgIGlmIChzZWxlY3RvciAhPSBudWxsICYmIChzZWxlY3RvclswXSA9PT0gJz4nID8gZWwucGFyZW50Tm9kZSA9PT0gY3R4ICYmIG1hdGNoZXMoZWwsIHNlbGVjdG9yKSA6IG1hdGNoZXMoZWwsIHNlbGVjdG9yKSkgfHwgaW5jbHVkZUNUWCAmJiBlbCA9PT0gY3R4KSB7XG4gICAgICAgIHJldHVybiBlbDtcbiAgICAgIH1cbiAgICAgIGlmIChlbCA9PT0gY3R4KSBicmVhaztcbiAgICAgIC8qIGpzaGludCBib3NzOnRydWUgKi9cbiAgICB9IHdoaWxlIChlbCA9IGdldFBhcmVudE9ySG9zdChlbCkpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxudmFyIFJfU1BBQ0UgPSAvXFxzKy9nO1xuZnVuY3Rpb24gdG9nZ2xlQ2xhc3MoZWwsIG5hbWUsIHN0YXRlKSB7XG4gIGlmIChlbCAmJiBuYW1lKSB7XG4gICAgaWYgKGVsLmNsYXNzTGlzdCkge1xuICAgICAgZWwuY2xhc3NMaXN0W3N0YXRlID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBjbGFzc05hbWUgPSAoJyAnICsgZWwuY2xhc3NOYW1lICsgJyAnKS5yZXBsYWNlKFJfU1BBQ0UsICcgJykucmVwbGFjZSgnICcgKyBuYW1lICsgJyAnLCAnICcpO1xuICAgICAgZWwuY2xhc3NOYW1lID0gKGNsYXNzTmFtZSArIChzdGF0ZSA/ICcgJyArIG5hbWUgOiAnJykpLnJlcGxhY2UoUl9TUEFDRSwgJyAnKTtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIGNzcyhlbCwgcHJvcCwgdmFsKSB7XG4gIHZhciBzdHlsZSA9IGVsICYmIGVsLnN0eWxlO1xuICBpZiAoc3R5bGUpIHtcbiAgICBpZiAodmFsID09PSB2b2lkIDApIHtcbiAgICAgIGlmIChkb2N1bWVudC5kZWZhdWx0VmlldyAmJiBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKSB7XG4gICAgICAgIHZhbCA9IGRvY3VtZW50LmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoZWwsICcnKTtcbiAgICAgIH0gZWxzZSBpZiAoZWwuY3VycmVudFN0eWxlKSB7XG4gICAgICAgIHZhbCA9IGVsLmN1cnJlbnRTdHlsZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcm9wID09PSB2b2lkIDAgPyB2YWwgOiB2YWxbcHJvcF07XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghKHByb3AgaW4gc3R5bGUpICYmIHByb3AuaW5kZXhPZignd2Via2l0JykgPT09IC0xKSB7XG4gICAgICAgIHByb3AgPSAnLXdlYmtpdC0nICsgcHJvcDtcbiAgICAgIH1cbiAgICAgIHN0eWxlW3Byb3BdID0gdmFsICsgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnID8gJycgOiAncHgnKTtcbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIG1hdHJpeChlbCwgc2VsZk9ubHkpIHtcbiAgdmFyIGFwcGxpZWRUcmFuc2Zvcm1zID0gJyc7XG4gIGlmICh0eXBlb2YgZWwgPT09ICdzdHJpbmcnKSB7XG4gICAgYXBwbGllZFRyYW5zZm9ybXMgPSBlbDtcbiAgfSBlbHNlIHtcbiAgICBkbyB7XG4gICAgICB2YXIgdHJhbnNmb3JtID0gY3NzKGVsLCAndHJhbnNmb3JtJyk7XG4gICAgICBpZiAodHJhbnNmb3JtICYmIHRyYW5zZm9ybSAhPT0gJ25vbmUnKSB7XG4gICAgICAgIGFwcGxpZWRUcmFuc2Zvcm1zID0gdHJhbnNmb3JtICsgJyAnICsgYXBwbGllZFRyYW5zZm9ybXM7XG4gICAgICB9XG4gICAgICAvKiBqc2hpbnQgYm9zczp0cnVlICovXG4gICAgfSB3aGlsZSAoIXNlbGZPbmx5ICYmIChlbCA9IGVsLnBhcmVudE5vZGUpKTtcbiAgfVxuICB2YXIgbWF0cml4Rm4gPSB3aW5kb3cuRE9NTWF0cml4IHx8IHdpbmRvdy5XZWJLaXRDU1NNYXRyaXggfHwgd2luZG93LkNTU01hdHJpeCB8fCB3aW5kb3cuTVNDU1NNYXRyaXg7XG4gIC8qanNoaW50IC1XMDU2ICovXG4gIHJldHVybiBtYXRyaXhGbiAmJiBuZXcgbWF0cml4Rm4oYXBwbGllZFRyYW5zZm9ybXMpO1xufVxuZnVuY3Rpb24gZmluZChjdHgsIHRhZ05hbWUsIGl0ZXJhdG9yKSB7XG4gIGlmIChjdHgpIHtcbiAgICB2YXIgbGlzdCA9IGN0eC5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lKSxcbiAgICAgIGkgPSAwLFxuICAgICAgbiA9IGxpc3QubGVuZ3RoO1xuICAgIGlmIChpdGVyYXRvcikge1xuICAgICAgZm9yICg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgaXRlcmF0b3IobGlzdFtpXSwgaSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBsaXN0O1xuICB9XG4gIHJldHVybiBbXTtcbn1cbmZ1bmN0aW9uIGdldFdpbmRvd1Njcm9sbGluZ0VsZW1lbnQoKSB7XG4gIHZhciBzY3JvbGxpbmdFbGVtZW50ID0gZG9jdW1lbnQuc2Nyb2xsaW5nRWxlbWVudDtcbiAgaWYgKHNjcm9sbGluZ0VsZW1lbnQpIHtcbiAgICByZXR1cm4gc2Nyb2xsaW5nRWxlbWVudDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuICB9XG59XG5cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBcImJvdW5kaW5nIGNsaWVudCByZWN0XCIgb2YgZ2l2ZW4gZWxlbWVudFxyXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWwgICAgICAgICAgICAgICAgICAgICAgIFRoZSBlbGVtZW50IHdob3NlIGJvdW5kaW5nQ2xpZW50UmVjdCBpcyB3YW50ZWRcclxuICogQHBhcmFtICB7W0Jvb2xlYW5dfSByZWxhdGl2ZVRvQ29udGFpbmluZ0Jsb2NrICBXaGV0aGVyIHRoZSByZWN0IHNob3VsZCBiZSByZWxhdGl2ZSB0byB0aGUgY29udGFpbmluZyBibG9jayBvZiAoaW5jbHVkaW5nKSB0aGUgY29udGFpbmVyXHJcbiAqIEBwYXJhbSAge1tCb29sZWFuXX0gcmVsYXRpdmVUb05vblN0YXRpY1BhcmVudCAgV2hldGhlciB0aGUgcmVjdCBzaG91bGQgYmUgcmVsYXRpdmUgdG8gdGhlIHJlbGF0aXZlIHBhcmVudCBvZiAoaW5jbHVkaW5nKSB0aGUgY29udGFpZW5yXHJcbiAqIEBwYXJhbSAge1tCb29sZWFuXX0gdW5kb1NjYWxlICAgICAgICAgICAgICAgICAgV2hldGhlciB0aGUgY29udGFpbmVyJ3Mgc2NhbGUoKSBzaG91bGQgYmUgdW5kb25lXHJcbiAqIEBwYXJhbSAge1tIVE1MRWxlbWVudF19IGNvbnRhaW5lciAgICAgICAgICAgICAgVGhlIHBhcmVudCB0aGUgZWxlbWVudCB3aWxsIGJlIHBsYWNlZCBpblxyXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBib3VuZGluZ0NsaWVudFJlY3Qgb2YgZWwsIHdpdGggc3BlY2lmaWVkIGFkanVzdG1lbnRzXHJcbiAqL1xuZnVuY3Rpb24gZ2V0UmVjdChlbCwgcmVsYXRpdmVUb0NvbnRhaW5pbmdCbG9jaywgcmVsYXRpdmVUb05vblN0YXRpY1BhcmVudCwgdW5kb1NjYWxlLCBjb250YWluZXIpIHtcbiAgaWYgKCFlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QgJiYgZWwgIT09IHdpbmRvdykgcmV0dXJuO1xuICB2YXIgZWxSZWN0LCB0b3AsIGxlZnQsIGJvdHRvbSwgcmlnaHQsIGhlaWdodCwgd2lkdGg7XG4gIGlmIChlbCAhPT0gd2luZG93ICYmIGVsLnBhcmVudE5vZGUgJiYgZWwgIT09IGdldFdpbmRvd1Njcm9sbGluZ0VsZW1lbnQoKSkge1xuICAgIGVsUmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIHRvcCA9IGVsUmVjdC50b3A7XG4gICAgbGVmdCA9IGVsUmVjdC5sZWZ0O1xuICAgIGJvdHRvbSA9IGVsUmVjdC5ib3R0b207XG4gICAgcmlnaHQgPSBlbFJlY3QucmlnaHQ7XG4gICAgaGVpZ2h0ID0gZWxSZWN0LmhlaWdodDtcbiAgICB3aWR0aCA9IGVsUmVjdC53aWR0aDtcbiAgfSBlbHNlIHtcbiAgICB0b3AgPSAwO1xuICAgIGxlZnQgPSAwO1xuICAgIGJvdHRvbSA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICByaWdodCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICB9XG4gIGlmICgocmVsYXRpdmVUb0NvbnRhaW5pbmdCbG9jayB8fCByZWxhdGl2ZVRvTm9uU3RhdGljUGFyZW50KSAmJiBlbCAhPT0gd2luZG93KSB7XG4gICAgLy8gQWRqdXN0IGZvciB0cmFuc2xhdGUoKVxuICAgIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCBlbC5wYXJlbnROb2RlO1xuXG4gICAgLy8gc29sdmVzICMxMTIzIChzZWU6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8zNzk1MzgwNi82MDg4MzEyKVxuICAgIC8vIE5vdCBuZWVkZWQgb24gPD0gSUUxMVxuICAgIGlmICghSUUxMU9yTGVzcykge1xuICAgICAgZG8ge1xuICAgICAgICBpZiAoY29udGFpbmVyICYmIGNvbnRhaW5lci5nZXRCb3VuZGluZ0NsaWVudFJlY3QgJiYgKGNzcyhjb250YWluZXIsICd0cmFuc2Zvcm0nKSAhPT0gJ25vbmUnIHx8IHJlbGF0aXZlVG9Ob25TdGF0aWNQYXJlbnQgJiYgY3NzKGNvbnRhaW5lciwgJ3Bvc2l0aW9uJykgIT09ICdzdGF0aWMnKSkge1xuICAgICAgICAgIHZhciBjb250YWluZXJSZWN0ID0gY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgICAgICAgLy8gU2V0IHJlbGF0aXZlIHRvIGVkZ2VzIG9mIHBhZGRpbmcgYm94IG9mIGNvbnRhaW5lclxuICAgICAgICAgIHRvcCAtPSBjb250YWluZXJSZWN0LnRvcCArIHBhcnNlSW50KGNzcyhjb250YWluZXIsICdib3JkZXItdG9wLXdpZHRoJykpO1xuICAgICAgICAgIGxlZnQgLT0gY29udGFpbmVyUmVjdC5sZWZ0ICsgcGFyc2VJbnQoY3NzKGNvbnRhaW5lciwgJ2JvcmRlci1sZWZ0LXdpZHRoJykpO1xuICAgICAgICAgIGJvdHRvbSA9IHRvcCArIGVsUmVjdC5oZWlnaHQ7XG4gICAgICAgICAgcmlnaHQgPSBsZWZ0ICsgZWxSZWN0LndpZHRoO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIC8qIGpzaGludCBib3NzOnRydWUgKi9cbiAgICAgIH0gd2hpbGUgKGNvbnRhaW5lciA9IGNvbnRhaW5lci5wYXJlbnROb2RlKTtcbiAgICB9XG4gIH1cbiAgaWYgKHVuZG9TY2FsZSAmJiBlbCAhPT0gd2luZG93KSB7XG4gICAgLy8gQWRqdXN0IGZvciBzY2FsZSgpXG4gICAgdmFyIGVsTWF0cml4ID0gbWF0cml4KGNvbnRhaW5lciB8fCBlbCksXG4gICAgICBzY2FsZVggPSBlbE1hdHJpeCAmJiBlbE1hdHJpeC5hLFxuICAgICAgc2NhbGVZID0gZWxNYXRyaXggJiYgZWxNYXRyaXguZDtcbiAgICBpZiAoZWxNYXRyaXgpIHtcbiAgICAgIHRvcCAvPSBzY2FsZVk7XG4gICAgICBsZWZ0IC89IHNjYWxlWDtcbiAgICAgIHdpZHRoIC89IHNjYWxlWDtcbiAgICAgIGhlaWdodCAvPSBzY2FsZVk7XG4gICAgICBib3R0b20gPSB0b3AgKyBoZWlnaHQ7XG4gICAgICByaWdodCA9IGxlZnQgKyB3aWR0aDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB0b3A6IHRvcCxcbiAgICBsZWZ0OiBsZWZ0LFxuICAgIGJvdHRvbTogYm90dG9tLFxuICAgIHJpZ2h0OiByaWdodCxcbiAgICB3aWR0aDogd2lkdGgsXG4gICAgaGVpZ2h0OiBoZWlnaHRcbiAgfTtcbn1cblxuLyoqXHJcbiAqIFJldHVybnMgdGhlIGNvbnRlbnQgcmVjdCBvZiB0aGUgZWxlbWVudCAoYm91bmRpbmcgcmVjdCBtaW51cyBib3JkZXIgYW5kIHBhZGRpbmcpXHJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsIFxyXG4gKi9cbmZ1bmN0aW9uIGdldENvbnRlbnRSZWN0KGVsKSB7XG4gIHZhciByZWN0ID0gZ2V0UmVjdChlbCk7XG4gIHZhciBwYWRkaW5nTGVmdCA9IHBhcnNlSW50KGNzcyhlbCwgJ3BhZGRpbmctbGVmdCcpKSxcbiAgICBwYWRkaW5nVG9wID0gcGFyc2VJbnQoY3NzKGVsLCAncGFkZGluZy10b3AnKSksXG4gICAgcGFkZGluZ1JpZ2h0ID0gcGFyc2VJbnQoY3NzKGVsLCAncGFkZGluZy1yaWdodCcpKSxcbiAgICBwYWRkaW5nQm90dG9tID0gcGFyc2VJbnQoY3NzKGVsLCAncGFkZGluZy1ib3R0b20nKSk7XG4gIHJlY3QudG9wICs9IHBhZGRpbmdUb3AgKyBwYXJzZUludChjc3MoZWwsICdib3JkZXItdG9wLXdpZHRoJykpO1xuICByZWN0LmxlZnQgKz0gcGFkZGluZ0xlZnQgKyBwYXJzZUludChjc3MoZWwsICdib3JkZXItbGVmdC13aWR0aCcpKTtcbiAgLy8gQ2xpZW50IFdpZHRoL0hlaWdodCBpbmNsdWRlcyBwYWRkaW5nIG9ubHlcbiAgcmVjdC53aWR0aCA9IGVsLmNsaWVudFdpZHRoIC0gcGFkZGluZ0xlZnQgLSBwYWRkaW5nUmlnaHQ7XG4gIHJlY3QuaGVpZ2h0ID0gZWwuY2xpZW50SGVpZ2h0IC0gcGFkZGluZ1RvcCAtIHBhZGRpbmdCb3R0b207XG4gIHJlY3QuYm90dG9tID0gcmVjdC50b3AgKyByZWN0LmhlaWdodDtcbiAgcmVjdC5yaWdodCA9IHJlY3QubGVmdCArIHJlY3Qud2lkdGg7XG4gIHJldHVybiByZWN0O1xufVxuXG4vKipcclxuICogQ2hlY2tzIGlmIGEgc2lkZSBvZiBhbiBlbGVtZW50IGlzIHNjcm9sbGVkIHBhc3QgYSBzaWRlIG9mIGl0cyBwYXJlbnRzXHJcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSAgZWwgICAgICAgICAgIFRoZSBlbGVtZW50IHdobydzIHNpZGUgYmVpbmcgc2Nyb2xsZWQgb3V0IG9mIHZpZXcgaXMgaW4gcXVlc3Rpb25cclxuICogQHBhcmFtICB7U3RyaW5nfSAgICAgICBlbFNpZGUgICAgICAgU2lkZSBvZiB0aGUgZWxlbWVudCBpbiBxdWVzdGlvbiAoJ3RvcCcsICdsZWZ0JywgJ3JpZ2h0JywgJ2JvdHRvbScpXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gICAgICAgcGFyZW50U2lkZSAgIFNpZGUgb2YgdGhlIHBhcmVudCBpbiBxdWVzdGlvbiAoJ3RvcCcsICdsZWZ0JywgJ3JpZ2h0JywgJ2JvdHRvbScpXHJcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50fSAgICAgICAgICAgICAgIFRoZSBwYXJlbnQgc2Nyb2xsIGVsZW1lbnQgdGhhdCB0aGUgZWwncyBzaWRlIGlzIHNjcm9sbGVkIHBhc3QsIG9yIG51bGwgaWYgdGhlcmUgaXMgbm8gc3VjaCBlbGVtZW50XHJcbiAqL1xuZnVuY3Rpb24gaXNTY3JvbGxlZFBhc3QoZWwsIGVsU2lkZSwgcGFyZW50U2lkZSkge1xuICB2YXIgcGFyZW50ID0gZ2V0UGFyZW50QXV0b1Njcm9sbEVsZW1lbnQoZWwsIHRydWUpLFxuICAgIGVsU2lkZVZhbCA9IGdldFJlY3QoZWwpW2VsU2lkZV07XG5cbiAgLyoganNoaW50IGJvc3M6dHJ1ZSAqL1xuICB3aGlsZSAocGFyZW50KSB7XG4gICAgdmFyIHBhcmVudFNpZGVWYWwgPSBnZXRSZWN0KHBhcmVudClbcGFyZW50U2lkZV0sXG4gICAgICB2aXNpYmxlID0gdm9pZCAwO1xuICAgIGlmIChwYXJlbnRTaWRlID09PSAndG9wJyB8fCBwYXJlbnRTaWRlID09PSAnbGVmdCcpIHtcbiAgICAgIHZpc2libGUgPSBlbFNpZGVWYWwgPj0gcGFyZW50U2lkZVZhbDtcbiAgICB9IGVsc2Uge1xuICAgICAgdmlzaWJsZSA9IGVsU2lkZVZhbCA8PSBwYXJlbnRTaWRlVmFsO1xuICAgIH1cbiAgICBpZiAoIXZpc2libGUpIHJldHVybiBwYXJlbnQ7XG4gICAgaWYgKHBhcmVudCA9PT0gZ2V0V2luZG93U2Nyb2xsaW5nRWxlbWVudCgpKSBicmVhaztcbiAgICBwYXJlbnQgPSBnZXRQYXJlbnRBdXRvU2Nyb2xsRWxlbWVudChwYXJlbnQsIGZhbHNlKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxyXG4gKiBHZXRzIG50aCBjaGlsZCBvZiBlbCwgaWdub3JpbmcgaGlkZGVuIGNoaWxkcmVuLCBzb3J0YWJsZSdzIGVsZW1lbnRzIChkb2VzIG5vdCBpZ25vcmUgY2xvbmUgaWYgaXQncyB2aXNpYmxlKVxyXG4gKiBhbmQgbm9uLWRyYWdnYWJsZSBlbGVtZW50c1xyXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWwgICAgICAgVGhlIHBhcmVudCBlbGVtZW50XHJcbiAqIEBwYXJhbSAge051bWJlcn0gY2hpbGROdW0gICAgICBUaGUgaW5kZXggb2YgdGhlIGNoaWxkXHJcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyAgICAgICBQYXJlbnQgU29ydGFibGUncyBvcHRpb25zXHJcbiAqIEByZXR1cm4ge0hUTUxFbGVtZW50fSAgICAgICAgICBUaGUgY2hpbGQgYXQgaW5kZXggY2hpbGROdW0sIG9yIG51bGwgaWYgbm90IGZvdW5kXHJcbiAqL1xuZnVuY3Rpb24gZ2V0Q2hpbGQoZWwsIGNoaWxkTnVtLCBvcHRpb25zLCBpbmNsdWRlRHJhZ0VsKSB7XG4gIHZhciBjdXJyZW50Q2hpbGQgPSAwLFxuICAgIGkgPSAwLFxuICAgIGNoaWxkcmVuID0gZWwuY2hpbGRyZW47XG4gIHdoaWxlIChpIDwgY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgaWYgKGNoaWxkcmVuW2ldLnN0eWxlLmRpc3BsYXkgIT09ICdub25lJyAmJiBjaGlsZHJlbltpXSAhPT0gU29ydGFibGUuZ2hvc3QgJiYgKGluY2x1ZGVEcmFnRWwgfHwgY2hpbGRyZW5baV0gIT09IFNvcnRhYmxlLmRyYWdnZWQpICYmIGNsb3Nlc3QoY2hpbGRyZW5baV0sIG9wdGlvbnMuZHJhZ2dhYmxlLCBlbCwgZmFsc2UpKSB7XG4gICAgICBpZiAoY3VycmVudENoaWxkID09PSBjaGlsZE51bSkge1xuICAgICAgICByZXR1cm4gY2hpbGRyZW5baV07XG4gICAgICB9XG4gICAgICBjdXJyZW50Q2hpbGQrKztcbiAgICB9XG4gICAgaSsrO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcclxuICogR2V0cyB0aGUgbGFzdCBjaGlsZCBpbiB0aGUgZWwsIGlnbm9yaW5nIGdob3N0RWwgb3IgaW52aXNpYmxlIGVsZW1lbnRzIChjbG9uZXMpXHJcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbCAgICAgICBQYXJlbnQgZWxlbWVudFxyXG4gKiBAcGFyYW0gIHtzZWxlY3Rvcn0gc2VsZWN0b3IgICAgQW55IG90aGVyIGVsZW1lbnRzIHRoYXQgc2hvdWxkIGJlIGlnbm9yZWRcclxuICogQHJldHVybiB7SFRNTEVsZW1lbnR9ICAgICAgICAgIFRoZSBsYXN0IGNoaWxkLCBpZ25vcmluZyBnaG9zdEVsXHJcbiAqL1xuZnVuY3Rpb24gbGFzdENoaWxkKGVsLCBzZWxlY3Rvcikge1xuICB2YXIgbGFzdCA9IGVsLmxhc3RFbGVtZW50Q2hpbGQ7XG4gIHdoaWxlIChsYXN0ICYmIChsYXN0ID09PSBTb3J0YWJsZS5naG9zdCB8fCBjc3MobGFzdCwgJ2Rpc3BsYXknKSA9PT0gJ25vbmUnIHx8IHNlbGVjdG9yICYmICFtYXRjaGVzKGxhc3QsIHNlbGVjdG9yKSkpIHtcbiAgICBsYXN0ID0gbGFzdC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nO1xuICB9XG4gIHJldHVybiBsYXN0IHx8IG51bGw7XG59XG5cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBpbmRleCBvZiBhbiBlbGVtZW50IHdpdGhpbiBpdHMgcGFyZW50IGZvciBhIHNlbGVjdGVkIHNldCBvZlxyXG4gKiBlbGVtZW50c1xyXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxcclxuICogQHBhcmFtICB7c2VsZWN0b3J9IHNlbGVjdG9yXHJcbiAqIEByZXR1cm4ge251bWJlcn1cclxuICovXG5mdW5jdGlvbiBpbmRleChlbCwgc2VsZWN0b3IpIHtcbiAgdmFyIGluZGV4ID0gMDtcbiAgaWYgKCFlbCB8fCAhZWwucGFyZW50Tm9kZSkge1xuICAgIHJldHVybiAtMTtcbiAgfVxuXG4gIC8qIGpzaGludCBib3NzOnRydWUgKi9cbiAgd2hpbGUgKGVsID0gZWwucHJldmlvdXNFbGVtZW50U2libGluZykge1xuICAgIGlmIChlbC5ub2RlTmFtZS50b1VwcGVyQ2FzZSgpICE9PSAnVEVNUExBVEUnICYmIGVsICE9PSBTb3J0YWJsZS5jbG9uZSAmJiAoIXNlbGVjdG9yIHx8IG1hdGNoZXMoZWwsIHNlbGVjdG9yKSkpIHtcbiAgICAgIGluZGV4Kys7XG4gICAgfVxuICB9XG4gIHJldHVybiBpbmRleDtcbn1cblxuLyoqXHJcbiAqIFJldHVybnMgdGhlIHNjcm9sbCBvZmZzZXQgb2YgdGhlIGdpdmVuIGVsZW1lbnQsIGFkZGVkIHdpdGggYWxsIHRoZSBzY3JvbGwgb2Zmc2V0cyBvZiBwYXJlbnQgZWxlbWVudHMuXHJcbiAqIFRoZSB2YWx1ZSBpcyByZXR1cm5lZCBpbiByZWFsIHBpeGVscy5cclxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgICBPZmZzZXRzIGluIHRoZSBmb3JtYXQgb2YgW2xlZnQsIHRvcF1cclxuICovXG5mdW5jdGlvbiBnZXRSZWxhdGl2ZVNjcm9sbE9mZnNldChlbCkge1xuICB2YXIgb2Zmc2V0TGVmdCA9IDAsXG4gICAgb2Zmc2V0VG9wID0gMCxcbiAgICB3aW5TY3JvbGxlciA9IGdldFdpbmRvd1Njcm9sbGluZ0VsZW1lbnQoKTtcbiAgaWYgKGVsKSB7XG4gICAgZG8ge1xuICAgICAgdmFyIGVsTWF0cml4ID0gbWF0cml4KGVsKSxcbiAgICAgICAgc2NhbGVYID0gZWxNYXRyaXguYSxcbiAgICAgICAgc2NhbGVZID0gZWxNYXRyaXguZDtcbiAgICAgIG9mZnNldExlZnQgKz0gZWwuc2Nyb2xsTGVmdCAqIHNjYWxlWDtcbiAgICAgIG9mZnNldFRvcCArPSBlbC5zY3JvbGxUb3AgKiBzY2FsZVk7XG4gICAgfSB3aGlsZSAoZWwgIT09IHdpblNjcm9sbGVyICYmIChlbCA9IGVsLnBhcmVudE5vZGUpKTtcbiAgfVxuICByZXR1cm4gW29mZnNldExlZnQsIG9mZnNldFRvcF07XG59XG5cbi8qKlxyXG4gKiBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgb2JqZWN0IHdpdGhpbiB0aGUgZ2l2ZW4gYXJyYXlcclxuICogQHBhcmFtICB7QXJyYXl9IGFyciAgIEFycmF5IHRoYXQgbWF5IG9yIG1heSBub3QgaG9sZCB0aGUgb2JqZWN0XHJcbiAqIEBwYXJhbSAge09iamVjdH0gb2JqICBBbiBvYmplY3QgdGhhdCBoYXMgYSBrZXktdmFsdWUgcGFpciB1bmlxdWUgdG8gYW5kIGlkZW50aWNhbCB0byBhIGtleS12YWx1ZSBwYWlyIGluIHRoZSBvYmplY3QgeW91IHdhbnQgdG8gZmluZFxyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9ICAgICAgVGhlIGluZGV4IG9mIHRoZSBvYmplY3QgaW4gdGhlIGFycmF5LCBvciAtMVxyXG4gKi9cbmZ1bmN0aW9uIGluZGV4T2ZPYmplY3QoYXJyLCBvYmopIHtcbiAgZm9yICh2YXIgaSBpbiBhcnIpIHtcbiAgICBpZiAoIWFyci5oYXNPd25Qcm9wZXJ0eShpKSkgY29udGludWU7XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIG9ialtrZXldID09PSBhcnJbaV1ba2V5XSkgcmV0dXJuIE51bWJlcihpKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuZnVuY3Rpb24gZ2V0UGFyZW50QXV0b1Njcm9sbEVsZW1lbnQoZWwsIGluY2x1ZGVTZWxmKSB7XG4gIC8vIHNraXAgdG8gd2luZG93XG4gIGlmICghZWwgfHwgIWVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCkgcmV0dXJuIGdldFdpbmRvd1Njcm9sbGluZ0VsZW1lbnQoKTtcbiAgdmFyIGVsZW0gPSBlbDtcbiAgdmFyIGdvdFNlbGYgPSBmYWxzZTtcbiAgZG8ge1xuICAgIC8vIHdlIGRvbid0IG5lZWQgdG8gZ2V0IGVsZW0gY3NzIGlmIGl0IGlzbid0IGV2ZW4gb3ZlcmZsb3dpbmcgaW4gdGhlIGZpcnN0IHBsYWNlIChwZXJmb3JtYW5jZSlcbiAgICBpZiAoZWxlbS5jbGllbnRXaWR0aCA8IGVsZW0uc2Nyb2xsV2lkdGggfHwgZWxlbS5jbGllbnRIZWlnaHQgPCBlbGVtLnNjcm9sbEhlaWdodCkge1xuICAgICAgdmFyIGVsZW1DU1MgPSBjc3MoZWxlbSk7XG4gICAgICBpZiAoZWxlbS5jbGllbnRXaWR0aCA8IGVsZW0uc2Nyb2xsV2lkdGggJiYgKGVsZW1DU1Mub3ZlcmZsb3dYID09ICdhdXRvJyB8fCBlbGVtQ1NTLm92ZXJmbG93WCA9PSAnc2Nyb2xsJykgfHwgZWxlbS5jbGllbnRIZWlnaHQgPCBlbGVtLnNjcm9sbEhlaWdodCAmJiAoZWxlbUNTUy5vdmVyZmxvd1kgPT0gJ2F1dG8nIHx8IGVsZW1DU1Mub3ZlcmZsb3dZID09ICdzY3JvbGwnKSkge1xuICAgICAgICBpZiAoIWVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0IHx8IGVsZW0gPT09IGRvY3VtZW50LmJvZHkpIHJldHVybiBnZXRXaW5kb3dTY3JvbGxpbmdFbGVtZW50KCk7XG4gICAgICAgIGlmIChnb3RTZWxmIHx8IGluY2x1ZGVTZWxmKSByZXR1cm4gZWxlbTtcbiAgICAgICAgZ290U2VsZiA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIC8qIGpzaGludCBib3NzOnRydWUgKi9cbiAgfSB3aGlsZSAoZWxlbSA9IGVsZW0ucGFyZW50Tm9kZSk7XG4gIHJldHVybiBnZXRXaW5kb3dTY3JvbGxpbmdFbGVtZW50KCk7XG59XG5mdW5jdGlvbiBleHRlbmQoZHN0LCBzcmMpIHtcbiAgaWYgKGRzdCAmJiBzcmMpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gc3JjKSB7XG4gICAgICBpZiAoc3JjLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgZHN0W2tleV0gPSBzcmNba2V5XTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRzdDtcbn1cbmZ1bmN0aW9uIGlzUmVjdEVxdWFsKHJlY3QxLCByZWN0Mikge1xuICByZXR1cm4gTWF0aC5yb3VuZChyZWN0MS50b3ApID09PSBNYXRoLnJvdW5kKHJlY3QyLnRvcCkgJiYgTWF0aC5yb3VuZChyZWN0MS5sZWZ0KSA9PT0gTWF0aC5yb3VuZChyZWN0Mi5sZWZ0KSAmJiBNYXRoLnJvdW5kKHJlY3QxLmhlaWdodCkgPT09IE1hdGgucm91bmQocmVjdDIuaGVpZ2h0KSAmJiBNYXRoLnJvdW5kKHJlY3QxLndpZHRoKSA9PT0gTWF0aC5yb3VuZChyZWN0Mi53aWR0aCk7XG59XG52YXIgX3Rocm90dGxlVGltZW91dDtcbmZ1bmN0aW9uIHRocm90dGxlKGNhbGxiYWNrLCBtcykge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGlmICghX3Rocm90dGxlVGltZW91dCkge1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgIF90aGlzID0gdGhpcztcbiAgICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBjYWxsYmFjay5jYWxsKF90aGlzLCBhcmdzWzBdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrLmFwcGx5KF90aGlzLCBhcmdzKTtcbiAgICAgIH1cbiAgICAgIF90aHJvdHRsZVRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgX3Rocm90dGxlVGltZW91dCA9IHZvaWQgMDtcbiAgICAgIH0sIG1zKTtcbiAgICB9XG4gIH07XG59XG5mdW5jdGlvbiBjYW5jZWxUaHJvdHRsZSgpIHtcbiAgY2xlYXJUaW1lb3V0KF90aHJvdHRsZVRpbWVvdXQpO1xuICBfdGhyb3R0bGVUaW1lb3V0ID0gdm9pZCAwO1xufVxuZnVuY3Rpb24gc2Nyb2xsQnkoZWwsIHgsIHkpIHtcbiAgZWwuc2Nyb2xsTGVmdCArPSB4O1xuICBlbC5zY3JvbGxUb3AgKz0geTtcbn1cbmZ1bmN0aW9uIGNsb25lKGVsKSB7XG4gIHZhciBQb2x5bWVyID0gd2luZG93LlBvbHltZXI7XG4gIHZhciAkID0gd2luZG93LmpRdWVyeSB8fCB3aW5kb3cuWmVwdG87XG4gIGlmIChQb2x5bWVyICYmIFBvbHltZXIuZG9tKSB7XG4gICAgcmV0dXJuIFBvbHltZXIuZG9tKGVsKS5jbG9uZU5vZGUodHJ1ZSk7XG4gIH0gZWxzZSBpZiAoJCkge1xuICAgIHJldHVybiAkKGVsKS5jbG9uZSh0cnVlKVswXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZWwuY2xvbmVOb2RlKHRydWUpO1xuICB9XG59XG5mdW5jdGlvbiBzZXRSZWN0KGVsLCByZWN0KSB7XG4gIGNzcyhlbCwgJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XG4gIGNzcyhlbCwgJ3RvcCcsIHJlY3QudG9wKTtcbiAgY3NzKGVsLCAnbGVmdCcsIHJlY3QubGVmdCk7XG4gIGNzcyhlbCwgJ3dpZHRoJywgcmVjdC53aWR0aCk7XG4gIGNzcyhlbCwgJ2hlaWdodCcsIHJlY3QuaGVpZ2h0KTtcbn1cbmZ1bmN0aW9uIHVuc2V0UmVjdChlbCkge1xuICBjc3MoZWwsICdwb3NpdGlvbicsICcnKTtcbiAgY3NzKGVsLCAndG9wJywgJycpO1xuICBjc3MoZWwsICdsZWZ0JywgJycpO1xuICBjc3MoZWwsICd3aWR0aCcsICcnKTtcbiAgY3NzKGVsLCAnaGVpZ2h0JywgJycpO1xufVxudmFyIGV4cGFuZG8gPSAnU29ydGFibGUnICsgbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbmZ1bmN0aW9uIEFuaW1hdGlvblN0YXRlTWFuYWdlcigpIHtcbiAgdmFyIGFuaW1hdGlvblN0YXRlcyA9IFtdLFxuICAgIGFuaW1hdGlvbkNhbGxiYWNrSWQ7XG4gIHJldHVybiB7XG4gICAgY2FwdHVyZUFuaW1hdGlvblN0YXRlOiBmdW5jdGlvbiBjYXB0dXJlQW5pbWF0aW9uU3RhdGUoKSB7XG4gICAgICBhbmltYXRpb25TdGF0ZXMgPSBbXTtcbiAgICAgIGlmICghdGhpcy5vcHRpb25zLmFuaW1hdGlvbikgcmV0dXJuO1xuICAgICAgdmFyIGNoaWxkcmVuID0gW10uc2xpY2UuY2FsbCh0aGlzLmVsLmNoaWxkcmVuKTtcbiAgICAgIGNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgICAgIGlmIChjc3MoY2hpbGQsICdkaXNwbGF5JykgPT09ICdub25lJyB8fCBjaGlsZCA9PT0gU29ydGFibGUuZ2hvc3QpIHJldHVybjtcbiAgICAgICAgYW5pbWF0aW9uU3RhdGVzLnB1c2goe1xuICAgICAgICAgIHRhcmdldDogY2hpbGQsXG4gICAgICAgICAgcmVjdDogZ2V0UmVjdChjaGlsZClcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBmcm9tUmVjdCA9IF9vYmplY3RTcHJlYWQyKHt9LCBhbmltYXRpb25TdGF0ZXNbYW5pbWF0aW9uU3RhdGVzLmxlbmd0aCAtIDFdLnJlY3QpO1xuXG4gICAgICAgIC8vIElmIGFuaW1hdGluZzogY29tcGVuc2F0ZSBmb3IgY3VycmVudCBhbmltYXRpb25cbiAgICAgICAgaWYgKGNoaWxkLnRoaXNBbmltYXRpb25EdXJhdGlvbikge1xuICAgICAgICAgIHZhciBjaGlsZE1hdHJpeCA9IG1hdHJpeChjaGlsZCwgdHJ1ZSk7XG4gICAgICAgICAgaWYgKGNoaWxkTWF0cml4KSB7XG4gICAgICAgICAgICBmcm9tUmVjdC50b3AgLT0gY2hpbGRNYXRyaXguZjtcbiAgICAgICAgICAgIGZyb21SZWN0LmxlZnQgLT0gY2hpbGRNYXRyaXguZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2hpbGQuZnJvbVJlY3QgPSBmcm9tUmVjdDtcbiAgICAgIH0pO1xuICAgIH0sXG4gICAgYWRkQW5pbWF0aW9uU3RhdGU6IGZ1bmN0aW9uIGFkZEFuaW1hdGlvblN0YXRlKHN0YXRlKSB7XG4gICAgICBhbmltYXRpb25TdGF0ZXMucHVzaChzdGF0ZSk7XG4gICAgfSxcbiAgICByZW1vdmVBbmltYXRpb25TdGF0ZTogZnVuY3Rpb24gcmVtb3ZlQW5pbWF0aW9uU3RhdGUodGFyZ2V0KSB7XG4gICAgICBhbmltYXRpb25TdGF0ZXMuc3BsaWNlKGluZGV4T2ZPYmplY3QoYW5pbWF0aW9uU3RhdGVzLCB7XG4gICAgICAgIHRhcmdldDogdGFyZ2V0XG4gICAgICB9KSwgMSk7XG4gICAgfSxcbiAgICBhbmltYXRlQWxsOiBmdW5jdGlvbiBhbmltYXRlQWxsKGNhbGxiYWNrKSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuYW5pbWF0aW9uKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChhbmltYXRpb25DYWxsYmFja0lkKTtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIGFuaW1hdGluZyA9IGZhbHNlLFxuICAgICAgICBhbmltYXRpb25UaW1lID0gMDtcbiAgICAgIGFuaW1hdGlvblN0YXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICB2YXIgdGltZSA9IDAsXG4gICAgICAgICAgdGFyZ2V0ID0gc3RhdGUudGFyZ2V0LFxuICAgICAgICAgIGZyb21SZWN0ID0gdGFyZ2V0LmZyb21SZWN0LFxuICAgICAgICAgIHRvUmVjdCA9IGdldFJlY3QodGFyZ2V0KSxcbiAgICAgICAgICBwcmV2RnJvbVJlY3QgPSB0YXJnZXQucHJldkZyb21SZWN0LFxuICAgICAgICAgIHByZXZUb1JlY3QgPSB0YXJnZXQucHJldlRvUmVjdCxcbiAgICAgICAgICBhbmltYXRpbmdSZWN0ID0gc3RhdGUucmVjdCxcbiAgICAgICAgICB0YXJnZXRNYXRyaXggPSBtYXRyaXgodGFyZ2V0LCB0cnVlKTtcbiAgICAgICAgaWYgKHRhcmdldE1hdHJpeCkge1xuICAgICAgICAgIC8vIENvbXBlbnNhdGUgZm9yIGN1cnJlbnQgYW5pbWF0aW9uXG4gICAgICAgICAgdG9SZWN0LnRvcCAtPSB0YXJnZXRNYXRyaXguZjtcbiAgICAgICAgICB0b1JlY3QubGVmdCAtPSB0YXJnZXRNYXRyaXguZTtcbiAgICAgICAgfVxuICAgICAgICB0YXJnZXQudG9SZWN0ID0gdG9SZWN0O1xuICAgICAgICBpZiAodGFyZ2V0LnRoaXNBbmltYXRpb25EdXJhdGlvbikge1xuICAgICAgICAgIC8vIENvdWxkIGFsc28gY2hlY2sgaWYgYW5pbWF0aW5nUmVjdCBpcyBiZXR3ZWVuIGZyb21SZWN0IGFuZCB0b1JlY3RcbiAgICAgICAgICBpZiAoaXNSZWN0RXF1YWwocHJldkZyb21SZWN0LCB0b1JlY3QpICYmICFpc1JlY3RFcXVhbChmcm9tUmVjdCwgdG9SZWN0KSAmJlxuICAgICAgICAgIC8vIE1ha2Ugc3VyZSBhbmltYXRpbmdSZWN0IGlzIG9uIGxpbmUgYmV0d2VlbiB0b1JlY3QgJiBmcm9tUmVjdFxuICAgICAgICAgIChhbmltYXRpbmdSZWN0LnRvcCAtIHRvUmVjdC50b3ApIC8gKGFuaW1hdGluZ1JlY3QubGVmdCAtIHRvUmVjdC5sZWZ0KSA9PT0gKGZyb21SZWN0LnRvcCAtIHRvUmVjdC50b3ApIC8gKGZyb21SZWN0LmxlZnQgLSB0b1JlY3QubGVmdCkpIHtcbiAgICAgICAgICAgIC8vIElmIHJldHVybmluZyB0byBzYW1lIHBsYWNlIGFzIHN0YXJ0ZWQgZnJvbSBhbmltYXRpb24gYW5kIG9uIHNhbWUgYXhpc1xuICAgICAgICAgICAgdGltZSA9IGNhbGN1bGF0ZVJlYWxUaW1lKGFuaW1hdGluZ1JlY3QsIHByZXZGcm9tUmVjdCwgcHJldlRvUmVjdCwgX3RoaXMub3B0aW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgZnJvbVJlY3QgIT0gdG9SZWN0OiBhbmltYXRlXG4gICAgICAgIGlmICghaXNSZWN0RXF1YWwodG9SZWN0LCBmcm9tUmVjdCkpIHtcbiAgICAgICAgICB0YXJnZXQucHJldkZyb21SZWN0ID0gZnJvbVJlY3Q7XG4gICAgICAgICAgdGFyZ2V0LnByZXZUb1JlY3QgPSB0b1JlY3Q7XG4gICAgICAgICAgaWYgKCF0aW1lKSB7XG4gICAgICAgICAgICB0aW1lID0gX3RoaXMub3B0aW9ucy5hbmltYXRpb247XG4gICAgICAgICAgfVxuICAgICAgICAgIF90aGlzLmFuaW1hdGUodGFyZ2V0LCBhbmltYXRpbmdSZWN0LCB0b1JlY3QsIHRpbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aW1lKSB7XG4gICAgICAgICAgYW5pbWF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICBhbmltYXRpb25UaW1lID0gTWF0aC5tYXgoYW5pbWF0aW9uVGltZSwgdGltZSk7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRhcmdldC5hbmltYXRpb25SZXNldFRpbWVyKTtcbiAgICAgICAgICB0YXJnZXQuYW5pbWF0aW9uUmVzZXRUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGFyZ2V0LmFuaW1hdGlvblRpbWUgPSAwO1xuICAgICAgICAgICAgdGFyZ2V0LnByZXZGcm9tUmVjdCA9IG51bGw7XG4gICAgICAgICAgICB0YXJnZXQuZnJvbVJlY3QgPSBudWxsO1xuICAgICAgICAgICAgdGFyZ2V0LnByZXZUb1JlY3QgPSBudWxsO1xuICAgICAgICAgICAgdGFyZ2V0LnRoaXNBbmltYXRpb25EdXJhdGlvbiA9IG51bGw7XG4gICAgICAgICAgfSwgdGltZSk7XG4gICAgICAgICAgdGFyZ2V0LnRoaXNBbmltYXRpb25EdXJhdGlvbiA9IHRpbWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgY2xlYXJUaW1lb3V0KGFuaW1hdGlvbkNhbGxiYWNrSWQpO1xuICAgICAgaWYgKCFhbmltYXRpbmcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFuaW1hdGlvbkNhbGxiYWNrSWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjaygpO1xuICAgICAgICB9LCBhbmltYXRpb25UaW1lKTtcbiAgICAgIH1cbiAgICAgIGFuaW1hdGlvblN0YXRlcyA9IFtdO1xuICAgIH0sXG4gICAgYW5pbWF0ZTogZnVuY3Rpb24gYW5pbWF0ZSh0YXJnZXQsIGN1cnJlbnRSZWN0LCB0b1JlY3QsIGR1cmF0aW9uKSB7XG4gICAgICBpZiAoZHVyYXRpb24pIHtcbiAgICAgICAgY3NzKHRhcmdldCwgJ3RyYW5zaXRpb24nLCAnJyk7XG4gICAgICAgIGNzcyh0YXJnZXQsICd0cmFuc2Zvcm0nLCAnJyk7XG4gICAgICAgIHZhciBlbE1hdHJpeCA9IG1hdHJpeCh0aGlzLmVsKSxcbiAgICAgICAgICBzY2FsZVggPSBlbE1hdHJpeCAmJiBlbE1hdHJpeC5hLFxuICAgICAgICAgIHNjYWxlWSA9IGVsTWF0cml4ICYmIGVsTWF0cml4LmQsXG4gICAgICAgICAgdHJhbnNsYXRlWCA9IChjdXJyZW50UmVjdC5sZWZ0IC0gdG9SZWN0LmxlZnQpIC8gKHNjYWxlWCB8fCAxKSxcbiAgICAgICAgICB0cmFuc2xhdGVZID0gKGN1cnJlbnRSZWN0LnRvcCAtIHRvUmVjdC50b3ApIC8gKHNjYWxlWSB8fCAxKTtcbiAgICAgICAgdGFyZ2V0LmFuaW1hdGluZ1ggPSAhIXRyYW5zbGF0ZVg7XG4gICAgICAgIHRhcmdldC5hbmltYXRpbmdZID0gISF0cmFuc2xhdGVZO1xuICAgICAgICBjc3ModGFyZ2V0LCAndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZTNkKCcgKyB0cmFuc2xhdGVYICsgJ3B4LCcgKyB0cmFuc2xhdGVZICsgJ3B4LDApJyk7XG4gICAgICAgIHRoaXMuZm9yUmVwYWludER1bW15ID0gcmVwYWludCh0YXJnZXQpOyAvLyByZXBhaW50XG5cbiAgICAgICAgY3NzKHRhcmdldCwgJ3RyYW5zaXRpb24nLCAndHJhbnNmb3JtICcgKyBkdXJhdGlvbiArICdtcycgKyAodGhpcy5vcHRpb25zLmVhc2luZyA/ICcgJyArIHRoaXMub3B0aW9ucy5lYXNpbmcgOiAnJykpO1xuICAgICAgICBjc3ModGFyZ2V0LCAndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZTNkKDAsMCwwKScpO1xuICAgICAgICB0eXBlb2YgdGFyZ2V0LmFuaW1hdGVkID09PSAnbnVtYmVyJyAmJiBjbGVhclRpbWVvdXQodGFyZ2V0LmFuaW1hdGVkKTtcbiAgICAgICAgdGFyZ2V0LmFuaW1hdGVkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY3NzKHRhcmdldCwgJ3RyYW5zaXRpb24nLCAnJyk7XG4gICAgICAgICAgY3NzKHRhcmdldCwgJ3RyYW5zZm9ybScsICcnKTtcbiAgICAgICAgICB0YXJnZXQuYW5pbWF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICB0YXJnZXQuYW5pbWF0aW5nWCA9IGZhbHNlO1xuICAgICAgICAgIHRhcmdldC5hbmltYXRpbmdZID0gZmFsc2U7XG4gICAgICAgIH0sIGR1cmF0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5mdW5jdGlvbiByZXBhaW50KHRhcmdldCkge1xuICByZXR1cm4gdGFyZ2V0Lm9mZnNldFdpZHRoO1xufVxuZnVuY3Rpb24gY2FsY3VsYXRlUmVhbFRpbWUoYW5pbWF0aW5nUmVjdCwgZnJvbVJlY3QsIHRvUmVjdCwgb3B0aW9ucykge1xuICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KGZyb21SZWN0LnRvcCAtIGFuaW1hdGluZ1JlY3QudG9wLCAyKSArIE1hdGgucG93KGZyb21SZWN0LmxlZnQgLSBhbmltYXRpbmdSZWN0LmxlZnQsIDIpKSAvIE1hdGguc3FydChNYXRoLnBvdyhmcm9tUmVjdC50b3AgLSB0b1JlY3QudG9wLCAyKSArIE1hdGgucG93KGZyb21SZWN0LmxlZnQgLSB0b1JlY3QubGVmdCwgMikpICogb3B0aW9ucy5hbmltYXRpb247XG59XG5cbnZhciBwbHVnaW5zID0gW107XG52YXIgZGVmYXVsdHMgPSB7XG4gIGluaXRpYWxpemVCeURlZmF1bHQ6IHRydWVcbn07XG52YXIgUGx1Z2luTWFuYWdlciA9IHtcbiAgbW91bnQ6IGZ1bmN0aW9uIG1vdW50KHBsdWdpbikge1xuICAgIC8vIFNldCBkZWZhdWx0IHN0YXRpYyBwcm9wZXJ0aWVzXG4gICAgZm9yICh2YXIgb3B0aW9uIGluIGRlZmF1bHRzKSB7XG4gICAgICBpZiAoZGVmYXVsdHMuaGFzT3duUHJvcGVydHkob3B0aW9uKSAmJiAhKG9wdGlvbiBpbiBwbHVnaW4pKSB7XG4gICAgICAgIHBsdWdpbltvcHRpb25dID0gZGVmYXVsdHNbb3B0aW9uXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uIChwKSB7XG4gICAgICBpZiAocC5wbHVnaW5OYW1lID09PSBwbHVnaW4ucGx1Z2luTmFtZSkge1xuICAgICAgICB0aHJvdyBcIlNvcnRhYmxlOiBDYW5ub3QgbW91bnQgcGx1Z2luIFwiLmNvbmNhdChwbHVnaW4ucGx1Z2luTmFtZSwgXCIgbW9yZSB0aGFuIG9uY2VcIik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcGx1Z2lucy5wdXNoKHBsdWdpbik7XG4gIH0sXG4gIHBsdWdpbkV2ZW50OiBmdW5jdGlvbiBwbHVnaW5FdmVudChldmVudE5hbWUsIHNvcnRhYmxlLCBldnQpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuZXZlbnRDYW5jZWxlZCA9IGZhbHNlO1xuICAgIGV2dC5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICBfdGhpcy5ldmVudENhbmNlbGVkID0gdHJ1ZTtcbiAgICB9O1xuICAgIHZhciBldmVudE5hbWVHbG9iYWwgPSBldmVudE5hbWUgKyAnR2xvYmFsJztcbiAgICBwbHVnaW5zLmZvckVhY2goZnVuY3Rpb24gKHBsdWdpbikge1xuICAgICAgaWYgKCFzb3J0YWJsZVtwbHVnaW4ucGx1Z2luTmFtZV0pIHJldHVybjtcbiAgICAgIC8vIEZpcmUgZ2xvYmFsIGV2ZW50cyBpZiBpdCBleGlzdHMgaW4gdGhpcyBzb3J0YWJsZVxuICAgICAgaWYgKHNvcnRhYmxlW3BsdWdpbi5wbHVnaW5OYW1lXVtldmVudE5hbWVHbG9iYWxdKSB7XG4gICAgICAgIHNvcnRhYmxlW3BsdWdpbi5wbHVnaW5OYW1lXVtldmVudE5hbWVHbG9iYWxdKF9vYmplY3RTcHJlYWQyKHtcbiAgICAgICAgICBzb3J0YWJsZTogc29ydGFibGVcbiAgICAgICAgfSwgZXZ0KSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE9ubHkgZmlyZSBwbHVnaW4gZXZlbnQgaWYgcGx1Z2luIGlzIGVuYWJsZWQgaW4gdGhpcyBzb3J0YWJsZSxcbiAgICAgIC8vIGFuZCBwbHVnaW4gaGFzIGV2ZW50IGRlZmluZWRcbiAgICAgIGlmIChzb3J0YWJsZS5vcHRpb25zW3BsdWdpbi5wbHVnaW5OYW1lXSAmJiBzb3J0YWJsZVtwbHVnaW4ucGx1Z2luTmFtZV1bZXZlbnROYW1lXSkge1xuICAgICAgICBzb3J0YWJsZVtwbHVnaW4ucGx1Z2luTmFtZV1bZXZlbnROYW1lXShfb2JqZWN0U3ByZWFkMih7XG4gICAgICAgICAgc29ydGFibGU6IHNvcnRhYmxlXG4gICAgICAgIH0sIGV2dCkpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuICBpbml0aWFsaXplUGx1Z2luczogZnVuY3Rpb24gaW5pdGlhbGl6ZVBsdWdpbnMoc29ydGFibGUsIGVsLCBkZWZhdWx0cywgb3B0aW9ucykge1xuICAgIHBsdWdpbnMuZm9yRWFjaChmdW5jdGlvbiAocGx1Z2luKSB7XG4gICAgICB2YXIgcGx1Z2luTmFtZSA9IHBsdWdpbi5wbHVnaW5OYW1lO1xuICAgICAgaWYgKCFzb3J0YWJsZS5vcHRpb25zW3BsdWdpbk5hbWVdICYmICFwbHVnaW4uaW5pdGlhbGl6ZUJ5RGVmYXVsdCkgcmV0dXJuO1xuICAgICAgdmFyIGluaXRpYWxpemVkID0gbmV3IHBsdWdpbihzb3J0YWJsZSwgZWwsIHNvcnRhYmxlLm9wdGlvbnMpO1xuICAgICAgaW5pdGlhbGl6ZWQuc29ydGFibGUgPSBzb3J0YWJsZTtcbiAgICAgIGluaXRpYWxpemVkLm9wdGlvbnMgPSBzb3J0YWJsZS5vcHRpb25zO1xuICAgICAgc29ydGFibGVbcGx1Z2luTmFtZV0gPSBpbml0aWFsaXplZDtcblxuICAgICAgLy8gQWRkIGRlZmF1bHQgb3B0aW9ucyBmcm9tIHBsdWdpblxuICAgICAgX2V4dGVuZHMoZGVmYXVsdHMsIGluaXRpYWxpemVkLmRlZmF1bHRzKTtcbiAgICB9KTtcbiAgICBmb3IgKHZhciBvcHRpb24gaW4gc29ydGFibGUub3B0aW9ucykge1xuICAgICAgaWYgKCFzb3J0YWJsZS5vcHRpb25zLmhhc093blByb3BlcnR5KG9wdGlvbikpIGNvbnRpbnVlO1xuICAgICAgdmFyIG1vZGlmaWVkID0gdGhpcy5tb2RpZnlPcHRpb24oc29ydGFibGUsIG9wdGlvbiwgc29ydGFibGUub3B0aW9uc1tvcHRpb25dKTtcbiAgICAgIGlmICh0eXBlb2YgbW9kaWZpZWQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHNvcnRhYmxlLm9wdGlvbnNbb3B0aW9uXSA9IG1vZGlmaWVkO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgZ2V0RXZlbnRQcm9wZXJ0aWVzOiBmdW5jdGlvbiBnZXRFdmVudFByb3BlcnRpZXMobmFtZSwgc29ydGFibGUpIHtcbiAgICB2YXIgZXZlbnRQcm9wZXJ0aWVzID0ge307XG4gICAgcGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICAgIGlmICh0eXBlb2YgcGx1Z2luLmV2ZW50UHJvcGVydGllcyAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuO1xuICAgICAgX2V4dGVuZHMoZXZlbnRQcm9wZXJ0aWVzLCBwbHVnaW4uZXZlbnRQcm9wZXJ0aWVzLmNhbGwoc29ydGFibGVbcGx1Z2luLnBsdWdpbk5hbWVdLCBuYW1lKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGV2ZW50UHJvcGVydGllcztcbiAgfSxcbiAgbW9kaWZ5T3B0aW9uOiBmdW5jdGlvbiBtb2RpZnlPcHRpb24oc29ydGFibGUsIG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIG1vZGlmaWVkVmFsdWU7XG4gICAgcGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uIChwbHVnaW4pIHtcbiAgICAgIC8vIFBsdWdpbiBtdXN0IGV4aXN0IG9uIHRoZSBTb3J0YWJsZVxuICAgICAgaWYgKCFzb3J0YWJsZVtwbHVnaW4ucGx1Z2luTmFtZV0pIHJldHVybjtcblxuICAgICAgLy8gSWYgc3RhdGljIG9wdGlvbiBsaXN0ZW5lciBleGlzdHMgZm9yIHRoaXMgb3B0aW9uLCBjYWxsIGluIHRoZSBjb250ZXh0IG9mIHRoZSBTb3J0YWJsZSdzIGluc3RhbmNlIG9mIHRoaXMgcGx1Z2luXG4gICAgICBpZiAocGx1Z2luLm9wdGlvbkxpc3RlbmVycyAmJiB0eXBlb2YgcGx1Z2luLm9wdGlvbkxpc3RlbmVyc1tuYW1lXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBtb2RpZmllZFZhbHVlID0gcGx1Z2luLm9wdGlvbkxpc3RlbmVyc1tuYW1lXS5jYWxsKHNvcnRhYmxlW3BsdWdpbi5wbHVnaW5OYW1lXSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBtb2RpZmllZFZhbHVlO1xuICB9XG59O1xuXG5mdW5jdGlvbiBkaXNwYXRjaEV2ZW50KF9yZWYpIHtcbiAgdmFyIHNvcnRhYmxlID0gX3JlZi5zb3J0YWJsZSxcbiAgICByb290RWwgPSBfcmVmLnJvb3RFbCxcbiAgICBuYW1lID0gX3JlZi5uYW1lLFxuICAgIHRhcmdldEVsID0gX3JlZi50YXJnZXRFbCxcbiAgICBjbG9uZUVsID0gX3JlZi5jbG9uZUVsLFxuICAgIHRvRWwgPSBfcmVmLnRvRWwsXG4gICAgZnJvbUVsID0gX3JlZi5mcm9tRWwsXG4gICAgb2xkSW5kZXggPSBfcmVmLm9sZEluZGV4LFxuICAgIG5ld0luZGV4ID0gX3JlZi5uZXdJbmRleCxcbiAgICBvbGREcmFnZ2FibGVJbmRleCA9IF9yZWYub2xkRHJhZ2dhYmxlSW5kZXgsXG4gICAgbmV3RHJhZ2dhYmxlSW5kZXggPSBfcmVmLm5ld0RyYWdnYWJsZUluZGV4LFxuICAgIG9yaWdpbmFsRXZlbnQgPSBfcmVmLm9yaWdpbmFsRXZlbnQsXG4gICAgcHV0U29ydGFibGUgPSBfcmVmLnB1dFNvcnRhYmxlLFxuICAgIGV4dHJhRXZlbnRQcm9wZXJ0aWVzID0gX3JlZi5leHRyYUV2ZW50UHJvcGVydGllcztcbiAgc29ydGFibGUgPSBzb3J0YWJsZSB8fCByb290RWwgJiYgcm9vdEVsW2V4cGFuZG9dO1xuICBpZiAoIXNvcnRhYmxlKSByZXR1cm47XG4gIHZhciBldnQsXG4gICAgb3B0aW9ucyA9IHNvcnRhYmxlLm9wdGlvbnMsXG4gICAgb25OYW1lID0gJ29uJyArIG5hbWUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBuYW1lLnN1YnN0cigxKTtcbiAgLy8gU3VwcG9ydCBmb3IgbmV3IEN1c3RvbUV2ZW50IGZlYXR1cmVcbiAgaWYgKHdpbmRvdy5DdXN0b21FdmVudCAmJiAhSUUxMU9yTGVzcyAmJiAhRWRnZSkge1xuICAgIGV2dCA9IG5ldyBDdXN0b21FdmVudChuYW1lLCB7XG4gICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgY2FuY2VsYWJsZTogdHJ1ZVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGV2dCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgIGV2dC5pbml0RXZlbnQobmFtZSwgdHJ1ZSwgdHJ1ZSk7XG4gIH1cbiAgZXZ0LnRvID0gdG9FbCB8fCByb290RWw7XG4gIGV2dC5mcm9tID0gZnJvbUVsIHx8IHJvb3RFbDtcbiAgZXZ0Lml0ZW0gPSB0YXJnZXRFbCB8fCByb290RWw7XG4gIGV2dC5jbG9uZSA9IGNsb25lRWw7XG4gIGV2dC5vbGRJbmRleCA9IG9sZEluZGV4O1xuICBldnQubmV3SW5kZXggPSBuZXdJbmRleDtcbiAgZXZ0Lm9sZERyYWdnYWJsZUluZGV4ID0gb2xkRHJhZ2dhYmxlSW5kZXg7XG4gIGV2dC5uZXdEcmFnZ2FibGVJbmRleCA9IG5ld0RyYWdnYWJsZUluZGV4O1xuICBldnQub3JpZ2luYWxFdmVudCA9IG9yaWdpbmFsRXZlbnQ7XG4gIGV2dC5wdWxsTW9kZSA9IHB1dFNvcnRhYmxlID8gcHV0U29ydGFibGUubGFzdFB1dE1vZGUgOiB1bmRlZmluZWQ7XG4gIHZhciBhbGxFdmVudFByb3BlcnRpZXMgPSBfb2JqZWN0U3ByZWFkMihfb2JqZWN0U3ByZWFkMih7fSwgZXh0cmFFdmVudFByb3BlcnRpZXMpLCBQbHVnaW5NYW5hZ2VyLmdldEV2ZW50UHJvcGVydGllcyhuYW1lLCBzb3J0YWJsZSkpO1xuICBmb3IgKHZhciBvcHRpb24gaW4gYWxsRXZlbnRQcm9wZXJ0aWVzKSB7XG4gICAgZXZ0W29wdGlvbl0gPSBhbGxFdmVudFByb3BlcnRpZXNbb3B0aW9uXTtcbiAgfVxuICBpZiAocm9vdEVsKSB7XG4gICAgcm9vdEVsLmRpc3BhdGNoRXZlbnQoZXZ0KTtcbiAgfVxuICBpZiAob3B0aW9uc1tvbk5hbWVdKSB7XG4gICAgb3B0aW9uc1tvbk5hbWVdLmNhbGwoc29ydGFibGUsIGV2dCk7XG4gIH1cbn1cblxudmFyIF9leGNsdWRlZCA9IFtcImV2dFwiXTtcbnZhciBwbHVnaW5FdmVudCA9IGZ1bmN0aW9uIHBsdWdpbkV2ZW50KGV2ZW50TmFtZSwgc29ydGFibGUpIHtcbiAgdmFyIF9yZWYgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHt9LFxuICAgIG9yaWdpbmFsRXZlbnQgPSBfcmVmLmV2dCxcbiAgICBkYXRhID0gX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzKF9yZWYsIF9leGNsdWRlZCk7XG4gIFBsdWdpbk1hbmFnZXIucGx1Z2luRXZlbnQuYmluZChTb3J0YWJsZSkoZXZlbnROYW1lLCBzb3J0YWJsZSwgX29iamVjdFNwcmVhZDIoe1xuICAgIGRyYWdFbDogZHJhZ0VsLFxuICAgIHBhcmVudEVsOiBwYXJlbnRFbCxcbiAgICBnaG9zdEVsOiBnaG9zdEVsLFxuICAgIHJvb3RFbDogcm9vdEVsLFxuICAgIG5leHRFbDogbmV4dEVsLFxuICAgIGxhc3REb3duRWw6IGxhc3REb3duRWwsXG4gICAgY2xvbmVFbDogY2xvbmVFbCxcbiAgICBjbG9uZUhpZGRlbjogY2xvbmVIaWRkZW4sXG4gICAgZHJhZ1N0YXJ0ZWQ6IG1vdmVkLFxuICAgIHB1dFNvcnRhYmxlOiBwdXRTb3J0YWJsZSxcbiAgICBhY3RpdmVTb3J0YWJsZTogU29ydGFibGUuYWN0aXZlLFxuICAgIG9yaWdpbmFsRXZlbnQ6IG9yaWdpbmFsRXZlbnQsXG4gICAgb2xkSW5kZXg6IG9sZEluZGV4LFxuICAgIG9sZERyYWdnYWJsZUluZGV4OiBvbGREcmFnZ2FibGVJbmRleCxcbiAgICBuZXdJbmRleDogbmV3SW5kZXgsXG4gICAgbmV3RHJhZ2dhYmxlSW5kZXg6IG5ld0RyYWdnYWJsZUluZGV4LFxuICAgIGhpZGVHaG9zdEZvclRhcmdldDogX2hpZGVHaG9zdEZvclRhcmdldCxcbiAgICB1bmhpZGVHaG9zdEZvclRhcmdldDogX3VuaGlkZUdob3N0Rm9yVGFyZ2V0LFxuICAgIGNsb25lTm93SGlkZGVuOiBmdW5jdGlvbiBjbG9uZU5vd0hpZGRlbigpIHtcbiAgICAgIGNsb25lSGlkZGVuID0gdHJ1ZTtcbiAgICB9LFxuICAgIGNsb25lTm93U2hvd246IGZ1bmN0aW9uIGNsb25lTm93U2hvd24oKSB7XG4gICAgICBjbG9uZUhpZGRlbiA9IGZhbHNlO1xuICAgIH0sXG4gICAgZGlzcGF0Y2hTb3J0YWJsZUV2ZW50OiBmdW5jdGlvbiBkaXNwYXRjaFNvcnRhYmxlRXZlbnQobmFtZSkge1xuICAgICAgX2Rpc3BhdGNoRXZlbnQoe1xuICAgICAgICBzb3J0YWJsZTogc29ydGFibGUsXG4gICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgIG9yaWdpbmFsRXZlbnQ6IG9yaWdpbmFsRXZlbnRcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwgZGF0YSkpO1xufTtcbmZ1bmN0aW9uIF9kaXNwYXRjaEV2ZW50KGluZm8pIHtcbiAgZGlzcGF0Y2hFdmVudChfb2JqZWN0U3ByZWFkMih7XG4gICAgcHV0U29ydGFibGU6IHB1dFNvcnRhYmxlLFxuICAgIGNsb25lRWw6IGNsb25lRWwsXG4gICAgdGFyZ2V0RWw6IGRyYWdFbCxcbiAgICByb290RWw6IHJvb3RFbCxcbiAgICBvbGRJbmRleDogb2xkSW5kZXgsXG4gICAgb2xkRHJhZ2dhYmxlSW5kZXg6IG9sZERyYWdnYWJsZUluZGV4LFxuICAgIG5ld0luZGV4OiBuZXdJbmRleCxcbiAgICBuZXdEcmFnZ2FibGVJbmRleDogbmV3RHJhZ2dhYmxlSW5kZXhcbiAgfSwgaW5mbykpO1xufVxudmFyIGRyYWdFbCxcbiAgcGFyZW50RWwsXG4gIGdob3N0RWwsXG4gIHJvb3RFbCxcbiAgbmV4dEVsLFxuICBsYXN0RG93bkVsLFxuICBjbG9uZUVsLFxuICBjbG9uZUhpZGRlbixcbiAgb2xkSW5kZXgsXG4gIG5ld0luZGV4LFxuICBvbGREcmFnZ2FibGVJbmRleCxcbiAgbmV3RHJhZ2dhYmxlSW5kZXgsXG4gIGFjdGl2ZUdyb3VwLFxuICBwdXRTb3J0YWJsZSxcbiAgYXdhaXRpbmdEcmFnU3RhcnRlZCA9IGZhbHNlLFxuICBpZ25vcmVOZXh0Q2xpY2sgPSBmYWxzZSxcbiAgc29ydGFibGVzID0gW10sXG4gIHRhcEV2dCxcbiAgdG91Y2hFdnQsXG4gIGxhc3REeCxcbiAgbGFzdER5LFxuICB0YXBEaXN0YW5jZUxlZnQsXG4gIHRhcERpc3RhbmNlVG9wLFxuICBtb3ZlZCxcbiAgbGFzdFRhcmdldCxcbiAgbGFzdERpcmVjdGlvbixcbiAgcGFzdEZpcnN0SW52ZXJ0VGhyZXNoID0gZmFsc2UsXG4gIGlzQ2lyY3Vtc3RhbnRpYWxJbnZlcnQgPSBmYWxzZSxcbiAgdGFyZ2V0TW92ZURpc3RhbmNlLFxuICAvLyBGb3IgcG9zaXRpb25pbmcgZ2hvc3QgYWJzb2x1dGVseVxuICBnaG9zdFJlbGF0aXZlUGFyZW50LFxuICBnaG9zdFJlbGF0aXZlUGFyZW50SW5pdGlhbFNjcm9sbCA9IFtdLFxuICAvLyAobGVmdCwgdG9wKVxuXG4gIF9zaWxlbnQgPSBmYWxzZSxcbiAgc2F2ZWRJbnB1dENoZWNrZWQgPSBbXTtcblxuLyoqIEBjb25zdCAqL1xudmFyIGRvY3VtZW50RXhpc3RzID0gdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJyxcbiAgUG9zaXRpb25HaG9zdEFic29sdXRlbHkgPSBJT1MsXG4gIENTU0Zsb2F0UHJvcGVydHkgPSBFZGdlIHx8IElFMTFPckxlc3MgPyAnY3NzRmxvYXQnIDogJ2Zsb2F0JyxcbiAgLy8gVGhpcyB3aWxsIG5vdCBwYXNzIGZvciBJRTksIGJlY2F1c2UgSUU5IERuRCBvbmx5IHdvcmtzIG9uIGFuY2hvcnNcbiAgc3VwcG9ydERyYWdnYWJsZSA9IGRvY3VtZW50RXhpc3RzICYmICFDaHJvbWVGb3JBbmRyb2lkICYmICFJT1MgJiYgJ2RyYWdnYWJsZScgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JyksXG4gIHN1cHBvcnRDc3NQb2ludGVyRXZlbnRzID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghZG9jdW1lbnRFeGlzdHMpIHJldHVybjtcbiAgICAvLyBmYWxzZSB3aGVuIDw9IElFMTFcbiAgICBpZiAoSUUxMU9yTGVzcykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd4Jyk7XG4gICAgZWwuc3R5bGUuY3NzVGV4dCA9ICdwb2ludGVyLWV2ZW50czphdXRvJztcbiAgICByZXR1cm4gZWwuc3R5bGUucG9pbnRlckV2ZW50cyA9PT0gJ2F1dG8nO1xuICB9KCksXG4gIF9kZXRlY3REaXJlY3Rpb24gPSBmdW5jdGlvbiBfZGV0ZWN0RGlyZWN0aW9uKGVsLCBvcHRpb25zKSB7XG4gICAgdmFyIGVsQ1NTID0gY3NzKGVsKSxcbiAgICAgIGVsV2lkdGggPSBwYXJzZUludChlbENTUy53aWR0aCkgLSBwYXJzZUludChlbENTUy5wYWRkaW5nTGVmdCkgLSBwYXJzZUludChlbENTUy5wYWRkaW5nUmlnaHQpIC0gcGFyc2VJbnQoZWxDU1MuYm9yZGVyTGVmdFdpZHRoKSAtIHBhcnNlSW50KGVsQ1NTLmJvcmRlclJpZ2h0V2lkdGgpLFxuICAgICAgY2hpbGQxID0gZ2V0Q2hpbGQoZWwsIDAsIG9wdGlvbnMpLFxuICAgICAgY2hpbGQyID0gZ2V0Q2hpbGQoZWwsIDEsIG9wdGlvbnMpLFxuICAgICAgZmlyc3RDaGlsZENTUyA9IGNoaWxkMSAmJiBjc3MoY2hpbGQxKSxcbiAgICAgIHNlY29uZENoaWxkQ1NTID0gY2hpbGQyICYmIGNzcyhjaGlsZDIpLFxuICAgICAgZmlyc3RDaGlsZFdpZHRoID0gZmlyc3RDaGlsZENTUyAmJiBwYXJzZUludChmaXJzdENoaWxkQ1NTLm1hcmdpbkxlZnQpICsgcGFyc2VJbnQoZmlyc3RDaGlsZENTUy5tYXJnaW5SaWdodCkgKyBnZXRSZWN0KGNoaWxkMSkud2lkdGgsXG4gICAgICBzZWNvbmRDaGlsZFdpZHRoID0gc2Vjb25kQ2hpbGRDU1MgJiYgcGFyc2VJbnQoc2Vjb25kQ2hpbGRDU1MubWFyZ2luTGVmdCkgKyBwYXJzZUludChzZWNvbmRDaGlsZENTUy5tYXJnaW5SaWdodCkgKyBnZXRSZWN0KGNoaWxkMikud2lkdGg7XG4gICAgaWYgKGVsQ1NTLmRpc3BsYXkgPT09ICdmbGV4Jykge1xuICAgICAgcmV0dXJuIGVsQ1NTLmZsZXhEaXJlY3Rpb24gPT09ICdjb2x1bW4nIHx8IGVsQ1NTLmZsZXhEaXJlY3Rpb24gPT09ICdjb2x1bW4tcmV2ZXJzZScgPyAndmVydGljYWwnIDogJ2hvcml6b250YWwnO1xuICAgIH1cbiAgICBpZiAoZWxDU1MuZGlzcGxheSA9PT0gJ2dyaWQnKSB7XG4gICAgICByZXR1cm4gZWxDU1MuZ3JpZFRlbXBsYXRlQ29sdW1ucy5zcGxpdCgnICcpLmxlbmd0aCA8PSAxID8gJ3ZlcnRpY2FsJyA6ICdob3Jpem9udGFsJztcbiAgICB9XG4gICAgaWYgKGNoaWxkMSAmJiBmaXJzdENoaWxkQ1NTW1wiZmxvYXRcIl0gJiYgZmlyc3RDaGlsZENTU1tcImZsb2F0XCJdICE9PSAnbm9uZScpIHtcbiAgICAgIHZhciB0b3VjaGluZ1NpZGVDaGlsZDIgPSBmaXJzdENoaWxkQ1NTW1wiZmxvYXRcIl0gPT09ICdsZWZ0JyA/ICdsZWZ0JyA6ICdyaWdodCc7XG4gICAgICByZXR1cm4gY2hpbGQyICYmIChzZWNvbmRDaGlsZENTUy5jbGVhciA9PT0gJ2JvdGgnIHx8IHNlY29uZENoaWxkQ1NTLmNsZWFyID09PSB0b3VjaGluZ1NpZGVDaGlsZDIpID8gJ3ZlcnRpY2FsJyA6ICdob3Jpem9udGFsJztcbiAgICB9XG4gICAgcmV0dXJuIGNoaWxkMSAmJiAoZmlyc3RDaGlsZENTUy5kaXNwbGF5ID09PSAnYmxvY2snIHx8IGZpcnN0Q2hpbGRDU1MuZGlzcGxheSA9PT0gJ2ZsZXgnIHx8IGZpcnN0Q2hpbGRDU1MuZGlzcGxheSA9PT0gJ3RhYmxlJyB8fCBmaXJzdENoaWxkQ1NTLmRpc3BsYXkgPT09ICdncmlkJyB8fCBmaXJzdENoaWxkV2lkdGggPj0gZWxXaWR0aCAmJiBlbENTU1tDU1NGbG9hdFByb3BlcnR5XSA9PT0gJ25vbmUnIHx8IGNoaWxkMiAmJiBlbENTU1tDU1NGbG9hdFByb3BlcnR5XSA9PT0gJ25vbmUnICYmIGZpcnN0Q2hpbGRXaWR0aCArIHNlY29uZENoaWxkV2lkdGggPiBlbFdpZHRoKSA/ICd2ZXJ0aWNhbCcgOiAnaG9yaXpvbnRhbCc7XG4gIH0sXG4gIF9kcmFnRWxJblJvd0NvbHVtbiA9IGZ1bmN0aW9uIF9kcmFnRWxJblJvd0NvbHVtbihkcmFnUmVjdCwgdGFyZ2V0UmVjdCwgdmVydGljYWwpIHtcbiAgICB2YXIgZHJhZ0VsUzFPcHAgPSB2ZXJ0aWNhbCA/IGRyYWdSZWN0LmxlZnQgOiBkcmFnUmVjdC50b3AsXG4gICAgICBkcmFnRWxTMk9wcCA9IHZlcnRpY2FsID8gZHJhZ1JlY3QucmlnaHQgOiBkcmFnUmVjdC5ib3R0b20sXG4gICAgICBkcmFnRWxPcHBMZW5ndGggPSB2ZXJ0aWNhbCA/IGRyYWdSZWN0LndpZHRoIDogZHJhZ1JlY3QuaGVpZ2h0LFxuICAgICAgdGFyZ2V0UzFPcHAgPSB2ZXJ0aWNhbCA/IHRhcmdldFJlY3QubGVmdCA6IHRhcmdldFJlY3QudG9wLFxuICAgICAgdGFyZ2V0UzJPcHAgPSB2ZXJ0aWNhbCA/IHRhcmdldFJlY3QucmlnaHQgOiB0YXJnZXRSZWN0LmJvdHRvbSxcbiAgICAgIHRhcmdldE9wcExlbmd0aCA9IHZlcnRpY2FsID8gdGFyZ2V0UmVjdC53aWR0aCA6IHRhcmdldFJlY3QuaGVpZ2h0O1xuICAgIHJldHVybiBkcmFnRWxTMU9wcCA9PT0gdGFyZ2V0UzFPcHAgfHwgZHJhZ0VsUzJPcHAgPT09IHRhcmdldFMyT3BwIHx8IGRyYWdFbFMxT3BwICsgZHJhZ0VsT3BwTGVuZ3RoIC8gMiA9PT0gdGFyZ2V0UzFPcHAgKyB0YXJnZXRPcHBMZW5ndGggLyAyO1xuICB9LFxuICAvKipcclxuICAgKiBEZXRlY3RzIGZpcnN0IG5lYXJlc3QgZW1wdHkgc29ydGFibGUgdG8gWCBhbmQgWSBwb3NpdGlvbiB1c2luZyBlbXB0eUluc2VydFRocmVzaG9sZC5cclxuICAgKiBAcGFyYW0gIHtOdW1iZXJ9IHggICAgICBYIHBvc2l0aW9uXHJcbiAgICogQHBhcmFtICB7TnVtYmVyfSB5ICAgICAgWSBwb3NpdGlvblxyXG4gICAqIEByZXR1cm4ge0hUTUxFbGVtZW50fSAgIEVsZW1lbnQgb2YgdGhlIGZpcnN0IGZvdW5kIG5lYXJlc3QgU29ydGFibGVcclxuICAgKi9cbiAgX2RldGVjdE5lYXJlc3RFbXB0eVNvcnRhYmxlID0gZnVuY3Rpb24gX2RldGVjdE5lYXJlc3RFbXB0eVNvcnRhYmxlKHgsIHkpIHtcbiAgICB2YXIgcmV0O1xuICAgIHNvcnRhYmxlcy5zb21lKGZ1bmN0aW9uIChzb3J0YWJsZSkge1xuICAgICAgdmFyIHRocmVzaG9sZCA9IHNvcnRhYmxlW2V4cGFuZG9dLm9wdGlvbnMuZW1wdHlJbnNlcnRUaHJlc2hvbGQ7XG4gICAgICBpZiAoIXRocmVzaG9sZCB8fCBsYXN0Q2hpbGQoc29ydGFibGUpKSByZXR1cm47XG4gICAgICB2YXIgcmVjdCA9IGdldFJlY3Qoc29ydGFibGUpLFxuICAgICAgICBpbnNpZGVIb3Jpem9udGFsbHkgPSB4ID49IHJlY3QubGVmdCAtIHRocmVzaG9sZCAmJiB4IDw9IHJlY3QucmlnaHQgKyB0aHJlc2hvbGQsXG4gICAgICAgIGluc2lkZVZlcnRpY2FsbHkgPSB5ID49IHJlY3QudG9wIC0gdGhyZXNob2xkICYmIHkgPD0gcmVjdC5ib3R0b20gKyB0aHJlc2hvbGQ7XG4gICAgICBpZiAoaW5zaWRlSG9yaXpvbnRhbGx5ICYmIGluc2lkZVZlcnRpY2FsbHkpIHtcbiAgICAgICAgcmV0dXJuIHJldCA9IHNvcnRhYmxlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXQ7XG4gIH0sXG4gIF9wcmVwYXJlR3JvdXAgPSBmdW5jdGlvbiBfcHJlcGFyZUdyb3VwKG9wdGlvbnMpIHtcbiAgICBmdW5jdGlvbiB0b0ZuKHZhbHVlLCBwdWxsKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKHRvLCBmcm9tLCBkcmFnRWwsIGV2dCkge1xuICAgICAgICB2YXIgc2FtZUdyb3VwID0gdG8ub3B0aW9ucy5ncm91cC5uYW1lICYmIGZyb20ub3B0aW9ucy5ncm91cC5uYW1lICYmIHRvLm9wdGlvbnMuZ3JvdXAubmFtZSA9PT0gZnJvbS5vcHRpb25zLmdyb3VwLm5hbWU7XG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsICYmIChwdWxsIHx8IHNhbWVHcm91cCkpIHtcbiAgICAgICAgICAvLyBEZWZhdWx0IHB1bGwgdmFsdWVcbiAgICAgICAgICAvLyBEZWZhdWx0IHB1bGwgYW5kIHB1dCB2YWx1ZSBpZiBzYW1lIGdyb3VwXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT0gbnVsbCB8fCB2YWx1ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAocHVsbCAmJiB2YWx1ZSA9PT0gJ2Nsb25lJykge1xuICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICByZXR1cm4gdG9Gbih2YWx1ZSh0bywgZnJvbSwgZHJhZ0VsLCBldnQpLCBwdWxsKSh0bywgZnJvbSwgZHJhZ0VsLCBldnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBvdGhlckdyb3VwID0gKHB1bGwgPyB0byA6IGZyb20pLm9wdGlvbnMuZ3JvdXAubmFtZTtcbiAgICAgICAgICByZXR1cm4gdmFsdWUgPT09IHRydWUgfHwgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAmJiB2YWx1ZSA9PT0gb3RoZXJHcm91cCB8fCB2YWx1ZS5qb2luICYmIHZhbHVlLmluZGV4T2Yob3RoZXJHcm91cCkgPiAtMTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGdyb3VwID0ge307XG4gICAgdmFyIG9yaWdpbmFsR3JvdXAgPSBvcHRpb25zLmdyb3VwO1xuICAgIGlmICghb3JpZ2luYWxHcm91cCB8fCBfdHlwZW9mKG9yaWdpbmFsR3JvdXApICE9ICdvYmplY3QnKSB7XG4gICAgICBvcmlnaW5hbEdyb3VwID0ge1xuICAgICAgICBuYW1lOiBvcmlnaW5hbEdyb3VwXG4gICAgICB9O1xuICAgIH1cbiAgICBncm91cC5uYW1lID0gb3JpZ2luYWxHcm91cC5uYW1lO1xuICAgIGdyb3VwLmNoZWNrUHVsbCA9IHRvRm4ob3JpZ2luYWxHcm91cC5wdWxsLCB0cnVlKTtcbiAgICBncm91cC5jaGVja1B1dCA9IHRvRm4ob3JpZ2luYWxHcm91cC5wdXQpO1xuICAgIGdyb3VwLnJldmVydENsb25lID0gb3JpZ2luYWxHcm91cC5yZXZlcnRDbG9uZTtcbiAgICBvcHRpb25zLmdyb3VwID0gZ3JvdXA7XG4gIH0sXG4gIF9oaWRlR2hvc3RGb3JUYXJnZXQgPSBmdW5jdGlvbiBfaGlkZUdob3N0Rm9yVGFyZ2V0KCkge1xuICAgIGlmICghc3VwcG9ydENzc1BvaW50ZXJFdmVudHMgJiYgZ2hvc3RFbCkge1xuICAgICAgY3NzKGdob3N0RWwsICdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICB9XG4gIH0sXG4gIF91bmhpZGVHaG9zdEZvclRhcmdldCA9IGZ1bmN0aW9uIF91bmhpZGVHaG9zdEZvclRhcmdldCgpIHtcbiAgICBpZiAoIXN1cHBvcnRDc3NQb2ludGVyRXZlbnRzICYmIGdob3N0RWwpIHtcbiAgICAgIGNzcyhnaG9zdEVsLCAnZGlzcGxheScsICcnKTtcbiAgICB9XG4gIH07XG5cbi8vICMxMTg0IGZpeCAtIFByZXZlbnQgY2xpY2sgZXZlbnQgb24gZmFsbGJhY2sgaWYgZHJhZ2dlZCBidXQgaXRlbSBub3QgY2hhbmdlZCBwb3NpdGlvblxuaWYgKGRvY3VtZW50RXhpc3RzICYmICFDaHJvbWVGb3JBbmRyb2lkKSB7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGV2dCkge1xuICAgIGlmIChpZ25vcmVOZXh0Q2xpY2spIHtcbiAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXZ0LnN0b3BQcm9wYWdhdGlvbiAmJiBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBldnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uICYmIGV2dC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgIGlnbm9yZU5leHRDbGljayA9IGZhbHNlO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSwgdHJ1ZSk7XG59XG52YXIgbmVhcmVzdEVtcHR5SW5zZXJ0RGV0ZWN0RXZlbnQgPSBmdW5jdGlvbiBuZWFyZXN0RW1wdHlJbnNlcnREZXRlY3RFdmVudChldnQpIHtcbiAgaWYgKGRyYWdFbCkge1xuICAgIGV2dCA9IGV2dC50b3VjaGVzID8gZXZ0LnRvdWNoZXNbMF0gOiBldnQ7XG4gICAgdmFyIG5lYXJlc3QgPSBfZGV0ZWN0TmVhcmVzdEVtcHR5U29ydGFibGUoZXZ0LmNsaWVudFgsIGV2dC5jbGllbnRZKTtcbiAgICBpZiAobmVhcmVzdCkge1xuICAgICAgLy8gQ3JlYXRlIGltaXRhdGlvbiBldmVudFxuICAgICAgdmFyIGV2ZW50ID0ge307XG4gICAgICBmb3IgKHZhciBpIGluIGV2dCkge1xuICAgICAgICBpZiAoZXZ0Lmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgZXZlbnRbaV0gPSBldnRbaV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGV2ZW50LnRhcmdldCA9IGV2ZW50LnJvb3RFbCA9IG5lYXJlc3Q7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCA9IHZvaWQgMDtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbiA9IHZvaWQgMDtcbiAgICAgIG5lYXJlc3RbZXhwYW5kb10uX29uRHJhZ092ZXIoZXZlbnQpO1xuICAgIH1cbiAgfVxufTtcbnZhciBfY2hlY2tPdXRzaWRlVGFyZ2V0RWwgPSBmdW5jdGlvbiBfY2hlY2tPdXRzaWRlVGFyZ2V0RWwoZXZ0KSB7XG4gIGlmIChkcmFnRWwpIHtcbiAgICBkcmFnRWwucGFyZW50Tm9kZVtleHBhbmRvXS5faXNPdXRzaWRlVGhpc0VsKGV2dC50YXJnZXQpO1xuICB9XG59O1xuXG4vKipcclxuICogQGNsYXNzICBTb3J0YWJsZVxyXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gIGVsXHJcbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgW29wdGlvbnNdXHJcbiAqL1xuZnVuY3Rpb24gU29ydGFibGUoZWwsIG9wdGlvbnMpIHtcbiAgaWYgKCEoZWwgJiYgZWwubm9kZVR5cGUgJiYgZWwubm9kZVR5cGUgPT09IDEpKSB7XG4gICAgdGhyb3cgXCJTb3J0YWJsZTogYGVsYCBtdXN0IGJlIGFuIEhUTUxFbGVtZW50LCBub3QgXCIuY29uY2F0KHt9LnRvU3RyaW5nLmNhbGwoZWwpKTtcbiAgfVxuICB0aGlzLmVsID0gZWw7IC8vIHJvb3QgZWxlbWVudFxuICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zID0gX2V4dGVuZHMoe30sIG9wdGlvbnMpO1xuXG4gIC8vIEV4cG9ydCBpbnN0YW5jZVxuICBlbFtleHBhbmRvXSA9IHRoaXM7XG4gIHZhciBkZWZhdWx0cyA9IHtcbiAgICBncm91cDogbnVsbCxcbiAgICBzb3J0OiB0cnVlLFxuICAgIGRpc2FibGVkOiBmYWxzZSxcbiAgICBzdG9yZTogbnVsbCxcbiAgICBoYW5kbGU6IG51bGwsXG4gICAgZHJhZ2dhYmxlOiAvXlt1b11sJC9pLnRlc3QoZWwubm9kZU5hbWUpID8gJz5saScgOiAnPionLFxuICAgIHN3YXBUaHJlc2hvbGQ6IDEsXG4gICAgLy8gcGVyY2VudGFnZTsgMCA8PSB4IDw9IDFcbiAgICBpbnZlcnRTd2FwOiBmYWxzZSxcbiAgICAvLyBpbnZlcnQgYWx3YXlzXG4gICAgaW52ZXJ0ZWRTd2FwVGhyZXNob2xkOiBudWxsLFxuICAgIC8vIHdpbGwgYmUgc2V0IHRvIHNhbWUgYXMgc3dhcFRocmVzaG9sZCBpZiBkZWZhdWx0XG4gICAgcmVtb3ZlQ2xvbmVPbkhpZGU6IHRydWUsXG4gICAgZGlyZWN0aW9uOiBmdW5jdGlvbiBkaXJlY3Rpb24oKSB7XG4gICAgICByZXR1cm4gX2RldGVjdERpcmVjdGlvbihlbCwgdGhpcy5vcHRpb25zKTtcbiAgICB9LFxuICAgIGdob3N0Q2xhc3M6ICdzb3J0YWJsZS1naG9zdCcsXG4gICAgY2hvc2VuQ2xhc3M6ICdzb3J0YWJsZS1jaG9zZW4nLFxuICAgIGRyYWdDbGFzczogJ3NvcnRhYmxlLWRyYWcnLFxuICAgIGlnbm9yZTogJ2EsIGltZycsXG4gICAgZmlsdGVyOiBudWxsLFxuICAgIHByZXZlbnRPbkZpbHRlcjogdHJ1ZSxcbiAgICBhbmltYXRpb246IDAsXG4gICAgZWFzaW5nOiBudWxsLFxuICAgIHNldERhdGE6IGZ1bmN0aW9uIHNldERhdGEoZGF0YVRyYW5zZmVyLCBkcmFnRWwpIHtcbiAgICAgIGRhdGFUcmFuc2Zlci5zZXREYXRhKCdUZXh0JywgZHJhZ0VsLnRleHRDb250ZW50KTtcbiAgICB9LFxuICAgIGRyb3BCdWJibGU6IGZhbHNlLFxuICAgIGRyYWdvdmVyQnViYmxlOiBmYWxzZSxcbiAgICBkYXRhSWRBdHRyOiAnZGF0YS1pZCcsXG4gICAgZGVsYXk6IDAsXG4gICAgZGVsYXlPblRvdWNoT25seTogZmFsc2UsXG4gICAgdG91Y2hTdGFydFRocmVzaG9sZDogKE51bWJlci5wYXJzZUludCA/IE51bWJlciA6IHdpbmRvdykucGFyc2VJbnQod2luZG93LmRldmljZVBpeGVsUmF0aW8sIDEwKSB8fCAxLFxuICAgIGZvcmNlRmFsbGJhY2s6IGZhbHNlLFxuICAgIGZhbGxiYWNrQ2xhc3M6ICdzb3J0YWJsZS1mYWxsYmFjaycsXG4gICAgZmFsbGJhY2tPbkJvZHk6IGZhbHNlLFxuICAgIGZhbGxiYWNrVG9sZXJhbmNlOiAwLFxuICAgIGZhbGxiYWNrT2Zmc2V0OiB7XG4gICAgICB4OiAwLFxuICAgICAgeTogMFxuICAgIH0sXG4gICAgc3VwcG9ydFBvaW50ZXI6IFNvcnRhYmxlLnN1cHBvcnRQb2ludGVyICE9PSBmYWxzZSAmJiAnUG9pbnRlckV2ZW50JyBpbiB3aW5kb3cgJiYgIVNhZmFyaSxcbiAgICBlbXB0eUluc2VydFRocmVzaG9sZDogNVxuICB9O1xuICBQbHVnaW5NYW5hZ2VyLmluaXRpYWxpemVQbHVnaW5zKHRoaXMsIGVsLCBkZWZhdWx0cyk7XG5cbiAgLy8gU2V0IGRlZmF1bHQgb3B0aW9uc1xuICBmb3IgKHZhciBuYW1lIGluIGRlZmF1bHRzKSB7XG4gICAgIShuYW1lIGluIG9wdGlvbnMpICYmIChvcHRpb25zW25hbWVdID0gZGVmYXVsdHNbbmFtZV0pO1xuICB9XG4gIF9wcmVwYXJlR3JvdXAob3B0aW9ucyk7XG5cbiAgLy8gQmluZCBhbGwgcHJpdmF0ZSBtZXRob2RzXG4gIGZvciAodmFyIGZuIGluIHRoaXMpIHtcbiAgICBpZiAoZm4uY2hhckF0KDApID09PSAnXycgJiYgdHlwZW9mIHRoaXNbZm5dID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzW2ZuXSA9IHRoaXNbZm5dLmJpbmQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgLy8gU2V0dXAgZHJhZyBtb2RlXG4gIHRoaXMubmF0aXZlRHJhZ2dhYmxlID0gb3B0aW9ucy5mb3JjZUZhbGxiYWNrID8gZmFsc2UgOiBzdXBwb3J0RHJhZ2dhYmxlO1xuICBpZiAodGhpcy5uYXRpdmVEcmFnZ2FibGUpIHtcbiAgICAvLyBUb3VjaCBzdGFydCB0aHJlc2hvbGQgY2Fubm90IGJlIGdyZWF0ZXIgdGhhbiB0aGUgbmF0aXZlIGRyYWdzdGFydCB0aHJlc2hvbGRcbiAgICB0aGlzLm9wdGlvbnMudG91Y2hTdGFydFRocmVzaG9sZCA9IDE7XG4gIH1cblxuICAvLyBCaW5kIGV2ZW50c1xuICBpZiAob3B0aW9ucy5zdXBwb3J0UG9pbnRlcikge1xuICAgIG9uKGVsLCAncG9pbnRlcmRvd24nLCB0aGlzLl9vblRhcFN0YXJ0KTtcbiAgfSBlbHNlIHtcbiAgICBvbihlbCwgJ21vdXNlZG93bicsIHRoaXMuX29uVGFwU3RhcnQpO1xuICAgIG9uKGVsLCAndG91Y2hzdGFydCcsIHRoaXMuX29uVGFwU3RhcnQpO1xuICB9XG4gIGlmICh0aGlzLm5hdGl2ZURyYWdnYWJsZSkge1xuICAgIG9uKGVsLCAnZHJhZ292ZXInLCB0aGlzKTtcbiAgICBvbihlbCwgJ2RyYWdlbnRlcicsIHRoaXMpO1xuICB9XG4gIHNvcnRhYmxlcy5wdXNoKHRoaXMuZWwpO1xuXG4gIC8vIFJlc3RvcmUgc29ydGluZ1xuICBvcHRpb25zLnN0b3JlICYmIG9wdGlvbnMuc3RvcmUuZ2V0ICYmIHRoaXMuc29ydChvcHRpb25zLnN0b3JlLmdldCh0aGlzKSB8fCBbXSk7XG5cbiAgLy8gQWRkIGFuaW1hdGlvbiBzdGF0ZSBtYW5hZ2VyXG4gIF9leHRlbmRzKHRoaXMsIEFuaW1hdGlvblN0YXRlTWFuYWdlcigpKTtcbn1cblNvcnRhYmxlLnByb3RvdHlwZSA9IC8qKiBAbGVuZHMgU29ydGFibGUucHJvdG90eXBlICove1xuICBjb25zdHJ1Y3RvcjogU29ydGFibGUsXG4gIF9pc091dHNpZGVUaGlzRWw6IGZ1bmN0aW9uIF9pc091dHNpZGVUaGlzRWwodGFyZ2V0KSB7XG4gICAgaWYgKCF0aGlzLmVsLmNvbnRhaW5zKHRhcmdldCkgJiYgdGFyZ2V0ICE9PSB0aGlzLmVsKSB7XG4gICAgICBsYXN0VGFyZ2V0ID0gbnVsbDtcbiAgICB9XG4gIH0sXG4gIF9nZXREaXJlY3Rpb246IGZ1bmN0aW9uIF9nZXREaXJlY3Rpb24oZXZ0LCB0YXJnZXQpIHtcbiAgICByZXR1cm4gdHlwZW9mIHRoaXMub3B0aW9ucy5kaXJlY3Rpb24gPT09ICdmdW5jdGlvbicgPyB0aGlzLm9wdGlvbnMuZGlyZWN0aW9uLmNhbGwodGhpcywgZXZ0LCB0YXJnZXQsIGRyYWdFbCkgOiB0aGlzLm9wdGlvbnMuZGlyZWN0aW9uO1xuICB9LFxuICBfb25UYXBTdGFydDogZnVuY3Rpb24gX29uVGFwU3RhcnQoIC8qKiBFdmVudHxUb3VjaEV2ZW50ICovZXZ0KSB7XG4gICAgaWYgKCFldnQuY2FuY2VsYWJsZSkgcmV0dXJuO1xuICAgIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICBlbCA9IHRoaXMuZWwsXG4gICAgICBvcHRpb25zID0gdGhpcy5vcHRpb25zLFxuICAgICAgcHJldmVudE9uRmlsdGVyID0gb3B0aW9ucy5wcmV2ZW50T25GaWx0ZXIsXG4gICAgICB0eXBlID0gZXZ0LnR5cGUsXG4gICAgICB0b3VjaCA9IGV2dC50b3VjaGVzICYmIGV2dC50b3VjaGVzWzBdIHx8IGV2dC5wb2ludGVyVHlwZSAmJiBldnQucG9pbnRlclR5cGUgPT09ICd0b3VjaCcgJiYgZXZ0LFxuICAgICAgdGFyZ2V0ID0gKHRvdWNoIHx8IGV2dCkudGFyZ2V0LFxuICAgICAgb3JpZ2luYWxUYXJnZXQgPSBldnQudGFyZ2V0LnNoYWRvd1Jvb3QgJiYgKGV2dC5wYXRoICYmIGV2dC5wYXRoWzBdIHx8IGV2dC5jb21wb3NlZFBhdGggJiYgZXZ0LmNvbXBvc2VkUGF0aCgpWzBdKSB8fCB0YXJnZXQsXG4gICAgICBmaWx0ZXIgPSBvcHRpb25zLmZpbHRlcjtcbiAgICBfc2F2ZUlucHV0Q2hlY2tlZFN0YXRlKGVsKTtcblxuICAgIC8vIERvbid0IHRyaWdnZXIgc3RhcnQgZXZlbnQgd2hlbiBhbiBlbGVtZW50IGlzIGJlZW4gZHJhZ2dlZCwgb3RoZXJ3aXNlIHRoZSBldnQub2xkaW5kZXggYWx3YXlzIHdyb25nIHdoZW4gc2V0IG9wdGlvbi5ncm91cC5cbiAgICBpZiAoZHJhZ0VsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICgvbW91c2Vkb3dufHBvaW50ZXJkb3duLy50ZXN0KHR5cGUpICYmIGV2dC5idXR0b24gIT09IDAgfHwgb3B0aW9ucy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuOyAvLyBvbmx5IGxlZnQgYnV0dG9uIGFuZCBlbmFibGVkXG4gICAgfVxuXG4gICAgLy8gY2FuY2VsIGRuZCBpZiBvcmlnaW5hbCB0YXJnZXQgaXMgY29udGVudCBlZGl0YWJsZVxuICAgIGlmIChvcmlnaW5hbFRhcmdldC5pc0NvbnRlbnRFZGl0YWJsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFNhZmFyaSBpZ25vcmVzIGZ1cnRoZXIgZXZlbnQgaGFuZGxpbmcgYWZ0ZXIgbW91c2Vkb3duXG4gICAgaWYgKCF0aGlzLm5hdGl2ZURyYWdnYWJsZSAmJiBTYWZhcmkgJiYgdGFyZ2V0ICYmIHRhcmdldC50YWdOYW1lLnRvVXBwZXJDYXNlKCkgPT09ICdTRUxFQ1QnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRhcmdldCA9IGNsb3Nlc3QodGFyZ2V0LCBvcHRpb25zLmRyYWdnYWJsZSwgZWwsIGZhbHNlKTtcbiAgICBpZiAodGFyZ2V0ICYmIHRhcmdldC5hbmltYXRlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobGFzdERvd25FbCA9PT0gdGFyZ2V0KSB7XG4gICAgICAvLyBJZ25vcmluZyBkdXBsaWNhdGUgYGRvd25gXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gR2V0IHRoZSBpbmRleCBvZiB0aGUgZHJhZ2dlZCBlbGVtZW50IHdpdGhpbiBpdHMgcGFyZW50XG4gICAgb2xkSW5kZXggPSBpbmRleCh0YXJnZXQpO1xuICAgIG9sZERyYWdnYWJsZUluZGV4ID0gaW5kZXgodGFyZ2V0LCBvcHRpb25zLmRyYWdnYWJsZSk7XG5cbiAgICAvLyBDaGVjayBmaWx0ZXJcbiAgICBpZiAodHlwZW9mIGZpbHRlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaWYgKGZpbHRlci5jYWxsKHRoaXMsIGV2dCwgdGFyZ2V0LCB0aGlzKSkge1xuICAgICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgc29ydGFibGU6IF90aGlzLFxuICAgICAgICAgIHJvb3RFbDogb3JpZ2luYWxUYXJnZXQsXG4gICAgICAgICAgbmFtZTogJ2ZpbHRlcicsXG4gICAgICAgICAgdGFyZ2V0RWw6IHRhcmdldCxcbiAgICAgICAgICB0b0VsOiBlbCxcbiAgICAgICAgICBmcm9tRWw6IGVsXG4gICAgICAgIH0pO1xuICAgICAgICBwbHVnaW5FdmVudCgnZmlsdGVyJywgX3RoaXMsIHtcbiAgICAgICAgICBldnQ6IGV2dFxuICAgICAgICB9KTtcbiAgICAgICAgcHJldmVudE9uRmlsdGVyICYmIGV2dC5jYW5jZWxhYmxlICYmIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICByZXR1cm47IC8vIGNhbmNlbCBkbmRcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGZpbHRlcikge1xuICAgICAgZmlsdGVyID0gZmlsdGVyLnNwbGl0KCcsJykuc29tZShmdW5jdGlvbiAoY3JpdGVyaWEpIHtcbiAgICAgICAgY3JpdGVyaWEgPSBjbG9zZXN0KG9yaWdpbmFsVGFyZ2V0LCBjcml0ZXJpYS50cmltKCksIGVsLCBmYWxzZSk7XG4gICAgICAgIGlmIChjcml0ZXJpYSkge1xuICAgICAgICAgIF9kaXNwYXRjaEV2ZW50KHtcbiAgICAgICAgICAgIHNvcnRhYmxlOiBfdGhpcyxcbiAgICAgICAgICAgIHJvb3RFbDogY3JpdGVyaWEsXG4gICAgICAgICAgICBuYW1lOiAnZmlsdGVyJyxcbiAgICAgICAgICAgIHRhcmdldEVsOiB0YXJnZXQsXG4gICAgICAgICAgICBmcm9tRWw6IGVsLFxuICAgICAgICAgICAgdG9FbDogZWxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBwbHVnaW5FdmVudCgnZmlsdGVyJywgX3RoaXMsIHtcbiAgICAgICAgICAgIGV2dDogZXZ0XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgaWYgKGZpbHRlcikge1xuICAgICAgICBwcmV2ZW50T25GaWx0ZXIgJiYgZXZ0LmNhbmNlbGFibGUgJiYgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHJldHVybjsgLy8gY2FuY2VsIGRuZFxuICAgICAgfVxuICAgIH1cbiAgICBpZiAob3B0aW9ucy5oYW5kbGUgJiYgIWNsb3Nlc3Qob3JpZ2luYWxUYXJnZXQsIG9wdGlvbnMuaGFuZGxlLCBlbCwgZmFsc2UpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUHJlcGFyZSBgZHJhZ3N0YXJ0YFxuICAgIHRoaXMuX3ByZXBhcmVEcmFnU3RhcnQoZXZ0LCB0b3VjaCwgdGFyZ2V0KTtcbiAgfSxcbiAgX3ByZXBhcmVEcmFnU3RhcnQ6IGZ1bmN0aW9uIF9wcmVwYXJlRHJhZ1N0YXJ0KCAvKiogRXZlbnQgKi9ldnQsIC8qKiBUb3VjaCAqL3RvdWNoLCAvKiogSFRNTEVsZW1lbnQgKi90YXJnZXQpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgZWwgPSBfdGhpcy5lbCxcbiAgICAgIG9wdGlvbnMgPSBfdGhpcy5vcHRpb25zLFxuICAgICAgb3duZXJEb2N1bWVudCA9IGVsLm93bmVyRG9jdW1lbnQsXG4gICAgICBkcmFnU3RhcnRGbjtcbiAgICBpZiAodGFyZ2V0ICYmICFkcmFnRWwgJiYgdGFyZ2V0LnBhcmVudE5vZGUgPT09IGVsKSB7XG4gICAgICB2YXIgZHJhZ1JlY3QgPSBnZXRSZWN0KHRhcmdldCk7XG4gICAgICByb290RWwgPSBlbDtcbiAgICAgIGRyYWdFbCA9IHRhcmdldDtcbiAgICAgIHBhcmVudEVsID0gZHJhZ0VsLnBhcmVudE5vZGU7XG4gICAgICBuZXh0RWwgPSBkcmFnRWwubmV4dFNpYmxpbmc7XG4gICAgICBsYXN0RG93bkVsID0gdGFyZ2V0O1xuICAgICAgYWN0aXZlR3JvdXAgPSBvcHRpb25zLmdyb3VwO1xuICAgICAgU29ydGFibGUuZHJhZ2dlZCA9IGRyYWdFbDtcbiAgICAgIHRhcEV2dCA9IHtcbiAgICAgICAgdGFyZ2V0OiBkcmFnRWwsXG4gICAgICAgIGNsaWVudFg6ICh0b3VjaCB8fCBldnQpLmNsaWVudFgsXG4gICAgICAgIGNsaWVudFk6ICh0b3VjaCB8fCBldnQpLmNsaWVudFlcbiAgICAgIH07XG4gICAgICB0YXBEaXN0YW5jZUxlZnQgPSB0YXBFdnQuY2xpZW50WCAtIGRyYWdSZWN0LmxlZnQ7XG4gICAgICB0YXBEaXN0YW5jZVRvcCA9IHRhcEV2dC5jbGllbnRZIC0gZHJhZ1JlY3QudG9wO1xuICAgICAgdGhpcy5fbGFzdFggPSAodG91Y2ggfHwgZXZ0KS5jbGllbnRYO1xuICAgICAgdGhpcy5fbGFzdFkgPSAodG91Y2ggfHwgZXZ0KS5jbGllbnRZO1xuICAgICAgZHJhZ0VsLnN0eWxlWyd3aWxsLWNoYW5nZSddID0gJ2FsbCc7XG4gICAgICBkcmFnU3RhcnRGbiA9IGZ1bmN0aW9uIGRyYWdTdGFydEZuKCkge1xuICAgICAgICBwbHVnaW5FdmVudCgnZGVsYXlFbmRlZCcsIF90aGlzLCB7XG4gICAgICAgICAgZXZ0OiBldnRcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChTb3J0YWJsZS5ldmVudENhbmNlbGVkKSB7XG4gICAgICAgICAgX3RoaXMuX29uRHJvcCgpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBEZWxheWVkIGRyYWcgaGFzIGJlZW4gdHJpZ2dlcmVkXG4gICAgICAgIC8vIHdlIGNhbiByZS1lbmFibGUgdGhlIGV2ZW50czogdG91Y2htb3ZlL21vdXNlbW92ZVxuICAgICAgICBfdGhpcy5fZGlzYWJsZURlbGF5ZWREcmFnRXZlbnRzKCk7XG4gICAgICAgIGlmICghRmlyZUZveCAmJiBfdGhpcy5uYXRpdmVEcmFnZ2FibGUpIHtcbiAgICAgICAgICBkcmFnRWwuZHJhZ2dhYmxlID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJpbmQgdGhlIGV2ZW50czogZHJhZ3N0YXJ0L2RyYWdlbmRcbiAgICAgICAgX3RoaXMuX3RyaWdnZXJEcmFnU3RhcnQoZXZ0LCB0b3VjaCk7XG5cbiAgICAgICAgLy8gRHJhZyBzdGFydCBldmVudFxuICAgICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgc29ydGFibGU6IF90aGlzLFxuICAgICAgICAgIG5hbWU6ICdjaG9vc2UnLFxuICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDaG9zZW4gaXRlbVxuICAgICAgICB0b2dnbGVDbGFzcyhkcmFnRWwsIG9wdGlvbnMuY2hvc2VuQ2xhc3MsIHRydWUpO1xuICAgICAgfTtcblxuICAgICAgLy8gRGlzYWJsZSBcImRyYWdnYWJsZVwiXG4gICAgICBvcHRpb25zLmlnbm9yZS5zcGxpdCgnLCcpLmZvckVhY2goZnVuY3Rpb24gKGNyaXRlcmlhKSB7XG4gICAgICAgIGZpbmQoZHJhZ0VsLCBjcml0ZXJpYS50cmltKCksIF9kaXNhYmxlRHJhZ2dhYmxlKTtcbiAgICAgIH0pO1xuICAgICAgb24ob3duZXJEb2N1bWVudCwgJ2RyYWdvdmVyJywgbmVhcmVzdEVtcHR5SW5zZXJ0RGV0ZWN0RXZlbnQpO1xuICAgICAgb24ob3duZXJEb2N1bWVudCwgJ21vdXNlbW92ZScsIG5lYXJlc3RFbXB0eUluc2VydERldGVjdEV2ZW50KTtcbiAgICAgIG9uKG93bmVyRG9jdW1lbnQsICd0b3VjaG1vdmUnLCBuZWFyZXN0RW1wdHlJbnNlcnREZXRlY3RFdmVudCk7XG4gICAgICBvbihvd25lckRvY3VtZW50LCAnbW91c2V1cCcsIF90aGlzLl9vbkRyb3ApO1xuICAgICAgb24ob3duZXJEb2N1bWVudCwgJ3RvdWNoZW5kJywgX3RoaXMuX29uRHJvcCk7XG4gICAgICBvbihvd25lckRvY3VtZW50LCAndG91Y2hjYW5jZWwnLCBfdGhpcy5fb25Ecm9wKTtcblxuICAgICAgLy8gTWFrZSBkcmFnRWwgZHJhZ2dhYmxlIChtdXN0IGJlIGJlZm9yZSBkZWxheSBmb3IgRmlyZUZveClcbiAgICAgIGlmIChGaXJlRm94ICYmIHRoaXMubmF0aXZlRHJhZ2dhYmxlKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy50b3VjaFN0YXJ0VGhyZXNob2xkID0gNDtcbiAgICAgICAgZHJhZ0VsLmRyYWdnYWJsZSA9IHRydWU7XG4gICAgICB9XG4gICAgICBwbHVnaW5FdmVudCgnZGVsYXlTdGFydCcsIHRoaXMsIHtcbiAgICAgICAgZXZ0OiBldnRcbiAgICAgIH0pO1xuXG4gICAgICAvLyBEZWxheSBpcyBpbXBvc3NpYmxlIGZvciBuYXRpdmUgRG5EIGluIEVkZ2Ugb3IgSUVcbiAgICAgIGlmIChvcHRpb25zLmRlbGF5ICYmICghb3B0aW9ucy5kZWxheU9uVG91Y2hPbmx5IHx8IHRvdWNoKSAmJiAoIXRoaXMubmF0aXZlRHJhZ2dhYmxlIHx8ICEoRWRnZSB8fCBJRTExT3JMZXNzKSkpIHtcbiAgICAgICAgaWYgKFNvcnRhYmxlLmV2ZW50Q2FuY2VsZWQpIHtcbiAgICAgICAgICB0aGlzLl9vbkRyb3AoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgdGhlIHVzZXIgbW92ZXMgdGhlIHBvaW50ZXIgb3IgbGV0IGdvIHRoZSBjbGljayBvciB0b3VjaFxuICAgICAgICAvLyBiZWZvcmUgdGhlIGRlbGF5IGhhcyBiZWVuIHJlYWNoZWQ6XG4gICAgICAgIC8vIGRpc2FibGUgdGhlIGRlbGF5ZWQgZHJhZ1xuICAgICAgICBvbihvd25lckRvY3VtZW50LCAnbW91c2V1cCcsIF90aGlzLl9kaXNhYmxlRGVsYXllZERyYWcpO1xuICAgICAgICBvbihvd25lckRvY3VtZW50LCAndG91Y2hlbmQnLCBfdGhpcy5fZGlzYWJsZURlbGF5ZWREcmFnKTtcbiAgICAgICAgb24ob3duZXJEb2N1bWVudCwgJ3RvdWNoY2FuY2VsJywgX3RoaXMuX2Rpc2FibGVEZWxheWVkRHJhZyk7XG4gICAgICAgIG9uKG93bmVyRG9jdW1lbnQsICdtb3VzZW1vdmUnLCBfdGhpcy5fZGVsYXllZERyYWdUb3VjaE1vdmVIYW5kbGVyKTtcbiAgICAgICAgb24ob3duZXJEb2N1bWVudCwgJ3RvdWNobW92ZScsIF90aGlzLl9kZWxheWVkRHJhZ1RvdWNoTW92ZUhhbmRsZXIpO1xuICAgICAgICBvcHRpb25zLnN1cHBvcnRQb2ludGVyICYmIG9uKG93bmVyRG9jdW1lbnQsICdwb2ludGVybW92ZScsIF90aGlzLl9kZWxheWVkRHJhZ1RvdWNoTW92ZUhhbmRsZXIpO1xuICAgICAgICBfdGhpcy5fZHJhZ1N0YXJ0VGltZXIgPSBzZXRUaW1lb3V0KGRyYWdTdGFydEZuLCBvcHRpb25zLmRlbGF5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRyYWdTdGFydEZuKCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBfZGVsYXllZERyYWdUb3VjaE1vdmVIYW5kbGVyOiBmdW5jdGlvbiBfZGVsYXllZERyYWdUb3VjaE1vdmVIYW5kbGVyKCAvKiogVG91Y2hFdmVudHxQb2ludGVyRXZlbnQgKiovZSkge1xuICAgIHZhciB0b3VjaCA9IGUudG91Y2hlcyA/IGUudG91Y2hlc1swXSA6IGU7XG4gICAgaWYgKE1hdGgubWF4KE1hdGguYWJzKHRvdWNoLmNsaWVudFggLSB0aGlzLl9sYXN0WCksIE1hdGguYWJzKHRvdWNoLmNsaWVudFkgLSB0aGlzLl9sYXN0WSkpID49IE1hdGguZmxvb3IodGhpcy5vcHRpb25zLnRvdWNoU3RhcnRUaHJlc2hvbGQgLyAodGhpcy5uYXRpdmVEcmFnZ2FibGUgJiYgd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgMSkpKSB7XG4gICAgICB0aGlzLl9kaXNhYmxlRGVsYXllZERyYWcoKTtcbiAgICB9XG4gIH0sXG4gIF9kaXNhYmxlRGVsYXllZERyYWc6IGZ1bmN0aW9uIF9kaXNhYmxlRGVsYXllZERyYWcoKSB7XG4gICAgZHJhZ0VsICYmIF9kaXNhYmxlRHJhZ2dhYmxlKGRyYWdFbCk7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX2RyYWdTdGFydFRpbWVyKTtcbiAgICB0aGlzLl9kaXNhYmxlRGVsYXllZERyYWdFdmVudHMoKTtcbiAgfSxcbiAgX2Rpc2FibGVEZWxheWVkRHJhZ0V2ZW50czogZnVuY3Rpb24gX2Rpc2FibGVEZWxheWVkRHJhZ0V2ZW50cygpIHtcbiAgICB2YXIgb3duZXJEb2N1bWVudCA9IHRoaXMuZWwub3duZXJEb2N1bWVudDtcbiAgICBvZmYob3duZXJEb2N1bWVudCwgJ21vdXNldXAnLCB0aGlzLl9kaXNhYmxlRGVsYXllZERyYWcpO1xuICAgIG9mZihvd25lckRvY3VtZW50LCAndG91Y2hlbmQnLCB0aGlzLl9kaXNhYmxlRGVsYXllZERyYWcpO1xuICAgIG9mZihvd25lckRvY3VtZW50LCAndG91Y2hjYW5jZWwnLCB0aGlzLl9kaXNhYmxlRGVsYXllZERyYWcpO1xuICAgIG9mZihvd25lckRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5fZGVsYXllZERyYWdUb3VjaE1vdmVIYW5kbGVyKTtcbiAgICBvZmYob3duZXJEb2N1bWVudCwgJ3RvdWNobW92ZScsIHRoaXMuX2RlbGF5ZWREcmFnVG91Y2hNb3ZlSGFuZGxlcik7XG4gICAgb2ZmKG93bmVyRG9jdW1lbnQsICdwb2ludGVybW92ZScsIHRoaXMuX2RlbGF5ZWREcmFnVG91Y2hNb3ZlSGFuZGxlcik7XG4gIH0sXG4gIF90cmlnZ2VyRHJhZ1N0YXJ0OiBmdW5jdGlvbiBfdHJpZ2dlckRyYWdTdGFydCggLyoqIEV2ZW50ICovZXZ0LCAvKiogVG91Y2ggKi90b3VjaCkge1xuICAgIHRvdWNoID0gdG91Y2ggfHwgZXZ0LnBvaW50ZXJUeXBlID09ICd0b3VjaCcgJiYgZXZ0O1xuICAgIGlmICghdGhpcy5uYXRpdmVEcmFnZ2FibGUgfHwgdG91Y2gpIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuc3VwcG9ydFBvaW50ZXIpIHtcbiAgICAgICAgb24oZG9jdW1lbnQsICdwb2ludGVybW92ZScsIHRoaXMuX29uVG91Y2hNb3ZlKTtcbiAgICAgIH0gZWxzZSBpZiAodG91Y2gpIHtcbiAgICAgICAgb24oZG9jdW1lbnQsICd0b3VjaG1vdmUnLCB0aGlzLl9vblRvdWNoTW92ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvbihkb2N1bWVudCwgJ21vdXNlbW92ZScsIHRoaXMuX29uVG91Y2hNb3ZlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgb24oZHJhZ0VsLCAnZHJhZ2VuZCcsIHRoaXMpO1xuICAgICAgb24ocm9vdEVsLCAnZHJhZ3N0YXJ0JywgdGhpcy5fb25EcmFnU3RhcnQpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgaWYgKGRvY3VtZW50LnNlbGVjdGlvbikge1xuICAgICAgICAvLyBUaW1lb3V0IG5lY2Nlc3NhcnkgZm9yIElFOVxuICAgICAgICBfbmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGRvY3VtZW50LnNlbGVjdGlvbi5lbXB0eSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdpbmRvdy5nZXRTZWxlY3Rpb24oKS5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHt9XG4gIH0sXG4gIF9kcmFnU3RhcnRlZDogZnVuY3Rpb24gX2RyYWdTdGFydGVkKGZhbGxiYWNrLCBldnQpIHtcbiAgICBhd2FpdGluZ0RyYWdTdGFydGVkID0gZmFsc2U7XG4gICAgaWYgKHJvb3RFbCAmJiBkcmFnRWwpIHtcbiAgICAgIHBsdWdpbkV2ZW50KCdkcmFnU3RhcnRlZCcsIHRoaXMsIHtcbiAgICAgICAgZXZ0OiBldnRcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMubmF0aXZlRHJhZ2dhYmxlKSB7XG4gICAgICAgIG9uKGRvY3VtZW50LCAnZHJhZ292ZXInLCBfY2hlY2tPdXRzaWRlVGFyZ2V0RWwpO1xuICAgICAgfVxuICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG5cbiAgICAgIC8vIEFwcGx5IGVmZmVjdFxuICAgICAgIWZhbGxiYWNrICYmIHRvZ2dsZUNsYXNzKGRyYWdFbCwgb3B0aW9ucy5kcmFnQ2xhc3MsIGZhbHNlKTtcbiAgICAgIHRvZ2dsZUNsYXNzKGRyYWdFbCwgb3B0aW9ucy5naG9zdENsYXNzLCB0cnVlKTtcbiAgICAgIFNvcnRhYmxlLmFjdGl2ZSA9IHRoaXM7XG4gICAgICBmYWxsYmFjayAmJiB0aGlzLl9hcHBlbmRHaG9zdCgpO1xuXG4gICAgICAvLyBEcmFnIHN0YXJ0IGV2ZW50XG4gICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgIHNvcnRhYmxlOiB0aGlzLFxuICAgICAgICBuYW1lOiAnc3RhcnQnLFxuICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnRcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9udWxsaW5nKCk7XG4gICAgfVxuICB9LFxuICBfZW11bGF0ZURyYWdPdmVyOiBmdW5jdGlvbiBfZW11bGF0ZURyYWdPdmVyKCkge1xuICAgIGlmICh0b3VjaEV2dCkge1xuICAgICAgdGhpcy5fbGFzdFggPSB0b3VjaEV2dC5jbGllbnRYO1xuICAgICAgdGhpcy5fbGFzdFkgPSB0b3VjaEV2dC5jbGllbnRZO1xuICAgICAgX2hpZGVHaG9zdEZvclRhcmdldCgpO1xuICAgICAgdmFyIHRhcmdldCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQodG91Y2hFdnQuY2xpZW50WCwgdG91Y2hFdnQuY2xpZW50WSk7XG4gICAgICB2YXIgcGFyZW50ID0gdGFyZ2V0O1xuICAgICAgd2hpbGUgKHRhcmdldCAmJiB0YXJnZXQuc2hhZG93Um9vdCkge1xuICAgICAgICB0YXJnZXQgPSB0YXJnZXQuc2hhZG93Um9vdC5lbGVtZW50RnJvbVBvaW50KHRvdWNoRXZ0LmNsaWVudFgsIHRvdWNoRXZ0LmNsaWVudFkpO1xuICAgICAgICBpZiAodGFyZ2V0ID09PSBwYXJlbnQpIGJyZWFrO1xuICAgICAgICBwYXJlbnQgPSB0YXJnZXQ7XG4gICAgICB9XG4gICAgICBkcmFnRWwucGFyZW50Tm9kZVtleHBhbmRvXS5faXNPdXRzaWRlVGhpc0VsKHRhcmdldCk7XG4gICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICBpZiAocGFyZW50W2V4cGFuZG9dKSB7XG4gICAgICAgICAgICB2YXIgaW5zZXJ0ZWQgPSB2b2lkIDA7XG4gICAgICAgICAgICBpbnNlcnRlZCA9IHBhcmVudFtleHBhbmRvXS5fb25EcmFnT3Zlcih7XG4gICAgICAgICAgICAgIGNsaWVudFg6IHRvdWNoRXZ0LmNsaWVudFgsXG4gICAgICAgICAgICAgIGNsaWVudFk6IHRvdWNoRXZ0LmNsaWVudFksXG4gICAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0LFxuICAgICAgICAgICAgICByb290RWw6IHBhcmVudFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoaW5zZXJ0ZWQgJiYgIXRoaXMub3B0aW9ucy5kcmFnb3ZlckJ1YmJsZSkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgdGFyZ2V0ID0gcGFyZW50OyAvLyBzdG9yZSBsYXN0IGVsZW1lbnRcbiAgICAgICAgfVxuICAgICAgICAvKiBqc2hpbnQgYm9zczp0cnVlICovIHdoaWxlIChwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZSk7XG4gICAgICB9XG4gICAgICBfdW5oaWRlR2hvc3RGb3JUYXJnZXQoKTtcbiAgICB9XG4gIH0sXG4gIF9vblRvdWNoTW92ZTogZnVuY3Rpb24gX29uVG91Y2hNb3ZlKCAvKipUb3VjaEV2ZW50Ki9ldnQpIHtcbiAgICBpZiAodGFwRXZ0KSB7XG4gICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucyxcbiAgICAgICAgZmFsbGJhY2tUb2xlcmFuY2UgPSBvcHRpb25zLmZhbGxiYWNrVG9sZXJhbmNlLFxuICAgICAgICBmYWxsYmFja09mZnNldCA9IG9wdGlvbnMuZmFsbGJhY2tPZmZzZXQsXG4gICAgICAgIHRvdWNoID0gZXZ0LnRvdWNoZXMgPyBldnQudG91Y2hlc1swXSA6IGV2dCxcbiAgICAgICAgZ2hvc3RNYXRyaXggPSBnaG9zdEVsICYmIG1hdHJpeChnaG9zdEVsLCB0cnVlKSxcbiAgICAgICAgc2NhbGVYID0gZ2hvc3RFbCAmJiBnaG9zdE1hdHJpeCAmJiBnaG9zdE1hdHJpeC5hLFxuICAgICAgICBzY2FsZVkgPSBnaG9zdEVsICYmIGdob3N0TWF0cml4ICYmIGdob3N0TWF0cml4LmQsXG4gICAgICAgIHJlbGF0aXZlU2Nyb2xsT2Zmc2V0ID0gUG9zaXRpb25HaG9zdEFic29sdXRlbHkgJiYgZ2hvc3RSZWxhdGl2ZVBhcmVudCAmJiBnZXRSZWxhdGl2ZVNjcm9sbE9mZnNldChnaG9zdFJlbGF0aXZlUGFyZW50KSxcbiAgICAgICAgZHggPSAodG91Y2guY2xpZW50WCAtIHRhcEV2dC5jbGllbnRYICsgZmFsbGJhY2tPZmZzZXQueCkgLyAoc2NhbGVYIHx8IDEpICsgKHJlbGF0aXZlU2Nyb2xsT2Zmc2V0ID8gcmVsYXRpdmVTY3JvbGxPZmZzZXRbMF0gLSBnaG9zdFJlbGF0aXZlUGFyZW50SW5pdGlhbFNjcm9sbFswXSA6IDApIC8gKHNjYWxlWCB8fCAxKSxcbiAgICAgICAgZHkgPSAodG91Y2guY2xpZW50WSAtIHRhcEV2dC5jbGllbnRZICsgZmFsbGJhY2tPZmZzZXQueSkgLyAoc2NhbGVZIHx8IDEpICsgKHJlbGF0aXZlU2Nyb2xsT2Zmc2V0ID8gcmVsYXRpdmVTY3JvbGxPZmZzZXRbMV0gLSBnaG9zdFJlbGF0aXZlUGFyZW50SW5pdGlhbFNjcm9sbFsxXSA6IDApIC8gKHNjYWxlWSB8fCAxKTtcblxuICAgICAgLy8gb25seSBzZXQgdGhlIHN0YXR1cyB0byBkcmFnZ2luZywgd2hlbiB3ZSBhcmUgYWN0dWFsbHkgZHJhZ2dpbmdcbiAgICAgIGlmICghU29ydGFibGUuYWN0aXZlICYmICFhd2FpdGluZ0RyYWdTdGFydGVkKSB7XG4gICAgICAgIGlmIChmYWxsYmFja1RvbGVyYW5jZSAmJiBNYXRoLm1heChNYXRoLmFicyh0b3VjaC5jbGllbnRYIC0gdGhpcy5fbGFzdFgpLCBNYXRoLmFicyh0b3VjaC5jbGllbnRZIC0gdGhpcy5fbGFzdFkpKSA8IGZhbGxiYWNrVG9sZXJhbmNlKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX29uRHJhZ1N0YXJ0KGV2dCwgdHJ1ZSk7XG4gICAgICB9XG4gICAgICBpZiAoZ2hvc3RFbCkge1xuICAgICAgICBpZiAoZ2hvc3RNYXRyaXgpIHtcbiAgICAgICAgICBnaG9zdE1hdHJpeC5lICs9IGR4IC0gKGxhc3REeCB8fCAwKTtcbiAgICAgICAgICBnaG9zdE1hdHJpeC5mICs9IGR5IC0gKGxhc3REeSB8fCAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBnaG9zdE1hdHJpeCA9IHtcbiAgICAgICAgICAgIGE6IDEsXG4gICAgICAgICAgICBiOiAwLFxuICAgICAgICAgICAgYzogMCxcbiAgICAgICAgICAgIGQ6IDEsXG4gICAgICAgICAgICBlOiBkeCxcbiAgICAgICAgICAgIGY6IGR5XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY3NzTWF0cml4ID0gXCJtYXRyaXgoXCIuY29uY2F0KGdob3N0TWF0cml4LmEsIFwiLFwiKS5jb25jYXQoZ2hvc3RNYXRyaXguYiwgXCIsXCIpLmNvbmNhdChnaG9zdE1hdHJpeC5jLCBcIixcIikuY29uY2F0KGdob3N0TWF0cml4LmQsIFwiLFwiKS5jb25jYXQoZ2hvc3RNYXRyaXguZSwgXCIsXCIpLmNvbmNhdChnaG9zdE1hdHJpeC5mLCBcIilcIik7XG4gICAgICAgIGNzcyhnaG9zdEVsLCAnd2Via2l0VHJhbnNmb3JtJywgY3NzTWF0cml4KTtcbiAgICAgICAgY3NzKGdob3N0RWwsICdtb3pUcmFuc2Zvcm0nLCBjc3NNYXRyaXgpO1xuICAgICAgICBjc3MoZ2hvc3RFbCwgJ21zVHJhbnNmb3JtJywgY3NzTWF0cml4KTtcbiAgICAgICAgY3NzKGdob3N0RWwsICd0cmFuc2Zvcm0nLCBjc3NNYXRyaXgpO1xuICAgICAgICBsYXN0RHggPSBkeDtcbiAgICAgICAgbGFzdER5ID0gZHk7XG4gICAgICAgIHRvdWNoRXZ0ID0gdG91Y2g7XG4gICAgICB9XG4gICAgICBldnQuY2FuY2VsYWJsZSAmJiBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gIH0sXG4gIF9hcHBlbmRHaG9zdDogZnVuY3Rpb24gX2FwcGVuZEdob3N0KCkge1xuICAgIC8vIEJ1ZyBpZiB1c2luZyBzY2FsZSgpOiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yNjM3MDU4XG4gICAgLy8gTm90IGJlaW5nIGFkanVzdGVkIGZvclxuICAgIGlmICghZ2hvc3RFbCkge1xuICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMub3B0aW9ucy5mYWxsYmFja09uQm9keSA/IGRvY3VtZW50LmJvZHkgOiByb290RWwsXG4gICAgICAgIHJlY3QgPSBnZXRSZWN0KGRyYWdFbCwgdHJ1ZSwgUG9zaXRpb25HaG9zdEFic29sdXRlbHksIHRydWUsIGNvbnRhaW5lciksXG4gICAgICAgIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG5cbiAgICAgIC8vIFBvc2l0aW9uIGFic29sdXRlbHlcbiAgICAgIGlmIChQb3NpdGlvbkdob3N0QWJzb2x1dGVseSkge1xuICAgICAgICAvLyBHZXQgcmVsYXRpdmVseSBwb3NpdGlvbmVkIHBhcmVudFxuICAgICAgICBnaG9zdFJlbGF0aXZlUGFyZW50ID0gY29udGFpbmVyO1xuICAgICAgICB3aGlsZSAoY3NzKGdob3N0UmVsYXRpdmVQYXJlbnQsICdwb3NpdGlvbicpID09PSAnc3RhdGljJyAmJiBjc3MoZ2hvc3RSZWxhdGl2ZVBhcmVudCwgJ3RyYW5zZm9ybScpID09PSAnbm9uZScgJiYgZ2hvc3RSZWxhdGl2ZVBhcmVudCAhPT0gZG9jdW1lbnQpIHtcbiAgICAgICAgICBnaG9zdFJlbGF0aXZlUGFyZW50ID0gZ2hvc3RSZWxhdGl2ZVBhcmVudC5wYXJlbnROb2RlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChnaG9zdFJlbGF0aXZlUGFyZW50ICE9PSBkb2N1bWVudC5ib2R5ICYmIGdob3N0UmVsYXRpdmVQYXJlbnQgIT09IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkge1xuICAgICAgICAgIGlmIChnaG9zdFJlbGF0aXZlUGFyZW50ID09PSBkb2N1bWVudCkgZ2hvc3RSZWxhdGl2ZVBhcmVudCA9IGdldFdpbmRvd1Njcm9sbGluZ0VsZW1lbnQoKTtcbiAgICAgICAgICByZWN0LnRvcCArPSBnaG9zdFJlbGF0aXZlUGFyZW50LnNjcm9sbFRvcDtcbiAgICAgICAgICByZWN0LmxlZnQgKz0gZ2hvc3RSZWxhdGl2ZVBhcmVudC5zY3JvbGxMZWZ0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGdob3N0UmVsYXRpdmVQYXJlbnQgPSBnZXRXaW5kb3dTY3JvbGxpbmdFbGVtZW50KCk7XG4gICAgICAgIH1cbiAgICAgICAgZ2hvc3RSZWxhdGl2ZVBhcmVudEluaXRpYWxTY3JvbGwgPSBnZXRSZWxhdGl2ZVNjcm9sbE9mZnNldChnaG9zdFJlbGF0aXZlUGFyZW50KTtcbiAgICAgIH1cbiAgICAgIGdob3N0RWwgPSBkcmFnRWwuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgdG9nZ2xlQ2xhc3MoZ2hvc3RFbCwgb3B0aW9ucy5naG9zdENsYXNzLCBmYWxzZSk7XG4gICAgICB0b2dnbGVDbGFzcyhnaG9zdEVsLCBvcHRpb25zLmZhbGxiYWNrQ2xhc3MsIHRydWUpO1xuICAgICAgdG9nZ2xlQ2xhc3MoZ2hvc3RFbCwgb3B0aW9ucy5kcmFnQ2xhc3MsIHRydWUpO1xuICAgICAgY3NzKGdob3N0RWwsICd0cmFuc2l0aW9uJywgJycpO1xuICAgICAgY3NzKGdob3N0RWwsICd0cmFuc2Zvcm0nLCAnJyk7XG4gICAgICBjc3MoZ2hvc3RFbCwgJ2JveC1zaXppbmcnLCAnYm9yZGVyLWJveCcpO1xuICAgICAgY3NzKGdob3N0RWwsICdtYXJnaW4nLCAwKTtcbiAgICAgIGNzcyhnaG9zdEVsLCAndG9wJywgcmVjdC50b3ApO1xuICAgICAgY3NzKGdob3N0RWwsICdsZWZ0JywgcmVjdC5sZWZ0KTtcbiAgICAgIGNzcyhnaG9zdEVsLCAnd2lkdGgnLCByZWN0LndpZHRoKTtcbiAgICAgIGNzcyhnaG9zdEVsLCAnaGVpZ2h0JywgcmVjdC5oZWlnaHQpO1xuICAgICAgY3NzKGdob3N0RWwsICdvcGFjaXR5JywgJzAuOCcpO1xuICAgICAgY3NzKGdob3N0RWwsICdwb3NpdGlvbicsIFBvc2l0aW9uR2hvc3RBYnNvbHV0ZWx5ID8gJ2Fic29sdXRlJyA6ICdmaXhlZCcpO1xuICAgICAgY3NzKGdob3N0RWwsICd6SW5kZXgnLCAnMTAwMDAwJyk7XG4gICAgICBjc3MoZ2hvc3RFbCwgJ3BvaW50ZXJFdmVudHMnLCAnbm9uZScpO1xuICAgICAgU29ydGFibGUuZ2hvc3QgPSBnaG9zdEVsO1xuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGdob3N0RWwpO1xuXG4gICAgICAvLyBTZXQgdHJhbnNmb3JtLW9yaWdpblxuICAgICAgY3NzKGdob3N0RWwsICd0cmFuc2Zvcm0tb3JpZ2luJywgdGFwRGlzdGFuY2VMZWZ0IC8gcGFyc2VJbnQoZ2hvc3RFbC5zdHlsZS53aWR0aCkgKiAxMDAgKyAnJSAnICsgdGFwRGlzdGFuY2VUb3AgLyBwYXJzZUludChnaG9zdEVsLnN0eWxlLmhlaWdodCkgKiAxMDAgKyAnJScpO1xuICAgIH1cbiAgfSxcbiAgX29uRHJhZ1N0YXJ0OiBmdW5jdGlvbiBfb25EcmFnU3RhcnQoIC8qKkV2ZW50Ki9ldnQsIC8qKmJvb2xlYW4qL2ZhbGxiYWNrKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB2YXIgZGF0YVRyYW5zZmVyID0gZXZ0LmRhdGFUcmFuc2ZlcjtcbiAgICB2YXIgb3B0aW9ucyA9IF90aGlzLm9wdGlvbnM7XG4gICAgcGx1Z2luRXZlbnQoJ2RyYWdTdGFydCcsIHRoaXMsIHtcbiAgICAgIGV2dDogZXZ0XG4gICAgfSk7XG4gICAgaWYgKFNvcnRhYmxlLmV2ZW50Q2FuY2VsZWQpIHtcbiAgICAgIHRoaXMuX29uRHJvcCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBwbHVnaW5FdmVudCgnc2V0dXBDbG9uZScsIHRoaXMpO1xuICAgIGlmICghU29ydGFibGUuZXZlbnRDYW5jZWxlZCkge1xuICAgICAgY2xvbmVFbCA9IGNsb25lKGRyYWdFbCk7XG4gICAgICBjbG9uZUVsLnJlbW92ZUF0dHJpYnV0ZShcImlkXCIpO1xuICAgICAgY2xvbmVFbC5kcmFnZ2FibGUgPSBmYWxzZTtcbiAgICAgIGNsb25lRWwuc3R5bGVbJ3dpbGwtY2hhbmdlJ10gPSAnJztcbiAgICAgIHRoaXMuX2hpZGVDbG9uZSgpO1xuICAgICAgdG9nZ2xlQ2xhc3MoY2xvbmVFbCwgdGhpcy5vcHRpb25zLmNob3NlbkNsYXNzLCBmYWxzZSk7XG4gICAgICBTb3J0YWJsZS5jbG9uZSA9IGNsb25lRWw7XG4gICAgfVxuXG4gICAgLy8gIzExNDM6IElGcmFtZSBzdXBwb3J0IHdvcmthcm91bmRcbiAgICBfdGhpcy5jbG9uZUlkID0gX25leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgIHBsdWdpbkV2ZW50KCdjbG9uZScsIF90aGlzKTtcbiAgICAgIGlmIChTb3J0YWJsZS5ldmVudENhbmNlbGVkKSByZXR1cm47XG4gICAgICBpZiAoIV90aGlzLm9wdGlvbnMucmVtb3ZlQ2xvbmVPbkhpZGUpIHtcbiAgICAgICAgcm9vdEVsLmluc2VydEJlZm9yZShjbG9uZUVsLCBkcmFnRWwpO1xuICAgICAgfVxuICAgICAgX3RoaXMuX2hpZGVDbG9uZSgpO1xuICAgICAgX2Rpc3BhdGNoRXZlbnQoe1xuICAgICAgICBzb3J0YWJsZTogX3RoaXMsXG4gICAgICAgIG5hbWU6ICdjbG9uZSdcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgICFmYWxsYmFjayAmJiB0b2dnbGVDbGFzcyhkcmFnRWwsIG9wdGlvbnMuZHJhZ0NsYXNzLCB0cnVlKTtcblxuICAgIC8vIFNldCBwcm9wZXIgZHJvcCBldmVudHNcbiAgICBpZiAoZmFsbGJhY2spIHtcbiAgICAgIGlnbm9yZU5leHRDbGljayA9IHRydWU7XG4gICAgICBfdGhpcy5fbG9vcElkID0gc2V0SW50ZXJ2YWwoX3RoaXMuX2VtdWxhdGVEcmFnT3ZlciwgNTApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBVbmRvIHdoYXQgd2FzIHNldCBpbiBfcHJlcGFyZURyYWdTdGFydCBiZWZvcmUgZHJhZyBzdGFydGVkXG4gICAgICBvZmYoZG9jdW1lbnQsICdtb3VzZXVwJywgX3RoaXMuX29uRHJvcCk7XG4gICAgICBvZmYoZG9jdW1lbnQsICd0b3VjaGVuZCcsIF90aGlzLl9vbkRyb3ApO1xuICAgICAgb2ZmKGRvY3VtZW50LCAndG91Y2hjYW5jZWwnLCBfdGhpcy5fb25Ecm9wKTtcbiAgICAgIGlmIChkYXRhVHJhbnNmZXIpIHtcbiAgICAgICAgZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSAnbW92ZSc7XG4gICAgICAgIG9wdGlvbnMuc2V0RGF0YSAmJiBvcHRpb25zLnNldERhdGEuY2FsbChfdGhpcywgZGF0YVRyYW5zZmVyLCBkcmFnRWwpO1xuICAgICAgfVxuICAgICAgb24oZG9jdW1lbnQsICdkcm9wJywgX3RoaXMpO1xuXG4gICAgICAvLyAjMTI3NiBmaXg6XG4gICAgICBjc3MoZHJhZ0VsLCAndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZVooMCknKTtcbiAgICB9XG4gICAgYXdhaXRpbmdEcmFnU3RhcnRlZCA9IHRydWU7XG4gICAgX3RoaXMuX2RyYWdTdGFydElkID0gX25leHRUaWNrKF90aGlzLl9kcmFnU3RhcnRlZC5iaW5kKF90aGlzLCBmYWxsYmFjaywgZXZ0KSk7XG4gICAgb24oZG9jdW1lbnQsICdzZWxlY3RzdGFydCcsIF90aGlzKTtcbiAgICBtb3ZlZCA9IHRydWU7XG4gICAgaWYgKFNhZmFyaSkge1xuICAgICAgY3NzKGRvY3VtZW50LmJvZHksICd1c2VyLXNlbGVjdCcsICdub25lJyk7XG4gICAgfVxuICB9LFxuICAvLyBSZXR1cm5zIHRydWUgLSBpZiBubyBmdXJ0aGVyIGFjdGlvbiBpcyBuZWVkZWQgKGVpdGhlciBpbnNlcnRlZCBvciBhbm90aGVyIGNvbmRpdGlvbilcbiAgX29uRHJhZ092ZXI6IGZ1bmN0aW9uIF9vbkRyYWdPdmVyKCAvKipFdmVudCovZXZ0KSB7XG4gICAgdmFyIGVsID0gdGhpcy5lbCxcbiAgICAgIHRhcmdldCA9IGV2dC50YXJnZXQsXG4gICAgICBkcmFnUmVjdCxcbiAgICAgIHRhcmdldFJlY3QsXG4gICAgICByZXZlcnQsXG4gICAgICBvcHRpb25zID0gdGhpcy5vcHRpb25zLFxuICAgICAgZ3JvdXAgPSBvcHRpb25zLmdyb3VwLFxuICAgICAgYWN0aXZlU29ydGFibGUgPSBTb3J0YWJsZS5hY3RpdmUsXG4gICAgICBpc093bmVyID0gYWN0aXZlR3JvdXAgPT09IGdyb3VwLFxuICAgICAgY2FuU29ydCA9IG9wdGlvbnMuc29ydCxcbiAgICAgIGZyb21Tb3J0YWJsZSA9IHB1dFNvcnRhYmxlIHx8IGFjdGl2ZVNvcnRhYmxlLFxuICAgICAgdmVydGljYWwsXG4gICAgICBfdGhpcyA9IHRoaXMsXG4gICAgICBjb21wbGV0ZWRGaXJlZCA9IGZhbHNlO1xuICAgIGlmIChfc2lsZW50KSByZXR1cm47XG4gICAgZnVuY3Rpb24gZHJhZ092ZXJFdmVudChuYW1lLCBleHRyYSkge1xuICAgICAgcGx1Z2luRXZlbnQobmFtZSwgX3RoaXMsIF9vYmplY3RTcHJlYWQyKHtcbiAgICAgICAgZXZ0OiBldnQsXG4gICAgICAgIGlzT3duZXI6IGlzT3duZXIsXG4gICAgICAgIGF4aXM6IHZlcnRpY2FsID8gJ3ZlcnRpY2FsJyA6ICdob3Jpem9udGFsJyxcbiAgICAgICAgcmV2ZXJ0OiByZXZlcnQsXG4gICAgICAgIGRyYWdSZWN0OiBkcmFnUmVjdCxcbiAgICAgICAgdGFyZ2V0UmVjdDogdGFyZ2V0UmVjdCxcbiAgICAgICAgY2FuU29ydDogY2FuU29ydCxcbiAgICAgICAgZnJvbVNvcnRhYmxlOiBmcm9tU29ydGFibGUsXG4gICAgICAgIHRhcmdldDogdGFyZ2V0LFxuICAgICAgICBjb21wbGV0ZWQ6IGNvbXBsZXRlZCxcbiAgICAgICAgb25Nb3ZlOiBmdW5jdGlvbiBvbk1vdmUodGFyZ2V0LCBhZnRlcikge1xuICAgICAgICAgIHJldHVybiBfb25Nb3ZlKHJvb3RFbCwgZWwsIGRyYWdFbCwgZHJhZ1JlY3QsIHRhcmdldCwgZ2V0UmVjdCh0YXJnZXQpLCBldnQsIGFmdGVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgY2hhbmdlZDogY2hhbmdlZFxuICAgICAgfSwgZXh0cmEpKTtcbiAgICB9XG5cbiAgICAvLyBDYXB0dXJlIGFuaW1hdGlvbiBzdGF0ZVxuICAgIGZ1bmN0aW9uIGNhcHR1cmUoKSB7XG4gICAgICBkcmFnT3ZlckV2ZW50KCdkcmFnT3ZlckFuaW1hdGlvbkNhcHR1cmUnKTtcbiAgICAgIF90aGlzLmNhcHR1cmVBbmltYXRpb25TdGF0ZSgpO1xuICAgICAgaWYgKF90aGlzICE9PSBmcm9tU29ydGFibGUpIHtcbiAgICAgICAgZnJvbVNvcnRhYmxlLmNhcHR1cmVBbmltYXRpb25TdGF0ZSgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJldHVybiBpbnZvY2F0aW9uIHdoZW4gZHJhZ0VsIGlzIGluc2VydGVkIChvciBjb21wbGV0ZWQpXG4gICAgZnVuY3Rpb24gY29tcGxldGVkKGluc2VydGlvbikge1xuICAgICAgZHJhZ092ZXJFdmVudCgnZHJhZ092ZXJDb21wbGV0ZWQnLCB7XG4gICAgICAgIGluc2VydGlvbjogaW5zZXJ0aW9uXG4gICAgICB9KTtcbiAgICAgIGlmIChpbnNlcnRpb24pIHtcbiAgICAgICAgLy8gQ2xvbmVzIG11c3QgYmUgaGlkZGVuIGJlZm9yZSBmb2xkaW5nIGFuaW1hdGlvbiB0byBjYXB0dXJlIGRyYWdSZWN0QWJzb2x1dGUgcHJvcGVybHlcbiAgICAgICAgaWYgKGlzT3duZXIpIHtcbiAgICAgICAgICBhY3RpdmVTb3J0YWJsZS5faGlkZUNsb25lKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWN0aXZlU29ydGFibGUuX3Nob3dDbG9uZShfdGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF90aGlzICE9PSBmcm9tU29ydGFibGUpIHtcbiAgICAgICAgICAvLyBTZXQgZ2hvc3QgY2xhc3MgdG8gbmV3IHNvcnRhYmxlJ3MgZ2hvc3QgY2xhc3NcbiAgICAgICAgICB0b2dnbGVDbGFzcyhkcmFnRWwsIHB1dFNvcnRhYmxlID8gcHV0U29ydGFibGUub3B0aW9ucy5naG9zdENsYXNzIDogYWN0aXZlU29ydGFibGUub3B0aW9ucy5naG9zdENsYXNzLCBmYWxzZSk7XG4gICAgICAgICAgdG9nZ2xlQ2xhc3MoZHJhZ0VsLCBvcHRpb25zLmdob3N0Q2xhc3MsIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwdXRTb3J0YWJsZSAhPT0gX3RoaXMgJiYgX3RoaXMgIT09IFNvcnRhYmxlLmFjdGl2ZSkge1xuICAgICAgICAgIHB1dFNvcnRhYmxlID0gX3RoaXM7XG4gICAgICAgIH0gZWxzZSBpZiAoX3RoaXMgPT09IFNvcnRhYmxlLmFjdGl2ZSAmJiBwdXRTb3J0YWJsZSkge1xuICAgICAgICAgIHB1dFNvcnRhYmxlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFuaW1hdGlvblxuICAgICAgICBpZiAoZnJvbVNvcnRhYmxlID09PSBfdGhpcykge1xuICAgICAgICAgIF90aGlzLl9pZ25vcmVXaGlsZUFuaW1hdGluZyA9IHRhcmdldDtcbiAgICAgICAgfVxuICAgICAgICBfdGhpcy5hbmltYXRlQWxsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBkcmFnT3ZlckV2ZW50KCdkcmFnT3ZlckFuaW1hdGlvbkNvbXBsZXRlJyk7XG4gICAgICAgICAgX3RoaXMuX2lnbm9yZVdoaWxlQW5pbWF0aW5nID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChfdGhpcyAhPT0gZnJvbVNvcnRhYmxlKSB7XG4gICAgICAgICAgZnJvbVNvcnRhYmxlLmFuaW1hdGVBbGwoKTtcbiAgICAgICAgICBmcm9tU29ydGFibGUuX2lnbm9yZVdoaWxlQW5pbWF0aW5nID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBOdWxsIGxhc3RUYXJnZXQgaWYgaXQgaXMgbm90IGluc2lkZSBhIHByZXZpb3VzbHkgc3dhcHBlZCBlbGVtZW50XG4gICAgICBpZiAodGFyZ2V0ID09PSBkcmFnRWwgJiYgIWRyYWdFbC5hbmltYXRlZCB8fCB0YXJnZXQgPT09IGVsICYmICF0YXJnZXQuYW5pbWF0ZWQpIHtcbiAgICAgICAgbGFzdFRhcmdldCA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIC8vIG5vIGJ1YmJsaW5nIGFuZCBub3QgZmFsbGJhY2tcbiAgICAgIGlmICghb3B0aW9ucy5kcmFnb3ZlckJ1YmJsZSAmJiAhZXZ0LnJvb3RFbCAmJiB0YXJnZXQgIT09IGRvY3VtZW50KSB7XG4gICAgICAgIGRyYWdFbC5wYXJlbnROb2RlW2V4cGFuZG9dLl9pc091dHNpZGVUaGlzRWwoZXZ0LnRhcmdldCk7XG5cbiAgICAgICAgLy8gRG8gbm90IGRldGVjdCBmb3IgZW1wdHkgaW5zZXJ0IGlmIGFscmVhZHkgaW5zZXJ0ZWRcbiAgICAgICAgIWluc2VydGlvbiAmJiBuZWFyZXN0RW1wdHlJbnNlcnREZXRlY3RFdmVudChldnQpO1xuICAgICAgfVxuICAgICAgIW9wdGlvbnMuZHJhZ292ZXJCdWJibGUgJiYgZXZ0LnN0b3BQcm9wYWdhdGlvbiAmJiBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICByZXR1cm4gY29tcGxldGVkRmlyZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIENhbGwgd2hlbiBkcmFnRWwgaGFzIGJlZW4gaW5zZXJ0ZWRcbiAgICBmdW5jdGlvbiBjaGFuZ2VkKCkge1xuICAgICAgbmV3SW5kZXggPSBpbmRleChkcmFnRWwpO1xuICAgICAgbmV3RHJhZ2dhYmxlSW5kZXggPSBpbmRleChkcmFnRWwsIG9wdGlvbnMuZHJhZ2dhYmxlKTtcbiAgICAgIF9kaXNwYXRjaEV2ZW50KHtcbiAgICAgICAgc29ydGFibGU6IF90aGlzLFxuICAgICAgICBuYW1lOiAnY2hhbmdlJyxcbiAgICAgICAgdG9FbDogZWwsXG4gICAgICAgIG5ld0luZGV4OiBuZXdJbmRleCxcbiAgICAgICAgbmV3RHJhZ2dhYmxlSW5kZXg6IG5ld0RyYWdnYWJsZUluZGV4LFxuICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnRcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoZXZ0LnByZXZlbnREZWZhdWx0ICE9PSB2b2lkIDApIHtcbiAgICAgIGV2dC5jYW5jZWxhYmxlICYmIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgICB0YXJnZXQgPSBjbG9zZXN0KHRhcmdldCwgb3B0aW9ucy5kcmFnZ2FibGUsIGVsLCB0cnVlKTtcbiAgICBkcmFnT3ZlckV2ZW50KCdkcmFnT3ZlcicpO1xuICAgIGlmIChTb3J0YWJsZS5ldmVudENhbmNlbGVkKSByZXR1cm4gY29tcGxldGVkRmlyZWQ7XG4gICAgaWYgKGRyYWdFbC5jb250YWlucyhldnQudGFyZ2V0KSB8fCB0YXJnZXQuYW5pbWF0ZWQgJiYgdGFyZ2V0LmFuaW1hdGluZ1ggJiYgdGFyZ2V0LmFuaW1hdGluZ1kgfHwgX3RoaXMuX2lnbm9yZVdoaWxlQW5pbWF0aW5nID09PSB0YXJnZXQpIHtcbiAgICAgIHJldHVybiBjb21wbGV0ZWQoZmFsc2UpO1xuICAgIH1cbiAgICBpZ25vcmVOZXh0Q2xpY2sgPSBmYWxzZTtcbiAgICBpZiAoYWN0aXZlU29ydGFibGUgJiYgIW9wdGlvbnMuZGlzYWJsZWQgJiYgKGlzT3duZXIgPyBjYW5Tb3J0IHx8IChyZXZlcnQgPSBwYXJlbnRFbCAhPT0gcm9vdEVsKSAvLyBSZXZlcnRpbmcgaXRlbSBpbnRvIHRoZSBvcmlnaW5hbCBsaXN0XG4gICAgOiBwdXRTb3J0YWJsZSA9PT0gdGhpcyB8fCAodGhpcy5sYXN0UHV0TW9kZSA9IGFjdGl2ZUdyb3VwLmNoZWNrUHVsbCh0aGlzLCBhY3RpdmVTb3J0YWJsZSwgZHJhZ0VsLCBldnQpKSAmJiBncm91cC5jaGVja1B1dCh0aGlzLCBhY3RpdmVTb3J0YWJsZSwgZHJhZ0VsLCBldnQpKSkge1xuICAgICAgdmVydGljYWwgPSB0aGlzLl9nZXREaXJlY3Rpb24oZXZ0LCB0YXJnZXQpID09PSAndmVydGljYWwnO1xuICAgICAgZHJhZ1JlY3QgPSBnZXRSZWN0KGRyYWdFbCk7XG4gICAgICBkcmFnT3ZlckV2ZW50KCdkcmFnT3ZlclZhbGlkJyk7XG4gICAgICBpZiAoU29ydGFibGUuZXZlbnRDYW5jZWxlZCkgcmV0dXJuIGNvbXBsZXRlZEZpcmVkO1xuICAgICAgaWYgKHJldmVydCkge1xuICAgICAgICBwYXJlbnRFbCA9IHJvb3RFbDsgLy8gYWN0dWFsaXphdGlvblxuICAgICAgICBjYXB0dXJlKCk7XG4gICAgICAgIHRoaXMuX2hpZGVDbG9uZSgpO1xuICAgICAgICBkcmFnT3ZlckV2ZW50KCdyZXZlcnQnKTtcbiAgICAgICAgaWYgKCFTb3J0YWJsZS5ldmVudENhbmNlbGVkKSB7XG4gICAgICAgICAgaWYgKG5leHRFbCkge1xuICAgICAgICAgICAgcm9vdEVsLmluc2VydEJlZm9yZShkcmFnRWwsIG5leHRFbCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJvb3RFbC5hcHBlbmRDaGlsZChkcmFnRWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29tcGxldGVkKHRydWUpO1xuICAgICAgfVxuICAgICAgdmFyIGVsTGFzdENoaWxkID0gbGFzdENoaWxkKGVsLCBvcHRpb25zLmRyYWdnYWJsZSk7XG4gICAgICBpZiAoIWVsTGFzdENoaWxkIHx8IF9naG9zdElzTGFzdChldnQsIHZlcnRpY2FsLCB0aGlzKSAmJiAhZWxMYXN0Q2hpbGQuYW5pbWF0ZWQpIHtcbiAgICAgICAgLy8gSW5zZXJ0IHRvIGVuZCBvZiBsaXN0XG5cbiAgICAgICAgLy8gSWYgYWxyZWFkeSBhdCBlbmQgb2YgbGlzdDogRG8gbm90IGluc2VydFxuICAgICAgICBpZiAoZWxMYXN0Q2hpbGQgPT09IGRyYWdFbCkge1xuICAgICAgICAgIHJldHVybiBjb21wbGV0ZWQoZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBsYXN0IGVsZW1lbnQsIGl0IGlzIHRoZSB0YXJnZXRcbiAgICAgICAgaWYgKGVsTGFzdENoaWxkICYmIGVsID09PSBldnQudGFyZ2V0KSB7XG4gICAgICAgICAgdGFyZ2V0ID0gZWxMYXN0Q2hpbGQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRhcmdldCkge1xuICAgICAgICAgIHRhcmdldFJlY3QgPSBnZXRSZWN0KHRhcmdldCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKF9vbk1vdmUocm9vdEVsLCBlbCwgZHJhZ0VsLCBkcmFnUmVjdCwgdGFyZ2V0LCB0YXJnZXRSZWN0LCBldnQsICEhdGFyZ2V0KSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICBjYXB0dXJlKCk7XG4gICAgICAgICAgaWYgKGVsTGFzdENoaWxkICYmIGVsTGFzdENoaWxkLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgICAvLyB0aGUgbGFzdCBkcmFnZ2FibGUgZWxlbWVudCBpcyBub3QgdGhlIGxhc3Qgbm9kZVxuICAgICAgICAgICAgZWwuaW5zZXJ0QmVmb3JlKGRyYWdFbCwgZWxMYXN0Q2hpbGQubmV4dFNpYmxpbmcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbC5hcHBlbmRDaGlsZChkcmFnRWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwYXJlbnRFbCA9IGVsOyAvLyBhY3R1YWxpemF0aW9uXG5cbiAgICAgICAgICBjaGFuZ2VkKCk7XG4gICAgICAgICAgcmV0dXJuIGNvbXBsZXRlZCh0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChlbExhc3RDaGlsZCAmJiBfZ2hvc3RJc0ZpcnN0KGV2dCwgdmVydGljYWwsIHRoaXMpKSB7XG4gICAgICAgIC8vIEluc2VydCB0byBzdGFydCBvZiBsaXN0XG4gICAgICAgIHZhciBmaXJzdENoaWxkID0gZ2V0Q2hpbGQoZWwsIDAsIG9wdGlvbnMsIHRydWUpO1xuICAgICAgICBpZiAoZmlyc3RDaGlsZCA9PT0gZHJhZ0VsKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbXBsZXRlZChmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGFyZ2V0ID0gZmlyc3RDaGlsZDtcbiAgICAgICAgdGFyZ2V0UmVjdCA9IGdldFJlY3QodGFyZ2V0KTtcbiAgICAgICAgaWYgKF9vbk1vdmUocm9vdEVsLCBlbCwgZHJhZ0VsLCBkcmFnUmVjdCwgdGFyZ2V0LCB0YXJnZXRSZWN0LCBldnQsIGZhbHNlKSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICBjYXB0dXJlKCk7XG4gICAgICAgICAgZWwuaW5zZXJ0QmVmb3JlKGRyYWdFbCwgZmlyc3RDaGlsZCk7XG4gICAgICAgICAgcGFyZW50RWwgPSBlbDsgLy8gYWN0dWFsaXphdGlvblxuXG4gICAgICAgICAgY2hhbmdlZCgpO1xuICAgICAgICAgIHJldHVybiBjb21wbGV0ZWQodHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGFyZ2V0LnBhcmVudE5vZGUgPT09IGVsKSB7XG4gICAgICAgIHRhcmdldFJlY3QgPSBnZXRSZWN0KHRhcmdldCk7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSAwLFxuICAgICAgICAgIHRhcmdldEJlZm9yZUZpcnN0U3dhcCxcbiAgICAgICAgICBkaWZmZXJlbnRMZXZlbCA9IGRyYWdFbC5wYXJlbnROb2RlICE9PSBlbCxcbiAgICAgICAgICBkaWZmZXJlbnRSb3dDb2wgPSAhX2RyYWdFbEluUm93Q29sdW1uKGRyYWdFbC5hbmltYXRlZCAmJiBkcmFnRWwudG9SZWN0IHx8IGRyYWdSZWN0LCB0YXJnZXQuYW5pbWF0ZWQgJiYgdGFyZ2V0LnRvUmVjdCB8fCB0YXJnZXRSZWN0LCB2ZXJ0aWNhbCksXG4gICAgICAgICAgc2lkZTEgPSB2ZXJ0aWNhbCA/ICd0b3AnIDogJ2xlZnQnLFxuICAgICAgICAgIHNjcm9sbGVkUGFzdFRvcCA9IGlzU2Nyb2xsZWRQYXN0KHRhcmdldCwgJ3RvcCcsICd0b3AnKSB8fCBpc1Njcm9sbGVkUGFzdChkcmFnRWwsICd0b3AnLCAndG9wJyksXG4gICAgICAgICAgc2Nyb2xsQmVmb3JlID0gc2Nyb2xsZWRQYXN0VG9wID8gc2Nyb2xsZWRQYXN0VG9wLnNjcm9sbFRvcCA6IHZvaWQgMDtcbiAgICAgICAgaWYgKGxhc3RUYXJnZXQgIT09IHRhcmdldCkge1xuICAgICAgICAgIHRhcmdldEJlZm9yZUZpcnN0U3dhcCA9IHRhcmdldFJlY3Rbc2lkZTFdO1xuICAgICAgICAgIHBhc3RGaXJzdEludmVydFRocmVzaCA9IGZhbHNlO1xuICAgICAgICAgIGlzQ2lyY3Vtc3RhbnRpYWxJbnZlcnQgPSAhZGlmZmVyZW50Um93Q29sICYmIG9wdGlvbnMuaW52ZXJ0U3dhcCB8fCBkaWZmZXJlbnRMZXZlbDtcbiAgICAgICAgfVxuICAgICAgICBkaXJlY3Rpb24gPSBfZ2V0U3dhcERpcmVjdGlvbihldnQsIHRhcmdldCwgdGFyZ2V0UmVjdCwgdmVydGljYWwsIGRpZmZlcmVudFJvd0NvbCA/IDEgOiBvcHRpb25zLnN3YXBUaHJlc2hvbGQsIG9wdGlvbnMuaW52ZXJ0ZWRTd2FwVGhyZXNob2xkID09IG51bGwgPyBvcHRpb25zLnN3YXBUaHJlc2hvbGQgOiBvcHRpb25zLmludmVydGVkU3dhcFRocmVzaG9sZCwgaXNDaXJjdW1zdGFudGlhbEludmVydCwgbGFzdFRhcmdldCA9PT0gdGFyZ2V0KTtcbiAgICAgICAgdmFyIHNpYmxpbmc7XG4gICAgICAgIGlmIChkaXJlY3Rpb24gIT09IDApIHtcbiAgICAgICAgICAvLyBDaGVjayBpZiB0YXJnZXQgaXMgYmVzaWRlIGRyYWdFbCBpbiByZXNwZWN0aXZlIGRpcmVjdGlvbiAoaWdub3JpbmcgaGlkZGVuIGVsZW1lbnRzKVxuICAgICAgICAgIHZhciBkcmFnSW5kZXggPSBpbmRleChkcmFnRWwpO1xuICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgIGRyYWdJbmRleCAtPSBkaXJlY3Rpb247XG4gICAgICAgICAgICBzaWJsaW5nID0gcGFyZW50RWwuY2hpbGRyZW5bZHJhZ0luZGV4XTtcbiAgICAgICAgICB9IHdoaWxlIChzaWJsaW5nICYmIChjc3Moc2libGluZywgJ2Rpc3BsYXknKSA9PT0gJ25vbmUnIHx8IHNpYmxpbmcgPT09IGdob3N0RWwpKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBJZiBkcmFnRWwgaXMgYWxyZWFkeSBiZXNpZGUgdGFyZ2V0OiBEbyBub3QgaW5zZXJ0XG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09IDAgfHwgc2libGluZyA9PT0gdGFyZ2V0KSB7XG4gICAgICAgICAgcmV0dXJuIGNvbXBsZXRlZChmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgbGFzdFRhcmdldCA9IHRhcmdldDtcbiAgICAgICAgbGFzdERpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICAgICAgdmFyIG5leHRTaWJsaW5nID0gdGFyZ2V0Lm5leHRFbGVtZW50U2libGluZyxcbiAgICAgICAgICBhZnRlciA9IGZhbHNlO1xuICAgICAgICBhZnRlciA9IGRpcmVjdGlvbiA9PT0gMTtcbiAgICAgICAgdmFyIG1vdmVWZWN0b3IgPSBfb25Nb3ZlKHJvb3RFbCwgZWwsIGRyYWdFbCwgZHJhZ1JlY3QsIHRhcmdldCwgdGFyZ2V0UmVjdCwgZXZ0LCBhZnRlcik7XG4gICAgICAgIGlmIChtb3ZlVmVjdG9yICE9PSBmYWxzZSkge1xuICAgICAgICAgIGlmIChtb3ZlVmVjdG9yID09PSAxIHx8IG1vdmVWZWN0b3IgPT09IC0xKSB7XG4gICAgICAgICAgICBhZnRlciA9IG1vdmVWZWN0b3IgPT09IDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIF9zaWxlbnQgPSB0cnVlO1xuICAgICAgICAgIHNldFRpbWVvdXQoX3Vuc2lsZW50LCAzMCk7XG4gICAgICAgICAgY2FwdHVyZSgpO1xuICAgICAgICAgIGlmIChhZnRlciAmJiAhbmV4dFNpYmxpbmcpIHtcbiAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKGRyYWdFbCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRhcmdldC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShkcmFnRWwsIGFmdGVyID8gbmV4dFNpYmxpbmcgOiB0YXJnZXQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFVuZG8gY2hyb21lJ3Mgc2Nyb2xsIGFkanVzdG1lbnQgKGhhcyBubyBlZmZlY3Qgb24gb3RoZXIgYnJvd3NlcnMpXG4gICAgICAgICAgaWYgKHNjcm9sbGVkUGFzdFRvcCkge1xuICAgICAgICAgICAgc2Nyb2xsQnkoc2Nyb2xsZWRQYXN0VG9wLCAwLCBzY3JvbGxCZWZvcmUgLSBzY3JvbGxlZFBhc3RUb3Auc2Nyb2xsVG9wKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcGFyZW50RWwgPSBkcmFnRWwucGFyZW50Tm9kZTsgLy8gYWN0dWFsaXphdGlvblxuXG4gICAgICAgICAgLy8gbXVzdCBiZSBkb25lIGJlZm9yZSBhbmltYXRpb25cbiAgICAgICAgICBpZiAodGFyZ2V0QmVmb3JlRmlyc3RTd2FwICE9PSB1bmRlZmluZWQgJiYgIWlzQ2lyY3Vtc3RhbnRpYWxJbnZlcnQpIHtcbiAgICAgICAgICAgIHRhcmdldE1vdmVEaXN0YW5jZSA9IE1hdGguYWJzKHRhcmdldEJlZm9yZUZpcnN0U3dhcCAtIGdldFJlY3QodGFyZ2V0KVtzaWRlMV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjaGFuZ2VkKCk7XG4gICAgICAgICAgcmV0dXJuIGNvbXBsZXRlZCh0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGVsLmNvbnRhaW5zKGRyYWdFbCkpIHtcbiAgICAgICAgcmV0dXJuIGNvbXBsZXRlZChmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcbiAgX2lnbm9yZVdoaWxlQW5pbWF0aW5nOiBudWxsLFxuICBfb2ZmTW92ZUV2ZW50czogZnVuY3Rpb24gX29mZk1vdmVFdmVudHMoKSB7XG4gICAgb2ZmKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5fb25Ub3VjaE1vdmUpO1xuICAgIG9mZihkb2N1bWVudCwgJ3RvdWNobW92ZScsIHRoaXMuX29uVG91Y2hNb3ZlKTtcbiAgICBvZmYoZG9jdW1lbnQsICdwb2ludGVybW92ZScsIHRoaXMuX29uVG91Y2hNb3ZlKTtcbiAgICBvZmYoZG9jdW1lbnQsICdkcmFnb3ZlcicsIG5lYXJlc3RFbXB0eUluc2VydERldGVjdEV2ZW50KTtcbiAgICBvZmYoZG9jdW1lbnQsICdtb3VzZW1vdmUnLCBuZWFyZXN0RW1wdHlJbnNlcnREZXRlY3RFdmVudCk7XG4gICAgb2ZmKGRvY3VtZW50LCAndG91Y2htb3ZlJywgbmVhcmVzdEVtcHR5SW5zZXJ0RGV0ZWN0RXZlbnQpO1xuICB9LFxuICBfb2ZmVXBFdmVudHM6IGZ1bmN0aW9uIF9vZmZVcEV2ZW50cygpIHtcbiAgICB2YXIgb3duZXJEb2N1bWVudCA9IHRoaXMuZWwub3duZXJEb2N1bWVudDtcbiAgICBvZmYob3duZXJEb2N1bWVudCwgJ21vdXNldXAnLCB0aGlzLl9vbkRyb3ApO1xuICAgIG9mZihvd25lckRvY3VtZW50LCAndG91Y2hlbmQnLCB0aGlzLl9vbkRyb3ApO1xuICAgIG9mZihvd25lckRvY3VtZW50LCAncG9pbnRlcnVwJywgdGhpcy5fb25Ecm9wKTtcbiAgICBvZmYob3duZXJEb2N1bWVudCwgJ3RvdWNoY2FuY2VsJywgdGhpcy5fb25Ecm9wKTtcbiAgICBvZmYoZG9jdW1lbnQsICdzZWxlY3RzdGFydCcsIHRoaXMpO1xuICB9LFxuICBfb25Ecm9wOiBmdW5jdGlvbiBfb25Ecm9wKCAvKipFdmVudCovZXZ0KSB7XG4gICAgdmFyIGVsID0gdGhpcy5lbCxcbiAgICAgIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG5cbiAgICAvLyBHZXQgdGhlIGluZGV4IG9mIHRoZSBkcmFnZ2VkIGVsZW1lbnQgd2l0aGluIGl0cyBwYXJlbnRcbiAgICBuZXdJbmRleCA9IGluZGV4KGRyYWdFbCk7XG4gICAgbmV3RHJhZ2dhYmxlSW5kZXggPSBpbmRleChkcmFnRWwsIG9wdGlvbnMuZHJhZ2dhYmxlKTtcbiAgICBwbHVnaW5FdmVudCgnZHJvcCcsIHRoaXMsIHtcbiAgICAgIGV2dDogZXZ0XG4gICAgfSk7XG4gICAgcGFyZW50RWwgPSBkcmFnRWwgJiYgZHJhZ0VsLnBhcmVudE5vZGU7XG5cbiAgICAvLyBHZXQgYWdhaW4gYWZ0ZXIgcGx1Z2luIGV2ZW50XG4gICAgbmV3SW5kZXggPSBpbmRleChkcmFnRWwpO1xuICAgIG5ld0RyYWdnYWJsZUluZGV4ID0gaW5kZXgoZHJhZ0VsLCBvcHRpb25zLmRyYWdnYWJsZSk7XG4gICAgaWYgKFNvcnRhYmxlLmV2ZW50Q2FuY2VsZWQpIHtcbiAgICAgIHRoaXMuX251bGxpbmcoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXRpbmdEcmFnU3RhcnRlZCA9IGZhbHNlO1xuICAgIGlzQ2lyY3Vtc3RhbnRpYWxJbnZlcnQgPSBmYWxzZTtcbiAgICBwYXN0Rmlyc3RJbnZlcnRUaHJlc2ggPSBmYWxzZTtcbiAgICBjbGVhckludGVydmFsKHRoaXMuX2xvb3BJZCk7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX2RyYWdTdGFydFRpbWVyKTtcbiAgICBfY2FuY2VsTmV4dFRpY2sodGhpcy5jbG9uZUlkKTtcbiAgICBfY2FuY2VsTmV4dFRpY2sodGhpcy5fZHJhZ1N0YXJ0SWQpO1xuXG4gICAgLy8gVW5iaW5kIGV2ZW50c1xuICAgIGlmICh0aGlzLm5hdGl2ZURyYWdnYWJsZSkge1xuICAgICAgb2ZmKGRvY3VtZW50LCAnZHJvcCcsIHRoaXMpO1xuICAgICAgb2ZmKGVsLCAnZHJhZ3N0YXJ0JywgdGhpcy5fb25EcmFnU3RhcnQpO1xuICAgIH1cbiAgICB0aGlzLl9vZmZNb3ZlRXZlbnRzKCk7XG4gICAgdGhpcy5fb2ZmVXBFdmVudHMoKTtcbiAgICBpZiAoU2FmYXJpKSB7XG4gICAgICBjc3MoZG9jdW1lbnQuYm9keSwgJ3VzZXItc2VsZWN0JywgJycpO1xuICAgIH1cbiAgICBjc3MoZHJhZ0VsLCAndHJhbnNmb3JtJywgJycpO1xuICAgIGlmIChldnQpIHtcbiAgICAgIGlmIChtb3ZlZCkge1xuICAgICAgICBldnQuY2FuY2VsYWJsZSAmJiBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgIW9wdGlvbnMuZHJvcEJ1YmJsZSAmJiBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB9XG4gICAgICBnaG9zdEVsICYmIGdob3N0RWwucGFyZW50Tm9kZSAmJiBnaG9zdEVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZ2hvc3RFbCk7XG4gICAgICBpZiAocm9vdEVsID09PSBwYXJlbnRFbCB8fCBwdXRTb3J0YWJsZSAmJiBwdXRTb3J0YWJsZS5sYXN0UHV0TW9kZSAhPT0gJ2Nsb25lJykge1xuICAgICAgICAvLyBSZW1vdmUgY2xvbmUocylcbiAgICAgICAgY2xvbmVFbCAmJiBjbG9uZUVsLnBhcmVudE5vZGUgJiYgY2xvbmVFbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGNsb25lRWwpO1xuICAgICAgfVxuICAgICAgaWYgKGRyYWdFbCkge1xuICAgICAgICBpZiAodGhpcy5uYXRpdmVEcmFnZ2FibGUpIHtcbiAgICAgICAgICBvZmYoZHJhZ0VsLCAnZHJhZ2VuZCcsIHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIF9kaXNhYmxlRHJhZ2dhYmxlKGRyYWdFbCk7XG4gICAgICAgIGRyYWdFbC5zdHlsZVsnd2lsbC1jaGFuZ2UnXSA9ICcnO1xuXG4gICAgICAgIC8vIFJlbW92ZSBjbGFzc2VzXG4gICAgICAgIC8vIGdob3N0Q2xhc3MgaXMgYWRkZWQgaW4gZHJhZ1N0YXJ0ZWRcbiAgICAgICAgaWYgKG1vdmVkICYmICFhd2FpdGluZ0RyYWdTdGFydGVkKSB7XG4gICAgICAgICAgdG9nZ2xlQ2xhc3MoZHJhZ0VsLCBwdXRTb3J0YWJsZSA/IHB1dFNvcnRhYmxlLm9wdGlvbnMuZ2hvc3RDbGFzcyA6IHRoaXMub3B0aW9ucy5naG9zdENsYXNzLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgICAgdG9nZ2xlQ2xhc3MoZHJhZ0VsLCB0aGlzLm9wdGlvbnMuY2hvc2VuQ2xhc3MsIGZhbHNlKTtcblxuICAgICAgICAvLyBEcmFnIHN0b3AgZXZlbnRcbiAgICAgICAgX2Rpc3BhdGNoRXZlbnQoe1xuICAgICAgICAgIHNvcnRhYmxlOiB0aGlzLFxuICAgICAgICAgIG5hbWU6ICd1bmNob29zZScsXG4gICAgICAgICAgdG9FbDogcGFyZW50RWwsXG4gICAgICAgICAgbmV3SW5kZXg6IG51bGwsXG4gICAgICAgICAgbmV3RHJhZ2dhYmxlSW5kZXg6IG51bGwsXG4gICAgICAgICAgb3JpZ2luYWxFdmVudDogZXZ0XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAocm9vdEVsICE9PSBwYXJlbnRFbCkge1xuICAgICAgICAgIGlmIChuZXdJbmRleCA+PSAwKSB7XG4gICAgICAgICAgICAvLyBBZGQgZXZlbnRcbiAgICAgICAgICAgIF9kaXNwYXRjaEV2ZW50KHtcbiAgICAgICAgICAgICAgcm9vdEVsOiBwYXJlbnRFbCxcbiAgICAgICAgICAgICAgbmFtZTogJ2FkZCcsXG4gICAgICAgICAgICAgIHRvRWw6IHBhcmVudEVsLFxuICAgICAgICAgICAgICBmcm9tRWw6IHJvb3RFbCxcbiAgICAgICAgICAgICAgb3JpZ2luYWxFdmVudDogZXZ0XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gUmVtb3ZlIGV2ZW50XG4gICAgICAgICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgICAgIHNvcnRhYmxlOiB0aGlzLFxuICAgICAgICAgICAgICBuYW1lOiAncmVtb3ZlJyxcbiAgICAgICAgICAgICAgdG9FbDogcGFyZW50RWwsXG4gICAgICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIGRyYWcgZnJvbSBvbmUgbGlzdCBhbmQgZHJvcCBpbnRvIGFub3RoZXJcbiAgICAgICAgICAgIF9kaXNwYXRjaEV2ZW50KHtcbiAgICAgICAgICAgICAgcm9vdEVsOiBwYXJlbnRFbCxcbiAgICAgICAgICAgICAgbmFtZTogJ3NvcnQnLFxuICAgICAgICAgICAgICB0b0VsOiBwYXJlbnRFbCxcbiAgICAgICAgICAgICAgZnJvbUVsOiByb290RWwsXG4gICAgICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgICAgIHNvcnRhYmxlOiB0aGlzLFxuICAgICAgICAgICAgICBuYW1lOiAnc29ydCcsXG4gICAgICAgICAgICAgIHRvRWw6IHBhcmVudEVsLFxuICAgICAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwdXRTb3J0YWJsZSAmJiBwdXRTb3J0YWJsZS5zYXZlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKG5ld0luZGV4ICE9PSBvbGRJbmRleCkge1xuICAgICAgICAgICAgaWYgKG5ld0luZGV4ID49IDApIHtcbiAgICAgICAgICAgICAgLy8gZHJhZyAmIGRyb3Agd2l0aGluIHRoZSBzYW1lIGxpc3RcbiAgICAgICAgICAgICAgX2Rpc3BhdGNoRXZlbnQoe1xuICAgICAgICAgICAgICAgIHNvcnRhYmxlOiB0aGlzLFxuICAgICAgICAgICAgICAgIG5hbWU6ICd1cGRhdGUnLFxuICAgICAgICAgICAgICAgIHRvRWw6IHBhcmVudEVsLFxuICAgICAgICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgX2Rpc3BhdGNoRXZlbnQoe1xuICAgICAgICAgICAgICAgIHNvcnRhYmxlOiB0aGlzLFxuICAgICAgICAgICAgICAgIG5hbWU6ICdzb3J0JyxcbiAgICAgICAgICAgICAgICB0b0VsOiBwYXJlbnRFbCxcbiAgICAgICAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnRcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChTb3J0YWJsZS5hY3RpdmUpIHtcbiAgICAgICAgICAvKiBqc2hpbnQgZXFudWxsOnRydWUgKi9cbiAgICAgICAgICBpZiAobmV3SW5kZXggPT0gbnVsbCB8fCBuZXdJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgIG5ld0luZGV4ID0gb2xkSW5kZXg7XG4gICAgICAgICAgICBuZXdEcmFnZ2FibGVJbmRleCA9IG9sZERyYWdnYWJsZUluZGV4O1xuICAgICAgICAgIH1cbiAgICAgICAgICBfZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgICBzb3J0YWJsZTogdGhpcyxcbiAgICAgICAgICAgIG5hbWU6ICdlbmQnLFxuICAgICAgICAgICAgdG9FbDogcGFyZW50RWwsXG4gICAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnRcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIFNhdmUgc29ydGluZ1xuICAgICAgICAgIHRoaXMuc2F2ZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX251bGxpbmcoKTtcbiAgfSxcbiAgX251bGxpbmc6IGZ1bmN0aW9uIF9udWxsaW5nKCkge1xuICAgIHBsdWdpbkV2ZW50KCdudWxsaW5nJywgdGhpcyk7XG4gICAgcm9vdEVsID0gZHJhZ0VsID0gcGFyZW50RWwgPSBnaG9zdEVsID0gbmV4dEVsID0gY2xvbmVFbCA9IGxhc3REb3duRWwgPSBjbG9uZUhpZGRlbiA9IHRhcEV2dCA9IHRvdWNoRXZ0ID0gbW92ZWQgPSBuZXdJbmRleCA9IG5ld0RyYWdnYWJsZUluZGV4ID0gb2xkSW5kZXggPSBvbGREcmFnZ2FibGVJbmRleCA9IGxhc3RUYXJnZXQgPSBsYXN0RGlyZWN0aW9uID0gcHV0U29ydGFibGUgPSBhY3RpdmVHcm91cCA9IFNvcnRhYmxlLmRyYWdnZWQgPSBTb3J0YWJsZS5naG9zdCA9IFNvcnRhYmxlLmNsb25lID0gU29ydGFibGUuYWN0aXZlID0gbnVsbDtcbiAgICBzYXZlZElucHV0Q2hlY2tlZC5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgZWwuY2hlY2tlZCA9IHRydWU7XG4gICAgfSk7XG4gICAgc2F2ZWRJbnB1dENoZWNrZWQubGVuZ3RoID0gbGFzdER4ID0gbGFzdER5ID0gMDtcbiAgfSxcbiAgaGFuZGxlRXZlbnQ6IGZ1bmN0aW9uIGhhbmRsZUV2ZW50KCAvKipFdmVudCovZXZ0KSB7XG4gICAgc3dpdGNoIChldnQudHlwZSkge1xuICAgICAgY2FzZSAnZHJvcCc6XG4gICAgICBjYXNlICdkcmFnZW5kJzpcbiAgICAgICAgdGhpcy5fb25Ecm9wKGV2dCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZHJhZ2VudGVyJzpcbiAgICAgIGNhc2UgJ2RyYWdvdmVyJzpcbiAgICAgICAgaWYgKGRyYWdFbCkge1xuICAgICAgICAgIHRoaXMuX29uRHJhZ092ZXIoZXZ0KTtcbiAgICAgICAgICBfZ2xvYmFsRHJhZ092ZXIoZXZ0KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3NlbGVjdHN0YXJ0JzpcbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfSxcbiAgLyoqXHJcbiAgICogU2VyaWFsaXplcyB0aGUgaXRlbSBpbnRvIGFuIGFycmF5IG9mIHN0cmluZy5cclxuICAgKiBAcmV0dXJucyB7U3RyaW5nW119XHJcbiAgICovXG4gIHRvQXJyYXk6IGZ1bmN0aW9uIHRvQXJyYXkoKSB7XG4gICAgdmFyIG9yZGVyID0gW10sXG4gICAgICBlbCxcbiAgICAgIGNoaWxkcmVuID0gdGhpcy5lbC5jaGlsZHJlbixcbiAgICAgIGkgPSAwLFxuICAgICAgbiA9IGNoaWxkcmVuLmxlbmd0aCxcbiAgICAgIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgZm9yICg7IGkgPCBuOyBpKyspIHtcbiAgICAgIGVsID0gY2hpbGRyZW5baV07XG4gICAgICBpZiAoY2xvc2VzdChlbCwgb3B0aW9ucy5kcmFnZ2FibGUsIHRoaXMuZWwsIGZhbHNlKSkge1xuICAgICAgICBvcmRlci5wdXNoKGVsLmdldEF0dHJpYnV0ZShvcHRpb25zLmRhdGFJZEF0dHIpIHx8IF9nZW5lcmF0ZUlkKGVsKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvcmRlcjtcbiAgfSxcbiAgLyoqXHJcbiAgICogU29ydHMgdGhlIGVsZW1lbnRzIGFjY29yZGluZyB0byB0aGUgYXJyYXkuXHJcbiAgICogQHBhcmFtICB7U3RyaW5nW119ICBvcmRlciAgb3JkZXIgb2YgdGhlIGl0ZW1zXHJcbiAgICovXG4gIHNvcnQ6IGZ1bmN0aW9uIHNvcnQob3JkZXIsIHVzZUFuaW1hdGlvbikge1xuICAgIHZhciBpdGVtcyA9IHt9LFxuICAgICAgcm9vdEVsID0gdGhpcy5lbDtcbiAgICB0aGlzLnRvQXJyYXkoKS5mb3JFYWNoKGZ1bmN0aW9uIChpZCwgaSkge1xuICAgICAgdmFyIGVsID0gcm9vdEVsLmNoaWxkcmVuW2ldO1xuICAgICAgaWYgKGNsb3Nlc3QoZWwsIHRoaXMub3B0aW9ucy5kcmFnZ2FibGUsIHJvb3RFbCwgZmFsc2UpKSB7XG4gICAgICAgIGl0ZW1zW2lkXSA9IGVsO1xuICAgICAgfVxuICAgIH0sIHRoaXMpO1xuICAgIHVzZUFuaW1hdGlvbiAmJiB0aGlzLmNhcHR1cmVBbmltYXRpb25TdGF0ZSgpO1xuICAgIG9yZGVyLmZvckVhY2goZnVuY3Rpb24gKGlkKSB7XG4gICAgICBpZiAoaXRlbXNbaWRdKSB7XG4gICAgICAgIHJvb3RFbC5yZW1vdmVDaGlsZChpdGVtc1tpZF0pO1xuICAgICAgICByb290RWwuYXBwZW5kQ2hpbGQoaXRlbXNbaWRdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB1c2VBbmltYXRpb24gJiYgdGhpcy5hbmltYXRlQWxsKCk7XG4gIH0sXG4gIC8qKlxyXG4gICAqIFNhdmUgdGhlIGN1cnJlbnQgc29ydGluZ1xyXG4gICAqL1xuICBzYXZlOiBmdW5jdGlvbiBzYXZlKCkge1xuICAgIHZhciBzdG9yZSA9IHRoaXMub3B0aW9ucy5zdG9yZTtcbiAgICBzdG9yZSAmJiBzdG9yZS5zZXQgJiYgc3RvcmUuc2V0KHRoaXMpO1xuICB9LFxuICAvKipcclxuICAgKiBGb3IgZWFjaCBlbGVtZW50IGluIHRoZSBzZXQsIGdldCB0aGUgZmlyc3QgZWxlbWVudCB0aGF0IG1hdGNoZXMgdGhlIHNlbGVjdG9yIGJ5IHRlc3RpbmcgdGhlIGVsZW1lbnQgaXRzZWxmIGFuZCB0cmF2ZXJzaW5nIHVwIHRocm91Z2ggaXRzIGFuY2VzdG9ycyBpbiB0aGUgRE9NIHRyZWUuXHJcbiAgICogQHBhcmFtICAge0hUTUxFbGVtZW50fSAgZWxcclxuICAgKiBAcGFyYW0gICB7U3RyaW5nfSAgICAgICBbc2VsZWN0b3JdICBkZWZhdWx0OiBgb3B0aW9ucy5kcmFnZ2FibGVgXHJcbiAgICogQHJldHVybnMge0hUTUxFbGVtZW50fG51bGx9XHJcbiAgICovXG4gIGNsb3Nlc3Q6IGZ1bmN0aW9uIGNsb3Nlc3QkMShlbCwgc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gY2xvc2VzdChlbCwgc2VsZWN0b3IgfHwgdGhpcy5vcHRpb25zLmRyYWdnYWJsZSwgdGhpcy5lbCwgZmFsc2UpO1xuICB9LFxuICAvKipcclxuICAgKiBTZXQvZ2V0IG9wdGlvblxyXG4gICAqIEBwYXJhbSAgIHtzdHJpbmd9IG5hbWVcclxuICAgKiBAcGFyYW0gICB7Kn0gICAgICBbdmFsdWVdXHJcbiAgICogQHJldHVybnMgeyp9XHJcbiAgICovXG4gIG9wdGlvbjogZnVuY3Rpb24gb3B0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgaWYgKHZhbHVlID09PSB2b2lkIDApIHtcbiAgICAgIHJldHVybiBvcHRpb25zW25hbWVdO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbW9kaWZpZWRWYWx1ZSA9IFBsdWdpbk1hbmFnZXIubW9kaWZ5T3B0aW9uKHRoaXMsIG5hbWUsIHZhbHVlKTtcbiAgICAgIGlmICh0eXBlb2YgbW9kaWZpZWRWYWx1ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgb3B0aW9uc1tuYW1lXSA9IG1vZGlmaWVkVmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcHRpb25zW25hbWVdID0gdmFsdWU7XG4gICAgICB9XG4gICAgICBpZiAobmFtZSA9PT0gJ2dyb3VwJykge1xuICAgICAgICBfcHJlcGFyZUdyb3VwKG9wdGlvbnMpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgLyoqXHJcbiAgICogRGVzdHJveVxyXG4gICAqL1xuICBkZXN0cm95OiBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgIHBsdWdpbkV2ZW50KCdkZXN0cm95JywgdGhpcyk7XG4gICAgdmFyIGVsID0gdGhpcy5lbDtcbiAgICBlbFtleHBhbmRvXSA9IG51bGw7XG4gICAgb2ZmKGVsLCAnbW91c2Vkb3duJywgdGhpcy5fb25UYXBTdGFydCk7XG4gICAgb2ZmKGVsLCAndG91Y2hzdGFydCcsIHRoaXMuX29uVGFwU3RhcnQpO1xuICAgIG9mZihlbCwgJ3BvaW50ZXJkb3duJywgdGhpcy5fb25UYXBTdGFydCk7XG4gICAgaWYgKHRoaXMubmF0aXZlRHJhZ2dhYmxlKSB7XG4gICAgICBvZmYoZWwsICdkcmFnb3ZlcicsIHRoaXMpO1xuICAgICAgb2ZmKGVsLCAnZHJhZ2VudGVyJywgdGhpcyk7XG4gICAgfVxuICAgIC8vIFJlbW92ZSBkcmFnZ2FibGUgYXR0cmlidXRlc1xuICAgIEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZWwucXVlcnlTZWxlY3RvckFsbCgnW2RyYWdnYWJsZV0nKSwgZnVuY3Rpb24gKGVsKSB7XG4gICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoJ2RyYWdnYWJsZScpO1xuICAgIH0pO1xuICAgIHRoaXMuX29uRHJvcCgpO1xuICAgIHRoaXMuX2Rpc2FibGVEZWxheWVkRHJhZ0V2ZW50cygpO1xuICAgIHNvcnRhYmxlcy5zcGxpY2Uoc29ydGFibGVzLmluZGV4T2YodGhpcy5lbCksIDEpO1xuICAgIHRoaXMuZWwgPSBlbCA9IG51bGw7XG4gIH0sXG4gIF9oaWRlQ2xvbmU6IGZ1bmN0aW9uIF9oaWRlQ2xvbmUoKSB7XG4gICAgaWYgKCFjbG9uZUhpZGRlbikge1xuICAgICAgcGx1Z2luRXZlbnQoJ2hpZGVDbG9uZScsIHRoaXMpO1xuICAgICAgaWYgKFNvcnRhYmxlLmV2ZW50Q2FuY2VsZWQpIHJldHVybjtcbiAgICAgIGNzcyhjbG9uZUVsLCAnZGlzcGxheScsICdub25lJyk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnJlbW92ZUNsb25lT25IaWRlICYmIGNsb25lRWwucGFyZW50Tm9kZSkge1xuICAgICAgICBjbG9uZUVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2xvbmVFbCk7XG4gICAgICB9XG4gICAgICBjbG9uZUhpZGRlbiA9IHRydWU7XG4gICAgfVxuICB9LFxuICBfc2hvd0Nsb25lOiBmdW5jdGlvbiBfc2hvd0Nsb25lKHB1dFNvcnRhYmxlKSB7XG4gICAgaWYgKHB1dFNvcnRhYmxlLmxhc3RQdXRNb2RlICE9PSAnY2xvbmUnKSB7XG4gICAgICB0aGlzLl9oaWRlQ2xvbmUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNsb25lSGlkZGVuKSB7XG4gICAgICBwbHVnaW5FdmVudCgnc2hvd0Nsb25lJywgdGhpcyk7XG4gICAgICBpZiAoU29ydGFibGUuZXZlbnRDYW5jZWxlZCkgcmV0dXJuO1xuXG4gICAgICAvLyBzaG93IGNsb25lIGF0IGRyYWdFbCBvciBvcmlnaW5hbCBwb3NpdGlvblxuICAgICAgaWYgKGRyYWdFbC5wYXJlbnROb2RlID09IHJvb3RFbCAmJiAhdGhpcy5vcHRpb25zLmdyb3VwLnJldmVydENsb25lKSB7XG4gICAgICAgIHJvb3RFbC5pbnNlcnRCZWZvcmUoY2xvbmVFbCwgZHJhZ0VsKTtcbiAgICAgIH0gZWxzZSBpZiAobmV4dEVsKSB7XG4gICAgICAgIHJvb3RFbC5pbnNlcnRCZWZvcmUoY2xvbmVFbCwgbmV4dEVsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJvb3RFbC5hcHBlbmRDaGlsZChjbG9uZUVsKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuZ3JvdXAucmV2ZXJ0Q2xvbmUpIHtcbiAgICAgICAgdGhpcy5hbmltYXRlKGRyYWdFbCwgY2xvbmVFbCk7XG4gICAgICB9XG4gICAgICBjc3MoY2xvbmVFbCwgJ2Rpc3BsYXknLCAnJyk7XG4gICAgICBjbG9uZUhpZGRlbiA9IGZhbHNlO1xuICAgIH1cbiAgfVxufTtcbmZ1bmN0aW9uIF9nbG9iYWxEcmFnT3ZlciggLyoqRXZlbnQqL2V2dCkge1xuICBpZiAoZXZ0LmRhdGFUcmFuc2Zlcikge1xuICAgIGV2dC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9ICdtb3ZlJztcbiAgfVxuICBldnQuY2FuY2VsYWJsZSAmJiBldnQucHJldmVudERlZmF1bHQoKTtcbn1cbmZ1bmN0aW9uIF9vbk1vdmUoZnJvbUVsLCB0b0VsLCBkcmFnRWwsIGRyYWdSZWN0LCB0YXJnZXRFbCwgdGFyZ2V0UmVjdCwgb3JpZ2luYWxFdmVudCwgd2lsbEluc2VydEFmdGVyKSB7XG4gIHZhciBldnQsXG4gICAgc29ydGFibGUgPSBmcm9tRWxbZXhwYW5kb10sXG4gICAgb25Nb3ZlRm4gPSBzb3J0YWJsZS5vcHRpb25zLm9uTW92ZSxcbiAgICByZXRWYWw7XG4gIC8vIFN1cHBvcnQgZm9yIG5ldyBDdXN0b21FdmVudCBmZWF0dXJlXG4gIGlmICh3aW5kb3cuQ3VzdG9tRXZlbnQgJiYgIUlFMTFPckxlc3MgJiYgIUVkZ2UpIHtcbiAgICBldnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ21vdmUnLCB7XG4gICAgICBidWJibGVzOiB0cnVlLFxuICAgICAgY2FuY2VsYWJsZTogdHJ1ZVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGV2dCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgIGV2dC5pbml0RXZlbnQoJ21vdmUnLCB0cnVlLCB0cnVlKTtcbiAgfVxuICBldnQudG8gPSB0b0VsO1xuICBldnQuZnJvbSA9IGZyb21FbDtcbiAgZXZ0LmRyYWdnZWQgPSBkcmFnRWw7XG4gIGV2dC5kcmFnZ2VkUmVjdCA9IGRyYWdSZWN0O1xuICBldnQucmVsYXRlZCA9IHRhcmdldEVsIHx8IHRvRWw7XG4gIGV2dC5yZWxhdGVkUmVjdCA9IHRhcmdldFJlY3QgfHwgZ2V0UmVjdCh0b0VsKTtcbiAgZXZ0LndpbGxJbnNlcnRBZnRlciA9IHdpbGxJbnNlcnRBZnRlcjtcbiAgZXZ0Lm9yaWdpbmFsRXZlbnQgPSBvcmlnaW5hbEV2ZW50O1xuICBmcm9tRWwuZGlzcGF0Y2hFdmVudChldnQpO1xuICBpZiAob25Nb3ZlRm4pIHtcbiAgICByZXRWYWwgPSBvbk1vdmVGbi5jYWxsKHNvcnRhYmxlLCBldnQsIG9yaWdpbmFsRXZlbnQpO1xuICB9XG4gIHJldHVybiByZXRWYWw7XG59XG5mdW5jdGlvbiBfZGlzYWJsZURyYWdnYWJsZShlbCkge1xuICBlbC5kcmFnZ2FibGUgPSBmYWxzZTtcbn1cbmZ1bmN0aW9uIF91bnNpbGVudCgpIHtcbiAgX3NpbGVudCA9IGZhbHNlO1xufVxuZnVuY3Rpb24gX2dob3N0SXNGaXJzdChldnQsIHZlcnRpY2FsLCBzb3J0YWJsZSkge1xuICB2YXIgZmlyc3RFbFJlY3QgPSBnZXRSZWN0KGdldENoaWxkKHNvcnRhYmxlLmVsLCAwLCBzb3J0YWJsZS5vcHRpb25zLCB0cnVlKSk7XG4gIHZhciBzb3J0YWJsZUNvbnRlbnRSZWN0ID0gZ2V0Q29udGVudFJlY3Qoc29ydGFibGUuZWwpO1xuICB2YXIgc3BhY2VyID0gMTA7XG4gIHJldHVybiB2ZXJ0aWNhbCA/IGV2dC5jbGllbnRYIDwgc29ydGFibGVDb250ZW50UmVjdC5sZWZ0IC0gc3BhY2VyIHx8IGV2dC5jbGllbnRZIDwgZmlyc3RFbFJlY3QudG9wICYmIGV2dC5jbGllbnRYIDwgZmlyc3RFbFJlY3QucmlnaHQgOiBldnQuY2xpZW50WSA8IHNvcnRhYmxlQ29udGVudFJlY3QudG9wIC0gc3BhY2VyIHx8IGV2dC5jbGllbnRZIDwgZmlyc3RFbFJlY3QuYm90dG9tICYmIGV2dC5jbGllbnRYIDwgZmlyc3RFbFJlY3QubGVmdDtcbn1cbmZ1bmN0aW9uIF9naG9zdElzTGFzdChldnQsIHZlcnRpY2FsLCBzb3J0YWJsZSkge1xuICB2YXIgbGFzdEVsUmVjdCA9IGdldFJlY3QobGFzdENoaWxkKHNvcnRhYmxlLmVsLCBzb3J0YWJsZS5vcHRpb25zLmRyYWdnYWJsZSkpO1xuICB2YXIgc29ydGFibGVDb250ZW50UmVjdCA9IGdldENvbnRlbnRSZWN0KHNvcnRhYmxlLmVsKTtcbiAgdmFyIHNwYWNlciA9IDEwO1xuICByZXR1cm4gdmVydGljYWwgPyBldnQuY2xpZW50WCA+IHNvcnRhYmxlQ29udGVudFJlY3QucmlnaHQgKyBzcGFjZXIgfHwgZXZ0LmNsaWVudFkgPiBsYXN0RWxSZWN0LmJvdHRvbSAmJiBldnQuY2xpZW50WCA+IGxhc3RFbFJlY3QubGVmdCA6IGV2dC5jbGllbnRZID4gc29ydGFibGVDb250ZW50UmVjdC5ib3R0b20gKyBzcGFjZXIgfHwgZXZ0LmNsaWVudFggPiBsYXN0RWxSZWN0LnJpZ2h0ICYmIGV2dC5jbGllbnRZID4gbGFzdEVsUmVjdC50b3A7XG59XG5mdW5jdGlvbiBfZ2V0U3dhcERpcmVjdGlvbihldnQsIHRhcmdldCwgdGFyZ2V0UmVjdCwgdmVydGljYWwsIHN3YXBUaHJlc2hvbGQsIGludmVydGVkU3dhcFRocmVzaG9sZCwgaW52ZXJ0U3dhcCwgaXNMYXN0VGFyZ2V0KSB7XG4gIHZhciBtb3VzZU9uQXhpcyA9IHZlcnRpY2FsID8gZXZ0LmNsaWVudFkgOiBldnQuY2xpZW50WCxcbiAgICB0YXJnZXRMZW5ndGggPSB2ZXJ0aWNhbCA/IHRhcmdldFJlY3QuaGVpZ2h0IDogdGFyZ2V0UmVjdC53aWR0aCxcbiAgICB0YXJnZXRTMSA9IHZlcnRpY2FsID8gdGFyZ2V0UmVjdC50b3AgOiB0YXJnZXRSZWN0LmxlZnQsXG4gICAgdGFyZ2V0UzIgPSB2ZXJ0aWNhbCA/IHRhcmdldFJlY3QuYm90dG9tIDogdGFyZ2V0UmVjdC5yaWdodCxcbiAgICBpbnZlcnQgPSBmYWxzZTtcbiAgaWYgKCFpbnZlcnRTd2FwKSB7XG4gICAgLy8gTmV2ZXIgaW52ZXJ0IG9yIGNyZWF0ZSBkcmFnRWwgc2hhZG93IHdoZW4gdGFyZ2V0IG1vdmVtZW5ldCBjYXVzZXMgbW91c2UgdG8gbW92ZSBwYXN0IHRoZSBlbmQgb2YgcmVndWxhciBzd2FwVGhyZXNob2xkXG4gICAgaWYgKGlzTGFzdFRhcmdldCAmJiB0YXJnZXRNb3ZlRGlzdGFuY2UgPCB0YXJnZXRMZW5ndGggKiBzd2FwVGhyZXNob2xkKSB7XG4gICAgICAvLyBtdWx0aXBsaWVkIG9ubHkgYnkgc3dhcFRocmVzaG9sZCBiZWNhdXNlIG1vdXNlIHdpbGwgYWxyZWFkeSBiZSBpbnNpZGUgdGFyZ2V0IGJ5ICgxIC0gdGhyZXNob2xkKSAqIHRhcmdldExlbmd0aCAvIDJcbiAgICAgIC8vIGNoZWNrIGlmIHBhc3QgZmlyc3QgaW52ZXJ0IHRocmVzaG9sZCBvbiBzaWRlIG9wcG9zaXRlIG9mIGxhc3REaXJlY3Rpb25cbiAgICAgIGlmICghcGFzdEZpcnN0SW52ZXJ0VGhyZXNoICYmIChsYXN0RGlyZWN0aW9uID09PSAxID8gbW91c2VPbkF4aXMgPiB0YXJnZXRTMSArIHRhcmdldExlbmd0aCAqIGludmVydGVkU3dhcFRocmVzaG9sZCAvIDIgOiBtb3VzZU9uQXhpcyA8IHRhcmdldFMyIC0gdGFyZ2V0TGVuZ3RoICogaW52ZXJ0ZWRTd2FwVGhyZXNob2xkIC8gMikpIHtcbiAgICAgICAgLy8gcGFzdCBmaXJzdCBpbnZlcnQgdGhyZXNob2xkLCBkbyBub3QgcmVzdHJpY3QgaW52ZXJ0ZWQgdGhyZXNob2xkIHRvIGRyYWdFbCBzaGFkb3dcbiAgICAgICAgcGFzdEZpcnN0SW52ZXJ0VGhyZXNoID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICghcGFzdEZpcnN0SW52ZXJ0VGhyZXNoKSB7XG4gICAgICAgIC8vIGRyYWdFbCBzaGFkb3cgKHRhcmdldCBtb3ZlIGRpc3RhbmNlIHNoYWRvdylcbiAgICAgICAgaWYgKGxhc3REaXJlY3Rpb24gPT09IDEgPyBtb3VzZU9uQXhpcyA8IHRhcmdldFMxICsgdGFyZ2V0TW92ZURpc3RhbmNlIC8vIG92ZXIgZHJhZ0VsIHNoYWRvd1xuICAgICAgICA6IG1vdXNlT25BeGlzID4gdGFyZ2V0UzIgLSB0YXJnZXRNb3ZlRGlzdGFuY2UpIHtcbiAgICAgICAgICByZXR1cm4gLWxhc3REaXJlY3Rpb247XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGludmVydCA9IHRydWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFJlZ3VsYXJcbiAgICAgIGlmIChtb3VzZU9uQXhpcyA+IHRhcmdldFMxICsgdGFyZ2V0TGVuZ3RoICogKDEgLSBzd2FwVGhyZXNob2xkKSAvIDIgJiYgbW91c2VPbkF4aXMgPCB0YXJnZXRTMiAtIHRhcmdldExlbmd0aCAqICgxIC0gc3dhcFRocmVzaG9sZCkgLyAyKSB7XG4gICAgICAgIHJldHVybiBfZ2V0SW5zZXJ0RGlyZWN0aW9uKHRhcmdldCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGludmVydCA9IGludmVydCB8fCBpbnZlcnRTd2FwO1xuICBpZiAoaW52ZXJ0KSB7XG4gICAgLy8gSW52ZXJ0IG9mIHJlZ3VsYXJcbiAgICBpZiAobW91c2VPbkF4aXMgPCB0YXJnZXRTMSArIHRhcmdldExlbmd0aCAqIGludmVydGVkU3dhcFRocmVzaG9sZCAvIDIgfHwgbW91c2VPbkF4aXMgPiB0YXJnZXRTMiAtIHRhcmdldExlbmd0aCAqIGludmVydGVkU3dhcFRocmVzaG9sZCAvIDIpIHtcbiAgICAgIHJldHVybiBtb3VzZU9uQXhpcyA+IHRhcmdldFMxICsgdGFyZ2V0TGVuZ3RoIC8gMiA/IDEgOiAtMTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIDA7XG59XG5cbi8qKlxyXG4gKiBHZXRzIHRoZSBkaXJlY3Rpb24gZHJhZ0VsIG11c3QgYmUgc3dhcHBlZCByZWxhdGl2ZSB0byB0YXJnZXQgaW4gb3JkZXIgdG8gbWFrZSBpdFxyXG4gKiBzZWVtIHRoYXQgZHJhZ0VsIGhhcyBiZWVuIFwiaW5zZXJ0ZWRcIiBpbnRvIHRoYXQgZWxlbWVudCdzIHBvc2l0aW9uXHJcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSB0YXJnZXQgICAgICAgVGhlIHRhcmdldCB3aG9zZSBwb3NpdGlvbiBkcmFnRWwgaXMgYmVpbmcgaW5zZXJ0ZWQgYXRcclxuICogQHJldHVybiB7TnVtYmVyfSAgICAgICAgICAgICAgICAgICBEaXJlY3Rpb24gZHJhZ0VsIG11c3QgYmUgc3dhcHBlZFxyXG4gKi9cbmZ1bmN0aW9uIF9nZXRJbnNlcnREaXJlY3Rpb24odGFyZ2V0KSB7XG4gIGlmIChpbmRleChkcmFnRWwpIDwgaW5kZXgodGFyZ2V0KSkge1xuICAgIHJldHVybiAxO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAtMTtcbiAgfVxufVxuXG4vKipcclxuICogR2VuZXJhdGUgaWRcclxuICogQHBhcmFtICAge0hUTUxFbGVtZW50fSBlbFxyXG4gKiBAcmV0dXJucyB7U3RyaW5nfVxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cbmZ1bmN0aW9uIF9nZW5lcmF0ZUlkKGVsKSB7XG4gIHZhciBzdHIgPSBlbC50YWdOYW1lICsgZWwuY2xhc3NOYW1lICsgZWwuc3JjICsgZWwuaHJlZiArIGVsLnRleHRDb250ZW50LFxuICAgIGkgPSBzdHIubGVuZ3RoLFxuICAgIHN1bSA9IDA7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBzdW0gKz0gc3RyLmNoYXJDb2RlQXQoaSk7XG4gIH1cbiAgcmV0dXJuIHN1bS50b1N0cmluZygzNik7XG59XG5mdW5jdGlvbiBfc2F2ZUlucHV0Q2hlY2tlZFN0YXRlKHJvb3QpIHtcbiAgc2F2ZWRJbnB1dENoZWNrZWQubGVuZ3RoID0gMDtcbiAgdmFyIGlucHV0cyA9IHJvb3QuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lucHV0Jyk7XG4gIHZhciBpZHggPSBpbnB1dHMubGVuZ3RoO1xuICB3aGlsZSAoaWR4LS0pIHtcbiAgICB2YXIgZWwgPSBpbnB1dHNbaWR4XTtcbiAgICBlbC5jaGVja2VkICYmIHNhdmVkSW5wdXRDaGVja2VkLnB1c2goZWwpO1xuICB9XG59XG5mdW5jdGlvbiBfbmV4dFRpY2soZm4pIHtcbiAgcmV0dXJuIHNldFRpbWVvdXQoZm4sIDApO1xufVxuZnVuY3Rpb24gX2NhbmNlbE5leHRUaWNrKGlkKSB7XG4gIHJldHVybiBjbGVhclRpbWVvdXQoaWQpO1xufVxuXG4vLyBGaXhlZCAjOTczOlxuaWYgKGRvY3VtZW50RXhpc3RzKSB7XG4gIG9uKGRvY3VtZW50LCAndG91Y2htb3ZlJywgZnVuY3Rpb24gKGV2dCkge1xuICAgIGlmICgoU29ydGFibGUuYWN0aXZlIHx8IGF3YWl0aW5nRHJhZ1N0YXJ0ZWQpICYmIGV2dC5jYW5jZWxhYmxlKSB7XG4gICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vLyBFeHBvcnQgdXRpbHNcblNvcnRhYmxlLnV0aWxzID0ge1xuICBvbjogb24sXG4gIG9mZjogb2ZmLFxuICBjc3M6IGNzcyxcbiAgZmluZDogZmluZCxcbiAgaXM6IGZ1bmN0aW9uIGlzKGVsLCBzZWxlY3Rvcikge1xuICAgIHJldHVybiAhIWNsb3Nlc3QoZWwsIHNlbGVjdG9yLCBlbCwgZmFsc2UpO1xuICB9LFxuICBleHRlbmQ6IGV4dGVuZCxcbiAgdGhyb3R0bGU6IHRocm90dGxlLFxuICBjbG9zZXN0OiBjbG9zZXN0LFxuICB0b2dnbGVDbGFzczogdG9nZ2xlQ2xhc3MsXG4gIGNsb25lOiBjbG9uZSxcbiAgaW5kZXg6IGluZGV4LFxuICBuZXh0VGljazogX25leHRUaWNrLFxuICBjYW5jZWxOZXh0VGljazogX2NhbmNlbE5leHRUaWNrLFxuICBkZXRlY3REaXJlY3Rpb246IF9kZXRlY3REaXJlY3Rpb24sXG4gIGdldENoaWxkOiBnZXRDaGlsZFxufTtcblxuLyoqXHJcbiAqIEdldCB0aGUgU29ydGFibGUgaW5zdGFuY2Ugb2YgYW4gZWxlbWVudFxyXG4gKiBAcGFyYW0gIHtIVE1MRWxlbWVudH0gZWxlbWVudCBUaGUgZWxlbWVudFxyXG4gKiBAcmV0dXJuIHtTb3J0YWJsZXx1bmRlZmluZWR9ICAgICAgICAgVGhlIGluc3RhbmNlIG9mIFNvcnRhYmxlXHJcbiAqL1xuU29ydGFibGUuZ2V0ID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgcmV0dXJuIGVsZW1lbnRbZXhwYW5kb107XG59O1xuXG4vKipcclxuICogTW91bnQgYSBwbHVnaW4gdG8gU29ydGFibGVcclxuICogQHBhcmFtICB7Li4uU29ydGFibGVQbHVnaW58U29ydGFibGVQbHVnaW5bXX0gcGx1Z2lucyAgICAgICBQbHVnaW5zIGJlaW5nIG1vdW50ZWRcclxuICovXG5Tb3J0YWJsZS5tb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIHBsdWdpbnMgPSBuZXcgQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgcGx1Z2luc1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgfVxuICBpZiAocGx1Z2luc1swXS5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpIHBsdWdpbnMgPSBwbHVnaW5zWzBdO1xuICBwbHVnaW5zLmZvckVhY2goZnVuY3Rpb24gKHBsdWdpbikge1xuICAgIGlmICghcGx1Z2luLnByb3RvdHlwZSB8fCAhcGx1Z2luLnByb3RvdHlwZS5jb25zdHJ1Y3Rvcikge1xuICAgICAgdGhyb3cgXCJTb3J0YWJsZTogTW91bnRlZCBwbHVnaW4gbXVzdCBiZSBhIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLCBub3QgXCIuY29uY2F0KHt9LnRvU3RyaW5nLmNhbGwocGx1Z2luKSk7XG4gICAgfVxuICAgIGlmIChwbHVnaW4udXRpbHMpIFNvcnRhYmxlLnV0aWxzID0gX29iamVjdFNwcmVhZDIoX29iamVjdFNwcmVhZDIoe30sIFNvcnRhYmxlLnV0aWxzKSwgcGx1Z2luLnV0aWxzKTtcbiAgICBQbHVnaW5NYW5hZ2VyLm1vdW50KHBsdWdpbik7XG4gIH0pO1xufTtcblxuLyoqXHJcbiAqIENyZWF0ZSBzb3J0YWJsZSBpbnN0YW5jZVxyXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSAgZWxcclxuICogQHBhcmFtIHtPYmplY3R9ICAgICAgW29wdGlvbnNdXHJcbiAqL1xuU29ydGFibGUuY3JlYXRlID0gZnVuY3Rpb24gKGVsLCBvcHRpb25zKSB7XG4gIHJldHVybiBuZXcgU29ydGFibGUoZWwsIG9wdGlvbnMpO1xufTtcblxuLy8gRXhwb3J0XG5Tb3J0YWJsZS52ZXJzaW9uID0gdmVyc2lvbjtcblxudmFyIGF1dG9TY3JvbGxzID0gW10sXG4gIHNjcm9sbEVsLFxuICBzY3JvbGxSb290RWwsXG4gIHNjcm9sbGluZyA9IGZhbHNlLFxuICBsYXN0QXV0b1Njcm9sbFgsXG4gIGxhc3RBdXRvU2Nyb2xsWSxcbiAgdG91Y2hFdnQkMSxcbiAgcG9pbnRlckVsZW1DaGFuZ2VkSW50ZXJ2YWw7XG5mdW5jdGlvbiBBdXRvU2Nyb2xsUGx1Z2luKCkge1xuICBmdW5jdGlvbiBBdXRvU2Nyb2xsKCkge1xuICAgIHRoaXMuZGVmYXVsdHMgPSB7XG4gICAgICBzY3JvbGw6IHRydWUsXG4gICAgICBmb3JjZUF1dG9TY3JvbGxGYWxsYmFjazogZmFsc2UsXG4gICAgICBzY3JvbGxTZW5zaXRpdml0eTogMzAsXG4gICAgICBzY3JvbGxTcGVlZDogMTAsXG4gICAgICBidWJibGVTY3JvbGw6IHRydWVcbiAgICB9O1xuXG4gICAgLy8gQmluZCBhbGwgcHJpdmF0ZSBtZXRob2RzXG4gICAgZm9yICh2YXIgZm4gaW4gdGhpcykge1xuICAgICAgaWYgKGZuLmNoYXJBdCgwKSA9PT0gJ18nICYmIHR5cGVvZiB0aGlzW2ZuXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzW2ZuXSA9IHRoaXNbZm5dLmJpbmQodGhpcyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIEF1dG9TY3JvbGwucHJvdG90eXBlID0ge1xuICAgIGRyYWdTdGFydGVkOiBmdW5jdGlvbiBkcmFnU3RhcnRlZChfcmVmKSB7XG4gICAgICB2YXIgb3JpZ2luYWxFdmVudCA9IF9yZWYub3JpZ2luYWxFdmVudDtcbiAgICAgIGlmICh0aGlzLnNvcnRhYmxlLm5hdGl2ZURyYWdnYWJsZSkge1xuICAgICAgICBvbihkb2N1bWVudCwgJ2RyYWdvdmVyJywgdGhpcy5faGFuZGxlQXV0b1Njcm9sbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnN1cHBvcnRQb2ludGVyKSB7XG4gICAgICAgICAgb24oZG9jdW1lbnQsICdwb2ludGVybW92ZScsIHRoaXMuX2hhbmRsZUZhbGxiYWNrQXV0b1Njcm9sbCk7XG4gICAgICAgIH0gZWxzZSBpZiAob3JpZ2luYWxFdmVudC50b3VjaGVzKSB7XG4gICAgICAgICAgb24oZG9jdW1lbnQsICd0b3VjaG1vdmUnLCB0aGlzLl9oYW5kbGVGYWxsYmFja0F1dG9TY3JvbGwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9uKGRvY3VtZW50LCAnbW91c2Vtb3ZlJywgdGhpcy5faGFuZGxlRmFsbGJhY2tBdXRvU2Nyb2xsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgZHJhZ092ZXJDb21wbGV0ZWQ6IGZ1bmN0aW9uIGRyYWdPdmVyQ29tcGxldGVkKF9yZWYyKSB7XG4gICAgICB2YXIgb3JpZ2luYWxFdmVudCA9IF9yZWYyLm9yaWdpbmFsRXZlbnQ7XG4gICAgICAvLyBGb3Igd2hlbiBidWJibGluZyBpcyBjYW5jZWxlZCBhbmQgdXNpbmcgZmFsbGJhY2sgKGZhbGxiYWNrICd0b3VjaG1vdmUnIGFsd2F5cyByZWFjaGVkKVxuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuZHJhZ092ZXJCdWJibGUgJiYgIW9yaWdpbmFsRXZlbnQucm9vdEVsKSB7XG4gICAgICAgIHRoaXMuX2hhbmRsZUF1dG9TY3JvbGwob3JpZ2luYWxFdmVudCk7XG4gICAgICB9XG4gICAgfSxcbiAgICBkcm9wOiBmdW5jdGlvbiBkcm9wKCkge1xuICAgICAgaWYgKHRoaXMuc29ydGFibGUubmF0aXZlRHJhZ2dhYmxlKSB7XG4gICAgICAgIG9mZihkb2N1bWVudCwgJ2RyYWdvdmVyJywgdGhpcy5faGFuZGxlQXV0b1Njcm9sbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvZmYoZG9jdW1lbnQsICdwb2ludGVybW92ZScsIHRoaXMuX2hhbmRsZUZhbGxiYWNrQXV0b1Njcm9sbCk7XG4gICAgICAgIG9mZihkb2N1bWVudCwgJ3RvdWNobW92ZScsIHRoaXMuX2hhbmRsZUZhbGxiYWNrQXV0b1Njcm9sbCk7XG4gICAgICAgIG9mZihkb2N1bWVudCwgJ21vdXNlbW92ZScsIHRoaXMuX2hhbmRsZUZhbGxiYWNrQXV0b1Njcm9sbCk7XG4gICAgICB9XG4gICAgICBjbGVhclBvaW50ZXJFbGVtQ2hhbmdlZEludGVydmFsKCk7XG4gICAgICBjbGVhckF1dG9TY3JvbGxzKCk7XG4gICAgICBjYW5jZWxUaHJvdHRsZSgpO1xuICAgIH0sXG4gICAgbnVsbGluZzogZnVuY3Rpb24gbnVsbGluZygpIHtcbiAgICAgIHRvdWNoRXZ0JDEgPSBzY3JvbGxSb290RWwgPSBzY3JvbGxFbCA9IHNjcm9sbGluZyA9IHBvaW50ZXJFbGVtQ2hhbmdlZEludGVydmFsID0gbGFzdEF1dG9TY3JvbGxYID0gbGFzdEF1dG9TY3JvbGxZID0gbnVsbDtcbiAgICAgIGF1dG9TY3JvbGxzLmxlbmd0aCA9IDA7XG4gICAgfSxcbiAgICBfaGFuZGxlRmFsbGJhY2tBdXRvU2Nyb2xsOiBmdW5jdGlvbiBfaGFuZGxlRmFsbGJhY2tBdXRvU2Nyb2xsKGV2dCkge1xuICAgICAgdGhpcy5faGFuZGxlQXV0b1Njcm9sbChldnQsIHRydWUpO1xuICAgIH0sXG4gICAgX2hhbmRsZUF1dG9TY3JvbGw6IGZ1bmN0aW9uIF9oYW5kbGVBdXRvU2Nyb2xsKGV2dCwgZmFsbGJhY2spIHtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICB2YXIgeCA9IChldnQudG91Y2hlcyA/IGV2dC50b3VjaGVzWzBdIDogZXZ0KS5jbGllbnRYLFxuICAgICAgICB5ID0gKGV2dC50b3VjaGVzID8gZXZ0LnRvdWNoZXNbMF0gOiBldnQpLmNsaWVudFksXG4gICAgICAgIGVsZW0gPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHgsIHkpO1xuICAgICAgdG91Y2hFdnQkMSA9IGV2dDtcblxuICAgICAgLy8gSUUgZG9lcyBub3Qgc2VlbSB0byBoYXZlIG5hdGl2ZSBhdXRvc2Nyb2xsLFxuICAgICAgLy8gRWRnZSdzIGF1dG9zY3JvbGwgc2VlbXMgdG9vIGNvbmRpdGlvbmFsLFxuICAgICAgLy8gTUFDT1MgU2FmYXJpIGRvZXMgbm90IGhhdmUgYXV0b3Njcm9sbCxcbiAgICAgIC8vIEZpcmVmb3ggYW5kIENocm9tZSBhcmUgZ29vZFxuICAgICAgaWYgKGZhbGxiYWNrIHx8IHRoaXMub3B0aW9ucy5mb3JjZUF1dG9TY3JvbGxGYWxsYmFjayB8fCBFZGdlIHx8IElFMTFPckxlc3MgfHwgU2FmYXJpKSB7XG4gICAgICAgIGF1dG9TY3JvbGwoZXZ0LCB0aGlzLm9wdGlvbnMsIGVsZW0sIGZhbGxiYWNrKTtcblxuICAgICAgICAvLyBMaXN0ZW5lciBmb3IgcG9pbnRlciBlbGVtZW50IGNoYW5nZVxuICAgICAgICB2YXIgb2dFbGVtU2Nyb2xsZXIgPSBnZXRQYXJlbnRBdXRvU2Nyb2xsRWxlbWVudChlbGVtLCB0cnVlKTtcbiAgICAgICAgaWYgKHNjcm9sbGluZyAmJiAoIXBvaW50ZXJFbGVtQ2hhbmdlZEludGVydmFsIHx8IHggIT09IGxhc3RBdXRvU2Nyb2xsWCB8fCB5ICE9PSBsYXN0QXV0b1Njcm9sbFkpKSB7XG4gICAgICAgICAgcG9pbnRlckVsZW1DaGFuZ2VkSW50ZXJ2YWwgJiYgY2xlYXJQb2ludGVyRWxlbUNoYW5nZWRJbnRlcnZhbCgpO1xuICAgICAgICAgIC8vIERldGVjdCBmb3IgcG9pbnRlciBlbGVtIGNoYW5nZSwgZW11bGF0aW5nIG5hdGl2ZSBEbkQgYmVoYXZpb3VyXG4gICAgICAgICAgcG9pbnRlckVsZW1DaGFuZ2VkSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbmV3RWxlbSA9IGdldFBhcmVudEF1dG9TY3JvbGxFbGVtZW50KGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQoeCwgeSksIHRydWUpO1xuICAgICAgICAgICAgaWYgKG5ld0VsZW0gIT09IG9nRWxlbVNjcm9sbGVyKSB7XG4gICAgICAgICAgICAgIG9nRWxlbVNjcm9sbGVyID0gbmV3RWxlbTtcbiAgICAgICAgICAgICAgY2xlYXJBdXRvU2Nyb2xscygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXV0b1Njcm9sbChldnQsIF90aGlzLm9wdGlvbnMsIG5ld0VsZW0sIGZhbGxiYWNrKTtcbiAgICAgICAgICB9LCAxMCk7XG4gICAgICAgICAgbGFzdEF1dG9TY3JvbGxYID0geDtcbiAgICAgICAgICBsYXN0QXV0b1Njcm9sbFkgPSB5O1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBpZiBEbkQgaXMgZW5hYmxlZCAoYW5kIGJyb3dzZXIgaGFzIGdvb2QgYXV0b3Njcm9sbGluZyksIGZpcnN0IGF1dG9zY3JvbGwgd2lsbCBhbHJlYWR5IHNjcm9sbCwgc28gZ2V0IHBhcmVudCBhdXRvc2Nyb2xsIG9mIGZpcnN0IGF1dG9zY3JvbGxcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuYnViYmxlU2Nyb2xsIHx8IGdldFBhcmVudEF1dG9TY3JvbGxFbGVtZW50KGVsZW0sIHRydWUpID09PSBnZXRXaW5kb3dTY3JvbGxpbmdFbGVtZW50KCkpIHtcbiAgICAgICAgICBjbGVhckF1dG9TY3JvbGxzKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGF1dG9TY3JvbGwoZXZ0LCB0aGlzLm9wdGlvbnMsIGdldFBhcmVudEF1dG9TY3JvbGxFbGVtZW50KGVsZW0sIGZhbHNlKSwgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgcmV0dXJuIF9leHRlbmRzKEF1dG9TY3JvbGwsIHtcbiAgICBwbHVnaW5OYW1lOiAnc2Nyb2xsJyxcbiAgICBpbml0aWFsaXplQnlEZWZhdWx0OiB0cnVlXG4gIH0pO1xufVxuZnVuY3Rpb24gY2xlYXJBdXRvU2Nyb2xscygpIHtcbiAgYXV0b1Njcm9sbHMuZm9yRWFjaChmdW5jdGlvbiAoYXV0b1Njcm9sbCkge1xuICAgIGNsZWFySW50ZXJ2YWwoYXV0b1Njcm9sbC5waWQpO1xuICB9KTtcbiAgYXV0b1Njcm9sbHMgPSBbXTtcbn1cbmZ1bmN0aW9uIGNsZWFyUG9pbnRlckVsZW1DaGFuZ2VkSW50ZXJ2YWwoKSB7XG4gIGNsZWFySW50ZXJ2YWwocG9pbnRlckVsZW1DaGFuZ2VkSW50ZXJ2YWwpO1xufVxudmFyIGF1dG9TY3JvbGwgPSB0aHJvdHRsZShmdW5jdGlvbiAoZXZ0LCBvcHRpb25zLCByb290RWwsIGlzRmFsbGJhY2spIHtcbiAgLy8gQnVnOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD01MDU1MjFcbiAgaWYgKCFvcHRpb25zLnNjcm9sbCkgcmV0dXJuO1xuICB2YXIgeCA9IChldnQudG91Y2hlcyA/IGV2dC50b3VjaGVzWzBdIDogZXZ0KS5jbGllbnRYLFxuICAgIHkgPSAoZXZ0LnRvdWNoZXMgPyBldnQudG91Y2hlc1swXSA6IGV2dCkuY2xpZW50WSxcbiAgICBzZW5zID0gb3B0aW9ucy5zY3JvbGxTZW5zaXRpdml0eSxcbiAgICBzcGVlZCA9IG9wdGlvbnMuc2Nyb2xsU3BlZWQsXG4gICAgd2luU2Nyb2xsZXIgPSBnZXRXaW5kb3dTY3JvbGxpbmdFbGVtZW50KCk7XG4gIHZhciBzY3JvbGxUaGlzSW5zdGFuY2UgPSBmYWxzZSxcbiAgICBzY3JvbGxDdXN0b21GbjtcblxuICAvLyBOZXcgc2Nyb2xsIHJvb3QsIHNldCBzY3JvbGxFbFxuICBpZiAoc2Nyb2xsUm9vdEVsICE9PSByb290RWwpIHtcbiAgICBzY3JvbGxSb290RWwgPSByb290RWw7XG4gICAgY2xlYXJBdXRvU2Nyb2xscygpO1xuICAgIHNjcm9sbEVsID0gb3B0aW9ucy5zY3JvbGw7XG4gICAgc2Nyb2xsQ3VzdG9tRm4gPSBvcHRpb25zLnNjcm9sbEZuO1xuICAgIGlmIChzY3JvbGxFbCA9PT0gdHJ1ZSkge1xuICAgICAgc2Nyb2xsRWwgPSBnZXRQYXJlbnRBdXRvU2Nyb2xsRWxlbWVudChyb290RWwsIHRydWUpO1xuICAgIH1cbiAgfVxuICB2YXIgbGF5ZXJzT3V0ID0gMDtcbiAgdmFyIGN1cnJlbnRQYXJlbnQgPSBzY3JvbGxFbDtcbiAgZG8ge1xuICAgIHZhciBlbCA9IGN1cnJlbnRQYXJlbnQsXG4gICAgICByZWN0ID0gZ2V0UmVjdChlbCksXG4gICAgICB0b3AgPSByZWN0LnRvcCxcbiAgICAgIGJvdHRvbSA9IHJlY3QuYm90dG9tLFxuICAgICAgbGVmdCA9IHJlY3QubGVmdCxcbiAgICAgIHJpZ2h0ID0gcmVjdC5yaWdodCxcbiAgICAgIHdpZHRoID0gcmVjdC53aWR0aCxcbiAgICAgIGhlaWdodCA9IHJlY3QuaGVpZ2h0LFxuICAgICAgY2FuU2Nyb2xsWCA9IHZvaWQgMCxcbiAgICAgIGNhblNjcm9sbFkgPSB2b2lkIDAsXG4gICAgICBzY3JvbGxXaWR0aCA9IGVsLnNjcm9sbFdpZHRoLFxuICAgICAgc2Nyb2xsSGVpZ2h0ID0gZWwuc2Nyb2xsSGVpZ2h0LFxuICAgICAgZWxDU1MgPSBjc3MoZWwpLFxuICAgICAgc2Nyb2xsUG9zWCA9IGVsLnNjcm9sbExlZnQsXG4gICAgICBzY3JvbGxQb3NZID0gZWwuc2Nyb2xsVG9wO1xuICAgIGlmIChlbCA9PT0gd2luU2Nyb2xsZXIpIHtcbiAgICAgIGNhblNjcm9sbFggPSB3aWR0aCA8IHNjcm9sbFdpZHRoICYmIChlbENTUy5vdmVyZmxvd1ggPT09ICdhdXRvJyB8fCBlbENTUy5vdmVyZmxvd1ggPT09ICdzY3JvbGwnIHx8IGVsQ1NTLm92ZXJmbG93WCA9PT0gJ3Zpc2libGUnKTtcbiAgICAgIGNhblNjcm9sbFkgPSBoZWlnaHQgPCBzY3JvbGxIZWlnaHQgJiYgKGVsQ1NTLm92ZXJmbG93WSA9PT0gJ2F1dG8nIHx8IGVsQ1NTLm92ZXJmbG93WSA9PT0gJ3Njcm9sbCcgfHwgZWxDU1Mub3ZlcmZsb3dZID09PSAndmlzaWJsZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYW5TY3JvbGxYID0gd2lkdGggPCBzY3JvbGxXaWR0aCAmJiAoZWxDU1Mub3ZlcmZsb3dYID09PSAnYXV0bycgfHwgZWxDU1Mub3ZlcmZsb3dYID09PSAnc2Nyb2xsJyk7XG4gICAgICBjYW5TY3JvbGxZID0gaGVpZ2h0IDwgc2Nyb2xsSGVpZ2h0ICYmIChlbENTUy5vdmVyZmxvd1kgPT09ICdhdXRvJyB8fCBlbENTUy5vdmVyZmxvd1kgPT09ICdzY3JvbGwnKTtcbiAgICB9XG4gICAgdmFyIHZ4ID0gY2FuU2Nyb2xsWCAmJiAoTWF0aC5hYnMocmlnaHQgLSB4KSA8PSBzZW5zICYmIHNjcm9sbFBvc1ggKyB3aWR0aCA8IHNjcm9sbFdpZHRoKSAtIChNYXRoLmFicyhsZWZ0IC0geCkgPD0gc2VucyAmJiAhIXNjcm9sbFBvc1gpO1xuICAgIHZhciB2eSA9IGNhblNjcm9sbFkgJiYgKE1hdGguYWJzKGJvdHRvbSAtIHkpIDw9IHNlbnMgJiYgc2Nyb2xsUG9zWSArIGhlaWdodCA8IHNjcm9sbEhlaWdodCkgLSAoTWF0aC5hYnModG9wIC0geSkgPD0gc2VucyAmJiAhIXNjcm9sbFBvc1kpO1xuICAgIGlmICghYXV0b1Njcm9sbHNbbGF5ZXJzT3V0XSkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gbGF5ZXJzT3V0OyBpKyspIHtcbiAgICAgICAgaWYgKCFhdXRvU2Nyb2xsc1tpXSkge1xuICAgICAgICAgIGF1dG9TY3JvbGxzW2ldID0ge307XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGF1dG9TY3JvbGxzW2xheWVyc091dF0udnggIT0gdnggfHwgYXV0b1Njcm9sbHNbbGF5ZXJzT3V0XS52eSAhPSB2eSB8fCBhdXRvU2Nyb2xsc1tsYXllcnNPdXRdLmVsICE9PSBlbCkge1xuICAgICAgYXV0b1Njcm9sbHNbbGF5ZXJzT3V0XS5lbCA9IGVsO1xuICAgICAgYXV0b1Njcm9sbHNbbGF5ZXJzT3V0XS52eCA9IHZ4O1xuICAgICAgYXV0b1Njcm9sbHNbbGF5ZXJzT3V0XS52eSA9IHZ5O1xuICAgICAgY2xlYXJJbnRlcnZhbChhdXRvU2Nyb2xsc1tsYXllcnNPdXRdLnBpZCk7XG4gICAgICBpZiAodnggIT0gMCB8fCB2eSAhPSAwKSB7XG4gICAgICAgIHNjcm9sbFRoaXNJbnN0YW5jZSA9IHRydWU7XG4gICAgICAgIC8qIGpzaGludCBsb29wZnVuYzp0cnVlICovXG4gICAgICAgIGF1dG9TY3JvbGxzW2xheWVyc091dF0ucGlkID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIC8vIGVtdWxhdGUgZHJhZyBvdmVyIGR1cmluZyBhdXRvc2Nyb2xsIChmYWxsYmFjayksIGVtdWxhdGluZyBuYXRpdmUgRG5EIGJlaGF2aW91clxuICAgICAgICAgIGlmIChpc0ZhbGxiYWNrICYmIHRoaXMubGF5ZXIgPT09IDApIHtcbiAgICAgICAgICAgIFNvcnRhYmxlLmFjdGl2ZS5fb25Ub3VjaE1vdmUodG91Y2hFdnQkMSk7IC8vIFRvIG1vdmUgZ2hvc3QgaWYgaXQgaXMgcG9zaXRpb25lZCBhYnNvbHV0ZWx5XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBzY3JvbGxPZmZzZXRZID0gYXV0b1Njcm9sbHNbdGhpcy5sYXllcl0udnkgPyBhdXRvU2Nyb2xsc1t0aGlzLmxheWVyXS52eSAqIHNwZWVkIDogMDtcbiAgICAgICAgICB2YXIgc2Nyb2xsT2Zmc2V0WCA9IGF1dG9TY3JvbGxzW3RoaXMubGF5ZXJdLnZ4ID8gYXV0b1Njcm9sbHNbdGhpcy5sYXllcl0udnggKiBzcGVlZCA6IDA7XG4gICAgICAgICAgaWYgKHR5cGVvZiBzY3JvbGxDdXN0b21GbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgaWYgKHNjcm9sbEN1c3RvbUZuLmNhbGwoU29ydGFibGUuZHJhZ2dlZC5wYXJlbnROb2RlW2V4cGFuZG9dLCBzY3JvbGxPZmZzZXRYLCBzY3JvbGxPZmZzZXRZLCBldnQsIHRvdWNoRXZ0JDEsIGF1dG9TY3JvbGxzW3RoaXMubGF5ZXJdLmVsKSAhPT0gJ2NvbnRpbnVlJykge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHNjcm9sbEJ5KGF1dG9TY3JvbGxzW3RoaXMubGF5ZXJdLmVsLCBzY3JvbGxPZmZzZXRYLCBzY3JvbGxPZmZzZXRZKTtcbiAgICAgICAgfS5iaW5kKHtcbiAgICAgICAgICBsYXllcjogbGF5ZXJzT3V0XG4gICAgICAgIH0pLCAyNCk7XG4gICAgICB9XG4gICAgfVxuICAgIGxheWVyc091dCsrO1xuICB9IHdoaWxlIChvcHRpb25zLmJ1YmJsZVNjcm9sbCAmJiBjdXJyZW50UGFyZW50ICE9PSB3aW5TY3JvbGxlciAmJiAoY3VycmVudFBhcmVudCA9IGdldFBhcmVudEF1dG9TY3JvbGxFbGVtZW50KGN1cnJlbnRQYXJlbnQsIGZhbHNlKSkpO1xuICBzY3JvbGxpbmcgPSBzY3JvbGxUaGlzSW5zdGFuY2U7IC8vIGluIGNhc2UgYW5vdGhlciBmdW5jdGlvbiBjYXRjaGVzIHNjcm9sbGluZyBhcyBmYWxzZSBpbiBiZXR3ZWVuIHdoZW4gaXQgaXMgbm90XG59LCAzMCk7XG5cbnZhciBkcm9wID0gZnVuY3Rpb24gZHJvcChfcmVmKSB7XG4gIHZhciBvcmlnaW5hbEV2ZW50ID0gX3JlZi5vcmlnaW5hbEV2ZW50LFxuICAgIHB1dFNvcnRhYmxlID0gX3JlZi5wdXRTb3J0YWJsZSxcbiAgICBkcmFnRWwgPSBfcmVmLmRyYWdFbCxcbiAgICBhY3RpdmVTb3J0YWJsZSA9IF9yZWYuYWN0aXZlU29ydGFibGUsXG4gICAgZGlzcGF0Y2hTb3J0YWJsZUV2ZW50ID0gX3JlZi5kaXNwYXRjaFNvcnRhYmxlRXZlbnQsXG4gICAgaGlkZUdob3N0Rm9yVGFyZ2V0ID0gX3JlZi5oaWRlR2hvc3RGb3JUYXJnZXQsXG4gICAgdW5oaWRlR2hvc3RGb3JUYXJnZXQgPSBfcmVmLnVuaGlkZUdob3N0Rm9yVGFyZ2V0O1xuICBpZiAoIW9yaWdpbmFsRXZlbnQpIHJldHVybjtcbiAgdmFyIHRvU29ydGFibGUgPSBwdXRTb3J0YWJsZSB8fCBhY3RpdmVTb3J0YWJsZTtcbiAgaGlkZUdob3N0Rm9yVGFyZ2V0KCk7XG4gIHZhciB0b3VjaCA9IG9yaWdpbmFsRXZlbnQuY2hhbmdlZFRvdWNoZXMgJiYgb3JpZ2luYWxFdmVudC5jaGFuZ2VkVG91Y2hlcy5sZW5ndGggPyBvcmlnaW5hbEV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdIDogb3JpZ2luYWxFdmVudDtcbiAgdmFyIHRhcmdldCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQodG91Y2guY2xpZW50WCwgdG91Y2guY2xpZW50WSk7XG4gIHVuaGlkZUdob3N0Rm9yVGFyZ2V0KCk7XG4gIGlmICh0b1NvcnRhYmxlICYmICF0b1NvcnRhYmxlLmVsLmNvbnRhaW5zKHRhcmdldCkpIHtcbiAgICBkaXNwYXRjaFNvcnRhYmxlRXZlbnQoJ3NwaWxsJyk7XG4gICAgdGhpcy5vblNwaWxsKHtcbiAgICAgIGRyYWdFbDogZHJhZ0VsLFxuICAgICAgcHV0U29ydGFibGU6IHB1dFNvcnRhYmxlXG4gICAgfSk7XG4gIH1cbn07XG5mdW5jdGlvbiBSZXZlcnQoKSB7fVxuUmV2ZXJ0LnByb3RvdHlwZSA9IHtcbiAgc3RhcnRJbmRleDogbnVsbCxcbiAgZHJhZ1N0YXJ0OiBmdW5jdGlvbiBkcmFnU3RhcnQoX3JlZjIpIHtcbiAgICB2YXIgb2xkRHJhZ2dhYmxlSW5kZXggPSBfcmVmMi5vbGREcmFnZ2FibGVJbmRleDtcbiAgICB0aGlzLnN0YXJ0SW5kZXggPSBvbGREcmFnZ2FibGVJbmRleDtcbiAgfSxcbiAgb25TcGlsbDogZnVuY3Rpb24gb25TcGlsbChfcmVmMykge1xuICAgIHZhciBkcmFnRWwgPSBfcmVmMy5kcmFnRWwsXG4gICAgICBwdXRTb3J0YWJsZSA9IF9yZWYzLnB1dFNvcnRhYmxlO1xuICAgIHRoaXMuc29ydGFibGUuY2FwdHVyZUFuaW1hdGlvblN0YXRlKCk7XG4gICAgaWYgKHB1dFNvcnRhYmxlKSB7XG4gICAgICBwdXRTb3J0YWJsZS5jYXB0dXJlQW5pbWF0aW9uU3RhdGUoKTtcbiAgICB9XG4gICAgdmFyIG5leHRTaWJsaW5nID0gZ2V0Q2hpbGQodGhpcy5zb3J0YWJsZS5lbCwgdGhpcy5zdGFydEluZGV4LCB0aGlzLm9wdGlvbnMpO1xuICAgIGlmIChuZXh0U2libGluZykge1xuICAgICAgdGhpcy5zb3J0YWJsZS5lbC5pbnNlcnRCZWZvcmUoZHJhZ0VsLCBuZXh0U2libGluZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc29ydGFibGUuZWwuYXBwZW5kQ2hpbGQoZHJhZ0VsKTtcbiAgICB9XG4gICAgdGhpcy5zb3J0YWJsZS5hbmltYXRlQWxsKCk7XG4gICAgaWYgKHB1dFNvcnRhYmxlKSB7XG4gICAgICBwdXRTb3J0YWJsZS5hbmltYXRlQWxsKCk7XG4gICAgfVxuICB9LFxuICBkcm9wOiBkcm9wXG59O1xuX2V4dGVuZHMoUmV2ZXJ0LCB7XG4gIHBsdWdpbk5hbWU6ICdyZXZlcnRPblNwaWxsJ1xufSk7XG5mdW5jdGlvbiBSZW1vdmUoKSB7fVxuUmVtb3ZlLnByb3RvdHlwZSA9IHtcbiAgb25TcGlsbDogZnVuY3Rpb24gb25TcGlsbChfcmVmNCkge1xuICAgIHZhciBkcmFnRWwgPSBfcmVmNC5kcmFnRWwsXG4gICAgICBwdXRTb3J0YWJsZSA9IF9yZWY0LnB1dFNvcnRhYmxlO1xuICAgIHZhciBwYXJlbnRTb3J0YWJsZSA9IHB1dFNvcnRhYmxlIHx8IHRoaXMuc29ydGFibGU7XG4gICAgcGFyZW50U29ydGFibGUuY2FwdHVyZUFuaW1hdGlvblN0YXRlKCk7XG4gICAgZHJhZ0VsLnBhcmVudE5vZGUgJiYgZHJhZ0VsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZHJhZ0VsKTtcbiAgICBwYXJlbnRTb3J0YWJsZS5hbmltYXRlQWxsKCk7XG4gIH0sXG4gIGRyb3A6IGRyb3Bcbn07XG5fZXh0ZW5kcyhSZW1vdmUsIHtcbiAgcGx1Z2luTmFtZTogJ3JlbW92ZU9uU3BpbGwnXG59KTtcblxudmFyIGxhc3RTd2FwRWw7XG5mdW5jdGlvbiBTd2FwUGx1Z2luKCkge1xuICBmdW5jdGlvbiBTd2FwKCkge1xuICAgIHRoaXMuZGVmYXVsdHMgPSB7XG4gICAgICBzd2FwQ2xhc3M6ICdzb3J0YWJsZS1zd2FwLWhpZ2hsaWdodCdcbiAgICB9O1xuICB9XG4gIFN3YXAucHJvdG90eXBlID0ge1xuICAgIGRyYWdTdGFydDogZnVuY3Rpb24gZHJhZ1N0YXJ0KF9yZWYpIHtcbiAgICAgIHZhciBkcmFnRWwgPSBfcmVmLmRyYWdFbDtcbiAgICAgIGxhc3RTd2FwRWwgPSBkcmFnRWw7XG4gICAgfSxcbiAgICBkcmFnT3ZlclZhbGlkOiBmdW5jdGlvbiBkcmFnT3ZlclZhbGlkKF9yZWYyKSB7XG4gICAgICB2YXIgY29tcGxldGVkID0gX3JlZjIuY29tcGxldGVkLFxuICAgICAgICB0YXJnZXQgPSBfcmVmMi50YXJnZXQsXG4gICAgICAgIG9uTW92ZSA9IF9yZWYyLm9uTW92ZSxcbiAgICAgICAgYWN0aXZlU29ydGFibGUgPSBfcmVmMi5hY3RpdmVTb3J0YWJsZSxcbiAgICAgICAgY2hhbmdlZCA9IF9yZWYyLmNoYW5nZWQsXG4gICAgICAgIGNhbmNlbCA9IF9yZWYyLmNhbmNlbDtcbiAgICAgIGlmICghYWN0aXZlU29ydGFibGUub3B0aW9ucy5zd2FwKSByZXR1cm47XG4gICAgICB2YXIgZWwgPSB0aGlzLnNvcnRhYmxlLmVsLFxuICAgICAgICBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgaWYgKHRhcmdldCAmJiB0YXJnZXQgIT09IGVsKSB7XG4gICAgICAgIHZhciBwcmV2U3dhcEVsID0gbGFzdFN3YXBFbDtcbiAgICAgICAgaWYgKG9uTW92ZSh0YXJnZXQpICE9PSBmYWxzZSkge1xuICAgICAgICAgIHRvZ2dsZUNsYXNzKHRhcmdldCwgb3B0aW9ucy5zd2FwQ2xhc3MsIHRydWUpO1xuICAgICAgICAgIGxhc3RTd2FwRWwgPSB0YXJnZXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGFzdFN3YXBFbCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByZXZTd2FwRWwgJiYgcHJldlN3YXBFbCAhPT0gbGFzdFN3YXBFbCkge1xuICAgICAgICAgIHRvZ2dsZUNsYXNzKHByZXZTd2FwRWwsIG9wdGlvbnMuc3dhcENsYXNzLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNoYW5nZWQoKTtcbiAgICAgIGNvbXBsZXRlZCh0cnVlKTtcbiAgICAgIGNhbmNlbCgpO1xuICAgIH0sXG4gICAgZHJvcDogZnVuY3Rpb24gZHJvcChfcmVmMykge1xuICAgICAgdmFyIGFjdGl2ZVNvcnRhYmxlID0gX3JlZjMuYWN0aXZlU29ydGFibGUsXG4gICAgICAgIHB1dFNvcnRhYmxlID0gX3JlZjMucHV0U29ydGFibGUsXG4gICAgICAgIGRyYWdFbCA9IF9yZWYzLmRyYWdFbDtcbiAgICAgIHZhciB0b1NvcnRhYmxlID0gcHV0U29ydGFibGUgfHwgdGhpcy5zb3J0YWJsZTtcbiAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgbGFzdFN3YXBFbCAmJiB0b2dnbGVDbGFzcyhsYXN0U3dhcEVsLCBvcHRpb25zLnN3YXBDbGFzcywgZmFsc2UpO1xuICAgICAgaWYgKGxhc3RTd2FwRWwgJiYgKG9wdGlvbnMuc3dhcCB8fCBwdXRTb3J0YWJsZSAmJiBwdXRTb3J0YWJsZS5vcHRpb25zLnN3YXApKSB7XG4gICAgICAgIGlmIChkcmFnRWwgIT09IGxhc3RTd2FwRWwpIHtcbiAgICAgICAgICB0b1NvcnRhYmxlLmNhcHR1cmVBbmltYXRpb25TdGF0ZSgpO1xuICAgICAgICAgIGlmICh0b1NvcnRhYmxlICE9PSBhY3RpdmVTb3J0YWJsZSkgYWN0aXZlU29ydGFibGUuY2FwdHVyZUFuaW1hdGlvblN0YXRlKCk7XG4gICAgICAgICAgc3dhcE5vZGVzKGRyYWdFbCwgbGFzdFN3YXBFbCk7XG4gICAgICAgICAgdG9Tb3J0YWJsZS5hbmltYXRlQWxsKCk7XG4gICAgICAgICAgaWYgKHRvU29ydGFibGUgIT09IGFjdGl2ZVNvcnRhYmxlKSBhY3RpdmVTb3J0YWJsZS5hbmltYXRlQWxsKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIG51bGxpbmc6IGZ1bmN0aW9uIG51bGxpbmcoKSB7XG4gICAgICBsYXN0U3dhcEVsID0gbnVsbDtcbiAgICB9XG4gIH07XG4gIHJldHVybiBfZXh0ZW5kcyhTd2FwLCB7XG4gICAgcGx1Z2luTmFtZTogJ3N3YXAnLFxuICAgIGV2ZW50UHJvcGVydGllczogZnVuY3Rpb24gZXZlbnRQcm9wZXJ0aWVzKCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3dhcEl0ZW06IGxhc3RTd2FwRWxcbiAgICAgIH07XG4gICAgfVxuICB9KTtcbn1cbmZ1bmN0aW9uIHN3YXBOb2RlcyhuMSwgbjIpIHtcbiAgdmFyIHAxID0gbjEucGFyZW50Tm9kZSxcbiAgICBwMiA9IG4yLnBhcmVudE5vZGUsXG4gICAgaTEsXG4gICAgaTI7XG4gIGlmICghcDEgfHwgIXAyIHx8IHAxLmlzRXF1YWxOb2RlKG4yKSB8fCBwMi5pc0VxdWFsTm9kZShuMSkpIHJldHVybjtcbiAgaTEgPSBpbmRleChuMSk7XG4gIGkyID0gaW5kZXgobjIpO1xuICBpZiAocDEuaXNFcXVhbE5vZGUocDIpICYmIGkxIDwgaTIpIHtcbiAgICBpMisrO1xuICB9XG4gIHAxLmluc2VydEJlZm9yZShuMiwgcDEuY2hpbGRyZW5baTFdKTtcbiAgcDIuaW5zZXJ0QmVmb3JlKG4xLCBwMi5jaGlsZHJlbltpMl0pO1xufVxuXG52YXIgbXVsdGlEcmFnRWxlbWVudHMgPSBbXSxcbiAgbXVsdGlEcmFnQ2xvbmVzID0gW10sXG4gIGxhc3RNdWx0aURyYWdTZWxlY3QsXG4gIC8vIGZvciBzZWxlY3Rpb24gd2l0aCBtb2RpZmllciBrZXkgZG93biAoU0hJRlQpXG4gIG11bHRpRHJhZ1NvcnRhYmxlLFxuICBpbml0aWFsRm9sZGluZyA9IGZhbHNlLFxuICAvLyBJbml0aWFsIG11bHRpLWRyYWcgZm9sZCB3aGVuIGRyYWcgc3RhcnRlZFxuICBmb2xkaW5nID0gZmFsc2UsXG4gIC8vIEZvbGRpbmcgYW55IG90aGVyIHRpbWVcbiAgZHJhZ1N0YXJ0ZWQgPSBmYWxzZSxcbiAgZHJhZ0VsJDEsXG4gIGNsb25lc0Zyb21SZWN0LFxuICBjbG9uZXNIaWRkZW47XG5mdW5jdGlvbiBNdWx0aURyYWdQbHVnaW4oKSB7XG4gIGZ1bmN0aW9uIE11bHRpRHJhZyhzb3J0YWJsZSkge1xuICAgIC8vIEJpbmQgYWxsIHByaXZhdGUgbWV0aG9kc1xuICAgIGZvciAodmFyIGZuIGluIHRoaXMpIHtcbiAgICAgIGlmIChmbi5jaGFyQXQoMCkgPT09ICdfJyAmJiB0eXBlb2YgdGhpc1tmbl0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpc1tmbl0gPSB0aGlzW2ZuXS5iaW5kKHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXNvcnRhYmxlLm9wdGlvbnMuYXZvaWRJbXBsaWNpdERlc2VsZWN0KSB7XG4gICAgICBpZiAoc29ydGFibGUub3B0aW9ucy5zdXBwb3J0UG9pbnRlcikge1xuICAgICAgICBvbihkb2N1bWVudCwgJ3BvaW50ZXJ1cCcsIHRoaXMuX2Rlc2VsZWN0TXVsdGlEcmFnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9uKGRvY3VtZW50LCAnbW91c2V1cCcsIHRoaXMuX2Rlc2VsZWN0TXVsdGlEcmFnKTtcbiAgICAgICAgb24oZG9jdW1lbnQsICd0b3VjaGVuZCcsIHRoaXMuX2Rlc2VsZWN0TXVsdGlEcmFnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgb24oZG9jdW1lbnQsICdrZXlkb3duJywgdGhpcy5fY2hlY2tLZXlEb3duKTtcbiAgICBvbihkb2N1bWVudCwgJ2tleXVwJywgdGhpcy5fY2hlY2tLZXlVcCk7XG4gICAgdGhpcy5kZWZhdWx0cyA9IHtcbiAgICAgIHNlbGVjdGVkQ2xhc3M6ICdzb3J0YWJsZS1zZWxlY3RlZCcsXG4gICAgICBtdWx0aURyYWdLZXk6IG51bGwsXG4gICAgICBhdm9pZEltcGxpY2l0RGVzZWxlY3Q6IGZhbHNlLFxuICAgICAgc2V0RGF0YTogZnVuY3Rpb24gc2V0RGF0YShkYXRhVHJhbnNmZXIsIGRyYWdFbCkge1xuICAgICAgICB2YXIgZGF0YSA9ICcnO1xuICAgICAgICBpZiAobXVsdGlEcmFnRWxlbWVudHMubGVuZ3RoICYmIG11bHRpRHJhZ1NvcnRhYmxlID09PSBzb3J0YWJsZSkge1xuICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKG11bHRpRHJhZ0VsZW1lbnQsIGkpIHtcbiAgICAgICAgICAgIGRhdGEgKz0gKCFpID8gJycgOiAnLCAnKSArIG11bHRpRHJhZ0VsZW1lbnQudGV4dENvbnRlbnQ7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGF0YSA9IGRyYWdFbC50ZXh0Q29udGVudDtcbiAgICAgICAgfVxuICAgICAgICBkYXRhVHJhbnNmZXIuc2V0RGF0YSgnVGV4dCcsIGRhdGEpO1xuICAgICAgfVxuICAgIH07XG4gIH1cbiAgTXVsdGlEcmFnLnByb3RvdHlwZSA9IHtcbiAgICBtdWx0aURyYWdLZXlEb3duOiBmYWxzZSxcbiAgICBpc011bHRpRHJhZzogZmFsc2UsXG4gICAgZGVsYXlTdGFydEdsb2JhbDogZnVuY3Rpb24gZGVsYXlTdGFydEdsb2JhbChfcmVmKSB7XG4gICAgICB2YXIgZHJhZ2dlZCA9IF9yZWYuZHJhZ0VsO1xuICAgICAgZHJhZ0VsJDEgPSBkcmFnZ2VkO1xuICAgIH0sXG4gICAgZGVsYXlFbmRlZDogZnVuY3Rpb24gZGVsYXlFbmRlZCgpIHtcbiAgICAgIHRoaXMuaXNNdWx0aURyYWcgPSB+bXVsdGlEcmFnRWxlbWVudHMuaW5kZXhPZihkcmFnRWwkMSk7XG4gICAgfSxcbiAgICBzZXR1cENsb25lOiBmdW5jdGlvbiBzZXR1cENsb25lKF9yZWYyKSB7XG4gICAgICB2YXIgc29ydGFibGUgPSBfcmVmMi5zb3J0YWJsZSxcbiAgICAgICAgY2FuY2VsID0gX3JlZjIuY2FuY2VsO1xuICAgICAgaWYgKCF0aGlzLmlzTXVsdGlEcmFnKSByZXR1cm47XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG11bHRpRHJhZ0VsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG11bHRpRHJhZ0Nsb25lcy5wdXNoKGNsb25lKG11bHRpRHJhZ0VsZW1lbnRzW2ldKSk7XG4gICAgICAgIG11bHRpRHJhZ0Nsb25lc1tpXS5zb3J0YWJsZUluZGV4ID0gbXVsdGlEcmFnRWxlbWVudHNbaV0uc29ydGFibGVJbmRleDtcbiAgICAgICAgbXVsdGlEcmFnQ2xvbmVzW2ldLmRyYWdnYWJsZSA9IGZhbHNlO1xuICAgICAgICBtdWx0aURyYWdDbG9uZXNbaV0uc3R5bGVbJ3dpbGwtY2hhbmdlJ10gPSAnJztcbiAgICAgICAgdG9nZ2xlQ2xhc3MobXVsdGlEcmFnQ2xvbmVzW2ldLCB0aGlzLm9wdGlvbnMuc2VsZWN0ZWRDbGFzcywgZmFsc2UpO1xuICAgICAgICBtdWx0aURyYWdFbGVtZW50c1tpXSA9PT0gZHJhZ0VsJDEgJiYgdG9nZ2xlQ2xhc3MobXVsdGlEcmFnQ2xvbmVzW2ldLCB0aGlzLm9wdGlvbnMuY2hvc2VuQ2xhc3MsIGZhbHNlKTtcbiAgICAgIH1cbiAgICAgIHNvcnRhYmxlLl9oaWRlQ2xvbmUoKTtcbiAgICAgIGNhbmNlbCgpO1xuICAgIH0sXG4gICAgY2xvbmU6IGZ1bmN0aW9uIGNsb25lKF9yZWYzKSB7XG4gICAgICB2YXIgc29ydGFibGUgPSBfcmVmMy5zb3J0YWJsZSxcbiAgICAgICAgcm9vdEVsID0gX3JlZjMucm9vdEVsLFxuICAgICAgICBkaXNwYXRjaFNvcnRhYmxlRXZlbnQgPSBfcmVmMy5kaXNwYXRjaFNvcnRhYmxlRXZlbnQsXG4gICAgICAgIGNhbmNlbCA9IF9yZWYzLmNhbmNlbDtcbiAgICAgIGlmICghdGhpcy5pc011bHRpRHJhZykgcmV0dXJuO1xuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMucmVtb3ZlQ2xvbmVPbkhpZGUpIHtcbiAgICAgICAgaWYgKG11bHRpRHJhZ0VsZW1lbnRzLmxlbmd0aCAmJiBtdWx0aURyYWdTb3J0YWJsZSA9PT0gc29ydGFibGUpIHtcbiAgICAgICAgICBpbnNlcnRNdWx0aURyYWdDbG9uZXModHJ1ZSwgcm9vdEVsKTtcbiAgICAgICAgICBkaXNwYXRjaFNvcnRhYmxlRXZlbnQoJ2Nsb25lJyk7XG4gICAgICAgICAgY2FuY2VsKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIHNob3dDbG9uZTogZnVuY3Rpb24gc2hvd0Nsb25lKF9yZWY0KSB7XG4gICAgICB2YXIgY2xvbmVOb3dTaG93biA9IF9yZWY0LmNsb25lTm93U2hvd24sXG4gICAgICAgIHJvb3RFbCA9IF9yZWY0LnJvb3RFbCxcbiAgICAgICAgY2FuY2VsID0gX3JlZjQuY2FuY2VsO1xuICAgICAgaWYgKCF0aGlzLmlzTXVsdGlEcmFnKSByZXR1cm47XG4gICAgICBpbnNlcnRNdWx0aURyYWdDbG9uZXMoZmFsc2UsIHJvb3RFbCk7XG4gICAgICBtdWx0aURyYWdDbG9uZXMuZm9yRWFjaChmdW5jdGlvbiAoY2xvbmUpIHtcbiAgICAgICAgY3NzKGNsb25lLCAnZGlzcGxheScsICcnKTtcbiAgICAgIH0pO1xuICAgICAgY2xvbmVOb3dTaG93bigpO1xuICAgICAgY2xvbmVzSGlkZGVuID0gZmFsc2U7XG4gICAgICBjYW5jZWwoKTtcbiAgICB9LFxuICAgIGhpZGVDbG9uZTogZnVuY3Rpb24gaGlkZUNsb25lKF9yZWY1KSB7XG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgdmFyIHNvcnRhYmxlID0gX3JlZjUuc29ydGFibGUsXG4gICAgICAgIGNsb25lTm93SGlkZGVuID0gX3JlZjUuY2xvbmVOb3dIaWRkZW4sXG4gICAgICAgIGNhbmNlbCA9IF9yZWY1LmNhbmNlbDtcbiAgICAgIGlmICghdGhpcy5pc011bHRpRHJhZykgcmV0dXJuO1xuICAgICAgbXVsdGlEcmFnQ2xvbmVzLmZvckVhY2goZnVuY3Rpb24gKGNsb25lKSB7XG4gICAgICAgIGNzcyhjbG9uZSwgJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy5yZW1vdmVDbG9uZU9uSGlkZSAmJiBjbG9uZS5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgY2xvbmUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjbG9uZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgY2xvbmVOb3dIaWRkZW4oKTtcbiAgICAgIGNsb25lc0hpZGRlbiA9IHRydWU7XG4gICAgICBjYW5jZWwoKTtcbiAgICB9LFxuICAgIGRyYWdTdGFydEdsb2JhbDogZnVuY3Rpb24gZHJhZ1N0YXJ0R2xvYmFsKF9yZWY2KSB7XG4gICAgICB2YXIgc29ydGFibGUgPSBfcmVmNi5zb3J0YWJsZTtcbiAgICAgIGlmICghdGhpcy5pc011bHRpRHJhZyAmJiBtdWx0aURyYWdTb3J0YWJsZSkge1xuICAgICAgICBtdWx0aURyYWdTb3J0YWJsZS5tdWx0aURyYWcuX2Rlc2VsZWN0TXVsdGlEcmFnKCk7XG4gICAgICB9XG4gICAgICBtdWx0aURyYWdFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChtdWx0aURyYWdFbGVtZW50KSB7XG4gICAgICAgIG11bHRpRHJhZ0VsZW1lbnQuc29ydGFibGVJbmRleCA9IGluZGV4KG11bHRpRHJhZ0VsZW1lbnQpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIFNvcnQgbXVsdGktZHJhZyBlbGVtZW50c1xuICAgICAgbXVsdGlEcmFnRWxlbWVudHMgPSBtdWx0aURyYWdFbGVtZW50cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHJldHVybiBhLnNvcnRhYmxlSW5kZXggLSBiLnNvcnRhYmxlSW5kZXg7XG4gICAgICB9KTtcbiAgICAgIGRyYWdTdGFydGVkID0gdHJ1ZTtcbiAgICB9LFxuICAgIGRyYWdTdGFydGVkOiBmdW5jdGlvbiBkcmFnU3RhcnRlZChfcmVmNykge1xuICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG4gICAgICB2YXIgc29ydGFibGUgPSBfcmVmNy5zb3J0YWJsZTtcbiAgICAgIGlmICghdGhpcy5pc011bHRpRHJhZykgcmV0dXJuO1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5zb3J0KSB7XG4gICAgICAgIC8vIENhcHR1cmUgcmVjdHMsXG4gICAgICAgIC8vIGhpZGUgbXVsdGkgZHJhZyBlbGVtZW50cyAoYnkgcG9zaXRpb25pbmcgdGhlbSBhYnNvbHV0ZSksXG4gICAgICAgIC8vIHNldCBtdWx0aSBkcmFnIGVsZW1lbnRzIHJlY3RzIHRvIGRyYWdSZWN0LFxuICAgICAgICAvLyBzaG93IG11bHRpIGRyYWcgZWxlbWVudHMsXG4gICAgICAgIC8vIGFuaW1hdGUgdG8gcmVjdHMsXG4gICAgICAgIC8vIHVuc2V0IHJlY3RzICYgcmVtb3ZlIGZyb20gRE9NXG5cbiAgICAgICAgc29ydGFibGUuY2FwdHVyZUFuaW1hdGlvblN0YXRlKCk7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uKSB7XG4gICAgICAgICAgbXVsdGlEcmFnRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAobXVsdGlEcmFnRWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKG11bHRpRHJhZ0VsZW1lbnQgPT09IGRyYWdFbCQxKSByZXR1cm47XG4gICAgICAgICAgICBjc3MobXVsdGlEcmFnRWxlbWVudCwgJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdmFyIGRyYWdSZWN0ID0gZ2V0UmVjdChkcmFnRWwkMSwgZmFsc2UsIHRydWUsIHRydWUpO1xuICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKG11bHRpRHJhZ0VsZW1lbnQpIHtcbiAgICAgICAgICAgIGlmIChtdWx0aURyYWdFbGVtZW50ID09PSBkcmFnRWwkMSkgcmV0dXJuO1xuICAgICAgICAgICAgc2V0UmVjdChtdWx0aURyYWdFbGVtZW50LCBkcmFnUmVjdCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgZm9sZGluZyA9IHRydWU7XG4gICAgICAgICAgaW5pdGlhbEZvbGRpbmcgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzb3J0YWJsZS5hbmltYXRlQWxsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9sZGluZyA9IGZhbHNlO1xuICAgICAgICBpbml0aWFsRm9sZGluZyA9IGZhbHNlO1xuICAgICAgICBpZiAoX3RoaXMyLm9wdGlvbnMuYW5pbWF0aW9uKSB7XG4gICAgICAgICAgbXVsdGlEcmFnRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbiAobXVsdGlEcmFnRWxlbWVudCkge1xuICAgICAgICAgICAgdW5zZXRSZWN0KG11bHRpRHJhZ0VsZW1lbnQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIGFsbCBhdXhpbGlhcnkgbXVsdGlkcmFnIGl0ZW1zIGZyb20gZWwsIGlmIHNvcnRpbmcgZW5hYmxlZFxuICAgICAgICBpZiAoX3RoaXMyLm9wdGlvbnMuc29ydCkge1xuICAgICAgICAgIHJlbW92ZU11bHRpRHJhZ0VsZW1lbnRzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0sXG4gICAgZHJhZ092ZXI6IGZ1bmN0aW9uIGRyYWdPdmVyKF9yZWY4KSB7XG4gICAgICB2YXIgdGFyZ2V0ID0gX3JlZjgudGFyZ2V0LFxuICAgICAgICBjb21wbGV0ZWQgPSBfcmVmOC5jb21wbGV0ZWQsXG4gICAgICAgIGNhbmNlbCA9IF9yZWY4LmNhbmNlbDtcbiAgICAgIGlmIChmb2xkaW5nICYmIH5tdWx0aURyYWdFbGVtZW50cy5pbmRleE9mKHRhcmdldCkpIHtcbiAgICAgICAgY29tcGxldGVkKGZhbHNlKTtcbiAgICAgICAgY2FuY2VsKCk7XG4gICAgICB9XG4gICAgfSxcbiAgICByZXZlcnQ6IGZ1bmN0aW9uIHJldmVydChfcmVmOSkge1xuICAgICAgdmFyIGZyb21Tb3J0YWJsZSA9IF9yZWY5LmZyb21Tb3J0YWJsZSxcbiAgICAgICAgcm9vdEVsID0gX3JlZjkucm9vdEVsLFxuICAgICAgICBzb3J0YWJsZSA9IF9yZWY5LnNvcnRhYmxlLFxuICAgICAgICBkcmFnUmVjdCA9IF9yZWY5LmRyYWdSZWN0O1xuICAgICAgaWYgKG11bHRpRHJhZ0VsZW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgLy8gU2V0dXAgdW5mb2xkIGFuaW1hdGlvblxuICAgICAgICBtdWx0aURyYWdFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChtdWx0aURyYWdFbGVtZW50KSB7XG4gICAgICAgICAgc29ydGFibGUuYWRkQW5pbWF0aW9uU3RhdGUoe1xuICAgICAgICAgICAgdGFyZ2V0OiBtdWx0aURyYWdFbGVtZW50LFxuICAgICAgICAgICAgcmVjdDogZm9sZGluZyA/IGdldFJlY3QobXVsdGlEcmFnRWxlbWVudCkgOiBkcmFnUmVjdFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHVuc2V0UmVjdChtdWx0aURyYWdFbGVtZW50KTtcbiAgICAgICAgICBtdWx0aURyYWdFbGVtZW50LmZyb21SZWN0ID0gZHJhZ1JlY3Q7XG4gICAgICAgICAgZnJvbVNvcnRhYmxlLnJlbW92ZUFuaW1hdGlvblN0YXRlKG11bHRpRHJhZ0VsZW1lbnQpO1xuICAgICAgICB9KTtcbiAgICAgICAgZm9sZGluZyA9IGZhbHNlO1xuICAgICAgICBpbnNlcnRNdWx0aURyYWdFbGVtZW50cyghdGhpcy5vcHRpb25zLnJlbW92ZUNsb25lT25IaWRlLCByb290RWwpO1xuICAgICAgfVxuICAgIH0sXG4gICAgZHJhZ092ZXJDb21wbGV0ZWQ6IGZ1bmN0aW9uIGRyYWdPdmVyQ29tcGxldGVkKF9yZWYxMCkge1xuICAgICAgdmFyIHNvcnRhYmxlID0gX3JlZjEwLnNvcnRhYmxlLFxuICAgICAgICBpc093bmVyID0gX3JlZjEwLmlzT3duZXIsXG4gICAgICAgIGluc2VydGlvbiA9IF9yZWYxMC5pbnNlcnRpb24sXG4gICAgICAgIGFjdGl2ZVNvcnRhYmxlID0gX3JlZjEwLmFjdGl2ZVNvcnRhYmxlLFxuICAgICAgICBwYXJlbnRFbCA9IF9yZWYxMC5wYXJlbnRFbCxcbiAgICAgICAgcHV0U29ydGFibGUgPSBfcmVmMTAucHV0U29ydGFibGU7XG4gICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgIGlmIChpbnNlcnRpb24pIHtcbiAgICAgICAgLy8gQ2xvbmVzIG11c3QgYmUgaGlkZGVuIGJlZm9yZSBmb2xkaW5nIGFuaW1hdGlvbiB0byBjYXB0dXJlIGRyYWdSZWN0QWJzb2x1dGUgcHJvcGVybHlcbiAgICAgICAgaWYgKGlzT3duZXIpIHtcbiAgICAgICAgICBhY3RpdmVTb3J0YWJsZS5faGlkZUNsb25lKCk7XG4gICAgICAgIH1cbiAgICAgICAgaW5pdGlhbEZvbGRpbmcgPSBmYWxzZTtcbiAgICAgICAgLy8gSWYgbGVhdmluZyBzb3J0OmZhbHNlIHJvb3QsIG9yIGFscmVhZHkgZm9sZGluZyAtIEZvbGQgdG8gbmV3IGxvY2F0aW9uXG4gICAgICAgIGlmIChvcHRpb25zLmFuaW1hdGlvbiAmJiBtdWx0aURyYWdFbGVtZW50cy5sZW5ndGggPiAxICYmIChmb2xkaW5nIHx8ICFpc093bmVyICYmICFhY3RpdmVTb3J0YWJsZS5vcHRpb25zLnNvcnQgJiYgIXB1dFNvcnRhYmxlKSkge1xuICAgICAgICAgIC8vIEZvbGQ6IFNldCBhbGwgbXVsdGkgZHJhZyBlbGVtZW50cydzIHJlY3RzIHRvIGRyYWdFbCdzIHJlY3Qgd2hlbiBtdWx0aS1kcmFnIGVsZW1lbnRzIGFyZSBpbnZpc2libGVcbiAgICAgICAgICB2YXIgZHJhZ1JlY3RBYnNvbHV0ZSA9IGdldFJlY3QoZHJhZ0VsJDEsIGZhbHNlLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICBtdWx0aURyYWdFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChtdWx0aURyYWdFbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAobXVsdGlEcmFnRWxlbWVudCA9PT0gZHJhZ0VsJDEpIHJldHVybjtcbiAgICAgICAgICAgIHNldFJlY3QobXVsdGlEcmFnRWxlbWVudCwgZHJhZ1JlY3RBYnNvbHV0ZSk7XG5cbiAgICAgICAgICAgIC8vIE1vdmUgZWxlbWVudChzKSB0byBlbmQgb2YgcGFyZW50RWwgc28gdGhhdCBpdCBkb2VzIG5vdCBpbnRlcmZlcmUgd2l0aCBtdWx0aS1kcmFnIGNsb25lcyBpbnNlcnRpb24gaWYgdGhleSBhcmUgaW5zZXJ0ZWRcbiAgICAgICAgICAgIC8vIHdoaWxlIGZvbGRpbmcsIGFuZCBzbyB0aGF0IHdlIGNhbiBjYXB0dXJlIHRoZW0gYWdhaW4gYmVjYXVzZSBvbGQgc29ydGFibGUgd2lsbCBubyBsb25nZXIgYmUgZnJvbVNvcnRhYmxlXG4gICAgICAgICAgICBwYXJlbnRFbC5hcHBlbmRDaGlsZChtdWx0aURyYWdFbGVtZW50KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBmb2xkaW5nID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENsb25lcyBtdXN0IGJlIHNob3duIChhbmQgY2hlY2sgdG8gcmVtb3ZlIG11bHRpIGRyYWdzKSBhZnRlciBmb2xkaW5nIHdoZW4gaW50ZXJmZXJpbmcgbXVsdGlEcmFnRWxlbWVudHMgYXJlIG1vdmVkIG91dFxuICAgICAgICBpZiAoIWlzT3duZXIpIHtcbiAgICAgICAgICAvLyBPbmx5IHJlbW92ZSBpZiBub3QgZm9sZGluZyAoZm9sZGluZyB3aWxsIHJlbW92ZSB0aGVtIGFueXdheXMpXG4gICAgICAgICAgaWYgKCFmb2xkaW5nKSB7XG4gICAgICAgICAgICByZW1vdmVNdWx0aURyYWdFbGVtZW50cygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobXVsdGlEcmFnRWxlbWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgdmFyIGNsb25lc0hpZGRlbkJlZm9yZSA9IGNsb25lc0hpZGRlbjtcbiAgICAgICAgICAgIGFjdGl2ZVNvcnRhYmxlLl9zaG93Q2xvbmUoc29ydGFibGUpO1xuXG4gICAgICAgICAgICAvLyBVbmZvbGQgYW5pbWF0aW9uIGZvciBjbG9uZXMgaWYgc2hvd2luZyBmcm9tIGhpZGRlblxuICAgICAgICAgICAgaWYgKGFjdGl2ZVNvcnRhYmxlLm9wdGlvbnMuYW5pbWF0aW9uICYmICFjbG9uZXNIaWRkZW4gJiYgY2xvbmVzSGlkZGVuQmVmb3JlKSB7XG4gICAgICAgICAgICAgIG11bHRpRHJhZ0Nsb25lcy5mb3JFYWNoKGZ1bmN0aW9uIChjbG9uZSkge1xuICAgICAgICAgICAgICAgIGFjdGl2ZVNvcnRhYmxlLmFkZEFuaW1hdGlvblN0YXRlKHtcbiAgICAgICAgICAgICAgICAgIHRhcmdldDogY2xvbmUsXG4gICAgICAgICAgICAgICAgICByZWN0OiBjbG9uZXNGcm9tUmVjdFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNsb25lLmZyb21SZWN0ID0gY2xvbmVzRnJvbVJlY3Q7XG4gICAgICAgICAgICAgICAgY2xvbmUudGhpc0FuaW1hdGlvbkR1cmF0aW9uID0gbnVsbDtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFjdGl2ZVNvcnRhYmxlLl9zaG93Q2xvbmUoc29ydGFibGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgZHJhZ092ZXJBbmltYXRpb25DYXB0dXJlOiBmdW5jdGlvbiBkcmFnT3ZlckFuaW1hdGlvbkNhcHR1cmUoX3JlZjExKSB7XG4gICAgICB2YXIgZHJhZ1JlY3QgPSBfcmVmMTEuZHJhZ1JlY3QsXG4gICAgICAgIGlzT3duZXIgPSBfcmVmMTEuaXNPd25lcixcbiAgICAgICAgYWN0aXZlU29ydGFibGUgPSBfcmVmMTEuYWN0aXZlU29ydGFibGU7XG4gICAgICBtdWx0aURyYWdFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChtdWx0aURyYWdFbGVtZW50KSB7XG4gICAgICAgIG11bHRpRHJhZ0VsZW1lbnQudGhpc0FuaW1hdGlvbkR1cmF0aW9uID0gbnVsbDtcbiAgICAgIH0pO1xuICAgICAgaWYgKGFjdGl2ZVNvcnRhYmxlLm9wdGlvbnMuYW5pbWF0aW9uICYmICFpc093bmVyICYmIGFjdGl2ZVNvcnRhYmxlLm11bHRpRHJhZy5pc011bHRpRHJhZykge1xuICAgICAgICBjbG9uZXNGcm9tUmVjdCA9IF9leHRlbmRzKHt9LCBkcmFnUmVjdCk7XG4gICAgICAgIHZhciBkcmFnTWF0cml4ID0gbWF0cml4KGRyYWdFbCQxLCB0cnVlKTtcbiAgICAgICAgY2xvbmVzRnJvbVJlY3QudG9wIC09IGRyYWdNYXRyaXguZjtcbiAgICAgICAgY2xvbmVzRnJvbVJlY3QubGVmdCAtPSBkcmFnTWF0cml4LmU7XG4gICAgICB9XG4gICAgfSxcbiAgICBkcmFnT3ZlckFuaW1hdGlvbkNvbXBsZXRlOiBmdW5jdGlvbiBkcmFnT3ZlckFuaW1hdGlvbkNvbXBsZXRlKCkge1xuICAgICAgaWYgKGZvbGRpbmcpIHtcbiAgICAgICAgZm9sZGluZyA9IGZhbHNlO1xuICAgICAgICByZW1vdmVNdWx0aURyYWdFbGVtZW50cygpO1xuICAgICAgfVxuICAgIH0sXG4gICAgZHJvcDogZnVuY3Rpb24gZHJvcChfcmVmMTIpIHtcbiAgICAgIHZhciBldnQgPSBfcmVmMTIub3JpZ2luYWxFdmVudCxcbiAgICAgICAgcm9vdEVsID0gX3JlZjEyLnJvb3RFbCxcbiAgICAgICAgcGFyZW50RWwgPSBfcmVmMTIucGFyZW50RWwsXG4gICAgICAgIHNvcnRhYmxlID0gX3JlZjEyLnNvcnRhYmxlLFxuICAgICAgICBkaXNwYXRjaFNvcnRhYmxlRXZlbnQgPSBfcmVmMTIuZGlzcGF0Y2hTb3J0YWJsZUV2ZW50LFxuICAgICAgICBvbGRJbmRleCA9IF9yZWYxMi5vbGRJbmRleCxcbiAgICAgICAgcHV0U29ydGFibGUgPSBfcmVmMTIucHV0U29ydGFibGU7XG4gICAgICB2YXIgdG9Tb3J0YWJsZSA9IHB1dFNvcnRhYmxlIHx8IHRoaXMuc29ydGFibGU7XG4gICAgICBpZiAoIWV2dCkgcmV0dXJuO1xuICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnMsXG4gICAgICAgIGNoaWxkcmVuID0gcGFyZW50RWwuY2hpbGRyZW47XG5cbiAgICAgIC8vIE11bHRpLWRyYWcgc2VsZWN0aW9uXG4gICAgICBpZiAoIWRyYWdTdGFydGVkKSB7XG4gICAgICAgIGlmIChvcHRpb25zLm11bHRpRHJhZ0tleSAmJiAhdGhpcy5tdWx0aURyYWdLZXlEb3duKSB7XG4gICAgICAgICAgdGhpcy5fZGVzZWxlY3RNdWx0aURyYWcoKTtcbiAgICAgICAgfVxuICAgICAgICB0b2dnbGVDbGFzcyhkcmFnRWwkMSwgb3B0aW9ucy5zZWxlY3RlZENsYXNzLCAhfm11bHRpRHJhZ0VsZW1lbnRzLmluZGV4T2YoZHJhZ0VsJDEpKTtcbiAgICAgICAgaWYgKCF+bXVsdGlEcmFnRWxlbWVudHMuaW5kZXhPZihkcmFnRWwkMSkpIHtcbiAgICAgICAgICBtdWx0aURyYWdFbGVtZW50cy5wdXNoKGRyYWdFbCQxKTtcbiAgICAgICAgICBkaXNwYXRjaEV2ZW50KHtcbiAgICAgICAgICAgIHNvcnRhYmxlOiBzb3J0YWJsZSxcbiAgICAgICAgICAgIHJvb3RFbDogcm9vdEVsLFxuICAgICAgICAgICAgbmFtZTogJ3NlbGVjdCcsXG4gICAgICAgICAgICB0YXJnZXRFbDogZHJhZ0VsJDEsXG4gICAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnRcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIE1vZGlmaWVyIGFjdGl2YXRlZCwgc2VsZWN0IGZyb20gbGFzdCB0byBkcmFnRWxcbiAgICAgICAgICBpZiAoZXZ0LnNoaWZ0S2V5ICYmIGxhc3RNdWx0aURyYWdTZWxlY3QgJiYgc29ydGFibGUuZWwuY29udGFpbnMobGFzdE11bHRpRHJhZ1NlbGVjdCkpIHtcbiAgICAgICAgICAgIHZhciBsYXN0SW5kZXggPSBpbmRleChsYXN0TXVsdGlEcmFnU2VsZWN0KSxcbiAgICAgICAgICAgICAgY3VycmVudEluZGV4ID0gaW5kZXgoZHJhZ0VsJDEpO1xuICAgICAgICAgICAgaWYgKH5sYXN0SW5kZXggJiYgfmN1cnJlbnRJbmRleCAmJiBsYXN0SW5kZXggIT09IGN1cnJlbnRJbmRleCkge1xuICAgICAgICAgICAgICAvLyBNdXN0IGluY2x1ZGUgbGFzdE11bHRpRHJhZ1NlbGVjdCAoc2VsZWN0IGl0KSwgaW4gY2FzZSBtb2RpZmllZCBzZWxlY3Rpb24gZnJvbSBubyBzZWxlY3Rpb25cbiAgICAgICAgICAgICAgLy8gKGJ1dCBwcmV2aW91cyBzZWxlY3Rpb24gZXhpc3RlZClcbiAgICAgICAgICAgICAgdmFyIG4sIGk7XG4gICAgICAgICAgICAgIGlmIChjdXJyZW50SW5kZXggPiBsYXN0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpID0gbGFzdEluZGV4O1xuICAgICAgICAgICAgICAgIG4gPSBjdXJyZW50SW5kZXg7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaSA9IGN1cnJlbnRJbmRleDtcbiAgICAgICAgICAgICAgICBuID0gbGFzdEluZGV4ICsgMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBmb3IgKDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh+bXVsdGlEcmFnRWxlbWVudHMuaW5kZXhPZihjaGlsZHJlbltpXSkpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIHRvZ2dsZUNsYXNzKGNoaWxkcmVuW2ldLCBvcHRpb25zLnNlbGVjdGVkQ2xhc3MsIHRydWUpO1xuICAgICAgICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLnB1c2goY2hpbGRyZW5baV0pO1xuICAgICAgICAgICAgICAgIGRpc3BhdGNoRXZlbnQoe1xuICAgICAgICAgICAgICAgICAgc29ydGFibGU6IHNvcnRhYmxlLFxuICAgICAgICAgICAgICAgICAgcm9vdEVsOiByb290RWwsXG4gICAgICAgICAgICAgICAgICBuYW1lOiAnc2VsZWN0JyxcbiAgICAgICAgICAgICAgICAgIHRhcmdldEVsOiBjaGlsZHJlbltpXSxcbiAgICAgICAgICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxhc3RNdWx0aURyYWdTZWxlY3QgPSBkcmFnRWwkMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbXVsdGlEcmFnU29ydGFibGUgPSB0b1NvcnRhYmxlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLnNwbGljZShtdWx0aURyYWdFbGVtZW50cy5pbmRleE9mKGRyYWdFbCQxKSwgMSk7XG4gICAgICAgICAgbGFzdE11bHRpRHJhZ1NlbGVjdCA9IG51bGw7XG4gICAgICAgICAgZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgICBzb3J0YWJsZTogc29ydGFibGUsXG4gICAgICAgICAgICByb290RWw6IHJvb3RFbCxcbiAgICAgICAgICAgIG5hbWU6ICdkZXNlbGVjdCcsXG4gICAgICAgICAgICB0YXJnZXRFbDogZHJhZ0VsJDEsXG4gICAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBldnRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBNdWx0aS1kcmFnIGRyb3BcbiAgICAgIGlmIChkcmFnU3RhcnRlZCAmJiB0aGlzLmlzTXVsdGlEcmFnKSB7XG4gICAgICAgIGZvbGRpbmcgPSBmYWxzZTtcbiAgICAgICAgLy8gRG8gbm90IFwidW5mb2xkXCIgYWZ0ZXIgYXJvdW5kIGRyYWdFbCBpZiByZXZlcnRlZFxuICAgICAgICBpZiAoKHBhcmVudEVsW2V4cGFuZG9dLm9wdGlvbnMuc29ydCB8fCBwYXJlbnRFbCAhPT0gcm9vdEVsKSAmJiBtdWx0aURyYWdFbGVtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgdmFyIGRyYWdSZWN0ID0gZ2V0UmVjdChkcmFnRWwkMSksXG4gICAgICAgICAgICBtdWx0aURyYWdJbmRleCA9IGluZGV4KGRyYWdFbCQxLCAnOm5vdCguJyArIHRoaXMub3B0aW9ucy5zZWxlY3RlZENsYXNzICsgJyknKTtcbiAgICAgICAgICBpZiAoIWluaXRpYWxGb2xkaW5nICYmIG9wdGlvbnMuYW5pbWF0aW9uKSBkcmFnRWwkMS50aGlzQW5pbWF0aW9uRHVyYXRpb24gPSBudWxsO1xuICAgICAgICAgIHRvU29ydGFibGUuY2FwdHVyZUFuaW1hdGlvblN0YXRlKCk7XG4gICAgICAgICAgaWYgKCFpbml0aWFsRm9sZGluZykge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYW5pbWF0aW9uKSB7XG4gICAgICAgICAgICAgIGRyYWdFbCQxLmZyb21SZWN0ID0gZHJhZ1JlY3Q7XG4gICAgICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKG11bHRpRHJhZ0VsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBtdWx0aURyYWdFbGVtZW50LnRoaXNBbmltYXRpb25EdXJhdGlvbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKG11bHRpRHJhZ0VsZW1lbnQgIT09IGRyYWdFbCQxKSB7XG4gICAgICAgICAgICAgICAgICB2YXIgcmVjdCA9IGZvbGRpbmcgPyBnZXRSZWN0KG11bHRpRHJhZ0VsZW1lbnQpIDogZHJhZ1JlY3Q7XG4gICAgICAgICAgICAgICAgICBtdWx0aURyYWdFbGVtZW50LmZyb21SZWN0ID0gcmVjdDtcblxuICAgICAgICAgICAgICAgICAgLy8gUHJlcGFyZSB1bmZvbGQgYW5pbWF0aW9uXG4gICAgICAgICAgICAgICAgICB0b1NvcnRhYmxlLmFkZEFuaW1hdGlvblN0YXRlKHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiBtdWx0aURyYWdFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICByZWN0OiByZWN0XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNdWx0aSBkcmFnIGVsZW1lbnRzIGFyZSBub3QgbmVjZXNzYXJpbHkgcmVtb3ZlZCBmcm9tIHRoZSBET00gb24gZHJvcCwgc28gdG8gcmVpbnNlcnRcbiAgICAgICAgICAgIC8vIHByb3Blcmx5IHRoZXkgbXVzdCBhbGwgYmUgcmVtb3ZlZFxuICAgICAgICAgICAgcmVtb3ZlTXVsdGlEcmFnRWxlbWVudHMoKTtcbiAgICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKG11bHRpRHJhZ0VsZW1lbnQpIHtcbiAgICAgICAgICAgICAgaWYgKGNoaWxkcmVuW211bHRpRHJhZ0luZGV4XSkge1xuICAgICAgICAgICAgICAgIHBhcmVudEVsLmluc2VydEJlZm9yZShtdWx0aURyYWdFbGVtZW50LCBjaGlsZHJlblttdWx0aURyYWdJbmRleF0pO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhcmVudEVsLmFwcGVuZENoaWxkKG11bHRpRHJhZ0VsZW1lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIG11bHRpRHJhZ0luZGV4Kys7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gSWYgaW5pdGlhbCBmb2xkaW5nIGlzIGRvbmUsIHRoZSBlbGVtZW50cyBtYXkgaGF2ZSBjaGFuZ2VkIHBvc2l0aW9uIGJlY2F1c2UgdGhleSBhcmUgbm93XG4gICAgICAgICAgICAvLyB1bmZvbGRpbmcgYXJvdW5kIGRyYWdFbCwgZXZlbiB0aG91Z2ggZHJhZ0VsIG1heSBub3QgaGF2ZSBoaXMgaW5kZXggY2hhbmdlZCwgc28gdXBkYXRlIGV2ZW50XG4gICAgICAgICAgICAvLyBtdXN0IGJlIGZpcmVkIGhlcmUgYXMgU29ydGFibGUgd2lsbCBub3QuXG4gICAgICAgICAgICBpZiAob2xkSW5kZXggPT09IGluZGV4KGRyYWdFbCQxKSkge1xuICAgICAgICAgICAgICB2YXIgdXBkYXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKG11bHRpRHJhZ0VsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAobXVsdGlEcmFnRWxlbWVudC5zb3J0YWJsZUluZGV4ICE9PSBpbmRleChtdWx0aURyYWdFbGVtZW50KSkge1xuICAgICAgICAgICAgICAgICAgdXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICBpZiAodXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgZGlzcGF0Y2hTb3J0YWJsZUV2ZW50KCd1cGRhdGUnKTtcbiAgICAgICAgICAgICAgICBkaXNwYXRjaFNvcnRhYmxlRXZlbnQoJ3NvcnQnKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIE11c3QgYmUgZG9uZSBhZnRlciBjYXB0dXJpbmcgaW5kaXZpZHVhbCByZWN0cyAoc2Nyb2xsIGJhcilcbiAgICAgICAgICBtdWx0aURyYWdFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChtdWx0aURyYWdFbGVtZW50KSB7XG4gICAgICAgICAgICB1bnNldFJlY3QobXVsdGlEcmFnRWxlbWVudCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdG9Tb3J0YWJsZS5hbmltYXRlQWxsKCk7XG4gICAgICAgIH1cbiAgICAgICAgbXVsdGlEcmFnU29ydGFibGUgPSB0b1NvcnRhYmxlO1xuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmUgY2xvbmVzIGlmIG5lY2Vzc2FyeVxuICAgICAgaWYgKHJvb3RFbCA9PT0gcGFyZW50RWwgfHwgcHV0U29ydGFibGUgJiYgcHV0U29ydGFibGUubGFzdFB1dE1vZGUgIT09ICdjbG9uZScpIHtcbiAgICAgICAgbXVsdGlEcmFnQ2xvbmVzLmZvckVhY2goZnVuY3Rpb24gKGNsb25lKSB7XG4gICAgICAgICAgY2xvbmUucGFyZW50Tm9kZSAmJiBjbG9uZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGNsb25lKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBudWxsaW5nR2xvYmFsOiBmdW5jdGlvbiBudWxsaW5nR2xvYmFsKCkge1xuICAgICAgdGhpcy5pc011bHRpRHJhZyA9IGRyYWdTdGFydGVkID0gZmFsc2U7XG4gICAgICBtdWx0aURyYWdDbG9uZXMubGVuZ3RoID0gMDtcbiAgICB9LFxuICAgIGRlc3Ryb3lHbG9iYWw6IGZ1bmN0aW9uIGRlc3Ryb3lHbG9iYWwoKSB7XG4gICAgICB0aGlzLl9kZXNlbGVjdE11bHRpRHJhZygpO1xuICAgICAgb2ZmKGRvY3VtZW50LCAncG9pbnRlcnVwJywgdGhpcy5fZGVzZWxlY3RNdWx0aURyYWcpO1xuICAgICAgb2ZmKGRvY3VtZW50LCAnbW91c2V1cCcsIHRoaXMuX2Rlc2VsZWN0TXVsdGlEcmFnKTtcbiAgICAgIG9mZihkb2N1bWVudCwgJ3RvdWNoZW5kJywgdGhpcy5fZGVzZWxlY3RNdWx0aURyYWcpO1xuICAgICAgb2ZmKGRvY3VtZW50LCAna2V5ZG93bicsIHRoaXMuX2NoZWNrS2V5RG93bik7XG4gICAgICBvZmYoZG9jdW1lbnQsICdrZXl1cCcsIHRoaXMuX2NoZWNrS2V5VXApO1xuICAgIH0sXG4gICAgX2Rlc2VsZWN0TXVsdGlEcmFnOiBmdW5jdGlvbiBfZGVzZWxlY3RNdWx0aURyYWcoZXZ0KSB7XG4gICAgICBpZiAodHlwZW9mIGRyYWdTdGFydGVkICE9PSBcInVuZGVmaW5lZFwiICYmIGRyYWdTdGFydGVkKSByZXR1cm47XG5cbiAgICAgIC8vIE9ubHkgZGVzZWxlY3QgaWYgc2VsZWN0aW9uIGlzIGluIHRoaXMgc29ydGFibGVcbiAgICAgIGlmIChtdWx0aURyYWdTb3J0YWJsZSAhPT0gdGhpcy5zb3J0YWJsZSkgcmV0dXJuO1xuXG4gICAgICAvLyBPbmx5IGRlc2VsZWN0IGlmIHRhcmdldCBpcyBub3QgaXRlbSBpbiB0aGlzIHNvcnRhYmxlXG4gICAgICBpZiAoZXZ0ICYmIGNsb3Nlc3QoZXZ0LnRhcmdldCwgdGhpcy5vcHRpb25zLmRyYWdnYWJsZSwgdGhpcy5zb3J0YWJsZS5lbCwgZmFsc2UpKSByZXR1cm47XG5cbiAgICAgIC8vIE9ubHkgZGVzZWxlY3QgaWYgbGVmdCBjbGlja1xuICAgICAgaWYgKGV2dCAmJiBldnQuYnV0dG9uICE9PSAwKSByZXR1cm47XG4gICAgICB3aGlsZSAobXVsdGlEcmFnRWxlbWVudHMubGVuZ3RoKSB7XG4gICAgICAgIHZhciBlbCA9IG11bHRpRHJhZ0VsZW1lbnRzWzBdO1xuICAgICAgICB0b2dnbGVDbGFzcyhlbCwgdGhpcy5vcHRpb25zLnNlbGVjdGVkQ2xhc3MsIGZhbHNlKTtcbiAgICAgICAgbXVsdGlEcmFnRWxlbWVudHMuc2hpZnQoKTtcbiAgICAgICAgZGlzcGF0Y2hFdmVudCh7XG4gICAgICAgICAgc29ydGFibGU6IHRoaXMuc29ydGFibGUsXG4gICAgICAgICAgcm9vdEVsOiB0aGlzLnNvcnRhYmxlLmVsLFxuICAgICAgICAgIG5hbWU6ICdkZXNlbGVjdCcsXG4gICAgICAgICAgdGFyZ2V0RWw6IGVsLFxuICAgICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIF9jaGVja0tleURvd246IGZ1bmN0aW9uIF9jaGVja0tleURvd24oZXZ0KSB7XG4gICAgICBpZiAoZXZ0LmtleSA9PT0gdGhpcy5vcHRpb25zLm11bHRpRHJhZ0tleSkge1xuICAgICAgICB0aGlzLm11bHRpRHJhZ0tleURvd24gPSB0cnVlO1xuICAgICAgfVxuICAgIH0sXG4gICAgX2NoZWNrS2V5VXA6IGZ1bmN0aW9uIF9jaGVja0tleVVwKGV2dCkge1xuICAgICAgaWYgKGV2dC5rZXkgPT09IHRoaXMub3B0aW9ucy5tdWx0aURyYWdLZXkpIHtcbiAgICAgICAgdGhpcy5tdWx0aURyYWdLZXlEb3duID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9O1xuICByZXR1cm4gX2V4dGVuZHMoTXVsdGlEcmFnLCB7XG4gICAgLy8gU3RhdGljIG1ldGhvZHMgJiBwcm9wZXJ0aWVzXG4gICAgcGx1Z2luTmFtZTogJ211bHRpRHJhZycsXG4gICAgdXRpbHM6IHtcbiAgICAgIC8qKlxyXG4gICAgICAgKiBTZWxlY3RzIHRoZSBwcm92aWRlZCBtdWx0aS1kcmFnIGl0ZW1cclxuICAgICAgICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IGVsICAgIFRoZSBlbGVtZW50IHRvIGJlIHNlbGVjdGVkXHJcbiAgICAgICAqL1xuICAgICAgc2VsZWN0OiBmdW5jdGlvbiBzZWxlY3QoZWwpIHtcbiAgICAgICAgdmFyIHNvcnRhYmxlID0gZWwucGFyZW50Tm9kZVtleHBhbmRvXTtcbiAgICAgICAgaWYgKCFzb3J0YWJsZSB8fCAhc29ydGFibGUub3B0aW9ucy5tdWx0aURyYWcgfHwgfm11bHRpRHJhZ0VsZW1lbnRzLmluZGV4T2YoZWwpKSByZXR1cm47XG4gICAgICAgIGlmIChtdWx0aURyYWdTb3J0YWJsZSAmJiBtdWx0aURyYWdTb3J0YWJsZSAhPT0gc29ydGFibGUpIHtcbiAgICAgICAgICBtdWx0aURyYWdTb3J0YWJsZS5tdWx0aURyYWcuX2Rlc2VsZWN0TXVsdGlEcmFnKCk7XG4gICAgICAgICAgbXVsdGlEcmFnU29ydGFibGUgPSBzb3J0YWJsZTtcbiAgICAgICAgfVxuICAgICAgICB0b2dnbGVDbGFzcyhlbCwgc29ydGFibGUub3B0aW9ucy5zZWxlY3RlZENsYXNzLCB0cnVlKTtcbiAgICAgICAgbXVsdGlEcmFnRWxlbWVudHMucHVzaChlbCk7XG4gICAgICB9LFxuICAgICAgLyoqXHJcbiAgICAgICAqIERlc2VsZWN0cyB0aGUgcHJvdmlkZWQgbXVsdGktZHJhZyBpdGVtXHJcbiAgICAgICAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbCAgICBUaGUgZWxlbWVudCB0byBiZSBkZXNlbGVjdGVkXHJcbiAgICAgICAqL1xuICAgICAgZGVzZWxlY3Q6IGZ1bmN0aW9uIGRlc2VsZWN0KGVsKSB7XG4gICAgICAgIHZhciBzb3J0YWJsZSA9IGVsLnBhcmVudE5vZGVbZXhwYW5kb10sXG4gICAgICAgICAgaW5kZXggPSBtdWx0aURyYWdFbGVtZW50cy5pbmRleE9mKGVsKTtcbiAgICAgICAgaWYgKCFzb3J0YWJsZSB8fCAhc29ydGFibGUub3B0aW9ucy5tdWx0aURyYWcgfHwgIX5pbmRleCkgcmV0dXJuO1xuICAgICAgICB0b2dnbGVDbGFzcyhlbCwgc29ydGFibGUub3B0aW9ucy5zZWxlY3RlZENsYXNzLCBmYWxzZSk7XG4gICAgICAgIG11bHRpRHJhZ0VsZW1lbnRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBldmVudFByb3BlcnRpZXM6IGZ1bmN0aW9uIGV2ZW50UHJvcGVydGllcygpIHtcbiAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuICAgICAgdmFyIG9sZEluZGljaWVzID0gW10sXG4gICAgICAgIG5ld0luZGljaWVzID0gW107XG4gICAgICBtdWx0aURyYWdFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChtdWx0aURyYWdFbGVtZW50KSB7XG4gICAgICAgIG9sZEluZGljaWVzLnB1c2goe1xuICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnQ6IG11bHRpRHJhZ0VsZW1lbnQsXG4gICAgICAgICAgaW5kZXg6IG11bHRpRHJhZ0VsZW1lbnQuc29ydGFibGVJbmRleFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBtdWx0aURyYWdFbGVtZW50cyB3aWxsIGFscmVhZHkgYmUgc29ydGVkIGlmIGZvbGRpbmdcbiAgICAgICAgdmFyIG5ld0luZGV4O1xuICAgICAgICBpZiAoZm9sZGluZyAmJiBtdWx0aURyYWdFbGVtZW50ICE9PSBkcmFnRWwkMSkge1xuICAgICAgICAgIG5ld0luZGV4ID0gLTE7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9sZGluZykge1xuICAgICAgICAgIG5ld0luZGV4ID0gaW5kZXgobXVsdGlEcmFnRWxlbWVudCwgJzpub3QoLicgKyBfdGhpczMub3B0aW9ucy5zZWxlY3RlZENsYXNzICsgJyknKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXdJbmRleCA9IGluZGV4KG11bHRpRHJhZ0VsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIG5ld0luZGljaWVzLnB1c2goe1xuICAgICAgICAgIG11bHRpRHJhZ0VsZW1lbnQ6IG11bHRpRHJhZ0VsZW1lbnQsXG4gICAgICAgICAgaW5kZXg6IG5ld0luZGV4XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBpdGVtczogX3RvQ29uc3VtYWJsZUFycmF5KG11bHRpRHJhZ0VsZW1lbnRzKSxcbiAgICAgICAgY2xvbmVzOiBbXS5jb25jYXQobXVsdGlEcmFnQ2xvbmVzKSxcbiAgICAgICAgb2xkSW5kaWNpZXM6IG9sZEluZGljaWVzLFxuICAgICAgICBuZXdJbmRpY2llczogbmV3SW5kaWNpZXNcbiAgICAgIH07XG4gICAgfSxcbiAgICBvcHRpb25MaXN0ZW5lcnM6IHtcbiAgICAgIG11bHRpRHJhZ0tleTogZnVuY3Rpb24gbXVsdGlEcmFnS2V5KGtleSkge1xuICAgICAgICBrZXkgPSBrZXkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKGtleSA9PT0gJ2N0cmwnKSB7XG4gICAgICAgICAga2V5ID0gJ0NvbnRyb2wnO1xuICAgICAgICB9IGVsc2UgaWYgKGtleS5sZW5ndGggPiAxKSB7XG4gICAgICAgICAga2V5ID0ga2V5LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsga2V5LnN1YnN0cigxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59XG5mdW5jdGlvbiBpbnNlcnRNdWx0aURyYWdFbGVtZW50cyhjbG9uZXNJbnNlcnRlZCwgcm9vdEVsKSB7XG4gIG11bHRpRHJhZ0VsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKG11bHRpRHJhZ0VsZW1lbnQsIGkpIHtcbiAgICB2YXIgdGFyZ2V0ID0gcm9vdEVsLmNoaWxkcmVuW211bHRpRHJhZ0VsZW1lbnQuc29ydGFibGVJbmRleCArIChjbG9uZXNJbnNlcnRlZCA/IE51bWJlcihpKSA6IDApXTtcbiAgICBpZiAodGFyZ2V0KSB7XG4gICAgICByb290RWwuaW5zZXJ0QmVmb3JlKG11bHRpRHJhZ0VsZW1lbnQsIHRhcmdldCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJvb3RFbC5hcHBlbmRDaGlsZChtdWx0aURyYWdFbGVtZW50KTtcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcclxuICogSW5zZXJ0IG11bHRpLWRyYWcgY2xvbmVzXHJcbiAqIEBwYXJhbSAge1tCb29sZWFuXX0gZWxlbWVudHNJbnNlcnRlZCAgV2hldGhlciB0aGUgbXVsdGktZHJhZyBlbGVtZW50cyBhcmUgaW5zZXJ0ZWRcclxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR9IHJvb3RFbFxyXG4gKi9cbmZ1bmN0aW9uIGluc2VydE11bHRpRHJhZ0Nsb25lcyhlbGVtZW50c0luc2VydGVkLCByb290RWwpIHtcbiAgbXVsdGlEcmFnQ2xvbmVzLmZvckVhY2goZnVuY3Rpb24gKGNsb25lLCBpKSB7XG4gICAgdmFyIHRhcmdldCA9IHJvb3RFbC5jaGlsZHJlbltjbG9uZS5zb3J0YWJsZUluZGV4ICsgKGVsZW1lbnRzSW5zZXJ0ZWQgPyBOdW1iZXIoaSkgOiAwKV07XG4gICAgaWYgKHRhcmdldCkge1xuICAgICAgcm9vdEVsLmluc2VydEJlZm9yZShjbG9uZSwgdGFyZ2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcm9vdEVsLmFwcGVuZENoaWxkKGNsb25lKTtcbiAgICB9XG4gIH0pO1xufVxuZnVuY3Rpb24gcmVtb3ZlTXVsdGlEcmFnRWxlbWVudHMoKSB7XG4gIG11bHRpRHJhZ0VsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24gKG11bHRpRHJhZ0VsZW1lbnQpIHtcbiAgICBpZiAobXVsdGlEcmFnRWxlbWVudCA9PT0gZHJhZ0VsJDEpIHJldHVybjtcbiAgICBtdWx0aURyYWdFbGVtZW50LnBhcmVudE5vZGUgJiYgbXVsdGlEcmFnRWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG11bHRpRHJhZ0VsZW1lbnQpO1xuICB9KTtcbn1cblxuU29ydGFibGUubW91bnQobmV3IEF1dG9TY3JvbGxQbHVnaW4oKSk7XG5Tb3J0YWJsZS5tb3VudChSZW1vdmUsIFJldmVydCk7XG5cbmV4cG9ydCBkZWZhdWx0IFNvcnRhYmxlO1xuZXhwb3J0IHsgTXVsdGlEcmFnUGx1Z2luIGFzIE11bHRpRHJhZywgU29ydGFibGUsIFN3YXBQbHVnaW4gYXMgU3dhcCB9O1xuIiwgImltcG9ydCBTb3J0YWJsZSBmcm9tICdzb3J0YWJsZWpzJ1xuXG53aW5kb3cuU29ydGFibGUgPSBTb3J0YWJsZVxuXG5leHBvcnQgZGVmYXVsdCAoQWxwaW5lKSA9PiB7XG4gICAgQWxwaW5lLmRpcmVjdGl2ZSgnc29ydGFibGUnLCAoZWwpID0+IHtcbiAgICAgICAgbGV0IGFuaW1hdGlvbiA9IHBhcnNlSW50KGVsLmRhdGFzZXQ/LnNvcnRhYmxlQW5pbWF0aW9uRHVyYXRpb24pXG5cbiAgICAgICAgaWYgKGFuaW1hdGlvbiAhPT0gMCAmJiAhYW5pbWF0aW9uKSB7XG4gICAgICAgICAgICBhbmltYXRpb24gPSAzMDBcbiAgICAgICAgfVxuXG4gICAgICAgIGVsLnNvcnRhYmxlID0gU29ydGFibGUuY3JlYXRlKGVsLCB7XG4gICAgICAgICAgICBkcmFnZ2FibGU6ICdbeC1zb3J0YWJsZS1pdGVtXScsXG4gICAgICAgICAgICBoYW5kbGU6ICdbeC1zb3J0YWJsZS1oYW5kbGVdJyxcbiAgICAgICAgICAgIGRhdGFJZEF0dHI6ICd4LXNvcnRhYmxlLWl0ZW0nLFxuICAgICAgICAgICAgYW5pbWF0aW9uOiBhbmltYXRpb24sXG4gICAgICAgICAgICBnaG9zdENsYXNzOiAnZmktc29ydGFibGUtZ2hvc3QnLFxuICAgICAgICB9KVxuICAgIH0pXG59XG4iLCAidmFyIF9fY3JlYXRlID0gT2JqZWN0LmNyZWF0ZTtcbnZhciBfX2RlZlByb3AgPSBPYmplY3QuZGVmaW5lUHJvcGVydHk7XG52YXIgX19nZXRQcm90b09mID0gT2JqZWN0LmdldFByb3RvdHlwZU9mO1xudmFyIF9faGFzT3duUHJvcCA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgX19nZXRPd25Qcm9wTmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcztcbnZhciBfX2dldE93blByb3BEZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcjtcbnZhciBfX21hcmtBc01vZHVsZSA9ICh0YXJnZXQpID0+IF9fZGVmUHJvcCh0YXJnZXQsIFwiX19lc01vZHVsZVwiLCB7dmFsdWU6IHRydWV9KTtcbnZhciBfX2NvbW1vbkpTID0gKGNhbGxiYWNrLCBtb2R1bGUpID0+ICgpID0+IHtcbiAgaWYgKCFtb2R1bGUpIHtcbiAgICBtb2R1bGUgPSB7ZXhwb3J0czoge319O1xuICAgIGNhbGxiYWNrKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUpO1xuICB9XG4gIHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn07XG52YXIgX19leHBvcnRTdGFyID0gKHRhcmdldCwgbW9kdWxlLCBkZXNjKSA9PiB7XG4gIGlmIChtb2R1bGUgJiYgdHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgbW9kdWxlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBmb3IgKGxldCBrZXkgb2YgX19nZXRPd25Qcm9wTmFtZXMobW9kdWxlKSlcbiAgICAgIGlmICghX19oYXNPd25Qcm9wLmNhbGwodGFyZ2V0LCBrZXkpICYmIGtleSAhPT0gXCJkZWZhdWx0XCIpXG4gICAgICAgIF9fZGVmUHJvcCh0YXJnZXQsIGtleSwge2dldDogKCkgPT4gbW9kdWxlW2tleV0sIGVudW1lcmFibGU6ICEoZGVzYyA9IF9fZ2V0T3duUHJvcERlc2MobW9kdWxlLCBrZXkpKSB8fCBkZXNjLmVudW1lcmFibGV9KTtcbiAgfVxuICByZXR1cm4gdGFyZ2V0O1xufTtcbnZhciBfX3RvTW9kdWxlID0gKG1vZHVsZSkgPT4ge1xuICByZXR1cm4gX19leHBvcnRTdGFyKF9fbWFya0FzTW9kdWxlKF9fZGVmUHJvcChtb2R1bGUgIT0gbnVsbCA/IF9fY3JlYXRlKF9fZ2V0UHJvdG9PZihtb2R1bGUpKSA6IHt9LCBcImRlZmF1bHRcIiwgbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlICYmIFwiZGVmYXVsdFwiIGluIG1vZHVsZSA/IHtnZXQ6ICgpID0+IG1vZHVsZS5kZWZhdWx0LCBlbnVtZXJhYmxlOiB0cnVlfSA6IHt2YWx1ZTogbW9kdWxlLCBlbnVtZXJhYmxlOiB0cnVlfSkpLCBtb2R1bGUpO1xufTtcblxuLy8gbm9kZV9tb2R1bGVzL0Bwb3BwZXJqcy9jb3JlL2Rpc3QvY2pzL3BvcHBlci5qc1xudmFyIHJlcXVpcmVfcG9wcGVyID0gX19jb21tb25KUygoZXhwb3J0cykgPT4ge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7dmFsdWU6IHRydWV9KTtcbiAgZnVuY3Rpb24gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGVsZW1lbnQpIHtcbiAgICB2YXIgcmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHdpZHRoOiByZWN0LndpZHRoLFxuICAgICAgaGVpZ2h0OiByZWN0LmhlaWdodCxcbiAgICAgIHRvcDogcmVjdC50b3AsXG4gICAgICByaWdodDogcmVjdC5yaWdodCxcbiAgICAgIGJvdHRvbTogcmVjdC5ib3R0b20sXG4gICAgICBsZWZ0OiByZWN0LmxlZnQsXG4gICAgICB4OiByZWN0LmxlZnQsXG4gICAgICB5OiByZWN0LnRvcFxuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gZ2V0V2luZG93KG5vZGUpIHtcbiAgICBpZiAobm9kZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gd2luZG93O1xuICAgIH1cbiAgICBpZiAobm9kZS50b1N0cmluZygpICE9PSBcIltvYmplY3QgV2luZG93XVwiKSB7XG4gICAgICB2YXIgb3duZXJEb2N1bWVudCA9IG5vZGUub3duZXJEb2N1bWVudDtcbiAgICAgIHJldHVybiBvd25lckRvY3VtZW50ID8gb3duZXJEb2N1bWVudC5kZWZhdWx0VmlldyB8fCB3aW5kb3cgOiB3aW5kb3c7XG4gICAgfVxuICAgIHJldHVybiBub2RlO1xuICB9XG4gIGZ1bmN0aW9uIGdldFdpbmRvd1Njcm9sbChub2RlKSB7XG4gICAgdmFyIHdpbiA9IGdldFdpbmRvdyhub2RlKTtcbiAgICB2YXIgc2Nyb2xsTGVmdCA9IHdpbi5wYWdlWE9mZnNldDtcbiAgICB2YXIgc2Nyb2xsVG9wID0gd2luLnBhZ2VZT2Zmc2V0O1xuICAgIHJldHVybiB7XG4gICAgICBzY3JvbGxMZWZ0LFxuICAgICAgc2Nyb2xsVG9wXG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBpc0VsZW1lbnQobm9kZSkge1xuICAgIHZhciBPd25FbGVtZW50ID0gZ2V0V2luZG93KG5vZGUpLkVsZW1lbnQ7XG4gICAgcmV0dXJuIG5vZGUgaW5zdGFuY2VvZiBPd25FbGVtZW50IHx8IG5vZGUgaW5zdGFuY2VvZiBFbGVtZW50O1xuICB9XG4gIGZ1bmN0aW9uIGlzSFRNTEVsZW1lbnQobm9kZSkge1xuICAgIHZhciBPd25FbGVtZW50ID0gZ2V0V2luZG93KG5vZGUpLkhUTUxFbGVtZW50O1xuICAgIHJldHVybiBub2RlIGluc3RhbmNlb2YgT3duRWxlbWVudCB8fCBub2RlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQ7XG4gIH1cbiAgZnVuY3Rpb24gaXNTaGFkb3dSb290KG5vZGUpIHtcbiAgICBpZiAodHlwZW9mIFNoYWRvd1Jvb3QgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIE93bkVsZW1lbnQgPSBnZXRXaW5kb3cobm9kZSkuU2hhZG93Um9vdDtcbiAgICByZXR1cm4gbm9kZSBpbnN0YW5jZW9mIE93bkVsZW1lbnQgfHwgbm9kZSBpbnN0YW5jZW9mIFNoYWRvd1Jvb3Q7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0SFRNTEVsZW1lbnRTY3JvbGwoZWxlbWVudCkge1xuICAgIHJldHVybiB7XG4gICAgICBzY3JvbGxMZWZ0OiBlbGVtZW50LnNjcm9sbExlZnQsXG4gICAgICBzY3JvbGxUb3A6IGVsZW1lbnQuc2Nyb2xsVG9wXG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBnZXROb2RlU2Nyb2xsKG5vZGUpIHtcbiAgICBpZiAobm9kZSA9PT0gZ2V0V2luZG93KG5vZGUpIHx8ICFpc0hUTUxFbGVtZW50KG5vZGUpKSB7XG4gICAgICByZXR1cm4gZ2V0V2luZG93U2Nyb2xsKG5vZGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZ2V0SFRNTEVsZW1lbnRTY3JvbGwobm9kZSk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGdldE5vZGVOYW1lKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gZWxlbWVudCA/IChlbGVtZW50Lm5vZGVOYW1lIHx8IFwiXCIpLnRvTG93ZXJDYXNlKCkgOiBudWxsO1xuICB9XG4gIGZ1bmN0aW9uIGdldERvY3VtZW50RWxlbWVudChlbGVtZW50KSB7XG4gICAgcmV0dXJuICgoaXNFbGVtZW50KGVsZW1lbnQpID8gZWxlbWVudC5vd25lckRvY3VtZW50IDogZWxlbWVudC5kb2N1bWVudCkgfHwgd2luZG93LmRvY3VtZW50KS5kb2N1bWVudEVsZW1lbnQ7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0V2luZG93U2Nyb2xsQmFyWChlbGVtZW50KSB7XG4gICAgcmV0dXJuIGdldEJvdW5kaW5nQ2xpZW50UmVjdChnZXREb2N1bWVudEVsZW1lbnQoZWxlbWVudCkpLmxlZnQgKyBnZXRXaW5kb3dTY3JvbGwoZWxlbWVudCkuc2Nyb2xsTGVmdDtcbiAgfVxuICBmdW5jdGlvbiBnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gZ2V0V2luZG93KGVsZW1lbnQpLmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCk7XG4gIH1cbiAgZnVuY3Rpb24gaXNTY3JvbGxQYXJlbnQoZWxlbWVudCkge1xuICAgIHZhciBfZ2V0Q29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCksIG92ZXJmbG93ID0gX2dldENvbXB1dGVkU3R5bGUub3ZlcmZsb3csIG92ZXJmbG93WCA9IF9nZXRDb21wdXRlZFN0eWxlLm92ZXJmbG93WCwgb3ZlcmZsb3dZID0gX2dldENvbXB1dGVkU3R5bGUub3ZlcmZsb3dZO1xuICAgIHJldHVybiAvYXV0b3xzY3JvbGx8b3ZlcmxheXxoaWRkZW4vLnRlc3Qob3ZlcmZsb3cgKyBvdmVyZmxvd1kgKyBvdmVyZmxvd1gpO1xuICB9XG4gIGZ1bmN0aW9uIGdldENvbXBvc2l0ZVJlY3QoZWxlbWVudE9yVmlydHVhbEVsZW1lbnQsIG9mZnNldFBhcmVudCwgaXNGaXhlZCkge1xuICAgIGlmIChpc0ZpeGVkID09PSB2b2lkIDApIHtcbiAgICAgIGlzRml4ZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGRvY3VtZW50RWxlbWVudCA9IGdldERvY3VtZW50RWxlbWVudChvZmZzZXRQYXJlbnQpO1xuICAgIHZhciByZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGVsZW1lbnRPclZpcnR1YWxFbGVtZW50KTtcbiAgICB2YXIgaXNPZmZzZXRQYXJlbnRBbkVsZW1lbnQgPSBpc0hUTUxFbGVtZW50KG9mZnNldFBhcmVudCk7XG4gICAgdmFyIHNjcm9sbCA9IHtcbiAgICAgIHNjcm9sbExlZnQ6IDAsXG4gICAgICBzY3JvbGxUb3A6IDBcbiAgICB9O1xuICAgIHZhciBvZmZzZXRzID0ge1xuICAgICAgeDogMCxcbiAgICAgIHk6IDBcbiAgICB9O1xuICAgIGlmIChpc09mZnNldFBhcmVudEFuRWxlbWVudCB8fCAhaXNPZmZzZXRQYXJlbnRBbkVsZW1lbnQgJiYgIWlzRml4ZWQpIHtcbiAgICAgIGlmIChnZXROb2RlTmFtZShvZmZzZXRQYXJlbnQpICE9PSBcImJvZHlcIiB8fCBpc1Njcm9sbFBhcmVudChkb2N1bWVudEVsZW1lbnQpKSB7XG4gICAgICAgIHNjcm9sbCA9IGdldE5vZGVTY3JvbGwob2Zmc2V0UGFyZW50KTtcbiAgICAgIH1cbiAgICAgIGlmIChpc0hUTUxFbGVtZW50KG9mZnNldFBhcmVudCkpIHtcbiAgICAgICAgb2Zmc2V0cyA9IGdldEJvdW5kaW5nQ2xpZW50UmVjdChvZmZzZXRQYXJlbnQpO1xuICAgICAgICBvZmZzZXRzLnggKz0gb2Zmc2V0UGFyZW50LmNsaWVudExlZnQ7XG4gICAgICAgIG9mZnNldHMueSArPSBvZmZzZXRQYXJlbnQuY2xpZW50VG9wO1xuICAgICAgfSBlbHNlIGlmIChkb2N1bWVudEVsZW1lbnQpIHtcbiAgICAgICAgb2Zmc2V0cy54ID0gZ2V0V2luZG93U2Nyb2xsQmFyWChkb2N1bWVudEVsZW1lbnQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgeDogcmVjdC5sZWZ0ICsgc2Nyb2xsLnNjcm9sbExlZnQgLSBvZmZzZXRzLngsXG4gICAgICB5OiByZWN0LnRvcCArIHNjcm9sbC5zY3JvbGxUb3AgLSBvZmZzZXRzLnksXG4gICAgICB3aWR0aDogcmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogcmVjdC5oZWlnaHRcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIGdldExheW91dFJlY3QoZWxlbWVudCkge1xuICAgIHZhciBjbGllbnRSZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KGVsZW1lbnQpO1xuICAgIHZhciB3aWR0aCA9IGVsZW1lbnQub2Zmc2V0V2lkdGg7XG4gICAgdmFyIGhlaWdodCA9IGVsZW1lbnQub2Zmc2V0SGVpZ2h0O1xuICAgIGlmIChNYXRoLmFicyhjbGllbnRSZWN0LndpZHRoIC0gd2lkdGgpIDw9IDEpIHtcbiAgICAgIHdpZHRoID0gY2xpZW50UmVjdC53aWR0aDtcbiAgICB9XG4gICAgaWYgKE1hdGguYWJzKGNsaWVudFJlY3QuaGVpZ2h0IC0gaGVpZ2h0KSA8PSAxKSB7XG4gICAgICBoZWlnaHQgPSBjbGllbnRSZWN0LmhlaWdodDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHg6IGVsZW1lbnQub2Zmc2V0TGVmdCxcbiAgICAgIHk6IGVsZW1lbnQub2Zmc2V0VG9wLFxuICAgICAgd2lkdGgsXG4gICAgICBoZWlnaHRcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIGdldFBhcmVudE5vZGUoZWxlbWVudCkge1xuICAgIGlmIChnZXROb2RlTmFtZShlbGVtZW50KSA9PT0gXCJodG1sXCIpIHtcbiAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudC5hc3NpZ25lZFNsb3QgfHwgZWxlbWVudC5wYXJlbnROb2RlIHx8IChpc1NoYWRvd1Jvb3QoZWxlbWVudCkgPyBlbGVtZW50Lmhvc3QgOiBudWxsKSB8fCBnZXREb2N1bWVudEVsZW1lbnQoZWxlbWVudCk7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0U2Nyb2xsUGFyZW50KG5vZGUpIHtcbiAgICBpZiAoW1wiaHRtbFwiLCBcImJvZHlcIiwgXCIjZG9jdW1lbnRcIl0uaW5kZXhPZihnZXROb2RlTmFtZShub2RlKSkgPj0gMCkge1xuICAgICAgcmV0dXJuIG5vZGUub3duZXJEb2N1bWVudC5ib2R5O1xuICAgIH1cbiAgICBpZiAoaXNIVE1MRWxlbWVudChub2RlKSAmJiBpc1Njcm9sbFBhcmVudChub2RlKSkge1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICAgIHJldHVybiBnZXRTY3JvbGxQYXJlbnQoZ2V0UGFyZW50Tm9kZShub2RlKSk7XG4gIH1cbiAgZnVuY3Rpb24gbGlzdFNjcm9sbFBhcmVudHMoZWxlbWVudCwgbGlzdCkge1xuICAgIHZhciBfZWxlbWVudCRvd25lckRvY3VtZW47XG4gICAgaWYgKGxpc3QgPT09IHZvaWQgMCkge1xuICAgICAgbGlzdCA9IFtdO1xuICAgIH1cbiAgICB2YXIgc2Nyb2xsUGFyZW50ID0gZ2V0U2Nyb2xsUGFyZW50KGVsZW1lbnQpO1xuICAgIHZhciBpc0JvZHkgPSBzY3JvbGxQYXJlbnQgPT09ICgoX2VsZW1lbnQkb3duZXJEb2N1bWVuID0gZWxlbWVudC5vd25lckRvY3VtZW50KSA9PSBudWxsID8gdm9pZCAwIDogX2VsZW1lbnQkb3duZXJEb2N1bWVuLmJvZHkpO1xuICAgIHZhciB3aW4gPSBnZXRXaW5kb3coc2Nyb2xsUGFyZW50KTtcbiAgICB2YXIgdGFyZ2V0ID0gaXNCb2R5ID8gW3dpbl0uY29uY2F0KHdpbi52aXN1YWxWaWV3cG9ydCB8fCBbXSwgaXNTY3JvbGxQYXJlbnQoc2Nyb2xsUGFyZW50KSA/IHNjcm9sbFBhcmVudCA6IFtdKSA6IHNjcm9sbFBhcmVudDtcbiAgICB2YXIgdXBkYXRlZExpc3QgPSBsaXN0LmNvbmNhdCh0YXJnZXQpO1xuICAgIHJldHVybiBpc0JvZHkgPyB1cGRhdGVkTGlzdCA6IHVwZGF0ZWRMaXN0LmNvbmNhdChsaXN0U2Nyb2xsUGFyZW50cyhnZXRQYXJlbnROb2RlKHRhcmdldCkpKTtcbiAgfVxuICBmdW5jdGlvbiBpc1RhYmxlRWxlbWVudChlbGVtZW50KSB7XG4gICAgcmV0dXJuIFtcInRhYmxlXCIsIFwidGRcIiwgXCJ0aFwiXS5pbmRleE9mKGdldE5vZGVOYW1lKGVsZW1lbnQpKSA+PSAwO1xuICB9XG4gIGZ1bmN0aW9uIGdldFRydWVPZmZzZXRQYXJlbnQoZWxlbWVudCkge1xuICAgIGlmICghaXNIVE1MRWxlbWVudChlbGVtZW50KSB8fCBnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpLnBvc2l0aW9uID09PSBcImZpeGVkXCIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gZWxlbWVudC5vZmZzZXRQYXJlbnQ7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0Q29udGFpbmluZ0Jsb2NrKGVsZW1lbnQpIHtcbiAgICB2YXIgaXNGaXJlZm94ID0gbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoXCJmaXJlZm94XCIpICE9PSAtMTtcbiAgICB2YXIgaXNJRSA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIlRyaWRlbnRcIikgIT09IC0xO1xuICAgIGlmIChpc0lFICYmIGlzSFRNTEVsZW1lbnQoZWxlbWVudCkpIHtcbiAgICAgIHZhciBlbGVtZW50Q3NzID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KTtcbiAgICAgIGlmIChlbGVtZW50Q3NzLnBvc2l0aW9uID09PSBcImZpeGVkXCIpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBjdXJyZW50Tm9kZSA9IGdldFBhcmVudE5vZGUoZWxlbWVudCk7XG4gICAgd2hpbGUgKGlzSFRNTEVsZW1lbnQoY3VycmVudE5vZGUpICYmIFtcImh0bWxcIiwgXCJib2R5XCJdLmluZGV4T2YoZ2V0Tm9kZU5hbWUoY3VycmVudE5vZGUpKSA8IDApIHtcbiAgICAgIHZhciBjc3MgPSBnZXRDb21wdXRlZFN0eWxlKGN1cnJlbnROb2RlKTtcbiAgICAgIGlmIChjc3MudHJhbnNmb3JtICE9PSBcIm5vbmVcIiB8fCBjc3MucGVyc3BlY3RpdmUgIT09IFwibm9uZVwiIHx8IGNzcy5jb250YWluID09PSBcInBhaW50XCIgfHwgW1widHJhbnNmb3JtXCIsIFwicGVyc3BlY3RpdmVcIl0uaW5kZXhPZihjc3Mud2lsbENoYW5nZSkgIT09IC0xIHx8IGlzRmlyZWZveCAmJiBjc3Mud2lsbENoYW5nZSA9PT0gXCJmaWx0ZXJcIiB8fCBpc0ZpcmVmb3ggJiYgY3NzLmZpbHRlciAmJiBjc3MuZmlsdGVyICE9PSBcIm5vbmVcIikge1xuICAgICAgICByZXR1cm4gY3VycmVudE5vZGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLnBhcmVudE5vZGU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGZ1bmN0aW9uIGdldE9mZnNldFBhcmVudChlbGVtZW50KSB7XG4gICAgdmFyIHdpbmRvdzIgPSBnZXRXaW5kb3coZWxlbWVudCk7XG4gICAgdmFyIG9mZnNldFBhcmVudCA9IGdldFRydWVPZmZzZXRQYXJlbnQoZWxlbWVudCk7XG4gICAgd2hpbGUgKG9mZnNldFBhcmVudCAmJiBpc1RhYmxlRWxlbWVudChvZmZzZXRQYXJlbnQpICYmIGdldENvbXB1dGVkU3R5bGUob2Zmc2V0UGFyZW50KS5wb3NpdGlvbiA9PT0gXCJzdGF0aWNcIikge1xuICAgICAgb2Zmc2V0UGFyZW50ID0gZ2V0VHJ1ZU9mZnNldFBhcmVudChvZmZzZXRQYXJlbnQpO1xuICAgIH1cbiAgICBpZiAob2Zmc2V0UGFyZW50ICYmIChnZXROb2RlTmFtZShvZmZzZXRQYXJlbnQpID09PSBcImh0bWxcIiB8fCBnZXROb2RlTmFtZShvZmZzZXRQYXJlbnQpID09PSBcImJvZHlcIiAmJiBnZXRDb21wdXRlZFN0eWxlKG9mZnNldFBhcmVudCkucG9zaXRpb24gPT09IFwic3RhdGljXCIpKSB7XG4gICAgICByZXR1cm4gd2luZG93MjtcbiAgICB9XG4gICAgcmV0dXJuIG9mZnNldFBhcmVudCB8fCBnZXRDb250YWluaW5nQmxvY2soZWxlbWVudCkgfHwgd2luZG93MjtcbiAgfVxuICB2YXIgdG9wID0gXCJ0b3BcIjtcbiAgdmFyIGJvdHRvbSA9IFwiYm90dG9tXCI7XG4gIHZhciByaWdodCA9IFwicmlnaHRcIjtcbiAgdmFyIGxlZnQgPSBcImxlZnRcIjtcbiAgdmFyIGF1dG8gPSBcImF1dG9cIjtcbiAgdmFyIGJhc2VQbGFjZW1lbnRzID0gW3RvcCwgYm90dG9tLCByaWdodCwgbGVmdF07XG4gIHZhciBzdGFydCA9IFwic3RhcnRcIjtcbiAgdmFyIGVuZCA9IFwiZW5kXCI7XG4gIHZhciBjbGlwcGluZ1BhcmVudHMgPSBcImNsaXBwaW5nUGFyZW50c1wiO1xuICB2YXIgdmlld3BvcnQgPSBcInZpZXdwb3J0XCI7XG4gIHZhciBwb3BwZXIgPSBcInBvcHBlclwiO1xuICB2YXIgcmVmZXJlbmNlID0gXCJyZWZlcmVuY2VcIjtcbiAgdmFyIHZhcmlhdGlvblBsYWNlbWVudHMgPSAvKiBAX19QVVJFX18gKi8gYmFzZVBsYWNlbWVudHMucmVkdWNlKGZ1bmN0aW9uKGFjYywgcGxhY2VtZW50KSB7XG4gICAgcmV0dXJuIGFjYy5jb25jYXQoW3BsYWNlbWVudCArIFwiLVwiICsgc3RhcnQsIHBsYWNlbWVudCArIFwiLVwiICsgZW5kXSk7XG4gIH0sIFtdKTtcbiAgdmFyIHBsYWNlbWVudHMgPSAvKiBAX19QVVJFX18gKi8gW10uY29uY2F0KGJhc2VQbGFjZW1lbnRzLCBbYXV0b10pLnJlZHVjZShmdW5jdGlvbihhY2MsIHBsYWNlbWVudCkge1xuICAgIHJldHVybiBhY2MuY29uY2F0KFtwbGFjZW1lbnQsIHBsYWNlbWVudCArIFwiLVwiICsgc3RhcnQsIHBsYWNlbWVudCArIFwiLVwiICsgZW5kXSk7XG4gIH0sIFtdKTtcbiAgdmFyIGJlZm9yZVJlYWQgPSBcImJlZm9yZVJlYWRcIjtcbiAgdmFyIHJlYWQgPSBcInJlYWRcIjtcbiAgdmFyIGFmdGVyUmVhZCA9IFwiYWZ0ZXJSZWFkXCI7XG4gIHZhciBiZWZvcmVNYWluID0gXCJiZWZvcmVNYWluXCI7XG4gIHZhciBtYWluID0gXCJtYWluXCI7XG4gIHZhciBhZnRlck1haW4gPSBcImFmdGVyTWFpblwiO1xuICB2YXIgYmVmb3JlV3JpdGUgPSBcImJlZm9yZVdyaXRlXCI7XG4gIHZhciB3cml0ZSA9IFwid3JpdGVcIjtcbiAgdmFyIGFmdGVyV3JpdGUgPSBcImFmdGVyV3JpdGVcIjtcbiAgdmFyIG1vZGlmaWVyUGhhc2VzID0gW2JlZm9yZVJlYWQsIHJlYWQsIGFmdGVyUmVhZCwgYmVmb3JlTWFpbiwgbWFpbiwgYWZ0ZXJNYWluLCBiZWZvcmVXcml0ZSwgd3JpdGUsIGFmdGVyV3JpdGVdO1xuICBmdW5jdGlvbiBvcmRlcihtb2RpZmllcnMpIHtcbiAgICB2YXIgbWFwID0gbmV3IE1hcCgpO1xuICAgIHZhciB2aXNpdGVkID0gbmV3IFNldCgpO1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICBtb2RpZmllcnMuZm9yRWFjaChmdW5jdGlvbihtb2RpZmllcikge1xuICAgICAgbWFwLnNldChtb2RpZmllci5uYW1lLCBtb2RpZmllcik7XG4gICAgfSk7XG4gICAgZnVuY3Rpb24gc29ydChtb2RpZmllcikge1xuICAgICAgdmlzaXRlZC5hZGQobW9kaWZpZXIubmFtZSk7XG4gICAgICB2YXIgcmVxdWlyZXMgPSBbXS5jb25jYXQobW9kaWZpZXIucmVxdWlyZXMgfHwgW10sIG1vZGlmaWVyLnJlcXVpcmVzSWZFeGlzdHMgfHwgW10pO1xuICAgICAgcmVxdWlyZXMuZm9yRWFjaChmdW5jdGlvbihkZXApIHtcbiAgICAgICAgaWYgKCF2aXNpdGVkLmhhcyhkZXApKSB7XG4gICAgICAgICAgdmFyIGRlcE1vZGlmaWVyID0gbWFwLmdldChkZXApO1xuICAgICAgICAgIGlmIChkZXBNb2RpZmllcikge1xuICAgICAgICAgICAgc29ydChkZXBNb2RpZmllcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJlc3VsdC5wdXNoKG1vZGlmaWVyKTtcbiAgICB9XG4gICAgbW9kaWZpZXJzLmZvckVhY2goZnVuY3Rpb24obW9kaWZpZXIpIHtcbiAgICAgIGlmICghdmlzaXRlZC5oYXMobW9kaWZpZXIubmFtZSkpIHtcbiAgICAgICAgc29ydChtb2RpZmllcik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBmdW5jdGlvbiBvcmRlck1vZGlmaWVycyhtb2RpZmllcnMpIHtcbiAgICB2YXIgb3JkZXJlZE1vZGlmaWVycyA9IG9yZGVyKG1vZGlmaWVycyk7XG4gICAgcmV0dXJuIG1vZGlmaWVyUGhhc2VzLnJlZHVjZShmdW5jdGlvbihhY2MsIHBoYXNlKSB7XG4gICAgICByZXR1cm4gYWNjLmNvbmNhdChvcmRlcmVkTW9kaWZpZXJzLmZpbHRlcihmdW5jdGlvbihtb2RpZmllcikge1xuICAgICAgICByZXR1cm4gbW9kaWZpZXIucGhhc2UgPT09IHBoYXNlO1xuICAgICAgfSkpO1xuICAgIH0sIFtdKTtcbiAgfVxuICBmdW5jdGlvbiBkZWJvdW5jZShmbikge1xuICAgIHZhciBwZW5kaW5nO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghcGVuZGluZykge1xuICAgICAgICBwZW5kaW5nID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBwZW5kaW5nID0gdm9pZCAwO1xuICAgICAgICAgICAgcmVzb2x2ZShmbigpKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGVuZGluZztcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIGZvcm1hdChzdHIpIHtcbiAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IG5ldyBBcnJheShfbGVuID4gMSA/IF9sZW4gLSAxIDogMCksIF9rZXkgPSAxOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG4gICAgICBhcmdzW19rZXkgLSAxXSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIFtdLmNvbmNhdChhcmdzKS5yZWR1Y2UoZnVuY3Rpb24ocCwgYykge1xuICAgICAgcmV0dXJuIHAucmVwbGFjZSgvJXMvLCBjKTtcbiAgICB9LCBzdHIpO1xuICB9XG4gIHZhciBJTlZBTElEX01PRElGSUVSX0VSUk9SID0gJ1BvcHBlcjogbW9kaWZpZXIgXCIlc1wiIHByb3ZpZGVkIGFuIGludmFsaWQgJXMgcHJvcGVydHksIGV4cGVjdGVkICVzIGJ1dCBnb3QgJXMnO1xuICB2YXIgTUlTU0lOR19ERVBFTkRFTkNZX0VSUk9SID0gJ1BvcHBlcjogbW9kaWZpZXIgXCIlc1wiIHJlcXVpcmVzIFwiJXNcIiwgYnV0IFwiJXNcIiBtb2RpZmllciBpcyBub3QgYXZhaWxhYmxlJztcbiAgdmFyIFZBTElEX1BST1BFUlRJRVMgPSBbXCJuYW1lXCIsIFwiZW5hYmxlZFwiLCBcInBoYXNlXCIsIFwiZm5cIiwgXCJlZmZlY3RcIiwgXCJyZXF1aXJlc1wiLCBcIm9wdGlvbnNcIl07XG4gIGZ1bmN0aW9uIHZhbGlkYXRlTW9kaWZpZXJzKG1vZGlmaWVycykge1xuICAgIG1vZGlmaWVycy5mb3JFYWNoKGZ1bmN0aW9uKG1vZGlmaWVyKSB7XG4gICAgICBPYmplY3Qua2V5cyhtb2RpZmllcikuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgc3dpdGNoIChrZXkpIHtcbiAgICAgICAgICBjYXNlIFwibmFtZVwiOlxuICAgICAgICAgICAgaWYgKHR5cGVvZiBtb2RpZmllci5uYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZm9ybWF0KElOVkFMSURfTU9ESUZJRVJfRVJST1IsIFN0cmluZyhtb2RpZmllci5uYW1lKSwgJ1wibmFtZVwiJywgJ1wic3RyaW5nXCInLCAnXCInICsgU3RyaW5nKG1vZGlmaWVyLm5hbWUpICsgJ1wiJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImVuYWJsZWRcIjpcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbW9kaWZpZXIuZW5hYmxlZCAhPT0gXCJib29sZWFuXCIpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihmb3JtYXQoSU5WQUxJRF9NT0RJRklFUl9FUlJPUiwgbW9kaWZpZXIubmFtZSwgJ1wiZW5hYmxlZFwiJywgJ1wiYm9vbGVhblwiJywgJ1wiJyArIFN0cmluZyhtb2RpZmllci5lbmFibGVkKSArICdcIicpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBjYXNlIFwicGhhc2VcIjpcbiAgICAgICAgICAgIGlmIChtb2RpZmllclBoYXNlcy5pbmRleE9mKG1vZGlmaWVyLnBoYXNlKSA8IDApIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihmb3JtYXQoSU5WQUxJRF9NT0RJRklFUl9FUlJPUiwgbW9kaWZpZXIubmFtZSwgJ1wicGhhc2VcIicsIFwiZWl0aGVyIFwiICsgbW9kaWZpZXJQaGFzZXMuam9pbihcIiwgXCIpLCAnXCInICsgU3RyaW5nKG1vZGlmaWVyLnBoYXNlKSArICdcIicpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJmblwiOlxuICAgICAgICAgICAgaWYgKHR5cGVvZiBtb2RpZmllci5mbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZm9ybWF0KElOVkFMSURfTU9ESUZJRVJfRVJST1IsIG1vZGlmaWVyLm5hbWUsICdcImZuXCInLCAnXCJmdW5jdGlvblwiJywgJ1wiJyArIFN0cmluZyhtb2RpZmllci5mbikgKyAnXCInKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZWZmZWN0XCI6XG4gICAgICAgICAgICBpZiAodHlwZW9mIG1vZGlmaWVyLmVmZmVjdCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZm9ybWF0KElOVkFMSURfTU9ESUZJRVJfRVJST1IsIG1vZGlmaWVyLm5hbWUsICdcImVmZmVjdFwiJywgJ1wiZnVuY3Rpb25cIicsICdcIicgKyBTdHJpbmcobW9kaWZpZXIuZm4pICsgJ1wiJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInJlcXVpcmVzXCI6XG4gICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkobW9kaWZpZXIucmVxdWlyZXMpKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZm9ybWF0KElOVkFMSURfTU9ESUZJRVJfRVJST1IsIG1vZGlmaWVyLm5hbWUsICdcInJlcXVpcmVzXCInLCAnXCJhcnJheVwiJywgJ1wiJyArIFN0cmluZyhtb2RpZmllci5yZXF1aXJlcykgKyAnXCInKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwicmVxdWlyZXNJZkV4aXN0c1wiOlxuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KG1vZGlmaWVyLnJlcXVpcmVzSWZFeGlzdHMpKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZm9ybWF0KElOVkFMSURfTU9ESUZJRVJfRVJST1IsIG1vZGlmaWVyLm5hbWUsICdcInJlcXVpcmVzSWZFeGlzdHNcIicsICdcImFycmF5XCInLCAnXCInICsgU3RyaW5nKG1vZGlmaWVyLnJlcXVpcmVzSWZFeGlzdHMpICsgJ1wiJykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcIm9wdGlvbnNcIjpcbiAgICAgICAgICBjYXNlIFwiZGF0YVwiOlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1BvcHBlckpTOiBhbiBpbnZhbGlkIHByb3BlcnR5IGhhcyBiZWVuIHByb3ZpZGVkIHRvIHRoZSBcIicgKyBtb2RpZmllci5uYW1lICsgJ1wiIG1vZGlmaWVyLCB2YWxpZCBwcm9wZXJ0aWVzIGFyZSAnICsgVkFMSURfUFJPUEVSVElFUy5tYXAoZnVuY3Rpb24ocykge1xuICAgICAgICAgICAgICByZXR1cm4gJ1wiJyArIHMgKyAnXCInO1xuICAgICAgICAgICAgfSkuam9pbihcIiwgXCIpICsgJzsgYnV0IFwiJyArIGtleSArICdcIiB3YXMgcHJvdmlkZWQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgbW9kaWZpZXIucmVxdWlyZXMgJiYgbW9kaWZpZXIucmVxdWlyZXMuZm9yRWFjaChmdW5jdGlvbihyZXF1aXJlbWVudCkge1xuICAgICAgICAgIGlmIChtb2RpZmllcnMuZmluZChmdW5jdGlvbihtb2QpIHtcbiAgICAgICAgICAgIHJldHVybiBtb2QubmFtZSA9PT0gcmVxdWlyZW1lbnQ7XG4gICAgICAgICAgfSkgPT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihmb3JtYXQoTUlTU0lOR19ERVBFTkRFTkNZX0VSUk9SLCBTdHJpbmcobW9kaWZpZXIubmFtZSksIHJlcXVpcmVtZW50LCByZXF1aXJlbWVudCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiB1bmlxdWVCeShhcnIsIGZuKSB7XG4gICAgdmFyIGlkZW50aWZpZXJzID0gbmV3IFNldCgpO1xuICAgIHJldHVybiBhcnIuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHZhciBpZGVudGlmaWVyID0gZm4oaXRlbSk7XG4gICAgICBpZiAoIWlkZW50aWZpZXJzLmhhcyhpZGVudGlmaWVyKSkge1xuICAgICAgICBpZGVudGlmaWVycy5hZGQoaWRlbnRpZmllcik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGdldEJhc2VQbGFjZW1lbnQocGxhY2VtZW50KSB7XG4gICAgcmV0dXJuIHBsYWNlbWVudC5zcGxpdChcIi1cIilbMF07XG4gIH1cbiAgZnVuY3Rpb24gbWVyZ2VCeU5hbWUobW9kaWZpZXJzKSB7XG4gICAgdmFyIG1lcmdlZCA9IG1vZGlmaWVycy5yZWR1Y2UoZnVuY3Rpb24obWVyZ2VkMiwgY3VycmVudCkge1xuICAgICAgdmFyIGV4aXN0aW5nID0gbWVyZ2VkMltjdXJyZW50Lm5hbWVdO1xuICAgICAgbWVyZ2VkMltjdXJyZW50Lm5hbWVdID0gZXhpc3RpbmcgPyBPYmplY3QuYXNzaWduKHt9LCBleGlzdGluZywgY3VycmVudCwge1xuICAgICAgICBvcHRpb25zOiBPYmplY3QuYXNzaWduKHt9LCBleGlzdGluZy5vcHRpb25zLCBjdXJyZW50Lm9wdGlvbnMpLFxuICAgICAgICBkYXRhOiBPYmplY3QuYXNzaWduKHt9LCBleGlzdGluZy5kYXRhLCBjdXJyZW50LmRhdGEpXG4gICAgICB9KSA6IGN1cnJlbnQ7XG4gICAgICByZXR1cm4gbWVyZ2VkMjtcbiAgICB9LCB7fSk7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG1lcmdlZCkubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIG1lcmdlZFtrZXldO1xuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGdldFZpZXdwb3J0UmVjdChlbGVtZW50KSB7XG4gICAgdmFyIHdpbiA9IGdldFdpbmRvdyhlbGVtZW50KTtcbiAgICB2YXIgaHRtbCA9IGdldERvY3VtZW50RWxlbWVudChlbGVtZW50KTtcbiAgICB2YXIgdmlzdWFsVmlld3BvcnQgPSB3aW4udmlzdWFsVmlld3BvcnQ7XG4gICAgdmFyIHdpZHRoID0gaHRtbC5jbGllbnRXaWR0aDtcbiAgICB2YXIgaGVpZ2h0ID0gaHRtbC5jbGllbnRIZWlnaHQ7XG4gICAgdmFyIHggPSAwO1xuICAgIHZhciB5ID0gMDtcbiAgICBpZiAodmlzdWFsVmlld3BvcnQpIHtcbiAgICAgIHdpZHRoID0gdmlzdWFsVmlld3BvcnQud2lkdGg7XG4gICAgICBoZWlnaHQgPSB2aXN1YWxWaWV3cG9ydC5oZWlnaHQ7XG4gICAgICBpZiAoIS9eKCg/IWNocm9tZXxhbmRyb2lkKS4pKnNhZmFyaS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgeCA9IHZpc3VhbFZpZXdwb3J0Lm9mZnNldExlZnQ7XG4gICAgICAgIHkgPSB2aXN1YWxWaWV3cG9ydC5vZmZzZXRUb3A7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB3aWR0aCxcbiAgICAgIGhlaWdodCxcbiAgICAgIHg6IHggKyBnZXRXaW5kb3dTY3JvbGxCYXJYKGVsZW1lbnQpLFxuICAgICAgeVxuICAgIH07XG4gIH1cbiAgdmFyIG1heCA9IE1hdGgubWF4O1xuICB2YXIgbWluID0gTWF0aC5taW47XG4gIHZhciByb3VuZCA9IE1hdGgucm91bmQ7XG4gIGZ1bmN0aW9uIGdldERvY3VtZW50UmVjdChlbGVtZW50KSB7XG4gICAgdmFyIF9lbGVtZW50JG93bmVyRG9jdW1lbjtcbiAgICB2YXIgaHRtbCA9IGdldERvY3VtZW50RWxlbWVudChlbGVtZW50KTtcbiAgICB2YXIgd2luU2Nyb2xsID0gZ2V0V2luZG93U2Nyb2xsKGVsZW1lbnQpO1xuICAgIHZhciBib2R5ID0gKF9lbGVtZW50JG93bmVyRG9jdW1lbiA9IGVsZW1lbnQub3duZXJEb2N1bWVudCkgPT0gbnVsbCA/IHZvaWQgMCA6IF9lbGVtZW50JG93bmVyRG9jdW1lbi5ib2R5O1xuICAgIHZhciB3aWR0aCA9IG1heChodG1sLnNjcm9sbFdpZHRoLCBodG1sLmNsaWVudFdpZHRoLCBib2R5ID8gYm9keS5zY3JvbGxXaWR0aCA6IDAsIGJvZHkgPyBib2R5LmNsaWVudFdpZHRoIDogMCk7XG4gICAgdmFyIGhlaWdodCA9IG1heChodG1sLnNjcm9sbEhlaWdodCwgaHRtbC5jbGllbnRIZWlnaHQsIGJvZHkgPyBib2R5LnNjcm9sbEhlaWdodCA6IDAsIGJvZHkgPyBib2R5LmNsaWVudEhlaWdodCA6IDApO1xuICAgIHZhciB4ID0gLXdpblNjcm9sbC5zY3JvbGxMZWZ0ICsgZ2V0V2luZG93U2Nyb2xsQmFyWChlbGVtZW50KTtcbiAgICB2YXIgeSA9IC13aW5TY3JvbGwuc2Nyb2xsVG9wO1xuICAgIGlmIChnZXRDb21wdXRlZFN0eWxlKGJvZHkgfHwgaHRtbCkuZGlyZWN0aW9uID09PSBcInJ0bFwiKSB7XG4gICAgICB4ICs9IG1heChodG1sLmNsaWVudFdpZHRoLCBib2R5ID8gYm9keS5jbGllbnRXaWR0aCA6IDApIC0gd2lkdGg7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB3aWR0aCxcbiAgICAgIGhlaWdodCxcbiAgICAgIHgsXG4gICAgICB5XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBjb250YWlucyhwYXJlbnQsIGNoaWxkKSB7XG4gICAgdmFyIHJvb3ROb2RlID0gY2hpbGQuZ2V0Um9vdE5vZGUgJiYgY2hpbGQuZ2V0Um9vdE5vZGUoKTtcbiAgICBpZiAocGFyZW50LmNvbnRhaW5zKGNoaWxkKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIGlmIChyb290Tm9kZSAmJiBpc1NoYWRvd1Jvb3Qocm9vdE5vZGUpKSB7XG4gICAgICB2YXIgbmV4dCA9IGNoaWxkO1xuICAgICAgZG8ge1xuICAgICAgICBpZiAobmV4dCAmJiBwYXJlbnQuaXNTYW1lTm9kZShuZXh0KSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIG5leHQgPSBuZXh0LnBhcmVudE5vZGUgfHwgbmV4dC5ob3N0O1xuICAgICAgfSB3aGlsZSAobmV4dCk7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBmdW5jdGlvbiByZWN0VG9DbGllbnRSZWN0KHJlY3QpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgcmVjdCwge1xuICAgICAgbGVmdDogcmVjdC54LFxuICAgICAgdG9wOiByZWN0LnksXG4gICAgICByaWdodDogcmVjdC54ICsgcmVjdC53aWR0aCxcbiAgICAgIGJvdHRvbTogcmVjdC55ICsgcmVjdC5oZWlnaHRcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBnZXRJbm5lckJvdW5kaW5nQ2xpZW50UmVjdChlbGVtZW50KSB7XG4gICAgdmFyIHJlY3QgPSBnZXRCb3VuZGluZ0NsaWVudFJlY3QoZWxlbWVudCk7XG4gICAgcmVjdC50b3AgPSByZWN0LnRvcCArIGVsZW1lbnQuY2xpZW50VG9wO1xuICAgIHJlY3QubGVmdCA9IHJlY3QubGVmdCArIGVsZW1lbnQuY2xpZW50TGVmdDtcbiAgICByZWN0LmJvdHRvbSA9IHJlY3QudG9wICsgZWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgcmVjdC5yaWdodCA9IHJlY3QubGVmdCArIGVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgcmVjdC53aWR0aCA9IGVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgcmVjdC5oZWlnaHQgPSBlbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICByZWN0LnggPSByZWN0LmxlZnQ7XG4gICAgcmVjdC55ID0gcmVjdC50b3A7XG4gICAgcmV0dXJuIHJlY3Q7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0Q2xpZW50UmVjdEZyb21NaXhlZFR5cGUoZWxlbWVudCwgY2xpcHBpbmdQYXJlbnQpIHtcbiAgICByZXR1cm4gY2xpcHBpbmdQYXJlbnQgPT09IHZpZXdwb3J0ID8gcmVjdFRvQ2xpZW50UmVjdChnZXRWaWV3cG9ydFJlY3QoZWxlbWVudCkpIDogaXNIVE1MRWxlbWVudChjbGlwcGluZ1BhcmVudCkgPyBnZXRJbm5lckJvdW5kaW5nQ2xpZW50UmVjdChjbGlwcGluZ1BhcmVudCkgOiByZWN0VG9DbGllbnRSZWN0KGdldERvY3VtZW50UmVjdChnZXREb2N1bWVudEVsZW1lbnQoZWxlbWVudCkpKTtcbiAgfVxuICBmdW5jdGlvbiBnZXRDbGlwcGluZ1BhcmVudHMoZWxlbWVudCkge1xuICAgIHZhciBjbGlwcGluZ1BhcmVudHMyID0gbGlzdFNjcm9sbFBhcmVudHMoZ2V0UGFyZW50Tm9kZShlbGVtZW50KSk7XG4gICAgdmFyIGNhbkVzY2FwZUNsaXBwaW5nID0gW1wiYWJzb2x1dGVcIiwgXCJmaXhlZFwiXS5pbmRleE9mKGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkucG9zaXRpb24pID49IDA7XG4gICAgdmFyIGNsaXBwZXJFbGVtZW50ID0gY2FuRXNjYXBlQ2xpcHBpbmcgJiYgaXNIVE1MRWxlbWVudChlbGVtZW50KSA/IGdldE9mZnNldFBhcmVudChlbGVtZW50KSA6IGVsZW1lbnQ7XG4gICAgaWYgKCFpc0VsZW1lbnQoY2xpcHBlckVsZW1lbnQpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHJldHVybiBjbGlwcGluZ1BhcmVudHMyLmZpbHRlcihmdW5jdGlvbihjbGlwcGluZ1BhcmVudCkge1xuICAgICAgcmV0dXJuIGlzRWxlbWVudChjbGlwcGluZ1BhcmVudCkgJiYgY29udGFpbnMoY2xpcHBpbmdQYXJlbnQsIGNsaXBwZXJFbGVtZW50KSAmJiBnZXROb2RlTmFtZShjbGlwcGluZ1BhcmVudCkgIT09IFwiYm9keVwiO1xuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGdldENsaXBwaW5nUmVjdChlbGVtZW50LCBib3VuZGFyeSwgcm9vdEJvdW5kYXJ5KSB7XG4gICAgdmFyIG1haW5DbGlwcGluZ1BhcmVudHMgPSBib3VuZGFyeSA9PT0gXCJjbGlwcGluZ1BhcmVudHNcIiA/IGdldENsaXBwaW5nUGFyZW50cyhlbGVtZW50KSA6IFtdLmNvbmNhdChib3VuZGFyeSk7XG4gICAgdmFyIGNsaXBwaW5nUGFyZW50czIgPSBbXS5jb25jYXQobWFpbkNsaXBwaW5nUGFyZW50cywgW3Jvb3RCb3VuZGFyeV0pO1xuICAgIHZhciBmaXJzdENsaXBwaW5nUGFyZW50ID0gY2xpcHBpbmdQYXJlbnRzMlswXTtcbiAgICB2YXIgY2xpcHBpbmdSZWN0ID0gY2xpcHBpbmdQYXJlbnRzMi5yZWR1Y2UoZnVuY3Rpb24oYWNjUmVjdCwgY2xpcHBpbmdQYXJlbnQpIHtcbiAgICAgIHZhciByZWN0ID0gZ2V0Q2xpZW50UmVjdEZyb21NaXhlZFR5cGUoZWxlbWVudCwgY2xpcHBpbmdQYXJlbnQpO1xuICAgICAgYWNjUmVjdC50b3AgPSBtYXgocmVjdC50b3AsIGFjY1JlY3QudG9wKTtcbiAgICAgIGFjY1JlY3QucmlnaHQgPSBtaW4ocmVjdC5yaWdodCwgYWNjUmVjdC5yaWdodCk7XG4gICAgICBhY2NSZWN0LmJvdHRvbSA9IG1pbihyZWN0LmJvdHRvbSwgYWNjUmVjdC5ib3R0b20pO1xuICAgICAgYWNjUmVjdC5sZWZ0ID0gbWF4KHJlY3QubGVmdCwgYWNjUmVjdC5sZWZ0KTtcbiAgICAgIHJldHVybiBhY2NSZWN0O1xuICAgIH0sIGdldENsaWVudFJlY3RGcm9tTWl4ZWRUeXBlKGVsZW1lbnQsIGZpcnN0Q2xpcHBpbmdQYXJlbnQpKTtcbiAgICBjbGlwcGluZ1JlY3Qud2lkdGggPSBjbGlwcGluZ1JlY3QucmlnaHQgLSBjbGlwcGluZ1JlY3QubGVmdDtcbiAgICBjbGlwcGluZ1JlY3QuaGVpZ2h0ID0gY2xpcHBpbmdSZWN0LmJvdHRvbSAtIGNsaXBwaW5nUmVjdC50b3A7XG4gICAgY2xpcHBpbmdSZWN0LnggPSBjbGlwcGluZ1JlY3QubGVmdDtcbiAgICBjbGlwcGluZ1JlY3QueSA9IGNsaXBwaW5nUmVjdC50b3A7XG4gICAgcmV0dXJuIGNsaXBwaW5nUmVjdDtcbiAgfVxuICBmdW5jdGlvbiBnZXRWYXJpYXRpb24ocGxhY2VtZW50KSB7XG4gICAgcmV0dXJuIHBsYWNlbWVudC5zcGxpdChcIi1cIilbMV07XG4gIH1cbiAgZnVuY3Rpb24gZ2V0TWFpbkF4aXNGcm9tUGxhY2VtZW50KHBsYWNlbWVudCkge1xuICAgIHJldHVybiBbXCJ0b3BcIiwgXCJib3R0b21cIl0uaW5kZXhPZihwbGFjZW1lbnQpID49IDAgPyBcInhcIiA6IFwieVwiO1xuICB9XG4gIGZ1bmN0aW9uIGNvbXB1dGVPZmZzZXRzKF9yZWYpIHtcbiAgICB2YXIgcmVmZXJlbmNlMiA9IF9yZWYucmVmZXJlbmNlLCBlbGVtZW50ID0gX3JlZi5lbGVtZW50LCBwbGFjZW1lbnQgPSBfcmVmLnBsYWNlbWVudDtcbiAgICB2YXIgYmFzZVBsYWNlbWVudCA9IHBsYWNlbWVudCA/IGdldEJhc2VQbGFjZW1lbnQocGxhY2VtZW50KSA6IG51bGw7XG4gICAgdmFyIHZhcmlhdGlvbiA9IHBsYWNlbWVudCA/IGdldFZhcmlhdGlvbihwbGFjZW1lbnQpIDogbnVsbDtcbiAgICB2YXIgY29tbW9uWCA9IHJlZmVyZW5jZTIueCArIHJlZmVyZW5jZTIud2lkdGggLyAyIC0gZWxlbWVudC53aWR0aCAvIDI7XG4gICAgdmFyIGNvbW1vblkgPSByZWZlcmVuY2UyLnkgKyByZWZlcmVuY2UyLmhlaWdodCAvIDIgLSBlbGVtZW50LmhlaWdodCAvIDI7XG4gICAgdmFyIG9mZnNldHM7XG4gICAgc3dpdGNoIChiYXNlUGxhY2VtZW50KSB7XG4gICAgICBjYXNlIHRvcDpcbiAgICAgICAgb2Zmc2V0cyA9IHtcbiAgICAgICAgICB4OiBjb21tb25YLFxuICAgICAgICAgIHk6IHJlZmVyZW5jZTIueSAtIGVsZW1lbnQuaGVpZ2h0XG4gICAgICAgIH07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBib3R0b206XG4gICAgICAgIG9mZnNldHMgPSB7XG4gICAgICAgICAgeDogY29tbW9uWCxcbiAgICAgICAgICB5OiByZWZlcmVuY2UyLnkgKyByZWZlcmVuY2UyLmhlaWdodFxuICAgICAgICB9O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgcmlnaHQ6XG4gICAgICAgIG9mZnNldHMgPSB7XG4gICAgICAgICAgeDogcmVmZXJlbmNlMi54ICsgcmVmZXJlbmNlMi53aWR0aCxcbiAgICAgICAgICB5OiBjb21tb25ZXG4gICAgICAgIH07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBsZWZ0OlxuICAgICAgICBvZmZzZXRzID0ge1xuICAgICAgICAgIHg6IHJlZmVyZW5jZTIueCAtIGVsZW1lbnQud2lkdGgsXG4gICAgICAgICAgeTogY29tbW9uWVxuICAgICAgICB9O1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIG9mZnNldHMgPSB7XG4gICAgICAgICAgeDogcmVmZXJlbmNlMi54LFxuICAgICAgICAgIHk6IHJlZmVyZW5jZTIueVxuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgbWFpbkF4aXMgPSBiYXNlUGxhY2VtZW50ID8gZ2V0TWFpbkF4aXNGcm9tUGxhY2VtZW50KGJhc2VQbGFjZW1lbnQpIDogbnVsbDtcbiAgICBpZiAobWFpbkF4aXMgIT0gbnVsbCkge1xuICAgICAgdmFyIGxlbiA9IG1haW5BeGlzID09PSBcInlcIiA/IFwiaGVpZ2h0XCIgOiBcIndpZHRoXCI7XG4gICAgICBzd2l0Y2ggKHZhcmlhdGlvbikge1xuICAgICAgICBjYXNlIHN0YXJ0OlxuICAgICAgICAgIG9mZnNldHNbbWFpbkF4aXNdID0gb2Zmc2V0c1ttYWluQXhpc10gLSAocmVmZXJlbmNlMltsZW5dIC8gMiAtIGVsZW1lbnRbbGVuXSAvIDIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIGVuZDpcbiAgICAgICAgICBvZmZzZXRzW21haW5BeGlzXSA9IG9mZnNldHNbbWFpbkF4aXNdICsgKHJlZmVyZW5jZTJbbGVuXSAvIDIgLSBlbGVtZW50W2xlbl0gLyAyKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9mZnNldHM7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0RnJlc2hTaWRlT2JqZWN0KCkge1xuICAgIHJldHVybiB7XG4gICAgICB0b3A6IDAsXG4gICAgICByaWdodDogMCxcbiAgICAgIGJvdHRvbTogMCxcbiAgICAgIGxlZnQ6IDBcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIG1lcmdlUGFkZGluZ09iamVjdChwYWRkaW5nT2JqZWN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIGdldEZyZXNoU2lkZU9iamVjdCgpLCBwYWRkaW5nT2JqZWN0KTtcbiAgfVxuICBmdW5jdGlvbiBleHBhbmRUb0hhc2hNYXAodmFsdWUsIGtleXMpIHtcbiAgICByZXR1cm4ga2V5cy5yZWR1Y2UoZnVuY3Rpb24oaGFzaE1hcCwga2V5KSB7XG4gICAgICBoYXNoTWFwW2tleV0gPSB2YWx1ZTtcbiAgICAgIHJldHVybiBoYXNoTWFwO1xuICAgIH0sIHt9KTtcbiAgfVxuICBmdW5jdGlvbiBkZXRlY3RPdmVyZmxvdyhzdGF0ZSwgb3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG4gICAgdmFyIF9vcHRpb25zID0gb3B0aW9ucywgX29wdGlvbnMkcGxhY2VtZW50ID0gX29wdGlvbnMucGxhY2VtZW50LCBwbGFjZW1lbnQgPSBfb3B0aW9ucyRwbGFjZW1lbnQgPT09IHZvaWQgMCA/IHN0YXRlLnBsYWNlbWVudCA6IF9vcHRpb25zJHBsYWNlbWVudCwgX29wdGlvbnMkYm91bmRhcnkgPSBfb3B0aW9ucy5ib3VuZGFyeSwgYm91bmRhcnkgPSBfb3B0aW9ucyRib3VuZGFyeSA9PT0gdm9pZCAwID8gY2xpcHBpbmdQYXJlbnRzIDogX29wdGlvbnMkYm91bmRhcnksIF9vcHRpb25zJHJvb3RCb3VuZGFyeSA9IF9vcHRpb25zLnJvb3RCb3VuZGFyeSwgcm9vdEJvdW5kYXJ5ID0gX29wdGlvbnMkcm9vdEJvdW5kYXJ5ID09PSB2b2lkIDAgPyB2aWV3cG9ydCA6IF9vcHRpb25zJHJvb3RCb3VuZGFyeSwgX29wdGlvbnMkZWxlbWVudENvbnRlID0gX29wdGlvbnMuZWxlbWVudENvbnRleHQsIGVsZW1lbnRDb250ZXh0ID0gX29wdGlvbnMkZWxlbWVudENvbnRlID09PSB2b2lkIDAgPyBwb3BwZXIgOiBfb3B0aW9ucyRlbGVtZW50Q29udGUsIF9vcHRpb25zJGFsdEJvdW5kYXJ5ID0gX29wdGlvbnMuYWx0Qm91bmRhcnksIGFsdEJvdW5kYXJ5ID0gX29wdGlvbnMkYWx0Qm91bmRhcnkgPT09IHZvaWQgMCA/IGZhbHNlIDogX29wdGlvbnMkYWx0Qm91bmRhcnksIF9vcHRpb25zJHBhZGRpbmcgPSBfb3B0aW9ucy5wYWRkaW5nLCBwYWRkaW5nID0gX29wdGlvbnMkcGFkZGluZyA9PT0gdm9pZCAwID8gMCA6IF9vcHRpb25zJHBhZGRpbmc7XG4gICAgdmFyIHBhZGRpbmdPYmplY3QgPSBtZXJnZVBhZGRpbmdPYmplY3QodHlwZW9mIHBhZGRpbmcgIT09IFwibnVtYmVyXCIgPyBwYWRkaW5nIDogZXhwYW5kVG9IYXNoTWFwKHBhZGRpbmcsIGJhc2VQbGFjZW1lbnRzKSk7XG4gICAgdmFyIGFsdENvbnRleHQgPSBlbGVtZW50Q29udGV4dCA9PT0gcG9wcGVyID8gcmVmZXJlbmNlIDogcG9wcGVyO1xuICAgIHZhciByZWZlcmVuY2VFbGVtZW50ID0gc3RhdGUuZWxlbWVudHMucmVmZXJlbmNlO1xuICAgIHZhciBwb3BwZXJSZWN0ID0gc3RhdGUucmVjdHMucG9wcGVyO1xuICAgIHZhciBlbGVtZW50ID0gc3RhdGUuZWxlbWVudHNbYWx0Qm91bmRhcnkgPyBhbHRDb250ZXh0IDogZWxlbWVudENvbnRleHRdO1xuICAgIHZhciBjbGlwcGluZ0NsaWVudFJlY3QgPSBnZXRDbGlwcGluZ1JlY3QoaXNFbGVtZW50KGVsZW1lbnQpID8gZWxlbWVudCA6IGVsZW1lbnQuY29udGV4dEVsZW1lbnQgfHwgZ2V0RG9jdW1lbnRFbGVtZW50KHN0YXRlLmVsZW1lbnRzLnBvcHBlciksIGJvdW5kYXJ5LCByb290Qm91bmRhcnkpO1xuICAgIHZhciByZWZlcmVuY2VDbGllbnRSZWN0ID0gZ2V0Qm91bmRpbmdDbGllbnRSZWN0KHJlZmVyZW5jZUVsZW1lbnQpO1xuICAgIHZhciBwb3BwZXJPZmZzZXRzMiA9IGNvbXB1dGVPZmZzZXRzKHtcbiAgICAgIHJlZmVyZW5jZTogcmVmZXJlbmNlQ2xpZW50UmVjdCxcbiAgICAgIGVsZW1lbnQ6IHBvcHBlclJlY3QsXG4gICAgICBzdHJhdGVneTogXCJhYnNvbHV0ZVwiLFxuICAgICAgcGxhY2VtZW50XG4gICAgfSk7XG4gICAgdmFyIHBvcHBlckNsaWVudFJlY3QgPSByZWN0VG9DbGllbnRSZWN0KE9iamVjdC5hc3NpZ24oe30sIHBvcHBlclJlY3QsIHBvcHBlck9mZnNldHMyKSk7XG4gICAgdmFyIGVsZW1lbnRDbGllbnRSZWN0ID0gZWxlbWVudENvbnRleHQgPT09IHBvcHBlciA/IHBvcHBlckNsaWVudFJlY3QgOiByZWZlcmVuY2VDbGllbnRSZWN0O1xuICAgIHZhciBvdmVyZmxvd09mZnNldHMgPSB7XG4gICAgICB0b3A6IGNsaXBwaW5nQ2xpZW50UmVjdC50b3AgLSBlbGVtZW50Q2xpZW50UmVjdC50b3AgKyBwYWRkaW5nT2JqZWN0LnRvcCxcbiAgICAgIGJvdHRvbTogZWxlbWVudENsaWVudFJlY3QuYm90dG9tIC0gY2xpcHBpbmdDbGllbnRSZWN0LmJvdHRvbSArIHBhZGRpbmdPYmplY3QuYm90dG9tLFxuICAgICAgbGVmdDogY2xpcHBpbmdDbGllbnRSZWN0LmxlZnQgLSBlbGVtZW50Q2xpZW50UmVjdC5sZWZ0ICsgcGFkZGluZ09iamVjdC5sZWZ0LFxuICAgICAgcmlnaHQ6IGVsZW1lbnRDbGllbnRSZWN0LnJpZ2h0IC0gY2xpcHBpbmdDbGllbnRSZWN0LnJpZ2h0ICsgcGFkZGluZ09iamVjdC5yaWdodFxuICAgIH07XG4gICAgdmFyIG9mZnNldERhdGEgPSBzdGF0ZS5tb2RpZmllcnNEYXRhLm9mZnNldDtcbiAgICBpZiAoZWxlbWVudENvbnRleHQgPT09IHBvcHBlciAmJiBvZmZzZXREYXRhKSB7XG4gICAgICB2YXIgb2Zmc2V0MiA9IG9mZnNldERhdGFbcGxhY2VtZW50XTtcbiAgICAgIE9iamVjdC5rZXlzKG92ZXJmbG93T2Zmc2V0cykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgdmFyIG11bHRpcGx5ID0gW3JpZ2h0LCBib3R0b21dLmluZGV4T2Yoa2V5KSA+PSAwID8gMSA6IC0xO1xuICAgICAgICB2YXIgYXhpcyA9IFt0b3AsIGJvdHRvbV0uaW5kZXhPZihrZXkpID49IDAgPyBcInlcIiA6IFwieFwiO1xuICAgICAgICBvdmVyZmxvd09mZnNldHNba2V5XSArPSBvZmZzZXQyW2F4aXNdICogbXVsdGlwbHk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG92ZXJmbG93T2Zmc2V0cztcbiAgfVxuICB2YXIgSU5WQUxJRF9FTEVNRU5UX0VSUk9SID0gXCJQb3BwZXI6IEludmFsaWQgcmVmZXJlbmNlIG9yIHBvcHBlciBhcmd1bWVudCBwcm92aWRlZC4gVGhleSBtdXN0IGJlIGVpdGhlciBhIERPTSBlbGVtZW50IG9yIHZpcnR1YWwgZWxlbWVudC5cIjtcbiAgdmFyIElORklOSVRFX0xPT1BfRVJST1IgPSBcIlBvcHBlcjogQW4gaW5maW5pdGUgbG9vcCBpbiB0aGUgbW9kaWZpZXJzIGN5Y2xlIGhhcyBiZWVuIGRldGVjdGVkISBUaGUgY3ljbGUgaGFzIGJlZW4gaW50ZXJydXB0ZWQgdG8gcHJldmVudCBhIGJyb3dzZXIgY3Jhc2guXCI7XG4gIHZhciBERUZBVUxUX09QVElPTlMgPSB7XG4gICAgcGxhY2VtZW50OiBcImJvdHRvbVwiLFxuICAgIG1vZGlmaWVyczogW10sXG4gICAgc3RyYXRlZ3k6IFwiYWJzb2x1dGVcIlxuICB9O1xuICBmdW5jdGlvbiBhcmVWYWxpZEVsZW1lbnRzKCkge1xuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gbmV3IEFycmF5KF9sZW4pLCBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgYXJnc1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICB9XG4gICAgcmV0dXJuICFhcmdzLnNvbWUoZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgcmV0dXJuICEoZWxlbWVudCAmJiB0eXBlb2YgZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QgPT09IFwiZnVuY3Rpb25cIik7XG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gcG9wcGVyR2VuZXJhdG9yKGdlbmVyYXRvck9wdGlvbnMpIHtcbiAgICBpZiAoZ2VuZXJhdG9yT3B0aW9ucyA9PT0gdm9pZCAwKSB7XG4gICAgICBnZW5lcmF0b3JPcHRpb25zID0ge307XG4gICAgfVxuICAgIHZhciBfZ2VuZXJhdG9yT3B0aW9ucyA9IGdlbmVyYXRvck9wdGlvbnMsIF9nZW5lcmF0b3JPcHRpb25zJGRlZiA9IF9nZW5lcmF0b3JPcHRpb25zLmRlZmF1bHRNb2RpZmllcnMsIGRlZmF1bHRNb2RpZmllcnMyID0gX2dlbmVyYXRvck9wdGlvbnMkZGVmID09PSB2b2lkIDAgPyBbXSA6IF9nZW5lcmF0b3JPcHRpb25zJGRlZiwgX2dlbmVyYXRvck9wdGlvbnMkZGVmMiA9IF9nZW5lcmF0b3JPcHRpb25zLmRlZmF1bHRPcHRpb25zLCBkZWZhdWx0T3B0aW9ucyA9IF9nZW5lcmF0b3JPcHRpb25zJGRlZjIgPT09IHZvaWQgMCA/IERFRkFVTFRfT1BUSU9OUyA6IF9nZW5lcmF0b3JPcHRpb25zJGRlZjI7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGNyZWF0ZVBvcHBlcjIocmVmZXJlbmNlMiwgcG9wcGVyMiwgb3B0aW9ucykge1xuICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkge1xuICAgICAgICBvcHRpb25zID0gZGVmYXVsdE9wdGlvbnM7XG4gICAgICB9XG4gICAgICB2YXIgc3RhdGUgPSB7XG4gICAgICAgIHBsYWNlbWVudDogXCJib3R0b21cIixcbiAgICAgICAgb3JkZXJlZE1vZGlmaWVyczogW10sXG4gICAgICAgIG9wdGlvbnM6IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfT1BUSU9OUywgZGVmYXVsdE9wdGlvbnMpLFxuICAgICAgICBtb2RpZmllcnNEYXRhOiB7fSxcbiAgICAgICAgZWxlbWVudHM6IHtcbiAgICAgICAgICByZWZlcmVuY2U6IHJlZmVyZW5jZTIsXG4gICAgICAgICAgcG9wcGVyOiBwb3BwZXIyXG4gICAgICAgIH0sXG4gICAgICAgIGF0dHJpYnV0ZXM6IHt9LFxuICAgICAgICBzdHlsZXM6IHt9XG4gICAgICB9O1xuICAgICAgdmFyIGVmZmVjdENsZWFudXBGbnMgPSBbXTtcbiAgICAgIHZhciBpc0Rlc3Ryb3llZCA9IGZhbHNlO1xuICAgICAgdmFyIGluc3RhbmNlID0ge1xuICAgICAgICBzdGF0ZSxcbiAgICAgICAgc2V0T3B0aW9uczogZnVuY3Rpb24gc2V0T3B0aW9ucyhvcHRpb25zMikge1xuICAgICAgICAgIGNsZWFudXBNb2RpZmllckVmZmVjdHMoKTtcbiAgICAgICAgICBzdGF0ZS5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIHN0YXRlLm9wdGlvbnMsIG9wdGlvbnMyKTtcbiAgICAgICAgICBzdGF0ZS5zY3JvbGxQYXJlbnRzID0ge1xuICAgICAgICAgICAgcmVmZXJlbmNlOiBpc0VsZW1lbnQocmVmZXJlbmNlMikgPyBsaXN0U2Nyb2xsUGFyZW50cyhyZWZlcmVuY2UyKSA6IHJlZmVyZW5jZTIuY29udGV4dEVsZW1lbnQgPyBsaXN0U2Nyb2xsUGFyZW50cyhyZWZlcmVuY2UyLmNvbnRleHRFbGVtZW50KSA6IFtdLFxuICAgICAgICAgICAgcG9wcGVyOiBsaXN0U2Nyb2xsUGFyZW50cyhwb3BwZXIyKVxuICAgICAgICAgIH07XG4gICAgICAgICAgdmFyIG9yZGVyZWRNb2RpZmllcnMgPSBvcmRlck1vZGlmaWVycyhtZXJnZUJ5TmFtZShbXS5jb25jYXQoZGVmYXVsdE1vZGlmaWVyczIsIHN0YXRlLm9wdGlvbnMubW9kaWZpZXJzKSkpO1xuICAgICAgICAgIHN0YXRlLm9yZGVyZWRNb2RpZmllcnMgPSBvcmRlcmVkTW9kaWZpZXJzLmZpbHRlcihmdW5jdGlvbihtKSB7XG4gICAgICAgICAgICByZXR1cm4gbS5lbmFibGVkO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGlmICh0cnVlKSB7XG4gICAgICAgICAgICB2YXIgbW9kaWZpZXJzID0gdW5pcXVlQnkoW10uY29uY2F0KG9yZGVyZWRNb2RpZmllcnMsIHN0YXRlLm9wdGlvbnMubW9kaWZpZXJzKSwgZnVuY3Rpb24oX3JlZikge1xuICAgICAgICAgICAgICB2YXIgbmFtZSA9IF9yZWYubmFtZTtcbiAgICAgICAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhbGlkYXRlTW9kaWZpZXJzKG1vZGlmaWVycyk7XG4gICAgICAgICAgICBpZiAoZ2V0QmFzZVBsYWNlbWVudChzdGF0ZS5vcHRpb25zLnBsYWNlbWVudCkgPT09IGF1dG8pIHtcbiAgICAgICAgICAgICAgdmFyIGZsaXBNb2RpZmllciA9IHN0YXRlLm9yZGVyZWRNb2RpZmllcnMuZmluZChmdW5jdGlvbihfcmVmMikge1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gX3JlZjIubmFtZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmFtZSA9PT0gXCJmbGlwXCI7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICBpZiAoIWZsaXBNb2RpZmllcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoWydQb3BwZXI6IFwiYXV0b1wiIHBsYWNlbWVudHMgcmVxdWlyZSB0aGUgXCJmbGlwXCIgbW9kaWZpZXIgYmUnLCBcInByZXNlbnQgYW5kIGVuYWJsZWQgdG8gd29yay5cIl0uam9pbihcIiBcIikpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgX2dldENvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHBvcHBlcjIpLCBtYXJnaW5Ub3AgPSBfZ2V0Q29tcHV0ZWRTdHlsZS5tYXJnaW5Ub3AsIG1hcmdpblJpZ2h0ID0gX2dldENvbXB1dGVkU3R5bGUubWFyZ2luUmlnaHQsIG1hcmdpbkJvdHRvbSA9IF9nZXRDb21wdXRlZFN0eWxlLm1hcmdpbkJvdHRvbSwgbWFyZ2luTGVmdCA9IF9nZXRDb21wdXRlZFN0eWxlLm1hcmdpbkxlZnQ7XG4gICAgICAgICAgICBpZiAoW21hcmdpblRvcCwgbWFyZ2luUmlnaHQsIG1hcmdpbkJvdHRvbSwgbWFyZ2luTGVmdF0uc29tZShmdW5jdGlvbihtYXJnaW4pIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQobWFyZ2luKTtcbiAgICAgICAgICAgIH0pKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUud2FybihbJ1BvcHBlcjogQ1NTIFwibWFyZ2luXCIgc3R5bGVzIGNhbm5vdCBiZSB1c2VkIHRvIGFwcGx5IHBhZGRpbmcnLCBcImJldHdlZW4gdGhlIHBvcHBlciBhbmQgaXRzIHJlZmVyZW5jZSBlbGVtZW50IG9yIGJvdW5kYXJ5LlwiLCBcIlRvIHJlcGxpY2F0ZSBtYXJnaW4sIHVzZSB0aGUgYG9mZnNldGAgbW9kaWZpZXIsIGFzIHdlbGwgYXNcIiwgXCJ0aGUgYHBhZGRpbmdgIG9wdGlvbiBpbiB0aGUgYHByZXZlbnRPdmVyZmxvd2AgYW5kIGBmbGlwYFwiLCBcIm1vZGlmaWVycy5cIl0uam9pbihcIiBcIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBydW5Nb2RpZmllckVmZmVjdHMoKTtcbiAgICAgICAgICByZXR1cm4gaW5zdGFuY2UudXBkYXRlKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZvcmNlVXBkYXRlOiBmdW5jdGlvbiBmb3JjZVVwZGF0ZSgpIHtcbiAgICAgICAgICBpZiAoaXNEZXN0cm95ZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIF9zdGF0ZSRlbGVtZW50cyA9IHN0YXRlLmVsZW1lbnRzLCByZWZlcmVuY2UzID0gX3N0YXRlJGVsZW1lbnRzLnJlZmVyZW5jZSwgcG9wcGVyMyA9IF9zdGF0ZSRlbGVtZW50cy5wb3BwZXI7XG4gICAgICAgICAgaWYgKCFhcmVWYWxpZEVsZW1lbnRzKHJlZmVyZW5jZTMsIHBvcHBlcjMpKSB7XG4gICAgICAgICAgICBpZiAodHJ1ZSkge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKElOVkFMSURfRUxFTUVOVF9FUlJPUik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0YXRlLnJlY3RzID0ge1xuICAgICAgICAgICAgcmVmZXJlbmNlOiBnZXRDb21wb3NpdGVSZWN0KHJlZmVyZW5jZTMsIGdldE9mZnNldFBhcmVudChwb3BwZXIzKSwgc3RhdGUub3B0aW9ucy5zdHJhdGVneSA9PT0gXCJmaXhlZFwiKSxcbiAgICAgICAgICAgIHBvcHBlcjogZ2V0TGF5b3V0UmVjdChwb3BwZXIzKVxuICAgICAgICAgIH07XG4gICAgICAgICAgc3RhdGUucmVzZXQgPSBmYWxzZTtcbiAgICAgICAgICBzdGF0ZS5wbGFjZW1lbnQgPSBzdGF0ZS5vcHRpb25zLnBsYWNlbWVudDtcbiAgICAgICAgICBzdGF0ZS5vcmRlcmVkTW9kaWZpZXJzLmZvckVhY2goZnVuY3Rpb24obW9kaWZpZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZS5tb2RpZmllcnNEYXRhW21vZGlmaWVyLm5hbWVdID0gT2JqZWN0LmFzc2lnbih7fSwgbW9kaWZpZXIuZGF0YSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdmFyIF9fZGVidWdfbG9vcHNfXyA9IDA7XG4gICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwOyBpbmRleCA8IHN0YXRlLm9yZGVyZWRNb2RpZmllcnMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICBpZiAodHJ1ZSkge1xuICAgICAgICAgICAgICBfX2RlYnVnX2xvb3BzX18gKz0gMTtcbiAgICAgICAgICAgICAgaWYgKF9fZGVidWdfbG9vcHNfXyA+IDEwMCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoSU5GSU5JVEVfTE9PUF9FUlJPUik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzdGF0ZS5yZXNldCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICBzdGF0ZS5yZXNldCA9IGZhbHNlO1xuICAgICAgICAgICAgICBpbmRleCA9IC0xO1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBfc3RhdGUkb3JkZXJlZE1vZGlmaWUgPSBzdGF0ZS5vcmRlcmVkTW9kaWZpZXJzW2luZGV4XSwgZm4gPSBfc3RhdGUkb3JkZXJlZE1vZGlmaWUuZm4sIF9zdGF0ZSRvcmRlcmVkTW9kaWZpZTIgPSBfc3RhdGUkb3JkZXJlZE1vZGlmaWUub3B0aW9ucywgX29wdGlvbnMgPSBfc3RhdGUkb3JkZXJlZE1vZGlmaWUyID09PSB2b2lkIDAgPyB7fSA6IF9zdGF0ZSRvcmRlcmVkTW9kaWZpZTIsIG5hbWUgPSBfc3RhdGUkb3JkZXJlZE1vZGlmaWUubmFtZTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZm4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICBzdGF0ZSA9IGZuKHtcbiAgICAgICAgICAgICAgICBzdGF0ZSxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBfb3B0aW9ucyxcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGluc3RhbmNlXG4gICAgICAgICAgICAgIH0pIHx8IHN0YXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdXBkYXRlOiBkZWJvdW5jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgICAgICAgaW5zdGFuY2UuZm9yY2VVcGRhdGUoKTtcbiAgICAgICAgICAgIHJlc29sdmUoc3RhdGUpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KSxcbiAgICAgICAgZGVzdHJveTogZnVuY3Rpb24gZGVzdHJveSgpIHtcbiAgICAgICAgICBjbGVhbnVwTW9kaWZpZXJFZmZlY3RzKCk7XG4gICAgICAgICAgaXNEZXN0cm95ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgaWYgKCFhcmVWYWxpZEVsZW1lbnRzKHJlZmVyZW5jZTIsIHBvcHBlcjIpKSB7XG4gICAgICAgIGlmICh0cnVlKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihJTlZBTElEX0VMRU1FTlRfRVJST1IpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICAgIH1cbiAgICAgIGluc3RhbmNlLnNldE9wdGlvbnMob3B0aW9ucykudGhlbihmdW5jdGlvbihzdGF0ZTIpIHtcbiAgICAgICAgaWYgKCFpc0Rlc3Ryb3llZCAmJiBvcHRpb25zLm9uRmlyc3RVcGRhdGUpIHtcbiAgICAgICAgICBvcHRpb25zLm9uRmlyc3RVcGRhdGUoc3RhdGUyKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBmdW5jdGlvbiBydW5Nb2RpZmllckVmZmVjdHMoKSB7XG4gICAgICAgIHN0YXRlLm9yZGVyZWRNb2RpZmllcnMuZm9yRWFjaChmdW5jdGlvbihfcmVmMykge1xuICAgICAgICAgIHZhciBuYW1lID0gX3JlZjMubmFtZSwgX3JlZjMkb3B0aW9ucyA9IF9yZWYzLm9wdGlvbnMsIG9wdGlvbnMyID0gX3JlZjMkb3B0aW9ucyA9PT0gdm9pZCAwID8ge30gOiBfcmVmMyRvcHRpb25zLCBlZmZlY3QyID0gX3JlZjMuZWZmZWN0O1xuICAgICAgICAgIGlmICh0eXBlb2YgZWZmZWN0MiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB2YXIgY2xlYW51cEZuID0gZWZmZWN0Mih7XG4gICAgICAgICAgICAgIHN0YXRlLFxuICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgICAgICAgb3B0aW9uczogb3B0aW9uczJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdmFyIG5vb3BGbiA9IGZ1bmN0aW9uIG5vb3BGbjIoKSB7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgZWZmZWN0Q2xlYW51cEZucy5wdXNoKGNsZWFudXBGbiB8fCBub29wRm4pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBjbGVhbnVwTW9kaWZpZXJFZmZlY3RzKCkge1xuICAgICAgICBlZmZlY3RDbGVhbnVwRm5zLmZvckVhY2goZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgICByZXR1cm4gZm4oKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGVmZmVjdENsZWFudXBGbnMgPSBbXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9O1xuICB9XG4gIHZhciBwYXNzaXZlID0ge1xuICAgIHBhc3NpdmU6IHRydWVcbiAgfTtcbiAgZnVuY3Rpb24gZWZmZWN0JDIoX3JlZikge1xuICAgIHZhciBzdGF0ZSA9IF9yZWYuc3RhdGUsIGluc3RhbmNlID0gX3JlZi5pbnN0YW5jZSwgb3B0aW9ucyA9IF9yZWYub3B0aW9ucztcbiAgICB2YXIgX29wdGlvbnMkc2Nyb2xsID0gb3B0aW9ucy5zY3JvbGwsIHNjcm9sbCA9IF9vcHRpb25zJHNjcm9sbCA9PT0gdm9pZCAwID8gdHJ1ZSA6IF9vcHRpb25zJHNjcm9sbCwgX29wdGlvbnMkcmVzaXplID0gb3B0aW9ucy5yZXNpemUsIHJlc2l6ZSA9IF9vcHRpb25zJHJlc2l6ZSA9PT0gdm9pZCAwID8gdHJ1ZSA6IF9vcHRpb25zJHJlc2l6ZTtcbiAgICB2YXIgd2luZG93MiA9IGdldFdpbmRvdyhzdGF0ZS5lbGVtZW50cy5wb3BwZXIpO1xuICAgIHZhciBzY3JvbGxQYXJlbnRzID0gW10uY29uY2F0KHN0YXRlLnNjcm9sbFBhcmVudHMucmVmZXJlbmNlLCBzdGF0ZS5zY3JvbGxQYXJlbnRzLnBvcHBlcik7XG4gICAgaWYgKHNjcm9sbCkge1xuICAgICAgc2Nyb2xsUGFyZW50cy5mb3JFYWNoKGZ1bmN0aW9uKHNjcm9sbFBhcmVudCkge1xuICAgICAgICBzY3JvbGxQYXJlbnQuYWRkRXZlbnRMaXN0ZW5lcihcInNjcm9sbFwiLCBpbnN0YW5jZS51cGRhdGUsIHBhc3NpdmUpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChyZXNpemUpIHtcbiAgICAgIHdpbmRvdzIuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCBpbnN0YW5jZS51cGRhdGUsIHBhc3NpdmUpO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoc2Nyb2xsKSB7XG4gICAgICAgIHNjcm9sbFBhcmVudHMuZm9yRWFjaChmdW5jdGlvbihzY3JvbGxQYXJlbnQpIHtcbiAgICAgICAgICBzY3JvbGxQYXJlbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInNjcm9sbFwiLCBpbnN0YW5jZS51cGRhdGUsIHBhc3NpdmUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChyZXNpemUpIHtcbiAgICAgICAgd2luZG93Mi5yZW1vdmVFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIGluc3RhbmNlLnVwZGF0ZSwgcGFzc2l2ZSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuICB2YXIgZXZlbnRMaXN0ZW5lcnMgPSB7XG4gICAgbmFtZTogXCJldmVudExpc3RlbmVyc1wiLFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgcGhhc2U6IFwid3JpdGVcIixcbiAgICBmbjogZnVuY3Rpb24gZm4oKSB7XG4gICAgfSxcbiAgICBlZmZlY3Q6IGVmZmVjdCQyLFxuICAgIGRhdGE6IHt9XG4gIH07XG4gIGZ1bmN0aW9uIHBvcHBlck9mZnNldHMoX3JlZikge1xuICAgIHZhciBzdGF0ZSA9IF9yZWYuc3RhdGUsIG5hbWUgPSBfcmVmLm5hbWU7XG4gICAgc3RhdGUubW9kaWZpZXJzRGF0YVtuYW1lXSA9IGNvbXB1dGVPZmZzZXRzKHtcbiAgICAgIHJlZmVyZW5jZTogc3RhdGUucmVjdHMucmVmZXJlbmNlLFxuICAgICAgZWxlbWVudDogc3RhdGUucmVjdHMucG9wcGVyLFxuICAgICAgc3RyYXRlZ3k6IFwiYWJzb2x1dGVcIixcbiAgICAgIHBsYWNlbWVudDogc3RhdGUucGxhY2VtZW50XG4gICAgfSk7XG4gIH1cbiAgdmFyIHBvcHBlck9mZnNldHMkMSA9IHtcbiAgICBuYW1lOiBcInBvcHBlck9mZnNldHNcIixcbiAgICBlbmFibGVkOiB0cnVlLFxuICAgIHBoYXNlOiBcInJlYWRcIixcbiAgICBmbjogcG9wcGVyT2Zmc2V0cyxcbiAgICBkYXRhOiB7fVxuICB9O1xuICB2YXIgdW5zZXRTaWRlcyA9IHtcbiAgICB0b3A6IFwiYXV0b1wiLFxuICAgIHJpZ2h0OiBcImF1dG9cIixcbiAgICBib3R0b206IFwiYXV0b1wiLFxuICAgIGxlZnQ6IFwiYXV0b1wiXG4gIH07XG4gIGZ1bmN0aW9uIHJvdW5kT2Zmc2V0c0J5RFBSKF9yZWYpIHtcbiAgICB2YXIgeCA9IF9yZWYueCwgeSA9IF9yZWYueTtcbiAgICB2YXIgd2luID0gd2luZG93O1xuICAgIHZhciBkcHIgPSB3aW4uZGV2aWNlUGl4ZWxSYXRpbyB8fCAxO1xuICAgIHJldHVybiB7XG4gICAgICB4OiByb3VuZChyb3VuZCh4ICogZHByKSAvIGRwcikgfHwgMCxcbiAgICAgIHk6IHJvdW5kKHJvdW5kKHkgKiBkcHIpIC8gZHByKSB8fCAwXG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBtYXBUb1N0eWxlcyhfcmVmMikge1xuICAgIHZhciBfT2JqZWN0JGFzc2lnbjI7XG4gICAgdmFyIHBvcHBlcjIgPSBfcmVmMi5wb3BwZXIsIHBvcHBlclJlY3QgPSBfcmVmMi5wb3BwZXJSZWN0LCBwbGFjZW1lbnQgPSBfcmVmMi5wbGFjZW1lbnQsIG9mZnNldHMgPSBfcmVmMi5vZmZzZXRzLCBwb3NpdGlvbiA9IF9yZWYyLnBvc2l0aW9uLCBncHVBY2NlbGVyYXRpb24gPSBfcmVmMi5ncHVBY2NlbGVyYXRpb24sIGFkYXB0aXZlID0gX3JlZjIuYWRhcHRpdmUsIHJvdW5kT2Zmc2V0cyA9IF9yZWYyLnJvdW5kT2Zmc2V0cztcbiAgICB2YXIgX3JlZjMgPSByb3VuZE9mZnNldHMgPT09IHRydWUgPyByb3VuZE9mZnNldHNCeURQUihvZmZzZXRzKSA6IHR5cGVvZiByb3VuZE9mZnNldHMgPT09IFwiZnVuY3Rpb25cIiA/IHJvdW5kT2Zmc2V0cyhvZmZzZXRzKSA6IG9mZnNldHMsIF9yZWYzJHggPSBfcmVmMy54LCB4ID0gX3JlZjMkeCA9PT0gdm9pZCAwID8gMCA6IF9yZWYzJHgsIF9yZWYzJHkgPSBfcmVmMy55LCB5ID0gX3JlZjMkeSA9PT0gdm9pZCAwID8gMCA6IF9yZWYzJHk7XG4gICAgdmFyIGhhc1ggPSBvZmZzZXRzLmhhc093blByb3BlcnR5KFwieFwiKTtcbiAgICB2YXIgaGFzWSA9IG9mZnNldHMuaGFzT3duUHJvcGVydHkoXCJ5XCIpO1xuICAgIHZhciBzaWRlWCA9IGxlZnQ7XG4gICAgdmFyIHNpZGVZID0gdG9wO1xuICAgIHZhciB3aW4gPSB3aW5kb3c7XG4gICAgaWYgKGFkYXB0aXZlKSB7XG4gICAgICB2YXIgb2Zmc2V0UGFyZW50ID0gZ2V0T2Zmc2V0UGFyZW50KHBvcHBlcjIpO1xuICAgICAgdmFyIGhlaWdodFByb3AgPSBcImNsaWVudEhlaWdodFwiO1xuICAgICAgdmFyIHdpZHRoUHJvcCA9IFwiY2xpZW50V2lkdGhcIjtcbiAgICAgIGlmIChvZmZzZXRQYXJlbnQgPT09IGdldFdpbmRvdyhwb3BwZXIyKSkge1xuICAgICAgICBvZmZzZXRQYXJlbnQgPSBnZXREb2N1bWVudEVsZW1lbnQocG9wcGVyMik7XG4gICAgICAgIGlmIChnZXRDb21wdXRlZFN0eWxlKG9mZnNldFBhcmVudCkucG9zaXRpb24gIT09IFwic3RhdGljXCIpIHtcbiAgICAgICAgICBoZWlnaHRQcm9wID0gXCJzY3JvbGxIZWlnaHRcIjtcbiAgICAgICAgICB3aWR0aFByb3AgPSBcInNjcm9sbFdpZHRoXCI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudDtcbiAgICAgIGlmIChwbGFjZW1lbnQgPT09IHRvcCkge1xuICAgICAgICBzaWRlWSA9IGJvdHRvbTtcbiAgICAgICAgeSAtPSBvZmZzZXRQYXJlbnRbaGVpZ2h0UHJvcF0gLSBwb3BwZXJSZWN0LmhlaWdodDtcbiAgICAgICAgeSAqPSBncHVBY2NlbGVyYXRpb24gPyAxIDogLTE7XG4gICAgICB9XG4gICAgICBpZiAocGxhY2VtZW50ID09PSBsZWZ0KSB7XG4gICAgICAgIHNpZGVYID0gcmlnaHQ7XG4gICAgICAgIHggLT0gb2Zmc2V0UGFyZW50W3dpZHRoUHJvcF0gLSBwb3BwZXJSZWN0LndpZHRoO1xuICAgICAgICB4ICo9IGdwdUFjY2VsZXJhdGlvbiA/IDEgOiAtMTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIGNvbW1vblN0eWxlcyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgcG9zaXRpb25cbiAgICB9LCBhZGFwdGl2ZSAmJiB1bnNldFNpZGVzKTtcbiAgICBpZiAoZ3B1QWNjZWxlcmF0aW9uKSB7XG4gICAgICB2YXIgX09iamVjdCRhc3NpZ247XG4gICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgY29tbW9uU3R5bGVzLCAoX09iamVjdCRhc3NpZ24gPSB7fSwgX09iamVjdCRhc3NpZ25bc2lkZVldID0gaGFzWSA/IFwiMFwiIDogXCJcIiwgX09iamVjdCRhc3NpZ25bc2lkZVhdID0gaGFzWCA/IFwiMFwiIDogXCJcIiwgX09iamVjdCRhc3NpZ24udHJhbnNmb3JtID0gKHdpbi5kZXZpY2VQaXhlbFJhdGlvIHx8IDEpIDwgMiA/IFwidHJhbnNsYXRlKFwiICsgeCArIFwicHgsIFwiICsgeSArIFwicHgpXCIgOiBcInRyYW5zbGF0ZTNkKFwiICsgeCArIFwicHgsIFwiICsgeSArIFwicHgsIDApXCIsIF9PYmplY3QkYXNzaWduKSk7XG4gICAgfVxuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBjb21tb25TdHlsZXMsIChfT2JqZWN0JGFzc2lnbjIgPSB7fSwgX09iamVjdCRhc3NpZ24yW3NpZGVZXSA9IGhhc1kgPyB5ICsgXCJweFwiIDogXCJcIiwgX09iamVjdCRhc3NpZ24yW3NpZGVYXSA9IGhhc1ggPyB4ICsgXCJweFwiIDogXCJcIiwgX09iamVjdCRhc3NpZ24yLnRyYW5zZm9ybSA9IFwiXCIsIF9PYmplY3QkYXNzaWduMikpO1xuICB9XG4gIGZ1bmN0aW9uIGNvbXB1dGVTdHlsZXMoX3JlZjQpIHtcbiAgICB2YXIgc3RhdGUgPSBfcmVmNC5zdGF0ZSwgb3B0aW9ucyA9IF9yZWY0Lm9wdGlvbnM7XG4gICAgdmFyIF9vcHRpb25zJGdwdUFjY2VsZXJhdCA9IG9wdGlvbnMuZ3B1QWNjZWxlcmF0aW9uLCBncHVBY2NlbGVyYXRpb24gPSBfb3B0aW9ucyRncHVBY2NlbGVyYXQgPT09IHZvaWQgMCA/IHRydWUgOiBfb3B0aW9ucyRncHVBY2NlbGVyYXQsIF9vcHRpb25zJGFkYXB0aXZlID0gb3B0aW9ucy5hZGFwdGl2ZSwgYWRhcHRpdmUgPSBfb3B0aW9ucyRhZGFwdGl2ZSA9PT0gdm9pZCAwID8gdHJ1ZSA6IF9vcHRpb25zJGFkYXB0aXZlLCBfb3B0aW9ucyRyb3VuZE9mZnNldHMgPSBvcHRpb25zLnJvdW5kT2Zmc2V0cywgcm91bmRPZmZzZXRzID0gX29wdGlvbnMkcm91bmRPZmZzZXRzID09PSB2b2lkIDAgPyB0cnVlIDogX29wdGlvbnMkcm91bmRPZmZzZXRzO1xuICAgIGlmICh0cnVlKSB7XG4gICAgICB2YXIgdHJhbnNpdGlvblByb3BlcnR5ID0gZ2V0Q29tcHV0ZWRTdHlsZShzdGF0ZS5lbGVtZW50cy5wb3BwZXIpLnRyYW5zaXRpb25Qcm9wZXJ0eSB8fCBcIlwiO1xuICAgICAgaWYgKGFkYXB0aXZlICYmIFtcInRyYW5zZm9ybVwiLCBcInRvcFwiLCBcInJpZ2h0XCIsIFwiYm90dG9tXCIsIFwibGVmdFwiXS5zb21lKGZ1bmN0aW9uKHByb3BlcnR5KSB7XG4gICAgICAgIHJldHVybiB0cmFuc2l0aW9uUHJvcGVydHkuaW5kZXhPZihwcm9wZXJ0eSkgPj0gMDtcbiAgICAgIH0pKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihbXCJQb3BwZXI6IERldGVjdGVkIENTUyB0cmFuc2l0aW9ucyBvbiBhdCBsZWFzdCBvbmUgb2YgdGhlIGZvbGxvd2luZ1wiLCAnQ1NTIHByb3BlcnRpZXM6IFwidHJhbnNmb3JtXCIsIFwidG9wXCIsIFwicmlnaHRcIiwgXCJib3R0b21cIiwgXCJsZWZ0XCIuJywgXCJcXG5cXG5cIiwgJ0Rpc2FibGUgdGhlIFwiY29tcHV0ZVN0eWxlc1wiIG1vZGlmaWVyXFwncyBgYWRhcHRpdmVgIG9wdGlvbiB0byBhbGxvdycsIFwiZm9yIHNtb290aCB0cmFuc2l0aW9ucywgb3IgcmVtb3ZlIHRoZXNlIHByb3BlcnRpZXMgZnJvbSB0aGUgQ1NTXCIsIFwidHJhbnNpdGlvbiBkZWNsYXJhdGlvbiBvbiB0aGUgcG9wcGVyIGVsZW1lbnQgaWYgb25seSB0cmFuc2l0aW9uaW5nXCIsIFwib3BhY2l0eSBvciBiYWNrZ3JvdW5kLWNvbG9yIGZvciBleGFtcGxlLlwiLCBcIlxcblxcblwiLCBcIldlIHJlY29tbWVuZCB1c2luZyB0aGUgcG9wcGVyIGVsZW1lbnQgYXMgYSB3cmFwcGVyIGFyb3VuZCBhbiBpbm5lclwiLCBcImVsZW1lbnQgdGhhdCBjYW4gaGF2ZSBhbnkgQ1NTIHByb3BlcnR5IHRyYW5zaXRpb25lZCBmb3IgYW5pbWF0aW9ucy5cIl0uam9pbihcIiBcIikpO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgY29tbW9uU3R5bGVzID0ge1xuICAgICAgcGxhY2VtZW50OiBnZXRCYXNlUGxhY2VtZW50KHN0YXRlLnBsYWNlbWVudCksXG4gICAgICBwb3BwZXI6IHN0YXRlLmVsZW1lbnRzLnBvcHBlcixcbiAgICAgIHBvcHBlclJlY3Q6IHN0YXRlLnJlY3RzLnBvcHBlcixcbiAgICAgIGdwdUFjY2VsZXJhdGlvblxuICAgIH07XG4gICAgaWYgKHN0YXRlLm1vZGlmaWVyc0RhdGEucG9wcGVyT2Zmc2V0cyAhPSBudWxsKSB7XG4gICAgICBzdGF0ZS5zdHlsZXMucG9wcGVyID0gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUuc3R5bGVzLnBvcHBlciwgbWFwVG9TdHlsZXMoT2JqZWN0LmFzc2lnbih7fSwgY29tbW9uU3R5bGVzLCB7XG4gICAgICAgIG9mZnNldHM6IHN0YXRlLm1vZGlmaWVyc0RhdGEucG9wcGVyT2Zmc2V0cyxcbiAgICAgICAgcG9zaXRpb246IHN0YXRlLm9wdGlvbnMuc3RyYXRlZ3ksXG4gICAgICAgIGFkYXB0aXZlLFxuICAgICAgICByb3VuZE9mZnNldHNcbiAgICAgIH0pKSk7XG4gICAgfVxuICAgIGlmIChzdGF0ZS5tb2RpZmllcnNEYXRhLmFycm93ICE9IG51bGwpIHtcbiAgICAgIHN0YXRlLnN0eWxlcy5hcnJvdyA9IE9iamVjdC5hc3NpZ24oe30sIHN0YXRlLnN0eWxlcy5hcnJvdywgbWFwVG9TdHlsZXMoT2JqZWN0LmFzc2lnbih7fSwgY29tbW9uU3R5bGVzLCB7XG4gICAgICAgIG9mZnNldHM6IHN0YXRlLm1vZGlmaWVyc0RhdGEuYXJyb3csXG4gICAgICAgIHBvc2l0aW9uOiBcImFic29sdXRlXCIsXG4gICAgICAgIGFkYXB0aXZlOiBmYWxzZSxcbiAgICAgICAgcm91bmRPZmZzZXRzXG4gICAgICB9KSkpO1xuICAgIH1cbiAgICBzdGF0ZS5hdHRyaWJ1dGVzLnBvcHBlciA9IE9iamVjdC5hc3NpZ24oe30sIHN0YXRlLmF0dHJpYnV0ZXMucG9wcGVyLCB7XG4gICAgICBcImRhdGEtcG9wcGVyLXBsYWNlbWVudFwiOiBzdGF0ZS5wbGFjZW1lbnRcbiAgICB9KTtcbiAgfVxuICB2YXIgY29tcHV0ZVN0eWxlcyQxID0ge1xuICAgIG5hbWU6IFwiY29tcHV0ZVN0eWxlc1wiLFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgcGhhc2U6IFwiYmVmb3JlV3JpdGVcIixcbiAgICBmbjogY29tcHV0ZVN0eWxlcyxcbiAgICBkYXRhOiB7fVxuICB9O1xuICBmdW5jdGlvbiBhcHBseVN0eWxlcyhfcmVmKSB7XG4gICAgdmFyIHN0YXRlID0gX3JlZi5zdGF0ZTtcbiAgICBPYmplY3Qua2V5cyhzdGF0ZS5lbGVtZW50cykuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICB2YXIgc3R5bGUgPSBzdGF0ZS5zdHlsZXNbbmFtZV0gfHwge307XG4gICAgICB2YXIgYXR0cmlidXRlcyA9IHN0YXRlLmF0dHJpYnV0ZXNbbmFtZV0gfHwge307XG4gICAgICB2YXIgZWxlbWVudCA9IHN0YXRlLmVsZW1lbnRzW25hbWVdO1xuICAgICAgaWYgKCFpc0hUTUxFbGVtZW50KGVsZW1lbnQpIHx8ICFnZXROb2RlTmFtZShlbGVtZW50KSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBPYmplY3QuYXNzaWduKGVsZW1lbnQuc3R5bGUsIHN0eWxlKTtcbiAgICAgIE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLmZvckVhY2goZnVuY3Rpb24obmFtZTIpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gYXR0cmlidXRlc1tuYW1lMl07XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShuYW1lMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZTIsIHZhbHVlID09PSB0cnVlID8gXCJcIiA6IHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gZWZmZWN0JDEoX3JlZjIpIHtcbiAgICB2YXIgc3RhdGUgPSBfcmVmMi5zdGF0ZTtcbiAgICB2YXIgaW5pdGlhbFN0eWxlcyA9IHtcbiAgICAgIHBvcHBlcjoge1xuICAgICAgICBwb3NpdGlvbjogc3RhdGUub3B0aW9ucy5zdHJhdGVneSxcbiAgICAgICAgbGVmdDogXCIwXCIsXG4gICAgICAgIHRvcDogXCIwXCIsXG4gICAgICAgIG1hcmdpbjogXCIwXCJcbiAgICAgIH0sXG4gICAgICBhcnJvdzoge1xuICAgICAgICBwb3NpdGlvbjogXCJhYnNvbHV0ZVwiXG4gICAgICB9LFxuICAgICAgcmVmZXJlbmNlOiB7fVxuICAgIH07XG4gICAgT2JqZWN0LmFzc2lnbihzdGF0ZS5lbGVtZW50cy5wb3BwZXIuc3R5bGUsIGluaXRpYWxTdHlsZXMucG9wcGVyKTtcbiAgICBzdGF0ZS5zdHlsZXMgPSBpbml0aWFsU3R5bGVzO1xuICAgIGlmIChzdGF0ZS5lbGVtZW50cy5hcnJvdykge1xuICAgICAgT2JqZWN0LmFzc2lnbihzdGF0ZS5lbGVtZW50cy5hcnJvdy5zdHlsZSwgaW5pdGlhbFN0eWxlcy5hcnJvdyk7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIE9iamVjdC5rZXlzKHN0YXRlLmVsZW1lbnRzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBzdGF0ZS5lbGVtZW50c1tuYW1lXTtcbiAgICAgICAgdmFyIGF0dHJpYnV0ZXMgPSBzdGF0ZS5hdHRyaWJ1dGVzW25hbWVdIHx8IHt9O1xuICAgICAgICB2YXIgc3R5bGVQcm9wZXJ0aWVzID0gT2JqZWN0LmtleXMoc3RhdGUuc3R5bGVzLmhhc093blByb3BlcnR5KG5hbWUpID8gc3RhdGUuc3R5bGVzW25hbWVdIDogaW5pdGlhbFN0eWxlc1tuYW1lXSk7XG4gICAgICAgIHZhciBzdHlsZSA9IHN0eWxlUHJvcGVydGllcy5yZWR1Y2UoZnVuY3Rpb24oc3R5bGUyLCBwcm9wZXJ0eSkge1xuICAgICAgICAgIHN0eWxlMltwcm9wZXJ0eV0gPSBcIlwiO1xuICAgICAgICAgIHJldHVybiBzdHlsZTI7XG4gICAgICAgIH0sIHt9KTtcbiAgICAgICAgaWYgKCFpc0hUTUxFbGVtZW50KGVsZW1lbnQpIHx8ICFnZXROb2RlTmFtZShlbGVtZW50KSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBPYmplY3QuYXNzaWduKGVsZW1lbnQuc3R5bGUsIHN0eWxlKTtcbiAgICAgICAgT2JqZWN0LmtleXMoYXR0cmlidXRlcykuZm9yRWFjaChmdW5jdGlvbihhdHRyaWJ1dGUpIHtcbiAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cbiAgdmFyIGFwcGx5U3R5bGVzJDEgPSB7XG4gICAgbmFtZTogXCJhcHBseVN0eWxlc1wiLFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgcGhhc2U6IFwid3JpdGVcIixcbiAgICBmbjogYXBwbHlTdHlsZXMsXG4gICAgZWZmZWN0OiBlZmZlY3QkMSxcbiAgICByZXF1aXJlczogW1wiY29tcHV0ZVN0eWxlc1wiXVxuICB9O1xuICBmdW5jdGlvbiBkaXN0YW5jZUFuZFNraWRkaW5nVG9YWShwbGFjZW1lbnQsIHJlY3RzLCBvZmZzZXQyKSB7XG4gICAgdmFyIGJhc2VQbGFjZW1lbnQgPSBnZXRCYXNlUGxhY2VtZW50KHBsYWNlbWVudCk7XG4gICAgdmFyIGludmVydERpc3RhbmNlID0gW2xlZnQsIHRvcF0uaW5kZXhPZihiYXNlUGxhY2VtZW50KSA+PSAwID8gLTEgOiAxO1xuICAgIHZhciBfcmVmID0gdHlwZW9mIG9mZnNldDIgPT09IFwiZnVuY3Rpb25cIiA/IG9mZnNldDIoT2JqZWN0LmFzc2lnbih7fSwgcmVjdHMsIHtcbiAgICAgIHBsYWNlbWVudFxuICAgIH0pKSA6IG9mZnNldDIsIHNraWRkaW5nID0gX3JlZlswXSwgZGlzdGFuY2UgPSBfcmVmWzFdO1xuICAgIHNraWRkaW5nID0gc2tpZGRpbmcgfHwgMDtcbiAgICBkaXN0YW5jZSA9IChkaXN0YW5jZSB8fCAwKSAqIGludmVydERpc3RhbmNlO1xuICAgIHJldHVybiBbbGVmdCwgcmlnaHRdLmluZGV4T2YoYmFzZVBsYWNlbWVudCkgPj0gMCA/IHtcbiAgICAgIHg6IGRpc3RhbmNlLFxuICAgICAgeTogc2tpZGRpbmdcbiAgICB9IDoge1xuICAgICAgeDogc2tpZGRpbmcsXG4gICAgICB5OiBkaXN0YW5jZVxuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gb2Zmc2V0KF9yZWYyKSB7XG4gICAgdmFyIHN0YXRlID0gX3JlZjIuc3RhdGUsIG9wdGlvbnMgPSBfcmVmMi5vcHRpb25zLCBuYW1lID0gX3JlZjIubmFtZTtcbiAgICB2YXIgX29wdGlvbnMkb2Zmc2V0ID0gb3B0aW9ucy5vZmZzZXQsIG9mZnNldDIgPSBfb3B0aW9ucyRvZmZzZXQgPT09IHZvaWQgMCA/IFswLCAwXSA6IF9vcHRpb25zJG9mZnNldDtcbiAgICB2YXIgZGF0YSA9IHBsYWNlbWVudHMucmVkdWNlKGZ1bmN0aW9uKGFjYywgcGxhY2VtZW50KSB7XG4gICAgICBhY2NbcGxhY2VtZW50XSA9IGRpc3RhbmNlQW5kU2tpZGRpbmdUb1hZKHBsYWNlbWVudCwgc3RhdGUucmVjdHMsIG9mZnNldDIpO1xuICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCB7fSk7XG4gICAgdmFyIF9kYXRhJHN0YXRlJHBsYWNlbWVudCA9IGRhdGFbc3RhdGUucGxhY2VtZW50XSwgeCA9IF9kYXRhJHN0YXRlJHBsYWNlbWVudC54LCB5ID0gX2RhdGEkc3RhdGUkcGxhY2VtZW50Lnk7XG4gICAgaWYgKHN0YXRlLm1vZGlmaWVyc0RhdGEucG9wcGVyT2Zmc2V0cyAhPSBudWxsKSB7XG4gICAgICBzdGF0ZS5tb2RpZmllcnNEYXRhLnBvcHBlck9mZnNldHMueCArPSB4O1xuICAgICAgc3RhdGUubW9kaWZpZXJzRGF0YS5wb3BwZXJPZmZzZXRzLnkgKz0geTtcbiAgICB9XG4gICAgc3RhdGUubW9kaWZpZXJzRGF0YVtuYW1lXSA9IGRhdGE7XG4gIH1cbiAgdmFyIG9mZnNldCQxID0ge1xuICAgIG5hbWU6IFwib2Zmc2V0XCIsXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICBwaGFzZTogXCJtYWluXCIsXG4gICAgcmVxdWlyZXM6IFtcInBvcHBlck9mZnNldHNcIl0sXG4gICAgZm46IG9mZnNldFxuICB9O1xuICB2YXIgaGFzaCQxID0ge1xuICAgIGxlZnQ6IFwicmlnaHRcIixcbiAgICByaWdodDogXCJsZWZ0XCIsXG4gICAgYm90dG9tOiBcInRvcFwiLFxuICAgIHRvcDogXCJib3R0b21cIlxuICB9O1xuICBmdW5jdGlvbiBnZXRPcHBvc2l0ZVBsYWNlbWVudChwbGFjZW1lbnQpIHtcbiAgICByZXR1cm4gcGxhY2VtZW50LnJlcGxhY2UoL2xlZnR8cmlnaHR8Ym90dG9tfHRvcC9nLCBmdW5jdGlvbihtYXRjaGVkKSB7XG4gICAgICByZXR1cm4gaGFzaCQxW21hdGNoZWRdO1xuICAgIH0pO1xuICB9XG4gIHZhciBoYXNoID0ge1xuICAgIHN0YXJ0OiBcImVuZFwiLFxuICAgIGVuZDogXCJzdGFydFwiXG4gIH07XG4gIGZ1bmN0aW9uIGdldE9wcG9zaXRlVmFyaWF0aW9uUGxhY2VtZW50KHBsYWNlbWVudCkge1xuICAgIHJldHVybiBwbGFjZW1lbnQucmVwbGFjZSgvc3RhcnR8ZW5kL2csIGZ1bmN0aW9uKG1hdGNoZWQpIHtcbiAgICAgIHJldHVybiBoYXNoW21hdGNoZWRdO1xuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGNvbXB1dGVBdXRvUGxhY2VtZW50KHN0YXRlLCBvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkge1xuICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cbiAgICB2YXIgX29wdGlvbnMgPSBvcHRpb25zLCBwbGFjZW1lbnQgPSBfb3B0aW9ucy5wbGFjZW1lbnQsIGJvdW5kYXJ5ID0gX29wdGlvbnMuYm91bmRhcnksIHJvb3RCb3VuZGFyeSA9IF9vcHRpb25zLnJvb3RCb3VuZGFyeSwgcGFkZGluZyA9IF9vcHRpb25zLnBhZGRpbmcsIGZsaXBWYXJpYXRpb25zID0gX29wdGlvbnMuZmxpcFZhcmlhdGlvbnMsIF9vcHRpb25zJGFsbG93ZWRBdXRvUCA9IF9vcHRpb25zLmFsbG93ZWRBdXRvUGxhY2VtZW50cywgYWxsb3dlZEF1dG9QbGFjZW1lbnRzID0gX29wdGlvbnMkYWxsb3dlZEF1dG9QID09PSB2b2lkIDAgPyBwbGFjZW1lbnRzIDogX29wdGlvbnMkYWxsb3dlZEF1dG9QO1xuICAgIHZhciB2YXJpYXRpb24gPSBnZXRWYXJpYXRpb24ocGxhY2VtZW50KTtcbiAgICB2YXIgcGxhY2VtZW50cyQxID0gdmFyaWF0aW9uID8gZmxpcFZhcmlhdGlvbnMgPyB2YXJpYXRpb25QbGFjZW1lbnRzIDogdmFyaWF0aW9uUGxhY2VtZW50cy5maWx0ZXIoZnVuY3Rpb24ocGxhY2VtZW50Mikge1xuICAgICAgcmV0dXJuIGdldFZhcmlhdGlvbihwbGFjZW1lbnQyKSA9PT0gdmFyaWF0aW9uO1xuICAgIH0pIDogYmFzZVBsYWNlbWVudHM7XG4gICAgdmFyIGFsbG93ZWRQbGFjZW1lbnRzID0gcGxhY2VtZW50cyQxLmZpbHRlcihmdW5jdGlvbihwbGFjZW1lbnQyKSB7XG4gICAgICByZXR1cm4gYWxsb3dlZEF1dG9QbGFjZW1lbnRzLmluZGV4T2YocGxhY2VtZW50MikgPj0gMDtcbiAgICB9KTtcbiAgICBpZiAoYWxsb3dlZFBsYWNlbWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBhbGxvd2VkUGxhY2VtZW50cyA9IHBsYWNlbWVudHMkMTtcbiAgICAgIGlmICh0cnVlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoW1wiUG9wcGVyOiBUaGUgYGFsbG93ZWRBdXRvUGxhY2VtZW50c2Agb3B0aW9uIGRpZCBub3QgYWxsb3cgYW55XCIsIFwicGxhY2VtZW50cy4gRW5zdXJlIHRoZSBgcGxhY2VtZW50YCBvcHRpb24gbWF0Y2hlcyB0aGUgdmFyaWF0aW9uXCIsIFwib2YgdGhlIGFsbG93ZWQgcGxhY2VtZW50cy5cIiwgJ0ZvciBleGFtcGxlLCBcImF1dG9cIiBjYW5ub3QgYmUgdXNlZCB0byBhbGxvdyBcImJvdHRvbS1zdGFydFwiLicsICdVc2UgXCJhdXRvLXN0YXJ0XCIgaW5zdGVhZC4nXS5qb2luKFwiIFwiKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBvdmVyZmxvd3MgPSBhbGxvd2VkUGxhY2VtZW50cy5yZWR1Y2UoZnVuY3Rpb24oYWNjLCBwbGFjZW1lbnQyKSB7XG4gICAgICBhY2NbcGxhY2VtZW50Ml0gPSBkZXRlY3RPdmVyZmxvdyhzdGF0ZSwge1xuICAgICAgICBwbGFjZW1lbnQ6IHBsYWNlbWVudDIsXG4gICAgICAgIGJvdW5kYXJ5LFxuICAgICAgICByb290Qm91bmRhcnksXG4gICAgICAgIHBhZGRpbmdcbiAgICAgIH0pW2dldEJhc2VQbGFjZW1lbnQocGxhY2VtZW50MildO1xuICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCB7fSk7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG92ZXJmbG93cykuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICByZXR1cm4gb3ZlcmZsb3dzW2FdIC0gb3ZlcmZsb3dzW2JdO1xuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGdldEV4cGFuZGVkRmFsbGJhY2tQbGFjZW1lbnRzKHBsYWNlbWVudCkge1xuICAgIGlmIChnZXRCYXNlUGxhY2VtZW50KHBsYWNlbWVudCkgPT09IGF1dG8pIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgdmFyIG9wcG9zaXRlUGxhY2VtZW50ID0gZ2V0T3Bwb3NpdGVQbGFjZW1lbnQocGxhY2VtZW50KTtcbiAgICByZXR1cm4gW2dldE9wcG9zaXRlVmFyaWF0aW9uUGxhY2VtZW50KHBsYWNlbWVudCksIG9wcG9zaXRlUGxhY2VtZW50LCBnZXRPcHBvc2l0ZVZhcmlhdGlvblBsYWNlbWVudChvcHBvc2l0ZVBsYWNlbWVudCldO1xuICB9XG4gIGZ1bmN0aW9uIGZsaXAoX3JlZikge1xuICAgIHZhciBzdGF0ZSA9IF9yZWYuc3RhdGUsIG9wdGlvbnMgPSBfcmVmLm9wdGlvbnMsIG5hbWUgPSBfcmVmLm5hbWU7XG4gICAgaWYgKHN0YXRlLm1vZGlmaWVyc0RhdGFbbmFtZV0uX3NraXApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIF9vcHRpb25zJG1haW5BeGlzID0gb3B0aW9ucy5tYWluQXhpcywgY2hlY2tNYWluQXhpcyA9IF9vcHRpb25zJG1haW5BeGlzID09PSB2b2lkIDAgPyB0cnVlIDogX29wdGlvbnMkbWFpbkF4aXMsIF9vcHRpb25zJGFsdEF4aXMgPSBvcHRpb25zLmFsdEF4aXMsIGNoZWNrQWx0QXhpcyA9IF9vcHRpb25zJGFsdEF4aXMgPT09IHZvaWQgMCA/IHRydWUgOiBfb3B0aW9ucyRhbHRBeGlzLCBzcGVjaWZpZWRGYWxsYmFja1BsYWNlbWVudHMgPSBvcHRpb25zLmZhbGxiYWNrUGxhY2VtZW50cywgcGFkZGluZyA9IG9wdGlvbnMucGFkZGluZywgYm91bmRhcnkgPSBvcHRpb25zLmJvdW5kYXJ5LCByb290Qm91bmRhcnkgPSBvcHRpb25zLnJvb3RCb3VuZGFyeSwgYWx0Qm91bmRhcnkgPSBvcHRpb25zLmFsdEJvdW5kYXJ5LCBfb3B0aW9ucyRmbGlwVmFyaWF0aW8gPSBvcHRpb25zLmZsaXBWYXJpYXRpb25zLCBmbGlwVmFyaWF0aW9ucyA9IF9vcHRpb25zJGZsaXBWYXJpYXRpbyA9PT0gdm9pZCAwID8gdHJ1ZSA6IF9vcHRpb25zJGZsaXBWYXJpYXRpbywgYWxsb3dlZEF1dG9QbGFjZW1lbnRzID0gb3B0aW9ucy5hbGxvd2VkQXV0b1BsYWNlbWVudHM7XG4gICAgdmFyIHByZWZlcnJlZFBsYWNlbWVudCA9IHN0YXRlLm9wdGlvbnMucGxhY2VtZW50O1xuICAgIHZhciBiYXNlUGxhY2VtZW50ID0gZ2V0QmFzZVBsYWNlbWVudChwcmVmZXJyZWRQbGFjZW1lbnQpO1xuICAgIHZhciBpc0Jhc2VQbGFjZW1lbnQgPSBiYXNlUGxhY2VtZW50ID09PSBwcmVmZXJyZWRQbGFjZW1lbnQ7XG4gICAgdmFyIGZhbGxiYWNrUGxhY2VtZW50cyA9IHNwZWNpZmllZEZhbGxiYWNrUGxhY2VtZW50cyB8fCAoaXNCYXNlUGxhY2VtZW50IHx8ICFmbGlwVmFyaWF0aW9ucyA/IFtnZXRPcHBvc2l0ZVBsYWNlbWVudChwcmVmZXJyZWRQbGFjZW1lbnQpXSA6IGdldEV4cGFuZGVkRmFsbGJhY2tQbGFjZW1lbnRzKHByZWZlcnJlZFBsYWNlbWVudCkpO1xuICAgIHZhciBwbGFjZW1lbnRzMiA9IFtwcmVmZXJyZWRQbGFjZW1lbnRdLmNvbmNhdChmYWxsYmFja1BsYWNlbWVudHMpLnJlZHVjZShmdW5jdGlvbihhY2MsIHBsYWNlbWVudDIpIHtcbiAgICAgIHJldHVybiBhY2MuY29uY2F0KGdldEJhc2VQbGFjZW1lbnQocGxhY2VtZW50MikgPT09IGF1dG8gPyBjb21wdXRlQXV0b1BsYWNlbWVudChzdGF0ZSwge1xuICAgICAgICBwbGFjZW1lbnQ6IHBsYWNlbWVudDIsXG4gICAgICAgIGJvdW5kYXJ5LFxuICAgICAgICByb290Qm91bmRhcnksXG4gICAgICAgIHBhZGRpbmcsXG4gICAgICAgIGZsaXBWYXJpYXRpb25zLFxuICAgICAgICBhbGxvd2VkQXV0b1BsYWNlbWVudHNcbiAgICAgIH0pIDogcGxhY2VtZW50Mik7XG4gICAgfSwgW10pO1xuICAgIHZhciByZWZlcmVuY2VSZWN0ID0gc3RhdGUucmVjdHMucmVmZXJlbmNlO1xuICAgIHZhciBwb3BwZXJSZWN0ID0gc3RhdGUucmVjdHMucG9wcGVyO1xuICAgIHZhciBjaGVja3NNYXAgPSBuZXcgTWFwKCk7XG4gICAgdmFyIG1ha2VGYWxsYmFja0NoZWNrcyA9IHRydWU7XG4gICAgdmFyIGZpcnN0Rml0dGluZ1BsYWNlbWVudCA9IHBsYWNlbWVudHMyWzBdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGxhY2VtZW50czIubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBwbGFjZW1lbnQgPSBwbGFjZW1lbnRzMltpXTtcbiAgICAgIHZhciBfYmFzZVBsYWNlbWVudCA9IGdldEJhc2VQbGFjZW1lbnQocGxhY2VtZW50KTtcbiAgICAgIHZhciBpc1N0YXJ0VmFyaWF0aW9uID0gZ2V0VmFyaWF0aW9uKHBsYWNlbWVudCkgPT09IHN0YXJ0O1xuICAgICAgdmFyIGlzVmVydGljYWwgPSBbdG9wLCBib3R0b21dLmluZGV4T2YoX2Jhc2VQbGFjZW1lbnQpID49IDA7XG4gICAgICB2YXIgbGVuID0gaXNWZXJ0aWNhbCA/IFwid2lkdGhcIiA6IFwiaGVpZ2h0XCI7XG4gICAgICB2YXIgb3ZlcmZsb3cgPSBkZXRlY3RPdmVyZmxvdyhzdGF0ZSwge1xuICAgICAgICBwbGFjZW1lbnQsXG4gICAgICAgIGJvdW5kYXJ5LFxuICAgICAgICByb290Qm91bmRhcnksXG4gICAgICAgIGFsdEJvdW5kYXJ5LFxuICAgICAgICBwYWRkaW5nXG4gICAgICB9KTtcbiAgICAgIHZhciBtYWluVmFyaWF0aW9uU2lkZSA9IGlzVmVydGljYWwgPyBpc1N0YXJ0VmFyaWF0aW9uID8gcmlnaHQgOiBsZWZ0IDogaXNTdGFydFZhcmlhdGlvbiA/IGJvdHRvbSA6IHRvcDtcbiAgICAgIGlmIChyZWZlcmVuY2VSZWN0W2xlbl0gPiBwb3BwZXJSZWN0W2xlbl0pIHtcbiAgICAgICAgbWFpblZhcmlhdGlvblNpZGUgPSBnZXRPcHBvc2l0ZVBsYWNlbWVudChtYWluVmFyaWF0aW9uU2lkZSk7XG4gICAgICB9XG4gICAgICB2YXIgYWx0VmFyaWF0aW9uU2lkZSA9IGdldE9wcG9zaXRlUGxhY2VtZW50KG1haW5WYXJpYXRpb25TaWRlKTtcbiAgICAgIHZhciBjaGVja3MgPSBbXTtcbiAgICAgIGlmIChjaGVja01haW5BeGlzKSB7XG4gICAgICAgIGNoZWNrcy5wdXNoKG92ZXJmbG93W19iYXNlUGxhY2VtZW50XSA8PSAwKTtcbiAgICAgIH1cbiAgICAgIGlmIChjaGVja0FsdEF4aXMpIHtcbiAgICAgICAgY2hlY2tzLnB1c2gob3ZlcmZsb3dbbWFpblZhcmlhdGlvblNpZGVdIDw9IDAsIG92ZXJmbG93W2FsdFZhcmlhdGlvblNpZGVdIDw9IDApO1xuICAgICAgfVxuICAgICAgaWYgKGNoZWNrcy5ldmVyeShmdW5jdGlvbihjaGVjaykge1xuICAgICAgICByZXR1cm4gY2hlY2s7XG4gICAgICB9KSkge1xuICAgICAgICBmaXJzdEZpdHRpbmdQbGFjZW1lbnQgPSBwbGFjZW1lbnQ7XG4gICAgICAgIG1ha2VGYWxsYmFja0NoZWNrcyA9IGZhbHNlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNoZWNrc01hcC5zZXQocGxhY2VtZW50LCBjaGVja3MpO1xuICAgIH1cbiAgICBpZiAobWFrZUZhbGxiYWNrQ2hlY2tzKSB7XG4gICAgICB2YXIgbnVtYmVyT2ZDaGVja3MgPSBmbGlwVmFyaWF0aW9ucyA/IDMgOiAxO1xuICAgICAgdmFyIF9sb29wID0gZnVuY3Rpb24gX2xvb3AyKF9pMikge1xuICAgICAgICB2YXIgZml0dGluZ1BsYWNlbWVudCA9IHBsYWNlbWVudHMyLmZpbmQoZnVuY3Rpb24ocGxhY2VtZW50Mikge1xuICAgICAgICAgIHZhciBjaGVja3MyID0gY2hlY2tzTWFwLmdldChwbGFjZW1lbnQyKTtcbiAgICAgICAgICBpZiAoY2hlY2tzMikge1xuICAgICAgICAgICAgcmV0dXJuIGNoZWNrczIuc2xpY2UoMCwgX2kyKS5ldmVyeShmdW5jdGlvbihjaGVjaykge1xuICAgICAgICAgICAgICByZXR1cm4gY2hlY2s7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoZml0dGluZ1BsYWNlbWVudCkge1xuICAgICAgICAgIGZpcnN0Rml0dGluZ1BsYWNlbWVudCA9IGZpdHRpbmdQbGFjZW1lbnQ7XG4gICAgICAgICAgcmV0dXJuIFwiYnJlYWtcIjtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGZvciAodmFyIF9pID0gbnVtYmVyT2ZDaGVja3M7IF9pID4gMDsgX2ktLSkge1xuICAgICAgICB2YXIgX3JldCA9IF9sb29wKF9pKTtcbiAgICAgICAgaWYgKF9yZXQgPT09IFwiYnJlYWtcIilcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHN0YXRlLnBsYWNlbWVudCAhPT0gZmlyc3RGaXR0aW5nUGxhY2VtZW50KSB7XG4gICAgICBzdGF0ZS5tb2RpZmllcnNEYXRhW25hbWVdLl9za2lwID0gdHJ1ZTtcbiAgICAgIHN0YXRlLnBsYWNlbWVudCA9IGZpcnN0Rml0dGluZ1BsYWNlbWVudDtcbiAgICAgIHN0YXRlLnJlc2V0ID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgdmFyIGZsaXAkMSA9IHtcbiAgICBuYW1lOiBcImZsaXBcIixcbiAgICBlbmFibGVkOiB0cnVlLFxuICAgIHBoYXNlOiBcIm1haW5cIixcbiAgICBmbjogZmxpcCxcbiAgICByZXF1aXJlc0lmRXhpc3RzOiBbXCJvZmZzZXRcIl0sXG4gICAgZGF0YToge1xuICAgICAgX3NraXA6IGZhbHNlXG4gICAgfVxuICB9O1xuICBmdW5jdGlvbiBnZXRBbHRBeGlzKGF4aXMpIHtcbiAgICByZXR1cm4gYXhpcyA9PT0gXCJ4XCIgPyBcInlcIiA6IFwieFwiO1xuICB9XG4gIGZ1bmN0aW9uIHdpdGhpbihtaW4kMSwgdmFsdWUsIG1heCQxKSB7XG4gICAgcmV0dXJuIG1heChtaW4kMSwgbWluKHZhbHVlLCBtYXgkMSkpO1xuICB9XG4gIGZ1bmN0aW9uIHByZXZlbnRPdmVyZmxvdyhfcmVmKSB7XG4gICAgdmFyIHN0YXRlID0gX3JlZi5zdGF0ZSwgb3B0aW9ucyA9IF9yZWYub3B0aW9ucywgbmFtZSA9IF9yZWYubmFtZTtcbiAgICB2YXIgX29wdGlvbnMkbWFpbkF4aXMgPSBvcHRpb25zLm1haW5BeGlzLCBjaGVja01haW5BeGlzID0gX29wdGlvbnMkbWFpbkF4aXMgPT09IHZvaWQgMCA/IHRydWUgOiBfb3B0aW9ucyRtYWluQXhpcywgX29wdGlvbnMkYWx0QXhpcyA9IG9wdGlvbnMuYWx0QXhpcywgY2hlY2tBbHRBeGlzID0gX29wdGlvbnMkYWx0QXhpcyA9PT0gdm9pZCAwID8gZmFsc2UgOiBfb3B0aW9ucyRhbHRBeGlzLCBib3VuZGFyeSA9IG9wdGlvbnMuYm91bmRhcnksIHJvb3RCb3VuZGFyeSA9IG9wdGlvbnMucm9vdEJvdW5kYXJ5LCBhbHRCb3VuZGFyeSA9IG9wdGlvbnMuYWx0Qm91bmRhcnksIHBhZGRpbmcgPSBvcHRpb25zLnBhZGRpbmcsIF9vcHRpb25zJHRldGhlciA9IG9wdGlvbnMudGV0aGVyLCB0ZXRoZXIgPSBfb3B0aW9ucyR0ZXRoZXIgPT09IHZvaWQgMCA/IHRydWUgOiBfb3B0aW9ucyR0ZXRoZXIsIF9vcHRpb25zJHRldGhlck9mZnNldCA9IG9wdGlvbnMudGV0aGVyT2Zmc2V0LCB0ZXRoZXJPZmZzZXQgPSBfb3B0aW9ucyR0ZXRoZXJPZmZzZXQgPT09IHZvaWQgMCA/IDAgOiBfb3B0aW9ucyR0ZXRoZXJPZmZzZXQ7XG4gICAgdmFyIG92ZXJmbG93ID0gZGV0ZWN0T3ZlcmZsb3coc3RhdGUsIHtcbiAgICAgIGJvdW5kYXJ5LFxuICAgICAgcm9vdEJvdW5kYXJ5LFxuICAgICAgcGFkZGluZyxcbiAgICAgIGFsdEJvdW5kYXJ5XG4gICAgfSk7XG4gICAgdmFyIGJhc2VQbGFjZW1lbnQgPSBnZXRCYXNlUGxhY2VtZW50KHN0YXRlLnBsYWNlbWVudCk7XG4gICAgdmFyIHZhcmlhdGlvbiA9IGdldFZhcmlhdGlvbihzdGF0ZS5wbGFjZW1lbnQpO1xuICAgIHZhciBpc0Jhc2VQbGFjZW1lbnQgPSAhdmFyaWF0aW9uO1xuICAgIHZhciBtYWluQXhpcyA9IGdldE1haW5BeGlzRnJvbVBsYWNlbWVudChiYXNlUGxhY2VtZW50KTtcbiAgICB2YXIgYWx0QXhpcyA9IGdldEFsdEF4aXMobWFpbkF4aXMpO1xuICAgIHZhciBwb3BwZXJPZmZzZXRzMiA9IHN0YXRlLm1vZGlmaWVyc0RhdGEucG9wcGVyT2Zmc2V0cztcbiAgICB2YXIgcmVmZXJlbmNlUmVjdCA9IHN0YXRlLnJlY3RzLnJlZmVyZW5jZTtcbiAgICB2YXIgcG9wcGVyUmVjdCA9IHN0YXRlLnJlY3RzLnBvcHBlcjtcbiAgICB2YXIgdGV0aGVyT2Zmc2V0VmFsdWUgPSB0eXBlb2YgdGV0aGVyT2Zmc2V0ID09PSBcImZ1bmN0aW9uXCIgPyB0ZXRoZXJPZmZzZXQoT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUucmVjdHMsIHtcbiAgICAgIHBsYWNlbWVudDogc3RhdGUucGxhY2VtZW50XG4gICAgfSkpIDogdGV0aGVyT2Zmc2V0O1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgeDogMCxcbiAgICAgIHk6IDBcbiAgICB9O1xuICAgIGlmICghcG9wcGVyT2Zmc2V0czIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNoZWNrTWFpbkF4aXMgfHwgY2hlY2tBbHRBeGlzKSB7XG4gICAgICB2YXIgbWFpblNpZGUgPSBtYWluQXhpcyA9PT0gXCJ5XCIgPyB0b3AgOiBsZWZ0O1xuICAgICAgdmFyIGFsdFNpZGUgPSBtYWluQXhpcyA9PT0gXCJ5XCIgPyBib3R0b20gOiByaWdodDtcbiAgICAgIHZhciBsZW4gPSBtYWluQXhpcyA9PT0gXCJ5XCIgPyBcImhlaWdodFwiIDogXCJ3aWR0aFwiO1xuICAgICAgdmFyIG9mZnNldDIgPSBwb3BwZXJPZmZzZXRzMlttYWluQXhpc107XG4gICAgICB2YXIgbWluJDEgPSBwb3BwZXJPZmZzZXRzMlttYWluQXhpc10gKyBvdmVyZmxvd1ttYWluU2lkZV07XG4gICAgICB2YXIgbWF4JDEgPSBwb3BwZXJPZmZzZXRzMlttYWluQXhpc10gLSBvdmVyZmxvd1thbHRTaWRlXTtcbiAgICAgIHZhciBhZGRpdGl2ZSA9IHRldGhlciA/IC1wb3BwZXJSZWN0W2xlbl0gLyAyIDogMDtcbiAgICAgIHZhciBtaW5MZW4gPSB2YXJpYXRpb24gPT09IHN0YXJ0ID8gcmVmZXJlbmNlUmVjdFtsZW5dIDogcG9wcGVyUmVjdFtsZW5dO1xuICAgICAgdmFyIG1heExlbiA9IHZhcmlhdGlvbiA9PT0gc3RhcnQgPyAtcG9wcGVyUmVjdFtsZW5dIDogLXJlZmVyZW5jZVJlY3RbbGVuXTtcbiAgICAgIHZhciBhcnJvd0VsZW1lbnQgPSBzdGF0ZS5lbGVtZW50cy5hcnJvdztcbiAgICAgIHZhciBhcnJvd1JlY3QgPSB0ZXRoZXIgJiYgYXJyb3dFbGVtZW50ID8gZ2V0TGF5b3V0UmVjdChhcnJvd0VsZW1lbnQpIDoge1xuICAgICAgICB3aWR0aDogMCxcbiAgICAgICAgaGVpZ2h0OiAwXG4gICAgICB9O1xuICAgICAgdmFyIGFycm93UGFkZGluZ09iamVjdCA9IHN0YXRlLm1vZGlmaWVyc0RhdGFbXCJhcnJvdyNwZXJzaXN0ZW50XCJdID8gc3RhdGUubW9kaWZpZXJzRGF0YVtcImFycm93I3BlcnNpc3RlbnRcIl0ucGFkZGluZyA6IGdldEZyZXNoU2lkZU9iamVjdCgpO1xuICAgICAgdmFyIGFycm93UGFkZGluZ01pbiA9IGFycm93UGFkZGluZ09iamVjdFttYWluU2lkZV07XG4gICAgICB2YXIgYXJyb3dQYWRkaW5nTWF4ID0gYXJyb3dQYWRkaW5nT2JqZWN0W2FsdFNpZGVdO1xuICAgICAgdmFyIGFycm93TGVuID0gd2l0aGluKDAsIHJlZmVyZW5jZVJlY3RbbGVuXSwgYXJyb3dSZWN0W2xlbl0pO1xuICAgICAgdmFyIG1pbk9mZnNldCA9IGlzQmFzZVBsYWNlbWVudCA/IHJlZmVyZW5jZVJlY3RbbGVuXSAvIDIgLSBhZGRpdGl2ZSAtIGFycm93TGVuIC0gYXJyb3dQYWRkaW5nTWluIC0gdGV0aGVyT2Zmc2V0VmFsdWUgOiBtaW5MZW4gLSBhcnJvd0xlbiAtIGFycm93UGFkZGluZ01pbiAtIHRldGhlck9mZnNldFZhbHVlO1xuICAgICAgdmFyIG1heE9mZnNldCA9IGlzQmFzZVBsYWNlbWVudCA/IC1yZWZlcmVuY2VSZWN0W2xlbl0gLyAyICsgYWRkaXRpdmUgKyBhcnJvd0xlbiArIGFycm93UGFkZGluZ01heCArIHRldGhlck9mZnNldFZhbHVlIDogbWF4TGVuICsgYXJyb3dMZW4gKyBhcnJvd1BhZGRpbmdNYXggKyB0ZXRoZXJPZmZzZXRWYWx1ZTtcbiAgICAgIHZhciBhcnJvd09mZnNldFBhcmVudCA9IHN0YXRlLmVsZW1lbnRzLmFycm93ICYmIGdldE9mZnNldFBhcmVudChzdGF0ZS5lbGVtZW50cy5hcnJvdyk7XG4gICAgICB2YXIgY2xpZW50T2Zmc2V0ID0gYXJyb3dPZmZzZXRQYXJlbnQgPyBtYWluQXhpcyA9PT0gXCJ5XCIgPyBhcnJvd09mZnNldFBhcmVudC5jbGllbnRUb3AgfHwgMCA6IGFycm93T2Zmc2V0UGFyZW50LmNsaWVudExlZnQgfHwgMCA6IDA7XG4gICAgICB2YXIgb2Zmc2V0TW9kaWZpZXJWYWx1ZSA9IHN0YXRlLm1vZGlmaWVyc0RhdGEub2Zmc2V0ID8gc3RhdGUubW9kaWZpZXJzRGF0YS5vZmZzZXRbc3RhdGUucGxhY2VtZW50XVttYWluQXhpc10gOiAwO1xuICAgICAgdmFyIHRldGhlck1pbiA9IHBvcHBlck9mZnNldHMyW21haW5BeGlzXSArIG1pbk9mZnNldCAtIG9mZnNldE1vZGlmaWVyVmFsdWUgLSBjbGllbnRPZmZzZXQ7XG4gICAgICB2YXIgdGV0aGVyTWF4ID0gcG9wcGVyT2Zmc2V0czJbbWFpbkF4aXNdICsgbWF4T2Zmc2V0IC0gb2Zmc2V0TW9kaWZpZXJWYWx1ZTtcbiAgICAgIGlmIChjaGVja01haW5BeGlzKSB7XG4gICAgICAgIHZhciBwcmV2ZW50ZWRPZmZzZXQgPSB3aXRoaW4odGV0aGVyID8gbWluKG1pbiQxLCB0ZXRoZXJNaW4pIDogbWluJDEsIG9mZnNldDIsIHRldGhlciA/IG1heChtYXgkMSwgdGV0aGVyTWF4KSA6IG1heCQxKTtcbiAgICAgICAgcG9wcGVyT2Zmc2V0czJbbWFpbkF4aXNdID0gcHJldmVudGVkT2Zmc2V0O1xuICAgICAgICBkYXRhW21haW5BeGlzXSA9IHByZXZlbnRlZE9mZnNldCAtIG9mZnNldDI7XG4gICAgICB9XG4gICAgICBpZiAoY2hlY2tBbHRBeGlzKSB7XG4gICAgICAgIHZhciBfbWFpblNpZGUgPSBtYWluQXhpcyA9PT0gXCJ4XCIgPyB0b3AgOiBsZWZ0O1xuICAgICAgICB2YXIgX2FsdFNpZGUgPSBtYWluQXhpcyA9PT0gXCJ4XCIgPyBib3R0b20gOiByaWdodDtcbiAgICAgICAgdmFyIF9vZmZzZXQgPSBwb3BwZXJPZmZzZXRzMlthbHRBeGlzXTtcbiAgICAgICAgdmFyIF9taW4gPSBfb2Zmc2V0ICsgb3ZlcmZsb3dbX21haW5TaWRlXTtcbiAgICAgICAgdmFyIF9tYXggPSBfb2Zmc2V0IC0gb3ZlcmZsb3dbX2FsdFNpZGVdO1xuICAgICAgICB2YXIgX3ByZXZlbnRlZE9mZnNldCA9IHdpdGhpbih0ZXRoZXIgPyBtaW4oX21pbiwgdGV0aGVyTWluKSA6IF9taW4sIF9vZmZzZXQsIHRldGhlciA/IG1heChfbWF4LCB0ZXRoZXJNYXgpIDogX21heCk7XG4gICAgICAgIHBvcHBlck9mZnNldHMyW2FsdEF4aXNdID0gX3ByZXZlbnRlZE9mZnNldDtcbiAgICAgICAgZGF0YVthbHRBeGlzXSA9IF9wcmV2ZW50ZWRPZmZzZXQgLSBfb2Zmc2V0O1xuICAgICAgfVxuICAgIH1cbiAgICBzdGF0ZS5tb2RpZmllcnNEYXRhW25hbWVdID0gZGF0YTtcbiAgfVxuICB2YXIgcHJldmVudE92ZXJmbG93JDEgPSB7XG4gICAgbmFtZTogXCJwcmV2ZW50T3ZlcmZsb3dcIixcbiAgICBlbmFibGVkOiB0cnVlLFxuICAgIHBoYXNlOiBcIm1haW5cIixcbiAgICBmbjogcHJldmVudE92ZXJmbG93LFxuICAgIHJlcXVpcmVzSWZFeGlzdHM6IFtcIm9mZnNldFwiXVxuICB9O1xuICB2YXIgdG9QYWRkaW5nT2JqZWN0ID0gZnVuY3Rpb24gdG9QYWRkaW5nT2JqZWN0MihwYWRkaW5nLCBzdGF0ZSkge1xuICAgIHBhZGRpbmcgPSB0eXBlb2YgcGFkZGluZyA9PT0gXCJmdW5jdGlvblwiID8gcGFkZGluZyhPYmplY3QuYXNzaWduKHt9LCBzdGF0ZS5yZWN0cywge1xuICAgICAgcGxhY2VtZW50OiBzdGF0ZS5wbGFjZW1lbnRcbiAgICB9KSkgOiBwYWRkaW5nO1xuICAgIHJldHVybiBtZXJnZVBhZGRpbmdPYmplY3QodHlwZW9mIHBhZGRpbmcgIT09IFwibnVtYmVyXCIgPyBwYWRkaW5nIDogZXhwYW5kVG9IYXNoTWFwKHBhZGRpbmcsIGJhc2VQbGFjZW1lbnRzKSk7XG4gIH07XG4gIGZ1bmN0aW9uIGFycm93KF9yZWYpIHtcbiAgICB2YXIgX3N0YXRlJG1vZGlmaWVyc0RhdGEkO1xuICAgIHZhciBzdGF0ZSA9IF9yZWYuc3RhdGUsIG5hbWUgPSBfcmVmLm5hbWUsIG9wdGlvbnMgPSBfcmVmLm9wdGlvbnM7XG4gICAgdmFyIGFycm93RWxlbWVudCA9IHN0YXRlLmVsZW1lbnRzLmFycm93O1xuICAgIHZhciBwb3BwZXJPZmZzZXRzMiA9IHN0YXRlLm1vZGlmaWVyc0RhdGEucG9wcGVyT2Zmc2V0cztcbiAgICB2YXIgYmFzZVBsYWNlbWVudCA9IGdldEJhc2VQbGFjZW1lbnQoc3RhdGUucGxhY2VtZW50KTtcbiAgICB2YXIgYXhpcyA9IGdldE1haW5BeGlzRnJvbVBsYWNlbWVudChiYXNlUGxhY2VtZW50KTtcbiAgICB2YXIgaXNWZXJ0aWNhbCA9IFtsZWZ0LCByaWdodF0uaW5kZXhPZihiYXNlUGxhY2VtZW50KSA+PSAwO1xuICAgIHZhciBsZW4gPSBpc1ZlcnRpY2FsID8gXCJoZWlnaHRcIiA6IFwid2lkdGhcIjtcbiAgICBpZiAoIWFycm93RWxlbWVudCB8fCAhcG9wcGVyT2Zmc2V0czIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHBhZGRpbmdPYmplY3QgPSB0b1BhZGRpbmdPYmplY3Qob3B0aW9ucy5wYWRkaW5nLCBzdGF0ZSk7XG4gICAgdmFyIGFycm93UmVjdCA9IGdldExheW91dFJlY3QoYXJyb3dFbGVtZW50KTtcbiAgICB2YXIgbWluUHJvcCA9IGF4aXMgPT09IFwieVwiID8gdG9wIDogbGVmdDtcbiAgICB2YXIgbWF4UHJvcCA9IGF4aXMgPT09IFwieVwiID8gYm90dG9tIDogcmlnaHQ7XG4gICAgdmFyIGVuZERpZmYgPSBzdGF0ZS5yZWN0cy5yZWZlcmVuY2VbbGVuXSArIHN0YXRlLnJlY3RzLnJlZmVyZW5jZVtheGlzXSAtIHBvcHBlck9mZnNldHMyW2F4aXNdIC0gc3RhdGUucmVjdHMucG9wcGVyW2xlbl07XG4gICAgdmFyIHN0YXJ0RGlmZiA9IHBvcHBlck9mZnNldHMyW2F4aXNdIC0gc3RhdGUucmVjdHMucmVmZXJlbmNlW2F4aXNdO1xuICAgIHZhciBhcnJvd09mZnNldFBhcmVudCA9IGdldE9mZnNldFBhcmVudChhcnJvd0VsZW1lbnQpO1xuICAgIHZhciBjbGllbnRTaXplID0gYXJyb3dPZmZzZXRQYXJlbnQgPyBheGlzID09PSBcInlcIiA/IGFycm93T2Zmc2V0UGFyZW50LmNsaWVudEhlaWdodCB8fCAwIDogYXJyb3dPZmZzZXRQYXJlbnQuY2xpZW50V2lkdGggfHwgMCA6IDA7XG4gICAgdmFyIGNlbnRlclRvUmVmZXJlbmNlID0gZW5kRGlmZiAvIDIgLSBzdGFydERpZmYgLyAyO1xuICAgIHZhciBtaW4yID0gcGFkZGluZ09iamVjdFttaW5Qcm9wXTtcbiAgICB2YXIgbWF4MiA9IGNsaWVudFNpemUgLSBhcnJvd1JlY3RbbGVuXSAtIHBhZGRpbmdPYmplY3RbbWF4UHJvcF07XG4gICAgdmFyIGNlbnRlciA9IGNsaWVudFNpemUgLyAyIC0gYXJyb3dSZWN0W2xlbl0gLyAyICsgY2VudGVyVG9SZWZlcmVuY2U7XG4gICAgdmFyIG9mZnNldDIgPSB3aXRoaW4obWluMiwgY2VudGVyLCBtYXgyKTtcbiAgICB2YXIgYXhpc1Byb3AgPSBheGlzO1xuICAgIHN0YXRlLm1vZGlmaWVyc0RhdGFbbmFtZV0gPSAoX3N0YXRlJG1vZGlmaWVyc0RhdGEkID0ge30sIF9zdGF0ZSRtb2RpZmllcnNEYXRhJFtheGlzUHJvcF0gPSBvZmZzZXQyLCBfc3RhdGUkbW9kaWZpZXJzRGF0YSQuY2VudGVyT2Zmc2V0ID0gb2Zmc2V0MiAtIGNlbnRlciwgX3N0YXRlJG1vZGlmaWVyc0RhdGEkKTtcbiAgfVxuICBmdW5jdGlvbiBlZmZlY3QoX3JlZjIpIHtcbiAgICB2YXIgc3RhdGUgPSBfcmVmMi5zdGF0ZSwgb3B0aW9ucyA9IF9yZWYyLm9wdGlvbnM7XG4gICAgdmFyIF9vcHRpb25zJGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQsIGFycm93RWxlbWVudCA9IF9vcHRpb25zJGVsZW1lbnQgPT09IHZvaWQgMCA/IFwiW2RhdGEtcG9wcGVyLWFycm93XVwiIDogX29wdGlvbnMkZWxlbWVudDtcbiAgICBpZiAoYXJyb3dFbGVtZW50ID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhcnJvd0VsZW1lbnQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGFycm93RWxlbWVudCA9IHN0YXRlLmVsZW1lbnRzLnBvcHBlci5xdWVyeVNlbGVjdG9yKGFycm93RWxlbWVudCk7XG4gICAgICBpZiAoIWFycm93RWxlbWVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0cnVlKSB7XG4gICAgICBpZiAoIWlzSFRNTEVsZW1lbnQoYXJyb3dFbGVtZW50KSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFsnUG9wcGVyOiBcImFycm93XCIgZWxlbWVudCBtdXN0IGJlIGFuIEhUTUxFbGVtZW50IChub3QgYW4gU1ZHRWxlbWVudCkuJywgXCJUbyB1c2UgYW4gU1ZHIGFycm93LCB3cmFwIGl0IGluIGFuIEhUTUxFbGVtZW50IHRoYXQgd2lsbCBiZSB1c2VkIGFzXCIsIFwidGhlIGFycm93LlwiXS5qb2luKFwiIFwiKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghY29udGFpbnMoc3RhdGUuZWxlbWVudHMucG9wcGVyLCBhcnJvd0VsZW1lbnQpKSB7XG4gICAgICBpZiAodHJ1ZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFsnUG9wcGVyOiBcImFycm93XCIgbW9kaWZpZXJcXCdzIGBlbGVtZW50YCBtdXN0IGJlIGEgY2hpbGQgb2YgdGhlIHBvcHBlcicsIFwiZWxlbWVudC5cIl0uam9pbihcIiBcIikpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzdGF0ZS5lbGVtZW50cy5hcnJvdyA9IGFycm93RWxlbWVudDtcbiAgfVxuICB2YXIgYXJyb3ckMSA9IHtcbiAgICBuYW1lOiBcImFycm93XCIsXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICBwaGFzZTogXCJtYWluXCIsXG4gICAgZm46IGFycm93LFxuICAgIGVmZmVjdCxcbiAgICByZXF1aXJlczogW1wicG9wcGVyT2Zmc2V0c1wiXSxcbiAgICByZXF1aXJlc0lmRXhpc3RzOiBbXCJwcmV2ZW50T3ZlcmZsb3dcIl1cbiAgfTtcbiAgZnVuY3Rpb24gZ2V0U2lkZU9mZnNldHMob3ZlcmZsb3csIHJlY3QsIHByZXZlbnRlZE9mZnNldHMpIHtcbiAgICBpZiAocHJldmVudGVkT2Zmc2V0cyA9PT0gdm9pZCAwKSB7XG4gICAgICBwcmV2ZW50ZWRPZmZzZXRzID0ge1xuICAgICAgICB4OiAwLFxuICAgICAgICB5OiAwXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgdG9wOiBvdmVyZmxvdy50b3AgLSByZWN0LmhlaWdodCAtIHByZXZlbnRlZE9mZnNldHMueSxcbiAgICAgIHJpZ2h0OiBvdmVyZmxvdy5yaWdodCAtIHJlY3Qud2lkdGggKyBwcmV2ZW50ZWRPZmZzZXRzLngsXG4gICAgICBib3R0b206IG92ZXJmbG93LmJvdHRvbSAtIHJlY3QuaGVpZ2h0ICsgcHJldmVudGVkT2Zmc2V0cy55LFxuICAgICAgbGVmdDogb3ZlcmZsb3cubGVmdCAtIHJlY3Qud2lkdGggLSBwcmV2ZW50ZWRPZmZzZXRzLnhcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIGlzQW55U2lkZUZ1bGx5Q2xpcHBlZChvdmVyZmxvdykge1xuICAgIHJldHVybiBbdG9wLCByaWdodCwgYm90dG9tLCBsZWZ0XS5zb21lKGZ1bmN0aW9uKHNpZGUpIHtcbiAgICAgIHJldHVybiBvdmVyZmxvd1tzaWRlXSA+PSAwO1xuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIGhpZGUoX3JlZikge1xuICAgIHZhciBzdGF0ZSA9IF9yZWYuc3RhdGUsIG5hbWUgPSBfcmVmLm5hbWU7XG4gICAgdmFyIHJlZmVyZW5jZVJlY3QgPSBzdGF0ZS5yZWN0cy5yZWZlcmVuY2U7XG4gICAgdmFyIHBvcHBlclJlY3QgPSBzdGF0ZS5yZWN0cy5wb3BwZXI7XG4gICAgdmFyIHByZXZlbnRlZE9mZnNldHMgPSBzdGF0ZS5tb2RpZmllcnNEYXRhLnByZXZlbnRPdmVyZmxvdztcbiAgICB2YXIgcmVmZXJlbmNlT3ZlcmZsb3cgPSBkZXRlY3RPdmVyZmxvdyhzdGF0ZSwge1xuICAgICAgZWxlbWVudENvbnRleHQ6IFwicmVmZXJlbmNlXCJcbiAgICB9KTtcbiAgICB2YXIgcG9wcGVyQWx0T3ZlcmZsb3cgPSBkZXRlY3RPdmVyZmxvdyhzdGF0ZSwge1xuICAgICAgYWx0Qm91bmRhcnk6IHRydWVcbiAgICB9KTtcbiAgICB2YXIgcmVmZXJlbmNlQ2xpcHBpbmdPZmZzZXRzID0gZ2V0U2lkZU9mZnNldHMocmVmZXJlbmNlT3ZlcmZsb3csIHJlZmVyZW5jZVJlY3QpO1xuICAgIHZhciBwb3BwZXJFc2NhcGVPZmZzZXRzID0gZ2V0U2lkZU9mZnNldHMocG9wcGVyQWx0T3ZlcmZsb3csIHBvcHBlclJlY3QsIHByZXZlbnRlZE9mZnNldHMpO1xuICAgIHZhciBpc1JlZmVyZW5jZUhpZGRlbiA9IGlzQW55U2lkZUZ1bGx5Q2xpcHBlZChyZWZlcmVuY2VDbGlwcGluZ09mZnNldHMpO1xuICAgIHZhciBoYXNQb3BwZXJFc2NhcGVkID0gaXNBbnlTaWRlRnVsbHlDbGlwcGVkKHBvcHBlckVzY2FwZU9mZnNldHMpO1xuICAgIHN0YXRlLm1vZGlmaWVyc0RhdGFbbmFtZV0gPSB7XG4gICAgICByZWZlcmVuY2VDbGlwcGluZ09mZnNldHMsXG4gICAgICBwb3BwZXJFc2NhcGVPZmZzZXRzLFxuICAgICAgaXNSZWZlcmVuY2VIaWRkZW4sXG4gICAgICBoYXNQb3BwZXJFc2NhcGVkXG4gICAgfTtcbiAgICBzdGF0ZS5hdHRyaWJ1dGVzLnBvcHBlciA9IE9iamVjdC5hc3NpZ24oe30sIHN0YXRlLmF0dHJpYnV0ZXMucG9wcGVyLCB7XG4gICAgICBcImRhdGEtcG9wcGVyLXJlZmVyZW5jZS1oaWRkZW5cIjogaXNSZWZlcmVuY2VIaWRkZW4sXG4gICAgICBcImRhdGEtcG9wcGVyLWVzY2FwZWRcIjogaGFzUG9wcGVyRXNjYXBlZFxuICAgIH0pO1xuICB9XG4gIHZhciBoaWRlJDEgPSB7XG4gICAgbmFtZTogXCJoaWRlXCIsXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICBwaGFzZTogXCJtYWluXCIsXG4gICAgcmVxdWlyZXNJZkV4aXN0czogW1wicHJldmVudE92ZXJmbG93XCJdLFxuICAgIGZuOiBoaWRlXG4gIH07XG4gIHZhciBkZWZhdWx0TW9kaWZpZXJzJDEgPSBbZXZlbnRMaXN0ZW5lcnMsIHBvcHBlck9mZnNldHMkMSwgY29tcHV0ZVN0eWxlcyQxLCBhcHBseVN0eWxlcyQxXTtcbiAgdmFyIGNyZWF0ZVBvcHBlciQxID0gLyogQF9fUFVSRV9fICovIHBvcHBlckdlbmVyYXRvcih7XG4gICAgZGVmYXVsdE1vZGlmaWVyczogZGVmYXVsdE1vZGlmaWVycyQxXG4gIH0pO1xuICB2YXIgZGVmYXVsdE1vZGlmaWVycyA9IFtldmVudExpc3RlbmVycywgcG9wcGVyT2Zmc2V0cyQxLCBjb21wdXRlU3R5bGVzJDEsIGFwcGx5U3R5bGVzJDEsIG9mZnNldCQxLCBmbGlwJDEsIHByZXZlbnRPdmVyZmxvdyQxLCBhcnJvdyQxLCBoaWRlJDFdO1xuICB2YXIgY3JlYXRlUG9wcGVyID0gLyogQF9fUFVSRV9fICovIHBvcHBlckdlbmVyYXRvcih7XG4gICAgZGVmYXVsdE1vZGlmaWVyc1xuICB9KTtcbiAgZXhwb3J0cy5hcHBseVN0eWxlcyA9IGFwcGx5U3R5bGVzJDE7XG4gIGV4cG9ydHMuYXJyb3cgPSBhcnJvdyQxO1xuICBleHBvcnRzLmNvbXB1dGVTdHlsZXMgPSBjb21wdXRlU3R5bGVzJDE7XG4gIGV4cG9ydHMuY3JlYXRlUG9wcGVyID0gY3JlYXRlUG9wcGVyO1xuICBleHBvcnRzLmNyZWF0ZVBvcHBlckxpdGUgPSBjcmVhdGVQb3BwZXIkMTtcbiAgZXhwb3J0cy5kZWZhdWx0TW9kaWZpZXJzID0gZGVmYXVsdE1vZGlmaWVycztcbiAgZXhwb3J0cy5kZXRlY3RPdmVyZmxvdyA9IGRldGVjdE92ZXJmbG93O1xuICBleHBvcnRzLmV2ZW50TGlzdGVuZXJzID0gZXZlbnRMaXN0ZW5lcnM7XG4gIGV4cG9ydHMuZmxpcCA9IGZsaXAkMTtcbiAgZXhwb3J0cy5oaWRlID0gaGlkZSQxO1xuICBleHBvcnRzLm9mZnNldCA9IG9mZnNldCQxO1xuICBleHBvcnRzLnBvcHBlckdlbmVyYXRvciA9IHBvcHBlckdlbmVyYXRvcjtcbiAgZXhwb3J0cy5wb3BwZXJPZmZzZXRzID0gcG9wcGVyT2Zmc2V0cyQxO1xuICBleHBvcnRzLnByZXZlbnRPdmVyZmxvdyA9IHByZXZlbnRPdmVyZmxvdyQxO1xufSk7XG5cbi8vIG5vZGVfbW9kdWxlcy90aXBweS5qcy9kaXN0L3RpcHB5LmNqcy5qc1xudmFyIHJlcXVpcmVfdGlwcHlfY2pzID0gX19jb21tb25KUygoZXhwb3J0cykgPT4ge1xuICBcInVzZSBzdHJpY3RcIjtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7dmFsdWU6IHRydWV9KTtcbiAgdmFyIGNvcmUgPSByZXF1aXJlX3BvcHBlcigpO1xuICB2YXIgUk9VTkRfQVJST1cgPSAnPHN2ZyB3aWR0aD1cIjE2XCIgaGVpZ2h0PVwiNlwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIj48cGF0aCBkPVwiTTAgNnMxLjc5Ni0uMDEzIDQuNjctMy42MTVDNS44NTEuOSA2LjkzLjAwNiA4IDBjMS4wNy0uMDA2IDIuMTQ4Ljg4NyAzLjM0MyAyLjM4NUMxNC4yMzMgNi4wMDUgMTYgNiAxNiA2SDB6XCI+PC9zdmc+JztcbiAgdmFyIEJPWF9DTEFTUyA9IFwidGlwcHktYm94XCI7XG4gIHZhciBDT05URU5UX0NMQVNTID0gXCJ0aXBweS1jb250ZW50XCI7XG4gIHZhciBCQUNLRFJPUF9DTEFTUyA9IFwidGlwcHktYmFja2Ryb3BcIjtcbiAgdmFyIEFSUk9XX0NMQVNTID0gXCJ0aXBweS1hcnJvd1wiO1xuICB2YXIgU1ZHX0FSUk9XX0NMQVNTID0gXCJ0aXBweS1zdmctYXJyb3dcIjtcbiAgdmFyIFRPVUNIX09QVElPTlMgPSB7XG4gICAgcGFzc2l2ZTogdHJ1ZSxcbiAgICBjYXB0dXJlOiB0cnVlXG4gIH07XG4gIGZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIHt9Lmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpO1xuICB9XG4gIGZ1bmN0aW9uIGdldFZhbHVlQXRJbmRleE9yUmV0dXJuKHZhbHVlLCBpbmRleCwgZGVmYXVsdFZhbHVlKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICB2YXIgdiA9IHZhbHVlW2luZGV4XTtcbiAgICAgIHJldHVybiB2ID09IG51bGwgPyBBcnJheS5pc0FycmF5KGRlZmF1bHRWYWx1ZSkgPyBkZWZhdWx0VmFsdWVbaW5kZXhdIDogZGVmYXVsdFZhbHVlIDogdjtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIGZ1bmN0aW9uIGlzVHlwZSh2YWx1ZSwgdHlwZSkge1xuICAgIHZhciBzdHIgPSB7fS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgICByZXR1cm4gc3RyLmluZGV4T2YoXCJbb2JqZWN0XCIpID09PSAwICYmIHN0ci5pbmRleE9mKHR5cGUgKyBcIl1cIikgPiAtMTtcbiAgfVxuICBmdW5jdGlvbiBpbnZva2VXaXRoQXJnc09yUmV0dXJuKHZhbHVlLCBhcmdzKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiID8gdmFsdWUuYXBwbHkodm9pZCAwLCBhcmdzKSA6IHZhbHVlO1xuICB9XG4gIGZ1bmN0aW9uIGRlYm91bmNlKGZuLCBtcykge1xuICAgIGlmIChtcyA9PT0gMCkge1xuICAgICAgcmV0dXJuIGZuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dDtcbiAgICByZXR1cm4gZnVuY3Rpb24oYXJnKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgZm4oYXJnKTtcbiAgICAgIH0sIG1zKTtcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIHJlbW92ZVByb3BlcnRpZXMob2JqLCBrZXlzKSB7XG4gICAgdmFyIGNsb25lID0gT2JqZWN0LmFzc2lnbih7fSwgb2JqKTtcbiAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICBkZWxldGUgY2xvbmVba2V5XTtcbiAgICB9KTtcbiAgICByZXR1cm4gY2xvbmU7XG4gIH1cbiAgZnVuY3Rpb24gc3BsaXRCeVNwYWNlcyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS5zcGxpdCgvXFxzKy8pLmZpbHRlcihCb29sZWFuKTtcbiAgfVxuICBmdW5jdGlvbiBub3JtYWxpemVUb0FycmF5KHZhbHVlKSB7XG4gICAgcmV0dXJuIFtdLmNvbmNhdCh2YWx1ZSk7XG4gIH1cbiAgZnVuY3Rpb24gcHVzaElmVW5pcXVlKGFyciwgdmFsdWUpIHtcbiAgICBpZiAoYXJyLmluZGV4T2YodmFsdWUpID09PSAtMSkge1xuICAgICAgYXJyLnB1c2godmFsdWUpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiB1bmlxdWUoYXJyKSB7XG4gICAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24oaXRlbSwgaW5kZXgpIHtcbiAgICAgIHJldHVybiBhcnIuaW5kZXhPZihpdGVtKSA9PT0gaW5kZXg7XG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0QmFzZVBsYWNlbWVudChwbGFjZW1lbnQpIHtcbiAgICByZXR1cm4gcGxhY2VtZW50LnNwbGl0KFwiLVwiKVswXTtcbiAgfVxuICBmdW5jdGlvbiBhcnJheUZyb20odmFsdWUpIHtcbiAgICByZXR1cm4gW10uc2xpY2UuY2FsbCh2YWx1ZSk7XG4gIH1cbiAgZnVuY3Rpb24gcmVtb3ZlVW5kZWZpbmVkUHJvcHMob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikucmVkdWNlKGZ1bmN0aW9uKGFjYywga2V5KSB7XG4gICAgICBpZiAob2JqW2tleV0gIT09IHZvaWQgMCkge1xuICAgICAgICBhY2Nba2V5XSA9IG9ialtrZXldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCB7fSk7XG4gIH1cbiAgZnVuY3Rpb24gZGl2KCkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB9XG4gIGZ1bmN0aW9uIGlzRWxlbWVudCh2YWx1ZSkge1xuICAgIHJldHVybiBbXCJFbGVtZW50XCIsIFwiRnJhZ21lbnRcIl0uc29tZShmdW5jdGlvbih0eXBlKSB7XG4gICAgICByZXR1cm4gaXNUeXBlKHZhbHVlLCB0eXBlKTtcbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBpc05vZGVMaXN0KHZhbHVlKSB7XG4gICAgcmV0dXJuIGlzVHlwZSh2YWx1ZSwgXCJOb2RlTGlzdFwiKTtcbiAgfVxuICBmdW5jdGlvbiBpc01vdXNlRXZlbnQodmFsdWUpIHtcbiAgICByZXR1cm4gaXNUeXBlKHZhbHVlLCBcIk1vdXNlRXZlbnRcIik7XG4gIH1cbiAgZnVuY3Rpb24gaXNSZWZlcmVuY2VFbGVtZW50KHZhbHVlKSB7XG4gICAgcmV0dXJuICEhKHZhbHVlICYmIHZhbHVlLl90aXBweSAmJiB2YWx1ZS5fdGlwcHkucmVmZXJlbmNlID09PSB2YWx1ZSk7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0QXJyYXlPZkVsZW1lbnRzKHZhbHVlKSB7XG4gICAgaWYgKGlzRWxlbWVudCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBbdmFsdWVdO1xuICAgIH1cbiAgICBpZiAoaXNOb2RlTGlzdCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBhcnJheUZyb20odmFsdWUpO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5RnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHZhbHVlKSk7XG4gIH1cbiAgZnVuY3Rpb24gc2V0VHJhbnNpdGlvbkR1cmF0aW9uKGVscywgdmFsdWUpIHtcbiAgICBlbHMuZm9yRWFjaChmdW5jdGlvbihlbCkge1xuICAgICAgaWYgKGVsKSB7XG4gICAgICAgIGVsLnN0eWxlLnRyYW5zaXRpb25EdXJhdGlvbiA9IHZhbHVlICsgXCJtc1wiO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGZ1bmN0aW9uIHNldFZpc2liaWxpdHlTdGF0ZShlbHMsIHN0YXRlKSB7XG4gICAgZWxzLmZvckVhY2goZnVuY3Rpb24oZWwpIHtcbiAgICAgIGlmIChlbCkge1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJkYXRhLXN0YXRlXCIsIHN0YXRlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBmdW5jdGlvbiBnZXRPd25lckRvY3VtZW50KGVsZW1lbnRPckVsZW1lbnRzKSB7XG4gICAgdmFyIF9lbGVtZW50JG93bmVyRG9jdW1lbjtcbiAgICB2YXIgX25vcm1hbGl6ZVRvQXJyYXkgPSBub3JtYWxpemVUb0FycmF5KGVsZW1lbnRPckVsZW1lbnRzKSwgZWxlbWVudCA9IF9ub3JtYWxpemVUb0FycmF5WzBdO1xuICAgIHJldHVybiAoZWxlbWVudCA9PSBudWxsID8gdm9pZCAwIDogKF9lbGVtZW50JG93bmVyRG9jdW1lbiA9IGVsZW1lbnQub3duZXJEb2N1bWVudCkgPT0gbnVsbCA/IHZvaWQgMCA6IF9lbGVtZW50JG93bmVyRG9jdW1lbi5ib2R5KSA/IGVsZW1lbnQub3duZXJEb2N1bWVudCA6IGRvY3VtZW50O1xuICB9XG4gIGZ1bmN0aW9uIGlzQ3Vyc29yT3V0c2lkZUludGVyYWN0aXZlQm9yZGVyKHBvcHBlclRyZWVEYXRhLCBldmVudCkge1xuICAgIHZhciBjbGllbnRYID0gZXZlbnQuY2xpZW50WCwgY2xpZW50WSA9IGV2ZW50LmNsaWVudFk7XG4gICAgcmV0dXJuIHBvcHBlclRyZWVEYXRhLmV2ZXJ5KGZ1bmN0aW9uKF9yZWYpIHtcbiAgICAgIHZhciBwb3BwZXJSZWN0ID0gX3JlZi5wb3BwZXJSZWN0LCBwb3BwZXJTdGF0ZSA9IF9yZWYucG9wcGVyU3RhdGUsIHByb3BzID0gX3JlZi5wcm9wcztcbiAgICAgIHZhciBpbnRlcmFjdGl2ZUJvcmRlciA9IHByb3BzLmludGVyYWN0aXZlQm9yZGVyO1xuICAgICAgdmFyIGJhc2VQbGFjZW1lbnQgPSBnZXRCYXNlUGxhY2VtZW50KHBvcHBlclN0YXRlLnBsYWNlbWVudCk7XG4gICAgICB2YXIgb2Zmc2V0RGF0YSA9IHBvcHBlclN0YXRlLm1vZGlmaWVyc0RhdGEub2Zmc2V0O1xuICAgICAgaWYgKCFvZmZzZXREYXRhKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgdmFyIHRvcERpc3RhbmNlID0gYmFzZVBsYWNlbWVudCA9PT0gXCJib3R0b21cIiA/IG9mZnNldERhdGEudG9wLnkgOiAwO1xuICAgICAgdmFyIGJvdHRvbURpc3RhbmNlID0gYmFzZVBsYWNlbWVudCA9PT0gXCJ0b3BcIiA/IG9mZnNldERhdGEuYm90dG9tLnkgOiAwO1xuICAgICAgdmFyIGxlZnREaXN0YW5jZSA9IGJhc2VQbGFjZW1lbnQgPT09IFwicmlnaHRcIiA/IG9mZnNldERhdGEubGVmdC54IDogMDtcbiAgICAgIHZhciByaWdodERpc3RhbmNlID0gYmFzZVBsYWNlbWVudCA9PT0gXCJsZWZ0XCIgPyBvZmZzZXREYXRhLnJpZ2h0LnggOiAwO1xuICAgICAgdmFyIGV4Y2VlZHNUb3AgPSBwb3BwZXJSZWN0LnRvcCAtIGNsaWVudFkgKyB0b3BEaXN0YW5jZSA+IGludGVyYWN0aXZlQm9yZGVyO1xuICAgICAgdmFyIGV4Y2VlZHNCb3R0b20gPSBjbGllbnRZIC0gcG9wcGVyUmVjdC5ib3R0b20gLSBib3R0b21EaXN0YW5jZSA+IGludGVyYWN0aXZlQm9yZGVyO1xuICAgICAgdmFyIGV4Y2VlZHNMZWZ0ID0gcG9wcGVyUmVjdC5sZWZ0IC0gY2xpZW50WCArIGxlZnREaXN0YW5jZSA+IGludGVyYWN0aXZlQm9yZGVyO1xuICAgICAgdmFyIGV4Y2VlZHNSaWdodCA9IGNsaWVudFggLSBwb3BwZXJSZWN0LnJpZ2h0IC0gcmlnaHREaXN0YW5jZSA+IGludGVyYWN0aXZlQm9yZGVyO1xuICAgICAgcmV0dXJuIGV4Y2VlZHNUb3AgfHwgZXhjZWVkc0JvdHRvbSB8fCBleGNlZWRzTGVmdCB8fCBleGNlZWRzUmlnaHQ7XG4gICAgfSk7XG4gIH1cbiAgZnVuY3Rpb24gdXBkYXRlVHJhbnNpdGlvbkVuZExpc3RlbmVyKGJveCwgYWN0aW9uLCBsaXN0ZW5lcikge1xuICAgIHZhciBtZXRob2QgPSBhY3Rpb24gKyBcIkV2ZW50TGlzdGVuZXJcIjtcbiAgICBbXCJ0cmFuc2l0aW9uZW5kXCIsIFwid2Via2l0VHJhbnNpdGlvbkVuZFwiXS5mb3JFYWNoKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBib3hbbWV0aG9kXShldmVudCwgbGlzdGVuZXIpO1xuICAgIH0pO1xuICB9XG4gIHZhciBjdXJyZW50SW5wdXQgPSB7XG4gICAgaXNUb3VjaDogZmFsc2VcbiAgfTtcbiAgdmFyIGxhc3RNb3VzZU1vdmVUaW1lID0gMDtcbiAgZnVuY3Rpb24gb25Eb2N1bWVudFRvdWNoU3RhcnQoKSB7XG4gICAgaWYgKGN1cnJlbnRJbnB1dC5pc1RvdWNoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGN1cnJlbnRJbnB1dC5pc1RvdWNoID0gdHJ1ZTtcbiAgICBpZiAod2luZG93LnBlcmZvcm1hbmNlKSB7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG9uRG9jdW1lbnRNb3VzZU1vdmUpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBvbkRvY3VtZW50TW91c2VNb3ZlKCkge1xuICAgIHZhciBub3cgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICBpZiAobm93IC0gbGFzdE1vdXNlTW92ZVRpbWUgPCAyMCkge1xuICAgICAgY3VycmVudElucHV0LmlzVG91Y2ggPSBmYWxzZTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgb25Eb2N1bWVudE1vdXNlTW92ZSk7XG4gICAgfVxuICAgIGxhc3RNb3VzZU1vdmVUaW1lID0gbm93O1xuICB9XG4gIGZ1bmN0aW9uIG9uV2luZG93Qmx1cigpIHtcbiAgICB2YXIgYWN0aXZlRWxlbWVudCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKGlzUmVmZXJlbmNlRWxlbWVudChhY3RpdmVFbGVtZW50KSkge1xuICAgICAgdmFyIGluc3RhbmNlID0gYWN0aXZlRWxlbWVudC5fdGlwcHk7XG4gICAgICBpZiAoYWN0aXZlRWxlbWVudC5ibHVyICYmICFpbnN0YW5jZS5zdGF0ZS5pc1Zpc2libGUpIHtcbiAgICAgICAgYWN0aXZlRWxlbWVudC5ibHVyKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGJpbmRHbG9iYWxFdmVudExpc3RlbmVycygpIHtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCBvbkRvY3VtZW50VG91Y2hTdGFydCwgVE9VQ0hfT1BUSU9OUyk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsIG9uV2luZG93Qmx1cik7XG4gIH1cbiAgdmFyIGlzQnJvd3NlciA9IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIGRvY3VtZW50ICE9PSBcInVuZGVmaW5lZFwiO1xuICB2YXIgdWEgPSBpc0Jyb3dzZXIgPyBuYXZpZ2F0b3IudXNlckFnZW50IDogXCJcIjtcbiAgdmFyIGlzSUUgPSAvTVNJRSB8VHJpZGVudFxcLy8udGVzdCh1YSk7XG4gIGZ1bmN0aW9uIGNyZWF0ZU1lbW9yeUxlYWtXYXJuaW5nKG1ldGhvZCkge1xuICAgIHZhciB0eHQgPSBtZXRob2QgPT09IFwiZGVzdHJveVwiID8gXCJuIGFscmVhZHktXCIgOiBcIiBcIjtcbiAgICByZXR1cm4gW21ldGhvZCArIFwiKCkgd2FzIGNhbGxlZCBvbiBhXCIgKyB0eHQgKyBcImRlc3Ryb3llZCBpbnN0YW5jZS4gVGhpcyBpcyBhIG5vLW9wIGJ1dFwiLCBcImluZGljYXRlcyBhIHBvdGVudGlhbCBtZW1vcnkgbGVhay5cIl0uam9pbihcIiBcIik7XG4gIH1cbiAgZnVuY3Rpb24gY2xlYW4odmFsdWUpIHtcbiAgICB2YXIgc3BhY2VzQW5kVGFicyA9IC9bIFxcdF17Mix9L2c7XG4gICAgdmFyIGxpbmVTdGFydFdpdGhTcGFjZXMgPSAvXlsgXFx0XSovZ207XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2Uoc3BhY2VzQW5kVGFicywgXCIgXCIpLnJlcGxhY2UobGluZVN0YXJ0V2l0aFNwYWNlcywgXCJcIikudHJpbSgpO1xuICB9XG4gIGZ1bmN0aW9uIGdldERldk1lc3NhZ2UobWVzc2FnZSkge1xuICAgIHJldHVybiBjbGVhbihcIlxcbiAgJWN0aXBweS5qc1xcblxcbiAgJWNcIiArIGNsZWFuKG1lc3NhZ2UpICsgXCJcXG5cXG4gICVjXFx1ezFGNDc3fVxcdTIwMEQgVGhpcyBpcyBhIGRldmVsb3BtZW50LW9ubHkgbWVzc2FnZS4gSXQgd2lsbCBiZSByZW1vdmVkIGluIHByb2R1Y3Rpb24uXFxuICBcIik7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0Rm9ybWF0dGVkTWVzc2FnZShtZXNzYWdlKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIGdldERldk1lc3NhZ2UobWVzc2FnZSksXG4gICAgICBcImNvbG9yOiAjMDBDNTg0OyBmb250LXNpemU6IDEuM2VtOyBmb250LXdlaWdodDogYm9sZDtcIixcbiAgICAgIFwibGluZS1oZWlnaHQ6IDEuNVwiLFxuICAgICAgXCJjb2xvcjogI2E2YTA5NTtcIlxuICAgIF07XG4gIH1cbiAgdmFyIHZpc2l0ZWRNZXNzYWdlcztcbiAgaWYgKHRydWUpIHtcbiAgICByZXNldFZpc2l0ZWRNZXNzYWdlcygpO1xuICB9XG4gIGZ1bmN0aW9uIHJlc2V0VmlzaXRlZE1lc3NhZ2VzKCkge1xuICAgIHZpc2l0ZWRNZXNzYWdlcyA9IG5ldyBTZXQoKTtcbiAgfVxuICBmdW5jdGlvbiB3YXJuV2hlbihjb25kaXRpb24sIG1lc3NhZ2UpIHtcbiAgICBpZiAoY29uZGl0aW9uICYmICF2aXNpdGVkTWVzc2FnZXMuaGFzKG1lc3NhZ2UpKSB7XG4gICAgICB2YXIgX2NvbnNvbGU7XG4gICAgICB2aXNpdGVkTWVzc2FnZXMuYWRkKG1lc3NhZ2UpO1xuICAgICAgKF9jb25zb2xlID0gY29uc29sZSkud2Fybi5hcHBseShfY29uc29sZSwgZ2V0Rm9ybWF0dGVkTWVzc2FnZShtZXNzYWdlKSk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGVycm9yV2hlbihjb25kaXRpb24sIG1lc3NhZ2UpIHtcbiAgICBpZiAoY29uZGl0aW9uICYmICF2aXNpdGVkTWVzc2FnZXMuaGFzKG1lc3NhZ2UpKSB7XG4gICAgICB2YXIgX2NvbnNvbGUyO1xuICAgICAgdmlzaXRlZE1lc3NhZ2VzLmFkZChtZXNzYWdlKTtcbiAgICAgIChfY29uc29sZTIgPSBjb25zb2xlKS5lcnJvci5hcHBseShfY29uc29sZTIsIGdldEZvcm1hdHRlZE1lc3NhZ2UobWVzc2FnZSkpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiB2YWxpZGF0ZVRhcmdldHModGFyZ2V0cykge1xuICAgIHZhciBkaWRQYXNzRmFsc3lWYWx1ZSA9ICF0YXJnZXRzO1xuICAgIHZhciBkaWRQYXNzUGxhaW5PYmplY3QgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodGFyZ2V0cykgPT09IFwiW29iamVjdCBPYmplY3RdXCIgJiYgIXRhcmdldHMuYWRkRXZlbnRMaXN0ZW5lcjtcbiAgICBlcnJvcldoZW4oZGlkUGFzc0ZhbHN5VmFsdWUsIFtcInRpcHB5KCkgd2FzIHBhc3NlZFwiLCBcImBcIiArIFN0cmluZyh0YXJnZXRzKSArIFwiYFwiLCBcImFzIGl0cyB0YXJnZXRzIChmaXJzdCkgYXJndW1lbnQuIFZhbGlkIHR5cGVzIGFyZTogU3RyaW5nLCBFbGVtZW50LFwiLCBcIkVsZW1lbnRbXSwgb3IgTm9kZUxpc3QuXCJdLmpvaW4oXCIgXCIpKTtcbiAgICBlcnJvcldoZW4oZGlkUGFzc1BsYWluT2JqZWN0LCBbXCJ0aXBweSgpIHdhcyBwYXNzZWQgYSBwbGFpbiBvYmplY3Qgd2hpY2ggaXMgbm90IHN1cHBvcnRlZCBhcyBhbiBhcmd1bWVudFwiLCBcImZvciB2aXJ0dWFsIHBvc2l0aW9uaW5nLiBVc2UgcHJvcHMuZ2V0UmVmZXJlbmNlQ2xpZW50UmVjdCBpbnN0ZWFkLlwiXS5qb2luKFwiIFwiKSk7XG4gIH1cbiAgdmFyIHBsdWdpblByb3BzID0ge1xuICAgIGFuaW1hdGVGaWxsOiBmYWxzZSxcbiAgICBmb2xsb3dDdXJzb3I6IGZhbHNlLFxuICAgIGlubGluZVBvc2l0aW9uaW5nOiBmYWxzZSxcbiAgICBzdGlja3k6IGZhbHNlXG4gIH07XG4gIHZhciByZW5kZXJQcm9wcyA9IHtcbiAgICBhbGxvd0hUTUw6IGZhbHNlLFxuICAgIGFuaW1hdGlvbjogXCJmYWRlXCIsXG4gICAgYXJyb3c6IHRydWUsXG4gICAgY29udGVudDogXCJcIixcbiAgICBpbmVydGlhOiBmYWxzZSxcbiAgICBtYXhXaWR0aDogMzUwLFxuICAgIHJvbGU6IFwidG9vbHRpcFwiLFxuICAgIHRoZW1lOiBcIlwiLFxuICAgIHpJbmRleDogOTk5OVxuICB9O1xuICB2YXIgZGVmYXVsdFByb3BzID0gT2JqZWN0LmFzc2lnbih7XG4gICAgYXBwZW5kVG86IGZ1bmN0aW9uIGFwcGVuZFRvKCkge1xuICAgICAgcmV0dXJuIGRvY3VtZW50LmJvZHk7XG4gICAgfSxcbiAgICBhcmlhOiB7XG4gICAgICBjb250ZW50OiBcImF1dG9cIixcbiAgICAgIGV4cGFuZGVkOiBcImF1dG9cIlxuICAgIH0sXG4gICAgZGVsYXk6IDAsXG4gICAgZHVyYXRpb246IFszMDAsIDI1MF0sXG4gICAgZ2V0UmVmZXJlbmNlQ2xpZW50UmVjdDogbnVsbCxcbiAgICBoaWRlT25DbGljazogdHJ1ZSxcbiAgICBpZ25vcmVBdHRyaWJ1dGVzOiBmYWxzZSxcbiAgICBpbnRlcmFjdGl2ZTogZmFsc2UsXG4gICAgaW50ZXJhY3RpdmVCb3JkZXI6IDIsXG4gICAgaW50ZXJhY3RpdmVEZWJvdW5jZTogMCxcbiAgICBtb3ZlVHJhbnNpdGlvbjogXCJcIixcbiAgICBvZmZzZXQ6IFswLCAxMF0sXG4gICAgb25BZnRlclVwZGF0ZTogZnVuY3Rpb24gb25BZnRlclVwZGF0ZSgpIHtcbiAgICB9LFxuICAgIG9uQmVmb3JlVXBkYXRlOiBmdW5jdGlvbiBvbkJlZm9yZVVwZGF0ZSgpIHtcbiAgICB9LFxuICAgIG9uQ3JlYXRlOiBmdW5jdGlvbiBvbkNyZWF0ZSgpIHtcbiAgICB9LFxuICAgIG9uRGVzdHJveTogZnVuY3Rpb24gb25EZXN0cm95KCkge1xuICAgIH0sXG4gICAgb25IaWRkZW46IGZ1bmN0aW9uIG9uSGlkZGVuKCkge1xuICAgIH0sXG4gICAgb25IaWRlOiBmdW5jdGlvbiBvbkhpZGUoKSB7XG4gICAgfSxcbiAgICBvbk1vdW50OiBmdW5jdGlvbiBvbk1vdW50KCkge1xuICAgIH0sXG4gICAgb25TaG93OiBmdW5jdGlvbiBvblNob3coKSB7XG4gICAgfSxcbiAgICBvblNob3duOiBmdW5jdGlvbiBvblNob3duKCkge1xuICAgIH0sXG4gICAgb25UcmlnZ2VyOiBmdW5jdGlvbiBvblRyaWdnZXIoKSB7XG4gICAgfSxcbiAgICBvblVudHJpZ2dlcjogZnVuY3Rpb24gb25VbnRyaWdnZXIoKSB7XG4gICAgfSxcbiAgICBvbkNsaWNrT3V0c2lkZTogZnVuY3Rpb24gb25DbGlja091dHNpZGUoKSB7XG4gICAgfSxcbiAgICBwbGFjZW1lbnQ6IFwidG9wXCIsXG4gICAgcGx1Z2luczogW10sXG4gICAgcG9wcGVyT3B0aW9uczoge30sXG4gICAgcmVuZGVyOiBudWxsLFxuICAgIHNob3dPbkNyZWF0ZTogZmFsc2UsXG4gICAgdG91Y2g6IHRydWUsXG4gICAgdHJpZ2dlcjogXCJtb3VzZWVudGVyIGZvY3VzXCIsXG4gICAgdHJpZ2dlclRhcmdldDogbnVsbFxuICB9LCBwbHVnaW5Qcm9wcywge30sIHJlbmRlclByb3BzKTtcbiAgdmFyIGRlZmF1bHRLZXlzID0gT2JqZWN0LmtleXMoZGVmYXVsdFByb3BzKTtcbiAgdmFyIHNldERlZmF1bHRQcm9wcyA9IGZ1bmN0aW9uIHNldERlZmF1bHRQcm9wczIocGFydGlhbFByb3BzKSB7XG4gICAgaWYgKHRydWUpIHtcbiAgICAgIHZhbGlkYXRlUHJvcHMocGFydGlhbFByb3BzLCBbXSk7XG4gICAgfVxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMocGFydGlhbFByb3BzKTtcbiAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICBkZWZhdWx0UHJvcHNba2V5XSA9IHBhcnRpYWxQcm9wc1trZXldO1xuICAgIH0pO1xuICB9O1xuICBmdW5jdGlvbiBnZXRFeHRlbmRlZFBhc3NlZFByb3BzKHBhc3NlZFByb3BzKSB7XG4gICAgdmFyIHBsdWdpbnMgPSBwYXNzZWRQcm9wcy5wbHVnaW5zIHx8IFtdO1xuICAgIHZhciBwbHVnaW5Qcm9wczIgPSBwbHVnaW5zLnJlZHVjZShmdW5jdGlvbihhY2MsIHBsdWdpbikge1xuICAgICAgdmFyIG5hbWUgPSBwbHVnaW4ubmFtZSwgZGVmYXVsdFZhbHVlID0gcGx1Z2luLmRlZmF1bHRWYWx1ZTtcbiAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgIGFjY1tuYW1lXSA9IHBhc3NlZFByb3BzW25hbWVdICE9PSB2b2lkIDAgPyBwYXNzZWRQcm9wc1tuYW1lXSA6IGRlZmF1bHRWYWx1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSwge30pO1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBwYXNzZWRQcm9wcywge30sIHBsdWdpblByb3BzMik7XG4gIH1cbiAgZnVuY3Rpb24gZ2V0RGF0YUF0dHJpYnV0ZVByb3BzKHJlZmVyZW5jZSwgcGx1Z2lucykge1xuICAgIHZhciBwcm9wS2V5cyA9IHBsdWdpbnMgPyBPYmplY3Qua2V5cyhnZXRFeHRlbmRlZFBhc3NlZFByb3BzKE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRQcm9wcywge1xuICAgICAgcGx1Z2luc1xuICAgIH0pKSkgOiBkZWZhdWx0S2V5cztcbiAgICB2YXIgcHJvcHMgPSBwcm9wS2V5cy5yZWR1Y2UoZnVuY3Rpb24oYWNjLCBrZXkpIHtcbiAgICAgIHZhciB2YWx1ZUFzU3RyaW5nID0gKHJlZmVyZW5jZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLXRpcHB5LVwiICsga2V5KSB8fCBcIlwiKS50cmltKCk7XG4gICAgICBpZiAoIXZhbHVlQXNTdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH1cbiAgICAgIGlmIChrZXkgPT09IFwiY29udGVudFwiKSB7XG4gICAgICAgIGFjY1trZXldID0gdmFsdWVBc1N0cmluZztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYWNjW2tleV0gPSBKU09OLnBhcnNlKHZhbHVlQXNTdHJpbmcpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgYWNjW2tleV0gPSB2YWx1ZUFzU3RyaW5nO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gYWNjO1xuICAgIH0sIHt9KTtcbiAgICByZXR1cm4gcHJvcHM7XG4gIH1cbiAgZnVuY3Rpb24gZXZhbHVhdGVQcm9wcyhyZWZlcmVuY2UsIHByb3BzKSB7XG4gICAgdmFyIG91dCA9IE9iamVjdC5hc3NpZ24oe30sIHByb3BzLCB7XG4gICAgICBjb250ZW50OiBpbnZva2VXaXRoQXJnc09yUmV0dXJuKHByb3BzLmNvbnRlbnQsIFtyZWZlcmVuY2VdKVxuICAgIH0sIHByb3BzLmlnbm9yZUF0dHJpYnV0ZXMgPyB7fSA6IGdldERhdGFBdHRyaWJ1dGVQcm9wcyhyZWZlcmVuY2UsIHByb3BzLnBsdWdpbnMpKTtcbiAgICBvdXQuYXJpYSA9IE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRQcm9wcy5hcmlhLCB7fSwgb3V0LmFyaWEpO1xuICAgIG91dC5hcmlhID0ge1xuICAgICAgZXhwYW5kZWQ6IG91dC5hcmlhLmV4cGFuZGVkID09PSBcImF1dG9cIiA/IHByb3BzLmludGVyYWN0aXZlIDogb3V0LmFyaWEuZXhwYW5kZWQsXG4gICAgICBjb250ZW50OiBvdXQuYXJpYS5jb250ZW50ID09PSBcImF1dG9cIiA/IHByb3BzLmludGVyYWN0aXZlID8gbnVsbCA6IFwiZGVzY3JpYmVkYnlcIiA6IG91dC5hcmlhLmNvbnRlbnRcbiAgICB9O1xuICAgIHJldHVybiBvdXQ7XG4gIH1cbiAgZnVuY3Rpb24gdmFsaWRhdGVQcm9wcyhwYXJ0aWFsUHJvcHMsIHBsdWdpbnMpIHtcbiAgICBpZiAocGFydGlhbFByb3BzID09PSB2b2lkIDApIHtcbiAgICAgIHBhcnRpYWxQcm9wcyA9IHt9O1xuICAgIH1cbiAgICBpZiAocGx1Z2lucyA9PT0gdm9pZCAwKSB7XG4gICAgICBwbHVnaW5zID0gW107XG4gICAgfVxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMocGFydGlhbFByb3BzKTtcbiAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24ocHJvcCkge1xuICAgICAgdmFyIG5vblBsdWdpblByb3BzID0gcmVtb3ZlUHJvcGVydGllcyhkZWZhdWx0UHJvcHMsIE9iamVjdC5rZXlzKHBsdWdpblByb3BzKSk7XG4gICAgICB2YXIgZGlkUGFzc1Vua25vd25Qcm9wID0gIWhhc093blByb3BlcnR5KG5vblBsdWdpblByb3BzLCBwcm9wKTtcbiAgICAgIGlmIChkaWRQYXNzVW5rbm93blByb3ApIHtcbiAgICAgICAgZGlkUGFzc1Vua25vd25Qcm9wID0gcGx1Z2lucy5maWx0ZXIoZnVuY3Rpb24ocGx1Z2luKSB7XG4gICAgICAgICAgcmV0dXJuIHBsdWdpbi5uYW1lID09PSBwcm9wO1xuICAgICAgICB9KS5sZW5ndGggPT09IDA7XG4gICAgICB9XG4gICAgICB3YXJuV2hlbihkaWRQYXNzVW5rbm93blByb3AsIFtcImBcIiArIHByb3AgKyBcImBcIiwgXCJpcyBub3QgYSB2YWxpZCBwcm9wLiBZb3UgbWF5IGhhdmUgc3BlbGxlZCBpdCBpbmNvcnJlY3RseSwgb3IgaWYgaXQnc1wiLCBcImEgcGx1Z2luLCBmb3Jnb3QgdG8gcGFzcyBpdCBpbiBhbiBhcnJheSBhcyBwcm9wcy5wbHVnaW5zLlwiLCBcIlxcblxcblwiLCBcIkFsbCBwcm9wczogaHR0cHM6Ly9hdG9taWtzLmdpdGh1Yi5pby90aXBweWpzL3Y2L2FsbC1wcm9wcy9cXG5cIiwgXCJQbHVnaW5zOiBodHRwczovL2F0b21pa3MuZ2l0aHViLmlvL3RpcHB5anMvdjYvcGx1Z2lucy9cIl0uam9pbihcIiBcIikpO1xuICAgIH0pO1xuICB9XG4gIHZhciBpbm5lckhUTUwgPSBmdW5jdGlvbiBpbm5lckhUTUwyKCkge1xuICAgIHJldHVybiBcImlubmVySFRNTFwiO1xuICB9O1xuICBmdW5jdGlvbiBkYW5nZXJvdXNseVNldElubmVySFRNTChlbGVtZW50LCBodG1sKSB7XG4gICAgZWxlbWVudFtpbm5lckhUTUwoKV0gPSBodG1sO1xuICB9XG4gIGZ1bmN0aW9uIGNyZWF0ZUFycm93RWxlbWVudCh2YWx1ZSkge1xuICAgIHZhciBhcnJvdyA9IGRpdigpO1xuICAgIGlmICh2YWx1ZSA9PT0gdHJ1ZSkge1xuICAgICAgYXJyb3cuY2xhc3NOYW1lID0gQVJST1dfQ0xBU1M7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFycm93LmNsYXNzTmFtZSA9IFNWR19BUlJPV19DTEFTUztcbiAgICAgIGlmIChpc0VsZW1lbnQodmFsdWUpKSB7XG4gICAgICAgIGFycm93LmFwcGVuZENoaWxkKHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MKGFycm93LCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcnJvdztcbiAgfVxuICBmdW5jdGlvbiBzZXRDb250ZW50KGNvbnRlbnQsIHByb3BzKSB7XG4gICAgaWYgKGlzRWxlbWVudChwcm9wcy5jb250ZW50KSkge1xuICAgICAgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUwoY29udGVudCwgXCJcIik7XG4gICAgICBjb250ZW50LmFwcGVuZENoaWxkKHByb3BzLmNvbnRlbnQpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHByb3BzLmNvbnRlbnQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgaWYgKHByb3BzLmFsbG93SFRNTCkge1xuICAgICAgICBkYW5nZXJvdXNseVNldElubmVySFRNTChjb250ZW50LCBwcm9wcy5jb250ZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRlbnQudGV4dENvbnRlbnQgPSBwcm9wcy5jb250ZW50O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBnZXRDaGlsZHJlbihwb3BwZXIpIHtcbiAgICB2YXIgYm94ID0gcG9wcGVyLmZpcnN0RWxlbWVudENoaWxkO1xuICAgIHZhciBib3hDaGlsZHJlbiA9IGFycmF5RnJvbShib3guY2hpbGRyZW4pO1xuICAgIHJldHVybiB7XG4gICAgICBib3gsXG4gICAgICBjb250ZW50OiBib3hDaGlsZHJlbi5maW5kKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUuY2xhc3NMaXN0LmNvbnRhaW5zKENPTlRFTlRfQ0xBU1MpO1xuICAgICAgfSksXG4gICAgICBhcnJvdzogYm94Q2hpbGRyZW4uZmluZChmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHJldHVybiBub2RlLmNsYXNzTGlzdC5jb250YWlucyhBUlJPV19DTEFTUykgfHwgbm9kZS5jbGFzc0xpc3QuY29udGFpbnMoU1ZHX0FSUk9XX0NMQVNTKTtcbiAgICAgIH0pLFxuICAgICAgYmFja2Ryb3A6IGJveENoaWxkcmVuLmZpbmQoZnVuY3Rpb24obm9kZSkge1xuICAgICAgICByZXR1cm4gbm9kZS5jbGFzc0xpc3QuY29udGFpbnMoQkFDS0RST1BfQ0xBU1MpO1xuICAgICAgfSlcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIHJlbmRlcihpbnN0YW5jZSkge1xuICAgIHZhciBwb3BwZXIgPSBkaXYoKTtcbiAgICB2YXIgYm94ID0gZGl2KCk7XG4gICAgYm94LmNsYXNzTmFtZSA9IEJPWF9DTEFTUztcbiAgICBib3guc2V0QXR0cmlidXRlKFwiZGF0YS1zdGF0ZVwiLCBcImhpZGRlblwiKTtcbiAgICBib3guc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgXCItMVwiKTtcbiAgICB2YXIgY29udGVudCA9IGRpdigpO1xuICAgIGNvbnRlbnQuY2xhc3NOYW1lID0gQ09OVEVOVF9DTEFTUztcbiAgICBjb250ZW50LnNldEF0dHJpYnV0ZShcImRhdGEtc3RhdGVcIiwgXCJoaWRkZW5cIik7XG4gICAgc2V0Q29udGVudChjb250ZW50LCBpbnN0YW5jZS5wcm9wcyk7XG4gICAgcG9wcGVyLmFwcGVuZENoaWxkKGJveCk7XG4gICAgYm94LmFwcGVuZENoaWxkKGNvbnRlbnQpO1xuICAgIG9uVXBkYXRlKGluc3RhbmNlLnByb3BzLCBpbnN0YW5jZS5wcm9wcyk7XG4gICAgZnVuY3Rpb24gb25VcGRhdGUocHJldlByb3BzLCBuZXh0UHJvcHMpIHtcbiAgICAgIHZhciBfZ2V0Q2hpbGRyZW4gPSBnZXRDaGlsZHJlbihwb3BwZXIpLCBib3gyID0gX2dldENoaWxkcmVuLmJveCwgY29udGVudDIgPSBfZ2V0Q2hpbGRyZW4uY29udGVudCwgYXJyb3cgPSBfZ2V0Q2hpbGRyZW4uYXJyb3c7XG4gICAgICBpZiAobmV4dFByb3BzLnRoZW1lKSB7XG4gICAgICAgIGJveDIuc2V0QXR0cmlidXRlKFwiZGF0YS10aGVtZVwiLCBuZXh0UHJvcHMudGhlbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYm94Mi5yZW1vdmVBdHRyaWJ1dGUoXCJkYXRhLXRoZW1lXCIpO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBuZXh0UHJvcHMuYW5pbWF0aW9uID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGJveDIuc2V0QXR0cmlidXRlKFwiZGF0YS1hbmltYXRpb25cIiwgbmV4dFByb3BzLmFuaW1hdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBib3gyLnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtYW5pbWF0aW9uXCIpO1xuICAgICAgfVxuICAgICAgaWYgKG5leHRQcm9wcy5pbmVydGlhKSB7XG4gICAgICAgIGJveDIuc2V0QXR0cmlidXRlKFwiZGF0YS1pbmVydGlhXCIsIFwiXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYm94Mi5yZW1vdmVBdHRyaWJ1dGUoXCJkYXRhLWluZXJ0aWFcIik7XG4gICAgICB9XG4gICAgICBib3gyLnN0eWxlLm1heFdpZHRoID0gdHlwZW9mIG5leHRQcm9wcy5tYXhXaWR0aCA9PT0gXCJudW1iZXJcIiA/IG5leHRQcm9wcy5tYXhXaWR0aCArIFwicHhcIiA6IG5leHRQcm9wcy5tYXhXaWR0aDtcbiAgICAgIGlmIChuZXh0UHJvcHMucm9sZSkge1xuICAgICAgICBib3gyLnNldEF0dHJpYnV0ZShcInJvbGVcIiwgbmV4dFByb3BzLnJvbGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYm94Mi5yZW1vdmVBdHRyaWJ1dGUoXCJyb2xlXCIpO1xuICAgICAgfVxuICAgICAgaWYgKHByZXZQcm9wcy5jb250ZW50ICE9PSBuZXh0UHJvcHMuY29udGVudCB8fCBwcmV2UHJvcHMuYWxsb3dIVE1MICE9PSBuZXh0UHJvcHMuYWxsb3dIVE1MKSB7XG4gICAgICAgIHNldENvbnRlbnQoY29udGVudDIsIGluc3RhbmNlLnByb3BzKTtcbiAgICAgIH1cbiAgICAgIGlmIChuZXh0UHJvcHMuYXJyb3cpIHtcbiAgICAgICAgaWYgKCFhcnJvdykge1xuICAgICAgICAgIGJveDIuYXBwZW5kQ2hpbGQoY3JlYXRlQXJyb3dFbGVtZW50KG5leHRQcm9wcy5hcnJvdykpO1xuICAgICAgICB9IGVsc2UgaWYgKHByZXZQcm9wcy5hcnJvdyAhPT0gbmV4dFByb3BzLmFycm93KSB7XG4gICAgICAgICAgYm94Mi5yZW1vdmVDaGlsZChhcnJvdyk7XG4gICAgICAgICAgYm94Mi5hcHBlbmRDaGlsZChjcmVhdGVBcnJvd0VsZW1lbnQobmV4dFByb3BzLmFycm93KSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYXJyb3cpIHtcbiAgICAgICAgYm94Mi5yZW1vdmVDaGlsZChhcnJvdyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBwb3BwZXIsXG4gICAgICBvblVwZGF0ZVxuICAgIH07XG4gIH1cbiAgcmVuZGVyLiQkdGlwcHkgPSB0cnVlO1xuICB2YXIgaWRDb3VudGVyID0gMTtcbiAgdmFyIG1vdXNlTW92ZUxpc3RlbmVycyA9IFtdO1xuICB2YXIgbW91bnRlZEluc3RhbmNlcyA9IFtdO1xuICBmdW5jdGlvbiBjcmVhdGVUaXBweShyZWZlcmVuY2UsIHBhc3NlZFByb3BzKSB7XG4gICAgdmFyIHByb3BzID0gZXZhbHVhdGVQcm9wcyhyZWZlcmVuY2UsIE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRQcm9wcywge30sIGdldEV4dGVuZGVkUGFzc2VkUHJvcHMocmVtb3ZlVW5kZWZpbmVkUHJvcHMocGFzc2VkUHJvcHMpKSkpO1xuICAgIHZhciBzaG93VGltZW91dDtcbiAgICB2YXIgaGlkZVRpbWVvdXQ7XG4gICAgdmFyIHNjaGVkdWxlSGlkZUFuaW1hdGlvbkZyYW1lO1xuICAgIHZhciBpc1Zpc2libGVGcm9tQ2xpY2sgPSBmYWxzZTtcbiAgICB2YXIgZGlkSGlkZUR1ZVRvRG9jdW1lbnRNb3VzZURvd24gPSBmYWxzZTtcbiAgICB2YXIgZGlkVG91Y2hNb3ZlID0gZmFsc2U7XG4gICAgdmFyIGlnbm9yZU9uRmlyc3RVcGRhdGUgPSBmYWxzZTtcbiAgICB2YXIgbGFzdFRyaWdnZXJFdmVudDtcbiAgICB2YXIgY3VycmVudFRyYW5zaXRpb25FbmRMaXN0ZW5lcjtcbiAgICB2YXIgb25GaXJzdFVwZGF0ZTtcbiAgICB2YXIgbGlzdGVuZXJzID0gW107XG4gICAgdmFyIGRlYm91bmNlZE9uTW91c2VNb3ZlID0gZGVib3VuY2Uob25Nb3VzZU1vdmUsIHByb3BzLmludGVyYWN0aXZlRGVib3VuY2UpO1xuICAgIHZhciBjdXJyZW50VGFyZ2V0O1xuICAgIHZhciBpZCA9IGlkQ291bnRlcisrO1xuICAgIHZhciBwb3BwZXJJbnN0YW5jZSA9IG51bGw7XG4gICAgdmFyIHBsdWdpbnMgPSB1bmlxdWUocHJvcHMucGx1Z2lucyk7XG4gICAgdmFyIHN0YXRlID0ge1xuICAgICAgaXNFbmFibGVkOiB0cnVlLFxuICAgICAgaXNWaXNpYmxlOiBmYWxzZSxcbiAgICAgIGlzRGVzdHJveWVkOiBmYWxzZSxcbiAgICAgIGlzTW91bnRlZDogZmFsc2UsXG4gICAgICBpc1Nob3duOiBmYWxzZVxuICAgIH07XG4gICAgdmFyIGluc3RhbmNlID0ge1xuICAgICAgaWQsXG4gICAgICByZWZlcmVuY2UsXG4gICAgICBwb3BwZXI6IGRpdigpLFxuICAgICAgcG9wcGVySW5zdGFuY2UsXG4gICAgICBwcm9wcyxcbiAgICAgIHN0YXRlLFxuICAgICAgcGx1Z2lucyxcbiAgICAgIGNsZWFyRGVsYXlUaW1lb3V0cyxcbiAgICAgIHNldFByb3BzLFxuICAgICAgc2V0Q29udGVudDogc2V0Q29udGVudDIsXG4gICAgICBzaG93LFxuICAgICAgaGlkZSxcbiAgICAgIGhpZGVXaXRoSW50ZXJhY3Rpdml0eSxcbiAgICAgIGVuYWJsZSxcbiAgICAgIGRpc2FibGUsXG4gICAgICB1bm1vdW50LFxuICAgICAgZGVzdHJveVxuICAgIH07XG4gICAgaWYgKCFwcm9wcy5yZW5kZXIpIHtcbiAgICAgIGlmICh0cnVlKSB7XG4gICAgICAgIGVycm9yV2hlbih0cnVlLCBcInJlbmRlcigpIGZ1bmN0aW9uIGhhcyBub3QgYmVlbiBzdXBwbGllZC5cIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgfVxuICAgIHZhciBfcHJvcHMkcmVuZGVyID0gcHJvcHMucmVuZGVyKGluc3RhbmNlKSwgcG9wcGVyID0gX3Byb3BzJHJlbmRlci5wb3BwZXIsIG9uVXBkYXRlID0gX3Byb3BzJHJlbmRlci5vblVwZGF0ZTtcbiAgICBwb3BwZXIuc2V0QXR0cmlidXRlKFwiZGF0YS10aXBweS1yb290XCIsIFwiXCIpO1xuICAgIHBvcHBlci5pZCA9IFwidGlwcHktXCIgKyBpbnN0YW5jZS5pZDtcbiAgICBpbnN0YW5jZS5wb3BwZXIgPSBwb3BwZXI7XG4gICAgcmVmZXJlbmNlLl90aXBweSA9IGluc3RhbmNlO1xuICAgIHBvcHBlci5fdGlwcHkgPSBpbnN0YW5jZTtcbiAgICB2YXIgcGx1Z2luc0hvb2tzID0gcGx1Z2lucy5tYXAoZnVuY3Rpb24ocGx1Z2luKSB7XG4gICAgICByZXR1cm4gcGx1Z2luLmZuKGluc3RhbmNlKTtcbiAgICB9KTtcbiAgICB2YXIgaGFzQXJpYUV4cGFuZGVkID0gcmVmZXJlbmNlLmhhc0F0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIik7XG4gICAgYWRkTGlzdGVuZXJzKCk7XG4gICAgaGFuZGxlQXJpYUV4cGFuZGVkQXR0cmlidXRlKCk7XG4gICAgaGFuZGxlU3R5bGVzKCk7XG4gICAgaW52b2tlSG9vayhcIm9uQ3JlYXRlXCIsIFtpbnN0YW5jZV0pO1xuICAgIGlmIChwcm9wcy5zaG93T25DcmVhdGUpIHtcbiAgICAgIHNjaGVkdWxlU2hvdygpO1xuICAgIH1cbiAgICBwb3BwZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZW50ZXJcIiwgZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoaW5zdGFuY2UucHJvcHMuaW50ZXJhY3RpdmUgJiYgaW5zdGFuY2Uuc3RhdGUuaXNWaXNpYmxlKSB7XG4gICAgICAgIGluc3RhbmNlLmNsZWFyRGVsYXlUaW1lb3V0cygpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHBvcHBlci5hZGRFdmVudExpc3RlbmVyKFwibW91c2VsZWF2ZVwiLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgaWYgKGluc3RhbmNlLnByb3BzLmludGVyYWN0aXZlICYmIGluc3RhbmNlLnByb3BzLnRyaWdnZXIuaW5kZXhPZihcIm1vdXNlZW50ZXJcIikgPj0gMCkge1xuICAgICAgICBnZXREb2N1bWVudCgpLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgZGVib3VuY2VkT25Nb3VzZU1vdmUpO1xuICAgICAgICBkZWJvdW5jZWRPbk1vdXNlTW92ZShldmVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGluc3RhbmNlO1xuICAgIGZ1bmN0aW9uIGdldE5vcm1hbGl6ZWRUb3VjaFNldHRpbmdzKCkge1xuICAgICAgdmFyIHRvdWNoID0gaW5zdGFuY2UucHJvcHMudG91Y2g7XG4gICAgICByZXR1cm4gQXJyYXkuaXNBcnJheSh0b3VjaCkgPyB0b3VjaCA6IFt0b3VjaCwgMF07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldElzQ3VzdG9tVG91Y2hCZWhhdmlvcigpIHtcbiAgICAgIHJldHVybiBnZXROb3JtYWxpemVkVG91Y2hTZXR0aW5ncygpWzBdID09PSBcImhvbGRcIjtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0SXNEZWZhdWx0UmVuZGVyRm4oKSB7XG4gICAgICB2YXIgX2luc3RhbmNlJHByb3BzJHJlbmRlO1xuICAgICAgcmV0dXJuICEhKChfaW5zdGFuY2UkcHJvcHMkcmVuZGUgPSBpbnN0YW5jZS5wcm9wcy5yZW5kZXIpID09IG51bGwgPyB2b2lkIDAgOiBfaW5zdGFuY2UkcHJvcHMkcmVuZGUuJCR0aXBweSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldEN1cnJlbnRUYXJnZXQoKSB7XG4gICAgICByZXR1cm4gY3VycmVudFRhcmdldCB8fCByZWZlcmVuY2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldERvY3VtZW50KCkge1xuICAgICAgdmFyIHBhcmVudCA9IGdldEN1cnJlbnRUYXJnZXQoKS5wYXJlbnROb2RlO1xuICAgICAgcmV0dXJuIHBhcmVudCA/IGdldE93bmVyRG9jdW1lbnQocGFyZW50KSA6IGRvY3VtZW50O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXREZWZhdWx0VGVtcGxhdGVDaGlsZHJlbigpIHtcbiAgICAgIHJldHVybiBnZXRDaGlsZHJlbihwb3BwZXIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXREZWxheShpc1Nob3cpIHtcbiAgICAgIGlmIChpbnN0YW5jZS5zdGF0ZS5pc01vdW50ZWQgJiYgIWluc3RhbmNlLnN0YXRlLmlzVmlzaWJsZSB8fCBjdXJyZW50SW5wdXQuaXNUb3VjaCB8fCBsYXN0VHJpZ2dlckV2ZW50ICYmIGxhc3RUcmlnZ2VyRXZlbnQudHlwZSA9PT0gXCJmb2N1c1wiKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdldFZhbHVlQXRJbmRleE9yUmV0dXJuKGluc3RhbmNlLnByb3BzLmRlbGF5LCBpc1Nob3cgPyAwIDogMSwgZGVmYXVsdFByb3BzLmRlbGF5KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaGFuZGxlU3R5bGVzKCkge1xuICAgICAgcG9wcGVyLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBpbnN0YW5jZS5wcm9wcy5pbnRlcmFjdGl2ZSAmJiBpbnN0YW5jZS5zdGF0ZS5pc1Zpc2libGUgPyBcIlwiIDogXCJub25lXCI7XG4gICAgICBwb3BwZXIuc3R5bGUuekluZGV4ID0gXCJcIiArIGluc3RhbmNlLnByb3BzLnpJbmRleDtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW52b2tlSG9vayhob29rLCBhcmdzLCBzaG91bGRJbnZva2VQcm9wc0hvb2spIHtcbiAgICAgIGlmIChzaG91bGRJbnZva2VQcm9wc0hvb2sgPT09IHZvaWQgMCkge1xuICAgICAgICBzaG91bGRJbnZva2VQcm9wc0hvb2sgPSB0cnVlO1xuICAgICAgfVxuICAgICAgcGx1Z2luc0hvb2tzLmZvckVhY2goZnVuY3Rpb24ocGx1Z2luSG9va3MpIHtcbiAgICAgICAgaWYgKHBsdWdpbkhvb2tzW2hvb2tdKSB7XG4gICAgICAgICAgcGx1Z2luSG9va3NbaG9va10uYXBwbHkodm9pZCAwLCBhcmdzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBpZiAoc2hvdWxkSW52b2tlUHJvcHNIb29rKSB7XG4gICAgICAgIHZhciBfaW5zdGFuY2UkcHJvcHM7XG4gICAgICAgIChfaW5zdGFuY2UkcHJvcHMgPSBpbnN0YW5jZS5wcm9wcylbaG9va10uYXBwbHkoX2luc3RhbmNlJHByb3BzLCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gaGFuZGxlQXJpYUNvbnRlbnRBdHRyaWJ1dGUoKSB7XG4gICAgICB2YXIgYXJpYSA9IGluc3RhbmNlLnByb3BzLmFyaWE7XG4gICAgICBpZiAoIWFyaWEuY29udGVudCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgYXR0ciA9IFwiYXJpYS1cIiArIGFyaWEuY29udGVudDtcbiAgICAgIHZhciBpZDIgPSBwb3BwZXIuaWQ7XG4gICAgICB2YXIgbm9kZXMgPSBub3JtYWxpemVUb0FycmF5KGluc3RhbmNlLnByb3BzLnRyaWdnZXJUYXJnZXQgfHwgcmVmZXJlbmNlKTtcbiAgICAgIG5vZGVzLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xuICAgICAgICB2YXIgY3VycmVudFZhbHVlID0gbm9kZS5nZXRBdHRyaWJ1dGUoYXR0cik7XG4gICAgICAgIGlmIChpbnN0YW5jZS5zdGF0ZS5pc1Zpc2libGUpIHtcbiAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHRyLCBjdXJyZW50VmFsdWUgPyBjdXJyZW50VmFsdWUgKyBcIiBcIiArIGlkMiA6IGlkMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIG5leHRWYWx1ZSA9IGN1cnJlbnRWYWx1ZSAmJiBjdXJyZW50VmFsdWUucmVwbGFjZShpZDIsIFwiXCIpLnRyaW0oKTtcbiAgICAgICAgICBpZiAobmV4dFZhbHVlKSB7XG4gICAgICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShhdHRyLCBuZXh0VmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBoYW5kbGVBcmlhRXhwYW5kZWRBdHRyaWJ1dGUoKSB7XG4gICAgICBpZiAoaGFzQXJpYUV4cGFuZGVkIHx8ICFpbnN0YW5jZS5wcm9wcy5hcmlhLmV4cGFuZGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBub2RlcyA9IG5vcm1hbGl6ZVRvQXJyYXkoaW5zdGFuY2UucHJvcHMudHJpZ2dlclRhcmdldCB8fCByZWZlcmVuY2UpO1xuICAgICAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIGlmIChpbnN0YW5jZS5wcm9wcy5pbnRlcmFjdGl2ZSkge1xuICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiLCBpbnN0YW5jZS5zdGF0ZS5pc1Zpc2libGUgJiYgbm9kZSA9PT0gZ2V0Q3VycmVudFRhcmdldCgpID8gXCJ0cnVlXCIgOiBcImZhbHNlXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNsZWFudXBJbnRlcmFjdGl2ZU1vdXNlTGlzdGVuZXJzKCkge1xuICAgICAgZ2V0RG9jdW1lbnQoKS5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIGRlYm91bmNlZE9uTW91c2VNb3ZlKTtcbiAgICAgIG1vdXNlTW92ZUxpc3RlbmVycyA9IG1vdXNlTW92ZUxpc3RlbmVycy5maWx0ZXIoZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgICAgcmV0dXJuIGxpc3RlbmVyICE9PSBkZWJvdW5jZWRPbk1vdXNlTW92ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBvbkRvY3VtZW50UHJlc3MoZXZlbnQpIHtcbiAgICAgIGlmIChjdXJyZW50SW5wdXQuaXNUb3VjaCkge1xuICAgICAgICBpZiAoZGlkVG91Y2hNb3ZlIHx8IGV2ZW50LnR5cGUgPT09IFwibW91c2Vkb3duXCIpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChpbnN0YW5jZS5wcm9wcy5pbnRlcmFjdGl2ZSAmJiBwb3BwZXIuY29udGFpbnMoZXZlbnQudGFyZ2V0KSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoZ2V0Q3VycmVudFRhcmdldCgpLmNvbnRhaW5zKGV2ZW50LnRhcmdldCkpIHtcbiAgICAgICAgaWYgKGN1cnJlbnRJbnB1dC5pc1RvdWNoKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnN0YW5jZS5zdGF0ZS5pc1Zpc2libGUgJiYgaW5zdGFuY2UucHJvcHMudHJpZ2dlci5pbmRleE9mKFwiY2xpY2tcIikgPj0gMCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW52b2tlSG9vayhcIm9uQ2xpY2tPdXRzaWRlXCIsIFtpbnN0YW5jZSwgZXZlbnRdKTtcbiAgICAgIH1cbiAgICAgIGlmIChpbnN0YW5jZS5wcm9wcy5oaWRlT25DbGljayA9PT0gdHJ1ZSkge1xuICAgICAgICBpbnN0YW5jZS5jbGVhckRlbGF5VGltZW91dHMoKTtcbiAgICAgICAgaW5zdGFuY2UuaGlkZSgpO1xuICAgICAgICBkaWRIaWRlRHVlVG9Eb2N1bWVudE1vdXNlRG93biA9IHRydWU7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZGlkSGlkZUR1ZVRvRG9jdW1lbnRNb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghaW5zdGFuY2Uuc3RhdGUuaXNNb3VudGVkKSB7XG4gICAgICAgICAgcmVtb3ZlRG9jdW1lbnRQcmVzcygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uVG91Y2hNb3ZlKCkge1xuICAgICAgZGlkVG91Y2hNb3ZlID0gdHJ1ZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gb25Ub3VjaFN0YXJ0KCkge1xuICAgICAgZGlkVG91Y2hNb3ZlID0gZmFsc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkZERvY3VtZW50UHJlc3MoKSB7XG4gICAgICB2YXIgZG9jID0gZ2V0RG9jdW1lbnQoKTtcbiAgICAgIGRvYy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIG9uRG9jdW1lbnRQcmVzcywgdHJ1ZSk7XG4gICAgICBkb2MuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIG9uRG9jdW1lbnRQcmVzcywgVE9VQ0hfT1BUSU9OUyk7XG4gICAgICBkb2MuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgb25Ub3VjaFN0YXJ0LCBUT1VDSF9PUFRJT05TKTtcbiAgICAgIGRvYy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIG9uVG91Y2hNb3ZlLCBUT1VDSF9PUFRJT05TKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcmVtb3ZlRG9jdW1lbnRQcmVzcygpIHtcbiAgICAgIHZhciBkb2MgPSBnZXREb2N1bWVudCgpO1xuICAgICAgZG9jLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgb25Eb2N1bWVudFByZXNzLCB0cnVlKTtcbiAgICAgIGRvYy5yZW1vdmVFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgb25Eb2N1bWVudFByZXNzLCBUT1VDSF9PUFRJT05TKTtcbiAgICAgIGRvYy5yZW1vdmVFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCBvblRvdWNoU3RhcnQsIFRPVUNIX09QVElPTlMpO1xuICAgICAgZG9jLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgb25Ub3VjaE1vdmUsIFRPVUNIX09QVElPTlMpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBvblRyYW5zaXRpb25lZE91dChkdXJhdGlvbiwgY2FsbGJhY2spIHtcbiAgICAgIG9uVHJhbnNpdGlvbkVuZChkdXJhdGlvbiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghaW5zdGFuY2Uuc3RhdGUuaXNWaXNpYmxlICYmIHBvcHBlci5wYXJlbnROb2RlICYmIHBvcHBlci5wYXJlbnROb2RlLmNvbnRhaW5zKHBvcHBlcikpIHtcbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gb25UcmFuc2l0aW9uZWRJbihkdXJhdGlvbiwgY2FsbGJhY2spIHtcbiAgICAgIG9uVHJhbnNpdGlvbkVuZChkdXJhdGlvbiwgY2FsbGJhY2spO1xuICAgIH1cbiAgICBmdW5jdGlvbiBvblRyYW5zaXRpb25FbmQoZHVyYXRpb24sIGNhbGxiYWNrKSB7XG4gICAgICB2YXIgYm94ID0gZ2V0RGVmYXVsdFRlbXBsYXRlQ2hpbGRyZW4oKS5ib3g7XG4gICAgICBmdW5jdGlvbiBsaXN0ZW5lcihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ID09PSBib3gpIHtcbiAgICAgICAgICB1cGRhdGVUcmFuc2l0aW9uRW5kTGlzdGVuZXIoYm94LCBcInJlbW92ZVwiLCBsaXN0ZW5lcik7XG4gICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGR1cmF0aW9uID09PSAwKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgfVxuICAgICAgdXBkYXRlVHJhbnNpdGlvbkVuZExpc3RlbmVyKGJveCwgXCJyZW1vdmVcIiwgY3VycmVudFRyYW5zaXRpb25FbmRMaXN0ZW5lcik7XG4gICAgICB1cGRhdGVUcmFuc2l0aW9uRW5kTGlzdGVuZXIoYm94LCBcImFkZFwiLCBsaXN0ZW5lcik7XG4gICAgICBjdXJyZW50VHJhbnNpdGlvbkVuZExpc3RlbmVyID0gbGlzdGVuZXI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uKGV2ZW50VHlwZSwgaGFuZGxlciwgb3B0aW9ucykge1xuICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkge1xuICAgICAgICBvcHRpb25zID0gZmFsc2U7XG4gICAgICB9XG4gICAgICB2YXIgbm9kZXMgPSBub3JtYWxpemVUb0FycmF5KGluc3RhbmNlLnByb3BzLnRyaWdnZXJUYXJnZXQgfHwgcmVmZXJlbmNlKTtcbiAgICAgIG5vZGVzLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xuICAgICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgICAgICAgbGlzdGVuZXJzLnB1c2goe1xuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgZXZlbnRUeXBlLFxuICAgICAgICAgIGhhbmRsZXIsXG4gICAgICAgICAgb3B0aW9uc1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBhZGRMaXN0ZW5lcnMoKSB7XG4gICAgICBpZiAoZ2V0SXNDdXN0b21Ub3VjaEJlaGF2aW9yKCkpIHtcbiAgICAgICAgb24oXCJ0b3VjaHN0YXJ0XCIsIG9uVHJpZ2dlciwge1xuICAgICAgICAgIHBhc3NpdmU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIG9uKFwidG91Y2hlbmRcIiwgb25Nb3VzZUxlYXZlLCB7XG4gICAgICAgICAgcGFzc2l2ZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHNwbGl0QnlTcGFjZXMoaW5zdGFuY2UucHJvcHMudHJpZ2dlcikuZm9yRWFjaChmdW5jdGlvbihldmVudFR5cGUpIHtcbiAgICAgICAgaWYgKGV2ZW50VHlwZSA9PT0gXCJtYW51YWxcIikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvbihldmVudFR5cGUsIG9uVHJpZ2dlcik7XG4gICAgICAgIHN3aXRjaCAoZXZlbnRUeXBlKSB7XG4gICAgICAgICAgY2FzZSBcIm1vdXNlZW50ZXJcIjpcbiAgICAgICAgICAgIG9uKFwibW91c2VsZWF2ZVwiLCBvbk1vdXNlTGVhdmUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImZvY3VzXCI6XG4gICAgICAgICAgICBvbihpc0lFID8gXCJmb2N1c291dFwiIDogXCJibHVyXCIsIG9uQmx1ck9yRm9jdXNPdXQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImZvY3VzaW5cIjpcbiAgICAgICAgICAgIG9uKFwiZm9jdXNvdXRcIiwgb25CbHVyT3JGb2N1c091dCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycygpIHtcbiAgICAgIGxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKF9yZWYpIHtcbiAgICAgICAgdmFyIG5vZGUgPSBfcmVmLm5vZGUsIGV2ZW50VHlwZSA9IF9yZWYuZXZlbnRUeXBlLCBoYW5kbGVyID0gX3JlZi5oYW5kbGVyLCBvcHRpb25zID0gX3JlZi5vcHRpb25zO1xuICAgICAgICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgICAgIH0pO1xuICAgICAgbGlzdGVuZXJzID0gW107XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uVHJpZ2dlcihldmVudCkge1xuICAgICAgdmFyIF9sYXN0VHJpZ2dlckV2ZW50O1xuICAgICAgdmFyIHNob3VsZFNjaGVkdWxlQ2xpY2tIaWRlID0gZmFsc2U7XG4gICAgICBpZiAoIWluc3RhbmNlLnN0YXRlLmlzRW5hYmxlZCB8fCBpc0V2ZW50TGlzdGVuZXJTdG9wcGVkKGV2ZW50KSB8fCBkaWRIaWRlRHVlVG9Eb2N1bWVudE1vdXNlRG93bikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgd2FzRm9jdXNlZCA9ICgoX2xhc3RUcmlnZ2VyRXZlbnQgPSBsYXN0VHJpZ2dlckV2ZW50KSA9PSBudWxsID8gdm9pZCAwIDogX2xhc3RUcmlnZ2VyRXZlbnQudHlwZSkgPT09IFwiZm9jdXNcIjtcbiAgICAgIGxhc3RUcmlnZ2VyRXZlbnQgPSBldmVudDtcbiAgICAgIGN1cnJlbnRUYXJnZXQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xuICAgICAgaGFuZGxlQXJpYUV4cGFuZGVkQXR0cmlidXRlKCk7XG4gICAgICBpZiAoIWluc3RhbmNlLnN0YXRlLmlzVmlzaWJsZSAmJiBpc01vdXNlRXZlbnQoZXZlbnQpKSB7XG4gICAgICAgIG1vdXNlTW92ZUxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgICAgICAgcmV0dXJuIGxpc3RlbmVyKGV2ZW50KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAoZXZlbnQudHlwZSA9PT0gXCJjbGlja1wiICYmIChpbnN0YW5jZS5wcm9wcy50cmlnZ2VyLmluZGV4T2YoXCJtb3VzZWVudGVyXCIpIDwgMCB8fCBpc1Zpc2libGVGcm9tQ2xpY2spICYmIGluc3RhbmNlLnByb3BzLmhpZGVPbkNsaWNrICE9PSBmYWxzZSAmJiBpbnN0YW5jZS5zdGF0ZS5pc1Zpc2libGUpIHtcbiAgICAgICAgc2hvdWxkU2NoZWR1bGVDbGlja0hpZGUgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NoZWR1bGVTaG93KGV2ZW50KTtcbiAgICAgIH1cbiAgICAgIGlmIChldmVudC50eXBlID09PSBcImNsaWNrXCIpIHtcbiAgICAgICAgaXNWaXNpYmxlRnJvbUNsaWNrID0gIXNob3VsZFNjaGVkdWxlQ2xpY2tIaWRlO1xuICAgICAgfVxuICAgICAgaWYgKHNob3VsZFNjaGVkdWxlQ2xpY2tIaWRlICYmICF3YXNGb2N1c2VkKSB7XG4gICAgICAgIHNjaGVkdWxlSGlkZShldmVudCk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uTW91c2VNb3ZlKGV2ZW50KSB7XG4gICAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuICAgICAgdmFyIGlzQ3Vyc29yT3ZlclJlZmVyZW5jZU9yUG9wcGVyID0gZ2V0Q3VycmVudFRhcmdldCgpLmNvbnRhaW5zKHRhcmdldCkgfHwgcG9wcGVyLmNvbnRhaW5zKHRhcmdldCk7XG4gICAgICBpZiAoZXZlbnQudHlwZSA9PT0gXCJtb3VzZW1vdmVcIiAmJiBpc0N1cnNvck92ZXJSZWZlcmVuY2VPclBvcHBlcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgcG9wcGVyVHJlZURhdGEgPSBnZXROZXN0ZWRQb3BwZXJUcmVlKCkuY29uY2F0KHBvcHBlcikubWFwKGZ1bmN0aW9uKHBvcHBlcjIpIHtcbiAgICAgICAgdmFyIF9pbnN0YW5jZSRwb3BwZXJJbnN0YTtcbiAgICAgICAgdmFyIGluc3RhbmNlMiA9IHBvcHBlcjIuX3RpcHB5O1xuICAgICAgICB2YXIgc3RhdGUyID0gKF9pbnN0YW5jZSRwb3BwZXJJbnN0YSA9IGluc3RhbmNlMi5wb3BwZXJJbnN0YW5jZSkgPT0gbnVsbCA/IHZvaWQgMCA6IF9pbnN0YW5jZSRwb3BwZXJJbnN0YS5zdGF0ZTtcbiAgICAgICAgaWYgKHN0YXRlMikge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwb3BwZXJSZWN0OiBwb3BwZXIyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgICAgICAgcG9wcGVyU3RhdGU6IHN0YXRlMixcbiAgICAgICAgICAgIHByb3BzXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0pLmZpbHRlcihCb29sZWFuKTtcbiAgICAgIGlmIChpc0N1cnNvck91dHNpZGVJbnRlcmFjdGl2ZUJvcmRlcihwb3BwZXJUcmVlRGF0YSwgZXZlbnQpKSB7XG4gICAgICAgIGNsZWFudXBJbnRlcmFjdGl2ZU1vdXNlTGlzdGVuZXJzKCk7XG4gICAgICAgIHNjaGVkdWxlSGlkZShldmVudCk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uTW91c2VMZWF2ZShldmVudCkge1xuICAgICAgdmFyIHNob3VsZEJhaWwgPSBpc0V2ZW50TGlzdGVuZXJTdG9wcGVkKGV2ZW50KSB8fCBpbnN0YW5jZS5wcm9wcy50cmlnZ2VyLmluZGV4T2YoXCJjbGlja1wiKSA+PSAwICYmIGlzVmlzaWJsZUZyb21DbGljaztcbiAgICAgIGlmIChzaG91bGRCYWlsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChpbnN0YW5jZS5wcm9wcy5pbnRlcmFjdGl2ZSkge1xuICAgICAgICBpbnN0YW5jZS5oaWRlV2l0aEludGVyYWN0aXZpdHkoZXZlbnQpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzY2hlZHVsZUhpZGUoZXZlbnQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBvbkJsdXJPckZvY3VzT3V0KGV2ZW50KSB7XG4gICAgICBpZiAoaW5zdGFuY2UucHJvcHMudHJpZ2dlci5pbmRleE9mKFwiZm9jdXNpblwiKSA8IDAgJiYgZXZlbnQudGFyZ2V0ICE9PSBnZXRDdXJyZW50VGFyZ2V0KCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKGluc3RhbmNlLnByb3BzLmludGVyYWN0aXZlICYmIGV2ZW50LnJlbGF0ZWRUYXJnZXQgJiYgcG9wcGVyLmNvbnRhaW5zKGV2ZW50LnJlbGF0ZWRUYXJnZXQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNjaGVkdWxlSGlkZShldmVudCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzRXZlbnRMaXN0ZW5lclN0b3BwZWQoZXZlbnQpIHtcbiAgICAgIHJldHVybiBjdXJyZW50SW5wdXQuaXNUb3VjaCA/IGdldElzQ3VzdG9tVG91Y2hCZWhhdmlvcigpICE9PSBldmVudC50eXBlLmluZGV4T2YoXCJ0b3VjaFwiKSA+PSAwIDogZmFsc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyZWF0ZVBvcHBlckluc3RhbmNlKCkge1xuICAgICAgZGVzdHJveVBvcHBlckluc3RhbmNlKCk7XG4gICAgICB2YXIgX2luc3RhbmNlJHByb3BzMiA9IGluc3RhbmNlLnByb3BzLCBwb3BwZXJPcHRpb25zID0gX2luc3RhbmNlJHByb3BzMi5wb3BwZXJPcHRpb25zLCBwbGFjZW1lbnQgPSBfaW5zdGFuY2UkcHJvcHMyLnBsYWNlbWVudCwgb2Zmc2V0ID0gX2luc3RhbmNlJHByb3BzMi5vZmZzZXQsIGdldFJlZmVyZW5jZUNsaWVudFJlY3QgPSBfaW5zdGFuY2UkcHJvcHMyLmdldFJlZmVyZW5jZUNsaWVudFJlY3QsIG1vdmVUcmFuc2l0aW9uID0gX2luc3RhbmNlJHByb3BzMi5tb3ZlVHJhbnNpdGlvbjtcbiAgICAgIHZhciBhcnJvdyA9IGdldElzRGVmYXVsdFJlbmRlckZuKCkgPyBnZXRDaGlsZHJlbihwb3BwZXIpLmFycm93IDogbnVsbDtcbiAgICAgIHZhciBjb21wdXRlZFJlZmVyZW5jZSA9IGdldFJlZmVyZW5jZUNsaWVudFJlY3QgPyB7XG4gICAgICAgIGdldEJvdW5kaW5nQ2xpZW50UmVjdDogZ2V0UmVmZXJlbmNlQ2xpZW50UmVjdCxcbiAgICAgICAgY29udGV4dEVsZW1lbnQ6IGdldFJlZmVyZW5jZUNsaWVudFJlY3QuY29udGV4dEVsZW1lbnQgfHwgZ2V0Q3VycmVudFRhcmdldCgpXG4gICAgICB9IDogcmVmZXJlbmNlO1xuICAgICAgdmFyIHRpcHB5TW9kaWZpZXIgPSB7XG4gICAgICAgIG5hbWU6IFwiJCR0aXBweVwiLFxuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICBwaGFzZTogXCJiZWZvcmVXcml0ZVwiLFxuICAgICAgICByZXF1aXJlczogW1wiY29tcHV0ZVN0eWxlc1wiXSxcbiAgICAgICAgZm46IGZ1bmN0aW9uIGZuKF9yZWYyKSB7XG4gICAgICAgICAgdmFyIHN0YXRlMiA9IF9yZWYyLnN0YXRlO1xuICAgICAgICAgIGlmIChnZXRJc0RlZmF1bHRSZW5kZXJGbigpKSB7XG4gICAgICAgICAgICB2YXIgX2dldERlZmF1bHRUZW1wbGF0ZUNoID0gZ2V0RGVmYXVsdFRlbXBsYXRlQ2hpbGRyZW4oKSwgYm94ID0gX2dldERlZmF1bHRUZW1wbGF0ZUNoLmJveDtcbiAgICAgICAgICAgIFtcInBsYWNlbWVudFwiLCBcInJlZmVyZW5jZS1oaWRkZW5cIiwgXCJlc2NhcGVkXCJdLmZvckVhY2goZnVuY3Rpb24oYXR0cikge1xuICAgICAgICAgICAgICBpZiAoYXR0ciA9PT0gXCJwbGFjZW1lbnRcIikge1xuICAgICAgICAgICAgICAgIGJveC5zZXRBdHRyaWJ1dGUoXCJkYXRhLXBsYWNlbWVudFwiLCBzdGF0ZTIucGxhY2VtZW50KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUyLmF0dHJpYnV0ZXMucG9wcGVyW1wiZGF0YS1wb3BwZXItXCIgKyBhdHRyXSkge1xuICAgICAgICAgICAgICAgICAgYm94LnNldEF0dHJpYnV0ZShcImRhdGEtXCIgKyBhdHRyLCBcIlwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgYm94LnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtXCIgKyBhdHRyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3RhdGUyLmF0dHJpYnV0ZXMucG9wcGVyID0ge307XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgdmFyIG1vZGlmaWVycyA9IFt7XG4gICAgICAgIG5hbWU6IFwib2Zmc2V0XCIsXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICBvZmZzZXRcbiAgICAgICAgfVxuICAgICAgfSwge1xuICAgICAgICBuYW1lOiBcInByZXZlbnRPdmVyZmxvd1wiLFxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgcGFkZGluZzoge1xuICAgICAgICAgICAgdG9wOiAyLFxuICAgICAgICAgICAgYm90dG9tOiAyLFxuICAgICAgICAgICAgbGVmdDogNSxcbiAgICAgICAgICAgIHJpZ2h0OiA1XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LCB7XG4gICAgICAgIG5hbWU6IFwiZmxpcFwiLFxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgcGFkZGluZzogNVxuICAgICAgICB9XG4gICAgICB9LCB7XG4gICAgICAgIG5hbWU6IFwiY29tcHV0ZVN0eWxlc1wiLFxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgYWRhcHRpdmU6ICFtb3ZlVHJhbnNpdGlvblxuICAgICAgICB9XG4gICAgICB9LCB0aXBweU1vZGlmaWVyXTtcbiAgICAgIGlmIChnZXRJc0RlZmF1bHRSZW5kZXJGbigpICYmIGFycm93KSB7XG4gICAgICAgIG1vZGlmaWVycy5wdXNoKHtcbiAgICAgICAgICBuYW1lOiBcImFycm93XCIsXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgZWxlbWVudDogYXJyb3csXG4gICAgICAgICAgICBwYWRkaW5nOiAzXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIG1vZGlmaWVycy5wdXNoLmFwcGx5KG1vZGlmaWVycywgKHBvcHBlck9wdGlvbnMgPT0gbnVsbCA/IHZvaWQgMCA6IHBvcHBlck9wdGlvbnMubW9kaWZpZXJzKSB8fCBbXSk7XG4gICAgICBpbnN0YW5jZS5wb3BwZXJJbnN0YW5jZSA9IGNvcmUuY3JlYXRlUG9wcGVyKGNvbXB1dGVkUmVmZXJlbmNlLCBwb3BwZXIsIE9iamVjdC5hc3NpZ24oe30sIHBvcHBlck9wdGlvbnMsIHtcbiAgICAgICAgcGxhY2VtZW50LFxuICAgICAgICBvbkZpcnN0VXBkYXRlLFxuICAgICAgICBtb2RpZmllcnNcbiAgICAgIH0pKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGVzdHJveVBvcHBlckluc3RhbmNlKCkge1xuICAgICAgaWYgKGluc3RhbmNlLnBvcHBlckluc3RhbmNlKSB7XG4gICAgICAgIGluc3RhbmNlLnBvcHBlckluc3RhbmNlLmRlc3Ryb3koKTtcbiAgICAgICAgaW5zdGFuY2UucG9wcGVySW5zdGFuY2UgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBtb3VudCgpIHtcbiAgICAgIHZhciBhcHBlbmRUbyA9IGluc3RhbmNlLnByb3BzLmFwcGVuZFRvO1xuICAgICAgdmFyIHBhcmVudE5vZGU7XG4gICAgICB2YXIgbm9kZSA9IGdldEN1cnJlbnRUYXJnZXQoKTtcbiAgICAgIGlmIChpbnN0YW5jZS5wcm9wcy5pbnRlcmFjdGl2ZSAmJiBhcHBlbmRUbyA9PT0gZGVmYXVsdFByb3BzLmFwcGVuZFRvIHx8IGFwcGVuZFRvID09PSBcInBhcmVudFwiKSB7XG4gICAgICAgIHBhcmVudE5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJlbnROb2RlID0gaW52b2tlV2l0aEFyZ3NPclJldHVybihhcHBlbmRUbywgW25vZGVdKTtcbiAgICAgIH1cbiAgICAgIGlmICghcGFyZW50Tm9kZS5jb250YWlucyhwb3BwZXIpKSB7XG4gICAgICAgIHBhcmVudE5vZGUuYXBwZW5kQ2hpbGQocG9wcGVyKTtcbiAgICAgIH1cbiAgICAgIGNyZWF0ZVBvcHBlckluc3RhbmNlKCk7XG4gICAgICBpZiAodHJ1ZSkge1xuICAgICAgICB3YXJuV2hlbihpbnN0YW5jZS5wcm9wcy5pbnRlcmFjdGl2ZSAmJiBhcHBlbmRUbyA9PT0gZGVmYXVsdFByb3BzLmFwcGVuZFRvICYmIG5vZGUubmV4dEVsZW1lbnRTaWJsaW5nICE9PSBwb3BwZXIsIFtcIkludGVyYWN0aXZlIHRpcHB5IGVsZW1lbnQgbWF5IG5vdCBiZSBhY2Nlc3NpYmxlIHZpYSBrZXlib2FyZFwiLCBcIm5hdmlnYXRpb24gYmVjYXVzZSBpdCBpcyBub3QgZGlyZWN0bHkgYWZ0ZXIgdGhlIHJlZmVyZW5jZSBlbGVtZW50XCIsIFwiaW4gdGhlIERPTSBzb3VyY2Ugb3JkZXIuXCIsIFwiXFxuXFxuXCIsIFwiVXNpbmcgYSB3cmFwcGVyIDxkaXY+IG9yIDxzcGFuPiB0YWcgYXJvdW5kIHRoZSByZWZlcmVuY2UgZWxlbWVudFwiLCBcInNvbHZlcyB0aGlzIGJ5IGNyZWF0aW5nIGEgbmV3IHBhcmVudE5vZGUgY29udGV4dC5cIiwgXCJcXG5cXG5cIiwgXCJTcGVjaWZ5aW5nIGBhcHBlbmRUbzogZG9jdW1lbnQuYm9keWAgc2lsZW5jZXMgdGhpcyB3YXJuaW5nLCBidXQgaXRcIiwgXCJhc3N1bWVzIHlvdSBhcmUgdXNpbmcgYSBmb2N1cyBtYW5hZ2VtZW50IHNvbHV0aW9uIHRvIGhhbmRsZVwiLCBcImtleWJvYXJkIG5hdmlnYXRpb24uXCIsIFwiXFxuXFxuXCIsIFwiU2VlOiBodHRwczovL2F0b21pa3MuZ2l0aHViLmlvL3RpcHB5anMvdjYvYWNjZXNzaWJpbGl0eS8jaW50ZXJhY3Rpdml0eVwiXS5qb2luKFwiIFwiKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldE5lc3RlZFBvcHBlclRyZWUoKSB7XG4gICAgICByZXR1cm4gYXJyYXlGcm9tKHBvcHBlci5xdWVyeVNlbGVjdG9yQWxsKFwiW2RhdGEtdGlwcHktcm9vdF1cIikpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzY2hlZHVsZVNob3coZXZlbnQpIHtcbiAgICAgIGluc3RhbmNlLmNsZWFyRGVsYXlUaW1lb3V0cygpO1xuICAgICAgaWYgKGV2ZW50KSB7XG4gICAgICAgIGludm9rZUhvb2soXCJvblRyaWdnZXJcIiwgW2luc3RhbmNlLCBldmVudF0pO1xuICAgICAgfVxuICAgICAgYWRkRG9jdW1lbnRQcmVzcygpO1xuICAgICAgdmFyIGRlbGF5ID0gZ2V0RGVsYXkodHJ1ZSk7XG4gICAgICB2YXIgX2dldE5vcm1hbGl6ZWRUb3VjaFNlID0gZ2V0Tm9ybWFsaXplZFRvdWNoU2V0dGluZ3MoKSwgdG91Y2hWYWx1ZSA9IF9nZXROb3JtYWxpemVkVG91Y2hTZVswXSwgdG91Y2hEZWxheSA9IF9nZXROb3JtYWxpemVkVG91Y2hTZVsxXTtcbiAgICAgIGlmIChjdXJyZW50SW5wdXQuaXNUb3VjaCAmJiB0b3VjaFZhbHVlID09PSBcImhvbGRcIiAmJiB0b3VjaERlbGF5KSB7XG4gICAgICAgIGRlbGF5ID0gdG91Y2hEZWxheTtcbiAgICAgIH1cbiAgICAgIGlmIChkZWxheSkge1xuICAgICAgICBzaG93VGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaW5zdGFuY2Uuc2hvdygpO1xuICAgICAgICB9LCBkZWxheSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbnN0YW5jZS5zaG93KCk7XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNjaGVkdWxlSGlkZShldmVudCkge1xuICAgICAgaW5zdGFuY2UuY2xlYXJEZWxheVRpbWVvdXRzKCk7XG4gICAgICBpbnZva2VIb29rKFwib25VbnRyaWdnZXJcIiwgW2luc3RhbmNlLCBldmVudF0pO1xuICAgICAgaWYgKCFpbnN0YW5jZS5zdGF0ZS5pc1Zpc2libGUpIHtcbiAgICAgICAgcmVtb3ZlRG9jdW1lbnRQcmVzcygpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoaW5zdGFuY2UucHJvcHMudHJpZ2dlci5pbmRleE9mKFwibW91c2VlbnRlclwiKSA+PSAwICYmIGluc3RhbmNlLnByb3BzLnRyaWdnZXIuaW5kZXhPZihcImNsaWNrXCIpID49IDAgJiYgW1wibW91c2VsZWF2ZVwiLCBcIm1vdXNlbW92ZVwiXS5pbmRleE9mKGV2ZW50LnR5cGUpID49IDAgJiYgaXNWaXNpYmxlRnJvbUNsaWNrKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBkZWxheSA9IGdldERlbGF5KGZhbHNlKTtcbiAgICAgIGlmIChkZWxheSkge1xuICAgICAgICBoaWRlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKGluc3RhbmNlLnN0YXRlLmlzVmlzaWJsZSkge1xuICAgICAgICAgICAgaW5zdGFuY2UuaGlkZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgZGVsYXkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NoZWR1bGVIaWRlQW5pbWF0aW9uRnJhbWUgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaW5zdGFuY2UuaGlkZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gZW5hYmxlKCkge1xuICAgICAgaW5zdGFuY2Uuc3RhdGUuaXNFbmFibGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGlzYWJsZSgpIHtcbiAgICAgIGluc3RhbmNlLmhpZGUoKTtcbiAgICAgIGluc3RhbmNlLnN0YXRlLmlzRW5hYmxlZCA9IGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjbGVhckRlbGF5VGltZW91dHMoKSB7XG4gICAgICBjbGVhclRpbWVvdXQoc2hvd1RpbWVvdXQpO1xuICAgICAgY2xlYXJUaW1lb3V0KGhpZGVUaW1lb3V0KTtcbiAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHNjaGVkdWxlSGlkZUFuaW1hdGlvbkZyYW1lKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc2V0UHJvcHMocGFydGlhbFByb3BzKSB7XG4gICAgICBpZiAodHJ1ZSkge1xuICAgICAgICB3YXJuV2hlbihpbnN0YW5jZS5zdGF0ZS5pc0Rlc3Ryb3llZCwgY3JlYXRlTWVtb3J5TGVha1dhcm5pbmcoXCJzZXRQcm9wc1wiKSk7XG4gICAgICB9XG4gICAgICBpZiAoaW5zdGFuY2Uuc3RhdGUuaXNEZXN0cm95ZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaW52b2tlSG9vayhcIm9uQmVmb3JlVXBkYXRlXCIsIFtpbnN0YW5jZSwgcGFydGlhbFByb3BzXSk7XG4gICAgICByZW1vdmVMaXN0ZW5lcnMoKTtcbiAgICAgIHZhciBwcmV2UHJvcHMgPSBpbnN0YW5jZS5wcm9wcztcbiAgICAgIHZhciBuZXh0UHJvcHMgPSBldmFsdWF0ZVByb3BzKHJlZmVyZW5jZSwgT2JqZWN0LmFzc2lnbih7fSwgaW5zdGFuY2UucHJvcHMsIHt9LCBwYXJ0aWFsUHJvcHMsIHtcbiAgICAgICAgaWdub3JlQXR0cmlidXRlczogdHJ1ZVxuICAgICAgfSkpO1xuICAgICAgaW5zdGFuY2UucHJvcHMgPSBuZXh0UHJvcHM7XG4gICAgICBhZGRMaXN0ZW5lcnMoKTtcbiAgICAgIGlmIChwcmV2UHJvcHMuaW50ZXJhY3RpdmVEZWJvdW5jZSAhPT0gbmV4dFByb3BzLmludGVyYWN0aXZlRGVib3VuY2UpIHtcbiAgICAgICAgY2xlYW51cEludGVyYWN0aXZlTW91c2VMaXN0ZW5lcnMoKTtcbiAgICAgICAgZGVib3VuY2VkT25Nb3VzZU1vdmUgPSBkZWJvdW5jZShvbk1vdXNlTW92ZSwgbmV4dFByb3BzLmludGVyYWN0aXZlRGVib3VuY2UpO1xuICAgICAgfVxuICAgICAgaWYgKHByZXZQcm9wcy50cmlnZ2VyVGFyZ2V0ICYmICFuZXh0UHJvcHMudHJpZ2dlclRhcmdldCkge1xuICAgICAgICBub3JtYWxpemVUb0FycmF5KHByZXZQcm9wcy50cmlnZ2VyVGFyZ2V0KS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIik7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChuZXh0UHJvcHMudHJpZ2dlclRhcmdldCkge1xuICAgICAgICByZWZlcmVuY2UucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1leHBhbmRlZFwiKTtcbiAgICAgIH1cbiAgICAgIGhhbmRsZUFyaWFFeHBhbmRlZEF0dHJpYnV0ZSgpO1xuICAgICAgaGFuZGxlU3R5bGVzKCk7XG4gICAgICBpZiAob25VcGRhdGUpIHtcbiAgICAgICAgb25VcGRhdGUocHJldlByb3BzLCBuZXh0UHJvcHMpO1xuICAgICAgfVxuICAgICAgaWYgKGluc3RhbmNlLnBvcHBlckluc3RhbmNlKSB7XG4gICAgICAgIGNyZWF0ZVBvcHBlckluc3RhbmNlKCk7XG4gICAgICAgIGdldE5lc3RlZFBvcHBlclRyZWUoKS5mb3JFYWNoKGZ1bmN0aW9uKG5lc3RlZFBvcHBlcikge1xuICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShuZXN0ZWRQb3BwZXIuX3RpcHB5LnBvcHBlckluc3RhbmNlLmZvcmNlVXBkYXRlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpbnZva2VIb29rKFwib25BZnRlclVwZGF0ZVwiLCBbaW5zdGFuY2UsIHBhcnRpYWxQcm9wc10pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzZXRDb250ZW50Mihjb250ZW50KSB7XG4gICAgICBpbnN0YW5jZS5zZXRQcm9wcyh7XG4gICAgICAgIGNvbnRlbnRcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzaG93KCkge1xuICAgICAgaWYgKHRydWUpIHtcbiAgICAgICAgd2FybldoZW4oaW5zdGFuY2Uuc3RhdGUuaXNEZXN0cm95ZWQsIGNyZWF0ZU1lbW9yeUxlYWtXYXJuaW5nKFwic2hvd1wiKSk7XG4gICAgICB9XG4gICAgICB2YXIgaXNBbHJlYWR5VmlzaWJsZSA9IGluc3RhbmNlLnN0YXRlLmlzVmlzaWJsZTtcbiAgICAgIHZhciBpc0Rlc3Ryb3llZCA9IGluc3RhbmNlLnN0YXRlLmlzRGVzdHJveWVkO1xuICAgICAgdmFyIGlzRGlzYWJsZWQgPSAhaW5zdGFuY2Uuc3RhdGUuaXNFbmFibGVkO1xuICAgICAgdmFyIGlzVG91Y2hBbmRUb3VjaERpc2FibGVkID0gY3VycmVudElucHV0LmlzVG91Y2ggJiYgIWluc3RhbmNlLnByb3BzLnRvdWNoO1xuICAgICAgdmFyIGR1cmF0aW9uID0gZ2V0VmFsdWVBdEluZGV4T3JSZXR1cm4oaW5zdGFuY2UucHJvcHMuZHVyYXRpb24sIDAsIGRlZmF1bHRQcm9wcy5kdXJhdGlvbik7XG4gICAgICBpZiAoaXNBbHJlYWR5VmlzaWJsZSB8fCBpc0Rlc3Ryb3llZCB8fCBpc0Rpc2FibGVkIHx8IGlzVG91Y2hBbmRUb3VjaERpc2FibGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChnZXRDdXJyZW50VGFyZ2V0KCkuaGFzQXR0cmlidXRlKFwiZGlzYWJsZWRcIikpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaW52b2tlSG9vayhcIm9uU2hvd1wiLCBbaW5zdGFuY2VdLCBmYWxzZSk7XG4gICAgICBpZiAoaW5zdGFuY2UucHJvcHMub25TaG93KGluc3RhbmNlKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaW5zdGFuY2Uuc3RhdGUuaXNWaXNpYmxlID0gdHJ1ZTtcbiAgICAgIGlmIChnZXRJc0RlZmF1bHRSZW5kZXJGbigpKSB7XG4gICAgICAgIHBvcHBlci5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG4gICAgICB9XG4gICAgICBoYW5kbGVTdHlsZXMoKTtcbiAgICAgIGFkZERvY3VtZW50UHJlc3MoKTtcbiAgICAgIGlmICghaW5zdGFuY2Uuc3RhdGUuaXNNb3VudGVkKSB7XG4gICAgICAgIHBvcHBlci5zdHlsZS50cmFuc2l0aW9uID0gXCJub25lXCI7XG4gICAgICB9XG4gICAgICBpZiAoZ2V0SXNEZWZhdWx0UmVuZGVyRm4oKSkge1xuICAgICAgICB2YXIgX2dldERlZmF1bHRUZW1wbGF0ZUNoMiA9IGdldERlZmF1bHRUZW1wbGF0ZUNoaWxkcmVuKCksIGJveCA9IF9nZXREZWZhdWx0VGVtcGxhdGVDaDIuYm94LCBjb250ZW50ID0gX2dldERlZmF1bHRUZW1wbGF0ZUNoMi5jb250ZW50O1xuICAgICAgICBzZXRUcmFuc2l0aW9uRHVyYXRpb24oW2JveCwgY29udGVudF0sIDApO1xuICAgICAgfVxuICAgICAgb25GaXJzdFVwZGF0ZSA9IGZ1bmN0aW9uIG9uRmlyc3RVcGRhdGUyKCkge1xuICAgICAgICB2YXIgX2luc3RhbmNlJHBvcHBlckluc3RhMjtcbiAgICAgICAgaWYgKCFpbnN0YW5jZS5zdGF0ZS5pc1Zpc2libGUgfHwgaWdub3JlT25GaXJzdFVwZGF0ZSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZ25vcmVPbkZpcnN0VXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgdm9pZCBwb3BwZXIub2Zmc2V0SGVpZ2h0O1xuICAgICAgICBwb3BwZXIuc3R5bGUudHJhbnNpdGlvbiA9IGluc3RhbmNlLnByb3BzLm1vdmVUcmFuc2l0aW9uO1xuICAgICAgICBpZiAoZ2V0SXNEZWZhdWx0UmVuZGVyRm4oKSAmJiBpbnN0YW5jZS5wcm9wcy5hbmltYXRpb24pIHtcbiAgICAgICAgICB2YXIgX2dldERlZmF1bHRUZW1wbGF0ZUNoMyA9IGdldERlZmF1bHRUZW1wbGF0ZUNoaWxkcmVuKCksIF9ib3ggPSBfZ2V0RGVmYXVsdFRlbXBsYXRlQ2gzLmJveCwgX2NvbnRlbnQgPSBfZ2V0RGVmYXVsdFRlbXBsYXRlQ2gzLmNvbnRlbnQ7XG4gICAgICAgICAgc2V0VHJhbnNpdGlvbkR1cmF0aW9uKFtfYm94LCBfY29udGVudF0sIGR1cmF0aW9uKTtcbiAgICAgICAgICBzZXRWaXNpYmlsaXR5U3RhdGUoW19ib3gsIF9jb250ZW50XSwgXCJ2aXNpYmxlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGhhbmRsZUFyaWFDb250ZW50QXR0cmlidXRlKCk7XG4gICAgICAgIGhhbmRsZUFyaWFFeHBhbmRlZEF0dHJpYnV0ZSgpO1xuICAgICAgICBwdXNoSWZVbmlxdWUobW91bnRlZEluc3RhbmNlcywgaW5zdGFuY2UpO1xuICAgICAgICAoX2luc3RhbmNlJHBvcHBlckluc3RhMiA9IGluc3RhbmNlLnBvcHBlckluc3RhbmNlKSA9PSBudWxsID8gdm9pZCAwIDogX2luc3RhbmNlJHBvcHBlckluc3RhMi5mb3JjZVVwZGF0ZSgpO1xuICAgICAgICBpbnN0YW5jZS5zdGF0ZS5pc01vdW50ZWQgPSB0cnVlO1xuICAgICAgICBpbnZva2VIb29rKFwib25Nb3VudFwiLCBbaW5zdGFuY2VdKTtcbiAgICAgICAgaWYgKGluc3RhbmNlLnByb3BzLmFuaW1hdGlvbiAmJiBnZXRJc0RlZmF1bHRSZW5kZXJGbigpKSB7XG4gICAgICAgICAgb25UcmFuc2l0aW9uZWRJbihkdXJhdGlvbiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpbnN0YW5jZS5zdGF0ZS5pc1Nob3duID0gdHJ1ZTtcbiAgICAgICAgICAgIGludm9rZUhvb2soXCJvblNob3duXCIsIFtpbnN0YW5jZV0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgbW91bnQoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaGlkZSgpIHtcbiAgICAgIGlmICh0cnVlKSB7XG4gICAgICAgIHdhcm5XaGVuKGluc3RhbmNlLnN0YXRlLmlzRGVzdHJveWVkLCBjcmVhdGVNZW1vcnlMZWFrV2FybmluZyhcImhpZGVcIikpO1xuICAgICAgfVxuICAgICAgdmFyIGlzQWxyZWFkeUhpZGRlbiA9ICFpbnN0YW5jZS5zdGF0ZS5pc1Zpc2libGU7XG4gICAgICB2YXIgaXNEZXN0cm95ZWQgPSBpbnN0YW5jZS5zdGF0ZS5pc0Rlc3Ryb3llZDtcbiAgICAgIHZhciBpc0Rpc2FibGVkID0gIWluc3RhbmNlLnN0YXRlLmlzRW5hYmxlZDtcbiAgICAgIHZhciBkdXJhdGlvbiA9IGdldFZhbHVlQXRJbmRleE9yUmV0dXJuKGluc3RhbmNlLnByb3BzLmR1cmF0aW9uLCAxLCBkZWZhdWx0UHJvcHMuZHVyYXRpb24pO1xuICAgICAgaWYgKGlzQWxyZWFkeUhpZGRlbiB8fCBpc0Rlc3Ryb3llZCB8fCBpc0Rpc2FibGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGludm9rZUhvb2soXCJvbkhpZGVcIiwgW2luc3RhbmNlXSwgZmFsc2UpO1xuICAgICAgaWYgKGluc3RhbmNlLnByb3BzLm9uSGlkZShpbnN0YW5jZSkgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGluc3RhbmNlLnN0YXRlLmlzVmlzaWJsZSA9IGZhbHNlO1xuICAgICAgaW5zdGFuY2Uuc3RhdGUuaXNTaG93biA9IGZhbHNlO1xuICAgICAgaWdub3JlT25GaXJzdFVwZGF0ZSA9IGZhbHNlO1xuICAgICAgaXNWaXNpYmxlRnJvbUNsaWNrID0gZmFsc2U7XG4gICAgICBpZiAoZ2V0SXNEZWZhdWx0UmVuZGVyRm4oKSkge1xuICAgICAgICBwb3BwZXIuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICB9XG4gICAgICBjbGVhbnVwSW50ZXJhY3RpdmVNb3VzZUxpc3RlbmVycygpO1xuICAgICAgcmVtb3ZlRG9jdW1lbnRQcmVzcygpO1xuICAgICAgaGFuZGxlU3R5bGVzKCk7XG4gICAgICBpZiAoZ2V0SXNEZWZhdWx0UmVuZGVyRm4oKSkge1xuICAgICAgICB2YXIgX2dldERlZmF1bHRUZW1wbGF0ZUNoNCA9IGdldERlZmF1bHRUZW1wbGF0ZUNoaWxkcmVuKCksIGJveCA9IF9nZXREZWZhdWx0VGVtcGxhdGVDaDQuYm94LCBjb250ZW50ID0gX2dldERlZmF1bHRUZW1wbGF0ZUNoNC5jb250ZW50O1xuICAgICAgICBpZiAoaW5zdGFuY2UucHJvcHMuYW5pbWF0aW9uKSB7XG4gICAgICAgICAgc2V0VHJhbnNpdGlvbkR1cmF0aW9uKFtib3gsIGNvbnRlbnRdLCBkdXJhdGlvbik7XG4gICAgICAgICAgc2V0VmlzaWJpbGl0eVN0YXRlKFtib3gsIGNvbnRlbnRdLCBcImhpZGRlblwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaGFuZGxlQXJpYUNvbnRlbnRBdHRyaWJ1dGUoKTtcbiAgICAgIGhhbmRsZUFyaWFFeHBhbmRlZEF0dHJpYnV0ZSgpO1xuICAgICAgaWYgKGluc3RhbmNlLnByb3BzLmFuaW1hdGlvbikge1xuICAgICAgICBpZiAoZ2V0SXNEZWZhdWx0UmVuZGVyRm4oKSkge1xuICAgICAgICAgIG9uVHJhbnNpdGlvbmVkT3V0KGR1cmF0aW9uLCBpbnN0YW5jZS51bm1vdW50KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5zdGFuY2UudW5tb3VudCgpO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBoaWRlV2l0aEludGVyYWN0aXZpdHkoZXZlbnQpIHtcbiAgICAgIGlmICh0cnVlKSB7XG4gICAgICAgIHdhcm5XaGVuKGluc3RhbmNlLnN0YXRlLmlzRGVzdHJveWVkLCBjcmVhdGVNZW1vcnlMZWFrV2FybmluZyhcImhpZGVXaXRoSW50ZXJhY3Rpdml0eVwiKSk7XG4gICAgICB9XG4gICAgICBnZXREb2N1bWVudCgpLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgZGVib3VuY2VkT25Nb3VzZU1vdmUpO1xuICAgICAgcHVzaElmVW5pcXVlKG1vdXNlTW92ZUxpc3RlbmVycywgZGVib3VuY2VkT25Nb3VzZU1vdmUpO1xuICAgICAgZGVib3VuY2VkT25Nb3VzZU1vdmUoZXZlbnQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiB1bm1vdW50KCkge1xuICAgICAgaWYgKHRydWUpIHtcbiAgICAgICAgd2FybldoZW4oaW5zdGFuY2Uuc3RhdGUuaXNEZXN0cm95ZWQsIGNyZWF0ZU1lbW9yeUxlYWtXYXJuaW5nKFwidW5tb3VudFwiKSk7XG4gICAgICB9XG4gICAgICBpZiAoaW5zdGFuY2Uuc3RhdGUuaXNWaXNpYmxlKSB7XG4gICAgICAgIGluc3RhbmNlLmhpZGUoKTtcbiAgICAgIH1cbiAgICAgIGlmICghaW5zdGFuY2Uuc3RhdGUuaXNNb3VudGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGRlc3Ryb3lQb3BwZXJJbnN0YW5jZSgpO1xuICAgICAgZ2V0TmVzdGVkUG9wcGVyVHJlZSgpLmZvckVhY2goZnVuY3Rpb24obmVzdGVkUG9wcGVyKSB7XG4gICAgICAgIG5lc3RlZFBvcHBlci5fdGlwcHkudW5tb3VudCgpO1xuICAgICAgfSk7XG4gICAgICBpZiAocG9wcGVyLnBhcmVudE5vZGUpIHtcbiAgICAgICAgcG9wcGVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocG9wcGVyKTtcbiAgICAgIH1cbiAgICAgIG1vdW50ZWRJbnN0YW5jZXMgPSBtb3VudGVkSW5zdGFuY2VzLmZpbHRlcihmdW5jdGlvbihpKSB7XG4gICAgICAgIHJldHVybiBpICE9PSBpbnN0YW5jZTtcbiAgICAgIH0pO1xuICAgICAgaW5zdGFuY2Uuc3RhdGUuaXNNb3VudGVkID0gZmFsc2U7XG4gICAgICBpbnZva2VIb29rKFwib25IaWRkZW5cIiwgW2luc3RhbmNlXSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG4gICAgICBpZiAodHJ1ZSkge1xuICAgICAgICB3YXJuV2hlbihpbnN0YW5jZS5zdGF0ZS5pc0Rlc3Ryb3llZCwgY3JlYXRlTWVtb3J5TGVha1dhcm5pbmcoXCJkZXN0cm95XCIpKTtcbiAgICAgIH1cbiAgICAgIGlmIChpbnN0YW5jZS5zdGF0ZS5pc0Rlc3Ryb3llZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpbnN0YW5jZS5jbGVhckRlbGF5VGltZW91dHMoKTtcbiAgICAgIGluc3RhbmNlLnVubW91bnQoKTtcbiAgICAgIHJlbW92ZUxpc3RlbmVycygpO1xuICAgICAgZGVsZXRlIHJlZmVyZW5jZS5fdGlwcHk7XG4gICAgICBpbnN0YW5jZS5zdGF0ZS5pc0Rlc3Ryb3llZCA9IHRydWU7XG4gICAgICBpbnZva2VIb29rKFwib25EZXN0cm95XCIsIFtpbnN0YW5jZV0pO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiB0aXBweTIodGFyZ2V0cywgb3B0aW9uYWxQcm9wcykge1xuICAgIGlmIChvcHRpb25hbFByb3BzID09PSB2b2lkIDApIHtcbiAgICAgIG9wdGlvbmFsUHJvcHMgPSB7fTtcbiAgICB9XG4gICAgdmFyIHBsdWdpbnMgPSBkZWZhdWx0UHJvcHMucGx1Z2lucy5jb25jYXQob3B0aW9uYWxQcm9wcy5wbHVnaW5zIHx8IFtdKTtcbiAgICBpZiAodHJ1ZSkge1xuICAgICAgdmFsaWRhdGVUYXJnZXRzKHRhcmdldHMpO1xuICAgICAgdmFsaWRhdGVQcm9wcyhvcHRpb25hbFByb3BzLCBwbHVnaW5zKTtcbiAgICB9XG4gICAgYmluZEdsb2JhbEV2ZW50TGlzdGVuZXJzKCk7XG4gICAgdmFyIHBhc3NlZFByb3BzID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9uYWxQcm9wcywge1xuICAgICAgcGx1Z2luc1xuICAgIH0pO1xuICAgIHZhciBlbGVtZW50cyA9IGdldEFycmF5T2ZFbGVtZW50cyh0YXJnZXRzKTtcbiAgICBpZiAodHJ1ZSkge1xuICAgICAgdmFyIGlzU2luZ2xlQ29udGVudEVsZW1lbnQgPSBpc0VsZW1lbnQocGFzc2VkUHJvcHMuY29udGVudCk7XG4gICAgICB2YXIgaXNNb3JlVGhhbk9uZVJlZmVyZW5jZUVsZW1lbnQgPSBlbGVtZW50cy5sZW5ndGggPiAxO1xuICAgICAgd2FybldoZW4oaXNTaW5nbGVDb250ZW50RWxlbWVudCAmJiBpc01vcmVUaGFuT25lUmVmZXJlbmNlRWxlbWVudCwgW1widGlwcHkoKSB3YXMgcGFzc2VkIGFuIEVsZW1lbnQgYXMgdGhlIGBjb250ZW50YCBwcm9wLCBidXQgbW9yZSB0aGFuXCIsIFwib25lIHRpcHB5IGluc3RhbmNlIHdhcyBjcmVhdGVkIGJ5IHRoaXMgaW52b2NhdGlvbi4gVGhpcyBtZWFucyB0aGVcIiwgXCJjb250ZW50IGVsZW1lbnQgd2lsbCBvbmx5IGJlIGFwcGVuZGVkIHRvIHRoZSBsYXN0IHRpcHB5IGluc3RhbmNlLlwiLCBcIlxcblxcblwiLCBcIkluc3RlYWQsIHBhc3MgdGhlIC5pbm5lckhUTUwgb2YgdGhlIGVsZW1lbnQsIG9yIHVzZSBhIGZ1bmN0aW9uIHRoYXRcIiwgXCJyZXR1cm5zIGEgY2xvbmVkIHZlcnNpb24gb2YgdGhlIGVsZW1lbnQgaW5zdGVhZC5cIiwgXCJcXG5cXG5cIiwgXCIxKSBjb250ZW50OiBlbGVtZW50LmlubmVySFRNTFxcblwiLCBcIjIpIGNvbnRlbnQ6ICgpID0+IGVsZW1lbnQuY2xvbmVOb2RlKHRydWUpXCJdLmpvaW4oXCIgXCIpKTtcbiAgICB9XG4gICAgdmFyIGluc3RhbmNlcyA9IGVsZW1lbnRzLnJlZHVjZShmdW5jdGlvbihhY2MsIHJlZmVyZW5jZSkge1xuICAgICAgdmFyIGluc3RhbmNlID0gcmVmZXJlbmNlICYmIGNyZWF0ZVRpcHB5KHJlZmVyZW5jZSwgcGFzc2VkUHJvcHMpO1xuICAgICAgaWYgKGluc3RhbmNlKSB7XG4gICAgICAgIGFjYy5wdXNoKGluc3RhbmNlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSwgW10pO1xuICAgIHJldHVybiBpc0VsZW1lbnQodGFyZ2V0cykgPyBpbnN0YW5jZXNbMF0gOiBpbnN0YW5jZXM7XG4gIH1cbiAgdGlwcHkyLmRlZmF1bHRQcm9wcyA9IGRlZmF1bHRQcm9wcztcbiAgdGlwcHkyLnNldERlZmF1bHRQcm9wcyA9IHNldERlZmF1bHRQcm9wcztcbiAgdGlwcHkyLmN1cnJlbnRJbnB1dCA9IGN1cnJlbnRJbnB1dDtcbiAgdmFyIGhpZGVBbGwgPSBmdW5jdGlvbiBoaWRlQWxsMihfdGVtcCkge1xuICAgIHZhciBfcmVmID0gX3RlbXAgPT09IHZvaWQgMCA/IHt9IDogX3RlbXAsIGV4Y2x1ZGVkUmVmZXJlbmNlT3JJbnN0YW5jZSA9IF9yZWYuZXhjbHVkZSwgZHVyYXRpb24gPSBfcmVmLmR1cmF0aW9uO1xuICAgIG1vdW50ZWRJbnN0YW5jZXMuZm9yRWFjaChmdW5jdGlvbihpbnN0YW5jZSkge1xuICAgICAgdmFyIGlzRXhjbHVkZWQgPSBmYWxzZTtcbiAgICAgIGlmIChleGNsdWRlZFJlZmVyZW5jZU9ySW5zdGFuY2UpIHtcbiAgICAgICAgaXNFeGNsdWRlZCA9IGlzUmVmZXJlbmNlRWxlbWVudChleGNsdWRlZFJlZmVyZW5jZU9ySW5zdGFuY2UpID8gaW5zdGFuY2UucmVmZXJlbmNlID09PSBleGNsdWRlZFJlZmVyZW5jZU9ySW5zdGFuY2UgOiBpbnN0YW5jZS5wb3BwZXIgPT09IGV4Y2x1ZGVkUmVmZXJlbmNlT3JJbnN0YW5jZS5wb3BwZXI7XG4gICAgICB9XG4gICAgICBpZiAoIWlzRXhjbHVkZWQpIHtcbiAgICAgICAgdmFyIG9yaWdpbmFsRHVyYXRpb24gPSBpbnN0YW5jZS5wcm9wcy5kdXJhdGlvbjtcbiAgICAgICAgaW5zdGFuY2Uuc2V0UHJvcHMoe1xuICAgICAgICAgIGR1cmF0aW9uXG4gICAgICAgIH0pO1xuICAgICAgICBpbnN0YW5jZS5oaWRlKCk7XG4gICAgICAgIGlmICghaW5zdGFuY2Uuc3RhdGUuaXNEZXN0cm95ZWQpIHtcbiAgICAgICAgICBpbnN0YW5jZS5zZXRQcm9wcyh7XG4gICAgICAgICAgICBkdXJhdGlvbjogb3JpZ2luYWxEdXJhdGlvblxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG4gIHZhciBhcHBseVN0eWxlc01vZGlmaWVyID0gT2JqZWN0LmFzc2lnbih7fSwgY29yZS5hcHBseVN0eWxlcywge1xuICAgIGVmZmVjdDogZnVuY3Rpb24gZWZmZWN0KF9yZWYpIHtcbiAgICAgIHZhciBzdGF0ZSA9IF9yZWYuc3RhdGU7XG4gICAgICB2YXIgaW5pdGlhbFN0eWxlcyA9IHtcbiAgICAgICAgcG9wcGVyOiB7XG4gICAgICAgICAgcG9zaXRpb246IHN0YXRlLm9wdGlvbnMuc3RyYXRlZ3ksXG4gICAgICAgICAgbGVmdDogXCIwXCIsXG4gICAgICAgICAgdG9wOiBcIjBcIixcbiAgICAgICAgICBtYXJnaW46IFwiMFwiXG4gICAgICAgIH0sXG4gICAgICAgIGFycm93OiB7XG4gICAgICAgICAgcG9zaXRpb246IFwiYWJzb2x1dGVcIlxuICAgICAgICB9LFxuICAgICAgICByZWZlcmVuY2U6IHt9XG4gICAgICB9O1xuICAgICAgT2JqZWN0LmFzc2lnbihzdGF0ZS5lbGVtZW50cy5wb3BwZXIuc3R5bGUsIGluaXRpYWxTdHlsZXMucG9wcGVyKTtcbiAgICAgIHN0YXRlLnN0eWxlcyA9IGluaXRpYWxTdHlsZXM7XG4gICAgICBpZiAoc3RhdGUuZWxlbWVudHMuYXJyb3cpIHtcbiAgICAgICAgT2JqZWN0LmFzc2lnbihzdGF0ZS5lbGVtZW50cy5hcnJvdy5zdHlsZSwgaW5pdGlhbFN0eWxlcy5hcnJvdyk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgdmFyIGNyZWF0ZVNpbmdsZXRvbiA9IGZ1bmN0aW9uIGNyZWF0ZVNpbmdsZXRvbjIodGlwcHlJbnN0YW5jZXMsIG9wdGlvbmFsUHJvcHMpIHtcbiAgICB2YXIgX29wdGlvbmFsUHJvcHMkcG9wcGVyO1xuICAgIGlmIChvcHRpb25hbFByb3BzID09PSB2b2lkIDApIHtcbiAgICAgIG9wdGlvbmFsUHJvcHMgPSB7fTtcbiAgICB9XG4gICAgaWYgKHRydWUpIHtcbiAgICAgIGVycm9yV2hlbighQXJyYXkuaXNBcnJheSh0aXBweUluc3RhbmNlcyksIFtcIlRoZSBmaXJzdCBhcmd1bWVudCBwYXNzZWQgdG8gY3JlYXRlU2luZ2xldG9uKCkgbXVzdCBiZSBhbiBhcnJheSBvZlwiLCBcInRpcHB5IGluc3RhbmNlcy4gVGhlIHBhc3NlZCB2YWx1ZSB3YXNcIiwgU3RyaW5nKHRpcHB5SW5zdGFuY2VzKV0uam9pbihcIiBcIikpO1xuICAgIH1cbiAgICB2YXIgaW5kaXZpZHVhbEluc3RhbmNlcyA9IHRpcHB5SW5zdGFuY2VzO1xuICAgIHZhciByZWZlcmVuY2VzID0gW107XG4gICAgdmFyIGN1cnJlbnRUYXJnZXQ7XG4gICAgdmFyIG92ZXJyaWRlcyA9IG9wdGlvbmFsUHJvcHMub3ZlcnJpZGVzO1xuICAgIHZhciBpbnRlcmNlcHRTZXRQcm9wc0NsZWFudXBzID0gW107XG4gICAgdmFyIHNob3duT25DcmVhdGUgPSBmYWxzZTtcbiAgICBmdW5jdGlvbiBzZXRSZWZlcmVuY2VzKCkge1xuICAgICAgcmVmZXJlbmNlcyA9IGluZGl2aWR1YWxJbnN0YW5jZXMubWFwKGZ1bmN0aW9uKGluc3RhbmNlKSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZS5yZWZlcmVuY2U7XG4gICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZW5hYmxlSW5zdGFuY2VzKGlzRW5hYmxlZCkge1xuICAgICAgaW5kaXZpZHVhbEluc3RhbmNlcy5mb3JFYWNoKGZ1bmN0aW9uKGluc3RhbmNlKSB7XG4gICAgICAgIGlmIChpc0VuYWJsZWQpIHtcbiAgICAgICAgICBpbnN0YW5jZS5lbmFibGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbnN0YW5jZS5kaXNhYmxlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbnRlcmNlcHRTZXRQcm9wcyhzaW5nbGV0b24yKSB7XG4gICAgICByZXR1cm4gaW5kaXZpZHVhbEluc3RhbmNlcy5tYXAoZnVuY3Rpb24oaW5zdGFuY2UpIHtcbiAgICAgICAgdmFyIG9yaWdpbmFsU2V0UHJvcHMyID0gaW5zdGFuY2Uuc2V0UHJvcHM7XG4gICAgICAgIGluc3RhbmNlLnNldFByb3BzID0gZnVuY3Rpb24ocHJvcHMpIHtcbiAgICAgICAgICBvcmlnaW5hbFNldFByb3BzMihwcm9wcyk7XG4gICAgICAgICAgaWYgKGluc3RhbmNlLnJlZmVyZW5jZSA9PT0gY3VycmVudFRhcmdldCkge1xuICAgICAgICAgICAgc2luZ2xldG9uMi5zZXRQcm9wcyhwcm9wcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaW5zdGFuY2Uuc2V0UHJvcHMgPSBvcmlnaW5hbFNldFByb3BzMjtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwcmVwYXJlSW5zdGFuY2Uoc2luZ2xldG9uMiwgdGFyZ2V0KSB7XG4gICAgICB2YXIgaW5kZXggPSByZWZlcmVuY2VzLmluZGV4T2YodGFyZ2V0KTtcbiAgICAgIGlmICh0YXJnZXQgPT09IGN1cnJlbnRUYXJnZXQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY3VycmVudFRhcmdldCA9IHRhcmdldDtcbiAgICAgIHZhciBvdmVycmlkZVByb3BzID0gKG92ZXJyaWRlcyB8fCBbXSkuY29uY2F0KFwiY29udGVudFwiKS5yZWR1Y2UoZnVuY3Rpb24oYWNjLCBwcm9wKSB7XG4gICAgICAgIGFjY1twcm9wXSA9IGluZGl2aWR1YWxJbnN0YW5jZXNbaW5kZXhdLnByb3BzW3Byb3BdO1xuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfSwge30pO1xuICAgICAgc2luZ2xldG9uMi5zZXRQcm9wcyhPYmplY3QuYXNzaWduKHt9LCBvdmVycmlkZVByb3BzLCB7XG4gICAgICAgIGdldFJlZmVyZW5jZUNsaWVudFJlY3Q6IHR5cGVvZiBvdmVycmlkZVByb3BzLmdldFJlZmVyZW5jZUNsaWVudFJlY3QgPT09IFwiZnVuY3Rpb25cIiA/IG92ZXJyaWRlUHJvcHMuZ2V0UmVmZXJlbmNlQ2xpZW50UmVjdCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB0YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9XG4gICAgZW5hYmxlSW5zdGFuY2VzKGZhbHNlKTtcbiAgICBzZXRSZWZlcmVuY2VzKCk7XG4gICAgdmFyIHBsdWdpbiA9IHtcbiAgICAgIGZuOiBmdW5jdGlvbiBmbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBvbkRlc3Ryb3k6IGZ1bmN0aW9uIG9uRGVzdHJveSgpIHtcbiAgICAgICAgICAgIGVuYWJsZUluc3RhbmNlcyh0cnVlKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uSGlkZGVuOiBmdW5jdGlvbiBvbkhpZGRlbigpIHtcbiAgICAgICAgICAgIGN1cnJlbnRUYXJnZXQgPSBudWxsO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25DbGlja091dHNpZGU6IGZ1bmN0aW9uIG9uQ2xpY2tPdXRzaWRlKGluc3RhbmNlKSB7XG4gICAgICAgICAgICBpZiAoaW5zdGFuY2UucHJvcHMuc2hvd09uQ3JlYXRlICYmICFzaG93bk9uQ3JlYXRlKSB7XG4gICAgICAgICAgICAgIHNob3duT25DcmVhdGUgPSB0cnVlO1xuICAgICAgICAgICAgICBjdXJyZW50VGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uU2hvdzogZnVuY3Rpb24gb25TaG93KGluc3RhbmNlKSB7XG4gICAgICAgICAgICBpZiAoaW5zdGFuY2UucHJvcHMuc2hvd09uQ3JlYXRlICYmICFzaG93bk9uQ3JlYXRlKSB7XG4gICAgICAgICAgICAgIHNob3duT25DcmVhdGUgPSB0cnVlO1xuICAgICAgICAgICAgICBwcmVwYXJlSW5zdGFuY2UoaW5zdGFuY2UsIHJlZmVyZW5jZXNbMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgb25UcmlnZ2VyOiBmdW5jdGlvbiBvblRyaWdnZXIoaW5zdGFuY2UsIGV2ZW50KSB7XG4gICAgICAgICAgICBwcmVwYXJlSW5zdGFuY2UoaW5zdGFuY2UsIGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBzaW5nbGV0b24gPSB0aXBweTIoZGl2KCksIE9iamVjdC5hc3NpZ24oe30sIHJlbW92ZVByb3BlcnRpZXMob3B0aW9uYWxQcm9wcywgW1wib3ZlcnJpZGVzXCJdKSwge1xuICAgICAgcGx1Z2luczogW3BsdWdpbl0uY29uY2F0KG9wdGlvbmFsUHJvcHMucGx1Z2lucyB8fCBbXSksXG4gICAgICB0cmlnZ2VyVGFyZ2V0OiByZWZlcmVuY2VzLFxuICAgICAgcG9wcGVyT3B0aW9uczogT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9uYWxQcm9wcy5wb3BwZXJPcHRpb25zLCB7XG4gICAgICAgIG1vZGlmaWVyczogW10uY29uY2F0KCgoX29wdGlvbmFsUHJvcHMkcG9wcGVyID0gb3B0aW9uYWxQcm9wcy5wb3BwZXJPcHRpb25zKSA9PSBudWxsID8gdm9pZCAwIDogX29wdGlvbmFsUHJvcHMkcG9wcGVyLm1vZGlmaWVycykgfHwgW10sIFthcHBseVN0eWxlc01vZGlmaWVyXSlcbiAgICAgIH0pXG4gICAgfSkpO1xuICAgIHZhciBvcmlnaW5hbFNob3cgPSBzaW5nbGV0b24uc2hvdztcbiAgICBzaW5nbGV0b24uc2hvdyA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgb3JpZ2luYWxTaG93KCk7XG4gICAgICBpZiAoIWN1cnJlbnRUYXJnZXQgJiYgdGFyZ2V0ID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHByZXBhcmVJbnN0YW5jZShzaW5nbGV0b24sIHJlZmVyZW5jZXNbMF0pO1xuICAgICAgfVxuICAgICAgaWYgKGN1cnJlbnRUYXJnZXQgJiYgdGFyZ2V0ID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB0YXJnZXQgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgcmV0dXJuIHJlZmVyZW5jZXNbdGFyZ2V0XSAmJiBwcmVwYXJlSW5zdGFuY2Uoc2luZ2xldG9uLCByZWZlcmVuY2VzW3RhcmdldF0pO1xuICAgICAgfVxuICAgICAgaWYgKGluZGl2aWR1YWxJbnN0YW5jZXMuaW5jbHVkZXModGFyZ2V0KSkge1xuICAgICAgICB2YXIgcmVmID0gdGFyZ2V0LnJlZmVyZW5jZTtcbiAgICAgICAgcmV0dXJuIHByZXBhcmVJbnN0YW5jZShzaW5nbGV0b24sIHJlZik7XG4gICAgICB9XG4gICAgICBpZiAocmVmZXJlbmNlcy5pbmNsdWRlcyh0YXJnZXQpKSB7XG4gICAgICAgIHJldHVybiBwcmVwYXJlSW5zdGFuY2Uoc2luZ2xldG9uLCB0YXJnZXQpO1xuICAgICAgfVxuICAgIH07XG4gICAgc2luZ2xldG9uLnNob3dOZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZmlyc3QgPSByZWZlcmVuY2VzWzBdO1xuICAgICAgaWYgKCFjdXJyZW50VGFyZ2V0KSB7XG4gICAgICAgIHJldHVybiBzaW5nbGV0b24uc2hvdygwKTtcbiAgICAgIH1cbiAgICAgIHZhciBpbmRleCA9IHJlZmVyZW5jZXMuaW5kZXhPZihjdXJyZW50VGFyZ2V0KTtcbiAgICAgIHNpbmdsZXRvbi5zaG93KHJlZmVyZW5jZXNbaW5kZXggKyAxXSB8fCBmaXJzdCk7XG4gICAgfTtcbiAgICBzaW5nbGV0b24uc2hvd1ByZXZpb3VzID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbGFzdCA9IHJlZmVyZW5jZXNbcmVmZXJlbmNlcy5sZW5ndGggLSAxXTtcbiAgICAgIGlmICghY3VycmVudFRhcmdldCkge1xuICAgICAgICByZXR1cm4gc2luZ2xldG9uLnNob3cobGFzdCk7XG4gICAgICB9XG4gICAgICB2YXIgaW5kZXggPSByZWZlcmVuY2VzLmluZGV4T2YoY3VycmVudFRhcmdldCk7XG4gICAgICB2YXIgdGFyZ2V0ID0gcmVmZXJlbmNlc1tpbmRleCAtIDFdIHx8IGxhc3Q7XG4gICAgICBzaW5nbGV0b24uc2hvdyh0YXJnZXQpO1xuICAgIH07XG4gICAgdmFyIG9yaWdpbmFsU2V0UHJvcHMgPSBzaW5nbGV0b24uc2V0UHJvcHM7XG4gICAgc2luZ2xldG9uLnNldFByb3BzID0gZnVuY3Rpb24ocHJvcHMpIHtcbiAgICAgIG92ZXJyaWRlcyA9IHByb3BzLm92ZXJyaWRlcyB8fCBvdmVycmlkZXM7XG4gICAgICBvcmlnaW5hbFNldFByb3BzKHByb3BzKTtcbiAgICB9O1xuICAgIHNpbmdsZXRvbi5zZXRJbnN0YW5jZXMgPSBmdW5jdGlvbihuZXh0SW5zdGFuY2VzKSB7XG4gICAgICBlbmFibGVJbnN0YW5jZXModHJ1ZSk7XG4gICAgICBpbnRlcmNlcHRTZXRQcm9wc0NsZWFudXBzLmZvckVhY2goZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgcmV0dXJuIGZuKCk7XG4gICAgICB9KTtcbiAgICAgIGluZGl2aWR1YWxJbnN0YW5jZXMgPSBuZXh0SW5zdGFuY2VzO1xuICAgICAgZW5hYmxlSW5zdGFuY2VzKGZhbHNlKTtcbiAgICAgIHNldFJlZmVyZW5jZXMoKTtcbiAgICAgIGludGVyY2VwdFNldFByb3BzKHNpbmdsZXRvbik7XG4gICAgICBzaW5nbGV0b24uc2V0UHJvcHMoe1xuICAgICAgICB0cmlnZ2VyVGFyZ2V0OiByZWZlcmVuY2VzXG4gICAgICB9KTtcbiAgICB9O1xuICAgIGludGVyY2VwdFNldFByb3BzQ2xlYW51cHMgPSBpbnRlcmNlcHRTZXRQcm9wcyhzaW5nbGV0b24pO1xuICAgIHJldHVybiBzaW5nbGV0b247XG4gIH07XG4gIHZhciBCVUJCTElOR19FVkVOVFNfTUFQID0ge1xuICAgIG1vdXNlb3ZlcjogXCJtb3VzZWVudGVyXCIsXG4gICAgZm9jdXNpbjogXCJmb2N1c1wiLFxuICAgIGNsaWNrOiBcImNsaWNrXCJcbiAgfTtcbiAgZnVuY3Rpb24gZGVsZWdhdGUodGFyZ2V0cywgcHJvcHMpIHtcbiAgICBpZiAodHJ1ZSkge1xuICAgICAgZXJyb3JXaGVuKCEocHJvcHMgJiYgcHJvcHMudGFyZ2V0KSwgW1wiWW91IG11c3Qgc3BlY2l0eSBhIGB0YXJnZXRgIHByb3AgaW5kaWNhdGluZyBhIENTUyBzZWxlY3RvciBzdHJpbmcgbWF0Y2hpbmdcIiwgXCJ0aGUgdGFyZ2V0IGVsZW1lbnRzIHRoYXQgc2hvdWxkIHJlY2VpdmUgYSB0aXBweS5cIl0uam9pbihcIiBcIikpO1xuICAgIH1cbiAgICB2YXIgbGlzdGVuZXJzID0gW107XG4gICAgdmFyIGNoaWxkVGlwcHlJbnN0YW5jZXMgPSBbXTtcbiAgICB2YXIgZGlzYWJsZWQgPSBmYWxzZTtcbiAgICB2YXIgdGFyZ2V0ID0gcHJvcHMudGFyZ2V0O1xuICAgIHZhciBuYXRpdmVQcm9wcyA9IHJlbW92ZVByb3BlcnRpZXMocHJvcHMsIFtcInRhcmdldFwiXSk7XG4gICAgdmFyIHBhcmVudFByb3BzID0gT2JqZWN0LmFzc2lnbih7fSwgbmF0aXZlUHJvcHMsIHtcbiAgICAgIHRyaWdnZXI6IFwibWFudWFsXCIsXG4gICAgICB0b3VjaDogZmFsc2VcbiAgICB9KTtcbiAgICB2YXIgY2hpbGRQcm9wcyA9IE9iamVjdC5hc3NpZ24oe30sIG5hdGl2ZVByb3BzLCB7XG4gICAgICBzaG93T25DcmVhdGU6IHRydWVcbiAgICB9KTtcbiAgICB2YXIgcmV0dXJuVmFsdWUgPSB0aXBweTIodGFyZ2V0cywgcGFyZW50UHJvcHMpO1xuICAgIHZhciBub3JtYWxpemVkUmV0dXJuVmFsdWUgPSBub3JtYWxpemVUb0FycmF5KHJldHVyblZhbHVlKTtcbiAgICBmdW5jdGlvbiBvblRyaWdnZXIoZXZlbnQpIHtcbiAgICAgIGlmICghZXZlbnQudGFyZ2V0IHx8IGRpc2FibGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciB0YXJnZXROb2RlID0gZXZlbnQudGFyZ2V0LmNsb3Nlc3QodGFyZ2V0KTtcbiAgICAgIGlmICghdGFyZ2V0Tm9kZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgdHJpZ2dlciA9IHRhcmdldE5vZGUuZ2V0QXR0cmlidXRlKFwiZGF0YS10aXBweS10cmlnZ2VyXCIpIHx8IHByb3BzLnRyaWdnZXIgfHwgZGVmYXVsdFByb3BzLnRyaWdnZXI7XG4gICAgICBpZiAodGFyZ2V0Tm9kZS5fdGlwcHkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKGV2ZW50LnR5cGUgPT09IFwidG91Y2hzdGFydFwiICYmIHR5cGVvZiBjaGlsZFByb3BzLnRvdWNoID09PSBcImJvb2xlYW5cIikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoZXZlbnQudHlwZSAhPT0gXCJ0b3VjaHN0YXJ0XCIgJiYgdHJpZ2dlci5pbmRleE9mKEJVQkJMSU5HX0VWRU5UU19NQVBbZXZlbnQudHlwZV0pIDwgMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgaW5zdGFuY2UgPSB0aXBweTIodGFyZ2V0Tm9kZSwgY2hpbGRQcm9wcyk7XG4gICAgICBpZiAoaW5zdGFuY2UpIHtcbiAgICAgICAgY2hpbGRUaXBweUluc3RhbmNlcyA9IGNoaWxkVGlwcHlJbnN0YW5jZXMuY29uY2F0KGluc3RhbmNlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gb24obm9kZSwgZXZlbnRUeXBlLCBoYW5kbGVyLCBvcHRpb25zKSB7XG4gICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7XG4gICAgICAgIG9wdGlvbnMgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgICAgbGlzdGVuZXJzLnB1c2goe1xuICAgICAgICBub2RlLFxuICAgICAgICBldmVudFR5cGUsXG4gICAgICAgIGhhbmRsZXIsXG4gICAgICAgIG9wdGlvbnNcbiAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBhZGRFdmVudExpc3RlbmVycyhpbnN0YW5jZSkge1xuICAgICAgdmFyIHJlZmVyZW5jZSA9IGluc3RhbmNlLnJlZmVyZW5jZTtcbiAgICAgIG9uKHJlZmVyZW5jZSwgXCJ0b3VjaHN0YXJ0XCIsIG9uVHJpZ2dlciwgVE9VQ0hfT1BUSU9OUyk7XG4gICAgICBvbihyZWZlcmVuY2UsIFwibW91c2VvdmVyXCIsIG9uVHJpZ2dlcik7XG4gICAgICBvbihyZWZlcmVuY2UsIFwiZm9jdXNpblwiLCBvblRyaWdnZXIpO1xuICAgICAgb24ocmVmZXJlbmNlLCBcImNsaWNrXCIsIG9uVHJpZ2dlcik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbW92ZUV2ZW50TGlzdGVuZXJzKCkge1xuICAgICAgbGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24oX3JlZikge1xuICAgICAgICB2YXIgbm9kZSA9IF9yZWYubm9kZSwgZXZlbnRUeXBlID0gX3JlZi5ldmVudFR5cGUsIGhhbmRsZXIgPSBfcmVmLmhhbmRsZXIsIG9wdGlvbnMgPSBfcmVmLm9wdGlvbnM7XG4gICAgICAgIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgICAgfSk7XG4gICAgICBsaXN0ZW5lcnMgPSBbXTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYXBwbHlNdXRhdGlvbnMoaW5zdGFuY2UpIHtcbiAgICAgIHZhciBvcmlnaW5hbERlc3Ryb3kgPSBpbnN0YW5jZS5kZXN0cm95O1xuICAgICAgdmFyIG9yaWdpbmFsRW5hYmxlID0gaW5zdGFuY2UuZW5hYmxlO1xuICAgICAgdmFyIG9yaWdpbmFsRGlzYWJsZSA9IGluc3RhbmNlLmRpc2FibGU7XG4gICAgICBpbnN0YW5jZS5kZXN0cm95ID0gZnVuY3Rpb24oc2hvdWxkRGVzdHJveUNoaWxkSW5zdGFuY2VzKSB7XG4gICAgICAgIGlmIChzaG91bGREZXN0cm95Q2hpbGRJbnN0YW5jZXMgPT09IHZvaWQgMCkge1xuICAgICAgICAgIHNob3VsZERlc3Ryb3lDaGlsZEluc3RhbmNlcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNob3VsZERlc3Ryb3lDaGlsZEluc3RhbmNlcykge1xuICAgICAgICAgIGNoaWxkVGlwcHlJbnN0YW5jZXMuZm9yRWFjaChmdW5jdGlvbihpbnN0YW5jZTIpIHtcbiAgICAgICAgICAgIGluc3RhbmNlMi5kZXN0cm95KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2hpbGRUaXBweUluc3RhbmNlcyA9IFtdO1xuICAgICAgICByZW1vdmVFdmVudExpc3RlbmVycygpO1xuICAgICAgICBvcmlnaW5hbERlc3Ryb3koKTtcbiAgICAgIH07XG4gICAgICBpbnN0YW5jZS5lbmFibGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgb3JpZ2luYWxFbmFibGUoKTtcbiAgICAgICAgY2hpbGRUaXBweUluc3RhbmNlcy5mb3JFYWNoKGZ1bmN0aW9uKGluc3RhbmNlMikge1xuICAgICAgICAgIHJldHVybiBpbnN0YW5jZTIuZW5hYmxlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBkaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgfTtcbiAgICAgIGluc3RhbmNlLmRpc2FibGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgb3JpZ2luYWxEaXNhYmxlKCk7XG4gICAgICAgIGNoaWxkVGlwcHlJbnN0YW5jZXMuZm9yRWFjaChmdW5jdGlvbihpbnN0YW5jZTIpIHtcbiAgICAgICAgICByZXR1cm4gaW5zdGFuY2UyLmRpc2FibGUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGRpc2FibGVkID0gdHJ1ZTtcbiAgICAgIH07XG4gICAgICBhZGRFdmVudExpc3RlbmVycyhpbnN0YW5jZSk7XG4gICAgfVxuICAgIG5vcm1hbGl6ZWRSZXR1cm5WYWx1ZS5mb3JFYWNoKGFwcGx5TXV0YXRpb25zKTtcbiAgICByZXR1cm4gcmV0dXJuVmFsdWU7XG4gIH1cbiAgdmFyIGFuaW1hdGVGaWxsID0ge1xuICAgIG5hbWU6IFwiYW5pbWF0ZUZpbGxcIixcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGZuOiBmdW5jdGlvbiBmbihpbnN0YW5jZSkge1xuICAgICAgdmFyIF9pbnN0YW5jZSRwcm9wcyRyZW5kZTtcbiAgICAgIGlmICghKChfaW5zdGFuY2UkcHJvcHMkcmVuZGUgPSBpbnN0YW5jZS5wcm9wcy5yZW5kZXIpID09IG51bGwgPyB2b2lkIDAgOiBfaW5zdGFuY2UkcHJvcHMkcmVuZGUuJCR0aXBweSkpIHtcbiAgICAgICAgaWYgKHRydWUpIHtcbiAgICAgICAgICBlcnJvcldoZW4oaW5zdGFuY2UucHJvcHMuYW5pbWF0ZUZpbGwsIFwiVGhlIGBhbmltYXRlRmlsbGAgcGx1Z2luIHJlcXVpcmVzIHRoZSBkZWZhdWx0IHJlbmRlciBmdW5jdGlvbi5cIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgfVxuICAgICAgdmFyIF9nZXRDaGlsZHJlbiA9IGdldENoaWxkcmVuKGluc3RhbmNlLnBvcHBlciksIGJveCA9IF9nZXRDaGlsZHJlbi5ib3gsIGNvbnRlbnQgPSBfZ2V0Q2hpbGRyZW4uY29udGVudDtcbiAgICAgIHZhciBiYWNrZHJvcCA9IGluc3RhbmNlLnByb3BzLmFuaW1hdGVGaWxsID8gY3JlYXRlQmFja2Ryb3BFbGVtZW50KCkgOiBudWxsO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb25DcmVhdGU6IGZ1bmN0aW9uIG9uQ3JlYXRlKCkge1xuICAgICAgICAgIGlmIChiYWNrZHJvcCkge1xuICAgICAgICAgICAgYm94Lmluc2VydEJlZm9yZShiYWNrZHJvcCwgYm94LmZpcnN0RWxlbWVudENoaWxkKTtcbiAgICAgICAgICAgIGJveC5zZXRBdHRyaWJ1dGUoXCJkYXRhLWFuaW1hdGVmaWxsXCIsIFwiXCIpO1xuICAgICAgICAgICAgYm94LnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICAgIGluc3RhbmNlLnNldFByb3BzKHtcbiAgICAgICAgICAgICAgYXJyb3c6IGZhbHNlLFxuICAgICAgICAgICAgICBhbmltYXRpb246IFwic2hpZnQtYXdheVwiXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9uTW91bnQ6IGZ1bmN0aW9uIG9uTW91bnQoKSB7XG4gICAgICAgICAgaWYgKGJhY2tkcm9wKSB7XG4gICAgICAgICAgICB2YXIgdHJhbnNpdGlvbkR1cmF0aW9uID0gYm94LnN0eWxlLnRyYW5zaXRpb25EdXJhdGlvbjtcbiAgICAgICAgICAgIHZhciBkdXJhdGlvbiA9IE51bWJlcih0cmFuc2l0aW9uRHVyYXRpb24ucmVwbGFjZShcIm1zXCIsIFwiXCIpKTtcbiAgICAgICAgICAgIGNvbnRlbnQuc3R5bGUudHJhbnNpdGlvbkRlbGF5ID0gTWF0aC5yb3VuZChkdXJhdGlvbiAvIDEwKSArIFwibXNcIjtcbiAgICAgICAgICAgIGJhY2tkcm9wLnN0eWxlLnRyYW5zaXRpb25EdXJhdGlvbiA9IHRyYW5zaXRpb25EdXJhdGlvbjtcbiAgICAgICAgICAgIHNldFZpc2liaWxpdHlTdGF0ZShbYmFja2Ryb3BdLCBcInZpc2libGVcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBvblNob3c6IGZ1bmN0aW9uIG9uU2hvdygpIHtcbiAgICAgICAgICBpZiAoYmFja2Ryb3ApIHtcbiAgICAgICAgICAgIGJhY2tkcm9wLnN0eWxlLnRyYW5zaXRpb25EdXJhdGlvbiA9IFwiMG1zXCI7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBvbkhpZGU6IGZ1bmN0aW9uIG9uSGlkZSgpIHtcbiAgICAgICAgICBpZiAoYmFja2Ryb3ApIHtcbiAgICAgICAgICAgIHNldFZpc2liaWxpdHlTdGF0ZShbYmFja2Ryb3BdLCBcImhpZGRlblwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICB9O1xuICBmdW5jdGlvbiBjcmVhdGVCYWNrZHJvcEVsZW1lbnQoKSB7XG4gICAgdmFyIGJhY2tkcm9wID0gZGl2KCk7XG4gICAgYmFja2Ryb3AuY2xhc3NOYW1lID0gQkFDS0RST1BfQ0xBU1M7XG4gICAgc2V0VmlzaWJpbGl0eVN0YXRlKFtiYWNrZHJvcF0sIFwiaGlkZGVuXCIpO1xuICAgIHJldHVybiBiYWNrZHJvcDtcbiAgfVxuICB2YXIgbW91c2VDb29yZHMgPSB7XG4gICAgY2xpZW50WDogMCxcbiAgICBjbGllbnRZOiAwXG4gIH07XG4gIHZhciBhY3RpdmVJbnN0YW5jZXMgPSBbXTtcbiAgZnVuY3Rpb24gc3RvcmVNb3VzZUNvb3JkcyhfcmVmKSB7XG4gICAgdmFyIGNsaWVudFggPSBfcmVmLmNsaWVudFgsIGNsaWVudFkgPSBfcmVmLmNsaWVudFk7XG4gICAgbW91c2VDb29yZHMgPSB7XG4gICAgICBjbGllbnRYLFxuICAgICAgY2xpZW50WVxuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gYWRkTW91c2VDb29yZHNMaXN0ZW5lcihkb2MpIHtcbiAgICBkb2MuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBzdG9yZU1vdXNlQ29vcmRzKTtcbiAgfVxuICBmdW5jdGlvbiByZW1vdmVNb3VzZUNvb3Jkc0xpc3RlbmVyKGRvYykge1xuICAgIGRvYy5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHN0b3JlTW91c2VDb29yZHMpO1xuICB9XG4gIHZhciBmb2xsb3dDdXJzb3IyID0ge1xuICAgIG5hbWU6IFwiZm9sbG93Q3Vyc29yXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBmbjogZnVuY3Rpb24gZm4oaW5zdGFuY2UpIHtcbiAgICAgIHZhciByZWZlcmVuY2UgPSBpbnN0YW5jZS5yZWZlcmVuY2U7XG4gICAgICB2YXIgZG9jID0gZ2V0T3duZXJEb2N1bWVudChpbnN0YW5jZS5wcm9wcy50cmlnZ2VyVGFyZ2V0IHx8IHJlZmVyZW5jZSk7XG4gICAgICB2YXIgaXNJbnRlcm5hbFVwZGF0ZSA9IGZhbHNlO1xuICAgICAgdmFyIHdhc0ZvY3VzRXZlbnQgPSBmYWxzZTtcbiAgICAgIHZhciBpc1VubW91bnRlZCA9IHRydWU7XG4gICAgICB2YXIgcHJldlByb3BzID0gaW5zdGFuY2UucHJvcHM7XG4gICAgICBmdW5jdGlvbiBnZXRJc0luaXRpYWxCZWhhdmlvcigpIHtcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlLnByb3BzLmZvbGxvd0N1cnNvciA9PT0gXCJpbml0aWFsXCIgJiYgaW5zdGFuY2Uuc3RhdGUuaXNWaXNpYmxlO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gYWRkTGlzdGVuZXIoKSB7XG4gICAgICAgIGRvYy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIG9uTW91c2VNb3ZlKTtcbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKCkge1xuICAgICAgICBkb2MucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBvbk1vdXNlTW92ZSk7XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiB1bnNldEdldFJlZmVyZW5jZUNsaWVudFJlY3QoKSB7XG4gICAgICAgIGlzSW50ZXJuYWxVcGRhdGUgPSB0cnVlO1xuICAgICAgICBpbnN0YW5jZS5zZXRQcm9wcyh7XG4gICAgICAgICAgZ2V0UmVmZXJlbmNlQ2xpZW50UmVjdDogbnVsbFxuICAgICAgICB9KTtcbiAgICAgICAgaXNJbnRlcm5hbFVwZGF0ZSA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gb25Nb3VzZU1vdmUoZXZlbnQpIHtcbiAgICAgICAgdmFyIGlzQ3Vyc29yT3ZlclJlZmVyZW5jZSA9IGV2ZW50LnRhcmdldCA/IHJlZmVyZW5jZS5jb250YWlucyhldmVudC50YXJnZXQpIDogdHJ1ZTtcbiAgICAgICAgdmFyIGZvbGxvd0N1cnNvcjMgPSBpbnN0YW5jZS5wcm9wcy5mb2xsb3dDdXJzb3I7XG4gICAgICAgIHZhciBjbGllbnRYID0gZXZlbnQuY2xpZW50WCwgY2xpZW50WSA9IGV2ZW50LmNsaWVudFk7XG4gICAgICAgIHZhciByZWN0ID0gcmVmZXJlbmNlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICB2YXIgcmVsYXRpdmVYID0gY2xpZW50WCAtIHJlY3QubGVmdDtcbiAgICAgICAgdmFyIHJlbGF0aXZlWSA9IGNsaWVudFkgLSByZWN0LnRvcDtcbiAgICAgICAgaWYgKGlzQ3Vyc29yT3ZlclJlZmVyZW5jZSB8fCAhaW5zdGFuY2UucHJvcHMuaW50ZXJhY3RpdmUpIHtcbiAgICAgICAgICBpbnN0YW5jZS5zZXRQcm9wcyh7XG4gICAgICAgICAgICBnZXRSZWZlcmVuY2VDbGllbnRSZWN0OiBmdW5jdGlvbiBnZXRSZWZlcmVuY2VDbGllbnRSZWN0KCkge1xuICAgICAgICAgICAgICB2YXIgcmVjdDIgPSByZWZlcmVuY2UuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgIHZhciB4ID0gY2xpZW50WDtcbiAgICAgICAgICAgICAgdmFyIHkgPSBjbGllbnRZO1xuICAgICAgICAgICAgICBpZiAoZm9sbG93Q3Vyc29yMyA9PT0gXCJpbml0aWFsXCIpIHtcbiAgICAgICAgICAgICAgICB4ID0gcmVjdDIubGVmdCArIHJlbGF0aXZlWDtcbiAgICAgICAgICAgICAgICB5ID0gcmVjdDIudG9wICsgcmVsYXRpdmVZO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHZhciB0b3AgPSBmb2xsb3dDdXJzb3IzID09PSBcImhvcml6b250YWxcIiA/IHJlY3QyLnRvcCA6IHk7XG4gICAgICAgICAgICAgIHZhciByaWdodCA9IGZvbGxvd0N1cnNvcjMgPT09IFwidmVydGljYWxcIiA/IHJlY3QyLnJpZ2h0IDogeDtcbiAgICAgICAgICAgICAgdmFyIGJvdHRvbSA9IGZvbGxvd0N1cnNvcjMgPT09IFwiaG9yaXpvbnRhbFwiID8gcmVjdDIuYm90dG9tIDogeTtcbiAgICAgICAgICAgICAgdmFyIGxlZnQgPSBmb2xsb3dDdXJzb3IzID09PSBcInZlcnRpY2FsXCIgPyByZWN0Mi5sZWZ0IDogeDtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB3aWR0aDogcmlnaHQgLSBsZWZ0LFxuICAgICAgICAgICAgICAgIGhlaWdodDogYm90dG9tIC0gdG9wLFxuICAgICAgICAgICAgICAgIHRvcCxcbiAgICAgICAgICAgICAgICByaWdodCxcbiAgICAgICAgICAgICAgICBib3R0b20sXG4gICAgICAgICAgICAgICAgbGVmdFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBjcmVhdGUoKSB7XG4gICAgICAgIGlmIChpbnN0YW5jZS5wcm9wcy5mb2xsb3dDdXJzb3IpIHtcbiAgICAgICAgICBhY3RpdmVJbnN0YW5jZXMucHVzaCh7XG4gICAgICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgICAgIGRvY1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGFkZE1vdXNlQ29vcmRzTGlzdGVuZXIoZG9jKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZnVuY3Rpb24gZGVzdHJveSgpIHtcbiAgICAgICAgYWN0aXZlSW5zdGFuY2VzID0gYWN0aXZlSW5zdGFuY2VzLmZpbHRlcihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgcmV0dXJuIGRhdGEuaW5zdGFuY2UgIT09IGluc3RhbmNlO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGFjdGl2ZUluc3RhbmNlcy5maWx0ZXIoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIHJldHVybiBkYXRhLmRvYyA9PT0gZG9jO1xuICAgICAgICB9KS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICByZW1vdmVNb3VzZUNvb3Jkc0xpc3RlbmVyKGRvYyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIG9uQ3JlYXRlOiBjcmVhdGUsXG4gICAgICAgIG9uRGVzdHJveTogZGVzdHJveSxcbiAgICAgICAgb25CZWZvcmVVcGRhdGU6IGZ1bmN0aW9uIG9uQmVmb3JlVXBkYXRlKCkge1xuICAgICAgICAgIHByZXZQcm9wcyA9IGluc3RhbmNlLnByb3BzO1xuICAgICAgICB9LFxuICAgICAgICBvbkFmdGVyVXBkYXRlOiBmdW5jdGlvbiBvbkFmdGVyVXBkYXRlKF8sIF9yZWYyKSB7XG4gICAgICAgICAgdmFyIGZvbGxvd0N1cnNvcjMgPSBfcmVmMi5mb2xsb3dDdXJzb3I7XG4gICAgICAgICAgaWYgKGlzSW50ZXJuYWxVcGRhdGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGZvbGxvd0N1cnNvcjMgIT09IHZvaWQgMCAmJiBwcmV2UHJvcHMuZm9sbG93Q3Vyc29yICE9PSBmb2xsb3dDdXJzb3IzKSB7XG4gICAgICAgICAgICBkZXN0cm95KCk7XG4gICAgICAgICAgICBpZiAoZm9sbG93Q3Vyc29yMykge1xuICAgICAgICAgICAgICBjcmVhdGUoKTtcbiAgICAgICAgICAgICAgaWYgKGluc3RhbmNlLnN0YXRlLmlzTW91bnRlZCAmJiAhd2FzRm9jdXNFdmVudCAmJiAhZ2V0SXNJbml0aWFsQmVoYXZpb3IoKSkge1xuICAgICAgICAgICAgICAgIGFkZExpc3RlbmVyKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlbW92ZUxpc3RlbmVyKCk7XG4gICAgICAgICAgICAgIHVuc2V0R2V0UmVmZXJlbmNlQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb25Nb3VudDogZnVuY3Rpb24gb25Nb3VudCgpIHtcbiAgICAgICAgICBpZiAoaW5zdGFuY2UucHJvcHMuZm9sbG93Q3Vyc29yICYmICF3YXNGb2N1c0V2ZW50KSB7XG4gICAgICAgICAgICBpZiAoaXNVbm1vdW50ZWQpIHtcbiAgICAgICAgICAgICAgb25Nb3VzZU1vdmUobW91c2VDb29yZHMpO1xuICAgICAgICAgICAgICBpc1VubW91bnRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFnZXRJc0luaXRpYWxCZWhhdmlvcigpKSB7XG4gICAgICAgICAgICAgIGFkZExpc3RlbmVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBvblRyaWdnZXI6IGZ1bmN0aW9uIG9uVHJpZ2dlcihfLCBldmVudCkge1xuICAgICAgICAgIGlmIChpc01vdXNlRXZlbnQoZXZlbnQpKSB7XG4gICAgICAgICAgICBtb3VzZUNvb3JkcyA9IHtcbiAgICAgICAgICAgICAgY2xpZW50WDogZXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgICAgY2xpZW50WTogZXZlbnQuY2xpZW50WVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgICAgd2FzRm9jdXNFdmVudCA9IGV2ZW50LnR5cGUgPT09IFwiZm9jdXNcIjtcbiAgICAgICAgfSxcbiAgICAgICAgb25IaWRkZW46IGZ1bmN0aW9uIG9uSGlkZGVuKCkge1xuICAgICAgICAgIGlmIChpbnN0YW5jZS5wcm9wcy5mb2xsb3dDdXJzb3IpIHtcbiAgICAgICAgICAgIHVuc2V0R2V0UmVmZXJlbmNlQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgcmVtb3ZlTGlzdGVuZXIoKTtcbiAgICAgICAgICAgIGlzVW5tb3VudGVkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICB9O1xuICBmdW5jdGlvbiBnZXRQcm9wcyhwcm9wcywgbW9kaWZpZXIpIHtcbiAgICB2YXIgX3Byb3BzJHBvcHBlck9wdGlvbnM7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBvcHBlck9wdGlvbnM6IE9iamVjdC5hc3NpZ24oe30sIHByb3BzLnBvcHBlck9wdGlvbnMsIHtcbiAgICAgICAgbW9kaWZpZXJzOiBbXS5jb25jYXQoKCgoX3Byb3BzJHBvcHBlck9wdGlvbnMgPSBwcm9wcy5wb3BwZXJPcHRpb25zKSA9PSBudWxsID8gdm9pZCAwIDogX3Byb3BzJHBvcHBlck9wdGlvbnMubW9kaWZpZXJzKSB8fCBbXSkuZmlsdGVyKGZ1bmN0aW9uKF9yZWYpIHtcbiAgICAgICAgICB2YXIgbmFtZSA9IF9yZWYubmFtZTtcbiAgICAgICAgICByZXR1cm4gbmFtZSAhPT0gbW9kaWZpZXIubmFtZTtcbiAgICAgICAgfSksIFttb2RpZmllcl0pXG4gICAgICB9KVxuICAgIH07XG4gIH1cbiAgdmFyIGlubGluZVBvc2l0aW9uaW5nID0ge1xuICAgIG5hbWU6IFwiaW5saW5lUG9zaXRpb25pbmdcIixcbiAgICBkZWZhdWx0VmFsdWU6IGZhbHNlLFxuICAgIGZuOiBmdW5jdGlvbiBmbihpbnN0YW5jZSkge1xuICAgICAgdmFyIHJlZmVyZW5jZSA9IGluc3RhbmNlLnJlZmVyZW5jZTtcbiAgICAgIGZ1bmN0aW9uIGlzRW5hYmxlZCgpIHtcbiAgICAgICAgcmV0dXJuICEhaW5zdGFuY2UucHJvcHMuaW5saW5lUG9zaXRpb25pbmc7XG4gICAgICB9XG4gICAgICB2YXIgcGxhY2VtZW50O1xuICAgICAgdmFyIGN1cnNvclJlY3RJbmRleCA9IC0xO1xuICAgICAgdmFyIGlzSW50ZXJuYWxVcGRhdGUgPSBmYWxzZTtcbiAgICAgIHZhciBtb2RpZmllciA9IHtcbiAgICAgICAgbmFtZTogXCJ0aXBweUlubGluZVBvc2l0aW9uaW5nXCIsXG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIHBoYXNlOiBcImFmdGVyV3JpdGVcIixcbiAgICAgICAgZm46IGZ1bmN0aW9uIGZuMihfcmVmMikge1xuICAgICAgICAgIHZhciBzdGF0ZSA9IF9yZWYyLnN0YXRlO1xuICAgICAgICAgIGlmIChpc0VuYWJsZWQoKSkge1xuICAgICAgICAgICAgaWYgKHBsYWNlbWVudCAhPT0gc3RhdGUucGxhY2VtZW50KSB7XG4gICAgICAgICAgICAgIGluc3RhbmNlLnNldFByb3BzKHtcbiAgICAgICAgICAgICAgICBnZXRSZWZlcmVuY2VDbGllbnRSZWN0OiBmdW5jdGlvbiBnZXRSZWZlcmVuY2VDbGllbnRSZWN0KCkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIF9nZXRSZWZlcmVuY2VDbGllbnRSZWN0KHN0YXRlLnBsYWNlbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBsYWNlbWVudCA9IHN0YXRlLnBsYWNlbWVudDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBmdW5jdGlvbiBfZ2V0UmVmZXJlbmNlQ2xpZW50UmVjdChwbGFjZW1lbnQyKSB7XG4gICAgICAgIHJldHVybiBnZXRJbmxpbmVCb3VuZGluZ0NsaWVudFJlY3QoZ2V0QmFzZVBsYWNlbWVudChwbGFjZW1lbnQyKSwgcmVmZXJlbmNlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLCBhcnJheUZyb20ocmVmZXJlbmNlLmdldENsaWVudFJlY3RzKCkpLCBjdXJzb3JSZWN0SW5kZXgpO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gc2V0SW50ZXJuYWxQcm9wcyhwYXJ0aWFsUHJvcHMpIHtcbiAgICAgICAgaXNJbnRlcm5hbFVwZGF0ZSA9IHRydWU7XG4gICAgICAgIGluc3RhbmNlLnNldFByb3BzKHBhcnRpYWxQcm9wcyk7XG4gICAgICAgIGlzSW50ZXJuYWxVcGRhdGUgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIGFkZE1vZGlmaWVyKCkge1xuICAgICAgICBpZiAoIWlzSW50ZXJuYWxVcGRhdGUpIHtcbiAgICAgICAgICBzZXRJbnRlcm5hbFByb3BzKGdldFByb3BzKGluc3RhbmNlLnByb3BzLCBtb2RpZmllcikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvbkNyZWF0ZTogYWRkTW9kaWZpZXIsXG4gICAgICAgIG9uQWZ0ZXJVcGRhdGU6IGFkZE1vZGlmaWVyLFxuICAgICAgICBvblRyaWdnZXI6IGZ1bmN0aW9uIG9uVHJpZ2dlcihfLCBldmVudCkge1xuICAgICAgICAgIGlmIChpc01vdXNlRXZlbnQoZXZlbnQpKSB7XG4gICAgICAgICAgICB2YXIgcmVjdHMgPSBhcnJheUZyb20oaW5zdGFuY2UucmVmZXJlbmNlLmdldENsaWVudFJlY3RzKCkpO1xuICAgICAgICAgICAgdmFyIGN1cnNvclJlY3QgPSByZWN0cy5maW5kKGZ1bmN0aW9uKHJlY3QpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlY3QubGVmdCAtIDIgPD0gZXZlbnQuY2xpZW50WCAmJiByZWN0LnJpZ2h0ICsgMiA+PSBldmVudC5jbGllbnRYICYmIHJlY3QudG9wIC0gMiA8PSBldmVudC5jbGllbnRZICYmIHJlY3QuYm90dG9tICsgMiA+PSBldmVudC5jbGllbnRZO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjdXJzb3JSZWN0SW5kZXggPSByZWN0cy5pbmRleE9mKGN1cnNvclJlY3QpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb25VbnRyaWdnZXI6IGZ1bmN0aW9uIG9uVW50cmlnZ2VyKCkge1xuICAgICAgICAgIGN1cnNvclJlY3RJbmRleCA9IC0xO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgfTtcbiAgZnVuY3Rpb24gZ2V0SW5saW5lQm91bmRpbmdDbGllbnRSZWN0KGN1cnJlbnRCYXNlUGxhY2VtZW50LCBib3VuZGluZ1JlY3QsIGNsaWVudFJlY3RzLCBjdXJzb3JSZWN0SW5kZXgpIHtcbiAgICBpZiAoY2xpZW50UmVjdHMubGVuZ3RoIDwgMiB8fCBjdXJyZW50QmFzZVBsYWNlbWVudCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGJvdW5kaW5nUmVjdDtcbiAgICB9XG4gICAgaWYgKGNsaWVudFJlY3RzLmxlbmd0aCA9PT0gMiAmJiBjdXJzb3JSZWN0SW5kZXggPj0gMCAmJiBjbGllbnRSZWN0c1swXS5sZWZ0ID4gY2xpZW50UmVjdHNbMV0ucmlnaHQpIHtcbiAgICAgIHJldHVybiBjbGllbnRSZWN0c1tjdXJzb3JSZWN0SW5kZXhdIHx8IGJvdW5kaW5nUmVjdDtcbiAgICB9XG4gICAgc3dpdGNoIChjdXJyZW50QmFzZVBsYWNlbWVudCkge1xuICAgICAgY2FzZSBcInRvcFwiOlxuICAgICAgY2FzZSBcImJvdHRvbVwiOiB7XG4gICAgICAgIHZhciBmaXJzdFJlY3QgPSBjbGllbnRSZWN0c1swXTtcbiAgICAgICAgdmFyIGxhc3RSZWN0ID0gY2xpZW50UmVjdHNbY2xpZW50UmVjdHMubGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciBpc1RvcCA9IGN1cnJlbnRCYXNlUGxhY2VtZW50ID09PSBcInRvcFwiO1xuICAgICAgICB2YXIgdG9wID0gZmlyc3RSZWN0LnRvcDtcbiAgICAgICAgdmFyIGJvdHRvbSA9IGxhc3RSZWN0LmJvdHRvbTtcbiAgICAgICAgdmFyIGxlZnQgPSBpc1RvcCA/IGZpcnN0UmVjdC5sZWZ0IDogbGFzdFJlY3QubGVmdDtcbiAgICAgICAgdmFyIHJpZ2h0ID0gaXNUb3AgPyBmaXJzdFJlY3QucmlnaHQgOiBsYXN0UmVjdC5yaWdodDtcbiAgICAgICAgdmFyIHdpZHRoID0gcmlnaHQgLSBsZWZ0O1xuICAgICAgICB2YXIgaGVpZ2h0ID0gYm90dG9tIC0gdG9wO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRvcCxcbiAgICAgICAgICBib3R0b20sXG4gICAgICAgICAgbGVmdCxcbiAgICAgICAgICByaWdodCxcbiAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICBoZWlnaHRcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJsZWZ0XCI6XG4gICAgICBjYXNlIFwicmlnaHRcIjoge1xuICAgICAgICB2YXIgbWluTGVmdCA9IE1hdGgubWluLmFwcGx5KE1hdGgsIGNsaWVudFJlY3RzLm1hcChmdW5jdGlvbihyZWN0cykge1xuICAgICAgICAgIHJldHVybiByZWN0cy5sZWZ0O1xuICAgICAgICB9KSk7XG4gICAgICAgIHZhciBtYXhSaWdodCA9IE1hdGgubWF4LmFwcGx5KE1hdGgsIGNsaWVudFJlY3RzLm1hcChmdW5jdGlvbihyZWN0cykge1xuICAgICAgICAgIHJldHVybiByZWN0cy5yaWdodDtcbiAgICAgICAgfSkpO1xuICAgICAgICB2YXIgbWVhc3VyZVJlY3RzID0gY2xpZW50UmVjdHMuZmlsdGVyKGZ1bmN0aW9uKHJlY3QpIHtcbiAgICAgICAgICByZXR1cm4gY3VycmVudEJhc2VQbGFjZW1lbnQgPT09IFwibGVmdFwiID8gcmVjdC5sZWZ0ID09PSBtaW5MZWZ0IDogcmVjdC5yaWdodCA9PT0gbWF4UmlnaHQ7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgX3RvcCA9IG1lYXN1cmVSZWN0c1swXS50b3A7XG4gICAgICAgIHZhciBfYm90dG9tID0gbWVhc3VyZVJlY3RzW21lYXN1cmVSZWN0cy5sZW5ndGggLSAxXS5ib3R0b207XG4gICAgICAgIHZhciBfbGVmdCA9IG1pbkxlZnQ7XG4gICAgICAgIHZhciBfcmlnaHQgPSBtYXhSaWdodDtcbiAgICAgICAgdmFyIF93aWR0aCA9IF9yaWdodCAtIF9sZWZ0O1xuICAgICAgICB2YXIgX2hlaWdodCA9IF9ib3R0b20gLSBfdG9wO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRvcDogX3RvcCxcbiAgICAgICAgICBib3R0b206IF9ib3R0b20sXG4gICAgICAgICAgbGVmdDogX2xlZnQsXG4gICAgICAgICAgcmlnaHQ6IF9yaWdodCxcbiAgICAgICAgICB3aWR0aDogX3dpZHRoLFxuICAgICAgICAgIGhlaWdodDogX2hlaWdodFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgZGVmYXVsdDoge1xuICAgICAgICByZXR1cm4gYm91bmRpbmdSZWN0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICB2YXIgc3RpY2t5ID0ge1xuICAgIG5hbWU6IFwic3RpY2t5XCIsXG4gICAgZGVmYXVsdFZhbHVlOiBmYWxzZSxcbiAgICBmbjogZnVuY3Rpb24gZm4oaW5zdGFuY2UpIHtcbiAgICAgIHZhciByZWZlcmVuY2UgPSBpbnN0YW5jZS5yZWZlcmVuY2UsIHBvcHBlciA9IGluc3RhbmNlLnBvcHBlcjtcbiAgICAgIGZ1bmN0aW9uIGdldFJlZmVyZW5jZSgpIHtcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlLnBvcHBlckluc3RhbmNlID8gaW5zdGFuY2UucG9wcGVySW5zdGFuY2Uuc3RhdGUuZWxlbWVudHMucmVmZXJlbmNlIDogcmVmZXJlbmNlO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gc2hvdWxkQ2hlY2sodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlLnByb3BzLnN0aWNreSA9PT0gdHJ1ZSB8fCBpbnN0YW5jZS5wcm9wcy5zdGlja3kgPT09IHZhbHVlO1xuICAgICAgfVxuICAgICAgdmFyIHByZXZSZWZSZWN0ID0gbnVsbDtcbiAgICAgIHZhciBwcmV2UG9wUmVjdCA9IG51bGw7XG4gICAgICBmdW5jdGlvbiB1cGRhdGVQb3NpdGlvbigpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRSZWZSZWN0ID0gc2hvdWxkQ2hlY2soXCJyZWZlcmVuY2VcIikgPyBnZXRSZWZlcmVuY2UoKS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSA6IG51bGw7XG4gICAgICAgIHZhciBjdXJyZW50UG9wUmVjdCA9IHNob3VsZENoZWNrKFwicG9wcGVyXCIpID8gcG9wcGVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpIDogbnVsbDtcbiAgICAgICAgaWYgKGN1cnJlbnRSZWZSZWN0ICYmIGFyZVJlY3RzRGlmZmVyZW50KHByZXZSZWZSZWN0LCBjdXJyZW50UmVmUmVjdCkgfHwgY3VycmVudFBvcFJlY3QgJiYgYXJlUmVjdHNEaWZmZXJlbnQocHJldlBvcFJlY3QsIGN1cnJlbnRQb3BSZWN0KSkge1xuICAgICAgICAgIGlmIChpbnN0YW5jZS5wb3BwZXJJbnN0YW5jZSkge1xuICAgICAgICAgICAgaW5zdGFuY2UucG9wcGVySW5zdGFuY2UudXBkYXRlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHByZXZSZWZSZWN0ID0gY3VycmVudFJlZlJlY3Q7XG4gICAgICAgIHByZXZQb3BSZWN0ID0gY3VycmVudFBvcFJlY3Q7XG4gICAgICAgIGlmIChpbnN0YW5jZS5zdGF0ZS5pc01vdW50ZWQpIHtcbiAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodXBkYXRlUG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvbk1vdW50OiBmdW5jdGlvbiBvbk1vdW50KCkge1xuICAgICAgICAgIGlmIChpbnN0YW5jZS5wcm9wcy5zdGlja3kpIHtcbiAgICAgICAgICAgIHVwZGF0ZVBvc2l0aW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgfTtcbiAgZnVuY3Rpb24gYXJlUmVjdHNEaWZmZXJlbnQocmVjdEEsIHJlY3RCKSB7XG4gICAgaWYgKHJlY3RBICYmIHJlY3RCKSB7XG4gICAgICByZXR1cm4gcmVjdEEudG9wICE9PSByZWN0Qi50b3AgfHwgcmVjdEEucmlnaHQgIT09IHJlY3RCLnJpZ2h0IHx8IHJlY3RBLmJvdHRvbSAhPT0gcmVjdEIuYm90dG9tIHx8IHJlY3RBLmxlZnQgIT09IHJlY3RCLmxlZnQ7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHRpcHB5Mi5zZXREZWZhdWx0UHJvcHMoe1xuICAgIHJlbmRlclxuICB9KTtcbiAgZXhwb3J0cy5hbmltYXRlRmlsbCA9IGFuaW1hdGVGaWxsO1xuICBleHBvcnRzLmNyZWF0ZVNpbmdsZXRvbiA9IGNyZWF0ZVNpbmdsZXRvbjtcbiAgZXhwb3J0cy5kZWZhdWx0ID0gdGlwcHkyO1xuICBleHBvcnRzLmRlbGVnYXRlID0gZGVsZWdhdGU7XG4gIGV4cG9ydHMuZm9sbG93Q3Vyc29yID0gZm9sbG93Q3Vyc29yMjtcbiAgZXhwb3J0cy5oaWRlQWxsID0gaGlkZUFsbDtcbiAgZXhwb3J0cy5pbmxpbmVQb3NpdGlvbmluZyA9IGlubGluZVBvc2l0aW9uaW5nO1xuICBleHBvcnRzLnJvdW5kQXJyb3cgPSBST1VORF9BUlJPVztcbiAgZXhwb3J0cy5zdGlja3kgPSBzdGlja3k7XG59KTtcblxuLy8gc3JjL2luZGV4LmpzXG52YXIgaW1wb3J0X3RpcHB5MiA9IF9fdG9Nb2R1bGUocmVxdWlyZV90aXBweV9janMoKSk7XG5cbi8vIHNyYy9idWlsZENvbmZpZ0Zyb21Nb2RpZmllcnMuanNcbnZhciBpbXBvcnRfdGlwcHkgPSBfX3RvTW9kdWxlKHJlcXVpcmVfdGlwcHlfY2pzKCkpO1xudmFyIGJ1aWxkQ29uZmlnRnJvbU1vZGlmaWVycyA9IChtb2RpZmllcnMpID0+IHtcbiAgY29uc3QgY29uZmlnID0ge1xuICAgIHBsdWdpbnM6IFtdXG4gIH07XG4gIGNvbnN0IGdldE1vZGlmaWVyQXJndW1lbnQgPSAobW9kaWZpZXIpID0+IHtcbiAgICByZXR1cm4gbW9kaWZpZXJzW21vZGlmaWVycy5pbmRleE9mKG1vZGlmaWVyKSArIDFdO1xuICB9O1xuICBpZiAobW9kaWZpZXJzLmluY2x1ZGVzKFwiYW5pbWF0aW9uXCIpKSB7XG4gICAgY29uZmlnLmFuaW1hdGlvbiA9IGdldE1vZGlmaWVyQXJndW1lbnQoXCJhbmltYXRpb25cIik7XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcImR1cmF0aW9uXCIpKSB7XG4gICAgY29uZmlnLmR1cmF0aW9uID0gcGFyc2VJbnQoZ2V0TW9kaWZpZXJBcmd1bWVudChcImR1cmF0aW9uXCIpKTtcbiAgfVxuICBpZiAobW9kaWZpZXJzLmluY2x1ZGVzKFwiZGVsYXlcIikpIHtcbiAgICBjb25zdCBkZWxheSA9IGdldE1vZGlmaWVyQXJndW1lbnQoXCJkZWxheVwiKTtcbiAgICBjb25maWcuZGVsYXkgPSBkZWxheS5pbmNsdWRlcyhcIi1cIikgPyBkZWxheS5zcGxpdChcIi1cIikubWFwKChuKSA9PiBwYXJzZUludChuKSkgOiBwYXJzZUludChkZWxheSk7XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcImN1cnNvclwiKSkge1xuICAgIGNvbmZpZy5wbHVnaW5zLnB1c2goaW1wb3J0X3RpcHB5LmZvbGxvd0N1cnNvcik7XG4gICAgY29uc3QgbmV4dCA9IGdldE1vZGlmaWVyQXJndW1lbnQoXCJjdXJzb3JcIik7XG4gICAgaWYgKFtcInhcIiwgXCJpbml0aWFsXCJdLmluY2x1ZGVzKG5leHQpKSB7XG4gICAgICBjb25maWcuZm9sbG93Q3Vyc29yID0gbmV4dCA9PT0gXCJ4XCIgPyBcImhvcml6b250YWxcIiA6IFwiaW5pdGlhbFwiO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25maWcuZm9sbG93Q3Vyc29yID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcIm9uXCIpKSB7XG4gICAgY29uZmlnLnRyaWdnZXIgPSBnZXRNb2RpZmllckFyZ3VtZW50KFwib25cIik7XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcImFycm93bGVzc1wiKSkge1xuICAgIGNvbmZpZy5hcnJvdyA9IGZhbHNlO1xuICB9XG4gIGlmIChtb2RpZmllcnMuaW5jbHVkZXMoXCJodG1sXCIpKSB7XG4gICAgY29uZmlnLmFsbG93SFRNTCA9IHRydWU7XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcImludGVyYWN0aXZlXCIpKSB7XG4gICAgY29uZmlnLmludGVyYWN0aXZlID0gdHJ1ZTtcbiAgfVxuICBpZiAobW9kaWZpZXJzLmluY2x1ZGVzKFwiYm9yZGVyXCIpICYmIGNvbmZpZy5pbnRlcmFjdGl2ZSkge1xuICAgIGNvbmZpZy5pbnRlcmFjdGl2ZUJvcmRlciA9IHBhcnNlSW50KGdldE1vZGlmaWVyQXJndW1lbnQoXCJib3JkZXJcIikpO1xuICB9XG4gIGlmIChtb2RpZmllcnMuaW5jbHVkZXMoXCJkZWJvdW5jZVwiKSAmJiBjb25maWcuaW50ZXJhY3RpdmUpIHtcbiAgICBjb25maWcuaW50ZXJhY3RpdmVEZWJvdW5jZSA9IHBhcnNlSW50KGdldE1vZGlmaWVyQXJndW1lbnQoXCJkZWJvdW5jZVwiKSk7XG4gIH1cbiAgaWYgKG1vZGlmaWVycy5pbmNsdWRlcyhcIm1heC13aWR0aFwiKSkge1xuICAgIGNvbmZpZy5tYXhXaWR0aCA9IHBhcnNlSW50KGdldE1vZGlmaWVyQXJndW1lbnQoXCJtYXgtd2lkdGhcIikpO1xuICB9XG4gIGlmIChtb2RpZmllcnMuaW5jbHVkZXMoXCJ0aGVtZVwiKSkge1xuICAgIGNvbmZpZy50aGVtZSA9IGdldE1vZGlmaWVyQXJndW1lbnQoXCJ0aGVtZVwiKTtcbiAgfVxuICBpZiAobW9kaWZpZXJzLmluY2x1ZGVzKFwicGxhY2VtZW50XCIpKSB7XG4gICAgY29uZmlnLnBsYWNlbWVudCA9IGdldE1vZGlmaWVyQXJndW1lbnQoXCJwbGFjZW1lbnRcIik7XG4gIH1cbiAgcmV0dXJuIGNvbmZpZztcbn07XG5cbi8vIHNyYy9pbmRleC5qc1xuZnVuY3Rpb24gVG9vbHRpcChBbHBpbmUpIHtcbiAgQWxwaW5lLm1hZ2ljKFwidG9vbHRpcFwiLCAoZWwpID0+IHtcbiAgICByZXR1cm4gKGNvbnRlbnQsIGNvbmZpZyA9IHt9KSA9PiB7XG4gICAgICBjb25zdCBpbnN0YW5jZSA9ICgwLCBpbXBvcnRfdGlwcHkyLmRlZmF1bHQpKGVsLCB7XG4gICAgICAgIGNvbnRlbnQsXG4gICAgICAgIHRyaWdnZXI6IFwibWFudWFsXCIsXG4gICAgICAgIC4uLmNvbmZpZ1xuICAgICAgfSk7XG4gICAgICBpbnN0YW5jZS5zaG93KCk7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgaW5zdGFuY2UuaGlkZSgpO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGluc3RhbmNlLmRlc3Ryb3koKSwgY29uZmlnLmR1cmF0aW9uIHx8IDMwMCk7XG4gICAgICB9LCBjb25maWcudGltZW91dCB8fCAyZTMpO1xuICAgIH07XG4gIH0pO1xuICBBbHBpbmUuZGlyZWN0aXZlKFwidG9vbHRpcFwiLCAoZWwsIHttb2RpZmllcnMsIGV4cHJlc3Npb259LCB7ZXZhbHVhdGVMYXRlciwgZWZmZWN0fSkgPT4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IG1vZGlmaWVycy5sZW5ndGggPiAwID8gYnVpbGRDb25maWdGcm9tTW9kaWZpZXJzKG1vZGlmaWVycykgOiB7fTtcbiAgICBpZiAoIWVsLl9feF90aXBweSkge1xuICAgICAgZWwuX194X3RpcHB5ID0gKDAsIGltcG9ydF90aXBweTIuZGVmYXVsdCkoZWwsIGNvbmZpZyk7XG4gICAgfVxuICAgIGNvbnN0IGVuYWJsZVRvb2x0aXAgPSAoKSA9PiBlbC5fX3hfdGlwcHkuZW5hYmxlKCk7XG4gICAgY29uc3QgZGlzYWJsZVRvb2x0aXAgPSAoKSA9PiBlbC5fX3hfdGlwcHkuZGlzYWJsZSgpO1xuICAgIGNvbnN0IHNldHVwVG9vbHRpcCA9IChjb250ZW50KSA9PiB7XG4gICAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgICAgZGlzYWJsZVRvb2x0aXAoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVuYWJsZVRvb2x0aXAoKTtcbiAgICAgICAgZWwuX194X3RpcHB5LnNldENvbnRlbnQoY29udGVudCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBpZiAobW9kaWZpZXJzLmluY2x1ZGVzKFwicmF3XCIpKSB7XG4gICAgICBzZXR1cFRvb2x0aXAoZXhwcmVzc2lvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGdldENvbnRlbnQgPSBldmFsdWF0ZUxhdGVyKGV4cHJlc3Npb24pO1xuICAgICAgZWZmZWN0KCgpID0+IHtcbiAgICAgICAgZ2V0Q29udGVudCgoY29udGVudCkgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY29udGVudCA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgZWwuX194X3RpcHB5LnNldFByb3BzKGNvbnRlbnQpO1xuICAgICAgICAgICAgZW5hYmxlVG9vbHRpcCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXR1cFRvb2x0aXAoY29udGVudCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG59XG5Ub29sdGlwLmRlZmF1bHRQcm9wcyA9IChwcm9wcykgPT4ge1xuICBpbXBvcnRfdGlwcHkyLmRlZmF1bHQuc2V0RGVmYXVsdFByb3BzKHByb3BzKTtcbiAgcmV0dXJuIFRvb2x0aXA7XG59O1xudmFyIHNyY19kZWZhdWx0ID0gVG9vbHRpcDtcblxuLy8gYnVpbGRzL21vZHVsZS5qc1xudmFyIG1vZHVsZV9kZWZhdWx0ID0gc3JjX2RlZmF1bHQ7XG5leHBvcnQge1xuICBtb2R1bGVfZGVmYXVsdCBhcyBkZWZhdWx0XG59O1xuIiwgImltcG9ydCBBbHBpbmVGbG9hdGluZ1VJIGZyb20gJ0Bhd2NvZGVzL2FscGluZS1mbG9hdGluZy11aSdcbmltcG9ydCBBbHBpbmVMYXp5TG9hZEFzc2V0cyBmcm9tICdhbHBpbmUtbGF6eS1sb2FkLWFzc2V0cydcbmltcG9ydCBTb3J0YWJsZSBmcm9tICcuL3NvcnRhYmxlJ1xuaW1wb3J0IFRvb2x0aXAgZnJvbSAnQHJ5YW5namNoYW5kbGVyL2FscGluZS10b29sdGlwJ1xuXG5pbXBvcnQgJy4uL2Nzcy9jb21wb25lbnRzL3BhZ2luYXRpb24uY3NzJ1xuaW1wb3J0ICd0aXBweS5qcy9kaXN0L3RpcHB5LmNzcydcbmltcG9ydCAndGlwcHkuanMvdGhlbWVzL2xpZ2h0LmNzcydcbmltcG9ydCAnLi4vY3NzL3NvcnRhYmxlLmNzcydcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignYWxwaW5lOmluaXQnLCAoKSA9PiB7XG4gICAgd2luZG93LkFscGluZS5wbHVnaW4oQWxwaW5lRmxvYXRpbmdVSSlcbiAgICB3aW5kb3cuQWxwaW5lLnBsdWdpbihBbHBpbmVMYXp5TG9hZEFzc2V0cylcbiAgICB3aW5kb3cuQWxwaW5lLnBsdWdpbihTb3J0YWJsZSlcbiAgICB3aW5kb3cuQWxwaW5lLnBsdWdpbihUb29sdGlwKVxufSlcblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2xhcmF2ZWwvZnJhbWV3b3JrL2Jsb2IvNTI5OWMyMjMyMWMwZjFlYThmZjc3MGI4NGE2YzY0NjljNGQ2ZWRlYy9zcmMvSWxsdW1pbmF0ZS9UcmFuc2xhdGlvbi9NZXNzYWdlU2VsZWN0b3IucGhwI0wxNVxuY29uc3QgcGx1cmFsaXplID0gZnVuY3Rpb24gKHRleHQsIG51bWJlciwgdmFyaWFibGVzKSB7XG4gICAgZnVuY3Rpb24gZXh0cmFjdChzZWdtZW50cywgbnVtYmVyKSB7XG4gICAgICAgIGZvciAoY29uc3QgcGFydCBvZiBzZWdtZW50cykge1xuICAgICAgICAgICAgY29uc3QgbGluZSA9IGV4dHJhY3RGcm9tU3RyaW5nKHBhcnQsIG51bWJlcilcblxuICAgICAgICAgICAgaWYgKGxpbmUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbGluZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXh0cmFjdEZyb21TdHJpbmcocGFydCwgbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoZXMgPSBwYXJ0Lm1hdGNoKC9eW1xce1xcW10oW15cXFtcXF1cXHtcXH1dKilbXFx9XFxdXSguKikvcylcblxuICAgICAgICBpZiAobWF0Y2hlcyA9PT0gbnVsbCB8fCBtYXRjaGVzLmxlbmd0aCAhPT0gMykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IG1hdGNoZXNbMV1cblxuICAgICAgICBjb25zdCB2YWx1ZSA9IG1hdGNoZXNbMl1cblxuICAgICAgICBpZiAoY29uZGl0aW9uLmluY2x1ZGVzKCcsJykpIHtcbiAgICAgICAgICAgIGNvbnN0IFtmcm9tLCB0b10gPSBjb25kaXRpb24uc3BsaXQoJywnLCAyKVxuXG4gICAgICAgICAgICBpZiAodG8gPT09ICcqJyAmJiBudW1iZXIgPj0gZnJvbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVxuICAgICAgICAgICAgfSBlbHNlIGlmIChmcm9tID09PSAnKicgJiYgbnVtYmVyIDw9IHRvKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG51bWJlciA+PSBmcm9tICYmIG51bWJlciA8PSB0bykge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNvbmRpdGlvbiA9PSBudW1iZXIgPyB2YWx1ZSA6IG51bGxcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1Y2ZpcnN0KHN0cmluZykge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgc3RyaW5nLnRvU3RyaW5nKCkuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgK1xuICAgICAgICAgICAgc3RyaW5nLnRvU3RyaW5nKCkuc2xpY2UoMSlcbiAgICAgICAgKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlcGxhY2UobGluZSwgcmVwbGFjZSkge1xuICAgICAgICBpZiAocmVwbGFjZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBsaW5lXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzaG91bGRSZXBsYWNlID0ge31cblxuICAgICAgICBmb3IgKGxldCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMocmVwbGFjZSkpIHtcbiAgICAgICAgICAgIHNob3VsZFJlcGxhY2VbJzonICsgdWNmaXJzdChrZXkgPz8gJycpXSA9IHVjZmlyc3QodmFsdWUgPz8gJycpXG4gICAgICAgICAgICBzaG91bGRSZXBsYWNlWyc6JyArIGtleS50b1VwcGVyQ2FzZSgpXSA9IHZhbHVlXG4gICAgICAgICAgICAgICAgLnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAudG9VcHBlckNhc2UoKVxuICAgICAgICAgICAgc2hvdWxkUmVwbGFjZVsnOicgKyBrZXldID0gdmFsdWVcbiAgICAgICAgfVxuXG4gICAgICAgIE9iamVjdC5lbnRyaWVzKHNob3VsZFJlcGxhY2UpLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgbGluZSA9IGxpbmUucmVwbGFjZUFsbChrZXksIHZhbHVlKVxuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiBsaW5lXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RyaXBDb25kaXRpb25zKHNlZ21lbnRzKSB7XG4gICAgICAgIHJldHVybiBzZWdtZW50cy5tYXAoKHBhcnQpID0+XG4gICAgICAgICAgICBwYXJ0LnJlcGxhY2UoL15bXFx7XFxbXShbXlxcW1xcXVxce1xcfV0qKVtcXH1cXF1dLywgJycpLFxuICAgICAgICApXG4gICAgfVxuXG4gICAgbGV0IHNlZ21lbnRzID0gdGV4dC5zcGxpdCgnfCcpXG5cbiAgICBjb25zdCB2YWx1ZSA9IGV4dHJhY3Qoc2VnbWVudHMsIG51bWJlcilcblxuICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiByZXBsYWNlKHZhbHVlLnRyaW0oKSwgdmFyaWFibGVzKVxuICAgIH1cblxuICAgIHNlZ21lbnRzID0gc3RyaXBDb25kaXRpb25zKHNlZ21lbnRzKVxuXG4gICAgcmV0dXJuIHJlcGxhY2UoXG4gICAgICAgIHNlZ21lbnRzLmxlbmd0aCA+IDEgJiYgbnVtYmVyID4gMSA/IHNlZ21lbnRzWzFdIDogc2VnbWVudHNbMF0sXG4gICAgICAgIHZhcmlhYmxlcyxcbiAgICApXG59XG5cbndpbmRvdy5wbHVyYWxpemUgPSBwbHVyYWxpemVcbiJdLAogICJtYXBwaW5ncyI6ICI7O0FBQ0EsV0FBUyxRQUFRLFdBQVc7QUFDMUIsV0FBTyxVQUFVLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFBQSxFQUMvQjtBQUNBLFdBQVMsYUFBYSxXQUFXO0FBQy9CLFdBQU8sVUFBVSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQUEsRUFDL0I7QUFDQSxXQUFTLHlCQUF5QixXQUFXO0FBQzNDLFdBQU8sQ0FBQyxPQUFPLFFBQVEsRUFBRSxTQUFTLFFBQVEsU0FBUyxDQUFDLElBQUksTUFBTTtBQUFBLEVBQ2hFO0FBQ0EsV0FBUyxrQkFBa0IsTUFBTTtBQUMvQixXQUFPLFNBQVMsTUFBTSxXQUFXO0FBQUEsRUFDbkM7QUFDQSxXQUFTLDJCQUEyQixNQUFNLFdBQVcsS0FBSztBQUN4RCxRQUFJO0FBQUEsTUFDRjtBQUFBLE1BQ0E7QUFBQSxJQUNGLElBQUk7QUFDSixVQUFNLFVBQVUsVUFBVSxJQUFJLFVBQVUsUUFBUSxJQUFJLFNBQVMsUUFBUTtBQUNyRSxVQUFNLFVBQVUsVUFBVSxJQUFJLFVBQVUsU0FBUyxJQUFJLFNBQVMsU0FBUztBQUN2RSxVQUFNLFdBQVcseUJBQXlCLFNBQVM7QUFDbkQsVUFBTSxTQUFTLGtCQUFrQixRQUFRO0FBQ3pDLFVBQU0sY0FBYyxVQUFVLE1BQU0sSUFBSSxJQUFJLFNBQVMsTUFBTSxJQUFJO0FBQy9ELFVBQU0sT0FBTyxRQUFRLFNBQVM7QUFDOUIsVUFBTSxhQUFhLGFBQWE7QUFDaEMsUUFBSTtBQUNKLFlBQVEsTUFBTTtBQUFBLE1BQ1osS0FBSztBQUNILGlCQUFTO0FBQUEsVUFDUCxHQUFHO0FBQUEsVUFDSCxHQUFHLFVBQVUsSUFBSSxTQUFTO0FBQUEsUUFDNUI7QUFDQTtBQUFBLE1BQ0YsS0FBSztBQUNILGlCQUFTO0FBQUEsVUFDUCxHQUFHO0FBQUEsVUFDSCxHQUFHLFVBQVUsSUFBSSxVQUFVO0FBQUEsUUFDN0I7QUFDQTtBQUFBLE1BQ0YsS0FBSztBQUNILGlCQUFTO0FBQUEsVUFDUCxHQUFHLFVBQVUsSUFBSSxVQUFVO0FBQUEsVUFDM0IsR0FBRztBQUFBLFFBQ0w7QUFDQTtBQUFBLE1BQ0YsS0FBSztBQUNILGlCQUFTO0FBQUEsVUFDUCxHQUFHLFVBQVUsSUFBSSxTQUFTO0FBQUEsVUFDMUIsR0FBRztBQUFBLFFBQ0w7QUFDQTtBQUFBLE1BQ0Y7QUFDRSxpQkFBUztBQUFBLFVBQ1AsR0FBRyxVQUFVO0FBQUEsVUFDYixHQUFHLFVBQVU7QUFBQSxRQUNmO0FBQUEsSUFDSjtBQUNBLFlBQVEsYUFBYSxTQUFTLEdBQUc7QUFBQSxNQUMvQixLQUFLO0FBQ0gsZUFBTyxRQUFRLEtBQUssZUFBZSxPQUFPLGFBQWEsS0FBSztBQUM1RDtBQUFBLE1BQ0YsS0FBSztBQUNILGVBQU8sUUFBUSxLQUFLLGVBQWUsT0FBTyxhQUFhLEtBQUs7QUFDNUQ7QUFBQSxJQUNKO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFDQSxNQUFJLGtCQUFrQixPQUFPLFdBQVcsVUFBVSxXQUFXO0FBQzNELFVBQU07QUFBQSxNQUNKLFlBQVk7QUFBQSxNQUNaLFdBQVc7QUFBQSxNQUNYLGFBQWEsQ0FBQztBQUFBLE1BQ2QsVUFBVTtBQUFBLElBQ1osSUFBSTtBQUNKLFVBQU0sTUFBTSxPQUFPLFVBQVUsU0FBUyxPQUFPLFNBQVMsVUFBVSxNQUFNLFFBQVE7QUFDOUUsUUFBSSxNQUFNO0FBQ1IsVUFBSSxhQUFhLE1BQU07QUFDckIsZ0JBQVEsTUFBTSxDQUFDLHFFQUFxRSxnRUFBZ0Usb0VBQW9FLG1EQUFtRCxFQUFFLEtBQUssR0FBRyxDQUFDO0FBQUEsTUFDeFI7QUFDQSxVQUFJLFdBQVcsT0FBTyxDQUFDLFNBQVM7QUFDOUIsWUFBSTtBQUFBLFVBQ0Y7QUFBQSxRQUNGLElBQUk7QUFDSixlQUFPLFNBQVMsbUJBQW1CLFNBQVM7QUFBQSxNQUM5QyxDQUFDLEVBQUUsU0FBUyxHQUFHO0FBQ2IsY0FBTSxJQUFJLE1BQU0sQ0FBQyx3REFBd0Qsd0VBQXdFLDBEQUEwRCxFQUFFLEtBQUssR0FBRyxDQUFDO0FBQUEsTUFDeE47QUFBQSxJQUNGO0FBQ0EsUUFBSSxRQUFRLE1BQU0sVUFBVSxnQkFBZ0I7QUFBQSxNQUMxQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRixDQUFDO0FBQ0QsUUFBSTtBQUFBLE1BQ0Y7QUFBQSxNQUNBO0FBQUEsSUFDRixJQUFJLDJCQUEyQixPQUFPLFdBQVcsR0FBRztBQUNwRCxRQUFJLG9CQUFvQjtBQUN4QixRQUFJLGlCQUFpQixDQUFDO0FBQ3RCLFFBQUkscUJBQXFCO0FBQ3pCLGFBQVMsSUFBSSxHQUFHLElBQUksV0FBVyxRQUFRLEtBQUs7QUFDMUMsVUFBSSxNQUFNO0FBQ1I7QUFDQSxZQUFJLHFCQUFxQixLQUFLO0FBQzVCLGdCQUFNLElBQUksTUFBTSxDQUFDLHVEQUF1RCxvRUFBb0UsdURBQXVELEVBQUUsS0FBSyxHQUFHLENBQUM7QUFBQSxRQUNoTjtBQUFBLE1BQ0Y7QUFDQSxZQUFNO0FBQUEsUUFDSjtBQUFBLFFBQ0E7QUFBQSxNQUNGLElBQUksV0FBVyxDQUFDO0FBQ2hCLFlBQU07QUFBQSxRQUNKLEdBQUc7QUFBQSxRQUNILEdBQUc7QUFBQSxRQUNIO0FBQUEsUUFDQTtBQUFBLE1BQ0YsSUFBSSxNQUFNLEdBQUc7QUFBQSxRQUNYO0FBQUEsUUFDQTtBQUFBLFFBQ0Esa0JBQWtCO0FBQUEsUUFDbEIsV0FBVztBQUFBLFFBQ1g7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0EsVUFBVTtBQUFBLFFBQ1YsVUFBVTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUFBLE1BQ0YsQ0FBQztBQUNELFVBQUksU0FBUyxPQUFPLFFBQVE7QUFDNUIsVUFBSSxTQUFTLE9BQU8sUUFBUTtBQUM1Qix1QkFBaUI7QUFBQSxRQUNmLEdBQUc7QUFBQSxRQUNILENBQUMsSUFBSSxHQUFHO0FBQUEsVUFDTixHQUFHLGVBQWUsSUFBSTtBQUFBLFVBQ3RCLEdBQUc7QUFBQSxRQUNMO0FBQUEsTUFDRjtBQUNBLFVBQUksT0FBTztBQUNULFlBQUksT0FBTyxVQUFVLFVBQVU7QUFDN0IsY0FBSSxNQUFNLFdBQVc7QUFDbkIsZ0NBQW9CLE1BQU07QUFBQSxVQUM1QjtBQUNBLGNBQUksTUFBTSxPQUFPO0FBQ2Ysb0JBQVEsTUFBTSxVQUFVLE9BQU8sTUFBTSxVQUFVLGdCQUFnQjtBQUFBLGNBQzdEO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxZQUNGLENBQUMsSUFBSSxNQUFNO0FBQUEsVUFDYjtBQUNBLFdBQUM7QUFBQSxZQUNDO0FBQUEsWUFDQTtBQUFBLFVBQ0YsSUFBSSwyQkFBMkIsT0FBTyxtQkFBbUIsR0FBRztBQUFBLFFBQzlEO0FBQ0EsWUFBSTtBQUNKO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsTUFDTDtBQUFBLE1BQ0E7QUFBQSxNQUNBLFdBQVc7QUFBQSxNQUNYO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0EsV0FBUyxvQkFBb0IsU0FBUztBQUNwQyxXQUFPO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxPQUFPO0FBQUEsTUFDUCxRQUFRO0FBQUEsTUFDUixNQUFNO0FBQUEsTUFDTixHQUFHO0FBQUEsSUFDTDtBQUFBLEVBQ0Y7QUFDQSxXQUFTLHlCQUF5QixTQUFTO0FBQ3pDLFdBQU8sT0FBTyxZQUFZLFdBQVcsb0JBQW9CLE9BQU8sSUFBSTtBQUFBLE1BQ2xFLEtBQUs7QUFBQSxNQUNMLE9BQU87QUFBQSxNQUNQLFFBQVE7QUFBQSxNQUNSLE1BQU07QUFBQSxJQUNSO0FBQUEsRUFDRjtBQUNBLFdBQVMsaUJBQWlCLE1BQU07QUFDOUIsV0FBTztBQUFBLE1BQ0wsR0FBRztBQUFBLE1BQ0gsS0FBSyxLQUFLO0FBQUEsTUFDVixNQUFNLEtBQUs7QUFBQSxNQUNYLE9BQU8sS0FBSyxJQUFJLEtBQUs7QUFBQSxNQUNyQixRQUFRLEtBQUssSUFBSSxLQUFLO0FBQUEsSUFDeEI7QUFBQSxFQUNGO0FBQ0EsaUJBQWUsZUFBZSxxQkFBcUIsU0FBUztBQUMxRCxRQUFJO0FBQ0osUUFBSSxZQUFZLFFBQVE7QUFDdEIsZ0JBQVUsQ0FBQztBQUFBLElBQ2I7QUFDQSxVQUFNO0FBQUEsTUFDSjtBQUFBLE1BQ0E7QUFBQSxNQUNBLFVBQVU7QUFBQSxNQUNWO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGLElBQUk7QUFDSixVQUFNO0FBQUEsTUFDSixXQUFXO0FBQUEsTUFDWCxlQUFlO0FBQUEsTUFDZixpQkFBaUI7QUFBQSxNQUNqQixjQUFjO0FBQUEsTUFDZCxVQUFVO0FBQUEsSUFDWixJQUFJO0FBQ0osVUFBTSxnQkFBZ0IseUJBQXlCLE9BQU87QUFDdEQsVUFBTSxhQUFhLG1CQUFtQixhQUFhLGNBQWM7QUFDakUsVUFBTSxVQUFVLFNBQVMsY0FBYyxhQUFhLGNBQWM7QUFDbEUsVUFBTSxxQkFBcUIsaUJBQWlCLE1BQU0sVUFBVSxnQkFBZ0I7QUFBQSxNQUMxRSxXQUFXLHdCQUF3QixPQUFPLFVBQVUsYUFBYSxPQUFPLFNBQVMsVUFBVSxVQUFVLE9BQU8sT0FBTyxPQUFPLHdCQUF3QixRQUFRLFVBQVUsUUFBUSxrQkFBa0IsT0FBTyxVQUFVLHNCQUFzQixPQUFPLFNBQVMsVUFBVSxtQkFBbUIsU0FBUyxRQUFRO0FBQUEsTUFDblM7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0YsQ0FBQyxDQUFDO0FBQ0YsVUFBTSxvQkFBb0IsaUJBQWlCLFVBQVUsd0RBQXdELE1BQU0sVUFBVSxzREFBc0Q7QUFBQSxNQUNqTCxNQUFNLG1CQUFtQixhQUFhO0FBQUEsUUFDcEMsR0FBRyxNQUFNO0FBQUEsUUFDVDtBQUFBLFFBQ0E7QUFBQSxNQUNGLElBQUksTUFBTTtBQUFBLE1BQ1YsY0FBYyxPQUFPLFVBQVUsbUJBQW1CLE9BQU8sU0FBUyxVQUFVLGdCQUFnQixTQUFTLFFBQVE7QUFBQSxNQUM3RztBQUFBLElBQ0YsQ0FBQyxJQUFJLE1BQU0sY0FBYyxDQUFDO0FBQzFCLFdBQU87QUFBQSxNQUNMLEtBQUssbUJBQW1CLE1BQU0sa0JBQWtCLE1BQU0sY0FBYztBQUFBLE1BQ3BFLFFBQVEsa0JBQWtCLFNBQVMsbUJBQW1CLFNBQVMsY0FBYztBQUFBLE1BQzdFLE1BQU0sbUJBQW1CLE9BQU8sa0JBQWtCLE9BQU8sY0FBYztBQUFBLE1BQ3ZFLE9BQU8sa0JBQWtCLFFBQVEsbUJBQW1CLFFBQVEsY0FBYztBQUFBLElBQzVFO0FBQUEsRUFDRjtBQUNBLE1BQUksTUFBTSxLQUFLO0FBQ2YsTUFBSSxNQUFNLEtBQUs7QUFDZixXQUFTLE9BQU8sT0FBTyxPQUFPLE9BQU87QUFDbkMsV0FBTyxJQUFJLE9BQU8sSUFBSSxPQUFPLEtBQUssQ0FBQztBQUFBLEVBQ3JDO0FBQ0EsTUFBSSxRQUFRLENBQUMsYUFBYTtBQUFBLElBQ3hCLE1BQU07QUFBQSxJQUNOO0FBQUEsSUFDQSxNQUFNLEdBQUcscUJBQXFCO0FBQzVCLFlBQU07QUFBQSxRQUNKO0FBQUEsUUFDQSxVQUFVO0FBQUEsTUFDWixJQUFJLFdBQVcsT0FBTyxVQUFVLENBQUM7QUFDakMsWUFBTTtBQUFBLFFBQ0o7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBLFVBQVU7QUFBQSxNQUNaLElBQUk7QUFDSixVQUFJLFdBQVcsTUFBTTtBQUNuQixZQUFJLE1BQU07QUFDUixrQkFBUSxLQUFLLGlFQUFpRTtBQUFBLFFBQ2hGO0FBQ0EsZUFBTyxDQUFDO0FBQUEsTUFDVjtBQUNBLFlBQU0sZ0JBQWdCLHlCQUF5QixPQUFPO0FBQ3RELFlBQU0sU0FBUztBQUFBLFFBQ2I7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUNBLFlBQU0sT0FBTyx5QkFBeUIsU0FBUztBQUMvQyxZQUFNLFNBQVMsa0JBQWtCLElBQUk7QUFDckMsWUFBTSxrQkFBa0IsTUFBTSxVQUFVLGNBQWMsT0FBTztBQUM3RCxZQUFNLFVBQVUsU0FBUyxNQUFNLFFBQVE7QUFDdkMsWUFBTSxVQUFVLFNBQVMsTUFBTSxXQUFXO0FBQzFDLFlBQU0sVUFBVSxNQUFNLFVBQVUsTUFBTSxJQUFJLE1BQU0sVUFBVSxJQUFJLElBQUksT0FBTyxJQUFJLElBQUksTUFBTSxTQUFTLE1BQU07QUFDdEcsWUFBTSxZQUFZLE9BQU8sSUFBSSxJQUFJLE1BQU0sVUFBVSxJQUFJO0FBQ3JELFlBQU0sb0JBQW9CLE9BQU8sVUFBVSxtQkFBbUIsT0FBTyxTQUFTLFVBQVUsZ0JBQWdCLE9BQU87QUFDL0csWUFBTSxhQUFhLG9CQUFvQixTQUFTLE1BQU0sa0JBQWtCLGdCQUFnQixJQUFJLGtCQUFrQixlQUFlLElBQUk7QUFDakksWUFBTSxvQkFBb0IsVUFBVSxJQUFJLFlBQVk7QUFDcEQsWUFBTSxPQUFPLGNBQWMsT0FBTztBQUNsQyxZQUFNLE9BQU8sYUFBYSxnQkFBZ0IsTUFBTSxJQUFJLGNBQWMsT0FBTztBQUN6RSxZQUFNLFNBQVMsYUFBYSxJQUFJLGdCQUFnQixNQUFNLElBQUksSUFBSTtBQUM5RCxZQUFNLFVBQVUsT0FBTyxNQUFNLFFBQVEsSUFBSTtBQUN6QyxhQUFPO0FBQUEsUUFDTCxNQUFNO0FBQUEsVUFDSixDQUFDLElBQUksR0FBRztBQUFBLFVBQ1IsY0FBYyxTQUFTO0FBQUEsUUFDekI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDQSxNQUFJLFNBQVM7QUFBQSxJQUNYLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSLEtBQUs7QUFBQSxFQUNQO0FBQ0EsV0FBUyxxQkFBcUIsV0FBVztBQUN2QyxXQUFPLFVBQVUsUUFBUSwwQkFBMEIsQ0FBQyxZQUFZLE9BQU8sT0FBTyxDQUFDO0FBQUEsRUFDakY7QUFDQSxXQUFTLGtCQUFrQixXQUFXLE9BQU8sS0FBSztBQUNoRCxRQUFJLFFBQVEsUUFBUTtBQUNsQixZQUFNO0FBQUEsSUFDUjtBQUNBLFVBQU0sWUFBWSxhQUFhLFNBQVM7QUFDeEMsVUFBTSxXQUFXLHlCQUF5QixTQUFTO0FBQ25ELFVBQU0sU0FBUyxrQkFBa0IsUUFBUTtBQUN6QyxRQUFJLG9CQUFvQixhQUFhLE1BQU0sZUFBZSxNQUFNLFFBQVEsV0FBVyxVQUFVLFNBQVMsY0FBYyxVQUFVLFdBQVc7QUFDekksUUFBSSxNQUFNLFVBQVUsTUFBTSxJQUFJLE1BQU0sU0FBUyxNQUFNLEdBQUc7QUFDcEQsMEJBQW9CLHFCQUFxQixpQkFBaUI7QUFBQSxJQUM1RDtBQUNBLFdBQU87QUFBQSxNQUNMLE1BQU07QUFBQSxNQUNOLE9BQU8scUJBQXFCLGlCQUFpQjtBQUFBLElBQy9DO0FBQUEsRUFDRjtBQUNBLE1BQUksT0FBTztBQUFBLElBQ1QsT0FBTztBQUFBLElBQ1AsS0FBSztBQUFBLEVBQ1A7QUFDQSxXQUFTLDhCQUE4QixXQUFXO0FBQ2hELFdBQU8sVUFBVSxRQUFRLGNBQWMsQ0FBQyxZQUFZLEtBQUssT0FBTyxDQUFDO0FBQUEsRUFDbkU7QUFDQSxNQUFJLFFBQVEsQ0FBQyxPQUFPLFNBQVMsVUFBVSxNQUFNO0FBQzdDLE1BQUksZ0JBQWdDLHNCQUFNLE9BQU8sQ0FBQyxLQUFLLFNBQVMsSUFBSSxPQUFPLE1BQU0sT0FBTyxVQUFVLE9BQU8sTUFBTSxHQUFHLENBQUMsQ0FBQztBQUNwSCxXQUFTLGlCQUFpQixXQUFXLGVBQWUsbUJBQW1CO0FBQ3JFLFVBQU0scUNBQXFDLFlBQVksQ0FBQyxHQUFHLGtCQUFrQixPQUFPLENBQUMsY0FBYyxhQUFhLFNBQVMsTUFBTSxTQUFTLEdBQUcsR0FBRyxrQkFBa0IsT0FBTyxDQUFDLGNBQWMsYUFBYSxTQUFTLE1BQU0sU0FBUyxDQUFDLElBQUksa0JBQWtCLE9BQU8sQ0FBQyxjQUFjLFFBQVEsU0FBUyxNQUFNLFNBQVM7QUFDeFMsV0FBTyxtQ0FBbUMsT0FBTyxDQUFDLGNBQWM7QUFDOUQsVUFBSSxXQUFXO0FBQ2IsZUFBTyxhQUFhLFNBQVMsTUFBTSxjQUFjLGdCQUFnQiw4QkFBOEIsU0FBUyxNQUFNLFlBQVk7QUFBQSxNQUM1SDtBQUNBLGFBQU87QUFBQSxJQUNULENBQUM7QUFBQSxFQUNIO0FBQ0EsTUFBSSxnQkFBZ0IsU0FBUyxTQUFTO0FBQ3BDLFFBQUksWUFBWSxRQUFRO0FBQ3RCLGdCQUFVLENBQUM7QUFBQSxJQUNiO0FBQ0EsV0FBTztBQUFBLE1BQ0wsTUFBTTtBQUFBLE1BQ047QUFBQSxNQUNBLE1BQU0sR0FBRyxxQkFBcUI7QUFDNUIsWUFBSSx1QkFBdUIsd0JBQXdCLHdCQUF3Qix3QkFBd0I7QUFDbkcsY0FBTTtBQUFBLFVBQ0o7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQSxVQUFVO0FBQUEsVUFDVjtBQUFBLFFBQ0YsSUFBSTtBQUNKLGNBQU07QUFBQSxVQUNKLFlBQVk7QUFBQSxVQUNaLG9CQUFvQjtBQUFBLFVBQ3BCLGdCQUFnQjtBQUFBLFVBQ2hCLEdBQUc7QUFBQSxRQUNMLElBQUk7QUFDSixjQUFNLGFBQWEsaUJBQWlCLFdBQVcsZUFBZSxpQkFBaUI7QUFDL0UsY0FBTSxXQUFXLE1BQU0sZUFBZSxxQkFBcUIscUJBQXFCO0FBQ2hGLGNBQU0sZ0JBQWdCLHlCQUF5Qix5QkFBeUIsZUFBZSxrQkFBa0IsT0FBTyxTQUFTLHVCQUF1QixVQUFVLE9BQU8sd0JBQXdCO0FBQ3pMLGNBQU0sbUJBQW1CLFdBQVcsWUFBWTtBQUNoRCxZQUFJLG9CQUFvQixNQUFNO0FBQzVCLGlCQUFPLENBQUM7QUFBQSxRQUNWO0FBQ0EsY0FBTTtBQUFBLFVBQ0o7QUFBQSxVQUNBO0FBQUEsUUFDRixJQUFJLGtCQUFrQixrQkFBa0IsT0FBTyxPQUFPLFVBQVUsU0FBUyxPQUFPLFNBQVMsVUFBVSxNQUFNLFNBQVMsUUFBUSxFQUFFO0FBQzVILFlBQUksY0FBYyxrQkFBa0I7QUFDbEMsaUJBQU87QUFBQSxZQUNMO0FBQUEsWUFDQTtBQUFBLFlBQ0EsT0FBTztBQUFBLGNBQ0wsV0FBVyxXQUFXLENBQUM7QUFBQSxZQUN6QjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQ0EsY0FBTSxtQkFBbUIsQ0FBQyxTQUFTLFFBQVEsZ0JBQWdCLENBQUMsR0FBRyxTQUFTLElBQUksR0FBRyxTQUFTLEtBQUssQ0FBQztBQUM5RixjQUFNLGVBQWUsQ0FBQyxJQUFJLDBCQUEwQix5QkFBeUIsZUFBZSxrQkFBa0IsT0FBTyxTQUFTLHVCQUF1QixjQUFjLE9BQU8seUJBQXlCLENBQUMsR0FBRztBQUFBLFVBQ3JNLFdBQVc7QUFBQSxVQUNYLFdBQVc7QUFBQSxRQUNiLENBQUM7QUFDRCxjQUFNLGdCQUFnQixXQUFXLGVBQWUsQ0FBQztBQUNqRCxZQUFJLGVBQWU7QUFDakIsaUJBQU87QUFBQSxZQUNMLE1BQU07QUFBQSxjQUNKLE9BQU8sZUFBZTtBQUFBLGNBQ3RCLFdBQVc7QUFBQSxZQUNiO0FBQUEsWUFDQSxPQUFPO0FBQUEsY0FDTCxXQUFXO0FBQUEsWUFDYjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQ0EsY0FBTSxrQ0FBa0MsYUFBYSxNQUFNLEVBQUUsS0FBSyxDQUFDLEdBQUcsTUFBTSxFQUFFLFVBQVUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDM0csY0FBTSwrQkFBK0Isd0JBQXdCLGdDQUFnQyxLQUFLLENBQUMsU0FBUztBQUMxRyxjQUFJO0FBQUEsWUFDRjtBQUFBLFVBQ0YsSUFBSTtBQUNKLGlCQUFPLFVBQVUsTUFBTSxDQUFDLGNBQWMsYUFBYSxDQUFDO0FBQUEsUUFDdEQsQ0FBQyxNQUFNLE9BQU8sU0FBUyxzQkFBc0I7QUFDN0MsY0FBTSxpQkFBaUIsK0JBQStCLE9BQU8sOEJBQThCLGdDQUFnQyxDQUFDLEVBQUU7QUFDOUgsWUFBSSxtQkFBbUIsV0FBVztBQUNoQyxpQkFBTztBQUFBLFlBQ0wsTUFBTTtBQUFBLGNBQ0osT0FBTyxlQUFlO0FBQUEsY0FDdEIsV0FBVztBQUFBLFlBQ2I7QUFBQSxZQUNBLE9BQU87QUFBQSxjQUNMLFdBQVc7QUFBQSxZQUNiO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFDQSxlQUFPLENBQUM7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDQSxXQUFTLHNCQUFzQixXQUFXO0FBQ3hDLFVBQU0sb0JBQW9CLHFCQUFxQixTQUFTO0FBQ3hELFdBQU8sQ0FBQyw4QkFBOEIsU0FBUyxHQUFHLG1CQUFtQiw4QkFBOEIsaUJBQWlCLENBQUM7QUFBQSxFQUN2SDtBQUNBLE1BQUksT0FBTyxTQUFTLFNBQVM7QUFDM0IsUUFBSSxZQUFZLFFBQVE7QUFDdEIsZ0JBQVUsQ0FBQztBQUFBLElBQ2I7QUFDQSxXQUFPO0FBQUEsTUFDTCxNQUFNO0FBQUEsTUFDTjtBQUFBLE1BQ0EsTUFBTSxHQUFHLHFCQUFxQjtBQUM1QixZQUFJO0FBQ0osY0FBTTtBQUFBLFVBQ0o7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBLFVBQVU7QUFBQSxVQUNWO0FBQUEsUUFDRixJQUFJO0FBQ0osY0FBTTtBQUFBLFVBQ0osVUFBVSxnQkFBZ0I7QUFBQSxVQUMxQixXQUFXLGlCQUFpQjtBQUFBLFVBQzVCLG9CQUFvQjtBQUFBLFVBQ3BCLG1CQUFtQjtBQUFBLFVBQ25CLGdCQUFnQjtBQUFBLFVBQ2hCLEdBQUc7QUFBQSxRQUNMLElBQUk7QUFDSixjQUFNLE9BQU8sUUFBUSxTQUFTO0FBQzlCLGNBQU0sa0JBQWtCLFNBQVM7QUFDakMsY0FBTSxxQkFBcUIsZ0NBQWdDLG1CQUFtQixDQUFDLGdCQUFnQixDQUFDLHFCQUFxQixnQkFBZ0IsQ0FBQyxJQUFJLHNCQUFzQixnQkFBZ0I7QUFDaEwsY0FBTSxhQUFhLENBQUMsa0JBQWtCLEdBQUcsa0JBQWtCO0FBQzNELGNBQU0sV0FBVyxNQUFNLGVBQWUscUJBQXFCLHFCQUFxQjtBQUNoRixjQUFNLFlBQVksQ0FBQztBQUNuQixZQUFJLGtCQUFrQix1QkFBdUIsZUFBZSxTQUFTLE9BQU8sU0FBUyxxQkFBcUIsY0FBYyxDQUFDO0FBQ3pILFlBQUksZUFBZTtBQUNqQixvQkFBVSxLQUFLLFNBQVMsSUFBSSxDQUFDO0FBQUEsUUFDL0I7QUFDQSxZQUFJLGdCQUFnQjtBQUNsQixnQkFBTTtBQUFBLFlBQ0o7QUFBQSxZQUNBO0FBQUEsVUFDRixJQUFJLGtCQUFrQixXQUFXLE9BQU8sT0FBTyxVQUFVLFNBQVMsT0FBTyxTQUFTLFVBQVUsTUFBTSxTQUFTLFFBQVEsRUFBRTtBQUNySCxvQkFBVSxLQUFLLFNBQVMsSUFBSSxHQUFHLFNBQVMsS0FBSyxDQUFDO0FBQUEsUUFDaEQ7QUFDQSx3QkFBZ0IsQ0FBQyxHQUFHLGVBQWU7QUFBQSxVQUNqQztBQUFBLFVBQ0E7QUFBQSxRQUNGLENBQUM7QUFDRCxZQUFJLENBQUMsVUFBVSxNQUFNLENBQUMsVUFBVSxTQUFTLENBQUMsR0FBRztBQUMzQyxjQUFJLHVCQUF1QjtBQUMzQixnQkFBTSxjQUFjLHlCQUF5Qix3QkFBd0IsZUFBZSxTQUFTLE9BQU8sU0FBUyxzQkFBc0IsVUFBVSxPQUFPLHdCQUF3QixLQUFLO0FBQ2pMLGdCQUFNLGdCQUFnQixXQUFXLFNBQVM7QUFDMUMsY0FBSSxlQUFlO0FBQ2pCLG1CQUFPO0FBQUEsY0FDTCxNQUFNO0FBQUEsZ0JBQ0osT0FBTztBQUFBLGdCQUNQLFdBQVc7QUFBQSxjQUNiO0FBQUEsY0FDQSxPQUFPO0FBQUEsZ0JBQ0wsV0FBVztBQUFBLGNBQ2I7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUNBLGNBQUksaUJBQWlCO0FBQ3JCLGtCQUFRLGtCQUFrQjtBQUFBLFlBQ3hCLEtBQUssV0FBVztBQUNkLGtCQUFJO0FBQ0osb0JBQU0sY0FBYyx3QkFBd0IsY0FBYyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxVQUFVLE9BQU8sQ0FBQyxjQUFjLFlBQVksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxLQUFLLGNBQWMsTUFBTSxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxPQUFPLFNBQVMsc0JBQXNCLENBQUMsRUFBRTtBQUN2UCxrQkFBSSxZQUFZO0FBQ2QsaUNBQWlCO0FBQUEsY0FDbkI7QUFDQTtBQUFBLFlBQ0Y7QUFBQSxZQUNBLEtBQUs7QUFDSCwrQkFBaUI7QUFDakI7QUFBQSxVQUNKO0FBQ0EsY0FBSSxjQUFjLGdCQUFnQjtBQUNoQyxtQkFBTztBQUFBLGNBQ0wsT0FBTztBQUFBLGdCQUNMLFdBQVc7QUFBQSxjQUNiO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQ0EsZUFBTyxDQUFDO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0EsV0FBUyxlQUFlLFVBQVUsTUFBTTtBQUN0QyxXQUFPO0FBQUEsTUFDTCxLQUFLLFNBQVMsTUFBTSxLQUFLO0FBQUEsTUFDekIsT0FBTyxTQUFTLFFBQVEsS0FBSztBQUFBLE1BQzdCLFFBQVEsU0FBUyxTQUFTLEtBQUs7QUFBQSxNQUMvQixNQUFNLFNBQVMsT0FBTyxLQUFLO0FBQUEsSUFDN0I7QUFBQSxFQUNGO0FBQ0EsV0FBUyxzQkFBc0IsVUFBVTtBQUN2QyxXQUFPLE1BQU0sS0FBSyxDQUFDLFNBQVMsU0FBUyxJQUFJLEtBQUssQ0FBQztBQUFBLEVBQ2pEO0FBQ0EsTUFBSSxPQUFPLFNBQVMsT0FBTztBQUN6QixRQUFJO0FBQUEsTUFDRixXQUFXO0FBQUEsTUFDWCxHQUFHO0FBQUEsSUFDTCxJQUFJLFVBQVUsU0FBUyxDQUFDLElBQUk7QUFDNUIsV0FBTztBQUFBLE1BQ0wsTUFBTTtBQUFBLE1BQ04sTUFBTSxHQUFHLHFCQUFxQjtBQUM1QixjQUFNO0FBQUEsVUFDSjtBQUFBLFFBQ0YsSUFBSTtBQUNKLGdCQUFRLFVBQVU7QUFBQSxVQUNoQixLQUFLLG1CQUFtQjtBQUN0QixrQkFBTSxXQUFXLE1BQU0sZUFBZSxxQkFBcUI7QUFBQSxjQUN6RCxHQUFHO0FBQUEsY0FDSCxnQkFBZ0I7QUFBQSxZQUNsQixDQUFDO0FBQ0Qsa0JBQU0sVUFBVSxlQUFlLFVBQVUsTUFBTSxTQUFTO0FBQ3hELG1CQUFPO0FBQUEsY0FDTCxNQUFNO0FBQUEsZ0JBQ0osd0JBQXdCO0FBQUEsZ0JBQ3hCLGlCQUFpQixzQkFBc0IsT0FBTztBQUFBLGNBQ2hEO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxVQUNBLEtBQUssV0FBVztBQUNkLGtCQUFNLFdBQVcsTUFBTSxlQUFlLHFCQUFxQjtBQUFBLGNBQ3pELEdBQUc7QUFBQSxjQUNILGFBQWE7QUFBQSxZQUNmLENBQUM7QUFDRCxrQkFBTSxVQUFVLGVBQWUsVUFBVSxNQUFNLFFBQVE7QUFDdkQsbUJBQU87QUFBQSxjQUNMLE1BQU07QUFBQSxnQkFDSixnQkFBZ0I7QUFBQSxnQkFDaEIsU0FBUyxzQkFBc0IsT0FBTztBQUFBLGNBQ3hDO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxVQUNBLFNBQVM7QUFDUCxtQkFBTyxDQUFDO0FBQUEsVUFDVjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDQSxXQUFTLHFCQUFxQixXQUFXLE9BQU8sT0FBTyxLQUFLO0FBQzFELFFBQUksUUFBUSxRQUFRO0FBQ2xCLFlBQU07QUFBQSxJQUNSO0FBQ0EsVUFBTSxPQUFPLFFBQVEsU0FBUztBQUM5QixVQUFNLFlBQVksYUFBYSxTQUFTO0FBQ3hDLFVBQU0sYUFBYSx5QkFBeUIsU0FBUyxNQUFNO0FBQzNELFVBQU0sZ0JBQWdCLENBQUMsUUFBUSxLQUFLLEVBQUUsU0FBUyxJQUFJLElBQUksS0FBSztBQUM1RCxVQUFNLGlCQUFpQixPQUFPLGFBQWEsS0FBSztBQUNoRCxVQUFNLFdBQVcsT0FBTyxVQUFVLGFBQWEsTUFBTTtBQUFBLE1BQ25ELEdBQUc7QUFBQSxNQUNIO0FBQUEsSUFDRixDQUFDLElBQUk7QUFDTCxRQUFJO0FBQUEsTUFDRjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRixJQUFJLE9BQU8sYUFBYSxXQUFXO0FBQUEsTUFDakMsVUFBVTtBQUFBLE1BQ1YsV0FBVztBQUFBLE1BQ1gsZUFBZTtBQUFBLElBQ2pCLElBQUk7QUFBQSxNQUNGLFVBQVU7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxNQUNmLEdBQUc7QUFBQSxJQUNMO0FBQ0EsUUFBSSxhQUFhLE9BQU8sa0JBQWtCLFVBQVU7QUFDbEQsa0JBQVksY0FBYyxRQUFRLGdCQUFnQixLQUFLO0FBQUEsSUFDekQ7QUFDQSxXQUFPLGFBQWE7QUFBQSxNQUNsQixHQUFHLFlBQVk7QUFBQSxNQUNmLEdBQUcsV0FBVztBQUFBLElBQ2hCLElBQUk7QUFBQSxNQUNGLEdBQUcsV0FBVztBQUFBLE1BQ2QsR0FBRyxZQUFZO0FBQUEsSUFDakI7QUFBQSxFQUNGO0FBQ0EsTUFBSSxTQUFTLFNBQVMsT0FBTztBQUMzQixRQUFJLFVBQVUsUUFBUTtBQUNwQixjQUFRO0FBQUEsSUFDVjtBQUNBLFdBQU87QUFBQSxNQUNMLE1BQU07QUFBQSxNQUNOLFNBQVM7QUFBQSxNQUNULE1BQU0sR0FBRyxxQkFBcUI7QUFDNUIsY0FBTTtBQUFBLFVBQ0o7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBLFVBQVU7QUFBQSxVQUNWO0FBQUEsUUFDRixJQUFJO0FBQ0osY0FBTSxhQUFhLHFCQUFxQixXQUFXLE9BQU8sT0FBTyxPQUFPLFVBQVUsU0FBUyxPQUFPLFNBQVMsVUFBVSxNQUFNLFNBQVMsUUFBUSxFQUFFO0FBQzlJLGVBQU87QUFBQSxVQUNMLEdBQUcsSUFBSSxXQUFXO0FBQUEsVUFDbEIsR0FBRyxJQUFJLFdBQVc7QUFBQSxVQUNsQixNQUFNO0FBQUEsUUFDUjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNBLFdBQVMsYUFBYSxNQUFNO0FBQzFCLFdBQU8sU0FBUyxNQUFNLE1BQU07QUFBQSxFQUM5QjtBQUNBLE1BQUksUUFBUSxTQUFTLFNBQVM7QUFDNUIsUUFBSSxZQUFZLFFBQVE7QUFDdEIsZ0JBQVUsQ0FBQztBQUFBLElBQ2I7QUFDQSxXQUFPO0FBQUEsTUFDTCxNQUFNO0FBQUEsTUFDTjtBQUFBLE1BQ0EsTUFBTSxHQUFHLHFCQUFxQjtBQUM1QixjQUFNO0FBQUEsVUFDSjtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDRixJQUFJO0FBQ0osY0FBTTtBQUFBLFVBQ0osVUFBVSxnQkFBZ0I7QUFBQSxVQUMxQixXQUFXLGlCQUFpQjtBQUFBLFVBQzVCLFVBQVU7QUFBQSxZQUNSLElBQUksQ0FBQyxTQUFTO0FBQ1osa0JBQUk7QUFBQSxnQkFDRixHQUFHO0FBQUEsZ0JBQ0gsR0FBRztBQUFBLGNBQ0wsSUFBSTtBQUNKLHFCQUFPO0FBQUEsZ0JBQ0wsR0FBRztBQUFBLGdCQUNILEdBQUc7QUFBQSxjQUNMO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxVQUNBLEdBQUc7QUFBQSxRQUNMLElBQUk7QUFDSixjQUFNLFNBQVM7QUFBQSxVQUNiO0FBQUEsVUFDQTtBQUFBLFFBQ0Y7QUFDQSxjQUFNLFdBQVcsTUFBTSxlQUFlLHFCQUFxQixxQkFBcUI7QUFDaEYsY0FBTSxXQUFXLHlCQUF5QixRQUFRLFNBQVMsQ0FBQztBQUM1RCxjQUFNLFlBQVksYUFBYSxRQUFRO0FBQ3ZDLFlBQUksZ0JBQWdCLE9BQU8sUUFBUTtBQUNuQyxZQUFJLGlCQUFpQixPQUFPLFNBQVM7QUFDckMsWUFBSSxlQUFlO0FBQ2pCLGdCQUFNLFVBQVUsYUFBYSxNQUFNLFFBQVE7QUFDM0MsZ0JBQU0sVUFBVSxhQUFhLE1BQU0sV0FBVztBQUM5QyxnQkFBTSxPQUFPLGdCQUFnQixTQUFTLE9BQU87QUFDN0MsZ0JBQU0sT0FBTyxnQkFBZ0IsU0FBUyxPQUFPO0FBQzdDLDBCQUFnQixPQUFPLE1BQU0sZUFBZSxJQUFJO0FBQUEsUUFDbEQ7QUFDQSxZQUFJLGdCQUFnQjtBQUNsQixnQkFBTSxVQUFVLGNBQWMsTUFBTSxRQUFRO0FBQzVDLGdCQUFNLFVBQVUsY0FBYyxNQUFNLFdBQVc7QUFDL0MsZ0JBQU0sT0FBTyxpQkFBaUIsU0FBUyxPQUFPO0FBQzlDLGdCQUFNLE9BQU8saUJBQWlCLFNBQVMsT0FBTztBQUM5QywyQkFBaUIsT0FBTyxNQUFNLGdCQUFnQixJQUFJO0FBQUEsUUFDcEQ7QUFDQSxjQUFNLGdCQUFnQixRQUFRLEdBQUc7QUFBQSxVQUMvQixHQUFHO0FBQUEsVUFDSCxDQUFDLFFBQVEsR0FBRztBQUFBLFVBQ1osQ0FBQyxTQUFTLEdBQUc7QUFBQSxRQUNmLENBQUM7QUFDRCxlQUFPO0FBQUEsVUFDTCxHQUFHO0FBQUEsVUFDSCxNQUFNO0FBQUEsWUFDSixHQUFHLGNBQWMsSUFBSTtBQUFBLFlBQ3JCLEdBQUcsY0FBYyxJQUFJO0FBQUEsVUFDdkI7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0EsTUFBSSxPQUFPLFNBQVMsU0FBUztBQUMzQixRQUFJLFlBQVksUUFBUTtBQUN0QixnQkFBVSxDQUFDO0FBQUEsSUFDYjtBQUNBLFdBQU87QUFBQSxNQUNMLE1BQU07QUFBQSxNQUNOO0FBQUEsTUFDQSxNQUFNLEdBQUcscUJBQXFCO0FBQzVCLGNBQU07QUFBQSxVQUNKO0FBQUEsVUFDQTtBQUFBLFVBQ0EsVUFBVTtBQUFBLFVBQ1Y7QUFBQSxRQUNGLElBQUk7QUFDSixjQUFNO0FBQUEsVUFDSjtBQUFBLFVBQ0EsR0FBRztBQUFBLFFBQ0wsSUFBSTtBQUNKLGNBQU0sV0FBVyxNQUFNLGVBQWUscUJBQXFCLHFCQUFxQjtBQUNoRixjQUFNLE9BQU8sUUFBUSxTQUFTO0FBQzlCLGNBQU0sWUFBWSxhQUFhLFNBQVM7QUFDeEMsWUFBSTtBQUNKLFlBQUk7QUFDSixZQUFJLFNBQVMsU0FBUyxTQUFTLFVBQVU7QUFDdkMsdUJBQWE7QUFDYixzQkFBWSxlQUFlLE9BQU8sVUFBVSxTQUFTLE9BQU8sU0FBUyxVQUFVLE1BQU0sU0FBUyxRQUFRLEtBQUssVUFBVSxTQUFTLFNBQVM7QUFBQSxRQUN6SSxPQUFPO0FBQ0wsc0JBQVk7QUFDWix1QkFBYSxjQUFjLFFBQVEsUUFBUTtBQUFBLFFBQzdDO0FBQ0EsY0FBTSxPQUFPLElBQUksU0FBUyxNQUFNLENBQUM7QUFDakMsY0FBTSxPQUFPLElBQUksU0FBUyxPQUFPLENBQUM7QUFDbEMsY0FBTSxPQUFPLElBQUksU0FBUyxLQUFLLENBQUM7QUFDaEMsY0FBTSxPQUFPLElBQUksU0FBUyxRQUFRLENBQUM7QUFDbkMsY0FBTSxhQUFhO0FBQUEsVUFDakIsUUFBUSxNQUFNLFNBQVMsVUFBVSxDQUFDLFFBQVEsT0FBTyxFQUFFLFNBQVMsU0FBUyxJQUFJLEtBQUssU0FBUyxLQUFLLFNBQVMsSUFBSSxPQUFPLE9BQU8sSUFBSSxTQUFTLEtBQUssU0FBUyxNQUFNLEtBQUssU0FBUyxVQUFVO0FBQUEsVUFDaEwsT0FBTyxNQUFNLFNBQVMsU0FBUyxDQUFDLE9BQU8sUUFBUSxFQUFFLFNBQVMsU0FBUyxJQUFJLEtBQUssU0FBUyxLQUFLLFNBQVMsSUFBSSxPQUFPLE9BQU8sSUFBSSxTQUFTLE1BQU0sU0FBUyxLQUFLLEtBQUssU0FBUyxTQUFTO0FBQUEsUUFDL0s7QUFDQSxjQUFNLGlCQUFpQixNQUFNLFVBQVUsY0FBYyxTQUFTLFFBQVE7QUFDdEUsaUJBQVMsT0FBTyxTQUFTLE1BQU07QUFBQSxVQUM3QixHQUFHO0FBQUEsVUFDSCxHQUFHO0FBQUEsUUFDTCxDQUFDO0FBQ0QsY0FBTSxpQkFBaUIsTUFBTSxVQUFVLGNBQWMsU0FBUyxRQUFRO0FBQ3RFLFlBQUksZUFBZSxVQUFVLGVBQWUsU0FBUyxlQUFlLFdBQVcsZUFBZSxRQUFRO0FBQ3BHLGlCQUFPO0FBQUEsWUFDTCxPQUFPO0FBQUEsY0FDTCxPQUFPO0FBQUEsWUFDVDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQ0EsZUFBTyxDQUFDO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0EsTUFBSSxTQUFTLFNBQVMsU0FBUztBQUM3QixRQUFJLFlBQVksUUFBUTtBQUN0QixnQkFBVSxDQUFDO0FBQUEsSUFDYjtBQUNBLFdBQU87QUFBQSxNQUNMLE1BQU07QUFBQSxNQUNOO0FBQUEsTUFDQSxNQUFNLEdBQUcscUJBQXFCO0FBQzVCLFlBQUk7QUFDSixjQUFNO0FBQUEsVUFDSjtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQSxVQUFVO0FBQUEsVUFDVjtBQUFBLFFBQ0YsSUFBSTtBQUNKLGNBQU07QUFBQSxVQUNKLFVBQVU7QUFBQSxVQUNWO0FBQUEsVUFDQTtBQUFBLFFBQ0YsSUFBSTtBQUNKLGNBQU0sV0FBVyxpQkFBaUIsVUFBVSx3REFBd0QsTUFBTSxVQUFVLHNEQUFzRDtBQUFBLFVBQ3hLLE1BQU0sTUFBTTtBQUFBLFVBQ1osY0FBYyxPQUFPLFVBQVUsbUJBQW1CLE9BQU8sU0FBUyxVQUFVLGdCQUFnQixTQUFTLFFBQVE7QUFBQSxVQUM3RztBQUFBLFFBQ0YsQ0FBQyxJQUFJLE1BQU0sU0FBUztBQUNwQixjQUFNLGVBQWUsd0JBQXdCLE9BQU8sVUFBVSxrQkFBa0IsT0FBTyxTQUFTLFVBQVUsZUFBZSxTQUFTLFNBQVMsT0FBTyxPQUFPLHdCQUF3QixDQUFDO0FBQ2xMLGNBQU0sZ0JBQWdCLHlCQUF5QixPQUFPO0FBQ3RELGlCQUFTLHlCQUF5QjtBQUNoQyxjQUFJLFlBQVksV0FBVyxLQUFLLFlBQVksQ0FBQyxFQUFFLE9BQU8sWUFBWSxDQUFDLEVBQUUsU0FBUyxLQUFLLFFBQVEsS0FBSyxNQUFNO0FBQ3BHLGdCQUFJO0FBQ0osb0JBQVEsb0JBQW9CLFlBQVksS0FBSyxDQUFDLFNBQVMsSUFBSSxLQUFLLE9BQU8sY0FBYyxRQUFRLElBQUksS0FBSyxRQUFRLGNBQWMsU0FBUyxJQUFJLEtBQUssTUFBTSxjQUFjLE9BQU8sSUFBSSxLQUFLLFNBQVMsY0FBYyxNQUFNLE1BQU0sT0FBTyxvQkFBb0I7QUFBQSxVQUNsUDtBQUNBLGNBQUksWUFBWSxVQUFVLEdBQUc7QUFDM0IsZ0JBQUkseUJBQXlCLFNBQVMsTUFBTSxLQUFLO0FBQy9DLG9CQUFNLFlBQVksWUFBWSxDQUFDO0FBQy9CLG9CQUFNLFdBQVcsWUFBWSxZQUFZLFNBQVMsQ0FBQztBQUNuRCxvQkFBTSxRQUFRLFFBQVEsU0FBUyxNQUFNO0FBQ3JDLG9CQUFNLE9BQU8sVUFBVTtBQUN2QixvQkFBTSxVQUFVLFNBQVM7QUFDekIsb0JBQU0sUUFBUSxRQUFRLFVBQVUsT0FBTyxTQUFTO0FBQ2hELG9CQUFNLFNBQVMsUUFBUSxVQUFVLFFBQVEsU0FBUztBQUNsRCxvQkFBTSxTQUFTLFNBQVM7QUFDeEIsb0JBQU0sVUFBVSxVQUFVO0FBQzFCLHFCQUFPO0FBQUEsZ0JBQ0wsS0FBSztBQUFBLGdCQUNMLFFBQVE7QUFBQSxnQkFDUixNQUFNO0FBQUEsZ0JBQ04sT0FBTztBQUFBLGdCQUNQLE9BQU87QUFBQSxnQkFDUCxRQUFRO0FBQUEsZ0JBQ1IsR0FBRztBQUFBLGdCQUNILEdBQUc7QUFBQSxjQUNMO0FBQUEsWUFDRjtBQUNBLGtCQUFNLGFBQWEsUUFBUSxTQUFTLE1BQU07QUFDMUMsa0JBQU0sV0FBVyxJQUFJLEdBQUcsWUFBWSxJQUFJLENBQUMsU0FBUyxLQUFLLEtBQUssQ0FBQztBQUM3RCxrQkFBTSxVQUFVLElBQUksR0FBRyxZQUFZLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDO0FBQzNELGtCQUFNLGVBQWUsWUFBWSxPQUFPLENBQUMsU0FBUyxhQUFhLEtBQUssU0FBUyxVQUFVLEtBQUssVUFBVSxRQUFRO0FBQzlHLGtCQUFNLE1BQU0sYUFBYSxDQUFDLEVBQUU7QUFDNUIsa0JBQU0sU0FBUyxhQUFhLGFBQWEsU0FBUyxDQUFDLEVBQUU7QUFDckQsa0JBQU0sT0FBTztBQUNiLGtCQUFNLFFBQVE7QUFDZCxrQkFBTSxRQUFRLFFBQVE7QUFDdEIsa0JBQU0sU0FBUyxTQUFTO0FBQ3hCLG1CQUFPO0FBQUEsY0FDTDtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsY0FDQSxHQUFHO0FBQUEsY0FDSCxHQUFHO0FBQUEsWUFDTDtBQUFBLFVBQ0Y7QUFDQSxpQkFBTztBQUFBLFFBQ1Q7QUFDQSxjQUFNLGFBQWEsTUFBTSxVQUFVLGdCQUFnQjtBQUFBLFVBQ2pELFdBQVc7QUFBQSxZQUNULHVCQUF1QjtBQUFBLFVBQ3pCO0FBQUEsVUFDQSxVQUFVLFNBQVM7QUFBQSxVQUNuQjtBQUFBLFFBQ0YsQ0FBQztBQUNELFlBQUksTUFBTSxVQUFVLE1BQU0sV0FBVyxVQUFVLEtBQUssTUFBTSxVQUFVLE1BQU0sV0FBVyxVQUFVLEtBQUssTUFBTSxVQUFVLFVBQVUsV0FBVyxVQUFVLFNBQVMsTUFBTSxVQUFVLFdBQVcsV0FBVyxVQUFVLFFBQVE7QUFDbE4saUJBQU87QUFBQSxZQUNMLE9BQU87QUFBQSxjQUNMLE9BQU87QUFBQSxZQUNUO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFDQSxlQUFPLENBQUM7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFHQSxXQUFTLFNBQVMsT0FBTztBQUN2QixXQUFPLFNBQVMsTUFBTSxZQUFZLE1BQU0sWUFBWSxNQUFNLFNBQVMsTUFBTTtBQUFBLEVBQzNFO0FBQ0EsV0FBUyxVQUFVLE1BQU07QUFDdkIsUUFBSSxRQUFRLE1BQU07QUFDaEIsYUFBTztBQUFBLElBQ1Q7QUFDQSxRQUFJLENBQUMsU0FBUyxJQUFJLEdBQUc7QUFDbkIsWUFBTSxnQkFBZ0IsS0FBSztBQUMzQixhQUFPLGdCQUFnQixjQUFjLGVBQWUsU0FBUztBQUFBLElBQy9EO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFDQSxXQUFTLG1CQUFtQixTQUFTO0FBQ25DLFdBQU8sVUFBVSxPQUFPLEVBQUUsaUJBQWlCLE9BQU87QUFBQSxFQUNwRDtBQUNBLFdBQVMsWUFBWSxNQUFNO0FBQ3pCLFdBQU8sU0FBUyxJQUFJLElBQUksS0FBSyxRQUFRLEtBQUssWUFBWSxJQUFJLFlBQVksSUFBSTtBQUFBLEVBQzVFO0FBQ0EsV0FBUyxjQUFjLE9BQU87QUFDNUIsV0FBTyxpQkFBaUIsVUFBVSxLQUFLLEVBQUU7QUFBQSxFQUMzQztBQUNBLFdBQVMsVUFBVSxPQUFPO0FBQ3hCLFdBQU8saUJBQWlCLFVBQVUsS0FBSyxFQUFFO0FBQUEsRUFDM0M7QUFDQSxXQUFTLE9BQU8sT0FBTztBQUNyQixXQUFPLGlCQUFpQixVQUFVLEtBQUssRUFBRTtBQUFBLEVBQzNDO0FBQ0EsV0FBUyxhQUFhLE1BQU07QUFDMUIsUUFBSSxPQUFPLGVBQWUsYUFBYTtBQUNyQyxhQUFPO0FBQUEsSUFDVDtBQUNBLFVBQU0sYUFBYSxVQUFVLElBQUksRUFBRTtBQUNuQyxXQUFPLGdCQUFnQixjQUFjLGdCQUFnQjtBQUFBLEVBQ3ZEO0FBQ0EsV0FBUyxrQkFBa0IsU0FBUztBQUNsQyxVQUFNO0FBQUEsTUFDSjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRixJQUFJLG1CQUFtQixPQUFPO0FBQzlCLFdBQU8sNkJBQTZCLEtBQUssV0FBVyxZQUFZLFNBQVM7QUFBQSxFQUMzRTtBQUNBLFdBQVMsZUFBZSxTQUFTO0FBQy9CLFdBQU8sQ0FBQyxTQUFTLE1BQU0sSUFBSSxFQUFFLFNBQVMsWUFBWSxPQUFPLENBQUM7QUFBQSxFQUM1RDtBQUNBLFdBQVMsa0JBQWtCLFNBQVM7QUFDbEMsVUFBTSxZQUFZLFVBQVUsVUFBVSxZQUFZLEVBQUUsU0FBUyxTQUFTO0FBQ3RFLFVBQU1BLE9BQU0sbUJBQW1CLE9BQU87QUFDdEMsV0FBT0EsS0FBSSxjQUFjLFVBQVVBLEtBQUksZ0JBQWdCLFVBQVVBLEtBQUksWUFBWSxXQUFXLENBQUMsYUFBYSxhQUFhLEVBQUUsU0FBU0EsS0FBSSxVQUFVLEtBQUssYUFBYUEsS0FBSSxlQUFlLFlBQVksY0FBY0EsS0FBSSxTQUFTQSxLQUFJLFdBQVcsU0FBUztBQUFBLEVBQ3RQO0FBQ0EsV0FBUyxtQkFBbUI7QUFDMUIsV0FBTyxDQUFDLGlDQUFpQyxLQUFLLFVBQVUsU0FBUztBQUFBLEVBQ25FO0FBQ0EsTUFBSSxPQUFPLEtBQUs7QUFDaEIsTUFBSSxPQUFPLEtBQUs7QUFDaEIsTUFBSSxRQUFRLEtBQUs7QUFDakIsV0FBUyxzQkFBc0IsU0FBUyxjQUFjLGlCQUFpQjtBQUNyRSxRQUFJLHVCQUF1QixxQkFBcUIsd0JBQXdCO0FBQ3hFLFFBQUksaUJBQWlCLFFBQVE7QUFDM0IscUJBQWU7QUFBQSxJQUNqQjtBQUNBLFFBQUksb0JBQW9CLFFBQVE7QUFDOUIsd0JBQWtCO0FBQUEsSUFDcEI7QUFDQSxVQUFNLGFBQWEsUUFBUSxzQkFBc0I7QUFDakQsUUFBSSxTQUFTO0FBQ2IsUUFBSSxTQUFTO0FBQ2IsUUFBSSxnQkFBZ0IsY0FBYyxPQUFPLEdBQUc7QUFDMUMsZUFBUyxRQUFRLGNBQWMsSUFBSSxNQUFNLFdBQVcsS0FBSyxJQUFJLFFBQVEsZUFBZSxJQUFJO0FBQ3hGLGVBQVMsUUFBUSxlQUFlLElBQUksTUFBTSxXQUFXLE1BQU0sSUFBSSxRQUFRLGdCQUFnQixJQUFJO0FBQUEsSUFDN0Y7QUFDQSxVQUFNLE1BQU0sVUFBVSxPQUFPLElBQUksVUFBVSxPQUFPLElBQUk7QUFDdEQsVUFBTSxtQkFBbUIsQ0FBQyxpQkFBaUIsS0FBSztBQUNoRCxVQUFNLEtBQUssV0FBVyxRQUFRLG9CQUFvQix5QkFBeUIsc0JBQXNCLElBQUksbUJBQW1CLE9BQU8sU0FBUyxvQkFBb0IsZUFBZSxPQUFPLHdCQUF3QixJQUFJLE1BQU07QUFDcE4sVUFBTSxLQUFLLFdBQVcsT0FBTyxvQkFBb0IsMEJBQTBCLHVCQUF1QixJQUFJLG1CQUFtQixPQUFPLFNBQVMscUJBQXFCLGNBQWMsT0FBTyx5QkFBeUIsSUFBSSxNQUFNO0FBQ3ROLFVBQU0sUUFBUSxXQUFXLFFBQVE7QUFDakMsVUFBTSxTQUFTLFdBQVcsU0FBUztBQUNuQyxXQUFPO0FBQUEsTUFDTDtBQUFBLE1BQ0E7QUFBQSxNQUNBLEtBQUs7QUFBQSxNQUNMLE9BQU8sSUFBSTtBQUFBLE1BQ1gsUUFBUSxJQUFJO0FBQUEsTUFDWixNQUFNO0FBQUEsTUFDTjtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNBLFdBQVMsbUJBQW1CLE1BQU07QUFDaEMsYUFBUyxPQUFPLElBQUksSUFBSSxLQUFLLGdCQUFnQixLQUFLLGFBQWEsT0FBTyxVQUFVO0FBQUEsRUFDbEY7QUFDQSxXQUFTLGNBQWMsU0FBUztBQUM5QixRQUFJLFVBQVUsT0FBTyxHQUFHO0FBQ3RCLGFBQU87QUFBQSxRQUNMLFlBQVksUUFBUTtBQUFBLFFBQ3BCLFdBQVcsUUFBUTtBQUFBLE1BQ3JCO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxNQUNMLFlBQVksUUFBUTtBQUFBLE1BQ3BCLFdBQVcsUUFBUTtBQUFBLElBQ3JCO0FBQUEsRUFDRjtBQUNBLFdBQVMsb0JBQW9CLFNBQVM7QUFDcEMsV0FBTyxzQkFBc0IsbUJBQW1CLE9BQU8sQ0FBQyxFQUFFLE9BQU8sY0FBYyxPQUFPLEVBQUU7QUFBQSxFQUMxRjtBQUNBLFdBQVMsU0FBUyxTQUFTO0FBQ3pCLFVBQU0sT0FBTyxzQkFBc0IsT0FBTztBQUMxQyxXQUFPLE1BQU0sS0FBSyxLQUFLLE1BQU0sUUFBUSxlQUFlLE1BQU0sS0FBSyxNQUFNLE1BQU0sUUFBUTtBQUFBLEVBQ3JGO0FBQ0EsV0FBUyw4QkFBOEIsU0FBUyxjQUFjLFVBQVU7QUFDdEUsVUFBTSwwQkFBMEIsY0FBYyxZQUFZO0FBQzFELFVBQU0sa0JBQWtCLG1CQUFtQixZQUFZO0FBQ3ZELFVBQU0sT0FBTztBQUFBLE1BQ1g7QUFBQSxNQUNBLDJCQUEyQixTQUFTLFlBQVk7QUFBQSxNQUNoRCxhQUFhO0FBQUEsSUFDZjtBQUNBLFFBQUksU0FBUztBQUFBLE1BQ1gsWUFBWTtBQUFBLE1BQ1osV0FBVztBQUFBLElBQ2I7QUFDQSxVQUFNLFVBQVU7QUFBQSxNQUNkLEdBQUc7QUFBQSxNQUNILEdBQUc7QUFBQSxJQUNMO0FBQ0EsUUFBSSwyQkFBMkIsQ0FBQywyQkFBMkIsYUFBYSxTQUFTO0FBQy9FLFVBQUksWUFBWSxZQUFZLE1BQU0sVUFBVSxrQkFBa0IsZUFBZSxHQUFHO0FBQzlFLGlCQUFTLGNBQWMsWUFBWTtBQUFBLE1BQ3JDO0FBQ0EsVUFBSSxjQUFjLFlBQVksR0FBRztBQUMvQixjQUFNLGFBQWEsc0JBQXNCLGNBQWMsSUFBSTtBQUMzRCxnQkFBUSxJQUFJLFdBQVcsSUFBSSxhQUFhO0FBQ3hDLGdCQUFRLElBQUksV0FBVyxJQUFJLGFBQWE7QUFBQSxNQUMxQyxXQUFXLGlCQUFpQjtBQUMxQixnQkFBUSxJQUFJLG9CQUFvQixlQUFlO0FBQUEsTUFDakQ7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLE1BQ0wsR0FBRyxLQUFLLE9BQU8sT0FBTyxhQUFhLFFBQVE7QUFBQSxNQUMzQyxHQUFHLEtBQUssTUFBTSxPQUFPLFlBQVksUUFBUTtBQUFBLE1BQ3pDLE9BQU8sS0FBSztBQUFBLE1BQ1osUUFBUSxLQUFLO0FBQUEsSUFDZjtBQUFBLEVBQ0Y7QUFDQSxXQUFTLGNBQWMsTUFBTTtBQUMzQixRQUFJLFlBQVksSUFBSSxNQUFNLFFBQVE7QUFDaEMsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPLEtBQUssZ0JBQWdCLEtBQUssZUFBZSxhQUFhLElBQUksSUFBSSxLQUFLLE9BQU8sU0FBUyxtQkFBbUIsSUFBSTtBQUFBLEVBQ25IO0FBQ0EsV0FBUyxvQkFBb0IsU0FBUztBQUNwQyxRQUFJLENBQUMsY0FBYyxPQUFPLEtBQUssaUJBQWlCLE9BQU8sRUFBRSxhQUFhLFNBQVM7QUFDN0UsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPLFFBQVE7QUFBQSxFQUNqQjtBQUNBLFdBQVMsbUJBQW1CLFNBQVM7QUFDbkMsUUFBSSxjQUFjLGNBQWMsT0FBTztBQUN2QyxRQUFJLGFBQWEsV0FBVyxHQUFHO0FBQzdCLG9CQUFjLFlBQVk7QUFBQSxJQUM1QjtBQUNBLFdBQU8sY0FBYyxXQUFXLEtBQUssQ0FBQyxDQUFDLFFBQVEsTUFBTSxFQUFFLFNBQVMsWUFBWSxXQUFXLENBQUMsR0FBRztBQUN6RixVQUFJLGtCQUFrQixXQUFXLEdBQUc7QUFDbEMsZUFBTztBQUFBLE1BQ1QsT0FBTztBQUNMLHNCQUFjLFlBQVk7QUFBQSxNQUM1QjtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUNBLFdBQVMsZ0JBQWdCLFNBQVM7QUFDaEMsVUFBTSxVQUFVLFVBQVUsT0FBTztBQUNqQyxRQUFJLGVBQWUsb0JBQW9CLE9BQU87QUFDOUMsV0FBTyxnQkFBZ0IsZUFBZSxZQUFZLEtBQUssaUJBQWlCLFlBQVksRUFBRSxhQUFhLFVBQVU7QUFDM0cscUJBQWUsb0JBQW9CLFlBQVk7QUFBQSxJQUNqRDtBQUNBLFFBQUksaUJBQWlCLFlBQVksWUFBWSxNQUFNLFVBQVUsWUFBWSxZQUFZLE1BQU0sVUFBVSxpQkFBaUIsWUFBWSxFQUFFLGFBQWEsWUFBWSxDQUFDLGtCQUFrQixZQUFZLElBQUk7QUFDOUwsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPLGdCQUFnQixtQkFBbUIsT0FBTyxLQUFLO0FBQUEsRUFDeEQ7QUFDQSxXQUFTLGNBQWMsU0FBUztBQUM5QixRQUFJLGNBQWMsT0FBTyxHQUFHO0FBQzFCLGFBQU87QUFBQSxRQUNMLE9BQU8sUUFBUTtBQUFBLFFBQ2YsUUFBUSxRQUFRO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQ0EsVUFBTSxPQUFPLHNCQUFzQixPQUFPO0FBQzFDLFdBQU87QUFBQSxNQUNMLE9BQU8sS0FBSztBQUFBLE1BQ1osUUFBUSxLQUFLO0FBQUEsSUFDZjtBQUFBLEVBQ0Y7QUFDQSxXQUFTLHNEQUFzRCxNQUFNO0FBQ25FLFFBQUk7QUFBQSxNQUNGO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGLElBQUk7QUFDSixVQUFNLDBCQUEwQixjQUFjLFlBQVk7QUFDMUQsVUFBTSxrQkFBa0IsbUJBQW1CLFlBQVk7QUFDdkQsUUFBSSxpQkFBaUIsaUJBQWlCO0FBQ3BDLGFBQU87QUFBQSxJQUNUO0FBQ0EsUUFBSSxTQUFTO0FBQUEsTUFDWCxZQUFZO0FBQUEsTUFDWixXQUFXO0FBQUEsSUFDYjtBQUNBLFVBQU0sVUFBVTtBQUFBLE1BQ2QsR0FBRztBQUFBLE1BQ0gsR0FBRztBQUFBLElBQ0w7QUFDQSxRQUFJLDJCQUEyQixDQUFDLDJCQUEyQixhQUFhLFNBQVM7QUFDL0UsVUFBSSxZQUFZLFlBQVksTUFBTSxVQUFVLGtCQUFrQixlQUFlLEdBQUc7QUFDOUUsaUJBQVMsY0FBYyxZQUFZO0FBQUEsTUFDckM7QUFDQSxVQUFJLGNBQWMsWUFBWSxHQUFHO0FBQy9CLGNBQU0sYUFBYSxzQkFBc0IsY0FBYyxJQUFJO0FBQzNELGdCQUFRLElBQUksV0FBVyxJQUFJLGFBQWE7QUFDeEMsZ0JBQVEsSUFBSSxXQUFXLElBQUksYUFBYTtBQUFBLE1BQzFDO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxNQUNMLEdBQUc7QUFBQSxNQUNILEdBQUcsS0FBSyxJQUFJLE9BQU8sYUFBYSxRQUFRO0FBQUEsTUFDeEMsR0FBRyxLQUFLLElBQUksT0FBTyxZQUFZLFFBQVE7QUFBQSxJQUN6QztBQUFBLEVBQ0Y7QUFDQSxXQUFTLGdCQUFnQixTQUFTLFVBQVU7QUFDMUMsVUFBTSxNQUFNLFVBQVUsT0FBTztBQUM3QixVQUFNLE9BQU8sbUJBQW1CLE9BQU87QUFDdkMsVUFBTSxpQkFBaUIsSUFBSTtBQUMzQixRQUFJLFFBQVEsS0FBSztBQUNqQixRQUFJLFNBQVMsS0FBSztBQUNsQixRQUFJLElBQUk7QUFDUixRQUFJLElBQUk7QUFDUixRQUFJLGdCQUFnQjtBQUNsQixjQUFRLGVBQWU7QUFDdkIsZUFBUyxlQUFlO0FBQ3hCLFlBQU0saUJBQWlCLGlCQUFpQjtBQUN4QyxVQUFJLGtCQUFrQixDQUFDLGtCQUFrQixhQUFhLFNBQVM7QUFDN0QsWUFBSSxlQUFlO0FBQ25CLFlBQUksZUFBZTtBQUFBLE1BQ3JCO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxNQUNMO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDQSxXQUFTLGdCQUFnQixTQUFTO0FBQ2hDLFFBQUk7QUFDSixVQUFNLE9BQU8sbUJBQW1CLE9BQU87QUFDdkMsVUFBTSxTQUFTLGNBQWMsT0FBTztBQUNwQyxVQUFNLFFBQVEsd0JBQXdCLFFBQVEsa0JBQWtCLE9BQU8sU0FBUyxzQkFBc0I7QUFDdEcsVUFBTSxRQUFRLEtBQUssS0FBSyxhQUFhLEtBQUssYUFBYSxPQUFPLEtBQUssY0FBYyxHQUFHLE9BQU8sS0FBSyxjQUFjLENBQUM7QUFDL0csVUFBTSxTQUFTLEtBQUssS0FBSyxjQUFjLEtBQUssY0FBYyxPQUFPLEtBQUssZUFBZSxHQUFHLE9BQU8sS0FBSyxlQUFlLENBQUM7QUFDcEgsUUFBSSxJQUFJLENBQUMsT0FBTyxhQUFhLG9CQUFvQixPQUFPO0FBQ3hELFVBQU0sSUFBSSxDQUFDLE9BQU87QUFDbEIsUUFBSSxtQkFBbUIsUUFBUSxJQUFJLEVBQUUsY0FBYyxPQUFPO0FBQ3hELFdBQUssS0FBSyxLQUFLLGFBQWEsT0FBTyxLQUFLLGNBQWMsQ0FBQyxJQUFJO0FBQUEsSUFDN0Q7QUFDQSxXQUFPO0FBQUEsTUFDTDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0EsV0FBUywyQkFBMkIsTUFBTTtBQUN4QyxVQUFNLGFBQWEsY0FBYyxJQUFJO0FBQ3JDLFFBQUksQ0FBQyxRQUFRLFFBQVEsV0FBVyxFQUFFLFNBQVMsWUFBWSxVQUFVLENBQUMsR0FBRztBQUNuRSxhQUFPLEtBQUssY0FBYztBQUFBLElBQzVCO0FBQ0EsUUFBSSxjQUFjLFVBQVUsS0FBSyxrQkFBa0IsVUFBVSxHQUFHO0FBQzlELGFBQU87QUFBQSxJQUNUO0FBQ0EsV0FBTywyQkFBMkIsVUFBVTtBQUFBLEVBQzlDO0FBQ0EsV0FBUyxxQkFBcUIsTUFBTSxNQUFNO0FBQ3hDLFFBQUk7QUFDSixRQUFJLFNBQVMsUUFBUTtBQUNuQixhQUFPLENBQUM7QUFBQSxJQUNWO0FBQ0EsVUFBTSxxQkFBcUIsMkJBQTJCLElBQUk7QUFDMUQsVUFBTSxTQUFTLHlCQUF5QixzQkFBc0IsS0FBSyxrQkFBa0IsT0FBTyxTQUFTLG9CQUFvQjtBQUN6SCxVQUFNLE1BQU0sVUFBVSxrQkFBa0I7QUFDeEMsVUFBTSxTQUFTLFNBQVMsQ0FBQyxHQUFHLEVBQUUsT0FBTyxJQUFJLGtCQUFrQixDQUFDLEdBQUcsa0JBQWtCLGtCQUFrQixJQUFJLHFCQUFxQixDQUFDLENBQUMsSUFBSTtBQUNsSSxVQUFNLGNBQWMsS0FBSyxPQUFPLE1BQU07QUFDdEMsV0FBTyxTQUFTLGNBQWMsWUFBWSxPQUFPLHFCQUFxQixNQUFNLENBQUM7QUFBQSxFQUMvRTtBQUNBLFdBQVMsU0FBUyxRQUFRLE9BQU87QUFDL0IsVUFBTSxXQUFXLFNBQVMsT0FBTyxTQUFTLE1BQU0sZUFBZSxPQUFPLFNBQVMsTUFBTSxZQUFZO0FBQ2pHLFFBQUksVUFBVSxRQUFRLE9BQU8sU0FBUyxLQUFLLEdBQUc7QUFDNUMsYUFBTztBQUFBLElBQ1QsV0FBVyxZQUFZLGFBQWEsUUFBUSxHQUFHO0FBQzdDLFVBQUksT0FBTztBQUNYLFNBQUc7QUFDRCxZQUFJLFFBQVEsV0FBVyxNQUFNO0FBQzNCLGlCQUFPO0FBQUEsUUFDVDtBQUNBLGVBQU8sS0FBSyxjQUFjLEtBQUs7QUFBQSxNQUNqQyxTQUFTO0FBQUEsSUFDWDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQ0EsV0FBUywyQkFBMkIsU0FBUyxVQUFVO0FBQ3JELFVBQU0sYUFBYSxzQkFBc0IsU0FBUyxPQUFPLGFBQWEsT0FBTztBQUM3RSxVQUFNLE1BQU0sV0FBVyxNQUFNLFFBQVE7QUFDckMsVUFBTSxPQUFPLFdBQVcsT0FBTyxRQUFRO0FBQ3ZDLFdBQU87QUFBQSxNQUNMO0FBQUEsTUFDQTtBQUFBLE1BQ0EsR0FBRztBQUFBLE1BQ0gsR0FBRztBQUFBLE1BQ0gsT0FBTyxPQUFPLFFBQVE7QUFBQSxNQUN0QixRQUFRLE1BQU0sUUFBUTtBQUFBLE1BQ3RCLE9BQU8sUUFBUTtBQUFBLE1BQ2YsUUFBUSxRQUFRO0FBQUEsSUFDbEI7QUFBQSxFQUNGO0FBQ0EsV0FBUyxrQ0FBa0MsU0FBUyxnQkFBZ0IsVUFBVTtBQUM1RSxRQUFJLG1CQUFtQixZQUFZO0FBQ2pDLGFBQU8saUJBQWlCLGdCQUFnQixTQUFTLFFBQVEsQ0FBQztBQUFBLElBQzVEO0FBQ0EsUUFBSSxVQUFVLGNBQWMsR0FBRztBQUM3QixhQUFPLDJCQUEyQixnQkFBZ0IsUUFBUTtBQUFBLElBQzVEO0FBQ0EsV0FBTyxpQkFBaUIsZ0JBQWdCLG1CQUFtQixPQUFPLENBQUMsQ0FBQztBQUFBLEVBQ3RFO0FBQ0EsV0FBUyxxQkFBcUIsU0FBUztBQUNyQyxVQUFNLG9CQUFvQixxQkFBcUIsT0FBTztBQUN0RCxVQUFNLG9CQUFvQixDQUFDLFlBQVksT0FBTyxFQUFFLFNBQVMsbUJBQW1CLE9BQU8sRUFBRSxRQUFRO0FBQzdGLFVBQU0saUJBQWlCLHFCQUFxQixjQUFjLE9BQU8sSUFBSSxnQkFBZ0IsT0FBTyxJQUFJO0FBQ2hHLFFBQUksQ0FBQyxVQUFVLGNBQWMsR0FBRztBQUM5QixhQUFPLENBQUM7QUFBQSxJQUNWO0FBQ0EsV0FBTyxrQkFBa0IsT0FBTyxDQUFDLHVCQUF1QixVQUFVLGtCQUFrQixLQUFLLFNBQVMsb0JBQW9CLGNBQWMsS0FBSyxZQUFZLGtCQUFrQixNQUFNLE1BQU07QUFBQSxFQUNyTDtBQUNBLFdBQVMsZ0JBQWdCLE1BQU07QUFDN0IsUUFBSTtBQUFBLE1BQ0Y7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGLElBQUk7QUFDSixVQUFNLHdCQUF3QixhQUFhLHNCQUFzQixxQkFBcUIsT0FBTyxJQUFJLENBQUMsRUFBRSxPQUFPLFFBQVE7QUFDbkgsVUFBTSxvQkFBb0IsQ0FBQyxHQUFHLHVCQUF1QixZQUFZO0FBQ2pFLFVBQU0sd0JBQXdCLGtCQUFrQixDQUFDO0FBQ2pELFVBQU0sZUFBZSxrQkFBa0IsT0FBTyxDQUFDLFNBQVMscUJBQXFCO0FBQzNFLFlBQU0sT0FBTyxrQ0FBa0MsU0FBUyxrQkFBa0IsUUFBUTtBQUNsRixjQUFRLE1BQU0sS0FBSyxLQUFLLEtBQUssUUFBUSxHQUFHO0FBQ3hDLGNBQVEsUUFBUSxLQUFLLEtBQUssT0FBTyxRQUFRLEtBQUs7QUFDOUMsY0FBUSxTQUFTLEtBQUssS0FBSyxRQUFRLFFBQVEsTUFBTTtBQUNqRCxjQUFRLE9BQU8sS0FBSyxLQUFLLE1BQU0sUUFBUSxJQUFJO0FBQzNDLGFBQU87QUFBQSxJQUNULEdBQUcsa0NBQWtDLFNBQVMsdUJBQXVCLFFBQVEsQ0FBQztBQUM5RSxXQUFPO0FBQUEsTUFDTCxPQUFPLGFBQWEsUUFBUSxhQUFhO0FBQUEsTUFDekMsUUFBUSxhQUFhLFNBQVMsYUFBYTtBQUFBLE1BQzNDLEdBQUcsYUFBYTtBQUFBLE1BQ2hCLEdBQUcsYUFBYTtBQUFBLElBQ2xCO0FBQUEsRUFDRjtBQUNBLE1BQUksV0FBVztBQUFBLElBQ2I7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0EsaUJBQWlCLENBQUMsU0FBUztBQUN6QixVQUFJO0FBQUEsUUFDRjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRixJQUFJO0FBQ0osYUFBTztBQUFBLFFBQ0wsV0FBVyw4QkFBOEIsV0FBVyxnQkFBZ0IsUUFBUSxHQUFHLFFBQVE7QUFBQSxRQUN2RixVQUFVO0FBQUEsVUFDUixHQUFHLGNBQWMsUUFBUTtBQUFBLFVBQ3pCLEdBQUc7QUFBQSxVQUNILEdBQUc7QUFBQSxRQUNMO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLGdCQUFnQixDQUFDLFlBQVksTUFBTSxLQUFLLFFBQVEsZUFBZSxDQUFDO0FBQUEsSUFDaEUsT0FBTyxDQUFDLFlBQVksbUJBQW1CLE9BQU8sRUFBRSxjQUFjO0FBQUEsRUFDaEU7QUFDQSxXQUFTLFdBQVcsV0FBVyxVQUFVLFFBQVEsU0FBUztBQUN4RCxRQUFJLFlBQVksUUFBUTtBQUN0QixnQkFBVSxDQUFDO0FBQUEsSUFDYjtBQUNBLFVBQU07QUFBQSxNQUNKLGdCQUFnQixrQkFBa0I7QUFBQSxNQUNsQyxnQkFBZ0Isa0JBQWtCO0FBQUEsTUFDbEMsZUFBZSxpQkFBaUI7QUFBQSxNQUNoQyxpQkFBaUI7QUFBQSxJQUNuQixJQUFJO0FBQ0osUUFBSSxZQUFZO0FBQ2hCLFVBQU0saUJBQWlCLG1CQUFtQixDQUFDO0FBQzNDLFVBQU0saUJBQWlCLG1CQUFtQixDQUFDO0FBQzNDLFVBQU0sZ0JBQWdCLGtCQUFrQixDQUFDO0FBQ3pDLFVBQU0sWUFBWSxrQkFBa0IsaUJBQWlCLENBQUMsR0FBRyxVQUFVLFNBQVMsSUFBSSxxQkFBcUIsU0FBUyxJQUFJLENBQUMsR0FBRyxHQUFHLHFCQUFxQixRQUFRLENBQUMsSUFBSSxDQUFDO0FBQzVKLGNBQVUsUUFBUSxDQUFDLGFBQWE7QUFDOUIsd0JBQWtCLFNBQVMsaUJBQWlCLFVBQVUsUUFBUTtBQUFBLFFBQzVELFNBQVM7QUFBQSxNQUNYLENBQUM7QUFDRCx3QkFBa0IsU0FBUyxpQkFBaUIsVUFBVSxNQUFNO0FBQUEsSUFDOUQsQ0FBQztBQUNELFFBQUksWUFBWTtBQUNoQixRQUFJLGVBQWU7QUFDakIsa0JBQVksSUFBSSxlQUFlLE1BQU07QUFDckMsZ0JBQVUsU0FBUyxLQUFLLFVBQVUsUUFBUSxTQUFTO0FBQ25ELGdCQUFVLFFBQVEsUUFBUTtBQUFBLElBQzVCO0FBQ0EsUUFBSTtBQUNKLFFBQUksY0FBYyxpQkFBaUIsc0JBQXNCLFNBQVMsSUFBSTtBQUN0RSxRQUFJLGdCQUFnQjtBQUNsQixnQkFBVTtBQUFBLElBQ1o7QUFDQSxhQUFTLFlBQVk7QUFDbkIsVUFBSSxXQUFXO0FBQ2I7QUFBQSxNQUNGO0FBQ0EsWUFBTSxjQUFjLHNCQUFzQixTQUFTO0FBQ25ELFVBQUksZ0JBQWdCLFlBQVksTUFBTSxZQUFZLEtBQUssWUFBWSxNQUFNLFlBQVksS0FBSyxZQUFZLFVBQVUsWUFBWSxTQUFTLFlBQVksV0FBVyxZQUFZLFNBQVM7QUFDL0ssZUFBTztBQUFBLE1BQ1Q7QUFDQSxvQkFBYztBQUNkLGdCQUFVLHNCQUFzQixTQUFTO0FBQUEsSUFDM0M7QUFDQSxXQUFPLE1BQU07QUFDWCxVQUFJO0FBQ0osa0JBQVk7QUFDWixnQkFBVSxRQUFRLENBQUMsYUFBYTtBQUM5QiwwQkFBa0IsU0FBUyxvQkFBb0IsVUFBVSxNQUFNO0FBQy9ELDBCQUFrQixTQUFTLG9CQUFvQixVQUFVLE1BQU07QUFBQSxNQUNqRSxDQUFDO0FBQ0QsT0FBQyxZQUFZLGNBQWMsT0FBTyxTQUFTLFVBQVUsV0FBVztBQUNoRSxrQkFBWTtBQUNaLFVBQUksZ0JBQWdCO0FBQ2xCLDZCQUFxQixPQUFPO0FBQUEsTUFDOUI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNBLE1BQUksbUJBQW1CLENBQUMsV0FBVyxVQUFVLFlBQVksZ0JBQWdCLFdBQVcsVUFBVTtBQUFBLElBQzVGO0FBQUEsSUFDQSxHQUFHO0FBQUEsRUFDTCxDQUFDO0FBR0QsTUFBSSwyQkFBMkIsQ0FBQyxjQUFjO0FBQzVDLFVBQU0sU0FBUztBQUFBLE1BQ2IsV0FBVztBQUFBLE1BQ1gsWUFBWSxDQUFDO0FBQUEsSUFDZjtBQUNBLFVBQU0sT0FBTyxPQUFPLEtBQUssU0FBUztBQUNsQyxVQUFNLHNCQUFzQixDQUFDLGFBQWE7QUFDeEMsYUFBTyxVQUFVLFFBQVE7QUFBQSxJQUMzQjtBQUNBLFFBQUksS0FBSyxTQUFTLFFBQVEsR0FBRztBQUMzQixhQUFPLFdBQVcsS0FBSyxPQUFPLG9CQUFvQixRQUFRLENBQUMsQ0FBQztBQUFBLElBQzlEO0FBQ0EsUUFBSSxLQUFLLFNBQVMsV0FBVyxHQUFHO0FBQzlCLGFBQU8sWUFBWSxvQkFBb0IsV0FBVztBQUFBLElBQ3BEO0FBQ0EsUUFBSSxLQUFLLFNBQVMsZUFBZSxLQUFLLENBQUMsS0FBSyxTQUFTLE1BQU0sR0FBRztBQUM1RCxhQUFPLFdBQVcsS0FBSyxjQUFjLG9CQUFvQixlQUFlLENBQUMsQ0FBQztBQUFBLElBQzVFO0FBQ0EsUUFBSSxLQUFLLFNBQVMsTUFBTSxHQUFHO0FBQ3pCLGFBQU8sV0FBVyxLQUFLLEtBQUssb0JBQW9CLE1BQU0sQ0FBQyxDQUFDO0FBQUEsSUFDMUQ7QUFDQSxRQUFJLEtBQUssU0FBUyxPQUFPLEdBQUc7QUFDMUIsYUFBTyxXQUFXLEtBQUssTUFBTSxvQkFBb0IsT0FBTyxDQUFDLENBQUM7QUFBQSxJQUM1RDtBQUNBLFFBQUksS0FBSyxTQUFTLFFBQVEsR0FBRztBQUMzQixhQUFPLFdBQVcsS0FBSyxPQUFPLG9CQUFvQixRQUFRLENBQUMsQ0FBQztBQUFBLElBQzlEO0FBQ0EsUUFBSSxLQUFLLFNBQVMsT0FBTyxHQUFHO0FBQzFCLGFBQU8sV0FBVyxLQUFLLE1BQU0sb0JBQW9CLE9BQU8sQ0FBQyxDQUFDO0FBQUEsSUFDNUQ7QUFDQSxRQUFJLEtBQUssU0FBUyxNQUFNLEdBQUc7QUFDekIsYUFBTyxXQUFXLEtBQUssS0FBSyxvQkFBb0IsTUFBTSxDQUFDLENBQUM7QUFBQSxJQUMxRDtBQUNBLFFBQUksS0FBSyxTQUFTLE1BQU0sR0FBRztBQUN6QixhQUFPLFdBQVcsS0FBSyxLQUFLLG9CQUFvQixNQUFNLENBQUMsQ0FBQztBQUFBLElBQzFEO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFHQSxNQUFJLG9DQUFvQyxDQUFDLFdBQVcsYUFBYTtBQUMvRCxVQUFNLFNBQVM7QUFBQSxNQUNiLFdBQVc7QUFBQSxRQUNULE1BQU07QUFBQSxNQUNSO0FBQUEsTUFDQSxPQUFPO0FBQUEsUUFDTCxXQUFXO0FBQUEsUUFDWCxVQUFVO0FBQUEsUUFDVixZQUFZLENBQUM7QUFBQSxNQUNmO0FBQUEsSUFDRjtBQUNBLFVBQU0sc0JBQXNCLENBQUMsYUFBYTtBQUN4QyxhQUFPLFVBQVUsVUFBVSxRQUFRLFFBQVEsSUFBSSxDQUFDO0FBQUEsSUFDbEQ7QUFDQSxRQUFJLFVBQVUsU0FBUyxNQUFNLEdBQUc7QUFDOUIsYUFBTyxVQUFVLE9BQU87QUFBQSxJQUMxQjtBQUNBLFFBQUksVUFBVSxTQUFTLFVBQVUsR0FBRztBQUNsQyxhQUFPLE1BQU0sV0FBVztBQUFBLElBQzFCO0FBQ0EsUUFBSSxVQUFVLFNBQVMsUUFBUSxHQUFHO0FBQ2hDLGFBQU8sTUFBTSxXQUFXLEtBQUssT0FBTyxTQUFTLFFBQVEsS0FBSyxFQUFFLENBQUM7QUFBQSxJQUMvRDtBQUNBLFFBQUksVUFBVSxTQUFTLFdBQVcsR0FBRztBQUNuQyxhQUFPLE1BQU0sWUFBWSxvQkFBb0IsV0FBVztBQUFBLElBQzFEO0FBQ0EsUUFBSSxVQUFVLFNBQVMsZUFBZSxLQUFLLENBQUMsVUFBVSxTQUFTLE1BQU0sR0FBRztBQUN0RSxhQUFPLE1BQU0sV0FBVyxLQUFLLGNBQWMsU0FBUyxlQUFlLENBQUMsQ0FBQztBQUFBLElBQ3ZFO0FBQ0EsUUFBSSxVQUFVLFNBQVMsTUFBTSxHQUFHO0FBQzlCLGFBQU8sTUFBTSxXQUFXLEtBQUssS0FBSyxTQUFTLE1BQU0sQ0FBQyxDQUFDO0FBQUEsSUFDckQ7QUFDQSxRQUFJLFVBQVUsU0FBUyxPQUFPLEdBQUc7QUFDL0IsYUFBTyxNQUFNLFdBQVcsS0FBSyxNQUFNLFNBQVMsT0FBTyxDQUFDLENBQUM7QUFBQSxJQUN2RDtBQUNBLFFBQUksVUFBVSxTQUFTLFFBQVEsR0FBRztBQUNoQyxhQUFPLE1BQU0sV0FBVyxLQUFLLE9BQU8sU0FBUyxRQUFRLENBQUMsQ0FBQztBQUFBLElBQ3pEO0FBQ0EsUUFBSSxVQUFVLFNBQVMsT0FBTyxHQUFHO0FBQy9CLGFBQU8sTUFBTSxXQUFXLEtBQUssTUFBTSxTQUFTLE9BQU8sQ0FBQyxDQUFDO0FBQUEsSUFDdkQ7QUFDQSxRQUFJLFVBQVUsU0FBUyxNQUFNLEdBQUc7QUFDOUIsYUFBTyxNQUFNLFdBQVcsS0FBSyxLQUFLLFNBQVMsTUFBTSxDQUFDLENBQUM7QUFBQSxJQUNyRDtBQUNBLFFBQUksVUFBVSxTQUFTLE1BQU0sR0FBRztBQUM5QixhQUFPLE1BQU0sV0FBVyxLQUFLLEtBQUssU0FBUyxNQUFNLENBQUMsQ0FBQztBQUFBLElBQ3JEO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFHQSxNQUFJLGVBQWUsQ0FBQyxXQUFXO0FBQzdCLFFBQUksUUFBUSxnRUFBZ0UsTUFBTSxFQUFFO0FBQ3BGLFFBQUksTUFBTTtBQUNWLFFBQUksQ0FBQyxRQUFRO0FBQ1gsZUFBUyxLQUFLLE1BQU0sS0FBSyxPQUFPLElBQUksTUFBTSxNQUFNO0FBQUEsSUFDbEQ7QUFDQSxhQUFTLElBQUksR0FBRyxJQUFJLFFBQVEsS0FBSztBQUMvQixhQUFPLE1BQU0sS0FBSyxNQUFNLEtBQUssT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQUEsSUFDdkQ7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUdBLE1BQUksb0JBQW9CLENBQUM7QUFDekIsTUFBSSxlQUFlLENBQUM7QUFDcEIsTUFBSSxhQUFhLENBQUM7QUFDbEIsV0FBUyxrQkFBa0IsSUFBSSxPQUFPO0FBQ3BDLFFBQUksQ0FBQyxHQUFHO0FBQ047QUFDRixXQUFPLFFBQVEsR0FBRyxvQkFBb0IsRUFBRSxRQUFRLENBQUMsQ0FBQyxNQUFNLEtBQUssTUFBTTtBQUNqRSxVQUFJLFVBQVUsVUFBVSxNQUFNLFNBQVMsSUFBSSxHQUFHO0FBQzVDLGNBQU0sUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ3hCLGVBQU8sR0FBRyxxQkFBcUIsSUFBSTtBQUFBLE1BQ3JDO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUNBLE1BQUksV0FBVyxJQUFJLGlCQUFpQixRQUFRO0FBQzVDLE1BQUkscUJBQXFCO0FBQ3pCLFdBQVMsMEJBQTBCO0FBQ2pDLGFBQVMsUUFBUSxVQUFVLEVBQUUsU0FBUyxNQUFNLFdBQVcsTUFBTSxZQUFZLE1BQU0sbUJBQW1CLEtBQUssQ0FBQztBQUN4Ryx5QkFBcUI7QUFBQSxFQUN2QjtBQUNBLFdBQVMseUJBQXlCO0FBQ2hDLGtCQUFjO0FBQ2QsYUFBUyxXQUFXO0FBQ3BCLHlCQUFxQjtBQUFBLEVBQ3ZCO0FBQ0EsTUFBSSxjQUFjLENBQUM7QUFDbkIsTUFBSSx5QkFBeUI7QUFDN0IsV0FBUyxnQkFBZ0I7QUFDdkIsa0JBQWMsWUFBWSxPQUFPLFNBQVMsWUFBWSxDQUFDO0FBQ3ZELFFBQUksWUFBWSxVQUFVLENBQUMsd0JBQXdCO0FBQ2pELCtCQUF5QjtBQUN6QixxQkFBZSxNQUFNO0FBQ25CLDJCQUFtQjtBQUNuQixpQ0FBeUI7QUFBQSxNQUMzQixDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7QUFDQSxXQUFTLHFCQUFxQjtBQUM1QixhQUFTLFdBQVc7QUFDcEIsZ0JBQVksU0FBUztBQUFBLEVBQ3ZCO0FBQ0EsV0FBUyxVQUFVLFVBQVU7QUFDM0IsUUFBSSxDQUFDO0FBQ0gsYUFBTyxTQUFTO0FBQ2xCLDJCQUF1QjtBQUN2QixRQUFJLFNBQVMsU0FBUztBQUN0Qiw0QkFBd0I7QUFDeEIsV0FBTztBQUFBLEVBQ1Q7QUFDQSxNQUFJLGVBQWU7QUFDbkIsTUFBSSxvQkFBb0IsQ0FBQztBQUN6QixXQUFTLFNBQVMsV0FBVztBQUMzQixRQUFJLGNBQWM7QUFDaEIsMEJBQW9CLGtCQUFrQixPQUFPLFNBQVM7QUFDdEQ7QUFBQSxJQUNGO0FBQ0EsUUFBSSxhQUFhLENBQUM7QUFDbEIsUUFBSSxlQUFlLENBQUM7QUFDcEIsUUFBSSxrQkFBa0Msb0JBQUksSUFBSTtBQUM5QyxRQUFJLG9CQUFvQyxvQkFBSSxJQUFJO0FBQ2hELGFBQVMsSUFBSSxHQUFHLElBQUksVUFBVSxRQUFRLEtBQUs7QUFDekMsVUFBSSxVQUFVLENBQUMsRUFBRSxPQUFPO0FBQ3RCO0FBQ0YsVUFBSSxVQUFVLENBQUMsRUFBRSxTQUFTLGFBQWE7QUFDckMsa0JBQVUsQ0FBQyxFQUFFLFdBQVcsUUFBUSxDQUFDLFNBQVMsS0FBSyxhQUFhLEtBQUssV0FBVyxLQUFLLElBQUksQ0FBQztBQUN0RixrQkFBVSxDQUFDLEVBQUUsYUFBYSxRQUFRLENBQUMsU0FBUyxLQUFLLGFBQWEsS0FBSyxhQUFhLEtBQUssSUFBSSxDQUFDO0FBQUEsTUFDNUY7QUFDQSxVQUFJLFVBQVUsQ0FBQyxFQUFFLFNBQVMsY0FBYztBQUN0QyxZQUFJLEtBQUssVUFBVSxDQUFDLEVBQUU7QUFDdEIsWUFBSSxPQUFPLFVBQVUsQ0FBQyxFQUFFO0FBQ3hCLFlBQUksV0FBVyxVQUFVLENBQUMsRUFBRTtBQUM1QixZQUFJLE1BQU0sTUFBTTtBQUNkLGNBQUksQ0FBQyxnQkFBZ0IsSUFBSSxFQUFFO0FBQ3pCLDRCQUFnQixJQUFJLElBQUksQ0FBQyxDQUFDO0FBQzVCLDBCQUFnQixJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsTUFBTSxPQUFPLEdBQUcsYUFBYSxJQUFJLEVBQUUsQ0FBQztBQUFBLFFBQ3JFO0FBQ0EsWUFBSSxTQUFTLE1BQU07QUFDakIsY0FBSSxDQUFDLGtCQUFrQixJQUFJLEVBQUU7QUFDM0IsOEJBQWtCLElBQUksSUFBSSxDQUFDLENBQUM7QUFDOUIsNEJBQWtCLElBQUksRUFBRSxFQUFFLEtBQUssSUFBSTtBQUFBLFFBQ3JDO0FBQ0EsWUFBSSxHQUFHLGFBQWEsSUFBSSxLQUFLLGFBQWEsTUFBTTtBQUM5QyxjQUFJO0FBQUEsUUFDTixXQUFXLEdBQUcsYUFBYSxJQUFJLEdBQUc7QUFDaEMsaUJBQU87QUFDUCxjQUFJO0FBQUEsUUFDTixPQUFPO0FBQ0wsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFDQSxzQkFBa0IsUUFBUSxDQUFDLE9BQU8sT0FBTztBQUN2Qyx3QkFBa0IsSUFBSSxLQUFLO0FBQUEsSUFDN0IsQ0FBQztBQUNELG9CQUFnQixRQUFRLENBQUMsT0FBTyxPQUFPO0FBQ3JDLHdCQUFrQixRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksS0FBSyxDQUFDO0FBQUEsSUFDL0MsQ0FBQztBQUNELGFBQVMsUUFBUSxjQUFjO0FBQzdCLFVBQUksV0FBVyxTQUFTLElBQUk7QUFDMUI7QUFDRixtQkFBYSxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQztBQUNuQyxVQUFJLEtBQUssYUFBYTtBQUNwQixlQUFPLEtBQUssWUFBWTtBQUN0QixlQUFLLFlBQVksSUFBSSxFQUFFO0FBQUEsTUFDM0I7QUFBQSxJQUNGO0FBQ0EsZUFBVyxRQUFRLENBQUMsU0FBUztBQUMzQixXQUFLLGdCQUFnQjtBQUNyQixXQUFLLFlBQVk7QUFBQSxJQUNuQixDQUFDO0FBQ0QsYUFBUyxRQUFRLFlBQVk7QUFDM0IsVUFBSSxhQUFhLFNBQVMsSUFBSTtBQUM1QjtBQUNGLFVBQUksQ0FBQyxLQUFLO0FBQ1I7QUFDRixhQUFPLEtBQUs7QUFDWixhQUFPLEtBQUs7QUFDWixpQkFBVyxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQztBQUNqQyxXQUFLLFlBQVk7QUFDakIsV0FBSyxnQkFBZ0I7QUFBQSxJQUN2QjtBQUNBLGVBQVcsUUFBUSxDQUFDLFNBQVM7QUFDM0IsYUFBTyxLQUFLO0FBQ1osYUFBTyxLQUFLO0FBQUEsSUFDZCxDQUFDO0FBQ0QsaUJBQWE7QUFDYixtQkFBZTtBQUNmLHNCQUFrQjtBQUNsQix3QkFBb0I7QUFBQSxFQUN0QjtBQUdBLFdBQVMsS0FBSyxVQUFVLFdBQVcsTUFBTTtBQUFBLEVBQ3pDLEdBQUc7QUFDRCxRQUFJLFNBQVM7QUFDYixXQUFPLFdBQVc7QUFDaEIsVUFBSSxDQUFDLFFBQVE7QUFDWCxpQkFBUztBQUNULGlCQUFTLE1BQU0sTUFBTSxTQUFTO0FBQUEsTUFDaEMsT0FBTztBQUNMLGlCQUFTLE1BQU0sTUFBTSxTQUFTO0FBQUEsTUFDaEM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUdBLFdBQVMsWUFBWSxRQUFRO0FBQzNCLFVBQU0saUJBQWlCO0FBQUEsTUFDckIsYUFBYTtBQUFBLE1BQ2IsTUFBTTtBQUFBLElBQ1I7QUFDQSxhQUFTLFVBQVUsV0FBVyxTQUFTLFFBQVEsTUFBTTtBQUNuRCxVQUFJLENBQUM7QUFDSDtBQUNGLFVBQUksQ0FBQyxRQUFRLGFBQWEsZUFBZSxHQUFHO0FBQzFDLGdCQUFRLGFBQWEsaUJBQWlCLEtBQUs7QUFBQSxNQUM3QztBQUNBLFVBQUksQ0FBQyxNQUFNLGFBQWEsSUFBSSxHQUFHO0FBQzdCLGNBQU0sVUFBVSxTQUFTLGFBQWEsQ0FBQztBQUN2QyxnQkFBUSxhQUFhLGlCQUFpQixPQUFPO0FBQzdDLGNBQU0sYUFBYSxNQUFNLE9BQU87QUFBQSxNQUNsQyxPQUFPO0FBQ0wsZ0JBQVEsYUFBYSxpQkFBaUIsTUFBTSxhQUFhLElBQUksQ0FBQztBQUFBLE1BQ2hFO0FBQ0EsWUFBTSxhQUFhLGNBQWMsSUFBSTtBQUNyQyxZQUFNLGFBQWEsUUFBUSxRQUFRO0FBQUEsSUFDckM7QUFDQSxVQUFNLGlCQUFpQixTQUFTLGlCQUFpQixzQkFBc0I7QUFDdkUsVUFBTSxnQkFBZ0IsU0FBUyxpQkFBaUIsMEJBQTBCO0FBQzFFLEtBQUMsR0FBRyxnQkFBZ0IsR0FBRyxhQUFhLEVBQUUsUUFBUSxDQUFDLFlBQVk7QUFDekQsWUFBTSxZQUFZLFFBQVEsY0FBYyxRQUFRLFVBQVU7QUFDMUQsWUFBTSxRQUFRLFVBQVUsY0FBYyxpQkFBaUI7QUFDdkQsZ0JBQVUsV0FBVyxTQUFTLEtBQUs7QUFBQSxJQUNyQyxDQUFDO0FBQ0QsV0FBTyxNQUFNLFNBQVMsQ0FBQyxPQUFPO0FBQzVCLGFBQU8sQ0FBQyxZQUFZLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTTtBQUN4QyxjQUFNLFVBQVUsRUFBRSxHQUFHLGdCQUFnQixHQUFHLFNBQVM7QUFDakQsY0FBTSxTQUFTLE9BQU8sS0FBSyxTQUFTLEVBQUUsU0FBUyxJQUFJLHlCQUF5QixTQUFTLElBQUksRUFBRSxZQUFZLENBQUMsY0FBYyxDQUFDLEVBQUU7QUFDekgsY0FBTSxVQUFVO0FBQ2hCLGNBQU0sWUFBWSxHQUFHLGNBQWMsUUFBUSxVQUFVO0FBQ3JELGNBQU0sUUFBUSxVQUFVLGNBQWMsaUJBQWlCO0FBQ3ZELGlCQUFTLGFBQWE7QUFDcEIsaUJBQU8sTUFBTSxNQUFNLFdBQVc7QUFBQSxRQUNoQztBQUNBLGlCQUFTLGFBQWE7QUFDcEIsZ0JBQU0sTUFBTSxVQUFVO0FBQ3RCLGtCQUFRLGFBQWEsaUJBQWlCLEtBQUs7QUFDM0MsY0FBSSxRQUFRO0FBQ1Ysa0JBQU0sYUFBYSxVQUFVLEtBQUs7QUFDcEMscUJBQVcsSUFBSSxPQUFPLE1BQU07QUFBQSxRQUM5QjtBQUNBLGlCQUFTLFlBQVk7QUFDbkIsZ0JBQU0sTUFBTSxVQUFVO0FBQ3RCLGtCQUFRLGFBQWEsaUJBQWlCLElBQUk7QUFDMUMsY0FBSSxRQUFRO0FBQ1Ysa0JBQU0sYUFBYSxVQUFVLElBQUk7QUFDbkMsaUJBQU87QUFBQSxRQUNUO0FBQ0EsaUJBQVMsY0FBYztBQUNyQixxQkFBVyxJQUFJLFdBQVcsSUFBSSxVQUFVO0FBQUEsUUFDMUM7QUFDQSx1QkFBZSxTQUFTO0FBQ3RCLGlCQUFPLE1BQU0saUJBQWlCLElBQUksT0FBTyxNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUUsZ0JBQWdCLFdBQVcsR0FBRyxFQUFFLE1BQU07QUFDN0YsZ0JBQUksZUFBZSxPQUFPO0FBQ3hCLG9CQUFNLEtBQUssZUFBZSxPQUFPO0FBQ2pDLG9CQUFNLEtBQUssZUFBZSxPQUFPO0FBQ2pDLG9CQUFNLE1BQU0sT0FBTyxXQUFXLE9BQU8sQ0FBQyxlQUFlLFdBQVcsUUFBUSxPQUFPLEVBQUUsQ0FBQyxFQUFFLFFBQVE7QUFDNUYsb0JBQU0sYUFBYTtBQUFBLGdCQUNqQixLQUFLO0FBQUEsZ0JBQ0wsT0FBTztBQUFBLGdCQUNQLFFBQVE7QUFBQSxnQkFDUixNQUFNO0FBQUEsY0FDUixFQUFFLFVBQVUsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQ3pCLHFCQUFPLE9BQU8sSUFBSSxPQUFPO0FBQUEsZ0JBQ3ZCLE1BQU0sTUFBTSxPQUFPLEdBQUcsU0FBUztBQUFBLGdCQUMvQixLQUFLLE1BQU0sT0FBTyxHQUFHLFNBQVM7QUFBQSxnQkFDOUIsT0FBTztBQUFBLGdCQUNQLFFBQVE7QUFBQSxnQkFDUixDQUFDLFVBQVUsR0FBRztBQUFBLGNBQ2hCLENBQUM7QUFBQSxZQUNIO0FBQ0EsZ0JBQUksZUFBZSxNQUFNO0FBQ3ZCLG9CQUFNLEVBQUUsZ0JBQWdCLElBQUksZUFBZTtBQUMzQyxxQkFBTyxPQUFPLE1BQU0sT0FBTztBQUFBLGdCQUN6QixZQUFZLGtCQUFrQixXQUFXO0FBQUEsY0FDM0MsQ0FBQztBQUFBLFlBQ0g7QUFDQSxtQkFBTyxPQUFPLE1BQU0sT0FBTztBQUFBLGNBQ3pCLE1BQU0sR0FBRztBQUFBLGNBQ1QsS0FBSyxHQUFHO0FBQUEsWUFDVixDQUFDO0FBQUEsVUFDSCxDQUFDO0FBQUEsUUFDSDtBQUNBLFlBQUksUUFBUSxhQUFhO0FBQ3ZCLGlCQUFPLGlCQUFpQixTQUFTLENBQUMsVUFBVTtBQUMxQyxnQkFBSSxDQUFDLFVBQVUsU0FBUyxNQUFNLE1BQU0sS0FBSyxXQUFXLEdBQUc7QUFDckQsMEJBQVk7QUFBQSxZQUNkO0FBQUEsVUFDRixDQUFDO0FBQ0QsaUJBQU87QUFBQSxZQUNMO0FBQUEsWUFDQSxDQUFDLFVBQVU7QUFDVCxrQkFBSSxNQUFNLFFBQVEsWUFBWSxXQUFXLEdBQUc7QUFDMUMsNEJBQVk7QUFBQSxjQUNkO0FBQUEsWUFDRjtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUNBLG9CQUFZO0FBQUEsTUFDZDtBQUFBLElBQ0YsQ0FBQztBQUNELFdBQU8sVUFBVSxTQUFTLENBQUMsT0FBTyxFQUFFLFdBQVcsV0FBVyxHQUFHLEVBQUUsVUFBVSxPQUFPLE1BQU07QUFDcEYsWUFBTSxXQUFXLGFBQWEsU0FBUyxVQUFVLElBQUksQ0FBQztBQUN0RCxZQUFNLFNBQVMsVUFBVSxTQUFTLElBQUksa0NBQWtDLFdBQVcsUUFBUSxJQUFJLENBQUM7QUFDaEcsVUFBSSxVQUFVO0FBQ2QsVUFBSSxPQUFPLE1BQU0sWUFBWSxTQUFTO0FBQ3BDLGNBQU0sTUFBTSxXQUFXO0FBQUEsTUFDekI7QUFDQSxZQUFNLFlBQVksQ0FBQyxVQUFVLE1BQU0saUJBQWlCLENBQUMsTUFBTSxjQUFjLFFBQVEsVUFBVSxFQUFFLFNBQVMsTUFBTSxNQUFNLElBQUksTUFBTSxNQUFNLElBQUk7QUFDdEksWUFBTSxZQUFZLENBQUMsVUFBVSxNQUFNLFFBQVEsV0FBVyxNQUFNLE1BQU0sSUFBSTtBQUN0RSxZQUFNLFVBQVUsTUFBTSxhQUFhLE9BQU87QUFDMUMsWUFBTSxZQUFZLE1BQU0sY0FBYyxRQUFRLFVBQVU7QUFDeEQsWUFBTSxZQUFZLFVBQVUsaUJBQWlCLHFCQUFxQixXQUFXO0FBQzdFLFlBQU0sV0FBVyxVQUFVLGlCQUFpQix5QkFBeUIsV0FBVztBQUNoRixZQUFNLE1BQU0sWUFBWSxXQUFXLE1BQU07QUFDekMsZ0JBQVUsV0FBVyxDQUFDLEdBQUcsV0FBVyxHQUFHLFFBQVEsRUFBRSxDQUFDLEdBQUcsS0FBSztBQUMxRCxZQUFNLGFBQWE7QUFDbkIsWUFBTSxVQUFVO0FBQ2hCLFVBQUksQ0FBQyxNQUFNO0FBQ1QsY0FBTSxZQUFZLE1BQU07QUFDdEIsb0JBQVUsTUFBTTtBQUNkLGtCQUFNLE1BQU0sWUFBWSxXQUFXLFFBQVEsVUFBVSxTQUFTLFdBQVcsSUFBSSxjQUFjLE1BQU07QUFBQSxVQUNuRyxDQUFDO0FBQUEsUUFDSDtBQUNGLFVBQUksQ0FBQyxNQUFNO0FBQ1QsY0FBTSxZQUFZLE1BQU07QUFDdEIsb0JBQVUsTUFBTTtBQUNkLGtCQUFNLE1BQU0sWUFBWSxXQUFXLFNBQVMsVUFBVSxTQUFTLFdBQVcsSUFBSSxjQUFjLE1BQU07QUFBQSxVQUNwRyxDQUFDO0FBQUEsUUFDSDtBQUNGLFVBQUksUUFBUSxNQUFNO0FBQ2hCLGNBQU0sVUFBVTtBQUNoQixjQUFNLGFBQWE7QUFBQSxNQUNyQjtBQUNBLFVBQUksT0FBTyxNQUFNO0FBQ2YsY0FBTSxVQUFVO0FBQ2hCLGNBQU0sYUFBYTtBQUFBLE1BQ3JCO0FBQ0EsVUFBSSwwQkFBMEIsTUFBTSxXQUFXLElBQUk7QUFDbkQsVUFBSSxTQUFTO0FBQUEsUUFDWCxDQUFDLFVBQVUsUUFBUSxLQUFLLElBQUksTUFBTTtBQUFBLFFBQ2xDLENBQUMsVUFBVTtBQUNULGNBQUksT0FBTyxNQUFNLHVDQUF1QyxZQUFZO0FBQ2xFLGtCQUFNLG1DQUFtQyxPQUFPLE9BQU8sTUFBTSxLQUFLO0FBQUEsVUFDcEUsT0FBTztBQUNMLG9CQUFRLHdCQUF3QixJQUFJLE1BQU07QUFBQSxVQUM1QztBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQ0EsVUFBSTtBQUNKLFVBQUksWUFBWTtBQUNoQjtBQUFBLFFBQ0UsTUFBTSxTQUFTLENBQUMsVUFBVTtBQUN4QixjQUFJLENBQUMsYUFBYSxVQUFVO0FBQzFCO0FBQ0YsY0FBSSxVQUFVLFNBQVMsV0FBVztBQUNoQyxvQkFBUSx3QkFBd0IsSUFBSSxNQUFNO0FBQzVDLGlCQUFPLEtBQUs7QUFDWixxQkFBVztBQUNYLHNCQUFZO0FBQUEsUUFDZCxDQUFDO0FBQUEsTUFDSDtBQUNBLFlBQU0sT0FBTyxlQUFlLE9BQU87QUFDakMsY0FBTSxVQUFVLE1BQU0sZ0JBQWdCLE1BQU0sZ0JBQWdCO0FBQzVELGVBQU8sSUFBSTtBQUNYLGNBQU0sUUFBUSxhQUFhLGlCQUFpQixJQUFJO0FBQ2hELFlBQUksT0FBTyxVQUFVO0FBQ25CLGdCQUFNLGFBQWEsVUFBVSxJQUFJO0FBQ25DLGtCQUFVLFdBQVcsTUFBTSxTQUFTLE9BQU8sTUFBTTtBQUMvQywyQkFBaUIsTUFBTSxTQUFTLE9BQU8sT0FBTyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUUsZ0JBQWdCLFdBQVcsR0FBRyxFQUFFLE1BQU07QUFDakcsZ0JBQUksZUFBZSxPQUFPO0FBQ3hCLG9CQUFNLEtBQUssZUFBZSxPQUFPO0FBQ2pDLG9CQUFNLEtBQUssZUFBZSxPQUFPO0FBQ2pDLG9CQUFNLE1BQU0sT0FBTyxNQUFNLFdBQVcsT0FBTyxDQUFDLGVBQWUsV0FBVyxRQUFRLE9BQU8sRUFBRSxDQUFDLEVBQUUsUUFBUTtBQUNsRyxvQkFBTSxhQUFhO0FBQUEsZ0JBQ2pCLEtBQUs7QUFBQSxnQkFDTCxPQUFPO0FBQUEsZ0JBQ1AsUUFBUTtBQUFBLGdCQUNSLE1BQU07QUFBQSxjQUNSLEVBQUUsVUFBVSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDekIscUJBQU8sT0FBTyxJQUFJLE9BQU87QUFBQSxnQkFDdkIsTUFBTSxNQUFNLE9BQU8sR0FBRyxTQUFTO0FBQUEsZ0JBQy9CLEtBQUssTUFBTSxPQUFPLEdBQUcsU0FBUztBQUFBLGdCQUM5QixPQUFPO0FBQUEsZ0JBQ1AsUUFBUTtBQUFBLGdCQUNSLENBQUMsVUFBVSxHQUFHO0FBQUEsY0FDaEIsQ0FBQztBQUFBLFlBQ0g7QUFDQSxnQkFBSSxlQUFlLE1BQU07QUFDdkIsb0JBQU0sRUFBRSxnQkFBZ0IsSUFBSSxlQUFlO0FBQzNDLHFCQUFPLE9BQU8sTUFBTSxPQUFPO0FBQUEsZ0JBQ3pCLFlBQVksa0JBQWtCLFdBQVc7QUFBQSxjQUMzQyxDQUFDO0FBQUEsWUFDSDtBQUNBLG1CQUFPLE9BQU8sTUFBTSxPQUFPO0FBQUEsY0FDekIsTUFBTSxHQUFHO0FBQUEsY0FDVCxLQUFLLEdBQUc7QUFBQSxZQUNWLENBQUM7QUFBQSxVQUNILENBQUM7QUFBQSxRQUNILENBQUM7QUFDRCxlQUFPLGlCQUFpQixTQUFTLFNBQVM7QUFDMUMsZUFBTyxpQkFBaUIsV0FBVyxXQUFXLElBQUk7QUFBQSxNQUNwRDtBQUNBLFlBQU0sUUFBUSxXQUFXO0FBQ3ZCLGVBQU8sS0FBSztBQUNaLGNBQU0sUUFBUSxhQUFhLGlCQUFpQixLQUFLO0FBQ2pELFlBQUksT0FBTyxVQUFVO0FBQ25CLGdCQUFNLGFBQWEsVUFBVSxLQUFLO0FBQ3BDLGdCQUFRO0FBQ1IsZUFBTyxvQkFBb0IsU0FBUyxTQUFTO0FBQzdDLGVBQU8sb0JBQW9CLFdBQVcsV0FBVyxLQUFLO0FBQUEsTUFDeEQ7QUFDQSxZQUFNLFNBQVMsU0FBUyxPQUFPO0FBQzdCLGNBQU0sYUFBYSxNQUFNLE1BQU0sSUFBSSxNQUFNLEtBQUssS0FBSztBQUFBLE1BQ3JEO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUdBLE1BQUksaUJBQWlCOzs7QUN0dkRyQixXQUFTLGdDQUFnQyxRQUFRO0FBQy9DLFdBQU8sTUFBTSxvQkFBb0I7QUFBQSxNQUMvQixRQUFRLG9CQUFJLElBQUk7QUFBQSxNQUNoQixNQUFNLE9BQU87QUFDWCxlQUFPLE1BQU0sUUFBUSxLQUFLLElBQUksTUFBTSxNQUFNLENBQUMsU0FBUyxLQUFLLE9BQU8sSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLE9BQU8sSUFBSSxLQUFLO0FBQUEsTUFDcEc7QUFBQSxNQUNBLFdBQVcsT0FBTztBQUNoQixjQUFNLFFBQVEsS0FBSyxJQUFJLE1BQU0sUUFBUSxDQUFDLFNBQVMsS0FBSyxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxPQUFPLElBQUksS0FBSztBQUFBLE1BQy9GO0FBQUEsSUFDRixDQUFDO0FBQ0QsYUFBUyxpQkFBaUIsV0FBVztBQUNuQyxhQUFPLElBQUksWUFBWSxXQUFXO0FBQUEsUUFDaEMsU0FBUztBQUFBLFFBQ1QsVUFBVTtBQUFBLFFBQ1YsWUFBWTtBQUFBLE1BQ2QsQ0FBQztBQUFBLElBQ0g7QUFDQSxtQkFBZSxRQUFRLE1BQU0sV0FBVztBQUN0QyxVQUFJLFNBQVMsY0FBYyxjQUFjLFFBQVEsS0FBSyxPQUFPLE1BQU0sa0JBQWtCLEVBQUUsTUFBTSxJQUFJLEdBQUc7QUFDbEc7QUFBQSxNQUNGO0FBQ0EsWUFBTSxPQUFPLFNBQVMsY0FBYyxNQUFNO0FBQzFDLFdBQUssT0FBTztBQUNaLFdBQUssTUFBTTtBQUNYLFdBQUssT0FBTztBQUNaLFVBQUksV0FBVztBQUNiLGFBQUssUUFBUTtBQUFBLE1BQ2Y7QUFDQSxlQUFTLEtBQUssT0FBTyxJQUFJO0FBQ3pCLFlBQU0sSUFBSSxRQUFRLENBQUMsU0FBUyxXQUFXO0FBQ3JDLGFBQUssU0FBUyxNQUFNO0FBQ2xCLGlCQUFPLE1BQU0sa0JBQWtCLEVBQUUsV0FBVyxJQUFJO0FBQ2hELGtCQUFRO0FBQUEsUUFDVjtBQUNBLGFBQUssVUFBVSxNQUFNO0FBQ25CLGlCQUFPLElBQUksTUFBTSx1QkFBdUIsTUFBTSxDQUFDO0FBQUEsUUFDakQ7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQ0EsbUJBQWUsT0FBTyxNQUFNLFVBQVU7QUFDcEMsVUFBSSxTQUFTLGNBQWMsZUFBZSxRQUFRLEtBQUssT0FBTyxNQUFNLGtCQUFrQixFQUFFLE1BQU0sSUFBSSxHQUFHO0FBQ25HO0FBQUEsTUFDRjtBQUNBLFlBQU0sU0FBUyxTQUFTLGNBQWMsUUFBUTtBQUM5QyxhQUFPLE1BQU07QUFDYixlQUFTLElBQUksWUFBWSxJQUFJLFNBQVMsS0FBSyxRQUFRLE1BQU0sSUFBSSxTQUFTLFNBQVMsSUFBSSxVQUFVLElBQUksU0FBUyxNQUFNLEVBQUUsT0FBTyxNQUFNO0FBQy9ILFlBQU0sSUFBSSxRQUFRLENBQUMsU0FBUyxXQUFXO0FBQ3JDLGVBQU8sU0FBUyxNQUFNO0FBQ3BCLGlCQUFPLE1BQU0sa0JBQWtCLEVBQUUsV0FBVyxJQUFJO0FBQ2hELGtCQUFRO0FBQUEsUUFDVjtBQUNBLGVBQU8sVUFBVSxNQUFNO0FBQ3JCLGlCQUFPLElBQUksTUFBTSxzQkFBc0IsTUFBTSxDQUFDO0FBQUEsUUFDaEQ7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQ0EsV0FBTyxVQUFVLFlBQVksQ0FBQyxJQUFJLEVBQUUsV0FBVyxHQUFHLEVBQUUsU0FBUyxNQUFNO0FBQ2pFLFlBQU0sUUFBUSxTQUFTLFVBQVU7QUFDakMsWUFBTSxZQUFZLEdBQUc7QUFDckIsWUFBTSxZQUFZLEdBQUcsYUFBYSxlQUFlO0FBQ2pELGNBQVEsSUFBSSxNQUFNLElBQUksQ0FBQyxTQUFTLFFBQVEsTUFBTSxTQUFTLENBQUMsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUNwRSxZQUFJLFdBQVc7QUFDYixpQkFBTyxjQUFjLGlCQUFpQixZQUFZLE1BQU0sQ0FBQztBQUFBLFFBQzNEO0FBQUEsTUFDRixDQUFDLEVBQUUsTUFBTSxDQUFDLFVBQVU7QUFDbEIsZ0JBQVEsTUFBTSxLQUFLO0FBQUEsTUFDckIsQ0FBQztBQUFBLElBQ0gsQ0FBQztBQUNELFdBQU8sVUFBVSxXQUFXLENBQUMsSUFBSSxFQUFFLFlBQVksVUFBVSxHQUFHLEVBQUUsU0FBUyxNQUFNO0FBQzNFLFlBQU0sUUFBUSxTQUFTLFVBQVU7QUFDakMsWUFBTSxXQUFXLElBQUksSUFBSSxTQUFTO0FBQ2xDLFlBQU0sWUFBWSxHQUFHLGFBQWEsZUFBZTtBQUNqRCxjQUFRLElBQUksTUFBTSxJQUFJLENBQUMsU0FBUyxPQUFPLE1BQU0sUUFBUSxDQUFDLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDbEUsWUFBSSxXQUFXO0FBQ2IsaUJBQU8sY0FBYyxpQkFBaUIsWUFBWSxLQUFLLENBQUM7QUFBQSxRQUMxRDtBQUFBLE1BQ0YsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxVQUFVO0FBQ2xCLGdCQUFRLE1BQU0sS0FBSztBQUFBLE1BQ3JCLENBQUM7QUFBQSxJQUNILENBQUM7QUFBQSxFQUNIO0FBR0EsTUFBSUMsa0JBQWlCOzs7QUM5RXJCLFdBQVMsUUFBUSxRQUFRLGdCQUFnQjtBQUN2QyxRQUFJLE9BQU8sT0FBTyxLQUFLLE1BQU07QUFDN0IsUUFBSSxPQUFPLHVCQUF1QjtBQUNoQyxVQUFJLFVBQVUsT0FBTyxzQkFBc0IsTUFBTTtBQUNqRCxVQUFJLGdCQUFnQjtBQUNsQixrQkFBVSxRQUFRLE9BQU8sU0FBVSxLQUFLO0FBQ3RDLGlCQUFPLE9BQU8seUJBQXlCLFFBQVEsR0FBRyxFQUFFO0FBQUEsUUFDdEQsQ0FBQztBQUFBLE1BQ0g7QUFDQSxXQUFLLEtBQUssTUFBTSxNQUFNLE9BQU87QUFBQSxJQUMvQjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQ0EsV0FBUyxlQUFlLFFBQVE7QUFDOUIsYUFBUyxJQUFJLEdBQUcsSUFBSSxVQUFVLFFBQVEsS0FBSztBQUN6QyxVQUFJLFNBQVMsVUFBVSxDQUFDLEtBQUssT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDO0FBQ3BELFVBQUksSUFBSSxHQUFHO0FBQ1QsZ0JBQVEsT0FBTyxNQUFNLEdBQUcsSUFBSSxFQUFFLFFBQVEsU0FBVSxLQUFLO0FBQ25ELDBCQUFnQixRQUFRLEtBQUssT0FBTyxHQUFHLENBQUM7QUFBQSxRQUMxQyxDQUFDO0FBQUEsTUFDSCxXQUFXLE9BQU8sMkJBQTJCO0FBQzNDLGVBQU8saUJBQWlCLFFBQVEsT0FBTywwQkFBMEIsTUFBTSxDQUFDO0FBQUEsTUFDMUUsT0FBTztBQUNMLGdCQUFRLE9BQU8sTUFBTSxDQUFDLEVBQUUsUUFBUSxTQUFVLEtBQUs7QUFDN0MsaUJBQU8sZUFBZSxRQUFRLEtBQUssT0FBTyx5QkFBeUIsUUFBUSxHQUFHLENBQUM7QUFBQSxRQUNqRixDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUNBLFdBQVMsUUFBUSxLQUFLO0FBQ3BCO0FBRUEsUUFBSSxPQUFPLFdBQVcsY0FBYyxPQUFPLE9BQU8sYUFBYSxVQUFVO0FBQ3ZFLGdCQUFVLFNBQVVDLE1BQUs7QUFDdkIsZUFBTyxPQUFPQTtBQUFBLE1BQ2hCO0FBQUEsSUFDRixPQUFPO0FBQ0wsZ0JBQVUsU0FBVUEsTUFBSztBQUN2QixlQUFPQSxRQUFPLE9BQU8sV0FBVyxjQUFjQSxLQUFJLGdCQUFnQixVQUFVQSxTQUFRLE9BQU8sWUFBWSxXQUFXLE9BQU9BO0FBQUEsTUFDM0g7QUFBQSxJQUNGO0FBQ0EsV0FBTyxRQUFRLEdBQUc7QUFBQSxFQUNwQjtBQUNBLFdBQVMsZ0JBQWdCLEtBQUssS0FBSyxPQUFPO0FBQ3hDLFFBQUksT0FBTyxLQUFLO0FBQ2QsYUFBTyxlQUFlLEtBQUssS0FBSztBQUFBLFFBQzlCO0FBQUEsUUFDQSxZQUFZO0FBQUEsUUFDWixjQUFjO0FBQUEsUUFDZCxVQUFVO0FBQUEsTUFDWixDQUFDO0FBQUEsSUFDSCxPQUFPO0FBQ0wsVUFBSSxHQUFHLElBQUk7QUFBQSxJQUNiO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFDQSxXQUFTLFdBQVc7QUFDbEIsZUFBVyxPQUFPLFVBQVUsU0FBVSxRQUFRO0FBQzVDLGVBQVMsSUFBSSxHQUFHLElBQUksVUFBVSxRQUFRLEtBQUs7QUFDekMsWUFBSSxTQUFTLFVBQVUsQ0FBQztBQUN4QixpQkFBUyxPQUFPLFFBQVE7QUFDdEIsY0FBSSxPQUFPLFVBQVUsZUFBZSxLQUFLLFFBQVEsR0FBRyxHQUFHO0FBQ3JELG1CQUFPLEdBQUcsSUFBSSxPQUFPLEdBQUc7QUFBQSxVQUMxQjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPLFNBQVMsTUFBTSxNQUFNLFNBQVM7QUFBQSxFQUN2QztBQUNBLFdBQVMsOEJBQThCLFFBQVEsVUFBVTtBQUN2RCxRQUFJLFVBQVU7QUFBTSxhQUFPLENBQUM7QUFDNUIsUUFBSSxTQUFTLENBQUM7QUFDZCxRQUFJLGFBQWEsT0FBTyxLQUFLLE1BQU07QUFDbkMsUUFBSSxLQUFLO0FBQ1QsU0FBSyxJQUFJLEdBQUcsSUFBSSxXQUFXLFFBQVEsS0FBSztBQUN0QyxZQUFNLFdBQVcsQ0FBQztBQUNsQixVQUFJLFNBQVMsUUFBUSxHQUFHLEtBQUs7QUFBRztBQUNoQyxhQUFPLEdBQUcsSUFBSSxPQUFPLEdBQUc7QUFBQSxJQUMxQjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQ0EsV0FBUyx5QkFBeUIsUUFBUSxVQUFVO0FBQ2xELFFBQUksVUFBVTtBQUFNLGFBQU8sQ0FBQztBQUM1QixRQUFJLFNBQVMsOEJBQThCLFFBQVEsUUFBUTtBQUMzRCxRQUFJLEtBQUs7QUFDVCxRQUFJLE9BQU8sdUJBQXVCO0FBQ2hDLFVBQUksbUJBQW1CLE9BQU8sc0JBQXNCLE1BQU07QUFDMUQsV0FBSyxJQUFJLEdBQUcsSUFBSSxpQkFBaUIsUUFBUSxLQUFLO0FBQzVDLGNBQU0saUJBQWlCLENBQUM7QUFDeEIsWUFBSSxTQUFTLFFBQVEsR0FBRyxLQUFLO0FBQUc7QUFDaEMsWUFBSSxDQUFDLE9BQU8sVUFBVSxxQkFBcUIsS0FBSyxRQUFRLEdBQUc7QUFBRztBQUM5RCxlQUFPLEdBQUcsSUFBSSxPQUFPLEdBQUc7QUFBQSxNQUMxQjtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQTJCQSxNQUFJLFVBQVU7QUFFZCxXQUFTLFVBQVUsU0FBUztBQUMxQixRQUFJLE9BQU8sV0FBVyxlQUFlLE9BQU8sV0FBVztBQUNyRCxhQUFPLENBQUMsQ0FBZSwwQkFBVSxVQUFVLE1BQU0sT0FBTztBQUFBLElBQzFEO0FBQUEsRUFDRjtBQUNBLE1BQUksYUFBYSxVQUFVLHVEQUF1RDtBQUNsRixNQUFJLE9BQU8sVUFBVSxPQUFPO0FBQzVCLE1BQUksVUFBVSxVQUFVLFVBQVU7QUFDbEMsTUFBSSxTQUFTLFVBQVUsU0FBUyxLQUFLLENBQUMsVUFBVSxTQUFTLEtBQUssQ0FBQyxVQUFVLFVBQVU7QUFDbkYsTUFBSSxNQUFNLFVBQVUsaUJBQWlCO0FBQ3JDLE1BQUksbUJBQW1CLFVBQVUsU0FBUyxLQUFLLFVBQVUsVUFBVTtBQUVuRSxNQUFJLGNBQWM7QUFBQSxJQUNoQixTQUFTO0FBQUEsSUFDVCxTQUFTO0FBQUEsRUFDWDtBQUNBLFdBQVMsR0FBRyxJQUFJLE9BQU8sSUFBSTtBQUN6QixPQUFHLGlCQUFpQixPQUFPLElBQUksQ0FBQyxjQUFjLFdBQVc7QUFBQSxFQUMzRDtBQUNBLFdBQVMsSUFBSSxJQUFJLE9BQU8sSUFBSTtBQUMxQixPQUFHLG9CQUFvQixPQUFPLElBQUksQ0FBQyxjQUFjLFdBQVc7QUFBQSxFQUM5RDtBQUNBLFdBQVMsUUFBeUIsSUFBZSxVQUFVO0FBQ3pELFFBQUksQ0FBQztBQUFVO0FBQ2YsYUFBUyxDQUFDLE1BQU0sUUFBUSxXQUFXLFNBQVMsVUFBVSxDQUFDO0FBQ3ZELFFBQUksSUFBSTtBQUNOLFVBQUk7QUFDRixZQUFJLEdBQUcsU0FBUztBQUNkLGlCQUFPLEdBQUcsUUFBUSxRQUFRO0FBQUEsUUFDNUIsV0FBVyxHQUFHLG1CQUFtQjtBQUMvQixpQkFBTyxHQUFHLGtCQUFrQixRQUFRO0FBQUEsUUFDdEMsV0FBVyxHQUFHLHVCQUF1QjtBQUNuQyxpQkFBTyxHQUFHLHNCQUFzQixRQUFRO0FBQUEsUUFDMUM7QUFBQSxNQUNGLFNBQVMsR0FBUDtBQUNBLGVBQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQ0EsV0FBUyxnQkFBZ0IsSUFBSTtBQUMzQixXQUFPLEdBQUcsUUFBUSxPQUFPLFlBQVksR0FBRyxLQUFLLFdBQVcsR0FBRyxPQUFPLEdBQUc7QUFBQSxFQUN2RTtBQUNBLFdBQVMsUUFBeUIsSUFBZSxVQUEwQixLQUFLLFlBQVk7QUFDMUYsUUFBSSxJQUFJO0FBQ04sWUFBTSxPQUFPO0FBQ2IsU0FBRztBQUNELFlBQUksWUFBWSxTQUFTLFNBQVMsQ0FBQyxNQUFNLE1BQU0sR0FBRyxlQUFlLE9BQU8sUUFBUSxJQUFJLFFBQVEsSUFBSSxRQUFRLElBQUksUUFBUSxNQUFNLGNBQWMsT0FBTyxLQUFLO0FBQ2xKLGlCQUFPO0FBQUEsUUFDVDtBQUNBLFlBQUksT0FBTztBQUFLO0FBQUEsTUFFbEIsU0FBUyxLQUFLLGdCQUFnQixFQUFFO0FBQUEsSUFDbEM7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUNBLE1BQUksVUFBVTtBQUNkLFdBQVMsWUFBWSxJQUFJLE1BQU0sT0FBTztBQUNwQyxRQUFJLE1BQU0sTUFBTTtBQUNkLFVBQUksR0FBRyxXQUFXO0FBQ2hCLFdBQUcsVUFBVSxRQUFRLFFBQVEsUUFBUSxFQUFFLElBQUk7QUFBQSxNQUM3QyxPQUFPO0FBQ0wsWUFBSSxhQUFhLE1BQU0sR0FBRyxZQUFZLEtBQUssUUFBUSxTQUFTLEdBQUcsRUFBRSxRQUFRLE1BQU0sT0FBTyxLQUFLLEdBQUc7QUFDOUYsV0FBRyxhQUFhLGFBQWEsUUFBUSxNQUFNLE9BQU8sS0FBSyxRQUFRLFNBQVMsR0FBRztBQUFBLE1BQzdFO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDQSxXQUFTLElBQUksSUFBSSxNQUFNLEtBQUs7QUFDMUIsUUFBSSxRQUFRLE1BQU0sR0FBRztBQUNyQixRQUFJLE9BQU87QUFDVCxVQUFJLFFBQVEsUUFBUTtBQUNsQixZQUFJLFNBQVMsZUFBZSxTQUFTLFlBQVksa0JBQWtCO0FBQ2pFLGdCQUFNLFNBQVMsWUFBWSxpQkFBaUIsSUFBSSxFQUFFO0FBQUEsUUFDcEQsV0FBVyxHQUFHLGNBQWM7QUFDMUIsZ0JBQU0sR0FBRztBQUFBLFFBQ1g7QUFDQSxlQUFPLFNBQVMsU0FBUyxNQUFNLElBQUksSUFBSTtBQUFBLE1BQ3pDLE9BQU87QUFDTCxZQUFJLEVBQUUsUUFBUSxVQUFVLEtBQUssUUFBUSxRQUFRLE1BQU0sSUFBSTtBQUNyRCxpQkFBTyxhQUFhO0FBQUEsUUFDdEI7QUFDQSxjQUFNLElBQUksSUFBSSxPQUFPLE9BQU8sUUFBUSxXQUFXLEtBQUs7QUFBQSxNQUN0RDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0EsV0FBUyxPQUFPLElBQUksVUFBVTtBQUM1QixRQUFJLG9CQUFvQjtBQUN4QixRQUFJLE9BQU8sT0FBTyxVQUFVO0FBQzFCLDBCQUFvQjtBQUFBLElBQ3RCLE9BQU87QUFDTCxTQUFHO0FBQ0QsWUFBSSxZQUFZLElBQUksSUFBSSxXQUFXO0FBQ25DLFlBQUksYUFBYSxjQUFjLFFBQVE7QUFDckMsOEJBQW9CLFlBQVksTUFBTTtBQUFBLFFBQ3hDO0FBQUEsTUFFRixTQUFTLENBQUMsYUFBYSxLQUFLLEdBQUc7QUFBQSxJQUNqQztBQUNBLFFBQUksV0FBVyxPQUFPLGFBQWEsT0FBTyxtQkFBbUIsT0FBTyxhQUFhLE9BQU87QUFFeEYsV0FBTyxZQUFZLElBQUksU0FBUyxpQkFBaUI7QUFBQSxFQUNuRDtBQUNBLFdBQVMsS0FBSyxLQUFLLFNBQVMsVUFBVTtBQUNwQyxRQUFJLEtBQUs7QUFDUCxVQUFJLE9BQU8sSUFBSSxxQkFBcUIsT0FBTyxHQUN6QyxJQUFJLEdBQ0osSUFBSSxLQUFLO0FBQ1gsVUFBSSxVQUFVO0FBQ1osZUFBTyxJQUFJLEdBQUcsS0FBSztBQUNqQixtQkFBUyxLQUFLLENBQUMsR0FBRyxDQUFDO0FBQUEsUUFDckI7QUFBQSxNQUNGO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPLENBQUM7QUFBQSxFQUNWO0FBQ0EsV0FBUyw0QkFBNEI7QUFDbkMsUUFBSSxtQkFBbUIsU0FBUztBQUNoQyxRQUFJLGtCQUFrQjtBQUNwQixhQUFPO0FBQUEsSUFDVCxPQUFPO0FBQ0wsYUFBTyxTQUFTO0FBQUEsSUFDbEI7QUFBQSxFQUNGO0FBV0EsV0FBUyxRQUFRLElBQUksMkJBQTJCLDJCQUEyQixXQUFXLFdBQVc7QUFDL0YsUUFBSSxDQUFDLEdBQUcseUJBQXlCLE9BQU87QUFBUTtBQUNoRCxRQUFJLFFBQVEsS0FBSyxNQUFNLFFBQVEsT0FBTyxRQUFRO0FBQzlDLFFBQUksT0FBTyxVQUFVLEdBQUcsY0FBYyxPQUFPLDBCQUEwQixHQUFHO0FBQ3hFLGVBQVMsR0FBRyxzQkFBc0I7QUFDbEMsWUFBTSxPQUFPO0FBQ2IsYUFBTyxPQUFPO0FBQ2QsZUFBUyxPQUFPO0FBQ2hCLGNBQVEsT0FBTztBQUNmLGVBQVMsT0FBTztBQUNoQixjQUFRLE9BQU87QUFBQSxJQUNqQixPQUFPO0FBQ0wsWUFBTTtBQUNOLGFBQU87QUFDUCxlQUFTLE9BQU87QUFDaEIsY0FBUSxPQUFPO0FBQ2YsZUFBUyxPQUFPO0FBQ2hCLGNBQVEsT0FBTztBQUFBLElBQ2pCO0FBQ0EsU0FBSyw2QkFBNkIsOEJBQThCLE9BQU8sUUFBUTtBQUU3RSxrQkFBWSxhQUFhLEdBQUc7QUFJNUIsVUFBSSxDQUFDLFlBQVk7QUFDZixXQUFHO0FBQ0QsY0FBSSxhQUFhLFVBQVUsMEJBQTBCLElBQUksV0FBVyxXQUFXLE1BQU0sVUFBVSw2QkFBNkIsSUFBSSxXQUFXLFVBQVUsTUFBTSxXQUFXO0FBQ3BLLGdCQUFJLGdCQUFnQixVQUFVLHNCQUFzQjtBQUdwRCxtQkFBTyxjQUFjLE1BQU0sU0FBUyxJQUFJLFdBQVcsa0JBQWtCLENBQUM7QUFDdEUsb0JBQVEsY0FBYyxPQUFPLFNBQVMsSUFBSSxXQUFXLG1CQUFtQixDQUFDO0FBQ3pFLHFCQUFTLE1BQU0sT0FBTztBQUN0QixvQkFBUSxPQUFPLE9BQU87QUFDdEI7QUFBQSxVQUNGO0FBQUEsUUFFRixTQUFTLFlBQVksVUFBVTtBQUFBLE1BQ2pDO0FBQUEsSUFDRjtBQUNBLFFBQUksYUFBYSxPQUFPLFFBQVE7QUFFOUIsVUFBSSxXQUFXLE9BQU8sYUFBYSxFQUFFLEdBQ25DLFNBQVMsWUFBWSxTQUFTLEdBQzlCLFNBQVMsWUFBWSxTQUFTO0FBQ2hDLFVBQUksVUFBVTtBQUNaLGVBQU87QUFDUCxnQkFBUTtBQUNSLGlCQUFTO0FBQ1Qsa0JBQVU7QUFDVixpQkFBUyxNQUFNO0FBQ2YsZ0JBQVEsT0FBTztBQUFBLE1BQ2pCO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxNQUNMO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQU1BLFdBQVMsZUFBZSxJQUFJO0FBQzFCLFFBQUksT0FBTyxRQUFRLEVBQUU7QUFDckIsUUFBSSxjQUFjLFNBQVMsSUFBSSxJQUFJLGNBQWMsQ0FBQyxHQUNoRCxhQUFhLFNBQVMsSUFBSSxJQUFJLGFBQWEsQ0FBQyxHQUM1QyxlQUFlLFNBQVMsSUFBSSxJQUFJLGVBQWUsQ0FBQyxHQUNoRCxnQkFBZ0IsU0FBUyxJQUFJLElBQUksZ0JBQWdCLENBQUM7QUFDcEQsU0FBSyxPQUFPLGFBQWEsU0FBUyxJQUFJLElBQUksa0JBQWtCLENBQUM7QUFDN0QsU0FBSyxRQUFRLGNBQWMsU0FBUyxJQUFJLElBQUksbUJBQW1CLENBQUM7QUFFaEUsU0FBSyxRQUFRLEdBQUcsY0FBYyxjQUFjO0FBQzVDLFNBQUssU0FBUyxHQUFHLGVBQWUsYUFBYTtBQUM3QyxTQUFLLFNBQVMsS0FBSyxNQUFNLEtBQUs7QUFDOUIsU0FBSyxRQUFRLEtBQUssT0FBTyxLQUFLO0FBQzlCLFdBQU87QUFBQSxFQUNUO0FBU0EsV0FBUyxlQUFlLElBQUksUUFBUSxZQUFZO0FBQzlDLFFBQUksU0FBUywyQkFBMkIsSUFBSSxJQUFJLEdBQzlDLFlBQVksUUFBUSxFQUFFLEVBQUUsTUFBTTtBQUdoQyxXQUFPLFFBQVE7QUFDYixVQUFJLGdCQUFnQixRQUFRLE1BQU0sRUFBRSxVQUFVLEdBQzVDLFVBQVU7QUFDWixVQUFJLGVBQWUsU0FBUyxlQUFlLFFBQVE7QUFDakQsa0JBQVUsYUFBYTtBQUFBLE1BQ3pCLE9BQU87QUFDTCxrQkFBVSxhQUFhO0FBQUEsTUFDekI7QUFDQSxVQUFJLENBQUM7QUFBUyxlQUFPO0FBQ3JCLFVBQUksV0FBVywwQkFBMEI7QUFBRztBQUM1QyxlQUFTLDJCQUEyQixRQUFRLEtBQUs7QUFBQSxJQUNuRDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBVUEsV0FBUyxTQUFTLElBQUksVUFBVSxTQUFTLGVBQWU7QUFDdEQsUUFBSSxlQUFlLEdBQ2pCLElBQUksR0FDSixXQUFXLEdBQUc7QUFDaEIsV0FBTyxJQUFJLFNBQVMsUUFBUTtBQUMxQixVQUFJLFNBQVMsQ0FBQyxFQUFFLE1BQU0sWUFBWSxVQUFVLFNBQVMsQ0FBQyxNQUFNLFNBQVMsVUFBVSxpQkFBaUIsU0FBUyxDQUFDLE1BQU0sU0FBUyxZQUFZLFFBQVEsU0FBUyxDQUFDLEdBQUcsUUFBUSxXQUFXLElBQUksS0FBSyxHQUFHO0FBQ3ZMLFlBQUksaUJBQWlCLFVBQVU7QUFDN0IsaUJBQU8sU0FBUyxDQUFDO0FBQUEsUUFDbkI7QUFDQTtBQUFBLE1BQ0Y7QUFDQTtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQVFBLFdBQVMsVUFBVSxJQUFJLFVBQVU7QUFDL0IsUUFBSSxPQUFPLEdBQUc7QUFDZCxXQUFPLFNBQVMsU0FBUyxTQUFTLFNBQVMsSUFBSSxNQUFNLFNBQVMsTUFBTSxVQUFVLFlBQVksQ0FBQyxRQUFRLE1BQU0sUUFBUSxJQUFJO0FBQ25ILGFBQU8sS0FBSztBQUFBLElBQ2Q7QUFDQSxXQUFPLFFBQVE7QUFBQSxFQUNqQjtBQVNBLFdBQVMsTUFBTSxJQUFJLFVBQVU7QUFDM0IsUUFBSUMsU0FBUTtBQUNaLFFBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxZQUFZO0FBQ3pCLGFBQU87QUFBQSxJQUNUO0FBR0EsV0FBTyxLQUFLLEdBQUcsd0JBQXdCO0FBQ3JDLFVBQUksR0FBRyxTQUFTLFlBQVksTUFBTSxjQUFjLE9BQU8sU0FBUyxVQUFVLENBQUMsWUFBWSxRQUFRLElBQUksUUFBUSxJQUFJO0FBQzdHLFFBQUFBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFDQSxXQUFPQTtBQUFBLEVBQ1Q7QUFRQSxXQUFTLHdCQUF3QixJQUFJO0FBQ25DLFFBQUksYUFBYSxHQUNmLFlBQVksR0FDWixjQUFjLDBCQUEwQjtBQUMxQyxRQUFJLElBQUk7QUFDTixTQUFHO0FBQ0QsWUFBSSxXQUFXLE9BQU8sRUFBRSxHQUN0QixTQUFTLFNBQVMsR0FDbEIsU0FBUyxTQUFTO0FBQ3BCLHNCQUFjLEdBQUcsYUFBYTtBQUM5QixxQkFBYSxHQUFHLFlBQVk7QUFBQSxNQUM5QixTQUFTLE9BQU8sZ0JBQWdCLEtBQUssR0FBRztBQUFBLElBQzFDO0FBQ0EsV0FBTyxDQUFDLFlBQVksU0FBUztBQUFBLEVBQy9CO0FBUUEsV0FBUyxjQUFjLEtBQUssS0FBSztBQUMvQixhQUFTLEtBQUssS0FBSztBQUNqQixVQUFJLENBQUMsSUFBSSxlQUFlLENBQUM7QUFBRztBQUM1QixlQUFTLE9BQU8sS0FBSztBQUNuQixZQUFJLElBQUksZUFBZSxHQUFHLEtBQUssSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEVBQUUsR0FBRztBQUFHLGlCQUFPLE9BQU8sQ0FBQztBQUFBLE1BQzFFO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQ0EsV0FBUywyQkFBMkIsSUFBSSxhQUFhO0FBRW5ELFFBQUksQ0FBQyxNQUFNLENBQUMsR0FBRztBQUF1QixhQUFPLDBCQUEwQjtBQUN2RSxRQUFJLE9BQU87QUFDWCxRQUFJLFVBQVU7QUFDZCxPQUFHO0FBRUQsVUFBSSxLQUFLLGNBQWMsS0FBSyxlQUFlLEtBQUssZUFBZSxLQUFLLGNBQWM7QUFDaEYsWUFBSSxVQUFVLElBQUksSUFBSTtBQUN0QixZQUFJLEtBQUssY0FBYyxLQUFLLGdCQUFnQixRQUFRLGFBQWEsVUFBVSxRQUFRLGFBQWEsYUFBYSxLQUFLLGVBQWUsS0FBSyxpQkFBaUIsUUFBUSxhQUFhLFVBQVUsUUFBUSxhQUFhLFdBQVc7QUFDcE4sY0FBSSxDQUFDLEtBQUsseUJBQXlCLFNBQVMsU0FBUztBQUFNLG1CQUFPLDBCQUEwQjtBQUM1RixjQUFJLFdBQVc7QUFBYSxtQkFBTztBQUNuQyxvQkFBVTtBQUFBLFFBQ1o7QUFBQSxNQUNGO0FBQUEsSUFFRixTQUFTLE9BQU8sS0FBSztBQUNyQixXQUFPLDBCQUEwQjtBQUFBLEVBQ25DO0FBQ0EsV0FBUyxPQUFPLEtBQUssS0FBSztBQUN4QixRQUFJLE9BQU8sS0FBSztBQUNkLGVBQVMsT0FBTyxLQUFLO0FBQ25CLFlBQUksSUFBSSxlQUFlLEdBQUcsR0FBRztBQUMzQixjQUFJLEdBQUcsSUFBSSxJQUFJLEdBQUc7QUFBQSxRQUNwQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFDQSxXQUFTLFlBQVksT0FBTyxPQUFPO0FBQ2pDLFdBQU8sS0FBSyxNQUFNLE1BQU0sR0FBRyxNQUFNLEtBQUssTUFBTSxNQUFNLEdBQUcsS0FBSyxLQUFLLE1BQU0sTUFBTSxJQUFJLE1BQU0sS0FBSyxNQUFNLE1BQU0sSUFBSSxLQUFLLEtBQUssTUFBTSxNQUFNLE1BQU0sTUFBTSxLQUFLLE1BQU0sTUFBTSxNQUFNLEtBQUssS0FBSyxNQUFNLE1BQU0sS0FBSyxNQUFNLEtBQUssTUFBTSxNQUFNLEtBQUs7QUFBQSxFQUM1TjtBQUNBLE1BQUk7QUFDSixXQUFTLFNBQVMsVUFBVSxJQUFJO0FBQzlCLFdBQU8sV0FBWTtBQUNqQixVQUFJLENBQUMsa0JBQWtCO0FBQ3JCLFlBQUksT0FBTyxXQUNULFFBQVE7QUFDVixZQUFJLEtBQUssV0FBVyxHQUFHO0FBQ3JCLG1CQUFTLEtBQUssT0FBTyxLQUFLLENBQUMsQ0FBQztBQUFBLFFBQzlCLE9BQU87QUFDTCxtQkFBUyxNQUFNLE9BQU8sSUFBSTtBQUFBLFFBQzVCO0FBQ0EsMkJBQW1CLFdBQVcsV0FBWTtBQUN4Qyw2QkFBbUI7QUFBQSxRQUNyQixHQUFHLEVBQUU7QUFBQSxNQUNQO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDQSxXQUFTLGlCQUFpQjtBQUN4QixpQkFBYSxnQkFBZ0I7QUFDN0IsdUJBQW1CO0FBQUEsRUFDckI7QUFDQSxXQUFTLFNBQVMsSUFBSSxHQUFHLEdBQUc7QUFDMUIsT0FBRyxjQUFjO0FBQ2pCLE9BQUcsYUFBYTtBQUFBLEVBQ2xCO0FBQ0EsV0FBUyxNQUFNLElBQUk7QUFDakIsUUFBSSxVQUFVLE9BQU87QUFDckIsUUFBSSxJQUFJLE9BQU8sVUFBVSxPQUFPO0FBQ2hDLFFBQUksV0FBVyxRQUFRLEtBQUs7QUFDMUIsYUFBTyxRQUFRLElBQUksRUFBRSxFQUFFLFVBQVUsSUFBSTtBQUFBLElBQ3ZDLFdBQVcsR0FBRztBQUNaLGFBQU8sRUFBRSxFQUFFLEVBQUUsTUFBTSxJQUFJLEVBQUUsQ0FBQztBQUFBLElBQzVCLE9BQU87QUFDTCxhQUFPLEdBQUcsVUFBVSxJQUFJO0FBQUEsSUFDMUI7QUFBQSxFQUNGO0FBZUEsTUFBSSxVQUFVLGNBQWEsb0JBQUksS0FBSyxHQUFFLFFBQVE7QUFFOUMsV0FBUyx3QkFBd0I7QUFDL0IsUUFBSSxrQkFBa0IsQ0FBQyxHQUNyQjtBQUNGLFdBQU87QUFBQSxNQUNMLHVCQUF1QixTQUFTLHdCQUF3QjtBQUN0RCwwQkFBa0IsQ0FBQztBQUNuQixZQUFJLENBQUMsS0FBSyxRQUFRO0FBQVc7QUFDN0IsWUFBSSxXQUFXLENBQUMsRUFBRSxNQUFNLEtBQUssS0FBSyxHQUFHLFFBQVE7QUFDN0MsaUJBQVMsUUFBUSxTQUFVLE9BQU87QUFDaEMsY0FBSSxJQUFJLE9BQU8sU0FBUyxNQUFNLFVBQVUsVUFBVSxTQUFTO0FBQU87QUFDbEUsMEJBQWdCLEtBQUs7QUFBQSxZQUNuQixRQUFRO0FBQUEsWUFDUixNQUFNLFFBQVEsS0FBSztBQUFBLFVBQ3JCLENBQUM7QUFDRCxjQUFJLFdBQVcsZUFBZSxDQUFDLEdBQUcsZ0JBQWdCLGdCQUFnQixTQUFTLENBQUMsRUFBRSxJQUFJO0FBR2xGLGNBQUksTUFBTSx1QkFBdUI7QUFDL0IsZ0JBQUksY0FBYyxPQUFPLE9BQU8sSUFBSTtBQUNwQyxnQkFBSSxhQUFhO0FBQ2YsdUJBQVMsT0FBTyxZQUFZO0FBQzVCLHVCQUFTLFFBQVEsWUFBWTtBQUFBLFlBQy9CO0FBQUEsVUFDRjtBQUNBLGdCQUFNLFdBQVc7QUFBQSxRQUNuQixDQUFDO0FBQUEsTUFDSDtBQUFBLE1BQ0EsbUJBQW1CLFNBQVMsa0JBQWtCLE9BQU87QUFDbkQsd0JBQWdCLEtBQUssS0FBSztBQUFBLE1BQzVCO0FBQUEsTUFDQSxzQkFBc0IsU0FBUyxxQkFBcUIsUUFBUTtBQUMxRCx3QkFBZ0IsT0FBTyxjQUFjLGlCQUFpQjtBQUFBLFVBQ3BEO0FBQUEsUUFDRixDQUFDLEdBQUcsQ0FBQztBQUFBLE1BQ1A7QUFBQSxNQUNBLFlBQVksU0FBUyxXQUFXLFVBQVU7QUFDeEMsWUFBSSxRQUFRO0FBQ1osWUFBSSxDQUFDLEtBQUssUUFBUSxXQUFXO0FBQzNCLHVCQUFhLG1CQUFtQjtBQUNoQyxjQUFJLE9BQU8sYUFBYTtBQUFZLHFCQUFTO0FBQzdDO0FBQUEsUUFDRjtBQUNBLFlBQUksWUFBWSxPQUNkLGdCQUFnQjtBQUNsQix3QkFBZ0IsUUFBUSxTQUFVLE9BQU87QUFDdkMsY0FBSSxPQUFPLEdBQ1QsU0FBUyxNQUFNLFFBQ2YsV0FBVyxPQUFPLFVBQ2xCLFNBQVMsUUFBUSxNQUFNLEdBQ3ZCLGVBQWUsT0FBTyxjQUN0QixhQUFhLE9BQU8sWUFDcEIsZ0JBQWdCLE1BQU0sTUFDdEIsZUFBZSxPQUFPLFFBQVEsSUFBSTtBQUNwQyxjQUFJLGNBQWM7QUFFaEIsbUJBQU8sT0FBTyxhQUFhO0FBQzNCLG1CQUFPLFFBQVEsYUFBYTtBQUFBLFVBQzlCO0FBQ0EsaUJBQU8sU0FBUztBQUNoQixjQUFJLE9BQU8sdUJBQXVCO0FBRWhDLGdCQUFJLFlBQVksY0FBYyxNQUFNLEtBQUssQ0FBQyxZQUFZLFVBQVUsTUFBTTtBQUFBLGFBRXJFLGNBQWMsTUFBTSxPQUFPLFFBQVEsY0FBYyxPQUFPLE9BQU8sV0FBVyxTQUFTLE1BQU0sT0FBTyxRQUFRLFNBQVMsT0FBTyxPQUFPLE9BQU87QUFFckkscUJBQU8sa0JBQWtCLGVBQWUsY0FBYyxZQUFZLE1BQU0sT0FBTztBQUFBLFlBQ2pGO0FBQUEsVUFDRjtBQUdBLGNBQUksQ0FBQyxZQUFZLFFBQVEsUUFBUSxHQUFHO0FBQ2xDLG1CQUFPLGVBQWU7QUFDdEIsbUJBQU8sYUFBYTtBQUNwQixnQkFBSSxDQUFDLE1BQU07QUFDVCxxQkFBTyxNQUFNLFFBQVE7QUFBQSxZQUN2QjtBQUNBLGtCQUFNLFFBQVEsUUFBUSxlQUFlLFFBQVEsSUFBSTtBQUFBLFVBQ25EO0FBQ0EsY0FBSSxNQUFNO0FBQ1Isd0JBQVk7QUFDWiw0QkFBZ0IsS0FBSyxJQUFJLGVBQWUsSUFBSTtBQUM1Qyx5QkFBYSxPQUFPLG1CQUFtQjtBQUN2QyxtQkFBTyxzQkFBc0IsV0FBVyxXQUFZO0FBQ2xELHFCQUFPLGdCQUFnQjtBQUN2QixxQkFBTyxlQUFlO0FBQ3RCLHFCQUFPLFdBQVc7QUFDbEIscUJBQU8sYUFBYTtBQUNwQixxQkFBTyx3QkFBd0I7QUFBQSxZQUNqQyxHQUFHLElBQUk7QUFDUCxtQkFBTyx3QkFBd0I7QUFBQSxVQUNqQztBQUFBLFFBQ0YsQ0FBQztBQUNELHFCQUFhLG1CQUFtQjtBQUNoQyxZQUFJLENBQUMsV0FBVztBQUNkLGNBQUksT0FBTyxhQUFhO0FBQVkscUJBQVM7QUFBQSxRQUMvQyxPQUFPO0FBQ0wsZ0NBQXNCLFdBQVcsV0FBWTtBQUMzQyxnQkFBSSxPQUFPLGFBQWE7QUFBWSx1QkFBUztBQUFBLFVBQy9DLEdBQUcsYUFBYTtBQUFBLFFBQ2xCO0FBQ0EsMEJBQWtCLENBQUM7QUFBQSxNQUNyQjtBQUFBLE1BQ0EsU0FBUyxTQUFTLFFBQVEsUUFBUSxhQUFhLFFBQVEsVUFBVTtBQUMvRCxZQUFJLFVBQVU7QUFDWixjQUFJLFFBQVEsY0FBYyxFQUFFO0FBQzVCLGNBQUksUUFBUSxhQUFhLEVBQUU7QUFDM0IsY0FBSSxXQUFXLE9BQU8sS0FBSyxFQUFFLEdBQzNCLFNBQVMsWUFBWSxTQUFTLEdBQzlCLFNBQVMsWUFBWSxTQUFTLEdBQzlCLGNBQWMsWUFBWSxPQUFPLE9BQU8sU0FBUyxVQUFVLElBQzNELGNBQWMsWUFBWSxNQUFNLE9BQU8sUUFBUSxVQUFVO0FBQzNELGlCQUFPLGFBQWEsQ0FBQyxDQUFDO0FBQ3RCLGlCQUFPLGFBQWEsQ0FBQyxDQUFDO0FBQ3RCLGNBQUksUUFBUSxhQUFhLGlCQUFpQixhQUFhLFFBQVEsYUFBYSxPQUFPO0FBQ25GLGVBQUssa0JBQWtCLFFBQVEsTUFBTTtBQUVyQyxjQUFJLFFBQVEsY0FBYyxlQUFlLFdBQVcsUUFBUSxLQUFLLFFBQVEsU0FBUyxNQUFNLEtBQUssUUFBUSxTQUFTLEdBQUc7QUFDakgsY0FBSSxRQUFRLGFBQWEsb0JBQW9CO0FBQzdDLGlCQUFPLE9BQU8sYUFBYSxZQUFZLGFBQWEsT0FBTyxRQUFRO0FBQ25FLGlCQUFPLFdBQVcsV0FBVyxXQUFZO0FBQ3ZDLGdCQUFJLFFBQVEsY0FBYyxFQUFFO0FBQzVCLGdCQUFJLFFBQVEsYUFBYSxFQUFFO0FBQzNCLG1CQUFPLFdBQVc7QUFDbEIsbUJBQU8sYUFBYTtBQUNwQixtQkFBTyxhQUFhO0FBQUEsVUFDdEIsR0FBRyxRQUFRO0FBQUEsUUFDYjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNBLFdBQVMsUUFBUSxRQUFRO0FBQ3ZCLFdBQU8sT0FBTztBQUFBLEVBQ2hCO0FBQ0EsV0FBUyxrQkFBa0IsZUFBZSxVQUFVLFFBQVEsU0FBUztBQUNuRSxXQUFPLEtBQUssS0FBSyxLQUFLLElBQUksU0FBUyxNQUFNLGNBQWMsS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLFNBQVMsT0FBTyxjQUFjLE1BQU0sQ0FBQyxDQUFDLElBQUksS0FBSyxLQUFLLEtBQUssSUFBSSxTQUFTLE1BQU0sT0FBTyxLQUFLLENBQUMsSUFBSSxLQUFLLElBQUksU0FBUyxPQUFPLE9BQU8sTUFBTSxDQUFDLENBQUMsSUFBSSxRQUFRO0FBQUEsRUFDN047QUFFQSxNQUFJLFVBQVUsQ0FBQztBQUNmLE1BQUksV0FBVztBQUFBLElBQ2IscUJBQXFCO0FBQUEsRUFDdkI7QUFDQSxNQUFJLGdCQUFnQjtBQUFBLElBQ2xCLE9BQU8sU0FBUyxNQUFNLFFBQVE7QUFFNUIsZUFBU0MsV0FBVSxVQUFVO0FBQzNCLFlBQUksU0FBUyxlQUFlQSxPQUFNLEtBQUssRUFBRUEsV0FBVSxTQUFTO0FBQzFELGlCQUFPQSxPQUFNLElBQUksU0FBU0EsT0FBTTtBQUFBLFFBQ2xDO0FBQUEsTUFDRjtBQUNBLGNBQVEsUUFBUSxTQUFVLEdBQUc7QUFDM0IsWUFBSSxFQUFFLGVBQWUsT0FBTyxZQUFZO0FBQ3RDLGdCQUFNLGlDQUFpQyxPQUFPLE9BQU8sWUFBWSxpQkFBaUI7QUFBQSxRQUNwRjtBQUFBLE1BQ0YsQ0FBQztBQUNELGNBQVEsS0FBSyxNQUFNO0FBQUEsSUFDckI7QUFBQSxJQUNBLGFBQWEsU0FBUyxZQUFZLFdBQVcsVUFBVSxLQUFLO0FBQzFELFVBQUksUUFBUTtBQUNaLFdBQUssZ0JBQWdCO0FBQ3JCLFVBQUksU0FBUyxXQUFZO0FBQ3ZCLGNBQU0sZ0JBQWdCO0FBQUEsTUFDeEI7QUFDQSxVQUFJLGtCQUFrQixZQUFZO0FBQ2xDLGNBQVEsUUFBUSxTQUFVLFFBQVE7QUFDaEMsWUFBSSxDQUFDLFNBQVMsT0FBTyxVQUFVO0FBQUc7QUFFbEMsWUFBSSxTQUFTLE9BQU8sVUFBVSxFQUFFLGVBQWUsR0FBRztBQUNoRCxtQkFBUyxPQUFPLFVBQVUsRUFBRSxlQUFlLEVBQUUsZUFBZTtBQUFBLFlBQzFEO0FBQUEsVUFDRixHQUFHLEdBQUcsQ0FBQztBQUFBLFFBQ1Q7QUFJQSxZQUFJLFNBQVMsUUFBUSxPQUFPLFVBQVUsS0FBSyxTQUFTLE9BQU8sVUFBVSxFQUFFLFNBQVMsR0FBRztBQUNqRixtQkFBUyxPQUFPLFVBQVUsRUFBRSxTQUFTLEVBQUUsZUFBZTtBQUFBLFlBQ3BEO0FBQUEsVUFDRixHQUFHLEdBQUcsQ0FBQztBQUFBLFFBQ1Q7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFDQSxtQkFBbUIsU0FBUyxrQkFBa0IsVUFBVSxJQUFJQyxXQUFVLFNBQVM7QUFDN0UsY0FBUSxRQUFRLFNBQVUsUUFBUTtBQUNoQyxZQUFJLGFBQWEsT0FBTztBQUN4QixZQUFJLENBQUMsU0FBUyxRQUFRLFVBQVUsS0FBSyxDQUFDLE9BQU87QUFBcUI7QUFDbEUsWUFBSSxjQUFjLElBQUksT0FBTyxVQUFVLElBQUksU0FBUyxPQUFPO0FBQzNELG9CQUFZLFdBQVc7QUFDdkIsb0JBQVksVUFBVSxTQUFTO0FBQy9CLGlCQUFTLFVBQVUsSUFBSTtBQUd2QixpQkFBU0EsV0FBVSxZQUFZLFFBQVE7QUFBQSxNQUN6QyxDQUFDO0FBQ0QsZUFBU0QsV0FBVSxTQUFTLFNBQVM7QUFDbkMsWUFBSSxDQUFDLFNBQVMsUUFBUSxlQUFlQSxPQUFNO0FBQUc7QUFDOUMsWUFBSSxXQUFXLEtBQUssYUFBYSxVQUFVQSxTQUFRLFNBQVMsUUFBUUEsT0FBTSxDQUFDO0FBQzNFLFlBQUksT0FBTyxhQUFhLGFBQWE7QUFDbkMsbUJBQVMsUUFBUUEsT0FBTSxJQUFJO0FBQUEsUUFDN0I7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0Esb0JBQW9CLFNBQVMsbUJBQW1CLE1BQU0sVUFBVTtBQUM5RCxVQUFJLGtCQUFrQixDQUFDO0FBQ3ZCLGNBQVEsUUFBUSxTQUFVLFFBQVE7QUFDaEMsWUFBSSxPQUFPLE9BQU8sb0JBQW9CO0FBQVk7QUFDbEQsaUJBQVMsaUJBQWlCLE9BQU8sZ0JBQWdCLEtBQUssU0FBUyxPQUFPLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFBQSxNQUMxRixDQUFDO0FBQ0QsYUFBTztBQUFBLElBQ1Q7QUFBQSxJQUNBLGNBQWMsU0FBUyxhQUFhLFVBQVUsTUFBTSxPQUFPO0FBQ3pELFVBQUk7QUFDSixjQUFRLFFBQVEsU0FBVSxRQUFRO0FBRWhDLFlBQUksQ0FBQyxTQUFTLE9BQU8sVUFBVTtBQUFHO0FBR2xDLFlBQUksT0FBTyxtQkFBbUIsT0FBTyxPQUFPLGdCQUFnQixJQUFJLE1BQU0sWUFBWTtBQUNoRiwwQkFBZ0IsT0FBTyxnQkFBZ0IsSUFBSSxFQUFFLEtBQUssU0FBUyxPQUFPLFVBQVUsR0FBRyxLQUFLO0FBQUEsUUFDdEY7QUFBQSxNQUNGLENBQUM7QUFDRCxhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFFQSxXQUFTLGNBQWMsTUFBTTtBQUMzQixRQUFJLFdBQVcsS0FBSyxVQUNsQkUsVUFBUyxLQUFLLFFBQ2QsT0FBTyxLQUFLLE1BQ1osV0FBVyxLQUFLLFVBQ2hCQyxXQUFVLEtBQUssU0FDZixPQUFPLEtBQUssTUFDWixTQUFTLEtBQUssUUFDZEMsWUFBVyxLQUFLLFVBQ2hCQyxZQUFXLEtBQUssVUFDaEJDLHFCQUFvQixLQUFLLG1CQUN6QkMscUJBQW9CLEtBQUssbUJBQ3pCLGdCQUFnQixLQUFLLGVBQ3JCQyxlQUFjLEtBQUssYUFDbkIsdUJBQXVCLEtBQUs7QUFDOUIsZUFBVyxZQUFZTixXQUFVQSxRQUFPLE9BQU87QUFDL0MsUUFBSSxDQUFDO0FBQVU7QUFDZixRQUFJLEtBQ0YsVUFBVSxTQUFTLFNBQ25CLFNBQVMsT0FBTyxLQUFLLE9BQU8sQ0FBQyxFQUFFLFlBQVksSUFBSSxLQUFLLE9BQU8sQ0FBQztBQUU5RCxRQUFJLE9BQU8sZUFBZSxDQUFDLGNBQWMsQ0FBQyxNQUFNO0FBQzlDLFlBQU0sSUFBSSxZQUFZLE1BQU07QUFBQSxRQUMxQixTQUFTO0FBQUEsUUFDVCxZQUFZO0FBQUEsTUFDZCxDQUFDO0FBQUEsSUFDSCxPQUFPO0FBQ0wsWUFBTSxTQUFTLFlBQVksT0FBTztBQUNsQyxVQUFJLFVBQVUsTUFBTSxNQUFNLElBQUk7QUFBQSxJQUNoQztBQUNBLFFBQUksS0FBSyxRQUFRQTtBQUNqQixRQUFJLE9BQU8sVUFBVUE7QUFDckIsUUFBSSxPQUFPLFlBQVlBO0FBQ3ZCLFFBQUksUUFBUUM7QUFDWixRQUFJLFdBQVdDO0FBQ2YsUUFBSSxXQUFXQztBQUNmLFFBQUksb0JBQW9CQztBQUN4QixRQUFJLG9CQUFvQkM7QUFDeEIsUUFBSSxnQkFBZ0I7QUFDcEIsUUFBSSxXQUFXQyxlQUFjQSxhQUFZLGNBQWM7QUFDdkQsUUFBSSxxQkFBcUIsZUFBZSxlQUFlLENBQUMsR0FBRyxvQkFBb0IsR0FBRyxjQUFjLG1CQUFtQixNQUFNLFFBQVEsQ0FBQztBQUNsSSxhQUFTUixXQUFVLG9CQUFvQjtBQUNyQyxVQUFJQSxPQUFNLElBQUksbUJBQW1CQSxPQUFNO0FBQUEsSUFDekM7QUFDQSxRQUFJRSxTQUFRO0FBQ1YsTUFBQUEsUUFBTyxjQUFjLEdBQUc7QUFBQSxJQUMxQjtBQUNBLFFBQUksUUFBUSxNQUFNLEdBQUc7QUFDbkIsY0FBUSxNQUFNLEVBQUUsS0FBSyxVQUFVLEdBQUc7QUFBQSxJQUNwQztBQUFBLEVBQ0Y7QUFFQSxNQUFJLFlBQVksQ0FBQyxLQUFLO0FBQ3RCLE1BQUlPLGVBQWMsU0FBU0EsYUFBWSxXQUFXLFVBQVU7QUFDMUQsUUFBSSxPQUFPLFVBQVUsU0FBUyxLQUFLLFVBQVUsQ0FBQyxNQUFNLFNBQVksVUFBVSxDQUFDLElBQUksQ0FBQyxHQUM5RSxnQkFBZ0IsS0FBSyxLQUNyQixPQUFPLHlCQUF5QixNQUFNLFNBQVM7QUFDakQsa0JBQWMsWUFBWSxLQUFLLFFBQVEsRUFBRSxXQUFXLFVBQVUsZUFBZTtBQUFBLE1BQzNFO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0EsYUFBYTtBQUFBLE1BQ2I7QUFBQSxNQUNBLGdCQUFnQixTQUFTO0FBQUEsTUFDekI7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQSxvQkFBb0I7QUFBQSxNQUNwQixzQkFBc0I7QUFBQSxNQUN0QixnQkFBZ0IsU0FBUyxpQkFBaUI7QUFDeEMsc0JBQWM7QUFBQSxNQUNoQjtBQUFBLE1BQ0EsZUFBZSxTQUFTLGdCQUFnQjtBQUN0QyxzQkFBYztBQUFBLE1BQ2hCO0FBQUEsTUFDQSx1QkFBdUIsU0FBUyxzQkFBc0IsTUFBTTtBQUMxRCx1QkFBZTtBQUFBLFVBQ2I7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0YsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGLEdBQUcsSUFBSSxDQUFDO0FBQUEsRUFDVjtBQUNBLFdBQVMsZUFBZSxNQUFNO0FBQzVCLGtCQUFjLGVBQWU7QUFBQSxNQUMzQjtBQUFBLE1BQ0E7QUFBQSxNQUNBLFVBQVU7QUFBQSxNQUNWO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0YsR0FBRyxJQUFJLENBQUM7QUFBQSxFQUNWO0FBQ0EsTUFBSTtBQUFKLE1BQ0U7QUFERixNQUVFO0FBRkYsTUFHRTtBQUhGLE1BSUU7QUFKRixNQUtFO0FBTEYsTUFNRTtBQU5GLE1BT0U7QUFQRixNQVFFO0FBUkYsTUFTRTtBQVRGLE1BVUU7QUFWRixNQVdFO0FBWEYsTUFZRTtBQVpGLE1BYUU7QUFiRixNQWNFLHNCQUFzQjtBQWR4QixNQWVFLGtCQUFrQjtBQWZwQixNQWdCRSxZQUFZLENBQUM7QUFoQmYsTUFpQkU7QUFqQkYsTUFrQkU7QUFsQkYsTUFtQkU7QUFuQkYsTUFvQkU7QUFwQkYsTUFxQkU7QUFyQkYsTUFzQkU7QUF0QkYsTUF1QkU7QUF2QkYsTUF3QkU7QUF4QkYsTUF5QkU7QUF6QkYsTUEwQkUsd0JBQXdCO0FBMUIxQixNQTJCRSx5QkFBeUI7QUEzQjNCLE1BNEJFO0FBNUJGLE1BOEJFO0FBOUJGLE1BK0JFLG1DQUFtQyxDQUFDO0FBL0J0QyxNQWtDRSxVQUFVO0FBbENaLE1BbUNFLG9CQUFvQixDQUFDO0FBR3ZCLE1BQUksaUJBQWlCLE9BQU8sYUFBYTtBQUF6QyxNQUNFLDBCQUEwQjtBQUQ1QixNQUVFLG1CQUFtQixRQUFRLGFBQWEsYUFBYTtBQUZ2RCxNQUlFLG1CQUFtQixrQkFBa0IsQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLGVBQWUsU0FBUyxjQUFjLEtBQUs7QUFKL0csTUFLRSwwQkFBMEIsV0FBWTtBQUNwQyxRQUFJLENBQUM7QUFBZ0I7QUFFckIsUUFBSSxZQUFZO0FBQ2QsYUFBTztBQUFBLElBQ1Q7QUFDQSxRQUFJLEtBQUssU0FBUyxjQUFjLEdBQUc7QUFDbkMsT0FBRyxNQUFNLFVBQVU7QUFDbkIsV0FBTyxHQUFHLE1BQU0sa0JBQWtCO0FBQUEsRUFDcEMsRUFBRTtBQWRKLE1BZUUsbUJBQW1CLFNBQVNDLGtCQUFpQixJQUFJLFNBQVM7QUFDeEQsUUFBSSxRQUFRLElBQUksRUFBRSxHQUNoQixVQUFVLFNBQVMsTUFBTSxLQUFLLElBQUksU0FBUyxNQUFNLFdBQVcsSUFBSSxTQUFTLE1BQU0sWUFBWSxJQUFJLFNBQVMsTUFBTSxlQUFlLElBQUksU0FBUyxNQUFNLGdCQUFnQixHQUNoSyxTQUFTLFNBQVMsSUFBSSxHQUFHLE9BQU8sR0FDaEMsU0FBUyxTQUFTLElBQUksR0FBRyxPQUFPLEdBQ2hDLGdCQUFnQixVQUFVLElBQUksTUFBTSxHQUNwQyxpQkFBaUIsVUFBVSxJQUFJLE1BQU0sR0FDckMsa0JBQWtCLGlCQUFpQixTQUFTLGNBQWMsVUFBVSxJQUFJLFNBQVMsY0FBYyxXQUFXLElBQUksUUFBUSxNQUFNLEVBQUUsT0FDOUgsbUJBQW1CLGtCQUFrQixTQUFTLGVBQWUsVUFBVSxJQUFJLFNBQVMsZUFBZSxXQUFXLElBQUksUUFBUSxNQUFNLEVBQUU7QUFDcEksUUFBSSxNQUFNLFlBQVksUUFBUTtBQUM1QixhQUFPLE1BQU0sa0JBQWtCLFlBQVksTUFBTSxrQkFBa0IsbUJBQW1CLGFBQWE7QUFBQSxJQUNyRztBQUNBLFFBQUksTUFBTSxZQUFZLFFBQVE7QUFDNUIsYUFBTyxNQUFNLG9CQUFvQixNQUFNLEdBQUcsRUFBRSxVQUFVLElBQUksYUFBYTtBQUFBLElBQ3pFO0FBQ0EsUUFBSSxVQUFVLGNBQWMsT0FBTyxLQUFLLGNBQWMsT0FBTyxNQUFNLFFBQVE7QUFDekUsVUFBSSxxQkFBcUIsY0FBYyxPQUFPLE1BQU0sU0FBUyxTQUFTO0FBQ3RFLGFBQU8sV0FBVyxlQUFlLFVBQVUsVUFBVSxlQUFlLFVBQVUsc0JBQXNCLGFBQWE7QUFBQSxJQUNuSDtBQUNBLFdBQU8sV0FBVyxjQUFjLFlBQVksV0FBVyxjQUFjLFlBQVksVUFBVSxjQUFjLFlBQVksV0FBVyxjQUFjLFlBQVksVUFBVSxtQkFBbUIsV0FBVyxNQUFNLGdCQUFnQixNQUFNLFVBQVUsVUFBVSxNQUFNLGdCQUFnQixNQUFNLFVBQVUsa0JBQWtCLG1CQUFtQixXQUFXLGFBQWE7QUFBQSxFQUN2VjtBQW5DRixNQW9DRSxxQkFBcUIsU0FBU0Msb0JBQW1CLFVBQVUsWUFBWSxVQUFVO0FBQy9FLFFBQUksY0FBYyxXQUFXLFNBQVMsT0FBTyxTQUFTLEtBQ3BELGNBQWMsV0FBVyxTQUFTLFFBQVEsU0FBUyxRQUNuRCxrQkFBa0IsV0FBVyxTQUFTLFFBQVEsU0FBUyxRQUN2RCxjQUFjLFdBQVcsV0FBVyxPQUFPLFdBQVcsS0FDdEQsY0FBYyxXQUFXLFdBQVcsUUFBUSxXQUFXLFFBQ3ZELGtCQUFrQixXQUFXLFdBQVcsUUFBUSxXQUFXO0FBQzdELFdBQU8sZ0JBQWdCLGVBQWUsZ0JBQWdCLGVBQWUsY0FBYyxrQkFBa0IsTUFBTSxjQUFjLGtCQUFrQjtBQUFBLEVBQzdJO0FBNUNGLE1BbURFLDhCQUE4QixTQUFTQyw2QkFBNEIsR0FBRyxHQUFHO0FBQ3ZFLFFBQUk7QUFDSixjQUFVLEtBQUssU0FBVSxVQUFVO0FBQ2pDLFVBQUksWUFBWSxTQUFTLE9BQU8sRUFBRSxRQUFRO0FBQzFDLFVBQUksQ0FBQyxhQUFhLFVBQVUsUUFBUTtBQUFHO0FBQ3ZDLFVBQUksT0FBTyxRQUFRLFFBQVEsR0FDekIscUJBQXFCLEtBQUssS0FBSyxPQUFPLGFBQWEsS0FBSyxLQUFLLFFBQVEsV0FDckUsbUJBQW1CLEtBQUssS0FBSyxNQUFNLGFBQWEsS0FBSyxLQUFLLFNBQVM7QUFDckUsVUFBSSxzQkFBc0Isa0JBQWtCO0FBQzFDLGVBQU8sTUFBTTtBQUFBLE1BQ2Y7QUFBQSxJQUNGLENBQUM7QUFDRCxXQUFPO0FBQUEsRUFDVDtBQWhFRixNQWlFRSxnQkFBZ0IsU0FBU0MsZUFBYyxTQUFTO0FBQzlDLGFBQVMsS0FBSyxPQUFPLE1BQU07QUFDekIsYUFBTyxTQUFVLElBQUksTUFBTUMsU0FBUSxLQUFLO0FBQ3RDLFlBQUksWUFBWSxHQUFHLFFBQVEsTUFBTSxRQUFRLEtBQUssUUFBUSxNQUFNLFFBQVEsR0FBRyxRQUFRLE1BQU0sU0FBUyxLQUFLLFFBQVEsTUFBTTtBQUNqSCxZQUFJLFNBQVMsU0FBUyxRQUFRLFlBQVk7QUFHeEMsaUJBQU87QUFBQSxRQUNULFdBQVcsU0FBUyxRQUFRLFVBQVUsT0FBTztBQUMzQyxpQkFBTztBQUFBLFFBQ1QsV0FBVyxRQUFRLFVBQVUsU0FBUztBQUNwQyxpQkFBTztBQUFBLFFBQ1QsV0FBVyxPQUFPLFVBQVUsWUFBWTtBQUN0QyxpQkFBTyxLQUFLLE1BQU0sSUFBSSxNQUFNQSxTQUFRLEdBQUcsR0FBRyxJQUFJLEVBQUUsSUFBSSxNQUFNQSxTQUFRLEdBQUc7QUFBQSxRQUN2RSxPQUFPO0FBQ0wsY0FBSSxjQUFjLE9BQU8sS0FBSyxNQUFNLFFBQVEsTUFBTTtBQUNsRCxpQkFBTyxVQUFVLFFBQVEsT0FBTyxVQUFVLFlBQVksVUFBVSxjQUFjLE1BQU0sUUFBUSxNQUFNLFFBQVEsVUFBVSxJQUFJO0FBQUEsUUFDMUg7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUNBLFFBQUksUUFBUSxDQUFDO0FBQ2IsUUFBSSxnQkFBZ0IsUUFBUTtBQUM1QixRQUFJLENBQUMsaUJBQWlCLFFBQVEsYUFBYSxLQUFLLFVBQVU7QUFDeEQsc0JBQWdCO0FBQUEsUUFDZCxNQUFNO0FBQUEsTUFDUjtBQUFBLElBQ0Y7QUFDQSxVQUFNLE9BQU8sY0FBYztBQUMzQixVQUFNLFlBQVksS0FBSyxjQUFjLE1BQU0sSUFBSTtBQUMvQyxVQUFNLFdBQVcsS0FBSyxjQUFjLEdBQUc7QUFDdkMsVUFBTSxjQUFjLGNBQWM7QUFDbEMsWUFBUSxRQUFRO0FBQUEsRUFDbEI7QUFqR0YsTUFrR0Usc0JBQXNCLFNBQVNDLHVCQUFzQjtBQUNuRCxRQUFJLENBQUMsMkJBQTJCLFNBQVM7QUFDdkMsVUFBSSxTQUFTLFdBQVcsTUFBTTtBQUFBLElBQ2hDO0FBQUEsRUFDRjtBQXRHRixNQXVHRSx3QkFBd0IsU0FBU0MseUJBQXdCO0FBQ3ZELFFBQUksQ0FBQywyQkFBMkIsU0FBUztBQUN2QyxVQUFJLFNBQVMsV0FBVyxFQUFFO0FBQUEsSUFDNUI7QUFBQSxFQUNGO0FBR0YsTUFBSSxrQkFBa0IsQ0FBQyxrQkFBa0I7QUFDdkMsYUFBUyxpQkFBaUIsU0FBUyxTQUFVLEtBQUs7QUFDaEQsVUFBSSxpQkFBaUI7QUFDbkIsWUFBSSxlQUFlO0FBQ25CLFlBQUksbUJBQW1CLElBQUksZ0JBQWdCO0FBQzNDLFlBQUksNEJBQTRCLElBQUkseUJBQXlCO0FBQzdELDBCQUFrQjtBQUNsQixlQUFPO0FBQUEsTUFDVDtBQUFBLElBQ0YsR0FBRyxJQUFJO0FBQUEsRUFDVDtBQUNBLE1BQUksZ0NBQWdDLFNBQVNDLCtCQUE4QixLQUFLO0FBQzlFLFFBQUksUUFBUTtBQUNWLFlBQU0sSUFBSSxVQUFVLElBQUksUUFBUSxDQUFDLElBQUk7QUFDckMsVUFBSSxVQUFVLDRCQUE0QixJQUFJLFNBQVMsSUFBSSxPQUFPO0FBQ2xFLFVBQUksU0FBUztBQUVYLFlBQUksUUFBUSxDQUFDO0FBQ2IsaUJBQVMsS0FBSyxLQUFLO0FBQ2pCLGNBQUksSUFBSSxlQUFlLENBQUMsR0FBRztBQUN6QixrQkFBTSxDQUFDLElBQUksSUFBSSxDQUFDO0FBQUEsVUFDbEI7QUFBQSxRQUNGO0FBQ0EsY0FBTSxTQUFTLE1BQU0sU0FBUztBQUM5QixjQUFNLGlCQUFpQjtBQUN2QixjQUFNLGtCQUFrQjtBQUN4QixnQkFBUSxPQUFPLEVBQUUsWUFBWSxLQUFLO0FBQUEsTUFDcEM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNBLE1BQUksd0JBQXdCLFNBQVNDLHVCQUFzQixLQUFLO0FBQzlELFFBQUksUUFBUTtBQUNWLGFBQU8sV0FBVyxPQUFPLEVBQUUsaUJBQWlCLElBQUksTUFBTTtBQUFBLElBQ3hEO0FBQUEsRUFDRjtBQU9BLFdBQVMsU0FBUyxJQUFJLFNBQVM7QUFDN0IsUUFBSSxFQUFFLE1BQU0sR0FBRyxZQUFZLEdBQUcsYUFBYSxJQUFJO0FBQzdDLFlBQU0sOENBQThDLE9BQU8sQ0FBQyxFQUFFLFNBQVMsS0FBSyxFQUFFLENBQUM7QUFBQSxJQUNqRjtBQUNBLFNBQUssS0FBSztBQUNWLFNBQUssVUFBVSxVQUFVLFNBQVMsQ0FBQyxHQUFHLE9BQU87QUFHN0MsT0FBRyxPQUFPLElBQUk7QUFDZCxRQUFJakIsWUFBVztBQUFBLE1BQ2IsT0FBTztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLE1BQ1YsT0FBTztBQUFBLE1BQ1AsUUFBUTtBQUFBLE1BQ1IsV0FBVyxXQUFXLEtBQUssR0FBRyxRQUFRLElBQUksUUFBUTtBQUFBLE1BQ2xELGVBQWU7QUFBQTtBQUFBLE1BRWYsWUFBWTtBQUFBO0FBQUEsTUFFWix1QkFBdUI7QUFBQTtBQUFBLE1BRXZCLG1CQUFtQjtBQUFBLE1BQ25CLFdBQVcsU0FBUyxZQUFZO0FBQzlCLGVBQU8saUJBQWlCLElBQUksS0FBSyxPQUFPO0FBQUEsTUFDMUM7QUFBQSxNQUNBLFlBQVk7QUFBQSxNQUNaLGFBQWE7QUFBQSxNQUNiLFdBQVc7QUFBQSxNQUNYLFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxNQUNSLGlCQUFpQjtBQUFBLE1BQ2pCLFdBQVc7QUFBQSxNQUNYLFFBQVE7QUFBQSxNQUNSLFNBQVMsU0FBUyxRQUFRLGNBQWNhLFNBQVE7QUFDOUMscUJBQWEsUUFBUSxRQUFRQSxRQUFPLFdBQVc7QUFBQSxNQUNqRDtBQUFBLE1BQ0EsWUFBWTtBQUFBLE1BQ1osZ0JBQWdCO0FBQUEsTUFDaEIsWUFBWTtBQUFBLE1BQ1osT0FBTztBQUFBLE1BQ1Asa0JBQWtCO0FBQUEsTUFDbEIsc0JBQXNCLE9BQU8sV0FBVyxTQUFTLFFBQVEsU0FBUyxPQUFPLGtCQUFrQixFQUFFLEtBQUs7QUFBQSxNQUNsRyxlQUFlO0FBQUEsTUFDZixlQUFlO0FBQUEsTUFDZixnQkFBZ0I7QUFBQSxNQUNoQixtQkFBbUI7QUFBQSxNQUNuQixnQkFBZ0I7QUFBQSxRQUNkLEdBQUc7QUFBQSxRQUNILEdBQUc7QUFBQSxNQUNMO0FBQUEsTUFDQSxnQkFBZ0IsU0FBUyxtQkFBbUIsU0FBUyxrQkFBa0IsVUFBVSxDQUFDO0FBQUEsTUFDbEYsc0JBQXNCO0FBQUEsSUFDeEI7QUFDQSxrQkFBYyxrQkFBa0IsTUFBTSxJQUFJYixTQUFRO0FBR2xELGFBQVMsUUFBUUEsV0FBVTtBQUN6QixRQUFFLFFBQVEsYUFBYSxRQUFRLElBQUksSUFBSUEsVUFBUyxJQUFJO0FBQUEsSUFDdEQ7QUFDQSxrQkFBYyxPQUFPO0FBR3JCLGFBQVMsTUFBTSxNQUFNO0FBQ25CLFVBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxPQUFPLE9BQU8sS0FBSyxFQUFFLE1BQU0sWUFBWTtBQUMxRCxhQUFLLEVBQUUsSUFBSSxLQUFLLEVBQUUsRUFBRSxLQUFLLElBQUk7QUFBQSxNQUMvQjtBQUFBLElBQ0Y7QUFHQSxTQUFLLGtCQUFrQixRQUFRLGdCQUFnQixRQUFRO0FBQ3ZELFFBQUksS0FBSyxpQkFBaUI7QUFFeEIsV0FBSyxRQUFRLHNCQUFzQjtBQUFBLElBQ3JDO0FBR0EsUUFBSSxRQUFRLGdCQUFnQjtBQUMxQixTQUFHLElBQUksZUFBZSxLQUFLLFdBQVc7QUFBQSxJQUN4QyxPQUFPO0FBQ0wsU0FBRyxJQUFJLGFBQWEsS0FBSyxXQUFXO0FBQ3BDLFNBQUcsSUFBSSxjQUFjLEtBQUssV0FBVztBQUFBLElBQ3ZDO0FBQ0EsUUFBSSxLQUFLLGlCQUFpQjtBQUN4QixTQUFHLElBQUksWUFBWSxJQUFJO0FBQ3ZCLFNBQUcsSUFBSSxhQUFhLElBQUk7QUFBQSxJQUMxQjtBQUNBLGNBQVUsS0FBSyxLQUFLLEVBQUU7QUFHdEIsWUFBUSxTQUFTLFFBQVEsTUFBTSxPQUFPLEtBQUssS0FBSyxRQUFRLE1BQU0sSUFBSSxJQUFJLEtBQUssQ0FBQyxDQUFDO0FBRzdFLGFBQVMsTUFBTSxzQkFBc0IsQ0FBQztBQUFBLEVBQ3hDO0FBQ0EsV0FBUztBQUFBLEVBQTRDO0FBQUEsSUFDbkQsYUFBYTtBQUFBLElBQ2Isa0JBQWtCLFNBQVMsaUJBQWlCLFFBQVE7QUFDbEQsVUFBSSxDQUFDLEtBQUssR0FBRyxTQUFTLE1BQU0sS0FBSyxXQUFXLEtBQUssSUFBSTtBQUNuRCxxQkFBYTtBQUFBLE1BQ2Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxlQUFlLFNBQVMsY0FBYyxLQUFLLFFBQVE7QUFDakQsYUFBTyxPQUFPLEtBQUssUUFBUSxjQUFjLGFBQWEsS0FBSyxRQUFRLFVBQVUsS0FBSyxNQUFNLEtBQUssUUFBUSxNQUFNLElBQUksS0FBSyxRQUFRO0FBQUEsSUFDOUg7QUFBQSxJQUNBLGFBQWEsU0FBUyxZQUFvQyxLQUFLO0FBQzdELFVBQUksQ0FBQyxJQUFJO0FBQVk7QUFDckIsVUFBSSxRQUFRLE1BQ1YsS0FBSyxLQUFLLElBQ1YsVUFBVSxLQUFLLFNBQ2Ysa0JBQWtCLFFBQVEsaUJBQzFCLE9BQU8sSUFBSSxNQUNYLFFBQVEsSUFBSSxXQUFXLElBQUksUUFBUSxDQUFDLEtBQUssSUFBSSxlQUFlLElBQUksZ0JBQWdCLFdBQVcsS0FDM0YsVUFBVSxTQUFTLEtBQUssUUFDeEIsaUJBQWlCLElBQUksT0FBTyxlQUFlLElBQUksUUFBUSxJQUFJLEtBQUssQ0FBQyxLQUFLLElBQUksZ0JBQWdCLElBQUksYUFBYSxFQUFFLENBQUMsTUFBTSxRQUNwSCxTQUFTLFFBQVE7QUFDbkIsNkJBQXVCLEVBQUU7QUFHekIsVUFBSSxRQUFRO0FBQ1Y7QUFBQSxNQUNGO0FBQ0EsVUFBSSx3QkFBd0IsS0FBSyxJQUFJLEtBQUssSUFBSSxXQUFXLEtBQUssUUFBUSxVQUFVO0FBQzlFO0FBQUEsTUFDRjtBQUdBLFVBQUksZUFBZSxtQkFBbUI7QUFDcEM7QUFBQSxNQUNGO0FBR0EsVUFBSSxDQUFDLEtBQUssbUJBQW1CLFVBQVUsVUFBVSxPQUFPLFFBQVEsWUFBWSxNQUFNLFVBQVU7QUFDMUY7QUFBQSxNQUNGO0FBQ0EsZUFBUyxRQUFRLFFBQVEsUUFBUSxXQUFXLElBQUksS0FBSztBQUNyRCxVQUFJLFVBQVUsT0FBTyxVQUFVO0FBQzdCO0FBQUEsTUFDRjtBQUNBLFVBQUksZUFBZSxRQUFRO0FBRXpCO0FBQUEsTUFDRjtBQUdBLGlCQUFXLE1BQU0sTUFBTTtBQUN2QiwwQkFBb0IsTUFBTSxRQUFRLFFBQVEsU0FBUztBQUduRCxVQUFJLE9BQU8sV0FBVyxZQUFZO0FBQ2hDLFlBQUksT0FBTyxLQUFLLE1BQU0sS0FBSyxRQUFRLElBQUksR0FBRztBQUN4Qyx5QkFBZTtBQUFBLFlBQ2IsVUFBVTtBQUFBLFlBQ1YsUUFBUTtBQUFBLFlBQ1IsTUFBTTtBQUFBLFlBQ04sVUFBVTtBQUFBLFlBQ1YsTUFBTTtBQUFBLFlBQ04sUUFBUTtBQUFBLFVBQ1YsQ0FBQztBQUNELFVBQUFRLGFBQVksVUFBVSxPQUFPO0FBQUEsWUFDM0I7QUFBQSxVQUNGLENBQUM7QUFDRCw2QkFBbUIsSUFBSSxjQUFjLElBQUksZUFBZTtBQUN4RDtBQUFBLFFBQ0Y7QUFBQSxNQUNGLFdBQVcsUUFBUTtBQUNqQixpQkFBUyxPQUFPLE1BQU0sR0FBRyxFQUFFLEtBQUssU0FBVSxVQUFVO0FBQ2xELHFCQUFXLFFBQVEsZ0JBQWdCLFNBQVMsS0FBSyxHQUFHLElBQUksS0FBSztBQUM3RCxjQUFJLFVBQVU7QUFDWiwyQkFBZTtBQUFBLGNBQ2IsVUFBVTtBQUFBLGNBQ1YsUUFBUTtBQUFBLGNBQ1IsTUFBTTtBQUFBLGNBQ04sVUFBVTtBQUFBLGNBQ1YsUUFBUTtBQUFBLGNBQ1IsTUFBTTtBQUFBLFlBQ1IsQ0FBQztBQUNELFlBQUFBLGFBQVksVUFBVSxPQUFPO0FBQUEsY0FDM0I7QUFBQSxZQUNGLENBQUM7QUFDRCxtQkFBTztBQUFBLFVBQ1Q7QUFBQSxRQUNGLENBQUM7QUFDRCxZQUFJLFFBQVE7QUFDViw2QkFBbUIsSUFBSSxjQUFjLElBQUksZUFBZTtBQUN4RDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQ0EsVUFBSSxRQUFRLFVBQVUsQ0FBQyxRQUFRLGdCQUFnQixRQUFRLFFBQVEsSUFBSSxLQUFLLEdBQUc7QUFDekU7QUFBQSxNQUNGO0FBR0EsV0FBSyxrQkFBa0IsS0FBSyxPQUFPLE1BQU07QUFBQSxJQUMzQztBQUFBLElBQ0EsbUJBQW1CLFNBQVMsa0JBQStCLEtBQWlCLE9BQXlCLFFBQVE7QUFDM0csVUFBSSxRQUFRLE1BQ1YsS0FBSyxNQUFNLElBQ1gsVUFBVSxNQUFNLFNBQ2hCLGdCQUFnQixHQUFHLGVBQ25CO0FBQ0YsVUFBSSxVQUFVLENBQUMsVUFBVSxPQUFPLGVBQWUsSUFBSTtBQUNqRCxZQUFJLFdBQVcsUUFBUSxNQUFNO0FBQzdCLGlCQUFTO0FBQ1QsaUJBQVM7QUFDVCxtQkFBVyxPQUFPO0FBQ2xCLGlCQUFTLE9BQU87QUFDaEIscUJBQWE7QUFDYixzQkFBYyxRQUFRO0FBQ3RCLGlCQUFTLFVBQVU7QUFDbkIsaUJBQVM7QUFBQSxVQUNQLFFBQVE7QUFBQSxVQUNSLFVBQVUsU0FBUyxLQUFLO0FBQUEsVUFDeEIsVUFBVSxTQUFTLEtBQUs7QUFBQSxRQUMxQjtBQUNBLDBCQUFrQixPQUFPLFVBQVUsU0FBUztBQUM1Qyx5QkFBaUIsT0FBTyxVQUFVLFNBQVM7QUFDM0MsYUFBSyxVQUFVLFNBQVMsS0FBSztBQUM3QixhQUFLLFVBQVUsU0FBUyxLQUFLO0FBQzdCLGVBQU8sTUFBTSxhQUFhLElBQUk7QUFDOUIsc0JBQWMsU0FBU1UsZUFBYztBQUNuQyxVQUFBVixhQUFZLGNBQWMsT0FBTztBQUFBLFlBQy9CO0FBQUEsVUFDRixDQUFDO0FBQ0QsY0FBSSxTQUFTLGVBQWU7QUFDMUIsa0JBQU0sUUFBUTtBQUNkO0FBQUEsVUFDRjtBQUdBLGdCQUFNLDBCQUEwQjtBQUNoQyxjQUFJLENBQUMsV0FBVyxNQUFNLGlCQUFpQjtBQUNyQyxtQkFBTyxZQUFZO0FBQUEsVUFDckI7QUFHQSxnQkFBTSxrQkFBa0IsS0FBSyxLQUFLO0FBR2xDLHlCQUFlO0FBQUEsWUFDYixVQUFVO0FBQUEsWUFDVixNQUFNO0FBQUEsWUFDTixlQUFlO0FBQUEsVUFDakIsQ0FBQztBQUdELHNCQUFZLFFBQVEsUUFBUSxhQUFhLElBQUk7QUFBQSxRQUMvQztBQUdBLGdCQUFRLE9BQU8sTUFBTSxHQUFHLEVBQUUsUUFBUSxTQUFVLFVBQVU7QUFDcEQsZUFBSyxRQUFRLFNBQVMsS0FBSyxHQUFHLGlCQUFpQjtBQUFBLFFBQ2pELENBQUM7QUFDRCxXQUFHLGVBQWUsWUFBWSw2QkFBNkI7QUFDM0QsV0FBRyxlQUFlLGFBQWEsNkJBQTZCO0FBQzVELFdBQUcsZUFBZSxhQUFhLDZCQUE2QjtBQUM1RCxXQUFHLGVBQWUsV0FBVyxNQUFNLE9BQU87QUFDMUMsV0FBRyxlQUFlLFlBQVksTUFBTSxPQUFPO0FBQzNDLFdBQUcsZUFBZSxlQUFlLE1BQU0sT0FBTztBQUc5QyxZQUFJLFdBQVcsS0FBSyxpQkFBaUI7QUFDbkMsZUFBSyxRQUFRLHNCQUFzQjtBQUNuQyxpQkFBTyxZQUFZO0FBQUEsUUFDckI7QUFDQSxRQUFBQSxhQUFZLGNBQWMsTUFBTTtBQUFBLFVBQzlCO0FBQUEsUUFDRixDQUFDO0FBR0QsWUFBSSxRQUFRLFVBQVUsQ0FBQyxRQUFRLG9CQUFvQixXQUFXLENBQUMsS0FBSyxtQkFBbUIsRUFBRSxRQUFRLGNBQWM7QUFDN0csY0FBSSxTQUFTLGVBQWU7QUFDMUIsaUJBQUssUUFBUTtBQUNiO0FBQUEsVUFDRjtBQUlBLGFBQUcsZUFBZSxXQUFXLE1BQU0sbUJBQW1CO0FBQ3RELGFBQUcsZUFBZSxZQUFZLE1BQU0sbUJBQW1CO0FBQ3ZELGFBQUcsZUFBZSxlQUFlLE1BQU0sbUJBQW1CO0FBQzFELGFBQUcsZUFBZSxhQUFhLE1BQU0sNEJBQTRCO0FBQ2pFLGFBQUcsZUFBZSxhQUFhLE1BQU0sNEJBQTRCO0FBQ2pFLGtCQUFRLGtCQUFrQixHQUFHLGVBQWUsZUFBZSxNQUFNLDRCQUE0QjtBQUM3RixnQkFBTSxrQkFBa0IsV0FBVyxhQUFhLFFBQVEsS0FBSztBQUFBLFFBQy9ELE9BQU87QUFDTCxzQkFBWTtBQUFBLFFBQ2Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsOEJBQThCLFNBQVMsNkJBQTZELEdBQUc7QUFDckcsVUFBSSxRQUFRLEVBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBQyxJQUFJO0FBQ3ZDLFVBQUksS0FBSyxJQUFJLEtBQUssSUFBSSxNQUFNLFVBQVUsS0FBSyxNQUFNLEdBQUcsS0FBSyxJQUFJLE1BQU0sVUFBVSxLQUFLLE1BQU0sQ0FBQyxLQUFLLEtBQUssTUFBTSxLQUFLLFFBQVEsdUJBQXVCLEtBQUssbUJBQW1CLE9BQU8sb0JBQW9CLEVBQUUsR0FBRztBQUNuTSxhQUFLLG9CQUFvQjtBQUFBLE1BQzNCO0FBQUEsSUFDRjtBQUFBLElBQ0EscUJBQXFCLFNBQVMsc0JBQXNCO0FBQ2xELGdCQUFVLGtCQUFrQixNQUFNO0FBQ2xDLG1CQUFhLEtBQUssZUFBZTtBQUNqQyxXQUFLLDBCQUEwQjtBQUFBLElBQ2pDO0FBQUEsSUFDQSwyQkFBMkIsU0FBUyw0QkFBNEI7QUFDOUQsVUFBSSxnQkFBZ0IsS0FBSyxHQUFHO0FBQzVCLFVBQUksZUFBZSxXQUFXLEtBQUssbUJBQW1CO0FBQ3RELFVBQUksZUFBZSxZQUFZLEtBQUssbUJBQW1CO0FBQ3ZELFVBQUksZUFBZSxlQUFlLEtBQUssbUJBQW1CO0FBQzFELFVBQUksZUFBZSxhQUFhLEtBQUssNEJBQTRCO0FBQ2pFLFVBQUksZUFBZSxhQUFhLEtBQUssNEJBQTRCO0FBQ2pFLFVBQUksZUFBZSxlQUFlLEtBQUssNEJBQTRCO0FBQUEsSUFDckU7QUFBQSxJQUNBLG1CQUFtQixTQUFTLGtCQUErQixLQUFpQixPQUFPO0FBQ2pGLGNBQVEsU0FBUyxJQUFJLGVBQWUsV0FBVztBQUMvQyxVQUFJLENBQUMsS0FBSyxtQkFBbUIsT0FBTztBQUNsQyxZQUFJLEtBQUssUUFBUSxnQkFBZ0I7QUFDL0IsYUFBRyxVQUFVLGVBQWUsS0FBSyxZQUFZO0FBQUEsUUFDL0MsV0FBVyxPQUFPO0FBQ2hCLGFBQUcsVUFBVSxhQUFhLEtBQUssWUFBWTtBQUFBLFFBQzdDLE9BQU87QUFDTCxhQUFHLFVBQVUsYUFBYSxLQUFLLFlBQVk7QUFBQSxRQUM3QztBQUFBLE1BQ0YsT0FBTztBQUNMLFdBQUcsUUFBUSxXQUFXLElBQUk7QUFDMUIsV0FBRyxRQUFRLGFBQWEsS0FBSyxZQUFZO0FBQUEsTUFDM0M7QUFDQSxVQUFJO0FBQ0YsWUFBSSxTQUFTLFdBQVc7QUFFdEIsb0JBQVUsV0FBWTtBQUNwQixxQkFBUyxVQUFVLE1BQU07QUFBQSxVQUMzQixDQUFDO0FBQUEsUUFDSCxPQUFPO0FBQ0wsaUJBQU8sYUFBYSxFQUFFLGdCQUFnQjtBQUFBLFFBQ3hDO0FBQUEsTUFDRixTQUFTLEtBQVA7QUFBQSxNQUFhO0FBQUEsSUFDakI7QUFBQSxJQUNBLGNBQWMsU0FBUyxhQUFhLFVBQVUsS0FBSztBQUNqRCw0QkFBc0I7QUFDdEIsVUFBSSxVQUFVLFFBQVE7QUFDcEIsUUFBQUEsYUFBWSxlQUFlLE1BQU07QUFBQSxVQUMvQjtBQUFBLFFBQ0YsQ0FBQztBQUNELFlBQUksS0FBSyxpQkFBaUI7QUFDeEIsYUFBRyxVQUFVLFlBQVkscUJBQXFCO0FBQUEsUUFDaEQ7QUFDQSxZQUFJLFVBQVUsS0FBSztBQUduQixTQUFDLFlBQVksWUFBWSxRQUFRLFFBQVEsV0FBVyxLQUFLO0FBQ3pELG9CQUFZLFFBQVEsUUFBUSxZQUFZLElBQUk7QUFDNUMsaUJBQVMsU0FBUztBQUNsQixvQkFBWSxLQUFLLGFBQWE7QUFHOUIsdUJBQWU7QUFBQSxVQUNiLFVBQVU7QUFBQSxVQUNWLE1BQU07QUFBQSxVQUNOLGVBQWU7QUFBQSxRQUNqQixDQUFDO0FBQUEsTUFDSCxPQUFPO0FBQ0wsYUFBSyxTQUFTO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsSUFDQSxrQkFBa0IsU0FBUyxtQkFBbUI7QUFDNUMsVUFBSSxVQUFVO0FBQ1osYUFBSyxTQUFTLFNBQVM7QUFDdkIsYUFBSyxTQUFTLFNBQVM7QUFDdkIsNEJBQW9CO0FBQ3BCLFlBQUksU0FBUyxTQUFTLGlCQUFpQixTQUFTLFNBQVMsU0FBUyxPQUFPO0FBQ3pFLFlBQUksU0FBUztBQUNiLGVBQU8sVUFBVSxPQUFPLFlBQVk7QUFDbEMsbUJBQVMsT0FBTyxXQUFXLGlCQUFpQixTQUFTLFNBQVMsU0FBUyxPQUFPO0FBQzlFLGNBQUksV0FBVztBQUFRO0FBQ3ZCLG1CQUFTO0FBQUEsUUFDWDtBQUNBLGVBQU8sV0FBVyxPQUFPLEVBQUUsaUJBQWlCLE1BQU07QUFDbEQsWUFBSSxRQUFRO0FBQ1YsYUFBRztBQUNELGdCQUFJLE9BQU8sT0FBTyxHQUFHO0FBQ25CLGtCQUFJLFdBQVc7QUFDZix5QkFBVyxPQUFPLE9BQU8sRUFBRSxZQUFZO0FBQUEsZ0JBQ3JDLFNBQVMsU0FBUztBQUFBLGdCQUNsQixTQUFTLFNBQVM7QUFBQSxnQkFDbEI7QUFBQSxnQkFDQSxRQUFRO0FBQUEsY0FDVixDQUFDO0FBQ0Qsa0JBQUksWUFBWSxDQUFDLEtBQUssUUFBUSxnQkFBZ0I7QUFDNUM7QUFBQSxjQUNGO0FBQUEsWUFDRjtBQUNBLHFCQUFTO0FBQUEsVUFDWCxTQUM4QixTQUFTLE9BQU87QUFBQSxRQUNoRDtBQUNBLDhCQUFzQjtBQUFBLE1BQ3hCO0FBQUEsSUFDRjtBQUFBLElBQ0EsY0FBYyxTQUFTLGFBQTZCLEtBQUs7QUFDdkQsVUFBSSxRQUFRO0FBQ1YsWUFBSSxVQUFVLEtBQUssU0FDakIsb0JBQW9CLFFBQVEsbUJBQzVCLGlCQUFpQixRQUFRLGdCQUN6QixRQUFRLElBQUksVUFBVSxJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQ3ZDLGNBQWMsV0FBVyxPQUFPLFNBQVMsSUFBSSxHQUM3QyxTQUFTLFdBQVcsZUFBZSxZQUFZLEdBQy9DLFNBQVMsV0FBVyxlQUFlLFlBQVksR0FDL0MsdUJBQXVCLDJCQUEyQix1QkFBdUIsd0JBQXdCLG1CQUFtQixHQUNwSCxNQUFNLE1BQU0sVUFBVSxPQUFPLFVBQVUsZUFBZSxNQUFNLFVBQVUsTUFBTSx1QkFBdUIscUJBQXFCLENBQUMsSUFBSSxpQ0FBaUMsQ0FBQyxJQUFJLE1BQU0sVUFBVSxJQUNuTCxNQUFNLE1BQU0sVUFBVSxPQUFPLFVBQVUsZUFBZSxNQUFNLFVBQVUsTUFBTSx1QkFBdUIscUJBQXFCLENBQUMsSUFBSSxpQ0FBaUMsQ0FBQyxJQUFJLE1BQU0sVUFBVTtBQUdyTCxZQUFJLENBQUMsU0FBUyxVQUFVLENBQUMscUJBQXFCO0FBQzVDLGNBQUkscUJBQXFCLEtBQUssSUFBSSxLQUFLLElBQUksTUFBTSxVQUFVLEtBQUssTUFBTSxHQUFHLEtBQUssSUFBSSxNQUFNLFVBQVUsS0FBSyxNQUFNLENBQUMsSUFBSSxtQkFBbUI7QUFDbkk7QUFBQSxVQUNGO0FBQ0EsZUFBSyxhQUFhLEtBQUssSUFBSTtBQUFBLFFBQzdCO0FBQ0EsWUFBSSxTQUFTO0FBQ1gsY0FBSSxhQUFhO0FBQ2Ysd0JBQVksS0FBSyxNQUFNLFVBQVU7QUFDakMsd0JBQVksS0FBSyxNQUFNLFVBQVU7QUFBQSxVQUNuQyxPQUFPO0FBQ0wsMEJBQWM7QUFBQSxjQUNaLEdBQUc7QUFBQSxjQUNILEdBQUc7QUFBQSxjQUNILEdBQUc7QUFBQSxjQUNILEdBQUc7QUFBQSxjQUNILEdBQUc7QUFBQSxjQUNILEdBQUc7QUFBQSxZQUNMO0FBQUEsVUFDRjtBQUNBLGNBQUksWUFBWSxVQUFVLE9BQU8sWUFBWSxHQUFHLEdBQUcsRUFBRSxPQUFPLFlBQVksR0FBRyxHQUFHLEVBQUUsT0FBTyxZQUFZLEdBQUcsR0FBRyxFQUFFLE9BQU8sWUFBWSxHQUFHLEdBQUcsRUFBRSxPQUFPLFlBQVksR0FBRyxHQUFHLEVBQUUsT0FBTyxZQUFZLEdBQUcsR0FBRztBQUMxTCxjQUFJLFNBQVMsbUJBQW1CLFNBQVM7QUFDekMsY0FBSSxTQUFTLGdCQUFnQixTQUFTO0FBQ3RDLGNBQUksU0FBUyxlQUFlLFNBQVM7QUFDckMsY0FBSSxTQUFTLGFBQWEsU0FBUztBQUNuQyxtQkFBUztBQUNULG1CQUFTO0FBQ1QscUJBQVc7QUFBQSxRQUNiO0FBQ0EsWUFBSSxjQUFjLElBQUksZUFBZTtBQUFBLE1BQ3ZDO0FBQUEsSUFDRjtBQUFBLElBQ0EsY0FBYyxTQUFTLGVBQWU7QUFHcEMsVUFBSSxDQUFDLFNBQVM7QUFDWixZQUFJLFlBQVksS0FBSyxRQUFRLGlCQUFpQixTQUFTLE9BQU8sUUFDNUQsT0FBTyxRQUFRLFFBQVEsTUFBTSx5QkFBeUIsTUFBTSxTQUFTLEdBQ3JFLFVBQVUsS0FBSztBQUdqQixZQUFJLHlCQUF5QjtBQUUzQixnQ0FBc0I7QUFDdEIsaUJBQU8sSUFBSSxxQkFBcUIsVUFBVSxNQUFNLFlBQVksSUFBSSxxQkFBcUIsV0FBVyxNQUFNLFVBQVUsd0JBQXdCLFVBQVU7QUFDaEosa0NBQXNCLG9CQUFvQjtBQUFBLFVBQzVDO0FBQ0EsY0FBSSx3QkFBd0IsU0FBUyxRQUFRLHdCQUF3QixTQUFTLGlCQUFpQjtBQUM3RixnQkFBSSx3QkFBd0I7QUFBVSxvQ0FBc0IsMEJBQTBCO0FBQ3RGLGlCQUFLLE9BQU8sb0JBQW9CO0FBQ2hDLGlCQUFLLFFBQVEsb0JBQW9CO0FBQUEsVUFDbkMsT0FBTztBQUNMLGtDQUFzQiwwQkFBMEI7QUFBQSxVQUNsRDtBQUNBLDZDQUFtQyx3QkFBd0IsbUJBQW1CO0FBQUEsUUFDaEY7QUFDQSxrQkFBVSxPQUFPLFVBQVUsSUFBSTtBQUMvQixvQkFBWSxTQUFTLFFBQVEsWUFBWSxLQUFLO0FBQzlDLG9CQUFZLFNBQVMsUUFBUSxlQUFlLElBQUk7QUFDaEQsb0JBQVksU0FBUyxRQUFRLFdBQVcsSUFBSTtBQUM1QyxZQUFJLFNBQVMsY0FBYyxFQUFFO0FBQzdCLFlBQUksU0FBUyxhQUFhLEVBQUU7QUFDNUIsWUFBSSxTQUFTLGNBQWMsWUFBWTtBQUN2QyxZQUFJLFNBQVMsVUFBVSxDQUFDO0FBQ3hCLFlBQUksU0FBUyxPQUFPLEtBQUssR0FBRztBQUM1QixZQUFJLFNBQVMsUUFBUSxLQUFLLElBQUk7QUFDOUIsWUFBSSxTQUFTLFNBQVMsS0FBSyxLQUFLO0FBQ2hDLFlBQUksU0FBUyxVQUFVLEtBQUssTUFBTTtBQUNsQyxZQUFJLFNBQVMsV0FBVyxLQUFLO0FBQzdCLFlBQUksU0FBUyxZQUFZLDBCQUEwQixhQUFhLE9BQU87QUFDdkUsWUFBSSxTQUFTLFVBQVUsUUFBUTtBQUMvQixZQUFJLFNBQVMsaUJBQWlCLE1BQU07QUFDcEMsaUJBQVMsUUFBUTtBQUNqQixrQkFBVSxZQUFZLE9BQU87QUFHN0IsWUFBSSxTQUFTLG9CQUFvQixrQkFBa0IsU0FBUyxRQUFRLE1BQU0sS0FBSyxJQUFJLE1BQU0sT0FBTyxpQkFBaUIsU0FBUyxRQUFRLE1BQU0sTUFBTSxJQUFJLE1BQU0sR0FBRztBQUFBLE1BQzdKO0FBQUEsSUFDRjtBQUFBLElBQ0EsY0FBYyxTQUFTLGFBQXdCLEtBQWlCLFVBQVU7QUFDeEUsVUFBSSxRQUFRO0FBQ1osVUFBSSxlQUFlLElBQUk7QUFDdkIsVUFBSSxVQUFVLE1BQU07QUFDcEIsTUFBQUEsYUFBWSxhQUFhLE1BQU07QUFBQSxRQUM3QjtBQUFBLE1BQ0YsQ0FBQztBQUNELFVBQUksU0FBUyxlQUFlO0FBQzFCLGFBQUssUUFBUTtBQUNiO0FBQUEsTUFDRjtBQUNBLE1BQUFBLGFBQVksY0FBYyxJQUFJO0FBQzlCLFVBQUksQ0FBQyxTQUFTLGVBQWU7QUFDM0Isa0JBQVUsTUFBTSxNQUFNO0FBQ3RCLGdCQUFRLGdCQUFnQixJQUFJO0FBQzVCLGdCQUFRLFlBQVk7QUFDcEIsZ0JBQVEsTUFBTSxhQUFhLElBQUk7QUFDL0IsYUFBSyxXQUFXO0FBQ2hCLG9CQUFZLFNBQVMsS0FBSyxRQUFRLGFBQWEsS0FBSztBQUNwRCxpQkFBUyxRQUFRO0FBQUEsTUFDbkI7QUFHQSxZQUFNLFVBQVUsVUFBVSxXQUFZO0FBQ3BDLFFBQUFBLGFBQVksU0FBUyxLQUFLO0FBQzFCLFlBQUksU0FBUztBQUFlO0FBQzVCLFlBQUksQ0FBQyxNQUFNLFFBQVEsbUJBQW1CO0FBQ3BDLGlCQUFPLGFBQWEsU0FBUyxNQUFNO0FBQUEsUUFDckM7QUFDQSxjQUFNLFdBQVc7QUFDakIsdUJBQWU7QUFBQSxVQUNiLFVBQVU7QUFBQSxVQUNWLE1BQU07QUFBQSxRQUNSLENBQUM7QUFBQSxNQUNILENBQUM7QUFDRCxPQUFDLFlBQVksWUFBWSxRQUFRLFFBQVEsV0FBVyxJQUFJO0FBR3hELFVBQUksVUFBVTtBQUNaLDBCQUFrQjtBQUNsQixjQUFNLFVBQVUsWUFBWSxNQUFNLGtCQUFrQixFQUFFO0FBQUEsTUFDeEQsT0FBTztBQUVMLFlBQUksVUFBVSxXQUFXLE1BQU0sT0FBTztBQUN0QyxZQUFJLFVBQVUsWUFBWSxNQUFNLE9BQU87QUFDdkMsWUFBSSxVQUFVLGVBQWUsTUFBTSxPQUFPO0FBQzFDLFlBQUksY0FBYztBQUNoQix1QkFBYSxnQkFBZ0I7QUFDN0Isa0JBQVEsV0FBVyxRQUFRLFFBQVEsS0FBSyxPQUFPLGNBQWMsTUFBTTtBQUFBLFFBQ3JFO0FBQ0EsV0FBRyxVQUFVLFFBQVEsS0FBSztBQUcxQixZQUFJLFFBQVEsYUFBYSxlQUFlO0FBQUEsTUFDMUM7QUFDQSw0QkFBc0I7QUFDdEIsWUFBTSxlQUFlLFVBQVUsTUFBTSxhQUFhLEtBQUssT0FBTyxVQUFVLEdBQUcsQ0FBQztBQUM1RSxTQUFHLFVBQVUsZUFBZSxLQUFLO0FBQ2pDLGNBQVE7QUFDUixVQUFJLFFBQVE7QUFDVixZQUFJLFNBQVMsTUFBTSxlQUFlLE1BQU07QUFBQSxNQUMxQztBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsYUFBYSxTQUFTLFlBQXVCLEtBQUs7QUFDaEQsVUFBSSxLQUFLLEtBQUssSUFDWixTQUFTLElBQUksUUFDYixVQUNBLFlBQ0EsUUFDQSxVQUFVLEtBQUssU0FDZixRQUFRLFFBQVEsT0FDaEIsaUJBQWlCLFNBQVMsUUFDMUIsVUFBVSxnQkFBZ0IsT0FDMUIsVUFBVSxRQUFRLE1BQ2xCLGVBQWUsZUFBZSxnQkFDOUIsVUFDQSxRQUFRLE1BQ1IsaUJBQWlCO0FBQ25CLFVBQUk7QUFBUztBQUNiLGVBQVMsY0FBYyxNQUFNLE9BQU87QUFDbEMsUUFBQUEsYUFBWSxNQUFNLE9BQU8sZUFBZTtBQUFBLFVBQ3RDO0FBQUEsVUFDQTtBQUFBLFVBQ0EsTUFBTSxXQUFXLGFBQWE7QUFBQSxVQUM5QjtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0EsUUFBUSxTQUFTLE9BQU9XLFNBQVFDLFFBQU87QUFDckMsbUJBQU8sUUFBUSxRQUFRLElBQUksUUFBUSxVQUFVRCxTQUFRLFFBQVFBLE9BQU0sR0FBRyxLQUFLQyxNQUFLO0FBQUEsVUFDbEY7QUFBQSxVQUNBO0FBQUEsUUFDRixHQUFHLEtBQUssQ0FBQztBQUFBLE1BQ1g7QUFHQSxlQUFTLFVBQVU7QUFDakIsc0JBQWMsMEJBQTBCO0FBQ3hDLGNBQU0sc0JBQXNCO0FBQzVCLFlBQUksVUFBVSxjQUFjO0FBQzFCLHVCQUFhLHNCQUFzQjtBQUFBLFFBQ3JDO0FBQUEsTUFDRjtBQUdBLGVBQVMsVUFBVSxXQUFXO0FBQzVCLHNCQUFjLHFCQUFxQjtBQUFBLFVBQ2pDO0FBQUEsUUFDRixDQUFDO0FBQ0QsWUFBSSxXQUFXO0FBRWIsY0FBSSxTQUFTO0FBQ1gsMkJBQWUsV0FBVztBQUFBLFVBQzVCLE9BQU87QUFDTCwyQkFBZSxXQUFXLEtBQUs7QUFBQSxVQUNqQztBQUNBLGNBQUksVUFBVSxjQUFjO0FBRTFCLHdCQUFZLFFBQVEsY0FBYyxZQUFZLFFBQVEsYUFBYSxlQUFlLFFBQVEsWUFBWSxLQUFLO0FBQzNHLHdCQUFZLFFBQVEsUUFBUSxZQUFZLElBQUk7QUFBQSxVQUM5QztBQUNBLGNBQUksZ0JBQWdCLFNBQVMsVUFBVSxTQUFTLFFBQVE7QUFDdEQsMEJBQWM7QUFBQSxVQUNoQixXQUFXLFVBQVUsU0FBUyxVQUFVLGFBQWE7QUFDbkQsMEJBQWM7QUFBQSxVQUNoQjtBQUdBLGNBQUksaUJBQWlCLE9BQU87QUFDMUIsa0JBQU0sd0JBQXdCO0FBQUEsVUFDaEM7QUFDQSxnQkFBTSxXQUFXLFdBQVk7QUFDM0IsMEJBQWMsMkJBQTJCO0FBQ3pDLGtCQUFNLHdCQUF3QjtBQUFBLFVBQ2hDLENBQUM7QUFDRCxjQUFJLFVBQVUsY0FBYztBQUMxQix5QkFBYSxXQUFXO0FBQ3hCLHlCQUFhLHdCQUF3QjtBQUFBLFVBQ3ZDO0FBQUEsUUFDRjtBQUdBLFlBQUksV0FBVyxVQUFVLENBQUMsT0FBTyxZQUFZLFdBQVcsTUFBTSxDQUFDLE9BQU8sVUFBVTtBQUM5RSx1QkFBYTtBQUFBLFFBQ2Y7QUFHQSxZQUFJLENBQUMsUUFBUSxrQkFBa0IsQ0FBQyxJQUFJLFVBQVUsV0FBVyxVQUFVO0FBQ2pFLGlCQUFPLFdBQVcsT0FBTyxFQUFFLGlCQUFpQixJQUFJLE1BQU07QUFHdEQsV0FBQyxhQUFhLDhCQUE4QixHQUFHO0FBQUEsUUFDakQ7QUFDQSxTQUFDLFFBQVEsa0JBQWtCLElBQUksbUJBQW1CLElBQUksZ0JBQWdCO0FBQ3RFLGVBQU8saUJBQWlCO0FBQUEsTUFDMUI7QUFHQSxlQUFTLFVBQVU7QUFDakIsbUJBQVcsTUFBTSxNQUFNO0FBQ3ZCLDRCQUFvQixNQUFNLFFBQVEsUUFBUSxTQUFTO0FBQ25ELHVCQUFlO0FBQUEsVUFDYixVQUFVO0FBQUEsVUFDVixNQUFNO0FBQUEsVUFDTixNQUFNO0FBQUEsVUFDTjtBQUFBLFVBQ0E7QUFBQSxVQUNBLGVBQWU7QUFBQSxRQUNqQixDQUFDO0FBQUEsTUFDSDtBQUNBLFVBQUksSUFBSSxtQkFBbUIsUUFBUTtBQUNqQyxZQUFJLGNBQWMsSUFBSSxlQUFlO0FBQUEsTUFDdkM7QUFDQSxlQUFTLFFBQVEsUUFBUSxRQUFRLFdBQVcsSUFBSSxJQUFJO0FBQ3BELG9CQUFjLFVBQVU7QUFDeEIsVUFBSSxTQUFTO0FBQWUsZUFBTztBQUNuQyxVQUFJLE9BQU8sU0FBUyxJQUFJLE1BQU0sS0FBSyxPQUFPLFlBQVksT0FBTyxjQUFjLE9BQU8sY0FBYyxNQUFNLDBCQUEwQixRQUFRO0FBQ3RJLGVBQU8sVUFBVSxLQUFLO0FBQUEsTUFDeEI7QUFDQSx3QkFBa0I7QUFDbEIsVUFBSSxrQkFBa0IsQ0FBQyxRQUFRLGFBQWEsVUFBVSxZQUFZLFNBQVMsYUFBYSxVQUN0RixnQkFBZ0IsU0FBUyxLQUFLLGNBQWMsWUFBWSxVQUFVLE1BQU0sZ0JBQWdCLFFBQVEsR0FBRyxNQUFNLE1BQU0sU0FBUyxNQUFNLGdCQUFnQixRQUFRLEdBQUcsSUFBSTtBQUM3SixtQkFBVyxLQUFLLGNBQWMsS0FBSyxNQUFNLE1BQU07QUFDL0MsbUJBQVcsUUFBUSxNQUFNO0FBQ3pCLHNCQUFjLGVBQWU7QUFDN0IsWUFBSSxTQUFTO0FBQWUsaUJBQU87QUFDbkMsWUFBSSxRQUFRO0FBQ1YscUJBQVc7QUFDWCxrQkFBUTtBQUNSLGVBQUssV0FBVztBQUNoQix3QkFBYyxRQUFRO0FBQ3RCLGNBQUksQ0FBQyxTQUFTLGVBQWU7QUFDM0IsZ0JBQUksUUFBUTtBQUNWLHFCQUFPLGFBQWEsUUFBUSxNQUFNO0FBQUEsWUFDcEMsT0FBTztBQUNMLHFCQUFPLFlBQVksTUFBTTtBQUFBLFlBQzNCO0FBQUEsVUFDRjtBQUNBLGlCQUFPLFVBQVUsSUFBSTtBQUFBLFFBQ3ZCO0FBQ0EsWUFBSSxjQUFjLFVBQVUsSUFBSSxRQUFRLFNBQVM7QUFDakQsWUFBSSxDQUFDLGVBQWUsYUFBYSxLQUFLLFVBQVUsSUFBSSxLQUFLLENBQUMsWUFBWSxVQUFVO0FBSTlFLGNBQUksZ0JBQWdCLFFBQVE7QUFDMUIsbUJBQU8sVUFBVSxLQUFLO0FBQUEsVUFDeEI7QUFHQSxjQUFJLGVBQWUsT0FBTyxJQUFJLFFBQVE7QUFDcEMscUJBQVM7QUFBQSxVQUNYO0FBQ0EsY0FBSSxRQUFRO0FBQ1YseUJBQWEsUUFBUSxNQUFNO0FBQUEsVUFDN0I7QUFDQSxjQUFJLFFBQVEsUUFBUSxJQUFJLFFBQVEsVUFBVSxRQUFRLFlBQVksS0FBSyxDQUFDLENBQUMsTUFBTSxNQUFNLE9BQU87QUFDdEYsb0JBQVE7QUFDUixnQkFBSSxlQUFlLFlBQVksYUFBYTtBQUUxQyxpQkFBRyxhQUFhLFFBQVEsWUFBWSxXQUFXO0FBQUEsWUFDakQsT0FBTztBQUNMLGlCQUFHLFlBQVksTUFBTTtBQUFBLFlBQ3ZCO0FBQ0EsdUJBQVc7QUFFWCxvQkFBUTtBQUNSLG1CQUFPLFVBQVUsSUFBSTtBQUFBLFVBQ3ZCO0FBQUEsUUFDRixXQUFXLGVBQWUsY0FBYyxLQUFLLFVBQVUsSUFBSSxHQUFHO0FBRTVELGNBQUksYUFBYSxTQUFTLElBQUksR0FBRyxTQUFTLElBQUk7QUFDOUMsY0FBSSxlQUFlLFFBQVE7QUFDekIsbUJBQU8sVUFBVSxLQUFLO0FBQUEsVUFDeEI7QUFDQSxtQkFBUztBQUNULHVCQUFhLFFBQVEsTUFBTTtBQUMzQixjQUFJLFFBQVEsUUFBUSxJQUFJLFFBQVEsVUFBVSxRQUFRLFlBQVksS0FBSyxLQUFLLE1BQU0sT0FBTztBQUNuRixvQkFBUTtBQUNSLGVBQUcsYUFBYSxRQUFRLFVBQVU7QUFDbEMsdUJBQVc7QUFFWCxvQkFBUTtBQUNSLG1CQUFPLFVBQVUsSUFBSTtBQUFBLFVBQ3ZCO0FBQUEsUUFDRixXQUFXLE9BQU8sZUFBZSxJQUFJO0FBQ25DLHVCQUFhLFFBQVEsTUFBTTtBQUMzQixjQUFJLFlBQVksR0FDZCx1QkFDQSxpQkFBaUIsT0FBTyxlQUFlLElBQ3ZDLGtCQUFrQixDQUFDLG1CQUFtQixPQUFPLFlBQVksT0FBTyxVQUFVLFVBQVUsT0FBTyxZQUFZLE9BQU8sVUFBVSxZQUFZLFFBQVEsR0FDNUksUUFBUSxXQUFXLFFBQVEsUUFDM0Isa0JBQWtCLGVBQWUsUUFBUSxPQUFPLEtBQUssS0FBSyxlQUFlLFFBQVEsT0FBTyxLQUFLLEdBQzdGLGVBQWUsa0JBQWtCLGdCQUFnQixZQUFZO0FBQy9ELGNBQUksZUFBZSxRQUFRO0FBQ3pCLG9DQUF3QixXQUFXLEtBQUs7QUFDeEMsb0NBQXdCO0FBQ3hCLHFDQUF5QixDQUFDLG1CQUFtQixRQUFRLGNBQWM7QUFBQSxVQUNyRTtBQUNBLHNCQUFZLGtCQUFrQixLQUFLLFFBQVEsWUFBWSxVQUFVLGtCQUFrQixJQUFJLFFBQVEsZUFBZSxRQUFRLHlCQUF5QixPQUFPLFFBQVEsZ0JBQWdCLFFBQVEsdUJBQXVCLHdCQUF3QixlQUFlLE1BQU07QUFDMVAsY0FBSTtBQUNKLGNBQUksY0FBYyxHQUFHO0FBRW5CLGdCQUFJLFlBQVksTUFBTSxNQUFNO0FBQzVCLGVBQUc7QUFDRCwyQkFBYTtBQUNiLHdCQUFVLFNBQVMsU0FBUyxTQUFTO0FBQUEsWUFDdkMsU0FBUyxZQUFZLElBQUksU0FBUyxTQUFTLE1BQU0sVUFBVSxZQUFZO0FBQUEsVUFDekU7QUFFQSxjQUFJLGNBQWMsS0FBSyxZQUFZLFFBQVE7QUFDekMsbUJBQU8sVUFBVSxLQUFLO0FBQUEsVUFDeEI7QUFDQSx1QkFBYTtBQUNiLDBCQUFnQjtBQUNoQixjQUFJLGNBQWMsT0FBTyxvQkFDdkIsUUFBUTtBQUNWLGtCQUFRLGNBQWM7QUFDdEIsY0FBSSxhQUFhLFFBQVEsUUFBUSxJQUFJLFFBQVEsVUFBVSxRQUFRLFlBQVksS0FBSyxLQUFLO0FBQ3JGLGNBQUksZUFBZSxPQUFPO0FBQ3hCLGdCQUFJLGVBQWUsS0FBSyxlQUFlLElBQUk7QUFDekMsc0JBQVEsZUFBZTtBQUFBLFlBQ3pCO0FBQ0Esc0JBQVU7QUFDVix1QkFBVyxXQUFXLEVBQUU7QUFDeEIsb0JBQVE7QUFDUixnQkFBSSxTQUFTLENBQUMsYUFBYTtBQUN6QixpQkFBRyxZQUFZLE1BQU07QUFBQSxZQUN2QixPQUFPO0FBQ0wscUJBQU8sV0FBVyxhQUFhLFFBQVEsUUFBUSxjQUFjLE1BQU07QUFBQSxZQUNyRTtBQUdBLGdCQUFJLGlCQUFpQjtBQUNuQix1QkFBUyxpQkFBaUIsR0FBRyxlQUFlLGdCQUFnQixTQUFTO0FBQUEsWUFDdkU7QUFDQSx1QkFBVyxPQUFPO0FBR2xCLGdCQUFJLDBCQUEwQixVQUFhLENBQUMsd0JBQXdCO0FBQ2xFLG1DQUFxQixLQUFLLElBQUksd0JBQXdCLFFBQVEsTUFBTSxFQUFFLEtBQUssQ0FBQztBQUFBLFlBQzlFO0FBQ0Esb0JBQVE7QUFDUixtQkFBTyxVQUFVLElBQUk7QUFBQSxVQUN2QjtBQUFBLFFBQ0Y7QUFDQSxZQUFJLEdBQUcsU0FBUyxNQUFNLEdBQUc7QUFDdkIsaUJBQU8sVUFBVSxLQUFLO0FBQUEsUUFDeEI7QUFBQSxNQUNGO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFBQSxJQUNBLHVCQUF1QjtBQUFBLElBQ3ZCLGdCQUFnQixTQUFTLGlCQUFpQjtBQUN4QyxVQUFJLFVBQVUsYUFBYSxLQUFLLFlBQVk7QUFDNUMsVUFBSSxVQUFVLGFBQWEsS0FBSyxZQUFZO0FBQzVDLFVBQUksVUFBVSxlQUFlLEtBQUssWUFBWTtBQUM5QyxVQUFJLFVBQVUsWUFBWSw2QkFBNkI7QUFDdkQsVUFBSSxVQUFVLGFBQWEsNkJBQTZCO0FBQ3hELFVBQUksVUFBVSxhQUFhLDZCQUE2QjtBQUFBLElBQzFEO0FBQUEsSUFDQSxjQUFjLFNBQVMsZUFBZTtBQUNwQyxVQUFJLGdCQUFnQixLQUFLLEdBQUc7QUFDNUIsVUFBSSxlQUFlLFdBQVcsS0FBSyxPQUFPO0FBQzFDLFVBQUksZUFBZSxZQUFZLEtBQUssT0FBTztBQUMzQyxVQUFJLGVBQWUsYUFBYSxLQUFLLE9BQU87QUFDNUMsVUFBSSxlQUFlLGVBQWUsS0FBSyxPQUFPO0FBQzlDLFVBQUksVUFBVSxlQUFlLElBQUk7QUFBQSxJQUNuQztBQUFBLElBQ0EsU0FBUyxTQUFTLFFBQW1CLEtBQUs7QUFDeEMsVUFBSSxLQUFLLEtBQUssSUFDWixVQUFVLEtBQUs7QUFHakIsaUJBQVcsTUFBTSxNQUFNO0FBQ3ZCLDBCQUFvQixNQUFNLFFBQVEsUUFBUSxTQUFTO0FBQ25ELE1BQUFaLGFBQVksUUFBUSxNQUFNO0FBQUEsUUFDeEI7QUFBQSxNQUNGLENBQUM7QUFDRCxpQkFBVyxVQUFVLE9BQU87QUFHNUIsaUJBQVcsTUFBTSxNQUFNO0FBQ3ZCLDBCQUFvQixNQUFNLFFBQVEsUUFBUSxTQUFTO0FBQ25ELFVBQUksU0FBUyxlQUFlO0FBQzFCLGFBQUssU0FBUztBQUNkO0FBQUEsTUFDRjtBQUNBLDRCQUFzQjtBQUN0QiwrQkFBeUI7QUFDekIsOEJBQXdCO0FBQ3hCLG9CQUFjLEtBQUssT0FBTztBQUMxQixtQkFBYSxLQUFLLGVBQWU7QUFDakMsc0JBQWdCLEtBQUssT0FBTztBQUM1QixzQkFBZ0IsS0FBSyxZQUFZO0FBR2pDLFVBQUksS0FBSyxpQkFBaUI7QUFDeEIsWUFBSSxVQUFVLFFBQVEsSUFBSTtBQUMxQixZQUFJLElBQUksYUFBYSxLQUFLLFlBQVk7QUFBQSxNQUN4QztBQUNBLFdBQUssZUFBZTtBQUNwQixXQUFLLGFBQWE7QUFDbEIsVUFBSSxRQUFRO0FBQ1YsWUFBSSxTQUFTLE1BQU0sZUFBZSxFQUFFO0FBQUEsTUFDdEM7QUFDQSxVQUFJLFFBQVEsYUFBYSxFQUFFO0FBQzNCLFVBQUksS0FBSztBQUNQLFlBQUksT0FBTztBQUNULGNBQUksY0FBYyxJQUFJLGVBQWU7QUFDckMsV0FBQyxRQUFRLGNBQWMsSUFBSSxnQkFBZ0I7QUFBQSxRQUM3QztBQUNBLG1CQUFXLFFBQVEsY0FBYyxRQUFRLFdBQVcsWUFBWSxPQUFPO0FBQ3ZFLFlBQUksV0FBVyxZQUFZLGVBQWUsWUFBWSxnQkFBZ0IsU0FBUztBQUU3RSxxQkFBVyxRQUFRLGNBQWMsUUFBUSxXQUFXLFlBQVksT0FBTztBQUFBLFFBQ3pFO0FBQ0EsWUFBSSxRQUFRO0FBQ1YsY0FBSSxLQUFLLGlCQUFpQjtBQUN4QixnQkFBSSxRQUFRLFdBQVcsSUFBSTtBQUFBLFVBQzdCO0FBQ0EsNEJBQWtCLE1BQU07QUFDeEIsaUJBQU8sTUFBTSxhQUFhLElBQUk7QUFJOUIsY0FBSSxTQUFTLENBQUMscUJBQXFCO0FBQ2pDLHdCQUFZLFFBQVEsY0FBYyxZQUFZLFFBQVEsYUFBYSxLQUFLLFFBQVEsWUFBWSxLQUFLO0FBQUEsVUFDbkc7QUFDQSxzQkFBWSxRQUFRLEtBQUssUUFBUSxhQUFhLEtBQUs7QUFHbkQseUJBQWU7QUFBQSxZQUNiLFVBQVU7QUFBQSxZQUNWLE1BQU07QUFBQSxZQUNOLE1BQU07QUFBQSxZQUNOLFVBQVU7QUFBQSxZQUNWLG1CQUFtQjtBQUFBLFlBQ25CLGVBQWU7QUFBQSxVQUNqQixDQUFDO0FBQ0QsY0FBSSxXQUFXLFVBQVU7QUFDdkIsZ0JBQUksWUFBWSxHQUFHO0FBRWpCLDZCQUFlO0FBQUEsZ0JBQ2IsUUFBUTtBQUFBLGdCQUNSLE1BQU07QUFBQSxnQkFDTixNQUFNO0FBQUEsZ0JBQ04sUUFBUTtBQUFBLGdCQUNSLGVBQWU7QUFBQSxjQUNqQixDQUFDO0FBR0QsNkJBQWU7QUFBQSxnQkFDYixVQUFVO0FBQUEsZ0JBQ1YsTUFBTTtBQUFBLGdCQUNOLE1BQU07QUFBQSxnQkFDTixlQUFlO0FBQUEsY0FDakIsQ0FBQztBQUdELDZCQUFlO0FBQUEsZ0JBQ2IsUUFBUTtBQUFBLGdCQUNSLE1BQU07QUFBQSxnQkFDTixNQUFNO0FBQUEsZ0JBQ04sUUFBUTtBQUFBLGdCQUNSLGVBQWU7QUFBQSxjQUNqQixDQUFDO0FBQ0QsNkJBQWU7QUFBQSxnQkFDYixVQUFVO0FBQUEsZ0JBQ1YsTUFBTTtBQUFBLGdCQUNOLE1BQU07QUFBQSxnQkFDTixlQUFlO0FBQUEsY0FDakIsQ0FBQztBQUFBLFlBQ0g7QUFDQSwyQkFBZSxZQUFZLEtBQUs7QUFBQSxVQUNsQyxPQUFPO0FBQ0wsZ0JBQUksYUFBYSxVQUFVO0FBQ3pCLGtCQUFJLFlBQVksR0FBRztBQUVqQiwrQkFBZTtBQUFBLGtCQUNiLFVBQVU7QUFBQSxrQkFDVixNQUFNO0FBQUEsa0JBQ04sTUFBTTtBQUFBLGtCQUNOLGVBQWU7QUFBQSxnQkFDakIsQ0FBQztBQUNELCtCQUFlO0FBQUEsa0JBQ2IsVUFBVTtBQUFBLGtCQUNWLE1BQU07QUFBQSxrQkFDTixNQUFNO0FBQUEsa0JBQ04sZUFBZTtBQUFBLGdCQUNqQixDQUFDO0FBQUEsY0FDSDtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQ0EsY0FBSSxTQUFTLFFBQVE7QUFFbkIsZ0JBQUksWUFBWSxRQUFRLGFBQWEsSUFBSTtBQUN2Qyx5QkFBVztBQUNYLGtDQUFvQjtBQUFBLFlBQ3RCO0FBQ0EsMkJBQWU7QUFBQSxjQUNiLFVBQVU7QUFBQSxjQUNWLE1BQU07QUFBQSxjQUNOLE1BQU07QUFBQSxjQUNOLGVBQWU7QUFBQSxZQUNqQixDQUFDO0FBR0QsaUJBQUssS0FBSztBQUFBLFVBQ1o7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUNBLFdBQUssU0FBUztBQUFBLElBQ2hCO0FBQUEsSUFDQSxVQUFVLFNBQVMsV0FBVztBQUM1QixNQUFBQSxhQUFZLFdBQVcsSUFBSTtBQUMzQixlQUFTLFNBQVMsV0FBVyxVQUFVLFNBQVMsVUFBVSxhQUFhLGNBQWMsU0FBUyxXQUFXLFFBQVEsV0FBVyxvQkFBb0IsV0FBVyxvQkFBb0IsYUFBYSxnQkFBZ0IsY0FBYyxjQUFjLFNBQVMsVUFBVSxTQUFTLFFBQVEsU0FBUyxRQUFRLFNBQVMsU0FBUztBQUMvUyx3QkFBa0IsUUFBUSxTQUFVLElBQUk7QUFDdEMsV0FBRyxVQUFVO0FBQUEsTUFDZixDQUFDO0FBQ0Qsd0JBQWtCLFNBQVMsU0FBUyxTQUFTO0FBQUEsSUFDL0M7QUFBQSxJQUNBLGFBQWEsU0FBUyxZQUF1QixLQUFLO0FBQ2hELGNBQVEsSUFBSSxNQUFNO0FBQUEsUUFDaEIsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUNILGVBQUssUUFBUSxHQUFHO0FBQ2hCO0FBQUEsUUFDRixLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQ0gsY0FBSSxRQUFRO0FBQ1YsaUJBQUssWUFBWSxHQUFHO0FBQ3BCLDRCQUFnQixHQUFHO0FBQUEsVUFDckI7QUFDQTtBQUFBLFFBQ0YsS0FBSztBQUNILGNBQUksZUFBZTtBQUNuQjtBQUFBLE1BQ0o7QUFBQSxJQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUtBLFNBQVMsU0FBUyxVQUFVO0FBQzFCLFVBQUksUUFBUSxDQUFDLEdBQ1gsSUFDQSxXQUFXLEtBQUssR0FBRyxVQUNuQixJQUFJLEdBQ0osSUFBSSxTQUFTLFFBQ2IsVUFBVSxLQUFLO0FBQ2pCLGFBQU8sSUFBSSxHQUFHLEtBQUs7QUFDakIsYUFBSyxTQUFTLENBQUM7QUFDZixZQUFJLFFBQVEsSUFBSSxRQUFRLFdBQVcsS0FBSyxJQUFJLEtBQUssR0FBRztBQUNsRCxnQkFBTSxLQUFLLEdBQUcsYUFBYSxRQUFRLFVBQVUsS0FBSyxZQUFZLEVBQUUsQ0FBQztBQUFBLFFBQ25FO0FBQUEsTUFDRjtBQUNBLGFBQU87QUFBQSxJQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUtBLE1BQU0sU0FBUyxLQUFLLE9BQU8sY0FBYztBQUN2QyxVQUFJLFFBQVEsQ0FBQyxHQUNYUCxVQUFTLEtBQUs7QUFDaEIsV0FBSyxRQUFRLEVBQUUsUUFBUSxTQUFVLElBQUksR0FBRztBQUN0QyxZQUFJLEtBQUtBLFFBQU8sU0FBUyxDQUFDO0FBQzFCLFlBQUksUUFBUSxJQUFJLEtBQUssUUFBUSxXQUFXQSxTQUFRLEtBQUssR0FBRztBQUN0RCxnQkFBTSxFQUFFLElBQUk7QUFBQSxRQUNkO0FBQUEsTUFDRixHQUFHLElBQUk7QUFDUCxzQkFBZ0IsS0FBSyxzQkFBc0I7QUFDM0MsWUFBTSxRQUFRLFNBQVUsSUFBSTtBQUMxQixZQUFJLE1BQU0sRUFBRSxHQUFHO0FBQ2IsVUFBQUEsUUFBTyxZQUFZLE1BQU0sRUFBRSxDQUFDO0FBQzVCLFVBQUFBLFFBQU8sWUFBWSxNQUFNLEVBQUUsQ0FBQztBQUFBLFFBQzlCO0FBQUEsTUFDRixDQUFDO0FBQ0Qsc0JBQWdCLEtBQUssV0FBVztBQUFBLElBQ2xDO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFJQSxNQUFNLFNBQVMsT0FBTztBQUNwQixVQUFJLFFBQVEsS0FBSyxRQUFRO0FBQ3pCLGVBQVMsTUFBTSxPQUFPLE1BQU0sSUFBSSxJQUFJO0FBQUEsSUFDdEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQU9BLFNBQVMsU0FBUyxVQUFVLElBQUksVUFBVTtBQUN4QyxhQUFPLFFBQVEsSUFBSSxZQUFZLEtBQUssUUFBUSxXQUFXLEtBQUssSUFBSSxLQUFLO0FBQUEsSUFDdkU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQU9BLFFBQVEsU0FBUyxPQUFPLE1BQU0sT0FBTztBQUNuQyxVQUFJLFVBQVUsS0FBSztBQUNuQixVQUFJLFVBQVUsUUFBUTtBQUNwQixlQUFPLFFBQVEsSUFBSTtBQUFBLE1BQ3JCLE9BQU87QUFDTCxZQUFJLGdCQUFnQixjQUFjLGFBQWEsTUFBTSxNQUFNLEtBQUs7QUFDaEUsWUFBSSxPQUFPLGtCQUFrQixhQUFhO0FBQ3hDLGtCQUFRLElBQUksSUFBSTtBQUFBLFFBQ2xCLE9BQU87QUFDTCxrQkFBUSxJQUFJLElBQUk7QUFBQSxRQUNsQjtBQUNBLFlBQUksU0FBUyxTQUFTO0FBQ3BCLHdCQUFjLE9BQU87QUFBQSxRQUN2QjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFJQSxTQUFTLFNBQVMsVUFBVTtBQUMxQixNQUFBTyxhQUFZLFdBQVcsSUFBSTtBQUMzQixVQUFJLEtBQUssS0FBSztBQUNkLFNBQUcsT0FBTyxJQUFJO0FBQ2QsVUFBSSxJQUFJLGFBQWEsS0FBSyxXQUFXO0FBQ3JDLFVBQUksSUFBSSxjQUFjLEtBQUssV0FBVztBQUN0QyxVQUFJLElBQUksZUFBZSxLQUFLLFdBQVc7QUFDdkMsVUFBSSxLQUFLLGlCQUFpQjtBQUN4QixZQUFJLElBQUksWUFBWSxJQUFJO0FBQ3hCLFlBQUksSUFBSSxhQUFhLElBQUk7QUFBQSxNQUMzQjtBQUVBLFlBQU0sVUFBVSxRQUFRLEtBQUssR0FBRyxpQkFBaUIsYUFBYSxHQUFHLFNBQVVhLEtBQUk7QUFDN0UsUUFBQUEsSUFBRyxnQkFBZ0IsV0FBVztBQUFBLE1BQ2hDLENBQUM7QUFDRCxXQUFLLFFBQVE7QUFDYixXQUFLLDBCQUEwQjtBQUMvQixnQkFBVSxPQUFPLFVBQVUsUUFBUSxLQUFLLEVBQUUsR0FBRyxDQUFDO0FBQzlDLFdBQUssS0FBSyxLQUFLO0FBQUEsSUFDakI7QUFBQSxJQUNBLFlBQVksU0FBUyxhQUFhO0FBQ2hDLFVBQUksQ0FBQyxhQUFhO0FBQ2hCLFFBQUFiLGFBQVksYUFBYSxJQUFJO0FBQzdCLFlBQUksU0FBUztBQUFlO0FBQzVCLFlBQUksU0FBUyxXQUFXLE1BQU07QUFDOUIsWUFBSSxLQUFLLFFBQVEscUJBQXFCLFFBQVEsWUFBWTtBQUN4RCxrQkFBUSxXQUFXLFlBQVksT0FBTztBQUFBLFFBQ3hDO0FBQ0Esc0JBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFlBQVksU0FBUyxXQUFXRCxjQUFhO0FBQzNDLFVBQUlBLGFBQVksZ0JBQWdCLFNBQVM7QUFDdkMsYUFBSyxXQUFXO0FBQ2hCO0FBQUEsTUFDRjtBQUNBLFVBQUksYUFBYTtBQUNmLFFBQUFDLGFBQVksYUFBYSxJQUFJO0FBQzdCLFlBQUksU0FBUztBQUFlO0FBRzVCLFlBQUksT0FBTyxjQUFjLFVBQVUsQ0FBQyxLQUFLLFFBQVEsTUFBTSxhQUFhO0FBQ2xFLGlCQUFPLGFBQWEsU0FBUyxNQUFNO0FBQUEsUUFDckMsV0FBVyxRQUFRO0FBQ2pCLGlCQUFPLGFBQWEsU0FBUyxNQUFNO0FBQUEsUUFDckMsT0FBTztBQUNMLGlCQUFPLFlBQVksT0FBTztBQUFBLFFBQzVCO0FBQ0EsWUFBSSxLQUFLLFFBQVEsTUFBTSxhQUFhO0FBQ2xDLGVBQUssUUFBUSxRQUFRLE9BQU87QUFBQSxRQUM5QjtBQUNBLFlBQUksU0FBUyxXQUFXLEVBQUU7QUFDMUIsc0JBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0EsV0FBUyxnQkFBMkIsS0FBSztBQUN2QyxRQUFJLElBQUksY0FBYztBQUNwQixVQUFJLGFBQWEsYUFBYTtBQUFBLElBQ2hDO0FBQ0EsUUFBSSxjQUFjLElBQUksZUFBZTtBQUFBLEVBQ3ZDO0FBQ0EsV0FBUyxRQUFRLFFBQVEsTUFBTUssU0FBUSxVQUFVLFVBQVUsWUFBWSxlQUFlLGlCQUFpQjtBQUNyRyxRQUFJLEtBQ0YsV0FBVyxPQUFPLE9BQU8sR0FDekIsV0FBVyxTQUFTLFFBQVEsUUFDNUI7QUFFRixRQUFJLE9BQU8sZUFBZSxDQUFDLGNBQWMsQ0FBQyxNQUFNO0FBQzlDLFlBQU0sSUFBSSxZQUFZLFFBQVE7QUFBQSxRQUM1QixTQUFTO0FBQUEsUUFDVCxZQUFZO0FBQUEsTUFDZCxDQUFDO0FBQUEsSUFDSCxPQUFPO0FBQ0wsWUFBTSxTQUFTLFlBQVksT0FBTztBQUNsQyxVQUFJLFVBQVUsUUFBUSxNQUFNLElBQUk7QUFBQSxJQUNsQztBQUNBLFFBQUksS0FBSztBQUNULFFBQUksT0FBTztBQUNYLFFBQUksVUFBVUE7QUFDZCxRQUFJLGNBQWM7QUFDbEIsUUFBSSxVQUFVLFlBQVk7QUFDMUIsUUFBSSxjQUFjLGNBQWMsUUFBUSxJQUFJO0FBQzVDLFFBQUksa0JBQWtCO0FBQ3RCLFFBQUksZ0JBQWdCO0FBQ3BCLFdBQU8sY0FBYyxHQUFHO0FBQ3hCLFFBQUksVUFBVTtBQUNaLGVBQVMsU0FBUyxLQUFLLFVBQVUsS0FBSyxhQUFhO0FBQUEsSUFDckQ7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUNBLFdBQVMsa0JBQWtCLElBQUk7QUFDN0IsT0FBRyxZQUFZO0FBQUEsRUFDakI7QUFDQSxXQUFTLFlBQVk7QUFDbkIsY0FBVTtBQUFBLEVBQ1o7QUFDQSxXQUFTLGNBQWMsS0FBSyxVQUFVLFVBQVU7QUFDOUMsUUFBSSxjQUFjLFFBQVEsU0FBUyxTQUFTLElBQUksR0FBRyxTQUFTLFNBQVMsSUFBSSxDQUFDO0FBQzFFLFFBQUksc0JBQXNCLGVBQWUsU0FBUyxFQUFFO0FBQ3BELFFBQUksU0FBUztBQUNiLFdBQU8sV0FBVyxJQUFJLFVBQVUsb0JBQW9CLE9BQU8sVUFBVSxJQUFJLFVBQVUsWUFBWSxPQUFPLElBQUksVUFBVSxZQUFZLFFBQVEsSUFBSSxVQUFVLG9CQUFvQixNQUFNLFVBQVUsSUFBSSxVQUFVLFlBQVksVUFBVSxJQUFJLFVBQVUsWUFBWTtBQUFBLEVBQzFQO0FBQ0EsV0FBUyxhQUFhLEtBQUssVUFBVSxVQUFVO0FBQzdDLFFBQUksYUFBYSxRQUFRLFVBQVUsU0FBUyxJQUFJLFNBQVMsUUFBUSxTQUFTLENBQUM7QUFDM0UsUUFBSSxzQkFBc0IsZUFBZSxTQUFTLEVBQUU7QUFDcEQsUUFBSSxTQUFTO0FBQ2IsV0FBTyxXQUFXLElBQUksVUFBVSxvQkFBb0IsUUFBUSxVQUFVLElBQUksVUFBVSxXQUFXLFVBQVUsSUFBSSxVQUFVLFdBQVcsT0FBTyxJQUFJLFVBQVUsb0JBQW9CLFNBQVMsVUFBVSxJQUFJLFVBQVUsV0FBVyxTQUFTLElBQUksVUFBVSxXQUFXO0FBQUEsRUFDM1A7QUFDQSxXQUFTLGtCQUFrQixLQUFLLFFBQVEsWUFBWSxVQUFVLGVBQWUsdUJBQXVCLFlBQVksY0FBYztBQUM1SCxRQUFJLGNBQWMsV0FBVyxJQUFJLFVBQVUsSUFBSSxTQUM3QyxlQUFlLFdBQVcsV0FBVyxTQUFTLFdBQVcsT0FDekQsV0FBVyxXQUFXLFdBQVcsTUFBTSxXQUFXLE1BQ2xELFdBQVcsV0FBVyxXQUFXLFNBQVMsV0FBVyxPQUNyRCxTQUFTO0FBQ1gsUUFBSSxDQUFDLFlBQVk7QUFFZixVQUFJLGdCQUFnQixxQkFBcUIsZUFBZSxlQUFlO0FBR3JFLFlBQUksQ0FBQywwQkFBMEIsa0JBQWtCLElBQUksY0FBYyxXQUFXLGVBQWUsd0JBQXdCLElBQUksY0FBYyxXQUFXLGVBQWUsd0JBQXdCLElBQUk7QUFFM0wsa0NBQXdCO0FBQUEsUUFDMUI7QUFDQSxZQUFJLENBQUMsdUJBQXVCO0FBRTFCLGNBQUksa0JBQWtCLElBQUksY0FBYyxXQUFXLHFCQUNqRCxjQUFjLFdBQVcsb0JBQW9CO0FBQzdDLG1CQUFPLENBQUM7QUFBQSxVQUNWO0FBQUEsUUFDRixPQUFPO0FBQ0wsbUJBQVM7QUFBQSxRQUNYO0FBQUEsTUFDRixPQUFPO0FBRUwsWUFBSSxjQUFjLFdBQVcsZ0JBQWdCLElBQUksaUJBQWlCLEtBQUssY0FBYyxXQUFXLGdCQUFnQixJQUFJLGlCQUFpQixHQUFHO0FBQ3RJLGlCQUFPLG9CQUFvQixNQUFNO0FBQUEsUUFDbkM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUNBLGFBQVMsVUFBVTtBQUNuQixRQUFJLFFBQVE7QUFFVixVQUFJLGNBQWMsV0FBVyxlQUFlLHdCQUF3QixLQUFLLGNBQWMsV0FBVyxlQUFlLHdCQUF3QixHQUFHO0FBQzFJLGVBQU8sY0FBYyxXQUFXLGVBQWUsSUFBSSxJQUFJO0FBQUEsTUFDekQ7QUFBQSxJQUNGO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFRQSxXQUFTLG9CQUFvQixRQUFRO0FBQ25DLFFBQUksTUFBTSxNQUFNLElBQUksTUFBTSxNQUFNLEdBQUc7QUFDakMsYUFBTztBQUFBLElBQ1QsT0FBTztBQUNMLGFBQU87QUFBQSxJQUNUO0FBQUEsRUFDRjtBQVFBLFdBQVMsWUFBWSxJQUFJO0FBQ3ZCLFFBQUksTUFBTSxHQUFHLFVBQVUsR0FBRyxZQUFZLEdBQUcsTUFBTSxHQUFHLE9BQU8sR0FBRyxhQUMxRCxJQUFJLElBQUksUUFDUixNQUFNO0FBQ1IsV0FBTyxLQUFLO0FBQ1YsYUFBTyxJQUFJLFdBQVcsQ0FBQztBQUFBLElBQ3pCO0FBQ0EsV0FBTyxJQUFJLFNBQVMsRUFBRTtBQUFBLEVBQ3hCO0FBQ0EsV0FBUyx1QkFBdUIsTUFBTTtBQUNwQyxzQkFBa0IsU0FBUztBQUMzQixRQUFJLFNBQVMsS0FBSyxxQkFBcUIsT0FBTztBQUM5QyxRQUFJLE1BQU0sT0FBTztBQUNqQixXQUFPLE9BQU87QUFDWixVQUFJLEtBQUssT0FBTyxHQUFHO0FBQ25CLFNBQUcsV0FBVyxrQkFBa0IsS0FBSyxFQUFFO0FBQUEsSUFDekM7QUFBQSxFQUNGO0FBQ0EsV0FBUyxVQUFVLElBQUk7QUFDckIsV0FBTyxXQUFXLElBQUksQ0FBQztBQUFBLEVBQ3pCO0FBQ0EsV0FBUyxnQkFBZ0IsSUFBSTtBQUMzQixXQUFPLGFBQWEsRUFBRTtBQUFBLEVBQ3hCO0FBR0EsTUFBSSxnQkFBZ0I7QUFDbEIsT0FBRyxVQUFVLGFBQWEsU0FBVSxLQUFLO0FBQ3ZDLFdBQUssU0FBUyxVQUFVLHdCQUF3QixJQUFJLFlBQVk7QUFDOUQsWUFBSSxlQUFlO0FBQUEsTUFDckI7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBR0EsV0FBUyxRQUFRO0FBQUEsSUFDZjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0EsSUFBSSxTQUFTLEdBQUcsSUFBSSxVQUFVO0FBQzVCLGFBQU8sQ0FBQyxDQUFDLFFBQVEsSUFBSSxVQUFVLElBQUksS0FBSztBQUFBLElBQzFDO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQSxVQUFVO0FBQUEsSUFDVixnQkFBZ0I7QUFBQSxJQUNoQixpQkFBaUI7QUFBQSxJQUNqQjtBQUFBLEVBQ0Y7QUFPQSxXQUFTLE1BQU0sU0FBVSxTQUFTO0FBQ2hDLFdBQU8sUUFBUSxPQUFPO0FBQUEsRUFDeEI7QUFNQSxXQUFTLFFBQVEsV0FBWTtBQUMzQixhQUFTLE9BQU8sVUFBVSxRQUFRUyxXQUFVLElBQUksTUFBTSxJQUFJLEdBQUcsT0FBTyxHQUFHLE9BQU8sTUFBTSxRQUFRO0FBQzFGLE1BQUFBLFNBQVEsSUFBSSxJQUFJLFVBQVUsSUFBSTtBQUFBLElBQ2hDO0FBQ0EsUUFBSUEsU0FBUSxDQUFDLEVBQUUsZ0JBQWdCO0FBQU8sTUFBQUEsV0FBVUEsU0FBUSxDQUFDO0FBQ3pELElBQUFBLFNBQVEsUUFBUSxTQUFVLFFBQVE7QUFDaEMsVUFBSSxDQUFDLE9BQU8sYUFBYSxDQUFDLE9BQU8sVUFBVSxhQUFhO0FBQ3RELGNBQU0sZ0VBQWdFLE9BQU8sQ0FBQyxFQUFFLFNBQVMsS0FBSyxNQUFNLENBQUM7QUFBQSxNQUN2RztBQUNBLFVBQUksT0FBTztBQUFPLGlCQUFTLFFBQVEsZUFBZSxlQUFlLENBQUMsR0FBRyxTQUFTLEtBQUssR0FBRyxPQUFPLEtBQUs7QUFDbEcsb0JBQWMsTUFBTSxNQUFNO0FBQUEsSUFDNUIsQ0FBQztBQUFBLEVBQ0g7QUFPQSxXQUFTLFNBQVMsU0FBVSxJQUFJLFNBQVM7QUFDdkMsV0FBTyxJQUFJLFNBQVMsSUFBSSxPQUFPO0FBQUEsRUFDakM7QUFHQSxXQUFTLFVBQVU7QUFFbkIsTUFBSSxjQUFjLENBQUM7QUFBbkIsTUFDRTtBQURGLE1BRUU7QUFGRixNQUdFLFlBQVk7QUFIZCxNQUlFO0FBSkYsTUFLRTtBQUxGLE1BTUU7QUFORixNQU9FO0FBQ0YsV0FBUyxtQkFBbUI7QUFDMUIsYUFBUyxhQUFhO0FBQ3BCLFdBQUssV0FBVztBQUFBLFFBQ2QsUUFBUTtBQUFBLFFBQ1IseUJBQXlCO0FBQUEsUUFDekIsbUJBQW1CO0FBQUEsUUFDbkIsYUFBYTtBQUFBLFFBQ2IsY0FBYztBQUFBLE1BQ2hCO0FBR0EsZUFBUyxNQUFNLE1BQU07QUFDbkIsWUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLE9BQU8sT0FBTyxLQUFLLEVBQUUsTUFBTSxZQUFZO0FBQzFELGVBQUssRUFBRSxJQUFJLEtBQUssRUFBRSxFQUFFLEtBQUssSUFBSTtBQUFBLFFBQy9CO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFDQSxlQUFXLFlBQVk7QUFBQSxNQUNyQixhQUFhLFNBQVMsWUFBWSxNQUFNO0FBQ3RDLFlBQUksZ0JBQWdCLEtBQUs7QUFDekIsWUFBSSxLQUFLLFNBQVMsaUJBQWlCO0FBQ2pDLGFBQUcsVUFBVSxZQUFZLEtBQUssaUJBQWlCO0FBQUEsUUFDakQsT0FBTztBQUNMLGNBQUksS0FBSyxRQUFRLGdCQUFnQjtBQUMvQixlQUFHLFVBQVUsZUFBZSxLQUFLLHlCQUF5QjtBQUFBLFVBQzVELFdBQVcsY0FBYyxTQUFTO0FBQ2hDLGVBQUcsVUFBVSxhQUFhLEtBQUsseUJBQXlCO0FBQUEsVUFDMUQsT0FBTztBQUNMLGVBQUcsVUFBVSxhQUFhLEtBQUsseUJBQXlCO0FBQUEsVUFDMUQ7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsbUJBQW1CLFNBQVMsa0JBQWtCLE9BQU87QUFDbkQsWUFBSSxnQkFBZ0IsTUFBTTtBQUUxQixZQUFJLENBQUMsS0FBSyxRQUFRLGtCQUFrQixDQUFDLGNBQWMsUUFBUTtBQUN6RCxlQUFLLGtCQUFrQixhQUFhO0FBQUEsUUFDdEM7QUFBQSxNQUNGO0FBQUEsTUFDQSxNQUFNLFNBQVNDLFFBQU87QUFDcEIsWUFBSSxLQUFLLFNBQVMsaUJBQWlCO0FBQ2pDLGNBQUksVUFBVSxZQUFZLEtBQUssaUJBQWlCO0FBQUEsUUFDbEQsT0FBTztBQUNMLGNBQUksVUFBVSxlQUFlLEtBQUsseUJBQXlCO0FBQzNELGNBQUksVUFBVSxhQUFhLEtBQUsseUJBQXlCO0FBQ3pELGNBQUksVUFBVSxhQUFhLEtBQUsseUJBQXlCO0FBQUEsUUFDM0Q7QUFDQSx3Q0FBZ0M7QUFDaEMseUJBQWlCO0FBQ2pCLHVCQUFlO0FBQUEsTUFDakI7QUFBQSxNQUNBLFNBQVMsU0FBUyxVQUFVO0FBQzFCLHFCQUFhLGVBQWUsV0FBVyxZQUFZLDZCQUE2QixrQkFBa0Isa0JBQWtCO0FBQ3BILG9CQUFZLFNBQVM7QUFBQSxNQUN2QjtBQUFBLE1BQ0EsMkJBQTJCLFNBQVMsMEJBQTBCLEtBQUs7QUFDakUsYUFBSyxrQkFBa0IsS0FBSyxJQUFJO0FBQUEsTUFDbEM7QUFBQSxNQUNBLG1CQUFtQixTQUFTLGtCQUFrQixLQUFLLFVBQVU7QUFDM0QsWUFBSSxRQUFRO0FBQ1osWUFBSSxLQUFLLElBQUksVUFBVSxJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssU0FDM0MsS0FBSyxJQUFJLFVBQVUsSUFBSSxRQUFRLENBQUMsSUFBSSxLQUFLLFNBQ3pDLE9BQU8sU0FBUyxpQkFBaUIsR0FBRyxDQUFDO0FBQ3ZDLHFCQUFhO0FBTWIsWUFBSSxZQUFZLEtBQUssUUFBUSwyQkFBMkIsUUFBUSxjQUFjLFFBQVE7QUFDcEYscUJBQVcsS0FBSyxLQUFLLFNBQVMsTUFBTSxRQUFRO0FBRzVDLGNBQUksaUJBQWlCLDJCQUEyQixNQUFNLElBQUk7QUFDMUQsY0FBSSxjQUFjLENBQUMsOEJBQThCLE1BQU0sbUJBQW1CLE1BQU0sa0JBQWtCO0FBQ2hHLDBDQUE4QixnQ0FBZ0M7QUFFOUQseUNBQTZCLFlBQVksV0FBWTtBQUNuRCxrQkFBSSxVQUFVLDJCQUEyQixTQUFTLGlCQUFpQixHQUFHLENBQUMsR0FBRyxJQUFJO0FBQzlFLGtCQUFJLFlBQVksZ0JBQWdCO0FBQzlCLGlDQUFpQjtBQUNqQixpQ0FBaUI7QUFBQSxjQUNuQjtBQUNBLHlCQUFXLEtBQUssTUFBTSxTQUFTLFNBQVMsUUFBUTtBQUFBLFlBQ2xELEdBQUcsRUFBRTtBQUNMLDhCQUFrQjtBQUNsQiw4QkFBa0I7QUFBQSxVQUNwQjtBQUFBLFFBQ0YsT0FBTztBQUVMLGNBQUksQ0FBQyxLQUFLLFFBQVEsZ0JBQWdCLDJCQUEyQixNQUFNLElBQUksTUFBTSwwQkFBMEIsR0FBRztBQUN4Ryw2QkFBaUI7QUFDakI7QUFBQSxVQUNGO0FBQ0EscUJBQVcsS0FBSyxLQUFLLFNBQVMsMkJBQTJCLE1BQU0sS0FBSyxHQUFHLEtBQUs7QUFBQSxRQUM5RTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsV0FBTyxTQUFTLFlBQVk7QUFBQSxNQUMxQixZQUFZO0FBQUEsTUFDWixxQkFBcUI7QUFBQSxJQUN2QixDQUFDO0FBQUEsRUFDSDtBQUNBLFdBQVMsbUJBQW1CO0FBQzFCLGdCQUFZLFFBQVEsU0FBVUMsYUFBWTtBQUN4QyxvQkFBY0EsWUFBVyxHQUFHO0FBQUEsSUFDOUIsQ0FBQztBQUNELGtCQUFjLENBQUM7QUFBQSxFQUNqQjtBQUNBLFdBQVMsa0NBQWtDO0FBQ3pDLGtCQUFjLDBCQUEwQjtBQUFBLEVBQzFDO0FBQ0EsTUFBSSxhQUFhLFNBQVMsU0FBVSxLQUFLLFNBQVN2QixTQUFRLFlBQVk7QUFFcEUsUUFBSSxDQUFDLFFBQVE7QUFBUTtBQUNyQixRQUFJLEtBQUssSUFBSSxVQUFVLElBQUksUUFBUSxDQUFDLElBQUksS0FBSyxTQUMzQyxLQUFLLElBQUksVUFBVSxJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssU0FDekMsT0FBTyxRQUFRLG1CQUNmLFFBQVEsUUFBUSxhQUNoQixjQUFjLDBCQUEwQjtBQUMxQyxRQUFJLHFCQUFxQixPQUN2QjtBQUdGLFFBQUksaUJBQWlCQSxTQUFRO0FBQzNCLHFCQUFlQTtBQUNmLHVCQUFpQjtBQUNqQixpQkFBVyxRQUFRO0FBQ25CLHVCQUFpQixRQUFRO0FBQ3pCLFVBQUksYUFBYSxNQUFNO0FBQ3JCLG1CQUFXLDJCQUEyQkEsU0FBUSxJQUFJO0FBQUEsTUFDcEQ7QUFBQSxJQUNGO0FBQ0EsUUFBSSxZQUFZO0FBQ2hCLFFBQUksZ0JBQWdCO0FBQ3BCLE9BQUc7QUFDRCxVQUFJLEtBQUssZUFDUCxPQUFPLFFBQVEsRUFBRSxHQUNqQixNQUFNLEtBQUssS0FDWCxTQUFTLEtBQUssUUFDZCxPQUFPLEtBQUssTUFDWixRQUFRLEtBQUssT0FDYixRQUFRLEtBQUssT0FDYixTQUFTLEtBQUssUUFDZCxhQUFhLFFBQ2IsYUFBYSxRQUNiLGNBQWMsR0FBRyxhQUNqQixlQUFlLEdBQUcsY0FDbEIsUUFBUSxJQUFJLEVBQUUsR0FDZCxhQUFhLEdBQUcsWUFDaEIsYUFBYSxHQUFHO0FBQ2xCLFVBQUksT0FBTyxhQUFhO0FBQ3RCLHFCQUFhLFFBQVEsZ0JBQWdCLE1BQU0sY0FBYyxVQUFVLE1BQU0sY0FBYyxZQUFZLE1BQU0sY0FBYztBQUN2SCxxQkFBYSxTQUFTLGlCQUFpQixNQUFNLGNBQWMsVUFBVSxNQUFNLGNBQWMsWUFBWSxNQUFNLGNBQWM7QUFBQSxNQUMzSCxPQUFPO0FBQ0wscUJBQWEsUUFBUSxnQkFBZ0IsTUFBTSxjQUFjLFVBQVUsTUFBTSxjQUFjO0FBQ3ZGLHFCQUFhLFNBQVMsaUJBQWlCLE1BQU0sY0FBYyxVQUFVLE1BQU0sY0FBYztBQUFBLE1BQzNGO0FBQ0EsVUFBSSxLQUFLLGVBQWUsS0FBSyxJQUFJLFFBQVEsQ0FBQyxLQUFLLFFBQVEsYUFBYSxRQUFRLGdCQUFnQixLQUFLLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUM7QUFDNUgsVUFBSSxLQUFLLGVBQWUsS0FBSyxJQUFJLFNBQVMsQ0FBQyxLQUFLLFFBQVEsYUFBYSxTQUFTLGlCQUFpQixLQUFLLElBQUksTUFBTSxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUM7QUFDOUgsVUFBSSxDQUFDLFlBQVksU0FBUyxHQUFHO0FBQzNCLGlCQUFTLElBQUksR0FBRyxLQUFLLFdBQVcsS0FBSztBQUNuQyxjQUFJLENBQUMsWUFBWSxDQUFDLEdBQUc7QUFDbkIsd0JBQVksQ0FBQyxJQUFJLENBQUM7QUFBQSxVQUNwQjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQ0EsVUFBSSxZQUFZLFNBQVMsRUFBRSxNQUFNLE1BQU0sWUFBWSxTQUFTLEVBQUUsTUFBTSxNQUFNLFlBQVksU0FBUyxFQUFFLE9BQU8sSUFBSTtBQUMxRyxvQkFBWSxTQUFTLEVBQUUsS0FBSztBQUM1QixvQkFBWSxTQUFTLEVBQUUsS0FBSztBQUM1QixvQkFBWSxTQUFTLEVBQUUsS0FBSztBQUM1QixzQkFBYyxZQUFZLFNBQVMsRUFBRSxHQUFHO0FBQ3hDLFlBQUksTUFBTSxLQUFLLE1BQU0sR0FBRztBQUN0QiwrQkFBcUI7QUFFckIsc0JBQVksU0FBUyxFQUFFLE1BQU0sWUFBWSxXQUFZO0FBRW5ELGdCQUFJLGNBQWMsS0FBSyxVQUFVLEdBQUc7QUFDbEMsdUJBQVMsT0FBTyxhQUFhLFVBQVU7QUFBQSxZQUN6QztBQUNBLGdCQUFJLGdCQUFnQixZQUFZLEtBQUssS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLEtBQUssRUFBRSxLQUFLLFFBQVE7QUFDdEYsZ0JBQUksZ0JBQWdCLFlBQVksS0FBSyxLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssS0FBSyxFQUFFLEtBQUssUUFBUTtBQUN0RixnQkFBSSxPQUFPLG1CQUFtQixZQUFZO0FBQ3hDLGtCQUFJLGVBQWUsS0FBSyxTQUFTLFFBQVEsV0FBVyxPQUFPLEdBQUcsZUFBZSxlQUFlLEtBQUssWUFBWSxZQUFZLEtBQUssS0FBSyxFQUFFLEVBQUUsTUFBTSxZQUFZO0FBQ3ZKO0FBQUEsY0FDRjtBQUFBLFlBQ0Y7QUFDQSxxQkFBUyxZQUFZLEtBQUssS0FBSyxFQUFFLElBQUksZUFBZSxhQUFhO0FBQUEsVUFDbkUsRUFBRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsVUFDVCxDQUFDLEdBQUcsRUFBRTtBQUFBLFFBQ1I7QUFBQSxNQUNGO0FBQ0E7QUFBQSxJQUNGLFNBQVMsUUFBUSxnQkFBZ0Isa0JBQWtCLGdCQUFnQixnQkFBZ0IsMkJBQTJCLGVBQWUsS0FBSztBQUNsSSxnQkFBWTtBQUFBLEVBQ2QsR0FBRyxFQUFFO0FBRUwsTUFBSSxPQUFPLFNBQVNzQixNQUFLLE1BQU07QUFDN0IsUUFBSSxnQkFBZ0IsS0FBSyxlQUN2QmhCLGVBQWMsS0FBSyxhQUNuQk0sVUFBUyxLQUFLLFFBQ2QsaUJBQWlCLEtBQUssZ0JBQ3RCLHdCQUF3QixLQUFLLHVCQUM3QixxQkFBcUIsS0FBSyxvQkFDMUIsdUJBQXVCLEtBQUs7QUFDOUIsUUFBSSxDQUFDO0FBQWU7QUFDcEIsUUFBSSxhQUFhTixnQkFBZTtBQUNoQyx1QkFBbUI7QUFDbkIsUUFBSSxRQUFRLGNBQWMsa0JBQWtCLGNBQWMsZUFBZSxTQUFTLGNBQWMsZUFBZSxDQUFDLElBQUk7QUFDcEgsUUFBSSxTQUFTLFNBQVMsaUJBQWlCLE1BQU0sU0FBUyxNQUFNLE9BQU87QUFDbkUseUJBQXFCO0FBQ3JCLFFBQUksY0FBYyxDQUFDLFdBQVcsR0FBRyxTQUFTLE1BQU0sR0FBRztBQUNqRCw0QkFBc0IsT0FBTztBQUM3QixXQUFLLFFBQVE7QUFBQSxRQUNYLFFBQVFNO0FBQUEsUUFDUixhQUFhTjtBQUFBLE1BQ2YsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNGO0FBQ0EsV0FBUyxTQUFTO0FBQUEsRUFBQztBQUNuQixTQUFPLFlBQVk7QUFBQSxJQUNqQixZQUFZO0FBQUEsSUFDWixXQUFXLFNBQVMsVUFBVSxPQUFPO0FBQ25DLFVBQUlGLHFCQUFvQixNQUFNO0FBQzlCLFdBQUssYUFBYUE7QUFBQSxJQUNwQjtBQUFBLElBQ0EsU0FBUyxTQUFTLFFBQVEsT0FBTztBQUMvQixVQUFJUSxVQUFTLE1BQU0sUUFDakJOLGVBQWMsTUFBTTtBQUN0QixXQUFLLFNBQVMsc0JBQXNCO0FBQ3BDLFVBQUlBLGNBQWE7QUFDZixRQUFBQSxhQUFZLHNCQUFzQjtBQUFBLE1BQ3BDO0FBQ0EsVUFBSSxjQUFjLFNBQVMsS0FBSyxTQUFTLElBQUksS0FBSyxZQUFZLEtBQUssT0FBTztBQUMxRSxVQUFJLGFBQWE7QUFDZixhQUFLLFNBQVMsR0FBRyxhQUFhTSxTQUFRLFdBQVc7QUFBQSxNQUNuRCxPQUFPO0FBQ0wsYUFBSyxTQUFTLEdBQUcsWUFBWUEsT0FBTTtBQUFBLE1BQ3JDO0FBQ0EsV0FBSyxTQUFTLFdBQVc7QUFDekIsVUFBSU4sY0FBYTtBQUNmLFFBQUFBLGFBQVksV0FBVztBQUFBLE1BQ3pCO0FBQUEsSUFDRjtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBQ0EsV0FBUyxRQUFRO0FBQUEsSUFDZixZQUFZO0FBQUEsRUFDZCxDQUFDO0FBQ0QsV0FBUyxTQUFTO0FBQUEsRUFBQztBQUNuQixTQUFPLFlBQVk7QUFBQSxJQUNqQixTQUFTLFNBQVNrQixTQUFRLE9BQU87QUFDL0IsVUFBSVosVUFBUyxNQUFNLFFBQ2pCTixlQUFjLE1BQU07QUFDdEIsVUFBSSxpQkFBaUJBLGdCQUFlLEtBQUs7QUFDekMscUJBQWUsc0JBQXNCO0FBQ3JDLE1BQUFNLFFBQU8sY0FBY0EsUUFBTyxXQUFXLFlBQVlBLE9BQU07QUFDekQscUJBQWUsV0FBVztBQUFBLElBQzVCO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFDQSxXQUFTLFFBQVE7QUFBQSxJQUNmLFlBQVk7QUFBQSxFQUNkLENBQUM7QUF3cEJELFdBQVMsTUFBTSxJQUFJLGlCQUFpQixDQUFDO0FBQ3JDLFdBQVMsTUFBTSxRQUFRLE1BQU07QUFFN0IsTUFBTyx1QkFBUTs7O0FDdnhHZixTQUFPLFdBQVc7QUFFbEIsTUFBTyxtQkFBUSxDQUFDLFdBQVc7QUFDdkIsV0FBTyxVQUFVLFlBQVksQ0FBQyxPQUFPO0FBQ2pDLFVBQUksWUFBWSxTQUFTLEdBQUcsU0FBUyx5QkFBeUI7QUFFOUQsVUFBSSxjQUFjLEtBQUssQ0FBQyxXQUFXO0FBQy9CLG9CQUFZO0FBQUEsTUFDaEI7QUFFQSxTQUFHLFdBQVcscUJBQVMsT0FBTyxJQUFJO0FBQUEsUUFDOUIsV0FBVztBQUFBLFFBQ1gsUUFBUTtBQUFBLFFBQ1IsWUFBWTtBQUFBLFFBQ1o7QUFBQSxRQUNBLFlBQVk7QUFBQSxNQUNoQixDQUFDO0FBQUEsSUFDTCxDQUFDO0FBQUEsRUFDTDs7O0FDcEJBLE1BQUksV0FBVyxPQUFPO0FBQ3RCLE1BQUksWUFBWSxPQUFPO0FBQ3ZCLE1BQUksZUFBZSxPQUFPO0FBQzFCLE1BQUksZUFBZSxPQUFPLFVBQVU7QUFDcEMsTUFBSSxvQkFBb0IsT0FBTztBQUMvQixNQUFJLG1CQUFtQixPQUFPO0FBQzlCLE1BQUksaUJBQWlCLENBQUMsV0FBVyxVQUFVLFFBQVEsY0FBYyxFQUFDLE9BQU8sS0FBSSxDQUFDO0FBQzlFLE1BQUksYUFBYSxDQUFDLFVBQVUsV0FBVyxNQUFNO0FBQzNDLFFBQUksQ0FBQyxRQUFRO0FBQ1gsZUFBUyxFQUFDLFNBQVMsQ0FBQyxFQUFDO0FBQ3JCLGVBQVMsT0FBTyxTQUFTLE1BQU07QUFBQSxJQUNqQztBQUNBLFdBQU8sT0FBTztBQUFBLEVBQ2hCO0FBQ0EsTUFBSSxlQUFlLENBQUMsUUFBUSxRQUFRLFNBQVM7QUFDM0MsUUFBSSxVQUFVLE9BQU8sV0FBVyxZQUFZLE9BQU8sV0FBVyxZQUFZO0FBQ3hFLGVBQVMsT0FBTyxrQkFBa0IsTUFBTTtBQUN0QyxZQUFJLENBQUMsYUFBYSxLQUFLLFFBQVEsR0FBRyxLQUFLLFFBQVE7QUFDN0Msb0JBQVUsUUFBUSxLQUFLLEVBQUMsS0FBSyxNQUFNLE9BQU8sR0FBRyxHQUFHLFlBQVksRUFBRSxPQUFPLGlCQUFpQixRQUFRLEdBQUcsTUFBTSxLQUFLLFdBQVUsQ0FBQztBQUFBLElBQzdIO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFDQSxNQUFJLGFBQWEsQ0FBQyxXQUFXO0FBQzNCLFdBQU8sYUFBYSxlQUFlLFVBQVUsVUFBVSxPQUFPLFNBQVMsYUFBYSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsV0FBVyxVQUFVLE9BQU8sY0FBYyxhQUFhLFNBQVMsRUFBQyxLQUFLLE1BQU0sT0FBTyxTQUFTLFlBQVksS0FBSSxJQUFJLEVBQUMsT0FBTyxRQUFRLFlBQVksS0FBSSxDQUFDLENBQUMsR0FBRyxNQUFNO0FBQUEsRUFDaFE7QUFHQSxNQUFJLGlCQUFpQixXQUFXLENBQUMsWUFBWTtBQUMzQztBQUNBLFdBQU8sZUFBZSxTQUFTLGNBQWMsRUFBQyxPQUFPLEtBQUksQ0FBQztBQUMxRCxhQUFTYSx1QkFBc0IsU0FBUztBQUN0QyxVQUFJLE9BQU8sUUFBUSxzQkFBc0I7QUFDekMsYUFBTztBQUFBLFFBQ0wsT0FBTyxLQUFLO0FBQUEsUUFDWixRQUFRLEtBQUs7QUFBQSxRQUNiLEtBQUssS0FBSztBQUFBLFFBQ1YsT0FBTyxLQUFLO0FBQUEsUUFDWixRQUFRLEtBQUs7QUFBQSxRQUNiLE1BQU0sS0FBSztBQUFBLFFBQ1gsR0FBRyxLQUFLO0FBQUEsUUFDUixHQUFHLEtBQUs7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUNBLGFBQVNDLFdBQVUsTUFBTTtBQUN2QixVQUFJLFFBQVEsTUFBTTtBQUNoQixlQUFPO0FBQUEsTUFDVDtBQUNBLFVBQUksS0FBSyxTQUFTLE1BQU0sbUJBQW1CO0FBQ3pDLFlBQUksZ0JBQWdCLEtBQUs7QUFDekIsZUFBTyxnQkFBZ0IsY0FBYyxlQUFlLFNBQVM7QUFBQSxNQUMvRDtBQUNBLGFBQU87QUFBQSxJQUNUO0FBQ0EsYUFBUyxnQkFBZ0IsTUFBTTtBQUM3QixVQUFJLE1BQU1BLFdBQVUsSUFBSTtBQUN4QixVQUFJLGFBQWEsSUFBSTtBQUNyQixVQUFJLFlBQVksSUFBSTtBQUNwQixhQUFPO0FBQUEsUUFDTDtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUNBLGFBQVNDLFdBQVUsTUFBTTtBQUN2QixVQUFJLGFBQWFELFdBQVUsSUFBSSxFQUFFO0FBQ2pDLGFBQU8sZ0JBQWdCLGNBQWMsZ0JBQWdCO0FBQUEsSUFDdkQ7QUFDQSxhQUFTRSxlQUFjLE1BQU07QUFDM0IsVUFBSSxhQUFhRixXQUFVLElBQUksRUFBRTtBQUNqQyxhQUFPLGdCQUFnQixjQUFjLGdCQUFnQjtBQUFBLElBQ3ZEO0FBQ0EsYUFBU0csY0FBYSxNQUFNO0FBQzFCLFVBQUksT0FBTyxlQUFlLGFBQWE7QUFDckMsZUFBTztBQUFBLE1BQ1Q7QUFDQSxVQUFJLGFBQWFILFdBQVUsSUFBSSxFQUFFO0FBQ2pDLGFBQU8sZ0JBQWdCLGNBQWMsZ0JBQWdCO0FBQUEsSUFDdkQ7QUFDQSxhQUFTLHFCQUFxQixTQUFTO0FBQ3JDLGFBQU87QUFBQSxRQUNMLFlBQVksUUFBUTtBQUFBLFFBQ3BCLFdBQVcsUUFBUTtBQUFBLE1BQ3JCO0FBQUEsSUFDRjtBQUNBLGFBQVNJLGVBQWMsTUFBTTtBQUMzQixVQUFJLFNBQVNKLFdBQVUsSUFBSSxLQUFLLENBQUNFLGVBQWMsSUFBSSxHQUFHO0FBQ3BELGVBQU8sZ0JBQWdCLElBQUk7QUFBQSxNQUM3QixPQUFPO0FBQ0wsZUFBTyxxQkFBcUIsSUFBSTtBQUFBLE1BQ2xDO0FBQUEsSUFDRjtBQUNBLGFBQVNHLGFBQVksU0FBUztBQUM1QixhQUFPLFdBQVcsUUFBUSxZQUFZLElBQUksWUFBWSxJQUFJO0FBQUEsSUFDNUQ7QUFDQSxhQUFTQyxvQkFBbUIsU0FBUztBQUNuQyxlQUFTTCxXQUFVLE9BQU8sSUFBSSxRQUFRLGdCQUFnQixRQUFRLGFBQWEsT0FBTyxVQUFVO0FBQUEsSUFDOUY7QUFDQSxhQUFTTSxxQkFBb0IsU0FBUztBQUNwQyxhQUFPUix1QkFBc0JPLG9CQUFtQixPQUFPLENBQUMsRUFBRSxPQUFPLGdCQUFnQixPQUFPLEVBQUU7QUFBQSxJQUM1RjtBQUNBLGFBQVNFLGtCQUFpQixTQUFTO0FBQ2pDLGFBQU9SLFdBQVUsT0FBTyxFQUFFLGlCQUFpQixPQUFPO0FBQUEsSUFDcEQ7QUFDQSxhQUFTLGVBQWUsU0FBUztBQUMvQixVQUFJLG9CQUFvQlEsa0JBQWlCLE9BQU8sR0FBRyxXQUFXLGtCQUFrQixVQUFVLFlBQVksa0JBQWtCLFdBQVcsWUFBWSxrQkFBa0I7QUFDakssYUFBTyw2QkFBNkIsS0FBSyxXQUFXLFlBQVksU0FBUztBQUFBLElBQzNFO0FBQ0EsYUFBUyxpQkFBaUIseUJBQXlCLGNBQWMsU0FBUztBQUN4RSxVQUFJLFlBQVksUUFBUTtBQUN0QixrQkFBVTtBQUFBLE1BQ1o7QUFDQSxVQUFJLGtCQUFrQkYsb0JBQW1CLFlBQVk7QUFDckQsVUFBSSxPQUFPUCx1QkFBc0IsdUJBQXVCO0FBQ3hELFVBQUksMEJBQTBCRyxlQUFjLFlBQVk7QUFDeEQsVUFBSSxTQUFTO0FBQUEsUUFDWCxZQUFZO0FBQUEsUUFDWixXQUFXO0FBQUEsTUFDYjtBQUNBLFVBQUksVUFBVTtBQUFBLFFBQ1osR0FBRztBQUFBLFFBQ0gsR0FBRztBQUFBLE1BQ0w7QUFDQSxVQUFJLDJCQUEyQixDQUFDLDJCQUEyQixDQUFDLFNBQVM7QUFDbkUsWUFBSUcsYUFBWSxZQUFZLE1BQU0sVUFBVSxlQUFlLGVBQWUsR0FBRztBQUMzRSxtQkFBU0QsZUFBYyxZQUFZO0FBQUEsUUFDckM7QUFDQSxZQUFJRixlQUFjLFlBQVksR0FBRztBQUMvQixvQkFBVUgsdUJBQXNCLFlBQVk7QUFDNUMsa0JBQVEsS0FBSyxhQUFhO0FBQzFCLGtCQUFRLEtBQUssYUFBYTtBQUFBLFFBQzVCLFdBQVcsaUJBQWlCO0FBQzFCLGtCQUFRLElBQUlRLHFCQUFvQixlQUFlO0FBQUEsUUFDakQ7QUFBQSxNQUNGO0FBQ0EsYUFBTztBQUFBLFFBQ0wsR0FBRyxLQUFLLE9BQU8sT0FBTyxhQUFhLFFBQVE7QUFBQSxRQUMzQyxHQUFHLEtBQUssTUFBTSxPQUFPLFlBQVksUUFBUTtBQUFBLFFBQ3pDLE9BQU8sS0FBSztBQUFBLFFBQ1osUUFBUSxLQUFLO0FBQUEsTUFDZjtBQUFBLElBQ0Y7QUFDQSxhQUFTLGNBQWMsU0FBUztBQUM5QixVQUFJLGFBQWFSLHVCQUFzQixPQUFPO0FBQzlDLFVBQUksUUFBUSxRQUFRO0FBQ3BCLFVBQUksU0FBUyxRQUFRO0FBQ3JCLFVBQUksS0FBSyxJQUFJLFdBQVcsUUFBUSxLQUFLLEtBQUssR0FBRztBQUMzQyxnQkFBUSxXQUFXO0FBQUEsTUFDckI7QUFDQSxVQUFJLEtBQUssSUFBSSxXQUFXLFNBQVMsTUFBTSxLQUFLLEdBQUc7QUFDN0MsaUJBQVMsV0FBVztBQUFBLE1BQ3RCO0FBQ0EsYUFBTztBQUFBLFFBQ0wsR0FBRyxRQUFRO0FBQUEsUUFDWCxHQUFHLFFBQVE7QUFBQSxRQUNYO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsYUFBU1UsZUFBYyxTQUFTO0FBQzlCLFVBQUlKLGFBQVksT0FBTyxNQUFNLFFBQVE7QUFDbkMsZUFBTztBQUFBLE1BQ1Q7QUFDQSxhQUFPLFFBQVEsZ0JBQWdCLFFBQVEsZUFBZUYsY0FBYSxPQUFPLElBQUksUUFBUSxPQUFPLFNBQVNHLG9CQUFtQixPQUFPO0FBQUEsSUFDbEk7QUFDQSxhQUFTLGdCQUFnQixNQUFNO0FBQzdCLFVBQUksQ0FBQyxRQUFRLFFBQVEsV0FBVyxFQUFFLFFBQVFELGFBQVksSUFBSSxDQUFDLEtBQUssR0FBRztBQUNqRSxlQUFPLEtBQUssY0FBYztBQUFBLE1BQzVCO0FBQ0EsVUFBSUgsZUFBYyxJQUFJLEtBQUssZUFBZSxJQUFJLEdBQUc7QUFDL0MsZUFBTztBQUFBLE1BQ1Q7QUFDQSxhQUFPLGdCQUFnQk8sZUFBYyxJQUFJLENBQUM7QUFBQSxJQUM1QztBQUNBLGFBQVMsa0JBQWtCLFNBQVMsTUFBTTtBQUN4QyxVQUFJO0FBQ0osVUFBSSxTQUFTLFFBQVE7QUFDbkIsZUFBTyxDQUFDO0FBQUEsTUFDVjtBQUNBLFVBQUksZUFBZSxnQkFBZ0IsT0FBTztBQUMxQyxVQUFJLFNBQVMsbUJBQW1CLHdCQUF3QixRQUFRLGtCQUFrQixPQUFPLFNBQVMsc0JBQXNCO0FBQ3hILFVBQUksTUFBTVQsV0FBVSxZQUFZO0FBQ2hDLFVBQUksU0FBUyxTQUFTLENBQUMsR0FBRyxFQUFFLE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxHQUFHLGVBQWUsWUFBWSxJQUFJLGVBQWUsQ0FBQyxDQUFDLElBQUk7QUFDakgsVUFBSSxjQUFjLEtBQUssT0FBTyxNQUFNO0FBQ3BDLGFBQU8sU0FBUyxjQUFjLFlBQVksT0FBTyxrQkFBa0JTLGVBQWMsTUFBTSxDQUFDLENBQUM7QUFBQSxJQUMzRjtBQUNBLGFBQVNDLGdCQUFlLFNBQVM7QUFDL0IsYUFBTyxDQUFDLFNBQVMsTUFBTSxJQUFJLEVBQUUsUUFBUUwsYUFBWSxPQUFPLENBQUMsS0FBSztBQUFBLElBQ2hFO0FBQ0EsYUFBU00scUJBQW9CLFNBQVM7QUFDcEMsVUFBSSxDQUFDVCxlQUFjLE9BQU8sS0FBS00sa0JBQWlCLE9BQU8sRUFBRSxhQUFhLFNBQVM7QUFDN0UsZUFBTztBQUFBLE1BQ1Q7QUFDQSxhQUFPLFFBQVE7QUFBQSxJQUNqQjtBQUNBLGFBQVNJLG9CQUFtQixTQUFTO0FBQ25DLFVBQUksWUFBWSxVQUFVLFVBQVUsWUFBWSxFQUFFLFFBQVEsU0FBUyxNQUFNO0FBQ3pFLFVBQUksT0FBTyxVQUFVLFVBQVUsUUFBUSxTQUFTLE1BQU07QUFDdEQsVUFBSSxRQUFRVixlQUFjLE9BQU8sR0FBRztBQUNsQyxZQUFJLGFBQWFNLGtCQUFpQixPQUFPO0FBQ3pDLFlBQUksV0FBVyxhQUFhLFNBQVM7QUFDbkMsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUNBLFVBQUksY0FBY0MsZUFBYyxPQUFPO0FBQ3ZDLGFBQU9QLGVBQWMsV0FBVyxLQUFLLENBQUMsUUFBUSxNQUFNLEVBQUUsUUFBUUcsYUFBWSxXQUFXLENBQUMsSUFBSSxHQUFHO0FBQzNGLFlBQUlRLE9BQU1MLGtCQUFpQixXQUFXO0FBQ3RDLFlBQUlLLEtBQUksY0FBYyxVQUFVQSxLQUFJLGdCQUFnQixVQUFVQSxLQUFJLFlBQVksV0FBVyxDQUFDLGFBQWEsYUFBYSxFQUFFLFFBQVFBLEtBQUksVUFBVSxNQUFNLE1BQU0sYUFBYUEsS0FBSSxlQUFlLFlBQVksYUFBYUEsS0FBSSxVQUFVQSxLQUFJLFdBQVcsUUFBUTtBQUNwUCxpQkFBTztBQUFBLFFBQ1QsT0FBTztBQUNMLHdCQUFjLFlBQVk7QUFBQSxRQUM1QjtBQUFBLE1BQ0Y7QUFDQSxhQUFPO0FBQUEsSUFDVDtBQUNBLGFBQVNDLGlCQUFnQixTQUFTO0FBQ2hDLFVBQUksVUFBVWQsV0FBVSxPQUFPO0FBQy9CLFVBQUksZUFBZVcscUJBQW9CLE9BQU87QUFDOUMsYUFBTyxnQkFBZ0JELGdCQUFlLFlBQVksS0FBS0Ysa0JBQWlCLFlBQVksRUFBRSxhQUFhLFVBQVU7QUFDM0csdUJBQWVHLHFCQUFvQixZQUFZO0FBQUEsTUFDakQ7QUFDQSxVQUFJLGlCQUFpQk4sYUFBWSxZQUFZLE1BQU0sVUFBVUEsYUFBWSxZQUFZLE1BQU0sVUFBVUcsa0JBQWlCLFlBQVksRUFBRSxhQUFhLFdBQVc7QUFDMUosZUFBTztBQUFBLE1BQ1Q7QUFDQSxhQUFPLGdCQUFnQkksb0JBQW1CLE9BQU8sS0FBSztBQUFBLElBQ3hEO0FBQ0EsUUFBSSxNQUFNO0FBQ1YsUUFBSSxTQUFTO0FBQ2IsUUFBSSxRQUFRO0FBQ1osUUFBSSxPQUFPO0FBQ1gsUUFBSSxPQUFPO0FBQ1gsUUFBSSxpQkFBaUIsQ0FBQyxLQUFLLFFBQVEsT0FBTyxJQUFJO0FBQzlDLFFBQUksUUFBUTtBQUNaLFFBQUksTUFBTTtBQUNWLFFBQUksa0JBQWtCO0FBQ3RCLFFBQUksV0FBVztBQUNmLFFBQUksU0FBUztBQUNiLFFBQUksWUFBWTtBQUNoQixRQUFJLHNCQUFzQywrQkFBZSxPQUFPLFNBQVMsS0FBSyxXQUFXO0FBQ3ZGLGFBQU8sSUFBSSxPQUFPLENBQUMsWUFBWSxNQUFNLE9BQU8sWUFBWSxNQUFNLEdBQUcsQ0FBQztBQUFBLElBQ3BFLEdBQUcsQ0FBQyxDQUFDO0FBQ0wsUUFBSSxhQUE2QixpQkFBQyxFQUFFLE9BQU8sZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxTQUFTLEtBQUssV0FBVztBQUNqRyxhQUFPLElBQUksT0FBTyxDQUFDLFdBQVcsWUFBWSxNQUFNLE9BQU8sWUFBWSxNQUFNLEdBQUcsQ0FBQztBQUFBLElBQy9FLEdBQUcsQ0FBQyxDQUFDO0FBQ0wsUUFBSSxhQUFhO0FBQ2pCLFFBQUksT0FBTztBQUNYLFFBQUksWUFBWTtBQUNoQixRQUFJLGFBQWE7QUFDakIsUUFBSSxPQUFPO0FBQ1gsUUFBSSxZQUFZO0FBQ2hCLFFBQUksY0FBYztBQUNsQixRQUFJLFFBQVE7QUFDWixRQUFJLGFBQWE7QUFDakIsUUFBSSxpQkFBaUIsQ0FBQyxZQUFZLE1BQU0sV0FBVyxZQUFZLE1BQU0sV0FBVyxhQUFhLE9BQU8sVUFBVTtBQUM5RyxhQUFTLE1BQU0sV0FBVztBQUN4QixVQUFJLE1BQU0sb0JBQUksSUFBSTtBQUNsQixVQUFJLFVBQVUsb0JBQUksSUFBSTtBQUN0QixVQUFJLFNBQVMsQ0FBQztBQUNkLGdCQUFVLFFBQVEsU0FBUyxVQUFVO0FBQ25DLFlBQUksSUFBSSxTQUFTLE1BQU0sUUFBUTtBQUFBLE1BQ2pDLENBQUM7QUFDRCxlQUFTRyxNQUFLLFVBQVU7QUFDdEIsZ0JBQVEsSUFBSSxTQUFTLElBQUk7QUFDekIsWUFBSSxXQUFXLENBQUMsRUFBRSxPQUFPLFNBQVMsWUFBWSxDQUFDLEdBQUcsU0FBUyxvQkFBb0IsQ0FBQyxDQUFDO0FBQ2pGLGlCQUFTLFFBQVEsU0FBUyxLQUFLO0FBQzdCLGNBQUksQ0FBQyxRQUFRLElBQUksR0FBRyxHQUFHO0FBQ3JCLGdCQUFJLGNBQWMsSUFBSSxJQUFJLEdBQUc7QUFDN0IsZ0JBQUksYUFBYTtBQUNmLGNBQUFBLE1BQUssV0FBVztBQUFBLFlBQ2xCO0FBQUEsVUFDRjtBQUFBLFFBQ0YsQ0FBQztBQUNELGVBQU8sS0FBSyxRQUFRO0FBQUEsTUFDdEI7QUFDQSxnQkFBVSxRQUFRLFNBQVMsVUFBVTtBQUNuQyxZQUFJLENBQUMsUUFBUSxJQUFJLFNBQVMsSUFBSSxHQUFHO0FBQy9CLFVBQUFBLE1BQUssUUFBUTtBQUFBLFFBQ2Y7QUFBQSxNQUNGLENBQUM7QUFDRCxhQUFPO0FBQUEsSUFDVDtBQUNBLGFBQVMsZUFBZSxXQUFXO0FBQ2pDLFVBQUksbUJBQW1CLE1BQU0sU0FBUztBQUN0QyxhQUFPLGVBQWUsT0FBTyxTQUFTLEtBQUssT0FBTztBQUNoRCxlQUFPLElBQUksT0FBTyxpQkFBaUIsT0FBTyxTQUFTLFVBQVU7QUFDM0QsaUJBQU8sU0FBUyxVQUFVO0FBQUEsUUFDNUIsQ0FBQyxDQUFDO0FBQUEsTUFDSixHQUFHLENBQUMsQ0FBQztBQUFBLElBQ1A7QUFDQSxhQUFTLFNBQVMsSUFBSTtBQUNwQixVQUFJO0FBQ0osYUFBTyxXQUFXO0FBQ2hCLFlBQUksQ0FBQyxTQUFTO0FBQ1osb0JBQVUsSUFBSSxRQUFRLFNBQVMsU0FBUztBQUN0QyxvQkFBUSxRQUFRLEVBQUUsS0FBSyxXQUFXO0FBQ2hDLHdCQUFVO0FBQ1Ysc0JBQVEsR0FBRyxDQUFDO0FBQUEsWUFDZCxDQUFDO0FBQUEsVUFDSCxDQUFDO0FBQUEsUUFDSDtBQUNBLGVBQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUNBLGFBQVMsT0FBTyxLQUFLO0FBQ25CLGVBQVMsT0FBTyxVQUFVLFFBQVEsT0FBTyxJQUFJLE1BQU0sT0FBTyxJQUFJLE9BQU8sSUFBSSxDQUFDLEdBQUcsT0FBTyxHQUFHLE9BQU8sTUFBTSxRQUFRO0FBQzFHLGFBQUssT0FBTyxDQUFDLElBQUksVUFBVSxJQUFJO0FBQUEsTUFDakM7QUFDQSxhQUFPLENBQUMsRUFBRSxPQUFPLElBQUksRUFBRSxPQUFPLFNBQVMsR0FBRyxHQUFHO0FBQzNDLGVBQU8sRUFBRSxRQUFRLE1BQU0sQ0FBQztBQUFBLE1BQzFCLEdBQUcsR0FBRztBQUFBLElBQ1I7QUFDQSxRQUFJLHlCQUF5QjtBQUM3QixRQUFJLDJCQUEyQjtBQUMvQixRQUFJLG1CQUFtQixDQUFDLFFBQVEsV0FBVyxTQUFTLE1BQU0sVUFBVSxZQUFZLFNBQVM7QUFDekYsYUFBUyxrQkFBa0IsV0FBVztBQUNwQyxnQkFBVSxRQUFRLFNBQVMsVUFBVTtBQUNuQyxlQUFPLEtBQUssUUFBUSxFQUFFLFFBQVEsU0FBUyxLQUFLO0FBQzFDLGtCQUFRLEtBQUs7QUFBQSxZQUNYLEtBQUs7QUFDSCxrQkFBSSxPQUFPLFNBQVMsU0FBUyxVQUFVO0FBQ3JDLHdCQUFRLE1BQU0sT0FBTyx3QkFBd0IsT0FBTyxTQUFTLElBQUksR0FBRyxVQUFVLFlBQVksTUFBTSxPQUFPLFNBQVMsSUFBSSxJQUFJLEdBQUcsQ0FBQztBQUFBLGNBQzlIO0FBQ0E7QUFBQSxZQUNGLEtBQUs7QUFDSCxrQkFBSSxPQUFPLFNBQVMsWUFBWSxXQUFXO0FBQ3pDLHdCQUFRLE1BQU0sT0FBTyx3QkFBd0IsU0FBUyxNQUFNLGFBQWEsYUFBYSxNQUFNLE9BQU8sU0FBUyxPQUFPLElBQUksR0FBRyxDQUFDO0FBQUEsY0FDN0g7QUFBQSxZQUNGLEtBQUs7QUFDSCxrQkFBSSxlQUFlLFFBQVEsU0FBUyxLQUFLLElBQUksR0FBRztBQUM5Qyx3QkFBUSxNQUFNLE9BQU8sd0JBQXdCLFNBQVMsTUFBTSxXQUFXLFlBQVksZUFBZSxLQUFLLElBQUksR0FBRyxNQUFNLE9BQU8sU0FBUyxLQUFLLElBQUksR0FBRyxDQUFDO0FBQUEsY0FDbko7QUFDQTtBQUFBLFlBQ0YsS0FBSztBQUNILGtCQUFJLE9BQU8sU0FBUyxPQUFPLFlBQVk7QUFDckMsd0JBQVEsTUFBTSxPQUFPLHdCQUF3QixTQUFTLE1BQU0sUUFBUSxjQUFjLE1BQU0sT0FBTyxTQUFTLEVBQUUsSUFBSSxHQUFHLENBQUM7QUFBQSxjQUNwSDtBQUNBO0FBQUEsWUFDRixLQUFLO0FBQ0gsa0JBQUksT0FBTyxTQUFTLFdBQVcsWUFBWTtBQUN6Qyx3QkFBUSxNQUFNLE9BQU8sd0JBQXdCLFNBQVMsTUFBTSxZQUFZLGNBQWMsTUFBTSxPQUFPLFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQztBQUFBLGNBQ3hIO0FBQ0E7QUFBQSxZQUNGLEtBQUs7QUFDSCxrQkFBSSxDQUFDLE1BQU0sUUFBUSxTQUFTLFFBQVEsR0FBRztBQUNyQyx3QkFBUSxNQUFNLE9BQU8sd0JBQXdCLFNBQVMsTUFBTSxjQUFjLFdBQVcsTUFBTSxPQUFPLFNBQVMsUUFBUSxJQUFJLEdBQUcsQ0FBQztBQUFBLGNBQzdIO0FBQ0E7QUFBQSxZQUNGLEtBQUs7QUFDSCxrQkFBSSxDQUFDLE1BQU0sUUFBUSxTQUFTLGdCQUFnQixHQUFHO0FBQzdDLHdCQUFRLE1BQU0sT0FBTyx3QkFBd0IsU0FBUyxNQUFNLHNCQUFzQixXQUFXLE1BQU0sT0FBTyxTQUFTLGdCQUFnQixJQUFJLEdBQUcsQ0FBQztBQUFBLGNBQzdJO0FBQ0E7QUFBQSxZQUNGLEtBQUs7QUFBQSxZQUNMLEtBQUs7QUFDSDtBQUFBLFlBQ0Y7QUFDRSxzQkFBUSxNQUFNLDZEQUE2RCxTQUFTLE9BQU8sc0NBQXNDLGlCQUFpQixJQUFJLFNBQVMsR0FBRztBQUNoSyx1QkFBTyxNQUFNLElBQUk7QUFBQSxjQUNuQixDQUFDLEVBQUUsS0FBSyxJQUFJLElBQUksWUFBWSxNQUFNLGlCQUFpQjtBQUFBLFVBQ3ZEO0FBQ0EsbUJBQVMsWUFBWSxTQUFTLFNBQVMsUUFBUSxTQUFTLGFBQWE7QUFDbkUsZ0JBQUksVUFBVSxLQUFLLFNBQVMsS0FBSztBQUMvQixxQkFBTyxJQUFJLFNBQVM7QUFBQSxZQUN0QixDQUFDLEtBQUssTUFBTTtBQUNWLHNCQUFRLE1BQU0sT0FBTywwQkFBMEIsT0FBTyxTQUFTLElBQUksR0FBRyxhQUFhLFdBQVcsQ0FBQztBQUFBLFlBQ2pHO0FBQUEsVUFDRixDQUFDO0FBQUEsUUFDSCxDQUFDO0FBQUEsTUFDSCxDQUFDO0FBQUEsSUFDSDtBQUNBLGFBQVMsU0FBUyxLQUFLLElBQUk7QUFDekIsVUFBSSxjQUFjLG9CQUFJLElBQUk7QUFDMUIsYUFBTyxJQUFJLE9BQU8sU0FBUyxNQUFNO0FBQy9CLFlBQUksYUFBYSxHQUFHLElBQUk7QUFDeEIsWUFBSSxDQUFDLFlBQVksSUFBSSxVQUFVLEdBQUc7QUFDaEMsc0JBQVksSUFBSSxVQUFVO0FBQzFCLGlCQUFPO0FBQUEsUUFDVDtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFDQSxhQUFTLGlCQUFpQixXQUFXO0FBQ25DLGFBQU8sVUFBVSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQUEsSUFDL0I7QUFDQSxhQUFTLFlBQVksV0FBVztBQUM5QixVQUFJLFNBQVMsVUFBVSxPQUFPLFNBQVMsU0FBUyxTQUFTO0FBQ3ZELFlBQUksV0FBVyxRQUFRLFFBQVEsSUFBSTtBQUNuQyxnQkFBUSxRQUFRLElBQUksSUFBSSxXQUFXLE9BQU8sT0FBTyxDQUFDLEdBQUcsVUFBVSxTQUFTO0FBQUEsVUFDdEUsU0FBUyxPQUFPLE9BQU8sQ0FBQyxHQUFHLFNBQVMsU0FBUyxRQUFRLE9BQU87QUFBQSxVQUM1RCxNQUFNLE9BQU8sT0FBTyxDQUFDLEdBQUcsU0FBUyxNQUFNLFFBQVEsSUFBSTtBQUFBLFFBQ3JELENBQUMsSUFBSTtBQUNMLGVBQU87QUFBQSxNQUNULEdBQUcsQ0FBQyxDQUFDO0FBQ0wsYUFBTyxPQUFPLEtBQUssTUFBTSxFQUFFLElBQUksU0FBUyxLQUFLO0FBQzNDLGVBQU8sT0FBTyxHQUFHO0FBQUEsTUFDbkIsQ0FBQztBQUFBLElBQ0g7QUFDQSxhQUFTQyxpQkFBZ0IsU0FBUztBQUNoQyxVQUFJLE1BQU1oQixXQUFVLE9BQU87QUFDM0IsVUFBSSxPQUFPTSxvQkFBbUIsT0FBTztBQUNyQyxVQUFJLGlCQUFpQixJQUFJO0FBQ3pCLFVBQUksUUFBUSxLQUFLO0FBQ2pCLFVBQUksU0FBUyxLQUFLO0FBQ2xCLFVBQUksSUFBSTtBQUNSLFVBQUksSUFBSTtBQUNSLFVBQUksZ0JBQWdCO0FBQ2xCLGdCQUFRLGVBQWU7QUFDdkIsaUJBQVMsZUFBZTtBQUN4QixZQUFJLENBQUMsaUNBQWlDLEtBQUssVUFBVSxTQUFTLEdBQUc7QUFDL0QsY0FBSSxlQUFlO0FBQ25CLGNBQUksZUFBZTtBQUFBLFFBQ3JCO0FBQUEsTUFDRjtBQUNBLGFBQU87QUFBQSxRQUNMO0FBQUEsUUFDQTtBQUFBLFFBQ0EsR0FBRyxJQUFJQyxxQkFBb0IsT0FBTztBQUFBLFFBQ2xDO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFDQSxRQUFJVSxPQUFNLEtBQUs7QUFDZixRQUFJQyxPQUFNLEtBQUs7QUFDZixRQUFJQyxTQUFRLEtBQUs7QUFDakIsYUFBU0MsaUJBQWdCLFNBQVM7QUFDaEMsVUFBSTtBQUNKLFVBQUksT0FBT2Qsb0JBQW1CLE9BQU87QUFDckMsVUFBSSxZQUFZLGdCQUFnQixPQUFPO0FBQ3ZDLFVBQUksUUFBUSx3QkFBd0IsUUFBUSxrQkFBa0IsT0FBTyxTQUFTLHNCQUFzQjtBQUNwRyxVQUFJLFFBQVFXLEtBQUksS0FBSyxhQUFhLEtBQUssYUFBYSxPQUFPLEtBQUssY0FBYyxHQUFHLE9BQU8sS0FBSyxjQUFjLENBQUM7QUFDNUcsVUFBSSxTQUFTQSxLQUFJLEtBQUssY0FBYyxLQUFLLGNBQWMsT0FBTyxLQUFLLGVBQWUsR0FBRyxPQUFPLEtBQUssZUFBZSxDQUFDO0FBQ2pILFVBQUksSUFBSSxDQUFDLFVBQVUsYUFBYVYscUJBQW9CLE9BQU87QUFDM0QsVUFBSSxJQUFJLENBQUMsVUFBVTtBQUNuQixVQUFJQyxrQkFBaUIsUUFBUSxJQUFJLEVBQUUsY0FBYyxPQUFPO0FBQ3RELGFBQUtTLEtBQUksS0FBSyxhQUFhLE9BQU8sS0FBSyxjQUFjLENBQUMsSUFBSTtBQUFBLE1BQzVEO0FBQ0EsYUFBTztBQUFBLFFBQ0w7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUNBLGFBQVNJLFVBQVMsUUFBUSxPQUFPO0FBQy9CLFVBQUksV0FBVyxNQUFNLGVBQWUsTUFBTSxZQUFZO0FBQ3RELFVBQUksT0FBTyxTQUFTLEtBQUssR0FBRztBQUMxQixlQUFPO0FBQUEsTUFDVCxXQUFXLFlBQVlsQixjQUFhLFFBQVEsR0FBRztBQUM3QyxZQUFJLE9BQU87QUFDWCxXQUFHO0FBQ0QsY0FBSSxRQUFRLE9BQU8sV0FBVyxJQUFJLEdBQUc7QUFDbkMsbUJBQU87QUFBQSxVQUNUO0FBQ0EsaUJBQU8sS0FBSyxjQUFjLEtBQUs7QUFBQSxRQUNqQyxTQUFTO0FBQUEsTUFDWDtBQUNBLGFBQU87QUFBQSxJQUNUO0FBQ0EsYUFBU21CLGtCQUFpQixNQUFNO0FBQzlCLGFBQU8sT0FBTyxPQUFPLENBQUMsR0FBRyxNQUFNO0FBQUEsUUFDN0IsTUFBTSxLQUFLO0FBQUEsUUFDWCxLQUFLLEtBQUs7QUFBQSxRQUNWLE9BQU8sS0FBSyxJQUFJLEtBQUs7QUFBQSxRQUNyQixRQUFRLEtBQUssSUFBSSxLQUFLO0FBQUEsTUFDeEIsQ0FBQztBQUFBLElBQ0g7QUFDQSxhQUFTQyw0QkFBMkIsU0FBUztBQUMzQyxVQUFJLE9BQU94Qix1QkFBc0IsT0FBTztBQUN4QyxXQUFLLE1BQU0sS0FBSyxNQUFNLFFBQVE7QUFDOUIsV0FBSyxPQUFPLEtBQUssT0FBTyxRQUFRO0FBQ2hDLFdBQUssU0FBUyxLQUFLLE1BQU0sUUFBUTtBQUNqQyxXQUFLLFFBQVEsS0FBSyxPQUFPLFFBQVE7QUFDakMsV0FBSyxRQUFRLFFBQVE7QUFDckIsV0FBSyxTQUFTLFFBQVE7QUFDdEIsV0FBSyxJQUFJLEtBQUs7QUFDZCxXQUFLLElBQUksS0FBSztBQUNkLGFBQU87QUFBQSxJQUNUO0FBQ0EsYUFBUywyQkFBMkIsU0FBUyxnQkFBZ0I7QUFDM0QsYUFBTyxtQkFBbUIsV0FBV3VCLGtCQUFpQk4saUJBQWdCLE9BQU8sQ0FBQyxJQUFJZCxlQUFjLGNBQWMsSUFBSXFCLDRCQUEyQixjQUFjLElBQUlELGtCQUFpQkYsaUJBQWdCZCxvQkFBbUIsT0FBTyxDQUFDLENBQUM7QUFBQSxJQUM5TjtBQUNBLGFBQVMsbUJBQW1CLFNBQVM7QUFDbkMsVUFBSSxtQkFBbUIsa0JBQWtCRyxlQUFjLE9BQU8sQ0FBQztBQUMvRCxVQUFJLG9CQUFvQixDQUFDLFlBQVksT0FBTyxFQUFFLFFBQVFELGtCQUFpQixPQUFPLEVBQUUsUUFBUSxLQUFLO0FBQzdGLFVBQUksaUJBQWlCLHFCQUFxQk4sZUFBYyxPQUFPLElBQUlZLGlCQUFnQixPQUFPLElBQUk7QUFDOUYsVUFBSSxDQUFDYixXQUFVLGNBQWMsR0FBRztBQUM5QixlQUFPLENBQUM7QUFBQSxNQUNWO0FBQ0EsYUFBTyxpQkFBaUIsT0FBTyxTQUFTLGdCQUFnQjtBQUN0RCxlQUFPQSxXQUFVLGNBQWMsS0FBS29CLFVBQVMsZ0JBQWdCLGNBQWMsS0FBS2hCLGFBQVksY0FBYyxNQUFNO0FBQUEsTUFDbEgsQ0FBQztBQUFBLElBQ0g7QUFDQSxhQUFTbUIsaUJBQWdCLFNBQVMsVUFBVSxjQUFjO0FBQ3hELFVBQUksc0JBQXNCLGFBQWEsb0JBQW9CLG1CQUFtQixPQUFPLElBQUksQ0FBQyxFQUFFLE9BQU8sUUFBUTtBQUMzRyxVQUFJLG1CQUFtQixDQUFDLEVBQUUsT0FBTyxxQkFBcUIsQ0FBQyxZQUFZLENBQUM7QUFDcEUsVUFBSSxzQkFBc0IsaUJBQWlCLENBQUM7QUFDNUMsVUFBSSxlQUFlLGlCQUFpQixPQUFPLFNBQVMsU0FBUyxnQkFBZ0I7QUFDM0UsWUFBSSxPQUFPLDJCQUEyQixTQUFTLGNBQWM7QUFDN0QsZ0JBQVEsTUFBTVAsS0FBSSxLQUFLLEtBQUssUUFBUSxHQUFHO0FBQ3ZDLGdCQUFRLFFBQVFDLEtBQUksS0FBSyxPQUFPLFFBQVEsS0FBSztBQUM3QyxnQkFBUSxTQUFTQSxLQUFJLEtBQUssUUFBUSxRQUFRLE1BQU07QUFDaEQsZ0JBQVEsT0FBT0QsS0FBSSxLQUFLLE1BQU0sUUFBUSxJQUFJO0FBQzFDLGVBQU87QUFBQSxNQUNULEdBQUcsMkJBQTJCLFNBQVMsbUJBQW1CLENBQUM7QUFDM0QsbUJBQWEsUUFBUSxhQUFhLFFBQVEsYUFBYTtBQUN2RCxtQkFBYSxTQUFTLGFBQWEsU0FBUyxhQUFhO0FBQ3pELG1CQUFhLElBQUksYUFBYTtBQUM5QixtQkFBYSxJQUFJLGFBQWE7QUFDOUIsYUFBTztBQUFBLElBQ1Q7QUFDQSxhQUFTLGFBQWEsV0FBVztBQUMvQixhQUFPLFVBQVUsTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUFBLElBQy9CO0FBQ0EsYUFBU1EsMEJBQXlCLFdBQVc7QUFDM0MsYUFBTyxDQUFDLE9BQU8sUUFBUSxFQUFFLFFBQVEsU0FBUyxLQUFLLElBQUksTUFBTTtBQUFBLElBQzNEO0FBQ0EsYUFBUyxlQUFlLE1BQU07QUFDNUIsVUFBSSxhQUFhLEtBQUssV0FBVyxVQUFVLEtBQUssU0FBUyxZQUFZLEtBQUs7QUFDMUUsVUFBSSxnQkFBZ0IsWUFBWSxpQkFBaUIsU0FBUyxJQUFJO0FBQzlELFVBQUksWUFBWSxZQUFZLGFBQWEsU0FBUyxJQUFJO0FBQ3RELFVBQUksVUFBVSxXQUFXLElBQUksV0FBVyxRQUFRLElBQUksUUFBUSxRQUFRO0FBQ3BFLFVBQUksVUFBVSxXQUFXLElBQUksV0FBVyxTQUFTLElBQUksUUFBUSxTQUFTO0FBQ3RFLFVBQUk7QUFDSixjQUFRLGVBQWU7QUFBQSxRQUNyQixLQUFLO0FBQ0gsb0JBQVU7QUFBQSxZQUNSLEdBQUc7QUFBQSxZQUNILEdBQUcsV0FBVyxJQUFJLFFBQVE7QUFBQSxVQUM1QjtBQUNBO0FBQUEsUUFDRixLQUFLO0FBQ0gsb0JBQVU7QUFBQSxZQUNSLEdBQUc7QUFBQSxZQUNILEdBQUcsV0FBVyxJQUFJLFdBQVc7QUFBQSxVQUMvQjtBQUNBO0FBQUEsUUFDRixLQUFLO0FBQ0gsb0JBQVU7QUFBQSxZQUNSLEdBQUcsV0FBVyxJQUFJLFdBQVc7QUFBQSxZQUM3QixHQUFHO0FBQUEsVUFDTDtBQUNBO0FBQUEsUUFDRixLQUFLO0FBQ0gsb0JBQVU7QUFBQSxZQUNSLEdBQUcsV0FBVyxJQUFJLFFBQVE7QUFBQSxZQUMxQixHQUFHO0FBQUEsVUFDTDtBQUNBO0FBQUEsUUFDRjtBQUNFLG9CQUFVO0FBQUEsWUFDUixHQUFHLFdBQVc7QUFBQSxZQUNkLEdBQUcsV0FBVztBQUFBLFVBQ2hCO0FBQUEsTUFDSjtBQUNBLFVBQUksV0FBVyxnQkFBZ0JBLDBCQUF5QixhQUFhLElBQUk7QUFDekUsVUFBSSxZQUFZLE1BQU07QUFDcEIsWUFBSSxNQUFNLGFBQWEsTUFBTSxXQUFXO0FBQ3hDLGdCQUFRLFdBQVc7QUFBQSxVQUNqQixLQUFLO0FBQ0gsb0JBQVEsUUFBUSxJQUFJLFFBQVEsUUFBUSxLQUFLLFdBQVcsR0FBRyxJQUFJLElBQUksUUFBUSxHQUFHLElBQUk7QUFDOUU7QUFBQSxVQUNGLEtBQUs7QUFDSCxvQkFBUSxRQUFRLElBQUksUUFBUSxRQUFRLEtBQUssV0FBVyxHQUFHLElBQUksSUFBSSxRQUFRLEdBQUcsSUFBSTtBQUM5RTtBQUFBLFFBQ0o7QUFBQSxNQUNGO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFDQSxhQUFTLHFCQUFxQjtBQUM1QixhQUFPO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxPQUFPO0FBQUEsUUFDUCxRQUFRO0FBQUEsUUFDUixNQUFNO0FBQUEsTUFDUjtBQUFBLElBQ0Y7QUFDQSxhQUFTLG1CQUFtQixlQUFlO0FBQ3pDLGFBQU8sT0FBTyxPQUFPLENBQUMsR0FBRyxtQkFBbUIsR0FBRyxhQUFhO0FBQUEsSUFDOUQ7QUFDQSxhQUFTLGdCQUFnQixPQUFPLE1BQU07QUFDcEMsYUFBTyxLQUFLLE9BQU8sU0FBUyxTQUFTLEtBQUs7QUFDeEMsZ0JBQVEsR0FBRyxJQUFJO0FBQ2YsZUFBTztBQUFBLE1BQ1QsR0FBRyxDQUFDLENBQUM7QUFBQSxJQUNQO0FBQ0EsYUFBU0MsZ0JBQWUsT0FBTyxTQUFTO0FBQ3RDLFVBQUksWUFBWSxRQUFRO0FBQ3RCLGtCQUFVLENBQUM7QUFBQSxNQUNiO0FBQ0EsVUFBSSxXQUFXLFNBQVMscUJBQXFCLFNBQVMsV0FBVyxZQUFZLHVCQUF1QixTQUFTLE1BQU0sWUFBWSxvQkFBb0Isb0JBQW9CLFNBQVMsVUFBVSxXQUFXLHNCQUFzQixTQUFTLGtCQUFrQixtQkFBbUIsd0JBQXdCLFNBQVMsY0FBYyxlQUFlLDBCQUEwQixTQUFTLFdBQVcsdUJBQXVCLHdCQUF3QixTQUFTLGdCQUFnQixpQkFBaUIsMEJBQTBCLFNBQVMsU0FBUyx1QkFBdUIsdUJBQXVCLFNBQVMsYUFBYSxjQUFjLHlCQUF5QixTQUFTLFFBQVEsc0JBQXNCLG1CQUFtQixTQUFTLFNBQVMsVUFBVSxxQkFBcUIsU0FBUyxJQUFJO0FBQzd0QixVQUFJLGdCQUFnQixtQkFBbUIsT0FBTyxZQUFZLFdBQVcsVUFBVSxnQkFBZ0IsU0FBUyxjQUFjLENBQUM7QUFDdkgsVUFBSSxhQUFhLG1CQUFtQixTQUFTLFlBQVk7QUFDekQsVUFBSSxtQkFBbUIsTUFBTSxTQUFTO0FBQ3RDLFVBQUksYUFBYSxNQUFNLE1BQU07QUFDN0IsVUFBSSxVQUFVLE1BQU0sU0FBUyxjQUFjLGFBQWEsY0FBYztBQUN0RSxVQUFJLHFCQUFxQkYsaUJBQWdCdkIsV0FBVSxPQUFPLElBQUksVUFBVSxRQUFRLGtCQUFrQkssb0JBQW1CLE1BQU0sU0FBUyxNQUFNLEdBQUcsVUFBVSxZQUFZO0FBQ25LLFVBQUksc0JBQXNCUCx1QkFBc0IsZ0JBQWdCO0FBQ2hFLFVBQUksaUJBQWlCLGVBQWU7QUFBQSxRQUNsQyxXQUFXO0FBQUEsUUFDWCxTQUFTO0FBQUEsUUFDVCxVQUFVO0FBQUEsUUFDVjtBQUFBLE1BQ0YsQ0FBQztBQUNELFVBQUksbUJBQW1CdUIsa0JBQWlCLE9BQU8sT0FBTyxDQUFDLEdBQUcsWUFBWSxjQUFjLENBQUM7QUFDckYsVUFBSSxvQkFBb0IsbUJBQW1CLFNBQVMsbUJBQW1CO0FBQ3ZFLFVBQUksa0JBQWtCO0FBQUEsUUFDcEIsS0FBSyxtQkFBbUIsTUFBTSxrQkFBa0IsTUFBTSxjQUFjO0FBQUEsUUFDcEUsUUFBUSxrQkFBa0IsU0FBUyxtQkFBbUIsU0FBUyxjQUFjO0FBQUEsUUFDN0UsTUFBTSxtQkFBbUIsT0FBTyxrQkFBa0IsT0FBTyxjQUFjO0FBQUEsUUFDdkUsT0FBTyxrQkFBa0IsUUFBUSxtQkFBbUIsUUFBUSxjQUFjO0FBQUEsTUFDNUU7QUFDQSxVQUFJLGFBQWEsTUFBTSxjQUFjO0FBQ3JDLFVBQUksbUJBQW1CLFVBQVUsWUFBWTtBQUMzQyxZQUFJSyxXQUFVLFdBQVcsU0FBUztBQUNsQyxlQUFPLEtBQUssZUFBZSxFQUFFLFFBQVEsU0FBUyxLQUFLO0FBQ2pELGNBQUksV0FBVyxDQUFDLE9BQU8sTUFBTSxFQUFFLFFBQVEsR0FBRyxLQUFLLElBQUksSUFBSTtBQUN2RCxjQUFJLE9BQU8sQ0FBQyxLQUFLLE1BQU0sRUFBRSxRQUFRLEdBQUcsS0FBSyxJQUFJLE1BQU07QUFDbkQsMEJBQWdCLEdBQUcsS0FBS0EsU0FBUSxJQUFJLElBQUk7QUFBQSxRQUMxQyxDQUFDO0FBQUEsTUFDSDtBQUNBLGFBQU87QUFBQSxJQUNUO0FBQ0EsUUFBSSx3QkFBd0I7QUFDNUIsUUFBSSxzQkFBc0I7QUFDMUIsUUFBSSxrQkFBa0I7QUFBQSxNQUNwQixXQUFXO0FBQUEsTUFDWCxXQUFXLENBQUM7QUFBQSxNQUNaLFVBQVU7QUFBQSxJQUNaO0FBQ0EsYUFBUyxtQkFBbUI7QUFDMUIsZUFBUyxPQUFPLFVBQVUsUUFBUSxPQUFPLElBQUksTUFBTSxJQUFJLEdBQUcsT0FBTyxHQUFHLE9BQU8sTUFBTSxRQUFRO0FBQ3ZGLGFBQUssSUFBSSxJQUFJLFVBQVUsSUFBSTtBQUFBLE1BQzdCO0FBQ0EsYUFBTyxDQUFDLEtBQUssS0FBSyxTQUFTLFNBQVM7QUFDbEMsZUFBTyxFQUFFLFdBQVcsT0FBTyxRQUFRLDBCQUEwQjtBQUFBLE1BQy9ELENBQUM7QUFBQSxJQUNIO0FBQ0EsYUFBUyxnQkFBZ0Isa0JBQWtCO0FBQ3pDLFVBQUkscUJBQXFCLFFBQVE7QUFDL0IsMkJBQW1CLENBQUM7QUFBQSxNQUN0QjtBQUNBLFVBQUksb0JBQW9CLGtCQUFrQix3QkFBd0Isa0JBQWtCLGtCQUFrQixvQkFBb0IsMEJBQTBCLFNBQVMsQ0FBQyxJQUFJLHVCQUF1Qix5QkFBeUIsa0JBQWtCLGdCQUFnQixpQkFBaUIsMkJBQTJCLFNBQVMsa0JBQWtCO0FBQzNULGFBQU8sU0FBUyxjQUFjLFlBQVksU0FBUyxTQUFTO0FBQzFELFlBQUksWUFBWSxRQUFRO0FBQ3RCLG9CQUFVO0FBQUEsUUFDWjtBQUNBLFlBQUksUUFBUTtBQUFBLFVBQ1YsV0FBVztBQUFBLFVBQ1gsa0JBQWtCLENBQUM7QUFBQSxVQUNuQixTQUFTLE9BQU8sT0FBTyxDQUFDLEdBQUcsaUJBQWlCLGNBQWM7QUFBQSxVQUMxRCxlQUFlLENBQUM7QUFBQSxVQUNoQixVQUFVO0FBQUEsWUFDUixXQUFXO0FBQUEsWUFDWCxRQUFRO0FBQUEsVUFDVjtBQUFBLFVBQ0EsWUFBWSxDQUFDO0FBQUEsVUFDYixRQUFRLENBQUM7QUFBQSxRQUNYO0FBQ0EsWUFBSSxtQkFBbUIsQ0FBQztBQUN4QixZQUFJLGNBQWM7QUFDbEIsWUFBSSxXQUFXO0FBQUEsVUFDYjtBQUFBLFVBQ0EsWUFBWSxTQUFTLFdBQVcsVUFBVTtBQUN4QyxtQ0FBdUI7QUFDdkIsa0JBQU0sVUFBVSxPQUFPLE9BQU8sQ0FBQyxHQUFHLGdCQUFnQixNQUFNLFNBQVMsUUFBUTtBQUN6RSxrQkFBTSxnQkFBZ0I7QUFBQSxjQUNwQixXQUFXMUIsV0FBVSxVQUFVLElBQUksa0JBQWtCLFVBQVUsSUFBSSxXQUFXLGlCQUFpQixrQkFBa0IsV0FBVyxjQUFjLElBQUksQ0FBQztBQUFBLGNBQy9JLFFBQVEsa0JBQWtCLE9BQU87QUFBQSxZQUNuQztBQUNBLGdCQUFJLG1CQUFtQixlQUFlLFlBQVksQ0FBQyxFQUFFLE9BQU8sbUJBQW1CLE1BQU0sUUFBUSxTQUFTLENBQUMsQ0FBQztBQUN4RyxrQkFBTSxtQkFBbUIsaUJBQWlCLE9BQU8sU0FBUyxHQUFHO0FBQzNELHFCQUFPLEVBQUU7QUFBQSxZQUNYLENBQUM7QUFDRCxnQkFBSSxNQUFNO0FBQ1Isa0JBQUksWUFBWSxTQUFTLENBQUMsRUFBRSxPQUFPLGtCQUFrQixNQUFNLFFBQVEsU0FBUyxHQUFHLFNBQVMsTUFBTTtBQUM1RixvQkFBSSxPQUFPLEtBQUs7QUFDaEIsdUJBQU87QUFBQSxjQUNULENBQUM7QUFDRCxnQ0FBa0IsU0FBUztBQUMzQixrQkFBSSxpQkFBaUIsTUFBTSxRQUFRLFNBQVMsTUFBTSxNQUFNO0FBQ3RELG9CQUFJLGVBQWUsTUFBTSxpQkFBaUIsS0FBSyxTQUFTLE9BQU87QUFDN0Qsc0JBQUksT0FBTyxNQUFNO0FBQ2pCLHlCQUFPLFNBQVM7QUFBQSxnQkFDbEIsQ0FBQztBQUNELG9CQUFJLENBQUMsY0FBYztBQUNqQiwwQkFBUSxNQUFNLENBQUMsNERBQTRELDhCQUE4QixFQUFFLEtBQUssR0FBRyxDQUFDO0FBQUEsZ0JBQ3RIO0FBQUEsY0FDRjtBQUNBLGtCQUFJLG9CQUFvQk8sa0JBQWlCLE9BQU8sR0FBRyxZQUFZLGtCQUFrQixXQUFXLGNBQWMsa0JBQWtCLGFBQWEsZUFBZSxrQkFBa0IsY0FBYyxhQUFhLGtCQUFrQjtBQUN2TixrQkFBSSxDQUFDLFdBQVcsYUFBYSxjQUFjLFVBQVUsRUFBRSxLQUFLLFNBQVMsUUFBUTtBQUMzRSx1QkFBTyxXQUFXLE1BQU07QUFBQSxjQUMxQixDQUFDLEdBQUc7QUFDRix3QkFBUSxLQUFLLENBQUMsK0RBQStELDZEQUE2RCw4REFBOEQsNERBQTRELFlBQVksRUFBRSxLQUFLLEdBQUcsQ0FBQztBQUFBLGNBQzdSO0FBQUEsWUFDRjtBQUNBLCtCQUFtQjtBQUNuQixtQkFBTyxTQUFTLE9BQU87QUFBQSxVQUN6QjtBQUFBLFVBQ0EsYUFBYSxTQUFTLGNBQWM7QUFDbEMsZ0JBQUksYUFBYTtBQUNmO0FBQUEsWUFDRjtBQUNBLGdCQUFJLGtCQUFrQixNQUFNLFVBQVUsYUFBYSxnQkFBZ0IsV0FBVyxVQUFVLGdCQUFnQjtBQUN4RyxnQkFBSSxDQUFDLGlCQUFpQixZQUFZLE9BQU8sR0FBRztBQUMxQyxrQkFBSSxNQUFNO0FBQ1Isd0JBQVEsTUFBTSxxQkFBcUI7QUFBQSxjQUNyQztBQUNBO0FBQUEsWUFDRjtBQUNBLGtCQUFNLFFBQVE7QUFBQSxjQUNaLFdBQVcsaUJBQWlCLFlBQVlNLGlCQUFnQixPQUFPLEdBQUcsTUFBTSxRQUFRLGFBQWEsT0FBTztBQUFBLGNBQ3BHLFFBQVEsY0FBYyxPQUFPO0FBQUEsWUFDL0I7QUFDQSxrQkFBTSxRQUFRO0FBQ2Qsa0JBQU0sWUFBWSxNQUFNLFFBQVE7QUFDaEMsa0JBQU0saUJBQWlCLFFBQVEsU0FBUyxVQUFVO0FBQ2hELHFCQUFPLE1BQU0sY0FBYyxTQUFTLElBQUksSUFBSSxPQUFPLE9BQU8sQ0FBQyxHQUFHLFNBQVMsSUFBSTtBQUFBLFlBQzdFLENBQUM7QUFDRCxnQkFBSSxrQkFBa0I7QUFDdEIscUJBQVNjLFNBQVEsR0FBR0EsU0FBUSxNQUFNLGlCQUFpQixRQUFRQSxVQUFTO0FBQ2xFLGtCQUFJLE1BQU07QUFDUixtQ0FBbUI7QUFDbkIsb0JBQUksa0JBQWtCLEtBQUs7QUFDekIsMEJBQVEsTUFBTSxtQkFBbUI7QUFDakM7QUFBQSxnQkFDRjtBQUFBLGNBQ0Y7QUFDQSxrQkFBSSxNQUFNLFVBQVUsTUFBTTtBQUN4QixzQkFBTSxRQUFRO0FBQ2QsZ0JBQUFBLFNBQVE7QUFDUjtBQUFBLGNBQ0Y7QUFDQSxrQkFBSSx3QkFBd0IsTUFBTSxpQkFBaUJBLE1BQUssR0FBRyxLQUFLLHNCQUFzQixJQUFJLHlCQUF5QixzQkFBc0IsU0FBUyxXQUFXLDJCQUEyQixTQUFTLENBQUMsSUFBSSx3QkFBd0IsT0FBTyxzQkFBc0I7QUFDM1Asa0JBQUksT0FBTyxPQUFPLFlBQVk7QUFDNUIsd0JBQVEsR0FBRztBQUFBLGtCQUNUO0FBQUEsa0JBQ0EsU0FBUztBQUFBLGtCQUNUO0FBQUEsa0JBQ0E7QUFBQSxnQkFDRixDQUFDLEtBQUs7QUFBQSxjQUNSO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxVQUNBLFFBQVEsU0FBUyxXQUFXO0FBQzFCLG1CQUFPLElBQUksUUFBUSxTQUFTLFNBQVM7QUFDbkMsdUJBQVMsWUFBWTtBQUNyQixzQkFBUSxLQUFLO0FBQUEsWUFDZixDQUFDO0FBQUEsVUFDSCxDQUFDO0FBQUEsVUFDRCxTQUFTLFNBQVNDLFdBQVU7QUFDMUIsbUNBQXVCO0FBQ3ZCLDBCQUFjO0FBQUEsVUFDaEI7QUFBQSxRQUNGO0FBQ0EsWUFBSSxDQUFDLGlCQUFpQixZQUFZLE9BQU8sR0FBRztBQUMxQyxjQUFJLE1BQU07QUFDUixvQkFBUSxNQUFNLHFCQUFxQjtBQUFBLFVBQ3JDO0FBQ0EsaUJBQU87QUFBQSxRQUNUO0FBQ0EsaUJBQVMsV0FBVyxPQUFPLEVBQUUsS0FBSyxTQUFTLFFBQVE7QUFDakQsY0FBSSxDQUFDLGVBQWUsUUFBUSxlQUFlO0FBQ3pDLG9CQUFRLGNBQWMsTUFBTTtBQUFBLFVBQzlCO0FBQUEsUUFDRixDQUFDO0FBQ0QsaUJBQVMscUJBQXFCO0FBQzVCLGdCQUFNLGlCQUFpQixRQUFRLFNBQVMsT0FBTztBQUM3QyxnQkFBSSxPQUFPLE1BQU0sTUFBTSxnQkFBZ0IsTUFBTSxTQUFTLFdBQVcsa0JBQWtCLFNBQVMsQ0FBQyxJQUFJLGVBQWUsVUFBVSxNQUFNO0FBQ2hJLGdCQUFJLE9BQU8sWUFBWSxZQUFZO0FBQ2pDLGtCQUFJLFlBQVksUUFBUTtBQUFBLGdCQUN0QjtBQUFBLGdCQUNBO0FBQUEsZ0JBQ0E7QUFBQSxnQkFDQSxTQUFTO0FBQUEsY0FDWCxDQUFDO0FBQ0Qsa0JBQUksU0FBUyxTQUFTLFVBQVU7QUFBQSxjQUNoQztBQUNBLCtCQUFpQixLQUFLLGFBQWEsTUFBTTtBQUFBLFlBQzNDO0FBQUEsVUFDRixDQUFDO0FBQUEsUUFDSDtBQUNBLGlCQUFTLHlCQUF5QjtBQUNoQywyQkFBaUIsUUFBUSxTQUFTLElBQUk7QUFDcEMsbUJBQU8sR0FBRztBQUFBLFVBQ1osQ0FBQztBQUNELDZCQUFtQixDQUFDO0FBQUEsUUFDdEI7QUFDQSxlQUFPO0FBQUEsTUFDVDtBQUFBLElBQ0Y7QUFDQSxRQUFJLFVBQVU7QUFBQSxNQUNaLFNBQVM7QUFBQSxJQUNYO0FBQ0EsYUFBUyxTQUFTLE1BQU07QUFDdEIsVUFBSSxRQUFRLEtBQUssT0FBTyxXQUFXLEtBQUssVUFBVSxVQUFVLEtBQUs7QUFDakUsVUFBSSxrQkFBa0IsUUFBUSxRQUFRLFNBQVMsb0JBQW9CLFNBQVMsT0FBTyxpQkFBaUIsa0JBQWtCLFFBQVEsUUFBUSxTQUFTLG9CQUFvQixTQUFTLE9BQU87QUFDbkwsVUFBSSxVQUFVN0IsV0FBVSxNQUFNLFNBQVMsTUFBTTtBQUM3QyxVQUFJLGdCQUFnQixDQUFDLEVBQUUsT0FBTyxNQUFNLGNBQWMsV0FBVyxNQUFNLGNBQWMsTUFBTTtBQUN2RixVQUFJLFFBQVE7QUFDVixzQkFBYyxRQUFRLFNBQVMsY0FBYztBQUMzQyx1QkFBYSxpQkFBaUIsVUFBVSxTQUFTLFFBQVEsT0FBTztBQUFBLFFBQ2xFLENBQUM7QUFBQSxNQUNIO0FBQ0EsVUFBSSxRQUFRO0FBQ1YsZ0JBQVEsaUJBQWlCLFVBQVUsU0FBUyxRQUFRLE9BQU87QUFBQSxNQUM3RDtBQUNBLGFBQU8sV0FBVztBQUNoQixZQUFJLFFBQVE7QUFDVix3QkFBYyxRQUFRLFNBQVMsY0FBYztBQUMzQyx5QkFBYSxvQkFBb0IsVUFBVSxTQUFTLFFBQVEsT0FBTztBQUFBLFVBQ3JFLENBQUM7QUFBQSxRQUNIO0FBQ0EsWUFBSSxRQUFRO0FBQ1Ysa0JBQVEsb0JBQW9CLFVBQVUsU0FBUyxRQUFRLE9BQU87QUFBQSxRQUNoRTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsUUFBSSxpQkFBaUI7QUFBQSxNQUNuQixNQUFNO0FBQUEsTUFDTixTQUFTO0FBQUEsTUFDVCxPQUFPO0FBQUEsTUFDUCxJQUFJLFNBQVMsS0FBSztBQUFBLE1BQ2xCO0FBQUEsTUFDQSxRQUFRO0FBQUEsTUFDUixNQUFNLENBQUM7QUFBQSxJQUNUO0FBQ0EsYUFBUyxjQUFjLE1BQU07QUFDM0IsVUFBSSxRQUFRLEtBQUssT0FBTyxPQUFPLEtBQUs7QUFDcEMsWUFBTSxjQUFjLElBQUksSUFBSSxlQUFlO0FBQUEsUUFDekMsV0FBVyxNQUFNLE1BQU07QUFBQSxRQUN2QixTQUFTLE1BQU0sTUFBTTtBQUFBLFFBQ3JCLFVBQVU7QUFBQSxRQUNWLFdBQVcsTUFBTTtBQUFBLE1BQ25CLENBQUM7QUFBQSxJQUNIO0FBQ0EsUUFBSSxrQkFBa0I7QUFBQSxNQUNwQixNQUFNO0FBQUEsTUFDTixTQUFTO0FBQUEsTUFDVCxPQUFPO0FBQUEsTUFDUCxJQUFJO0FBQUEsTUFDSixNQUFNLENBQUM7QUFBQSxJQUNUO0FBQ0EsUUFBSSxhQUFhO0FBQUEsTUFDZixLQUFLO0FBQUEsTUFDTCxPQUFPO0FBQUEsTUFDUCxRQUFRO0FBQUEsTUFDUixNQUFNO0FBQUEsSUFDUjtBQUNBLGFBQVMsa0JBQWtCLE1BQU07QUFDL0IsVUFBSSxJQUFJLEtBQUssR0FBRyxJQUFJLEtBQUs7QUFDekIsVUFBSSxNQUFNO0FBQ1YsVUFBSSxNQUFNLElBQUksb0JBQW9CO0FBQ2xDLGFBQU87QUFBQSxRQUNMLEdBQUdtQixPQUFNQSxPQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsS0FBSztBQUFBLFFBQ2xDLEdBQUdBLE9BQU1BLE9BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxLQUFLO0FBQUEsTUFDcEM7QUFBQSxJQUNGO0FBQ0EsYUFBUyxZQUFZLE9BQU87QUFDMUIsVUFBSTtBQUNKLFVBQUksVUFBVSxNQUFNLFFBQVEsYUFBYSxNQUFNLFlBQVksWUFBWSxNQUFNLFdBQVcsVUFBVSxNQUFNLFNBQVMsV0FBVyxNQUFNLFVBQVUsa0JBQWtCLE1BQU0saUJBQWlCLFdBQVcsTUFBTSxVQUFVLGVBQWUsTUFBTTtBQUNyTyxVQUFJLFFBQVEsaUJBQWlCLE9BQU8sa0JBQWtCLE9BQU8sSUFBSSxPQUFPLGlCQUFpQixhQUFhLGFBQWEsT0FBTyxJQUFJLFNBQVMsVUFBVSxNQUFNLEdBQUcsSUFBSSxZQUFZLFNBQVMsSUFBSSxTQUFTLFVBQVUsTUFBTSxHQUFHLElBQUksWUFBWSxTQUFTLElBQUk7QUFDaFAsVUFBSSxPQUFPLFFBQVEsZUFBZSxHQUFHO0FBQ3JDLFVBQUksT0FBTyxRQUFRLGVBQWUsR0FBRztBQUNyQyxVQUFJLFFBQVE7QUFDWixVQUFJLFFBQVE7QUFDWixVQUFJLE1BQU07QUFDVixVQUFJLFVBQVU7QUFDWixZQUFJLGVBQWVMLGlCQUFnQixPQUFPO0FBQzFDLFlBQUksYUFBYTtBQUNqQixZQUFJLFlBQVk7QUFDaEIsWUFBSSxpQkFBaUJkLFdBQVUsT0FBTyxHQUFHO0FBQ3ZDLHlCQUFlTSxvQkFBbUIsT0FBTztBQUN6QyxjQUFJRSxrQkFBaUIsWUFBWSxFQUFFLGFBQWEsVUFBVTtBQUN4RCx5QkFBYTtBQUNiLHdCQUFZO0FBQUEsVUFDZDtBQUFBLFFBQ0Y7QUFDQSx1QkFBZTtBQUNmLFlBQUksY0FBYyxLQUFLO0FBQ3JCLGtCQUFRO0FBQ1IsZUFBSyxhQUFhLFVBQVUsSUFBSSxXQUFXO0FBQzNDLGVBQUssa0JBQWtCLElBQUk7QUFBQSxRQUM3QjtBQUNBLFlBQUksY0FBYyxNQUFNO0FBQ3RCLGtCQUFRO0FBQ1IsZUFBSyxhQUFhLFNBQVMsSUFBSSxXQUFXO0FBQzFDLGVBQUssa0JBQWtCLElBQUk7QUFBQSxRQUM3QjtBQUFBLE1BQ0Y7QUFDQSxVQUFJLGVBQWUsT0FBTyxPQUFPO0FBQUEsUUFDL0I7QUFBQSxNQUNGLEdBQUcsWUFBWSxVQUFVO0FBQ3pCLFVBQUksaUJBQWlCO0FBQ25CLFlBQUk7QUFDSixlQUFPLE9BQU8sT0FBTyxDQUFDLEdBQUcsZUFBZSxpQkFBaUIsQ0FBQyxHQUFHLGVBQWUsS0FBSyxJQUFJLE9BQU8sTUFBTSxJQUFJLGVBQWUsS0FBSyxJQUFJLE9BQU8sTUFBTSxJQUFJLGVBQWUsYUFBYSxJQUFJLG9CQUFvQixLQUFLLElBQUksZUFBZSxJQUFJLFNBQVMsSUFBSSxRQUFRLGlCQUFpQixJQUFJLFNBQVMsSUFBSSxVQUFVLGVBQWU7QUFBQSxNQUNqVDtBQUNBLGFBQU8sT0FBTyxPQUFPLENBQUMsR0FBRyxlQUFlLGtCQUFrQixDQUFDLEdBQUcsZ0JBQWdCLEtBQUssSUFBSSxPQUFPLElBQUksT0FBTyxJQUFJLGdCQUFnQixLQUFLLElBQUksT0FBTyxJQUFJLE9BQU8sSUFBSSxnQkFBZ0IsWUFBWSxJQUFJLGdCQUFnQjtBQUFBLElBQzlNO0FBQ0EsYUFBUyxjQUFjLE9BQU87QUFDNUIsVUFBSSxRQUFRLE1BQU0sT0FBTyxVQUFVLE1BQU07QUFDekMsVUFBSSx3QkFBd0IsUUFBUSxpQkFBaUIsa0JBQWtCLDBCQUEwQixTQUFTLE9BQU8sdUJBQXVCLG9CQUFvQixRQUFRLFVBQVUsV0FBVyxzQkFBc0IsU0FBUyxPQUFPLG1CQUFtQix3QkFBd0IsUUFBUSxjQUFjLGVBQWUsMEJBQTBCLFNBQVMsT0FBTztBQUN6VixVQUFJLE1BQU07QUFDUixZQUFJLHFCQUFxQkEsa0JBQWlCLE1BQU0sU0FBUyxNQUFNLEVBQUUsc0JBQXNCO0FBQ3ZGLFlBQUksWUFBWSxDQUFDLGFBQWEsT0FBTyxTQUFTLFVBQVUsTUFBTSxFQUFFLEtBQUssU0FBUyxVQUFVO0FBQ3RGLGlCQUFPLG1CQUFtQixRQUFRLFFBQVEsS0FBSztBQUFBLFFBQ2pELENBQUMsR0FBRztBQUNGLGtCQUFRLEtBQUssQ0FBQyxxRUFBcUUsa0VBQWtFLFFBQVEsc0VBQXNFLG1FQUFtRSxzRUFBc0UsNENBQTRDLFFBQVEsc0VBQXNFLHFFQUFxRSxFQUFFLEtBQUssR0FBRyxDQUFDO0FBQUEsUUFDeGpCO0FBQUEsTUFDRjtBQUNBLFVBQUksZUFBZTtBQUFBLFFBQ2pCLFdBQVcsaUJBQWlCLE1BQU0sU0FBUztBQUFBLFFBQzNDLFFBQVEsTUFBTSxTQUFTO0FBQUEsUUFDdkIsWUFBWSxNQUFNLE1BQU07QUFBQSxRQUN4QjtBQUFBLE1BQ0Y7QUFDQSxVQUFJLE1BQU0sY0FBYyxpQkFBaUIsTUFBTTtBQUM3QyxjQUFNLE9BQU8sU0FBUyxPQUFPLE9BQU8sQ0FBQyxHQUFHLE1BQU0sT0FBTyxRQUFRLFlBQVksT0FBTyxPQUFPLENBQUMsR0FBRyxjQUFjO0FBQUEsVUFDdkcsU0FBUyxNQUFNLGNBQWM7QUFBQSxVQUM3QixVQUFVLE1BQU0sUUFBUTtBQUFBLFVBQ3hCO0FBQUEsVUFDQTtBQUFBLFFBQ0YsQ0FBQyxDQUFDLENBQUM7QUFBQSxNQUNMO0FBQ0EsVUFBSSxNQUFNLGNBQWMsU0FBUyxNQUFNO0FBQ3JDLGNBQU0sT0FBTyxRQUFRLE9BQU8sT0FBTyxDQUFDLEdBQUcsTUFBTSxPQUFPLE9BQU8sWUFBWSxPQUFPLE9BQU8sQ0FBQyxHQUFHLGNBQWM7QUFBQSxVQUNyRyxTQUFTLE1BQU0sY0FBYztBQUFBLFVBQzdCLFVBQVU7QUFBQSxVQUNWLFVBQVU7QUFBQSxVQUNWO0FBQUEsUUFDRixDQUFDLENBQUMsQ0FBQztBQUFBLE1BQ0w7QUFDQSxZQUFNLFdBQVcsU0FBUyxPQUFPLE9BQU8sQ0FBQyxHQUFHLE1BQU0sV0FBVyxRQUFRO0FBQUEsUUFDbkUseUJBQXlCLE1BQU07QUFBQSxNQUNqQyxDQUFDO0FBQUEsSUFDSDtBQUNBLFFBQUksa0JBQWtCO0FBQUEsTUFDcEIsTUFBTTtBQUFBLE1BQ04sU0FBUztBQUFBLE1BQ1QsT0FBTztBQUFBLE1BQ1AsSUFBSTtBQUFBLE1BQ0osTUFBTSxDQUFDO0FBQUEsSUFDVDtBQUNBLGFBQVMsWUFBWSxNQUFNO0FBQ3pCLFVBQUksUUFBUSxLQUFLO0FBQ2pCLGFBQU8sS0FBSyxNQUFNLFFBQVEsRUFBRSxRQUFRLFNBQVMsTUFBTTtBQUNqRCxZQUFJLFFBQVEsTUFBTSxPQUFPLElBQUksS0FBSyxDQUFDO0FBQ25DLFlBQUksYUFBYSxNQUFNLFdBQVcsSUFBSSxLQUFLLENBQUM7QUFDNUMsWUFBSSxVQUFVLE1BQU0sU0FBUyxJQUFJO0FBQ2pDLFlBQUksQ0FBQ04sZUFBYyxPQUFPLEtBQUssQ0FBQ0csYUFBWSxPQUFPLEdBQUc7QUFDcEQ7QUFBQSxRQUNGO0FBQ0EsZUFBTyxPQUFPLFFBQVEsT0FBTyxLQUFLO0FBQ2xDLGVBQU8sS0FBSyxVQUFVLEVBQUUsUUFBUSxTQUFTLE9BQU87QUFDOUMsY0FBSSxRQUFRLFdBQVcsS0FBSztBQUM1QixjQUFJLFVBQVUsT0FBTztBQUNuQixvQkFBUSxnQkFBZ0IsS0FBSztBQUFBLFVBQy9CLE9BQU87QUFDTCxvQkFBUSxhQUFhLE9BQU8sVUFBVSxPQUFPLEtBQUssS0FBSztBQUFBLFVBQ3pEO0FBQUEsUUFDRixDQUFDO0FBQUEsTUFDSCxDQUFDO0FBQUEsSUFDSDtBQUNBLGFBQVMsU0FBUyxPQUFPO0FBQ3ZCLFVBQUksUUFBUSxNQUFNO0FBQ2xCLFVBQUksZ0JBQWdCO0FBQUEsUUFDbEIsUUFBUTtBQUFBLFVBQ04sVUFBVSxNQUFNLFFBQVE7QUFBQSxVQUN4QixNQUFNO0FBQUEsVUFDTixLQUFLO0FBQUEsVUFDTCxRQUFRO0FBQUEsUUFDVjtBQUFBLFFBQ0EsT0FBTztBQUFBLFVBQ0wsVUFBVTtBQUFBLFFBQ1o7QUFBQSxRQUNBLFdBQVcsQ0FBQztBQUFBLE1BQ2Q7QUFDQSxhQUFPLE9BQU8sTUFBTSxTQUFTLE9BQU8sT0FBTyxjQUFjLE1BQU07QUFDL0QsWUFBTSxTQUFTO0FBQ2YsVUFBSSxNQUFNLFNBQVMsT0FBTztBQUN4QixlQUFPLE9BQU8sTUFBTSxTQUFTLE1BQU0sT0FBTyxjQUFjLEtBQUs7QUFBQSxNQUMvRDtBQUNBLGFBQU8sV0FBVztBQUNoQixlQUFPLEtBQUssTUFBTSxRQUFRLEVBQUUsUUFBUSxTQUFTLE1BQU07QUFDakQsY0FBSSxVQUFVLE1BQU0sU0FBUyxJQUFJO0FBQ2pDLGNBQUksYUFBYSxNQUFNLFdBQVcsSUFBSSxLQUFLLENBQUM7QUFDNUMsY0FBSSxrQkFBa0IsT0FBTyxLQUFLLE1BQU0sT0FBTyxlQUFlLElBQUksSUFBSSxNQUFNLE9BQU8sSUFBSSxJQUFJLGNBQWMsSUFBSSxDQUFDO0FBQzlHLGNBQUksUUFBUSxnQkFBZ0IsT0FBTyxTQUFTLFFBQVEsVUFBVTtBQUM1RCxtQkFBTyxRQUFRLElBQUk7QUFDbkIsbUJBQU87QUFBQSxVQUNULEdBQUcsQ0FBQyxDQUFDO0FBQ0wsY0FBSSxDQUFDSCxlQUFjLE9BQU8sS0FBSyxDQUFDRyxhQUFZLE9BQU8sR0FBRztBQUNwRDtBQUFBLFVBQ0Y7QUFDQSxpQkFBTyxPQUFPLFFBQVEsT0FBTyxLQUFLO0FBQ2xDLGlCQUFPLEtBQUssVUFBVSxFQUFFLFFBQVEsU0FBUyxXQUFXO0FBQ2xELG9CQUFRLGdCQUFnQixTQUFTO0FBQUEsVUFDbkMsQ0FBQztBQUFBLFFBQ0gsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBQ0EsUUFBSSxnQkFBZ0I7QUFBQSxNQUNsQixNQUFNO0FBQUEsTUFDTixTQUFTO0FBQUEsTUFDVCxPQUFPO0FBQUEsTUFDUCxJQUFJO0FBQUEsTUFDSixRQUFRO0FBQUEsTUFDUixVQUFVLENBQUMsZUFBZTtBQUFBLElBQzVCO0FBQ0EsYUFBUyx3QkFBd0IsV0FBVyxPQUFPc0IsVUFBUztBQUMxRCxVQUFJLGdCQUFnQixpQkFBaUIsU0FBUztBQUM5QyxVQUFJLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxFQUFFLFFBQVEsYUFBYSxLQUFLLElBQUksS0FBSztBQUNwRSxVQUFJLE9BQU8sT0FBT0EsYUFBWSxhQUFhQSxTQUFRLE9BQU8sT0FBTyxDQUFDLEdBQUcsT0FBTztBQUFBLFFBQzFFO0FBQUEsTUFDRixDQUFDLENBQUMsSUFBSUEsVUFBUyxXQUFXLEtBQUssQ0FBQyxHQUFHLFdBQVcsS0FBSyxDQUFDO0FBQ3BELGlCQUFXLFlBQVk7QUFDdkIsa0JBQVksWUFBWSxLQUFLO0FBQzdCLGFBQU8sQ0FBQyxNQUFNLEtBQUssRUFBRSxRQUFRLGFBQWEsS0FBSyxJQUFJO0FBQUEsUUFDakQsR0FBRztBQUFBLFFBQ0gsR0FBRztBQUFBLE1BQ0wsSUFBSTtBQUFBLFFBQ0YsR0FBRztBQUFBLFFBQ0gsR0FBRztBQUFBLE1BQ0w7QUFBQSxJQUNGO0FBQ0EsYUFBU0csUUFBTyxPQUFPO0FBQ3JCLFVBQUksUUFBUSxNQUFNLE9BQU8sVUFBVSxNQUFNLFNBQVMsT0FBTyxNQUFNO0FBQy9ELFVBQUksa0JBQWtCLFFBQVEsUUFBUUgsV0FBVSxvQkFBb0IsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJO0FBQ3RGLFVBQUksT0FBTyxXQUFXLE9BQU8sU0FBUyxLQUFLLFdBQVc7QUFDcEQsWUFBSSxTQUFTLElBQUksd0JBQXdCLFdBQVcsTUFBTSxPQUFPQSxRQUFPO0FBQ3hFLGVBQU87QUFBQSxNQUNULEdBQUcsQ0FBQyxDQUFDO0FBQ0wsVUFBSSx3QkFBd0IsS0FBSyxNQUFNLFNBQVMsR0FBRyxJQUFJLHNCQUFzQixHQUFHLElBQUksc0JBQXNCO0FBQzFHLFVBQUksTUFBTSxjQUFjLGlCQUFpQixNQUFNO0FBQzdDLGNBQU0sY0FBYyxjQUFjLEtBQUs7QUFDdkMsY0FBTSxjQUFjLGNBQWMsS0FBSztBQUFBLE1BQ3pDO0FBQ0EsWUFBTSxjQUFjLElBQUksSUFBSTtBQUFBLElBQzlCO0FBQ0EsUUFBSSxXQUFXO0FBQUEsTUFDYixNQUFNO0FBQUEsTUFDTixTQUFTO0FBQUEsTUFDVCxPQUFPO0FBQUEsTUFDUCxVQUFVLENBQUMsZUFBZTtBQUFBLE1BQzFCLElBQUlHO0FBQUEsSUFDTjtBQUNBLFFBQUlDLFVBQVM7QUFBQSxNQUNYLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxNQUNQLFFBQVE7QUFBQSxNQUNSLEtBQUs7QUFBQSxJQUNQO0FBQ0EsYUFBU0Msc0JBQXFCLFdBQVc7QUFDdkMsYUFBTyxVQUFVLFFBQVEsMEJBQTBCLFNBQVMsU0FBUztBQUNuRSxlQUFPRCxRQUFPLE9BQU87QUFBQSxNQUN2QixDQUFDO0FBQUEsSUFDSDtBQUNBLFFBQUlFLFFBQU87QUFBQSxNQUNULE9BQU87QUFBQSxNQUNQLEtBQUs7QUFBQSxJQUNQO0FBQ0EsYUFBUyw4QkFBOEIsV0FBVztBQUNoRCxhQUFPLFVBQVUsUUFBUSxjQUFjLFNBQVMsU0FBUztBQUN2RCxlQUFPQSxNQUFLLE9BQU87QUFBQSxNQUNyQixDQUFDO0FBQUEsSUFDSDtBQUNBLGFBQVMscUJBQXFCLE9BQU8sU0FBUztBQUM1QyxVQUFJLFlBQVksUUFBUTtBQUN0QixrQkFBVSxDQUFDO0FBQUEsTUFDYjtBQUNBLFVBQUksV0FBVyxTQUFTLFlBQVksU0FBUyxXQUFXLFdBQVcsU0FBUyxVQUFVLGVBQWUsU0FBUyxjQUFjLFVBQVUsU0FBUyxTQUFTLGlCQUFpQixTQUFTLGdCQUFnQix3QkFBd0IsU0FBUyx1QkFBdUIsd0JBQXdCLDBCQUEwQixTQUFTLGFBQWE7QUFDbFUsVUFBSSxZQUFZLGFBQWEsU0FBUztBQUN0QyxVQUFJLGVBQWUsWUFBWSxpQkFBaUIsc0JBQXNCLG9CQUFvQixPQUFPLFNBQVMsWUFBWTtBQUNwSCxlQUFPLGFBQWEsVUFBVSxNQUFNO0FBQUEsTUFDdEMsQ0FBQyxJQUFJO0FBQ0wsVUFBSSxvQkFBb0IsYUFBYSxPQUFPLFNBQVMsWUFBWTtBQUMvRCxlQUFPLHNCQUFzQixRQUFRLFVBQVUsS0FBSztBQUFBLE1BQ3RELENBQUM7QUFDRCxVQUFJLGtCQUFrQixXQUFXLEdBQUc7QUFDbEMsNEJBQW9CO0FBQ3BCLFlBQUksTUFBTTtBQUNSLGtCQUFRLE1BQU0sQ0FBQyxnRUFBZ0UsbUVBQW1FLDhCQUE4QiwrREFBK0QsMkJBQTJCLEVBQUUsS0FBSyxHQUFHLENBQUM7QUFBQSxRQUN2UjtBQUFBLE1BQ0Y7QUFDQSxVQUFJLFlBQVksa0JBQWtCLE9BQU8sU0FBUyxLQUFLLFlBQVk7QUFDakUsWUFBSSxVQUFVLElBQUlQLGdCQUFlLE9BQU87QUFBQSxVQUN0QyxXQUFXO0FBQUEsVUFDWDtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDRixDQUFDLEVBQUUsaUJBQWlCLFVBQVUsQ0FBQztBQUMvQixlQUFPO0FBQUEsTUFDVCxHQUFHLENBQUMsQ0FBQztBQUNMLGFBQU8sT0FBTyxLQUFLLFNBQVMsRUFBRSxLQUFLLFNBQVMsR0FBRyxHQUFHO0FBQ2hELGVBQU8sVUFBVSxDQUFDLElBQUksVUFBVSxDQUFDO0FBQUEsTUFDbkMsQ0FBQztBQUFBLElBQ0g7QUFDQSxhQUFTLDhCQUE4QixXQUFXO0FBQ2hELFVBQUksaUJBQWlCLFNBQVMsTUFBTSxNQUFNO0FBQ3hDLGVBQU8sQ0FBQztBQUFBLE1BQ1Y7QUFDQSxVQUFJLG9CQUFvQk0sc0JBQXFCLFNBQVM7QUFDdEQsYUFBTyxDQUFDLDhCQUE4QixTQUFTLEdBQUcsbUJBQW1CLDhCQUE4QixpQkFBaUIsQ0FBQztBQUFBLElBQ3ZIO0FBQ0EsYUFBU0UsTUFBSyxNQUFNO0FBQ2xCLFVBQUksUUFBUSxLQUFLLE9BQU8sVUFBVSxLQUFLLFNBQVMsT0FBTyxLQUFLO0FBQzVELFVBQUksTUFBTSxjQUFjLElBQUksRUFBRSxPQUFPO0FBQ25DO0FBQUEsTUFDRjtBQUNBLFVBQUksb0JBQW9CLFFBQVEsVUFBVSxnQkFBZ0Isc0JBQXNCLFNBQVMsT0FBTyxtQkFBbUIsbUJBQW1CLFFBQVEsU0FBUyxlQUFlLHFCQUFxQixTQUFTLE9BQU8sa0JBQWtCLDhCQUE4QixRQUFRLG9CQUFvQixVQUFVLFFBQVEsU0FBUyxXQUFXLFFBQVEsVUFBVSxlQUFlLFFBQVEsY0FBYyxjQUFjLFFBQVEsYUFBYSx3QkFBd0IsUUFBUSxnQkFBZ0IsaUJBQWlCLDBCQUEwQixTQUFTLE9BQU8sdUJBQXVCLHdCQUF3QixRQUFRO0FBQ3pqQixVQUFJLHFCQUFxQixNQUFNLFFBQVE7QUFDdkMsVUFBSSxnQkFBZ0IsaUJBQWlCLGtCQUFrQjtBQUN2RCxVQUFJLGtCQUFrQixrQkFBa0I7QUFDeEMsVUFBSSxxQkFBcUIsZ0NBQWdDLG1CQUFtQixDQUFDLGlCQUFpQixDQUFDRixzQkFBcUIsa0JBQWtCLENBQUMsSUFBSSw4QkFBOEIsa0JBQWtCO0FBQzNMLFVBQUksY0FBYyxDQUFDLGtCQUFrQixFQUFFLE9BQU8sa0JBQWtCLEVBQUUsT0FBTyxTQUFTLEtBQUssWUFBWTtBQUNqRyxlQUFPLElBQUksT0FBTyxpQkFBaUIsVUFBVSxNQUFNLE9BQU8scUJBQXFCLE9BQU87QUFBQSxVQUNwRixXQUFXO0FBQUEsVUFDWDtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNGLENBQUMsSUFBSSxVQUFVO0FBQUEsTUFDakIsR0FBRyxDQUFDLENBQUM7QUFDTCxVQUFJLGdCQUFnQixNQUFNLE1BQU07QUFDaEMsVUFBSSxhQUFhLE1BQU0sTUFBTTtBQUM3QixVQUFJLFlBQVksb0JBQUksSUFBSTtBQUN4QixVQUFJLHFCQUFxQjtBQUN6QixVQUFJLHdCQUF3QixZQUFZLENBQUM7QUFDekMsZUFBUyxJQUFJLEdBQUcsSUFBSSxZQUFZLFFBQVEsS0FBSztBQUMzQyxZQUFJLFlBQVksWUFBWSxDQUFDO0FBQzdCLFlBQUksaUJBQWlCLGlCQUFpQixTQUFTO0FBQy9DLFlBQUksbUJBQW1CLGFBQWEsU0FBUyxNQUFNO0FBQ25ELFlBQUksYUFBYSxDQUFDLEtBQUssTUFBTSxFQUFFLFFBQVEsY0FBYyxLQUFLO0FBQzFELFlBQUksTUFBTSxhQUFhLFVBQVU7QUFDakMsWUFBSSxXQUFXTixnQkFBZSxPQUFPO0FBQUEsVUFDbkM7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDRixDQUFDO0FBQ0QsWUFBSSxvQkFBb0IsYUFBYSxtQkFBbUIsUUFBUSxPQUFPLG1CQUFtQixTQUFTO0FBQ25HLFlBQUksY0FBYyxHQUFHLElBQUksV0FBVyxHQUFHLEdBQUc7QUFDeEMsOEJBQW9CTSxzQkFBcUIsaUJBQWlCO0FBQUEsUUFDNUQ7QUFDQSxZQUFJLG1CQUFtQkEsc0JBQXFCLGlCQUFpQjtBQUM3RCxZQUFJLFNBQVMsQ0FBQztBQUNkLFlBQUksZUFBZTtBQUNqQixpQkFBTyxLQUFLLFNBQVMsY0FBYyxLQUFLLENBQUM7QUFBQSxRQUMzQztBQUNBLFlBQUksY0FBYztBQUNoQixpQkFBTyxLQUFLLFNBQVMsaUJBQWlCLEtBQUssR0FBRyxTQUFTLGdCQUFnQixLQUFLLENBQUM7QUFBQSxRQUMvRTtBQUNBLFlBQUksT0FBTyxNQUFNLFNBQVMsT0FBTztBQUMvQixpQkFBTztBQUFBLFFBQ1QsQ0FBQyxHQUFHO0FBQ0Ysa0NBQXdCO0FBQ3hCLCtCQUFxQjtBQUNyQjtBQUFBLFFBQ0Y7QUFDQSxrQkFBVSxJQUFJLFdBQVcsTUFBTTtBQUFBLE1BQ2pDO0FBQ0EsVUFBSSxvQkFBb0I7QUFDdEIsWUFBSSxpQkFBaUIsaUJBQWlCLElBQUk7QUFDMUMsWUFBSSxRQUFRLFNBQVMsT0FBTyxLQUFLO0FBQy9CLGNBQUksbUJBQW1CLFlBQVksS0FBSyxTQUFTLFlBQVk7QUFDM0QsZ0JBQUksVUFBVSxVQUFVLElBQUksVUFBVTtBQUN0QyxnQkFBSSxTQUFTO0FBQ1gscUJBQU8sUUFBUSxNQUFNLEdBQUcsR0FBRyxFQUFFLE1BQU0sU0FBUyxPQUFPO0FBQ2pELHVCQUFPO0FBQUEsY0FDVCxDQUFDO0FBQUEsWUFDSDtBQUFBLFVBQ0YsQ0FBQztBQUNELGNBQUksa0JBQWtCO0FBQ3BCLG9DQUF3QjtBQUN4QixtQkFBTztBQUFBLFVBQ1Q7QUFBQSxRQUNGO0FBQ0EsaUJBQVMsS0FBSyxnQkFBZ0IsS0FBSyxHQUFHLE1BQU07QUFDMUMsY0FBSSxPQUFPLE1BQU0sRUFBRTtBQUNuQixjQUFJLFNBQVM7QUFDWDtBQUFBLFFBQ0o7QUFBQSxNQUNGO0FBQ0EsVUFBSSxNQUFNLGNBQWMsdUJBQXVCO0FBQzdDLGNBQU0sY0FBYyxJQUFJLEVBQUUsUUFBUTtBQUNsQyxjQUFNLFlBQVk7QUFDbEIsY0FBTSxRQUFRO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQ0EsUUFBSSxTQUFTO0FBQUEsTUFDWCxNQUFNO0FBQUEsTUFDTixTQUFTO0FBQUEsTUFDVCxPQUFPO0FBQUEsTUFDUCxJQUFJRTtBQUFBLE1BQ0osa0JBQWtCLENBQUMsUUFBUTtBQUFBLE1BQzNCLE1BQU07QUFBQSxRQUNKLE9BQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUNBLGFBQVMsV0FBVyxNQUFNO0FBQ3hCLGFBQU8sU0FBUyxNQUFNLE1BQU07QUFBQSxJQUM5QjtBQUNBLGFBQVNDLFFBQU8sT0FBTyxPQUFPLE9BQU87QUFDbkMsYUFBT2xCLEtBQUksT0FBT0MsS0FBSSxPQUFPLEtBQUssQ0FBQztBQUFBLElBQ3JDO0FBQ0EsYUFBUyxnQkFBZ0IsTUFBTTtBQUM3QixVQUFJLFFBQVEsS0FBSyxPQUFPLFVBQVUsS0FBSyxTQUFTLE9BQU8sS0FBSztBQUM1RCxVQUFJLG9CQUFvQixRQUFRLFVBQVUsZ0JBQWdCLHNCQUFzQixTQUFTLE9BQU8sbUJBQW1CLG1CQUFtQixRQUFRLFNBQVMsZUFBZSxxQkFBcUIsU0FBUyxRQUFRLGtCQUFrQixXQUFXLFFBQVEsVUFBVSxlQUFlLFFBQVEsY0FBYyxjQUFjLFFBQVEsYUFBYSxVQUFVLFFBQVEsU0FBUyxrQkFBa0IsUUFBUSxRQUFRLFNBQVMsb0JBQW9CLFNBQVMsT0FBTyxpQkFBaUIsd0JBQXdCLFFBQVEsY0FBYyxlQUFlLDBCQUEwQixTQUFTLElBQUk7QUFDbGlCLFVBQUksV0FBV1EsZ0JBQWUsT0FBTztBQUFBLFFBQ25DO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRixDQUFDO0FBQ0QsVUFBSSxnQkFBZ0IsaUJBQWlCLE1BQU0sU0FBUztBQUNwRCxVQUFJLFlBQVksYUFBYSxNQUFNLFNBQVM7QUFDNUMsVUFBSSxrQkFBa0IsQ0FBQztBQUN2QixVQUFJLFdBQVdELDBCQUF5QixhQUFhO0FBQ3JELFVBQUksVUFBVSxXQUFXLFFBQVE7QUFDakMsVUFBSSxpQkFBaUIsTUFBTSxjQUFjO0FBQ3pDLFVBQUksZ0JBQWdCLE1BQU0sTUFBTTtBQUNoQyxVQUFJLGFBQWEsTUFBTSxNQUFNO0FBQzdCLFVBQUksb0JBQW9CLE9BQU8saUJBQWlCLGFBQWEsYUFBYSxPQUFPLE9BQU8sQ0FBQyxHQUFHLE1BQU0sT0FBTztBQUFBLFFBQ3ZHLFdBQVcsTUFBTTtBQUFBLE1BQ25CLENBQUMsQ0FBQyxJQUFJO0FBQ04sVUFBSSxPQUFPO0FBQUEsUUFDVCxHQUFHO0FBQUEsUUFDSCxHQUFHO0FBQUEsTUFDTDtBQUNBLFVBQUksQ0FBQyxnQkFBZ0I7QUFDbkI7QUFBQSxNQUNGO0FBQ0EsVUFBSSxpQkFBaUIsY0FBYztBQUNqQyxZQUFJLFdBQVcsYUFBYSxNQUFNLE1BQU07QUFDeEMsWUFBSSxVQUFVLGFBQWEsTUFBTSxTQUFTO0FBQzFDLFlBQUksTUFBTSxhQUFhLE1BQU0sV0FBVztBQUN4QyxZQUFJRSxXQUFVLGVBQWUsUUFBUTtBQUNyQyxZQUFJLFFBQVEsZUFBZSxRQUFRLElBQUksU0FBUyxRQUFRO0FBQ3hELFlBQUksUUFBUSxlQUFlLFFBQVEsSUFBSSxTQUFTLE9BQU87QUFDdkQsWUFBSSxXQUFXLFNBQVMsQ0FBQyxXQUFXLEdBQUcsSUFBSSxJQUFJO0FBQy9DLFlBQUksU0FBUyxjQUFjLFFBQVEsY0FBYyxHQUFHLElBQUksV0FBVyxHQUFHO0FBQ3RFLFlBQUksU0FBUyxjQUFjLFFBQVEsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLGNBQWMsR0FBRztBQUN4RSxZQUFJLGVBQWUsTUFBTSxTQUFTO0FBQ2xDLFlBQUksWUFBWSxVQUFVLGVBQWUsY0FBYyxZQUFZLElBQUk7QUFBQSxVQUNyRSxPQUFPO0FBQUEsVUFDUCxRQUFRO0FBQUEsUUFDVjtBQUNBLFlBQUkscUJBQXFCLE1BQU0sY0FBYyxrQkFBa0IsSUFBSSxNQUFNLGNBQWMsa0JBQWtCLEVBQUUsVUFBVSxtQkFBbUI7QUFDeEksWUFBSSxrQkFBa0IsbUJBQW1CLFFBQVE7QUFDakQsWUFBSSxrQkFBa0IsbUJBQW1CLE9BQU87QUFDaEQsWUFBSSxXQUFXUSxRQUFPLEdBQUcsY0FBYyxHQUFHLEdBQUcsVUFBVSxHQUFHLENBQUM7QUFDM0QsWUFBSSxZQUFZLGtCQUFrQixjQUFjLEdBQUcsSUFBSSxJQUFJLFdBQVcsV0FBVyxrQkFBa0Isb0JBQW9CLFNBQVMsV0FBVyxrQkFBa0I7QUFDN0osWUFBSSxZQUFZLGtCQUFrQixDQUFDLGNBQWMsR0FBRyxJQUFJLElBQUksV0FBVyxXQUFXLGtCQUFrQixvQkFBb0IsU0FBUyxXQUFXLGtCQUFrQjtBQUM5SixZQUFJLG9CQUFvQixNQUFNLFNBQVMsU0FBU3JCLGlCQUFnQixNQUFNLFNBQVMsS0FBSztBQUNwRixZQUFJLGVBQWUsb0JBQW9CLGFBQWEsTUFBTSxrQkFBa0IsYUFBYSxJQUFJLGtCQUFrQixjQUFjLElBQUk7QUFDakksWUFBSSxzQkFBc0IsTUFBTSxjQUFjLFNBQVMsTUFBTSxjQUFjLE9BQU8sTUFBTSxTQUFTLEVBQUUsUUFBUSxJQUFJO0FBQy9HLFlBQUksWUFBWSxlQUFlLFFBQVEsSUFBSSxZQUFZLHNCQUFzQjtBQUM3RSxZQUFJLFlBQVksZUFBZSxRQUFRLElBQUksWUFBWTtBQUN2RCxZQUFJLGVBQWU7QUFDakIsY0FBSSxrQkFBa0JxQixRQUFPLFNBQVNqQixLQUFJLE9BQU8sU0FBUyxJQUFJLE9BQU9TLFVBQVMsU0FBU1YsS0FBSSxPQUFPLFNBQVMsSUFBSSxLQUFLO0FBQ3BILHlCQUFlLFFBQVEsSUFBSTtBQUMzQixlQUFLLFFBQVEsSUFBSSxrQkFBa0JVO0FBQUEsUUFDckM7QUFDQSxZQUFJLGNBQWM7QUFDaEIsY0FBSSxZQUFZLGFBQWEsTUFBTSxNQUFNO0FBQ3pDLGNBQUksV0FBVyxhQUFhLE1BQU0sU0FBUztBQUMzQyxjQUFJLFVBQVUsZUFBZSxPQUFPO0FBQ3BDLGNBQUksT0FBTyxVQUFVLFNBQVMsU0FBUztBQUN2QyxjQUFJLE9BQU8sVUFBVSxTQUFTLFFBQVE7QUFDdEMsY0FBSSxtQkFBbUJRLFFBQU8sU0FBU2pCLEtBQUksTUFBTSxTQUFTLElBQUksTUFBTSxTQUFTLFNBQVNELEtBQUksTUFBTSxTQUFTLElBQUksSUFBSTtBQUNqSCx5QkFBZSxPQUFPLElBQUk7QUFDMUIsZUFBSyxPQUFPLElBQUksbUJBQW1CO0FBQUEsUUFDckM7QUFBQSxNQUNGO0FBQ0EsWUFBTSxjQUFjLElBQUksSUFBSTtBQUFBLElBQzlCO0FBQ0EsUUFBSSxvQkFBb0I7QUFBQSxNQUN0QixNQUFNO0FBQUEsTUFDTixTQUFTO0FBQUEsTUFDVCxPQUFPO0FBQUEsTUFDUCxJQUFJO0FBQUEsTUFDSixrQkFBa0IsQ0FBQyxRQUFRO0FBQUEsSUFDN0I7QUFDQSxRQUFJLGtCQUFrQixTQUFTLGlCQUFpQixTQUFTLE9BQU87QUFDOUQsZ0JBQVUsT0FBTyxZQUFZLGFBQWEsUUFBUSxPQUFPLE9BQU8sQ0FBQyxHQUFHLE1BQU0sT0FBTztBQUFBLFFBQy9FLFdBQVcsTUFBTTtBQUFBLE1BQ25CLENBQUMsQ0FBQyxJQUFJO0FBQ04sYUFBTyxtQkFBbUIsT0FBTyxZQUFZLFdBQVcsVUFBVSxnQkFBZ0IsU0FBUyxjQUFjLENBQUM7QUFBQSxJQUM1RztBQUNBLGFBQVNtQixPQUFNLE1BQU07QUFDbkIsVUFBSTtBQUNKLFVBQUksUUFBUSxLQUFLLE9BQU8sT0FBTyxLQUFLLE1BQU0sVUFBVSxLQUFLO0FBQ3pELFVBQUksZUFBZSxNQUFNLFNBQVM7QUFDbEMsVUFBSSxpQkFBaUIsTUFBTSxjQUFjO0FBQ3pDLFVBQUksZ0JBQWdCLGlCQUFpQixNQUFNLFNBQVM7QUFDcEQsVUFBSSxPQUFPWCwwQkFBeUIsYUFBYTtBQUNqRCxVQUFJLGFBQWEsQ0FBQyxNQUFNLEtBQUssRUFBRSxRQUFRLGFBQWEsS0FBSztBQUN6RCxVQUFJLE1BQU0sYUFBYSxXQUFXO0FBQ2xDLFVBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0I7QUFDcEM7QUFBQSxNQUNGO0FBQ0EsVUFBSSxnQkFBZ0IsZ0JBQWdCLFFBQVEsU0FBUyxLQUFLO0FBQzFELFVBQUksWUFBWSxjQUFjLFlBQVk7QUFDMUMsVUFBSSxVQUFVLFNBQVMsTUFBTSxNQUFNO0FBQ25DLFVBQUksVUFBVSxTQUFTLE1BQU0sU0FBUztBQUN0QyxVQUFJLFVBQVUsTUFBTSxNQUFNLFVBQVUsR0FBRyxJQUFJLE1BQU0sTUFBTSxVQUFVLElBQUksSUFBSSxlQUFlLElBQUksSUFBSSxNQUFNLE1BQU0sT0FBTyxHQUFHO0FBQ3RILFVBQUksWUFBWSxlQUFlLElBQUksSUFBSSxNQUFNLE1BQU0sVUFBVSxJQUFJO0FBQ2pFLFVBQUksb0JBQW9CWCxpQkFBZ0IsWUFBWTtBQUNwRCxVQUFJLGFBQWEsb0JBQW9CLFNBQVMsTUFBTSxrQkFBa0IsZ0JBQWdCLElBQUksa0JBQWtCLGVBQWUsSUFBSTtBQUMvSCxVQUFJLG9CQUFvQixVQUFVLElBQUksWUFBWTtBQUNsRCxVQUFJdUIsUUFBTyxjQUFjLE9BQU87QUFDaEMsVUFBSUMsUUFBTyxhQUFhLFVBQVUsR0FBRyxJQUFJLGNBQWMsT0FBTztBQUM5RCxVQUFJLFNBQVMsYUFBYSxJQUFJLFVBQVUsR0FBRyxJQUFJLElBQUk7QUFDbkQsVUFBSVgsV0FBVVEsUUFBT0UsT0FBTSxRQUFRQyxLQUFJO0FBQ3ZDLFVBQUksV0FBVztBQUNmLFlBQU0sY0FBYyxJQUFJLEtBQUssd0JBQXdCLENBQUMsR0FBRyxzQkFBc0IsUUFBUSxJQUFJWCxVQUFTLHNCQUFzQixlQUFlQSxXQUFVLFFBQVE7QUFBQSxJQUM3SjtBQUNBLGFBQVMsT0FBTyxPQUFPO0FBQ3JCLFVBQUksUUFBUSxNQUFNLE9BQU8sVUFBVSxNQUFNO0FBQ3pDLFVBQUksbUJBQW1CLFFBQVEsU0FBUyxlQUFlLHFCQUFxQixTQUFTLHdCQUF3QjtBQUM3RyxVQUFJLGdCQUFnQixNQUFNO0FBQ3hCO0FBQUEsTUFDRjtBQUNBLFVBQUksT0FBTyxpQkFBaUIsVUFBVTtBQUNwQyx1QkFBZSxNQUFNLFNBQVMsT0FBTyxjQUFjLFlBQVk7QUFDL0QsWUFBSSxDQUFDLGNBQWM7QUFDakI7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUNBLFVBQUksTUFBTTtBQUNSLFlBQUksQ0FBQ3pCLGVBQWMsWUFBWSxHQUFHO0FBQ2hDLGtCQUFRLE1BQU0sQ0FBQyx1RUFBdUUsdUVBQXVFLFlBQVksRUFBRSxLQUFLLEdBQUcsQ0FBQztBQUFBLFFBQ3RMO0FBQUEsTUFDRjtBQUNBLFVBQUksQ0FBQ21CLFVBQVMsTUFBTSxTQUFTLFFBQVEsWUFBWSxHQUFHO0FBQ2xELFlBQUksTUFBTTtBQUNSLGtCQUFRLE1BQU0sQ0FBQyx1RUFBdUUsVUFBVSxFQUFFLEtBQUssR0FBRyxDQUFDO0FBQUEsUUFDN0c7QUFDQTtBQUFBLE1BQ0Y7QUFDQSxZQUFNLFNBQVMsUUFBUTtBQUFBLElBQ3pCO0FBQ0EsUUFBSSxVQUFVO0FBQUEsTUFDWixNQUFNO0FBQUEsTUFDTixTQUFTO0FBQUEsTUFDVCxPQUFPO0FBQUEsTUFDUCxJQUFJZTtBQUFBLE1BQ0o7QUFBQSxNQUNBLFVBQVUsQ0FBQyxlQUFlO0FBQUEsTUFDMUIsa0JBQWtCLENBQUMsaUJBQWlCO0FBQUEsSUFDdEM7QUFDQSxhQUFTRyxnQkFBZSxVQUFVLE1BQU0sa0JBQWtCO0FBQ3hELFVBQUkscUJBQXFCLFFBQVE7QUFDL0IsMkJBQW1CO0FBQUEsVUFDakIsR0FBRztBQUFBLFVBQ0gsR0FBRztBQUFBLFFBQ0w7QUFBQSxNQUNGO0FBQ0EsYUFBTztBQUFBLFFBQ0wsS0FBSyxTQUFTLE1BQU0sS0FBSyxTQUFTLGlCQUFpQjtBQUFBLFFBQ25ELE9BQU8sU0FBUyxRQUFRLEtBQUssUUFBUSxpQkFBaUI7QUFBQSxRQUN0RCxRQUFRLFNBQVMsU0FBUyxLQUFLLFNBQVMsaUJBQWlCO0FBQUEsUUFDekQsTUFBTSxTQUFTLE9BQU8sS0FBSyxRQUFRLGlCQUFpQjtBQUFBLE1BQ3REO0FBQUEsSUFDRjtBQUNBLGFBQVNDLHVCQUFzQixVQUFVO0FBQ3ZDLGFBQU8sQ0FBQyxLQUFLLE9BQU8sUUFBUSxJQUFJLEVBQUUsS0FBSyxTQUFTLE1BQU07QUFDcEQsZUFBTyxTQUFTLElBQUksS0FBSztBQUFBLE1BQzNCLENBQUM7QUFBQSxJQUNIO0FBQ0EsYUFBU0MsTUFBSyxNQUFNO0FBQ2xCLFVBQUksUUFBUSxLQUFLLE9BQU8sT0FBTyxLQUFLO0FBQ3BDLFVBQUksZ0JBQWdCLE1BQU0sTUFBTTtBQUNoQyxVQUFJLGFBQWEsTUFBTSxNQUFNO0FBQzdCLFVBQUksbUJBQW1CLE1BQU0sY0FBYztBQUMzQyxVQUFJLG9CQUFvQmYsZ0JBQWUsT0FBTztBQUFBLFFBQzVDLGdCQUFnQjtBQUFBLE1BQ2xCLENBQUM7QUFDRCxVQUFJLG9CQUFvQkEsZ0JBQWUsT0FBTztBQUFBLFFBQzVDLGFBQWE7QUFBQSxNQUNmLENBQUM7QUFDRCxVQUFJLDJCQUEyQmEsZ0JBQWUsbUJBQW1CLGFBQWE7QUFDOUUsVUFBSSxzQkFBc0JBLGdCQUFlLG1CQUFtQixZQUFZLGdCQUFnQjtBQUN4RixVQUFJLG9CQUFvQkMsdUJBQXNCLHdCQUF3QjtBQUN0RSxVQUFJLG1CQUFtQkEsdUJBQXNCLG1CQUFtQjtBQUNoRSxZQUFNLGNBQWMsSUFBSSxJQUFJO0FBQUEsUUFDMUI7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQ0EsWUFBTSxXQUFXLFNBQVMsT0FBTyxPQUFPLENBQUMsR0FBRyxNQUFNLFdBQVcsUUFBUTtBQUFBLFFBQ25FLGdDQUFnQztBQUFBLFFBQ2hDLHVCQUF1QjtBQUFBLE1BQ3pCLENBQUM7QUFBQSxJQUNIO0FBQ0EsUUFBSSxTQUFTO0FBQUEsTUFDWCxNQUFNO0FBQUEsTUFDTixTQUFTO0FBQUEsTUFDVCxPQUFPO0FBQUEsTUFDUCxrQkFBa0IsQ0FBQyxpQkFBaUI7QUFBQSxNQUNwQyxJQUFJQztBQUFBLElBQ047QUFDQSxRQUFJLHFCQUFxQixDQUFDLGdCQUFnQixpQkFBaUIsaUJBQWlCLGFBQWE7QUFDekYsUUFBSSxpQkFBaUMsZ0NBQWdCO0FBQUEsTUFDbkQsa0JBQWtCO0FBQUEsSUFDcEIsQ0FBQztBQUNELFFBQUksbUJBQW1CLENBQUMsZ0JBQWdCLGlCQUFpQixpQkFBaUIsZUFBZSxVQUFVLFFBQVEsbUJBQW1CLFNBQVMsTUFBTTtBQUM3SSxRQUFJLGVBQStCLGdDQUFnQjtBQUFBLE1BQ2pEO0FBQUEsSUFDRixDQUFDO0FBQ0QsWUFBUSxjQUFjO0FBQ3RCLFlBQVEsUUFBUTtBQUNoQixZQUFRLGdCQUFnQjtBQUN4QixZQUFRLGVBQWU7QUFDdkIsWUFBUSxtQkFBbUI7QUFDM0IsWUFBUSxtQkFBbUI7QUFDM0IsWUFBUSxpQkFBaUJmO0FBQ3pCLFlBQVEsaUJBQWlCO0FBQ3pCLFlBQVEsT0FBTztBQUNmLFlBQVEsT0FBTztBQUNmLFlBQVEsU0FBUztBQUNqQixZQUFRLGtCQUFrQjtBQUMxQixZQUFRLGdCQUFnQjtBQUN4QixZQUFRLGtCQUFrQjtBQUFBLEVBQzVCLENBQUM7QUFHRCxNQUFJLG9CQUFvQixXQUFXLENBQUMsWUFBWTtBQUM5QztBQUNBLFdBQU8sZUFBZSxTQUFTLGNBQWMsRUFBQyxPQUFPLEtBQUksQ0FBQztBQUMxRCxRQUFJLE9BQU8sZUFBZTtBQUMxQixRQUFJLGNBQWM7QUFDbEIsUUFBSSxZQUFZO0FBQ2hCLFFBQUksZ0JBQWdCO0FBQ3BCLFFBQUksaUJBQWlCO0FBQ3JCLFFBQUksY0FBYztBQUNsQixRQUFJLGtCQUFrQjtBQUN0QixRQUFJLGdCQUFnQjtBQUFBLE1BQ2xCLFNBQVM7QUFBQSxNQUNULFNBQVM7QUFBQSxJQUNYO0FBQ0EsYUFBUyxlQUFlLEtBQUssS0FBSztBQUNoQyxhQUFPLENBQUMsRUFBRSxlQUFlLEtBQUssS0FBSyxHQUFHO0FBQUEsSUFDeEM7QUFDQSxhQUFTLHdCQUF3QixPQUFPRSxRQUFPLGNBQWM7QUFDM0QsVUFBSSxNQUFNLFFBQVEsS0FBSyxHQUFHO0FBQ3hCLFlBQUksSUFBSSxNQUFNQSxNQUFLO0FBQ25CLGVBQU8sS0FBSyxPQUFPLE1BQU0sUUFBUSxZQUFZLElBQUksYUFBYUEsTUFBSyxJQUFJLGVBQWU7QUFBQSxNQUN4RjtBQUNBLGFBQU87QUFBQSxJQUNUO0FBQ0EsYUFBUyxPQUFPLE9BQU8sTUFBTTtBQUMzQixVQUFJLE1BQU0sQ0FBQyxFQUFFLFNBQVMsS0FBSyxLQUFLO0FBQ2hDLGFBQU8sSUFBSSxRQUFRLFNBQVMsTUFBTSxLQUFLLElBQUksUUFBUSxPQUFPLEdBQUcsSUFBSTtBQUFBLElBQ25FO0FBQ0EsYUFBUyx1QkFBdUIsT0FBTyxNQUFNO0FBQzNDLGFBQU8sT0FBTyxVQUFVLGFBQWEsTUFBTSxNQUFNLFFBQVEsSUFBSSxJQUFJO0FBQUEsSUFDbkU7QUFDQSxhQUFTLFNBQVMsSUFBSSxJQUFJO0FBQ3hCLFVBQUksT0FBTyxHQUFHO0FBQ1osZUFBTztBQUFBLE1BQ1Q7QUFDQSxVQUFJO0FBQ0osYUFBTyxTQUFTLEtBQUs7QUFDbkIscUJBQWEsT0FBTztBQUNwQixrQkFBVSxXQUFXLFdBQVc7QUFDOUIsYUFBRyxHQUFHO0FBQUEsUUFDUixHQUFHLEVBQUU7QUFBQSxNQUNQO0FBQUEsSUFDRjtBQUNBLGFBQVMsaUJBQWlCLEtBQUssTUFBTTtBQUNuQyxVQUFJYyxTQUFRLE9BQU8sT0FBTyxDQUFDLEdBQUcsR0FBRztBQUNqQyxXQUFLLFFBQVEsU0FBUyxLQUFLO0FBQ3pCLGVBQU9BLE9BQU0sR0FBRztBQUFBLE1BQ2xCLENBQUM7QUFDRCxhQUFPQTtBQUFBLElBQ1Q7QUFDQSxhQUFTLGNBQWMsT0FBTztBQUM1QixhQUFPLE1BQU0sTUFBTSxLQUFLLEVBQUUsT0FBTyxPQUFPO0FBQUEsSUFDMUM7QUFDQSxhQUFTLGlCQUFpQixPQUFPO0FBQy9CLGFBQU8sQ0FBQyxFQUFFLE9BQU8sS0FBSztBQUFBLElBQ3hCO0FBQ0EsYUFBUyxhQUFhLEtBQUssT0FBTztBQUNoQyxVQUFJLElBQUksUUFBUSxLQUFLLE1BQU0sSUFBSTtBQUM3QixZQUFJLEtBQUssS0FBSztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUNBLGFBQVMsT0FBTyxLQUFLO0FBQ25CLGFBQU8sSUFBSSxPQUFPLFNBQVMsTUFBTWQsUUFBTztBQUN0QyxlQUFPLElBQUksUUFBUSxJQUFJLE1BQU1BO0FBQUEsTUFDL0IsQ0FBQztBQUFBLElBQ0g7QUFDQSxhQUFTLGlCQUFpQixXQUFXO0FBQ25DLGFBQU8sVUFBVSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQUEsSUFDL0I7QUFDQSxhQUFTLFVBQVUsT0FBTztBQUN4QixhQUFPLENBQUMsRUFBRSxNQUFNLEtBQUssS0FBSztBQUFBLElBQzVCO0FBQ0EsYUFBUyxxQkFBcUIsS0FBSztBQUNqQyxhQUFPLE9BQU8sS0FBSyxHQUFHLEVBQUUsT0FBTyxTQUFTLEtBQUssS0FBSztBQUNoRCxZQUFJLElBQUksR0FBRyxNQUFNLFFBQVE7QUFDdkIsY0FBSSxHQUFHLElBQUksSUFBSSxHQUFHO0FBQUEsUUFDcEI7QUFDQSxlQUFPO0FBQUEsTUFDVCxHQUFHLENBQUMsQ0FBQztBQUFBLElBQ1A7QUFDQSxhQUFTLE1BQU07QUFDYixhQUFPLFNBQVMsY0FBYyxLQUFLO0FBQUEsSUFDckM7QUFDQSxhQUFTM0IsV0FBVSxPQUFPO0FBQ3hCLGFBQU8sQ0FBQyxXQUFXLFVBQVUsRUFBRSxLQUFLLFNBQVMsTUFBTTtBQUNqRCxlQUFPLE9BQU8sT0FBTyxJQUFJO0FBQUEsTUFDM0IsQ0FBQztBQUFBLElBQ0g7QUFDQSxhQUFTLFdBQVcsT0FBTztBQUN6QixhQUFPLE9BQU8sT0FBTyxVQUFVO0FBQUEsSUFDakM7QUFDQSxhQUFTLGFBQWEsT0FBTztBQUMzQixhQUFPLE9BQU8sT0FBTyxZQUFZO0FBQUEsSUFDbkM7QUFDQSxhQUFTLG1CQUFtQixPQUFPO0FBQ2pDLGFBQU8sQ0FBQyxFQUFFLFNBQVMsTUFBTSxVQUFVLE1BQU0sT0FBTyxjQUFjO0FBQUEsSUFDaEU7QUFDQSxhQUFTLG1CQUFtQixPQUFPO0FBQ2pDLFVBQUlBLFdBQVUsS0FBSyxHQUFHO0FBQ3BCLGVBQU8sQ0FBQyxLQUFLO0FBQUEsTUFDZjtBQUNBLFVBQUksV0FBVyxLQUFLLEdBQUc7QUFDckIsZUFBTyxVQUFVLEtBQUs7QUFBQSxNQUN4QjtBQUNBLFVBQUksTUFBTSxRQUFRLEtBQUssR0FBRztBQUN4QixlQUFPO0FBQUEsTUFDVDtBQUNBLGFBQU8sVUFBVSxTQUFTLGlCQUFpQixLQUFLLENBQUM7QUFBQSxJQUNuRDtBQUNBLGFBQVMsc0JBQXNCLEtBQUssT0FBTztBQUN6QyxVQUFJLFFBQVEsU0FBUyxJQUFJO0FBQ3ZCLFlBQUksSUFBSTtBQUNOLGFBQUcsTUFBTSxxQkFBcUIsUUFBUTtBQUFBLFFBQ3hDO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSDtBQUNBLGFBQVMsbUJBQW1CLEtBQUssT0FBTztBQUN0QyxVQUFJLFFBQVEsU0FBUyxJQUFJO0FBQ3ZCLFlBQUksSUFBSTtBQUNOLGFBQUcsYUFBYSxjQUFjLEtBQUs7QUFBQSxRQUNyQztBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFDQSxhQUFTLGlCQUFpQixtQkFBbUI7QUFDM0MsVUFBSTtBQUNKLFVBQUksb0JBQW9CLGlCQUFpQixpQkFBaUIsR0FBRyxVQUFVLGtCQUFrQixDQUFDO0FBQzFGLGNBQVEsV0FBVyxPQUFPLFVBQVUsd0JBQXdCLFFBQVEsa0JBQWtCLE9BQU8sU0FBUyxzQkFBc0IsUUFBUSxRQUFRLGdCQUFnQjtBQUFBLElBQzlKO0FBQ0EsYUFBUyxpQ0FBaUMsZ0JBQWdCLE9BQU87QUFDL0QsVUFBSSxVQUFVLE1BQU0sU0FBUyxVQUFVLE1BQU07QUFDN0MsYUFBTyxlQUFlLE1BQU0sU0FBUyxNQUFNO0FBQ3pDLFlBQUksYUFBYSxLQUFLLFlBQVksY0FBYyxLQUFLLGFBQWEsUUFBUSxLQUFLO0FBQy9FLFlBQUksb0JBQW9CLE1BQU07QUFDOUIsWUFBSSxnQkFBZ0IsaUJBQWlCLFlBQVksU0FBUztBQUMxRCxZQUFJLGFBQWEsWUFBWSxjQUFjO0FBQzNDLFlBQUksQ0FBQyxZQUFZO0FBQ2YsaUJBQU87QUFBQSxRQUNUO0FBQ0EsWUFBSSxjQUFjLGtCQUFrQixXQUFXLFdBQVcsSUFBSSxJQUFJO0FBQ2xFLFlBQUksaUJBQWlCLGtCQUFrQixRQUFRLFdBQVcsT0FBTyxJQUFJO0FBQ3JFLFlBQUksZUFBZSxrQkFBa0IsVUFBVSxXQUFXLEtBQUssSUFBSTtBQUNuRSxZQUFJLGdCQUFnQixrQkFBa0IsU0FBUyxXQUFXLE1BQU0sSUFBSTtBQUNwRSxZQUFJLGFBQWEsV0FBVyxNQUFNLFVBQVUsY0FBYztBQUMxRCxZQUFJLGdCQUFnQixVQUFVLFdBQVcsU0FBUyxpQkFBaUI7QUFDbkUsWUFBSSxjQUFjLFdBQVcsT0FBTyxVQUFVLGVBQWU7QUFDN0QsWUFBSSxlQUFlLFVBQVUsV0FBVyxRQUFRLGdCQUFnQjtBQUNoRSxlQUFPLGNBQWMsaUJBQWlCLGVBQWU7QUFBQSxNQUN2RCxDQUFDO0FBQUEsSUFDSDtBQUNBLGFBQVMsNEJBQTRCLEtBQUssUUFBUSxVQUFVO0FBQzFELFVBQUksU0FBUyxTQUFTO0FBQ3RCLE9BQUMsaUJBQWlCLHFCQUFxQixFQUFFLFFBQVEsU0FBUyxPQUFPO0FBQy9ELFlBQUksTUFBTSxFQUFFLE9BQU8sUUFBUTtBQUFBLE1BQzdCLENBQUM7QUFBQSxJQUNIO0FBQ0EsUUFBSSxlQUFlO0FBQUEsTUFDakIsU0FBUztBQUFBLElBQ1g7QUFDQSxRQUFJLG9CQUFvQjtBQUN4QixhQUFTLHVCQUF1QjtBQUM5QixVQUFJLGFBQWEsU0FBUztBQUN4QjtBQUFBLE1BQ0Y7QUFDQSxtQkFBYSxVQUFVO0FBQ3ZCLFVBQUksT0FBTyxhQUFhO0FBQ3RCLGlCQUFTLGlCQUFpQixhQUFhLG1CQUFtQjtBQUFBLE1BQzVEO0FBQUEsSUFDRjtBQUNBLGFBQVMsc0JBQXNCO0FBQzdCLFVBQUksTUFBTSxZQUFZLElBQUk7QUFDMUIsVUFBSSxNQUFNLG9CQUFvQixJQUFJO0FBQ2hDLHFCQUFhLFVBQVU7QUFDdkIsaUJBQVMsb0JBQW9CLGFBQWEsbUJBQW1CO0FBQUEsTUFDL0Q7QUFDQSwwQkFBb0I7QUFBQSxJQUN0QjtBQUNBLGFBQVMsZUFBZTtBQUN0QixVQUFJLGdCQUFnQixTQUFTO0FBQzdCLFVBQUksbUJBQW1CLGFBQWEsR0FBRztBQUNyQyxZQUFJLFdBQVcsY0FBYztBQUM3QixZQUFJLGNBQWMsUUFBUSxDQUFDLFNBQVMsTUFBTSxXQUFXO0FBQ25ELHdCQUFjLEtBQUs7QUFBQSxRQUNyQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsYUFBUywyQkFBMkI7QUFDbEMsZUFBUyxpQkFBaUIsY0FBYyxzQkFBc0IsYUFBYTtBQUMzRSxhQUFPLGlCQUFpQixRQUFRLFlBQVk7QUFBQSxJQUM5QztBQUNBLFFBQUksWUFBWSxPQUFPLFdBQVcsZUFBZSxPQUFPLGFBQWE7QUFDckUsUUFBSSxLQUFLLFlBQVksVUFBVSxZQUFZO0FBQzNDLFFBQUksT0FBTyxrQkFBa0IsS0FBSyxFQUFFO0FBQ3BDLGFBQVMsd0JBQXdCLFFBQVE7QUFDdkMsVUFBSSxNQUFNLFdBQVcsWUFBWSxlQUFlO0FBQ2hELGFBQU8sQ0FBQyxTQUFTLHVCQUF1QixNQUFNLDJDQUEyQyxvQ0FBb0MsRUFBRSxLQUFLLEdBQUc7QUFBQSxJQUN6STtBQUNBLGFBQVMsTUFBTSxPQUFPO0FBQ3BCLFVBQUksZ0JBQWdCO0FBQ3BCLFVBQUksc0JBQXNCO0FBQzFCLGFBQU8sTUFBTSxRQUFRLGVBQWUsR0FBRyxFQUFFLFFBQVEscUJBQXFCLEVBQUUsRUFBRSxLQUFLO0FBQUEsSUFDakY7QUFDQSxhQUFTLGNBQWMsU0FBUztBQUM5QixhQUFPLE1BQU0sMkJBQTJCLE1BQU0sT0FBTyxJQUFJLG1HQUFtRztBQUFBLElBQzlKO0FBQ0EsYUFBUyxvQkFBb0IsU0FBUztBQUNwQyxhQUFPO0FBQUEsUUFDTCxjQUFjLE9BQU87QUFBQSxRQUNyQjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFDQSxRQUFJO0FBQ0osUUFBSSxNQUFNO0FBQ1IsMkJBQXFCO0FBQUEsSUFDdkI7QUFDQSxhQUFTLHVCQUF1QjtBQUM5Qix3QkFBa0Isb0JBQUksSUFBSTtBQUFBLElBQzVCO0FBQ0EsYUFBUyxTQUFTLFdBQVcsU0FBUztBQUNwQyxVQUFJLGFBQWEsQ0FBQyxnQkFBZ0IsSUFBSSxPQUFPLEdBQUc7QUFDOUMsWUFBSTtBQUNKLHdCQUFnQixJQUFJLE9BQU87QUFDM0IsU0FBQyxXQUFXLFNBQVMsS0FBSyxNQUFNLFVBQVUsb0JBQW9CLE9BQU8sQ0FBQztBQUFBLE1BQ3hFO0FBQUEsSUFDRjtBQUNBLGFBQVMsVUFBVSxXQUFXLFNBQVM7QUFDckMsVUFBSSxhQUFhLENBQUMsZ0JBQWdCLElBQUksT0FBTyxHQUFHO0FBQzlDLFlBQUk7QUFDSix3QkFBZ0IsSUFBSSxPQUFPO0FBQzNCLFNBQUMsWUFBWSxTQUFTLE1BQU0sTUFBTSxXQUFXLG9CQUFvQixPQUFPLENBQUM7QUFBQSxNQUMzRTtBQUFBLElBQ0Y7QUFDQSxhQUFTLGdCQUFnQixTQUFTO0FBQ2hDLFVBQUksb0JBQW9CLENBQUM7QUFDekIsVUFBSSxxQkFBcUIsT0FBTyxVQUFVLFNBQVMsS0FBSyxPQUFPLE1BQU0scUJBQXFCLENBQUMsUUFBUTtBQUNuRyxnQkFBVSxtQkFBbUIsQ0FBQyxzQkFBc0IsTUFBTSxPQUFPLE9BQU8sSUFBSSxLQUFLLHNFQUFzRSx5QkFBeUIsRUFBRSxLQUFLLEdBQUcsQ0FBQztBQUMzTCxnQkFBVSxvQkFBb0IsQ0FBQywyRUFBMkUsb0VBQW9FLEVBQUUsS0FBSyxHQUFHLENBQUM7QUFBQSxJQUMzTDtBQUNBLFFBQUksY0FBYztBQUFBLE1BQ2hCLGFBQWE7QUFBQSxNQUNiLGNBQWM7QUFBQSxNQUNkLG1CQUFtQjtBQUFBLE1BQ25CLFFBQVE7QUFBQSxJQUNWO0FBQ0EsUUFBSSxjQUFjO0FBQUEsTUFDaEIsV0FBVztBQUFBLE1BQ1gsV0FBVztBQUFBLE1BQ1gsT0FBTztBQUFBLE1BQ1AsU0FBUztBQUFBLE1BQ1QsU0FBUztBQUFBLE1BQ1QsVUFBVTtBQUFBLE1BQ1YsTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLE1BQ1AsUUFBUTtBQUFBLElBQ1Y7QUFDQSxRQUFJLGVBQWUsT0FBTyxPQUFPO0FBQUEsTUFDL0IsVUFBVSxTQUFTLFdBQVc7QUFDNUIsZUFBTyxTQUFTO0FBQUEsTUFDbEI7QUFBQSxNQUNBLE1BQU07QUFBQSxRQUNKLFNBQVM7QUFBQSxRQUNULFVBQVU7QUFBQSxNQUNaO0FBQUEsTUFDQSxPQUFPO0FBQUEsTUFDUCxVQUFVLENBQUMsS0FBSyxHQUFHO0FBQUEsTUFDbkIsd0JBQXdCO0FBQUEsTUFDeEIsYUFBYTtBQUFBLE1BQ2Isa0JBQWtCO0FBQUEsTUFDbEIsYUFBYTtBQUFBLE1BQ2IsbUJBQW1CO0FBQUEsTUFDbkIscUJBQXFCO0FBQUEsTUFDckIsZ0JBQWdCO0FBQUEsTUFDaEIsUUFBUSxDQUFDLEdBQUcsRUFBRTtBQUFBLE1BQ2QsZUFBZSxTQUFTLGdCQUFnQjtBQUFBLE1BQ3hDO0FBQUEsTUFDQSxnQkFBZ0IsU0FBUyxpQkFBaUI7QUFBQSxNQUMxQztBQUFBLE1BQ0EsVUFBVSxTQUFTLFdBQVc7QUFBQSxNQUM5QjtBQUFBLE1BQ0EsV0FBVyxTQUFTLFlBQVk7QUFBQSxNQUNoQztBQUFBLE1BQ0EsVUFBVSxTQUFTLFdBQVc7QUFBQSxNQUM5QjtBQUFBLE1BQ0EsUUFBUSxTQUFTLFNBQVM7QUFBQSxNQUMxQjtBQUFBLE1BQ0EsU0FBUyxTQUFTLFVBQVU7QUFBQSxNQUM1QjtBQUFBLE1BQ0EsUUFBUSxTQUFTLFNBQVM7QUFBQSxNQUMxQjtBQUFBLE1BQ0EsU0FBUyxTQUFTLFVBQVU7QUFBQSxNQUM1QjtBQUFBLE1BQ0EsV0FBVyxTQUFTLFlBQVk7QUFBQSxNQUNoQztBQUFBLE1BQ0EsYUFBYSxTQUFTLGNBQWM7QUFBQSxNQUNwQztBQUFBLE1BQ0EsZ0JBQWdCLFNBQVMsaUJBQWlCO0FBQUEsTUFDMUM7QUFBQSxNQUNBLFdBQVc7QUFBQSxNQUNYLFNBQVMsQ0FBQztBQUFBLE1BQ1YsZUFBZSxDQUFDO0FBQUEsTUFDaEIsUUFBUTtBQUFBLE1BQ1IsY0FBYztBQUFBLE1BQ2QsT0FBTztBQUFBLE1BQ1AsU0FBUztBQUFBLE1BQ1QsZUFBZTtBQUFBLElBQ2pCLEdBQUcsYUFBYSxDQUFDLEdBQUcsV0FBVztBQUMvQixRQUFJLGNBQWMsT0FBTyxLQUFLLFlBQVk7QUFDMUMsUUFBSSxrQkFBa0IsU0FBUyxpQkFBaUIsY0FBYztBQUM1RCxVQUFJLE1BQU07QUFDUixzQkFBYyxjQUFjLENBQUMsQ0FBQztBQUFBLE1BQ2hDO0FBQ0EsVUFBSSxPQUFPLE9BQU8sS0FBSyxZQUFZO0FBQ25DLFdBQUssUUFBUSxTQUFTLEtBQUs7QUFDekIscUJBQWEsR0FBRyxJQUFJLGFBQWEsR0FBRztBQUFBLE1BQ3RDLENBQUM7QUFBQSxJQUNIO0FBQ0EsYUFBUyx1QkFBdUIsYUFBYTtBQUMzQyxVQUFJMEMsV0FBVSxZQUFZLFdBQVcsQ0FBQztBQUN0QyxVQUFJLGVBQWVBLFNBQVEsT0FBTyxTQUFTLEtBQUssUUFBUTtBQUN0RCxZQUFJLE9BQU8sT0FBTyxNQUFNLGVBQWUsT0FBTztBQUM5QyxZQUFJLE1BQU07QUFDUixjQUFJLElBQUksSUFBSSxZQUFZLElBQUksTUFBTSxTQUFTLFlBQVksSUFBSSxJQUFJO0FBQUEsUUFDakU7QUFDQSxlQUFPO0FBQUEsTUFDVCxHQUFHLENBQUMsQ0FBQztBQUNMLGFBQU8sT0FBTyxPQUFPLENBQUMsR0FBRyxhQUFhLENBQUMsR0FBRyxZQUFZO0FBQUEsSUFDeEQ7QUFDQSxhQUFTLHNCQUFzQixXQUFXQSxVQUFTO0FBQ2pELFVBQUksV0FBV0EsV0FBVSxPQUFPLEtBQUssdUJBQXVCLE9BQU8sT0FBTyxDQUFDLEdBQUcsY0FBYztBQUFBLFFBQzFGLFNBQUFBO0FBQUEsTUFDRixDQUFDLENBQUMsQ0FBQyxJQUFJO0FBQ1AsVUFBSSxRQUFRLFNBQVMsT0FBTyxTQUFTLEtBQUssS0FBSztBQUM3QyxZQUFJLGlCQUFpQixVQUFVLGFBQWEsZ0JBQWdCLEdBQUcsS0FBSyxJQUFJLEtBQUs7QUFDN0UsWUFBSSxDQUFDLGVBQWU7QUFDbEIsaUJBQU87QUFBQSxRQUNUO0FBQ0EsWUFBSSxRQUFRLFdBQVc7QUFDckIsY0FBSSxHQUFHLElBQUk7QUFBQSxRQUNiLE9BQU87QUFDTCxjQUFJO0FBQ0YsZ0JBQUksR0FBRyxJQUFJLEtBQUssTUFBTSxhQUFhO0FBQUEsVUFDckMsU0FBUyxHQUFQO0FBQ0EsZ0JBQUksR0FBRyxJQUFJO0FBQUEsVUFDYjtBQUFBLFFBQ0Y7QUFDQSxlQUFPO0FBQUEsTUFDVCxHQUFHLENBQUMsQ0FBQztBQUNMLGFBQU87QUFBQSxJQUNUO0FBQ0EsYUFBUyxjQUFjLFdBQVcsT0FBTztBQUN2QyxVQUFJLE1BQU0sT0FBTyxPQUFPLENBQUMsR0FBRyxPQUFPO0FBQUEsUUFDakMsU0FBUyx1QkFBdUIsTUFBTSxTQUFTLENBQUMsU0FBUyxDQUFDO0FBQUEsTUFDNUQsR0FBRyxNQUFNLG1CQUFtQixDQUFDLElBQUksc0JBQXNCLFdBQVcsTUFBTSxPQUFPLENBQUM7QUFDaEYsVUFBSSxPQUFPLE9BQU8sT0FBTyxDQUFDLEdBQUcsYUFBYSxNQUFNLENBQUMsR0FBRyxJQUFJLElBQUk7QUFDNUQsVUFBSSxPQUFPO0FBQUEsUUFDVCxVQUFVLElBQUksS0FBSyxhQUFhLFNBQVMsTUFBTSxjQUFjLElBQUksS0FBSztBQUFBLFFBQ3RFLFNBQVMsSUFBSSxLQUFLLFlBQVksU0FBUyxNQUFNLGNBQWMsT0FBTyxnQkFBZ0IsSUFBSSxLQUFLO0FBQUEsTUFDN0Y7QUFDQSxhQUFPO0FBQUEsSUFDVDtBQUNBLGFBQVMsY0FBYyxjQUFjQSxVQUFTO0FBQzVDLFVBQUksaUJBQWlCLFFBQVE7QUFDM0IsdUJBQWUsQ0FBQztBQUFBLE1BQ2xCO0FBQ0EsVUFBSUEsYUFBWSxRQUFRO0FBQ3RCLFFBQUFBLFdBQVUsQ0FBQztBQUFBLE1BQ2I7QUFDQSxVQUFJLE9BQU8sT0FBTyxLQUFLLFlBQVk7QUFDbkMsV0FBSyxRQUFRLFNBQVMsTUFBTTtBQUMxQixZQUFJLGlCQUFpQixpQkFBaUIsY0FBYyxPQUFPLEtBQUssV0FBVyxDQUFDO0FBQzVFLFlBQUkscUJBQXFCLENBQUMsZUFBZSxnQkFBZ0IsSUFBSTtBQUM3RCxZQUFJLG9CQUFvQjtBQUN0QiwrQkFBcUJBLFNBQVEsT0FBTyxTQUFTLFFBQVE7QUFDbkQsbUJBQU8sT0FBTyxTQUFTO0FBQUEsVUFDekIsQ0FBQyxFQUFFLFdBQVc7QUFBQSxRQUNoQjtBQUNBLGlCQUFTLG9CQUFvQixDQUFDLE1BQU0sT0FBTyxLQUFLLHdFQUF3RSw2REFBNkQsUUFBUSxnRUFBZ0Usd0RBQXdELEVBQUUsS0FBSyxHQUFHLENBQUM7QUFBQSxNQUNsVSxDQUFDO0FBQUEsSUFDSDtBQUNBLFFBQUksWUFBWSxTQUFTLGFBQWE7QUFDcEMsYUFBTztBQUFBLElBQ1Q7QUFDQSxhQUFTLHdCQUF3QixTQUFTLE1BQU07QUFDOUMsY0FBUSxVQUFVLENBQUMsSUFBSTtBQUFBLElBQ3pCO0FBQ0EsYUFBUyxtQkFBbUIsT0FBTztBQUNqQyxVQUFJUCxTQUFRLElBQUk7QUFDaEIsVUFBSSxVQUFVLE1BQU07QUFDbEIsUUFBQUEsT0FBTSxZQUFZO0FBQUEsTUFDcEIsT0FBTztBQUNMLFFBQUFBLE9BQU0sWUFBWTtBQUNsQixZQUFJbkMsV0FBVSxLQUFLLEdBQUc7QUFDcEIsVUFBQW1DLE9BQU0sWUFBWSxLQUFLO0FBQUEsUUFDekIsT0FBTztBQUNMLGtDQUF3QkEsUUFBTyxLQUFLO0FBQUEsUUFDdEM7QUFBQSxNQUNGO0FBQ0EsYUFBT0E7QUFBQSxJQUNUO0FBQ0EsYUFBUyxXQUFXLFNBQVMsT0FBTztBQUNsQyxVQUFJbkMsV0FBVSxNQUFNLE9BQU8sR0FBRztBQUM1QixnQ0FBd0IsU0FBUyxFQUFFO0FBQ25DLGdCQUFRLFlBQVksTUFBTSxPQUFPO0FBQUEsTUFDbkMsV0FBVyxPQUFPLE1BQU0sWUFBWSxZQUFZO0FBQzlDLFlBQUksTUFBTSxXQUFXO0FBQ25CLGtDQUF3QixTQUFTLE1BQU0sT0FBTztBQUFBLFFBQ2hELE9BQU87QUFDTCxrQkFBUSxjQUFjLE1BQU07QUFBQSxRQUM5QjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsYUFBUyxZQUFZLFFBQVE7QUFDM0IsVUFBSSxNQUFNLE9BQU87QUFDakIsVUFBSSxjQUFjLFVBQVUsSUFBSSxRQUFRO0FBQ3hDLGFBQU87QUFBQSxRQUNMO0FBQUEsUUFDQSxTQUFTLFlBQVksS0FBSyxTQUFTLE1BQU07QUFDdkMsaUJBQU8sS0FBSyxVQUFVLFNBQVMsYUFBYTtBQUFBLFFBQzlDLENBQUM7QUFBQSxRQUNELE9BQU8sWUFBWSxLQUFLLFNBQVMsTUFBTTtBQUNyQyxpQkFBTyxLQUFLLFVBQVUsU0FBUyxXQUFXLEtBQUssS0FBSyxVQUFVLFNBQVMsZUFBZTtBQUFBLFFBQ3hGLENBQUM7QUFBQSxRQUNELFVBQVUsWUFBWSxLQUFLLFNBQVMsTUFBTTtBQUN4QyxpQkFBTyxLQUFLLFVBQVUsU0FBUyxjQUFjO0FBQUEsUUFDL0MsQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBQ0EsYUFBUyxPQUFPLFVBQVU7QUFDeEIsVUFBSSxTQUFTLElBQUk7QUFDakIsVUFBSSxNQUFNLElBQUk7QUFDZCxVQUFJLFlBQVk7QUFDaEIsVUFBSSxhQUFhLGNBQWMsUUFBUTtBQUN2QyxVQUFJLGFBQWEsWUFBWSxJQUFJO0FBQ2pDLFVBQUksVUFBVSxJQUFJO0FBQ2xCLGNBQVEsWUFBWTtBQUNwQixjQUFRLGFBQWEsY0FBYyxRQUFRO0FBQzNDLGlCQUFXLFNBQVMsU0FBUyxLQUFLO0FBQ2xDLGFBQU8sWUFBWSxHQUFHO0FBQ3RCLFVBQUksWUFBWSxPQUFPO0FBQ3ZCLGVBQVMsU0FBUyxPQUFPLFNBQVMsS0FBSztBQUN2QyxlQUFTLFNBQVMsV0FBVyxXQUFXO0FBQ3RDLFlBQUksZUFBZSxZQUFZLE1BQU0sR0FBRyxPQUFPLGFBQWEsS0FBSyxXQUFXLGFBQWEsU0FBU21DLFNBQVEsYUFBYTtBQUN2SCxZQUFJLFVBQVUsT0FBTztBQUNuQixlQUFLLGFBQWEsY0FBYyxVQUFVLEtBQUs7QUFBQSxRQUNqRCxPQUFPO0FBQ0wsZUFBSyxnQkFBZ0IsWUFBWTtBQUFBLFFBQ25DO0FBQ0EsWUFBSSxPQUFPLFVBQVUsY0FBYyxVQUFVO0FBQzNDLGVBQUssYUFBYSxrQkFBa0IsVUFBVSxTQUFTO0FBQUEsUUFDekQsT0FBTztBQUNMLGVBQUssZ0JBQWdCLGdCQUFnQjtBQUFBLFFBQ3ZDO0FBQ0EsWUFBSSxVQUFVLFNBQVM7QUFDckIsZUFBSyxhQUFhLGdCQUFnQixFQUFFO0FBQUEsUUFDdEMsT0FBTztBQUNMLGVBQUssZ0JBQWdCLGNBQWM7QUFBQSxRQUNyQztBQUNBLGFBQUssTUFBTSxXQUFXLE9BQU8sVUFBVSxhQUFhLFdBQVcsVUFBVSxXQUFXLE9BQU8sVUFBVTtBQUNyRyxZQUFJLFVBQVUsTUFBTTtBQUNsQixlQUFLLGFBQWEsUUFBUSxVQUFVLElBQUk7QUFBQSxRQUMxQyxPQUFPO0FBQ0wsZUFBSyxnQkFBZ0IsTUFBTTtBQUFBLFFBQzdCO0FBQ0EsWUFBSSxVQUFVLFlBQVksVUFBVSxXQUFXLFVBQVUsY0FBYyxVQUFVLFdBQVc7QUFDMUYscUJBQVcsVUFBVSxTQUFTLEtBQUs7QUFBQSxRQUNyQztBQUNBLFlBQUksVUFBVSxPQUFPO0FBQ25CLGNBQUksQ0FBQ0EsUUFBTztBQUNWLGlCQUFLLFlBQVksbUJBQW1CLFVBQVUsS0FBSyxDQUFDO0FBQUEsVUFDdEQsV0FBVyxVQUFVLFVBQVUsVUFBVSxPQUFPO0FBQzlDLGlCQUFLLFlBQVlBLE1BQUs7QUFDdEIsaUJBQUssWUFBWSxtQkFBbUIsVUFBVSxLQUFLLENBQUM7QUFBQSxVQUN0RDtBQUFBLFFBQ0YsV0FBV0EsUUFBTztBQUNoQixlQUFLLFlBQVlBLE1BQUs7QUFBQSxRQUN4QjtBQUFBLE1BQ0Y7QUFDQSxhQUFPO0FBQUEsUUFDTDtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUNBLFdBQU8sVUFBVTtBQUNqQixRQUFJLFlBQVk7QUFDaEIsUUFBSSxxQkFBcUIsQ0FBQztBQUMxQixRQUFJLG1CQUFtQixDQUFDO0FBQ3hCLGFBQVMsWUFBWSxXQUFXLGFBQWE7QUFDM0MsVUFBSSxRQUFRLGNBQWMsV0FBVyxPQUFPLE9BQU8sQ0FBQyxHQUFHLGNBQWMsQ0FBQyxHQUFHLHVCQUF1QixxQkFBcUIsV0FBVyxDQUFDLENBQUMsQ0FBQztBQUNuSSxVQUFJO0FBQ0osVUFBSTtBQUNKLFVBQUk7QUFDSixVQUFJLHFCQUFxQjtBQUN6QixVQUFJLGdDQUFnQztBQUNwQyxVQUFJLGVBQWU7QUFDbkIsVUFBSSxzQkFBc0I7QUFDMUIsVUFBSTtBQUNKLFVBQUk7QUFDSixVQUFJO0FBQ0osVUFBSSxZQUFZLENBQUM7QUFDakIsVUFBSSx1QkFBdUIsU0FBUyxhQUFhLE1BQU0sbUJBQW1CO0FBQzFFLFVBQUk7QUFDSixVQUFJLEtBQUs7QUFDVCxVQUFJLGlCQUFpQjtBQUNyQixVQUFJTyxXQUFVLE9BQU8sTUFBTSxPQUFPO0FBQ2xDLFVBQUksUUFBUTtBQUFBLFFBQ1YsV0FBVztBQUFBLFFBQ1gsV0FBVztBQUFBLFFBQ1gsYUFBYTtBQUFBLFFBQ2IsV0FBVztBQUFBLFFBQ1gsU0FBUztBQUFBLE1BQ1g7QUFDQSxVQUFJLFdBQVc7QUFBQSxRQUNiO0FBQUEsUUFDQTtBQUFBLFFBQ0EsUUFBUSxJQUFJO0FBQUEsUUFDWjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQSxTQUFBQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQSxZQUFZO0FBQUEsUUFDWjtBQUFBLFFBQ0EsTUFBQUY7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQSxTQUFBWjtBQUFBLE1BQ0Y7QUFDQSxVQUFJLENBQUMsTUFBTSxRQUFRO0FBQ2pCLFlBQUksTUFBTTtBQUNSLG9CQUFVLE1BQU0sMENBQTBDO0FBQUEsUUFDNUQ7QUFDQSxlQUFPO0FBQUEsTUFDVDtBQUNBLFVBQUksZ0JBQWdCLE1BQU0sT0FBTyxRQUFRLEdBQUcsU0FBUyxjQUFjLFFBQVEsV0FBVyxjQUFjO0FBQ3BHLGFBQU8sYUFBYSxtQkFBbUIsRUFBRTtBQUN6QyxhQUFPLEtBQUssV0FBVyxTQUFTO0FBQ2hDLGVBQVMsU0FBUztBQUNsQixnQkFBVSxTQUFTO0FBQ25CLGFBQU8sU0FBUztBQUNoQixVQUFJLGVBQWVjLFNBQVEsSUFBSSxTQUFTLFFBQVE7QUFDOUMsZUFBTyxPQUFPLEdBQUcsUUFBUTtBQUFBLE1BQzNCLENBQUM7QUFDRCxVQUFJLGtCQUFrQixVQUFVLGFBQWEsZUFBZTtBQUM1RCxtQkFBYTtBQUNiLGtDQUE0QjtBQUM1QixtQkFBYTtBQUNiLGlCQUFXLFlBQVksQ0FBQyxRQUFRLENBQUM7QUFDakMsVUFBSSxNQUFNLGNBQWM7QUFDdEIscUJBQWE7QUFBQSxNQUNmO0FBQ0EsYUFBTyxpQkFBaUIsY0FBYyxXQUFXO0FBQy9DLFlBQUksU0FBUyxNQUFNLGVBQWUsU0FBUyxNQUFNLFdBQVc7QUFDMUQsbUJBQVMsbUJBQW1CO0FBQUEsUUFDOUI7QUFBQSxNQUNGLENBQUM7QUFDRCxhQUFPLGlCQUFpQixjQUFjLFNBQVMsT0FBTztBQUNwRCxZQUFJLFNBQVMsTUFBTSxlQUFlLFNBQVMsTUFBTSxRQUFRLFFBQVEsWUFBWSxLQUFLLEdBQUc7QUFDbkYsc0JBQVksRUFBRSxpQkFBaUIsYUFBYSxvQkFBb0I7QUFDaEUsK0JBQXFCLEtBQUs7QUFBQSxRQUM1QjtBQUFBLE1BQ0YsQ0FBQztBQUNELGFBQU87QUFDUCxlQUFTLDZCQUE2QjtBQUNwQyxZQUFJLFFBQVEsU0FBUyxNQUFNO0FBQzNCLGVBQU8sTUFBTSxRQUFRLEtBQUssSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDO0FBQUEsTUFDakQ7QUFDQSxlQUFTLDJCQUEyQjtBQUNsQyxlQUFPLDJCQUEyQixFQUFFLENBQUMsTUFBTTtBQUFBLE1BQzdDO0FBQ0EsZUFBUyx1QkFBdUI7QUFDOUIsWUFBSTtBQUNKLGVBQU8sQ0FBQyxHQUFHLHdCQUF3QixTQUFTLE1BQU0sV0FBVyxPQUFPLFNBQVMsc0JBQXNCO0FBQUEsTUFDckc7QUFDQSxlQUFTLG1CQUFtQjtBQUMxQixlQUFPLGlCQUFpQjtBQUFBLE1BQzFCO0FBQ0EsZUFBUyxjQUFjO0FBQ3JCLFlBQUksU0FBUyxpQkFBaUIsRUFBRTtBQUNoQyxlQUFPLFNBQVMsaUJBQWlCLE1BQU0sSUFBSTtBQUFBLE1BQzdDO0FBQ0EsZUFBUyw2QkFBNkI7QUFDcEMsZUFBTyxZQUFZLE1BQU07QUFBQSxNQUMzQjtBQUNBLGVBQVMsU0FBUyxRQUFRO0FBQ3hCLFlBQUksU0FBUyxNQUFNLGFBQWEsQ0FBQyxTQUFTLE1BQU0sYUFBYSxhQUFhLFdBQVcsb0JBQW9CLGlCQUFpQixTQUFTLFNBQVM7QUFDMUksaUJBQU87QUFBQSxRQUNUO0FBQ0EsZUFBTyx3QkFBd0IsU0FBUyxNQUFNLE9BQU8sU0FBUyxJQUFJLEdBQUcsYUFBYSxLQUFLO0FBQUEsTUFDekY7QUFDQSxlQUFTLGVBQWU7QUFDdEIsZUFBTyxNQUFNLGdCQUFnQixTQUFTLE1BQU0sZUFBZSxTQUFTLE1BQU0sWUFBWSxLQUFLO0FBQzNGLGVBQU8sTUFBTSxTQUFTLEtBQUssU0FBUyxNQUFNO0FBQUEsTUFDNUM7QUFDQSxlQUFTLFdBQVcsTUFBTSxNQUFNLHVCQUF1QjtBQUNyRCxZQUFJLDBCQUEwQixRQUFRO0FBQ3BDLGtDQUF3QjtBQUFBLFFBQzFCO0FBQ0EscUJBQWEsUUFBUSxTQUFTLGFBQWE7QUFDekMsY0FBSSxZQUFZLElBQUksR0FBRztBQUNyQix3QkFBWSxJQUFJLEVBQUUsTUFBTSxRQUFRLElBQUk7QUFBQSxVQUN0QztBQUFBLFFBQ0YsQ0FBQztBQUNELFlBQUksdUJBQXVCO0FBQ3pCLGNBQUk7QUFDSixXQUFDLGtCQUFrQixTQUFTLE9BQU8sSUFBSSxFQUFFLE1BQU0saUJBQWlCLElBQUk7QUFBQSxRQUN0RTtBQUFBLE1BQ0Y7QUFDQSxlQUFTLDZCQUE2QjtBQUNwQyxZQUFJLE9BQU8sU0FBUyxNQUFNO0FBQzFCLFlBQUksQ0FBQyxLQUFLLFNBQVM7QUFDakI7QUFBQSxRQUNGO0FBQ0EsWUFBSSxPQUFPLFVBQVUsS0FBSztBQUMxQixZQUFJLE1BQU0sT0FBTztBQUNqQixZQUFJLFFBQVEsaUJBQWlCLFNBQVMsTUFBTSxpQkFBaUIsU0FBUztBQUN0RSxjQUFNLFFBQVEsU0FBUyxNQUFNO0FBQzNCLGNBQUksZUFBZSxLQUFLLGFBQWEsSUFBSTtBQUN6QyxjQUFJLFNBQVMsTUFBTSxXQUFXO0FBQzVCLGlCQUFLLGFBQWEsTUFBTSxlQUFlLGVBQWUsTUFBTSxNQUFNLEdBQUc7QUFBQSxVQUN2RSxPQUFPO0FBQ0wsZ0JBQUksWUFBWSxnQkFBZ0IsYUFBYSxRQUFRLEtBQUssRUFBRSxFQUFFLEtBQUs7QUFDbkUsZ0JBQUksV0FBVztBQUNiLG1CQUFLLGFBQWEsTUFBTSxTQUFTO0FBQUEsWUFDbkMsT0FBTztBQUNMLG1CQUFLLGdCQUFnQixJQUFJO0FBQUEsWUFDM0I7QUFBQSxVQUNGO0FBQUEsUUFDRixDQUFDO0FBQUEsTUFDSDtBQUNBLGVBQVMsOEJBQThCO0FBQ3JDLFlBQUksbUJBQW1CLENBQUMsU0FBUyxNQUFNLEtBQUssVUFBVTtBQUNwRDtBQUFBLFFBQ0Y7QUFDQSxZQUFJLFFBQVEsaUJBQWlCLFNBQVMsTUFBTSxpQkFBaUIsU0FBUztBQUN0RSxjQUFNLFFBQVEsU0FBUyxNQUFNO0FBQzNCLGNBQUksU0FBUyxNQUFNLGFBQWE7QUFDOUIsaUJBQUssYUFBYSxpQkFBaUIsU0FBUyxNQUFNLGFBQWEsU0FBUyxpQkFBaUIsSUFBSSxTQUFTLE9BQU87QUFBQSxVQUMvRyxPQUFPO0FBQ0wsaUJBQUssZ0JBQWdCLGVBQWU7QUFBQSxVQUN0QztBQUFBLFFBQ0YsQ0FBQztBQUFBLE1BQ0g7QUFDQSxlQUFTLG1DQUFtQztBQUMxQyxvQkFBWSxFQUFFLG9CQUFvQixhQUFhLG9CQUFvQjtBQUNuRSw2QkFBcUIsbUJBQW1CLE9BQU8sU0FBUyxVQUFVO0FBQ2hFLGlCQUFPLGFBQWE7QUFBQSxRQUN0QixDQUFDO0FBQUEsTUFDSDtBQUNBLGVBQVMsZ0JBQWdCLE9BQU87QUFDOUIsWUFBSSxhQUFhLFNBQVM7QUFDeEIsY0FBSSxnQkFBZ0IsTUFBTSxTQUFTLGFBQWE7QUFDOUM7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUNBLFlBQUksU0FBUyxNQUFNLGVBQWUsT0FBTyxTQUFTLE1BQU0sTUFBTSxHQUFHO0FBQy9EO0FBQUEsUUFDRjtBQUNBLFlBQUksaUJBQWlCLEVBQUUsU0FBUyxNQUFNLE1BQU0sR0FBRztBQUM3QyxjQUFJLGFBQWEsU0FBUztBQUN4QjtBQUFBLFVBQ0Y7QUFDQSxjQUFJLFNBQVMsTUFBTSxhQUFhLFNBQVMsTUFBTSxRQUFRLFFBQVEsT0FBTyxLQUFLLEdBQUc7QUFDNUU7QUFBQSxVQUNGO0FBQUEsUUFDRixPQUFPO0FBQ0wscUJBQVcsa0JBQWtCLENBQUMsVUFBVSxLQUFLLENBQUM7QUFBQSxRQUNoRDtBQUNBLFlBQUksU0FBUyxNQUFNLGdCQUFnQixNQUFNO0FBQ3ZDLG1CQUFTLG1CQUFtQjtBQUM1QixtQkFBUyxLQUFLO0FBQ2QsMENBQWdDO0FBQ2hDLHFCQUFXLFdBQVc7QUFDcEIsNENBQWdDO0FBQUEsVUFDbEMsQ0FBQztBQUNELGNBQUksQ0FBQyxTQUFTLE1BQU0sV0FBVztBQUM3QixnQ0FBb0I7QUFBQSxVQUN0QjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQ0EsZUFBUyxjQUFjO0FBQ3JCLHVCQUFlO0FBQUEsTUFDakI7QUFDQSxlQUFTLGVBQWU7QUFDdEIsdUJBQWU7QUFBQSxNQUNqQjtBQUNBLGVBQVMsbUJBQW1CO0FBQzFCLFlBQUksTUFBTSxZQUFZO0FBQ3RCLFlBQUksaUJBQWlCLGFBQWEsaUJBQWlCLElBQUk7QUFDdkQsWUFBSSxpQkFBaUIsWUFBWSxpQkFBaUIsYUFBYTtBQUMvRCxZQUFJLGlCQUFpQixjQUFjLGNBQWMsYUFBYTtBQUM5RCxZQUFJLGlCQUFpQixhQUFhLGFBQWEsYUFBYTtBQUFBLE1BQzlEO0FBQ0EsZUFBUyxzQkFBc0I7QUFDN0IsWUFBSSxNQUFNLFlBQVk7QUFDdEIsWUFBSSxvQkFBb0IsYUFBYSxpQkFBaUIsSUFBSTtBQUMxRCxZQUFJLG9CQUFvQixZQUFZLGlCQUFpQixhQUFhO0FBQ2xFLFlBQUksb0JBQW9CLGNBQWMsY0FBYyxhQUFhO0FBQ2pFLFlBQUksb0JBQW9CLGFBQWEsYUFBYSxhQUFhO0FBQUEsTUFDakU7QUFDQSxlQUFTLGtCQUFrQixVQUFVLFVBQVU7QUFDN0Msd0JBQWdCLFVBQVUsV0FBVztBQUNuQyxjQUFJLENBQUMsU0FBUyxNQUFNLGFBQWEsT0FBTyxjQUFjLE9BQU8sV0FBVyxTQUFTLE1BQU0sR0FBRztBQUN4RixxQkFBUztBQUFBLFVBQ1g7QUFBQSxRQUNGLENBQUM7QUFBQSxNQUNIO0FBQ0EsZUFBUyxpQkFBaUIsVUFBVSxVQUFVO0FBQzVDLHdCQUFnQixVQUFVLFFBQVE7QUFBQSxNQUNwQztBQUNBLGVBQVMsZ0JBQWdCLFVBQVUsVUFBVTtBQUMzQyxZQUFJLE1BQU0sMkJBQTJCLEVBQUU7QUFDdkMsaUJBQVMsU0FBUyxPQUFPO0FBQ3ZCLGNBQUksTUFBTSxXQUFXLEtBQUs7QUFDeEIsd0NBQTRCLEtBQUssVUFBVSxRQUFRO0FBQ25ELHFCQUFTO0FBQUEsVUFDWDtBQUFBLFFBQ0Y7QUFDQSxZQUFJLGFBQWEsR0FBRztBQUNsQixpQkFBTyxTQUFTO0FBQUEsUUFDbEI7QUFDQSxvQ0FBNEIsS0FBSyxVQUFVLDRCQUE0QjtBQUN2RSxvQ0FBNEIsS0FBSyxPQUFPLFFBQVE7QUFDaEQsdUNBQStCO0FBQUEsTUFDakM7QUFDQSxlQUFTQyxJQUFHLFdBQVcsU0FBUyxTQUFTO0FBQ3ZDLFlBQUksWUFBWSxRQUFRO0FBQ3RCLG9CQUFVO0FBQUEsUUFDWjtBQUNBLFlBQUksUUFBUSxpQkFBaUIsU0FBUyxNQUFNLGlCQUFpQixTQUFTO0FBQ3RFLGNBQU0sUUFBUSxTQUFTLE1BQU07QUFDM0IsZUFBSyxpQkFBaUIsV0FBVyxTQUFTLE9BQU87QUFDakQsb0JBQVUsS0FBSztBQUFBLFlBQ2I7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGLENBQUM7QUFBQSxRQUNILENBQUM7QUFBQSxNQUNIO0FBQ0EsZUFBUyxlQUFlO0FBQ3RCLFlBQUkseUJBQXlCLEdBQUc7QUFDOUIsVUFBQUEsSUFBRyxjQUFjLFdBQVc7QUFBQSxZQUMxQixTQUFTO0FBQUEsVUFDWCxDQUFDO0FBQ0QsVUFBQUEsSUFBRyxZQUFZLGNBQWM7QUFBQSxZQUMzQixTQUFTO0FBQUEsVUFDWCxDQUFDO0FBQUEsUUFDSDtBQUNBLHNCQUFjLFNBQVMsTUFBTSxPQUFPLEVBQUUsUUFBUSxTQUFTLFdBQVc7QUFDaEUsY0FBSSxjQUFjLFVBQVU7QUFDMUI7QUFBQSxVQUNGO0FBQ0EsVUFBQUEsSUFBRyxXQUFXLFNBQVM7QUFDdkIsa0JBQVEsV0FBVztBQUFBLFlBQ2pCLEtBQUs7QUFDSCxjQUFBQSxJQUFHLGNBQWMsWUFBWTtBQUM3QjtBQUFBLFlBQ0YsS0FBSztBQUNILGNBQUFBLElBQUcsT0FBTyxhQUFhLFFBQVEsZ0JBQWdCO0FBQy9DO0FBQUEsWUFDRixLQUFLO0FBQ0gsY0FBQUEsSUFBRyxZQUFZLGdCQUFnQjtBQUMvQjtBQUFBLFVBQ0o7QUFBQSxRQUNGLENBQUM7QUFBQSxNQUNIO0FBQ0EsZUFBUyxrQkFBa0I7QUFDekIsa0JBQVUsUUFBUSxTQUFTLE1BQU07QUFDL0IsY0FBSSxPQUFPLEtBQUssTUFBTSxZQUFZLEtBQUssV0FBVyxVQUFVLEtBQUssU0FBUyxVQUFVLEtBQUs7QUFDekYsZUFBSyxvQkFBb0IsV0FBVyxTQUFTLE9BQU87QUFBQSxRQUN0RCxDQUFDO0FBQ0Qsb0JBQVksQ0FBQztBQUFBLE1BQ2Y7QUFDQSxlQUFTLFVBQVUsT0FBTztBQUN4QixZQUFJO0FBQ0osWUFBSSwwQkFBMEI7QUFDOUIsWUFBSSxDQUFDLFNBQVMsTUFBTSxhQUFhLHVCQUF1QixLQUFLLEtBQUssK0JBQStCO0FBQy9GO0FBQUEsUUFDRjtBQUNBLFlBQUksZUFBZSxvQkFBb0IscUJBQXFCLE9BQU8sU0FBUyxrQkFBa0IsVUFBVTtBQUN4RywyQkFBbUI7QUFDbkIsd0JBQWdCLE1BQU07QUFDdEIsb0NBQTRCO0FBQzVCLFlBQUksQ0FBQyxTQUFTLE1BQU0sYUFBYSxhQUFhLEtBQUssR0FBRztBQUNwRCw2QkFBbUIsUUFBUSxTQUFTLFVBQVU7QUFDNUMsbUJBQU8sU0FBUyxLQUFLO0FBQUEsVUFDdkIsQ0FBQztBQUFBLFFBQ0g7QUFDQSxZQUFJLE1BQU0sU0FBUyxZQUFZLFNBQVMsTUFBTSxRQUFRLFFBQVEsWUFBWSxJQUFJLEtBQUssdUJBQXVCLFNBQVMsTUFBTSxnQkFBZ0IsU0FBUyxTQUFTLE1BQU0sV0FBVztBQUMxSyxvQ0FBMEI7QUFBQSxRQUM1QixPQUFPO0FBQ0wsdUJBQWEsS0FBSztBQUFBLFFBQ3BCO0FBQ0EsWUFBSSxNQUFNLFNBQVMsU0FBUztBQUMxQiwrQkFBcUIsQ0FBQztBQUFBLFFBQ3hCO0FBQ0EsWUFBSSwyQkFBMkIsQ0FBQyxZQUFZO0FBQzFDLHVCQUFhLEtBQUs7QUFBQSxRQUNwQjtBQUFBLE1BQ0Y7QUFDQSxlQUFTLFlBQVksT0FBTztBQUMxQixZQUFJLFNBQVMsTUFBTTtBQUNuQixZQUFJLGdDQUFnQyxpQkFBaUIsRUFBRSxTQUFTLE1BQU0sS0FBSyxPQUFPLFNBQVMsTUFBTTtBQUNqRyxZQUFJLE1BQU0sU0FBUyxlQUFlLCtCQUErQjtBQUMvRDtBQUFBLFFBQ0Y7QUFDQSxZQUFJLGlCQUFpQixvQkFBb0IsRUFBRSxPQUFPLE1BQU0sRUFBRSxJQUFJLFNBQVMsU0FBUztBQUM5RSxjQUFJO0FBQ0osY0FBSSxZQUFZLFFBQVE7QUFDeEIsY0FBSSxVQUFVLHdCQUF3QixVQUFVLG1CQUFtQixPQUFPLFNBQVMsc0JBQXNCO0FBQ3pHLGNBQUksUUFBUTtBQUNWLG1CQUFPO0FBQUEsY0FDTCxZQUFZLFFBQVEsc0JBQXNCO0FBQUEsY0FDMUMsYUFBYTtBQUFBLGNBQ2I7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUNBLGlCQUFPO0FBQUEsUUFDVCxDQUFDLEVBQUUsT0FBTyxPQUFPO0FBQ2pCLFlBQUksaUNBQWlDLGdCQUFnQixLQUFLLEdBQUc7QUFDM0QsMkNBQWlDO0FBQ2pDLHVCQUFhLEtBQUs7QUFBQSxRQUNwQjtBQUFBLE1BQ0Y7QUFDQSxlQUFTLGFBQWEsT0FBTztBQUMzQixZQUFJLGFBQWEsdUJBQXVCLEtBQUssS0FBSyxTQUFTLE1BQU0sUUFBUSxRQUFRLE9BQU8sS0FBSyxLQUFLO0FBQ2xHLFlBQUksWUFBWTtBQUNkO0FBQUEsUUFDRjtBQUNBLFlBQUksU0FBUyxNQUFNLGFBQWE7QUFDOUIsbUJBQVMsc0JBQXNCLEtBQUs7QUFDcEM7QUFBQSxRQUNGO0FBQ0EscUJBQWEsS0FBSztBQUFBLE1BQ3BCO0FBQ0EsZUFBUyxpQkFBaUIsT0FBTztBQUMvQixZQUFJLFNBQVMsTUFBTSxRQUFRLFFBQVEsU0FBUyxJQUFJLEtBQUssTUFBTSxXQUFXLGlCQUFpQixHQUFHO0FBQ3hGO0FBQUEsUUFDRjtBQUNBLFlBQUksU0FBUyxNQUFNLGVBQWUsTUFBTSxpQkFBaUIsT0FBTyxTQUFTLE1BQU0sYUFBYSxHQUFHO0FBQzdGO0FBQUEsUUFDRjtBQUNBLHFCQUFhLEtBQUs7QUFBQSxNQUNwQjtBQUNBLGVBQVMsdUJBQXVCLE9BQU87QUFDckMsZUFBTyxhQUFhLFVBQVUseUJBQXlCLE1BQU0sTUFBTSxLQUFLLFFBQVEsT0FBTyxLQUFLLElBQUk7QUFBQSxNQUNsRztBQUNBLGVBQVMsdUJBQXVCO0FBQzlCLDhCQUFzQjtBQUN0QixZQUFJLG1CQUFtQixTQUFTLE9BQU8sZ0JBQWdCLGlCQUFpQixlQUFlLFlBQVksaUJBQWlCLFdBQVdkLFVBQVMsaUJBQWlCLFFBQVEseUJBQXlCLGlCQUFpQix3QkFBd0IsaUJBQWlCLGlCQUFpQjtBQUNyUSxZQUFJTSxTQUFRLHFCQUFxQixJQUFJLFlBQVksTUFBTSxFQUFFLFFBQVE7QUFDakUsWUFBSSxvQkFBb0IseUJBQXlCO0FBQUEsVUFDL0MsdUJBQXVCO0FBQUEsVUFDdkIsZ0JBQWdCLHVCQUF1QixrQkFBa0IsaUJBQWlCO0FBQUEsUUFDNUUsSUFBSTtBQUNKLFlBQUksZ0JBQWdCO0FBQUEsVUFDbEIsTUFBTTtBQUFBLFVBQ04sU0FBUztBQUFBLFVBQ1QsT0FBTztBQUFBLFVBQ1AsVUFBVSxDQUFDLGVBQWU7QUFBQSxVQUMxQixJQUFJLFNBQVMsR0FBRyxPQUFPO0FBQ3JCLGdCQUFJLFNBQVMsTUFBTTtBQUNuQixnQkFBSSxxQkFBcUIsR0FBRztBQUMxQixrQkFBSSx3QkFBd0IsMkJBQTJCLEdBQUcsTUFBTSxzQkFBc0I7QUFDdEYsZUFBQyxhQUFhLG9CQUFvQixTQUFTLEVBQUUsUUFBUSxTQUFTLE1BQU07QUFDbEUsb0JBQUksU0FBUyxhQUFhO0FBQ3hCLHNCQUFJLGFBQWEsa0JBQWtCLE9BQU8sU0FBUztBQUFBLGdCQUNyRCxPQUFPO0FBQ0wsc0JBQUksT0FBTyxXQUFXLE9BQU8saUJBQWlCLElBQUksR0FBRztBQUNuRCx3QkFBSSxhQUFhLFVBQVUsTUFBTSxFQUFFO0FBQUEsa0JBQ3JDLE9BQU87QUFDTCx3QkFBSSxnQkFBZ0IsVUFBVSxJQUFJO0FBQUEsa0JBQ3BDO0FBQUEsZ0JBQ0Y7QUFBQSxjQUNGLENBQUM7QUFDRCxxQkFBTyxXQUFXLFNBQVMsQ0FBQztBQUFBLFlBQzlCO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFDQSxZQUFJLFlBQVksQ0FBQztBQUFBLFVBQ2YsTUFBTTtBQUFBLFVBQ04sU0FBUztBQUFBLFlBQ1AsUUFBQU47QUFBQSxVQUNGO0FBQUEsUUFDRixHQUFHO0FBQUEsVUFDRCxNQUFNO0FBQUEsVUFDTixTQUFTO0FBQUEsWUFDUCxTQUFTO0FBQUEsY0FDUCxLQUFLO0FBQUEsY0FDTCxRQUFRO0FBQUEsY0FDUixNQUFNO0FBQUEsY0FDTixPQUFPO0FBQUEsWUFDVDtBQUFBLFVBQ0Y7QUFBQSxRQUNGLEdBQUc7QUFBQSxVQUNELE1BQU07QUFBQSxVQUNOLFNBQVM7QUFBQSxZQUNQLFNBQVM7QUFBQSxVQUNYO0FBQUEsUUFDRixHQUFHO0FBQUEsVUFDRCxNQUFNO0FBQUEsVUFDTixTQUFTO0FBQUEsWUFDUCxVQUFVLENBQUM7QUFBQSxVQUNiO0FBQUEsUUFDRixHQUFHLGFBQWE7QUFDaEIsWUFBSSxxQkFBcUIsS0FBS00sUUFBTztBQUNuQyxvQkFBVSxLQUFLO0FBQUEsWUFDYixNQUFNO0FBQUEsWUFDTixTQUFTO0FBQUEsY0FDUCxTQUFTQTtBQUFBLGNBQ1QsU0FBUztBQUFBLFlBQ1g7QUFBQSxVQUNGLENBQUM7QUFBQSxRQUNIO0FBQ0Esa0JBQVUsS0FBSyxNQUFNLFlBQVksaUJBQWlCLE9BQU8sU0FBUyxjQUFjLGNBQWMsQ0FBQyxDQUFDO0FBQ2hHLGlCQUFTLGlCQUFpQixLQUFLLGFBQWEsbUJBQW1CLFFBQVEsT0FBTyxPQUFPLENBQUMsR0FBRyxlQUFlO0FBQUEsVUFDdEc7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0YsQ0FBQyxDQUFDO0FBQUEsTUFDSjtBQUNBLGVBQVMsd0JBQXdCO0FBQy9CLFlBQUksU0FBUyxnQkFBZ0I7QUFDM0IsbUJBQVMsZUFBZSxRQUFRO0FBQ2hDLG1CQUFTLGlCQUFpQjtBQUFBLFFBQzVCO0FBQUEsTUFDRjtBQUNBLGVBQVNTLFNBQVE7QUFDZixZQUFJLFdBQVcsU0FBUyxNQUFNO0FBQzlCLFlBQUk7QUFDSixZQUFJLE9BQU8saUJBQWlCO0FBQzVCLFlBQUksU0FBUyxNQUFNLGVBQWUsYUFBYSxhQUFhLFlBQVksYUFBYSxVQUFVO0FBQzdGLHVCQUFhLEtBQUs7QUFBQSxRQUNwQixPQUFPO0FBQ0wsdUJBQWEsdUJBQXVCLFVBQVUsQ0FBQyxJQUFJLENBQUM7QUFBQSxRQUN0RDtBQUNBLFlBQUksQ0FBQyxXQUFXLFNBQVMsTUFBTSxHQUFHO0FBQ2hDLHFCQUFXLFlBQVksTUFBTTtBQUFBLFFBQy9CO0FBQ0EsNkJBQXFCO0FBQ3JCLFlBQUksTUFBTTtBQUNSLG1CQUFTLFNBQVMsTUFBTSxlQUFlLGFBQWEsYUFBYSxZQUFZLEtBQUssdUJBQXVCLFFBQVEsQ0FBQyxnRUFBZ0UscUVBQXFFLDRCQUE0QixRQUFRLG9FQUFvRSxxREFBcUQsUUFBUSxzRUFBc0UsK0RBQStELHdCQUF3QixRQUFRLHdFQUF3RSxFQUFFLEtBQUssR0FBRyxDQUFDO0FBQUEsUUFDdHBCO0FBQUEsTUFDRjtBQUNBLGVBQVMsc0JBQXNCO0FBQzdCLGVBQU8sVUFBVSxPQUFPLGlCQUFpQixtQkFBbUIsQ0FBQztBQUFBLE1BQy9EO0FBQ0EsZUFBUyxhQUFhLE9BQU87QUFDM0IsaUJBQVMsbUJBQW1CO0FBQzVCLFlBQUksT0FBTztBQUNULHFCQUFXLGFBQWEsQ0FBQyxVQUFVLEtBQUssQ0FBQztBQUFBLFFBQzNDO0FBQ0EseUJBQWlCO0FBQ2pCLFlBQUksUUFBUSxTQUFTLElBQUk7QUFDekIsWUFBSSx3QkFBd0IsMkJBQTJCLEdBQUcsYUFBYSxzQkFBc0IsQ0FBQyxHQUFHLGFBQWEsc0JBQXNCLENBQUM7QUFDckksWUFBSSxhQUFhLFdBQVcsZUFBZSxVQUFVLFlBQVk7QUFDL0Qsa0JBQVE7QUFBQSxRQUNWO0FBQ0EsWUFBSSxPQUFPO0FBQ1Qsd0JBQWMsV0FBVyxXQUFXO0FBQ2xDLHFCQUFTLEtBQUs7QUFBQSxVQUNoQixHQUFHLEtBQUs7QUFBQSxRQUNWLE9BQU87QUFDTCxtQkFBUyxLQUFLO0FBQUEsUUFDaEI7QUFBQSxNQUNGO0FBQ0EsZUFBUyxhQUFhLE9BQU87QUFDM0IsaUJBQVMsbUJBQW1CO0FBQzVCLG1CQUFXLGVBQWUsQ0FBQyxVQUFVLEtBQUssQ0FBQztBQUMzQyxZQUFJLENBQUMsU0FBUyxNQUFNLFdBQVc7QUFDN0IsOEJBQW9CO0FBQ3BCO0FBQUEsUUFDRjtBQUNBLFlBQUksU0FBUyxNQUFNLFFBQVEsUUFBUSxZQUFZLEtBQUssS0FBSyxTQUFTLE1BQU0sUUFBUSxRQUFRLE9BQU8sS0FBSyxLQUFLLENBQUMsY0FBYyxXQUFXLEVBQUUsUUFBUSxNQUFNLElBQUksS0FBSyxLQUFLLG9CQUFvQjtBQUNuTDtBQUFBLFFBQ0Y7QUFDQSxZQUFJLFFBQVEsU0FBUyxLQUFLO0FBQzFCLFlBQUksT0FBTztBQUNULHdCQUFjLFdBQVcsV0FBVztBQUNsQyxnQkFBSSxTQUFTLE1BQU0sV0FBVztBQUM1Qix1QkFBUyxLQUFLO0FBQUEsWUFDaEI7QUFBQSxVQUNGLEdBQUcsS0FBSztBQUFBLFFBQ1YsT0FBTztBQUNMLHVDQUE2QixzQkFBc0IsV0FBVztBQUM1RCxxQkFBUyxLQUFLO0FBQUEsVUFDaEIsQ0FBQztBQUFBLFFBQ0g7QUFBQSxNQUNGO0FBQ0EsZUFBUyxTQUFTO0FBQ2hCLGlCQUFTLE1BQU0sWUFBWTtBQUFBLE1BQzdCO0FBQ0EsZUFBUyxVQUFVO0FBQ2pCLGlCQUFTLEtBQUs7QUFDZCxpQkFBUyxNQUFNLFlBQVk7QUFBQSxNQUM3QjtBQUNBLGVBQVMscUJBQXFCO0FBQzVCLHFCQUFhLFdBQVc7QUFDeEIscUJBQWEsV0FBVztBQUN4Qiw2QkFBcUIsMEJBQTBCO0FBQUEsTUFDakQ7QUFDQSxlQUFTLFNBQVMsY0FBYztBQUM5QixZQUFJLE1BQU07QUFDUixtQkFBUyxTQUFTLE1BQU0sYUFBYSx3QkFBd0IsVUFBVSxDQUFDO0FBQUEsUUFDMUU7QUFDQSxZQUFJLFNBQVMsTUFBTSxhQUFhO0FBQzlCO0FBQUEsUUFDRjtBQUNBLG1CQUFXLGtCQUFrQixDQUFDLFVBQVUsWUFBWSxDQUFDO0FBQ3JELHdCQUFnQjtBQUNoQixZQUFJLFlBQVksU0FBUztBQUN6QixZQUFJLFlBQVksY0FBYyxXQUFXLE9BQU8sT0FBTyxDQUFDLEdBQUcsU0FBUyxPQUFPLENBQUMsR0FBRyxjQUFjO0FBQUEsVUFDM0Ysa0JBQWtCO0FBQUEsUUFDcEIsQ0FBQyxDQUFDO0FBQ0YsaUJBQVMsUUFBUTtBQUNqQixxQkFBYTtBQUNiLFlBQUksVUFBVSx3QkFBd0IsVUFBVSxxQkFBcUI7QUFDbkUsMkNBQWlDO0FBQ2pDLGlDQUF1QixTQUFTLGFBQWEsVUFBVSxtQkFBbUI7QUFBQSxRQUM1RTtBQUNBLFlBQUksVUFBVSxpQkFBaUIsQ0FBQyxVQUFVLGVBQWU7QUFDdkQsMkJBQWlCLFVBQVUsYUFBYSxFQUFFLFFBQVEsU0FBUyxNQUFNO0FBQy9ELGlCQUFLLGdCQUFnQixlQUFlO0FBQUEsVUFDdEMsQ0FBQztBQUFBLFFBQ0gsV0FBVyxVQUFVLGVBQWU7QUFDbEMsb0JBQVUsZ0JBQWdCLGVBQWU7QUFBQSxRQUMzQztBQUNBLG9DQUE0QjtBQUM1QixxQkFBYTtBQUNiLFlBQUksVUFBVTtBQUNaLG1CQUFTLFdBQVcsU0FBUztBQUFBLFFBQy9CO0FBQ0EsWUFBSSxTQUFTLGdCQUFnQjtBQUMzQiwrQkFBcUI7QUFDckIsOEJBQW9CLEVBQUUsUUFBUSxTQUFTLGNBQWM7QUFDbkQsa0NBQXNCLGFBQWEsT0FBTyxlQUFlLFdBQVc7QUFBQSxVQUN0RSxDQUFDO0FBQUEsUUFDSDtBQUNBLG1CQUFXLGlCQUFpQixDQUFDLFVBQVUsWUFBWSxDQUFDO0FBQUEsTUFDdEQ7QUFDQSxlQUFTLFlBQVksU0FBUztBQUM1QixpQkFBUyxTQUFTO0FBQUEsVUFDaEI7QUFBQSxRQUNGLENBQUM7QUFBQSxNQUNIO0FBQ0EsZUFBUyxPQUFPO0FBQ2QsWUFBSSxNQUFNO0FBQ1IsbUJBQVMsU0FBUyxNQUFNLGFBQWEsd0JBQXdCLE1BQU0sQ0FBQztBQUFBLFFBQ3RFO0FBQ0EsWUFBSSxtQkFBbUIsU0FBUyxNQUFNO0FBQ3RDLFlBQUksY0FBYyxTQUFTLE1BQU07QUFDakMsWUFBSSxhQUFhLENBQUMsU0FBUyxNQUFNO0FBQ2pDLFlBQUksMEJBQTBCLGFBQWEsV0FBVyxDQUFDLFNBQVMsTUFBTTtBQUN0RSxZQUFJLFdBQVcsd0JBQXdCLFNBQVMsTUFBTSxVQUFVLEdBQUcsYUFBYSxRQUFRO0FBQ3hGLFlBQUksb0JBQW9CLGVBQWUsY0FBYyx5QkFBeUI7QUFDNUU7QUFBQSxRQUNGO0FBQ0EsWUFBSSxpQkFBaUIsRUFBRSxhQUFhLFVBQVUsR0FBRztBQUMvQztBQUFBLFFBQ0Y7QUFDQSxtQkFBVyxVQUFVLENBQUMsUUFBUSxHQUFHLEtBQUs7QUFDdEMsWUFBSSxTQUFTLE1BQU0sT0FBTyxRQUFRLE1BQU0sT0FBTztBQUM3QztBQUFBLFFBQ0Y7QUFDQSxpQkFBUyxNQUFNLFlBQVk7QUFDM0IsWUFBSSxxQkFBcUIsR0FBRztBQUMxQixpQkFBTyxNQUFNLGFBQWE7QUFBQSxRQUM1QjtBQUNBLHFCQUFhO0FBQ2IseUJBQWlCO0FBQ2pCLFlBQUksQ0FBQyxTQUFTLE1BQU0sV0FBVztBQUM3QixpQkFBTyxNQUFNLGFBQWE7QUFBQSxRQUM1QjtBQUNBLFlBQUkscUJBQXFCLEdBQUc7QUFDMUIsY0FBSSx5QkFBeUIsMkJBQTJCLEdBQUcsTUFBTSx1QkFBdUIsS0FBSyxVQUFVLHVCQUF1QjtBQUM5SCxnQ0FBc0IsQ0FBQyxLQUFLLE9BQU8sR0FBRyxDQUFDO0FBQUEsUUFDekM7QUFDQSx3QkFBZ0IsU0FBUyxpQkFBaUI7QUFDeEMsY0FBSTtBQUNKLGNBQUksQ0FBQyxTQUFTLE1BQU0sYUFBYSxxQkFBcUI7QUFDcEQ7QUFBQSxVQUNGO0FBQ0EsZ0NBQXNCO0FBQ3RCLGVBQUssT0FBTztBQUNaLGlCQUFPLE1BQU0sYUFBYSxTQUFTLE1BQU07QUFDekMsY0FBSSxxQkFBcUIsS0FBSyxTQUFTLE1BQU0sV0FBVztBQUN0RCxnQkFBSSx5QkFBeUIsMkJBQTJCLEdBQUcsT0FBTyx1QkFBdUIsS0FBSyxXQUFXLHVCQUF1QjtBQUNoSSxrQ0FBc0IsQ0FBQyxNQUFNLFFBQVEsR0FBRyxRQUFRO0FBQ2hELCtCQUFtQixDQUFDLE1BQU0sUUFBUSxHQUFHLFNBQVM7QUFBQSxVQUNoRDtBQUNBLHFDQUEyQjtBQUMzQixzQ0FBNEI7QUFDNUIsdUJBQWEsa0JBQWtCLFFBQVE7QUFDdkMsV0FBQyx5QkFBeUIsU0FBUyxtQkFBbUIsT0FBTyxTQUFTLHVCQUF1QixZQUFZO0FBQ3pHLG1CQUFTLE1BQU0sWUFBWTtBQUMzQixxQkFBVyxXQUFXLENBQUMsUUFBUSxDQUFDO0FBQ2hDLGNBQUksU0FBUyxNQUFNLGFBQWEscUJBQXFCLEdBQUc7QUFDdEQsNkJBQWlCLFVBQVUsV0FBVztBQUNwQyx1QkFBUyxNQUFNLFVBQVU7QUFDekIseUJBQVcsV0FBVyxDQUFDLFFBQVEsQ0FBQztBQUFBLFlBQ2xDLENBQUM7QUFBQSxVQUNIO0FBQUEsUUFDRjtBQUNBLFFBQUFBLE9BQU07QUFBQSxNQUNSO0FBQ0EsZUFBU0osUUFBTztBQUNkLFlBQUksTUFBTTtBQUNSLG1CQUFTLFNBQVMsTUFBTSxhQUFhLHdCQUF3QixNQUFNLENBQUM7QUFBQSxRQUN0RTtBQUNBLFlBQUksa0JBQWtCLENBQUMsU0FBUyxNQUFNO0FBQ3RDLFlBQUksY0FBYyxTQUFTLE1BQU07QUFDakMsWUFBSSxhQUFhLENBQUMsU0FBUyxNQUFNO0FBQ2pDLFlBQUksV0FBVyx3QkFBd0IsU0FBUyxNQUFNLFVBQVUsR0FBRyxhQUFhLFFBQVE7QUFDeEYsWUFBSSxtQkFBbUIsZUFBZSxZQUFZO0FBQ2hEO0FBQUEsUUFDRjtBQUNBLG1CQUFXLFVBQVUsQ0FBQyxRQUFRLEdBQUcsS0FBSztBQUN0QyxZQUFJLFNBQVMsTUFBTSxPQUFPLFFBQVEsTUFBTSxPQUFPO0FBQzdDO0FBQUEsUUFDRjtBQUNBLGlCQUFTLE1BQU0sWUFBWTtBQUMzQixpQkFBUyxNQUFNLFVBQVU7QUFDekIsOEJBQXNCO0FBQ3RCLDZCQUFxQjtBQUNyQixZQUFJLHFCQUFxQixHQUFHO0FBQzFCLGlCQUFPLE1BQU0sYUFBYTtBQUFBLFFBQzVCO0FBQ0EseUNBQWlDO0FBQ2pDLDRCQUFvQjtBQUNwQixxQkFBYTtBQUNiLFlBQUkscUJBQXFCLEdBQUc7QUFDMUIsY0FBSSx5QkFBeUIsMkJBQTJCLEdBQUcsTUFBTSx1QkFBdUIsS0FBSyxVQUFVLHVCQUF1QjtBQUM5SCxjQUFJLFNBQVMsTUFBTSxXQUFXO0FBQzVCLGtDQUFzQixDQUFDLEtBQUssT0FBTyxHQUFHLFFBQVE7QUFDOUMsK0JBQW1CLENBQUMsS0FBSyxPQUFPLEdBQUcsUUFBUTtBQUFBLFVBQzdDO0FBQUEsUUFDRjtBQUNBLG1DQUEyQjtBQUMzQixvQ0FBNEI7QUFDNUIsWUFBSSxTQUFTLE1BQU0sV0FBVztBQUM1QixjQUFJLHFCQUFxQixHQUFHO0FBQzFCLDhCQUFrQixVQUFVLFNBQVMsT0FBTztBQUFBLFVBQzlDO0FBQUEsUUFDRixPQUFPO0FBQ0wsbUJBQVMsUUFBUTtBQUFBLFFBQ25CO0FBQUEsTUFDRjtBQUNBLGVBQVMsc0JBQXNCLE9BQU87QUFDcEMsWUFBSSxNQUFNO0FBQ1IsbUJBQVMsU0FBUyxNQUFNLGFBQWEsd0JBQXdCLHVCQUF1QixDQUFDO0FBQUEsUUFDdkY7QUFDQSxvQkFBWSxFQUFFLGlCQUFpQixhQUFhLG9CQUFvQjtBQUNoRSxxQkFBYSxvQkFBb0Isb0JBQW9CO0FBQ3JELDZCQUFxQixLQUFLO0FBQUEsTUFDNUI7QUFDQSxlQUFTLFVBQVU7QUFDakIsWUFBSSxNQUFNO0FBQ1IsbUJBQVMsU0FBUyxNQUFNLGFBQWEsd0JBQXdCLFNBQVMsQ0FBQztBQUFBLFFBQ3pFO0FBQ0EsWUFBSSxTQUFTLE1BQU0sV0FBVztBQUM1QixtQkFBUyxLQUFLO0FBQUEsUUFDaEI7QUFDQSxZQUFJLENBQUMsU0FBUyxNQUFNLFdBQVc7QUFDN0I7QUFBQSxRQUNGO0FBQ0EsOEJBQXNCO0FBQ3RCLDRCQUFvQixFQUFFLFFBQVEsU0FBUyxjQUFjO0FBQ25ELHVCQUFhLE9BQU8sUUFBUTtBQUFBLFFBQzlCLENBQUM7QUFDRCxZQUFJLE9BQU8sWUFBWTtBQUNyQixpQkFBTyxXQUFXLFlBQVksTUFBTTtBQUFBLFFBQ3RDO0FBQ0EsMkJBQW1CLGlCQUFpQixPQUFPLFNBQVMsR0FBRztBQUNyRCxpQkFBTyxNQUFNO0FBQUEsUUFDZixDQUFDO0FBQ0QsaUJBQVMsTUFBTSxZQUFZO0FBQzNCLG1CQUFXLFlBQVksQ0FBQyxRQUFRLENBQUM7QUFBQSxNQUNuQztBQUNBLGVBQVNaLFdBQVU7QUFDakIsWUFBSSxNQUFNO0FBQ1IsbUJBQVMsU0FBUyxNQUFNLGFBQWEsd0JBQXdCLFNBQVMsQ0FBQztBQUFBLFFBQ3pFO0FBQ0EsWUFBSSxTQUFTLE1BQU0sYUFBYTtBQUM5QjtBQUFBLFFBQ0Y7QUFDQSxpQkFBUyxtQkFBbUI7QUFDNUIsaUJBQVMsUUFBUTtBQUNqQix3QkFBZ0I7QUFDaEIsZUFBTyxVQUFVO0FBQ2pCLGlCQUFTLE1BQU0sY0FBYztBQUM3QixtQkFBVyxhQUFhLENBQUMsUUFBUSxDQUFDO0FBQUEsTUFDcEM7QUFBQSxJQUNGO0FBQ0EsYUFBUyxPQUFPLFNBQVMsZUFBZTtBQUN0QyxVQUFJLGtCQUFrQixRQUFRO0FBQzVCLHdCQUFnQixDQUFDO0FBQUEsTUFDbkI7QUFDQSxVQUFJYyxXQUFVLGFBQWEsUUFBUSxPQUFPLGNBQWMsV0FBVyxDQUFDLENBQUM7QUFDckUsVUFBSSxNQUFNO0FBQ1Isd0JBQWdCLE9BQU87QUFDdkIsc0JBQWMsZUFBZUEsUUFBTztBQUFBLE1BQ3RDO0FBQ0EsK0JBQXlCO0FBQ3pCLFVBQUksY0FBYyxPQUFPLE9BQU8sQ0FBQyxHQUFHLGVBQWU7QUFBQSxRQUNqRCxTQUFBQTtBQUFBLE1BQ0YsQ0FBQztBQUNELFVBQUksV0FBVyxtQkFBbUIsT0FBTztBQUN6QyxVQUFJLE1BQU07QUFDUixZQUFJLHlCQUF5QjFDLFdBQVUsWUFBWSxPQUFPO0FBQzFELFlBQUksZ0NBQWdDLFNBQVMsU0FBUztBQUN0RCxpQkFBUywwQkFBMEIsK0JBQStCLENBQUMsc0VBQXNFLHFFQUFxRSxxRUFBcUUsUUFBUSx1RUFBdUUsb0RBQW9ELFFBQVEsbUNBQW1DLDJDQUEyQyxFQUFFLEtBQUssR0FBRyxDQUFDO0FBQUEsTUFDemY7QUFDQSxVQUFJLFlBQVksU0FBUyxPQUFPLFNBQVMsS0FBSyxXQUFXO0FBQ3ZELFlBQUksV0FBVyxhQUFhLFlBQVksV0FBVyxXQUFXO0FBQzlELFlBQUksVUFBVTtBQUNaLGNBQUksS0FBSyxRQUFRO0FBQUEsUUFDbkI7QUFDQSxlQUFPO0FBQUEsTUFDVCxHQUFHLENBQUMsQ0FBQztBQUNMLGFBQU9BLFdBQVUsT0FBTyxJQUFJLFVBQVUsQ0FBQyxJQUFJO0FBQUEsSUFDN0M7QUFDQSxXQUFPLGVBQWU7QUFDdEIsV0FBTyxrQkFBa0I7QUFDekIsV0FBTyxlQUFlO0FBQ3RCLFFBQUksVUFBVSxTQUFTLFNBQVMsT0FBTztBQUNyQyxVQUFJLE9BQU8sVUFBVSxTQUFTLENBQUMsSUFBSSxPQUFPLDhCQUE4QixLQUFLLFNBQVMsV0FBVyxLQUFLO0FBQ3RHLHVCQUFpQixRQUFRLFNBQVMsVUFBVTtBQUMxQyxZQUFJLGFBQWE7QUFDakIsWUFBSSw2QkFBNkI7QUFDL0IsdUJBQWEsbUJBQW1CLDJCQUEyQixJQUFJLFNBQVMsY0FBYyw4QkFBOEIsU0FBUyxXQUFXLDRCQUE0QjtBQUFBLFFBQ3RLO0FBQ0EsWUFBSSxDQUFDLFlBQVk7QUFDZixjQUFJLG1CQUFtQixTQUFTLE1BQU07QUFDdEMsbUJBQVMsU0FBUztBQUFBLFlBQ2hCO0FBQUEsVUFDRixDQUFDO0FBQ0QsbUJBQVMsS0FBSztBQUNkLGNBQUksQ0FBQyxTQUFTLE1BQU0sYUFBYTtBQUMvQixxQkFBUyxTQUFTO0FBQUEsY0FDaEIsVUFBVTtBQUFBLFlBQ1osQ0FBQztBQUFBLFVBQ0g7QUFBQSxRQUNGO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSDtBQUNBLFFBQUksc0JBQXNCLE9BQU8sT0FBTyxDQUFDLEdBQUcsS0FBSyxhQUFhO0FBQUEsTUFDNUQsUUFBUSxTQUFTLE9BQU8sTUFBTTtBQUM1QixZQUFJLFFBQVEsS0FBSztBQUNqQixZQUFJLGdCQUFnQjtBQUFBLFVBQ2xCLFFBQVE7QUFBQSxZQUNOLFVBQVUsTUFBTSxRQUFRO0FBQUEsWUFDeEIsTUFBTTtBQUFBLFlBQ04sS0FBSztBQUFBLFlBQ0wsUUFBUTtBQUFBLFVBQ1Y7QUFBQSxVQUNBLE9BQU87QUFBQSxZQUNMLFVBQVU7QUFBQSxVQUNaO0FBQUEsVUFDQSxXQUFXLENBQUM7QUFBQSxRQUNkO0FBQ0EsZUFBTyxPQUFPLE1BQU0sU0FBUyxPQUFPLE9BQU8sY0FBYyxNQUFNO0FBQy9ELGNBQU0sU0FBUztBQUNmLFlBQUksTUFBTSxTQUFTLE9BQU87QUFDeEIsaUJBQU8sT0FBTyxNQUFNLFNBQVMsTUFBTSxPQUFPLGNBQWMsS0FBSztBQUFBLFFBQy9EO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUNELFFBQUksa0JBQWtCLFNBQVMsaUJBQWlCLGdCQUFnQixlQUFlO0FBQzdFLFVBQUk7QUFDSixVQUFJLGtCQUFrQixRQUFRO0FBQzVCLHdCQUFnQixDQUFDO0FBQUEsTUFDbkI7QUFDQSxVQUFJLE1BQU07QUFDUixrQkFBVSxDQUFDLE1BQU0sUUFBUSxjQUFjLEdBQUcsQ0FBQyxzRUFBc0UseUNBQXlDLE9BQU8sY0FBYyxDQUFDLEVBQUUsS0FBSyxHQUFHLENBQUM7QUFBQSxNQUM3TDtBQUNBLFVBQUksc0JBQXNCO0FBQzFCLFVBQUksYUFBYSxDQUFDO0FBQ2xCLFVBQUk7QUFDSixVQUFJLFlBQVksY0FBYztBQUM5QixVQUFJLDRCQUE0QixDQUFDO0FBQ2pDLFVBQUksZ0JBQWdCO0FBQ3BCLGVBQVMsZ0JBQWdCO0FBQ3ZCLHFCQUFhLG9CQUFvQixJQUFJLFNBQVMsVUFBVTtBQUN0RCxpQkFBTyxTQUFTO0FBQUEsUUFDbEIsQ0FBQztBQUFBLE1BQ0g7QUFDQSxlQUFTLGdCQUFnQixXQUFXO0FBQ2xDLDRCQUFvQixRQUFRLFNBQVMsVUFBVTtBQUM3QyxjQUFJLFdBQVc7QUFDYixxQkFBUyxPQUFPO0FBQUEsVUFDbEIsT0FBTztBQUNMLHFCQUFTLFFBQVE7QUFBQSxVQUNuQjtBQUFBLFFBQ0YsQ0FBQztBQUFBLE1BQ0g7QUFDQSxlQUFTLGtCQUFrQixZQUFZO0FBQ3JDLGVBQU8sb0JBQW9CLElBQUksU0FBUyxVQUFVO0FBQ2hELGNBQUksb0JBQW9CLFNBQVM7QUFDakMsbUJBQVMsV0FBVyxTQUFTLE9BQU87QUFDbEMsOEJBQWtCLEtBQUs7QUFDdkIsZ0JBQUksU0FBUyxjQUFjLGVBQWU7QUFDeEMseUJBQVcsU0FBUyxLQUFLO0FBQUEsWUFDM0I7QUFBQSxVQUNGO0FBQ0EsaUJBQU8sV0FBVztBQUNoQixxQkFBUyxXQUFXO0FBQUEsVUFDdEI7QUFBQSxRQUNGLENBQUM7QUFBQSxNQUNIO0FBQ0EsZUFBUyxnQkFBZ0IsWUFBWSxRQUFRO0FBQzNDLFlBQUkyQixTQUFRLFdBQVcsUUFBUSxNQUFNO0FBQ3JDLFlBQUksV0FBVyxlQUFlO0FBQzVCO0FBQUEsUUFDRjtBQUNBLHdCQUFnQjtBQUNoQixZQUFJLGlCQUFpQixhQUFhLENBQUMsR0FBRyxPQUFPLFNBQVMsRUFBRSxPQUFPLFNBQVMsS0FBSyxNQUFNO0FBQ2pGLGNBQUksSUFBSSxJQUFJLG9CQUFvQkEsTUFBSyxFQUFFLE1BQU0sSUFBSTtBQUNqRCxpQkFBTztBQUFBLFFBQ1QsR0FBRyxDQUFDLENBQUM7QUFDTCxtQkFBVyxTQUFTLE9BQU8sT0FBTyxDQUFDLEdBQUcsZUFBZTtBQUFBLFVBQ25ELHdCQUF3QixPQUFPLGNBQWMsMkJBQTJCLGFBQWEsY0FBYyx5QkFBeUIsV0FBVztBQUNySSxtQkFBTyxPQUFPLHNCQUFzQjtBQUFBLFVBQ3RDO0FBQUEsUUFDRixDQUFDLENBQUM7QUFBQSxNQUNKO0FBQ0Esc0JBQWdCLEtBQUs7QUFDckIsb0JBQWM7QUFDZCxVQUFJLFNBQVM7QUFBQSxRQUNYLElBQUksU0FBUyxLQUFLO0FBQ2hCLGlCQUFPO0FBQUEsWUFDTCxXQUFXLFNBQVMsWUFBWTtBQUM5Qiw4QkFBZ0IsSUFBSTtBQUFBLFlBQ3RCO0FBQUEsWUFDQSxVQUFVLFNBQVMsV0FBVztBQUM1Qiw4QkFBZ0I7QUFBQSxZQUNsQjtBQUFBLFlBQ0EsZ0JBQWdCLFNBQVMsZUFBZSxVQUFVO0FBQ2hELGtCQUFJLFNBQVMsTUFBTSxnQkFBZ0IsQ0FBQyxlQUFlO0FBQ2pELGdDQUFnQjtBQUNoQixnQ0FBZ0I7QUFBQSxjQUNsQjtBQUFBLFlBQ0Y7QUFBQSxZQUNBLFFBQVEsU0FBUyxPQUFPLFVBQVU7QUFDaEMsa0JBQUksU0FBUyxNQUFNLGdCQUFnQixDQUFDLGVBQWU7QUFDakQsZ0NBQWdCO0FBQ2hCLGdDQUFnQixVQUFVLFdBQVcsQ0FBQyxDQUFDO0FBQUEsY0FDekM7QUFBQSxZQUNGO0FBQUEsWUFDQSxXQUFXLFNBQVMsVUFBVSxVQUFVLE9BQU87QUFDN0MsOEJBQWdCLFVBQVUsTUFBTSxhQUFhO0FBQUEsWUFDL0M7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFDQSxVQUFJLFlBQVksT0FBTyxJQUFJLEdBQUcsT0FBTyxPQUFPLENBQUMsR0FBRyxpQkFBaUIsZUFBZSxDQUFDLFdBQVcsQ0FBQyxHQUFHO0FBQUEsUUFDOUYsU0FBUyxDQUFDLE1BQU0sRUFBRSxPQUFPLGNBQWMsV0FBVyxDQUFDLENBQUM7QUFBQSxRQUNwRCxlQUFlO0FBQUEsUUFDZixlQUFlLE9BQU8sT0FBTyxDQUFDLEdBQUcsY0FBYyxlQUFlO0FBQUEsVUFDNUQsV0FBVyxDQUFDLEVBQUUsU0FBUyx3QkFBd0IsY0FBYyxrQkFBa0IsT0FBTyxTQUFTLHNCQUFzQixjQUFjLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDO0FBQUEsUUFDOUosQ0FBQztBQUFBLE1BQ0gsQ0FBQyxDQUFDO0FBQ0YsVUFBSSxlQUFlLFVBQVU7QUFDN0IsZ0JBQVUsT0FBTyxTQUFTLFFBQVE7QUFDaEMscUJBQWE7QUFDYixZQUFJLENBQUMsaUJBQWlCLFVBQVUsTUFBTTtBQUNwQyxpQkFBTyxnQkFBZ0IsV0FBVyxXQUFXLENBQUMsQ0FBQztBQUFBLFFBQ2pEO0FBQ0EsWUFBSSxpQkFBaUIsVUFBVSxNQUFNO0FBQ25DO0FBQUEsUUFDRjtBQUNBLFlBQUksT0FBTyxXQUFXLFVBQVU7QUFDOUIsaUJBQU8sV0FBVyxNQUFNLEtBQUssZ0JBQWdCLFdBQVcsV0FBVyxNQUFNLENBQUM7QUFBQSxRQUM1RTtBQUNBLFlBQUksb0JBQW9CLFNBQVMsTUFBTSxHQUFHO0FBQ3hDLGNBQUksTUFBTSxPQUFPO0FBQ2pCLGlCQUFPLGdCQUFnQixXQUFXLEdBQUc7QUFBQSxRQUN2QztBQUNBLFlBQUksV0FBVyxTQUFTLE1BQU0sR0FBRztBQUMvQixpQkFBTyxnQkFBZ0IsV0FBVyxNQUFNO0FBQUEsUUFDMUM7QUFBQSxNQUNGO0FBQ0EsZ0JBQVUsV0FBVyxXQUFXO0FBQzlCLFlBQUksUUFBUSxXQUFXLENBQUM7QUFDeEIsWUFBSSxDQUFDLGVBQWU7QUFDbEIsaUJBQU8sVUFBVSxLQUFLLENBQUM7QUFBQSxRQUN6QjtBQUNBLFlBQUlBLFNBQVEsV0FBVyxRQUFRLGFBQWE7QUFDNUMsa0JBQVUsS0FBSyxXQUFXQSxTQUFRLENBQUMsS0FBSyxLQUFLO0FBQUEsTUFDL0M7QUFDQSxnQkFBVSxlQUFlLFdBQVc7QUFDbEMsWUFBSSxPQUFPLFdBQVcsV0FBVyxTQUFTLENBQUM7QUFDM0MsWUFBSSxDQUFDLGVBQWU7QUFDbEIsaUJBQU8sVUFBVSxLQUFLLElBQUk7QUFBQSxRQUM1QjtBQUNBLFlBQUlBLFNBQVEsV0FBVyxRQUFRLGFBQWE7QUFDNUMsWUFBSSxTQUFTLFdBQVdBLFNBQVEsQ0FBQyxLQUFLO0FBQ3RDLGtCQUFVLEtBQUssTUFBTTtBQUFBLE1BQ3ZCO0FBQ0EsVUFBSSxtQkFBbUIsVUFBVTtBQUNqQyxnQkFBVSxXQUFXLFNBQVMsT0FBTztBQUNuQyxvQkFBWSxNQUFNLGFBQWE7QUFDL0IseUJBQWlCLEtBQUs7QUFBQSxNQUN4QjtBQUNBLGdCQUFVLGVBQWUsU0FBUyxlQUFlO0FBQy9DLHdCQUFnQixJQUFJO0FBQ3BCLGtDQUEwQixRQUFRLFNBQVMsSUFBSTtBQUM3QyxpQkFBTyxHQUFHO0FBQUEsUUFDWixDQUFDO0FBQ0QsOEJBQXNCO0FBQ3RCLHdCQUFnQixLQUFLO0FBQ3JCLHNCQUFjO0FBQ2QsMEJBQWtCLFNBQVM7QUFDM0Isa0JBQVUsU0FBUztBQUFBLFVBQ2pCLGVBQWU7QUFBQSxRQUNqQixDQUFDO0FBQUEsTUFDSDtBQUNBLGtDQUE0QixrQkFBa0IsU0FBUztBQUN2RCxhQUFPO0FBQUEsSUFDVDtBQUNBLFFBQUksc0JBQXNCO0FBQUEsTUFDeEIsV0FBVztBQUFBLE1BQ1gsU0FBUztBQUFBLE1BQ1QsT0FBTztBQUFBLElBQ1Q7QUFDQSxhQUFTLFNBQVMsU0FBUyxPQUFPO0FBQ2hDLFVBQUksTUFBTTtBQUNSLGtCQUFVLEVBQUUsU0FBUyxNQUFNLFNBQVMsQ0FBQyw4RUFBOEUsa0RBQWtELEVBQUUsS0FBSyxHQUFHLENBQUM7QUFBQSxNQUNsTDtBQUNBLFVBQUksWUFBWSxDQUFDO0FBQ2pCLFVBQUksc0JBQXNCLENBQUM7QUFDM0IsVUFBSSxXQUFXO0FBQ2YsVUFBSSxTQUFTLE1BQU07QUFDbkIsVUFBSSxjQUFjLGlCQUFpQixPQUFPLENBQUMsUUFBUSxDQUFDO0FBQ3BELFVBQUksY0FBYyxPQUFPLE9BQU8sQ0FBQyxHQUFHLGFBQWE7QUFBQSxRQUMvQyxTQUFTO0FBQUEsUUFDVCxPQUFPO0FBQUEsTUFDVCxDQUFDO0FBQ0QsVUFBSSxhQUFhLE9BQU8sT0FBTyxDQUFDLEdBQUcsYUFBYTtBQUFBLFFBQzlDLGNBQWM7QUFBQSxNQUNoQixDQUFDO0FBQ0QsVUFBSSxjQUFjLE9BQU8sU0FBUyxXQUFXO0FBQzdDLFVBQUksd0JBQXdCLGlCQUFpQixXQUFXO0FBQ3hELGVBQVMsVUFBVSxPQUFPO0FBQ3hCLFlBQUksQ0FBQyxNQUFNLFVBQVUsVUFBVTtBQUM3QjtBQUFBLFFBQ0Y7QUFDQSxZQUFJLGFBQWEsTUFBTSxPQUFPLFFBQVEsTUFBTTtBQUM1QyxZQUFJLENBQUMsWUFBWTtBQUNmO0FBQUEsUUFDRjtBQUNBLFlBQUksVUFBVSxXQUFXLGFBQWEsb0JBQW9CLEtBQUssTUFBTSxXQUFXLGFBQWE7QUFDN0YsWUFBSSxXQUFXLFFBQVE7QUFDckI7QUFBQSxRQUNGO0FBQ0EsWUFBSSxNQUFNLFNBQVMsZ0JBQWdCLE9BQU8sV0FBVyxVQUFVLFdBQVc7QUFDeEU7QUFBQSxRQUNGO0FBQ0EsWUFBSSxNQUFNLFNBQVMsZ0JBQWdCLFFBQVEsUUFBUSxvQkFBb0IsTUFBTSxJQUFJLENBQUMsSUFBSSxHQUFHO0FBQ3ZGO0FBQUEsUUFDRjtBQUNBLFlBQUksV0FBVyxPQUFPLFlBQVksVUFBVTtBQUM1QyxZQUFJLFVBQVU7QUFDWixnQ0FBc0Isb0JBQW9CLE9BQU8sUUFBUTtBQUFBLFFBQzNEO0FBQUEsTUFDRjtBQUNBLGVBQVNnQixJQUFHLE1BQU0sV0FBVyxTQUFTLFNBQVM7QUFDN0MsWUFBSSxZQUFZLFFBQVE7QUFDdEIsb0JBQVU7QUFBQSxRQUNaO0FBQ0EsYUFBSyxpQkFBaUIsV0FBVyxTQUFTLE9BQU87QUFDakQsa0JBQVUsS0FBSztBQUFBLFVBQ2I7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNGLENBQUM7QUFBQSxNQUNIO0FBQ0EsZUFBUyxrQkFBa0IsVUFBVTtBQUNuQyxZQUFJLFlBQVksU0FBUztBQUN6QixRQUFBQSxJQUFHLFdBQVcsY0FBYyxXQUFXLGFBQWE7QUFDcEQsUUFBQUEsSUFBRyxXQUFXLGFBQWEsU0FBUztBQUNwQyxRQUFBQSxJQUFHLFdBQVcsV0FBVyxTQUFTO0FBQ2xDLFFBQUFBLElBQUcsV0FBVyxTQUFTLFNBQVM7QUFBQSxNQUNsQztBQUNBLGVBQVMsdUJBQXVCO0FBQzlCLGtCQUFVLFFBQVEsU0FBUyxNQUFNO0FBQy9CLGNBQUksT0FBTyxLQUFLLE1BQU0sWUFBWSxLQUFLLFdBQVcsVUFBVSxLQUFLLFNBQVMsVUFBVSxLQUFLO0FBQ3pGLGVBQUssb0JBQW9CLFdBQVcsU0FBUyxPQUFPO0FBQUEsUUFDdEQsQ0FBQztBQUNELG9CQUFZLENBQUM7QUFBQSxNQUNmO0FBQ0EsZUFBUyxlQUFlLFVBQVU7QUFDaEMsWUFBSSxrQkFBa0IsU0FBUztBQUMvQixZQUFJLGlCQUFpQixTQUFTO0FBQzlCLFlBQUksa0JBQWtCLFNBQVM7QUFDL0IsaUJBQVMsVUFBVSxTQUFTLDZCQUE2QjtBQUN2RCxjQUFJLGdDQUFnQyxRQUFRO0FBQzFDLDBDQUE4QjtBQUFBLFVBQ2hDO0FBQ0EsY0FBSSw2QkFBNkI7QUFDL0IsZ0NBQW9CLFFBQVEsU0FBUyxXQUFXO0FBQzlDLHdCQUFVLFFBQVE7QUFBQSxZQUNwQixDQUFDO0FBQUEsVUFDSDtBQUNBLGdDQUFzQixDQUFDO0FBQ3ZCLCtCQUFxQjtBQUNyQiwwQkFBZ0I7QUFBQSxRQUNsQjtBQUNBLGlCQUFTLFNBQVMsV0FBVztBQUMzQix5QkFBZTtBQUNmLDhCQUFvQixRQUFRLFNBQVMsV0FBVztBQUM5QyxtQkFBTyxVQUFVLE9BQU87QUFBQSxVQUMxQixDQUFDO0FBQ0QscUJBQVc7QUFBQSxRQUNiO0FBQ0EsaUJBQVMsVUFBVSxXQUFXO0FBQzVCLDBCQUFnQjtBQUNoQiw4QkFBb0IsUUFBUSxTQUFTLFdBQVc7QUFDOUMsbUJBQU8sVUFBVSxRQUFRO0FBQUEsVUFDM0IsQ0FBQztBQUNELHFCQUFXO0FBQUEsUUFDYjtBQUNBLDBCQUFrQixRQUFRO0FBQUEsTUFDNUI7QUFDQSw0QkFBc0IsUUFBUSxjQUFjO0FBQzVDLGFBQU87QUFBQSxJQUNUO0FBQ0EsUUFBSSxjQUFjO0FBQUEsTUFDaEIsTUFBTTtBQUFBLE1BQ04sY0FBYztBQUFBLE1BQ2QsSUFBSSxTQUFTLEdBQUcsVUFBVTtBQUN4QixZQUFJO0FBQ0osWUFBSSxHQUFHLHdCQUF3QixTQUFTLE1BQU0sV0FBVyxPQUFPLFNBQVMsc0JBQXNCLFVBQVU7QUFDdkcsY0FBSSxNQUFNO0FBQ1Isc0JBQVUsU0FBUyxNQUFNLGFBQWEsZ0VBQWdFO0FBQUEsVUFDeEc7QUFDQSxpQkFBTyxDQUFDO0FBQUEsUUFDVjtBQUNBLFlBQUksZUFBZSxZQUFZLFNBQVMsTUFBTSxHQUFHLE1BQU0sYUFBYSxLQUFLLFVBQVUsYUFBYTtBQUNoRyxZQUFJLFdBQVcsU0FBUyxNQUFNLGNBQWMsc0JBQXNCLElBQUk7QUFDdEUsZUFBTztBQUFBLFVBQ0wsVUFBVSxTQUFTLFdBQVc7QUFDNUIsZ0JBQUksVUFBVTtBQUNaLGtCQUFJLGFBQWEsVUFBVSxJQUFJLGlCQUFpQjtBQUNoRCxrQkFBSSxhQUFhLG9CQUFvQixFQUFFO0FBQ3ZDLGtCQUFJLE1BQU0sV0FBVztBQUNyQix1QkFBUyxTQUFTO0FBQUEsZ0JBQ2hCLE9BQU87QUFBQSxnQkFDUCxXQUFXO0FBQUEsY0FDYixDQUFDO0FBQUEsWUFDSDtBQUFBLFVBQ0Y7QUFBQSxVQUNBLFNBQVMsU0FBUyxVQUFVO0FBQzFCLGdCQUFJLFVBQVU7QUFDWixrQkFBSSxxQkFBcUIsSUFBSSxNQUFNO0FBQ25DLGtCQUFJLFdBQVcsT0FBTyxtQkFBbUIsUUFBUSxNQUFNLEVBQUUsQ0FBQztBQUMxRCxzQkFBUSxNQUFNLGtCQUFrQixLQUFLLE1BQU0sV0FBVyxFQUFFLElBQUk7QUFDNUQsdUJBQVMsTUFBTSxxQkFBcUI7QUFDcEMsaUNBQW1CLENBQUMsUUFBUSxHQUFHLFNBQVM7QUFBQSxZQUMxQztBQUFBLFVBQ0Y7QUFBQSxVQUNBLFFBQVEsU0FBUyxTQUFTO0FBQ3hCLGdCQUFJLFVBQVU7QUFDWix1QkFBUyxNQUFNLHFCQUFxQjtBQUFBLFlBQ3RDO0FBQUEsVUFDRjtBQUFBLFVBQ0EsUUFBUSxTQUFTLFNBQVM7QUFDeEIsZ0JBQUksVUFBVTtBQUNaLGlDQUFtQixDQUFDLFFBQVEsR0FBRyxRQUFRO0FBQUEsWUFDekM7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsYUFBUyx3QkFBd0I7QUFDL0IsVUFBSSxXQUFXLElBQUk7QUFDbkIsZUFBUyxZQUFZO0FBQ3JCLHlCQUFtQixDQUFDLFFBQVEsR0FBRyxRQUFRO0FBQ3ZDLGFBQU87QUFBQSxJQUNUO0FBQ0EsUUFBSSxjQUFjO0FBQUEsTUFDaEIsU0FBUztBQUFBLE1BQ1QsU0FBUztBQUFBLElBQ1g7QUFDQSxRQUFJLGtCQUFrQixDQUFDO0FBQ3ZCLGFBQVMsaUJBQWlCLE1BQU07QUFDOUIsVUFBSSxVQUFVLEtBQUssU0FBUyxVQUFVLEtBQUs7QUFDM0Msb0JBQWM7QUFBQSxRQUNaO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsYUFBUyx1QkFBdUIsS0FBSztBQUNuQyxVQUFJLGlCQUFpQixhQUFhLGdCQUFnQjtBQUFBLElBQ3BEO0FBQ0EsYUFBUywwQkFBMEIsS0FBSztBQUN0QyxVQUFJLG9CQUFvQixhQUFhLGdCQUFnQjtBQUFBLElBQ3ZEO0FBQ0EsUUFBSSxnQkFBZ0I7QUFBQSxNQUNsQixNQUFNO0FBQUEsTUFDTixjQUFjO0FBQUEsTUFDZCxJQUFJLFNBQVMsR0FBRyxVQUFVO0FBQ3hCLFlBQUksWUFBWSxTQUFTO0FBQ3pCLFlBQUksTUFBTSxpQkFBaUIsU0FBUyxNQUFNLGlCQUFpQixTQUFTO0FBQ3BFLFlBQUksbUJBQW1CO0FBQ3ZCLFlBQUksZ0JBQWdCO0FBQ3BCLFlBQUksY0FBYztBQUNsQixZQUFJLFlBQVksU0FBUztBQUN6QixpQkFBUyx1QkFBdUI7QUFDOUIsaUJBQU8sU0FBUyxNQUFNLGlCQUFpQixhQUFhLFNBQVMsTUFBTTtBQUFBLFFBQ3JFO0FBQ0EsaUJBQVMsY0FBYztBQUNyQixjQUFJLGlCQUFpQixhQUFhLFdBQVc7QUFBQSxRQUMvQztBQUNBLGlCQUFTLGlCQUFpQjtBQUN4QixjQUFJLG9CQUFvQixhQUFhLFdBQVc7QUFBQSxRQUNsRDtBQUNBLGlCQUFTLDhCQUE4QjtBQUNyQyw2QkFBbUI7QUFDbkIsbUJBQVMsU0FBUztBQUFBLFlBQ2hCLHdCQUF3QjtBQUFBLFVBQzFCLENBQUM7QUFDRCw2QkFBbUI7QUFBQSxRQUNyQjtBQUNBLGlCQUFTLFlBQVksT0FBTztBQUMxQixjQUFJLHdCQUF3QixNQUFNLFNBQVMsVUFBVSxTQUFTLE1BQU0sTUFBTSxJQUFJO0FBQzlFLGNBQUksZ0JBQWdCLFNBQVMsTUFBTTtBQUNuQyxjQUFJLFVBQVUsTUFBTSxTQUFTLFVBQVUsTUFBTTtBQUM3QyxjQUFJLE9BQU8sVUFBVSxzQkFBc0I7QUFDM0MsY0FBSSxZQUFZLFVBQVUsS0FBSztBQUMvQixjQUFJLFlBQVksVUFBVSxLQUFLO0FBQy9CLGNBQUkseUJBQXlCLENBQUMsU0FBUyxNQUFNLGFBQWE7QUFDeEQscUJBQVMsU0FBUztBQUFBLGNBQ2hCLHdCQUF3QixTQUFTLHlCQUF5QjtBQUN4RCxvQkFBSSxRQUFRLFVBQVUsc0JBQXNCO0FBQzVDLG9CQUFJLElBQUk7QUFDUixvQkFBSSxJQUFJO0FBQ1Isb0JBQUksa0JBQWtCLFdBQVc7QUFDL0Isc0JBQUksTUFBTSxPQUFPO0FBQ2pCLHNCQUFJLE1BQU0sTUFBTTtBQUFBLGdCQUNsQjtBQUNBLG9CQUFJLE1BQU0sa0JBQWtCLGVBQWUsTUFBTSxNQUFNO0FBQ3ZELG9CQUFJLFFBQVEsa0JBQWtCLGFBQWEsTUFBTSxRQUFRO0FBQ3pELG9CQUFJLFNBQVMsa0JBQWtCLGVBQWUsTUFBTSxTQUFTO0FBQzdELG9CQUFJLE9BQU8sa0JBQWtCLGFBQWEsTUFBTSxPQUFPO0FBQ3ZELHVCQUFPO0FBQUEsa0JBQ0wsT0FBTyxRQUFRO0FBQUEsa0JBQ2YsUUFBUSxTQUFTO0FBQUEsa0JBQ2pCO0FBQUEsa0JBQ0E7QUFBQSxrQkFDQTtBQUFBLGtCQUNBO0FBQUEsZ0JBQ0Y7QUFBQSxjQUNGO0FBQUEsWUFDRixDQUFDO0FBQUEsVUFDSDtBQUFBLFFBQ0Y7QUFDQSxpQkFBUyxTQUFTO0FBQ2hCLGNBQUksU0FBUyxNQUFNLGNBQWM7QUFDL0IsNEJBQWdCLEtBQUs7QUFBQSxjQUNuQjtBQUFBLGNBQ0E7QUFBQSxZQUNGLENBQUM7QUFDRCxtQ0FBdUIsR0FBRztBQUFBLFVBQzVCO0FBQUEsUUFDRjtBQUNBLGlCQUFTZixXQUFVO0FBQ2pCLDRCQUFrQixnQkFBZ0IsT0FBTyxTQUFTLE1BQU07QUFDdEQsbUJBQU8sS0FBSyxhQUFhO0FBQUEsVUFDM0IsQ0FBQztBQUNELGNBQUksZ0JBQWdCLE9BQU8sU0FBUyxNQUFNO0FBQ3hDLG1CQUFPLEtBQUssUUFBUTtBQUFBLFVBQ3RCLENBQUMsRUFBRSxXQUFXLEdBQUc7QUFDZixzQ0FBMEIsR0FBRztBQUFBLFVBQy9CO0FBQUEsUUFDRjtBQUNBLGVBQU87QUFBQSxVQUNMLFVBQVU7QUFBQSxVQUNWLFdBQVdBO0FBQUEsVUFDWCxnQkFBZ0IsU0FBUyxpQkFBaUI7QUFDeEMsd0JBQVksU0FBUztBQUFBLFVBQ3ZCO0FBQUEsVUFDQSxlQUFlLFNBQVMsY0FBYyxHQUFHLE9BQU87QUFDOUMsZ0JBQUksZ0JBQWdCLE1BQU07QUFDMUIsZ0JBQUksa0JBQWtCO0FBQ3BCO0FBQUEsWUFDRjtBQUNBLGdCQUFJLGtCQUFrQixVQUFVLFVBQVUsaUJBQWlCLGVBQWU7QUFDeEUsY0FBQUEsU0FBUTtBQUNSLGtCQUFJLGVBQWU7QUFDakIsdUJBQU87QUFDUCxvQkFBSSxTQUFTLE1BQU0sYUFBYSxDQUFDLGlCQUFpQixDQUFDLHFCQUFxQixHQUFHO0FBQ3pFLDhCQUFZO0FBQUEsZ0JBQ2Q7QUFBQSxjQUNGLE9BQU87QUFDTCwrQkFBZTtBQUNmLDRDQUE0QjtBQUFBLGNBQzlCO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxVQUNBLFNBQVMsU0FBUyxVQUFVO0FBQzFCLGdCQUFJLFNBQVMsTUFBTSxnQkFBZ0IsQ0FBQyxlQUFlO0FBQ2pELGtCQUFJLGFBQWE7QUFDZiw0QkFBWSxXQUFXO0FBQ3ZCLDhCQUFjO0FBQUEsY0FDaEI7QUFDQSxrQkFBSSxDQUFDLHFCQUFxQixHQUFHO0FBQzNCLDRCQUFZO0FBQUEsY0FDZDtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsVUFDQSxXQUFXLFNBQVMsVUFBVSxHQUFHLE9BQU87QUFDdEMsZ0JBQUksYUFBYSxLQUFLLEdBQUc7QUFDdkIsNEJBQWM7QUFBQSxnQkFDWixTQUFTLE1BQU07QUFBQSxnQkFDZixTQUFTLE1BQU07QUFBQSxjQUNqQjtBQUFBLFlBQ0Y7QUFDQSw0QkFBZ0IsTUFBTSxTQUFTO0FBQUEsVUFDakM7QUFBQSxVQUNBLFVBQVUsU0FBUyxXQUFXO0FBQzVCLGdCQUFJLFNBQVMsTUFBTSxjQUFjO0FBQy9CLDBDQUE0QjtBQUM1Qiw2QkFBZTtBQUNmLDRCQUFjO0FBQUEsWUFDaEI7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsYUFBUyxTQUFTLE9BQU8sVUFBVTtBQUNqQyxVQUFJO0FBQ0osYUFBTztBQUFBLFFBQ0wsZUFBZSxPQUFPLE9BQU8sQ0FBQyxHQUFHLE1BQU0sZUFBZTtBQUFBLFVBQ3BELFdBQVcsQ0FBQyxFQUFFLFVBQVUsdUJBQXVCLE1BQU0sa0JBQWtCLE9BQU8sU0FBUyxxQkFBcUIsY0FBYyxDQUFDLEdBQUcsT0FBTyxTQUFTLE1BQU07QUFDbEosZ0JBQUksT0FBTyxLQUFLO0FBQ2hCLG1CQUFPLFNBQVMsU0FBUztBQUFBLFVBQzNCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztBQUFBLFFBQ2hCLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUNBLFFBQUksb0JBQW9CO0FBQUEsTUFDdEIsTUFBTTtBQUFBLE1BQ04sY0FBYztBQUFBLE1BQ2QsSUFBSSxTQUFTLEdBQUcsVUFBVTtBQUN4QixZQUFJLFlBQVksU0FBUztBQUN6QixpQkFBUyxZQUFZO0FBQ25CLGlCQUFPLENBQUMsQ0FBQyxTQUFTLE1BQU07QUFBQSxRQUMxQjtBQUNBLFlBQUk7QUFDSixZQUFJLGtCQUFrQjtBQUN0QixZQUFJLG1CQUFtQjtBQUN2QixZQUFJLFdBQVc7QUFBQSxVQUNiLE1BQU07QUFBQSxVQUNOLFNBQVM7QUFBQSxVQUNULE9BQU87QUFBQSxVQUNQLElBQUksU0FBUyxJQUFJLE9BQU87QUFDdEIsZ0JBQUksUUFBUSxNQUFNO0FBQ2xCLGdCQUFJLFVBQVUsR0FBRztBQUNmLGtCQUFJLGNBQWMsTUFBTSxXQUFXO0FBQ2pDLHlCQUFTLFNBQVM7QUFBQSxrQkFDaEIsd0JBQXdCLFNBQVMseUJBQXlCO0FBQ3hELDJCQUFPLHdCQUF3QixNQUFNLFNBQVM7QUFBQSxrQkFDaEQ7QUFBQSxnQkFDRixDQUFDO0FBQUEsY0FDSDtBQUNBLDBCQUFZLE1BQU07QUFBQSxZQUNwQjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQ0EsaUJBQVMsd0JBQXdCLFlBQVk7QUFDM0MsaUJBQU8sNEJBQTRCLGlCQUFpQixVQUFVLEdBQUcsVUFBVSxzQkFBc0IsR0FBRyxVQUFVLFVBQVUsZUFBZSxDQUFDLEdBQUcsZUFBZTtBQUFBLFFBQzVKO0FBQ0EsaUJBQVMsaUJBQWlCLGNBQWM7QUFDdEMsNkJBQW1CO0FBQ25CLG1CQUFTLFNBQVMsWUFBWTtBQUM5Qiw2QkFBbUI7QUFBQSxRQUNyQjtBQUNBLGlCQUFTLGNBQWM7QUFDckIsY0FBSSxDQUFDLGtCQUFrQjtBQUNyQiw2QkFBaUIsU0FBUyxTQUFTLE9BQU8sUUFBUSxDQUFDO0FBQUEsVUFDckQ7QUFBQSxRQUNGO0FBQ0EsZUFBTztBQUFBLFVBQ0wsVUFBVTtBQUFBLFVBQ1YsZUFBZTtBQUFBLFVBQ2YsV0FBVyxTQUFTLFVBQVUsR0FBRyxPQUFPO0FBQ3RDLGdCQUFJLGFBQWEsS0FBSyxHQUFHO0FBQ3ZCLGtCQUFJLFFBQVEsVUFBVSxTQUFTLFVBQVUsZUFBZSxDQUFDO0FBQ3pELGtCQUFJLGFBQWEsTUFBTSxLQUFLLFNBQVMsTUFBTTtBQUN6Qyx1QkFBTyxLQUFLLE9BQU8sS0FBSyxNQUFNLFdBQVcsS0FBSyxRQUFRLEtBQUssTUFBTSxXQUFXLEtBQUssTUFBTSxLQUFLLE1BQU0sV0FBVyxLQUFLLFNBQVMsS0FBSyxNQUFNO0FBQUEsY0FDeEksQ0FBQztBQUNELGdDQUFrQixNQUFNLFFBQVEsVUFBVTtBQUFBLFlBQzVDO0FBQUEsVUFDRjtBQUFBLFVBQ0EsYUFBYSxTQUFTLGNBQWM7QUFDbEMsOEJBQWtCO0FBQUEsVUFDcEI7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFDQSxhQUFTLDRCQUE0QixzQkFBc0IsY0FBYyxhQUFhLGlCQUFpQjtBQUNyRyxVQUFJLFlBQVksU0FBUyxLQUFLLHlCQUF5QixNQUFNO0FBQzNELGVBQU87QUFBQSxNQUNUO0FBQ0EsVUFBSSxZQUFZLFdBQVcsS0FBSyxtQkFBbUIsS0FBSyxZQUFZLENBQUMsRUFBRSxPQUFPLFlBQVksQ0FBQyxFQUFFLE9BQU87QUFDbEcsZUFBTyxZQUFZLGVBQWUsS0FBSztBQUFBLE1BQ3pDO0FBQ0EsY0FBUSxzQkFBc0I7QUFBQSxRQUM1QixLQUFLO0FBQUEsUUFDTCxLQUFLLFVBQVU7QUFDYixjQUFJLFlBQVksWUFBWSxDQUFDO0FBQzdCLGNBQUksV0FBVyxZQUFZLFlBQVksU0FBUyxDQUFDO0FBQ2pELGNBQUksUUFBUSx5QkFBeUI7QUFDckMsY0FBSSxNQUFNLFVBQVU7QUFDcEIsY0FBSSxTQUFTLFNBQVM7QUFDdEIsY0FBSSxPQUFPLFFBQVEsVUFBVSxPQUFPLFNBQVM7QUFDN0MsY0FBSSxRQUFRLFFBQVEsVUFBVSxRQUFRLFNBQVM7QUFDL0MsY0FBSSxRQUFRLFFBQVE7QUFDcEIsY0FBSSxTQUFTLFNBQVM7QUFDdEIsaUJBQU87QUFBQSxZQUNMO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLFFBQ0EsS0FBSztBQUFBLFFBQ0wsS0FBSyxTQUFTO0FBQ1osY0FBSSxVQUFVLEtBQUssSUFBSSxNQUFNLE1BQU0sWUFBWSxJQUFJLFNBQVMsT0FBTztBQUNqRSxtQkFBTyxNQUFNO0FBQUEsVUFDZixDQUFDLENBQUM7QUFDRixjQUFJLFdBQVcsS0FBSyxJQUFJLE1BQU0sTUFBTSxZQUFZLElBQUksU0FBUyxPQUFPO0FBQ2xFLG1CQUFPLE1BQU07QUFBQSxVQUNmLENBQUMsQ0FBQztBQUNGLGNBQUksZUFBZSxZQUFZLE9BQU8sU0FBUyxNQUFNO0FBQ25ELG1CQUFPLHlCQUF5QixTQUFTLEtBQUssU0FBUyxVQUFVLEtBQUssVUFBVTtBQUFBLFVBQ2xGLENBQUM7QUFDRCxjQUFJLE9BQU8sYUFBYSxDQUFDLEVBQUU7QUFDM0IsY0FBSSxVQUFVLGFBQWEsYUFBYSxTQUFTLENBQUMsRUFBRTtBQUNwRCxjQUFJLFFBQVE7QUFDWixjQUFJLFNBQVM7QUFDYixjQUFJLFNBQVMsU0FBUztBQUN0QixjQUFJLFVBQVUsVUFBVTtBQUN4QixpQkFBTztBQUFBLFlBQ0wsS0FBSztBQUFBLFlBQ0wsUUFBUTtBQUFBLFlBQ1IsTUFBTTtBQUFBLFlBQ04sT0FBTztBQUFBLFlBQ1AsT0FBTztBQUFBLFlBQ1AsUUFBUTtBQUFBLFVBQ1Y7QUFBQSxRQUNGO0FBQUEsUUFDQSxTQUFTO0FBQ1AsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFDQSxRQUFJLFNBQVM7QUFBQSxNQUNYLE1BQU07QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLElBQUksU0FBUyxHQUFHLFVBQVU7QUFDeEIsWUFBSSxZQUFZLFNBQVMsV0FBVyxTQUFTLFNBQVM7QUFDdEQsaUJBQVMsZUFBZTtBQUN0QixpQkFBTyxTQUFTLGlCQUFpQixTQUFTLGVBQWUsTUFBTSxTQUFTLFlBQVk7QUFBQSxRQUN0RjtBQUNBLGlCQUFTLFlBQVksT0FBTztBQUMxQixpQkFBTyxTQUFTLE1BQU0sV0FBVyxRQUFRLFNBQVMsTUFBTSxXQUFXO0FBQUEsUUFDckU7QUFDQSxZQUFJLGNBQWM7QUFDbEIsWUFBSSxjQUFjO0FBQ2xCLGlCQUFTLGlCQUFpQjtBQUN4QixjQUFJLGlCQUFpQixZQUFZLFdBQVcsSUFBSSxhQUFhLEVBQUUsc0JBQXNCLElBQUk7QUFDekYsY0FBSSxpQkFBaUIsWUFBWSxRQUFRLElBQUksT0FBTyxzQkFBc0IsSUFBSTtBQUM5RSxjQUFJLGtCQUFrQixrQkFBa0IsYUFBYSxjQUFjLEtBQUssa0JBQWtCLGtCQUFrQixhQUFhLGNBQWMsR0FBRztBQUN4SSxnQkFBSSxTQUFTLGdCQUFnQjtBQUMzQix1QkFBUyxlQUFlLE9BQU87QUFBQSxZQUNqQztBQUFBLFVBQ0Y7QUFDQSx3QkFBYztBQUNkLHdCQUFjO0FBQ2QsY0FBSSxTQUFTLE1BQU0sV0FBVztBQUM1QixrQ0FBc0IsY0FBYztBQUFBLFVBQ3RDO0FBQUEsUUFDRjtBQUNBLGVBQU87QUFBQSxVQUNMLFNBQVMsU0FBUyxVQUFVO0FBQzFCLGdCQUFJLFNBQVMsTUFBTSxRQUFRO0FBQ3pCLDZCQUFlO0FBQUEsWUFDakI7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsYUFBUyxrQkFBa0IsT0FBTyxPQUFPO0FBQ3ZDLFVBQUksU0FBUyxPQUFPO0FBQ2xCLGVBQU8sTUFBTSxRQUFRLE1BQU0sT0FBTyxNQUFNLFVBQVUsTUFBTSxTQUFTLE1BQU0sV0FBVyxNQUFNLFVBQVUsTUFBTSxTQUFTLE1BQU07QUFBQSxNQUN6SDtBQUNBLGFBQU87QUFBQSxJQUNUO0FBQ0EsV0FBTyxnQkFBZ0I7QUFBQSxNQUNyQjtBQUFBLElBQ0YsQ0FBQztBQUNELFlBQVEsY0FBYztBQUN0QixZQUFRLGtCQUFrQjtBQUMxQixZQUFRLFVBQVU7QUFDbEIsWUFBUSxXQUFXO0FBQ25CLFlBQVEsZUFBZTtBQUN2QixZQUFRLFVBQVU7QUFDbEIsWUFBUSxvQkFBb0I7QUFDNUIsWUFBUSxhQUFhO0FBQ3JCLFlBQVEsU0FBUztBQUFBLEVBQ25CLENBQUM7QUFHRCxNQUFJLGdCQUFnQixXQUFXLGtCQUFrQixDQUFDO0FBR2xELE1BQUksZUFBZSxXQUFXLGtCQUFrQixDQUFDO0FBQ2pELE1BQUlpQiw0QkFBMkIsQ0FBQyxjQUFjO0FBQzVDLFVBQU0sU0FBUztBQUFBLE1BQ2IsU0FBUyxDQUFDO0FBQUEsSUFDWjtBQUNBLFVBQU0sc0JBQXNCLENBQUMsYUFBYTtBQUN4QyxhQUFPLFVBQVUsVUFBVSxRQUFRLFFBQVEsSUFBSSxDQUFDO0FBQUEsSUFDbEQ7QUFDQSxRQUFJLFVBQVUsU0FBUyxXQUFXLEdBQUc7QUFDbkMsYUFBTyxZQUFZLG9CQUFvQixXQUFXO0FBQUEsSUFDcEQ7QUFDQSxRQUFJLFVBQVUsU0FBUyxVQUFVLEdBQUc7QUFDbEMsYUFBTyxXQUFXLFNBQVMsb0JBQW9CLFVBQVUsQ0FBQztBQUFBLElBQzVEO0FBQ0EsUUFBSSxVQUFVLFNBQVMsT0FBTyxHQUFHO0FBQy9CLFlBQU0sUUFBUSxvQkFBb0IsT0FBTztBQUN6QyxhQUFPLFFBQVEsTUFBTSxTQUFTLEdBQUcsSUFBSSxNQUFNLE1BQU0sR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLFNBQVMsQ0FBQyxDQUFDLElBQUksU0FBUyxLQUFLO0FBQUEsSUFDaEc7QUFDQSxRQUFJLFVBQVUsU0FBUyxRQUFRLEdBQUc7QUFDaEMsYUFBTyxRQUFRLEtBQUssYUFBYSxZQUFZO0FBQzdDLFlBQU0sT0FBTyxvQkFBb0IsUUFBUTtBQUN6QyxVQUFJLENBQUMsS0FBSyxTQUFTLEVBQUUsU0FBUyxJQUFJLEdBQUc7QUFDbkMsZUFBTyxlQUFlLFNBQVMsTUFBTSxlQUFlO0FBQUEsTUFDdEQsT0FBTztBQUNMLGVBQU8sZUFBZTtBQUFBLE1BQ3hCO0FBQUEsSUFDRjtBQUNBLFFBQUksVUFBVSxTQUFTLElBQUksR0FBRztBQUM1QixhQUFPLFVBQVUsb0JBQW9CLElBQUk7QUFBQSxJQUMzQztBQUNBLFFBQUksVUFBVSxTQUFTLFdBQVcsR0FBRztBQUNuQyxhQUFPLFFBQVE7QUFBQSxJQUNqQjtBQUNBLFFBQUksVUFBVSxTQUFTLE1BQU0sR0FBRztBQUM5QixhQUFPLFlBQVk7QUFBQSxJQUNyQjtBQUNBLFFBQUksVUFBVSxTQUFTLGFBQWEsR0FBRztBQUNyQyxhQUFPLGNBQWM7QUFBQSxJQUN2QjtBQUNBLFFBQUksVUFBVSxTQUFTLFFBQVEsS0FBSyxPQUFPLGFBQWE7QUFDdEQsYUFBTyxvQkFBb0IsU0FBUyxvQkFBb0IsUUFBUSxDQUFDO0FBQUEsSUFDbkU7QUFDQSxRQUFJLFVBQVUsU0FBUyxVQUFVLEtBQUssT0FBTyxhQUFhO0FBQ3hELGFBQU8sc0JBQXNCLFNBQVMsb0JBQW9CLFVBQVUsQ0FBQztBQUFBLElBQ3ZFO0FBQ0EsUUFBSSxVQUFVLFNBQVMsV0FBVyxHQUFHO0FBQ25DLGFBQU8sV0FBVyxTQUFTLG9CQUFvQixXQUFXLENBQUM7QUFBQSxJQUM3RDtBQUNBLFFBQUksVUFBVSxTQUFTLE9BQU8sR0FBRztBQUMvQixhQUFPLFFBQVEsb0JBQW9CLE9BQU87QUFBQSxJQUM1QztBQUNBLFFBQUksVUFBVSxTQUFTLFdBQVcsR0FBRztBQUNuQyxhQUFPLFlBQVksb0JBQW9CLFdBQVc7QUFBQSxJQUNwRDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBR0EsV0FBUyxRQUFRLFFBQVE7QUFDdkIsV0FBTyxNQUFNLFdBQVcsQ0FBQyxPQUFPO0FBQzlCLGFBQU8sQ0FBQyxTQUFTLFNBQVMsQ0FBQyxNQUFNO0FBQy9CLGNBQU0sWUFBWSxHQUFHLGNBQWMsU0FBUyxJQUFJO0FBQUEsVUFDOUM7QUFBQSxVQUNBLFNBQVM7QUFBQSxVQUNULEdBQUc7QUFBQSxRQUNMLENBQUM7QUFDRCxpQkFBUyxLQUFLO0FBQ2QsbUJBQVcsTUFBTTtBQUNmLG1CQUFTLEtBQUs7QUFDZCxxQkFBVyxNQUFNLFNBQVMsUUFBUSxHQUFHLE9BQU8sWUFBWSxHQUFHO0FBQUEsUUFDN0QsR0FBRyxPQUFPLFdBQVcsR0FBRztBQUFBLE1BQzFCO0FBQUEsSUFDRixDQUFDO0FBQ0QsV0FBTyxVQUFVLFdBQVcsQ0FBQyxJQUFJLEVBQUMsV0FBVyxXQUFVLEdBQUcsRUFBQyxlQUFlLE9BQU0sTUFBTTtBQUNwRixZQUFNLFNBQVMsVUFBVSxTQUFTLElBQUlBLDBCQUF5QixTQUFTLElBQUksQ0FBQztBQUM3RSxVQUFJLENBQUMsR0FBRyxXQUFXO0FBQ2pCLFdBQUcsYUFBYSxHQUFHLGNBQWMsU0FBUyxJQUFJLE1BQU07QUFBQSxNQUN0RDtBQUNBLFlBQU0sZ0JBQWdCLE1BQU0sR0FBRyxVQUFVLE9BQU87QUFDaEQsWUFBTSxpQkFBaUIsTUFBTSxHQUFHLFVBQVUsUUFBUTtBQUNsRCxZQUFNLGVBQWUsQ0FBQyxZQUFZO0FBQ2hDLFlBQUksQ0FBQyxTQUFTO0FBQ1oseUJBQWU7QUFBQSxRQUNqQixPQUFPO0FBQ0wsd0JBQWM7QUFDZCxhQUFHLFVBQVUsV0FBVyxPQUFPO0FBQUEsUUFDakM7QUFBQSxNQUNGO0FBQ0EsVUFBSSxVQUFVLFNBQVMsS0FBSyxHQUFHO0FBQzdCLHFCQUFhLFVBQVU7QUFBQSxNQUN6QixPQUFPO0FBQ0wsY0FBTSxhQUFhLGNBQWMsVUFBVTtBQUMzQyxlQUFPLE1BQU07QUFDWCxxQkFBVyxDQUFDLFlBQVk7QUFDdEIsZ0JBQUksT0FBTyxZQUFZLFVBQVU7QUFDL0IsaUJBQUcsVUFBVSxTQUFTLE9BQU87QUFDN0IsNEJBQWM7QUFBQSxZQUNoQixPQUFPO0FBQ0wsMkJBQWEsT0FBTztBQUFBLFlBQ3RCO0FBQUEsVUFDRixDQUFDO0FBQUEsUUFDSCxDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFDQSxVQUFRLGVBQWUsQ0FBQyxVQUFVO0FBQ2hDLGtCQUFjLFFBQVEsZ0JBQWdCLEtBQUs7QUFDM0MsV0FBTztBQUFBLEVBQ1Q7QUFDQSxNQUFJQyxlQUFjO0FBR2xCLE1BQUlDLGtCQUFpQkQ7OztBQzMzR3JCLFdBQVMsaUJBQWlCLGVBQWUsTUFBTTtBQUMzQyxXQUFPLE9BQU8sT0FBTyxjQUFnQjtBQUNyQyxXQUFPLE9BQU8sT0FBT0UsZUFBb0I7QUFDekMsV0FBTyxPQUFPLE9BQU8sZ0JBQVE7QUFDN0IsV0FBTyxPQUFPLE9BQU9BLGVBQU87QUFBQSxFQUNoQyxDQUFDO0FBR0QsTUFBTSxZQUFZLFNBQVUsTUFBTSxRQUFRLFdBQVc7QUFDakQsYUFBUyxRQUFRQyxXQUFVQyxTQUFRO0FBQy9CLGlCQUFXLFFBQVFELFdBQVU7QUFDekIsY0FBTSxPQUFPLGtCQUFrQixNQUFNQyxPQUFNO0FBRTNDLFlBQUksU0FBUyxNQUFNO0FBQ2YsaUJBQU87QUFBQSxRQUNYO0FBQUEsTUFDSjtBQUFBLElBQ0o7QUFFQSxhQUFTLGtCQUFrQixNQUFNQSxTQUFRO0FBQ3JDLFlBQU1DLFdBQVUsS0FBSyxNQUFNLGtDQUFrQztBQUU3RCxVQUFJQSxhQUFZLFFBQVFBLFNBQVEsV0FBVyxHQUFHO0FBQzFDLGVBQU87QUFBQSxNQUNYO0FBRUEsWUFBTSxZQUFZQSxTQUFRLENBQUM7QUFFM0IsWUFBTUMsU0FBUUQsU0FBUSxDQUFDO0FBRXZCLFVBQUksVUFBVSxTQUFTLEdBQUcsR0FBRztBQUN6QixjQUFNLENBQUMsTUFBTSxFQUFFLElBQUksVUFBVSxNQUFNLEtBQUssQ0FBQztBQUV6QyxZQUFJLE9BQU8sT0FBT0QsV0FBVSxNQUFNO0FBQzlCLGlCQUFPRTtBQUFBLFFBQ1gsV0FBVyxTQUFTLE9BQU9GLFdBQVUsSUFBSTtBQUNyQyxpQkFBT0U7QUFBQSxRQUNYLFdBQVdGLFdBQVUsUUFBUUEsV0FBVSxJQUFJO0FBQ3ZDLGlCQUFPRTtBQUFBLFFBQ1g7QUFBQSxNQUNKO0FBRUEsYUFBTyxhQUFhRixVQUFTRSxTQUFRO0FBQUEsSUFDekM7QUFFQSxhQUFTLFFBQVEsUUFBUTtBQUNyQixhQUNJLE9BQU8sU0FBUyxFQUFFLE9BQU8sQ0FBQyxFQUFFLFlBQVksSUFDeEMsT0FBTyxTQUFTLEVBQUUsTUFBTSxDQUFDO0FBQUEsSUFFakM7QUFFQSxhQUFTLFFBQVEsTUFBTUMsVUFBUztBQUM1QixVQUFJQSxTQUFRLFdBQVcsR0FBRztBQUN0QixlQUFPO0FBQUEsTUFDWDtBQUVBLFlBQU0sZ0JBQWdCLENBQUM7QUFFdkIsZUFBUyxDQUFDLEtBQUtELE1BQUssS0FBSyxPQUFPLFFBQVFDLFFBQU8sR0FBRztBQUM5QyxzQkFBYyxNQUFNLFFBQVEsT0FBTyxFQUFFLENBQUMsSUFBSSxRQUFRRCxVQUFTLEVBQUU7QUFDN0Qsc0JBQWMsTUFBTSxJQUFJLFlBQVksQ0FBQyxJQUFJQSxPQUNwQyxTQUFTLEVBQ1QsWUFBWTtBQUNqQixzQkFBYyxNQUFNLEdBQUcsSUFBSUE7QUFBQSxNQUMvQjtBQUVBLGFBQU8sUUFBUSxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUMsS0FBS0EsTUFBSyxNQUFNO0FBQ3BELGVBQU8sS0FBSyxXQUFXLEtBQUtBLE1BQUs7QUFBQSxNQUNyQyxDQUFDO0FBRUQsYUFBTztBQUFBLElBQ1g7QUFFQSxhQUFTLGdCQUFnQkgsV0FBVTtBQUMvQixhQUFPQSxVQUFTO0FBQUEsUUFBSSxDQUFDLFNBQ2pCLEtBQUssUUFBUSwrQkFBK0IsRUFBRTtBQUFBLE1BQ2xEO0FBQUEsSUFDSjtBQUVBLFFBQUksV0FBVyxLQUFLLE1BQU0sR0FBRztBQUU3QixVQUFNLFFBQVEsUUFBUSxVQUFVLE1BQU07QUFFdEMsUUFBSSxVQUFVLFFBQVEsVUFBVSxRQUFXO0FBQ3ZDLGFBQU8sUUFBUSxNQUFNLEtBQUssR0FBRyxTQUFTO0FBQUEsSUFDMUM7QUFFQSxlQUFXLGdCQUFnQixRQUFRO0FBRW5DLFdBQU87QUFBQSxNQUNILFNBQVMsU0FBUyxLQUFLLFNBQVMsSUFBSSxTQUFTLENBQUMsSUFBSSxTQUFTLENBQUM7QUFBQSxNQUM1RDtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBRUEsU0FBTyxZQUFZOyIsCiAgIm5hbWVzIjogWyJjc3MiLCAibW9kdWxlX2RlZmF1bHQiLCAib2JqIiwgImluZGV4IiwgIm9wdGlvbiIsICJkZWZhdWx0cyIsICJyb290RWwiLCAiY2xvbmVFbCIsICJvbGRJbmRleCIsICJuZXdJbmRleCIsICJvbGREcmFnZ2FibGVJbmRleCIsICJuZXdEcmFnZ2FibGVJbmRleCIsICJwdXRTb3J0YWJsZSIsICJwbHVnaW5FdmVudCIsICJfZGV0ZWN0RGlyZWN0aW9uIiwgIl9kcmFnRWxJblJvd0NvbHVtbiIsICJfZGV0ZWN0TmVhcmVzdEVtcHR5U29ydGFibGUiLCAiX3ByZXBhcmVHcm91cCIsICJkcmFnRWwiLCAiX2hpZGVHaG9zdEZvclRhcmdldCIsICJfdW5oaWRlR2hvc3RGb3JUYXJnZXQiLCAibmVhcmVzdEVtcHR5SW5zZXJ0RGV0ZWN0RXZlbnQiLCAiX2NoZWNrT3V0c2lkZVRhcmdldEVsIiwgImRyYWdTdGFydEZuIiwgInRhcmdldCIsICJhZnRlciIsICJlbCIsICJwbHVnaW5zIiwgImRyb3AiLCAiYXV0b1Njcm9sbCIsICJvblNwaWxsIiwgImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsICJnZXRXaW5kb3ciLCAiaXNFbGVtZW50IiwgImlzSFRNTEVsZW1lbnQiLCAiaXNTaGFkb3dSb290IiwgImdldE5vZGVTY3JvbGwiLCAiZ2V0Tm9kZU5hbWUiLCAiZ2V0RG9jdW1lbnRFbGVtZW50IiwgImdldFdpbmRvd1Njcm9sbEJhclgiLCAiZ2V0Q29tcHV0ZWRTdHlsZSIsICJnZXRQYXJlbnROb2RlIiwgImlzVGFibGVFbGVtZW50IiwgImdldFRydWVPZmZzZXRQYXJlbnQiLCAiZ2V0Q29udGFpbmluZ0Jsb2NrIiwgImNzcyIsICJnZXRPZmZzZXRQYXJlbnQiLCAic29ydCIsICJnZXRWaWV3cG9ydFJlY3QiLCAibWF4IiwgIm1pbiIsICJyb3VuZCIsICJnZXREb2N1bWVudFJlY3QiLCAiY29udGFpbnMiLCAicmVjdFRvQ2xpZW50UmVjdCIsICJnZXRJbm5lckJvdW5kaW5nQ2xpZW50UmVjdCIsICJnZXRDbGlwcGluZ1JlY3QiLCAiZ2V0TWFpbkF4aXNGcm9tUGxhY2VtZW50IiwgImRldGVjdE92ZXJmbG93IiwgIm9mZnNldDIiLCAiaW5kZXgiLCAiZGVzdHJveSIsICJvZmZzZXQiLCAiaGFzaCQxIiwgImdldE9wcG9zaXRlUGxhY2VtZW50IiwgImhhc2giLCAiZmxpcCIsICJ3aXRoaW4iLCAiYXJyb3ciLCAibWluMiIsICJtYXgyIiwgImdldFNpZGVPZmZzZXRzIiwgImlzQW55U2lkZUZ1bGx5Q2xpcHBlZCIsICJoaWRlIiwgImNsb25lIiwgInBsdWdpbnMiLCAib24iLCAibW91bnQiLCAiYnVpbGRDb25maWdGcm9tTW9kaWZpZXJzIiwgInNyY19kZWZhdWx0IiwgIm1vZHVsZV9kZWZhdWx0IiwgIm1vZHVsZV9kZWZhdWx0IiwgInNlZ21lbnRzIiwgIm51bWJlciIsICJtYXRjaGVzIiwgInZhbHVlIiwgInJlcGxhY2UiXQp9Cg==
