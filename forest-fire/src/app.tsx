import { useCallback, useEffect, useRef, useState } from "react";
import { produce } from "immer";
import "./app.css";

type CellState = "tree" | "burning" | "burnt" | "water";

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

const getGrid = (
  size: number
): Array<Array<{ type: CellState; iter: number }>> => {
  let grid = [];

  const riverPoints = [
    getRandomInt(size),
    getRandomInt(size / 10 + 10),
    getRandomInt(size),
    getRandomInt(size),
  ];

  const burntPoints = [
    getRandomInt(size),
    getRandomInt(size / 10 + 10),
    getRandomInt(size),
    getRandomInt(size),
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

  const drawPath = (grid, points, state, widthVariation) => {
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

      x += Math.round(Math.random() - 0.5);
      y += Math.round(Math.random() - 0.5);

      let currentWidth = baseWidth + Math.floor(Math.random() * widthVariation);

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

  grid[getRandomInt(size)][getRandomInt(size)] = states[3];

  return grid;
};

const neighbors = [
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
  [-1, -1],
  [1, 0],
  [-1, 0],
];

export function App() {
  const [size, setSize] = useState(50);
  const [started, setStarted] = useState(false);
  const startedRef = useRef(false);
  const burnProbability = 0.5;
  const regrowthRate = 20;
  const [iteration, setIteration] = useState(0);
  const iterationRef = useRef(0);
  const burningTrees = useRef(1);
  const [grid, setGrid] = useState(getGrid(size));
  const sizeRef = useRef(size);

  useEffect(() => {
    if (size) {
      setGrid(getGrid(size));
    }
  }, [size]);

  console.log(burningTrees.current);

  const run = useCallback(() => {
    if (!startedRef.current || !burningTrees.current) {
      return;
    }

    setGrid((grid) => {
      return produce(grid, (gridCopy) => {
        for (let x = 0; x < size; x++) {
          for (let y = 0; y < size; y++) {
            if (
              grid[x][y].type === "burnt" &&
              iterationRef.current - grid[x][y].iter === regrowthRate
            ) {
              gridCopy[x][y] = { type: "tree", iter: 0 };
            }
            let isBurning = false;
            neighbors.forEach(([i, j]) => {
              if (grid?.[x + i]?.[y + j]) {
                if (grid[x][y].type === "burning") {
                  gridCopy[x][y] = {
                    type: "burnt",
                    iter: iterationRef.current,
                  };
                  burningTrees.current -= 1;
                  return;
                }
                if (
                  grid[x + i][y + j].type === "burning" &&
                  grid[x][y].type !== "burnt" &&
                  grid[x][y].type !== "water"
                ) {
                  if (Math.random() * 1 > burnProbability) {
                    gridCopy[x][y] = { type: "burning", iter: 0 };
                    burningTrees.current += 1;
                    isBurning = true;
                  }
                }
              }
            });
          }
        }
      });
    });
    iterationRef.current += 1;
    setIteration((iteration) => iteration + 1);
    setTimeout(run, 1000);
  }, [size]);

  return (
    <div>
      <button
        onClick={() => {
          setStarted(!started);
          startedRef.current = !startedRef.current;
          run();
        }}
      />
      <input
        type="number"
        placeholder={`Set size: (default ${size})`}
        onChange={(ev) => {
          sizeRef.current = +ev.currentTarget.value;
        }}
      >
        {size}
      </input>
      <button onClick={() => setSize(sizeRef.current)} />
      {iteration}
      <div className="grid">
        {grid.map((row) => (
          <div className="grid-row">
            {row.map((cell) => (
              <div
                className={`grid-cell ${cell.type}`}
                style={{
                  "--size": `${Math.max(Math.floor(900 / size), 1)}px`,
                }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
