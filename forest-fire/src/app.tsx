import { useCallback, useEffect, useRef, useState } from "react";
import { produce } from "immer";
import { Randomizer } from "./Randomizer";
import { DynamicLineChart } from "./DynamicLineChart";
import { DisplayWind } from "./DisplayWind";
import "./app.css";

type CellState = "tree" | "burning" | "burnt" | "water";

const getGrid = (
  size: number
): Array<Array<{ type: CellState; iter: number }>> => {
  let grid = [];

  const riverPoints = [
    Randomizer.getRandom(size, true),
    Randomizer.getRandom(size / 10 + 10, true),
    Randomizer.getRandom(size, true),
    Randomizer.getRandom(size, true),
  ];

  const burntPoints = [
    Randomizer.getRandom(size, true),
    Randomizer.getRandom(size / 10 + 10, true),
    Randomizer.getRandom(size, true),
    Randomizer.getRandom(size, true),
  ];

  const states = [
    { type: "tree", iter: 0 } as const,
    { type: "water", iter: 0 } as const,
    { type: "burnt", iter: 0 } as const,
    { type: "burning", iter: 0 } as const,
  ];
  for (let x = 0; x < size; x++) {
    let row = [];
    for (let y = 0; y < size; y++) {
      row.push(states[0]);
    }
    grid.push(row);
  }

  const drawPath = (
    grid: Array<Array<{ type: CellState; iter: number }>>,
    points: number[],
    state: { type: CellState; iter: number },
    widthVariation: number
  ) => {
    let startX = points[0];
    let startY = points[1];
    let endX = points[2];
    let endY = points[3];

    let deltaX = endX - startX;
    let deltaY = endY - startY;
    let steps = Math.max(Math.abs(deltaX), Math.abs(deltaY));
    let xStep = deltaX / steps;
    let yStep = deltaY / steps;

    let baseWidth = 1;

    for (let i = 0; i <= steps; i++) {
      let x = Math.round(startX + i * xStep);
      let y = Math.round(startY + i * yStep);

      x += Math.round(Randomizer.getRandom(0.5, false));
      y += Math.round(Randomizer.getRandom(0.5, false));

      let currentWidth =
        baseWidth + Randomizer.getRandom(widthVariation, true) * widthVariation;

      for (let wx = -currentWidth; wx <= currentWidth; wx++) {
        for (let wy = -currentWidth; wy <= currentWidth; wy++) {
          let finalX = Math.max(0, Math.min(x + wx, grid.length - 1));
          let finalY = Math.max(0, Math.min(y + wy, grid[0].length - 1));

          if (grid[finalX]) {
            grid[finalX][finalY] = state;
          }
        }
      }
    }
  };

  drawPath(grid, burntPoints, states[2], -1);
  drawPath(grid, riverPoints, states[1], 1);
  let setStart = false;

  while (!setStart) {
    const startPosX = Randomizer.getRandom(size, true);
    const startPosY = Randomizer.getRandom(size, true);

    if (grid?.[startPosX]?.[startPosY]?.type === "tree") {
      grid[startPosX][startPosY] = states[3];
      setStart = true;
    }
  }
  return grid;
};

const wind = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [0, 0],
  [0, 1],
  [1, 1],
];

const neighbors = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

const getWindyNeighbours = (windIndex: number) => {
  if (windIndex) {
    const windDir = wind[windIndex];
    return neighbors.map(([x, y]) => [x + windDir[0], y + windDir[1]]);
  }
  return neighbors;
};

