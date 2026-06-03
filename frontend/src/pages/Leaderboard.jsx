import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import { useSelector } from "react-redux";
import axiosClient from "../utils/axiosClient";

function Leaderboard() {
  const { user } = useSelector((s) => s.auth);
  const [board, setBoard] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [boardRes, meRes] = await Promise.all([
          axiosClient.get("/leaderboard"),
          axiosClient.get("/leaderboard/me"),
        ]);
        setBoard(boardRes.data);
        setMe(meRes.data);
      } catch (err) {
        console.error("Failed to load leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-base-300">
      <nav className="navbar bg-base-100 shadow-lg px-4">
        <div className="flex-1">
          <NavLink to="/" className="text-3xl font-extrabold tracking-wide">
            <span className="text-white">Byte</span>
            <span className="text-primary">Code</span>
          </NavLink>
        </div>
        <NavLink to="/" className="btn btn-ghost btn-sm">← Problems</NavLink>
      </nav>

      <div className="container mx-auto p-4 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">🏆 Leaderboard</h1>

        {/* Personal rank card */}
        {me && (
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body flex-row items-center justify-between py-4">
              <div>
                <div className="text-sm text-gray-500">Your rank</div>
                <div className="text-2xl font-bold">
                  {me.rank ? `#${me.rank}` : "Unranked"}
                  <span className="text-sm font-normal text-gray-500"> / {me.total}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Score</div>
                <div className="text-2xl font-bold text-primary">{me.score}</div>
              </div>
              {me.percentile !== null && (
                <div className="text-right">
                  <div className="text-sm text-gray-500">Percentile</div>
                  <div className="text-2xl font-bold">Top {100 - me.percentile}%</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : board.length === 0 ? (
          <p className="text-gray-500">No ranked users yet. Solve a problem to get on the board!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th className="text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {board.map((row) => (
                  <tr
                    key={row.userId}
                    className={user && row.userId === user._id ? "bg-primary/10" : ""}
                  >
                    <td className="font-mono">
                      {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : `#${row.rank}`}
                    </td>
                    <td>{row.firstName}</td>
                    <td className="text-right font-bold">{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
