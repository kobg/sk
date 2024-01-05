export const DisplayWind = ({ windDirection }: { windDirection: number[] }) => {
  const wind = [
    [1, 1],
    [0, 1],
    [-1, 1],
    [1, 0],
    [0, 0],
    [-1, 0],
    [1, -1],
    [0, -1],
    [-1, -1],
  ];

  return (
    <div className="wind-grid">
      {`Kierunek wiatru: ${windDirection[0]} ${windDirection[1]}`}
      {wind.map((coords) => (
        <div
          className={`wind-cell${
            coords[0] === windDirection[0] && coords[1] === windDirection[1]
              ? "-active"
              : ""
          }`}
        ></div>
      ))}
    </div>
  );
};