export function App() {
  const [size, setSize] = useState(50);
  const [seed, setSeed] = useState(Randomizer.getSeed());
  const [started, setStarted] = useState(false);
  const startedRef = useRef(false);
  const burnProbability = 0.5;
  const regrowthRate = 20;
  const [iteration, setIteration] = useState(0);
  const iterationRef = useRef(0);
  const burningTrees = useRef(0);
  const prevBurningTrees = useRef(0);
  const [grid, setGrid] = useState(getGrid(size));
  const [cleanGrid, setCleanGrid] = useState(grid);
  const sizeRef = useRef(size);
  const [windIndex, setWindIndex] = useState(6);
  const windIndexRef = useRef(6);
  const iterationSpeedRef = useRef(500);
  const [chartData, setChartData] = useState([
    {
      name: "1",
      "Burning Trees": burningTrees.current,
    },
  ]);

  const reset = () => {
    setStarted(false);
    startedRef.current = false;
    setIteration(0);
    iterationRef.current = 0;
    burningTrees.current = 0;
    prevBurningTrees.current = 0;
    setWindIndex(6);
    windIndexRef.current = 6;
    setGrid(cleanGrid);
    setChartData([
      {
        name: "1",
        "Burning Trees": burningTrees.current,
      },
    ]);
  };

  useEffect(() => {
    if (size) {
      const grid = getGrid(size);
      setGrid(grid);
      setCleanGrid(grid);
    }
  }, [size]);

  const run = useCallback(() => {
    if (
      !startedRef.current ||
      (iterationRef.current && !burningTrees.current)
    ) {
      return;
    }
    const windy = getWindyNeighbours(windIndexRef.current);

    setGrid((grid) => {
      return produce(grid, (gridCopy) => {
        burningTrees.current = burningTrees.current - prevBurningTrees.current;
        for (let x = 0; x < size; x++) {
          for (let y = 0; y < size; y++) {
            if (
              grid[x][y].type === "burnt" &&
              iterationRef.current - grid[x][y].iter === regrowthRate
            ) {
              gridCopy[x][y] = { type: "tree", iter: 0 };
            }
            windy.forEach(([i, j]) => {
              if (grid?.[x + i]?.[y + j]) {
                if (grid[x][y].type === "burning") {
                  gridCopy[x][y] = {
                    type: "burnt",
                    iter: iterationRef.current,
                  };
                }
                if (
                  grid[x + i][y + j].type === "burning" &&
                  grid[x][y].type !== "burnt" &&
                  grid[x][y].type !== "water" &&
                  grid[x][y].type !== "burning"
                ) {
                  if (Randomizer.getRandom(1, false) > burnProbability) {
                    if (gridCopy[x][y]?.type !== "burning") {
                      burningTrees.current += 1;
                    }
                    gridCopy[x][y] = { type: "burning", iter: 0 };
                  }
                }
              }
            });
          }
        }
      });
    });

    if (iterationRef.current % 10 === 0 && iterationRef.current) {
      setChartData((chartData) => [
        ...chartData,
        {
          name: `${iterationRef.current}`,
          "Burning Trees": burningTrees.current,
        },
      ]);
    }

    if (iterationRef.current % 5 === 0 && iterationRef.current) {
      const windIdx = Randomizer.getRandom(wind.length - 1);
      windIndexRef.current = windIdx;
      setWindIndex((_) => windIdx);
    }
    prevBurningTrees.current = burningTrees.current;
    iterationRef.current += 1;
    setIteration((iteration) => iteration + 1);
    setTimeout(run, iterationSpeedRef.current);
  }, [size]);

  return (
    <div className="main">
      <div className="navigation">
        <button
          onClick={() => {
            setSize(sizeRef.current);
            Randomizer.setSeed(seed);
            const grid = getGrid(size);
            setGrid(grid);
            setCleanGrid(grid);
          }}
        >
          Ustaw Seed
        </button>
        <input
          type="number"
          placeholder={`Seed: (random ${Randomizer.getSeed()})`}
          onChange={(ev) => {
            setSeed(+ev.currentTarget.value);
          }}
        ></input>
        <button
          onClick={() => {
            setStarted(!started);
            startedRef.current = !startedRef.current;
            if (!iterationRef.current) {
              Randomizer.reset();
            }
            run();
          }}
        >
          {started ? "Stop" : "Start"}
        </button>
        <input
          type="number"
          placeholder={`Rozmiar: (default ${size})`}
          max={100}
          min={5}
          value={size}
          onChange={(ev) => {
            if (+ev.currentTarget.value > 100) {
              sizeRef.current = 100;
              return;
            }
            if (+ev.currentTarget.value < 10) {
              sizeRef.current = 10;
              return;
            } else {
              sizeRef.current = +ev.currentTarget.value;
              return;
            }
          }}
        ></input>
        <button
          onClick={() => {
            setSize(sizeRef.current);
            reset();
          }}
        >
          Reset
        </button>
        {"Iteracja: "}
        {iteration}
        {" Burning: "}
        {burningTrees.current}
        <input
          type="range"
          max={1000}
          min={50}
          value={iterationSpeedRef.current}
          onChange={(ev) => {
            iterationSpeedRef.current = +ev.currentTarget.value;
          }}
        ></input>
        {`Czas iteracji (ms): ${iterationSpeedRef.current}`}
      </div>
      <div className="grid">
        {grid.map((row, idx) => (
          <div className="grid-row">
            {row.map((cell, idy) => (
              <div
                className={`grid-cell ${cell.type} ${idx}-${idy}`}
                style={{
                  "--size": `${Math.max(Math.floor(900 / size), 1)}px`,
                }}
              ></div>
            ))}
          </div>
        ))}
      </div>
      <div className="utils">
        <div className="chart">
          <DynamicLineChart data={chartData} />
        </div>
        <DisplayWind windDirection={wind[windIndex]} />
      </div>
    </div>
  );
}
