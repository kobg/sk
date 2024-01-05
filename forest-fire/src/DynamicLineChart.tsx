import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
} from "recharts";

type DynamicLineChartType = {
  data: {
    [x: number]: number;
  }[];
};

export const DynamicLineChart = ({ data }: DynamicLineChartType) => {
  return (
    <LineChart width={600} height={400} data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <CartesianGrid stroke="#eeeeee2c" strokeDasharray="5 5" />
      <Line type="monotone" dataKey="Burning Trees" stroke="#8884d8" />
      <Legend />
      <Tooltip />
    </LineChart>
  );
};
